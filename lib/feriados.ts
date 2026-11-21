// Feriados nacionais, regras por empresa e calendário de funcionamento.
// Fuso fixo: America/Sao_Paulo. Sem imports: roda direto no Node (teste e route).

export type RegraFeriado = {
  dia: number;
  mes: number;
  ano?: number;
  tipo: "FECHADO" | "ABERTO";
  abre?: string;
  fecha?: string;
  nome: string;
};

export type StatusDia = {
  fechado: boolean;
  nome: string | null;
  horarioEspecial: { abre: string; fecha: string } | null;
};

type EmpresaFeriado = { feriadosRegras?: string | null };

const TZ = "America/Sao_Paulo";
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const DIA_MS = 86400000;

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function chave(ano: number, mes: number, dia: number): string {
  return `${ano}-${pad(mes)}-${pad(dia)}`;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Páscoa: algoritmo de Meeus/Jones/Butcher. Devolve Date em UTC (meia-noite).
export function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = mod(19 * a + b - d - g + 15, 30);
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = mod(32 + 2 * e + 2 * i - h - k, 7);
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

// Feriados nacionais do ano, ordenados por data.
export function feriadosNacionais(ano: number): { chave: string; nome: string }[] {
  const fixos: [number, number, string][] = [
    [1, 1, "Confraternização Universal"],
    [4, 21, "Dia de Tiradentes"],
    [5, 1, "Dia do Trabalho"],
    [9, 7, "Dia da Independência"],
    [10, 12, "Nossa Senhora Aparecida"],
    [11, 2, "Finados"],
    [11, 15, "Proclamação da República"],
    [11, 20, "Dia da Consciência Negra"],
    [12, 25, "Natal"],
  ];
  const lista = fixos.map(([m, d, nome]) => ({ chave: chave(ano, m, d), nome }));
  const p = pascoa(ano).getTime();
  const moveis: [number, string][] = [
    [-48, "Carnaval (segunda)"],
    [-47, "Carnaval (terça)"],
    [-2, "Sexta-feira Santa"],
    [60, "Corpus Christi"],
  ];
  for (const [off, nome] of moveis) {
    const x = new Date(p + off * DIA_MS);
    lista.push({ chave: chave(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()), nome });
  }
  return lista.sort((x, y) => x.chave.localeCompare(y.chave));
}

function diasNoMes(mes: number, ano: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function horaValida(h: string): boolean {
  const m = h.match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  return +m[1] <= 23 && +m[2] <= 59;
}

// Linhas: "DD/MM" ou "DD/MM/AAAA" + "FECHADO [nome]" ou "ABERTO HH:MM-HH:MM [nome]".
// Linha inválida é ignorada.
export function parseRegras(texto: string | null | undefined): RegraFeriado[] {
  const out: RegraFeriado[] = [];
  for (const raw of (texto ?? "").split(/\r?\n/)) {
    const linha = raw.trim();
    if (!linha) continue;
    const m = linha.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s+(FECHADO|ABERTO)\b\s*(.*)$/i);
    if (!m) continue;
    const dia = +m[1];
    const mes = +m[2];
    const ano = m[3] ? +m[3] : undefined;
    if (mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(mes, ano ?? 2000)) continue;
    const tipo = m[4].toUpperCase() as "FECHADO" | "ABERTO";
    let resto = m[5].trim();
    let abre: string | undefined;
    let fecha: string | undefined;
    if (tipo === "ABERTO") {
      const h = resto.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})\s*(.*)$/);
      if (!h || !horaValida(h[1]) || !horaValida(h[2])) continue;
      abre = h[1];
      fecha = h[2];
      resto = h[3].trim();
    }
    out.push({ dia, mes, ano, tipo, abre, fecha, nome: resto || (tipo === "FECHADO" ? "Fechado" : "Horário especial") });
  }
  return out;
}

// Dia do calendário em São Paulo (independe do fuso do servidor).
function partesBRT(data: Date): { y: number; m: number; d: number } {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(data).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day };
}

// Regra da empresa vence o nacional. Feriado nacional sem regra = fechado.
export function statusDoDia(data: Date, empresa: EmpresaFeriado): StatusDia {
  const { y, m, d } = partesBRT(data);
  const cands = parseRegras(empresa?.feriadosRegras).filter(r => r.dia === d && r.mes === m && (r.ano === undefined || r.ano === y));
  const regra = cands.find(r => r.ano !== undefined) ?? cands[0];
  if (regra) {
    return {
      fechado: regra.tipo === "FECHADO",
      nome: regra.nome,
      horarioEspecial: regra.tipo === "ABERTO" ? { abre: regra.abre!, fecha: regra.fecha! } : null,
    };
  }
  const nac = feriadosNacionais(y).find(f => f.chave === chave(y, m, d));
  if (nac) return { fechado: true, nome: nac.nome, horarioEspecial: null };
  return { fechado: false, nome: null, horarioEspecial: null };
}

// Feriado nacional de HOJE (v1 global: ignora regras da empresa). Usado no horário comercial do follow-up.
export function ehFeriadoNacional(data: Date): boolean {
  const { y, m, d } = partesBRT(data);
  return feriadosNacionais(y).some(f => f.chave === chave(y, m, d));
}

// Texto do calendário para a IA. Ex.: "HOJE (20/11, sexta): FERIADO — Dia da Consciência Negra. LOJA FECHADA. Próximo dia de funcionamento: 21/11 (sábado)."
export function textoCalendario(agora: Date, empresa: EmpresaFeriado): string {
  const hoje = partesBRT(agora);
  const base = Date.UTC(hoje.y, hoje.m - 1, hoje.d);
  const dia = (offset: number) => {
    const x = new Date(base + offset * DIA_MS);
    return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(), wd: x.getUTCDay() };
  };
  const status = (x: { y: number; m: number; d: number }) =>
    statusDoDia(new Date(Date.UTC(x.y, x.m - 1, x.d, 15)), empresa); // 15h UTC = 12h BRT
  const rotulo = (x: { m: number; d: number; wd: number }) => `${pad(x.d)}/${pad(x.m)}, ${DIAS_SEMANA[x.wd]}`;
  const curto = (x: { m: number; d: number; wd: number }) => `${pad(x.d)}/${pad(x.m)} (${DIAS_SEMANA[x.wd]})`;

  const partes: string[] = [];

  // HOJE
  const h = dia(0);
  const sh = status(h);
  if (h.wd === 0 && !sh.fechado) {
    partes.push(`HOJE (${rotulo(h)}): domingo, LOJA FECHADA.`);
  } else if (sh.fechado) {
    partes.push(`HOJE (${rotulo(h)}): FERIADO — ${sh.nome}. LOJA FECHADA.`);
  } else if (sh.horarioEspecial) {
    partes.push(`HOJE (${rotulo(h)}): ESPECIAL — ${sh.nome}. Horário especial: ${sh.horarioEspecial.abre}-${sh.horarioEspecial.fecha}.`);
  } else {
    partes.push(`HOJE (${rotulo(h)}): dia normal.`);
  }
  if (sh.fechado || h.wd === 0) {
    for (let o = 1; o <= 30; o++) {
      const x = dia(o);
      const sx = status(x);
      if (x.wd !== 0 && !sx.fechado) {
        partes[0] = partes[0].replace(/\.$/, "") + `. Próximo dia de funcionamento: ${curto(x)}.`;
        break;
      }
    }
  }

  // AMANHÃ (só se for feriado ou especial)
  const am = dia(1);
  const sa = status(am);
  if (sa.fechado) partes.push(`AMANHÃ (${rotulo(am)}): FERIADO — ${sa.nome}. LOJA FECHADA.`);
  else if (sa.horarioEspecial) partes.push(`AMANHÃ (${rotulo(am)}): ESPECIAL — ${sa.nome}. Horário especial: ${sa.horarioEspecial.abre}-${sa.horarioEspecial.fecha}.`);

  // PRÓXIMOS 60 DIAS (só feriados e especiais)
  const prox: string[] = [];
  for (let o = 1; o <= 60; o++) {
    const x = dia(o);
    const s = status(x);
    if (s.fechado) prox.push(`${pad(x.d)}/${pad(x.m)} ${s.nome} (fechado)`);
    else if (s.horarioEspecial) prox.push(`${pad(x.d)}/${pad(x.m)} ${s.nome} (aberto ${s.horarioEspecial.abre}-${s.horarioEspecial.fecha})`);
  }
  partes.push(prox.length ? `PRÓXIMOS FERIADOS (60 dias): ${prox.join(", ")}.` : "PRÓXIMOS FERIADOS (60 dias): nenhum.");

  return partes.join(" ");
}
