"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  apenasGerente?: boolean;
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
    apenasGerente: true,
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

interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  perfil: "GERENTE" | "FUNCIONARIO";
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.usuario) {
          setUsuario(data.usuario);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setSaindo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  // Se o perfil for FUNCIONARIO, oculta itens exclusivos do GERENTE
  const itensVisiveis = navItems.filter((item) => {
    if (item.apenasGerente && usuario && usuario.perfil !== "GERENTE") {
      return false;
    }
    return true;
  });

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
            {itensVisiveis.map((item) => {
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

        {/* Informações do usuário logado + Logout */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.15)",
          }}
        >
          {usuario ? (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "13px", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {usuario.nome}
                </strong>
                <span
                  style={{
                    background: usuario.perfil === "GERENTE" ? "rgba(79, 70, 229, 0.4)" : "rgba(255,255,255,0.12)",
                    color: usuario.perfil === "GERENTE" ? "#c7d2fe" : "rgba(255,255,255,0.8)",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {usuario.perfil}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {usuario.email}
              </p>
            </div>
          ) : (
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
              Sessão ativa
            </p>
          )}

          <button
            id="btn-logout"
            onClick={handleLogout}
            disabled={saindo}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: saindo ? "not-allowed" : "pointer",
              transition: "background var(--transition)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)")}
          >
            <span>🚪</span>
            <span>{saindo ? "Saindo..." : "Sair da conta"}</span>
          </button>
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

