/**
 * PratoCerto — Validação de Perda (Desperdício)
 *
 * Validação server-side dos dados de registro de perda.
 * Garante que quantidade seja > 0, motivo seja válido e produto exista.
 */

export const MOTIVOS_PERDA = [
  "VENCIMENTO",
  "DETERIORACAO",
  "SOBRA",
  "PREPARO_ACIDENTE",
  "OUTRO",
] as const;

export type MotivoPerda = (typeof MOTIVOS_PERDA)[number];

export const MOTIVOS_PERDA_LABELS: Record<MotivoPerda, string> = {
  VENCIMENTO: "Vencimento",
  DETERIORACAO: "Deterioração",
  SOBRA: "Sobra",
  PREPARO_ACIDENTE: "Preparo / Acidente",
  OUTRO: "Outro",
};

export interface PerdaInput {
  produtoId: string;
  quantidade: number;
  motivo: MotivoPerda;
  observacao?: string | null;
}

export interface PerdaValidationError {
  campo: string;
  mensagem: string;
}

/**
 * Valida os dados de entrada de um registro de perda.
 * Retorna lista de erros (vazia se tudo estiver correto).
 */
export function validarPerda(data: unknown): PerdaValidationError[] {
  const erros: PerdaValidationError[] = [];

  if (!data || typeof data !== "object") {
    return [{ campo: "geral", mensagem: "Dados inválidos." }];
  }

  const d = data as Record<string, unknown>;

  // Produto ID
  if (!d.produtoId || typeof d.produtoId !== "string" || d.produtoId.trim().length === 0) {
    erros.push({ campo: "produtoId", mensagem: "Selecione um produto válido." });
  }

  // Quantidade perdida
  const quantidade = Number(d.quantidade);
  if (d.quantidade === undefined || d.quantidade === null || d.quantidade === "") {
    erros.push({ campo: "quantidade", mensagem: "A quantidade é obrigatória." });
  } else if (isNaN(quantidade)) {
    erros.push({ campo: "quantidade", mensagem: "A quantidade deve ser um número válido." });
  } else if (quantidade <= 0) {
    erros.push({ campo: "quantidade", mensagem: "A quantidade deve ser maior que zero." });
  }

  // Motivo
  if (!d.motivo || typeof d.motivo !== "string") {
    erros.push({ campo: "motivo", mensagem: "O motivo da perda é obrigatório." });
  } else if (!MOTIVOS_PERDA.includes(d.motivo as MotivoPerda)) {
    erros.push({
      campo: "motivo",
      mensagem: `Motivo inválido. Opções: ${MOTIVOS_PERDA.join(", ")}.`,
    });
  }

  // Observação (opcional)
  if (d.observacao !== undefined && d.observacao !== null && d.observacao !== "") {
    if (typeof d.observacao !== "string") {
      erros.push({ campo: "observacao", mensagem: "Observação deve ser um texto." });
    } else if (d.observacao.trim().length > 500) {
      erros.push({ campo: "observacao", mensagem: "Observação deve ter no máximo 500 caracteres." });
    }
  }

  return erros;
}

/**
 * Sanitiza e formata os dados após validação.
 */
export function sanitizarPerda(d: Record<string, unknown>): PerdaInput {
  return {
    produtoId: String(d.produtoId).trim(),
    quantidade: Number(d.quantidade),
    motivo: String(d.motivo) as MotivoPerda,
    observacao:
      d.observacao !== undefined && d.observacao !== null && String(d.observacao).trim() !== ""
        ? String(d.observacao).trim()
        : null,
  };
}
