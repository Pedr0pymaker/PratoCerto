"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Conteúdo principal */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          // Em telas grandes, empurra o conteúdo para a direita da sidebar
          marginLeft: "var(--sidebar-width)",
          transition: "margin-left 0.25s ease",
        }}
        className="main-content"
      >
        {/* Topbar */}
        <header
          role="banner"
          style={{
            height: "60px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: "16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Botão menu mobile */}
          <button
            id="btn-menu-mobile"
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-nav"
            onClick={() => setMobileOpen(true)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "6px",
              color: "var(--color-text)",
              fontSize: "20px",
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>

          {/* Título da página */}
          {pageTitle && (
            <h1
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              {pageTitle}
            </h1>
          )}

          {/* Espaço flexível */}
          <div style={{ flex: 1 }} />

          {/* Indicador de status do sistema */}
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
              }}
              title="Sistema operando normalmente"
            />
            Sistema ativo
          </span>
        </header>

        {/* Área de conteúdo */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>

      {/* Estilos responsivos */}
      <style>{`
        @media (max-width: 1023px) {
          .main-content {
            margin-left: 0 !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
