// Indicadores de interação cortados. Força :hover e :focus-visible em cada elemento interativo (pelo
// protocolo do Chrome) e confere se o indicador (box-shadow de fora, outline) cabe nos ancestrais que
// cortam: overflow diferente de visible (um trilho que rola na horizontal corta também em cima e
// embaixo), clip-path ou contain: paint. Foi o caso do contorno dos cartões do Resumo sem o lado de cima.
//
// Uso, com o servidor portal-sem-cache no ar (Referência técnica, seção 10):
//   node Portal/scripts/checar-indicadores.cjs
// Variáveis opcionais: BASE (endereço com ?amostra), ROTAS (separadas por vírgula), TEMA (light|dark),
// TELAS (JSON: [[largura, altura, toque], …]) e PLAYWRIGHT (caminho do playwright-core).
// Sai com código 1 quando acha um corte. Não é publicado: o workflow do Pages envia só os arquivos do site.

const { chromium } = require(process.env.PLAYWRIGHT || '/opt/homebrew/lib/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:4174/?amostra';
const ROTAS = (process.env.ROTAS || 'painel,programacao,hospedagens,viagem,orcamento,checklist,pendencias,registrar,registrar/gasto,registrar/atracao,registrar/restaurante,registrar/nota,cidade/edimburgo,cidade/isle-of-skye').split(',');
const TELAS = JSON.parse(process.env.TELAS || '[[1440,900,0],[1024,768,1],[844,390,1],[390,844,1]]');
const TEMA = process.env.TEMA || 'light';
const SEL = 'a[href], button, summary, select, input:not([type=hidden]), textarea, [tabindex="0"]';

// Roda na página: mede o indicador do elemento i no estado forçado e devolve os cortes.
function medir([i, estado]) {
  const e = window.__alvos[i];
  if (!e) return null;
  const s = getComputedStyle(e);
  const b = e.getBoundingClientRect();
  if (!b.width || !b.height || s.visibility === 'hidden' || e.closest('[hidden]')) return null;
  const ext = { t: 0, r: 0, b: 0, l: 0 };
  const sombras = s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/);
  for (const sh of sombras) {
    if (/inset/.test(sh)) continue;
    const [x = 0, y = 0, blur = 0, spread = 0] = (sh.replace(/rgba?\([^)]*\)/g, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
    const a = blur + spread;
    ext.t = Math.max(ext.t, a - y); ext.b = Math.max(ext.b, a + y);
    ext.l = Math.max(ext.l, a - x); ext.r = Math.max(ext.r, a + x);
  }
  if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) {
    const o = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset || 0);
    for (const k in ext) ext[k] = Math.max(ext[k], o);
  }
  if (!ext.t && !ext.r && !ext.b && !ext.l) return null;
  const caixa = { t: b.top - ext.t, b: b.bottom + ext.b, l: b.left - ext.l, r: b.right + ext.r };
  const cortes = [];
  for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
    const sa = getComputedStyle(a);
    if (sa.overflowX === 'visible' && sa.overflowY === 'visible' && sa.clipPath === 'none' && !/paint|strict|content/.test(sa.contain)) continue;
    const ra = a.getBoundingClientRect();
    const clip = { t: ra.top + parseFloat(sa.borderTopWidth), l: ra.left + parseFloat(sa.borderLeftWidth) };
    clip.b = clip.t + a.clientHeight; clip.r = clip.l + a.clientWidth;
    const lados = [];
    if (caixa.t < clip.t - 0.5 && b.top < clip.b) lados.push(`topo ${(clip.t - caixa.t).toFixed(1)}px`);
    if (caixa.b > clip.b + 0.5 && b.bottom > clip.t) lados.push(`base ${(caixa.b - clip.b).toFixed(1)}px`);
    // Nas laterais de um trilho que rola, só conta o elemento que está inteiro na janela visível.
    if (caixa.l < clip.l - 0.5 && b.left >= clip.l - 1) lados.push(`esquerda ${(clip.l - caixa.l).toFixed(1)}px`);
    if (caixa.r > clip.r + 0.5 && b.right <= clip.r + 1) lados.push(`direita ${(caixa.r - clip.r).toFixed(1)}px`);
    if (lados.length) cortes.push(`${a.tagName.toLowerCase()}.${String(a.className).split(' ')[0]} corta ${lados.join(', ')}`);
  }
  if (!cortes.length) return null;
  const nome = e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '');
  return { chave: `${estado} ${nome}: ${cortes.join('; ')}`, texto: (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30) };
}

(async () => {
  const nav = await chromium.launch({ channel: 'chrome' });
  const achados = new Map();
  for (const [w, h, toque] of TELAS) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, isMobile: !!toque, hasTouch: !!toque, colorScheme: TEMA, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    try {
      await p.goto(`${BASE}#${ROTAS[0]}`, { waitUntil: 'networkidle' });
    } catch {
      console.error(`Não abriu ${BASE}. Ligue o servidor portal-sem-cache (.claude/launch.json) ou informe BASE.`);
      process.exit(2);
    }
    await p.waitForTimeout(700);
    await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation-duration:0s!important}' });
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    for (const rota of ROTAS) {
      await p.evaluate((r) => { location.hash = '#' + r; }, rota);
      await p.waitForTimeout(600);
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: SEL });
      await p.evaluate((sel) => { window.__alvos = [...document.querySelectorAll(sel)]; }, SEL);
      // Tela de toque não tem hover: só o foco.
      for (const estado of toque ? ['focus-visible'] : ['hover', 'focus-visible']) {
        for (let i = 0; i < nodeIds.length; i++) {
          const forcar = estado === 'hover' ? ['hover'] : ['focus', 'focus-visible'];
          await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: forcar });
          const r = await p.evaluate(medir, [i, estado]);
          await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: [] });
          if (!r) continue;
          const chave = `${w}×${h} ${r.chave}`;
          if (!achados.has(chave)) achados.set(chave, { exemplo: r.texto, rotas: new Set() });
          achados.get(chave).rotas.add(rota);
        }
      }
    }
    await ctx.close();
  }
  await nav.close();
  for (const [chave, { exemplo, rotas }] of achados) console.log(`${chave} ("${exemplo}", em ${[...rotas].join(', ')})`);
  console.log(achados.size ? `${achados.size} indicador(es) cortado(s).` : 'Nenhum indicador cortado.');
  process.exit(achados.size ? 1 : 0);
})();
