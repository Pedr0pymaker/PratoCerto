/* eslint-disable */
/**
 * Script de teste automatizado para a ETAPA 2 do PratoCerto
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== INICIANDO TESTES DA ETAPA 2 ===\n");
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

  try {
    // -------------------------------------------------------------
    // Teste 1: Conexão direta com o PostgreSQL via Prisma
    // -------------------------------------------------------------
    console.log("--- 1. Testando conexão com PostgreSQL ---");
    const count = await prisma.produto.count();
    assert(typeof count === "number", `Conexão PostgreSQL ativa. Total de produtos atuais no banco: ${count}`);

    // -------------------------------------------------------------
    // Teste 2: Validação de campos vazios (POST /api/produtos)
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando validação de campos obrigatórios ---");
    const resVazio = await fetch(`${BASE_URL}/api/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert(resVazio.status === 422, `Status 422 retornado para payload vazio (obtido: ${resVazio.status})`);
    const dataVazio = await resVazio.json();
    const camposComErro = dataVazio.erros?.map((e) => e.campo) || [];
    assert(camposComErro.includes("nome"), "Erro apontou campo 'nome'");
    assert(camposComErro.includes("categoria"), "Erro apontou campo 'categoria'");
    assert(camposComErro.includes("unidadeMedida"), "Erro apontou campo 'unidadeMedida'");
    assert(camposComErro.includes("estoqueMinimo"), "Erro apontou campo 'estoqueMinimo'");
    assert(camposComErro.includes("estoqueIdeal"), "Erro apontou campo 'estoqueIdeal'");

    // -------------------------------------------------------------
    // Teste 3: Validação de regra de negócio (ideal < mínimo)
    // -------------------------------------------------------------
    console.log("\n--- 3. Testando regra: estoqueIdeal < estoqueMinimo ---");
    const resRegra = await fetch(`${BASE_URL}/api/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Produto Teste Invalido",
        categoria: "Outros",
        unidadeMedida: "un",
        estoqueMinimo: 10,
        estoqueIdeal: 5,
      }),
    });
    assert(resRegra.status === 422, `Status 422 retornado para estoque ideal < mínimo (obtido: ${resRegra.status})`);
    const dataRegra = await resRegra.json();
    assert(
      dataRegra.erros?.some((e) => e.campo === "estoqueIdeal"),
      "Erro detectado no campo 'estoqueIdeal' quando menor que mínimo"
    );

    // -------------------------------------------------------------
    // Teste 4: Cadastro válido
    // -------------------------------------------------------------
    console.log("\n--- 4. Testando cadastro válido de produto ---");
    const nomeUnico = `Arroz Branco Tipo 1 [${Date.now()}]`;
    const resCadastro = await fetch(`${BASE_URL}/api/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nomeUnico,
        categoria: "Grãos e Cereais",
        unidadeMedida: "kg",
        estoqueMinimo: 20,
        estoqueIdeal: 100,
        custoReferencia: 5.8,
      }),
    });
    assert(resCadastro.status === 201, `Status 201 retornado no cadastro (obtido: ${resCadastro.status})`);
    const dataCadastro = await resCadastro.json();
    assert(dataCadastro.produto?.id != null, `Produto criado com ID: ${dataCadastro.produto?.id}`);
    assert(dataCadastro.produto?.nome === nomeUnico, `Nome salvo corretamente: ${dataCadastro.produto?.nome}`);
    assert(dataCadastro.produto?.estoqueMinimo === 20, "Estoque mínimo salvo como número 20");
    assert(dataCadastro.produto?.estoqueIdeal === 100, "Estoque ideal salvo como número 100");
    assert(dataCadastro.produto?.custoReferencia === 5.8, "Custo salvo como número 5.80");

    // -------------------------------------------------------------
    // Teste 5: Consulta GET /api/produtos
    // -------------------------------------------------------------
    console.log("\n--- 5. Testando consulta GET /api/produtos ---");
    const resGet = await fetch(`${BASE_URL}/api/produtos`);
    assert(resGet.status === 200, `Status 200 retornado no GET (obtido: ${resGet.status})`);
    const dataGet = await resGet.json();
    assert(Array.isArray(dataGet.produtos), "Array de produtos retornado");
    const produtoEncontrado = dataGet.produtos.find((p) => p.nome === nomeUnico);
    assert(produtoEncontrado != null, `Produto recém-criado '${nomeUnico}' encontrado na listagem`);

    // -------------------------------------------------------------
    // Teste 6: Persistência no PostgreSQL
    // -------------------------------------------------------------
    console.log("\n--- 6. Verificando persistência no PostgreSQL ---");
    const noBanco = await prisma.produto.findUnique({
      where: { id: dataCadastro.produto.id },
    });
    assert(noBanco != null, `Produto encontrado diretamente no banco pelo Prisma`);
    assert(Number(noBanco.estoqueMinimo) === 20, "Valor de estoqueMinimo conferido no PostgreSQL");

    // -------------------------------------------------------------
    // Teste 7: Acesso à rota de página /estoque
    // -------------------------------------------------------------
    console.log("\n--- 7. Testando carregamento da página /estoque ---");
    const resPage = await fetch(`${BASE_URL}/estoque`);
    assert(resPage.status === 200, `Página /estoque respondeu com HTTP 200 (obtido: ${resPage.status})`);
    const pageHtml = await resPage.text();
    assert(pageHtml.includes("Estoque"), "HTML da página inclui título 'Estoque'");

    console.log(`\n========================================`);
    console.log(`RESULTADO DOS TESTES: ${passed} PASS, ${failed} FAIL`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Erro durante a execução dos testes:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
