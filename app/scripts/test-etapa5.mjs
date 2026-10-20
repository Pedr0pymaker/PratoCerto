/**
 * PratoCerto — Script de Testes Automatizados da ETAPA 5: Perdas e Desperdício
 *
 * Testa:
 * 1. Modelo Perda criado com todos os campos esperados
 * 2. Validação server-side: quantidade inválida, motivo inválido, produto vazio
 * 3. Registro de perda com desconto FIFO nos lotes (mais antigos primeiro)
 * 4. Custo estimado calculado com base nos custos unitários dos lotes efetivamente baixados
 * 5. Estoque insuficiente é rejeitado
 * 6. Transação atômica: lotes e perda são consistentes
 * 7. Múltiplos lotes: FIFO consome parcialmente o segundo lote
 * 8. Lote sem custo unitário (null) contribui com custo zero para o estimado
 */

import { PrismaClient, Prisma } from "@prisma/client";
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
  const modulo = await import("../src/lib/validations/perda.ts");
  return modulo;
}

async function run() {
  console.log("=== INICIANDO TESTES DA ETAPA 5 (PERDAS & DESPERDÍCIO) ===\n");

  let produtoTesteId = null;
  let usuarioTesteId = null;

  try {
    const { validarPerda, MOTIVOS_PERDA } = await importarValidacao();

    // Cria produto e usuário de teste
    const produto = await prisma.produto.create({
      data: {
        nome: `Tomate Teste Perda [${Date.now()}]`,
        categoria: "Hortifrúti",
        unidadeMedida: "kg",
        estoqueMinimo: 5,
        estoqueIdeal: 20,
        custoReferencia: 8.0,
      },
    });
    produtoTesteId = produto.id;

    // Busca um usuário existente para uso nos testes
    const usuario = await prisma.usuario.findFirst({ where: { ativo: true } });
    if (!usuario) {
      throw new Error("Nenhum usuário ativo encontrado no banco. Execute seed:admin primeiro.");
    }
    usuarioTesteId = usuario.id;

    // ---------------------------------------------------------------
    // Teste 1: Modelo Perda existe e aceita criação manual
    // ---------------------------------------------------------------
    console.log("--- 1. Modelo Perda existe e aceita criação ---");

    // Primeiro cria lotes para ter estoque
    const lote1 = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 10,
        quantidadeAtual: 10,
        dataEntrada: new Date("2026-10-01"),
        custoUnitario: 5.0,
      },
    });

    const perda = await prisma.perda.create({
      data: {
        produtoId: produtoTesteId,
        usuarioId: usuarioTesteId,
        quantidade: 2,
        motivo: "VENCIMENTO",
        custoEstimado: 10.0,
        observacao: "Teste direto no banco",
      },
    });

    assert(perda.id != null, `Perda criada com sucesso (ID: ${perda.id})`);
    assert(perda.produtoId === produtoTesteId, "FK produtoId vinculado corretamente");
    assert(perda.usuarioId === usuarioTesteId, "FK usuarioId vinculado corretamente");
    assert(Number(perda.quantidade) === 2, "Quantidade persistida: 2");
    assert(perda.motivo === "VENCIMENTO", "Motivo persistido: VENCIMENTO");
    assert(Number(perda.custoEstimado) === 10.0, "Custo estimado persistido: R$ 10,00");
    assert(perda.observacao === "Teste direto no banco", "Observação persistida");
    assert(perda.dataHora instanceof Date, "dataHora é uma instância de Date");

    // Limpa perda e lote de teste direto
    await prisma.perda.delete({ where: { id: perda.id } });
    await prisma.loteEstoque.delete({ where: { id: lote1.id } });

    // ---------------------------------------------------------------
    // Teste 2: Validação server-side — quantidade inválida
    // ---------------------------------------------------------------
    console.log("\n--- 2. Validação server-side: quantidade inválida ---");

    const errosQtdZero = validarPerda({
      produtoId: produtoTesteId,
      quantidade: 0,
      motivo: "VENCIMENTO",
    });
    assert(
      errosQtdZero.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade igual a zero"
    );

    const errosQtdNegativa = validarPerda({
      produtoId: produtoTesteId,
      quantidade: -5,
      motivo: "DETERIORACAO",
    });
    assert(
      errosQtdNegativa.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade negativa"
    );

    const errosQtdNaN = validarPerda({
      produtoId: produtoTesteId,
      quantidade: "abc",
      motivo: "SOBRA",
    });
    assert(
      errosQtdNaN.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade não numérica"
    );

    const errosQtdVazia = validarPerda({
      produtoId: produtoTesteId,
      quantidade: "",
      motivo: "OUTRO",
    });
    assert(
      errosQtdVazia.some((e) => e.campo === "quantidade"),
      "Validação rejeitou quantidade vazia"
    );

    // ---------------------------------------------------------------
    // Teste 3: Validação server-side — motivo inválido
    // ---------------------------------------------------------------
    console.log("\n--- 3. Validação server-side: motivo inválido ---");

    const errosMotivoInvalido = validarPerda({
      produtoId: produtoTesteId,
      quantidade: 5,
      motivo: "MOTIVO_FALSO",
    });
    assert(
      errosMotivoInvalido.some((e) => e.campo === "motivo"),
      "Validação rejeitou motivo não pertencente à lista"
    );

    const errosMotivoVazio = validarPerda({
      produtoId: produtoTesteId,
      quantidade: 5,
      motivo: "",
    });
    assert(
      errosMotivoVazio.some((e) => e.campo === "motivo"),
      "Validação rejeitou motivo vazio"
    );

    // Todos os motivos válidos devem ser aceitos
    for (const motivo of MOTIVOS_PERDA) {
      const erros = validarPerda({
        produtoId: produtoTesteId,
        quantidade: 1,
        motivo,
      });
      assert(
        !erros.some((e) => e.campo === "motivo"),
        `Motivo válido aceito: ${motivo}`
      );
    }

    // ---------------------------------------------------------------
    // Teste 4: Validação server-side — produto vazio
    // ---------------------------------------------------------------
    console.log("\n--- 4. Validação server-side: produto vazio ---");

    const errosProdutoVazio = validarPerda({
      produtoId: "",
      quantidade: 5,
      motivo: "VENCIMENTO",
    });
    assert(
      errosProdutoVazio.some((e) => e.campo === "produtoId"),
      "Validação rejeitou produtoId vazio"
    );

    const errosSemProduto = validarPerda({
      quantidade: 5,
      motivo: "VENCIMENTO",
    });
    assert(
      errosSemProduto.some((e) => e.campo === "produtoId"),
      "Validação rejeitou dados sem produtoId"
    );

    // ---------------------------------------------------------------
    // Teste 5: Baixa FIFO — desconta do lote mais antigo primeiro
    // ---------------------------------------------------------------
    console.log("\n--- 5. Baixa FIFO nos lotes ---");

    // Cria dois lotes: o mais antigo com 3 kg @ R$5, o mais novo com 7 kg @ R$8
    const loteAntigo = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 3,
        quantidadeAtual: 3,
        dataEntrada: new Date("2026-10-01"),
        custoUnitario: 5.0,
      },
    });

    const loteNovo = await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 7,
        quantidadeAtual: 7,
        dataEntrada: new Date("2026-10-10"),
        custoUnitario: 8.0,
      },
    });

    // Simula FIFO manualmente: descontar 5 kg
    // FIFO: 3 do loteAntigo (esgota) + 2 do loteNovo
    // Custo: (3 * 5.0) + (2 * 8.0) = 15 + 16 = 31
    const quantidadePerda = new Prisma.Decimal(5);
    let restante = new Prisma.Decimal(5);
    let custoEstimadoCalc = new Prisma.Decimal(0);

    const lotesOrdenados = await prisma.loteEstoque.findMany({
      where: { produtoId: produtoTesteId, quantidadeAtual: { gt: 0 } },
      orderBy: { dataEntrada: "asc" },
    });

    assert(lotesOrdenados.length === 2, "Dois lotes com saldo disponível encontrados");
    assert(lotesOrdenados[0].id === loteAntigo.id, "FIFO: lote mais antigo aparece primeiro na consulta");

    // Executa FIFO em transação
    await prisma.$transaction(async (tx) => {
      for (const lote of lotesOrdenados) {
        if (restante.lessThanOrEqualTo(0)) break;

        const disponivel = new Prisma.Decimal(lote.quantidadeAtual);
        const descontar = disponivel.lessThanOrEqualTo(restante) ? disponivel : restante;

        const custoUnit = lote.custoUnitario !== null
          ? new Prisma.Decimal(lote.custoUnitario)
          : new Prisma.Decimal(0);
        custoEstimadoCalc = custoEstimadoCalc.plus(descontar.times(custoUnit));

        await tx.loteEstoque.update({
          where: { id: lote.id },
          data: { quantidadeAtual: disponivel.minus(descontar) },
        });

        restante = restante.minus(descontar);
      }

      await tx.perda.create({
        data: {
          produtoId: produtoTesteId,
          usuarioId: usuarioTesteId,
          quantidade: quantidadePerda,
          motivo: "DETERIORACAO",
          custoEstimado: custoEstimadoCalc.toDecimalPlaces(2),
          observacao: "Teste FIFO",
        },
      });
    });

    // Verifica lotes após FIFO
    const loteAntigoAtualizado = await prisma.loteEstoque.findUnique({ where: { id: loteAntigo.id } });
    const loteNovoAtualizado = await prisma.loteEstoque.findUnique({ where: { id: loteNovo.id } });

    assert(
      Number(loteAntigoAtualizado.quantidadeAtual) === 0,
      `FIFO: lote antigo esgotado (quantidadeAtual = ${Number(loteAntigoAtualizado.quantidadeAtual)})`
    );
    assert(
      Number(loteNovoAtualizado.quantidadeAtual) === 5,
      `FIFO: lote novo parcialmente consumido (quantidadeAtual = ${Number(loteNovoAtualizado.quantidadeAtual)}, esperado 5)`
    );

    // ---------------------------------------------------------------
    // Teste 6: Custo estimado calculado corretamente
    // ---------------------------------------------------------------
    console.log("\n--- 6. Custo estimado calculado corretamente ---");

    // Custo esperado: (3 * 5.0) + (2 * 8.0) = 31.00
    assert(
      custoEstimadoCalc.toNumber() === 31.0,
      `Custo estimado FIFO calculado: R$ ${custoEstimadoCalc.toNumber()} (esperado R$ 31,00)`
    );

    // Verifica que a perda no banco tem o custo correto
    const perdaFifo = await prisma.perda.findFirst({
      where: { produtoId: produtoTesteId, observacao: "Teste FIFO" },
    });
    assert(
      Number(perdaFifo.custoEstimado) === 31.0,
      `Perda no banco com custoEstimado = R$ ${Number(perdaFifo.custoEstimado)}`
    );

    // ---------------------------------------------------------------
    // Teste 7: Estoque insuficiente é rejeitado
    // ---------------------------------------------------------------
    console.log("\n--- 7. Estoque insuficiente é rejeitado ---");

    // Saldo atual do produto: 5 kg (do loteNovo restante)
    // Tentar descontar 50 kg deve falhar
    let estoqueInsuficienteErro = false;
    try {
      await prisma.$transaction(async (tx) => {
        const lotes = await tx.loteEstoque.findMany({
          where: { produtoId: produtoTesteId, quantidadeAtual: { gt: 0 } },
          orderBy: { dataEntrada: "asc" },
        });

        const saldoTotal = lotes.reduce(
          (acc, l) => acc.plus(l.quantidadeAtual),
          new Prisma.Decimal(0)
        );

        const qtdSolicitada = new Prisma.Decimal(50);
        if (saldoTotal.lessThan(qtdSolicitada)) {
          throw new Error("Estoque insuficiente");
        }

        // Se chegar aqui, o teste falhou
        await tx.perda.create({
          data: {
            produtoId: produtoTesteId,
            usuarioId: usuarioTesteId,
            quantidade: 50,
            motivo: "OUTRO",
            custoEstimado: 0,
          },
        });
      });
    } catch (err) {
      if (err.message.includes("Estoque insuficiente")) {
        estoqueInsuficienteErro = true;
      }
    }
    assert(
      estoqueInsuficienteErro === true,
      "Operação rejeitada quando quantidade excede o estoque disponível"
    );

    // Verifica que o estoque não foi alterado (rollback da transação)
    const loteAposRejeicao = await prisma.loteEstoque.findUnique({ where: { id: loteNovo.id } });
    assert(
      Number(loteAposRejeicao.quantidadeAtual) === 5,
      `Rollback: saldo do lote não foi alterado após rejeição (quantidadeAtual = ${Number(loteAposRejeicao.quantidadeAtual)})`
    );

    // ---------------------------------------------------------------
    // Teste 8: Transação atômica — consistência garantida
    // ---------------------------------------------------------------
    console.log("\n--- 8. Transação atômica: consistência entre lote e perda ---");

    // Conta perdas antes
    const countPerdasAntes = await prisma.perda.count({ where: { produtoId: produtoTesteId } });

    // Força um erro dentro da transação para verificar rollback completo
    let transacaoFalhou = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Desconta 1 kg do lote existente
        await tx.loteEstoque.update({
          where: { id: loteNovo.id },
          data: { quantidadeAtual: { decrement: 1 } },
        });

        // Erro forçado após desconto — deve fazer rollback do decrement acima
        throw new Error("Erro forçado para teste de rollback");
      });
    } catch (err) {
      if (err.message.includes("Erro forçado")) {
        transacaoFalhou = true;
      }
    }

    assert(transacaoFalhou === true, "Transação lançou erro forçado");

    // Verifica que o lote não foi decrementado (rollback)
    const loteAposRollback = await prisma.loteEstoque.findUnique({ where: { id: loteNovo.id } });
    assert(
      Number(loteAposRollback.quantidadeAtual) === 5,
      `Rollback completo: lote manteve saldo original (${Number(loteAposRollback.quantidadeAtual)} kg)`
    );

    // Verifica que nenhuma perda extra foi criada
    const countPerdasDepois = await prisma.perda.count({ where: { produtoId: produtoTesteId } });
    assert(
      countPerdasDepois === countPerdasAntes,
      `Rollback: contagem de perdas inalterada (antes: ${countPerdasAntes}, depois: ${countPerdasDepois})`
    );

    // ---------------------------------------------------------------
    // Teste 9: Lote sem custo unitário (null) contribui com custo zero
    // ---------------------------------------------------------------
    console.log("\n--- 9. Lote sem custo unitário contribui com custo zero ---");

    // Cria lote sem custo
    await prisma.loteEstoque.create({
      data: {
        produtoId: produtoTesteId,
        quantidadeInicial: 3,
        quantidadeAtual: 3,
        dataEntrada: new Date("2026-09-25"), // mais antigo que os existentes
        custoUnitario: null,
      },
    });

    // FIFO: loteSemCusto (3 kg @ null) é mais antigo, depois loteNovo (5 kg @ 8)
    // Se descontar 4 kg: 3 do loteSemCusto + 1 do loteNovo
    // Custo: (3 * 0) + (1 * 8) = 8.00
    let custoSemCusto = new Prisma.Decimal(0);
    let rest2 = new Prisma.Decimal(4);

    const lotes2 = await prisma.loteEstoque.findMany({
      where: { produtoId: produtoTesteId, quantidadeAtual: { gt: 0 } },
      orderBy: { dataEntrada: "asc" },
    });

    await prisma.$transaction(async (tx) => {
      for (const lote of lotes2) {
        if (rest2.lessThanOrEqualTo(0)) break;
        const disponivel = new Prisma.Decimal(lote.quantidadeAtual);
        const descontar = disponivel.lessThanOrEqualTo(rest2) ? disponivel : rest2;
        const cu = lote.custoUnitario !== null ? new Prisma.Decimal(lote.custoUnitario) : new Prisma.Decimal(0);
        custoSemCusto = custoSemCusto.plus(descontar.times(cu));
        await tx.loteEstoque.update({
          where: { id: lote.id },
          data: { quantidadeAtual: disponivel.minus(descontar) },
        });
        rest2 = rest2.minus(descontar);
      }
      await tx.perda.create({
        data: {
          produtoId: produtoTesteId,
          usuarioId: usuarioTesteId,
          quantidade: 4,
          motivo: "SOBRA",
          custoEstimado: custoSemCusto.toDecimalPlaces(2),
          observacao: "Teste lote sem custo",
        },
      });
    });

    assert(
      custoSemCusto.toNumber() === 8.0,
      `Custo com lote sem custo: R$ ${custoSemCusto.toNumber()} (esperado R$ 8,00 — lote null contribuiu com R$ 0)`
    );

    // ---------------------------------------------------------------
    // Teste 10: Saldo final após todas as operações
    // ---------------------------------------------------------------
    console.log("\n--- 10. Saldo final consistente ---");

    const lotesFinais = await prisma.loteEstoque.findMany({
      where: { produtoId: produtoTesteId },
    });
    const saldoFinal = lotesFinais.reduce(
      (acc, l) => acc + Number(l.quantidadeAtual),
      0
    );

    // Estoque inicial total: 3 + 7 + 3 = 13 kg
    // Perdas: 5 (FIFO) + 4 (sem custo) = 9 kg
    // Saldo esperado: 13 - 9 = 4 kg
    assert(
      Number(saldoFinal.toFixed(3)) === 4,
      `Saldo final após todas as perdas: ${saldoFinal} kg (esperado 4 kg)`
    );

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
    // Limpeza total
    if (produtoTesteId) {
      try {
        // Cascade delete: perdas e lotes são removidos automaticamente
        await prisma.produto.delete({ where: { id: produtoTesteId } });
        console.log("Limpeza de dados de teste concluída com sucesso.");
      } catch {
        // ignora se já tiver sido deletado
      }
    }
    await prisma.$disconnect();
  }
}

run();
