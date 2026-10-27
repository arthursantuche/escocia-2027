// Leitura e gravação na planilha pelo Web App, com cópia local para uso offline
// e fila de gravações que sincroniza quando o sinal volta.
import { API_URL } from './config.js';

const CHAVE_DADOS = 'escocia2027:dados';
const CHAVE_FILA = 'escocia2027:fila';
const CHAVE_CODIGO = 'escocia2027:codigo';
const CHAVE_PESSOA = 'escocia2027:pessoa';

const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

export const codigo = { obter: () => ler(CHAVE_CODIGO, ''), definir: (c) => gravar(CHAVE_CODIGO, c), limpar: () => localStorage.removeItem(CHAVE_CODIGO) };
export const pessoa = { obter: () => ler(CHAVE_PESSOA, ''), definir: (p) => gravar(CHAVE_PESSOA, p) };
// Em localhost, ?amostra usa data/amostra.json: testa o portal sem código e sem gravar na planilha.
const amostraLocal = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('amostra');
export const usaPlanilha = () => Boolean(API_URL) && !amostraLocal;
export const pendentesNaFila = () => ler(CHAVE_FILA, []).length;

export class CodigoInvalido extends Error {}

async function chamar(corpo) {
  const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ ...corpo, codigo: codigo.obter() }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  const json = await r.json();
  if (!json.ok && json.erro === 'codigo') throw new CodigoInvalido();
  if (!json.ok) throw new Error(json.erro);
  return json;
}

// Devolve { abas, geradoEm, fonte, offline }.
export async function carregar() {
  if (!usaPlanilha()) {
    const r = await fetch('data/amostra.json', { cache: 'no-cache' });
    return { ...(await r.json()), offline: false };
  }
  try {
    await sincronizar();
    const dados = await chamar({ acao: 'ler' });
    gravar(CHAVE_DADOS, dados);
    return { ...dados, offline: false };
  } catch (err) {
    if (err instanceof CodigoInvalido) throw err;
    const cache = ler(CHAVE_DADOS, null);
    if (!cache) throw err;
    return { ...aplicarFila(cache), offline: true };
  }
}

// Grava (ou enfileira, se offline). Atualiza a cópia local na hora.
export async function salvar(op) {
  const cache = ler(CHAVE_DADOS, null);
  if (op.acao === 'adicionar' && !op.idLocal) op.idLocal = 'local-' + Date.now();
  if (cache) gravar(CHAVE_DADOS, aplicar(cache, op));
  if (!usaPlanilha()) return { enfileirado: false };
  try {
    await chamar(op);
    return { enfileirado: false };
  } catch (err) {
    if (err instanceof CodigoInvalido) throw err;
    gravar(CHAVE_FILA, [...ler(CHAVE_FILA, []), op]);
    return { enfileirado: true };
  }
}

export async function sincronizar() {
  const fila = ler(CHAVE_FILA, []);
  while (fila.length) {
    await chamar(fila[0]);
    fila.shift();
    gravar(CHAVE_FILA, fila);
  }
}

function aplicar(dados, op) {
  const abas = { ...dados.abas };
  const linhas = [...(abas[op.aba] || [])];
  if (op.acao === 'adicionar') linhas.push({ ...op.dados, ID: op.idLocal });
  if (op.acao === 'atualizar') {
    const i = linhas.findIndex((l) => String(l.ID) === String(op.id));
    if (i >= 0) linhas[i] = { ...linhas[i], ...op.dados };
  }
  abas[op.aba] = linhas;
  return { ...dados, abas };
}

function aplicarFila(dados) {
  return ler(CHAVE_FILA, []).reduce(aplicar, dados);
}
