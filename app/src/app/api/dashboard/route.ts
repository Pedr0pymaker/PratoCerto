import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularAlertasEstoque } from "@/lib/alertas-estoque";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const [produtos, perdasResumo, entradasRecentes, perdasRecentes] = await Promise.all([
      prisma.produto.findMany({
        where: { ativo: true },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          categoria: true,
          unidadeMedida: true,
          ativo: true,
          estoqueMinimo: true,
          lotes: {
            select: { id: true, quantidadeAtual: true, dataValidade: true },
          },
        },
      }),
      prisma.perda.aggregate({
        _count: { _all: true },
        _sum: { custoEstimado: true },
      }),
      prisma.loteEstoque.findMany({
        orderBy: [{ dataEntrada: "desc" }, { id: "desc" }],
        take: 8,
        select: {
          id: true,
          produtoId: true,
          quantidadeInicial: true,
          dataEntrada: true,
          produto: { select: { nome: true, unidadeMedida: true } },
        },
      }),
      prisma.perda.findMany({
        orderBy: [{ dataHora: "desc" }, { id: "desc" }],
        take: 8,
        select: {
          id: true,
          produtoId: true,
          quantidade: true,
          motivo: true,
          dataHora: true,
          produto: { select: { nome: true, unidadeMedida: true } },
        },
      }),
    ]);

    const alertas = calcularAlertasEstoque(
      produtos.map((produto) => ({
        ...produto,
        estoqueMinimo: produto.estoqueMinimo.toFixed(3),
        lotes: produto.lotes.map((lote) => ({
          ...lote,
          quantidadeAtual: lote.quantidadeAtual.toFixed(3),
        })),
      }))
    );

    const movimentacoes = [
      ...entradasRecentes.map((entrada) => ({
        id: `entrada-${entrada.id}`,
        tipo: "ENTRADA" as const,
        produtoId: entrada.produtoId,
        produtoNome: entrada.produto.nome,
        unidadeMedida: entrada.produto.unidadeMedida,
        quantidade: Number(entrada.quantidadeInicial),
        dataHora: entrada.dataEntrada.toISOString(),
        descricao: "Entrada de estoque",
        href: "/estoque",
      })),
      ...perdasRecentes.map((perda) => ({
        id: `perda-${perda.id}`,
        tipo: "PERDA" as const,
        produtoId: perda.produtoId,
        produtoNome: perda.produto.nome,
        unidadeMedida: perda.produto.unidadeMedida,
        quantidade: Number(perda.quantidade),
        dataHora: perda.dataHora.toISOString(),
        descricao: `Perda · ${perda.motivo}`,
        href: "/perdas",
      })),
    ].sort((a, b) => b.dataHora.localeCompare(a.dataHora) || b.id.localeCompare(a.id)).slice(0, 8);

    return NextResponse.json({
      resumo: {
        produtosAtivos: produtos.length,
        estoqueBaixo: alertas.resumo.estoqueBaixo,
        lotesVencidos: alertas.resumo.vencidos,
        lotesVencemEm7Dias: alertas.resumo.vencemEm7Dias,
        totalPerdas: perdasResumo._count._all,
        custoEstimadoPerdas: Number(perdasResumo._sum.custoEstimado ?? 0),
      },
      alertas: {
        estoqueBaixo: alertas.estoqueBaixo.slice(0, 5),
        vencidos: alertas.vencidos.slice(0, 5),
        proximosDoVencimento: alertas.proximosDoVencimento.slice(0, 5),
      },
      movimentacoes,
    });
  } catch (error) {
    console.error("[GET /api/dashboard] Falha ao carregar dados.", error);
    return NextResponse.json(
      { erro: "Não foi possível carregar os dados do Dashboard." },
      { status: 500 }
    );
  }
}
