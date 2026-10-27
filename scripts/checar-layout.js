// Checagem de layout para rodar na página aberta (navegador, playwright-cli ou console):
//   const { checarLayout } = await import('/scripts/checar-layout.js'); checarLayout();
// Devolve { problemas, avisos } com o que encontrar na tela atual. Sem dependências.
// Não é publicado: o workflow do Pages envia só os arquivos do site.

const px = (v) => parseFloat(v) || 0;
const visivel = (e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
const nome = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '');
const texto = (e) => (e.textContent || '').trim().slice(0, 40);
// Posição no layout, sem as transformações das animações de entrada (que podem não ter rodado).
const topoLayout = (e) => { let t = 0; for (let n = e; n; n = n.offsetParent) t += n.offsetTop; return t; };

// Contraste WCAG entre duas cores CSS (hex ou rgb).
function luminancia(cor) {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = cor;
  const hex = c.fillStyle.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((t, x, i) => t + x * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Pares de tokens de papel e o contraste mínimo de cada um (4,5 texto; 3 controles).
const PARES = [
  ['--cor-texto', '--cor-fundo', 4.5], ['--cor-texto', '--cor-faixa', 4.5], ['--cor-texto', '--cor-cartao', 4.5],
  ['--cor-texto-2', '--cor-fundo', 4.5], ['--cor-texto-2', '--cor-faixa', 4.5], ['--cor-texto-2', '--cor-cartao', 4.5],
  ['--cor-link', '--cor-fundo', 4.5], ['--cor-link', '--cor-faixa', 4.5], ['--cor-link', '--cor-cartao', 4.5],
  ['--cor-alerta', '--cor-fundo', 4.5], ['--cor-alerta', '--cor-faixa', 4.5], ['--cor-alerta', '--cor-cartao', 4.5],
  ['--cor-sobre-acao', '--cor-acao', 4.5], ['--cor-contorno', '--cor-fundo', 3], ['--cor-contorno', '--cor-cartao', 3],
];

export function checarLayout() {
  const problemas = [];
  const avisos = [];
  const raiz = document.documentElement;
  const vh = innerHeight;

  // 1. Rolagem horizontal da página.
  if (raiz.scrollWidth > raiz.clientWidth + 1) problemas.push(`Rolagem horizontal: página com ${raiz.scrollWidth}px em tela de ${raiz.clientWidth}px`);

  // 2. Títulos encostando na divisória do bloco seguinte (descendentes cortados, como a cedilha).
  document.querySelectorAll('h1, h2, h3, .titulo, .kicker').forEach((h) => {
    if (!visivel(h)) return;
    const prox = h.nextElementSibling;
    const alvo = prox && (px(getComputedStyle(prox).borderTopWidth) ? prox : prox.firstElementChild);
    if (!alvo || !visivel(alvo) || !px(getComputedStyle(alvo).borderTopWidth)) return;
    const folga = topoLayout(alvo) - (topoLayout(h) + h.offsetHeight);
    const minimo = px(getComputedStyle(h).fontSize) * 0.3;
    if (folga < minimo) problemas.push(`Divisória a ${Math.round(folga)}px do título "${texto(h)}" (mínimo ${Math.round(minimo)}px)`);
  });

  // 3. Imagens ampliadas além da resolução real, considerando telas retina (2×) e o recorte
  //    de object-fit: cover (uma panorâmica recortada em 3:2 é ampliada pela altura).
  document.querySelectorAll('img').forEach((img) => {
    if (!visivel(img) || !img.complete || !img.naturalWidth) return;
    const r = img.getBoundingClientRect();
    // Com srcset, naturalWidth vem dividido pela densidade: vale a maior largura (w) oferecida.
    const larguras = [...(img.getAttribute('srcset') || '').matchAll(/\s(\d+)w/g)].map((m) => +m[1]);
    const w = larguras.length ? Math.max(...larguras) : img.naturalWidth;
    const h = w * img.naturalHeight / img.naturalWidth;
    const escala = Math.max(r.width / w, r.height / h) * 2;
    if (escala > 1.1) problemas.push(`Imagem ampliada ${escala.toFixed(1)}× em tela retina: ${img.currentSrc.split('/').pop()} (${Math.round(w)}×${Math.round(h)}px exibida em ${Math.round(r.width)}×${Math.round(r.height)}px)`);
  });

  // 4. Legendas cobertas pela imagem (transformações não mudam o layout, mas pintam por cima).
  document.querySelectorAll('figure').forEach((f) => {
    const cap = f.querySelector('figcaption');
    const img = f.querySelector('img');
    if (!cap || !img || !visivel(cap)) return;
    // Só conta a parte visível da imagem: a moldura com overflow recortado esconde a sobra.
    const a = img.getBoundingClientRect();
    for (let n = img.parentElement; n && n !== f.parentElement; n = n.parentElement) {
      if (getComputedStyle(n).overflow === 'visible') continue;
      const m = n.getBoundingClientRect();
      a.y = Math.max(a.top, m.top); a.height = Math.min(a.bottom, m.bottom) - a.y;
    }
    const b = cap.getBoundingClientRect();
    const sobra = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (sobra > 1 && a.left < b.right && b.left < a.right) problemas.push(`Imagem cobre ${Math.round(sobra)}px da legenda "${texto(cap)}"`);
  });

  // 5. Roteiro: parada marcada fora da tela ou antes de a linha chegar.
  //    Com movimento reduzido tudo já aparece marcado, de propósito.
  const linha = document.getElementById('trilha-progresso');
  if (linha && visivel(linha) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const fimLinha = linha.getBoundingClientRect().bottom;
    document.querySelectorAll('[data-parada].ativa').forEach((p) => {
      const ponto = (p.querySelector('.parada__ponto') || p).getBoundingClientRect();
      const centro = ponto.top + ponto.height / 2;
      if (ponto.top > vh) problemas.push(`Parada "${texto(p)}" marcada abaixo da tela`);
      if (fimLinha < centro - 2) problemas.push(`Parada "${texto(p)}" marcada antes de a linha chegar (${Math.round(centro - fimLinha)}px)`);
    });
  }

  // 6. Cabeçalho flutuante (com raio) não pode encostar na borda superior.
  document.querySelectorAll('header *').forEach((e) => {
    const cs = getComputedStyle(e);
    if (e.parentElement.tagName !== 'HEADER' || px(cs.borderTopLeftRadius) < 8 || !visivel(e)) return;
    const topo = e.getBoundingClientRect().top;
    if (topo < 4) problemas.push(`Barra flutuante ${nome(e)} encostada no topo (${Math.round(topo)}px)`);
  });

  // 7. Campos com menos de 16px: o iOS aplica zoom ao tocar.
  document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), select, textarea').forEach((c) => {
    if (visivel(c) && px(getComputedStyle(c).fontSize) < 16) problemas.push(`Campo ${c.name || c.getAttribute('aria-label') || nome(c)} com ${getComputedStyle(c).fontSize}: o iOS dá zoom`);
  });

  // 8. Áreas de toque menores que 44px (aviso, só em telas de toque).
  if (matchMedia('(pointer: coarse)').matches) {
    document.querySelectorAll('button, .pill, select, input[type=checkbox]').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (visivel(b) && r.height && r.height < 44 && r.width < 44) avisos.push(`Área de toque de ${Math.round(r.width)}×${Math.round(r.height)}px em ${nome(b)} "${texto(b)}"`);
    });
  }

  // 9. Contraste dos tokens de papel do tema atual.
  const tokens = getComputedStyle(raiz);
  PARES.forEach(([frente, fundo, minimo]) => {
    const a = tokens.getPropertyValue(frente).trim();
    const b = tokens.getPropertyValue(fundo).trim();
    if (!a || !b) return;
    const c = contraste(a, b);
    if (c < minimo) problemas.push(`Contraste ${frente} sobre ${fundo}: ${c.toFixed(2)} (mínimo ${minimo})`);
  });

  return { problemas, avisos };
}

globalThis.checarLayout = checarLayout;
