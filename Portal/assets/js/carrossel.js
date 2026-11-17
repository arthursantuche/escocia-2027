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
  // Cartão atual: o que está mais perto da borda de encaixe. O trilho tem espaço no fim para todo
  // cartão chegar a essa borda (componentes.css), então cada cartão tem uma posição própria; no fim do
  // trilho, por segurança (arredondamento), vale o último. Pontos, setas e indicador usam esta conta,
  // e a seta vai sempre ao vizinho na sequência, sem saltos.
  let destino = null; // cartão para onde as setas mandaram, até a rolagem chegar lá
  const fim = () => trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 2;
  const atual = () => {
    if (fim() && trilho.scrollLeft > 2) return cartoes().length - 1;
    let melhor = 0;
    let distancia = Infinity;
    cartoes().forEach((c, i) => {
      const d = Math.abs(posicao(c) - trilho.scrollLeft);
      if (d < distancia) { distancia = d; melhor = i; }
    });
    return melhor;
  };
  const marcar = () => {
    const i = atual();
    if (destino !== null && i === destino) destino = null;
    [...pontos.children].forEach((p, k) => p.setAttribute('aria-current', String(k === i)));
    setas.forEach((s) => { s.disabled = Number(s.dataset.direcao) < 0 ? i === 0 && trilho.scrollLeft <= 2 : i === cartoes().length - 1; });
  };

  let pedido = 0;
  trilho.addEventListener('scroll', () => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(marcar); }, { passive: true });
  pontos.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) ir([...pontos.children].indexOf(b));
  });
  // Cliques seguidos durante a rolagem suave contam a partir do destino anterior, não do meio do
  // caminho: assim dois cliques rápidos andam dois cartões, sem repetir nem pular.
  let soltar = 0;
  setas.forEach((s) => s.addEventListener('click', () => {
    const n = cartoes().length;
    destino = Math.max(0, Math.min((destino ?? atual()) + Number(s.dataset.direcao), n - 1));
    ir(destino);
    clearTimeout(soltar);
    soltar = setTimeout(() => { destino = null; }, 700);
  }));
  new ResizeObserver(marcar).observe(trilho);
  return marcar;
}
