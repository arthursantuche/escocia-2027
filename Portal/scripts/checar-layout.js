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

  // 2a. Qualquer bloco (texto, gráfico, foto) com uma divisória logo abaixo: a linha precisa de pelo menos
  //     8px (--espaco-par) de folga. Foi o caso da lista de gastos colada no gráfico do Orçamento.
  document.querySelectorAll('main:not([hidden]) .lista, main:not([hidden]) .tabela, main:not([hidden]) .rodape__identidade').forEach((alvo) => {
    const ant = alvo.previousElementSibling;
    if (!ant || !visivel(alvo) || !visivel(ant) || !px(getComputedStyle(alvo.matches('.tabela') ? alvo.querySelector('th, td') || alvo : alvo.firstElementChild || alvo).borderTopWidth)) return;
    if (ant.getBoundingClientRect().right <= alvo.getBoundingClientRect().left + 1) return; // lado a lado, não acima
    const folga = topoLayout(alvo) - (topoLayout(ant) + ant.offsetHeight);
    if (folga < 8) problemas.push(`Divisória a ${Math.round(folga)}px de "${texto(ant)}" (mínimo 8px)`);
  });

  // 2b. Linhas de uma mesma unidade encostadas: dois textos seguidos, um sobre o outro, sem os 4px
  //     (--espaco-junto) da regra de listas. Foi o caso de "⚠️ pendente" colado no item, no Painel.
  document.querySelectorAll('main:not([hidden]) :is(p, dt, dd, h3)').forEach((e) => {
    const ant = e.previousElementSibling;
    // Exceção documentada (DESIGN.md, "Espaçamento"): nomes e datas sob os pontos da trilha deitada.
    if (!ant || !ant.matches('p, dt, dd, h3, span') || !visivel(e) || !visivel(ant) || e.closest('table, .roteiro--fixo .parada')) return;
    const a = ant.getBoundingClientRect(); const b = e.getBoundingClientRect();
    if (b.top < a.bottom - 1 || Math.min(a.right, b.right) - Math.max(a.left, b.left) < 8) return;
    if (b.top - a.bottom < 3) avisos.push(`Linhas encostadas (${Math.round(b.top - a.bottom)}px): "${texto(ant)}" e "${texto(e)}" (use --espaco-junto)`);
  });

  // 2c. Medida de leitura: texto corrido de várias linhas passa de ~85 caracteres (17px) ou ~100 (legendas
  //     de 14px) e cansa a leitura. Só conta texto que de fato quebra em mais de uma linha.
  const regua = document.createElement('canvas').getContext('2d');
  document.querySelectorAll('main:not([hidden]) :is(p, li, label > span:first-child)').forEach((e) => {
    // Só texto próprio do elemento: um item de lista que só envolve o texto (como a tarefa) não conta.
    const proprio = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!visivel(e) || proprio.length < 100 || e.closest('table, .carrossel__trilho')) return;
    const s = getComputedStyle(e); regua.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const media = regua.measureText('abcdefghijklmnopqrstuvwxyz ABCDE áéç 0123').width / 42;
    const r = e.getBoundingClientRect();
    if (r.height < parseFloat(s.lineHeight) * 1.8) return; // uma linha só: a largura da caixa não diz nada
    const chars = Math.round(r.width / media);
    if (chars > (parseFloat(s.fontSize) >= 17 ? 90 : 100)) avisos.push(`Linha com ~${chars} caracteres: "${texto(e)}" (use --medida-leitura)`);
  });

  // 2. Títulos encostando na divisória do bloco seguinte (descendentes cortados, como a cedilha).
  document.querySelectorAll('h1, h2, h3, .titulo, .kicker').forEach((h) => {
    if (!visivel(h)) return;
    const prox = h.nextElementSibling;
    const alvo = prox && (px(getComputedStyle(prox).borderTopWidth) ? prox : prox.firstElementChild);
    if (!alvo || !visivel(alvo) || !px(getComputedStyle(alvo).borderTopWidth)) return;
    // Título ao lado do bloco (dia que acompanha a lista, no computador): não há divisória abaixo dele.
    if (alvo.getBoundingClientRect().left >= h.getBoundingClientRect().right - 1) return;
    const folga = topoLayout(alvo) - (topoLayout(h) + h.offsetHeight);
    const minimo = px(getComputedStyle(h).fontSize) * 0.3;
    if (folga < minimo) problemas.push(`Divisória a ${Math.round(folga)}px do título "${texto(h)}" (mínimo ${Math.round(minimo)}px)`);
  });

  // 3. Imagens ampliadas além da resolução real, considerando telas retina (2×) e o recorte
  //    de object-fit: cover (uma panorâmica recortada em 3:2 é ampliada pela altura).
  document.querySelectorAll('img').forEach((img) => {
    if (!visivel(img) || !img.complete || !img.naturalWidth || /\.svg$/.test(img.currentSrc)) return;
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
    // A primeira parada fica sempre marcada, mesmo com o roteiro ainda abaixo da tela.
    document.querySelectorAll('[data-parada].ativa:not(:first-child)').forEach((p) => {
      const ponto = (p.querySelector('.parada__ponto') || p).getBoundingClientRect();
      const centro = ponto.top + ponto.height / 2;
      if (ponto.top > vh) problemas.push(`Parada "${texto(p)}" marcada abaixo da tela`);
      if (fimLinha < centro - 2) problemas.push(`Parada "${texto(p)}" marcada antes de a linha chegar (${Math.round(centro - fimLinha)}px)`);
    });
  }

  // 6. Cabeçalho flutuante (com raio) não pode encostar na borda superior. A cápsula do menu é o
  //    pseudo-elemento .topo::before: mede-se pelo estilo calculado dele.
  const barra = document.querySelector('.topo--flutuante');
  if (barra) {
    const folga = px(getComputedStyle(barra, '::before').top);
    if (folga < 4) problemas.push(`Cápsula do menu encostada no topo (${Math.round(folga)}px)`);
  }
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

  // 8. Áreas de toque menores que 44 × 44px (aviso, só em telas de toque), em qualquer das duas medidas.
  //    Conta o ::after posicionado que estende o alvo sem mudar a linha (regra de alvo mínimo, em
  //    componentes.css, e "Buscar novidades"). Fora da conta: links dentro de texto corrido ou de legenda
  //    (créditos de foto), os pontos dos carrosséis (24 × 44px) e o nome da parada no palco do Roteiro, cujo alvo
  //    de toque é a foto logo acima (exceções do DESIGN.md, "Toque").
  if (matchMedia('(pointer: coarse)').matches) {
    document.querySelectorAll('a[href], button, .pill, select, input[type=checkbox]').forEach((b) => {
      if (!visivel(b) || b.closest('.carrossel__pontos') || b.matches('.roteiro__nome') || (getComputedStyle(b).display === 'inline' && b.closest('p, li, dd, td, figcaption'))) return;
      const r = b.getBoundingClientRect();
      if (!r.height) return;
      // A caixa de seleção e o rótulo formam um alvo só (o rótulo estende a área de toque sobre ela).
      const rotulo = b.type === 'checkbox' && b.labels && b.labels[0] ? b.labels[0].getBoundingClientRect() : null;
      if (rotulo && rotulo.height >= 44) return;
      const d = getComputedStyle(b, '::after');
      const estende = d.content !== 'none' && d.position === 'absolute';
      const alto = estende ? Math.max(r.height, r.height - px(d.top) - px(d.bottom)) : r.height;
      const largo = estende ? Math.max(r.width, r.width - px(d.left) - px(d.right)) : r.width;
      if (alto < 43.5 || largo < 43.5) avisos.push(`Área de toque de ${Math.round(largo)}×${Math.round(alto)}px em ${nome(b)} "${texto(b)}"`);
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
