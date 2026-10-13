"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------
export interface LoteItem {
  id: string;
  produtoId: string;
  quantidadeInicial: number;
  quantidadeAtual: number;
  dataEntrada: string;
  dataValidade: string | null;
  custoUnitario: number | null;
  criadoEm: string;
}

export interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueIdeal: number;
  custoReferencia: number | null;
  saldoDisponivel: number;
  situacao: "NORMAL" | "ABAIXO_MINIMO";
  lotes: LoteItem[];
}

interface ErroValidacao {
  campo: string;
  mensagem: string;
}

interface FormProdutoState {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: string;
  estoqueIdeal: string;
  custoReferencia: string;
}

const FORM_PRODUTO_INICIAL: FormProdutoState = {
  nome: "",
  categoria: "",
  unidadeMedida: "",
  estoqueMinimo: "",
  estoqueIdeal: "",
  custoReferencia: "",
};

interface FormEntradaState {
  produtoId: string;
  quantidade: string;
  dataEntrada: string;
  dataValidade: string;
  custoUnitario: string;
}

const FORM_ENTRADA_INICIAL: FormEntradaState = {
  produtoId: "",
  quantidade: "",
  dataEntrada: new Date().toISOString().split("T")[0],
  dataValidade: "",
  custoUnitario: "",
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
  const [abaAtiva, setAbaAtiva] = useState<"estoque" | "produtos">("estoque");
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Modal Cadastro de Produto
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [formProduto, setFormProduto] = useState<FormProdutoState>(FORM_PRODUTO_INICIAL);
  const [errosProduto, setErrosProduto] = useState<Record<string, string>>({});
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  // Modal Entrada de Estoque
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [formEntrada, setFormEntrada] = useState<FormEntradaState>(FORM_ENTRADA_INICIAL);
  const [errosEntrada, setErrosEntrada] = useState<Record<string, string>>({});
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);

  // Lotes expandidos por ID do produto
  const [lotesExpandidos, setLotesExpandidos] = useState<Record<string, boolean>>({});

  // Mensagens globais
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [busca, setBusca] = useState("");

  // -------------------------------------------------------------------
  // Carregar dados de estoque (produtos + lotes + saldos)
  // -------------------------------------------------------------------
  const carregarDados = useCallback(async () => {
    try {
      const res = await fetch("/api/estoque");
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setProdutos(data.produtos ?? []);
      setErroCarregamento(null);
    } catch {
      setErroCarregamento("Não foi possível carregar o estoque. Verifique a conexão com o banco de dados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/estoque");
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setProdutos(data.produtos ?? []);
          setErroCarregamento(null);
        }
      } catch {
        if (!ignore) {
          setErroCarregamento("Não foi possível carregar o estoque. Verifique a conexão com o banco de dados.");
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

  // Toggle expansão de lotes
  function toggleLotes(produtoId: string) {
    setLotesExpandidos((prev) => ({
      ...prev,
      [produtoId]: !prev[produtoId],
    }));
  }

  // -------------------------------------------------------------------
  // Ações de Entrada de Estoque
  // -------------------------------------------------------------------
  function abrirModalEntrada(produtoIdPreSelecionado?: string) {
    setFormEntrada({
      ...FORM_ENTRADA_INICIAL,
      produtoId: produtoIdPreSelecionado || (produtos[0]?.id ?? ""),
      dataEntrada: new Date().toISOString().split("T")[0],
    });
    setErrosEntrada({});
    setErroEnvio(null);
    setModalEntradaAberto(true);
  }

  function fecharModalEntrada() {
    setModalEntradaAberto(false);
    setFormEntrada(FORM_ENTRADA_INICIAL);
    setErrosEntrada({});
    setErroEnvio(null);
  }

  function handleChangeEntrada(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormEntrada((prev) => ({ ...prev, [name]: value }));
    if (errosEntrada[name]) {
      setErrosEntrada((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }
  }

  async function handleSubmitEntrada(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoEntrada(true);
    setErrosEntrada({});
    setErroEnvio(null);
    setMensagemSucesso(null);

    try {
      const payload = {
        produtoId: formEntrada.produtoId,
        quantidade: formEntrada.quantidade === "" ? "" : Number(formEntrada.quantidade),
        dataEntrada: formEntrada.dataEntrada,
        dataValidade: formEntrada.dataValidade || null,
        custoUnitario: formEntrada.custoUnitario === "" ? null : Number(formEntrada.custoUnitario),
      };

      const res = await fetch("/api/estoque", {
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
        setErrosEntrada(mapa);
        return;
      }

      if (!res.ok) {
        setErroEnvio(data.erro ?? "Erro ao registrar entrada de estoque.");
        return;
      }

      const prodNome = produtos.find((p) => p.id === formEntrada.produtoId)?.nome || "Produto";
      setMensagemSucesso(`Entrada de ${formEntrada.quantidade} para "${prodNome}" registrada com sucesso!`);
      fecharModalEntrada();
      await carregarDados();

      // Expande automaticamente os lotes do produto que recebeu entrada
      if (formEntrada.produtoId) {
        setLotesExpandidos((prev) => ({ ...prev, [formEntrada.produtoId]: true }));
      }

      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch {
      setErroEnvio("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setSalvandoEntrada(false);
    }
  }

  // -------------------------------------------------------------------
  // Ações de Cadastro de Produto (preservado da Etapa 2)
  // -------------------------------------------------------------------
  function abrirModalProduto() {
    setFormProduto(FORM_PRODUTO_INICIAL);
    setErrosProduto({});
    setErroEnvio(null);
    setModalProdutoAberto(true);
  }

  function fecharModalProduto() {
    setModalProdutoAberto(false);
    setFormProduto(FORM_PRODUTO_INICIAL);
    setErrosProduto({});
    setErroEnvio(null);
  }

  function handleChangeProduto(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormProduto((prev) => ({ ...prev, [name]: value }));
    if (errosProduto[name]) {
      setErrosProduto((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }
  }

  async function handleSubmitProduto(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoProduto(true);
    setErrosProduto({});
    setErroEnvio(null);
    setMensagemSucesso(null);

    try {
      const payload = {
        nome: formProduto.nome,
        categoria: formProduto.categoria,
        unidadeMedida: formProduto.unidadeMedida,
        estoqueMinimo: formProduto.estoqueMinimo === "" ? "" : Number(formProduto.estoqueMinimo),
        estoqueIdeal: formProduto.estoqueIdeal === "" ? "" : Number(formProduto.estoqueIdeal),
        custoReferencia: formProduto.custoReferencia === "" ? null : Number(formProduto.custoReferencia),
      };

      const res = await fetch("/api/produtos", {
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
        setErrosProduto(mapa);
        return;
      }

      if (!res.ok) {
        setErroEnvio(data.erro ?? "Erro ao salvar produto. Tente novamente.");
        return;
      }

      setMensagemSucesso(`Produto "${data.produto.nome}" cadastrado com sucesso!`);
      fecharModalProduto();
      await carregarDados();

      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch {
      setErroEnvio("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setSalvandoProduto(false);
    }
  }

  // Estatísticas rápidas
  const totalProdutos = produtos.length;
  const produtosAbaixoMinimo = produtos.filter((p) => p.situacao === "ABAIXO_MINIMO").length;
  const totalLotes = produtos.reduce((acc, p) => acc + p.lotes.length, 0);

  return (
    <div>
      {/* Cabeçalho da página */}
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
          <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>
            Controle de Estoque & Lotes
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
            Gerenciamento de entradas de mercadorias, lotes FIFO e saldos disponíveis
          </p>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            id="btn-registrar-entrada"
            onClick={() => abrirModalEntrada()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
              transition: "background var(--transition)",
            }}
          >
            <span aria-hidden="true">📥</span> Registrar entrada
          </button>

          <button
            id="btn-cadastrar-produto"
            onClick={abrirModalProduto}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              border: "1.5px solid var(--color-border)",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
          >
            <span aria-hidden="true">＋</span> Novo produto
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Produtos Ativos
          </span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)", marginTop: "4px" }}>
            {totalProdutos}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Lotes em Estoque
          </span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)", marginTop: "4px" }}>
            {totalLotes}
          </div>
        </div>

        <div
          style={{
            background: produtosAbaixoMinimo > 0 ? "#fffbeb" : "var(--color-surface)",
            border: `1px solid ${produtosAbaixoMinimo > 0 ? "#fcd34d" : "var(--color-border)"}`,
            borderRadius: "10px",
            padding: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: produtosAbaixoMinimo > 0 ? "#b45309" : "var(--color-text-muted)",
              textTransform: "uppercase",
            }}
          >
            Abaixo do Mínimo
          </span>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: produtosAbaixoMinimo > 0 ? "#d97706" : "var(--color-text)",
              marginTop: "4px",
            }}
          >
            {produtosAbaixoMinimo}
          </div>
        </div>
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

      {/* Navegação por Abas */}
      <div
        style={{
          display: "flex",
          borderBottom: "1.5px solid var(--color-border)",
          marginBottom: "20px",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setAbaAtiva("estoque")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: abaAtiva === "estoque" ? "2.5px solid var(--color-primary)" : "2.5px solid transparent",
            fontWeight: abaAtiva === "estoque" ? 700 : 500,
            color: abaAtiva === "estoque" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition)",
          }}
        >
          📦 Saldo & Lotes de Estoque
        </button>
        <button
          onClick={() => setAbaAtiva("produtos")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: abaAtiva === "produtos" ? "2.5px solid var(--color-primary)" : "2.5px solid transparent",
            fontWeight: abaAtiva === "produtos" ? 700 : 500,
            color: abaAtiva === "produtos" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition)",
          }}
        >
          📋 Catálogo de Produtos
        </button>
      </div>

      {/* Barra de busca */}
      <div style={{ marginBottom: "16px" }}>
        <input
          id="busca-produto"
          type="search"
          placeholder="Buscar produto por nome, categoria ou unidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={estiloInput}
          aria-label="Buscar produto por nome, categoria ou unidade de medida"
        />
      </div>

      {/* Estado de carregamento */}
      {carregando && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <span aria-hidden="true" style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>
            ⏳
          </span>
          Carregando informações de estoque...
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
          <strong>Erro ao carregar dados</strong>
          <br />
          {erroCarregamento}
          <br />
          <button
            onClick={carregarDados}
            style={{
              marginTop: "10px",
              color: "#dc2626",
              background: "none",
              border: "1px solid #dc2626",
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Conteúdo Principal */}
      {!carregando && !erroCarregamento && (
        <>
          {produtosFiltrados.length === 0 ? (
            <EstadoVazio busca={busca} onCadastrar={abrirModalProduto} />
          ) : abaAtiva === "estoque" ? (
            <TabelaEstoqueLotes
              produtos={produtosFiltrados}
              lotesExpandidos={lotesExpandidos}
              onToggleLotes={toggleLotes}
              onNovaEntrada={abrirModalEntrada}
            />
          ) : (
            <TabelaCatalogoProdutos produtos={produtosFiltrados} />
          )}
        </>
      )}

      {/* Modal de Entrada de Estoque */}
      {modalEntradaAberto && (
        <ModalEntradaEstoque
          form={formEntrada}
          produtos={produtos}
          erros={errosEntrada}
          erroEnvio={erroEnvio}
          salvando={salvandoEntrada}
          onChange={handleChangeEntrada}
          onSubmit={handleSubmitEntrada}
          onFechar={fecharModalEntrada}
        />
      )}

      {/* Modal de Cadastro de Produto */}
      {modalProdutoAberto && (
        <ModalCadastroProduto
          form={formProduto}
          erros={errosProduto}
          erroEnvio={erroEnvio}
          salvando={salvandoProduto}
          onChange={handleChangeProduto}
          onSubmit={handleSubmitProduto}
          onFechar={fecharModalProduto}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Visualização de Estoque & Lotes (Etapa 4)
// ---------------------------------------------------------------
function TabelaEstoqueLotes({
  produtos,
  lotesExpandidos,
  onToggleLotes,
  onNovaEntrada,
}: {
  produtos: ProdutoEstoque[];
  lotesExpandidos: Record<string, boolean>;
  onToggleLotes: (id: string) => void;
  onNovaEntrada: (id?: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {produtos.map((p) => {
        const expandido = !!lotesExpandidos[p.id];
        const isAbaixoMinimo = p.situacao === "ABAIXO_MINIMO";

        return (
          <div
            key={p.id}
            style={{
              background: "var(--color-surface)",
              border: `1.5px solid ${isAbaixoMinimo ? "#fcd34d" : "var(--color-border)"}`,
              borderRadius: "12px",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
            }}
          >
            {/* Cabeçalho do Card de Produto */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                background: isAbaixoMinimo ? "#fffdf5" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "16px", color: "var(--color-text)" }}>{p.nome}</strong>
                    <span
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                      }}
                    >
                      {p.categoria}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    Mínimo:{" "}
                    <strong>
                      {p.estoqueMinimo} {p.unidadeMedida}
                    </strong>{" "}
                    | Ideal: {p.estoqueIdeal} {p.unidadeMedida}
                  </div>
                </div>
              </div>

              {/* Saldo Disponível & Situação */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Saldo disponível
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: isAbaixoMinimo ? "#dc2626" : "#059669",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.saldoDisponivel.toLocaleString("pt-BR")} {p.unidadeMedida}
                  </div>
                </div>

                {/* Badge de Situação */}
                <div>
                  {isAbaixoMinimo ? (
                    <span
                      style={{
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        fontSize: "12px",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span aria-hidden="true">⚠️</span> Abaixo do mínimo
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                        fontSize: "12px",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span aria-hidden="true">✓</span> Normal
                    </span>
                  )}
                </div>

                {/* Botões de Ação do Item */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => onNovaEntrada(p.id)}
                    title="Registrar nova entrada para este produto"
                    style={{
                      background: "var(--color-primary-light, #ecfdf5)",
                      color: "var(--color-primary-dark, #065f46)",
                      border: "1px solid var(--color-primary)",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Entrada
                  </button>

                  <button
                    onClick={() => onToggleLotes(p.id)}
                    aria-expanded={expandido}
                    style={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "var(--color-text)",
                    }}
                  >
                    <span>Lotes ({p.lotes.length})</span>
                    <span style={{ fontSize: "11px" }}>{expandido ? "▲" : "▼"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Detalhes dos Lotes Expansíveis */}
            {expandido && (
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)",
                  padding: "16px 20px",
                }}
              >
                {p.lotes.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--color-surface)",
                      borderRadius: "8px",
                      border: "1px dashed var(--color-border)",
                      color: "var(--color-text-muted)",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: "20px", display: "block", marginBottom: "4px" }}>
                      📦
                    </span>
                    Nenhum lote registrado para este produto. Saldo disponível: <strong>0 {p.unidadeMedida}</strong>.
                    <div style={{ marginTop: "8px" }}>
                      <button
                        onClick={() => onNovaEntrada(p.id)}
                        style={{
                          background: "var(--color-primary)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Registrar primeira entrada
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--color-text)",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>Lotes disponíveis para movimentação (Ordem FIFO / Validade):</span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1.5px solid var(--color-border)", textAlign: "left" }}>
                            <th style={{ padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 600 }}>ID Lote</th>
                            <th style={{ padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 600 }}>Entrada</th>
                            <th style={{ padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 600 }}>Validade</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--color-text-muted)", fontWeight: 600 }}>Qtd. Inicial</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--color-text-muted)", fontWeight: 600 }}>Qtd. Disponível</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--color-text-muted)", fontWeight: 600 }}>Custo Unit.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.lotes.map((lote) => {
                            const dataEntradaFmt = new Date(lote.dataEntrada).toLocaleDateString("pt-BR");
                            const dataValidadeFmt = lote.dataValidade
                              ? new Date(lote.dataValidade).toLocaleDateString("pt-BR")
                              : "—";

                            return (
                              <tr
                                key={lote.id}
                                style={{
                                  borderBottom: "1px solid var(--color-border)",
                                  background: "var(--color-surface)",
                                }}
                              >
                                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: "12px", color: "var(--color-text-muted)" }}>
                                  #{lote.id.slice(-6)}
                                </td>
                                <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{dataEntradaFmt}</td>
                                <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                                  {lote.dataValidade ? (
                                    <span style={{ fontWeight: 500 }}>{dataValidadeFmt}</span>
                                  ) : (
                                    <span style={{ color: "var(--color-text-muted)" }}>Não informada</span>
                                  )}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                  {lote.quantidadeInicial.toLocaleString("pt-BR")} {p.unidadeMedida}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "right",
                                    fontWeight: 700,
                                    color: "#059669",
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {lote.quantidadeAtual.toLocaleString("pt-BR")} {p.unidadeMedida}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                  {lote.custoUnitario !== null && lote.custoUnitario !== undefined
                                    ? `R$ ${lote.custoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// Modal de Entrada de Estoque (Etapa 4)
// ---------------------------------------------------------------
interface ModalEntradaEstoqueProps {
  form: FormEntradaState;
  produtos: ProdutoEstoque[];
  erros: Record<string, string>;
  erroEnvio: string | null;
  salvando: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFechar: () => void;
}

function ModalEntradaEstoque({
  form,
  produtos,
  erros,
  erroEnvio,
  salvando,
  onChange,
  onSubmit,
  onFechar,
}: ModalEntradaEstoqueProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onFechar]);

  const produtoSelecionado = produtos.find((p) => p.id === form.produtoId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-entrada-titulo"
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
          maxWidth: "540px",
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
          <div>
            <h2 id="modal-entrada-titulo" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>
              Registrar Entrada de Mercadoria
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>
              Gera um novo lote e incrementa o saldo disponível
            </p>
          </div>
          <button
            id="btn-fechar-modal-entrada"
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

        {/* Formulário */}
        <form id="form-entrada-estoque" onSubmit={onSubmit} noValidate style={{ padding: "24px" }}>
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
            {/* Produto */}
            <Campo id="campo-entrada-produto" label="Produto" obrigatorio erro={erros.produtoId}>
              <select
                id="campo-entrada-produto"
                name="produtoId"
                value={form.produtoId}
                onChange={onChange}
                style={estiloInput}
                aria-required="true"
              >
                <option value="">Selecione o produto...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.unidadeMedida}) — Atual: {p.saldoDisponivel} {p.unidadeMedida}
                  </option>
                ))}
              </select>
            </Campo>

            {/* Quantidade recebida */}
            <Campo
              id="campo-entrada-quantidade"
              label={`Quantidade recebida${produtoSelecionado ? ` (${produtoSelecionado.unidadeMedida})` : ""}`}
              obrigatorio
              erro={erros.quantidade}
              dica="Deve ser maior que zero"
            >
              <input
                id="campo-entrada-quantidade"
                name="quantidade"
                type="number"
                min="0.001"
                step="0.001"
                value={form.quantidade}
                onChange={onChange}
                placeholder="Ex: 10.5"
                style={estiloInput}
                aria-required="true"
              />
            </Campo>

            {/* Data de Entrada */}
            <Campo id="campo-entrada-data" label="Data de entrada" obrigatorio erro={erros.dataEntrada}>
              <input
                id="campo-entrada-data"
                name="dataEntrada"
                type="date"
                value={form.dataEntrada}
                onChange={onChange}
                style={estiloInput}
                aria-required="true"
              />
            </Campo>

            {/* Data de Validade */}
            <Campo
              id="campo-entrada-validade"
              label="Data de validade"
              erro={erros.dataValidade}
              dica="Opcional — essencial para controle de perecíveis e FIFO"
            >
              <input
                id="campo-entrada-validade"
                name="dataValidade"
                type="date"
                value={form.dataValidade}
                onChange={onChange}
                style={estiloInput}
              />
            </Campo>

            {/* Custo Unitário */}
            <Campo
              id="campo-entrada-custo"
              label="Custo unitário (R$)"
              erro={erros.custoUnitario}
              dica="Opcional — valor pago por unidade desta mercadoria"
            >
              <input
                id="campo-entrada-custo"
                name="custoUnitario"
                type="number"
                min="0"
                step="0.01"
                value={form.custoUnitario}
                onChange={onChange}
                placeholder="Ex: 8.90"
                style={estiloInput}
              />
            </Campo>
          </div>

          {/* Botões de Ação */}
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
              id="btn-cancelar-entrada"
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
              id="btn-confirmar-entrada"
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
                minWidth: "150px",
                justifyContent: "center",
                transition: "background var(--transition)",
              }}
            >
              {salvando ? "Salvando lote..." : "Confirmar entrada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Catálogo de Produtos (Preservado da Etapa 2)
// ---------------------------------------------------------------
function TabelaCatalogoProdutos({ produtos }: { produtos: ProdutoEstoque[] }) {
  const COLUNAS_TABELA = [
    { label: "Produto", align: "left" },
    { label: "Categoria", align: "left", width: "160px" },
    { label: "Unidade", align: "center", width: "90px" },
    { label: "Estoque mínimo", align: "right", width: "150px" },
    { label: "Estoque ideal", align: "right", width: "150px" },
    { label: "Custo ref.", align: "right", width: "130px" },
  ];

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
                    textAlign: col.align as "left" | "center" | "right",
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
              >
                <td style={{ padding: "14px 18px", fontWeight: 600, color: "var(--color-text)", fontSize: "14px" }}>
                  {p.nome}
                </td>
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
                <td style={{ padding: "14px 18px", textAlign: "center", fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                  <span style={{ background: "var(--color-surface-2)", padding: "3px 8px", borderRadius: "4px" }}>
                    {p.unidadeMedida}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                    {p.estoqueMinimo.toLocaleString("pt-BR")} {p.unidadeMedida}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
                    {p.estoqueIdeal.toLocaleString("pt-BR")} {p.unidadeMedida}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", textAlign: "right", fontSize: "14px", color: "var(--color-text)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {p.custoReferencia !== null && p.custoReferencia !== undefined ? (
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
        <span>
          {produtos.length} {produtos.length === 1 ? "produto cadastrado" : "produtos cadastrados"}
        </span>
      </div>
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
        <span aria-hidden="true" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>
          🔍
        </span>
        <p style={{ margin: 0, fontSize: "15px" }}>
          Nenhum produto encontrado para <strong>&ldquo;{busca}&rdquo;</strong>.
        </p>
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
      <span aria-hidden="true" style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>
        📦
      </span>
      <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>
        Nenhum produto cadastrado
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--color-text-muted)" }}>
        Comece cadastrando os produtos do seu estabelecimento antes de dar entrada no estoque.
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
// Modal de Cadastro de Produto (Preservado)
// ---------------------------------------------------------------
interface ModalCadastroProdutoProps {
  form: FormProdutoState;
  erros: Record<string, string>;
  erroEnvio: string | null;
  salvando: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFechar: () => void;
}

function ModalCadastroProduto({
  form,
  erros,
  erroEnvio,
  salvando,
  onChange,
  onSubmit,
  onFechar,
}: ModalCadastroProdutoProps) {
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

        <form id="form-cadastro-produto" onSubmit={onSubmit} noValidate style={{ padding: "24px" }}>
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
            <Campo id="campo-nome" label="Nome do produto" obrigatorio erro={erros.nome}>
              <input
                id="campo-nome"
                name="nome"
                type="text"
                value={form.nome}
                onChange={onChange}
                placeholder="Ex: Tomate, Frango, Farinha de Trigo"
                maxLength={200}
                style={estiloInput}
                autoFocus
              />
            </Campo>

            <Campo id="campo-categoria" label="Categoria" obrigatorio erro={erros.categoria}>
              <select
                id="campo-categoria"
                name="categoria"
                value={form.categoria}
                onChange={onChange}
                style={estiloInput}
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS_COMUNS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="campo-unidade" label="Unidade de medida" obrigatorio erro={erros.unidadeMedida}>
              <select
                id="campo-unidade"
                name="unidadeMedida"
                value={form.unidadeMedida}
                onChange={onChange}
                style={estiloInput}
              >
                <option value="">Selecione a unidade</option>
                {UNIDADES_COMUNS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Campo>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Campo
                id="campo-estoque-minimo"
                label="Estoque mínimo"
                obrigatorio
                erro={erros.estoqueMinimo}
                dica="Disparo de alerta"
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
                />
              </Campo>

              <Campo
                id="campo-estoque-ideal"
                label="Estoque ideal"
                obrigatorio
                erro={erros.estoqueIdeal}
                dica="Desejado em estoque"
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
                />
              </Campo>
            </div>

            <Campo
              id="campo-custo"
              label="Custo de referência (R$)"
              erro={erros.custoReferencia}
              dica="Opcional — usado para relatórios"
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
              />
            </Campo>
          </div>

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
              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </form>
      </div>
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
          <span aria-hidden="true" style={{ color: "var(--color-danger)", marginLeft: "3px" }}>
            *
          </span>
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
