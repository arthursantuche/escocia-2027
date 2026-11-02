// Fotos dos hotéis: vêm do anúncio no Booking (não são hospedadas aqui) e a coluna Fotos da
// aba Hospedagens guarda, em JSON, [{ f: 'id~chave', t: 'legenda' }]. A capa é a primeira.
import { el } from './util.js';

const urlFoto = (f, tamanho) => {
  const [id, chave] = String(f).split('~');
  return `https://cf.bstatic.com/xdata/images/hotel/${tamanho}/${id}.jpg?k=${chave}&o=`;
};
export const atributosFoto = (f, sizes) => ({
  src: urlFoto(f, 'max1024x768'), sizes,
  srcset: `${urlFoto(f, 'max500')} 500w, ${urlFoto(f, 'max1024x768')} 1024w, ${urlFoto(f, 'max1280x900')} 1280w`,
});

export function lerFotos(texto) {
  try {
    const fotos = JSON.parse(texto || '[]');
    return Array.isArray(fotos) ? fotos.filter((x) => x && x.f) : [];
  } catch { return []; }
}

// Tela cheia com rolagem nativa e encaixe: arrastar no celular, setas e teclado no computador.
function abrirTelaCheia(fotos, titulo, inicio) {
  const contador = el('p', { class: 'legenda', 'aria-live': 'polite' });
  const trilho = el('div', { class: 'ampliada__trilho', tabindex: '0' }, fotos.map((x) => el('figure', { class: 'ampliada__slide' },
    el('img', { ...atributosFoto(x.f, '100vw'), alt: x.t || titulo, loading: 'lazy' }),
    el('figcaption', { class: 'legenda' }, x.t || ''))));
  const atual = () => Math.round(trilho.scrollLeft / Math.max(trilho.clientWidth, 1));
  const ir = (i, suave = true) => trilho.scrollTo({ left: i * trilho.clientWidth, behavior: suave && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  const marcar = () => { contador.textContent = `${Math.min(atual() + 1, fotos.length)} de ${fotos.length}`; };
  trilho.addEventListener('scroll', marcar, { passive: true });
  const seta = (direcao, rotulo, classe) => el('button', { class: `carrossel__seta ${classe}`, type: 'button', 'aria-label': rotulo, onclick: () => ir(atual() + direcao) });
  const dialogo = el('dialog', { class: 'ampliada', 'aria-label': `Fotos de ${titulo}`, onclose: () => dialogo.remove(),
    onkeydown: (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual() - 1); }
    },
    onclick: (e) => { if (e.target === dialogo) dialogo.close(); } },
    el('header', { class: 'ampliada__topo' },
      el('div', {}, el('p', { class: 'kicker' }, titulo), contador),
      el('button', { class: 'pill pill--azul', type: 'button', onclick: () => dialogo.close() }, 'Fechar')),
    trilho,
    fotos.length > 1 ? el('div', { class: 'ampliada__setas' }, seta(-1, 'Foto anterior', ''), seta(1, 'Próxima foto', 'carrossel__seta--proxima')) : null);
  document.body.append(dialogo);
  dialogo.showModal();
  ir(inicio, false);
  marcar();
}

// Capa grande e miniaturas; qualquer uma abre a tela cheia. Mantém as proporções: a moldura
// é 3:2, como a maior parte das fotos, e o restante só aparece inteiro na tela cheia.
export function galeria(fotos, titulo) {
  const [capa, ...resto] = fotos;
  const abrir = (i) => () => abrirTelaCheia(fotos, titulo, i);
  return el('div', { class: 'galeria' },
    el('button', { class: 'galeria__capa', 'data-rolagem': true, type: 'button', 'aria-label': `Ampliar fotos de ${titulo}`, onclick: abrir(0) },
      el('img', { ...atributosFoto(capa.f, '(min-width: 834px) 340px, (min-width: 600px) 90vw, 100vw'), alt: `${capa.t || 'Foto'} de ${titulo}`, loading: 'lazy', onerror: (e) => e.target.remove() })),
    resto.length ? el('div', { class: 'galeria__miniaturas' }, resto.slice(0, 4).map((x, i) => el('button', { class: 'galeria__miniatura', type: 'button', 'aria-label': `Ampliar: ${x.t || 'foto'}`, onclick: abrir(i + 1) },
      el('img', { src: urlFoto(x.f, 'max500'), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }),
      i === 3 && resto.length > 4 ? el('span', { class: 'galeria__mais' }, `+${resto.length - 4}`) : null))) : null);
}
