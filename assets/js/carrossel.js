// Carrossel horizontal das cidades: rolagem nativa com encaixe (swipe no celular),
// pontos que mostram e escolhem o cartão atual e setas anterior/próximo no computador.
// Os ouvintes ficam nos elementos fixos do index.html; os cartões e pontos podem ser
// refeitos a cada renderização sem duplicar nada.
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function iniciarCarrossel(trilho, pontos, setas) {
  const cartoes = () => [...trilho.children];
  // Posição de rolagem que encaixa um cartão: a distância dele até o primeiro
  // (o scroll-padding vem como expressão max(...) e não serve para a conta).
  const posicao = (c) => c.offsetLeft - cartoes()[0].offsetLeft;
  const ir = (i) => {
    const alvo = cartoes()[Math.max(0, Math.min(i, cartoes().length - 1))];
    if (alvo) trilho.scrollTo({ left: posicao(alvo), behavior: reduzido() ? 'auto' : 'smooth' });
  };
  // Cartão atual: o que está mais perto da borda de encaixe.
  const atual = () => {
    let melhor = 0;
    let distancia = Infinity;
    cartoes().forEach((c, i) => {
      const d = Math.abs(posicao(c) - trilho.scrollLeft);
      if (d < distancia) { distancia = d; melhor = i; }
    });
    return melhor;
  };
  const marcar = () => {
    // No fim do trilho o último cartão não chega à borda de encaixe: ele passa a ser o atual.
    const fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 2;
    const i = fim && trilho.scrollLeft > 2 ? cartoes().length - 1 : atual();
    [...pontos.children].forEach((p, k) => p.setAttribute('aria-current', String(k === i)));
    setas.forEach((s) => { s.disabled = Number(s.dataset.direcao) < 0 ? trilho.scrollLeft <= 2 : fim; });
  };

  let pedido = 0;
  trilho.addEventListener('scroll', () => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(marcar); }, { passive: true });
  pontos.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) ir([...pontos.children].indexOf(b));
  });
  setas.forEach((s) => s.addEventListener('click', () => ir(atual() + Number(s.dataset.direcao))));
  new ResizeObserver(marcar).observe(trilho);
  return marcar;
}
