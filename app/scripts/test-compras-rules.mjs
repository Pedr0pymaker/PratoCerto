import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const helperPath = fileURLToPath(new URL("../src/lib/compra.ts", import.meta.url));
const source = await readFile(helperPath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
new Function("exports", compiled)(helperModule.exports);
const {
  calcularItemCentavos,
  centavosComoDecimal,
  validarDataCalendario,
  validarPedidoCompra,
  validarRecebimentoPedido,
  validarTransicaoPedido,
} = helperModule.exports;

assert.equal(calcularItemCentavos("2.500", "3.25"), 813n, "rounds line amount to cents using half-up rounding");
assert.equal(calcularItemCentavos("0.500", "0.01"), 1n, "rounds a half cent upward");
assert.equal(centavosComoDecimal(813n), "8.13");
assert.equal(validarDataCalendario("2024-02-29"), true);
assert.equal(validarDataCalendario("2025-02-29"), false);

const pedido = {
  fornecedor: "Fornecedor informado",
  dataPedido: "2026-10-20",
  observacoes: "",
  total: 999999,
  itens: [
    { produtoId: "produto-a", quantidade: "2.500", custoUnitario: "3.25" },
    { produtoId: "produto-b", quantidade: "0.500", custoUnitario: "0.01" },
  ],
};
assert.deepEqual(validarPedidoCompra(pedido), [], "accepts valid order and ignores client-supplied total");
assert.ok(validarPedidoCompra({ ...pedido, itens: [] }).some((erro) => erro.campo === "itens"));
assert.ok(validarPedidoCompra({ ...pedido, itens: [{ ...pedido.itens[0], quantidade: "-1" }] }).some((erro) => erro.campo === "itens.0.quantidade"));
assert.ok(validarPedidoCompra({ ...pedido, itens: [{ ...pedido.itens[0], custoUnitario: "1.999" }] }).some((erro) => erro.campo === "itens.0.custoUnitario"));
assert.ok(validarPedidoCompra({ ...pedido, dataPedido: "2026-02-30" }).some((erro) => erro.campo === "dataPedido"));

const ids = ["item-a", "item-b"];
assert.deepEqual(validarRecebimentoPedido({ dataEntrada: "2026-10-20", itens: [{ itemId: "item-a", dataValidade: null }, { itemId: "item-b", dataValidade: "2027-01-01" }] }, ids), []);
assert.ok(validarRecebimentoPedido({ dataEntrada: "2026-10-20", itens: [{ itemId: "item-a", dataValidade: null }] }, ids).length > 0, "rejects partial receipt");
assert.ok(validarRecebimentoPedido({ dataEntrada: "2026-10-20", itens: [{ itemId: "item-a", dataValidade: null }, { itemId: "item-a", dataValidade: null }] }, ids).length > 0, "rejects duplicate item ids");

assert.equal(validarTransicaoPedido("PENDENTE", "RECEBIDO"), true);
assert.equal(validarTransicaoPedido("PENDENTE", "CANCELADO"), true);
assert.equal(validarTransicaoPedido("RECEBIDO", "CANCELADO"), false);
assert.equal(validarTransicaoPedido("CANCELADO", "RECEBIDO"), false);
console.log("PASS: purchase calculations, input validation, receipt completeness, and status transitions");
