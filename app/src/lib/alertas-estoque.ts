export const FUSO_HORARIO_ALERTAS = "America/Manaus";
export const DIAS_ALERTA_VALIDADE = 7;

export interface LoteParaAlerta {
  id: string;
  quantidadeAtual: string;
  dataValidade: Date | string | null;
}

export interface ProdutoParaAlerta {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: string;
  ativo: boolean;
  lotes: LoteParaAlerta[];
}

export interface ProdutoEstoqueBaixo {
  produtoId: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  saldoDisponivel: number;
  estoqueMinimo: number;
}

export interface LoteAlertaValidade {
  loteId: string;
  produtoId: string;
  produtoNome: string;
  categoria: string;
  unidadeMedida: string;
  quantidadeAtual: number;
  dataValidade: string;
  dias: number;
}

export interface AlertasEstoque {
  dataReferencia: string;
  fusoHorario: string;
  diasAntecedencia: number;
  resumo: {
    estoqueBaixo: number;
    vencidos: number;
    vencemEm7Dias: number;
    total: number;
  };
  estoqueBaixo: ProdutoEstoqueBaixo[];
  vencidos: LoteAlertaValidade[];
  proximosDoVencimento: LoteAlertaValidade[];
}

function decimalParaMiliunidades(valor: string): bigint {
  const partes = /^([+-]?)(\d+)(?:\.(\d{1,3}))?$/.exec(valor);
  if (!partes) {
    throw new Error("Quantidade decimal inválida para cálculo de alerta.");
  }

  const sinal = partes[1] === "-" ? BigInt(-1) : BigInt(1);
  const inteiro = BigInt(partes[2]);
  const fracao = BigInt((partes[3] ?? "").padEnd(3, "0"));
  return sinal * (inteiro * BigInt(1000) + fracao);
}

function numeroDecimal(miliunidades: bigint): number {
  return Number(miliunidades) / 1000;
}

function dataLocalHoje(agora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO_ALERTAS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const obter = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value;
  const ano = obter("year");
  const mes = obter("month");
  const dia = obter("day");

  if (!ano || !mes || !dia) {
    throw new Error("Não foi possível determinar a data local dos alertas.");
  }

  return `${ano}-${mes}-${dia}`;
}

function dataValidadeComoDia(value: Date | string | null): string | null {
  if (value === null) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  // A validade é uma data de calendário gravada à meia-noite UTC pelo input date.
  return date.toISOString().slice(0, 10);
}

function ordinalDoDia(data: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!match) throw new Error("Data inválida para cálculo de alerta.");

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const timestamp = Date.UTC(ano, mes - 1, dia);
  const validada = new Date(timestamp);

  if (
    validada.getUTCFullYear() !== ano ||
    validada.getUTCMonth() !== mes - 1 ||
    validada.getUTCDate() !== dia
  ) {
    throw new Error("Data inválida para cálculo de alerta.");
  }

  return Math.floor(timestamp / 86_400_000);
}

/** Calcula alertas sem depender do banco para permitir testes isolados. */
export function calcularAlertasEstoque(
  produtos: ProdutoParaAlerta[],
  agora = new Date()
): AlertasEstoque {
  const hoje = dataLocalHoje(agora);
  const ordinalHoje = ordinalDoDia(hoje);
  const estoqueBaixo: ProdutoEstoqueBaixo[] = [];
  const vencidos: LoteAlertaValidade[] = [];
  const proximosDoVencimento: LoteAlertaValidade[] = [];

  for (const produto of produtos) {
    if (!produto.ativo) continue;

    const saldoMiliunidades = produto.lotes.reduce(
      (saldo, lote) => saldo + decimalParaMiliunidades(lote.quantidadeAtual),
      BigInt(0)
    );
    const minimoMiliunidades = decimalParaMiliunidades(produto.estoqueMinimo);

    if (saldoMiliunidades < minimoMiliunidades) {
      estoqueBaixo.push({
        produtoId: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        unidadeMedida: produto.unidadeMedida,
        saldoDisponivel: numeroDecimal(saldoMiliunidades),
        estoqueMinimo: numeroDecimal(minimoMiliunidades),
      });
    }

    for (const lote of produto.lotes) {
      const quantidadeMiliunidades = decimalParaMiliunidades(lote.quantidadeAtual);
      if (quantidadeMiliunidades <= BigInt(0)) continue;

      const validade = dataValidadeComoDia(lote.dataValidade);
      if (!validade) continue;

      const diferencaDias = ordinalDoDia(validade) - ordinalHoje;
      const alerta: LoteAlertaValidade = {
        loteId: lote.id,
        produtoId: produto.id,
        produtoNome: produto.nome,
        categoria: produto.categoria,
        unidadeMedida: produto.unidadeMedida,
        quantidadeAtual: numeroDecimal(quantidadeMiliunidades),
        dataValidade: validade,
        dias: diferencaDias,
      };

      if (diferencaDias < 0) {
        vencidos.push(alerta);
      } else if (diferencaDias <= DIAS_ALERTA_VALIDADE) {
        proximosDoVencimento.push(alerta);
      }
    }
  }

  estoqueBaixo.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const ordenarLotes = (a: LoteAlertaValidade, b: LoteAlertaValidade) =>
    a.dataValidade.localeCompare(b.dataValidade) ||
    a.produtoNome.localeCompare(b.produtoNome, "pt-BR") ||
    a.loteId.localeCompare(b.loteId);
  vencidos.sort(ordenarLotes);
  proximosDoVencimento.sort(ordenarLotes);

  return {
    dataReferencia: hoje,
    fusoHorario: FUSO_HORARIO_ALERTAS,
    diasAntecedencia: DIAS_ALERTA_VALIDADE,
    resumo: {
      estoqueBaixo: estoqueBaixo.length,
      vencidos: vencidos.length,
      vencemEm7Dias: proximosDoVencimento.length,
      total: estoqueBaixo.length + vencidos.length + proximosDoVencimento.length,
    },
    estoqueBaixo,
    vencidos,
    proximosDoVencimento,
  };
}
