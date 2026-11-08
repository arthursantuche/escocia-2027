// Visualizador de vouchers: abre o PDF por cima da página, em qualquer aparelho. O pdf.js
// desenha cada página num canvas (iframes de PDF não rolam direito no iPhone) e só é
// carregado na primeira abertura.
import { el, formatoConfirmacao } from './util.js';
import { obterVoucher, vouchersGuardados, CodigoInvalido } from './dados.js';

let pdfjs = null;
async function carregarPdfjs() {
  if (!pdfjs) {
    pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  }
  return pdfjs;
}

async function desenhar(bytes, destino) {
  const lib = await carregarPdfjs();
  // O pdf.js fica com o buffer que recebe; a cópia mantém os bytes para "Abrir no aparelho".
  const doc = await lib.getDocument({ data: bytes.slice() }).promise;
  const largura = Math.min(destino.clientWidth || 800, 960);
  const escalaTela = Math.min(window.devicePixelRatio || 1, 3);
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const base = pagina.getViewport({ scale: 1 });
    const escala = largura / base.width;
    const vista = pagina.getViewport({ scale: escala * escalaTela });
    const canvas = el('canvas', { class: 'voucher__pagina', 'aria-label': `Página ${n} de ${doc.numPages}`, role: 'img' });
    canvas.width = vista.width;
    canvas.height = vista.height;
    destino.append(canvas);
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;
  }
}

// Abre o PDF fora do site: compartilhar (iPhone, Android) ou nova aba (computador).
async function abrirFora(bytes, nome) {
  const arquivo = new File([bytes], nome, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [arquivo], title: nome }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(arquivo);
  const aba = window.open(url, '_blank');
  if (!aba) el('a', { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function abrirVoucher(hospedagem, aoCodigoInvalido) {
  const paginas = el('div', { class: 'voucher__paginas' });
  const estado = el('p', { class: 'voucher__estado', role: 'status' }, el('span', { class: 'carregando__ponto', 'aria-hidden': 'true' }), 'Abrindo a reserva…');
  const fora = el('button', { class: 'pill', type: 'button', hidden: true }, 'Abrir no aparelho');
  const fechar = () => dialogo.close();
  const dialogo = el('dialog', { class: 'voucher', 'aria-label': `Reserva de ${hospedagem.Nome}`, onclose: () => dialogo.remove() },
    el('header', { class: 'voucher__topo' },
      el('div', { class: 'voucher__titulo' },
        el('p', { class: 'kicker' }, hospedagem.Nome),
        hospedagem['Confirmação'] ? el('p', { class: 'legenda' }, `Confirmação ${formatoConfirmacao(hospedagem['Confirmação'])}`) : null),
      fora,
      el('button', { class: 'pill pill--azul', type: 'button', onclick: fechar }, 'Fechar')),
    el('div', { class: 'voucher__corpo' }, estado, paginas));
  document.body.append(dialogo);
  dialogo.showModal();
  (async () => {
    try {
      const bytes = await obterVoucher(hospedagem.Voucher);
      fora.hidden = false;
      fora.addEventListener('click', () => abrirFora(bytes, `Reserva ${hospedagem.Nome}.pdf`));
      await desenhar(bytes, paginas);
      estado.remove();
    } catch (err) {
      if (err instanceof CodigoInvalido) { dialogo.close(); aoCodigoInvalido(); return; }
      estado.replaceChildren(navigator.onLine === false
        ? 'Sem conexão, e esta reserva ainda não foi guardada neste aparelho. Abra com sinal uma vez, ou use "Guardar neste aparelho" em Hospedagens.'
        : 'Não foi possível abrir a reserva. Tente de novo em instantes.');
      estado.classList.add('status-pendente');
    }
  })();
}

// Baixa de uma vez os vouchers que ainda não estão no aparelho, para a viagem sem sinal.
export function guardarVouchers(hoteis, aoCodigoInvalido) {
  const ids = hoteis.filter((h) => h.Voucher).map((h) => h.Voucher);
  const texto = el('span', { class: 'legenda', role: 'status' });
  const botao = el('button', { class: 'pill', type: 'button', onclick: async () => {
    botao.disabled = true;
    try {
      const guardados = await vouchersGuardados();
      let feitos = guardados.filter((i) => ids.includes(i)).length;
      for (const id of ids.filter((i) => !guardados.includes(i))) {
        texto.textContent = `Guardando ${feitos + 1} de ${ids.length}…`;
        await obterVoucher(id);
        feitos++;
      }
      mostrar(feitos);
    } catch (err) {
      if (err instanceof CodigoInvalido) { aoCodigoInvalido(); return; }
      texto.textContent = 'Não foi possível guardar agora. Verifique a conexão e tente de novo.';
      botao.disabled = false;
    }
  } }, 'Guardar neste aparelho');
  const mostrar = (n) => {
    const todos = n === ids.length;
    botao.hidden = todos;
    botao.disabled = false;
    texto.textContent = todos ? `${ids.length} reservas guardadas neste aparelho: abrem sem sinal.` : `${n} de ${ids.length} reservas guardadas neste aparelho.`;
  };
  vouchersGuardados().then((g) => mostrar(g.filter((i) => ids.includes(i)).length));
  return el('div', { class: 'guardar-vouchers' }, texto, botao);
}
