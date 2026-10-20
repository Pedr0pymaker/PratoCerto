import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const helperPath = fileURLToPath(
  new URL("../src/lib/auth-secret.ts", import.meta.url)
);
const source = await readFile(helperPath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const helperModule = { exports: {} };
const runtimeProcess = { env: {} };
new Function("exports", "process", "TextEncoder", compiled)(
  helperModule.exports,
  runtimeProcess,
  TextEncoder
);

const { getAuthSecret, MIN_AUTH_SECRET_BYTES } = helperModule.exports;
const developmentSecret =
  "pratocerto-secret-key-development-minimum-32-chars-long";

function assertRejected(environment, message) {
  runtimeProcess.env = environment;
  assert.throws(() => getAuthSecret(), Error, message);
}

assertRejected(
  { NODE_ENV: "production", PRATOCERTO_ENV: "production" },
  "absent production secret is rejected"
);
assertRejected(
  {
    NODE_ENV: "production",
    PRATOCERTO_ENV: "production",
    AUTH_SECRET: "short",
  },
  "short production secret is rejected"
);
assertRejected(
  {
    NODE_ENV: "production",
    PRATOCERTO_ENV: "production",
    AUTH_SECRET: developmentSecret,
  },
  "explicit development secret is rejected in production"
);

const validProductionSecret = randomBytes(MIN_AUTH_SECRET_BYTES).toString("hex");
runtimeProcess.env = {
  NODE_ENV: "production",
  PRATOCERTO_ENV: "production",
  AUTH_SECRET: validProductionSecret,
};
assert.deepEqual(
  getAuthSecret(),
  new TextEncoder().encode(validProductionSecret),
  "random production secret is accepted"
);

runtimeProcess.env = {
  NODE_ENV: "development",
  PRATOCERTO_ENV: "local",
};
assert.equal(
  new TextDecoder().decode(getAuthSecret()),
  developmentSecret,
  "development fallback is available in explicitly marked local mode"
);

assertRejected(
  { NODE_ENV: "development" },
  "development NODE_ENV alone cannot enable the fallback"
);

console.log("PASS: AUTH_SECRET environment validation scenarios");
