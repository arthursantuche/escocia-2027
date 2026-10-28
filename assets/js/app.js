// Portal Escócia 2027: carrega os dados (planilha via Apps Script, ou cópia local
// offline), monta o painel e as demais páginas por rota (#painel, #cidade/<nome>…).
// Nenhum valor da viagem fica fixo no código.
import { graficoOrcamento, graficoNoites } from './graficos.js';
import { iniciarMovimento, atualizarMovimento } from './movimento.js';
import { carregar, salvar, sincronizar, codigo, usaPlanilha, pendentesNaFila, CodigoInvalido } from './dados.js';
import { $, el, brl, dataCurta, dataLonga, data, diasAte, slug, chaveValor, foto, creditoFoto, valoresOrcamento, totaisOrcamento, luzDaParada, textoLuz } from './util.js';
import { iniciarCarrossel } from './carrossel.js';
import { paginaCidade, paginaOrcamento, paginaChecklist, paginaRegistrar, paginaViagem } from './views.js';

const ctx = { abas: null, v: null, creditos: {}, salvar: null };
let marcarCarrossel = () => {};

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
  $('abertura-credito').replaceChildren(...(ctx.creditos.abertura ? creditoFoto(ctx.creditos.abertura) : []));

  const pendentes = abas.Checklist.filter((c) => c.Status !== 'feito' && c.Prazo).sort((a, b) => String(a.Prazo).localeCompare(String(b.Prazo)));
  const proximo = pendentes[0];
  $('proximo').hidden = !proximo;
  if (proximo) {
    const d = diasAte(proximo.Prazo);
    $('proximo-titulo').textContent = proximo.Item;
    $('proximo-detalhe').textContent = `Prazo ${dataLonga.format(data(proximo.Prazo))} · ${d >= 0 ? `faltam ${d} dias` : `atrasado ${-d} dias`} · ${proximo['Responsável']}`;
  }

  const orc = abas.Orcamento.map(valoresOrcamento);
  const total = totaisOrcamento(orc);
  $('orc-previsto').textContent = brl.format(total.previsto);
  $('orc-detalhe').textContent = `Pago ${brl.format(total.pago)} · A pagar ${brl.format(total.aPagar)} · Saldo ${brl.format(total.saldo)}`;
  graficoOrcamento($('grafico-orcamento'), orc.filter((o) => o.previsto || o.pago || o.aPagar));

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
  const totalNoites = Object.values(noites).reduce((a, b) => a + b, 0);
  $('noites-total').textContent = `${totalNoites} noites`;
  // Números-chave da abertura, ao lado da contagem regressiva.
  $('noites-hero').textContent = totalNoites;
  $('noites-legenda').textContent = totalNoites === 1 ? 'noite na Escócia' : 'noites na Escócia';
  $('cidades-hero').textContent = abas.Cidades.length;
  $('cidades-legenda').textContent = abas.Cidades.length === 1 ? 'cidade' : 'cidades';
  graficoNoites($('grafico-noites'), noites);

  const roteiro = [...abas.Roteiro].sort((a, b) => a.Ordem - b.Ordem);
  $('trilha-paradas').replaceChildren(...roteiro.map((p) => {
    const dorme = p['Dormida em'] !== p['Cidade visitada'] ? ` · dorme em ${p['Dormida em']}` : '';
    return el('a', { class: 'parada', 'data-parada': true, 'data-cidade': slug(p['Cidade visitada']), href: '#cidade/' + slug(p['Cidade visitada']) },
      el('span', { class: 'parada__ponto', 'aria-hidden': 'true' }),
      el('div', {}, el('p', { class: 'parada__cidade' }, p['Cidade visitada']),
        el('p', { class: 'legenda' }, `${dataCurta.format(data(p.Data))} · ${p.Deslocamento}${p.Tempo ? ' · ' + p.Tempo : ''}${dorme}`),
        textoLuz(luzDaParada(p, abas.Cidades)) && el('p', { class: 'legenda' }, textoLuz(luzDaParada(p, abas.Cidades)))));
  }));
  // Foto da parada atual na coluna fixa (computador); movimento.js troca a visível.
  const comFoto = [...new Set(roteiro.map((p) => slug(p['Cidade visitada'])))];
  $('roteiro-midia').replaceChildren(...comFoto.map((n, i) => el('img', {
    ...foto(n, '(min-width: 834px) 450px, 1px', (abas.Cidades.find((c) => slug(c.Cidade) === n) || {}).Imagem),
    alt: '', loading: 'lazy', 'data-cidade': n, class: i === 0 ? 'ativa' : null,
  })));
  $('roteiro-resumo').textContent = `${roteiro.length} paradas, ${roteiro.filter((p) => p.Deslocamento === 'Carro').length} trechos de carro e ${roteiro.filter((p) => p.Deslocamento === 'Trem').length} de trem. "Sair até" é o último horário para fazer o trecho de carro antes do pôr do sol (horário local).`;

  $('lista-pendencias').replaceChildren(...pendentes.slice(0, 6).map((c) => el('li', { 'data-subir': true },
    el('span', { class: 'pendencias__data' }, dataCurta.format(data(c.Prazo))),
    el('div', {}, el('p', {}, c.Item), el('p', { class: 'status-pendente' }, `${c.Status} · ${c.Categoria}`)))));

  // Cartões das cidades na ordem da aba Cidades (a do roteiro), com datas e noites.
  $('cidades-lista').replaceChildren(...abas.Cidades.map((c) => {
    const datas = roteiro.filter((r) => r['Cidade visitada'] === c.Cidade).map((r) => dataCurta.format(data(r.Data)));
    const n = noites[c.Cidade] || 0;
    return el('a', { class: 'cartao-cidade', href: '#cidade/' + slug(c.Cidade), 'aria-label': `${c.Cidade}, ${datas.join(' e ')}` },
      el('img', { ...foto(slug(c.Cidade), '(min-width: 834px) 380px, 84vw', c.Imagem), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }),
      el('div', { class: 'cartao-cidade__texto' },
        el('h3', { class: 'kicker' }, c.Cidade),
        el('p', { class: 'legenda' }, `${datas.join(' e ')} · ${n ? `${n} ${n === 1 ? 'noite' : 'noites'}` : 'visita no dia'}`),
        el('p', { class: 'copy' }, c.Resumo)));
  }));
  $('cidades-pontos').replaceChildren(...abas.Cidades.map((c) => el('button', { type: 'button', 'aria-label': c.Cidade, 'aria-controls': 'cidades-lista' })));
  marcarCarrossel();

  $('rodape').textContent = `Dados de pesquisa verificados em ${dataLonga.format(data(v.data_verificacao))}. Itens com ⚠️ ainda precisam ser confirmados ou reservados. Cotação: R$ ${String(v.cotacao_gbp_brl).replace('.', ',')} por £1.`;
}

// ---------------------------------------------------------------- rotas

const PAGINAS = { orcamento: paginaOrcamento, checklist: paginaChecklist, registrar: paginaRegistrar, viagem: paginaViagem };

const ANCORAS = ['roteiro', 'cidades', 'pendencias'];
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let paginaAtual = null;

// Marca na barra a seção atual (Cidade conta como Cidades) e a mantém visível na lista.
function marcarSecao(id) {
  document.querySelectorAll('.barra__secoes a').forEach((a) => {
    const atual = a.getAttribute('href') === '#' + id;
    a.toggleAttribute('aria-current', atual);
    if (atual) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

function montar(rota, arg, painel) {
  $('painel').hidden = !painel;
  $('pagina').hidden = painel;
  if (painel) {
    renderPainel();
    document.title = 'Escócia 2027';
  } else {
    const gerar = rota === 'cidade' ? (c) => paginaCidade(c, arg) : PAGINAS[rota];
    $('pagina').replaceChildren(gerar ? gerar(ctx) : el('p', { class: 'secao' }, 'Página não encontrada.'));
    document.title = `${rota === 'cidade' ? (ctx.abas.Cidades.find((c) => slug(c.Cidade) === arg) || {}).Cidade : $('pagina').querySelector('.kicker')?.textContent || ''} · Escócia 2027`;
  }
  if (ANCORAS.includes(rota)) $(rota).scrollIntoView();
  else window.scrollTo(0, 0);
  atualizarMovimento();
}

function rotear() {
  if (!ctx.abas) return;
  const [rota, arg] = location.hash.replace(/^#/, '').split('/');
  const painel = !rota || rota === 'painel' || ANCORAS.includes(rota);
  marcarSecao(rota === 'cidade' ? 'cidades' : rota || 'painel');
  // Troca de página com esmaecimento (View Transitions); entre âncoras do painel, só rola.
  // Na primeira montagem não há transição. Se o navegador abortar a transição (aba em
  // segundo plano, por exemplo), a página é montada do mesmo jeito.
  const chave = painel ? 'painel' : rota + '/' + (arg || '');
  const trocou = paginaAtual !== null && chave !== paginaAtual;
  paginaAtual = chave;
  if (trocou && document.startViewTransition && !reduzido() && document.visibilityState === 'visible') {
    let montado = false;
    const t = document.startViewTransition(() => { montado = true; montar(rota, arg, painel); });
    t.updateCallbackDone.catch(() => { if (!montado) montar(rota, arg, painel); });
    t.ready.catch(() => {});
    t.finished.catch(() => {});
  } else {
    montar(rota, arg, painel);
  }
}

// No painel, a barra acompanha a seção que está no meio da tela.
function acompanharSecoes() {
  const visiveis = new Set();
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visiveis.add(e.target.id) : visiveis.delete(e.target.id)));
    if ($('painel').hidden) return;
    marcarSecao(['cidades', 'roteiro'].find((id) => visiveis.has(id)) || 'painel');
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['roteiro', 'cidades'].forEach((id) => obs.observe($(id)));
}

// Esmaecimento nas bordas da lista de seções quando ela continua para os lados.
function acompanharBarra() {
  const s = $('secoes');
  const atualizar = () => {
    s.dataset.inicio = s.scrollLeft > 2 ? 'nao' : 'sim';
    s.dataset.fim = s.scrollLeft + s.clientWidth < s.scrollWidth - 2 ? 'nao' : 'sim';
  };
  s.addEventListener('scroll', atualizar, { passive: true });
  new ResizeObserver(atualizar).observe(s);
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

// Altura da barra fixa, usada pelo CSS (âncoras e coluna fixa do roteiro) e pelo movimento.
function medirTopo() {
  document.documentElement.style.setProperty('--altura-topo', document.querySelector('.topo').offsetHeight + 'px');
}

async function iniciar() {
  medirTopo();
  new ResizeObserver(medirTopo).observe(document.querySelector('.topo'));
  acompanharBarra();
  acompanharSecoes();
  marcarCarrossel = iniciarCarrossel($('cidades-lista'), $('cidades-pontos'), [...$('cidades').querySelectorAll('.carrossel__seta')]);
  iniciarCarrossel($('resumo-lista'), $('resumo-pontos'), [...$('resumo').querySelectorAll('.carrossel__seta')])();
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
