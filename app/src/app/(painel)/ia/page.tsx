import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "PratoCerto IA — PratoCerto",
  description: "Assistente inteligente para análise dos seus dados.",
};

export default function IAPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          PratoCerto IA
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Assistente inteligente baseado nos seus dados reais
        </p>
      </div>
      <ComingSoon
        title="Assistente PratoCerto IA"
        description="O assistente de IA analisará os dados reais do seu estabelecimento e responderá perguntas em linguagem natural. Ele sempre informará quando os dados forem insuficientes e não inventará informações."
        icon="🤖"
        plannedFeatures={[
          "Respostas baseadas apenas em dados reais do sistema",
          "Perguntas em linguagem natural sobre estoque, perdas e compras",
          "Indicação clara quando não há dados suficientes",
          "Recomendações de apoio à decisão (sem ações automáticas críticas)",
          "Sugestões de aproveitamento responsável de alimentos",
          "Respeito às permissões de cada perfil de usuário",
        ]}
      />
    </div>
  );
}
