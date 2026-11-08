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
 *   { codigo, acao: 'remover', aba, id }
 *   { codigo, acao: 'voucher', id }  → { base64 } do PDF guardado na aba oculta Vouchers
 *
 * Tentativas com código errado são contadas: depois de LIMITE_ERROS, a API recusa tudo por
 * 6 horas, inclusive o código certo. Quem já abriu os dados continua com a cópia do aparelho.
 * A aba Vouchers nunca sai no 'ler', só por 'voucher'.
 */

// O que o portal pode gravar.
const EDITAVEIS = {
  Gastos: { adicionar: true, atualizar: true, prefixo: 'G' },
  Notas: { adicionar: true, atualizar: true, prefixo: 'N' },
  Checklist: { adicionar: true, colunas: ['Status', 'Responsável'], prefixo: 'C' },
  Hospedagens: { colunas: ['Status', 'Valor (R$)', 'Link', 'Observações'] },
  Transportes: { colunas: ['Status', 'Valor (R$)', 'Observações'] },
  Atracoes: { adicionar: true, atualizar: true, prefixo: 'A' },
  Restaurantes: { adicionar: true, atualizar: true, prefixo: 'R' },
};

// Colunas calculadas por ARRAYFORMULA na planilha: nunca escrever nelas.
const CALCULADAS = { Hospedagens: ['Noites'], Gastos: ['Valor em R$'] };
const CARIMBO = { Gastos: 'Atualizado em', Checklist: 'Atualizado em', Notas: 'Data', Atracoes: 'Atualizado em', Restaurantes: 'Atualizado em' };
const CRIACAO = { Atracoes: 'Criado em', Restaurantes: 'Criado em' };
// Remover: atração e restaurante ficam na planilha como "descartado"; gasto e nota são apagados.
const REMOVER = { Gastos: 'apagar', Notas: 'apagar', Atracoes: 'descartar', Restaurantes: 'descartar' };
const FORA_DA_LEITURA = ['Vouchers'];
const LIMITE_ERROS = 10;
const JANELA_ERROS = 21600; // segundos (6 horas, o máximo do CacheService)

function doPost(e) {
  try {
    const pedido = JSON.parse(e.postData.contents);
    const codigo = PropertiesService.getScriptProperties().getProperty('CODIGO_ACESSO');
    const cache = CacheService.getScriptCache();
    const erros = Number(cache.get('erros-codigo') || 0);
    if (erros >= LIMITE_ERROS) return responder({ ok: false, erro: 'bloqueado' });
    if (!codigo || String(pedido.codigo) !== codigo) {
      cache.put('erros-codigo', String(erros + 1), JANELA_ERROS);
      Utilities.sleep(1000);
      return responder({ ok: false, erro: 'codigo' });
    }
    if (pedido.acao === 'voucher') return responder({ ok: true, base64: lerVoucher(pedido.id) });
    if (pedido.acao === 'ler') return responder({ ok: true, geradoEm: new Date().toISOString(), fonte: 'planilha', abas: lerTudo() });
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (pedido.acao === 'adicionar') return responder({ ok: true, id: adicionarUmaVez(pedido) });
      if (pedido.acao === 'remover') return responder({ ok: true, id: remover(pedido.aba, pedido.id) });
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
  planilha().getSheets().forEach(function (sh) {
    if (FORA_DA_LEITURA.indexOf(sh.getName()) < 0) abas[sh.getName()] = lerAba(sh);
  });
  return abas;
}

// O PDF fica em base64, dividido em partes (uma célula guarda até 50 mil caracteres).
function lerVoucher(id) {
  const sh = planilha().getSheetByName('Vouchers');
  if (!sh) throw new Error('Sem vouchers');
  const partes = sh.getDataRange().getValues().slice(1)
    .filter(function (l) { return String(l[0]) === String(id); })
    .sort(function (a, b) { return a[1] - b[1]; })
    .map(function (l) { return l[2]; });
  if (!partes.length) throw new Error('Voucher não encontrado');
  return partes.join('');
}

// O mesmo pedido enviado duas vezes (resposta perdida por falta de sinal) grava uma vez só.
function adicionarUmaVez(pedido) {
  const cache = CacheService.getScriptCache();
  const chave = pedido.idLocal ? 'pedido-' + pedido.idLocal : null;
  const ja = chave ? cache.get(chave) : null;
  if (ja) return ja;
  const id = adicionar(pedido.aba, pedido.dados || {});
  if (chave) cache.put(chave, id, JANELA_ERROS);
  return id;
}

// Atração e restaurante: só o nome é obrigatório, e o mesmo nome na mesma cidade não entra duas
// vezes (a mesma conferência do site, repetida aqui para dois aparelhos ao mesmo tempo).
function validarNome(sh, cab, dados, idAtual) {
  const iNome = cab.indexOf('Nome');
  const iCidade = cab.indexOf('Cidade');
  const iStatus = cab.indexOf('Status');
  const iId = cab.indexOf('ID');
  const norm = function (v) { return String(v || '').trim().toLowerCase(); };
  const linhas = sh.getDataRange().getValues().slice(1);
  const atual = idAtual ? linhas.find(function (l) { return String(l[iId]) === String(idAtual); }) : null;
  const nome = 'Nome' in dados ? dados.Nome : (atual ? atual[iNome] : '');
  if (!norm(nome)) throw new Error('nome');
  const cidade = 'Cidade' in dados ? dados.Cidade : (atual ? atual[iCidade] : '');
  const repetido = linhas.some(function (l) {
    return l[iId] !== '' && String(l[iId]) !== String(idAtual) && l[iStatus] !== 'descartado' && norm(l[iNome]) === norm(nome)
      && (!norm(cidade) || !norm(l[iCidade]) || norm(l[iCidade]) === norm(cidade));
  });
  if (repetido) throw new Error('duplicado');
}

function validarGasto(dados, novo) {
  const faltando = function (k) { return novo ? !dados[k] : (k in dados && !dados[k]); };
  if (['Data', 'Descrição', 'Categoria', 'Moeda'].some(faltando)) throw new Error('dados');
  if ((novo || 'Valor' in dados) && !(Number(dados.Valor) > 0)) throw new Error('dados');
}

function validar(aba, sh, cab, dados, idAtual) {
  if (aba === 'Atracoes' || aba === 'Restaurantes') validarNome(sh, cab, dados, idAtual);
  if (aba === 'Gastos') validarGasto(dados, !idAtual);
  if (aba === 'Notas' && (!idAtual || 'Texto livre' in dados) && !String(dados['Texto livre'] || '').trim()) throw new Error('dados');
}

function remover(aba, id) {
  const modo = REMOVER[aba];
  if (!modo) throw new Error('Não é possível remover em ' + aba);
  const sh = planilha().getSheetByName(aba);
  const cab = cabecalho(sh);
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const pos = ids.findIndex(function (l) { return String(l[0]) === String(id); });
  if (pos < 0) throw new Error('ID não encontrado: ' + id);
  if (modo === 'descartar') {
    sh.getRange(pos + 2, cab.indexOf('Status') + 1).setValue('descartado');
    return id;
  }
  // Apaga o conteúdo e deixa a linha, para não desfazer as fórmulas das colunas calculadas.
  const bloqueadas = CALCULADAS[aba] || [];
  cab.forEach(function (nome, i) {
    if (bloqueadas.indexOf(nome) < 0) sh.getRange(pos + 2, i + 1).clearContent();
  });
  return id;
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
  validar(aba, sh, cab, dados, null);
  if (CRIACAO[aba]) dados[CRIACAO[aba]] = new Date();
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
  validar(aba, sh, cab, dados, id);
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
    } else if (typeof v === 'string' && /^[=+\-@]/.test(v)) {
      // Texto digitado no site nunca vira fórmula na planilha.
      v = "'" + v;
    }
    sh.getRange(linha, i + 1).setValue(v);
  });
}
