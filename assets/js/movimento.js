// Movimento no estilo das páginas de referência (apple.com/iphone-duo e apple.com/iphone-18-pro):
// - títulos que saem do quase transparente para o opaco conforme a rolagem;
// - blocos que sobem até 30px ao entrar na tela;
// - fotos com parallax leve, sempre dentro da moldura;
// - foto de abertura que sai de 1,12× para 1× com a rolagem;
// - roteiro com a linha avançando pelas paradas (scrub), sem fixar a seção.
// Com prefers-reduced-motion ou sem GSAP, nada se move e tudo aparece pronto.
let mm = null;

// Linha guia do roteiro: a ponta da linha fica sempre nesta altura da tela, e cada
// círculo enche quando o centro dele passa por ela. Assim a linha e os círculos
// andam juntos, em qualquer altura de tela, e nada é marcado fora da vista.
const GUIA = 'center 60%';

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
  window.addEventListener('resize', medirTrilha);
}

// Posiciona a linha do centro do primeiro círculo ao centro do último.
function medirTrilha() {
  const trilha = document.querySelector('.roteiro__trilha');
  const pontos = trilha ? trilha.querySelectorAll('.parada__ponto') : [];
  if (pontos.length < 2) return;
  const base = trilha.getBoundingClientRect().top;
  const centro = (p) => { const r = p.getBoundingClientRect(); return r.top + r.height / 2 - base; };
  const topo = centro(pontos[0]);
  const altura = centro(pontos[pontos.length - 1]) - topo;
  trilha.querySelectorAll('.roteiro__linha, .roteiro__progresso').forEach((l) => {
    l.style.top = topo + 'px';
    l.style.height = altura + 'px';
    l.style.bottom = 'auto';
  });
}

// Mostra na coluna fixa do roteiro a foto da última parada marcada.
function mostrarFotoDaParada() {
  const midia = document.getElementById('roteiro-midia');
  if (!midia) return;
  const ativas = document.querySelectorAll('[data-parada].ativa');
  const cidade = (ativas[ativas.length - 1] || document.querySelector('[data-parada]'))?.dataset.cidade;
  midia.querySelectorAll('img').forEach((img) => img.classList.toggle('ativa', img.dataset.cidade === cidade));
}

// Refaz as animações para o conteúdo atual (chamado a cada troca de página).
export function atualizarMovimento() {
  medirTrilha();
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    document.querySelectorAll('[data-parada]').forEach((p) => p.classList.add('ativa'));
    return;
  }
  if (mm) mm.revert();
  mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('movimento');
    const visiveis = (sel) => gsap.utils.toArray(sel).filter((e) => e.offsetParent !== null);

    visiveis('[data-revelar]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0.08 }, {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: true },
      });
    });

    // Entrada como a da Apple: até 30px, 0,5 s, curva de entrada cubic-bezier(0, 0, 0.2, 1).
    const subir = visiveis('[data-subir]');
    if (subir.length) {
      gsap.set(subir, { opacity: 0, y: 30 });
      ScrollTrigger.batch(subir, {
        start: 'top 92%',
        onEnter: (lote) => gsap.to(lote, { opacity: 1, y: 0, duration: 0.5, ease: ENTRADA, stagger: 0.06, overwrite: true }),
      });
    }

    // A imagem tem 12% de sobra dentro da moldura (paginas.css), então ±5% nunca a descobre.
    visiveis('[data-parallax] img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    visiveis('[data-zoom] img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom 40%', scrub: true } });
    });

    const paradas = visiveis('[data-parada]');
    if (paradas.length > 1) {
      const ponto = (p) => p.querySelector('.parada__ponto');
      paradas.forEach((p) => ScrollTrigger.create({
        trigger: ponto(p), start: GUIA,
        onEnter: () => { p.classList.add('ativa'); mostrarFotoDaParada(); },
        onLeaveBack: () => { p.classList.remove('ativa'); mostrarFotoDaParada(); },
      }));
      // scrub sem atraso: a ponta da linha acompanha a guia exatamente.
      gsap.fromTo('#trilha-progresso', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: ponto(paradas[0]), start: GUIA, endTrigger: ponto(paradas[paradas.length - 1]), end: GUIA, scrub: true },
      });
    }
    ScrollTrigger.addEventListener('refreshInit', medirTrilha);

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', medirTrilha);
      document.documentElement.classList.remove('movimento');
    };
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    document.querySelectorAll('[data-parada]').forEach((p) => p.classList.add('ativa'));
    // Sem movimento, a coluna fica com a foto da primeira parada.
    const primeira = document.querySelector('[data-parada]')?.dataset.cidade;
    document.querySelectorAll('#roteiro-midia img').forEach((img) => img.classList.toggle('ativa', img.dataset.cidade === primeira));
  });
  ScrollTrigger.refresh();
}
