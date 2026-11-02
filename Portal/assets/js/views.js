// Páginas além do painel: Cidade, Programação, Hospedagens, Orçamento, Checklist e Viagem (Registrar fica em registrar.js).
// Cada função recebe o contexto { abas, v (Viagem), salvar } e devolve um elemento.
import { el, pessoasDa as PESSOAS, formatoConfirmacao, brl, brl2, gbp, dataCurta, dataLonga, diaSemana, data, diasAte, slug, hojeISO, valorBRL, foto, creditoFoto, valoresOrcamento, totaisOrcamento, luzDaParada, textoLuz } from './util.js';
import { graficoOrcamento, graficoGastoDiario } from './graficos.js';
import { pessoa } from './dados.js';
import { abrirVoucher, guardarVouchers } from './voucher.js';
import { galeria, lerFotos } from './galeria.js';
import { atracoesDoSite, restaurantes as listaRestaurantes, itemRestaurante, atracaoVisivel, detalhesRegistro } from './registrar.js';

const STATUS = {
  Hospedagens: ['pesquisando', 'reservado', 'pago', 'descartado'],
  Transportes: ['pesquisando', 'reservado', 'pago'],
  Atracoes: ['a decidir', 'planejado', 'reservado', 'pago', 'visitado', 'descartado'],
};
const maps = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

export function cabecalho(kicker, titulo, texto) {
  return el('header', { class: 'pagina__cabecalho' },
    el('p', { class: 'kicker' }, kicker),
    el('h1', { class: 'titulo', 'data-revelar': true }, titulo),
    texto && el('p', { class: 'copy introducao' }, texto));
}

function seletorStatus(ctx, aba, linha) {
  return el('span', { class: 'seletor seletor--compacto' }, el('select', {
    class: 'campo', 'aria-label': 'Status de ' + (linha.Nome || linha.Trecho || linha.ID),
    onchange: (e) => ctx.salvar({ acao: 'atualizar', aba, id: linha.ID, dados: { Status: e.target.value } }, 'Status atualizado.'),
  }, STATUS[aba].map((op) => el('option', { value: op, selected: op === linha.Status }, op))));
}

function lista(itens, vazio) {
  return itens.length ? el('ul', { class: 'lista' }, itens) : el('p', { class: 'legenda' }, vazio);
}

// ---------------------------------------------------------------- Cidade

export function paginaCidade(ctx, nome) {
  const { abas } = ctx;
  const cidade = abas.Cidades.find((c) => slug(c.Cidade) === nome);
  if (!cidade) return el('p', { class: 'secao' }, 'Cidade não encontrada.');
  const c = cidade.Cidade;
  const visitas = abas.Roteiro.filter((r) => r['Cidade visitada'] === c);
  const hosp = abas.Hospedagens.filter((h) => h.Cidade === c && h.Status !== 'descartado');
  const atr = abas.Atracoes.filter((a) => a.Cidade === c && atracaoVisivel(a)).sort((a, b) => String(a['Dia sugerido']).localeCompare(String(b['Dia sugerido'])));
  const notas = abas.Notas.filter((n) => n['Cidade/Tópico'] === c);
  const restaurantes = listaRestaurantes(abas).filter((r) => r.Cidade === c);
  const credito = ctx.creditos[slug(c)];
  const posicao = abas.Cidades.indexOf(cidade);
  const anterior = abas.Cidades[posicao - 1];
  const ultima = posicao === abas.Cidades.length - 1;
  const proxima = ultima ? abas.Cidades[0] : abas.Cidades[posicao + 1];

  // Atrações agrupadas pelo dia sugerido; as sem dia vão para o fim.
  const porDia = {};
  atr.forEach((a) => { const d = a['Dia sugerido'] ? String(a['Dia sugerido']).slice(0, 10) : ''; (porDia[d] ||= []).push(a); });
  const dias = Object.keys(porDia).sort((a, b) => (a || '9').localeCompare(b || '9'));
  const atracao = (a) => el('li', { class: 'atracao', 'data-subir': true },
    el('div', {},
      el('p', { class: 'atracao__nome' }, a.Nome),
      el('p', { class: 'legenda' }, [a['Horário'], Number(a['Preço (£)']) ? gbp.format(a['Preço (£)']) : 'grátis', a['Reserva necessária'] === 'Sim' ? '⚠️ reservar' : null].filter(Boolean).join(' · ')),
      a['Observações'] && el('p', { class: 'legenda' }, a['Observações']),
      detalhesRegistro(a, 'atracao'),
      el('p', { class: 'registro__links' },
        a['Endereço'] ? null : el('a', { href: a['Link Maps'] || maps(a.Nome + ' ' + c), target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps'),
        el('a', { href: `#registrar/atracao/${encodeURIComponent(a.ID)}` }, 'Editar'))),
    seletorStatus(ctx, 'Atracoes', a));

  return el('div', {},
    el('section', { class: 'secao cidade-hero' },
      el('div', { class: 'conteudo' },
        el('a', { class: 'voltar', href: '#programacao' }, '← Programação'),
        cabecalho(visitas.map((r) => dataCurta.format(data(r.Data))).join(' e '), c + '.', cidade.Resumo),
        el('figure', { class: 'foto', 'data-paralaxe': true },
          el('div', { class: 'foto__moldura' },
            el('img', { ...foto(slug(c), '(min-width: 1020px) 980px, calc(100vw - 40px)', cidade.Imagem), alt: `Paisagem de ${c}`, onerror: (e) => e.target.closest('figure').remove() })),
          credito && el('figcaption', { class: 'legenda' }, creditoFoto(credito))))),
    el('section', { class: 'secao secao--mist' },
      el('div', { class: 'conteudo grade-2 grade-2--par' },
        el('article', { class: 'card card--auto', 'data-subir': true }, el('h2', { class: 'kicker' }, 'Dicas'), el('p', { class: 'copy' }, cidade.Dicas)),
        el('article', { class: 'card card--auto', 'data-subir': true }, el('h2', { class: 'kicker' }, 'Clima e luz'), el('p', { class: 'copy' }, cidade['Clima/luz'])),
        el('article', { class: 'card card--auto', 'data-subir': true }, el('h2', { class: 'kicker' }, 'Logística'),
          lista(visitas.map((r) => el('li', {},
            el('p', {}, `${dataLonga.format(data(r.Data))} · ${r.Deslocamento}${r.Tempo ? ' · ' + r.Tempo : ''}${r['Distância'] ? ' · ' + r['Distância'] : ''}`),
            el('p', { class: 'legenda' }, `Dorme em ${r['Dormida em']}. ${r['Observações'] || ''}`),
            textoLuz(luzDaParada(r, abas.Cidades)) && el('p', { class: 'legenda' }, textoLuz(luzDaParada(r, abas.Cidades))),
            r['Link Maps'] && el('a', { href: r['Link Maps'], target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps'))), '')),
        el('article', { class: 'card card--auto', 'data-subir': true }, el('h2', { class: 'kicker' }, 'Hospedagem'),
          lista(hosp.map((h) => itemHospedagem(ctx, h)),
          `Sem hospedagem: visita no dia, dormindo em ${visitas[0] ? visitas[0]['Dormida em'] : 'outra cidade'}.`)))),
    el('section', { class: 'secao' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo', 'data-revelar': true }, 'Atrações.'),
        atr.length ? el('div', { class: 'atracoes' }, dias.map((d) => el('section', { class: 'dia' },
          el('h3', { class: 'dia__titulo' }, d ? diaSemana(d) : 'Sem dia definido'),
          el('ul', { class: 'lista' }, porDia[d].map(atracao))))) : el('p', { class: 'vazio' }, 'Nenhuma atração cadastrada.'),
        el('p', { class: 'legenda' }, `Horários e preços verificados em ${dataLonga.format(data(ctx.v.data_verificacao))}; confirmar perto da viagem.`))),
    el('section', { class: 'secao secao--continua' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo', 'data-revelar': true }, 'Restaurantes.'),
        restaurantes.length
          ? el('ul', { class: 'lista' }, restaurantes.map(itemRestaurante))
          : el('p', { class: 'vazio' }, 'Nenhum restaurante salvo nesta cidade.'),
        el('div', { class: 'registrar__acoes espaco-topo' },
          el('a', { class: 'pill', href: `#registrar/restaurante/em-${slug(c)}` }, 'Novo restaurante'),
          el('a', { class: 'pill', href: `#registrar/atracao/em-${slug(c)}` }, 'Nova atração')))),
    el('section', { class: 'secao secao--mist' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo', 'data-revelar': true }, 'Notas.'),
        lista(notas.map((n) => el('li', {}, el('p', {}, n['Texto livre']),
          el('p', { class: 'legenda' }, `${n.Autor || ''} · ${n.Data ? dataLonga.format(data(n.Data)) : ''}`),
          el('p', { class: 'registro__links' }, el('a', { href: `#registrar/nota/${encodeURIComponent(n.ID)}` }, 'Editar')))), 'Nenhuma nota ainda.'),
        formNota(ctx, c))),
    el('nav', { class: 'secao vizinhas', 'aria-label': 'Outras paradas' },
      el('div', { class: 'conteudo vizinhas__grade' },
        anterior && vizinha(anterior, 'Parada anterior', 'anterior'),
        proxima && proxima !== cidade && vizinha(proxima, ultima ? 'Volta para' : 'Próxima parada', 'proxima'))));
}

// Reservado: aqui basta o resumo; a reserva completa fica em Hospedagens.
function itemHospedagem(ctx, h) {
  const periodo = `${dataCurta.format(data(h.Entrada))} a ${dataCurta.format(data(h['Saída']))} · ${h.Noites} ${Number(h.Noites) === 1 ? 'noite' : 'noites'}`;
  const reservado = h.Status === 'reservado' || h.Status === 'pago';
  return el('li', {},
    el('p', { class: 'atracao__nome' }, h.Nome),
    el('p', { class: 'legenda' }, periodo + (h.Quarto ? ` · ${h.Quarto}` : '')),
    reservado ? null : el('p', { class: 'legenda' }, `${brl.format(h['Valor (R$)'] || 0)}. ${h.Tarifa || ''}`.trim()),
    el('a', { href: '#hospedagens' }, 'Ver reserva e como chegar'),
    reservado ? null : seletorStatus(ctx, 'Hospedagens', h));
}

function vizinha(cidade, rotulo, lado) {
  return el('a', { class: `vizinha vizinha--${lado}`, href: '#cidade/' + slug(cidade.Cidade) },
    el('span', { class: 'vizinha__foto' }, el('img', { ...foto(slug(cidade.Cidade), '(min-width: 834px) 480px, 45vw', cidade.Imagem), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() })),
    el('span', { class: 'vizinha__texto' },
      el('span', { class: 'legenda' }, (lado === 'anterior' ? '← ' : '') + rotulo + (lado === 'proxima' ? ' →' : '')),
      el('span', { class: 'kicker' }, cidade.Cidade)));
}

// ---------------------------------------------------------------- Programação

const fmtDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: 'UTC' });
const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const limpaAbrev = (t) => t.replace('.', '');

// Separa o que é pendência (⚠️) do restante, para só a pendência ganhar a cor de alerta.
function comAlerta(texto) {
  const [antes, ...resto] = String(texto).split('⚠️');
  return [
    antes.trim() ? el('p', { class: 'legenda' }, antes.trim()) : null,
    ...resto.flatMap((t) => {
      // Só a primeira frase é a pendência; o restante é contexto.
      const [frase, ...mais] = t.trim().split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/);
      return [el('p', { class: 'status-pendente' }, '⚠️ ' + frase), mais.length ? el('p', { class: 'legenda' }, mais.join(' ')) : null];
    }),
  ];
}

function diaProgramacao(d, hoje, lugares) {
  const quando = data(d.Data);
  const doDia = lugares.filter((l) => String(l.Dia || l['Dia sugerido']).slice(0, 10) === String(d.Data).slice(0, 10));
  return el('li', { class: 'dia', 'aria-current': String(d.Data).slice(0, 10) === hoje ? 'date' : null },
    el('p', { class: 'dia__data' },
      el('span', { class: 'dia__numero' }, fmtDia.format(quando)),
      el('span', { class: 'legenda' }, `${limpaAbrev(fmtSemana.format(quando))} · ${limpaAbrev(fmtMes.format(quando))}`)),
    el('div', { class: 'dia__texto' },
      d.Deslocamento ? el('p', { class: 'dia__deslocamento' }, d.Deslocamento) : null,
      el('p', {}, d['Programação']),
      d['Atenção'] ? comAlerta(d['Atenção']) : null,
      doDia.length ? el('p', { class: 'legenda' }, 'Também salvo para este dia: ', doDia.flatMap((l, i) => [i ? ', ' : '', el('a', { href: `#cidade/${slug(l.Cidade || d.Base)}` }, l.Nome)])) : null));
}

export function paginaProgramacao(ctx) {
  const dias = [...(ctx.abas.Programacao || [])].sort((a, b) => String(a.Data).localeCompare(String(b.Data)));
  const cidades = Object.fromEntries(ctx.abas.Cidades.map((c) => [c.Cidade, c]));
  const hoje = hojeISO();
  // Dias seguidos na mesma base formam um trecho.
  const trechos = [];
  dias.forEach((d) => {
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && ultimo.base === d.Base) ultimo.dias.push(d);
    else trechos.push({ base: d.Base, dias: [d] });
  });
  const lugares = [...atracoesDoSite(ctx.abas), ...listaRestaurantes(ctx.abas)];
  // Fotos do trecho: as cidades visitadas nesses dias (duas em 02/03 e 07/03). O último dia é
  // o voo de volta, que sai de Edimburgo. As fotos são 3:2, como a moldura: nada é cortado.
  const fotosDo = (t) => {
    const datas = new Set(t.dias.map((d) => String(d.Data).slice(0, 10)));
    const visitadas = (ctx.abas.Roteiro || []).filter((r) => datas.has(String(r.Data).slice(0, 10))).map((r) => r['Cidade visitada']);
    const lista = visitadas.length ? [...new Set(visitadas)] : [t.base === 'Voo de volta' ? 'Edimburgo' : t.base];
    return lista.filter((n) => cidades[n]);
  };
  const hotelDo = (t) => ctx.abas.Hospedagens.find((h) => h.Status !== 'descartado' && h.Cidade === t.base
    && String(h.Entrada).slice(0, 10) === String(t.dias[0].Data).slice(0, 10));
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
    cabecalho('Programação', 'Dia a dia.', `${dias.length} dias, de ${dias[0] ? dataCurta.format(data(dias[0].Data)) : ''} a ${dias.length ? dataCurta.format(data(dias[dias.length - 1].Data)) : ''}. O clima pode pedir trocas, sobretudo em Skye.`),
    el('nav', { class: 'atalhos', 'aria-label': 'Ver também' },
      el('a', { class: 'pill', href: '#roteiro' }, 'Roteiro completo'),
      el('a', { class: 'pill', href: '#cidades' }, 'Todas as cidades')),
    dias.length ? el('div', { class: 'trechos' }, trechos.map((t) => {
      const cidade = cidades[t.base];
      const hotel = hotelDo(t);
      const fotos = fotosDo(t);
      const duas = fotos.length > 1;
      return el('section', { class: `trecho${duas ? ' trecho--duas' : ''}`, 'data-subir': true },
        el('header', { class: 'trecho__lado' },
          fotos.length ? el('div', { class: `trecho__fotos${duas ? ' trecho__fotos--duas' : ''}` }, fotos.map((n) => el('figure', { class: 'trecho__figura' },
            el('a', { class: 'trecho__foto', href: '#cidade/' + slug(n), 'aria-label': `Abrir ${n}`, 'data-rolagem': true }, el('img', { ...foto(slug(n), duas ? '(min-width: 834px) 280px, 50vw' : '(min-width: 834px) 280px, 100vw', cidades[n].Imagem), alt: `Paisagem de ${n}`, loading: 'lazy', onerror: (e) => e.target.remove() })),
            duas ? el('figcaption', { class: 'legenda' }, n) : null))) : null,
          el('h2', { class: 'kicker' }, cidade ? el('a', { class: 'trecho__link', href: '#cidade/' + slug(t.base) }, t.base) : t.base),
          hotel ? el('p', { class: 'legenda' }, el('a', { href: '#hospedagens' }, hotel.Nome)) : null),
        el('ol', { class: 'trecho__dias' }, t.dias.map((d) => diaProgramacao(d, hoje, lugares))));
    })) : el('p', { class: 'vazio' }, 'Programação ainda não cadastrada.')));
}

// ---------------------------------------------------------------- Hospedagens

const mapaBusca = (h) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${h.Nome}, ${h['Endereço'] || h.Cidade}`);
const mapaRota = (h) => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(`${h.Nome}, ${h['Endereço'] || h.Cidade}`);

function fato(rotulo, texto) {
  return texto ? el('div', {}, el('dt', { class: 'legenda' }, rotulo), el('dd', {}, texto)) : null;
}

function estadia(ctx, h) {
  const noites = `${h.Noites} ${Number(h.Noites) === 1 ? 'noite' : 'noites'}`;
  const cidade = ctx.abas.Cidades.find((c) => c.Cidade === h.Cidade);
  const fotos = lerFotos(h.Fotos);
  const libra = Number(h['Valor (£)']);
  const pratico = [fato('Onde fica', h['Localização'] || null), fato('Estacionamento', h.Estacionamento || null)].filter(Boolean);
  return el('article', { class: 'estadia', 'data-subir': true },
    fotos.length ? galeria(fotos, h.Nome) : el('div', { class: 'galeria' }, el('div', { class: 'galeria__capa' }, el('img', { ...foto(slug(h.Cidade), '(min-width: 834px) 340px, 100vw', cidade && cidade.Imagem), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }))),
    el('div', { class: 'estadia__corpo' },
      el('header', { class: 'estadia__topo' },
        el('div', {},
          el('p', { class: 'legenda' }, `${h.Cidade} · ${noites}`),
          el('h3', { class: 'estadia__nome' }, h.Nome),
          h['Endereço'] ? el('a', { class: 'estadia__endereco', href: mapaBusca(h), target: '_blank', rel: 'noopener' }, h['Endereço']) : null),
        el('div', { class: 'estadia__valor' },
          el('p', { class: 'card__numero estadia__preco' }, libra ? gbp.format(libra) : brl.format(h['Valor (R$)'] || 0)),
          libra ? el('p', { class: 'legenda' }, `~${brl.format(h['Valor (R$)'] || 0)}`) : null)),
      el('dl', { class: 'estadia__datas' },
        el('div', {}, el('dt', { class: 'legenda' }, 'Entrada'), el('dd', {}, dataLonga.format(data(h.Entrada))), h['Entrada (hora)'] ? el('dd', { class: 'legenda' }, h['Entrada (hora)']) : null),
        el('div', {}, el('dt', { class: 'legenda' }, 'Saída'), el('dd', {}, dataLonga.format(data(h['Saída']))), h['Saída (hora)'] ? el('dd', { class: 'legenda' }, h['Saída (hora)']) : null)),
      el('div', { class: 'estadia__acoes' },
        h.Voucher ? el('button', { class: 'pill pill--azul', type: 'button', onclick: () => abrirVoucher(h, ctx.pedirCodigo) }, 'Ver reserva') : null,
        el('a', { class: 'pill', href: mapaRota(h), target: '_blank', rel: 'noopener' }, 'Como chegar'),
        h.Telefone ? el('a', { class: 'pill', href: 'tel:' + String(h.Telefone).replace(/[^+\d]/g, '') }, 'Ligar') : null),
      el('dl', { class: 'estadia__fatos' },
        fato('Confirmação', formatoConfirmacao(h['Confirmação']) || null),
        fato('Quarto', h.Quarto || null),
        fato('Camas', h.Camas || null),
        fato('Café da manhã', h['Café da manhã'] || null),
        fato('Na chegada', h.Chegada || null))),
    pratico.length ? el('dl', { class: 'estadia__pratico' }, pratico) : null,
    el('details', { class: 'estadia__mais' },
      el('summary', {}, 'Pagamento, cancelamento e contato'),
      el('dl', { class: 'estadia__fatos estadia__fatos--colunas' },
        fato('Pagamento', h.Pagamento || null),
        fato('Cancelamento', h.Cancelamento || null),
        fato('Telefone', h.Telefone || null),
        fato('Hóspedes', h['Hóspedes'] || null)),
      el('div', { class: 'estadia__rodape' },
        h.Link ? el('a', { href: h.Link, target: '_blank', rel: 'noopener' }, 'Página do hotel no Booking') : null,
        seletorStatus(ctx, 'Hospedagens', h))));
}

export function paginaHospedagens(ctx) {
  const { abas } = ctx;
  const hoteis = abas.Hospedagens.filter((h) => h.Status !== 'descartado').sort((a, b) => String(a.Entrada).localeCompare(String(b.Entrada)));
  const total = hoteis.reduce((s, h) => s + (Number(h['Valor (R$)']) || 0), 0);
  const totalLibras = hoteis.reduce((s, h) => s + (Number(h['Valor (£)']) || 0), 0);
  const noites = hoteis.reduce((s, h) => s + (Number(h.Noites) || 0), 0);
  const reservados = hoteis.filter((h) => h.Status === 'reservado' || h.Status === 'pago').length;
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
    cabecalho('Hospedagens', `${noites} noites.`, 'Reservas confirmadas. Na recepção, toque em "Ver reserva" para mostrar o voucher. Os valores em reais são estimativas: cada hotel cobra em libras, pelo câmbio do dia.'),
    el('dl', { class: 'resumo-estadias' },
      el('div', {}, el('dt', { class: 'legenda' }, 'Total'), el('dd', { class: 'card__numero' }, totalLibras ? gbp.format(totalLibras) : brl.format(total)), totalLibras ? el('dd', { class: 'legenda' }, `~${brl.format(total)}`) : null),
      el('div', {}, el('dt', { class: 'legenda' }, 'Hotéis'), el('dd', { class: 'card__numero' }, String(new Set(hoteis.map((h) => h.Nome)).size))),
      el('div', {}, el('dt', { class: 'legenda' }, 'Reservados'), el('dd', { class: 'card__numero' }, `${reservados} de ${hoteis.length}`))),
    hoteis.some((h) => h.Voucher) ? guardarVouchers(hoteis, ctx.pedirCodigo) : null,
    hoteis.length ? el('div', { class: 'estadias' }, hoteis.map((h) => estadia(ctx, h))) : el('p', { class: 'vazio' }, 'Nenhuma hospedagem cadastrada.')));
}

// ---------------------------------------------------------------- Orçamento

export function paginaOrcamento(ctx) {
  const { abas, v } = ctx;
  const cot = Number(v.cotacao_gbp_brl) || 0;
  const orc = abas.Orcamento.map(valoresOrcamento);
  const total = totaisOrcamento(orc);
  const gastos = [...abas.Gastos].sort((a, b) => String(b.Data).localeCompare(String(a.Data)));
  const canvas = el('canvas', { role: 'img', 'aria-label': 'Orçamento por categoria: previsto, pago e a pagar' });
  const diario = el('canvas', { role: 'img', 'aria-label': 'Gasto diário em reais' });
  graficoOrcamento(canvas, orc.filter((o) => o.previsto || o.pago || o.aPagar));
  const porDia = {};
  gastos.forEach((g) => { if (g.Data) porDia[g.Data.slice(0, 10)] = (porDia[g.Data.slice(0, 10)] || 0) + valorBRL(g, cot); });
  if (Object.keys(porDia).length) graficoGastoDiario(diario, porDia);
  const valor = (n) => (n == null ? '–' : brl.format(n));
  const REFERENCIA_CUSTOS = Number(v.referencia_custos) || 0;
  const custoPrincipal = orc.filter((o) => /^(Hospedagem|Transporte)/.test(o.categoria)).reduce((soma, o) => soma + (o.verificado || 0), 0);
  // Categorias ainda sem nenhum valor saem da tabela e são citadas numa linha abaixo dela.
  const temValor = (o) => o.previsto || o.aPagar || o.pago;
  const semValor = orc.filter((o) => !temValor(o)).map((o) => o.categoria);
  const detalhePago = (o) => [o.antes && `${brl.format(o.antes)} antes`, o.viagem && `${brl.format(o.viagem)} na viagem`].filter(Boolean).join(' · ');

  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      el('a', { class: 'voltar', href: '#painel' }, '← Painel'),
      cabecalho('Orçamento', brl.format(total.previsto) + ' planejados.',
        `Referência atual ${brl.format(total.atual)} · Pago ${brl.format(total.pago)} · A pagar ${brl.format(total.aPagar)} · Saldo sobre o planejado ${brl.format(total.saldo)} · Cotação ${brl2.format(cot)} por £1`),
      custoPrincipal && REFERENCIA_CUSTOS ? el('p', { class: 'copy introducao orcamento__referencia' }, `Hotéis, carro e trem: ${brl.format(custoPrincipal)}, para uma referência desejada de ${brl.format(REFERENCIA_CUSTOS)}.`) : null,
      el('div', { class: 'card__grafico card__grafico--alto' }, canvas),
      el('p', { class: 'legenda legenda-grafico' },
        el('span', { class: 'cor-previsto' }, 'Planejado'), el('span', { class: 'cor-pago' }, 'Pago'), el('span', { class: 'cor-apagar' }, 'A pagar')),
      el('div', { class: 'espaco-topo' }, el('table', { class: 'tabela tabela--empilha' },
        el('thead', {}, el('tr', {}, ['Categoria', 'Planejado', 'Verificado', 'A pagar', 'Pago', 'Saldo'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, orc.filter(temValor).map((o) => el('tr', {},
          el('th', { scope: 'row' }, o.categoria),
          el('td', { 'data-rotulo': 'Planejado' }, valor(o.previsto)),
          el('td', { 'data-rotulo': 'Verificado' }, valor(o.verificado)),
          el('td', { 'data-rotulo': 'A pagar' }, o.aPagar ? brl.format(o.aPagar) : '–'),
          el('td', { 'data-rotulo': 'Pago' }, o.pago ? brl.format(o.pago) : '–', o.pago ? el('span', { class: 'legenda bloco' }, detalhePago(o)) : null),
          el('td', { 'data-rotulo': 'Saldo', class: o.saldo < 0 ? 'negativo' : null }, valor(o.saldo))))),
        el('tfoot', {}, el('tr', {},
          el('th', { scope: 'row' }, 'Total'),
          el('td', { 'data-rotulo': 'Planejado' }, brl.format(total.previsto)), el('td', { 'data-rotulo': 'Referência atual' }, brl.format(total.atual)), el('td', { 'data-rotulo': 'A pagar' }, brl.format(total.aPagar)),
          el('td', { 'data-rotulo': 'Pago' }, brl.format(total.pago)),
          el('td', { 'data-rotulo': 'Saldo', class: total.saldo < 0 ? 'negativo' : null }, brl.format(total.saldo)))))),
      semValor.length ? el('p', { class: 'legenda espaco-topo' }, `Sem valores ainda: ${semValor.join(', ')}. Preencha a coluna Previsto (R$) da aba Orcamento, na planilha.`) : null,
      el('ul', { class: 'legenda glossario espaco-topo' },
        el('li', {}, el('strong', {}, 'Planejado: '), 'estimativa original de cada categoria, mantida para comparação.'),
        el('li', {}, el('strong', {}, 'Verificado: '), 'valor das reservas (hospedagens) ou preço consultado para o roteiro atual.'),
        el('li', {}, el('strong', {}, 'Referência atual: '), 'total do verificado; as categorias sem preço entram pelo planejado.'),
        el('li', {}, el('strong', {}, 'A pagar: '), 'reservas com status "reservado", ainda não pagas.'),
        el('li', {}, el('strong', {}, 'Pago: '), 'reservas com status "pago" (antes da viagem) mais os gastos registrados na viagem.'),
        el('li', {}, el('strong', {}, 'Saldo: '), 'planejado menos a pagar e pago. Negativo, em laranja, é estouro.')))),
    el('section', { class: 'secao secao--mist' }, el('div', { class: 'conteudo' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'Gastos.'),
      Object.keys(porDia).length ? el('div', { class: 'card__grafico' }, diario) : null,
      lista(gastos.slice(0, 30).map((g) => el('li', { class: 'registro' },
        el('div', { class: 'registro__texto' },
          el('p', {}, `${g.Descrição || g.Categoria} · ${brl2.format(valorBRL(g, cot))}`),
          el('p', { class: 'legenda' }, [g.Data && dataCurta.format(data(g.Data)), g.Cidade, g.Categoria, g.Moeda === '£' && gbp.format(g.Valor), g['Forma de pagamento'], g['Quem pagou']].filter(Boolean).join(' · ')),
          g['Observações'] ? el('p', { class: 'legenda' }, g['Observações']) : null),
        el('a', { class: 'pill', href: `#registrar/gasto/${encodeURIComponent(g.ID)}` }, 'Editar'))),
      'Nenhum gasto registrado. Use Registrar durante a viagem.'),
      el('a', { class: 'pill pill--azul espaco-topo', href: '#registrar/gasto' }, 'Registrar gasto'))));
}

// ---------------------------------------------------------------- Checklist

export function paginaChecklist(ctx) {
  const itens = [...ctx.abas.Checklist].sort((a, b) => String(a.Prazo).localeCompare(String(b.Prazo)));
  const feitos = itens.filter((c) => c.Status === 'feito').length;
  const item = (c) => {
    const feito = c.Status === 'feito';
    const d = c.Prazo ? diasAte(c.Prazo) : null;
    return el('li', { class: 'tarefa' + (feito ? ' tarefa--feita' : '') },
      el('input', {
        type: 'checkbox', id: 'chk-' + c.ID, checked: feito,
        onchange: (e) => ctx.salvar({ acao: 'atualizar', aba: 'Checklist', id: c.ID, dados: { Status: e.target.checked ? 'feito' : '⚠️ pendente' } }, e.target.checked ? 'Marcado como feito.' : 'Voltou a pendente.'),
      }),
      el('label', { for: 'chk-' + c.ID },
        el('span', {}, c.Item),
        // Pendente: só o prazo fica em laranja (como no painel); categoria e responsável, em cinza.
        !feito && c.Prazo && el('span', { class: 'status-pendente' }, `⚠️ Prazo ${dataLonga.format(data(c.Prazo))} · ${d >= 0 ? `faltam ${d} dias` : `atrasado ${-d} dias`}`),
        el('span', { class: 'legenda' },
          [feito && c.Prazo && `Prazo ${dataLonga.format(data(c.Prazo))}`, c.Categoria, c['Responsável']].filter(Boolean).join(' · '))));
  };
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
    cabecalho('Checklist', `${feitos} de ${itens.length} feitos.`, 'Toque para marcar como feito. As mudanças vão para a planilha.'),
    el('ul', { class: 'lista lista--tarefas' }, itens.map(item)),
    el('h2', { class: 'kicker espaco-topo' }, 'Nova pendência'),
    formPendencia(ctx)));
}

// ---------------------------------------------------------------- Viagem

// Informações de consulta rápida na viagem (aba Viagem); só aparecem as que existem.
const ESSENCIAIS = [['emergencias', 'Emergências'], ['fuso', 'Fuso horário'], ['tomadas', 'Tomadas'], ['eventos', 'Eventos no período'], ['carro', 'Carro'], ['trem', 'Trem']];
// Rótulos legíveis das chaves da aba Viagem; chaves novas aparecem com o próprio nome.
const ROTULOS_VIAGEM = {
  nome_portal: 'Nome do app', referencia_custos: 'Referência de custos', inicio: 'Embarque', chegada_escocia: 'Chegada à Escócia', saida_escocia: 'Saída da Escócia',
  fim: 'Chegada ao Brasil', noites: 'Noites', viajantes: 'Viajantes', cotacao_gbp_brl: 'Cotação por £1',
  data_verificacao: 'Verificação dos dados', fuso: 'Fuso horário',
};

const DEVOLUCAO = /^Devolução ([A-Z]):/;
const valorDaViagem = (l) => {
  if (l.Chave === 'cotacao_gbp_brl') return brl2.format(l.Valor);
  if (l.Chave === 'referencia_custos') return brl.format(l.Valor);
  return /^\d{4}-\d{2}-\d{2}/.test(l.Valor) ? dataLonga.format(data(l.Valor)) : String(l.Valor);
};

export function paginaViagem(ctx) {
  const { abas, v } = ctx;
  const essenciais = ESSENCIAIS.filter(([chave]) => v[chave]);
  const transportes = [...abas.Transportes].sort((a, b) => String(a.Data).localeCompare(String(b.Data)));
  const devolucoes = transportes.filter((t) => DEVOLUCAO.test(t.Trecho));
  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      // Mesmo período da abertura do painel: do embarque à saída da Escócia.
      cabecalho('Viagem', `${dataCurta.format(data(v.inicio))} a ${dataLonga.format(data(v.saida_escocia || v.fim))}.`, `${v.viajantes} · ${v.noites} noites · fuso ${v.fuso}`),
      el('nav', { class: 'atalhos', 'aria-label': 'Ver também' }, el('a', { class: 'pill', href: '#orcamento' }, 'Orçamento')),
      essenciais.length ? el('h2', { class: 'kicker' }, 'Essenciais') : null,
      essenciais.length ? el('div', { class: 'grade-2 grade-2--par' }, essenciais.map(([chave, titulo]) => el('article', { class: 'card card--auto card--contorno essencial', 'data-subir': true },
        el('p', { class: 'legenda' }, titulo),
        el('ul', { class: 'essencial__itens' }, String(v[chave]).split(/\s*·\s*/).map((item) => el('li', {}, item)))))) : null,
      el('h2', { class: 'kicker espaco-topo' }, 'Voos'),
      el('div', { class: 'grade-2' }, abas.Passagens.map((p) => el('article', { class: 'card card--auto card--contorno', 'data-subir': true },
        el('p', { class: 'legenda' }, p.Trecho),
        el('p', { class: 'card__numero' }, `${p['Saída']} → ${p.Chegada}`),
        el('p', { class: 'legenda' }, `Sai ${dataLonga.format(data(p.Data))} · chega ${p['Chegada (data)'] ? dataLonga.format(data(p['Chegada (data)'])) : ''}`),
        el('p', { class: p.Status === 'pago' ? 'legenda' : 'status-pendente' }, p.Status)))),
      el('h2', { class: 'kicker espaco-topo' }, 'Trem e carro'),
      lista(transportes.filter((t) => !DEVOLUCAO.test(t.Trecho)).map((t) => el('li', { class: 'atracao' },
        el('div', {},
          el('p', { class: 'atracao__nome' }, t.Tipo === 'Outro' ? t.Trecho : `${t.Tipo}: ${t.Trecho}`),
          el('p', { class: 'legenda' }, `${dataLonga.format(data(t.Data))} · ${t['Valor (R$)'] ? brl.format(t['Valor (R$)']) : 'valor a confirmar'}${t['Status da informação'] ? ` · ${t['Status da informação']}` : ''}`),
          comAlerta(t['Observações'] || ''),
          t['Valor planejado (R$)'] ? el('p', { class: 'legenda' }, `Planejado: ${brl.format(t['Valor planejado (R$)'])}`) : null,
          el('p', { class: 'legenda' }, `Verificado em ${dataLonga.format(data(t['Verificado em']))}${t.Fonte ? ` · ${t.Fonte}` : ''}`)),
        seletorStatus(ctx, 'Transportes', t))), ''),
      devolucoes.length ? el('h2', { class: 'kicker espaco-topo' }, 'Devolução do carro: a decidir') : null,
      devolucoes.length ? el('div', { class: 'grade-2 grade-2--par' }, devolucoes.map((t) => el('article', { class: 'card card--auto card--contorno', 'data-subir': true },
        el('p', { class: 'legenda' }, `Opção ${t.Trecho.match(DEVOLUCAO)[1]} · ${dataLonga.format(data(t.Data))}`),
        el('h3', { class: 'estadia__nome' }, t.Trecho.replace(DEVOLUCAO, '').trim()),
        el('p', { class: 'card__numero' }, t['Valor (R$)'] ? `+ ${brl.format(t['Valor (R$)'])}` : 'Sem custo extra'),
        el('p', { class: 'legenda' }, t['Observações'].replace(/^A decidir\.\s*/, ''))))) : null)),
    el('section', { class: 'secao secao--mist' }, el('div', { class: 'conteudo' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'Dados da viagem.'),
      el('table', { class: 'tabela' }, el('tbody', {}, abas.Viagem.filter((l) => !ESSENCIAIS.some(([c]) => c === l.Chave && c !== 'fuso')).map((l) => el('tr', {},
        el('th', { scope: 'row' }, ROTULOS_VIAGEM[l.Chave] || l.Chave.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())),
        el('td', {}, valorDaViagem(l)),
        el('td', { class: 'legenda' }, l['Observação'] || ''))))),
      el('p', { class: 'legenda espaco-topo' }, 'Passaporte e CNH não ficam no portal; guarde só o status no Checklist. Os vouchers dos hotéis ficam em Hospedagens, protegidos pelo código de acesso.'),
      el('h2', { class: 'kicker espaco-topo' }, 'Créditos das fotos'),
      el('p', { class: 'legenda' }, 'Fotos dos hotéis: anúncios de cada hotel no Booking.com, exibidas a partir do próprio Booking. Fotos das cidades:'),
      lista(Object.entries(ctx.creditos).map(([nome, c]) => el('li', {},
        el('p', {}, (abas.Cidades.find((x) => slug(x.Cidade) === nome) || { Cidade: 'Abertura' }).Cidade),
        el('p', { class: 'legenda' }, creditoFoto(c)))), ''))));
}

// ---------------------------------------------------------------- Formulários

// Rótulo + controle. Listas de seleção ganham a seta própria (.seletor).
export function campo(rotulo, controle) {
  return el('label', { class: 'rotulo' }, typeof rotulo === 'string' ? el('span', {}, rotulo) : rotulo,
    controle.tagName === 'SELECT' ? el('span', { class: 'seletor' }, controle) : controle);
}

// Mensagem de erro abaixo do campo, no lugar do balão nativo (que varia por sistema).
const MENSAGENS = {
  valueMissing: 'Preencha este campo.',
  patternMismatch: 'Use só números, com até duas casas decimais (ex.: 12,50).',
};
function mostrarErro(controle) {
  const rotulo = controle.closest('.rotulo');
  if (!rotulo) return;
  const v = controle.validity;
  const texto = Object.keys(MENSAGENS).find((k) => v[k]);
  rotulo.querySelector('.erro')?.remove();
  rotulo.append(el('span', { class: 'erro status-pendente', role: 'alert' }, texto ? MENSAGENS[texto] : controle.validationMessage));
  controle.setAttribute('aria-invalid', 'true');
}
function limparErro(controle) {
  controle.removeAttribute('aria-invalid');
  controle.closest('.rotulo')?.querySelector('.erro')?.remove();
}
export function opcoes(lista, atual) {
  return lista.map((o) => el('option', { value: o, selected: o === atual }, o));
}
export function form(onsubmit, ...campos) {
  const f = el('form', { class: 'formulario', novalidate: true, onsubmit: (e) => {
    e.preventDefault();
    const invalidos = [...f.elements].filter((c) => c.willValidate && !c.checkValidity());
    invalidos.forEach(mostrarErro);
    if (invalidos.length) { invalidos[0].focus(); return; }
    onsubmit(new FormData(f), f);
  } }, ...campos);
  f.addEventListener('input', (e) => { if (e.target.checkValidity?.()) limparErro(e.target); });
  return f;
}

function formNota(ctx, cidade) {
  const quem = PESSOAS(ctx.v);
  const topicos = ['Geral', ...ctx.abas.Cidades.map((c) => c.Cidade)];
  return form((fd, f) => {
    const dados = Object.fromEntries(fd);
    pessoa.definir(dados.Autor);
    ctx.salvar({ acao: 'adicionar', aba: 'Notas', dados }, 'Nota salva.').then(() => f.reset());
  },
    cidade ? el('input', { type: 'hidden', name: 'Cidade/Tópico', value: cidade }) : campo('Cidade ou tópico', el('select', { class: 'campo', name: 'Cidade/Tópico' }, opcoes(topicos))),
    campo('Nota', el('textarea', { class: 'campo', name: 'Texto livre', rows: 4, maxlength: 2000, required: true })),
    campo('Autor', el('select', { class: 'campo', name: 'Autor' }, opcoes(quem, pessoa.obter()))),
    el('button', { class: 'pill pill--azul', type: 'submit' }, 'Salvar nota'));
}

function formPendencia(ctx) {
  const quem = [...PESSOAS(ctx.v), 'Todos'];
  return form((fd, f) => {
    const dados = { ...Object.fromEntries(fd), Status: '⚠️ pendente', Fonte: 'Portal' };
    ctx.salvar({ acao: 'adicionar', aba: 'Checklist', dados }, 'Pendência criada.').then(() => f.reset());
  },
    campo('Item', el('input', { class: 'campo', name: 'Item', maxlength: 200, required: true })),
    el('div', { class: 'linha-campos' },
      campo('Prazo', el('input', { class: 'campo', type: 'date', name: 'Prazo', required: true })),
      campo('Responsável', el('select', { class: 'campo', name: 'Responsável' }, opcoes(quem, pessoa.obter())))),
    campo('Categoria', el('input', { class: 'campo', name: 'Categoria', maxlength: 40, value: 'Geral' })),
    el('button', { class: 'pill pill--azul', type: 'submit' }, 'Criar pendência'));
}
