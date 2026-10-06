/**
 * PratoCerto — Utilitários de Autenticação e Sessão
 *
 * - Hash seguro de senhas com bcryptjs
 * - Criação e verificação de tokens JWT com jose
 * - Gerenciamento de cookies HTTP-Only de sessão
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "pratocerto_session";

export type PerfilUsuario = "GERENTE" | "FUNCIONARIO";

export interface UserSession {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

/**
 * Obtém a chave secreta para assinatura dos tokens JWT.
 * AUTH_SECRET deve ser definido no .env — nunca hardcoded em produção.
 */
function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "pratocerto-secret-key-development-minimum-32-chars-long";
  return new TextEncoder().encode(secret);
}

/**
 * Garante que um valor string seja um PerfilUsuario válido.
 */
export function validarPerfil(perfil: string): PerfilUsuario {
  if (perfil === "GERENTE" || perfil === "FUNCIONARIO") return perfil;
  return "FUNCIONARIO";
}

/**
 * Gera o hash seguro de uma senha em texto puro usando bcrypt (fator de custo 12).
 */
export async function hashSenha(senhaPura: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(senhaPura, salt);
}

/**
 * Compara uma senha em texto puro com o hash salvo no banco.
 * Protegido contra timing attacks.
 */
export async function verificarSenha(
  senhaPura: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senhaPura, hash);
}

/**
 * Cria um token JWT assinado contendo os dados essenciais da sessão.
 * Validade: 7 dias.
 */
export async function criarTokenSessao(
  usuario: UserSession
): Promise<string> {
  return new SignJWT({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

/**
 * Verifica e decodifica um token JWT assinado.
 * Retorna os dados da sessão ou null se o token for inválido/expirado.
 */
export async function verificarTokenSessao(
  token: string
): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return {
      id: String(payload.id),
      nome: String(payload.nome),
      email: String(payload.email),
      perfil: validarPerfil(String(payload.perfil)),
    };
  } catch {
    return null;
  }
}

/**
 * Obtém a sessão atual a partir dos cookies da requisição
 * (para Server Components e Server Actions).
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarTokenSessao(token);
}
