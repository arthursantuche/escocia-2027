// Registrar: uma entrada só para tudo o que se acrescenta pelo site, em duas etapas: escolher
// o tipo e preencher só os campos dele. A planilha é a fonte de verdade: gasto vai para Gastos,
// atração para Atracoes, restaurante para Restaurantes e nota para Notas.
import { el, brl2, gbp, dataLonga, data, hojeISO, slug, valorBRL, pessoasDa as PESSOAS } from './util.js';
import { campo, form, opcoes, cabecalho } from './views.js';
import { pessoa } from './dados.js';

const STATUS_ATRACAO = ['a decidir', 'planejado', 'reservado', 'pago', 'visitado'];
const STATUS_RESTAURANTE = ['a decidir', 'planejado', 'reservado', 'visitado'];
const RESERVA = ['Sim', 'Recomendado', 'Não'];
const FAIXAS = ['£', '££', '£££', '££££'];
const PAGAMENTOS = ['Cartão', 'Dinheiro', 'Outro'];
// Categorias que têm reservas: pagar uma reserva é mudar o status dela, não lançar gasto.
const COM_RESERVA = ['Passagens', 'Hospedagem', 'Transporte - carro', 'Transporte - trem'];
const MAPS = 'https://www.google.com/maps/search/?api=1&query=';

const norm = (s) => slug(s || '');
const linkSeguro = (u) => (/^https?:\/\//i.test(String(u || '')) ? u : null);
const texto10 = (v) => String(v ?? '').slice(0, 10);

export const TIPOS = {
  gasto: { aba: 'Gastos', nome: 'Gasto', novo: 'Novo gasto', descricao: 'Uma despesa da viagem, em libras ou reais. Entra no orçamento.', chave: 'Descrição' },
  atracao: { aba: 'Atracoes', nome: 'Atração', novo: 'Nova atração', descricao: 'Um lugar para conhecer. Aparece na página da cidade.', chave: 'Nome' },
  restaurante: { aba: 'Restaurantes', nome: 'Restaurante', novo: 'Novo restaurante', descricao: 'Um lugar para comer. Aparece na página da cidade.', chave: 'Nome' },
  nota: { aba: 'Notas', nome: 'Nota', novo: 'Nova nota', descricao: 'Um lembrete livre, geral ou de uma cidade.', chave: 'Texto livre' },
};

// ---------------------------------------------------------------- leitura dos dados

const ativo = (l) => l.Status !== 'descartado' && l.Nome;
export const atracoesDoSite = (abas) => (abas.Atracoes || []).filter((a) => a.Origem === 'Site' && ativo(a));
export const restaurantes = (abas) => (abas.Restaurantes || []).filter(ativo);
// Atração removida pelo site some da lista; as demais continuam, com o status que tiverem.
export const atracaoVisivel = (a) => !(a.Origem === 'Site' && a.Status === 'descartado');

// O que ainda falta num registro feito pelo site, em palavras.
export function pendencias(l, tipo) {
  const falta = [];
  if (!l.Cidade) falta.push('cidade');
  if (!l['Endereço']) falta.push('endereço');
  if (!l.Link) falta.push('link');
  if (tipo === 'restaurante' && !l['Culinária']) falta.push('culinária');
  return falta;
}

// Linhas da página da cidade: mesmo padrão para atração nova e restaurante.
export function detalhesRegistro(l, tipo) {
  const falta = l.Origem === 'Site' ? pendencias(l, tipo) : [];
  const mapa = l['Endereço'] ? MAPS + encodeURIComponent(`${l.Nome} ${l['Endereço']}`) : null;
  const site = linkSeguro(l.Link);
  return [
    l['Endereço'] ? el('p', { class: 'legenda' }, l['Endereço']) : null,
    l['Descrição'] ? el('p', { class: 'legenda' }, l['Descrição']) : null,
    falta.length ? el('p', { class: 'status-pendente' }, `⚠️ Falta: ${falta.join(', ')}`) : null,
    l['A confirmar'] ? el('p', { class: 'status-pendente' }, `⚠️ A confirmar: ${l['A confirmar']}`) : null,
    mapa || site ? el('p', { class: 'registro__links' },
      mapa ? el('a', { href: mapa, target: '_blank', rel: 'noopener' }, 'Abrir no Google Maps') : null,
      site ? el('a', { href: site, target: '_blank', rel: 'noopener' }, 'Site') : null) : null,
  ];
}

export function itemRestaurante(r) {
  const linha = [r['Culinária'], r['Faixa de preço'], r.Dia ? dataLonga.format(data(r.Dia)) : null, r.Status].filter(Boolean).join(' · ');
  return el('li', { class: 'registro', 'data-subir': true },
    el('div', { class: 'registro__texto' },
      el('p', { class: 'atracao__nome' }, r.Nome),
      linha ? el('p', { class: 'legenda' }, linha) : null,
      detalhesRegistro(r, 'restaurante'),
      r['Observações'] ? el('p', { class: 'legenda' }, r['Observações']) : null),
    el('a', { class: 'pill', href: `#registrar/restaurante/${encodeURIComponent(r.ID)}` }, 'Editar'));
}

function duplicado(abas, tipo, dados, idAtual) {
  const nome = norm(dados.Nome);
  const cidade = norm(dados.Cidade);
  const igual = (l) => String(l.ID) !== String(idAtual) && l.Status !== 'descartado' && norm(l.Nome) === nome
    && (!cidade || !l.Cidade || norm(l.Cidade) === cidade);
  return (abas[TIPOS[tipo].aba] || []).find(igual);
}

// ---------------------------------------------------------------- rascunho

// O texto digitado fica no aparelho até salvar ou cancelar: trocar de página não o perde.
const CHAVE = (tipo) => `escocia2027:rascunho:${tipo}`;
const rascunho = {
  ler: (t) => { try { return JSON.parse(sessionStorage.getItem(CHAVE(t))) || null; } catch { return null; } },
  gravar: (t, d) => { try { sessionStorage.setItem(CHAVE(t), JSON.stringify(d)); } catch { /* sem armazenamento */ } },
  limpar: (t) => { try { sessionStorage.removeItem(CHAVE(t)); } catch { /* sem armazenamento */ } },
};

// ---------------------------------------------------------------- campos

const etiqueta = (t, obrigatorio) => el('span', {}, t, el('span', { class: obrigatorio ? 'rotulo__obrigatorio' : 'rotulo__opcional' }, obrigatorio ? ' · obrigatório' : ' · opcional'));
const grupo = (titulo, ...campos) => el('fieldset', { class: 'grupo' }, el('legend', { class: 'grupo__titulo' }, titulo), ...campos);
const dupla = (...campos) => el('div', { class: 'linha-campos linha-campos--iguais' }, ...campos);

function camposDe(tipo, ctx, valor) {
  const { abas, v } = ctx;
  const entrada = (nome, extras = {}) => el('input', { class: 'campo', name: nome, value: valor(nome), maxlength: 300, ...extras });
  const lista = (nome, itens, vazio, atual = valor(nome)) => el('select', { class: 'campo', name: nome },
    vazio ? el('option', { value: '' }, vazio) : null, opcoes(itens, atual));
  const area = (nome, n = 600) => el('textarea', { class: 'campo', name: nome, rows: 2, maxlength: n }, valor(nome));
  const cidades = [...new Set([...abas.Cidades.map((c) => c.Cidade), ...(valor('Cidade') ? [valor('Cidade')] : [])])];
  const dias = (nome) => el('select', { class: 'campo', name: nome },
    el('option', { value: '' }, 'Sem dia'),
    [...(abas.Programacao || [])].map((d) => texto10(d.Data)).sort().map((d) => el('option', { value: d, selected: d === texto10(valor(nome)) }, dataLonga.format(data(d)))));

  if (tipo === 'gasto') {
    const aviso = el('span', { class: 'legenda', hidden: true }, 'Pagou uma reserva? Mude o status dela para "pago" em Hospedagens ou Viagem; assim o valor não conta duas vezes.');
    const categoria = el('select', { class: 'campo', name: 'Categoria', required: true, onchange: (e) => { aviso.hidden = !COM_RESERVA.includes(e.target.value); } },
      opcoes(abas.Orcamento.map((o) => o.Categoria), valor('Categoria') || 'Alimentação'));
    const rotuloCategoria = campo(etiqueta('Categoria', true), categoria);
    rotuloCategoria.append(aviso);
    const quem = PESSOAS(v);
    return [
      grupo('O gasto',
        campo(etiqueta('Descrição', true), entrada('Descrição', { maxlength: 120, required: true, autocomplete: 'off' })),
        el('div', { class: 'linha-campos' },
          campo(etiqueta('Valor', true), entrada('Valor', { inputmode: 'decimal', pattern: '[0-9]+([,.][0-9]{1,2})?', required: true, value: valor('Valor').replace('.', ',') })),
          campo(etiqueta('Moeda', true), lista('Moeda', ['£', 'R$'], null, valor('Moeda') || '£'))),
        dupla(
          campo(etiqueta('Data', true), entrada('Data', { type: 'date', required: true, value: texto10(valor('Data')) || hojeISO() })),
          rotuloCategoria)),
      grupo('Mais detalhes',
        dupla(
          campo(etiqueta('Cidade ou local'), lista('Cidade', cidades, 'Sem cidade')),
          campo(etiqueta('Forma de pagamento'), lista('Forma de pagamento', PAGAMENTOS, 'Não informar'))),
        campo(etiqueta('Quem pagou'), lista('Quem pagou', quem, 'Não informar', valor('Quem pagou') || pessoa.obter())),
        campo(etiqueta('Observações'), area('Observações'))),
    ];
  }
  if (tipo === 'nota') {
    return [grupo('A nota',
      campo(etiqueta('Texto', true), el('textarea', { class: 'campo', name: 'Texto livre', rows: 5, maxlength: 2000, required: true }, valor('Texto livre'))),
      dupla(
        campo(etiqueta('Cidade ou tópico'), lista('Cidade/Tópico', ['Geral', ...abas.Cidades.map((c) => c.Cidade)], null, valor('Cidade/Tópico') || 'Geral')),
        campo(etiqueta('Autor'), lista('Autor', PESSOAS(v), 'Não informar', valor('Autor') || pessoa.obter()))))];
  }
  const restaurante = tipo === 'restaurante';
  const status = restaurante ? STATUS_RESTAURANTE : STATUS_ATRACAO;
  const statusAtual = valor('Status');
  const nomeDia = restaurante ? 'Dia' : 'Dia sugerido';
  return [
    grupo(restaurante ? 'O restaurante' : 'A atração',
      campo(etiqueta('Nome', true), entrada('Nome', { maxlength: 120, required: true, autocomplete: 'off' })),
      el('p', { class: 'legenda' }, 'Só o nome é obrigatório. Salve o que souber: o que faltar fica marcado para completar depois.'),
      restaurante ? dupla(
        campo(etiqueta('Culinária'), entrada('Culinária', { maxlength: 60 })),
        campo(etiqueta('Faixa de preço'), lista('Faixa de preço', FAIXAS, 'Não sei'))) : null),
    grupo('Onde',
      campo(etiqueta('Cidade'), lista('Cidade', cidades, 'Ainda não sei')),
      campo(etiqueta(restaurante ? 'Endereço' : 'Endereço ou localização'), entrada('Endereço')),
      campo(etiqueta(restaurante ? 'Link do restaurante' : 'Link ou fonte'), entrada('Link', { inputmode: 'url', maxlength: 500, placeholder: 'https://' }))),
    grupo('Na viagem',
      dupla(
        campo(etiqueta('Dia do roteiro'), dias(nomeDia)),
        campo(etiqueta('Status', true), lista('Status', [...status, ...(statusAtual && !status.includes(statusAtual) ? [statusAtual] : [])], null, statusAtual || 'a decidir'))),
      restaurante ? null : dupla(
        campo(etiqueta('Horário'), entrada('Horário', { maxlength: 80 })),
        campo(etiqueta('Reserva necessária'), lista('Reserva necessária', RESERVA, 'Não sei'))),
      restaurante ? null : campo(etiqueta('Preço (£)'), entrada('Preço (£)', { inputmode: 'decimal', pattern: '[0-9]+([,.][0-9]{1,2})?', value: valor('Preço (£)') ? valor('Preço (£)').replace('.', ',') : '' }))),
    grupo('Anotações',
      restaurante ? null : campo(etiqueta('Descrição'), area('Descrição')),
      campo(etiqueta('Observações'), area('Observações')),
      campo(etiqueta('Algo a confirmar'), entrada('A confirmar', { placeholder: 'Ex.: abre em março?' }))),
  ];
}

// ---------------------------------------------------------------- etapa 2: formulário

let sucesso = null;

function paginaFormulario(ctx, tipo, id, cidadeInicial) {
  const cfg = TIPOS[tipo];
  const atual = id ? (ctx.abas[cfg.aba] || []).find((l) => String(l.ID) === String(id)) : null;
  if (id && !atual) {
    return el('section', { class: 'secao' }, el('div', { class: 'conteudo' },
      cabecalho('Registrar', 'Registro não encontrado.', 'Ele pode ter sido apagado na planilha.'),
      el('a', { class: 'pill', href: '#registrar' }, 'Voltar a Registrar')));
  }
  const salvo = atual ? null : rascunho.ler(tipo);
  const valor = (k) => {
    if (atual) return String(atual[k] ?? '');
    if (salvo && salvo[k] != null) return String(salvo[k]);
    return k === 'Cidade' && cidadeInicial ? cidadeInicial : '';
  };
  const aviso = el('p', { class: 'status-pendente', role: 'alert', hidden: true });
  const mostrar = (t) => { aviso.textContent = t; aviso.hidden = false; aviso.scrollIntoView({ block: 'nearest' }); };
  const salvar = el('button', { class: 'pill pill--azul', type: 'submit' }, atual ? 'Salvar alterações' : 'Salvar');
  let insistir = false;

  const enviar = async (fd) => {
    const dados = Object.fromEntries(fd);
    Object.keys(dados).forEach((k) => { if (typeof dados[k] === 'string') dados[k] = dados[k].trim(); });
    aviso.hidden = true;
    if (dados.Link && !linkSeguro(dados.Link)) dados.Link = 'https://' + dados.Link.replace(/^\/+/, '');
    if ('Valor' in dados) dados.Valor = Number(dados.Valor.replace(',', '.'));
    if (dados['Preço (£)']) dados['Preço (£)'] = Number(dados['Preço (£)'].replace(',', '.'));
    if (dados['Quem pagou']) pessoa.definir(dados['Quem pagou']);
    if (dados.Autor) pessoa.definir(dados.Autor);

    if (cfg.chave === 'Nome') {
      const repetido = duplicado(ctx.abas, tipo, dados, atual && atual.ID);
      if (repetido) return mostrar(`"${dados.Nome}" já está registrado${repetido.Cidade ? ` em ${repetido.Cidade}` : ''}. Para mudar algo, edite o registro existente.`);
    }
    // Dois cafés iguais no mesmo dia podem ser reais: o gasto repetido só pede confirmação.
    if (tipo === 'gasto' && !insistir) {
      const igual = (ctx.abas.Gastos || []).find((g) => String(g.ID) !== String(atual && atual.ID) && texto10(g.Data) === dados.Data
        && norm(g['Descrição']) === norm(dados['Descrição']) && Number(g.Valor) === dados.Valor && g.Moeda === dados.Moeda);
      if (igual) {
        insistir = true;
        salvar.textContent = 'Salvar mesmo assim';
        return mostrar('Já existe um gasto igual neste dia. Se for outro gasto, toque em "Salvar mesmo assim".');
      }
    }
    if (!atual && tipo !== 'gasto' && tipo !== 'nota') dados.Origem = 'Site';

    // Na edição só vão os campos alterados: o que mudou na planilha em outro campo não é apagado.
    let envio = dados;
    if (atual) {
      envio = {};
      Object.keys(dados).forEach((k) => {
        const antes = atual[k] ?? '';
        const igual = /^\d{4}-\d{2}-\d{2}/.test(String(antes)) ? texto10(antes) === dados[k] : String(antes) === String(dados[k]);
        if (!igual) envio[k] = dados[k];
      });
      if (!Object.keys(envio).length) { location.hash = '#registrar'; return undefined; }
    }
    salvar.disabled = true;
    salvar.textContent = 'Salvando…';
    const op = atual ? { acao: 'atualizar', aba: cfg.aba, id: atual.ID, dados: envio } : { acao: 'adicionar', aba: cfg.aba, dados };
    const r = await ctx.salvar(op, atual ? 'Alterações salvas na planilha.' : `${cfg.nome} salvo na planilha.`.replace('Atração salvo', 'Atração salva').replace('Nota salvo', 'Nota salva'), mostrar);
    salvar.disabled = false;
    salvar.textContent = atual ? 'Salvar alterações' : 'Salvar';
    if (!r) return undefined;
    rascunho.limpar(tipo);
    sucesso = { tipo, titulo: dados[cfg.chave] || (atual && atual[cfg.chave]), cidade: dados.Cidade || dados['Cidade/Tópico'] || (atual && atual.Cidade) || '', enfileirado: r.enfileirado, id: atual ? atual.ID : r.id, editado: Boolean(atual) };
    location.hash = '#registrar/salvo';
    return undefined;
  };

  let confirmar = false;
  const remover = atual ? el('button', { class: 'link-botao link-botao--alerta', type: 'button', onclick: async (e) => {
    if (!confirmar) { confirmar = true; e.target.textContent = 'Confirmar remoção'; return; }
    const r = await ctx.salvar({ acao: 'remover', aba: cfg.aba, id: atual.ID, dados: {} }, 'Registro removido.', mostrar);
    if (r) location.hash = '#registrar';
  } }, 'Remover') : null;

  const cancelar = el('a', { class: 'pill', href: '#registrar', onclick: () => rascunho.limpar(tipo) }, 'Cancelar');
  const f = form(enviar, ...camposDe(tipo, ctx, valor), aviso, el('div', { class: 'registrar__acoes' }, salvar, cancelar, remover));
  f.classList.add('formulario--registrar');
  if (!atual) {
    f.addEventListener('input', () => rascunho.gravar(tipo, Object.fromEntries(new FormData(f))));
    f.addEventListener('change', () => rascunho.gravar(tipo, Object.fromEntries(new FormData(f))));
  }
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo registrar registrar--entrada' },
    el('a', { class: 'registrar__voltar', href: '#registrar' }, atual ? '← Voltar a Registrar' : '← Escolher outro tipo'),
    cabecalho(atual ? 'Registrar · Edição' : 'Registrar · Etapa 2 de 2', atual ? (atual[cfg.chave] ? String(atual[cfg.chave]).slice(0, 60) : cfg.nome) + '.' : cfg.novo + '.', salvo && Object.values(salvo).some((x) => x) ? 'Recuperamos o que você tinha digitado.' : cfg.descricao),
    f));
}

// ---------------------------------------------------------------- depois de salvar

function paginaSalvo(ctx) {
  if (!sucesso) { location.replace('#registrar'); return el('div', {}); }
  const s = sucesso;
  const cfg = TIPOS[s.tipo];
  const naCidade = s.cidade && ctx.abas.Cidades.some((c) => c.Cidade === s.cidade);
  const destino = s.tipo === 'gasto' ? ['#orcamento', 'Ver no orçamento'] : naCidade ? [`#cidade/${slug(s.cidade)}`, `Ver em ${s.cidade}`] : null;
  return el('section', { class: 'secao' }, el('div', { class: 'conteudo registrar registrar--entrada' },
    cabecalho('Registrar', s.enfileirado ? 'Salvo no aparelho.' : 'Salvo.',
      s.enfileirado
        ? `${cfg.nome}: ${s.titulo}. Sem sinal agora: vai para a planilha assim que a conexão voltar.`
        : `${cfg.nome}: ${s.titulo}. ${s.editado ? 'As alterações já estão' : 'Já está'} na planilha.`),
    el('div', { class: 'registrar__acoes' },
      destino ? el('a', { class: 'pill pill--azul', href: destino[0] }, destino[1]) : null,
      el('a', { class: 'pill', href: `#registrar/${s.tipo}` }, 'Registrar outro'),
      el('a', { class: 'pill', href: '#registrar' }, 'Voltar a Registrar'))));
}

// ---------------------------------------------------------------- etapa 1: escolher o tipo

function resumoGasto(g, ctx) {
  const cot = Number(ctx.v.cotacao_gbp_brl) || 0;
  const valor = g.Moeda === '£' ? gbp.format(g.Valor) : brl2.format(valorBRL(g, cot));
  return [valor, g.Data ? dataLonga.format(data(g.Data)) : null, g.Cidade, g.Categoria].filter(Boolean).join(' · ');
}

function linhaRegistro(tipo, l, ctx) {
  const falta = tipo === 'atracao' || tipo === 'restaurante' ? pendencias(l, tipo) : [];
  const meta = tipo === 'gasto' ? resumoGasto(l, ctx) : [TIPOS[tipo].nome, l.Cidade || l['Cidade/Tópico'], l.Status].filter(Boolean).join(' · ');
  const titulo = String(l[TIPOS[tipo].chave] || '').slice(0, 80);
  return el('li', { class: 'registro', 'data-subir': true },
    el('div', { class: 'registro__texto' },
      el('p', { class: 'atracao__nome' }, titulo),
      el('p', { class: 'legenda' }, meta),
      falta.length ? el('p', { class: 'status-pendente' }, `⚠️ Falta: ${falta.join(', ')}`) : null,
      l['A confirmar'] ? el('p', { class: 'status-pendente' }, `⚠️ A confirmar: ${l['A confirmar']}`) : null),
    el('a', { class: 'pill', href: `#registrar/${tipo}/${encodeURIComponent(l.ID)}` }, falta.length || l['A confirmar'] ? 'Completar' : 'Editar'));
}

function paginaEscolha(ctx) {
  const { abas } = ctx;
  const doSite = [
    ...atracoesDoSite(abas).map((l) => ['atracao', l]),
    ...restaurantes(abas).map((l) => ['restaurante', l]),
  ];
  const aCompletar = doSite.filter(([t, l]) => pendencias(l, t).length || l['A confirmar']);
  const quando = (l) => String(l['Atualizado em'] || l['Criado em'] || l.Data || '');
  const recentes = [
    ...doSite.filter((x) => !aCompletar.includes(x)),
    ...(abas.Gastos || []).map((l) => ['gasto', l]),
    ...(abas.Notas || []).map((l) => ['nota', l]),
  ].sort((a, b) => quando(b[1]).localeCompare(quando(a[1]))).slice(0, 8);

  return el('div', {},
    el('section', { class: 'secao' }, el('div', { class: 'conteudo registrar' },
      cabecalho('Registrar · Etapa 1 de 2', 'O que você quer registrar?', 'Escolha o tipo e preencha só o que importa. Tudo vai para a planilha da viagem.'),
      el('div', { class: 'escolhas' }, Object.entries(TIPOS).map(([chave, t]) => el('a', { class: 'escolha', href: `#registrar/${chave}`, 'data-subir': true },
        el('span', { class: 'escolha__nome' }, t.nome),
        el('span', { class: 'legenda' }, t.descricao),
        el('span', { class: 'escolha__seta', 'aria-hidden': 'true' }, '→')))))),
    aCompletar.length ? el('section', { class: 'secao secao--mist' }, el('div', { class: 'conteudo registrar' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'A completar.'),
      el('p', { class: 'status-pendente espaco-abaixo' }, `⚠️ ${aCompletar.length} ${aCompletar.length === 1 ? 'registro com informação pendente' : 'registros com informação pendente'}`),
      el('ul', { class: 'lista' }, aCompletar.map(([t, l]) => linhaRegistro(t, l, ctx))))) : null,
    recentes.length ? el('section', { class: `secao${aCompletar.length ? '' : ' secao--mist'}` }, el('div', { class: 'conteudo registrar' },
      el('h2', { class: 'titulo', 'data-revelar': true }, 'Últimos registros.'),
      el('ul', { class: 'lista' }, recentes.map(([t, l]) => linhaRegistro(t, l, ctx))))) : null);
}

// tipo: gasto, atracao, restaurante ou nota; extra: ID (edição) ou "em-<cidade>" (novo, já com a cidade).
export function paginaRegistrar(ctx, tipo, extra) {
  if (tipo === 'salvo') return paginaSalvo(ctx);
  if (!tipo || !TIPOS[tipo]) return paginaEscolha(ctx);
  if (extra && extra.startsWith('em-')) {
    const c = ctx.abas.Cidades.find((x) => slug(x.Cidade) === extra.slice(3));
    return paginaFormulario(ctx, tipo, null, c && c.Cidade);
  }
  return paginaFormulario(ctx, tipo, extra ? decodeURIComponent(extra) : null);
}
