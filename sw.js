// Service worker: guarda os arquivos do portal para abrir sem sinal.
// Os dados da planilha ficam no localStorage (assets/js/dados.js), não aqui.
// Ao mudar qualquer arquivo listado, suba a VERSAO para os aparelhos baixarem de novo.
const VERSAO = 'escocia2027-v4';
const ARQUIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'data/amostra.json',
  'assets/css/tokens.css', 'assets/css/base.css', 'assets/css/componentes.css', 'assets/css/paginas.css', 'assets/css/movimento.css',
  'assets/js/app.js', 'assets/js/carrossel.js', 'assets/js/config.js', 'assets/js/dados.js', 'assets/js/graficos.js', 'assets/js/movimento.js', 'assets/js/util.js', 'assets/js/views.js',
  'assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/chart.umd.min.js',
  'assets/img/icone-180.png', 'assets/img/icone-192.png', 'assets/img/icone-512.png',
  'assets/img/cidades/creditos.json',
  // Fotos em 800 e 1600 px (as de 2400 px entram no cache quando são vistas).
  ...['edimburgo', 'st-andrews', 'glasgow', 'glencoe', 'fort-william', 'isle-of-skye', 'inverness', 'abertura']
    .flatMap((n) => [800, 1600].map((w) => `assets/img/cidades/${n}-${w}.webp`)),
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Arquivos do próprio site: cache primeiro, atualizando em segundo plano.
// Chamadas à API (outro domínio, POST) passam direto.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSAO).then(async (cache) => {
    const salvo = await cache.match(req, { ignoreSearch: true });
    const rede = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => salvo);
    return salvo || rede;
  }));
});
