/**
 * PratoCerto — API Route: /api/estoque
 *
 * GET  /api/estoque → Lista produtos com lotes e saldo disponível calculado
 * POST /api/estoque → Registra uma nova entrada de mercadoria (cria lote)
 *
 * Segurança & Regras:
 * - Autenticação obrigatória via sessão HTTP-only (GERENTE e FUNCIONARIO)
 * - Saldo é calculado dinamicamente pela soma de quantidadeAtual dos lotes via Prisma.Decimal (evita descompasso e erros de ponto flutuante)
 * - Preserva valores numéricos zero para custos usando checagens explícitas de null e undefined
 * - Validação server-side estrita (quantidade > 0, datas válidas, custo >= 0)
 * - Verificação de existência do produto antes de registrar o lote
 * - Consultas parametrizadas via Prisma ORM
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { validarEntradaEstoque, sanitizarEntradaEstoque } from "@/lib/validations/lote";

// -------------------------------------------------------------------
// GET /api/estoque
// Retorna os produtos com seus lotes e saldo disponível calculado
// -------------------------------------------------------------------
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        lotes: {
          orderBy: [
            { dataValidade: "asc" },
            { dataEntrada: "asc" },
          ],
        },
      },
    });

    const resultado = produtos.map((p) => {
      const lotesFormatados = p.lotes.map((lote) => ({
        id: lote.id,
        produtoId: lote.produtoId,
        quantidadeInicial: Number(lote.quantidadeInicial),
        quantidadeAtual: Number(lote.quantidadeAtual),
        dataEntrada: lote.dataEntrada.toISOString(),
        dataValidade: lote.dataValidade ? lote.dataValidade.toISOString() : null,
        custoUnitario:
          lote.custoUnitario !== null && lote.custoUnitario !== undefined
            ? Number(lote.custoUnitario)
            : null,
        criadoEm: lote.criadoEm.toISOString(),
      }));

      // Saldo calculado = soma exata das quantidades atuais dos lotes usando Prisma.Decimal
      const saldoDecimal = p.lotes.reduce(
        (acumulador, lote) => acumulador.plus(lote.quantidadeAtual),
        new Prisma.Decimal(0)
      );

      const estoqueMinimoDecimal = new Prisma.Decimal(p.estoqueMinimo);
      const situacao = saldoDecimal.lessThan(estoqueMinimoDecimal) ? "ABAIXO_MINIMO" : "NORMAL";

      return {
        id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        unidadeMedida: p.unidadeMedida,
        estoqueMinimo: Number(p.estoqueMinimo),
        estoqueIdeal: Number(p.estoqueIdeal),
        custoReferencia:
          p.custoReferencia !== null && p.custoReferencia !== undefined
            ? Number(p.custoReferencia)
            : null,
        saldoDisponivel: saldoDecimal.toNumber(),
        situacao,
        lotes: lotesFormatados,
      };
    });

    return NextResponse.json({ produtos: resultado });
  } catch (error) {
    console.error("[GET /api/estoque]", error);
    return NextResponse.json(
      { erro: "Não foi possível carregar as informações de estoque." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------
// POST /api/estoque
// Registra uma nova entrada de estoque criando um lote
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
    const erros = validarEntradaEstoque(body);
    if (erros.length > 0) {
      return NextResponse.json({ erros }, { status: 422 });
    }

    const dados = sanitizarEntradaEstoque(body as Record<string, unknown>);

    // Verifica existência do produto no banco
    const produto = await prisma.produto.findUnique({
      where: { id: dados.produtoId },
      include: { lotes: true },
    });

    if (!produto || !produto.ativo) {
      return NextResponse.json(
        { erro: "Produto não encontrado ou inativo." },
        { status: 404 }
      );
    }

    // Registra o lote de estoque no banco com integridade
    const novoLote = await prisma.loteEstoque.create({
      data: {
        produtoId: dados.produtoId,
        quantidadeInicial: dados.quantidade,
        quantidadeAtual: dados.quantidade,
        dataEntrada: dados.dataEntrada,
        dataValidade: dados.dataValidade,
        custoUnitario: dados.custoUnitario,
      },
    });

    // Calcula saldo atualizado após a inserção usando Prisma.Decimal para precisão exata
    const todosLotes = await prisma.loteEstoque.findMany({
      where: { produtoId: dados.produtoId },
      select: { quantidadeAtual: true },
    });

    const novoSaldoDecimal = todosLotes.reduce(
      (acc, l) => acc.plus(l.quantidadeAtual),
      new Prisma.Decimal(0)
    );

    return NextResponse.json(
      {
        mensagem: "Entrada de estoque registrada com sucesso.",
        lote: {
          id: novoLote.id,
          produtoId: novoLote.produtoId,
          quantidadeInicial: Number(novoLote.quantidadeInicial),
          quantidadeAtual: Number(novoLote.quantidadeAtual),
          dataEntrada: novoLote.dataEntrada.toISOString(),
          dataValidade: novoLote.dataValidade ? novoLote.dataValidade.toISOString() : null,
          custoUnitario:
            novoLote.custoUnitario !== null && novoLote.custoUnitario !== undefined
              ? Number(novoLote.custoUnitario)
              : null,
          criadoEm: novoLote.criadoEm.toISOString(),
        },
        saldoDisponivel: novoSaldoDecimal.toNumber(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/estoque]", error);
    return NextResponse.json(
      { erro: "Não foi possível registrar a entrada de estoque. Tente novamente." },
      { status: 500 }
    );
  }
}
