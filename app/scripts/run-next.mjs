import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);
const supportedCommands = new Set(["dev", "build", "start"]);

if (!supportedCommands.has(command)) {
  console.error("Use este script com dev, build ou start.");
  process.exit(1);
}

if (command === "dev") {
  const deploymentDetected = Boolean(
    process.env.NODE_ENV === "production" ||
      process.env.VERCEL ||
      process.env.VERCEL_ENV
  );

  if (!deploymentDetected && !process.env.PRATOCERTO_ENV) {
    process.env.PRATOCERTO_ENV = "local";
  }
} else {
  process.env.PRATOCERTO_ENV = "production";
}

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url)
);
const child = spawn(process.execPath, [nextCli, command, ...args], {
  env: process.env,
  stdio: "inherit",
});

child.on("error", () => {
  console.error("Não foi possível iniciar o comando do Next.js.");
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
