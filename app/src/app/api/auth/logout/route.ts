/**
 * PratoCerto — API Route: /api/auth/logout
 *
 * Encerra a sessão removendo o cookie HTTP-only.
 */

import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ mensagem: "Logout realizado com sucesso." });

  // Remove o cookie definindo maxAge: 0
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
