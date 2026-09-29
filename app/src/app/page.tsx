import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PratoCerto — Gestão de Estoque para Restaurantes",
  description:
    "Reduza desperdícios e controle seu estoque com inteligência. Feito para restaurantes, lanchonetes e padarias.",
};

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "28px" }} aria-hidden="true">
            🍽️
          </span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--color-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            PratoCerto
          </span>
        </div>
        <nav aria-label="Navegação principal">
          <Link
            href="/dashboard"
            id="btn-acessar-sistema"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--color-primary)",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
              transition: "background var(--transition)",
            }}
          >
            Acessar sistema →
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        aria-labelledby="hero-title"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 60px",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #fff7ed 100%)",
        }}
      >
        {/* Badge */}
        <span
          style={{
            display: "inline-block",
            background: "#dcfce7",
            color: "#15803d",
            border: "1px solid #86efac",
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "28px",
            letterSpacing: "0.2px",
          }}
        >
          🌱 Reduza desperdícios. Economize com inteligência.
        </span>

        <h1
          id="hero-title"
          style={{
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 800,
            lineHeight: 1.1,
            color: "var(--color-text)",
            margin: "0 0 20px",
            letterSpacing: "-1px",
            maxWidth: "720px",
          }}
        >
          Gestão de estoque{" "}
          <span style={{ color: "var(--color-primary)" }}>para o seu restaurante</span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "var(--color-text-muted)",
            maxWidth: "540px",
            lineHeight: 1.7,
            margin: "0 0 40px",
          }}
        >
          O PratoCerto ajuda restaurantes, lanchonetes e padarias a controlar o
          estoque com precisão, registrar perdas e evitar desperdícios —{" "}
          <strong style={{ color: "var(--color-text)" }}>de forma simples e acessível</strong>.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/dashboard"
            id="btn-hero-dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-primary)",
              color: "#ffffff",
              padding: "14px 28px",
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
              transition: "all var(--transition)",
            }}
          >
            📊 Ir para o Dashboard
          </Link>

          <Link
            href="/estoque"
            id="btn-hero-estoque"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              padding: "14px 28px",
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 600,
              border: "1.5px solid var(--color-border)",
              transition: "all var(--transition)",
            }}
          >
            📦 Ver Estoque
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        aria-labelledby="features-title"
        style={{
          padding: "64px 24px",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            id="features-title"
            style={{
              textAlign: "center",
              fontSize: "28px",
              fontWeight: 700,
              margin: "0 0 48px",
              color: "var(--color-text)",
            }}
          >
            Tudo que seu estabelecimento precisa
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        role="contentinfo"
        style={{
          padding: "24px 32px",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          © 2026 PratoCerto — Gestão de Estoque para Alimentação
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-light)" }}>
          Etapa 1 — Estrutura inicial do projeto
        </p>
      </footer>
    </div>
  );
}

/* ============================================================
   Sub-componentes locais
   ============================================================ */

interface Feature {
  icon: string;
  title: string;
  description: string;
  href: string;
}

const features: Feature[] = [
  {
    icon: "📊",
    title: "Dashboard",
    description:
      "Visão geral do estoque, alertas de vencimento e produtos abaixo do mínimo em um só lugar.",
    href: "/dashboard",
  },
  {
    icon: "📦",
    title: "Controle de Estoque",
    description:
      "Cadastro de produtos, movimentações, entradas e saídas com histórico completo.",
    href: "/estoque",
  },
  {
    icon: "⚠️",
    title: "Registro de Perdas",
    description:
      "Registre perdas por vencimento, deterioração ou acidente e acompanhe o impacto financeiro.",
    href: "/perdas",
  },
  {
    icon: "🛒",
    title: "Gestão de Compras",
    description:
      "Registre entradas por nota fiscal, organize fornecedores e controle o valor investido.",
    href: "/compras",
  },
  {
    icon: "🍽️",
    title: "Fichas Técnicas",
    description:
      "Cadastre receitas com ingredientes e quantidades para automatizar o controle de consumo.",
    href: "/receitas",
  },
  {
    icon: "📈",
    title: "Relatórios",
    description:
      "Análises de desperdício, consumo e estoque por período, produto e categoria.",
    href: "/relatorios",
  },
  {
    icon: "🤖",
    title: "PratoCerto IA",
    description:
      "Assistente inteligente que analisa seus dados e sugere ações para reduzir perdas.",
    href: "/ia",
  },
  {
    icon: "📱",
    title: "Interface Mobile",
    description:
      "Acesse pelo celular com uma interface simplificada para operações rápidas no dia a dia.",
    href: "/dashboard",
  },
];

function FeatureCard({ icon, title, description, href }: Feature) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "24px",
        borderRadius: "12px",
        border: "1.5px solid var(--color-border)",
        background: "var(--color-surface)",
        textDecoration: "none",
        transition: "all 0.2s ease",
        color: "inherit",
      }}
      className="feature-card"
    >
      <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }} aria-hidden="true">
        {icon}
      </span>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--color-text)",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      <style>{`
        .feature-card:hover {
          border-color: var(--color-primary) !important;
          box-shadow: 0 4px 16px rgba(22,163,74,0.12) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </Link>
  );
}
