import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dataCompraUtc, validarRecebimentoPedido, validarTransicaoPedido } from "@/lib/compra";

interface ContextoRota {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: ContextoRota) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const { id } = await params;

    let corpo: unknown;
    try {
      corpo = await request.json();
    } catch {
      return NextResponse.json({ erro: "Envie um JSON válido." }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedidoCompra.findUnique({
        where: { id },
        include: { itens: { select: { id: true, produtoId: true, quantidade: true, custoUnitario: true } } },
      });
      if (!pedido) throw new Error("PEDIDO_NAO_ENCONTRADO");
      if (!validarTransicaoPedido(pedido.status, "RECEBIDO")) throw new Error("PEDIDO_NAO_PENDENTE");

      const erros = validarRecebimentoPedido(corpo, pedido.itens.map((item) => item.id));
      if (erros.length) throw new Error(`RECEBIMENTO_INVALIDO:${erros.map((erro) => erro.mensagem).join(" ")}`);

      const dados = corpo as {
        dataEntrada: string;
        itens: { itemId: string; dataValidade: string | null }[];
      };
      const transicao = await tx.pedidoCompra.updateMany({
        where: { id, status: "PENDENTE" },
        data: { status: "RECEBIDO", dataRecebimento: dataCompraUtc(dados.dataEntrada) },
      });
      if (transicao.count !== 1) throw new Error("PEDIDO_NAO_PENDENTE");

      const idsProdutos = [...new Set(pedido.itens.map((item) => item.produtoId))];
      const produtosAtivos = await tx.produto.findMany({
        where: { id: { in: idsProdutos }, ativo: true },
        select: { id: true },
      });
      if (produtosAtivos.length !== idsProdutos.length) throw new Error("PRODUTO_INATIVO_OU_INEXISTENTE");

      const validadePorItem = new Map(dados.itens.map((item) => [item.itemId, item.dataValidade]));
      await tx.loteEstoque.createMany({
        data: pedido.itens.map((item) => {
          const validade = validadePorItem.get(item.id);
          return {
            produtoId: item.produtoId,
            quantidadeInicial: item.quantidade,
            quantidadeAtual: item.quantidade,
            dataEntrada: dataCompraUtc(dados.dataEntrada),
            dataValidade: validade ? dataCompraUtc(validade) : null,
            custoUnitario: item.custoUnitario,
          };
        }),
      });
      await Promise.all(pedido.itens.map((item) => tx.itemPedidoCompra.update({
        where: { id: item.id },
        data: { dataValidade: validadePorItem.get(item.id) ? dataCompraUtc(validadePorItem.get(item.id)!) : null },
      })));

      return { pedidoId: pedido.id, lotesCriados: pedido.itens.length };
    });

    return NextResponse.json({ mensagem: "Pedido recebido e lotes registrados.", ...resultado });
  } catch (error) {
    if (error instanceof Error && error.message === "PEDIDO_NAO_ENCONTRADO") {
      return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "PEDIDO_NAO_PENDENTE") {
      return NextResponse.json({ erro: "Somente pedidos pendentes podem ser recebidos." }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith("RECEBIMENTO_INVALIDO:")) {
      return NextResponse.json({ erro: error.message.slice("RECEBIMENTO_INVALIDO:".length) }, { status: 422 });
    }
    if (error instanceof Error && error.message === "PRODUTO_INATIVO_OU_INEXISTENTE") {
      return NextResponse.json({ erro: "Um ou mais produtos do pedido não existem ou estão inativos." }, { status: 422 });
    }
    console.error("[POST /api/compras/:id/receber] Falha ao receber pedido.", error);
    return NextResponse.json({ erro: "Não foi possível receber o pedido." }, { status: 500 });
  }
}
