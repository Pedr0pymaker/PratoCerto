/**
 * PratoCerto — Validações de Usuário e Autenticação
 */

export type PerfilUsuario = "GERENTE" | "FUNCIONARIO";

export interface LoginInput {
  email: string;
  senha: string;
}

export interface NovoUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
}

export interface ValidationError {
  campo: string;
  mensagem: string;
}

/**
 * Valida dados de login.
 */
export function validarLogin(data: unknown): ValidationError[] {
  const erros: ValidationError[] = [];
  if (!data || typeof data !== "object") {
    return [{ campo: "geral", mensagem: "Dados inválidos." }];
  }

  const d = data as Record<string, unknown>;

  if (!d.email || typeof d.email !== "string" || d.email.trim().length === 0) {
    erros.push({ campo: "email", mensagem: "O email é obrigatório." });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
    erros.push({ campo: "email", mensagem: "Informe um email válido." });
  }

  if (!d.senha || typeof d.senha !== "string" || d.senha.length === 0) {
    erros.push({ campo: "senha", mensagem: "A senha é obrigatória." });
  }

  return erros;
}

/**
 * Valida dados de cadastro de novo usuário.
 */
export function validarNovoUsuario(data: unknown): ValidationError[] {
  const erros: ValidationError[] = [];
  if (!data || typeof data !== "object") {
    return [{ campo: "geral", mensagem: "Dados inválidos." }];
  }

  const d = data as Record<string, unknown>;

  if (!d.nome || typeof d.nome !== "string" || d.nome.trim().length === 0) {
    erros.push({ campo: "nome", mensagem: "O nome é obrigatório." });
  } else if (d.nome.trim().length > 150) {
    erros.push({
      campo: "nome",
      mensagem: "O nome deve ter no máximo 150 caracteres.",
    });
  }

  if (!d.email || typeof d.email !== "string" || d.email.trim().length === 0) {
    erros.push({ campo: "email", mensagem: "O email é obrigatório." });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
    erros.push({ campo: "email", mensagem: "Informe um email válido." });
  } else if (d.email.trim().length > 150) {
    erros.push({
      campo: "email",
      mensagem: "O email deve ter no máximo 150 caracteres.",
    });
  }

  if (!d.senha || typeof d.senha !== "string" || d.senha.length === 0) {
    erros.push({ campo: "senha", mensagem: "A senha é obrigatória." });
  } else if (d.senha.length < 6) {
    erros.push({
      campo: "senha",
      mensagem: "A senha deve conter pelo menos 6 caracteres.",
    });
  }

  if (
    !d.perfil ||
    (d.perfil !== "GERENTE" && d.perfil !== "FUNCIONARIO")
  ) {
    erros.push({
      campo: "perfil",
      mensagem: "Perfil inválido. Escolha GERENTE ou FUNCIONARIO.",
    });
  }

  return erros;
}
