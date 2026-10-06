"use client";

import { useState, useEffect, useCallback } from "react";

type PerfilUsuario = "GERENTE" | "FUNCIONARIO";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: string;
}

interface ErroValidacao {
  campo: string;
  mensagem: string;
}

export default function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>("FUNCIONARIO");
  const [salvando, setSalvando] = useState(false);
  const [errosForm, setErrosForm] = useState<Record<string, string>>({});
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const carregarUsuarios = useCallback(async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Acesso restrito ao perfil GERENTE.");
        }
        throw new Error("Não foi possível carregar os usuários.");
      }
      const data = await res.json();
      setUsuarios(data.usuarios || []);
      setErroCarregamento(null);
    } catch (err: unknown) {
      setErroCarregamento(
        err instanceof Error ? err.message : "Erro desconhecido."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/usuarios");
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("Acesso restrito ao perfil GERENTE.");
          }
          throw new Error("Não foi possível carregar os usuários.");
        }
        const data = await res.json();
        if (!ignore) {
          setUsuarios(data.usuarios || []);
          setErroCarregamento(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErroCarregamento(
            err instanceof Error ? err.message : "Erro desconhecido."
          );
        }
      } finally {
        if (!ignore) {
          setCarregando(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  function abrirModal() {
    setNome("");
    setEmail("");
    setSenha("");
    setPerfil("FUNCIONARIO");
    setErrosForm({});
    setErroEnvio(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setErrosForm({});
    setErroEnvio(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErrosForm({});
    setErroEnvio(null);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, perfil }),
      });

      const data = await res.json();

      if (res.status === 422 && data.erros) {
        const mapa: Record<string, string> = {};
        (data.erros as ErroValidacao[]).forEach((err) => {
          mapa[err.campo] = err.mensagem;
        });
        setErrosForm(mapa);
        return;
      }

      if (!res.ok) {
        setErroEnvio(data.erro || "Erro ao salvar usuário.");
        return;
      }

      setMensagemSucesso(
        `Usuário "${data.usuario.nome}" cadastrado com sucesso!`
      );
      fecharModal();
      await carregarUsuarios();
      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch {
      setErroEnvio("Erro de conexão ao salvar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Usuários
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
            Equipe, perfis e controle de acesso
          </p>
        </div>

        <button
          id="btn-cadastrar-usuario"
          onClick={abrirModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background var(--transition)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--color-primary-dark)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--color-primary)")
          }
        >
          <span aria-hidden="true">＋</span> Novo usuário
        </button>
      </div>

      {/* Mensagem de sucesso */}
      {mensagemSucesso && (
        <div
          role="status"
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            color: "#166534",
            fontWeight: 500,
          }}
        >
          <span aria-hidden="true">✅</span>
          {mensagemSucesso}
        </div>
      )}

      {/* Erro de carregamento */}
      {erroCarregamento && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "16px",
            color: "#991b1b",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          <strong>Acesso negado ou erro ao carregar:</strong>{" "}
          {erroCarregamento}
        </div>
      )}

      {/* Estado de carregamento */}
      {carregando && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: "var(--color-text-muted)",
          }}
        >
          <span
            aria-hidden="true"
            style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}
          >
            ⏳
          </span>
          Carregando usuários...
        </div>
      )}

      {/* Tabela de usuários */}
      {!carregando && !erroCarregamento && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1.5px solid var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--color-surface-2)",
                    borderBottom: "1.5px solid var(--color-border)",
                  }}
                >
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Perfil</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>
                    Cadastrado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "48px 18px",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      Nenhum usuário cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom:
                          i < usuarios.length - 1
                            ? "1px solid var(--color-border)"
                            : "none",
                        transition: "background var(--transition)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--color-surface-2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "14px 18px",
                          fontWeight: 600,
                          color: "var(--color-text)",
                          fontSize: "14px",
                        }}
                      >
                        {u.nome}
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          color: "var(--color-text-muted)",
                          fontSize: "14px",
                        }}
                      >
                        {u.email}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            background:
                              u.perfil === "GERENTE" ? "#e0e7ff" : "#f3f4f6",
                            color:
                              u.perfil === "GERENTE" ? "#3730a3" : "#374151",
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            display: "inline-block",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {u.perfil}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          textAlign: "right",
                          color: "var(--color-text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {new Date(u.criadoEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "12px 18px",
              background: "var(--color-surface-2)",
              borderTop: "1px solid var(--color-border)",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-muted)",
            }}
          >
            {usuarios.length}{" "}
            {usuarios.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}
          </div>
        </div>
      )}

      {/* Modal de cadastro de novo usuário */}
      {modalAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-titulo"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={fecharModal}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
            }}
            aria-hidden="true"
          />

          <div
            style={{
              position: "relative",
              background: "var(--color-surface)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "var(--shadow-lg)",
              zIndex: 1,
              maxHeight: "90dvh",
              overflowY: "auto",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-border)",
                position: "sticky",
                top: 0,
                background: "var(--color-surface)",
                zIndex: 2,
              }}
            >
              <h2
                id="modal-usuario-titulo"
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                Cadastrar novo usuário
              </h2>
              <button
                type="button"
                onClick={fecharModal}
                aria-label="Fechar modal"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} noValidate style={{ padding: "24px" }}>
              {erroEnvio && (
                <div
                  role="alert"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#991b1b",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  {erroEnvio}
                </div>
              )}

              <div
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div>
                  <label htmlFor="usr-nome" style={labelStyle}>
                    Nome completo *
                  </label>
                  <input
                    id="usr-nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Ana Maria Souza"
                    style={inputStyle}
                    disabled={salvando}
                  />
                  {errosForm.nome && (
                    <p style={erroStyle}>{errosForm.nome}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="usr-email" style={labelStyle}>
                    Email de acesso *
                  </label>
                  <input
                    id="usr-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@restaurante.com"
                    style={inputStyle}
                    disabled={salvando}
                  />
                  {errosForm.email && (
                    <p style={erroStyle}>{errosForm.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="usr-perfil" style={labelStyle}>
                    Perfil de acesso *
                  </label>
                  <select
                    id="usr-perfil"
                    value={perfil}
                    onChange={(e) =>
                      setPerfil(e.target.value as PerfilUsuario)
                    }
                    style={inputStyle}
                    disabled={salvando}
                  >
                    <option value="FUNCIONARIO">
                      FUNCIONARIO (Estoque e operações)
                    </option>
                    <option value="GERENTE">GERENTE (Acesso total)</option>
                  </select>
                  {errosForm.perfil && (
                    <p style={erroStyle}>{errosForm.perfil}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="usr-senha" style={labelStyle}>
                    Senha de acesso *
                  </label>
                  <input
                    id="usr-senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={inputStyle}
                    disabled={salvando}
                    autoComplete="new-password"
                  />
                  {errosForm.senha && (
                    <p style={erroStyle}>{errosForm.senha}</p>
                  )}
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "11px",
                      color: "var(--color-text-light)",
                    }}
                  >
                    A senha será armazenada usando hash criptográfico seguro
                    (bcrypt).
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--color-border)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  style={{
                    background: "none",
                    border: "1.5px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "14px",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  id="btn-salvar-usuario"
                  type="submit"
                  disabled={salvando}
                  style={{
                    background: salvando ? "#86efac" : "var(--color-primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: salvando ? "not-allowed" : "pointer",
                  }}
                >
                  {salvando ? "Salvando..." : "Cadastrar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "14px 18px",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-text)",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "14px",
  color: "var(--color-text)",
  background: "var(--color-surface)",
  boxSizing: "border-box",
  outline: "none",
};

const erroStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "var(--color-danger)",
};
