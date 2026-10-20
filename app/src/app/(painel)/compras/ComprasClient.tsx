"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "PENDENTE" | "RECEBIDO" | "CANCELADO";
interface Produto { id: string; nome: string; unidadeMedida: string }
interface ItemPedido {
  id: string; produtoId: string; produtoNome: string; unidadeMedida: string;
  quantidade: string; custoUnitario: string; total: string; dataValidade: string | null;
}
interface Pedido {
  id: string; fornecedor: string | null; dataPedido: string; observacoes: string | null;
  status: Status; total: string; dataRecebimento: string | null; dataCancelamento: string | null;
  criadoEm: string; itens: ItemPedido[];
}
interface LinhaFormulario { chave: number; produtoId: string; quantidade: string; custoUnitario: string }

const hojeLocal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Manaus", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const moeda = (valor: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));
const dataFmt = (valor: string) => {
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
};
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 11px", fontSize: 14, background: "var(--color-surface)", color: "var(--color-text)" };
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 8, padding: "10px 15px", background: "var(--color-primary)", color: "#fff", fontSize: 14, fontWeight: 650, cursor: "pointer" };

function mensagemErro(dados: { erro?: string; erros?: { mensagem: string }[] }, padrao: string) {
  return dados.erro ?? dados.erros?.map((erro) => erro.mensagem).join(" ") ?? padrao;
}

export default function ComprasClient() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [dataPedido, setDataPedido] = useState(hojeLocal);
  const [observacoes, setObservacoes] = useState("");
  const [linhas, setLinhas] = useState<LinhaFormulario[]>([{ chave: 1, produtoId: "", quantidade: "", custoUnitario: "" }]);
  const [proximaChave, setProximaChave] = useState(2);
  const [salvando, setSalvando] = useState(false);
  const [recebendo, setRecebendo] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState("");
  const [pedidoRecebimento, setPedidoRecebimento] = useState<string | null>(null);
  const [dataEntrada, setDataEntrada] = useState(hojeLocal);
  const [validades, setValidades] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [resPedidos, resEstoque] = await Promise.all([fetch("/api/compras", { cache: "no-store" }), fetch("/api/estoque", { cache: "no-store" })]);
      if (!resPedidos.ok || !resEstoque.ok) throw new Error("Falha ao carregar dados.");
      const [dadosPedidos, dadosEstoque] = await Promise.all([resPedidos.json(), resEstoque.json()]);
      setPedidos(dadosPedidos.pedidos);
      setProdutos(dadosEstoque.produtos.map((produto: Produto) => ({ id: produto.id, nome: produto.nome, unidadeMedida: produto.unidadeMedida })));
    } catch {
      setErro("Não foi possível carregar compras ou produtos. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void carregar(); }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  function atualizarLinha(chave: number, campo: keyof Omit<LinhaFormulario, "chave">, valor: string) {
    setLinhas((atuais) => atuais.map((linha) => linha.chave === chave ? { ...linha, [campo]: valor } : linha));
  }

  function adicionarLinha() {
    setLinhas((atuais) => [...atuais, { chave: proximaChave, produtoId: "", quantidade: "", custoUnitario: "" }]);
    setProximaChave((atual) => atual + 1);
  }

  async function criarPedido(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setSalvando(true); setErroAcao("");
    try {
      const resposta = await fetch("/api/compras", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fornecedor, dataPedido, observacoes, itens: linhas.map(({ produtoId, quantidade, custoUnitario }) => ({ produtoId, quantidade, custoUnitario })) }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(mensagemErro(dados, "Não foi possível criar o pedido."));
      setFornecedor(""); setObservacoes(""); setDataPedido(hojeLocal());
      setLinhas([{ chave: proximaChave, produtoId: "", quantidade: "", custoUnitario: "" }]);
      setProximaChave((atual) => atual + 1);
      await carregar();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Não foi possível criar o pedido.");
    } finally { setSalvando(false); }
  }

  async function receberPedido(pedido: Pedido) {
    if (!window.confirm(`Confirmar o recebimento integral dos ${pedido.itens.length} itens do pedido? Isso criará lotes no estoque.`)) return;
    setRecebendo(pedido.id); setErroAcao("");
    try {
      const resposta = await fetch(`/api/compras/${pedido.id}/receber`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataEntrada, itens: pedido.itens.map((item) => ({ itemId: item.id, dataValidade: validades[item.id] || null })) }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(mensagemErro(dados, "Não foi possível receber o pedido."));
      setPedidoRecebimento(null); await carregar();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Não foi possível receber o pedido.");
    } finally { setRecebendo(null); }
  }

  async function cancelarPedido(pedido: Pedido) {
    if (!window.confirm("Cancelar este pedido pendente? O estoque não será movimentado.")) return;
    setCancelando(pedido.id); setErroAcao("");
    try {
      const resposta = await fetch(`/api/compras/${pedido.id}/cancelar`, { method: "POST" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(mensagemErro(dados, "Não foi possível cancelar o pedido."));
      await carregar();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Não foi possível cancelar o pedido.");
    } finally { setCancelando(null); }
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const correspondeBusca = !termo || `${pedido.fornecedor ?? ""} ${pedido.itens.map((item) => item.produtoNome).join(" ")}`.toLocaleLowerCase("pt-BR").includes(termo);
    return (statusFiltro === "TODOS" || pedido.status === statusFiltro) && correspondeBusca;
  });

  return <main style={{ width: "100%", maxWidth: 1280, boxSizing: "border-box", margin: "0 auto", padding: "26px clamp(16px, 3vw, 32px)" }}>
    <header style={{ marginBottom: 22 }}><h1 style={{ margin: 0, fontSize: 25, fontWeight: 750 }}>Compras</h1><p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>Monte pedidos e receba todos os itens diretamente como lotes de estoque.</p></header>
    {erro && <div role="alert" style={{ marginBottom: 16, padding: 14, borderRadius: 9, background: "#fef2f2", color: "#b91c1c", display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>{erro}<button onClick={() => void carregar()}>Tentar novamente</button></div>}
    {erroAcao && <div role="alert" style={{ marginBottom: 16, padding: 14, borderRadius: 9, background: "#fef2f2", color: "#b91c1c" }}>{erroAcao}</div>}

    <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "18px clamp(14px, 2vw, 24px)", marginBottom: 22 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Novo pedido</h2>
      {produtos.length === 0 && !carregando && <p style={{ padding: 12, background: "#fffbeb", borderRadius: 8, color: "#92400e", fontSize: 13 }}>Cadastre um produto ativo no Estoque antes de montar um pedido.</p>}
      <form onSubmit={criarPedido}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Fornecedor (opcional)<input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} maxLength={200} placeholder="Nome informado no pedido" style={{ ...inputStyle, marginTop: 6, fontWeight: 400 }} /></label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Data do pedido<input required type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} style={{ ...inputStyle, marginTop: 6, fontWeight: 400 }} /></label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Observações<input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={500} placeholder="Opcional" style={{ ...inputStyle, marginTop: 6, fontWeight: 400 }} /></label>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {linhas.map((linha, index) => {
            const produto = produtos.find((p) => p.id === linha.produtoId);
            return <div key={linha.chave} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 10, padding: 12, border: "1px solid var(--color-border)", borderRadius: 9 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Produto {index + 1}<select required value={linha.produtoId} onChange={(e) => atualizarLinha(linha.chave, "produtoId", e.target.value)} style={{ ...inputStyle, marginTop: 5, fontWeight: 400 }}><option value="">Selecione</option>{produtos.map((item) => <option key={item.id} value={item.id}>{item.nome} ({item.unidadeMedida})</option>)}</select></label>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Quantidade{produto ? ` (${produto.unidadeMedida})` : ""}<input required type="number" min="0.001" step="0.001" value={linha.quantidade} onChange={(e) => atualizarLinha(linha.chave, "quantidade", e.target.value)} style={{ ...inputStyle, marginTop: 5, fontWeight: 400 }} /></label>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Custo unitário (R$)<input required type="number" min="0" step="0.01" value={linha.custoUnitario} onChange={(e) => atualizarLinha(linha.chave, "custoUnitario", e.target.value)} style={{ ...inputStyle, marginTop: 5, fontWeight: 400 }} /></label>
              {linhas.length > 1 && <button type="button" onClick={() => setLinhas((atuais) => atuais.filter((item) => item.chave !== linha.chave))} style={{ alignSelf: "end", padding: "10px 12px", borderRadius: 8, border: "1px solid #fecaca", color: "#b91c1c", background: "#fff", cursor: "pointer" }}>Remover item</button>}
            </div>;
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginTop: 15 }}><button type="button" onClick={adicionarLinha} style={{ border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", borderRadius: 8, padding: "9px 13px", cursor: "pointer" }}>+ Adicionar item</button><button type="submit" disabled={salvando || produtos.length === 0} style={{ ...buttonStyle, opacity: salvando ? 0.7 : 1 }}>{salvando ? "Salvando pedido…" : "Criar pedido pendente"}</button></div>
        <p style={{ margin: "10px 0 0", color: "var(--color-text-muted)", fontSize: 12 }}>O total é calculado no servidor com base nos itens e arredondamento monetário por item.</p>
      </form>
    </section>

    <section>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 13 }}><h2 style={{ fontSize: 19, margin: 0 }}>Histórico de pedidos</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><label><span className="sr-only">Filtrar por status</span><select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 145 }}><option value="TODOS">Todos os status</option><option value="PENDENTE">Pendentes</option><option value="RECEBIDO">Recebidos</option><option value="CANCELADO">Cancelados</option></select></label><input aria-label="Buscar fornecedor ou produto" placeholder="Fornecedor ou produto" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 190 }} /></div></div>
      {carregando && <p role="status" style={{ color: "var(--color-text-muted)" }}>Carregando pedidos…</p>}
      {!carregando && !erro && pedidosFiltrados.length === 0 && <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: 25, textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>{pedidos.length ? "Nenhum pedido corresponde aos filtros." : "Ainda não há pedidos de compra."}</div>}
      <div style={{ display: "grid", gap: 12 }}>
        {pedidosFiltrados.map((pedido) => {
          const corStatus = pedido.status === "PENDENTE" ? "#a16207" : pedido.status === "RECEBIDO" ? "#15803d" : "#64748b";
          return <article key={pedido.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap", padding: "15px 18px", borderBottom: "1px solid var(--color-border)" }}><div><div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}><strong>Pedido {pedido.id.slice(-8).toUpperCase()}</strong><span style={{ background: `${corStatus}18`, color: corStatus, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 750 }}>{pedido.status}</span></div><p style={{ margin: "5px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>{pedido.fornecedor || "Sem fornecedor informado"} · Pedido em {dataFmt(pedido.dataPedido)}</p></div><div style={{ textAlign: "right" }}><strong style={{ fontSize: 18 }}>{moeda(pedido.total)}</strong><div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"}</div></div></div>
            <div style={{ padding: "4px 18px" }}>{pedido.itens.map((item) => <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 12px", padding: "10px 0", borderBottom: "1px solid var(--color-border)", fontSize: 13 }}><strong>{item.produtoNome}</strong><strong style={{ textAlign: "right" }}>{moeda(item.total)}</strong><span style={{ color: "var(--color-text-muted)" }}>{item.quantidade} {item.unidadeMedida} × {moeda(item.custoUnitario)}{item.dataValidade ? ` · validade ${dataFmt(item.dataValidade)}` : ""}</span><span /></div>)}</div>
            {pedido.observacoes && <p style={{ margin: 0, padding: "5px 18px 12px", color: "var(--color-text-muted)", fontSize: 13 }}>Observações: {pedido.observacoes}</p>}
            {pedido.status === "PENDENTE" && <div style={{ padding: "12px 18px", display: "flex", flexWrap: "wrap", gap: 9, borderTop: "1px solid var(--color-border)" }}><button onClick={() => { setPedidoRecebimento(pedidoRecebimento === pedido.id ? null : pedido.id); setDataEntrada(hojeLocal()); setValidades({}); }} style={buttonStyle}>Receber pedido completo</button><button disabled={cancelando === pedido.id} onClick={() => void cancelarPedido(pedido)} style={{ border: "1px solid #fecaca", borderRadius: 8, padding: "9px 13px", background: "#fff", color: "#b91c1c", fontWeight: 600, cursor: "pointer" }}>{cancelando === pedido.id ? "Cancelando…" : "Cancelar pedido"}</button></div>}
            {pedido.status === "PENDENTE" && pedidoRecebimento === pedido.id && <div style={{ padding: 16, background: "#f8fafc", borderTop: "1px solid var(--color-border)" }}><h3 style={{ fontSize: 15, margin: "0 0 10px" }}>Receber todos os itens</h3><label style={{ display: "block", maxWidth: 260, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>Data de entrada<input type="date" required value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} style={{ ...inputStyle, marginTop: 5 }} /></label><div style={{ display: "grid", gap: 8 }}>{pedido.itens.map((item) => <label key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(150px, 220px)", gap: 10, alignItems: "center", padding: 10, background: "#fff", borderRadius: 8, fontSize: 13 }}><span>{item.produtoNome}<small style={{ display: "block", color: "var(--color-text-muted)" }}>{item.quantidade} {item.unidadeMedida}</small></span><span>Validade (opcional)<input type="date" value={validades[item.id] ?? ""} onChange={(e) => setValidades((atual) => ({ ...atual, [item.id]: e.target.value }))} style={{ ...inputStyle, marginTop: 4 }} /></span></label>)}</div><div style={{ display: "flex", gap: 9, justifyContent: "end", marginTop: 12 }}><button onClick={() => setPedidoRecebimento(null)} disabled={recebendo === pedido.id} style={{ padding: "9px 13px", border: "1px solid var(--color-border)", borderRadius: 8, background: "transparent", cursor: "pointer" }}>Voltar</button><button onClick={() => void receberPedido(pedido)} disabled={recebendo === pedido.id} style={{ ...buttonStyle, opacity: recebendo === pedido.id ? 0.7 : 1 }}>{recebendo === pedido.id ? "Recebendo…" : "Confirmar recebimento integral"}</button></div></div>}
          </article>;
        })}
      </div>
      {!carregando && pedidos.length >= 200 && <p style={{ color: "var(--color-text-muted)", fontSize: 12, textAlign: "center", marginTop: 14 }}>Exibindo os 200 pedidos mais recentes.</p>}
    </section>
  </main>;
}
