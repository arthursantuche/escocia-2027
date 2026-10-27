// Gráficos Chart.js com as cores dos tokens (lidas do CSS, nunca fixas aqui).
const token = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
const reduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pendentes = [];

function base() {
  const Chart = window.Chart;
  Chart.defaults.font.family = token('--font-sf-pro-text');
  Chart.defaults.font.size = 12;
  Chart.defaults.color = token('--color-slate');
  Chart.defaults.borderColor = token('--color-hairline-silver');
  return Chart;
}

const real = new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' });

// O gráfico só é criado quando o card aparece na tela, para a animação de entrada ser vista.
function quandoVisivel(canvas, criarGrafico) {
  const criar = () => { window.Chart.getChart(canvas)?.destroy(); criarGrafico(); };
  if (reduzido() || !('IntersectionObserver' in window)) { criar(); return; }
  const obs = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) { obs.disconnect(); criar(); }
  }, { threshold: 0.3 });
  obs.observe(canvas);
  pendentes.push(obs);
}

export function graficoOrcamento(canvas, linhas) {
  quandoVisivel(canvas, () => {
    const Chart = base();
    const serie = (campo) => linhas.map((l) => Number(l[campo]) || 0);
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: linhas.map((l) => l.Categoria),
        datasets: [
          { label: 'Previsto', data: serie('Previsto (R$)'), backgroundColor: token('--color-steel') },
          { label: 'Reservado/pago', data: serie('Reservado/Pago (R$)'), backgroundColor: token('--color-ink') },
          { label: 'Real', data: serie('Real (R$)'), backgroundColor: token('--color-apple-blue') },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        animation: reduzido() ? false : { duration: 900, easing: 'easeOutQuart' },
        borderRadius: 4,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${real.format(c.raw)}` } } },
        scales: { x: { ticks: { callback: (v) => real.format(v), maxRotation: 0, maxTicksLimit: 4 }, grid: { display: false } }, y: { grid: { display: false } } },
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
        datasets: [{ label: 'Noites', data: Object.values(noites), backgroundColor: token('--color-ink') }],
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
        datasets: [{ label: 'Gasto do dia', data: dias.map((d) => porDia[d]), backgroundColor: token('--color-apple-blue') }],
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
