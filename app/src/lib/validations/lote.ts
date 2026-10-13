/**
 * PratoCerto — Validação de Lote de Estoque / Entrada de Mercadoria
 *
 * Validação server-side dos dados de entrada de estoque.
 * Garante que quantidades sejam > 0, custos >= 0 e datas válidas.
 */

export interface EntradaEstoqueInput {
  produtoId: string;
  quantidade: number;
  dataEntrada: string;
  dataValidade?: string | null;
  custoUnitario?: number | null;
}

export interface LoteValidationError {
  campo: string;
  mensagem: string;
}

/**
 * Valida os dados de entrada de um novo lote de estoque.
 */
export function validarEntradaEstoque(data: unknown): LoteValidationError[] {
  const erros: LoteValidationError[] = [];

  if (!data || typeof data !== "object") {
    return [{ campo: "geral", mensagem: "Dados inválidos." }];
  }

  const d = data as Record<string, unknown>;

  // Produto ID
  if (!d.produtoId || typeof d.produtoId !== "string" || d.produtoId.trim().length === 0) {
    erros.push({ campo: "produtoId", mensagem: "Selecione um produto válido." });
  }

  // Quantidade recebida
  const quantidade = Number(d.quantidade);
  if (d.quantidade === undefined || d.quantidade === null || d.quantidade === "") {
    erros.push({ campo: "quantidade", mensagem: "A quantidade é obrigatória." });
  } else if (isNaN(quantidade)) {
    erros.push({ campo: "quantidade", mensagem: "A quantidade deve ser um número válido." });
  } else if (quantidade <= 0) {
    erros.push({ campo: "quantidade", mensagem: "A quantidade deve ser maior que zero." });
  }

  // Data de entrada
  if (!d.dataEntrada || typeof d.dataEntrada !== "string" || d.dataEntrada.trim().length === 0) {
    erros.push({ campo: "dataEntrada", mensagem: "A data de entrada é obrigatória." });
  } else {
    const dataObj = new Date(d.dataEntrada);
    if (isNaN(dataObj.getTime())) {
      erros.push({ campo: "dataEntrada", mensagem: "Data de entrada inválida." });
    }
  }

  // Data de validade (opcional)
  if (d.dataValidade !== undefined && d.dataValidade !== null && d.dataValidade !== "") {
    if (typeof d.dataValidade !== "string") {
      erros.push({ campo: "dataValidade", mensagem: "Data de validade inválida." });
    } else {
      const validadeObj = new Date(d.dataValidade);
      if (isNaN(validadeObj.getTime())) {
        erros.push({ campo: "dataValidade", mensagem: "Data de validade inválida." });
      }
    }
  }

  // Custo unitário (opcional)
  if (d.custoUnitario !== undefined && d.custoUnitario !== null && d.custoUnitario !== "") {
    const custo = Number(d.custoUnitario);
    if (isNaN(custo)) {
      erros.push({ campo: "custoUnitario", mensagem: "O custo unitário deve ser um número válido." });
    } else if (custo < 0) {
      erros.push({ campo: "custoUnitario", mensagem: "O custo unitário não pode ser negativo." });
    }
  }

  return erros;
}

/**
 * Sanitiza e formata os dados após validação.
 */
export function sanitizarEntradaEstoque(d: Record<string, unknown>) {
  return {
    produtoId: String(d.produtoId).trim(),
    quantidade: Number(d.quantidade),
    dataEntrada: new Date(String(d.dataEntrada)),
    dataValidade:
      d.dataValidade && String(d.dataValidade).trim() !== ""
        ? new Date(String(d.dataValidade))
        : null,
    custoUnitario:
      d.custoUnitario !== undefined && d.custoUnitario !== null && d.custoUnitario !== ""
        ? Number(d.custoUnitario)
        : null,
  };
}
