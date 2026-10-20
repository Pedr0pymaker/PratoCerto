/**
 * PratoCerto — API Route: /api/perdas
 *
 * GET  /api/perdas → Lista histórico de perdas com filtros opcionais
 * POST /api/perdas → Registra uma perda com baixa FIFO nos lotes
 *
 * Segurança & Regras:
 * - Autenticação obrigatória via sessão HTTP-only (GERENTE e FUNCIONARIO)
 * - Validação server-side estrita (quantidade > 0, motivo válido)
 * - Baixa FIFO nos lotes dentro de transação atômica ($transaction)
 * - Custo estimado calculado a partir do custo unitário dos lotes efetivamente baixados
 * - Rejeita operação se estoque insuficiente
 * - Consultas parametrizadas via Prisma ORM
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { validarPerda, sanitizarPerda, MOTIVOS_PERDA } from "@/lib/validations/perda";

// -------------------------------------------------------------------
// GET /api/perdas
// Lista perdas com filtros opcionais por motivo e intervalo de datas
// -------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const motivo = searchParams.get("motivo");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    // Monta o filtro dinâmico
    const where: Prisma.PerdaWhereInput = {};

    if (motivo && MOTIVOS_PERDA.includes(motivo as (typeof MOTIVOS_PERDA)[number])) {
      where.motivo = motivo;
    }

    if (dataInicio || dataFim) {
      where.dataHora = {};
      if (dataInicio) {
        const d = new Date(dataInicio);
        if (!isNaN(d.getTime())) {
          where.dataHora.gte = d;
        }
      }
      if (dataFim) {
        // Inclui o dia inteiro do dataFim
        const d = new Date(dataFim);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          where.dataHora.lte = d;
        }
      }
    }

    const perdas = await prisma.perda.findMany({
      where,
      orderBy: { dataHora: "desc" },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            unidadeMedida: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const resultado = perdas.map((p) => ({
      id: p.id,
      produtoId: p.produtoId,
      produtoNome: p.produto.nome,
      produtoCategoria: p.produto.categoria,
      produtoUnidade: p.produto.unidadeMedida,
      usuarioId: p.usuarioId,
      usuarioNome: p.usuario.nome,
      quantidade: Number(p.quantidade),
      motivo: p.motivo,
      custoEstimado: Number(p.custoEstimado),
      observacao: p.observacao,
      dataHora: p.dataHora.toISOString(),
    }));

    return NextResponse.json({ perdas: resultado });
  } catch (error) {
    console.error("[GET /api/perdas]", error);
    return NextResponse.json(
      { erro: "Não foi possível carregar o histórico de perdas." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------
// POST /api/perdas
// Registra uma perda e desconta lotes via FIFO em transação atômica
// -------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { erro: "Corpo da requisição inválido. Envie um JSON válido." },
        { status: 400 }
      );
    }

    // Validação server-side
    const erros = validarPerda(body);
    if (erros.length > 0) {
      return NextResponse.json({ erros }, { status: 422 });
    }

    const dados = sanitizarPerda(body as Record<string, unknown>);

    // Tudo em transação atômica: verifica produto, calcula FIFO, desconta lotes e cria perda
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verifica existência e atividade do produto
      const produto = await tx.produto.findUnique({
        where: { id: dados.produtoId },
      });

      if (!produto || !produto.ativo) {
        throw new TransactionError(
          "Produto não encontrado ou inativo.",
          404
        );
      }

      // 2. Busca lotes com saldo > 0 ordenados por data de entrada (FIFO)
      const lotes = await tx.loteEstoque.findMany({
        where: {
          produtoId: dados.produtoId,
          quantidadeAtual: { gt: 0 },
        },
        orderBy: { dataEntrada: "asc" },
      });

      // 3. Calcula saldo total disponível usando Prisma.Decimal
      const saldoTotal = lotes.reduce(
        (acc, lote) => acc.plus(lote.quantidadeAtual),
        new Prisma.Decimal(0)
      );

      const quantidadePerda = new Prisma.Decimal(dados.quantidade);

      if (saldoTotal.lessThan(quantidadePerda)) {
        throw new TransactionError(
          `Estoque insuficiente. Saldo disponível: ${saldoTotal.toNumber()} ${produto.unidadeMedida}. Quantidade solicitada: ${dados.quantidade}.`,
          422
        );
      }

      // 4. Baixa FIFO: desconta dos lotes mais antigos primeiro
      let restante = new Prisma.Decimal(dados.quantidade);
      let custoEstimado = new Prisma.Decimal(0);

      for (const lote of lotes) {
        if (restante.lessThanOrEqualTo(0)) break;

        const disponivel = new Prisma.Decimal(lote.quantidadeAtual);
        const descontar = disponivel.lessThanOrEqualTo(restante) ? disponivel : restante;

        // Calcula custo proporcional deste lote
        const custoUnitarioLote = lote.custoUnitario !== null && lote.custoUnitario !== undefined
          ? new Prisma.Decimal(lote.custoUnitario)
          : new Prisma.Decimal(0);
        custoEstimado = custoEstimado.plus(descontar.times(custoUnitarioLote));

        // Atualiza o lote no banco
        const novaQuantidade = disponivel.minus(descontar);
        await tx.loteEstoque.update({
          where: { id: lote.id },
          data: { quantidadeAtual: novaQuantidade },
        });

        restante = restante.minus(descontar);
      }

      // 5. Cria o registro de perda
      const perda = await tx.perda.create({
        data: {
          produtoId: dados.produtoId,
          usuarioId: session.id,
          quantidade: dados.quantidade,
          motivo: dados.motivo,
          custoEstimado: custoEstimado.toDecimalPlaces(2),
          observacao: dados.observacao,
        },
        include: {
          produto: {
            select: {
              nome: true,
              unidadeMedida: true,
            },
          },
          usuario: {
            select: {
              nome: true,
            },
          },
        },
      });

      // 6. Calcula saldo atualizado
      const lotesAtualizados = await tx.loteEstoque.findMany({
        where: { produtoId: dados.produtoId },
        select: { quantidadeAtual: true },
      });

      const novoSaldo = lotesAtualizados.reduce(
        (acc, l) => acc.plus(l.quantidadeAtual),
        new Prisma.Decimal(0)
      );

      return { perda, novoSaldo };
    });

    return NextResponse.json(
      {
        mensagem: "Perda registrada com sucesso.",
        perda: {
          id: resultado.perda.id,
          produtoId: resultado.perda.produtoId,
          produtoNome: resultado.perda.produto.nome,
          usuarioNome: resultado.perda.usuario.nome,
          quantidade: Number(resultado.perda.quantidade),
          motivo: resultado.perda.motivo,
          custoEstimado: Number(resultado.perda.custoEstimado),
          observacao: resultado.perda.observacao,
          dataHora: resultado.perda.dataHora.toISOString(),
        },
        saldoDisponivel: resultado.novoSaldo.toNumber(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof TransactionError) {
      return NextResponse.json(
        { erro: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[POST /api/perdas]", error);
    return NextResponse.json(
      { erro: "Não foi possível registrar a perda. Tente novamente." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------
// Classe auxiliar para erros de negócio dentro da transação
// -------------------------------------------------------------------
class TransactionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TransactionError";
  }
}
