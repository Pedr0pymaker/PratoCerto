"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "📊",
    description: "Visão geral do estabelecimento",
  },
  {
    href: "/estoque",
    label: "Estoque",
    icon: "📦",
    description: "Produtos e movimentações",
  },
  {
    href: "/perdas",
    label: "Perdas",
    icon: "⚠️",
    description: "Registro de desperdícios",
  },
  {
    href: "/compras",
    label: "Compras",
    icon: "🛒",
    description: "Entradas e fornecedores",
  },
  {
    href: "/receitas",
    label: "Receitas",
    icon: "🍽️",
    description: "Fichas técnicas e ingredientes",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: "📈",
    description: "Análises e exportações",
  },
  {
    href: "/ia",
    label: "PratoCerto IA",
    icon: "🤖",
    description: "Assistente inteligente",
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: "👥",
    description: "Equipe e permissões",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: "⚙️",
    description: "Preferências do sistema",
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Menu principal"
        style={{
          width: "var(--sidebar-width)",
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          zIndex: 30,
          transition: "transform 0.25s ease",
          transform: isMobileOpen ? "translateX(0)" : undefined,
          overflowY: "auto",
        }}
        className={!isMobileOpen ? "max-lg:translate-x-[-100%]" : ""}
      >
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span style={{ fontSize: "28px" }}>🍽️</span>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.3px",
                }}
              >
                PratoCerto
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Gestão de Estoque
              </p>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");

              return (
                <li key={item.href} style={{ marginBottom: "2px" }}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    aria-current={isActive ? "page" : undefined}
                    title={item.description}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: isActive ? "#ffffff" : "rgba(226,232,240,0.75)",
                      background: isActive
                        ? "var(--sidebar-active)"
                        : "transparent",
                      transition: "all var(--transition)",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 400,
                    }}
                    className="sidebar-link"
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer da sidebar */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          <p style={{ margin: 0 }}>PratoCerto v0.1.0</p>
          <p style={{ margin: "2px 0 0" }}>Etapa 1 — Estrutura inicial</p>
        </div>
      </aside>

      <style>{`
        .sidebar-link:hover:not([aria-current="page"]) {
          background: var(--sidebar-hover) !important;
          color: #ffffff !important;
        }
      `}</style>
    </>
  );
}
