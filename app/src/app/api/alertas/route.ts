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

    const produtos = await prisma.produto.findMany({
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
    });

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

    return NextResponse.json(alertas);
  } catch (error) {
    console.error("[GET /api/alertas] Falha ao consultar alertas.", error);
    return NextResponse.json(
      { erro: "Não foi possível carregar os alertas de estoque." },
      { status: 500 }
    );
  }
}
