/**
 * Portal Escócia 2027 — criação da planilha "Portal Escócia 2027 - Dados".
 *
 * Como usar (uma vez):
 *   1. Crie uma planilha em branco no Google Drive.
 *   2. Extensões → Apps Script → cole este arquivo inteiro → salve.
 *   3. Escolha a função `criarPlanilha` e clique em Executar; autorize o acesso.
 *
 * O script só cria abas que ainda não existem: rodar de novo não apaga dados.
 * Para recriar uma aba do zero, apague-a na planilha e execute novamente.
 * Fonte dos dados: notas do vault (Efforts/Escócia 2027), pesquisa de 18/10/2026.
 */

// Tokens da Identidade Visual iPhone Duo usados na planilha.
const COR = {
  galleryWhite: '#ffffff',
  studioMist: '#f5f5f7',
  hairline: '#d6d6d6',
  ink: '#1d1d1f',
  slate: '#707070',
  appleBlue: '#0066cc',
  launchOrange: '#b64400',
};
const FONTE = 'Inter';

const NOME_PLANILHA = 'Portal Escócia 2027 - Dados';
const VERIFICADO = d(18, 10, 2026);
const PESSOAS = ['Arthur', 'Arlon', 'Luciane'];

// Datas ao meio-dia evitam troca de dia por fuso horário.
function d(dia, mes, ano) {
  return new Date(ano || 2027, mes - 1, dia, 12);
}

function maps(consulta) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(consulta);
}

function nota(cidade) {
  return 'obsidian://open?vault=' + encodeURIComponent("Arthur's Ideaverse") +
    '&file=' + encodeURIComponent('Efforts/Escócia 2027/Cidades/' + cidade);
}

// ---------------------------------------------------------------- abas

const ABAS = [
  {
    nome: 'Viagem',
    colunas: ['Chave', 'Valor', 'Observação'],
    larguras: [200, 220, 420],
    texto: [1],
    linhas: [
      ['nome_portal', 'Escócia 2027', 'Nome e ícone da tela inicial do celular'],
      ['inicio', d(23, 2), 'Embarque no Brasil (voo 11:05)'],
      ['chegada_escocia', d(24, 2), 'Chegada a Edimburgo 12:00, horário local'],
      ['saida_escocia', d(8, 3), 'Voo de volta 17:30'],
      ['fim', d(9, 3), 'Chegada ao Brasil 10:20'],
      ['noites', 12, 'Soma das hospedagens'],
      ['viajantes', 'Arthur, Arlon e Luciane', '3 adultos'],
      ['cotacao_gbp_brl', 7, 'Manual: R$ por £1. Atualize perto da viagem'],
      ['data_verificacao', VERIFICADO, 'Data da pesquisa dos dados voláteis (preços, horários)'],
      ['fuso', 'GMT (Brasília + 3 h)', 'Horário de verão britânico só começa em 28/03/2027'],
    ],
    datasNaColunaB: true,
  },
  {
    nome: 'Roteiro',
    colunas: ['Ordem', 'Data', 'Cidade visitada', 'Dormida em', 'Deslocamento', 'Distância', 'Tempo', 'Observações', 'Link Maps'],
    larguras: [60, 100, 140, 140, 110, 120, 140, 420, 120],
    texto: [6, 7],
    linhas: [
      [1, d(24, 2), 'Edimburgo', 'Edimburgo', 'Avião', '', '', 'Chegada 12:00 ao aeroporto (EDI). Hospedagem de 24 a 27/02', maps('Edinburgh')],
      [2, d(26, 2), 'St Andrews', 'Edimburgo', 'Carro', '~80 km', '~1 h 15', 'Bate-volta com o carro do aluguel 1, devolvido em Edimburgo à noite', maps('Edinburgh to St Andrews')],
      [3, d(27, 2), 'Glasgow', 'Glasgow', 'Trem', '', '~50 a 55 min', 'Waverley → Queen Street; passagem no dia ou no app ScotRail', maps('Glasgow Queen Street station')],
      [4, d(1, 3), 'Glencoe', 'Fort William', 'Carro', '', '~2 h', 'Retirar o carro do aluguel 2 em Glasgow; A82 por Loch Lomond e Rannoch Moor; abastecer em Tyndrum', maps('Glasgow to Glencoe Visitor Centre')],
      [5, d(1, 3), 'Fort William', 'Fort William', 'Carro', '~25 a 40 km', '~30 a 40 min', 'Chegar ainda com luz (~16:30 a 17:00)', maps('Glencoe to Fort William')],
      [6, d(2, 3), 'Isle of Skye', 'Isle of Skye', 'Carro', '', '', 'Pela Skye Bridge (não pela balsa de Mallaig); terminar antes de escurecer (~17:50). Eilean Donan fica no caminho', maps('Fort William to Portree via Skye Bridge')],
      [7, d(4, 3), 'Inverness', 'Inverness', 'Carro', '~170 km', '~2 h 45 a 3 h', 'Devolver o carro do aluguel 2 em Inverness (one-way)', maps('Portree to Inverness')],
      [8, d(6, 3), 'Edimburgo', 'Edimburgo', 'Trem', '', '~3 h 15 a 3 h 45', 'Highland Main Line até Waverley; evitar o último trem do dia. Hospedagem de 06 a 08/03', maps('Inverness station to Edinburgh Waverley')],
    ],
    formatos: { B: 'dd/mm/yyyy' },
  },
  {
    nome: 'Passagens',
    colunas: ['Trecho', 'Data', 'Saída', 'Chegada', 'Status', 'Valor (R$)', 'Chegada (data)', 'Observações'],
    larguras: [90, 100, 80, 80, 110, 110, 120, 360],
    texto: [3, 4],
    linhas: [
      ['Ida', d(23, 2), '11:05', '12:00', 'pago', 16000, d(24, 2), 'Valor total estimado de ida e volta (~R$ 16.000); separar por trecho se souber'],
      ['Volta', d(8, 3), '17:30', '10:20', 'pago', '', d(9, 3), 'Valor incluído na linha da ida'],
    ],
    formatos: { B: 'dd/mm/yyyy', G: 'dd/mm/yyyy', F: '"R$" #,##0' },
    validacoes: { E: ['pesquisando', 'reservado', 'pago'] },
  },
  {
    nome: 'Hospedagens',
    colunas: ['ID', 'Cidade', 'Nome', 'Entrada', 'Saída', 'Noites', 'Valor (R$)', 'Status', 'Link', 'Observações', 'Verificado em'],
    larguras: [60, 120, 220, 100, 100, 70, 110, 110, 200, 360, 110],
    linhas: [
      ['H01', 'Edimburgo', 'Moxy Edinburgh', d(24, 2), d(27, 2), '', 2498, 'pesquisando', '', 'Inclui o bate-volta a St Andrews (26/02). Taxa turística de 5%', d(15, 9, 2026)],
      ['H02', 'Glasgow', 'Moxy Glasgow SEC', d(27, 2), d(1, 3), '', 1553, 'pesquisando', '', 'Sem carro no fim de semana', d(15, 9, 2026)],
      ['H03', 'Fort William', 'Lime Tree Hotel', d(1, 3), d(2, 3), '', 1045, 'pesquisando', '', 'Inclui o Glencoe (01/03). ⚠️ Reservar cedo', d(15, 9, 2026)],
      ['H04', 'Isle of Skye', 'A definir', d(2, 3), d(4, 3), '', 2599, 'pesquisando', '', '⚠️ Reservar cedo: pouca oferta no inverno', d(15, 9, 2026)],
      ['H05', 'Inverness', 'B&B HOTEL Inverness', d(4, 3), d(6, 3), '', 1423, 'pesquisando', '', 'Opção 1 (escolher entre H05 e H06; marcar a outra como descartado)', d(15, 9, 2026)],
      ['H06', 'Inverness', 'The Royal Highland Hotel', d(4, 3), d(6, 3), '', 1899, 'pesquisando', '', 'Opção 2', d(15, 9, 2026)],
      ['H07', 'Edimburgo', 'Moxy Edinburgh', d(6, 3), d(8, 3), '', 2217, 'pesquisando', '', '⚠️ Rúgbi Escócia x Irlanda em 05/03: reservar logo', d(15, 9, 2026)],
    ],
    formatos: { D: 'dd/mm/yyyy', E: 'dd/mm/yyyy', F: '0', G: '"R$" #,##0', K: 'dd/mm/yyyy' },
    validacoes: { H: ['pesquisando', 'reservado', 'pago', 'descartado'] },
    formulas: { F2: '=ARRAYFORMULA(IF(D2:D1000="","",E2:E1000-D2:D1000))' },
  },
  {
    nome: 'Transportes',
    colunas: ['ID', 'Tipo', 'Trecho', 'Data', 'Valor (R$)', 'Status', 'Observações', 'Verificado em'],
    larguras: [60, 80, 300, 100, 110, 110, 420, 110],
    linhas: [
      ['T01', 'Carro', 'Aluguel 1: Edimburgo → St Andrews → Edimburgo', d(26, 2), '', 'pesquisando', 'Retirar de manhã e devolver à noite em Edimburgo; confirmar horário da agência. Valor a cotar', VERIFICADO],
      ['T02', 'Trem', 'Edinburgh Waverley → Glasgow Queen Street', d(27, 2), 350, 'pesquisando', 'A partir de ~£12 por pessoa; não precisa reservar', VERIFICADO],
      ['T03', 'Carro', 'Aluguel 2: Glasgow → Inverness (one-way)', d(1, 3), '', 'pesquisando', 'Automático, porta-malas para 3 adultos; devolução 04/03 em Inverness; taxa one-way, LEZ e CNH a confirmar. Valor a cotar', VERIFICADO],
      ['T04', 'Trem', 'Inverness → Edinburgh Waverley', d(6, 3), 1000, 'pesquisando', 'Venda abre ~12 semanas antes (≈ 12/12/2026); tarifa Advance a partir de ~£15', VERIFICADO],
    ],
    formatos: { D: 'dd/mm/yyyy', E: '"R$" #,##0', H: 'dd/mm/yyyy' },
    validacoes: { B: ['Carro', 'Trem', 'Outro'], F: ['pesquisando', 'reservado', 'pago'] },
  },
  {
    nome: 'Orcamento',
    colunas: ['Categoria', 'Descrição', 'Previsto (R$)', 'Reservado/Pago (R$)', 'Real (R$)'],
    larguras: [180, 360, 120, 150, 110],
    linhas: [
      ['Passagens', 'Passagens aéreas', 16000, pago('Passagens', 'F', 'E'), real(2)],
      ['Hospedagem', 'Hospedagens (12 noites)', 11550, pago('Hospedagens', 'G', 'H'), real(3)],
      ['Transporte - carro', 'Aluguel de carro (2 aluguéis), combustível, estacionamento', 1650, pagoTipo('Carro'), real(4)],
      ['Transporte - trem', 'Trens Edimburgo/Glasgow (~350) e Inverness/Edimburgo (~1.000)', 1350, pagoTipo('Trem'), real(5)],
      ['Alimentação', 'Estimativa diária', 13000, '', real(6)],
      ['Atrações e passes', 'HES Explorer Pass, ingressos (fora do orçamento original)', '', '', real(7)],
      ['Documentos', 'ETA ×3 (£20 cada) (fora do orçamento original)', '', '', real(8)],
      ['Seguro viagem', 'Seguro com cobertura médica e repatriação (fora do orçamento original)', '', '', real(9)],
      ['Compras', 'Lembranças e compras', '', '', real(10)],
      ['Outros', 'Imprevistos', '', '', real(11)],
    ],
    formatos: { C: '"R$" #,##0', D: '"R$" #,##0', E: '"R$" #,##0' },
  },
  {
    nome: 'Gastos',
    colunas: ['ID', 'Data', 'Cidade', 'Categoria', 'Descrição', 'Valor', 'Moeda', 'Valor em R$', 'Quem pagou', 'Atualizado em'],
    larguras: [60, 100, 120, 160, 300, 90, 70, 110, 110, 140],
    linhas: [],
    formatos: { B: 'dd/mm/yyyy', F: '#,##0.00', H: '"R$" #,##0.00', J: 'dd/mm/yyyy hh:mm' },
    validacoes: { G: ['£', 'R$'], I: PESSOAS },
    validacaoIntervalo: { D: 'Orcamento!A2:A' },
    formulas: { H2: '=ARRAYFORMULA(IF(F2:F1000="","",IF(G2:G1000="£",F2:F1000*cotacao,F2:F1000)))' },
  },
  {
    nome: 'Cidades',
    colunas: ['Cidade', 'Resumo', 'Dicas', 'Clima/luz', 'Link da nota no vault', 'Imagem'],
    larguras: [120, 380, 420, 320, 200, 140],
    linhas: [
      ['Edimburgo', 'Capital compacta e muito a pé: Old Town medieval (Castelo, Royal Mile) e New Town georgiana. Base de 24 a 27/02 (com bate-volta a St Andrews) e de 06 a 08/03.', 'Reservar Castelo, Holyroodhouse e Britannia. Museus gratuitos para dias de chuva. Carro atrapalha (LEZ e estacionamento caro). Rúgbi Escócia x Irlanda em 05/03 lota a cidade; Mothering Sunday em 07/03.', 'Máx. 6 a 8 °C, mín. 0 a 2 °C, ~15 a 18 dias de chuva. Luz de ~07:20–17:35 (23/02) a ~06:45–18:00 (08/03).', nota('Edimburgo'), ''],
      ['St Andrews', 'Cidade universitária medieval à beira do Mar do Norte, a "casa do golfe". Bate-volta de carro a partir de Edimburgo em 26/02.', 'A catedral fecha de terça a quinta (26/02 é sexta: aberta). Castelo mais barato online. Estacionar e fazer tudo a pé. Vento forte na costa.', 'Máx. ~6 °C, mín. ~0 °C, ~15 dias de chuva. Pôr do sol ~17:30 a 17:45.', nota('St Andrews'), ''],
      ['Glasgow', 'Maior cidade da Escócia: arquitetura vitoriana, legado de Mackintosh, museus gratuitos e cena de pubs e música. De 27/02 a 01/03, sem carro.', 'Chegar de trem em Queen Street. Quase tudo é gratuito. LEZ 24 h. Barras no fim de semana. Atenção à noite.', 'Máx. ~6 °C, mín. ~0 °C, ~15 dias de chuva. Luz até ~17:50.', nota('Glasgow'), ''],
      ['Glencoe', 'Vale glacial mais cênico da A82 (Three Sisters, Buachaille Etive Mòr), palco do Massacre de 1692. Visita em 01/03, na ida de Glasgow para Fort William.', 'Centro de visitantes 09:30–16:00. Trilhas curtas (Signal Rock, Glencoe Lochan); pular o Lost Valley no inverno. Sinal de celular falho. Com chuva: mirantes de dentro do carro.', '0 a 6 °C no vale; chuva, sleet, neve e vento. Pôr do sol ~17:50.', nota('Glencoe'), ''],
      ['Fort William', 'Base aos pés do Ben Nevis; 1 noite (01/03) entre Glencoe e Skye.', 'Reservar o jantar. Abastecer antes de seguir para Skye. O trem Jacobite não opera em fev/mar. Ben Nevis só com equipamento de inverno.', 'Uma das cidades mais chuvosas do Reino Unido: máx. 5 a 6 °C, mín. -1 a 0 °C. Luz ~07:15–17:50.', nota('Fort William'), ''],
      ['Isle of Skye', 'Paisagem, trilhas curtas e estradas single-track. Chegada em 02/03, dia cheio em 03/03 e saída em 04/03.', 'Ir pela Skye Bridge. Priorizar Trotternish (Storr, Kilt Rock, Quiraing) ou o oeste (Fairy Pools, Talisker). Dunvegan fechado. Restaurantes fecham na baixa temporada. Abastecer em Broadford ou Portree.', 'Máx. 6 a 7 °C, mín. 1 a 2 °C, 19 a 23 dias de chuva, vento forte. Luz ~07:00–17:50.', nota('Isle of Skye'), ''],
      ['Inverness', 'Capital das Highlands. Base de 04 a 06/03, com dia cheio em 05/03 nos arredores (Culloden, Clava Cairns, Fort George, Loch Ness e Urquhart).', 'Quase tudo abre em março, fechando entre 16:00 e 18:00. Reservar Urquhart online. Devolver o carro antes do trem de 06/03.', '~1 a 7 °C, geada pela manhã, garoa. Luz ~06:50–17:55.', nota('Inverness'), ''],
    ],
  },
  {
    nome: 'Atracoes',
    colunas: ['ID', 'Cidade', 'Nome', 'Dia sugerido', 'Horário', 'Preço (£)', 'Reserva necessária', 'Status', 'Link Maps', 'Observações', 'Verificado em'],
    larguras: [60, 120, 260, 100, 220, 80, 130, 110, 120, 360, 110],
    texto: [5],
    linhas: atracoes(),
    formatos: { D: 'dd/mm/yyyy', F: '#,##0.00', K: 'dd/mm/yyyy' },
    validacoes: { G: ['Sim', 'Recomendado', 'Não'], H: ['a decidir', 'planejado', 'reservado', 'pago', 'visitado', 'descartado'] },
  },
  {
    nome: 'Checklist',
    colunas: ['ID', 'Item', 'Categoria', 'Prazo', 'Responsável', 'Status', 'Fonte', 'Atualizado em'],
    larguras: [60, 420, 130, 100, 110, 110, 260, 140],
    linhas: checklist(),
    formatos: { D: 'dd/mm/yyyy', H: 'dd/mm/yyyy hh:mm' },
    validacoes: { E: PESSOAS.concat(['Todos']), F: ['⚠️ pendente', 'feito'] },
  },
  {
    nome: 'Notas',
    colunas: ['ID', 'Cidade/Tópico', 'Texto livre', 'Autor', 'Data'],
    larguras: [60, 160, 520, 110, 140],
    linhas: [],
    formatos: { E: 'dd/mm/yyyy hh:mm' },
    validacoes: { D: PESSOAS },
  },
];

// Reservado/Pago = soma dos valores com status "reservado" ou "pago".
function pago(aba, colValor, colStatus) {
  return '=SUMIFS(' + aba + '!' + colValor + ':' + colValor + ',' + aba + '!' + colStatus + ':' + colStatus + ',"reservado")' +
    '+SUMIFS(' + aba + '!' + colValor + ':' + colValor + ',' + aba + '!' + colStatus + ':' + colStatus + ',"pago")';
}

function pagoTipo(tipo) {
  return '=SUMIFS(Transportes!E:E,Transportes!B:B,"' + tipo + '",Transportes!F:F,"reservado")' +
    '+SUMIFS(Transportes!E:E,Transportes!B:B,"' + tipo + '",Transportes!F:F,"pago")';
}

// Real = gastos lançados na aba Gastos com a mesma categoria.
function real(linha) {
  return '=SUMIFS(Gastos!H:H,Gastos!D:D,A' + linha + ')';
}

function atracoes() {
  const lista = [
    // cidade, nome, dia, horário, preço £, reserva, consulta Maps, observação
    ['Edimburgo', 'Castelo de Edimburgo', d(24, 2), '09:30–17:00 (última entrada 16:00)', 23.5, 'Sim', 'Edinburgh Castle', '£26 na hora. Ativar o HES Explorer Pass aqui. Tiro do canhão 13:00, exceto domingo'],
    ['Edimburgo', 'Royal Mile, St Giles\' e Greyfriars', d(24, 2), 'Livre', 0, 'Não', 'Royal Mile Edinburgh', 'St Giles\' aceita doação'],
    ['Edimburgo', 'Palácio de Holyroodhouse', d(25, 2), '09:30–16:30 (última admissão 15:15)', 22, 'Sim', 'Palace of Holyroodhouse', 'Pode fechar sem aviso. Não coberto pelo Explorer Pass'],
    ['Edimburgo', 'Museu Nacional da Escócia', d(25, 2), '10:00–17:00', 0, 'Não', 'National Museum of Scotland', 'Ótimo plano de chuva'],
    ['Edimburgo', 'Victoria Street e Grassmarket', d(25, 2), 'Livre', 0, 'Não', 'Victoria Street Edinburgh', ''],
    ['Edimburgo', 'Royal Yacht Britannia', d(7, 3), '10:00–17:00 (última entrada 15:00)', 22, 'Recomendado', 'Royal Yacht Britannia', '£24 na hora. Em Leith'],
    ['Edimburgo', 'Dean Village e Water of Leith', d(7, 3), 'Livre', 0, 'Não', 'Dean Village Edinburgh', ''],
    ['Edimburgo', 'Calton Hill', d(7, 3), 'Livre', 0, 'Não', 'Calton Hill', 'Bom para o pôr do sol; ventoso'],
    ['Edimburgo', 'Arthur\'s Seat (Holyrood Park)', d(8, 3), 'Livre', 0, 'Não', 'Arthur\'s Seat', 'Só com tempo firme; 2 a 3 h. Confirmar status da Radical Road'],
    ['St Andrews', 'Catedral de St Andrews', d(26, 2), 'Seg, sex, sáb e dom 10:00–16:00; fechada ter–qui', 0, 'Não', 'St Andrews Cathedral', 'Ruínas e tours gratuitos'],
    ['St Andrews', 'Castelo de St Andrews', d(26, 2), '10:00–16:00 (última entrada 15:15)', 10, 'Recomendado', 'St Andrews Castle', '£11 no local. Coberto pelo Explorer Pass'],
    ['St Andrews', 'Old Course e Swilcan Bridge', d(26, 2), 'Livre (campo fecha aos domingos)', 0, 'Não', 'Swilcan Bridge St Andrews', ''],
    ['St Andrews', 'West Sands', d(26, 2), 'Livre', 0, 'Não', 'West Sands St Andrews', 'Vento forte e frio'],
    ['St Andrews', 'East Sands e Pier Walk', d(26, 2), 'Livre', 0, 'Não', 'St Andrews Pier', 'Piso escorregadio'],
    ['Glasgow', 'Catedral de Glasgow', d(27, 2), 'Seg–sáb 10:00–16:00 (fecha 12:30–13:30); dom a partir de 13:00', 0, 'Recomendado', 'Glasgow Cathedral', 'Gratuita (doação)'],
    ['Glasgow', 'Necrópole', d(27, 2), '~07:00–16:30', 0, 'Não', 'Glasgow Necropolis', 'Terreno irregular e enlameado'],
    ['Glasgow', 'Mackintosh at the Willow', d(27, 2), 'Exposição 10:00–17:00; salão de chá 11:00–17:00', 10, 'Sim', 'Mackintosh at the Willow', 'Visita guiada às 10:00 e 11:00, máx. 6 pessoas'],
    ['Glasgow', 'Murais do centro (Mural Trail)', d(27, 2), 'Livre', 0, 'Não', 'City Centre Mural Trail Glasgow', ''],
    ['Glasgow', 'Kelvingrove Art Gallery & Museum', d(28, 2), 'Dom 11:00–17:00', 0, 'Não', 'Kelvingrove Art Gallery and Museum', 'Gratuito (doação)'],
    ['Glasgow', 'Riverside Museum', d(28, 2), 'Dom 11:00–17:00', 0, 'Não', 'Riverside Museum Glasgow', 'Gratuito'],
    ['Glasgow', 'Mercado The Barras', d(28, 2), 'Sáb e dom 10:00–16:00', 0, 'Não', 'The Barras Market Glasgow', 'Atenção a bolsos'],
    ['Glencoe', 'Rannoch Moor e Buachaille Etive Mòr', d(1, 3), 'Mirantes da A82', 0, 'Não', 'Buachaille Etive Mor viewpoint', 'Risco de gelo e neve'],
    ['Glencoe', 'Three Sisters (mirante)', d(1, 3), 'Livre', 0, 'Não', 'Three Sisters viewpoint Glencoe', 'Ao lado da Meeting of Three Waters'],
    ['Glencoe', 'Glencoe Visitor Centre (NTS)', d(1, 3), '09:30–16:00', 0, 'Não', 'Glencoe Visitor Centre', 'Gratuito; filme, exposição e café'],
    ['Glencoe', 'Signal Rock ou Glencoe Lochan', d(1, 3), 'Livre', 0, 'Não', 'Glencoe Lochan', 'Trilhas curtas e seguras no inverno'],
    ['Fort William', 'Neptune\'s Staircase', d(2, 3), 'Livre', 0, 'Não', 'Neptune\'s Staircase Banavie', 'Parada rápida com vista do Ben Nevis'],
    ['Fort William', 'Glen Nevis e Steall Falls', d(2, 3), 'Livre', 0, 'Não', 'Steall Falls car park', 'Só se der tempo antes de Skye; trilha escorregadia'],
    ['Isle of Skye', 'Eilean Donan Castle', d(2, 3), '10:00–16:00 (última entrada 15:00) em 2026', 13, 'Não', 'Eilean Donan Castle', 'No caminho para a Skye Bridge; venda só no local; horário de 2027 a confirmar'],
    ['Isle of Skye', 'Sligachan', d(2, 3), 'Livre', 0, 'Não', 'Sligachan Old Bridge', 'Vista dos Cuillins'],
    ['Isle of Skye', 'Old Man of Storr', d(3, 3), 'Livre', 0, 'Não', 'Old Man of Storr car park', 'Fazer cedo; estacionamento pago'],
    ['Isle of Skye', 'Kilt Rock e Mealt Falls', d(3, 3), 'Livre', 0, 'Não', 'Kilt Rock viewpoint', ''],
    ['Isle of Skye', 'Quiraing', d(3, 3), 'Livre', 0, 'Não', 'Quiraing car park', 'Estrada estreita, sujeita a gelo'],
    ['Isle of Skye', 'Fairy Glen', d(3, 3), 'Livre', 0, 'Não', 'Fairy Glen Uig', ''],
    ['Isle of Skye', 'Fairy Pools', d(3, 3), 'Livre', 0, 'Não', 'Fairy Pools car park', 'Alternativa ao norte: escolher Trotternish ou o oeste'],
    ['Isle of Skye', 'Talisker Distillery', d(3, 3), '10:00–16:30 (inverno; março a confirmar)', 22, 'Recomendado', 'Talisker Distillery', 'O motorista não bebe'],
    ['Isle of Skye', 'Portree', d(3, 3), 'Livre', 0, 'Não', 'Portree harbour', 'Fim do dia'],
    ['Inverness', 'Ness Islands', d(4, 3), 'Livre', 0, 'Não', 'Ness Islands Inverness', ''],
    ['Inverness', 'Culloden Battlefield (NTS)', d(5, 3), '09:00–16:00 (março a confirmar)', 12.5, 'Não', 'Culloden Battlefield', 'Estacionamento £5'],
    ['Inverness', 'Clava Cairns', d(5, 3), 'Livre', 0, 'Não', 'Clava Cairns', 'Ao lado de Culloden'],
    ['Inverness', 'Fort George', d(5, 3), '10:00–16:00 (última entrada 15:00)', 10, 'Não', 'Fort George Ardersier', 'Coberto pelo Explorer Pass'],
    ['Inverness', 'Urquhart Castle (Loch Ness)', d(5, 3), '09:30–16:30 (última entrada 15:30)', 14, 'Sim', 'Urquhart Castle', '£16 no local; ingressos esgotam. Coberto pelo Explorer Pass'],
    ['Inverness', 'Inverness Castle Experience', d(5, 3), '10:00–18:00 (última entrada 16:00)', 20, 'Recomendado', 'Inverness Castle', '£22 no local'],
    ['Inverness', 'Leakey\'s Bookshop', d(6, 3), 'A confirmar', 0, 'Não', 'Leakey\'s Bookshop Inverness', 'Antes do trem'],
  ];
  return lista.map(function (a, i) {
    const id = 'A' + ('0' + (i + 1)).slice(-2);
    return [id, a[0], a[1], a[2], a[3], a[4], a[5], 'planejado', maps(a[6]), a[7], VERIFICADO];
  });
}

function checklist() {
  const fonte = 'Escócia 2027 › Reservas e coisas a fazer';
  const lista = [
    ['Reservar carro automático do aluguel 2 (Glasgow 01/03 → Inverness 04/03, one-way). Janela já aberta', 'Transporte', d(1, 12, 2026), fonte],
    ['Reservar carro do aluguel 1 (Edimburgo, 26/02)', 'Transporte', d(1, 12, 2026), 'St Andrews › Logística do carro'],
    ['Perguntar à locadora: CNH brasileira (física ou digital), PID, LEZ (Euro 4/6), taxa one-way, agências e horários', 'Transporte', d(1, 12, 2026), 'Escócia 2027 › Dirigir na Escócia'],
    ['Reservar hospedagem de Edimburgo 06 a 08/03 (rúgbi na sexta 05/03)', 'Hospedagem', d(15, 11, 2026), fonte],
    ['Reservar hospedagem em Isle of Skye (02 a 04/03)', 'Hospedagem', d(30, 11, 2026), fonte],
    ['Reservar hospedagem em Fort William (01/03)', 'Hospedagem', d(30, 11, 2026), fonte],
    ['Reservar hospedagens de Edimburgo (24 a 27/02), Glasgow e Inverness (escolher entre as duas opções)', 'Hospedagem', d(15, 12, 2026), 'Notas de hospedagem'],
    ['Comprar trem Inverness → Edimburgo (06/03) quando abrir a venda (~12 semanas antes; confirmar no ScotRail)', 'Transporte', d(12, 12, 2026), fonte],
    ['Pedir os 3 ETAs só pelo gov.uk ou app oficial UK ETA (conferir regra em gov.uk/check-uk-visa)', 'Documentos', d(15, 1, 2027), 'Escócia 2027 › Entrada no Reino Unido'],
    ['Tirar PID no Detran (opcional, garantia extra para a locadora)', 'Documentos', d(31, 1, 2027), 'Escócia 2027 › Dirigir na Escócia'],
    ['Contratar seguro viagem (cobertura médica, repatriação, bagagem)', 'Documentos', d(31, 1, 2027), 'Escócia 2027 › Saúde, seguro e segurança'],
    ['Comprar HES Explorer Pass (ativar em 24/02) e reservar horário do Castelo de Edimburgo', 'Atrações', d(31, 1, 2027), fonte],
    ['Reservar almoço ou jantar de Mothering Sunday (07/03) em Edimburgo', 'Alimentação', d(31, 1, 2027), fonte],
    ['Reservar jantares nas Highlands (Fort William, Skye, Inverness)', 'Alimentação', d(31, 1, 2027), fonte],
    ['Reservar Holyroodhouse, Urquhart, Mackintosh at the Willow e Talisker (se forem)', 'Atrações', d(10, 2, 2027), 'Notas das cidades'],
    ['Avisar o banco, conferir IOF e cartão internacional', 'Dinheiro', d(15, 2, 2027), 'Escócia 2027 › Dinheiro e custos'],
    ['Escolher chip ou eSIM (confirmar suporte a eSIM nos celulares)', 'Conectividade', d(15, 2, 2027), 'Escócia 2027 › Tomada, chip e conectividade'],
    ['Comprar 2 ou 3 adaptadores de tomada tipo G', 'Bagagem', d(15, 2, 2027), 'Escócia 2027 › O que levar'],
    ['Conferir previsão e alertas (Met Office, Traffic Scotland)', 'Clima', d(13, 2, 2027), 'Escócia 2027 › Clima e luz do dia'],
    ['Baixar mapas offline (Highlands e Skye) e reservas', 'Conectividade', d(20, 2, 2027), 'Escócia 2027 › Tomada, chip e conectividade'],
  ];
  return lista.map(function (c, i) {
    const id = 'C' + ('0' + (i + 1)).slice(-2);
    return [id, c[0], c[1], c[2], 'Arthur', '⚠️ pendente', c[3], ''];
  });
}

// ---------------------------------------------------------------- criação

function criarPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename(NOME_PLANILHA);
  ss.setSpreadsheetLocale('pt_BR');

  const criadas = [];
  const existentes = [];
  ABAS.forEach(function (aba, i) {
    if (ss.getSheetByName(aba.nome)) {
      existentes.push(aba.nome);
      return;
    }
    const sh = ss.insertSheet(aba.nome, i);
    montarAba(sh, aba);
    criadas.push(aba.nome);
  });

  // A cotação fica em uma célula nomeada, usada pelas fórmulas de Gastos.
  const viagem = ss.getSheetByName('Viagem');
  const linhaCotacao = viagem.getRange('A:A').getValues().findIndex(function (r) { return r[0] === 'cotacao_gbp_brl'; }) + 1;
  if (linhaCotacao > 0) ss.setNamedRange('cotacao', viagem.getRange(linhaCotacao, 2));
  // Fórmulas que dependem da célula nomeada precisam dela já criada.
  const gastos = ss.getSheetByName('Gastos');
  if (criadas.indexOf('Gastos') >= 0) gastos.getRange('H2').setFormula(ABAS.find(function (a) { return a.nome === 'Gastos'; }).formulas.H2);

  // Remove a aba padrão vazia da planilha nova.
  ss.getSheets().forEach(function (sh) {
    const nomes = ABAS.map(function (a) { return a.nome; });
    if (nomes.indexOf(sh.getName()) < 0 && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });

  const msg = 'Criadas: ' + (criadas.join(', ') || 'nenhuma') +
    (existentes.length ? '\nJá existiam (não alteradas): ' + existentes.join(', ') : '');
  Logger.log(msg);
  return msg;
}

function montarAba(sh, aba) {
  const nCol = aba.colunas.length;
  const nLin = Math.max(aba.linhas.length, 1);

  // Colunas de texto puro (horários, distâncias) não podem virar hora/data.
  (aba.texto || []).forEach(function (c) { sh.getRange(2, c, 999, 1).setNumberFormat('@'); });

  // Cabeçalho fixo.
  sh.getRange(1, 1, 1, nCol).setValues([aba.colunas])
    .setBackground(COR.studioMist).setFontColor(COR.ink).setFontWeight('bold')
    .setFontFamily(FONTE).setFontSize(10).setVerticalAlignment('middle')
    .setBorder(null, null, true, null, null, null, COR.hairline, SpreadsheetApp.BorderStyle.SOLID);
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 32);

  // Dados (fórmulas da coluna inteira entram depois).
  if (aba.linhas.length) sh.getRange(2, 1, aba.linhas.length, nCol).setValues(aba.linhas);
  Object.keys(aba.formulas || {}).forEach(function (cel) {
    if (aba.nome !== 'Gastos') sh.getRange(cel).setFormula(aba.formulas[cel]);
  });

  // Corpo: fundo branco, tinta, quebra de linha nos textos longos.
  sh.getRange(2, 1, 999, nCol).setFontFamily(FONTE).setFontSize(10).setFontColor(COR.ink)
    .setBackground(COR.galleryWhite).setVerticalAlignment('top').setWrap(true);
  Object.keys(aba.formatos || {}).forEach(function (col) {
    if (aba.formatos[col]) sh.getRange(col + '2:' + col).setNumberFormat(aba.formatos[col]);
  });
  // Na aba Viagem a coluna B mistura textos, números e datas.
  if (aba.datasNaColunaB) {
    aba.linhas.forEach(function (l, i) {
      if (l[1] instanceof Date) sh.getRange(i + 2, 2).setNumberFormat('dd/mm/yyyy');
    });
  }
  (aba.larguras || []).forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  // Listas de opções nas colunas de status e pessoas.
  Object.keys(aba.validacoes || {}).forEach(function (col) {
    const regra = SpreadsheetApp.newDataValidation().requireValueInList(aba.validacoes[col], true).setAllowInvalid(false).build();
    sh.getRange(col + '2:' + col).setDataValidation(regra);
  });
  Object.keys(aba.validacaoIntervalo || {}).forEach(function (col) {
    const origem = sh.getParent().getRange(aba.validacaoIntervalo[col]);
    const regra = SpreadsheetApp.newDataValidation().requireValueInRange(origem, true).setAllowInvalid(false).build();
    sh.getRange(col + '2:' + col).setDataValidation(regra);
  });

  // Links em azul de link; pendências em laranja e concluídos em cinza.
  aba.colunas.forEach(function (nome, i) {
    if (/^Link/.test(nome)) sh.getRange(2, i + 1, 999, 1).setFontColor(COR.appleBlue);
  });
  if (aba.nome === 'Checklist') {
    const faixa = sh.getRange('F2:F');
    sh.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('⚠️ pendente').setFontColor(COR.launchOrange).setRanges([faixa]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('feito').setFontColor(COR.slate).setRanges([faixa]).build(),
    ]);
  }
  if (aba.nome === 'Orcamento') {
    sh.getRange('C2:E').setHorizontalAlignment('right');
  }
}
