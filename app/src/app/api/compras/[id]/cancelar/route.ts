import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validarTransicaoPedido } from "@/lib/compra";

interface ContextoRota {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: ContextoRota) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const { id } = await params;
    const pedido = await prisma.pedidoCompra.findUnique({ where: { id }, select: { status: true } });
    if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    if (!validarTransicaoPedido(pedido.status, "CANCELADO")) {
      return NextResponse.json({ erro: "Somente pedidos pendentes podem ser cancelados." }, { status: 409 });
    }
    const transicao = await prisma.pedidoCompra.updateMany({
      where: { id, status: "PENDENTE" },
      data: { status: "CANCELADO", dataCancelamento: new Date() },
    });
    if (transicao.count === 0) {
      return NextResponse.json({ erro: "Somente pedidos pendentes podem ser cancelados." }, { status: 409 });
    }
    return NextResponse.json({ mensagem: "Pedido cancelado." });
  } catch (error) {
    console.error("[POST /api/compras/:id/cancelar] Falha ao cancelar pedido.", error);
    return NextResponse.json({ erro: "Não foi possível cancelar o pedido." }, { status: 500 });
  }
}
