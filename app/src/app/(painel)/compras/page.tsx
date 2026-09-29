import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Compras — PratoCerto",
  description: "Gestão de compras e entradas por nota fiscal.",
};

export default function ComprasPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          Compras
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Entradas por nota fiscal e gestão de fornecedores
        </p>
      </div>
      <ComingSoon
        title="Módulo de Compras"
        description="Aqui você poderá registrar compras manualmente ou por fotografia de nota fiscal, conferir os itens antes de confirmar e acompanhar o histórico de compras."
        icon="🛒"
        plannedFeatures={[
          "Registro manual de compras com itens e valores",
          "Entrada de compra via fotografia de nota fiscal (OCR — etapa futura)",
          "Conferência e edição dos itens antes de confirmar",
          "Vinculação de item da nota a produto já cadastrado",
          "Geração automática de lotes e atualização do estoque ao confirmar",
          "Sugestão de lista de compras com base no estoque e histórico",
          "Histórico de compras por fornecedor e período",
        ]}
      />
    </div>
  );
}
