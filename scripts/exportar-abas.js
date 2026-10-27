// Exporta a definição das abas de apps-script/Setup.gs como JSON (stdout),
// para gerar a planilha sem executar o Apps Script. Datas viram {"$data": "AAAA-MM-DD"}.
// Uso: node scripts/exportar-abas.js > abas.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const origem = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Setup.gs'), 'utf8');
const contexto = {};
vm.createContext(contexto);
vm.runInContext(origem + '\nthis.ABAS = ABAS;', contexto);

function pad(n) { return ('0' + n).slice(-2); }
const json = JSON.stringify(contexto.ABAS, function (chave, valor) {
  const bruto = this[chave];
  if (Object.prototype.toString.call(bruto) === '[object Date]') {
    return { $data: bruto.getFullYear() + '-' + pad(bruto.getMonth() + 1) + '-' + pad(bruto.getDate()) };
  }
  return valor;
}, 2);
process.stdout.write(json + '\n');
