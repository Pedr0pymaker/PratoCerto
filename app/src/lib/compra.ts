export const STATUS_PEDIDO_COMPRA = ["PENDENTE", "RECEBIDO", "CANCELADO"] as const;
export type StatusPedidoCompra = (typeof STATUS_PEDIDO_COMPRA)[number];

export interface ItemPedidoInput {
  produtoId: string;
  quantidade: string;
  custoUnitario: string;
}

export interface PedidoCompraInput {
  fornecedor: string | null;
  dataPedido: string;
  observacoes: string | null;
  itens: ItemPedidoInput[];
}

export interface ErroValidacaoCompra {
  campo: string;
  mensagem: string;
}

const MAX_CENTAVOS_PEDIDO = BigInt("999999999999");

function valorDecimalEscalado(valor: unknown, casas: number): bigint | null {
  if (typeof valor !== "string" || !/^\d+(?:\.\d+)?$/.test(valor)) return null;
  const [inteiro, fracao = ""] = valor.split(".");
  if (fracao.length > casas) return null;
  return BigInt(inteiro) * BigInt(10 ** casas) + BigInt(fracao.padEnd(casas, "0") || "0");
}

export function validarDataCalendario(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export function validarPedidoCompra(entrada: unknown): ErroValidacaoCompra[] {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return [{ campo: "geral", mensagem: "Dados do pedido inválidos." }];
  }
  const dados = entrada as Record<string, unknown>;
  const erros: ErroValidacaoCompra[] = [];

  if (!validarDataCalendario(dados.dataPedido)) {
    erros.push({ campo: "dataPedido", mensagem: "Informe uma data de pedido válida." });
  }
  if (dados.fornecedor !== undefined && dados.fornecedor !== null && typeof dados.fornecedor !== "string") {
    erros.push({ campo: "fornecedor", mensagem: "Fornecedor inválido." });
  } else if (typeof dados.fornecedor === "string" && dados.fornecedor.trim().length > 200) {
    erros.push({ campo: "fornecedor", mensagem: "O fornecedor deve ter até 200 caracteres." });
  }
  if (dados.observacoes !== undefined && dados.observacoes !== null && typeof dados.observacoes !== "string") {
    erros.push({ campo: "observacoes", mensagem: "Observações inválidas." });
  } else if (typeof dados.observacoes === "string" && dados.observacoes.trim().length > 500) {
    erros.push({ campo: "observacoes", mensagem: "As observações devem ter até 500 caracteres." });
  }

  if (!Array.isArray(dados.itens) || dados.itens.length === 0 || dados.itens.length > 100) {
    erros.push({ campo: "itens", mensagem: "Inclua de 1 a 100 itens no pedido." });
    return erros;
  }

  let totalCentavos = BigInt(0);
  dados.itens.forEach((item, index) => {
    const prefixo = `itens.${index}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      erros.push({ campo: prefixo, mensagem: "Item inválido." });
      return;
    }
    const linha = item as Record<string, unknown>;
    if (typeof linha.produtoId !== "string" || linha.produtoId.trim() === "") {
      erros.push({ campo: `${prefixo}.produtoId`, mensagem: "Selecione um produto." });
    }
    const quantidadeMili = valorDecimalEscalado(linha.quantidade, 3);
    if (quantidadeMili === null || quantidadeMili <= BigInt(0) || quantidadeMili > BigInt("9999999999")) {
      erros.push({ campo: `${prefixo}.quantidade`, mensagem: "Use uma quantidade maior que zero com até 3 casas decimais." });
    }
    const custoCentavos = valorDecimalEscalado(linha.custoUnitario, 2);
    if (custoCentavos === null || custoCentavos > BigInt("9999999999")) {
      erros.push({ campo: `${prefixo}.custoUnitario`, mensagem: "Informe um custo não negativo com até 2 casas decimais." });
    }
    if (quantidadeMili !== null && custoCentavos !== null) {
      totalCentavos += (quantidadeMili * custoCentavos + BigInt(500)) / BigInt(1000);
    }
  });

  if (totalCentavos > MAX_CENTAVOS_PEDIDO) {
    erros.push({ campo: "itens", mensagem: "O total do pedido excede o limite permitido." });
  }
  return erros;
}

export function calcularItemCentavos(quantidade: string, custoUnitario: string): bigint {
  const quantidadeMili = valorDecimalEscalado(quantidade, 3);
  const custoCentavos = valorDecimalEscalado(custoUnitario, 2);
  if (quantidadeMili === null || custoCentavos === null) {
    throw new Error("Valores do item inválidos.");
  }
  return (quantidadeMili * custoCentavos + BigInt(500)) / BigInt(1000);
}

export function centavosComoDecimal(centavos: bigint): string {
  const base = BigInt(100);
  const absoluto = centavos < BigInt(0) ? -centavos : centavos;
  const inteiro = absoluto / base;
  const fracao = String(absoluto % base).padStart(2, "0");
  return `${centavos < BigInt(0) ? "-" : ""}${inteiro}.${fracao}`;
}

export function validarTransicaoPedido(
  atual: StatusPedidoCompra,
  destino: StatusPedidoCompra
): boolean {
  return atual === "PENDENTE" && (destino === "RECEBIDO" || destino === "CANCELADO");
}

export interface ItemRecebimentoInput {
  itemId: string;
  dataValidade: string | null;
}

export function validarRecebimentoPedido(
  entrada: unknown,
  idsItensEsperados: string[]
): ErroValidacaoCompra[] {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return [{ campo: "geral", mensagem: "Dados de recebimento inválidos." }];
  }
  const dados = entrada as Record<string, unknown>;
  const erros: ErroValidacaoCompra[] = [];
  if (!validarDataCalendario(dados.dataEntrada)) {
    erros.push({ campo: "dataEntrada", mensagem: "Informe uma data de entrada válida." });
  }
  if (!Array.isArray(dados.itens) || dados.itens.length !== idsItensEsperados.length) {
    return [...erros, { campo: "itens", mensagem: "O recebimento deve incluir todos os itens do pedido." }];
  }
  const idsRecebidos = new Set<string>();
  for (const [index, item] of dados.itens.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      erros.push({ campo: `itens.${index}`, mensagem: "Item de recebimento inválido." });
      continue;
    }
    const linha = item as Record<string, unknown>;
    if (typeof linha.itemId !== "string" || !idsItensEsperados.includes(linha.itemId) || idsRecebidos.has(linha.itemId)) {
      erros.push({ campo: `itens.${index}.itemId`, mensagem: "A lista de itens do recebimento não corresponde ao pedido." });
    } else {
      idsRecebidos.add(linha.itemId);
    }
    if (linha.dataValidade !== null && linha.dataValidade !== "" && !validarDataCalendario(linha.dataValidade)) {
      erros.push({ campo: `itens.${index}.dataValidade`, mensagem: "Data de validade inválida." });
    }
  }
  if (idsRecebidos.size !== idsItensEsperados.length) {
    erros.push({ campo: "itens", mensagem: "O recebimento deve incluir cada item exatamente uma vez." });
  }
  return erros;
}

export function dataCompraUtc(data: string): Date {
  return new Date(`${data}T00:00:00.000Z`);
}

export function sanitizarPedidoCompra(entrada: unknown): PedidoCompraInput {
  const dados = entrada as Record<string, unknown>;
  return {
    fornecedor: typeof dados.fornecedor === "string" && dados.fornecedor.trim() ? dados.fornecedor.trim() : null,
    dataPedido: String(dados.dataPedido),
    observacoes: typeof dados.observacoes === "string" && dados.observacoes.trim() ? dados.observacoes.trim() : null,
    itens: (dados.itens as Record<string, unknown>[]).map((item) => ({
      produtoId: String(item.produtoId).trim(),
      quantidade: String(item.quantidade),
      custoUnitario: String(item.custoUnitario),
    })),
  };
}
