-- =============================================================
-- PratoCerto — Migration 001: Criação da tabela de produtos
-- =============================================================
-- Esta migration cria a estrutura inicial do banco de dados.
-- Execute via: npx prisma migrate dev --name init
-- Ou aplique este SQL diretamente no PostgreSQL.
-- =============================================================

-- Tabela: produtos
-- Representa cada produto/item controlado no estoque.
-- O estoque atual NÃO é armazenado aqui (será derivado
-- dos lotes de estoque — arquitetura FIFO).
-- =============================================================

CREATE TABLE IF NOT EXISTS "produtos" (
    "id"               TEXT        NOT NULL,
    "nome"             VARCHAR(200) NOT NULL,
    "categoria"        VARCHAR(100) NOT NULL,
    "unidadeMedida"    VARCHAR(50)  NOT NULL,
    "estoqueMinimo"    DECIMAL(10,3) NOT NULL,
    "estoqueIdeal"     DECIMAL(10,3) NOT NULL,
    "custoReferencia"  DECIMAL(10,2),
    "ativo"            BOOLEAN      NOT NULL DEFAULT true,
    "criadoEm"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "atualizadoEm"    TIMESTAMPTZ  NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- Índices para filtros comuns
CREATE INDEX IF NOT EXISTS "produtos_ativo_idx"     ON "produtos"("ativo");
CREATE INDEX IF NOT EXISTS "produtos_categoria_idx" ON "produtos"("categoria");
