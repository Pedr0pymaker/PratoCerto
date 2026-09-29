import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Usuários — PratoCerto",
  description: "Gerenciamento de usuários e permissões.",
};

export default function UsuariosPage() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
          Usuários
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
          Equipe, perfis e permissões de acesso
        </p>
      </div>
      <ComingSoon
        title="Módulo de Usuários"
        description="Aqui o gerente poderá convidar membros da equipe, definir perfis de acesso (gerente ou funcionário) e gerenciar quem pode realizar cada tipo de operação no sistema."
        icon="👥"
        plannedFeatures={[
          "Cadastro e gerenciamento de usuários",
          "Perfis: Gerente/Administrador e Funcionário",
          "Restrição de acesso por perfil (autorização no servidor)",
          "Ativação e desativação de usuários",
          "Histórico de quem realizou cada operação",
        ]}
      />
    </div>
  );
}
