import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — PratoCerto",
  description: "Visão geral do estoque, alertas e indicadores do seu estabelecimento.",
};

export default function DashboardPage() {
  return (
    <div>
      {/* Cabeçalho da página */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Visão geral do seu estabelecimento
        </p>
      </div>

      {/* Aviso de etapa inicial */}
      <div
        role="status"
        style={{
          background: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "20px", flexShrink: 0 }} aria-hidden="true">⚠️</span>
        <div>
          <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "14px", color: "#92400e" }}>
            Etapa 1 — Estrutura inicial
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
            O dashboard ainda não está conectado ao banco de dados. Os indicadores
            abaixo são estruturais e serão implementados nas próximas etapas.
          </p>
        </div>
      </div>

      {/* Cards de KPIs (estrutura, sem dados reais) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <KpiCard
          icon="📦"
          label="Produtos cadastrados"
          value="—"
          description="Aguardando banco de dados"
          color="var(--color-primary)"
        />
        <KpiCard
          icon="⚠️"
          label="Abaixo do mínimo"
          value="—"
          description="Aguardando banco de dados"
          color="var(--color-warning)"
        />
        <KpiCard
          icon="🗓️"
          label="Vencem em 7 dias"
          value="—"
          description="Aguardando banco de dados"
          color="var(--color-accent)"
        />
        <KpiCard
          icon="📉"
          label="Perdas este mês"
          value="—"
          description="Aguardando banco de dados"
          color="var(--color-danger)"
        />
      </div>

      {/* Seções de alertas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        <EmptySection
          title="Produtos próximos do vencimento"
          icon="🗓️"
          message="Os alertas de vencimento aparecerão aqui após a conexão com o banco de dados e o cadastro de produtos."
        />
        <EmptySection
          title="Produtos abaixo do estoque mínimo"
          icon="📦"
          message="Os alertas de reposição aparecerão aqui após o cadastro de produtos com estoque mínimo definido."
        />
      </div>
    </div>
  );
}

/* ============================================================
   Sub-componentes locais
   ============================================================ */

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  description: string;
  color: string;
}

function KpiCard({ icon, label, value, description, color }: KpiCardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1.5px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            fontSize: "22px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${color}18`,
            borderRadius: "8px",
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: 800,
          color: "var(--color-text)",
          letterSpacing: "-1px",
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-light)" }}>
        {description}
      </p>
    </div>
  );
}

interface EmptySectionProps {
  title: string;
  icon: string;
  message: string;
}

function EmptySection({ title, icon, message }: EmptySectionProps) {
  return (
    <section
      aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
      style={{
        background: "var(--color-surface)",
        border: "1.5px solid var(--color-border)",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <h2
        id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        style={{
          margin: "0 0 16px",
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--color-text)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span aria-hidden="true">{icon}</span> {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          textAlign: "center",
          padding: "16px 0",
        }}
      >
        {message}
      </p>
    </section>
  );
}
