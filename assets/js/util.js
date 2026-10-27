// Formatação e pequenos utilitários compartilhados pelas páginas.
export const DIA = 864e5;
export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const gbp = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'GBP' });
export const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
// "Quarta-feira, 25/02"
export const diaSemana = (iso) => { const t = semana.format(data(iso)); return t[0].toUpperCase() + t.slice(1); };
export const dataLonga = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

export const $ = (id) => document.getElementById(id);
export const data = (iso) => new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
export const hojeISO = () => { const h = new Date(); return new Date(Date.UTC(h.getFullYear(), h.getMonth(), h.getDate())).toISOString().slice(0, 10); };
export const diasAte = (iso) => Math.round((data(iso) - data(hojeISO())) / DIA);
export const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const chaveValor = (linhas) => Object.fromEntries(linhas.map((l) => [l.Chave, l.Valor]));
export const confirmado = (s) => s === 'reservado' || s === 'pago';

export function valorBRL(gasto, cotacao) {
  if (gasto['Valor em R$'] !== '' && gasto['Valor em R$'] != null) return Number(gasto['Valor em R$']) || 0;
  const v = Number(gasto.Valor) || 0;
  return gasto.Moeda === '£' ? v * cotacao : v;
}

// Cria elementos sem innerHTML com dados da planilha (evita injeção de HTML).
export function el(tag, attrs = {}, ...filhos) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  });
  filhos.flat().forEach((f) => { if (f != null && f !== false) e.append(f instanceof Node ? f : String(f)); });
  return e;
}

// Foto de uma cidade (ou da abertura) em WebP, nas larguras geradas por scripts/baixar-fotos.py.
// A coluna Imagem da aba Cidades, quando preenchida, substitui a foto local.
export function foto(nome, sizes, imagem) {
  if (imagem) return { src: imagem };
  const base = `assets/img/cidades/${nome}`;
  return {
    src: `${base}-1600.webp`, sizes, width: 2400, height: 1600,
    srcset: [800, 1600, 2400].map((w) => `${base}-${w}.webp ${w}w`).join(', '),
  };
}

// Crédito exigido pelas licenças CC: autor, licença (com link), fonte e alteração.
export function creditoFoto(c) {
  const link = (href, texto) => (href ? el('a', { href, target: '_blank', rel: 'noopener' }, texto) : texto);
  return [`Foto: ${c.autor} · `, link(c.licencaUrl, c.licenca), ' · ', link(c.pagina, c.fonte || 'Wikimedia Commons'), c.alteracoes ? ` · ${c.alteracoes}` : ''];
}

// Valores de uma linha do Orçamento (regras em apps-script/Setup.gs, formulasOrcamento):
// A pagar = reservado e ainda não pago; Pago = pago antes da viagem + gastos na viagem;
// Saldo = previsto − a pagar − pago. Aceita as colunas de antes da migração
// ("Reservado/Pago" e "Real"), lidas como pago antes e na viagem.
export function valoresOrcamento(o) {
  const n = (k) => Number(o[k]) || 0;
  const novo = 'A pagar (R$)' in o;
  const previsto = o['Previsto (R$)'] === '' || o['Previsto (R$)'] == null ? null : n('Previsto (R$)');
  const aPagar = novo ? n('A pagar (R$)') : 0;
  const antes = novo ? n('Pago antes (R$)') : n('Reservado/Pago (R$)');
  const viagem = novo ? n('Na viagem (R$)') : n('Real (R$)');
  const pago = antes + viagem;
  return { categoria: o.Categoria, previsto, aPagar, antes, viagem, pago, saldo: previsto == null ? null : previsto - aPagar - pago };
}

// Totais do orçamento; o saldo geral desconta também o que foi pago fora do previsto.
export function totaisOrcamento(linhas) {
  const t = (k) => linhas.reduce((s, l) => s + (l[k] || 0), 0);
  return { previsto: t('previsto'), aPagar: t('aPagar'), antes: t('antes'), viagem: t('viagem'), pago: t('pago'), saldo: t('previsto') - t('aPagar') - t('pago') };
}

// Consultas de preço (aba Precos) agrupadas por hospedagem, da mais antiga à mais recente.
// Opções descartadas ficam de fora.
export function seriesPrecos(abas) {
  const hosp = Object.fromEntries((abas.Hospedagens || []).map((h) => [h.ID, h]));
  const grupos = {};
  (abas.Precos || []).forEach((p) => {
    const h = hosp[p.Hospedagem];
    if (!p['Valor (R$)'] || !p['Data da consulta'] || (h && h.Status === 'descartado')) return;
    (grupos[p.Hospedagem] ||= { id: p.Hospedagem, rotulo: `${p.Cidade} · ${p.Nome}`, cidade: p.Cidade, nome: p.Nome, pontos: [] })
      .pontos.push({ data: String(p['Data da consulta']).slice(0, 10), valor: Number(p['Valor (R$)']), fonte: p.Fonte });
  });
  return Object.values(grupos).map((g) => ({ ...g, pontos: g.pontos.sort((a, b) => a.data.localeCompare(b.data)) }));
}

// Nascer e pôr do sol (equação do nascer do sol, mesma base do algoritmo da NOAA; erro
// de poucos minutos). iso = 'AAAA-MM-DD'; latitude e longitude em graus (leste positivo).
// Conferido em 27/10/2026 com os horários das notas: até 5 min de diferença.
export function luzDoDia(iso, lat, lon) {
  const rad = Math.PI / 180;
  const d = String(iso).slice(0, 10);
  const juliano = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12) / DIA + 2440587.5;
  const j = Math.ceil(juliano - 2451545.0 + 0.0008) - lon / 360;
  const m = (357.5291 + 0.98560028 * j) % 360;
  const centro = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
  const lambda = (m + centro + 180 + 102.9372) % 360;
  const transito = 2451545.0 + j + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const senDecl = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * senDecl) / (Math.cos(lat * rad) * Math.cos(Math.asin(senDecl)));
  const meio = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad / 360;
  const quando = (jd) => new Date((jd - 2440587.5) * DIA);
  return { nascer: quando(transito - meio), por: quando(transito + meio) };
}
// Texto da luz do dia de uma parada: "Luz 07:12–17:53 · sair até 15:53" (o último horário
// para fazer o trecho de carro antes do pôr do sol).
export function textoLuz(luz) {
  if (!luz) return null;
  return `Luz ${hora.format(luz.nascer)}–${hora.format(luz.por)}` + (luz.saidaLimite ? ` · sair até ${hora.format(luz.saidaLimite)}` : '');
}
export const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

// Maior tempo de um trecho escrito como "~2 h 45 a 3 h" ou "~30 a 40 min", em minutos.
export function minutosMaximos(tempo) {
  const fim = String(tempo || '').split(' a ').pop();
  const h = fim.match(/(\d+)\s*h(?:\s*(\d+))?/);
  if (h) return Number(h[1]) * 60 + Number(h[2] || 0);
  const min = fim.match(/(\d+)\s*min/);
  return min ? Number(min[1]) : null;
}

// Luz do dia de uma parada do roteiro e, nos trechos de carro, o horário limite de saída
// para chegar antes do pôr do sol. Precisa de Latitude e Longitude na aba Cidades.
export function luzDaParada(parada, cidades) {
  const c = cidades.find((x) => x.Cidade === parada['Cidade visitada']);
  if (!c || c.Latitude === '' || c.Latitude == null || c.Longitude === '' || c.Longitude == null) return null;
  const { nascer, por } = luzDoDia(parada.Data, Number(c.Latitude), Number(c.Longitude));
  const viagem = parada.Deslocamento === 'Carro' ? minutosMaximos(parada.Tempo) : null;
  return { nascer, por, saidaLimite: viagem ? new Date(por - viagem * 6e4) : null };
}
