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
const confirmado = (s) => s === 'reservado' || s === 'pago';
const soma = (lista, campo) => lista.reduce((t, x) => t + (Number(x[campo]) || 0), 0);
const pagoPor = {
  'Passagens': soma(dados.Passagens.filter((p) => confirmado(p.Status)), 'Valor (R$)'),
  'Hospedagem': soma(dados.Hospedagens.filter((h) => confirmado(h.Status)), 'Valor (R$)'),
  'Transporte - carro': soma(dados.Transportes.filter((t) => t.Tipo === 'Carro' && confirmado(t.Status)), 'Valor (R$)'),
  'Transporte - trem': soma(dados.Transportes.filter((t) => t.Tipo === 'Trem' && confirmado(t.Status)), 'Valor (R$)'),
};
dados.Orcamento.forEach((o) => {
  if (o.Categoria in pagoPor) o['Reservado/Pago (R$)'] = pagoPor[o.Categoria];
  o['Real (R$)'] = soma(dados.Gastos.filter((g) => g.Categoria === o.Categoria), 'Valor em R$');
});

const saida = { geradoEm: new Date().toISOString(), fonte: 'amostra', abas: dados };
fs.mkdirSync(path.join(raiz, 'data'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'data', 'amostra.json'), JSON.stringify(saida, null, 2) + '\n');
console.log('data/amostra.json:', Object.keys(dados).map((k) => k + ' ' + dados[k].length).join(', '));
