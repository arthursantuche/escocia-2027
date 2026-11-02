// Movimento do portal. As regras por função de cada elemento estão no DESIGN.md:
// - títulos que saem do cinza para a cor plena conforme a posição na tela (atualizarTitulos);
// - blocos que sobem até 30px ao entrar na tela (data-subir);
// - fotos que assentam de 1,16× ou 1,1× para 1× ao atravessar a tela (data-rolagem);
// - foto informativa da cidade com paralaxe, sempre dentro da moldura (data-paralaxe);
// - roteiro com a linha avançando pelas paradas (medirRoteiro, atualizarTrilha). A orientação da tela
//   decide a apresentação: na horizontal, palco fixo com a foto da parada; na vertical, coluna própria,
//   com cada parada e sua foto no fluxo da página;
// - controles dos carrosséis que nascem como uma gota (acompanharControles).
// Com prefers-reduced-motion ou sem GSAP, nada se move e tudo aparece pronto.
let mm = null;

// Palco do roteiro: fica preso enquanto a rolagem percorre a seção (position: sticky, sem
// sequestrar a rolagem) e é solto na última parada. A última parada é alcançada em 96% do
// percurso, para o leitor ver a linha completa antes de a seção seguinte subir.
const FIM_DO_PERCURSO = 0.96;
const TOQUE = '(hover: none) and (pointer: coarse), (max-width: 833px)';
export const HORIZONTAL = '(orientation: landscape)';
// Horizontal sem espaço para o palco de computador: abaixo daqui, a foto vira tira (altura) ou as
// colunas não cabem (largura). Medido nas larguras de 840 a 1280 px; o mesmo limite está em componentes.css.
const COMPACTA = '(orientation: landscape) and (max-width: 833px), (orientation: landscape) and (max-height: 639px)';
const PONTO_ENCHE = 20; // px de avanço da linha em que o ponto se enche, no toque e na vertical
const GUIA_VERTICAL = 0.6; // na vertical, a ponta da linha acompanha esta altura da tela
const TEXTO_ESPERA = 120; // ms que o texto espera a foto, no toque
let trilhaViva = false;
let quadro = 0;

// Curva cúbica de Bézier como função de ease do GSAP (o GSAP não lê "cubic-bezier()" sem
// plugin). Resolve x(t) = p por Newton e devolve y(t).
function bezier(x1, y1, x2, y2) {
  const coord = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  const derivada = (t, a, b) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
  return (p) => {
    if (p <= 0 || p >= 1) return p;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const d = derivada(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (coord(t, x1, x2) - p) / d));
    }
    return coord(t, y1, y2);
  };
}
// Curva de entrada medida nas páginas da Apple (Identidade Visual - Apple, "Tokens — Movimento").
const ENTRADA = bezier(0, 0, 0.2, 1);

export function iniciarMovimento() {
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const pedirQuadro = () => { if (!quadro) quadro = requestAnimationFrame(() => { quadro = 0; if (!(roteiro && (roteiro.toque || roteiro.vertical) && roteiro.preso)) atualizarTitulos(); atualizarTrilha(); }); };
  const medir = () => { medirRoteiro(); pedirQuadro(); };
  window.addEventListener('scroll', pedirQuadro, { passive: true });
  // No iPhone, a barra do Safari dispara resize durante a rolagem sem mudar nada no palco, que é
  // medido em svh: só a largura pede nova medição aqui. A altura real vem do ResizeObserver.
  let largura = innerWidth;
  window.addEventListener('resize', () => { if (innerWidth !== largura) { largura = innerWidth; medir(); } });
  window.addEventListener('load', pedirQuadro);
  matchMedia(HORIZONTAL).addEventListener('change', trocarOrientacao);
  matchMedia(COMPACTA).addEventListener('change', trocarOrientacao);
  const palco = document.getElementById('roteiro-palco');
  if (palco) new ResizeObserver(medir).observe(palco);
  // Fotos do roteiro: as da parada atual e das vizinhas ficam prontas antes de a seção chegar à tela.
  const secao = document.getElementById('roteiro');
  if (secao) new IntersectionObserver((e) => { if (e[0].isIntersecting && trilhaViva) prepararVizinhas(); }, { rootMargin: '100% 0px' }).observe(secao);
  acompanharControles();
}

// Liga a apresentação da orientação atual, com ou sem movimento reduzido.
function ligarApresentacao() {
  const secao = document.getElementById('roteiro');
  if (!secao) return;
  const horizontal = matchMedia(HORIZONTAL).matches;
  secao.classList.toggle('roteiro--fixo', horizontal);
  secao.classList.toggle('roteiro--vertical', !horizontal);
}

// A mudança de orientação recompõe o roteiro sem recarregar a página e mantém a parada do leitor.
function trocarOrientacao() {
  const antes = progressoPreso;
  paradaMostrada = null;
  if (trilhaViva) ligarApresentacao();
  document.querySelector('.topo')?.classList.remove('topo--sobre-fotos', 'topo--sobre-palco');
  document.getElementById('roteiro-percurso')?.style.removeProperty('transform');
  document.getElementById('roteiro-trilha')?.classList.remove('roteiro__trilha--excede', 'roteiro__trilha--acima', 'roteiro__trilha--abaixo');
  medirRoteiro();
  if (!roteiro || !trilhaViva) return;
  if (antes !== null) {
    const topo = roteiro.vertical
      ? roteiro.inicio - roteiro.guia + antes * roteiro.fim
      : roteiro.secao.getBoundingClientRect().top + scrollY + antes * FIM_DO_PERCURSO * roteiro.distancia;
    scrollTo({ top: topo, behavior: 'instant' });
  }
  atualizarTrilha();
  prepararVizinhas();
}

// Títulos de seção: a opacidade é sempre função da posição do título na tela neste instante.
// Sem gatilho nem estado guardado, não há como ficar cinza onde deveria estar pleno: subir,
// descer, voltar ao topo ou rolar de uma vez dão o mesmo resultado. Vai de 0,08 a 1 enquanto o
// título sobe de 90% a 55% da altura. Se a página acaba antes disso, termina no fim da página.
const TITULO_INICIO = 0.9;
const TITULO_FIM = 0.55;
const TITULO_OPACIDADE = 0.08;
let titulos = [];

function opacidadeDoTitulo(el, rolagemMaxima) {
  const topo = el.getBoundingClientRect().top;
  const inicio = innerHeight * TITULO_INICIO;
  const noFimDaPagina = topo + rolagemMaxima - scrollY;
  if (noFimDaPagina >= inicio) return 1;
  const fim = Math.max(innerHeight * TITULO_FIM, noFimDaPagina);
  const p = Math.min(1, Math.max(0, (inicio - topo) / (inicio - fim)));
  return TITULO_OPACIDADE + (1 - TITULO_OPACIDADE) * p;
}

function atualizarTitulos() {
  if (!titulos.length) return;
  const rolagemMaxima = document.documentElement.scrollHeight - innerHeight;
  titulos.forEach((el) => {
    if (el.offsetParent === null) return;
    const valor = opacidadeDoTitulo(el, rolagemMaxima).toFixed(3);
    // Escrever o mesmo valor também custa: o navegador recalcula o estilo a cada quadro.
    if (el.dataset.opacidade !== valor) { el.dataset.opacidade = valor; el.style.opacity = valor; }
  });
}

// Pontos e setas dos carrosséis: nascem como uma gota quando entram na tela, uma vez só.
// O estado inicial e o tempo de cada parte ficam em componentes.css (.carrossel__controles).
function acompanharControles() {
  const controles = document.querySelectorAll('.carrossel__controles');
  const observador = new IntersectionObserver((entradas) => entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('aberto');
    observador.unobserve(e.target);
    setTimeout(() => e.target.classList.add('pronta'), 1500); // fim da gota: solta as camadas
  }), { threshold: 0.9 });
  controles.forEach((c) => observador.observe(c));
}

// Tudo o que o quadro de rolagem precisa saber fica medido aqui, uma vez, e não a cada quadro.
// Ler layout e reescrever estilos durante a rolagem tira a fluidez, sobretudo no iPhone.
let roteiro = null;
let progressoPreso = null; // onde o leitor está no palco; a medição seguinte à rotação não o apaga

function medirRoteiro() {
  roteiro = null;
  const percurso = document.getElementById('roteiro-percurso');
  if (!percurso || percurso.offsetParent === null) return;
  // Aparelhos de toque e telas estreitas: percurso mais curto e pontos ligados à rolagem. Precisa
  // valer antes das medidas, porque muda a altura da seção. O computador segue pelo outro caminho.
  const toque = matchMedia(TOQUE).matches;
  const vertical = document.getElementById('roteiro').classList.contains('roteiro--vertical');
  document.getElementById('roteiro').classList.toggle('roteiro--toque', toque && !vertical);
  const pontos = percurso.querySelectorAll('.parada__ponto');
  if (pontos.length < 2) return;
  const antes = percurso.style.transform;
  percurso.style.transform = '';
  const base = percurso.getBoundingClientRect().top;
  const centro = (p) => { const r = p.getBoundingClientRect(); return r.top + r.height / 2 - base; };
  const topo = centro(pontos[0]);
  const altura = centro(pontos[pontos.length - 1]) - topo;
  const linhas = percurso.querySelectorAll('.roteiro__linha, .roteiro__progresso');
  linhas.forEach((l) => { l.style.cssText = `top:${topo}px;height:${altura}px`; });
  const secao = document.getElementById('roteiro');
  const paradas = [...secao.querySelectorAll('[data-parada]')];
  const comum = { secao, percurso, paradas, pontos: [...pontos], enchimento: paradas.map(() => -1), preso: false, atual: -1, progresso: document.getElementById('trilha-progresso'), topoFixo: document.querySelector('.topo') };
  // Vertical: tudo é medido aqui; o quadro de rolagem só faz contas com scrollY, sem ler layout.
  if (vertical) {
    roteiro = { ...comum, vertical, inicio: base + topo + scrollY, fim: altura, guia: innerHeight * GUIA_VERTICAL, y: [...pontos].map((p) => centro(p) - topo), ponta: -1 };
    return;
  }
  secao.style.setProperty('--paradas', pontos.length);
  // Compacta: a trilha deita; a linha e as distâncias passam a ser medidas em x.
  const compacta = matchMedia(COMPACTA).matches;
  let xs = null;
  if (compacta) {
    const esquerda = percurso.getBoundingClientRect().left;
    const meio = (p) => { const r = p.getBoundingClientRect(); return r.left + r.width / 2 - esquerda; };
    xs = [...pontos].map(meio);
    const xFim = xs[xs.length - 1] - xs[0];
    linhas.forEach((l) => { l.style.cssText = `top:${topo - 1}px;left:${xs[0]}px;width:${xFim}px`; });
    xs = xs.map((x) => x - xs[0]);
  }
  const trilha = document.getElementById('roteiro-trilha');
  const palco = document.getElementById('roteiro-palco');
  const estilo = getComputedStyle(trilha);
  const util = trilha.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
  const excesso = compacta ? 0 : Math.max(percurso.scrollHeight - util, 0);
  trilha.classList.toggle('roteiro__trilha--excede', excesso > 1);
  roteiro = {
    ...comum, trilha, excesso, util, toque,
    eixo: compacta ? 'X' : 'Y',
    y: xs || paradas.map((x) => x.offsetTop - paradas[0].offsetTop),
    distancia: Math.max(secao.offsetHeight - palco.offsetHeight, 1),
    altura: palco.offsetHeight,
    p: -1, subida: -1,
  };
  // Se a trilha passou a caber, nada do deslocamento anterior pode continuar valendo.
  percurso.style.transform = excesso > 1 ? antes : '';
  if (excesso <= 1) trilha.classList.remove('roteiro__trilha--acima', 'roteiro__trilha--abaixo');
}

// Progresso pela posição real de rolagem, a cada quadro. Fora da tela, nada é feito; na tela, só
// se escreve o que mudou. A primeira parada fica sempre marcada.
export function atualizarTrilha() {
  if (!trilhaViva || !roteiro) return;
  const r = roteiro;
  if (r.vertical) { atualizarTrilhaVertical(r); return; }
  const topo = r.secao.getBoundingClientRect().top;
  if (topo > innerHeight || topo < -(r.distancia + r.altura)) return;
  const p = Math.min(1, Math.max(0, -topo / r.distancia / FIM_DO_PERCURSO));
  // Com o palco preso, o fundo atrás do menu é liso: o desfoque não muda nada e pesa no iPhone.
  r.preso = topo <= 0 && topo >= -r.distancia;
  r.topoFixo.classList.toggle('topo--sobre-palco', r.preso);
  progressoPreso = r.preso ? p : null;
  if (Math.abs(p - r.p) < 0.0005) return;
  r.p = p;
  r.progresso.style.transform = `scale${r.eixo}(${p})`;
  const ponta = p * r.y[r.y.length - 1];
  // Trilha mais alta que o palco (tela baixa): sobe só o necessário para a ponta da linha ficar
  // a 40% da altura, com a parada atual sempre à vista.
  if (r.excesso) {
    const subida = Math.min(r.excesso, Math.max(0, ponta - r.util * 0.4));
    if (Math.abs(subida - r.subida) >= 0.5) {
      const antes = r.subida;
      r.subida = subida;
      r.percurso.style.transform = `translateY(${-subida}px)`;
      if ((antes > 2) !== (subida > 2) || antes < 0) r.trilha.classList.toggle('roteiro__trilha--acima', subida > 2);
      if ((antes < r.excesso - 2) !== (subida < r.excesso - 2) || antes < 0) r.trilha.classList.toggle('roteiro__trilha--abaixo', subida < r.excesso - 2);
    }
  }
  if (r.toque) encherPontos(r, ponta);
  let atual = 0;
  r.y.forEach((y, i) => { if (y <= ponta + 1) atual = i; });
  if (atual !== r.atual) {
    r.paradas.forEach((parada, i) => parada.classList.toggle('ativa', i <= atual));
    r.atual = atual;
    mostrarParada(r.paradas[atual]);
  }
}

// Vertical: a ponta da linha acompanha a guia na tela. Só contas com scrollY; só escreve o que mudou.
// A parada que a linha alcança ganha cor e foto plena, por transição curta de cor e opacidade.
function atualizarTrilhaVertical(r) {
  const bruta = scrollY + r.guia - r.inicio;
  const ponta = Math.min(r.fim, Math.max(0, bruta));
  const dentro = bruta > -innerHeight && bruta < r.fim + innerHeight;
  if (dentro !== r.preso) {
    r.preso = dentro;
    r.topoFixo.classList.toggle('topo--sobre-fotos', dentro);
  }
  progressoPreso = dentro ? ponta / r.fim : null;
  if (!dentro || ponta === r.ponta) return;
  r.ponta = ponta;
  r.progresso.style.transform = `scaleY(${ponta / r.fim})`;
  encherPontos(r, ponta);
  let atual = 0;
  r.y.forEach((y, i) => { if (y <= ponta + 1) atual = i; });
  if (atual !== r.atual) {
    r.paradas.forEach((parada, i) => parada.classList.toggle('ativa', i <= atual));
    r.atual = atual;
  }
}

// Toque: cada ponto enche junto com a rolagem, enquanto a ponta da linha se aproxima do centro dele.
// Sem transição por tempo, o ponto nunca fica atrás do dedo. Só escreve no ponto que mudou.
function encherPontos(r, ponta) {
  r.pontos.forEach((ponto, i) => {
    const valor = i === 0 ? 1 : Math.round(Math.min(1, Math.max(0, (ponta - r.y[i] + PONTO_ENCHE) / PONTO_ENCHE)) * 50) / 50;
    if (valor === r.enchimento[i]) return;
    r.enchimento[i] = valor;
    ponto.style.setProperty('--enche', valor);
  });
}

// Fotos das paradas, na vertical: recebem o arquivo a uma tela de distância. Na horizontal elas não
// têm caixa, o observador nunca dispara e nada é baixado; ao girar a tela, o observador as encontra.
const fotosDasParadas = new IntersectionObserver((entradas) => entradas.forEach((e) => {
  if (!e.isIntersecting) return;
  fotosDasParadas.unobserve(e.target);
  if (e.target.dataset.srcset) e.target.srcset = e.target.dataset.srcset;
  e.target.src = e.target.dataset.src;
}), { rootMargin: '100% 0px' });

// Foto ainda sem arquivo atribuído. Na vertical, o roteiro não tem foto: nada é baixado.
function carregarFoto(img) {
  if (!matchMedia(HORIZONTAL).matches) return Promise.resolve();
  if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
  if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
  return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
}

const fotoDaCidade = (cidade) => document.querySelector(`#roteiro-midia img[data-cidade="${cidade}"]`);

// Decodifica fora da rolagem as fotos da parada atual e das vizinhas. Assim a troca seguinte só
// esmaece uma foto pronta, sem o travamento de decodificar uma imagem grande na hora.
function prepararVizinhas() {
  if (!roteiro) return;
  const i = Math.max(roteiro.atual, 0);
  // No toque, um gesto rápido atravessa mais de uma parada: duas ficam prontas de cada lado.
  (roteiro.toque ? [i, i + 1, i - 1, i + 2, i - 2] : [i, i + 1, i - 1]).forEach((k) => {
    const parada = roteiro.paradas[k];
    const img = parada && fotoDaCidade(parada.dataset.cidade);
    if (img) carregarFoto(img);
  });
}

// Mostra na coluna do palco a foto e o detalhe da parada atual. O texto muda na hora; a foto, assim
// que estiver decodificada, se a parada ainda for a mesma.
let paradaMostrada = null;
function mostrarParada(parada) {
  if (!parada || paradaMostrada === parada) return;
  paradaMostrada = parada;
  document.querySelectorAll('[data-parada][aria-current]').forEach((x) => x.removeAttribute('aria-current'));
  parada.setAttribute('aria-current', 'step');
  const mostrarTexto = () => {
    if (paradaMostrada !== parada) return;
    document.getElementById('roteiro-atual-nome').textContent = parada.dataset.nome;
    document.getElementById('roteiro-atual-resumo').textContent = parada.dataset.resumo;
    document.getElementById('roteiro-atual-luz').textContent = parada.dataset.luz;
  };
  // No toque, foto e texto mudam juntos, com um limite curto de espera; os pontos não esperam nada.
  if (roteiro && roteiro.toque) setTimeout(mostrarTexto, TEXTO_ESPERA);
  else mostrarTexto();
  const img = fotoDaCidade(parada.dataset.cidade);
  if (img) {
    carregarFoto(img).then(() => {
      if (paradaMostrada !== parada) return;
      mostrarTexto();
      document.querySelectorAll('#roteiro-midia img.ativa').forEach((o) => { if (o !== img) o.classList.remove('ativa'); });
      img.classList.add('ativa');
    });
  }
  prepararVizinhas();
}

// Refaz as animações para o conteúdo atual (chamado a cada troca de página).
// semEntrada: os mesmos dados foram redesenhados com o leitor no lugar; nada entra de novo.
export function atualizarMovimento(semEntrada = false) {
  medirRoteiro();
  paradaMostrada = null;
  document.querySelectorAll('.parada__foto img[data-src]:not([src])').forEach((img) => fotosDasParadas.observe(img));
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    document.querySelectorAll('[data-parada]').forEach((p) => p.classList.add('ativa'));
    return;
  }
  if (mm) mm.revert();
  mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('movimento');
    ligarApresentacao();
    const visiveis = (sel) => gsap.utils.toArray(sel).filter((e) => e.offsetParent !== null);
    // Tela em pé e estreita: a foto é pequena em relação à rolagem; o efeito precisa de mais
    // amplitude e de um trecho que termine com a foto no meio da tela, para ser percebido.
    const estreita = innerWidth < 834;

    titulos = visiveis('[data-revelar]');
    atualizarTitulos();

    // Entrada como a da Apple: até 30px, 0,5 s, curva de entrada cubic-bezier(0, 0, 0.2, 1).
    const subir = visiveis('[data-subir]');
    if (subir.length && !semEntrada) {
      gsap.set(subir, { opacity: 0, y: 30 });
      ScrollTrigger.batch(subir, {
        start: 'top 92%',
        onEnter: (lote) => gsap.to(lote, { opacity: 1, y: 0, duration: 0.5, ease: ENTRADA, stagger: 0.06, overwrite: true }),
      });
    }

    // O efeito começa quando a foto entra na tela (ou no topo da página, se ela já abre visível)
    // e termina com o centro dela a 40% da altura, nunca em menos de 35% de uma tela de rolagem.
    visiveis('[data-rolagem]').forEach((moldura) => {
      const img = moldura.querySelector('img');
      if (!img) return;
      const topo = () => moldura.getBoundingClientRect().top + scrollY;
      const inicio = () => Math.max(0, topo() - innerHeight);
      gsap.fromTo(img, { scale: estreita ? 1.16 : 1.1 }, {
        scale: 1, ease: 'none',
        scrollTrigger: {
          trigger: moldura, scrub: 0.4, start: inicio,
          end: () => Math.max(inicio() + innerHeight * 0.35, topo() + moldura.offsetHeight / 2 - innerHeight * 0.4),
        },
      });
    });

    // A imagem tem sobra dentro da moldura (componentes.css), então o percurso nunca a descobre.
    visiveis('[data-paralaxe] img').forEach((img) => {
      const amplitude = estreita ? 9 : 5;
      gsap.fromTo(img, { yPercent: -amplitude }, { yPercent: amplitude, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'clamp(top bottom)', end: 'bottom top', scrub: 0.4 } });
    });

    trilhaViva = true;
    medirRoteiro();
    atualizarTrilha();
    if (roteiro && roteiro.secao.getBoundingClientRect().top < innerHeight * 2) prepararVizinhas();

    return () => {
      document.documentElement.classList.remove('movimento');
      document.getElementById('roteiro')?.classList.remove('roteiro--fixo', 'roteiro--vertical');
      document.querySelector('.topo')?.classList.remove('topo--sobre-fotos');
      titulos.forEach((el) => { el.style.removeProperty('opacity'); delete el.dataset.opacidade; });
      titulos = [];
      trilhaViva = false;
    };
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    const percurso = document.getElementById('roteiro-percurso');
    if (percurso) percurso.style.transform = '';
    document.getElementById('trilha-progresso')?.style.removeProperty('transform');
    document.querySelectorAll('[data-parada]').forEach((p) => p.classList.add('ativa'));
    medirRoteiro();
  });
  ScrollTrigger.refresh();
  atualizarTitulos();
}
