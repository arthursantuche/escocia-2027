// Formatação e pequenos utilitários compartilhados pelas páginas.
export const DIA = 864e5;
export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const gbp = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'GBP' });
export const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
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
