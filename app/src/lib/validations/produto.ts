/**
 * PratoCerto — Validação e tipos de Produto
 *
 * Validação server-side dos dados de produto.
 * Nunca confiar somente na validação do cliente.
 */

export interface ProdutoInput {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueIdeal: number;
  custoReferencia?: number | null;
}

export interface ProdutoValidationError {
  campo: string;
  mensagem: string;
}

/**
 * Valida os dados de entrada de um produto.
 * Retorna lista de erros (vazia se tudo estiver correto).
 */
export function validarProduto(data: unknown): ProdutoValidationError[] {
  const erros: ProdutoValidationError[] = [];

  if (!data || typeof data !== "object") {
    return [{ campo: "geral", mensagem: "Dados inválidos." }];
  }

  const d = data as Record<string, unknown>;

  // Nome
  if (!d.nome || typeof d.nome !== "string" || d.nome.trim().length === 0) {
    erros.push({ campo: "nome", mensagem: "Nome é obrigatório." });
  } else if (d.nome.trim().length > 200) {
    erros.push({ campo: "nome", mensagem: "Nome deve ter no máximo 200 caracteres." });
  }

  // Categoria
  if (!d.categoria || typeof d.categoria !== "string" || d.categoria.trim().length === 0) {
    erros.push({ campo: "categoria", mensagem: "Categoria é obrigatória." });
  } else if (d.categoria.trim().length > 100) {
    erros.push({ campo: "categoria", mensagem: "Categoria deve ter no máximo 100 caracteres." });
  }

  // Unidade de medida
  if (!d.unidadeMedida || typeof d.unidadeMedida !== "string" || d.unidadeMedida.trim().length === 0) {
    erros.push({ campo: "unidadeMedida", mensagem: "Unidade de medida é obrigatória." });
  } else if (d.unidadeMedida.trim().length > 50) {
    erros.push({ campo: "unidadeMedida", mensagem: "Unidade de medida deve ter no máximo 50 caracteres." });
  }

  // Estoque mínimo
  const estoqueMinimo = Number(d.estoqueMinimo);
  if (d.estoqueMinimo === undefined || d.estoqueMinimo === null || d.estoqueMinimo === "") {
    erros.push({ campo: "estoqueMinimo", mensagem: "Estoque mínimo é obrigatório." });
  } else if (isNaN(estoqueMinimo) || estoqueMinimo < 0) {
    erros.push({ campo: "estoqueMinimo", mensagem: "Estoque mínimo deve ser um número maior ou igual a zero." });
  }

  // Estoque ideal
  const estoqueIdeal = Number(d.estoqueIdeal);
  if (d.estoqueIdeal === undefined || d.estoqueIdeal === null || d.estoqueIdeal === "") {
    erros.push({ campo: "estoqueIdeal", mensagem: "Estoque ideal é obrigatório." });
  } else if (isNaN(estoqueIdeal) || estoqueIdeal < 0) {
    erros.push({ campo: "estoqueIdeal", mensagem: "Estoque ideal deve ser um número maior ou igual a zero." });
  } else if (!isNaN(estoqueMinimo) && estoqueIdeal < estoqueMinimo) {
    erros.push({ campo: "estoqueIdeal", mensagem: "Estoque ideal deve ser maior ou igual ao estoque mínimo." });
  }

  // Custo de referência (opcional)
  if (d.custoReferencia !== undefined && d.custoReferencia !== null && d.custoReferencia !== "") {
    const custo = Number(d.custoReferencia);
    if (isNaN(custo) || custo < 0) {
      erros.push({ campo: "custoReferencia", mensagem: "Custo de referência deve ser um número positivo." });
    }
  }

  return erros;
}

/**
 * Sanitiza os dados de produto após validação bem-sucedida.
 */
export function sanitizarProduto(data: Record<string, unknown>): ProdutoInput {
  return {
    nome: String(data.nome).trim(),
    categoria: String(data.categoria).trim(),
    unidadeMedida: String(data.unidadeMedida).trim(),
    estoqueMinimo: Number(data.estoqueMinimo),
    estoqueIdeal: Number(data.estoqueIdeal),
    custoReferencia:
      data.custoReferencia !== undefined &&
      data.custoReferencia !== null &&
      data.custoReferencia !== ""
        ? Number(data.custoReferencia)
        : null,
  };
}
