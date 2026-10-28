// Gráficos Chart.js com as cores dos tokens (lidas do CSS, nunca fixas aqui).
const token = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
const reduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pendentes = [];
// Gráficos desenhados, para refazê-los com as cores novas quando o tema do sistema muda.
const desenhados = new Map();

function base() {
  const Chart = window.Chart;
  Chart.defaults.font.family = token('--font-sf-pro-text');
  Chart.defaults.font.size = 12;
  Chart.defaults.color = token('--cor-texto-2');
  Chart.defaults.borderColor = token('--cor-divisoria');
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: token('--cor-texto'), titleColor: token('--cor-fundo'), bodyColor: token('--cor-fundo'),
    cornerRadius: 10, padding: 10, displayColors: false,
  });
  return Chart;
}

const real = new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' });

// O gráfico só é criado quando o card aparece na tela, para a animação de entrada ser vista.
function quandoVisivel(canvas, criarGrafico) {
  const criar = () => { window.Chart.getChart(canvas)?.destroy(); criarGrafico(); desenhados.set(canvas, criarGrafico); };
  if (reduzido() || !('IntersectionObserver' in window)) { criar(); return; }
  const obs = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) { obs.disconnect(); criar(); }
  }, { threshold: 0.3 });
  obs.observe(canvas);
  pendentes.push(obs);
}

// Por categoria: barra do previsto e, ao lado, pago + a pagar empilhados.
// Recebe linhas de valoresOrcamento() (util.js).
export function graficoOrcamento(canvas, linhas) {
  quandoVisivel(canvas, () => {
    const Chart = base();
    const serie = (campo) => linhas.map((l) => l[campo] || 0);
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: linhas.map((l) => l.categoria),
        datasets: [
          { label: 'Previsto', data: serie('previsto'), backgroundColor: token('--cor-grafico-previsto'), stack: 'previsto' },
          { label: 'Pago', data: serie('pago'), backgroundColor: token('--cor-texto'), stack: 'realizado' },
          { label: 'A pagar', data: serie('aPagar'), backgroundColor: token('--cor-alerta'), stack: 'realizado' },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        layout: { padding: { right: 16 } },
        animation: reduzido() ? false : { duration: 900, easing: 'easeOutQuart' },
        borderRadius: 4,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${real.format(c.raw)}` } } },
        scales: {
          x: { stacked: true, ticks: { callback: (v) => real.format(v), maxRotation: 0, maxTicksLimit: 4 }, grid: { display: false } },
          y: { stacked: true, grid: { display: false } },
        },
      },
    });
  });
}

// Preços das hospedagens. Com 2 ou mais consultas de um hotel, linha no tempo por hotel;
// antes disso, barras com o último preço de cada opção. series: [{ rotulo, pontos: [{ data, valor }] }].
export function graficoPrecos(canvas, series) {
  quandoVisivel(canvas, () => {
    const Chart = base();
    const historico = series.filter((s) => s.pontos.length > 1);
    const cores = ['--cor-texto', '--cor-link', '--cor-alerta', '--cor-grafico-previsto'].map(token);
    const eixoValor = { ticks: { callback: (v) => real.format(v), maxTicksLimit: 4 }, grid: { display: false } };
    if (historico.length) {
      const datas = [...new Set(historico.flatMap((s) => s.pontos.map((p) => p.data)))].sort();
      new Chart(canvas, {
        type: 'line',
        data: {
          labels: datas.map((d) => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(2, 4)),
          datasets: historico.map((s, i) => ({
            label: s.rotulo, spanGaps: true, tension: 0.25, pointRadius: 3,
            borderColor: cores[i % cores.length], backgroundColor: cores[i % cores.length],
            data: datas.map((d) => s.pontos.find((p) => p.data === d)?.valor ?? null),
          })),
        },
        options: {
          maintainAspectRatio: false,
          animation: reduzido() ? false : { duration: 900, easing: 'easeOutQuart' },
          plugins: { legend: { display: historico.length > 1, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${real.format(c.raw)}` } } },
          scales: { y: eixoValor, x: { grid: { display: false } } },
        },
      });
      return;
    }
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.map((s) => [s.cidade, s.nome, s.periodo].filter(Boolean)),
        datasets: [{ label: 'Último preço', data: series.map((s) => s.pontos[s.pontos.length - 1].valor), backgroundColor: token('--cor-texto') }],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        layout: { padding: { right: 16 } },
        animation: reduzido() ? false : { duration: 900, easing: 'easeOutQuart' },
        borderRadius: 4,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => real.format(c.raw) } } },
        scales: { x: eixoValor, y: { grid: { display: false } } },
      },
    });
  });
}

export function graficoNoites(canvas, noites) {
  quandoVisivel(canvas, () => {
    const Chart = base();
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(noites),
        datasets: [{ label: 'Noites', data: Object.values(noites), backgroundColor: token('--cor-texto') }],
      },
      options: {
        maintainAspectRatio: false,
        animation: reduzido() ? false : { duration: 900, easing: 'easeOutQuart' },
        borderRadius: 4,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { stepSize: 1 }, grid: { display: false } }, x: { grid: { display: false } } },
      },
    });
  });
}

export function graficoGastoDiario(canvas, porDia) {
  quandoVisivel(canvas, () => {
    const Chart = base();
    const dias = Object.keys(porDia).sort();
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dias.map((d) => d.slice(8, 10) + '/' + d.slice(5, 7)),
        datasets: [{ label: 'Gasto do dia', data: dias.map((d) => porDia[d]), backgroundColor: token('--cor-link') }],
      },
      options: {
        maintainAspectRatio: false,
        animation: reduzido() ? false : { duration: 900, easing: 'easeOutQuart' },
        borderRadius: 4,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => real.format(c.raw) } } },
        scales: { y: { ticks: { callback: (v) => real.format(v), maxTicksLimit: 4 }, grid: { display: false } }, x: { grid: { display: false } } },
      },
    });
  });
}

// Tema claro/escuro mudou: refaz, sem animação, os gráficos que ainda estão na página.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  desenhados.forEach((criarGrafico, canvas) => {
    if (!canvas.isConnected) { desenhados.delete(canvas); return; }
    window.Chart.getChart(canvas)?.destroy();
    criarGrafico();
    window.Chart.getChart(canvas)?.update('none');
  });
});
