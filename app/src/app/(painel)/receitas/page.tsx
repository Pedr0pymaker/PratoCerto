import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Receitas — PratoCerto",
  description: "Fichas técnicas e controle de ingredientes por receita.",
};

export default function ReceitasPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          Receitas
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Fichas técnicas e baixa automática de ingredientes
        </p>
      </div>
      <ComingSoon
        title="Módulo de Receitas"
        description="Aqui você poderá cadastrar fichas técnicas dos pratos do seu cardápio, associando ingredientes e quantidades para que o sistema calcule automaticamente o consumo de estoque."
        icon="🍽️"
        plannedFeatures={[
          "Cadastro de receitas com nome do prato e ingredientes",
          "Definição de quantidade por ingrediente por porção",
          "Baixa automática de ingredientes ao registrar consumo (quando habilitado)",
          "Visualização do custo estimado por prato",
          "Ativação e desativação de receitas",
        ]}
      />
    </div>
  );
}
