/**
 * PratoCerto — API Route: /api/auth/me
 *
 * Retorna os dados do usuário autenticado atual.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ autenticado: false, usuario: null }, { status: 401 });
  }

  return NextResponse.json({
    autenticado: true,
    usuario: session,
  });
}
