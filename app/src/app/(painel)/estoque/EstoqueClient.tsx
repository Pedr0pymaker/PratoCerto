"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------
interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueIdeal: number;
  custoReferencia: number | null;
  criadoEm: string;
}

interface ErroValidacao {
  campo: string;
  mensagem: string;
}

interface FormState {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: string;
  estoqueIdeal: string;
  custoReferencia: string;
}

const FORM_INICIAL: FormState = {
  nome: "",
  categoria: "",
  unidadeMedida: "",
  estoqueMinimo: "",
  estoqueIdeal: "",
  custoReferencia: "",
};

const CATEGORIAS_COMUNS = [
  "Carnes e Aves",
  "Laticínios",
  "Hortifrúti",
  "Grãos e Cereais",
  "Bebidas",
  "Temperos e Condimentos",
  "Panificados",
  "Congelados",
  "Limpeza",
  "Descartáveis",
  "Outros",
];

const UNIDADES_COMUNS = [
  "kg",
  "g",
  "L",
  "mL",
  "un",
  "cx",
  "pct",
  "dz",
  "fardo",
];

// ---------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------
export default function EstoqueClient() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [errosForm, setErrosForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [busca, setBusca] = useState("");

  // -------------------------------------------------------------------
  // Carregar produtos
  // -------------------------------------------------------------------
  const carregarProdutos = useCallback(async () => {
    try {
      const res = await fetch("/api/produtos");
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setProdutos(data.produtos ?? []);
      setErroCarregamento(null);
    } catch {
      setErroCarregamento("Não foi possível carregar os produtos. Verifique a conexão com o banco de dados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/produtos");
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setProdutos(data.produtos ?? []);
          setErroCarregamento(null);
        }
      } catch {
        if (!ignore) {
          setErroCarregamento("Não foi possível carregar os produtos. Verifique a conexão com o banco de dados.");
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

  // -------------------------------------------------------------------
  // Produtos filtrados pela busca
  // -------------------------------------------------------------------
  const produtosFiltrados = produtos.filter((p) => {
    const q = busca.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.unidadeMedida.toLowerCase().includes(q)
    );
  });

  // -------------------------------------------------------------------
  // Abrir/fechar formulário
  // -------------------------------------------------------------------
  function abrirFormulario() {
    setForm(FORM_INICIAL);
    setErrosForm({});
    setErroEnvio(null);
    setFormularioAberto(true);
  }

  function fecharFormulario() {
    setFormularioAberto(false);
    setForm(FORM_INICIAL);
    setErrosForm({});
    setErroEnvio(null);
  }

  // -------------------------------------------------------------------
  // Atualizar campos do formulário
  // -------------------------------------------------------------------
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpa o erro do campo ao editar
    if (errosForm[name]) {
      setErrosForm((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }
  }

  // -------------------------------------------------------------------
  // Submeter formulário
  // -------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErrosForm({});
    setErroEnvio(null);
    setMensagemSucesso(null);

    try {
      const payload = {
        nome: form.nome,
        categoria: form.categoria,
        unidadeMedida: form.unidadeMedida,
        estoqueMinimo: form.estoqueMinimo === "" ? "" : Number(form.estoqueMinimo),
        estoqueIdeal: form.estoqueIdeal === "" ? "" : Number(form.estoqueIdeal),
        custoReferencia: form.custoReferencia === "" ? null : Number(form.custoReferencia),
      };

      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 422 && data.erros) {
        // Erros de validação por campo
        const mapa: Record<string, string> = {};
        (data.erros as ErroValidacao[]).forEach((e) => {
          mapa[e.campo] = e.mensagem;
        });
        setErrosForm(mapa);
        return;
      }

      if (!res.ok) {
        setErroEnvio(data.erro ?? "Erro ao salvar produto. Tente novamente.");
        return;
      }

      // Sucesso
      setMensagemSucesso(`Produto "${data.produto.nome}" cadastrado com sucesso!`);
      fecharFormulario();
      await carregarProdutos();

      // Limpa mensagem após 5s
      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch {
      setErroEnvio("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div>
      {/* Cabeçalho da página */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
            Estoque
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
            Produtos cadastrados no sistema
          </p>
        </div>
        <button
          id="btn-cadastrar-produto"
          onClick={abrirFormulario}
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
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-primary)")}
        >
          <span aria-hidden="true">＋</span> Cadastrar produto
        </button>
      </div>

      {/* Mensagem de sucesso */}
      {mensagemSucesso && (
        <div
          role="status"
          aria-live="polite"
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
          }}
        >
          <span aria-hidden="true">✅</span>
          {mensagemSucesso}
        </div>
      )}

      {/* Modal de cadastro */}
      {formularioAberto && (
        <ModalCadastro
          form={form}
          erros={errosForm}
          erroEnvio={erroEnvio}
          salvando={salvando}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onFechar={fecharFormulario}
        />
      )}

      {/* Barra de busca */}
      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="busca-produto" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" }}>
          Buscar produto
        </label>
        <input
          id="busca-produto"
          type="search"
          placeholder="Nome, categoria ou unidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={estiloInput}
          aria-label="Buscar produto por nome, categoria ou unidade de medida"
        />
      </div>

      {/* Estado de carregamento */}
      {carregando && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <span aria-hidden="true" style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>⏳</span>
          Carregando produtos...
        </div>
      )}

      {/* Erro de carregamento */}
      {!carregando && erroCarregamento && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "16px",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          <strong>Erro ao carregar produtos</strong><br />
          {erroCarregamento}
          <br />
          <button
            onClick={carregarProdutos}
            style={{ marginTop: "10px", color: "#dc2626", background: "none", border: "1px solid #dc2626", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "13px" }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Tabela / listagem */}
      {!carregando && !erroCarregamento && (
        <>
          {produtosFiltrados.length === 0 ? (
            <EstadoVazio busca={busca} onCadastrar={abrirFormulario} />
          ) : (
            <TabelaProdutos produtos={produtosFiltrados} />
          )}
        </>
      )}
    </div>
  );
}


interface ColunaHeader {
  label: string;
  align: "left" | "center" | "right";
  width?: string;
}

const COLUNAS_TABELA: ColunaHeader[] = [
  { label: "Produto", align: "left" },
  { label: "Categoria", align: "left", width: "160px" },
  { label: "Unidade", align: "center", width: "90px" },
  { label: "Estoque mínimo", align: "right", width: "150px" },
  { label: "Estoque ideal", align: "right", width: "150px" },
  { label: "Custo ref.", align: "right", width: "130px" },
];

// ---------------------------------------------------------------
// Tabela de produtos
// ---------------------------------------------------------------
function TabelaProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1.5px solid var(--color-border)",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Versão desktop — tabela com alinhamento perfeito de colunas */}
      <div className="tabela-desktop" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }} aria-label="Lista de produtos cadastrados">
          <thead>
            <tr style={{ background: "var(--color-surface-2)", borderBottom: "1.5px solid var(--color-border)" }}>
              {COLUNAS_TABELA.map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  style={{
                    padding: "14px 18px",
                    textAlign: col.align,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: i < produtos.length - 1 ? "1px solid var(--color-border)" : "none",
                  transition: "background var(--transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Produto */}
                <td style={{ padding: "14px 18px", fontWeight: 600, color: "var(--color-text)", fontSize: "14px" }}>
                  {p.nome}
                </td>

                {/* Categoria */}
                <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      background: "#f0fdf4",
                      color: "#166534",
                      fontSize: "12px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    {p.categoria}
                  </span>
                </td>

                {/* Unidade */}
                <td style={{ padding: "14px 18px", textAlign: "center", fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                  <span style={{ background: "var(--color-surface-2)", padding: "3px 8px", borderRadius: "4px" }}>
                    {p.unidadeMedida}
                  </span>
                </td>

                {/* Estoque Mínimo */}
                <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", alignItems: "baseline", gap: "5px", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                      {p.estoqueMinimo.toLocaleString("pt-BR")}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {p.unidadeMedida}
                    </span>
                  </div>
                </td>

                {/* Estoque Ideal */}
                <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", alignItems: "baseline", gap: "5px", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                      {p.estoqueIdeal.toLocaleString("pt-BR")}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {p.unidadeMedida}
                    </span>
                  </div>
                </td>

                {/* Custo de Referência */}
                <td style={{ padding: "14px 18px", textAlign: "right", fontSize: "14px", color: "var(--color-text)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {p.custoReferencia != null ? (
                    <span style={{ fontWeight: 500 }}>
                      R$ {p.custoReferencia.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-light)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Versão mobile — lista de cards estruturada e responsiva */}
      <div className="cards-mobile" style={{ display: "flex", flexDirection: "column" }}>
        {produtos.map((p, i) => (
          <div
            key={p.id}
            style={{
              padding: "16px",
              borderBottom: i < produtos.length - 1 ? "1px solid var(--color-border)" : "none",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Topo do card: Nome + Categoria */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
              <strong style={{ fontSize: "16px", color: "var(--color-text)", lineHeight: 1.3 }}>
                {p.nome}
              </strong>
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: "12px",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {p.categoria}
              </span>
            </div>

            {/* Grid com indicadores alinhados */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                background: "var(--color-surface-2)",
                padding: "12px 14px",
                borderRadius: "8px",
              }}
            >
              <div>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.05em", marginBottom: "2px" }}>
                  Estoque mínimo
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                  {p.estoqueMinimo.toLocaleString("pt-BR")} <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)" }}>{p.unidadeMedida}</span>
                </span>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.05em", marginBottom: "2px" }}>
                  Estoque ideal
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                  {p.estoqueIdeal.toLocaleString("pt-BR")} <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)" }}>{p.unidadeMedida}</span>
                </span>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.05em", marginBottom: "2px" }}>
                  Unidade
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>
                  {p.unidadeMedida}
                </span>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.05em", marginBottom: "2px" }}>
                  Custo ref.
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>
                  {p.custoReferencia != null
                    ? `R$ ${p.custoReferencia.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé com contador */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--color-surface-2)",
          borderTop: "1px solid var(--color-border)",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--color-text-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          {produtos.length} {produtos.length === 1 ? "produto cadastrado" : "produtos cadastrados"}
        </span>
      </div>

      <style>{`
        .tabela-desktop { display: block; }
        .cards-mobile   { display: none; }
        @media (max-width: 768px) {
          .tabela-desktop { display: none !important; }
          .cards-mobile   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------
// Estado vazio
// ---------------------------------------------------------------
function EstadoVazio({ busca, onCadastrar }: { busca: string; onCadastrar: () => void }) {
  if (busca) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-text-muted)" }}>
        <span aria-hidden="true" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔍</span>
        <p style={{ margin: 0, fontSize: "15px" }}>Nenhum produto encontrado para <strong>&ldquo;{busca}&rdquo;</strong>.</p>
      </div>
    );
  }
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1.5px dashed var(--color-border)",
        borderRadius: "12px",
        textAlign: "center",
        padding: "60px 24px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>📦</span>
      <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>
        Nenhum produto cadastrado
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--color-text-muted)" }}>
        Comece cadastrando os produtos do seu estabelecimento.
      </p>
      <button
        id="btn-cadastrar-primeiro-produto"
        onClick={onCadastrar}
        style={{
          background: "var(--color-primary)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Cadastrar primeiro produto
      </button>
    </div>
  );
}

// ---------------------------------------------------------------
// Modal de cadastro
// ---------------------------------------------------------------
interface ModalCadastroProps {
  form: FormState;
  erros: Record<string, string>;
  erroEnvio: string | null;
  salvando: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFechar: () => void;
}

function ModalCadastro({ form, erros, erroEnvio, salvando, onChange, onSubmit, onFechar }: ModalCadastroProps) {
  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
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
      {/* Overlay */}
      <div
        onClick={onFechar}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />

      {/* Painel */}
      <div
        style={{
          position: "relative",
          background: "var(--color-surface)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90dvh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header do modal */}
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
            zIndex: 1,
          }}
        >
          <h2 id="modal-titulo" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>
            Cadastrar produto
          </h2>
          <button
            id="btn-fechar-modal"
            aria-label="Fechar formulário"
            onClick={onFechar}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "4px",
              borderRadius: "4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Corpo do formulário */}
        <form id="form-cadastro-produto" onSubmit={onSubmit} noValidate style={{ padding: "24px" }}>
          {/* Erro geral de envio */}
          {erroEnvio && (
            <div
              role="alert"
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "14px",
                color: "#991b1b",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <span aria-hidden="true">⚠️</span>
              {erroEnvio}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Nome */}
            <Campo
              id="campo-nome"
              label="Nome do produto"
              obrigatorio
              erro={erros.nome}
            >
              <input
                id="campo-nome"
                name="nome"
                type="text"
                value={form.nome}
                onChange={onChange}
                placeholder="Ex: Tomate, Frango, Farinha de Trigo"
                maxLength={200}
                style={estiloInput}
                aria-required="true"
                aria-describedby={erros.nome ? "erro-nome" : undefined}
                aria-invalid={!!erros.nome}
                autoFocus
              />
            </Campo>

            {/* Categoria */}
            <Campo
              id="campo-categoria"
              label="Categoria"
              obrigatorio
              erro={erros.categoria}
            >
              <select
                id="campo-categoria"
                name="categoria"
                value={form.categoria}
                onChange={onChange}
                style={estiloInput}
                aria-required="true"
                aria-describedby={erros.categoria ? "erro-categoria" : undefined}
                aria-invalid={!!erros.categoria}
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS_COMUNS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Campo>

            {/* Unidade de medida */}
            <Campo
              id="campo-unidade"
              label="Unidade de medida"
              obrigatorio
              erro={erros.unidadeMedida}
            >
              <select
                id="campo-unidade"
                name="unidadeMedida"
                value={form.unidadeMedida}
                onChange={onChange}
                style={estiloInput}
                aria-required="true"
                aria-describedby={erros.unidadeMedida ? "erro-unidadeMedida" : undefined}
                aria-invalid={!!erros.unidadeMedida}
              >
                <option value="">Selecione a unidade</option>
                {UNIDADES_COMUNS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Campo>

            {/* Estoque mínimo e ideal em grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Campo
                id="campo-estoque-minimo"
                label="Estoque mínimo"
                obrigatorio
                erro={erros.estoqueMinimo}
                dica="Quantidade para disparo de alerta"
              >
                <input
                  id="campo-estoque-minimo"
                  name="estoqueMinimo"
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.estoqueMinimo}
                  onChange={onChange}
                  placeholder="0"
                  style={estiloInput}
                  aria-required="true"
                  aria-describedby={erros.estoqueMinimo ? "erro-estoqueMinimo" : undefined}
                  aria-invalid={!!erros.estoqueMinimo}
                />
              </Campo>

              <Campo
                id="campo-estoque-ideal"
                label="Estoque ideal"
                obrigatorio
                erro={erros.estoqueIdeal}
                dica="Quantidade desejada no estoque"
              >
                <input
                  id="campo-estoque-ideal"
                  name="estoqueIdeal"
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.estoqueIdeal}
                  onChange={onChange}
                  placeholder="0"
                  style={estiloInput}
                  aria-required="true"
                  aria-describedby={erros.estoqueIdeal ? "erro-estoqueIdeal" : undefined}
                  aria-invalid={!!erros.estoqueIdeal}
                />
              </Campo>
            </div>

            {/* Custo de referência (opcional) */}
            <Campo
              id="campo-custo"
              label="Custo de referência (R$)"
              erro={erros.custoReferencia}
              dica="Opcional — usado para calcular valor de perdas"
            >
              <input
                id="campo-custo"
                name="custoReferencia"
                type="number"
                min="0"
                step="0.01"
                value={form.custoReferencia}
                onChange={onChange}
                placeholder="Ex: 12.50"
                style={estiloInput}
                aria-describedby={erros.custoReferencia ? "erro-custoReferencia" : undefined}
                aria-invalid={!!erros.custoReferencia}
              />
            </Campo>
          </div>

          {/* Ações */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <button
              id="btn-cancelar-cadastro"
              type="button"
              onClick={onFechar}
              disabled={salvando}
              style={{
                background: "none",
                border: "1.5px solid var(--color-border)",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: salvando ? "not-allowed" : "pointer",
                color: "var(--color-text-muted)",
              }}
            >
              Cancelar
            </button>
            <button
              id="btn-salvar-produto"
              type="submit"
              disabled={salvando}
              style={{
                background: salvando ? "#86efac" : "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: salvando ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: "130px",
                justifyContent: "center",
                transition: "background var(--transition)",
              }}
            >
              {salvando ? (
                <>
                  <span aria-hidden="true" style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                  Salvando...
                </>
              ) : (
                "Salvar produto"
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------
// Campo de formulário com label + erro + dica
// ---------------------------------------------------------------
interface CampoProps {
  id: string;
  label: string;
  obrigatorio?: boolean;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}

function Campo({ id, label, obrigatorio, erro, dica, children }: CampoProps) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: "6px",
        }}
      >
        {label}
        {obrigatorio && (
          <span aria-hidden="true" style={{ color: "var(--color-danger)", marginLeft: "3px" }}>*</span>
        )}
      </label>
      {dica && !erro && (
        <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--color-text-light)" }}>{dica}</p>
      )}
      {children}
      {erro && (
        <p
          id={`erro-${id}`}
          role="alert"
          style={{ margin: "5px 0 0", fontSize: "12px", color: "var(--color-danger)" }}
        >
          {erro}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Estilos compartilhados
// ---------------------------------------------------------------
const estiloInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1.5px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "14px",
  color: "var(--color-text)",
  background: "var(--color-surface)",
  outline: "none",
  transition: "border-color var(--transition)",
  boxSizing: "border-box",
  appearance: "auto",
};
