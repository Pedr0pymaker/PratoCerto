/**
 * PratoCerto — Middleware de Autenticação e Controle de Acesso
 *
 * Protege rotas do painel e controla permissões por perfil:
 * - Redireciona usuários não autenticados para /login
 * - Redireciona usuários já logados que acessem /login para /dashboard
 * - Bloqueia FUNCIONARIO de acessar /usuarios (redireciona para /dashboard)
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "pratocerto_session";

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "pratocerto-secret-key-development-minimum-32-chars-long";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora arquivos estáticos, _next, favicon e imagens
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Token do cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let sessionPayload: { id?: string; perfil?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getAuthSecret());
      sessionPayload = payload as { id?: string; perfil?: string };
    } catch {
      sessionPayload = null;
    }
  }

  const estaAutenticado = Boolean(sessionPayload?.id);

  // 1. Rota de login
  if (pathname === "/login") {
    if (estaAutenticado) {
      // Usuário já está logado, redireciona para o dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. Rotas públicas da API de autenticação
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) {
    return NextResponse.next();
  }

  // 3. Raiz "/"
  if (pathname === "/") {
    if (estaAutenticado) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Todas as rotas do painel requerem autenticação
  const rotasProtegidas = [
    "/dashboard",
    "/estoque",
    "/usuarios",
    "/perdas",
    "/compras",
    "/receitas",
    "/relatorios",
    "/ia",
    "/configuracoes",
  ];

  const ehRotaProtegida = rotasProtegidas.some((r) => pathname.startsWith(r));

  if (ehRotaProtegida && !estaAutenticado) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Controle de perfil: /usuarios é exclusivo do GERENTE
  if (pathname.startsWith("/usuarios")) {
    if (sessionPayload?.perfil !== "GERENTE") {
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("aviso", "acesso_negado");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
