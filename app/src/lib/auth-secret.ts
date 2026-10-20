/**
 * Centraliza a validação do segredo JWT para Node.js e Edge Runtime.
 * Este módulo usa apenas APIs Web para também poder ser importado pelo middleware.
 */

const DEVELOPMENT_AUTH_SECRET =
  "pratocerto-secret-key-development-minimum-32-chars-long";

export const MIN_AUTH_SECRET_BYTES = 32;

/**
 * Obtém o segredo de sessão. O valor de desenvolvimento só é permitido em
 * execução local explicitamente marcada pelo script `npm run dev`.
 */
export function getAuthSecret(): Uint8Array {
  const configuredSecret = process.env.AUTH_SECRET;
  const isVercelDeployment = Boolean(
    process.env.VERCEL || process.env.VERCEL_ENV
  );
  const isLocalDevelopment =
    process.env.PRATOCERTO_ENV === "local" &&
    process.env.NODE_ENV === "development" &&
    !isVercelDeployment;
  const isProduction =
    process.env.PRATOCERTO_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  let secret: string;
  if (configuredSecret?.trim()) {
    if (configuredSecret === DEVELOPMENT_AUTH_SECRET && !isLocalDevelopment) {
      throw new Error(
        "The development AUTH_SECRET is not allowed outside local development."
      );
    }
    secret = configuredSecret;
  } else if (isLocalDevelopment && !isProduction) {
    secret = DEVELOPMENT_AUTH_SECRET;
  } else {
    throw new Error("AUTH_SECRET must be configured for this environment.");
  }

  const secretBytes = new TextEncoder().encode(secret);
  if (secretBytes.byteLength < MIN_AUTH_SECRET_BYTES) {
    throw new Error(
      `AUTH_SECRET must contain at least ${MIN_AUTH_SECRET_BYTES} bytes.`
    );
  }

  return secretBytes;
}
