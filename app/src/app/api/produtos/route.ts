/**
 * PratoCerto — API Route: /api/produtos
 *
 * GET  /api/produtos       → Lista todos os produtos ativos
 * POST /api/produtos       → Cadastra um novo produto
 *
 * Segurança:
 * - Dados validados no servidor (nunca confiar apenas no cliente)
 * - Consultas via Prisma ORM (parametrizadas — sem SQL injection)
 * - Credenciais somente via variáveis de ambiente
 * - Erros não expõem detalhes internos ao cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validarProduto, sanitizarProduto } from "@/lib/validations/produto";

// ---------------------------------------------------------------
// GET /api/produtos
// Retorna todos os produtos ativos ordenados por nome.
// ---------------------------------------------------------------
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        categoria: true,
        unidadeMedida: true,
        estoqueMinimo: true,
        estoqueIdeal: true,
        custoReferencia: true,
        criadoEm: true,
      },
    });

    // Decimal do Prisma precisa ser convertido para number no JSON
    const payload = produtos.map((p) => ({
      ...p,
      estoqueMinimo: Number(p.estoqueMinimo),
      estoqueIdeal: Number(p.estoqueIdeal),
      custoReferencia: p.custoReferencia ? Number(p.custoReferencia) : null,
    }));

    return NextResponse.json({ produtos: payload });
  } catch (error) {
    console.error("[GET /api/produtos]", error);
    return NextResponse.json(
      { erro: "Não foi possível consultar os produtos. Verifique a conexão com o banco de dados." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------
// POST /api/produtos
// Cria um novo produto após validação server-side.
// ---------------------------------------------------------------
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

    // Validação server-side
    const erros = validarProduto(body);
    if (erros.length > 0) {
      return NextResponse.json({ erros }, { status: 422 });
    }

    // Sanitização após validação
    const dados = sanitizarProduto(body as Record<string, unknown>);

    // Persistência via ORM (consultas parametrizadas)
    const produto = await prisma.produto.create({
      data: {
        nome: dados.nome,
        categoria: dados.categoria,
        unidadeMedida: dados.unidadeMedida,
        estoqueMinimo: dados.estoqueMinimo,
        estoqueIdeal: dados.estoqueIdeal,
        custoReferencia: dados.custoReferencia ?? null,
      },
      select: {
        id: true,
        nome: true,
        categoria: true,
        unidadeMedida: true,
        estoqueMinimo: true,
        estoqueIdeal: true,
        custoReferencia: true,
        criadoEm: true,
      },
    });

    return NextResponse.json(
      {
        mensagem: "Produto cadastrado com sucesso.",
        produto: {
          ...produto,
          estoqueMinimo: Number(produto.estoqueMinimo),
          estoqueIdeal: Number(produto.estoqueIdeal),
          custoReferencia: produto.custoReferencia ? Number(produto.custoReferencia) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/produtos]", error);
    return NextResponse.json(
      { erro: "Não foi possível salvar o produto. Tente novamente." },
      { status: 500 }
    );
  }
}
