/**
 * PratoCerto — API Route: /api/auth/login
 *
 * Autentica o usuário com email e senha, define cookie HTTP-only com token JWT.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verificarSenha,
  criarTokenSessao,
  SESSION_COOKIE_NAME,
  validarPerfil,
} from "@/lib/auth";
import { validarLogin } from "@/lib/validations/usuario";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { erro: "Corpo da requisição inválido. Envie um JSON válido." },
        { status: 400 }
      );
    }

    const erros = validarLogin(body);
    if (erros.length > 0) {
      return NextResponse.json({ erros }, { status: 422 });
    }

    const { email, senha } = body as { email: string; senha: string };
    const emailNormalizado = email.trim().toLowerCase();

    // Busca o usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    // Se o usuário não existir ou estiver inativo — resposta genérica (não revela qual falhou)
    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { erro: "Email ou senha incorretos." },
        { status: 401 }
      );
    }

    // Verifica a senha com bcrypt
    const senhaCorreta = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      return NextResponse.json(
        { erro: "Email ou senha incorretos." },
        { status: 401 }
      );
    }

    // Garante que o perfil é válido (MySQL retorna string)
    const perfil = validarPerfil(usuario.perfil);

    // Cria o token JWT seguro
    const token = await criarTokenSessao({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil,
    });

    const response = NextResponse.json({
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil,
      },
    });

    // Configura o cookie seguro HTTP-Only
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { erro: "Ocorreu um erro ao processar o login. Tente novamente." },
      { status: 500 }
    );
  }
}
