/**
 * PratoCerto — Script de Criação do Primeiro Usuário Gerente
 *
 * Cria com segurança o primeiro usuário GERENTE no banco de dados.
 *
 * Como usar:
 * 1) Via variáveis de ambiente no .env.local:
 *    ADMIN_NOME="Administrador"
 *    ADMIN_EMAIL="admin@pratocerto.com"
 *    ADMIN_SENHA="sua_senha_segura_aqui"
 *    npm run seed:admin
 *
 * 2) Ou passando argumentos via CLI:
 *    node scripts/seed-admin.mjs --email=admin@pratocerto.com --senha=SegredoForte123!
 *
 * 3) Ou sem argumentos (o script gera uma senha aleatória segura na hora):
 *    node scripts/seed-admin.mjs
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregador simples de .env sem dependências externas
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
    // ignora se falhar
  }
}

carregarEnv("../.env.local");
carregarEnv("../.env");

const prisma = new PrismaClient();

// Extrai argumentos de linha de comando (--nome=..., --email=..., --senha=...)
function getArg(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (arg) return arg.split("=")[1];
  return null;
}

async function main() {
  console.log("=== PratoCerto: Criação Segura do Primeiro Gerente ===\n");

  const nome = getArg("nome") || process.env.ADMIN_NOME || "Gerente Principal";
  const email = (getArg("email") || process.env.ADMIN_EMAIL || "gerente@pratocerto.com").trim().toLowerCase();

  // Senha fornecida ou gerada aleatoriamente
  let senha = getArg("senha") || process.env.ADMIN_SENHA;
  let senhaGeradaAutomaticamente = false;

  if (!senha) {
    // Gera uma senha aleatória forte de 12 caracteres (letras e números)
    senha = "pc_" + crypto.randomBytes(6).toString("hex") + "!";
    senhaGeradaAutomaticamente = true;
  }

  if (senha.length < 6) {
    console.error("❌ Erro: A senha deve conter pelo menos 6 caracteres.");
    process.exit(1);
  }

  // Gera o hash seguro com custo 12
  console.log("🔒 Gerando hash seguro com bcrypt (custo 12)...");
  const salt = await bcrypt.genSalt(12);
  const senhaHash = await bcrypt.hash(senha, salt);

  // Cria ou atualiza o usuário
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      nome,
      senhaHash,
      perfil: "GERENTE",
      ativo: true,
    },
    create: {
      nome,
      email,
      senhaHash,
      perfil: "GERENTE",
      ativo: true,
    },
  });

  console.log("\n✅ Usuário GERENTE configurado com sucesso no MySQL!");
  console.log("-------------------------------------------------------");
  console.log(`ID:     ${usuario.id}`);
  console.log(`Nome:   ${usuario.nome}`);
  console.log(`Email:  ${usuario.email}`);
  console.log(`Perfil: ${usuario.perfil}`);
  console.log("Senha:  [PROTEGIDA — hash seguro gerado via bcrypt]");
  console.log("-------------------------------------------------------");

  if (senhaGeradaAutomaticamente) {
    console.log("ℹ️  Senha gerada e armazenada exclusivamente em hash seguro.");
  } else {
    console.log("ℹ️  Senha definida a partir das variáveis de ambiente/parâmetros e armazenada em hash.");
  }
}

main()
  .catch((err) => {
    console.error("❌ Erro ao criar gerente:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
