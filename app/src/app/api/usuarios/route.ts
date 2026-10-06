/**
 * PratoCerto — API Route: /api/usuarios
 *
 * GET  /api/usuarios  → Lista todos os usuários (apenas GERENTE)
 * POST /api/usuarios  → Cria novo usuário com hash seguro (apenas GERENTE)
 *
 * Segurança:
 * - Apenas usuários com perfil GERENTE podem acessar
 * - Senha armazenada exclusivamente via hash bcrypt (custo 12)
 * - Hash de senha NUNCA é retornado nas respostas
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashSenha, validarPerfil } from "@/lib/auth";
import { validarNovoUsuario } from "@/lib/validations/usuario";

// -------------------------------------------------------------
// GET /api/usuarios
// -------------------------------------------------------------
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    if (session.perfil !== "GERENTE") {
      return NextResponse.json(
        { erro: "Acesso negado. Apenas o perfil GERENTE pode gerenciar usuários." },
        { status: 403 }
      );
    }

    const usuarios = await prisma.usuario.findMany({
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        // senhaHash NUNCA é selecionado
      },
    });

    // Garante que o perfil retornado é sempre um valor válido
    const payload = usuarios.map((u) => ({
      ...u,
      perfil: validarPerfil(u.perfil),
    }));

    return NextResponse.json({ usuarios: payload });
  } catch (error) {
    console.error("[GET /api/usuarios]", error);
    return NextResponse.json(
      { erro: "Não foi possível carregar os usuários." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// POST /api/usuarios
// -------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    if (session.perfil !== "GERENTE") {
      return NextResponse.json(
        { erro: "Acesso negado. Apenas o perfil GERENTE pode cadastrar usuários." },
        { status: 403 }
      );
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

    const erros = validarNovoUsuario(body);
    if (erros.length > 0) {
      return NextResponse.json({ erros }, { status: 422 });
    }

    const { nome, email, senha, perfil } = body as {
      nome: string;
      email: string;
      senha: string;
      perfil: string;
    };

    const emailNormalizado = email.trim().toLowerCase();
    const perfilValidado = validarPerfil(perfil);

    // Verifica duplicidade de email
    const emailExistente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (emailExistente) {
      return NextResponse.json(
        {
          erros: [
            {
              campo: "email",
              mensagem: "Já existe um usuário cadastrado com este email.",
            },
          ],
        },
        { status: 422 }
      );
    }

    // Gera hash seguro da senha — NUNCA armazenamos em texto puro
    const senhaHash = await hashSenha(senha);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        senhaHash,
        perfil: perfilValidado,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
      },
    });

    return NextResponse.json(
      {
        mensagem: "Usuário cadastrado com sucesso.",
        usuario: {
          ...novoUsuario,
          perfil: validarPerfil(novoUsuario.perfil),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/usuarios]", error);
    return NextResponse.json(
      { erro: "Erro ao cadastrar usuário." },
      { status: 500 }
    );
  }
}
