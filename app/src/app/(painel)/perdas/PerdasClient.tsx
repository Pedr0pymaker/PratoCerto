"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------
interface ProdutoResumo {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  saldoDisponivel: number;
}

interface PerdaItem {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoCategoria: string;
  produtoUnidade: string;
  usuarioNome: string;
  quantidade: number;
  motivo: string;
  custoEstimado: number;
  observacao: string | null;
  dataHora: string;
}

interface ErroValidacao {
  campo: string;
  mensagem: string;
}

// ---------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------
const MOTIVOS = [
  { valor: "VENCIMENTO", label: "Vencimento" },
  { valor: "DETERIORACAO", label: "Deterioração" },
  { valor: "SOBRA", label: "Sobra" },
  { valor: "PREPARO_ACIDENTE", label: "Preparo / Acidente" },
  { valor: "OUTRO", label: "Outro" },
];

interface FormPerdaState {
  produtoId: string;
  quantidade: string;
  motivo: string;
  observacao: string;
}

const FORM_PERDA_INICIAL: FormPerdaState = {
  produtoId: "",
  quantidade: "",
  motivo: "",
  observacao: "",
};

// ---------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------
export default function PerdasClient() {
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([]);
  const [perdas, setPerdas] = useState<PerdaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Modal de registro
  const [modalAberto, setModalAberto] = useState(false);
  const [formPerda, setFormPerda] = useState<FormPerdaState>(FORM_PERDA_INICIAL);
  const [errosForm, setErrosForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Filtros
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Mensagens
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Carregar produtos (para o select do formulário)
  // -------------------------------------------------------------------
  const carregarProdutos = useCallback(async () => {
    try {
      const res = await fetch("/api/estoque");
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const lista: ProdutoResumo[] = (data.produtos ?? []).map(
        (p: { id: string; nome: string; categoria: string; unidadeMedida: string; saldoDisponivel: number }) => ({
          id: p.id,
          nome: p.nome,
          categoria: p.categoria,
          unidadeMedida: p.unidadeMedida,
          saldoDisponivel: p.saldoDisponivel,
        })
      );
      setProdutos(lista);
    } catch {
      // Não bloqueia carregamento se produtos falhar
    }
  }, []);

  // -------------------------------------------------------------------
  // Carregar perdas (para atualização imperativa após cadastro)
  // -------------------------------------------------------------------
  const carregarPerdas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtroMotivo) params.set("motivo", filtroMotivo);
      if (filtroDataInicio) params.set("dataInicio", filtroDataInicio);
      if (filtroDataFim) params.set("dataFim", filtroDataFim);

      const url = `/api/perdas${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setPerdas(data.perdas ?? []);
      setErroCarregamento(null);
    } catch {
      setErroCarregamento("Não foi possível carregar o histórico de perdas.");
    } finally {
      setCarregando(false);
    }
  }, [filtroMotivo, filtroDataInicio, filtroDataFim]);

  // -------------------------------------------------------------------
  // Carregar produtos e perdas no efeito com controle de cancelamento
  // -------------------------------------------------------------------
  useEffect(() => {
    let ignore = false;

    async function carregarDadosIniciais() {
      try {
        const params = new URLSearchParams();
        if (filtroMotivo) params.set("motivo", filtroMotivo);
        if (filtroDataInicio) params.set("dataInicio", filtroDataInicio);
        if (filtroDataFim) params.set("dataFim", filtroDataFim);

        const urlPerdas = `/api/perdas${params.toString() ? `?${params.toString()}` : ""}`;
        const [resPerdas, resEstoque] = await Promise.all([
          fetch(urlPerdas),
          fetch("/api/estoque"),
        ]);

        if (!ignore) {
          if (resPerdas.ok) {
            const dataPerdas = await resPerdas.json();
            setPerdas(dataPerdas.perdas ?? []);
            setErroCarregamento(null);
          } else {
            setErroCarregamento("Não foi possível carregar o histórico de perdas.");
          }

          if (resEstoque.ok) {
            const dataEstoque = await resEstoque.json();
            const lista: ProdutoResumo[] = (dataEstoque.produtos ?? []).map(
              (p: { id: string; nome: string; categoria: string; unidadeMedida: string; saldoDisponivel: number }) => ({
                id: p.id,
                nome: p.nome,
                categoria: p.categoria,
                unidadeMedida: p.unidadeMedida,
                saldoDisponivel: p.saldoDisponivel,
              })
            );
            setProdutos(lista);
          }
        }
      } catch {
        if (!ignore) {
          setErroCarregamento("Não foi possível carregar o histórico de perdas.");
        }
      } finally {
        if (!ignore) {
          setCarregando(false);
        }
      }
    }

    carregarDadosIniciais();

    return () => {
      ignore = true;
    };
  }, [filtroMotivo, filtroDataInicio, filtroDataFim]);

  // -------------------------------------------------------------------
  // Produto selecionado (para exibir saldo)
  // -------------------------------------------------------------------
  const produtoSelecionado = produtos.find((p) => p.id === formPerda.produtoId);

  // -------------------------------------------------------------------
  // Ações do formulário
  // -------------------------------------------------------------------
  function abrirModal() {
    setFormPerda({
      ...FORM_PERDA_INICIAL,
      produtoId: produtos[0]?.id ?? "",
    });
    setErrosForm({});
    setErroEnvio(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setFormPerda(FORM_PERDA_INICIAL);
    setErrosForm({});
    setErroEnvio(null);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormPerda((prev) => ({ ...prev, [name]: value }));
    if (errosForm[name]) {
      setErrosForm((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErrosForm({});
    setErroEnvio(null);
    setMensagemSucesso(null);

    try {
      const payload = {
        produtoId: formPerda.produtoId,
        quantidade: formPerda.quantidade === "" ? "" : Number(formPerda.quantidade),
        motivo: formPerda.motivo,
        observacao: formPerda.observacao || null,
      };

      const res = await fetch("/api/perdas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        setErroEnvio(data.erro || "Erro ao registrar a perda.");
        return;
      }

      setMensagemSucesso(data.mensagem || "Perda registrada com sucesso.");
      fecharModal();
      await Promise.all([carregarPerdas(), carregarProdutos()]);

      // Limpa mensagem de sucesso após 5s
      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch {
      setErroEnvio("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // -------------------------------------------------------------------
  // Utilitários de formatação
  // -------------------------------------------------------------------
  function formatarData(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function labelMotivo(motivo: string) {
    return MOTIVOS.find((m) => m.valor === motivo)?.label ?? motivo;
  }

  function corMotivo(motivo: string) {
    switch (motivo) {
      case "VENCIMENTO":
        return { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
      case "DETERIORACAO":
        return { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" };
      case "SOBRA":
        return { bg: "#fefce8", color: "#854d0e", border: "#fef08a" };
      case "PREPARO_ACIDENTE":
        return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" };
      case "OUTRO":
        return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
      default:
        return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
    }
  }

  // Custo total das perdas visíveis
  const custoTotalVisivel = perdas.reduce((acc, p) => acc + p.custoEstimado, 0);

  // -------------------------------------------------------------------
  // Renderização
  // -------------------------------------------------------------------
  return (
    <div>
      {/* Cabeçalho */}
      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Perdas
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
            Registro de desperdícios e impacto financeiro
          </p>
        </div>

        <button
          id="btn-nova-perda"
          onClick={abrirModal}
          disabled={produtos.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--color-danger)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: produtos.length === 0 ? "not-allowed" : "pointer",
            opacity: produtos.length === 0 ? 0.5 : 1,
            transition: "background var(--transition)",
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span>Registrar Perda</span>
        </button>
      </div>

      {/* Mensagem de sucesso */}
      {mensagemSucesso && (
        <div
          role="status"
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "10px",
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
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Erro de carregamento */}
      {erroCarregamento && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "14px",
            color: "#991b1b",
          }}
        >
          {erroCarregamento}
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 160px", minWidth: "140px" }}>
          <label
            htmlFor="filtro-motivo"
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}
          >
            Motivo
          </label>
          <select
            id="filtro-motivo"
            value={filtroMotivo}
            onChange={(e) => setFiltroMotivo(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              fontSize: "13px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            <option value="">Todos</option>
            {MOTIVOS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 140px", minWidth: "130px" }}>
          <label
            htmlFor="filtro-data-inicio"
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}
          >
            Data início
          </label>
          <input
            type="date"
            id="filtro-data-inicio"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              fontSize: "13px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <div style={{ flex: "1 1 140px", minWidth: "130px" }}>
          <label
            htmlFor="filtro-data-fim"
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}
          >
            Data fim
          </label>
          <input
            type="date"
            id="filtro-data-fim"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              fontSize: "13px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <button
          onClick={() => {
            setFiltroMotivo("");
            setFiltroDataInicio("");
            setFiltroDataFim("");
          }}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
            fontSize: "13px",
            cursor: "pointer",
            color: "var(--color-text-muted)",
          }}
        >
          Limpar
        </button>
      </div>

      {/* Resumo de custos */}
      {perdas.length > 0 && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "14px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }} aria-hidden="true">📉</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#991b1b" }}>
              Prejuízo estimado
            </span>
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#dc2626" }}>
            {formatarMoeda(custoTotalVisivel)}
          </span>
        </div>
      )}

      {/* Tabela / Lista de perdas */}
      {carregando ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--color-text-muted)",
          }}
        >
          Carregando...
        </div>
      ) : perdas.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          <p style={{ fontSize: "36px", margin: "0 0 8px" }}>📋</p>
          <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "15px", color: "var(--color-text)" }}>
            Nenhuma perda registrada
          </p>
          <p style={{ margin: 0, fontSize: "13px" }}>
            {filtroMotivo || filtroDataInicio || filtroDataFim
              ? "Nenhum registro encontrado para os filtros selecionados."
              : "Clique em \"Registrar Perda\" para começar."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Header da tabela (desktop) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr 1.5fr",
              gap: "8px",
              padding: "12px 20px",
              background: "var(--color-surface-2)",
              borderBottom: "1px solid var(--color-border)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
            className="perdas-header"
          >
            <span>Produto</span>
            <span>Quantidade</span>
            <span>Motivo</span>
            <span>Prejuízo</span>
            <span>Responsável</span>
            <span>Data / Hora</span>
          </div>

          {/* Linhas */}
          {perdas.map((perda, idx) => {
            const cor = corMotivo(perda.motivo);
            return (
              <div
                key={perda.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr 1.5fr",
                  gap: "8px",
                  padding: "14px 20px",
                  borderBottom:
                    idx < perdas.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                  fontSize: "14px",
                  alignItems: "center",
                }}
                className="perdas-row"
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    {perda.produtoNome}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {perda.produtoCategoria}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: "var(--color-danger)" }}>
                  -{perda.quantidade} {perda.produtoUnidade}
                </div>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: cor.bg,
                      color: cor.color,
                      border: `1px solid ${cor.border}`,
                    }}
                  >
                    {labelMotivo(perda.motivo)}
                  </span>
                </div>
                <div style={{ fontWeight: 600, color: "#dc2626" }}>
                  {formatarMoeda(perda.custoEstimado)}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {perda.usuarioNome}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {formatarData(perda.dataHora)}
                  {perda.observacao && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-light)",
                        marginTop: "2px",
                        fontStyle: "italic",
                      }}
                      title={perda.observacao}
                    >
                      {perda.observacao.length > 50
                        ? `${perda.observacao.slice(0, 50)}…`
                        : perda.observacao}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Estilos responsivos */}
      <style>{`
        @media (max-width: 768px) {
          .perdas-header {
            display: none !important;
          }
          .perdas-row {
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
            padding: 12px 16px !important;
          }
        }
      `}</style>

      {/* ============================================================= */}
      {/* Modal de Registro de Perda                                     */}
      {/* ============================================================= */}
      {modalAberto && (
        <>
          {/* Overlay */}
          <div
            onClick={fecharModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 50,
            }}
            aria-hidden="true"
          />

          {/* Conteúdo do modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-perda-titulo"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(480px, calc(100vw - 32px))",
              maxHeight: "calc(100dvh - 40px)",
              overflowY: "auto",
              background: "var(--color-surface)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              zIndex: 51,
              padding: "28px",
            }}
          >
            {/* Header do modal */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2
                id="modal-perda-titulo"
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span aria-hidden="true">⚠️</span> Registrar Perda
              </h2>
              <button
                onClick={fecharModal}
                aria-label="Fechar"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Erro geral do envio */}
            {erroEnvio && (
              <div
                role="alert"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#991b1b",
                }}
              >
                {erroEnvio}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit}>
              {/* Produto */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="perda-produtoId"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "6px",
                  }}
                >
                  Produto *
                </label>
                <select
                  id="perda-produtoId"
                  name="produtoId"
                  value={formPerda.produtoId}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errosForm.produtoId ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "14px",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.saldoDisponivel} {p.unidadeMedida} em estoque)
                    </option>
                  ))}
                </select>
                {errosForm.produtoId && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>
                    {errosForm.produtoId}
                  </p>
                )}
                {produtoSelecionado && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "12px",
                      color: produtoSelecionado.saldoDisponivel > 0 ? "#166534" : "#991b1b",
                      fontWeight: 500,
                    }}
                  >
                    Saldo disponível: {produtoSelecionado.saldoDisponivel}{" "}
                    {produtoSelecionado.unidadeMedida}
                  </p>
                )}
              </div>

              {/* Quantidade */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="perda-quantidade"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "6px",
                  }}
                >
                  Quantidade perdida *
                </label>
                <input
                  type="number"
                  id="perda-quantidade"
                  name="quantidade"
                  value={formPerda.quantidade}
                  onChange={handleChange}
                  required
                  min="0.001"
                  step="any"
                  placeholder="Ex: 2.5"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errosForm.quantidade ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "14px",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                />
                {errosForm.quantidade && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>
                    {errosForm.quantidade}
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="perda-motivo"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "6px",
                  }}
                >
                  Motivo *
                </label>
                <select
                  id="perda-motivo"
                  name="motivo"
                  value={formPerda.motivo}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errosForm.motivo ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "14px",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="">Selecione o motivo</option>
                  {MOTIVOS.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {errosForm.motivo && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>
                    {errosForm.motivo}
                  </p>
                )}
              </div>

              {/* Observação */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="perda-observacao"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginBottom: "6px",
                  }}
                >
                  Observação{" "}
                  <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>
                    (opcional)
                  </span>
                </label>
                <textarea
                  id="perda-observacao"
                  name="observacao"
                  value={formPerda.observacao}
                  onChange={handleChange}
                  maxLength={500}
                  rows={3}
                  placeholder="Detalhe a perda se necessário..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errosForm.observacao ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "14px",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                {errosForm.observacao && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>
                    {errosForm.observacao}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={fecharModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: "14px",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirmar-perda"
                  type="submit"
                  disabled={salvando}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: salvando ? "#9ca3af" : "var(--color-danger)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: salvando ? "not-allowed" : "pointer",
                    transition: "background var(--transition)",
                  }}
                >
                  {salvando ? "Registrando..." : "Confirmar Perda"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
