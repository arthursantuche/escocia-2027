// Movimento no estilo da página de referência (apple.com/iphone-duo):
// - títulos que saem do quase transparente para o preto conforme a rolagem;
// - blocos que sobem suavemente ao entrar na tela;
// - fotos com parallax leve;
// - roteiro fixado (pin) com a linha avançando pelas paradas (scrub).
// Com prefers-reduced-motion ou sem GSAP, nada se move e tudo aparece pronto.
let mm = null;

export function iniciarMovimento() {
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
}

// Refaz as animações para o conteúdo atual (chamado a cada troca de página).
export function atualizarMovimento() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
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

    const subir = visiveis('[data-subir]');
    gsap.set(subir, { opacity: 0, y: 40 });
    ScrollTrigger.batch(subir, {
      start: 'top 92%',
      onEnter: (lote) => gsap.to(lote, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, overwrite: true }),
    });

    visiveis('[data-parallax] img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    const roteiro = document.getElementById('roteiro');
    if (roteiro && roteiro.offsetParent !== null) {
      const paradas = gsap.utils.toArray('[data-parada]');
      gsap.timeline({
        scrollTrigger: {
          trigger: roteiro, start: () => 'top ' + document.querySelector('.topo').offsetHeight, end: () => '+=' + paradas.length * 120,
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (st) => {
            const ativas = Math.round(st.progress * paradas.length);
            paradas.forEach((p, i) => p.classList.toggle('ativa', i < ativas));
          },
        },
      }).fromTo('#trilha-progresso', { scaleY: 0 }, { scaleY: 1, ease: 'none' });
    }

    return () => document.documentElement.classList.remove('movimento');
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    document.querySelectorAll('[data-parada]').forEach((p) => p.classList.add('ativa'));
  });
  ScrollTrigger.refresh();
}
