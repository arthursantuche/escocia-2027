// Páginas além do painel: Cidade, Orçamento, Checklist, Registrar e Viagem.
// Cada função recebe o contexto { abas, v (Viagem), salvar } e devolve um elemento.
import { el, brl, brl2, gbp, dataCurta, dataLonga, diaSemana, data, diasAte, slug, hojeISO, valorBRL, foto, creditoFoto, valoresOrcamento, totaisOrcamento, seriesPrecos, luzDaParada, textoLuz } from './util.js';
import { graficoOrcamento, graficoGastoDiario, graficoPrecos } from './graficos.js';
import { pessoa } from './dados.js';

const STATUS = {
  Hospedagens: ['pesquisando', 'reservado', 'pago', 'descartado'],
  Transportes: ['pesquisando', 'reservado', 'pago'],
  Atracoes: ['a decidir', 'planejado', 'reservado', 'pago', 'visitado', 'descartado'],
};
const PESSOAS = (v) => String(v.viajantes || '').split(/,\s*|\s+e\s+/).filter(Boolean);
const maps = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

function cabecalho(kicker, titulo, texto) {
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
  const hosp = abas.Hospedagens.filter((h) => h.Cidade === c);
  const atr = abas.Atracoes.filter((a) => a.Cidade === c).sort((a, b) => String(a['Dia sugerido']).localeCompare(String(b['Dia sugerido'])));
  const notas = abas.Notas.filter((n) => n['Cidade/Tópico'] === c);
  const credito = ctx.creditos[slug(c)];
  const precosCidade = seriesPrecos(abas);
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
      el('a', { href: a['Link Maps'] || maps(a.Nome + ' ' + c), target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps')),
    seletorStatus(ctx, 'Atracoes', a));

  return el('div', {},
    el('section', { class: 'secao cidade-hero' },
      el('div', { class: 'conteudo' },
        cabecalho(visitas.map((r) => dataCurta.format(data(r.Data))).join(' e '), c + '.', cidade.Resumo),
        el('figure', { class: 'foto', 'data-parallax': true },
          el('div', { class: 'foto__moldura' },
            el('img', { ...foto(slug(c), '(min-width: 1020px) 980px, calc(100vw - 40px)', cidade.Imagem), alt: `Paisagem de ${c}`, onerror: (e) => e.target.closest('figure').remove() })),
          credito && el('figcaption', { class: 'legenda' }, creditoFoto(credito))))),
    el('section', { class: 'secao secao--mist' },
      el('div', { class: 'conteudo grade-2' },
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Dicas'), el('p', { class: 'copy' }, cidade.Dicas)),
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Clima e luz'), el('p', { class: 'copy' }, cidade['Clima/luz'])),
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Logística'),
          lista(visitas.map((r) => el('li', {},
            el('p', {}, `${dataLonga.format(data(r.Data))} · ${r.Deslocamento}${r.Tempo ? ' · ' + r.Tempo : ''}${r['Distância'] ? ' · ' + r['Distância'] : ''}`),
            el('p', { class: 'legenda' }, `Dorme em ${r['Dormida em']}. ${r['Observações'] || ''}`),
            textoLuz(luzDaParada(r, abas.Cidades)) && el('p', { class: 'legenda' }, textoLuz(luzDaParada(r, abas.Cidades))),
            r['Link Maps'] && el('a', { href: r['Link Maps'], target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps'))), '')),
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Hospedagem'),
          lista(hosp.map((h) => itemHospedagem(ctx, h, precosCidade.find((s) => s.id === h.ID))),
          `Sem hospedagem: visita no dia, dormindo em ${visitas[0] ? visitas[0]['Dormida em'] : 'outra cidade'}.`)))),
    el('section', { class: 'secao' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo', 'data-revelar': true }, 'Atrações.'),
        atr.length ? el('div', { class: 'atracoes' }, dias.map((d) => el('section', { class: 'dia' },
          el('h3', { class: 'dia__titulo' }, d ? diaSemana(d) : 'Sem dia definido'),
          el('ul', { class: 'lista' }, porDia[d].map(atracao))))) : el('p', { class: 'legenda' }, 'Nenhuma atração cadastrada.'),
        el('p', { class: 'legenda' }, `Horários e preços verificados em ${dataLonga.format(data(ctx.v.data_verificacao))}; confirmar perto da viagem.`))),
    el('section', { class: 'secao secao--mist' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo', 'data-revelar': true }, 'Notas.'),
        lista(notas.map((n) => el('li', {}, el('p', {}, n['Texto livre']), el('p', { class: 'legenda' }, `${n.Autor || ''} · ${n.Data ? dataLonga.format(data(n.Data)) : ''}`))), 'Nenhuma nota ainda.'),
        formNota(ctx, c))),
    el('nav', { class: 'secao vizinhas', 'aria-label': 'Outras paradas' },
      el('div', { class: 'conteudo vizinhas__grade' },
        anterior && vizinha(anterior, 'Parada anterior', 'anterior'),
        proxima && proxima !== cidade && vizinha(proxima, ultima ? 'Volta para' : 'Próxima parada', 'proxima'))));
}

// Hospedagem com o último preço consultado, histórico (2+ consultas) e registro de nova consulta.
function itemHospedagem(ctx, h, serie) {
  const ultimo = serie && serie.pontos[serie.pontos.length - 1];
  const canvas = serie && serie.pontos.length > 1 ? el('canvas', { role: 'img', 'aria-label': `Histórico de preços de ${h.Nome}` }) : null;
  if (canvas) graficoPrecos(canvas, [serie]);
  return el('li', {},
    el('p', {}, h.Nome),
    el('p', { class: 'legenda' }, `${dataCurta.format(data(h.Entrada))} a ${dataCurta.format(data(h['Saída']))} · ${h.Noites} noite(s) · ${brl.format(h['Valor (R$)'] || 0)}`),
    h['Observações'] ? el('p', { class: 'legenda' }, h['Observações']) : null,
    el('p', { class: 'legenda' }, ultimo
      ? `Última consulta: ${brl.format(ultimo.valor)} em ${dataLonga.format(data(ultimo.data))}${ultimo.fonte ? ` (${ultimo.fonte})` : ''}${serie.pontos.length > 1 ? ` · ${serie.pontos.length} consultas` : ''}`
      : `Preço verificado em ${dataLonga.format(data(h['Verificado em']))}`),
    canvas ? el('div', { class: 'card__grafico card__grafico--baixo' }, canvas) : null,
    seletorStatus(ctx, 'Hospedagens', h),
    h.Status === 'descartado' ? null : el('details', { class: 'registro-preco' },
      el('summary', {}, 'Registrar preço consultado'),
      formPreco(ctx, h)));
}

function vizinha(cidade, rotulo, lado) {
  return el('a', { class: `vizinha vizinha--${lado}`, href: '#cidade/' + slug(cidade.Cidade) },
    el('img', { ...foto(slug(cidade.Cidade), '(min-width: 834px) 480px, 45vw', cidade.Imagem), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() }),
    el('span', { class: 'vizinha__texto' },
      el('span', { class: 'legenda' }, (lado === 'anterior' ? '← ' : '') + rotulo + (lado === 'proxima' ? ' →' : '')),
      el('span', { class: 'kicker' }, cidade.Cidade)));
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
  const precos = el('canvas', { role: 'img', 'aria-label': 'Preços consultados das hospedagens' });
  graficoOrcamento(canvas, orc.filter((o) => o.previsto || o.pago || o.aPagar));
  const porDia = {};
  gastos.forEach((g) => { if (g.Data) porDia[g.Data.slice(0, 10)] = (porDia[g.Data.slice(0, 10)] || 0) + valorBRL(g, cot); });
  if (Object.keys(porDia).length) graficoGastoDiario(diario, porDia);
  const series = seriesPrecos(abas);
  if (series.length) graficoPrecos(precos, series);
  const comHistorico = series.some((s) => s.pontos.length > 1);
  const valor = (n) => (n == null ? '–' : brl.format(n));
  // Categorias ainda sem nenhum valor saem da tabela e são citadas numa linha abaixo dela.
  const temValor = (o) => o.previsto || o.aPagar || o.pago;
  const semValor = orc.filter((o) => !temValor(o)).map((o) => o.categoria);
  const detalhePago = (o) => [o.antes && `${brl.format(o.antes)} antes`, o.viagem && `${brl.format(o.viagem)} na viagem`].filter(Boolean).join(' · ');

  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      cabecalho('Orçamento', brl.format(total.previsto) + ' previstos.',
        `Pago ${brl.format(total.pago)} · A pagar ${brl.format(total.aPagar)} · Saldo ${brl.format(total.saldo)} · Cotação R$ ${String(cot).replace('.', ',')} por £1`),
      el('div', { class: 'card__grafico card__grafico--alto' }, canvas),
      el('p', { class: 'legenda legenda-grafico' },
        el('span', { class: 'cor-previsto' }, 'Previsto'), el('span', { class: 'cor-pago' }, 'Pago'), el('span', { class: 'cor-apagar' }, 'A pagar')),
      el('div', { class: 'espaco-topo' }, el('table', { class: 'tabela tabela--empilha' },
        el('thead', {}, el('tr', {}, ['Categoria', 'Previsto', 'A pagar', 'Pago', 'Saldo'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, orc.filter(temValor).map((o) => el('tr', {},
          el('th', { scope: 'row' }, o.categoria),
          el('td', { 'data-rotulo': 'Previsto' }, valor(o.previsto)),
          el('td', { 'data-rotulo': 'A pagar' }, o.aPagar ? brl.format(o.aPagar) : '–'),
          el('td', { 'data-rotulo': 'Pago' }, o.pago ? brl.format(o.pago) : '–', o.pago ? el('span', { class: 'legenda bloco' }, detalhePago(o)) : null),
          el('td', { 'data-rotulo': 'Saldo', class: o.saldo < 0 ? 'negativo' : null }, valor(o.saldo))))),
        el('tfoot', {}, el('tr', {},
          el('th', { scope: 'row' }, 'Total'),
          el('td', { 'data-rotulo': 'Previsto' }, brl.format(total.previsto)), el('td', { 'data-rotulo': 'A pagar' }, brl.format(total.aPagar)),
          el('td', { 'data-rotulo': 'Pago' }, brl.format(total.pago)),
          el('td', { 'data-rotulo': 'Saldo', class: total.saldo < 0 ? 'negativo' : null }, brl.format(total.saldo)))))),
      semValor.length ? el('p', { class: 'legenda espaco-topo' }, `Sem valores ainda: ${semValor.join(', ')}. Preencha o previsto na aba Orcamento da planilha.`) : null,
      el('ul', { class: 'legenda glossario espaco-topo' },
        el('li', {}, el('strong', {}, 'Previsto: '), 'estimativa de cada categoria.'),
        el('li', {}, el('strong', {}, 'A pagar: '), 'reservas com status "reservado", ainda não pagas.'),
        el('li', {}, el('strong', {}, 'Pago: '), 'reservas com status "pago" (antes da viagem) mais os gastos registrados na viagem.'),
        el('li', {}, el('strong', {}, 'Saldo: '), 'previsto menos a pagar e pago. Negativo, em laranja, é estouro.')))),
    el('section', { class: 'secao secao--mist' }, el('div', { class: 'conteudo' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'Gastos.'),
      Object.keys(porDia).length ? el('div', { class: 'card__grafico' }, diario) : null,
      lista(gastos.slice(0, 30).map((g) => el('li', {},
        el('p', {}, `${g.Descrição || g.Categoria} · ${brl2.format(valorBRL(g, cot))}`),
        el('p', { class: 'legenda' }, [g.Data && dataCurta.format(data(g.Data)), g.Cidade, g.Categoria, g.Moeda === '£' && gbp.format(g.Valor), g['Quem pagou']].filter(Boolean).join(' · ')))),
      'Nenhum gasto registrado. Use Registrar durante a viagem.'),
      el('a', { class: 'pill pill--azul espaco-topo', href: '#registrar' }, 'Registrar gasto'))),
    series.length ? el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'Preços das hospedagens.'),
      el('div', { class: 'card__grafico card__grafico--alto' }, precos),
      el('p', { class: 'legenda' }, comHistorico
        ? 'Cada linha é um hotel com duas ou mais consultas registradas.'
        : 'Último preço consultado de cada opção. O histórico aparece a partir da segunda consulta de um hotel; registre novas consultas na página de cada cidade.'))) : null);
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

// ---------------------------------------------------------------- Registrar

export function paginaRegistrar(ctx) {
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo grade-2 grade-2--folgada' },
    el('div', {}, cabecalho('Registrar', 'Gasto.', 'Valores em libras são convertidos pela cotação da aba Viagem.'), formGasto(ctx)),
    el('div', {}, cabecalho('Registrar', 'Nota.', 'Por cidade ou tópico.'), formNota(ctx))));
}

// ---------------------------------------------------------------- Viagem

// Informações de consulta rápida na viagem (aba Viagem); só aparecem as que existem.
const ESSENCIAIS = [['emergencias', 'Emergências'], ['fuso', 'Fuso horário'], ['tomadas', 'Tomadas'], ['eventos', 'Eventos no período']];
// Rótulos legíveis das chaves da aba Viagem; chaves novas aparecem com o próprio nome.
const ROTULOS_VIAGEM = {
  nome_portal: 'Nome do app', inicio: 'Embarque', chegada_escocia: 'Chegada à Escócia', saida_escocia: 'Saída da Escócia',
  fim: 'Chegada ao Brasil', noites: 'Noites', viajantes: 'Viajantes', cotacao_gbp_brl: 'Cotação (R$ por £1)',
  data_verificacao: 'Verificação dos dados', fuso: 'Fuso horário',
};

export function paginaViagem(ctx) {
  const { abas, v } = ctx;
  const essenciais = ESSENCIAIS.filter(([chave]) => v[chave]);
  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      // Mesmo período da abertura do painel: do embarque à saída da Escócia.
      cabecalho('Viagem', `${dataCurta.format(data(v.inicio))} a ${dataLonga.format(data(v.saida_escocia || v.fim))}.`, `${v.viajantes} · ${v.noites} noites · fuso ${v.fuso}`),
      essenciais.length ? el('h2', { class: 'kicker' }, 'Essenciais') : null,
      essenciais.length ? el('div', { class: 'grade-2 grade-2--par' }, essenciais.map(([chave, titulo]) => el('article', { class: 'card card--auto card--contorno essencial' },
        el('p', { class: 'legenda' }, titulo),
        el('ul', { class: 'essencial__itens' }, String(v[chave]).split(/\s*·\s*/).map((item) => el('li', {}, item)))))) : null,
      el('h2', { class: 'kicker espaco-topo' }, 'Voos'),
      el('div', { class: 'grade-2' }, abas.Passagens.map((p) => el('article', { class: 'card card--auto card--contorno' },
        el('p', { class: 'legenda' }, p.Trecho),
        el('p', { class: 'card__numero' }, `${p['Saída']} → ${p.Chegada}`),
        el('p', { class: 'legenda' }, `Sai ${dataLonga.format(data(p.Data))} · chega ${p['Chegada (data)'] ? dataLonga.format(data(p['Chegada (data)'])) : ''}`),
        el('p', { class: p.Status === 'pago' ? 'legenda' : 'status-pendente' }, p.Status)))),
      el('h2', { class: 'kicker espaco-topo' }, 'Trens e carros'),
      lista(abas.Transportes.map((t) => el('li', { class: 'atracao' },
        el('div', {},
          el('p', { class: 'atracao__nome' }, `${t.Tipo}: ${t.Trecho}`),
          el('p', { class: 'legenda' }, `${dataLonga.format(data(t.Data))} · ${t['Valor (R$)'] ? brl.format(t['Valor (R$)']) : 'valor a cotar'}`),
          el('p', { class: 'legenda' }, t['Observações'] || ''),
          el('p', { class: 'legenda' }, `Verificado em ${dataLonga.format(data(t['Verificado em']))}`)),
        seletorStatus(ctx, 'Transportes', t))), ''))),
    el('section', { class: 'secao secao--mist' }, el('div', { class: 'conteudo' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'Dados da viagem.'),
      el('table', { class: 'tabela' }, el('tbody', {}, abas.Viagem.filter((l) => !ESSENCIAIS.some(([c]) => c === l.Chave && c !== 'fuso')).map((l) => el('tr', {},
        el('th', { scope: 'row' }, ROTULOS_VIAGEM[l.Chave] || l.Chave.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())),
        el('td', {}, /^\d{4}-\d{2}-\d{2}/.test(l.Valor) ? dataLonga.format(data(l.Valor)) : String(l.Valor)),
        el('td', { class: 'legenda' }, l['Observação'] || ''))))),
      el('p', { class: 'legenda espaco-topo' }, 'Documentos (passaporte, CNH, reservas) não ficam no portal; guarde só o status no Checklist.'),
      el('h2', { class: 'kicker espaco-topo' }, 'Créditos das fotos'),
      lista(Object.entries(ctx.creditos).map(([nome, c]) => el('li', {},
        el('p', {}, (abas.Cidades.find((x) => slug(x.Cidade) === nome) || { Cidade: 'Abertura' }).Cidade),
        el('p', { class: 'legenda' }, creditoFoto(c)))), ''))));
}

// ---------------------------------------------------------------- Formulários

// Rótulo + controle. Listas de seleção ganham a seta própria (.seletor).
function campo(rotulo, controle) {
  return el('label', { class: 'rotulo' }, el('span', {}, rotulo),
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
function opcoes(lista, atual) {
  return lista.map((o) => el('option', { value: o, selected: o === atual }, o));
}
function form(onsubmit, ...campos) {
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

// Categorias que têm reservas: pagar uma reserva é mudar o status dela, não lançar gasto.
const COM_RESERVA = ['Passagens', 'Hospedagem', 'Transporte - carro', 'Transporte - trem'];

function formGasto(ctx) {
  const { abas, v } = ctx;
  const quem = PESSOAS(v);
  const aviso = el('span', { class: 'legenda', hidden: true },
    'Pagou uma reserva? Mude o status dela para "pago" (na página da cidade ou em Viagem) em vez de registrar aqui; assim o valor não conta duas vezes.');
  const categoria = el('select', { class: 'campo', name: 'Categoria', required: true, onchange: (e) => { aviso.hidden = !COM_RESERVA.includes(e.target.value); } },
    opcoes(abas.Orcamento.map((o) => o.Categoria), 'Alimentação'));
  const rotuloCategoria = campo('Categoria', categoria);
  rotuloCategoria.append(aviso);
  return form((fd, f) => {
    const dados = Object.fromEntries(fd);
    dados.Valor = Number(String(dados.Valor).replace(',', '.'));
    pessoa.definir(dados['Quem pagou']);
    ctx.salvar({ acao: 'adicionar', aba: 'Gastos', dados }, 'Gasto registrado.').then(() => f.reset());
  },
    campo('Data', el('input', { class: 'campo', type: 'date', name: 'Data', value: hojeISO(), required: true })),
    campo('Cidade', el('select', { class: 'campo', name: 'Cidade' }, opcoes(abas.Cidades.map((c) => c.Cidade)))),
    rotuloCategoria,
    campo('Descrição', el('input', { class: 'campo', name: 'Descrição', maxlength: 120, required: true })),
    el('div', { class: 'linha-campos' },
      campo('Valor', el('input', { class: 'campo', name: 'Valor', inputmode: 'decimal', pattern: '[0-9]+([,.][0-9]{1,2})?', required: true })),
      campo('Moeda', el('select', { class: 'campo', name: 'Moeda' }, opcoes(['£', 'R$'])))),
    campo('Quem pagou', el('select', { class: 'campo', name: 'Quem pagou' }, opcoes(quem, pessoa.obter()))),
    el('button', { class: 'pill pill--azul', type: 'submit' }, 'Salvar gasto'));
}

// Nova consulta de preço de uma hospedagem (aba Precos). Se ela ainda está em pesquisa,
// o valor da hospedagem passa a ser o consultado.
function formPreco(ctx, h) {
  return form(async (fd, f) => {
    const dados = Object.fromEntries(fd);
    const valor = Number(String(dados.Valor).replace(/\./g, '').replace(',', '.'));
    await ctx.salvar({ acao: 'adicionar', aba: 'Precos', dados: {
      Hospedagem: h.ID, Cidade: h.Cidade, Nome: h.Nome, 'Data da consulta': dados.Data, 'Valor (R$)': valor, Fonte: dados.Fonte,
    } }, 'Preço registrado.');
    if (h.Status === 'pesquisando') await ctx.salvar({ acao: 'atualizar', aba: 'Hospedagens', id: h.ID, dados: { 'Valor (R$)': valor } }, 'Preço registrado.');
    f.reset();
  },
    campo('Valor (R$)', el('input', { class: 'campo', name: 'Valor', inputmode: 'decimal', pattern: '[0-9.]+([,][0-9]{1,2})?', required: true })),
    campo('Data da consulta', el('input', { class: 'campo', type: 'date', name: 'Data', value: hojeISO(), required: true })),
    campo('Fonte', el('input', { class: 'campo', name: 'Fonte', maxlength: 60, value: 'Booking' })),
    el('button', { class: 'pill pill--azul', type: 'submit' }, 'Salvar preço'));
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
