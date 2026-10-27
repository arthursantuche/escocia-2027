// Páginas além do painel: Cidade, Orçamento, Checklist, Registrar e Viagem.
// Cada função recebe o contexto { abas, v (Viagem), salvar } e devolve um elemento.
import { el, brl, brl2, gbp, dataCurta, dataLonga, data, diasAte, slug, hojeISO, valorBRL } from './util.js';
import { graficoOrcamento, graficoGastoDiario } from './graficos.js';
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
    texto && el('p', { class: 'copy legenda' }, texto));
}

function seletorStatus(ctx, aba, linha) {
  const s = el('select', {
    class: 'campo campo--compacto', 'aria-label': 'Status de ' + (linha.Nome || linha.Trecho || linha.ID),
    onchange: (e) => ctx.salvar({ acao: 'atualizar', aba, id: linha.ID, dados: { Status: e.target.value } }, 'Status atualizado.'),
  }, STATUS[aba].map((op) => el('option', { value: op, selected: op === linha.Status }, op)));
  return s;
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
  const foto = cidade.Imagem || `assets/img/cidades/${slug(c)}.jpg`;
  const credito = ctx.creditos[slug(c)];

  return el('div', {},
    el('section', { class: 'secao cidade-hero' },
      el('div', { class: 'conteudo' },
        cabecalho(visitas.map((r) => dataCurta.format(data(r.Data))).join(' e '), c + '.', cidade.Resumo),
        el('figure', { class: 'foto', 'data-parallax': true },
          el('img', { src: foto, alt: `Paisagem de ${c}`, loading: 'lazy', onerror: (e) => e.target.closest('figure').remove() }),
          credito && el('figcaption', { class: 'legenda' }, `${credito.titulo.replace(/\.jpe?g$/i, '')} · foto de ${credito.autor} · ${credito.licenca} · Wikimedia Commons`)))),
    el('section', { class: 'secao secao--mist' },
      el('div', { class: 'conteudo grade-2' },
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Dicas'), el('p', { class: 'copy' }, cidade.Dicas)),
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Clima e luz'), el('p', { class: 'copy' }, cidade['Clima/luz'])),
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Logística'),
          lista(visitas.map((r) => el('li', {},
            el('p', {}, `${dataLonga.format(data(r.Data))} · ${r.Deslocamento}${r.Tempo ? ' · ' + r.Tempo : ''}${r['Distância'] ? ' · ' + r['Distância'] : ''}`),
            el('p', { class: 'legenda' }, `Dorme em ${r['Dormida em']}. ${r['Observações'] || ''}`),
            r['Link Maps'] && el('a', { href: r['Link Maps'], target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps'))), '')),
        el('article', { class: 'card card--auto' }, el('h2', { class: 'kicker' }, 'Hospedagem'),
          lista(hosp.map((h) => el('li', {},
            el('p', {}, h.Nome),
            el('p', { class: 'legenda' }, `${dataCurta.format(data(h.Entrada))} a ${dataCurta.format(data(h['Saída']))} · ${h.Noites} noite(s) · ${brl.format(h['Valor (R$)'] || 0)}`),
            el('p', { class: 'legenda' }, h['Observações'] || ''),
            el('p', { class: 'legenda' }, `Preço verificado em ${dataLonga.format(data(h['Verificado em']))}`),
            seletorStatus(ctx, 'Hospedagens', h))),
          `Sem hospedagem: visita no dia, dormindo em ${visitas[0] ? visitas[0]['Dormida em'] : 'outra cidade'}.`)))),
    el('section', { class: 'secao' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo', 'data-revelar': true }, 'Atrações.'),
        lista(atr.map((a) => el('li', { class: 'atracao', 'data-subir': true },
          el('div', {},
            el('p', { class: 'atracao__nome' }, a.Nome),
            el('p', { class: 'legenda' }, [dataCurta.format(data(a['Dia sugerido'])), a['Horário'], Number(a['Preço (£)']) ? gbp.format(a['Preço (£)']) : 'grátis', a['Reserva necessária'] === 'Sim' ? '⚠️ reservar' : null].filter(Boolean).join(' · ')),
            a['Observações'] && el('p', { class: 'legenda' }, a['Observações']),
            el('a', { href: a['Link Maps'] || maps(a.Nome + ' ' + c), target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps')),
          seletorStatus(ctx, 'Atracoes', a))), 'Nenhuma atração cadastrada.'),
        el('p', { class: 'legenda' }, `Horários e preços verificados em ${dataLonga.format(data(ctx.v.data_verificacao))}; confirmar perto da viagem.`))),
    el('section', { class: 'secao secao--mist' },
      el('div', { class: 'conteudo' },
        el('h2', { class: 'titulo' }, 'Notas.'),
        lista(notas.map((n) => el('li', {}, el('p', {}, n['Texto livre']), el('p', { class: 'legenda' }, `${n.Autor || ''} · ${n.Data ? dataLonga.format(data(n.Data)) : ''}`))), 'Nenhuma nota ainda.'),
        formNota(ctx, c))));
}

// ---------------------------------------------------------------- Orçamento

export function paginaOrcamento(ctx) {
  const { abas, v } = ctx;
  const cot = Number(v.cotacao_gbp_brl) || 0;
  const orc = abas.Orcamento;
  const total = (campo) => orc.reduce((t, o) => t + (Number(o[campo]) || 0), 0);
  const gastos = [...abas.Gastos].sort((a, b) => String(b.Data).localeCompare(String(a.Data)));
  const canvas = el('canvas', { role: 'img', 'aria-label': 'Orçamento por categoria' });
  const diario = el('canvas', { role: 'img', 'aria-label': 'Gasto diário em reais' });
  graficoOrcamento(canvas, orc.filter((o) => o['Previsto (R$)'] || o['Reservado/Pago (R$)'] || o['Real (R$)']));
  const porDia = {};
  gastos.forEach((g) => { if (g.Data) porDia[g.Data.slice(0, 10)] = (porDia[g.Data.slice(0, 10)] || 0) + valorBRL(g, cot); });
  if (Object.keys(porDia).length) graficoGastoDiario(diario, porDia);

  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      cabecalho('Orçamento', brl.format(total('Previsto (R$)')) + ' previstos.', `Reservado ou pago: ${brl.format(total('Reservado/Pago (R$)'))}. Gasto real: ${brl.format(total('Real (R$)'))}. Cotação: R$ ${String(cot).replace('.', ',')} por £1.`),
      el('div', { class: 'card__grafico card__grafico--alto' }, canvas),
      el('table', { class: 'tabela' },
        el('thead', {}, el('tr', {}, ['Categoria', 'Previsto', 'Reservado/pago', 'Real'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, orc.map((o) => el('tr', {},
          el('th', { scope: 'row' }, o.Categoria),
          ['Previsto (R$)', 'Reservado/Pago (R$)', 'Real (R$)'].map((k) => el('td', {}, o[k] === '' || o[k] == null ? '–' : brl.format(o[k]))))))))),
    el('section', { class: 'secao secao--mist' }, el('div', { class: 'conteudo' },
      el('h2', { class: 'titulo' }, 'Gastos.'),
      Object.keys(porDia).length ? el('div', { class: 'card__grafico' }, diario) : null,
      lista(gastos.slice(0, 30).map((g) => el('li', {},
        el('p', {}, `${g.Descrição || g.Categoria} · ${brl2.format(valorBRL(g, cot))}`),
        el('p', { class: 'legenda' }, [g.Data && dataCurta.format(data(g.Data)), g.Cidade, g.Categoria, g.Moeda === '£' && gbp.format(g.Valor), g['Quem pagou']].filter(Boolean).join(' · ')))),
      'Nenhum gasto registrado. Use Registrar durante a viagem.'),
      el('a', { class: 'pill pill--azul', href: '#registrar' }, 'Registrar gasto'))));
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
        el('span', { class: feito ? 'legenda' : 'status-pendente' },
          [c.Prazo && `Prazo ${dataLonga.format(data(c.Prazo))}`, !feito && d != null && (d >= 0 ? `faltam ${d} dias` : `atrasado ${-d} dias`), c.Categoria, c['Responsável']].filter(Boolean).join(' · '))));
  };
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
    cabecalho('Checklist', `${feitos} de ${itens.length} feitos.`, 'Toque para marcar como feito. As mudanças vão para a planilha.'),
    el('ul', { class: 'lista lista--tarefas' }, itens.map(item)),
    el('h2', { class: 'kicker espaco-topo' }, 'Nova pendência'),
    formPendencia(ctx)));
}

// ---------------------------------------------------------------- Registrar

export function paginaRegistrar(ctx) {
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo grade-2' },
    el('div', {}, cabecalho('Registrar', 'Gasto.', 'Valores em libras são convertidos pela cotação da aba Viagem.'), formGasto(ctx)),
    el('div', {}, cabecalho('Registrar', 'Nota.', 'Por cidade ou tópico.'), formNota(ctx))));
}

// ---------------------------------------------------------------- Viagem

export function paginaViagem(ctx) {
  const { abas, v } = ctx;
  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      cabecalho('Viagem', `${dataLonga.format(data(v.inicio))} a ${dataLonga.format(data(v.fim))}.`, `${v.viajantes} · ${v.noites} noites · fuso ${v.fuso}`),
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
      el('h2', { class: 'titulo' }, 'Dados da viagem.'),
      el('table', { class: 'tabela' }, el('tbody', {}, abas.Viagem.map((l) => el('tr', {},
        el('th', { scope: 'row' }, l.Chave.replace(/_/g, ' ')),
        el('td', {}, /^\d{4}-\d{2}-\d{2}/.test(l.Valor) ? dataLonga.format(data(l.Valor)) : String(l.Valor)),
        el('td', { class: 'legenda' }, l['Observação'] || ''))))),
      el('p', { class: 'legenda espaco-topo' }, 'Documentos (passaporte, CNH, reservas) não ficam no portal; guarde só o status no Checklist.'))));
}

// ---------------------------------------------------------------- Formulários

function campo(rotulo, controle) {
  return el('label', { class: 'rotulo' }, el('span', {}, rotulo), controle);
}
function opcoes(lista, atual) {
  return lista.map((o) => el('option', { value: o, selected: o === atual }, o));
}
function form(onsubmit, ...campos) {
  return el('form', { class: 'formulario', onsubmit: (e) => { e.preventDefault(); onsubmit(new FormData(e.target), e.target); } }, ...campos);
}

function formGasto(ctx) {
  const { abas, v } = ctx;
  const quem = PESSOAS(v);
  return form((fd, f) => {
    const dados = Object.fromEntries(fd);
    dados.Valor = Number(String(dados.Valor).replace(',', '.'));
    pessoa.definir(dados['Quem pagou']);
    ctx.salvar({ acao: 'adicionar', aba: 'Gastos', dados }, 'Gasto registrado.').then(() => f.reset());
  },
    campo('Data', el('input', { class: 'campo', type: 'date', name: 'Data', value: hojeISO(), required: true })),
    campo('Cidade', el('select', { class: 'campo', name: 'Cidade' }, opcoes(abas.Cidades.map((c) => c.Cidade)))),
    campo('Categoria', el('select', { class: 'campo', name: 'Categoria', required: true }, opcoes(abas.Orcamento.map((o) => o.Categoria), 'Alimentação'))),
    campo('Descrição', el('input', { class: 'campo', name: 'Descrição', maxlength: 120, required: true })),
    el('div', { class: 'linha-campos' },
      campo('Valor', el('input', { class: 'campo', name: 'Valor', inputmode: 'decimal', pattern: '[0-9]+([,.][0-9]{1,2})?', required: true })),
      campo('Moeda', el('select', { class: 'campo', name: 'Moeda' }, opcoes(['£', 'R$'])))),
    campo('Quem pagou', el('select', { class: 'campo', name: 'Quem pagou' }, opcoes(quem, pessoa.obter()))),
    el('button', { class: 'pill pill--azul', type: 'submit' }, 'Salvar gasto'));
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
