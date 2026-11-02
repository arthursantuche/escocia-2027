// Leitura e gravação na planilha pelo Web App, com cópia local para uso offline
// e fila de gravações que sincroniza quando o sinal volta.
import { API_URL } from './config.js';

const CHAVE_DADOS = 'escocia2027:dados';
const CHAVE_FILA = 'escocia2027:fila';
const CHAVE_CODIGO = 'escocia2027:codigo';
const CHAVE_PESSOA = 'escocia2027:pessoa';

const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

export const codigo = {
  obter: () => ler(CHAVE_CODIGO, ''),
  definir: (c) => gravar(CHAVE_CODIGO, c),
  // Código recusado: o aparelho deixa de guardar também o que só o código libera.
  limpar: () => { localStorage.removeItem(CHAVE_CODIGO); localStorage.removeItem(CHAVE_DADOS); apagarVouchers(); },
};
export const pessoa = { obter: () => ler(CHAVE_PESSOA, ''), definir: (p) => gravar(CHAVE_PESSOA, p) };
// Em localhost, ?amostra usa data/amostra.json: testa o portal sem código e sem gravar na planilha.
const amostraLocal = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('amostra');
export const usaPlanilha = () => Boolean(API_URL) && !amostraLocal;
export const pendentesNaFila = () => ler(CHAVE_FILA, []).length;

export class CodigoInvalido extends Error {}
// A API respondeu e recusou o pedido (dado inválido, duplicado…): não adianta tentar de novo.
export class ErroServidor extends Error {}

async function chamar(corpo) {
  const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ ...corpo, codigo: codigo.obter() }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  const json = await r.json();
  if (!json.ok && json.erro === 'codigo') throw new CodigoInvalido();
  if (!json.ok) throw new ErroServidor(json.erro);
  return json;
}

// Última cópia do aparelho, com a fila aplicada: abre o site na hora, antes da planilha responder.
export function dadosDoAparelho() {
  if (!usaPlanilha()) return null;
  const cache = ler(CHAVE_DADOS, null);
  return cache ? { ...aplicarFila(cache), offline: true } : null;
}

// A planilha é a fonte de verdade: cada leitura substitui a cópia local inteira.
// Devolve { abas, geradoEm, fonte, offline, recusados }.
export async function carregar() {
  if (!usaPlanilha()) {
    const r = await fetch('data/amostra.json', { cache: 'no-cache' });
    return { ...(await r.json()), offline: false };
  }
  try {
    const recusados = await sincronizar();
    const dados = await chamar({ acao: 'ler' });
    gravar(CHAVE_DADOS, dados);
    return { ...dados, offline: false, recusados };
  } catch (err) {
    if (err instanceof CodigoInvalido || (err instanceof ErroServidor && err.message === 'bloqueado')) throw err;
    const cache = ler(CHAVE_DADOS, null);
    if (!cache) throw err;
    return { ...aplicarFila(cache), offline: true };
  }
}

// Grava (ou enfileira, se offline). Só atualiza a cópia local depois de a planilha aceitar
// ou de o pedido entrar na fila; uma recusa da API não deixa rastro no aparelho.
export async function salvar(op) {
  if (op.acao === 'adicionar' && !op.idLocal) op.idLocal = 'local-' + Date.now();
  // Registro criado sem sinal e ainda na fila: a edição entra no próprio pedido de criação,
  // e a remoção o cancela.
  if ((op.acao === 'atualizar' || op.acao === 'remover') && String(op.id).startsWith('local-')) {
    const fila = ler(CHAVE_FILA, []);
    const pedido = fila.find((f) => f.idLocal === op.id);
    if (pedido) {
      if (op.acao === 'atualizar') Object.assign(pedido.dados, op.dados);
      gravar(CHAVE_FILA, op.acao === 'remover' ? fila.filter((f) => f !== pedido) : fila);
      atualizarCopia(op);
      return { enfileirado: true };
    }
  }
  if (!usaPlanilha()) { atualizarCopia(op); return { enfileirado: false }; }
  try {
    const r = await chamar(op);
    atualizarCopia(op);
    return { enfileirado: false, id: r.id };
  } catch (err) {
    if (err instanceof CodigoInvalido || err instanceof ErroServidor) throw err;
    gravar(CHAVE_FILA, [...ler(CHAVE_FILA, []), op]);
    atualizarCopia(op);
    return { enfileirado: true };
  }
}

function atualizarCopia(op) {
  const cache = ler(CHAVE_DADOS, null);
  if (cache) gravar(CHAVE_DADOS, aplicar(cache, op));
}

// Um pedido recusado pela API sai da fila (senão travaria os seguintes para sempre).
export async function sincronizar() {
  const fila = ler(CHAVE_FILA, []);
  const recusados = [];
  while (fila.length) {
    try {
      await chamar(fila[0]);
    } catch (err) {
      if (!(err instanceof ErroServidor)) throw err;
      recusados.push(err.message);
    }
    fila.shift();
    gravar(CHAVE_FILA, fila);
  }
  return recusados;
}

function aplicar(dados, op) {
  const abas = { ...dados.abas };
  const linhas = [...(abas[op.aba] || [])];
  if (op.acao === 'adicionar') linhas.push({ ...op.dados, ID: op.idLocal });
  if (op.acao === 'atualizar') {
    const i = linhas.findIndex((l) => String(l.ID) === String(op.id));
    if (i >= 0) linhas[i] = { ...linhas[i], ...op.dados };
  }
  if (op.acao === 'remover') {
    const i = linhas.findIndex((l) => String(l.ID) === String(op.id));
    if (i >= 0) linhas.splice(i, 1);
  }
  abas[op.aba] = linhas;
  return { ...dados, abas };
}

function aplicarFila(dados) {
  return ler(CHAVE_FILA, []).reduce(aplicar, dados);
}

// ---------------------------------------------------------------- vouchers

// Os PDFs ficam numa aba oculta da planilha e só saem pela API, com o código de acesso.
// Depois de baixados, ficam no IndexedDB deste aparelho, para abrir na recepção sem sinal.
const BASE = 'escocia2027-vouchers';
const LOJA = 'pdfs';

function abrirBase() {
  return new Promise((ok, erro) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
}
async function naBase(modo, operacao) {
  const db = await abrirBase();
  return new Promise((ok, erro) => {
    const t = db.transaction(LOJA, modo);
    const r = operacao(t.objectStore(LOJA));
    t.oncomplete = () => { db.close(); ok(r.result); };
    t.onerror = t.onabort = () => { db.close(); erro(t.error); };
  });
}
export function apagarVouchers() {
  try { indexedDB.deleteDatabase(BASE); } catch { /* armazenamento indisponível */ }
}
export async function vouchersGuardados() {
  try { return (await naBase('readonly', (l) => l.getAllKeys())).map(String); } catch { return []; }
}

const paraBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

// Devolve os bytes do PDF: do aparelho, se já estiver lá; senão, da planilha.
export async function obterVoucher(id) {
  try {
    const salvo = await naBase('readonly', (l) => l.get(id));
    if (salvo) return salvo;
  } catch { /* sem IndexedDB: segue para a rede */ }
  let bytes;
  if (usaPlanilha()) {
    const r = await chamar({ acao: 'voucher', id });
    bytes = paraBytes(r.base64);
  } else {
    // Amostra local: um PDF de exemplo, sem dados de reserva.
    bytes = new Uint8Array(await (await fetch('data/voucher-exemplo.pdf')).arrayBuffer());
  }
  try { await naBase('readwrite', (l) => l.put(bytes, id)); } catch { /* segue sem guardar */ }
  return bytes;
}
