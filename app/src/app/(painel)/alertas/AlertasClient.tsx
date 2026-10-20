"use client";

import { useEffect, useState } from "react";
import type { AlertasEstoque, LoteAlertaValidade, ProdutoEstoqueBaixo } from "@/lib/alertas-estoque";

const formatoData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

function quantidade(valor: number, unidade: string) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(valor)} ${unidade}`;
}

function CartaoResumo({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return (
    <div style={{ background: "var(--surface, #fff)", border: `1px solid ${cor}55`, borderLeft: `4px solid ${cor}`, borderRadius: 12, padding: "16px 18px", minWidth: 0 }}>
      <div style={{ color: "var(--text-secondary, #64748b)", fontSize: 13 }}>{titulo}</div>
      <div style={{ color: cor, fontSize: 28, fontWeight: 750, marginTop: 4 }}>{valor}</div>
    </div>
  );
}

function Secao<T>({ titulo, descricao, itens, cor, vazio, render }: {
  titulo: string; descricao: string; itens: T[]; cor: string; vazio: string;
  render: (item: T) => React.ReactNode;
}) {
  return (
    <section style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: 14, overflow: "hidden", minWidth: 0 }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border, #e2e8f0)", borderTop: `4px solid ${cor}` }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>{titulo} <span style={{ color: cor }}>({itens.length})</span></h2>
        <p style={{ margin: "5px 0 0", color: "var(--text-secondary, #64748b)", fontSize: 13 }}>{descricao}</p>
      </div>
      {itens.length ? <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{itens.map((item, index) => <li key={index} style={{ padding: "14px 18px", borderBottom: index < itens.length - 1 ? "1px solid var(--border, #e2e8f0)" : undefined }}>{render(item)}</li>)}</ul> : <p style={{ margin: 0, padding: 18, color: "var(--text-secondary, #64748b)", fontSize: 14 }}>{vazio}</p>}
    </section>
  );
}

function ItemBaixo({ item }: { item: ProdutoEstoqueBaixo }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
    <div><strong>{item.nome}</strong><div style={{ color: "var(--text-secondary, #64748b)", fontSize: 12, marginTop: 3 }}>{item.categoria}</div></div>
    <div style={{ textAlign: "right", fontSize: 13 }}><strong>{quantidade(item.saldoDisponivel, item.unidadeMedida)}</strong><div style={{ color: "var(--text-secondary, #64748b)", marginTop: 3 }}>mínimo {quantidade(item.estoqueMinimo, item.unidadeMedida)}</div></div>
  </div>;
}

function ItemValidade({ item, vencido }: { item: LoteAlertaValidade; vencido: boolean }) {
  const status = vencido ? `Vencido há ${Math.abs(item.dias)} ${Math.abs(item.dias) === 1 ? "dia" : "dias"}` : item.dias === 0 ? "Vence hoje" : item.dias === 1 ? "Vence amanhã" : `Vence em ${item.dias} dias`;
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
    <div><strong>{item.produtoNome}</strong><div style={{ color: "var(--text-secondary, #64748b)", fontSize: 12, marginTop: 3 }}>Lote {item.loteId.slice(0, 8)} · {item.categoria}</div></div>
    <div style={{ textAlign: "right", fontSize: 13 }}><strong>{status}</strong><div style={{ color: "var(--text-secondary, #64748b)", marginTop: 3 }}>{formatoData(item.dataValidade)} · {quantidade(item.quantidadeAtual, item.unidadeMedida)}</div></div>
  </div>;
}

export default function AlertasClient() {
  const [alertas, setAlertas] = useState<AlertasEstoque | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/alertas", { cache: "no-store" });
      if (!resposta.ok) throw new Error("Falha ao carregar alertas.");
      setAlertas(await resposta.json());
    } catch {
      setErro("Não foi possível carregar os alertas. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void carregar(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <main style={{ padding: "28px clamp(16px, 3vw, 32px)", maxWidth: 1240, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
    <header style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 26, margin: 0 }}>Alertas de estoque</h1>
      <p style={{ color: "var(--text-secondary, #64748b)", margin: "7px 0 0", fontSize: 14 }}>Saldos calculados pelos lotes atuais. Validades consideradas até 7 dias a partir de {alertas ? formatoData(alertas.dataReferencia) : "hoje"} ({alertas?.fusoHorario ?? "America/Manaus"}).</p>
    </header>
    {carregando && <p role="status">Carregando alertas…</p>}
    {erro && <div role="alert" style={{ padding: 16, borderRadius: 10, background: "#fef2f2", color: "#b91c1c", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>{erro}<button onClick={() => void carregar()}>Tentar novamente</button></div>}
    {alertas && !carregando && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 12, marginBottom: 22 }}>
        <CartaoResumo titulo="Estoque abaixo do mínimo" valor={alertas.resumo.estoqueBaixo} cor="#d97706" />
        <CartaoResumo titulo="Lotes vencidos" valor={alertas.resumo.vencidos} cor="#dc2626" />
        <CartaoResumo titulo="Vencem em até 7 dias" valor={alertas.resumo.vencemEm7Dias} cor="#ca8a04" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
        <Secao titulo="Estoque baixo" descricao="Produtos ativos com saldo total dos lotes abaixo do mínimo." itens={alertas.estoqueBaixo} cor="#d97706" vazio="Nenhum produto abaixo do estoque mínimo." render={(item) => <ItemBaixo item={item} />} />
        <Secao titulo="Produtos vencidos" descricao="Lotes com saldo positivo e validade anterior à data de hoje." itens={alertas.vencidos} cor="#dc2626" vazio="Nenhum lote vencido com saldo." render={(item) => <ItemValidade item={item} vencido />} />
        <Secao titulo="Próximos do vencimento" descricao="Lotes com saldo positivo que vencem hoje ou nos próximos 7 dias." itens={alertas.proximosDoVencimento} cor="#ca8a04" vazio="Nenhum lote vence nos próximos 7 dias." render={(item) => <ItemValidade item={item} vencido={false} />} />
      </div>
    </>}
  </main>;
}
