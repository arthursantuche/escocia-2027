// Testa o palco fixo do roteiro na tela atual, rolando de verdade. No console:
//   const { testarTrilha } = await import('/scripts/testar-trilha.js'); await testarTrilha();
// Não é publicado: o workflow do Pages envia só os arquivos do site.
export async function testarTrilha() {
  const { atualizarTrilha } = await import('/assets/js/movimento.js');
  const secao = document.getElementById('roteiro');
  const palco = document.getElementById('roteiro-palco');
  const barra = document.getElementById('trilha-progresso');
  const paradas = [...document.querySelectorAll('[data-parada]')];
  const ler = () => {
    atualizarTrilha();
    return { p: Number((/scale[XY]\((.*?)\)/.exec(barra.style.transform) || [])[1] ?? -1), ativas: paradas.filter((x) => x.classList.contains('ativa')).length };
  };
  const antes = scrollY;
  if (secao.classList.contains('roteiro--vertical')) return testarVertical(secao, barra, paradas, antes);
  const inicio = secao.getBoundingClientRect().top + scrollY;
  const distancia = secao.offsetHeight - palco.offsetHeight;
  const topoPainel = document.querySelector('.topo').offsetHeight;
  const r = { tela: `${innerWidth}x${innerHeight}`, fixo: secao.classList.contains('roteiro--fixo'), distancia, problemas: [] };
  scrollTo({ top: inicio, behavior: 'instant' });
  const zero = ler();
  if (zero.p > 0.001 || zero.ativas !== 1) r.problemas.push(`não começa em zero: ${JSON.stringify(zero)}`);
  let ultimo = -1;
  for (let i = 0; i <= 60; i++) {
    scrollTo({ top: inicio + (distancia * i) / 60, behavior: 'instant' });
    const l = ler();
    if (l.p < ultimo) r.problemas.push(`voltou em ${i}/60`);
    ultimo = l.p;
    if (Math.abs(palco.getBoundingClientRect().top) > 1) r.problemas.push(`palco saiu do lugar em ${i}/60`);
    const atual = paradas[l.ativas - 1].getBoundingClientRect();
    const t = document.getElementById('roteiro-trilha').getBoundingClientRect();
    if (atual.top < t.top - 1 || atual.bottom > t.bottom + 1) r.problemas.push(`parada atual fora da vista em ${i}/60`);
    const texto = document.querySelector('.roteiro__texto').getBoundingClientRect();
    const foto = document.getElementById('roteiro-midia').getBoundingClientRect().height;
    r.fotoAltura ??= foto;
    if (Math.abs(foto - r.fotoAltura) > 1) r.problemas.push(`foto mudou de altura em ${i}/60`);
    const detalhe = document.getElementById('roteiro-atual');
    if (detalhe.scrollHeight > detalhe.clientHeight + 1) r.problemas.push(`detalhe cortado em ${i}/60`);
    const caixa = document.getElementById('roteiro-trilha').getBoundingClientRect();
    document.querySelectorAll('.parada__ponto').forEach((ponto) => {
      const b = ponto.getBoundingClientRect();
      if (b.left - 1 < caixa.left || b.right + 1 > caixa.right) r.problemas.push('bolinha cortada na lateral');
    });
    if (texto.top < topoPainel - 1) r.problemas.push(`coluna sob o painel em ${i}/60`);
    if (texto.bottom > innerHeight + 1) r.problemas.push(`coluna cortada em ${i}/60: ${Math.round(texto.bottom - innerHeight)}px`);
  }
  r.fim = ler();
  if (r.fim.p !== 1 || r.fim.ativas !== paradas.length) r.problemas.push(`não chega ao fim: ${JSON.stringify(r.fim)}`);
  // Solta: um pouco depois do fim, o palco sobe e a seção seguinte aparece.
  scrollTo({ top: inicio + distancia + 200, behavior: 'instant' });
  r.solta = Math.round(palco.getBoundingClientRect().top);
  if (r.solta > -100) r.problemas.push('palco não solta');
  const proxima = document.getElementById('cidades').getBoundingClientRect().top;
  if (proxima > innerHeight) r.problemas.push('seção seguinte não sobe');
  r.problemas = [...new Set(r.problemas)].slice(0, 8);
  r.excedeTrilha = document.getElementById('roteiro-trilha').classList.contains('roteiro__trilha--excede');
  r.excessoLateral = document.documentElement.scrollWidth - innerWidth;
  scrollTo({ top: antes, behavior: 'instant' });
  return r;
}

// Vertical: coluna no fluxo da página, sem nada preso. A linha sobe em ordem até a última parada e
// nenhuma foto muda a altura da página ao carregar.
async function testarVertical(secao, barra, paradas, antes) {
  const r = { tela: `${innerWidth}x${innerHeight}`, vertical: true, problemas: [] };
  const inicio = secao.getBoundingClientRect().top + scrollY;
  const altura = secao.offsetHeight;
  let ultimo = -1;
  for (let i = 0; i <= 60; i++) {
    scrollTo({ top: inicio + ((altura - innerHeight * 0.3) * i) / 60, behavior: 'instant' });
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const p = Number((/scale[XY]\((.*?)\)/.exec(barra.style.transform) || [])[1] ?? -1);
    if (p < ultimo) r.problemas.push(`voltou em ${i}/60`);
    ultimo = p;
  }
  r.fim = { p: ultimo, ativas: paradas.filter((x) => x.classList.contains('ativa')).length };
  if (ultimo !== 1 || r.fim.ativas !== paradas.length) r.problemas.push(`não chega ao fim: ${JSON.stringify(r.fim)}`);
  if (Math.abs(secao.offsetHeight - altura) > 1) r.problemas.push(`altura mudou: ${altura} → ${secao.offsetHeight}`);
  paradas.forEach((x) => {
    const f = x.querySelector('.parada__foto').getBoundingClientRect();
    if (f.right > innerWidth + 1) r.problemas.push('foto além da borda');
    if (Math.abs(f.width / f.height - 1.5) > 0.02) r.problemas.push('foto fora de 3:2');
  });
  r.excessoLateral = document.documentElement.scrollWidth - innerWidth;
  r.problemas = [...new Set(r.problemas)].slice(0, 8);
  scrollTo({ top: antes, behavior: 'instant' });
  return r;
}
