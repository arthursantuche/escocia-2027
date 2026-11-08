// Portal Escócia 2027: carrega os dados (planilha via Apps Script, ou cópia local
// offline), monta o painel e as demais páginas por rota (#painel, #cidade/<nome>…).
// Nenhum valor da viagem fica fixo no código.
import { graficoOrcamento, graficoNoites } from './graficos.js';
import { iniciarMovimento, atualizarMovimento, HORIZONTAL } from './movimento.js';
import { VERSAO_SITE } from './config.js';
import { carregar, dadosDoAparelho, salvar, sincronizar, codigo, usaPlanilha, pendentesNaFila, CodigoInvalido, ErroServidor } from './dados.js';
import { $, el, brl, brl2, dataCurta, dataLonga, data, diasAte, slug, chaveValor, foto, creditoFoto, valoresOrcamento, totaisOrcamento, luzDaParada, textoLuz } from './util.js';
import { iniciarCarrossel } from './carrossel.js';
import { paginaCidade, paginaProgramacao, paginaHospedagens, paginaOrcamento, paginaChecklist, paginaViagem } from './views.js';
import { paginaRegistrar } from './registrar.js';

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
  $('estado-texto').textContent = partes.join(' · ');
}

// Devolve o resultado se salvou (ou entrou na fila), ou false. Quem chama pode receber o erro em aoFalhar,
// para mostrá-lo no próprio formulário.
const ERROS = { duplicado: 'Já existe um registro com este nome nesta cidade.', nome: 'Preencha o nome.', dados: 'Faltam dados obrigatórios ou há um valor inválido.', bloqueado: 'Muitas tentativas de acesso. Tente de novo em alguns minutos.' };
ctx.salvar = async (op, mensagem, aoFalhar) => {
  const falhar = (texto) => { if (aoFalhar) aoFalhar(texto); else avisar(texto); return false; };
  try {
    const r = await comProgresso(() => salvar(op));
    avisar(r.enfileirado ? 'Sem sinal: salvo no aparelho e enviado quando a conexão voltar.' : mensagem);
    await recarregar(false);
    return r;
  } catch (err) {
    if (err instanceof CodigoInvalido) { pedirCodigo('Código de acesso inválido.'); return false; }
    if (err instanceof ErroServidor) return falhar(ERROS[err.message] || 'A planilha recusou: ' + err.message);
    return falhar('Não foi possível salvar: ' + err.message);
  }
};
ctx.pedirCodigo = () => pedirCodigo('Código de acesso inválido.');

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

  const orc = abas.Orcamento.map(valoresOrcamento);
  const total = totaisOrcamento(orc);
  $('orc-previsto').textContent = brl.format(total.previsto);
  $('orc-detalhe').textContent = `Referência atual ${brl.format(total.atual)} · Pago ${brl.format(total.pago)} · A pagar ${brl.format(total.aPagar)}`;
  graficoOrcamento($('grafico-orcamento'), orc.filter((o) => o.previsto || o.pago || o.aPagar));

  const chk = abas.Checklist;
  const feitos = chk.filter((c) => c.Status === 'feito').length;
  const pct = chk.length ? Math.round((feitos / chk.length) * 100) : 0;
  $('chk-numero').textContent = `${feitos} de ${chk.length}`;
  $('chk-barra').style.width = pct + '%';
  $('chk-barra-wrap').setAttribute('aria-valuenow', pct);
  const faltam = chk.length - feitos;
  $('chk-detalhe').textContent = `${faltam} ${faltam === 1 ? 'pendência' : 'pendências'} ⚠️ · ${pct}% concluído`;
  $('chk-proximos').previousElementSibling.hidden = !pendentes.length;
  $('chk-proximos').replaceChildren(...pendentes.slice(0, 3).map((c) => el('li', {},
    el('span', { class: 'prazos__data' }, dataCurta.format(data(c.Prazo))), el('span', {}, c.Item))));

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
  // Foto dentro da parada, só na vertical. O sizes é menor que a coluna do celular de propósito: os
  // 800 px já passam de 2,5× ali, e decodificar os 1600 px não mudaria o que se vê.
  const fotoDaParada = (n) => {
    const { src, srcset, ...atributos } = foto(n, '(min-width: 600px) 45vw, 260px', (abas.Cidades.find((c) => slug(c.Cidade) === n) || {}).Imagem);
    return el('span', { class: 'parada__foto' }, el('img', { ...atributos, 'data-src': src, 'data-srcset': srcset, alt: '', decoding: 'async' }));
  };
  $('trilha-paradas').replaceChildren(...roteiro.map((p) => {
    const dorme = p['Dormida em'] !== p['Cidade visitada'] ? `dorme em ${p['Dormida em']}` : '';
    const trajeto = [p.Deslocamento, p.Tempo].filter(Boolean).join(' · ');
    const luz = textoLuz(luzDaParada(p, abas.Cidades));
    const quando = dataCurta.format(data(p.Data));
    // A coluna fixa do roteiro mostra o detalhe da parada atual (movimento.js lê estes data-*).
    return el('a', { class: 'parada', 'data-parada': true, 'data-cidade': slug(p['Cidade visitada']), 'data-nome': p['Cidade visitada'], 'data-resumo': [quando, trajeto, dorme].filter(Boolean).join(' · '), 'data-luz': luz || '', href: '#cidade/' + slug(p['Cidade visitada']) },
      el('span', { class: 'parada__ponto', 'aria-hidden': 'true' }),
      el('div', { class: 'parada__texto' }, el('p', { class: 'parada__cidade' }, p['Cidade visitada']),
        el('p', { class: 'legenda parada__resumo' }, el('span', {}, quando), el('span', { class: 'parada__trajeto' }, ` · ${trajeto}`), dorme ? el('span', { class: 'parada__detalhe' }, ` · ${dorme}`) : null),
        luz && el('p', { class: 'legenda parada__detalhe' }, luz)),
      fotoDaParada(slug(p['Cidade visitada'])));
  }));
  // Foto da parada atual no palco, só na horizontal; movimento.js troca a visível.
  const comFoto = [...new Set(roteiro.map((p) => slug(p['Cidade visitada'])))];
  // Só a primeira já recebe o arquivo, e só na horizontal; as demais, conforme a parada se aproxima
  // (movimento.js). Na vertical nenhuma é baixada.
  const horizontal = matchMedia(HORIZONTAL).matches;
  $('roteiro-midia').replaceChildren(...comFoto.map((n, i) => {
    const { src, srcset, ...atributos } = foto(n, '(orientation: landscape) and (max-width: 833px) 260px, (orientation: landscape) and (max-height: 639px) 260px, 450px', (abas.Cidades.find((c) => slug(c.Cidade) === n) || {}).Imagem);
    return el('img', {
      ...atributos, alt: '', decoding: 'async', 'data-cidade': n, class: i === 0 ? 'ativa' : null,
      ...(i === 0 && horizontal ? { src, srcset } : { 'data-src': src, 'data-srcset': srcset }),
    });
  }));
  $('roteiro-resumo').textContent = `${roteiro.length} paradas, ${roteiro.filter((p) => p.Deslocamento === 'Carro').length} trechos de carro e ${roteiro.filter((p) => p.Deslocamento === 'Trem').length} de trem. A saída de carro indica até quando partir para fazer o trecho com luz do dia (horário local).`;

  $('lista-pendencias').replaceChildren(...pendentes.slice(0, 6).map((c) => el('li', { 'data-subir': true },
    el('span', { class: 'pendencias__data' }, dataCurta.format(data(c.Prazo))),
    el('div', {}, el('p', {}, c.Item), el('p', { class: 'status-pendente' }, `${c.Status} · ${c.Categoria}`)))));

  // Cartões das cidades na ordem da aba Cidades (a do roteiro), com datas e noites.
  $('cidades-lista').replaceChildren(...abas.Cidades.map((c) => {
    const datas = roteiro.filter((r) => r['Cidade visitada'] === c.Cidade).map((r) => dataCurta.format(data(r.Data)));
    const n = noites[c.Cidade] || 0;
    return el('a', { class: 'cartao-cidade', 'data-subir': true, href: '#cidade/' + slug(c.Cidade), 'aria-label': `${c.Cidade}, ${datas.join(' e ')}` },
      el('div', { class: 'cartao-cidade__foto' }, el('img', { ...foto(slug(c.Cidade), '(min-width: 834px) 440px, 84vw', c.Imagem), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() })),
      el('div', { class: 'cartao-cidade__texto' },
        el('h3', { class: 'kicker' }, c.Cidade),
        el('p', { class: 'legenda' }, `${datas.join(' e ')} · ${n ? `${n} ${n === 1 ? 'noite' : 'noites'}` : 'visita no dia'}`),
        el('p', { class: 'copy' }, c.Resumo)));
  }));
  $('cidades-pontos').replaceChildren(...abas.Cidades.map((c) => el('button', { type: 'button', 'aria-label': c.Cidade, 'aria-controls': 'cidades-lista' })));
  marcarCarrossel();

  const NUMEROS = ['Zero', 'Uma', 'Duas', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez'];
  $('cidades-titulo').textContent = `${NUMEROS[abas.Cidades.length] || abas.Cidades.length} ${abas.Cidades.length === 1 ? 'cidade' : 'cidades'}.`;
}

// ---------------------------------------------------------------- rotas

const PAGINAS = { programacao: paginaProgramacao, hospedagens: paginaHospedagens, orcamento: paginaOrcamento, checklist: paginaChecklist, registrar: paginaRegistrar, viagem: paginaViagem };

const ANCORAS = ['roteiro', 'cidades', 'pendencias'];
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let paginaAtual = null;

// Página interna → item do painel que a representa. O Painel é a marca, sem item próprio.
// Orçamento não tem item: abre pelo Painel e por Viagem.
const ITEM_DO_PAINEL = { cidade: 'programacao' };

// Marca o item atual e, se a lista rolar (telas estreitas), leva-o para o centro dela.
// Só rola a própria lista: nunca mexe na rolagem da página.
function marcarSecao(rota) {
  const lista = $('secoes');
  const id = ITEM_DO_PAINEL[rota] || rota;
  lista.querySelectorAll('a').forEach((a) => {
    const atual = a.getAttribute('href') === '#' + id;
    a.toggleAttribute('aria-current', atual);
    if (atual && lista.scrollWidth > lista.clientWidth) {
      lista.scrollTo({ left: a.offsetLeft - (lista.clientWidth - a.offsetWidth) / 2, behavior: reduzido() ? 'auto' : 'smooth' });
    }
  });
}

let painelMontado = '';

function rolarAte(id, suave) {
  $(id).scrollIntoView({ behavior: suave && !reduzido() ? 'smooth' : 'auto', block: 'start' });
}

function entrar(elemento) {
  elemento.classList.remove('entrando');
  void elemento.offsetWidth;
  elemento.classList.add('entrando');
}

function montar(rota, arg, extra, painel, manterRolagem) {
  $('painel').hidden = !painel;
  $('pagina').hidden = painel;
  if (painel) {
    // O painel só é redesenhado (gráficos e listas) quando os dados mudaram.
    if (painelMontado !== assinatura) {
      renderPainel();
      painelMontado = assinatura;
    }
    document.title = 'Escócia 2027';
  } else {
    const gerar = rota === 'cidade' ? (c) => paginaCidade(c, arg) : rota === 'registrar' ? (c) => paginaRegistrar(c, arg, extra) : PAGINAS[rota];
    $('pagina').replaceChildren(gerar ? gerar(ctx) : el('p', { class: 'secao' }, 'Página não encontrada.'));
    document.title = `${rota === 'cidade' ? (ctx.abas.Cidades.find((c) => slug(c.Cidade) === arg) || {}).Cidade : $('pagina').querySelector('.kicker')?.textContent || ''} · Escócia 2027`;
  }
  if (!manterRolagem) {
    if (ANCORAS.includes(rota)) rolarAte(rota, false);
    else window.scrollTo({ top: 0, behavior: 'instant' });
    entrar(painel ? $('painel') : $('pagina'));
  }
  // Foto já na memória não esmaece de novo ao voltar a uma página.
  document.querySelectorAll('img:not(.carregada)').forEach((i) => { if (i.complete && i.naturalWidth) i.classList.add('carregada'); });
  atualizarMovimento(manterRolagem);
}

// redesenho: os mesmos dados da mesma página foram atualizados; o leitor continua onde estava.
function rotear(redesenho = false) {
  if (!ctx.abas) return;
  const [rota, arg, extra] = location.hash.replace(/^#/, '').split('/');
  const painel = !rota || rota === 'painel' || ANCORAS.includes(rota);
  marcarSecao(rota);
  const chave = painel ? 'painel' : `${rota}/${arg || ''}/${extra || ''}`;
  // Entre âncoras do painel a página não muda: só rola. Nada é remontado, nada pisca.
  if (paginaAtual === chave && !redesenho) {
    if (ANCORAS.includes(rota)) rolarAte(rota, true);
    return;
  }
  const primeira = paginaAtual === null;
  paginaAtual = chave;
  montar(rota, arg, extra, painel, redesenho && !primeira);
}

// Faixa no alto da página, cápsula ao rolar. Dois limites diferentes evitam a oscilação no
// ponto de troca, como no repique da rolagem do iPhone. Só muda uma classe: nada de layout.
const CAPSULA_ENTRA = 24;
const CAPSULA_SAI = 8;
function acompanharCapsula() {
  const topo = document.querySelector('.topo');
  const atualizar = () => {
    const flutua = topo.classList.contains('topo--flutuante');
    if (!flutua && scrollY > CAPSULA_ENTRA) topo.classList.add('topo--flutuante');
    else if (flutua && scrollY < CAPSULA_SAI) topo.classList.remove('topo--flutuante');
  };
  window.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
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

function mostrarFalha(visivel) {
  $('falha').hidden = !visivel;
}

// Barra azul: aparece enquanto houver leitura ou gravação em andamento, por no mínimo 300 ms,
// para uma operação rápida não virar um clarão.
let operacoes = 0;
let saida = 0;
async function comProgresso(operacao) {
  const barra = $('carregamento');
  operacoes++;
  clearTimeout(saida);
  barra.toggleAttribute('data-ativo', true);
  const inicio = Date.now();
  try {
    return await operacao();
  } finally {
    operacoes--;
    if (!operacoes) saida = setTimeout(() => { if (!operacoes) barra.removeAttribute('data-ativo'); }, Math.max(0, 300 - (Date.now() - inicio)));
  }
}

// Formulário aberto ou voucher e foto por cima: nada é redesenhado por baixo de quem está usando.
function emUso() {
  return /^#registrar\/(gasto|atracao|restaurante|nota)/.test(location.hash) || Boolean(document.querySelector('dialog[open]'));
}

let assinatura = '';
let ultimaLeitura = 0;

// Aplica os dados; só redesenha se algo mudou, para a página não piscar a cada leitura.
function aplicarDados(dados) {
  const nova = JSON.stringify(dados.abas);
  const mudou = nova !== assinatura;
  assinatura = nova;
  ctx.abas = dados.abas;
  ctx.v = chaveValor(dados.abas.Viagem);
  // Fica fora do painel: o rodapé aparece em todas as páginas, mesmo abrindo direto numa delas.
  $('rodape').textContent = `Dados de pesquisa verificados em ${dataLonga.format(data(ctx.v.data_verificacao))}. Itens com ⚠️ ainda precisam ser confirmados ou reservados. Cotação: ${brl2.format(ctx.v.cotacao_gbp_brl)} por £1.`;
  atualizarEstado(dados);
  if (!mudou && paginaAtual !== null) return false;
  if (emUso() && paginaAtual !== null) return true;
  rotear(paginaAtual !== null);
  return true;
}

// Devolve { ok, mudou, offline } para quem precisa dar retorno (como o botão do rodapé).
async function recarregar(primeira) {
  // Abre na hora com a cópia do aparelho; a leitura da planilha substitui logo em seguida.
  const copia = primeira ? dadosDoAparelho() : null;
  if (copia) {
    iniciarMovimento();
    aplicarDados(copia);
  }
  return comProgresso(async () => {
    try {
      const dados = await carregar();
      ultimaLeitura = Date.now();
      mostrarFalha(false);
      if (primeira && !copia) iniciarMovimento();
      const mudou = aplicarDados(dados);
      if (dados.recusados && dados.recusados.length) avisar('Um registro feito sem sinal foi recusado pela planilha (provavelmente repetido).');
      return { ok: true, mudou, offline: Boolean(dados.offline) };
    } catch (err) {
      if (err instanceof CodigoInvalido) { codigo.limpar(); pedirCodigo('Código de acesso inválido.'); return { ok: false }; }
      if (err instanceof ErroServidor && err.message === 'bloqueado') { pedirCodigo(ERROS.bloqueado); return { ok: false }; }
      if (!ctx.abas) mostrarFalha(true);
      return { ok: false };
    }
  });
}

// O que muda direto na planilha chega ao site: ao voltar à aba ou ao app, e a cada 5 minutos
// com a página aberta. Só uma leitura por minuto, no máximo.
function acompanharPlanilha() {
  const atualizar = () => {
    if (!ctx.abas || document.hidden) return;
    if (Date.now() - ultimaLeitura < 60000) return;
    ultimaLeitura = Date.now();
    recarregar(false);
  };
  document.addEventListener('visibilitychange', () => atualizar());
  window.addEventListener('focus', () => atualizar());
  setInterval(() => atualizar(), 300000);
  // Busca manual: lê a planilha agora, envia o que estiver na fila e diz o que aconteceu.
  const botao = $('estado-atualizar');
  botao.addEventListener('click', async () => {
    const rotulo = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Buscando…';
    ultimaLeitura = Date.now();
    const r = await recarregar(false);
    botao.disabled = false;
    botao.textContent = rotulo;
    if (!r.ok || r.offline) avisar('Sem conexão: continua a última versão salva.');
    else avisar(r.mudou ? 'Dados atualizados com a planilha.' : 'Nada mudou na planilha.');
  });
}

// Altura da barra fixa, usada pelo CSS (âncoras e coluna fixa do roteiro) e pelo movimento.
function medirTopo() {
  document.documentElement.style.setProperty('--altura-topo', document.querySelector('.topo').offsetHeight + 'px');
}

// Foto carregada: libera o esmaecimento de entrada (paginas.css).
document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('carregada'); }, true);

async function iniciar() {
  $('versao').textContent = `Portal Escócia 2027 · versão ${VERSAO_SITE}`;
  medirTopo();
  new ResizeObserver(medirTopo).observe(document.querySelector('.topo'));
  acompanharBarra();
  acompanharCapsula();
  marcarCarrossel = iniciarCarrossel($('cidades-lista'), $('cidades-pontos'), [...$('cidades').querySelectorAll('.carrossel__seta')]);
  iniciarCarrossel($('resumo-lista'), $('resumo-pontos'), [...$('resumo').querySelectorAll('.carrossel__seta')])();
  try { ctx.creditos = await (await fetch('assets/img/cidades/creditos.json')).json(); } catch { ctx.creditos = {}; }
  $('acesso-form').addEventListener('submit', (e) => {
    e.preventDefault();
    codigo.definir($('acesso-codigo').value.trim());
    $('acesso').close();
    recarregar(!ctx.abas);
  });
  $('falha-tentar').addEventListener('click', () => recarregar(!ctx.abas));
  acompanharPlanilha();
  window.addEventListener('hashchange', () => rotear());
  window.addEventListener('online', () => recarregar(false));
  if (usaPlanilha() && !codigo.obter()) return pedirCodigo();
  return recarregar(true);
}

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
window.addEventListener('DOMContentLoaded', iniciar);
