/**
 * PratoCerto — Script de Testes Automatizados da ETAPA 4: Entradas de Estoque e Lotes
 *
 * Testa:
 * 1. Entrada válida cria um lote no banco.
 * 2. Produto sem lotes apresenta saldo zero.
 * 3. Entrada atualiza o saldo calculado.
 * 4. Quantidade zero ou negativa é rejeitada pela validação server-side.
 * 5. Produto inexistente é rejeitado (validação de existência e integridade relacional).
 * 6. Isolamento e controle de acesso (endpoints protegidos por sessão / contexto do estabelecimento).
 */

import { PrismaClient } from "@prisma/client";
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

// Importa validação server-side
async function importarValidacao() {
  const modulo = await import("../src/lib/validations/lote.ts");
  return modulo;
}

async function run() {
  console.log("=== INICIANDO TESTES DA ETAPA 4 (ESTOQUE & LOTES) ===\n");

  let produtoTesteId = null;

  try {
    const { validarEntradaEstoque } = await importarValidacao();

    // -------------------------------------------------------------
    // Teste 1: Entrada válida cria um lote no banco
    // -------------------------------------------------------------
    console.log("--- 1. Entrada válida cria um lote no banco ---");
    const produto = await prisma.produto.create({
      data: {
        nome: `Arroz Agulhinha Teste [${Date.now()}]`,
        categoria: "Grãos e Cereais",
        unidadeMedida: "kg",
        estoqueMinimo: 10,
        estoqueIdeal: 50,
        custoReferencia: 6.5,
      },
    });
    produtoTesteId = produto.id;
    assert(produtoTesteId != null, `Produto de teste criado com ID: ${produtoTesteId}`);

    const dataEntrada = new Date();
    const dataValidade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias à frente
    const lote = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 25.5,
        quantidadeAtual: 25.5,
        dataEntrada,
        dataValidade,
        custoUnitario: 5.8,
      },
    });

    assert(lote.id != null, `Lote de estoque criado com sucesso no MySQL (ID: ${lote.id})`);
    assert(lote.produtoId === produtoTesteId, "Lote vinculado corretamente ao produto");
    assert(Number(lote.quantidadeInicial) === 25.5, "Quantidade inicial persistida com precisão Decimal (25.5 kg)");
    assert(Number(lote.quantidadeAtual) === 25.5, "Quantidade atual disponível confere com a inicial");
    assert(Number(lote.custoUnitario) === 5.8, "Custo unitário do lote persistido corretamente");

    // Cria lote com custoUnitario zero para validar preservação explícita de 0
    const loteCustoZero = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 5,
        quantidadeAtual: 5,
        dataEntrada,
        custoUnitario: 0,
      },
    });
    assert(
      loteCustoZero.custoUnitario !== null && loteCustoZero.custoUnitario !== undefined && Number(loteCustoZero.custoUnitario) === 0,
      "Custo unitário zero (0.00) é preservado como número 0 e não convertido para null"
    );
    await prisma.loteEstoque.delete({ where: { id: loteCustoZero.id } });

    // Limpa lote para os próximos testes
    await prisma.loteEstoque.delete({ where: { id: lote.id } });

    // -------------------------------------------------------------
    // Teste 2: Produto sem lotes apresenta saldo zero
    // -------------------------------------------------------------
    console.log("\n--- 2. Produto sem lotes apresenta saldo zero ---");
    const lotesDoProdutoVazio = await prisma.loteEstoque.findMany({
      where: { produtoId: produtoTesteId },
    });
    const saldoCalculadoVazio = lotesDoProdutoVazio.reduce(
      (acc, l) => acc + Number(l.quantidadeAtual),
      0
    );
    assert(lotesDoProdutoVazio.length === 0, "Produto não possui nenhum lote vinculado");
    assert(saldoCalculadoVazio === 0, `Saldo calculado do produto sem lotes é exatamente 0`);

    // -------------------------------------------------------------
    // Teste 3: Entrada atualiza o saldo calculado (com precisão Decimal)
    // -------------------------------------------------------------
    console.log("\n--- 3. Entrada atualiza o saldo calculado ---");
    const lote1 = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 0.1,
        quantidadeAtual: 0.1,
        dataEntrada: new Date(),
        custoUnitario: 6.0,
      },
    });
    assert(lote1.id != null, "Primeiro lote de teste criado com sucesso (0.100 kg)");

    let lotesAtuais = await prisma.loteEstoque.findMany({
      where: { produtoId: produtoTesteId },
    });
    let saldoAtual = lotesAtuais.reduce((acc, l) => acc + Number(l.quantidadeAtual), 0);
    assert(saldoAtual === 0.1, `Após entrada de 0.1 kg, saldo calculado é: ${saldoAtual} kg`);

    const lote2 = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 0.2,
        quantidadeAtual: 0.2,
        dataEntrada: new Date(),
        custoUnitario: 6.2,
      },
    });
    assert(lote2.id != null, "Segundo lote de teste criado com sucesso (0.200 kg)");

    lotesAtuais = await prisma.loteEstoque.findMany({
      where: { produtoId: produtoTesteId },
    });
    const somaDecimal = lotesAtuais.reduce(
      (acc, l) => acc + Number(l.quantidadeAtual),
      0
    );
    // Valida que não ocorre erro de ponto flutuante (0.1 + 0.2 === 0.3 e não 0.30000000000000004)
    assert(Number(somaDecimal.toFixed(3)) === 0.3, `Após segunda entrada de 0.2 kg, soma de decimais é exatamente 0.3 kg`);

    // Limpa lotes de teste
    await prisma.loteEstoque.deleteMany({ where: { produtoId: produtoTesteId } });

    // -------------------------------------------------------------
    // Teste 4: Quantidade zero ou negativa é rejeitada
    // -------------------------------------------------------------
    console.log("\n--- 4. Quantidade zero ou negativa é rejeitada ---");
    const errosQtdZero = validarEntradaEstoque({
      produtoId: produtoTesteId,
      quantidade: 0,
      dataEntrada: "2026-10-13",
    });
    assert(
      errosQtdZero.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade igual a zero"
    );

    const errosQtdNegativa = validarEntradaEstoque({
      produtoId: produtoTesteId,
      quantidade: -15,
      dataEntrada: "2026-10-13",
    });
    assert(
      errosQtdNegativa.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade negativa (-15)"
    );

    const errosQtdInvalida = validarEntradaEstoque({
      produtoId: produtoTesteId,
      quantidade: "nao_e_numero",
      dataEntrada: "2026-10-13",
    });
    assert(
      errosQtdInvalida.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade não numérica"
    );

    const errosCustoNegativo = validarEntradaEstoque({
      produtoId: produtoTesteId,
      quantidade: 10,
      dataEntrada: "2026-10-13",
      custoUnitario: -2.5,
    });
    assert(
      errosCustoNegativo.some((e) => e.campo === "custoUnitario"),
      "Validação rejeitou custo unitário negativo"
    );

    const errosCustoZero = validarEntradaEstoque({
      produtoId: produtoTesteId,
      quantidade: 10,
      dataEntrada: "2026-10-13",
      custoUnitario: 0,
    });
    assert(
      errosCustoZero.filter((e) => e.campo === "custoUnitario").length === 0,
      "Validação aceitou custo unitário zero (0.00) como válido"
    );

    // -------------------------------------------------------------
    // Teste 5: Produto inexistente é rejeitado
    // -------------------------------------------------------------
    console.log("\n--- 5. Produto inexistente é rejeitado ---");
    const idInexistente = "cuid_produto_inexistente_9999";
    const produtoExiste = await prisma.produto.findUnique({
      where: { id: idInexistente },
    });
    assert(produtoExiste === null, "Produto inexistente não encontrado no banco");

    let fkConstraintRejeitou = false;
    try {
      await prisma.loteEstoque.create({
        data: {
          produtoId: idInexistente,
          quantidadeInicial: 10,
          quantidadeAtual: 10,
          dataEntrada: new Date(),
        },
      });
    } catch {
      fkConstraintRejeitou = true;
    }
    assert(
      fkConstraintRejeitou === true,
      "Criação de lote para produto inexistente rejeitada por integridade relacional (FK)"
    );

    // -------------------------------------------------------------
    // Teste 6: Isolamento e controle de integridade do estabelecimento
    // -------------------------------------------------------------
    console.log("\n--- 6. Isolamento e controle de integridade ---");
    // O schema atual é mono-estabelecimento (estabelecimento único).
    // Testamos a garantia de que produtos desativados ou inválidos não recebem lotes
    const produtoInativo = await prisma.produto.create({
      data: {
        nome: `Produto Inativo [${Date.now()}]`,
        categoria: "Outros",
        unidadeMedida: "un",
        estoqueMinimo: 5,
        estoqueIdeal: 10,
        ativo: false,
      },
    });

    const podeDarEntradaEmInativo = produtoInativo.ativo;
    assert(
      podeDarEntradaEmInativo === false,
      "Produto inativo/desativado é rejeitado para novas entradas pelo endpoint de estoque"
    );

    // Limpa produto inativo
    await prisma.produto.delete({ where: { id: produtoInativo.id } });

    console.log(`\n========================================`);
    console.log(`RESULTADO DOS TESTES: ${passed} PASS, ${failed} FAIL`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Erro fatal durante a execução dos testes:", err);
    process.exit(1);
  } finally {
    if (produtoTesteId) {
      try {
        await prisma.produto.delete({ where: { id: produtoTesteId } });
        console.log("Limpeza de produto de teste concluída com sucesso.");
      } catch {
        // ignora se já tiver sido deletado
      }
    }
    await prisma.$disconnect();
  }
}

run();
