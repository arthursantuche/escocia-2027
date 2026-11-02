// Service worker: guarda os arquivos do portal para abrir sem sinal.
// Os dados da planilha ficam no localStorage e os vouchers no IndexedDB (assets/js/dados.js),
// nunca aqui. As fotos dos hotéis (Booking) ficam num cache próprio, depois de vistas.
// Ao mudar qualquer arquivo listado, suba a VERSAO para os aparelhos baixarem de novo.
const VERSAO = 'escocia2027-2.0-rev10';
const FOTOS_HOTEIS = 'escocia2027-fotos-hoteis';
const ARQUIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'data/amostra.json',
  'assets/css/tokens.css', 'assets/css/base.css', 'assets/css/componentes.css', 'assets/css/navegacao.css', 'assets/css/paginas.css', 'assets/css/movimento.css',
  'assets/js/app.js', 'assets/js/carrossel.js', 'assets/js/config.js', 'assets/js/dados.js', 'assets/js/graficos.js', 'assets/js/movimento.js', 'assets/js/util.js', 'assets/js/views.js', 'assets/js/voucher.js', 'assets/js/galeria.js', 'assets/js/registrar.js',
  'assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/chart.umd.min.js', 'assets/vendor/pdfjs/pdf.min.mjs', 'assets/vendor/pdfjs/pdf.worker.min.mjs',
  'assets/img/bandeira.svg', 'assets/img/bandeira-16.png', 'assets/img/bandeira-32.png', 'assets/img/bandeira-48.png',
  'assets/img/bandeira-180.png', 'assets/img/bandeira-192.png', 'assets/img/bandeira-512.png',
  'assets/img/cidades/creditos.json',
  // Fotos em 800 e 1600 px (as de 2400 px entram no cache quando são vistas).
  ...['edimburgo', 'st-andrews', 'glasgow', 'glencoe', 'fort-william', 'isle-of-skye', 'inverness']
    .flatMap((n) => [800, 1600].map((w) => `assets/img/cidades/${n}-${w}.webp`)),
];

// cache: 'reload' ignora o cache HTTP: módulos de versões diferentes, misturados, quebram o site.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO && k !== FOTOS_HOTEIS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Arquivos do próprio site: cache primeiro, atualizando em segundo plano.
// Chamadas à API (outro domínio, POST) passam direto.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method === 'GET' && url.hostname === 'cf.bstatic.com') {
    e.respondWith(caches.open(FOTOS_HOTEIS).then(async (cache) => {
      const salvo = await cache.match(req);
      if (salvo) return salvo;
      const r = await fetch(req);
      if (r.ok || r.type === 'opaque') cache.put(req, r.clone());
      return r;
    }));
    return;
  }
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSAO).then(async (cache) => {
    const salvo = await cache.match(req, { ignoreSearch: true });
    const rede = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => salvo);
    return salvo || rede;
  }));
});
