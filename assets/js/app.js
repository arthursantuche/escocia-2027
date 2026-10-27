// Portal Escócia 2027: carrega os dados (planilha via Apps Script, ou cópia local
// offline), monta o painel e as demais páginas por rota (#painel, #cidade/<nome>…).
// Nenhum valor da viagem fica fixo no código.
import { graficoOrcamento, graficoNoites } from './graficos.js';
import { iniciarMovimento, atualizarMovimento } from './movimento.js';
import { carregar, salvar, sincronizar, codigo, usaPlanilha, pendentesNaFila, CodigoInvalido } from './dados.js';
import { $, el, brl, dataCurta, dataLonga, data, diasAte, slug, chaveValor } from './util.js';
import { paginaCidade, paginaOrcamento, paginaChecklist, paginaRegistrar, paginaViagem } from './views.js';

const ctx = { abas: null, v: null, creditos: {}, salvar: null };

// ---------------------------------------------------------------- avisos

function avisar(texto) {
  const t = $('aviso');
  t.textContent = texto;
  t.hidden = false;
  clearTimeout(avisar.timer);
  avisar.timer = setTimeout(() => { t.hidden = true; }, 3500);
}

function atualizarEstado(dados) {
  const fila = pendentesNaFila();
  const partes = [];
  if (dados.offline) partes.push('Sem conexão: mostrando a última versão salva');
  if (fila) partes.push(`${fila} alteração(ões) aguardando sinal`);
  if (dados.geradoEm) partes.push(`Atualizado em ${new Date(dados.geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`);
  $('estado').textContent = partes.join(' · ');
}

ctx.salvar = async (op, mensagem) => {
  try {
    const r = await salvar(op);
    avisar(r.enfileirado ? 'Sem sinal: salvo no aparelho e enviado quando a conexão voltar.' : mensagem);
    await recarregar(false);
  } catch (err) {
    if (err instanceof CodigoInvalido) return pedirCodigo('Código de acesso inválido.');
    avisar('Não foi possível salvar: ' + err.message);
  }
};

// ---------------------------------------------------------------- painel

function renderPainel() {
  const { abas, v } = ctx;
  $('periodo').textContent = `${dataCurta.format(data(v.inicio))} a ${dataLonga.format(data(v.saida_escocia))}`;
  $('viajantes').textContent = v.viajantes;
  const dias = diasAte(v.inicio);
  $('dias').textContent = Math.max(dias, 0);
  $('dias-legenda').textContent = dias > 0 ? (dias === 1 ? 'dia para o embarque' : 'dias para o embarque') : 'Boa viagem!';

  const pendentes = abas.Checklist.filter((c) => c.Status !== 'feito' && c.Prazo).sort((a, b) => String(a.Prazo).localeCompare(String(b.Prazo)));
  const proximo = pendentes[0];
  $('proximo').hidden = !proximo;
  if (proximo) {
    const d = diasAte(proximo.Prazo);
    $('proximo-titulo').textContent = proximo.Item;
    $('proximo-detalhe').textContent = `Prazo ${dataLonga.format(data(proximo.Prazo))} · ${d >= 0 ? `faltam ${d} dias` : `atrasado ${-d} dias`} · ${proximo['Responsável']}`;
  }

  const orc = abas.Orcamento;
  const soma = (campo) => orc.reduce((t, o) => t + (Number(o[campo]) || 0), 0);
  $('orc-previsto').textContent = brl.format(soma('Previsto (R$)'));
  $('orc-detalhe').textContent = `Reservado ou pago: ${brl.format(soma('Reservado/Pago (R$)'))} · Gasto real: ${brl.format(soma('Real (R$)'))}`;
  graficoOrcamento($('grafico-orcamento'), orc.filter((o) => o['Previsto (R$)'] || o['Reservado/Pago (R$)'] || o['Real (R$)']));

  const chk = abas.Checklist;
  const feitos = chk.filter((c) => c.Status === 'feito').length;
  const pct = chk.length ? Math.round((feitos / chk.length) * 100) : 0;
  $('chk-numero').textContent = `${feitos} de ${chk.length}`;
  $('chk-barra').style.width = pct + '%';
  $('chk-barra-wrap').setAttribute('aria-valuenow', pct);
  $('chk-detalhe').textContent = `${chk.length - feitos} pendências ⚠️. ${pct}% concluído.`;

  // Opções alternativas (mesma cidade e datas) contam uma vez; descartadas não contam.
  const vistas = new Set();
  const noites = {};
  abas.Hospedagens.filter((h) => h.Status !== 'descartado').forEach((h) => {
    const chave = h.Cidade + h.Entrada;
    if (vistas.has(chave)) return;
    vistas.add(chave);
    noites[h.Cidade] = (noites[h.Cidade] || 0) + Number(h.Noites || 0);
  });
  $('noites-total').textContent = `${Object.values(noites).reduce((a, b) => a + b, 0)} noites`;
  graficoNoites($('grafico-noites'), noites);

  const roteiro = [...abas.Roteiro].sort((a, b) => a.Ordem - b.Ordem);
  $('trilha-paradas').replaceChildren(...roteiro.map((p) => {
    const dorme = p['Dormida em'] !== p['Cidade visitada'] ? ` · dorme em ${p['Dormida em']}` : '';
    return el('a', { class: 'parada', 'data-parada': true, href: '#cidade/' + slug(p['Cidade visitada']) },
      el('span', { class: 'parada__ponto', 'aria-hidden': 'true' }),
      el('div', {}, el('p', { class: 'parada__cidade' }, p['Cidade visitada']),
        el('p', { class: 'legenda' }, `${dataCurta.format(data(p.Data))} · ${p.Deslocamento}${p.Tempo ? ' · ' + p.Tempo : ''}${dorme}`)));
  }));
  $('roteiro-resumo').textContent = `${roteiro.length} paradas, ${roteiro.filter((p) => p.Deslocamento === 'Carro').length} trechos de carro e ${roteiro.filter((p) => p.Deslocamento === 'Trem').length} de trem.`;

  $('lista-pendencias').replaceChildren(...pendentes.slice(0, 6).map((c) => el('li', { 'data-subir': true },
    el('span', { class: 'pendencias__data' }, dataCurta.format(data(c.Prazo))),
    el('div', {}, el('p', {}, c.Item), el('p', { class: 'status-pendente' }, `${c.Status} · ${c.Categoria}`)))));

  $('cidades').replaceChildren(...abas.Cidades.map((c) => el('a', { class: 'cidade', 'data-subir': true, href: '#cidade/' + slug(c.Cidade) },
    el('img', { class: 'cidade__foto', src: c.Imagem || `assets/img/cidades/${slug(c.Cidade)}.jpg`, alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }),
    el('h3', { class: 'kicker' }, c.Cidade),
    el('p', { class: 'copy' }, c.Resumo),
    el('p', { class: 'legenda' }, c['Clima/luz']))));

  $('rodape').textContent = `Dados de pesquisa verificados em ${dataLonga.format(data(v.data_verificacao))}. Itens com ⚠️ ainda precisam ser confirmados ou reservados. Cotação: R$ ${String(v.cotacao_gbp_brl).replace('.', ',')} por £1.`;
}

// ---------------------------------------------------------------- rotas

const PAGINAS = { orcamento: paginaOrcamento, checklist: paginaChecklist, registrar: paginaRegistrar, viagem: paginaViagem };

function rotear() {
  if (!ctx.abas) return;
  const [rota, arg] = location.hash.replace(/^#/, '').split('/');
  const painel = !rota || rota === 'painel' || rota === 'roteiro' || rota === 'pendencias';
  $('painel').hidden = !painel;
  $('pagina').hidden = painel;
  document.querySelectorAll('.nav-secoes a').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + (rota || 'painel')));
  if (painel) {
    renderPainel();
    if (rota === 'roteiro' || rota === 'pendencias') $(rota).scrollIntoView();
    else window.scrollTo(0, 0);
  } else {
    const gerar = rota === 'cidade' ? (c) => paginaCidade(c, arg) : PAGINAS[rota];
    $('pagina').replaceChildren(gerar ? gerar(ctx) : el('p', { class: 'secao' }, 'Página não encontrada.'));
    window.scrollTo(0, 0);
    document.title = `${rota === 'cidade' ? (ctx.abas.Cidades.find((c) => slug(c.Cidade) === arg) || {}).Cidade : $('pagina').querySelector('.kicker')?.textContent || ''} · Escócia 2027`;
  }
  if (painel) document.title = 'Escócia 2027';
  atualizarMovimento();
}

// ---------------------------------------------------------------- acesso

function pedirCodigo(mensagem) {
  const d = $('acesso');
  $('acesso-erro').textContent = mensagem || '';
  if (!d.open) d.showModal();
}

async function recarregar(primeira) {
  try {
    const dados = await carregar();
    ctx.abas = dados.abas;
    ctx.v = chaveValor(dados.abas.Viagem);
    atualizarEstado(dados);
    if (primeira) iniciarMovimento();
    rotear();
  } catch (err) {
    if (err instanceof CodigoInvalido) { codigo.limpar(); pedirCodigo('Código de acesso inválido.'); return; }
    $('estado').textContent = 'Não foi possível carregar os dados. Verifique a conexão e tente de novo.';
  }
}

async function iniciar() {
  try { ctx.creditos = await (await fetch('assets/img/cidades/creditos.json')).json(); } catch { ctx.creditos = {}; }
  $('acesso-form').addEventListener('submit', (e) => {
    e.preventDefault();
    codigo.definir($('acesso-codigo').value.trim());
    $('acesso').close();
    recarregar(!ctx.abas);
  });
  window.addEventListener('hashchange', rotear);
  window.addEventListener('online', () => sincronizar().then(() => recarregar(false)).catch(() => {}));
  if (usaPlanilha() && !codigo.obter()) return pedirCodigo();
  recarregar(true);
}

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
window.addEventListener('DOMContentLoaded', iniciar);
