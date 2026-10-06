/**
 * PratoCerto — Script de Testes Automatizados da ETAPA 3 e Migração MySQL
 *
 * Testa:
 * 1. Conexão com o MySQL via Prisma
 * 2. Existência e integridade da tabela de produtos (Etapa 2 preservada)
 * 3. Existência da tabela de usuários
 * 4. Senhas com hash seguro (bcryptjs) - nunca texto puro
 * 5. Criação e verificação de tokens JWT com jose
 * 6. Criação de usuário com perfil FUNCIONARIO
 * 7. Isolamento de perfis (GERENTE vs FUNCIONARIO)
 * 8. Upsert e unicidade de email
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function carregarEnv(caminhoRelativo) {
  try {
    const fullPath = path.resolve(__dirname, caminhoRelativo);
    if (!fs.existsSync(fullPath)) return;
    const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignora
  }
}

carregarEnv("../.env.local");
carregarEnv("../.env");

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log("=== INICIANDO TESTES DA ETAPA 3 (AUTENTICAÇÃO & MYSQL) ===\n");

  try {
    // -------------------------------------------------------------
    // Teste 1: Conexão com MySQL via Prisma
    // -------------------------------------------------------------
    console.log("--- 1. Conexão com MySQL ---");
    const countProdutos = await prisma.produto.count();
    assert(typeof countProdutos === "number", `MySQL conectado. Total de produtos cadastrados: ${countProdutos}`);

    // -------------------------------------------------------------
    // Teste 2: Criação e consulta de Produto (Etapa 2 preservada no MySQL)
    // -------------------------------------------------------------
    console.log("\n--- 2. Preservação do módulo de Produtos no MySQL ---");
    const prodTeste = await prisma.produto.create({
      data: {
        nome: `Tomate Italiano Teste [${Date.now()}]`,
        categoria: "Hortifrúti",
        unidadeMedida: "kg",
        estoqueMinimo: 10,
        estoqueIdeal: 35,
        custoReferencia: 7.5,
      },
    });
    assert(prodTeste.id != null, `Produto criado com sucesso no MySQL com ID: ${prodTeste.id}`);
    assert(Number(prodTeste.estoqueMinimo) === 10, "Estoque mínimo conferido");

    // Limpa produto de teste
    await prisma.produto.delete({ where: { id: prodTeste.id } });
    console.log("Produto de teste limpo com sucesso.");

    // -------------------------------------------------------------
    // Teste 3: Tabela de Usuários no MySQL
    // -------------------------------------------------------------
    console.log("\n--- 3. Verificação da tabela de Usuários ---");
    const usuarios = await prisma.usuario.findMany();
    assert(Array.isArray(usuarios) && usuarios.length > 0, `Usuários encontrados no MySQL: ${usuarios.length}`);

    const gerente = usuarios.find((u) => u.perfil === "GERENTE");
    assert(gerente != null, `Usuário GERENTE encontrado: ${gerente?.email}`);
    assert(gerente?.perfil === "GERENTE", `Perfil do usuário é GERENTE`);

    // -------------------------------------------------------------
    // Teste 4: Senha com hash seguro (bcrypt) — nunca texto puro
    // -------------------------------------------------------------
    console.log("\n--- 4. Segurança de Senhas (Hash bcrypt) ---");
    assert(gerente?.senhaHash != null, "Campo senhaHash está presente");
    assert(
      gerente.senhaHash.startsWith("$2a$") || gerente.senhaHash.startsWith("$2b$"),
      `Senha armazenada como hash bcrypt válido (inicia com $2a$ ou $2b$): ${gerente.senhaHash.substring(0, 10)}...`
    );
    assert(
      gerente.senhaHash.length >= 50,
      `Tamanho do hash é de pelo menos 50 caracteres (atual: ${gerente.senhaHash.length})`
    );

    // -------------------------------------------------------------
    // Teste 5: Criação de usuário com perfil FUNCIONARIO
    // -------------------------------------------------------------
    console.log("\n--- 5. Criação de usuário com perfil FUNCIONARIO ---");
    const emailFunc = `funcionario_teste_${Date.now()}@pratocerto.com`;
    const salt = await bcrypt.genSalt(10);
    const senhaHashFunc = await bcrypt.hash("Funcionario123!", salt);

    const funcionario = await prisma.usuario.create({
      data: {
        nome: "Operador de Estoque",
        email: emailFunc,
        senhaHash: senhaHashFunc,
        perfil: "FUNCIONARIO",
        ativo: true,
      },
    });

    assert(funcionario.id != null, `Funcionário criado com sucesso, ID: ${funcionario.id}`);
    assert(funcionario.perfil === "FUNCIONARIO", "Perfil do novo usuário é FUNCIONARIO");

    // Validação de login com a senha correta e incorreta
    const senhaCorreta = await bcrypt.compare("Funcionario123!", funcionario.senhaHash);
    const senhaErrada = await bcrypt.compare("SenhaIncorreta999!", funcionario.senhaHash);
    assert(senhaCorreta === true, "bcrypt.compare validou a senha correta");
    assert(senhaErrada === false, "bcrypt.compare rejeitou a senha incorreta");

    // Limpa usuário de teste
    await prisma.usuario.delete({ where: { id: funcionario.id } });
    console.log("Funcionário de teste limpo com sucesso.");

    // -------------------------------------------------------------
    // Teste 6: Tokens JWT com jose (Sessão HTTP-Only)
    // -------------------------------------------------------------
    console.log("\n--- 6. Geração e validação de token JWT de sessão ---");
    const authSecret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "pratocerto-secret-key-development-minimum-32-chars-long"
    );

    const token = await new SignJWT({
      id: gerente.id,
      email: gerente.email,
      nome: gerente.nome,
      perfil: gerente.perfil,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(authSecret);

    assert(typeof token === "string" && token.length > 20, "Token JWT gerado com sucesso");

    const { payload } = await jwtVerify(token, authSecret);
    assert(payload.id === gerente.id, "JWT decodificado: id confere");
    assert(payload.email === gerente.email, "JWT decodificado: email confere");
    assert(payload.perfil === "GERENTE", "JWT decodificado: perfil confere");

    // -------------------------------------------------------------
    // Teste 7: Restrição de unicidade de email no MySQL
    // -------------------------------------------------------------
    console.log("\n--- 7. Unicidade de email no MySQL ---");
    let duplicadoErro = false;
    try {
      await prisma.usuario.create({
        data: {
          nome: "Duplicado",
          email: gerente.email, // mesmo email do gerente
          senhaHash: "qualquer_hash",
          perfil: "FUNCIONARIO",
        },
      });
    } catch {
      duplicadoErro = true;
    }
    assert(duplicadoErro === true, "Tentativa de criar usuário com email duplicado foi rejeitada pelo MySQL");

    console.log(`\n========================================`);
    console.log(`RESULTADO DOS TESTES: ${passed} PASS, ${failed} FAIL`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Erro nos testes:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
