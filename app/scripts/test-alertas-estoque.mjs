import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const helperPath = fileURLToPath(new URL("../src/lib/alertas-estoque.ts", import.meta.url));
const source = await readFile(helperPath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
new Function("exports", compiled)(helperModule.exports);
const { calcularAlertasEstoque } = helperModule.exports;

const produtos = [
  {
    id: "farinha", nome: "Farinha", categoria: "Secos", unidadeMedida: "kg", ativo: true, estoqueMinimo: "3.001",
    lotes: [
      { id: "f1", quantidadeAtual: "1.200", dataValidade: "2026-10-18" },
      { id: "f2", quantidadeAtual: "1.800", dataValidade: "2026-10-26" },
    ],
  },
  {
    id: "oleo", nome: "Óleo", categoria: "Mercearia", unidadeMedida: "L", ativo: true, estoqueMinimo: "0.300",
    lotes: [{ id: "o1", quantidadeAtual: "0.100", dataValidade: null }, { id: "o2", quantidadeAtual: "0.200", dataValidade: "2026-10-27" }],
  },
  {
    id: "leite", nome: "Leite", categoria: "Laticínios", unidadeMedida: "L", ativo: true, estoqueMinimo: "0.001",
    lotes: [{ id: "l1", quantidadeAtual: "0.000", dataValidade: "2026-10-19" }],
  },
  {
    id: "inativo", nome: "Produto inativo", categoria: "Outros", unidadeMedida: "un", ativo: false, estoqueMinimo: "10.000",
    lotes: [{ id: "i1", quantidadeAtual: "1.000", dataValidade: "2026-10-18" }],
  },
  {
    id: "ovos", nome: "Ovos", categoria: "Outros", unidadeMedida: "un", ativo: true, estoqueMinimo: "0.000",
    lotes: [
      { id: "e1", quantidadeAtual: "1.000", dataValidade: "2026-10-19" },
      { id: "e2", quantidadeAtual: "1.000", dataValidade: new Date("2026-10-20T00:00:00.000Z") },
      { id: "e3", quantidadeAtual: "1.000", dataValidade: "2026-10-26" },
      { id: "e4", quantidadeAtual: "1.000", dataValidade: "2026-10-27" },
    ],
  },
];

// 03:30Z equivale a 23:30 do dia anterior em America/Manaus.
const resultado = calcularAlertasEstoque(produtos, new Date("2026-10-20T03:30:00.000Z"));
assert.equal(resultado.dataReferencia, "2026-10-19", "uses the Brazilian local calendar day");
assert.deepEqual(resultado.estoqueBaixo.map((produto) => produto.nome), ["Farinha", "Leite"]);
assert.equal(resultado.estoqueBaixo[0].saldoDisponivel, 3);
assert.equal(resultado.estoqueBaixo[0].estoqueMinimo, 3.001);
assert.equal(resultado.resumo.vencidos, 1, "includes positive lots that expired before the local day");
assert.equal(resultado.resumo.vencemEm7Dias, 4, "includes today through day seven, inclusive");
assert.deepEqual(resultado.proximosDoVencimento.map((lote) => lote.dias), [0, 1, 7, 7]);
assert.equal(resultado.proximosDoVencimento.some((lote) => lote.loteId === "e4"), false, "excludes day eight");
assert.equal(resultado.vencidos.some((lote) => lote.loteId === "i1"), false, "ignores inactive products");
assert.equal(resultado.vencidos.some((lote) => lote.loteId === "l1"), false, "ignores zero-balance lots");
assert.equal(resultado.proximosDoVencimento.some((lote) => lote.loteId === "o1"), false, "ignores lots without expiration");
assert.equal(resultado.resumo.estoqueBaixo, 2, "sum uses exact decimal arithmetic and strict less-than comparison");
console.log("PASS: stock alert calculations and expiry date rules");
