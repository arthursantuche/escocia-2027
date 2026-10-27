/**
 * Portal Escócia 2027 — API (Web App) ligada à planilha "Portal Escócia 2027 - Dados".
 *
 * Publicação: Implantar → Nova implantação → App da Web; executar como "Eu";
 * acesso "Qualquer pessoa". O código de acesso fica em Configurações do projeto →
 * Propriedades do script, na chave CODIGO_ACESSO (nunca no código).
 *
 * Todas as chamadas são POST com corpo JSON enviado como text/plain (evita o
 * preflight de CORS a partir do GitHub Pages):
 *   { codigo, acao: 'ler' }
 *   { codigo, acao: 'adicionar', aba, dados: { Coluna: valor } }
 *   { codigo, acao: 'atualizar', aba, id, dados: { Coluna: valor } }
 */

// O que o portal pode gravar (seção 11, decisão 3 do briefing).
const EDITAVEIS = {
  Gastos: { adicionar: true, atualizar: true, prefixo: 'G' },
  Notas: { adicionar: true, atualizar: true, prefixo: 'N' },
  Checklist: { adicionar: true, colunas: ['Status', 'Responsável'], prefixo: 'C' },
  Hospedagens: { colunas: ['Status', 'Valor (R$)', 'Link', 'Observações'] },
  Transportes: { colunas: ['Status', 'Valor (R$)', 'Observações'] },
  Atracoes: { colunas: ['Status'] },
  Precos: { adicionar: true, prefixo: 'P' },
};

// Colunas calculadas por ARRAYFORMULA na planilha: nunca escrever nelas.
const CALCULADAS = { Hospedagens: ['Noites'], Gastos: ['Valor em R$'] };
const CARIMBO = { Gastos: 'Atualizado em', Checklist: 'Atualizado em', Notas: 'Data' };

function doPost(e) {
  try {
    const pedido = JSON.parse(e.postData.contents);
    const codigo = PropertiesService.getScriptProperties().getProperty('CODIGO_ACESSO');
    if (!codigo || String(pedido.codigo) !== codigo) return responder({ ok: false, erro: 'codigo' });
    if (pedido.acao === 'ler') return responder({ ok: true, geradoEm: new Date().toISOString(), fonte: 'planilha', abas: lerTudo() });
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (pedido.acao === 'adicionar') return responder({ ok: true, id: adicionar(pedido.aba, pedido.dados || {}) });
      if (pedido.acao === 'atualizar') return responder({ ok: true, id: atualizar(pedido.aba, pedido.id, pedido.dados || {}) });
    } finally {
      lock.releaseLock();
    }
    return responder({ ok: false, erro: 'acao' });
  } catch (err) {
    return responder({ ok: false, erro: String(err && err.message || err) });
  }
}

function doGet() {
  return responder({ ok: true, servico: 'Portal Escócia 2027' });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function planilha() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Datas viram "AAAA-MM-DD" (ou ISO completo quando têm hora), como em data/amostra.json.
function serializar(v) {
  if (Object.prototype.toString.call(v) !== '[object Date]') return v;
  const tz = planilha().getSpreadsheetTimeZone();
  // Datas puras ficam à meia-noite (importadas) ou ao meio-dia (gravadas pela API).
  const comHora = !((v.getHours() === 0 || v.getHours() === 12) && v.getMinutes() === 0 && v.getSeconds() === 0);
  return Utilities.formatDate(v, tz, comHora ? "yyyy-MM-dd'T'HH:mm:ss" : 'yyyy-MM-dd');
}

function lerAba(sh) {
  const valores = sh.getDataRange().getValues();
  const cab = valores.shift();
  return valores
    .filter(function (l) { return l.some(function (c) { return c !== '' && c !== null; }) && !(cab[0] === 'ID' && l[0] === ''); })
    .map(function (l) {
      const o = {};
      cab.forEach(function (c, i) { o[c] = serializar(l[i]); });
      return o;
    });
}

function lerTudo() {
  const abas = {};
  planilha().getSheets().forEach(function (sh) { abas[sh.getName()] = lerAba(sh); });
  return abas;
}

function cabecalho(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

function regra(aba) {
  const r = EDITAVEIS[aba];
  if (!r) throw new Error('Aba não editável: ' + aba);
  return r;
}

function adicionar(aba, dados) {
  const r = regra(aba);
  if (!r.adicionar) throw new Error('Não é possível adicionar em ' + aba);
  const sh = planilha().getSheetByName(aba);
  const cab = cabecalho(sh);
  // Primeira linha sem ID (as linhas abaixo podem ter fórmulas ou validações).
  const ids = sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), 1).getValues();
  let linha = ids.findIndex(function (l) { return l[0] === ''; });
  linha = linha < 0 ? sh.getMaxRows() + 1 : linha + 2;
  const id = r.prefixo + Utilities.formatDate(new Date(), 'UTC', 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
  dados.ID = id;
  if (CARIMBO[aba]) dados[CARIMBO[aba]] = new Date();
  escrever(sh, cab, linha, dados, aba);
  return id;
}

function atualizar(aba, id, dados) {
  const r = regra(aba);
  const sh = planilha().getSheetByName(aba);
  const cab = cabecalho(sh);
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const pos = ids.findIndex(function (l) { return String(l[0]) === String(id); });
  if (pos < 0) throw new Error('ID não encontrado: ' + id);
  const permitidas = r.atualizar ? null : r.colunas;
  const filtrados = {};
  Object.keys(dados).forEach(function (k) {
    if (k !== 'ID' && (!permitidas || permitidas.indexOf(k) >= 0)) filtrados[k] = dados[k];
  });
  if (CARIMBO[aba] && aba !== 'Notas') filtrados[CARIMBO[aba]] = new Date();
  escrever(sh, cab, pos + 2, filtrados, aba);
  return id;
}

function escrever(sh, cab, linha, dados, aba) {
  const bloqueadas = CALCULADAS[aba] || [];
  Object.keys(dados).forEach(function (col) {
    const i = cab.indexOf(col);
    if (i < 0 || bloqueadas.indexOf(col) >= 0) return;
    let v = dados[col];
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const p = v.split('-');
      v = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
    }
    sh.getRange(linha, i + 1).setValue(v);
  });
}
