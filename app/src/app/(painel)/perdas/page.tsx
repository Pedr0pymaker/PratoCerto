import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Perdas — PratoCerto",
  description: "Registro e acompanhamento de perdas e desperdícios.",
};

export default function PerdasPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          Perdas
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Registro de desperdícios e impacto financeiro
        </p>
      </div>
      <ComingSoon
        title="Módulo de Perdas"
        description="Aqui você poderá registrar perdas de estoque por diferentes motivos, acompanhar o valor financeiro estimado e identificar padrões de desperdício."
        icon="⚠️"
        plannedFeatures={[
          "Registro de perdas (vencimento, deterioração, sobra, preparo/acidente, outro)",
          "Cálculo automático do valor estimado da perda",
          "Desconto automático do estoque ao confirmar a perda",
          "Histórico de perdas com filtros por período, produto e motivo",
          "Visualização do custo total de perdas por período",
        ]}
      />
    </div>
  );
}
