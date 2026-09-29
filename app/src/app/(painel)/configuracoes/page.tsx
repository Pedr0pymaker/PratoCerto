import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Configurações — PratoCerto",
  description: "Preferências e configurações do estabelecimento.",
};

export default function ConfiguracoesPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          Configurações
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Preferências do estabelecimento e do sistema
        </p>
      </div>
      <ComingSoon
        title="Módulo de Configurações"
        description="Aqui você poderá configurar as preferências do seu estabelecimento, definir alertas, personalizar categorias de produtos e ajustar o comportamento do sistema."
        icon="⚙️"
        plannedFeatures={[
          "Dados do estabelecimento (nome, tipo, informações gerais)",
          "Preferências de alertas (dias para vencer, abaixo do mínimo)",
          "Habilitação/desabilitação de baixa automática por receita",
          "Categorias personalizadas de produtos",
          "Unidades de medida utilizadas no estabelecimento",
          "Preferências de acessibilidade",
        ]}
      />
    </div>
  );
}
