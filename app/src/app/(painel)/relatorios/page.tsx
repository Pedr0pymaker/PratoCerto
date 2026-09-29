import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Relatórios — PratoCerto",
  description: "Análises de estoque, perdas e consumo por período.",
};

export default function RelatoriosPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          Relatórios
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Análises e exportações por período
        </p>
      </div>
      <ComingSoon
        title="Módulo de Relatórios"
        description="Aqui você poderá gerar relatórios detalhados sobre estoque, perdas, consumo e compras, filtrando por período, produto ou categoria."
        icon="📈"
        plannedFeatures={[
          "Relatório de desperdício por período, produto, categoria e motivo",
          "Cálculo do valor financeiro estimado das perdas",
          "Comparativo entre períodos",
          "Relatório de movimentações de estoque",
          "Relatório de compras e gastos por fornecedor",
          "Exportação de dados (etapa futura)",
        ]}
      />
    </div>
  );
}
