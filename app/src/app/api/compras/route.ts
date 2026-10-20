import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calcularItemCentavos,
  centavosComoDecimal,
  dataCompraUtc,
  sanitizarPedidoCompra,
  validarPedidoCompra,
} from "@/lib/compra";

type PedidoComItens = Prisma.PedidoCompraGetPayload<{
  include: { itens: { include: { produto: { select: { id: true; nome: true; unidadeMedida: true } } } } };
}>;

function serializarPedido(pedido: PedidoComItens) {
  return {
    id: pedido.id,
    fornecedor: pedido.fornecedor,
    dataPedido: pedido.dataPedido.toISOString().slice(0, 10),
    observacoes: pedido.observacoes,
    status: pedido.status,
    total: pedido.total.toFixed(2),
    dataRecebimento: pedido.dataRecebimento?.toISOString() ?? null,
    dataCancelamento: pedido.dataCancelamento?.toISOString() ?? null,
    criadoEm: pedido.criadoEm.toISOString(),
    itens: pedido.itens.map((item) => ({
      id: item.id,
      produtoId: item.produtoId,
      produtoNome: item.produto.nome,
      unidadeMedida: item.produto.unidadeMedida,
      quantidade: item.quantidade.toFixed(3),
      custoUnitario: item.custoUnitario.toFixed(2),
      total: item.total.toFixed(2),
      dataValidade: item.dataValidade?.toISOString().slice(0, 10) ?? null,
    })),
  };
}

const includePedido = {
  itens: { include: { produto: { select: { id: true, nome: true, unidadeMedida: true } } } },
} satisfies Prisma.PedidoCompraInclude;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    const pedidos = await prisma.pedidoCompra.findMany({
      orderBy: [{ dataPedido: "desc" }, { criadoEm: "desc" }],
      take: 200,
      include: includePedido,
    });
    return NextResponse.json({ pedidos: pedidos.map(serializarPedido) });
  } catch (error) {
    console.error("[GET /api/compras] Falha ao consultar pedidos.", error);
    return NextResponse.json({ erro: "Não foi possível carregar os pedidos de compra." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    let corpo: unknown;
    try {
      corpo = await request.json();
    } catch {
      return NextResponse.json({ erro: "Envie um JSON válido." }, { status: 400 });
    }

    const erros = validarPedidoCompra(corpo);
    if (erros.length) return NextResponse.json({ erros }, { status: 422 });
    const dados = sanitizarPedidoCompra(corpo);
    const idsProdutos = [...new Set(dados.itens.map((item) => item.produtoId))];

    const pedido = await prisma.$transaction(async (tx) => {
      const produtosAtivos = await tx.produto.findMany({
        where: { id: { in: idsProdutos }, ativo: true },
        select: { id: true },
      });
      if (produtosAtivos.length !== idsProdutos.length) {
        throw new Error("PRODUTO_INATIVO_OU_INEXISTENTE");
      }

      const itens = dados.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: new Prisma.Decimal(item.quantidade),
        custoUnitario: new Prisma.Decimal(item.custoUnitario),
        total: new Prisma.Decimal(centavosComoDecimal(calcularItemCentavos(item.quantidade, item.custoUnitario))),
      }));
      const totalCentavos = dados.itens.reduce(
        (soma, item) => soma + calcularItemCentavos(item.quantidade, item.custoUnitario),
        BigInt(0)
      );

      return tx.pedidoCompra.create({
        data: {
          fornecedor: dados.fornecedor,
          dataPedido: dataCompraUtc(dados.dataPedido),
          observacoes: dados.observacoes,
          total: new Prisma.Decimal(centavosComoDecimal(totalCentavos)),
          itens: { create: itens },
        },
        include: includePedido,
      });
    });

    return NextResponse.json({ pedido: serializarPedido(pedido) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUTO_INATIVO_OU_INEXISTENTE") {
      return NextResponse.json({ erro: "Um ou mais produtos não existem ou estão inativos." }, { status: 422 });
    }
    console.error("[POST /api/compras] Falha ao criar pedido.", error);
    return NextResponse.json({ erro: "Não foi possível criar o pedido de compra." }, { status: 500 });
  }
}
