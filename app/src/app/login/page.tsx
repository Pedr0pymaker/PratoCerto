"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || "Credenciais inválidas. Verifique seu email e senha.");
        return;
      }

      // Login bem-sucedido -> redireciona
      router.push(from);
      router.refresh();
    } catch {
      setErro("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--color-surface)",
          border: "1.5px solid var(--color-border)",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#dcfce7",
              fontSize: "26px",
              marginBottom: "12px",
            }}
            aria-hidden="true"
          >
            🍽️
          </div>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.5px",
            }}
          >
            PratoCerto
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
            Gestão inteligente de estoque para alimentação
          </p>
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              color: "#991b1b",
              fontWeight: 500,
            }}
          >
            <span aria-hidden="true">⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label
                htmlFor="campo-email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                id="campo-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@restaurante.com"
                required
                disabled={carregando}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "var(--color-text)",
                  background: "var(--color-surface)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="campo-senha"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  marginBottom: "6px",
                }}
              >
                Senha
              </label>
              <input
                id="campo-senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                disabled={carregando}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "var(--color-text)",
                  background: "var(--color-surface)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              id="btn-entrar"
              type="submit"
              disabled={carregando}
              style={{
                width: "100%",
                background: carregando ? "#86efac" : "var(--color-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: carregando ? "not-allowed" : "pointer",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background var(--transition)",
              }}
            >
              {carregando ? (
                <>
                  <span aria-hidden="true" style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>
                    ⏳
                  </span>
                  Entrando...
                </>
              ) : (
                "Entrar no sistema"
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
