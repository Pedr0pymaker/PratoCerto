"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardData {
  resumo: {
    produtosAtivos: number;
    estoqueBaixo: number;
    lotesVencidos: number;
    lotesVencemEm7Dias: number;
    totalPerdas: number;
    custoEstimadoPerdas: number;
  };
  alertas: {
    estoqueBaixo: { produtoId: string; nome: string; unidadeMedida: string; saldoDisponivel: number; estoqueMinimo: number }[];
    vencidos: { loteId: string; produtoNome: string; dataValidade: string; quantidadeAtual: number; unidadeMedida: string; dias: number }[];
    proximosDoVencimento: { loteId: string; produtoNome: string; dataValidade: string; quantidadeAtual: number; unidadeMedida: string; dias: number }[];
  };
  movimentacoes: { id: string; tipo: "ENTRADA" | "PERDA"; produtoId: string; produtoNome: string; unidadeMedida: string; quantidade: number; dataHora: string; descricao: string; href: string }[];
}

const surface = "var(--color-surface, #fff)";
const border = "var(--color-border, #e2e8f0)";
const muted = "var(--color-text-muted, #64748b)";
const primary = "var(--color-primary, #4f46e5)";

function numero(valor: number, casas = 3) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(valor);
}

function dataLocal(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Manaus",
  }).format(new Date(iso));
}

function dataCalendario(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function Cartao({ icon, label, valor, descricao, href, cor }: {
  icon: string; label: string; valor: string; descricao: string; href: string; cor: string;
}) {
  return <Link href={href} style={{ color: "inherit", textDecoration: "none", minWidth: 0 }}>
    <article style={{ height: "100%", boxSizing: "border-box", background: surface, border: `1px solid ${border}`, borderTop: `4px solid ${cor}`, borderRadius: 12, padding: 17, transition: "box-shadow 150ms" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, color: muted, fontSize: 13 }}><span aria-hidden="true">{icon}</span>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.7px", marginTop: 9 }}>{valor}</div>
      <div style={{ color: muted, fontSize: 12, marginTop: 5 }}>{descricao} <span aria-hidden="true">↗</span></div>
    </article>
  </Link>;
}

function ListaSecao({ titulo, itens, temItens, href, children, vazio }: {
  titulo: string; itens: number; temItens: boolean; href: string; children: React.ReactNode; vazio: string;
}) {
  return <section style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, minWidth: 0, overflow: "hidden" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: `1px solid ${border}` }}>
      <h2 style={{ margin: 0, fontSize: 16 }}>{titulo} <span style={{ color: muted, fontSize: 13 }}>({itens})</span></h2>
      <Link href={href} style={{ color: primary, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Ver todos →</Link>
    </div>
    {!temItens ? <p style={{ padding: "12px 18px", color: muted, fontSize: 13 }}>{vazio}</p> : <div>{children}</div>}
  </section>;
}

export default function DashboardClient() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/dashboard", { cache: "no-store" });
      if (!resposta.ok) throw new Error("Falha ao carregar dashboard");
      setDados(await resposta.json());
    } catch {
      setErro("Não foi possível carregar os indicadores. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void carregar(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <main style={{ padding: "26px clamp(16px, 3vw, 32px)", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
    <header style={{ marginBottom: 22 }}>
      <h1 style={{ margin: 0, fontSize: 25, fontWeight: 750 }}>Dashboard</h1>
      <p style={{ margin: "6px 0 0", color: muted, fontSize: 14 }}>Visão geral do estoque e das movimentações do estabelecimento.</p>
    </header>
    {carregando && <p role="status" style={{ color: muted }}>Carregando dados do Dashboard…</p>}
    {erro && <div role="alert" style={{ background: "#fef2f2", color: "#b91c1c", padding: 15, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>{erro}<button onClick={() => void carregar()}>Tentar novamente</button></div>}
    {dados && !carregando && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 195px), 1fr))", gap: 12, marginBottom: 22 }}>
        <Cartao icon="📦" label="Produtos ativos" valor={numero(dados.resumo.produtosAtivos, 0)} descricao="No catálogo" href="/estoque" cor={primary} />
        <Cartao icon="⚠️" label="Abaixo do mínimo" valor={numero(dados.resumo.estoqueBaixo, 0)} descricao="Produtos para repor" href="/alertas" cor="#d97706" />
        <Cartao icon="⛔" label="Lotes vencidos" valor={numero(dados.resumo.lotesVencidos, 0)} descricao="Com saldo disponível" href="/alertas" cor="#dc2626" />
        <Cartao icon="🗓️" label="Vencem em 7 dias" valor={numero(dados.resumo.lotesVencemEm7Dias, 0)} descricao="Inclui os que vencem hoje" href="/alertas" cor="#ca8a04" />
        <Cartao icon="📉" label="Registros de perdas" valor={numero(dados.resumo.totalPerdas, 0)} descricao={`${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dados.resumo.custoEstimadoPerdas)} de custo estimado`} href="/perdas" cor="#be123c" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 16, marginBottom: 20 }}>
        <ListaSecao titulo="Produtos abaixo do mínimo" itens={dados.resumo.estoqueBaixo} temItens={dados.alertas.estoqueBaixo.length > 0} href="/alertas" vazio="Nenhum produto está abaixo do estoque mínimo.">
          {dados.alertas.estoqueBaixo.map((item) => <Link key={item.produtoId} href="/alertas" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${border}`, textDecoration: "none", color: "inherit", fontSize: 13 }}><strong>{item.nome}</strong><span style={{ textAlign: "right", color: muted }}>{numero(item.saldoDisponivel)} / {numero(item.estoqueMinimo)} {item.unidadeMedida}</span></Link>)}
        </ListaSecao>
        <ListaSecao titulo="Lotes vencidos" itens={dados.resumo.lotesVencidos} temItens={dados.alertas.vencidos.length > 0} href="/alertas" vazio="Nenhum lote vencido com saldo positivo.">
          {dados.alertas.vencidos.map((item) => <Link key={item.loteId} href="/alertas" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${border}`, textDecoration: "none", color: "inherit", fontSize: 13 }}><strong>{item.produtoNome}</strong><span style={{ textAlign: "right", color: "#b91c1c" }}>{dataCalendario(item.dataValidade)} · {numero(item.quantidadeAtual)} {item.unidadeMedida}</span></Link>)}
        </ListaSecao>
        <ListaSecao titulo="Próximos do vencimento" itens={dados.resumo.lotesVencemEm7Dias} temItens={dados.alertas.proximosDoVencimento.length > 0} href="/alertas" vazio="Nenhum lote vence nos próximos 7 dias.">
          {dados.alertas.proximosDoVencimento.map((item) => <Link key={item.loteId} href="/alertas" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${border}`, textDecoration: "none", color: "inherit", fontSize: 13 }}><strong>{item.produtoNome}</strong><span style={{ textAlign: "right", color: "#a16207" }}>{dataCalendario(item.dataValidade)} · {numero(item.quantidadeAtual)} {item.unidadeMedida}</span></Link>)}
        </ListaSecao>
      </div>

      <ListaSecao titulo="Movimentações recentes" itens={dados.movimentacoes.length} temItens={dados.movimentacoes.length > 0} href="/estoque" vazio="Ainda não há entradas nem registros de perdas.">
        {dados.movimentacoes.map((item) => <Link key={item.id} href={item.href} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 14px", padding: "12px 18px", borderBottom: `1px solid ${border}`, textDecoration: "none", color: "inherit" }}>
          <strong style={{ fontSize: 13 }}>{item.tipo === "ENTRADA" ? "📥" : "📉"} {item.produtoNome}</strong>
          <span style={{ fontSize: 12, color: muted, textAlign: "right" }}>{dataLocal(item.dataHora)}</span>
          <span style={{ fontSize: 12, color: muted }}>{item.descricao}</span>
          <span style={{ fontSize: 12, textAlign: "right" }}>{item.tipo === "ENTRADA" ? "+" : "−"}{numero(item.quantidade)} {item.unidadeMedida}</span>
        </Link>)}
      </ListaSecao>
    </>}
    {!carregando && !erro && dados && dados.resumo.produtosAtivos === 0 && dados.resumo.totalPerdas === 0 && dados.movimentacoes.length === 0 && <p style={{ marginTop: 18, color: muted, fontSize: 13 }}>Cadastre produtos e registre entradas para começar a acompanhar os indicadores.</p>}
  </main>;
}
