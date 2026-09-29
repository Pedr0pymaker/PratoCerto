/**
 * PratoCerto — Cliente Prisma (singleton)
 *
 * Em desenvolvimento, o hot-reload do Next.js pode criar múltiplas instâncias
 * do PrismaClient. Este padrão garante que apenas uma instância seja criada,
 * evitando warnings de "too many connections".
 *
 * Documentação: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Verifica se a variável de ambiente do banco está configurada.
 * Útil para exibir mensagens de erro claras durante o desenvolvimento.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
