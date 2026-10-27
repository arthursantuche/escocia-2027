// Gera data/amostra.json a partir de apps-script/Setup.gs, no formato que o
// Web App do Apps Script vai devolver (etapa 4): { aba: [ {coluna: valor} ] },
// com as fórmulas da planilha já calculadas. Serve ao protótipo e ao modo offline.
// Uso: node scripts/gerar-amostra.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const contexto = {};
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(path.join(raiz, 'apps-script', 'Setup.gs'), 'utf8') + '\nthis.ABAS = ABAS;', contexto);

function iso(v) {
  if (Object.prototype.toString.call(v) !== '[object Date]') return v;
  const p = (n) => ('0' + n).slice(-2);
  return v.getFullYear() + '-' + p(v.getMonth() + 1) + '-' + p(v.getDate());
}

const dados = {};
contexto.ABAS.forEach((aba) => {
  dados[aba.nome] = aba.linhas.map((linha) => {
    const obj = {};
    aba.colunas.forEach((col, i) => { obj[col] = iso(linha[i]); });
    return obj;
  });
});

// Fórmulas da planilha.
const dia = 864e5;
dados.Hospedagens.forEach((h) => { h.Noites = (new Date(h['Saída']) - new Date(h.Entrada)) / dia; });
const cotacao = dados.Viagem.find((v) => v.Chave === 'cotacao_gbp_brl').Valor;
dados.Gastos.forEach((g) => { g['Valor em R$'] = g.Moeda === '£' ? g.Valor * cotacao : g.Valor; });
const soma = (lista, campo) => lista.reduce((t, x) => t + (Number(x[campo]) || 0), 0);
// Mesmas regras de formulasOrcamento() em Setup.gs.
const porStatus = (status) => ({
  'Passagens': soma(dados.Passagens.filter((p) => p.Status === status), 'Valor (R$)'),
  'Hospedagem': soma(dados.Hospedagens.filter((h) => h.Status === status), 'Valor (R$)'),
  'Transporte - carro': soma(dados.Transportes.filter((t) => t.Tipo === 'Carro' && t.Status === status), 'Valor (R$)'),
  'Transporte - trem': soma(dados.Transportes.filter((t) => t.Tipo === 'Trem' && t.Status === status), 'Valor (R$)'),
});
const reservado = porStatus('reservado');
const pagoAntes = porStatus('pago');
dados.Orcamento.forEach((o) => {
  const origem = o.Categoria in reservado;
  o['A pagar (R$)'] = origem ? reservado[o.Categoria] : '';
  o['Pago antes (R$)'] = origem ? pagoAntes[o.Categoria] : '';
  o['Na viagem (R$)'] = soma(dados.Gastos.filter((g) => g.Categoria === o.Categoria), 'Valor em R$');
  o['Pago (R$)'] = (Number(o['Pago antes (R$)']) || 0) + o['Na viagem (R$)'];
  o['Saldo (R$)'] = o['Previsto (R$)'] === '' ? '' : o['Previsto (R$)'] - (Number(o['A pagar (R$)']) || 0) - o['Pago (R$)'];
});

const saida = { geradoEm: new Date().toISOString(), fonte: 'amostra', abas: dados };
fs.mkdirSync(path.join(raiz, 'data'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'data', 'amostra.json'), JSON.stringify(saida, null, 2) + '\n');
console.log('data/amostra.json:', Object.keys(dados).map((k) => k + ' ' + dados[k].length).join(', '));
