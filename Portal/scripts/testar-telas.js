// Percorre as rotas na tela atual e aponta rolagem lateral, foto quebrada, texto cortado no
// painel e blocos fora da grade. No console:
//   const { testarTelas } = await import('/scripts/testar-telas.js'); await testarTelas();
// Não é publicado: o workflow do Pages envia só os arquivos do site.
const ROTAS = ['painel', 'roteiro', 'cidades', 'programacao', 'hospedagens', 'viagem', 'orcamento', 'checklist', 'registrar', 'registrar/gasto', 'registrar/atracao', 'registrar/restaurante', 'cidade/edimburgo', 'cidade/st-andrews', 'cidade/glasgow', 'cidade/glencoe', 'cidade/fort-william', 'cidade/isle-of-skye', 'cidade/inverness'];
// Respiro mínimo depois de um título, em px: a regra de diagramação registrada no DESIGN.md.
const RESPIRO = [['h1.titulo, h2.titulo', 24], ['h2.kicker', 8], ['.grupo__titulo', 4]];
function respiros(rota, problemas) {
  RESPIRO.forEach(([seletor, minimo]) => {
    document.querySelectorAll(`main:not([hidden]) :is(${seletor})`).forEach((h) => {
      if (!h.offsetParent) return;
      const prox = h.nextElementSibling;
      if (!prox || !prox.offsetParent || prox.matches('.introducao, a')) return; // subtítulo e link são parte do título
      const a = h.getBoundingClientRect();
      const b = prox.getBoundingClientRect();
      const lado = b.left >= a.right - 1; // título e link na mesma linha
      if (!lado && b.top - a.bottom < minimo) problemas.push(`${rota}: "${h.textContent.slice(0, 24)}" a ${Math.round(b.top - a.bottom)}px do bloco seguinte (mínimo ${minimo})`);
    });
  });
}

export async function testarTelas() {
  const res = { tela: `${innerWidth}x${innerHeight}`, problemas: [] };
  const lista = document.getElementById('secoes');
  res.navExcede = lista.scrollWidth - lista.clientWidth;
  res.alturaPainel = document.querySelector('.topo').offsetHeight;
  for (const r of ROTAS) {
    location.hash = '#' + r;
    await new Promise((ok) => setTimeout(ok, 350));
    const excesso = document.documentElement.scrollWidth - innerWidth;
    if (excesso > 0) res.problemas.push(`${r}: rolagem lateral ${excesso}px`);
    respiros(r, res.problemas);
    const quebradas = [...document.images].filter((i) => i.complete && i.src && i.naturalWidth === 0 && i.offsetParent).length;
    if (quebradas) res.problemas.push(`${r}: ${quebradas} foto(s) quebrada(s)`);
    const estourados = [...document.querySelectorAll('main:not([hidden]) p, main:not([hidden]) h1, main:not([hidden]) h2, main:not([hidden]) a, main:not([hidden]) button')]
      .filter((e) => e.offsetParent && !e.closest('.carrossel__trilho') && e.getBoundingClientRect().right > innerWidth + 1).length;
    if (estourados) res.problemas.push(`${r}: ${estourados} elemento(s) além da borda`);
    if (r === 'programacao') {
      res.alinhamento = [...document.querySelectorAll('.trecho')].map((t) => {
        const foto = t.querySelector('.trecho__foto')?.getBoundingClientRect().top ?? 0;
        return Math.round(t.querySelector('.dia__texto').getBoundingClientRect().top - foto);
      });
    }
    if (r === 'roteiro') {
      const s = document.getElementById('roteiro').getBoundingClientRect();
      res.ancoraTopo = Math.round(s.top);
    }
  }
  return res;
}
