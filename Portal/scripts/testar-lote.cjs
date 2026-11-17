// Bateria completa, no terminal, em vários tamanhos e nos dois temas: testarTelas e checarLayout em todas as
// rotas, testarTrilha (sem movimento reduzido), navegação dos carrosséis elemento por elemento (setas para a
// frente e para trás, dois cliques rápidos e cada ponto), item marcado no menu em cada página e erros de
// JavaScript. Junta os roteiros que antes eram montados à mão a cada rodada.
//
// Uso, com o servidor portal-sem-cache no ar (Referência técnica, seção 10):
//   node Portal/scripts/testar-lote.cjs
// Variáveis opcionais: MOTOR (chrome | webkit; o WebKit do Playwright precisa estar instalado), TEMAS
// (light,dark), TELAS (JSON: [[largura, altura, toque], …]), BASE e PLAYWRIGHT (caminho do playwright-core).
// Sai com código 1 quando acha um problema. Não é publicado: o workflow do Pages envia só os arquivos do site.

const pw = require(process.env.PLAYWRIGHT || '/opt/homebrew/lib/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:4174/?amostra';
const MOTOR = process.env.MOTOR || 'chrome';
const TEMAS = (process.env.TEMAS || 'light,dark').split(',');
const TELAS = JSON.parse(process.env.TELAS || '[[1440,900,0],[1024,768,1],[844,390,1],[667,375,1],[390,844,1]]');
const ROTAS = ['painel', 'roteiro', 'cidades', 'programacao', 'hospedagens', 'viagem', 'orcamento', 'checklist', 'pendencias', 'registrar', 'registrar/gasto', 'registrar/atracao', 'registrar/restaurante', 'registrar/nota', 'cidade/edimburgo', 'cidade/isle-of-skye'];
// Item do menu marcado em cada página (DESIGN.md, "Painel superior e navegação"): cidade marca Programação;
// Orçamento e Registrar não marcam nenhum.
const MENU = { programacao: 'Programação', 'cidade/edimburgo': 'Programação', hospedagens: 'Hospedagens', viagem: 'Viagem', checklist: 'Checklist', orcamento: '', registrar: '' };

const abrir = () => (MOTOR === 'webkit' ? pw.webkit.launch() : pw.chromium.launch({ channel: 'chrome' }));

async function pagina(nav, [w, h, toque], tema, movimento) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, hasTouch: !!toque, isMobile: MOTOR === 'chrome' && !!toque, colorScheme: tema, reducedMotion: movimento ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  try {
    await p.goto(`${BASE}#painel`, { waitUntil: 'networkidle' });
  } catch {
    console.error(`Não abriu ${BASE}. Ligue o servidor portal-sem-cache (.claude/launch.json) ou informe BASE.`);
    process.exit(2);
  }
  await p.waitForTimeout(800);
  return { ctx, p, erros };
}

// Lê o carrossel: índice do ponto atual, número de cartões, deslocamento do cartão atual até a borda de
// encaixe e se as setas estão visíveis.
const estadoCarrossel = (p, id) => p.evaluate((id) => {
  const t = document.getElementById(`${id}-lista`);
  const pts = [...document.getElementById(`${id}-pontos`).children];
  const i = pts.findIndex((b) => b.getAttribute('aria-current') === 'true');
  const c = t.children[i];
  const desloc = c ? Math.round(c.getBoundingClientRect().left - (t.getBoundingClientRect().left + parseFloat(getComputedStyle(t).paddingLeft))) : null;
  const seta = document.querySelector(`.carrossel__seta[aria-controls="${id}-lista"]`);
  return { i, n: t.children.length, desloc, setas: !!(seta && seta.offsetParent) };
}, id);

async function carrosseis(p, problemas) {
  for (const id of ['resumo', 'cidades']) {
    await p.locator(`#${id}-pontos`).scrollIntoViewIfNeeded();
    await p.waitForTimeout(2300); // a gota dos controles
    let e = await estadoCarrossel(p, id);
    const esperar = async (alvo, como) => {
      await p.waitForTimeout(900);
      e = await estadoCarrossel(p, id);
      if (e.i !== alvo) problemas.push(`Carrossel ${id}: ${como} levou ao cartão ${e.i + 1}, e não ao ${alvo + 1}`);
      else if (Math.abs(e.desloc) > 2) problemas.push(`Carrossel ${id}: cartão ${alvo + 1} a ${e.desloc}px da borda de encaixe (${como})`);
    };
    if (e.setas) {
      const prox = p.locator(`.carrossel__seta[aria-controls="${id}-lista"][data-direcao="1"]`);
      const ant = p.locator(`.carrossel__seta[aria-controls="${id}-lista"][data-direcao="-1"]`);
      for (let k = 1; k < e.n; k++) { if (await prox.isDisabled()) { problemas.push(`Carrossel ${id}: seta para a frente desativada no cartão ${k}`); break; } await prox.click(); await esperar(k, 'seta para a frente'); }
      if (!(await prox.isDisabled())) problemas.push(`Carrossel ${id}: seta para a frente ativa no último cartão`);
      for (let k = e.n - 2; k >= 0; k--) { if (await ant.isDisabled()) { problemas.push(`Carrossel ${id}: seta para trás desativada no cartão ${k + 2}`); break; } await ant.click(); await esperar(k, 'seta para trás'); }
      if (!(await ant.isDisabled())) problemas.push(`Carrossel ${id}: seta para trás ativa no primeiro cartão`);
      await p.locator(`#${id}-pontos button`).first().click(); await p.waitForTimeout(900);
      if (!(await prox.isDisabled())) { await prox.click(); await p.waitForTimeout(120); if (!(await prox.isDisabled())) await prox.click(); await esperar(Math.min(2, e.n - 1), 'dois cliques rápidos'); }
    }
    for (let k = e.n - 1; k >= 0; k--) {
      await p.locator(`#${id}-pontos button`).nth(k).click();
      await esperar(k, `ponto ${k + 1}`);
    }
  }
}

(async () => {
  const nav = await abrir();
  let total = 0;
  for (const tema of TEMAS) {
    for (const tela of TELAS) {
      const problemas = [];
      const avisos = new Set();
      // 1. Telas, layout e menu, com movimento reduzido (estado final, sem esperar animações).
      let { ctx, p, erros } = await pagina(nav, tela, tema, false);
      const tt = await p.evaluate(async () => { const { testarTelas } = await import('/scripts/testar-telas.js'); return testarTelas(); });
      problemas.push(...tt.problemas);
      for (const r of ROTAS) {
        await p.evaluate((r) => { location.hash = '#' + r; }, r);
        await p.waitForTimeout(450);
        const c = await p.evaluate(async () => { const { checarLayout } = await import('/scripts/checar-layout.js'); return checarLayout(); });
        c.problemas.forEach((x) => problemas.push(`${r}: ${x}`));
        c.avisos.forEach((x) => avisos.add(x));
        if (r in MENU) {
          const marcado = await p.evaluate(() => [...document.querySelectorAll('#secoes a[aria-current]')].map((a) => a.textContent.trim()).join(','));
          if (marcado !== MENU[r]) problemas.push(`${r}: menu marca "${marcado}", esperado "${MENU[r]}"`);
        }
      }
      problemas.push(...erros.map((x) => `Erro de JavaScript: ${x}`));
      await ctx.close();
      // 2. Trilha e carrosséis, com movimento (como no uso real).
      ({ ctx, p, erros } = await pagina(nav, tela, tema, true));
      if (tema === TEMAS[0]) {
        const tr = await p.evaluate(async () => { const { testarTrilha } = await import('/scripts/testar-trilha.js'); return testarTrilha(); });
        tr.problemas.forEach((x) => problemas.push(`Trilha: ${x}`));
      }
      await p.evaluate(() => { location.hash = '#painel'; scrollTo(0, 0); });
      await carrosseis(p, problemas);
      problemas.push(...erros.map((x) => `Erro de JavaScript: ${x}`));
      await ctx.close();
      total += problemas.length;
      console.log(`${MOTOR} ${tela[0]}×${tela[1]}${tela[2] ? ' toque' : ''} ${tema}: ${problemas.length ? problemas.length + ' problema(s)' : 'ok'}${avisos.size ? `, ${avisos.size} aviso(s)` : ''}`);
      problemas.forEach((x) => console.log('   ✗', x));
      [...avisos].forEach((x) => console.log('   ·', x));
    }
  }
  await nav.close();
  console.log(total ? `${total} problema(s).` : 'Nenhum problema.');
  process.exit(total ? 1 : 0);
})();
