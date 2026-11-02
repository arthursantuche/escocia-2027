# DESIGN — Portal Escócia 2027

Fonte da verdade: `x/Documentação/Identidade Visual - Apple.md` (vault Arthur's Ideaverse): modo claro pela parte "iPhone Duo - Modo claro", modo escuro pela parte "iPhone 18 Pro - Modo escuro" e movimento pela parte "Animações e comportamento visual - Apple". Como aplicar: `x/Documentação/Diretório - Identidade Visual - Apple.md`. Os tokens estão transcritos em `assets/css/tokens.css`.

Os valores escuros seguem a referência do iPhone 18 Pro e o movimento segue as medições das páginas da Apple.

## Versão
Versão: **2.0** (`VERSAO_SITE`, em `assets/js/config.js`). A cada publicação, mude a revisão interna em `VERSAO`, no `sw.js`, para os aparelhos baixarem os arquivos novos.

## Tokens
- **Paleta** (`--color-*`): os valores literais do documento. Só `tokens.css` usa a paleta diretamente.
- **Papéis** (`--cor-*`, `--contorno-*`): o restante do CSS e os gráficos usam só estes. Eles apontam para a paleta e mudam no tema escuro:

  | Token | Uso |
  |---|---|
  | `--cor-fundo` | tela |
  | `--cor-faixa` | faixa alternada ou superfície sobre a tela |
  | `--cor-cartao` | cartão sobre a faixa |
  | `--cor-campo` | fundo dos campos de formulário |
  | `--cor-vidro` | barra translúcida |
  | `--cor-texto` | texto |
  | `--cor-texto-2` | texto secundário |
  | `--cor-link` | link e foco |
  | `--cor-acao` | botão preenchido |
  | `--cor-sobre-acao` | texto do botão preenchido |
  | `--cor-alerta` | pendência ⚠️ |
  | `--cor-divisoria` | divisória de 1px |
  | `--cor-contorno` | campos e pill secundária |
  | `--cor-contorno-suave` | navegação e cartões |
  | `--cor-trilho` | progresso inativo |
  | `--cor-controle` | fundo do controle do carrossel |
  | `--cor-glifo` | pontos do carrossel |

- Nenhum CSS usa cor, raio ou sombra fora dos tokens.

## Princípios
- **Galeria:** `--cor-fundo` como tela e faixas `--cor-faixa` alternadas, com cartões `--cor-cartao`.
- **Texto:** `--cor-texto` para texto e `--cor-texto-2` para texto secundário.
- **Azul:** só em links (`--cor-link`) e no botão preenchido (`--cor-acao`, pill compacta).
- **Pendências ⚠️:** texto `--cor-alerta`, sem fundo nem borda.
- **Superfícies planas:** sem sombras projetadas e sem gradientes. A separação vem do contraste de fundo e do contorno de 1px (`--contorno-sutil`).
- **Raios:** cards e mídia com `--radius-cards` (28px), botões com `--radius-buttons` e navegação flutuante com `--radius-navigation`.
- **Tipografia:**
  - SF Pro nativa (iPhone/Mac) via `-apple-system`; substitutas Inter, Helvetica Neue e Arial;
  - títulos em 600, nunca 700;
  - títulos que quebram linha usam altura de linha 1,08.
- **Escala móvel:** o display vai de `--text-feature-heading` (40px) a `--text-hero-display` (80px) com `clamp`, sem criar tamanhos novos.

## Tema escuro
- Segue o sistema (`prefers-color-scheme`), sem seletor manual.
- Os tokens de papel trocam de valor, e o CSS das páginas não muda.
- **Superfícies (referência iPhone 18 Pro):** tela `#000000`; faixa `#1d1d1f` (Carbon); cartão sobre a faixa `#000000`; campo `rgba(255,255,255,0.04)`; vidro da barra `rgba(18,18,18,0.8)`.
- **Linhas:** divisória e trilho `#333336`; contorno suave `#282828`; contorno de campo e pílula `#6e6e73`.
- **Cores que mudam porque reprovariam no contraste:**
  - links passam a `#2997ff`;
  - pendências passam a `#f56300` (derivado; a referência usa `#b64400` só em rótulos de 12 px).
- **Botão preenchido:** continua `#0071e3` com texto branco.
- **Fotos:** sem filtro.
- **Gráficos:** redesenhados quando o tema muda.
- **Barra translúcida:** fica sólida com `prefers-reduced-transparency`.
- **Navegador e app instalado:**
  - `index.html` traz `color-scheme: light dark` e duas `theme-color` (`#ffffff` e `#000000`) com `media`, que o Safari usa na barra de status;
  - a barra de status do app instalado fica em `default`;
  - o `manifest.webmanifest` continua com `#ffffff`, porque o manifesto não aceita uma cor por tema;
  - a tela de abertura do app instalado pode piscar em branco no modo escuro. Isso só se confirma no iPhone.

## Layout
- **Espaço depois de títulos:**
  - 32px depois de `.titulo` e 16px depois de `.kicker`, seja qual for o bloco seguinte, inclusive aviso de lista vazia (`.vazio`);
  - título nunca encosta em divisória nem em bloco com fundo;
  - subtítulo (`.introducao`) e link na linha do título fazem parte dele e podem ficar a 12px;
  - duas seções seguidas com o mesmo fundo: use `.secao--continua`, para não somar os dois respiros;
  - `scripts/testar-telas.js` mede isso em todas as rotas: mínimo de 24px depois de `.titulo` e 8px depois de `.kicker`.
- **Seções:** 90px no computador e 64px no celular.
- **Imagens:**
  - a moldura de 28px recorta a imagem, e parallax ou zoom nunca saem dela;
  - legenda abaixo, fora da moldura;
  - resolução de pelo menos 2× a largura exibida.
- **Campos:**
  - 48px de altura, padding de 20px, texto de 17px (o iOS dá zoom abaixo de 16px), contorno `--contorno-forte` e raio `--radius-inputs`;
  - listas com seta própria;
  - foco com anel `--cor-link` e erro em `--cor-alerta`.
- **Toque:** área de pelo menos 44×44px; os pontos dos carrosséis são alvos de 24 × 44px (ponto de 8px com folga).
- **Formulário depois de lista ou de aviso de lista vazia:** 32px de espaço.
- **Texto sob o título das páginas:** `.copy.introducao`, 17px em `--cor-texto-2` (não 14px de legenda).
- **Abertura:** a bandeira em 5:3, sem corte, com até 1000px de largura e no máximo 70% da altura da tela; sob ela, números-chave (`.numeros`: dias para o embarque, noites, cidades) em `clamp(40px, 7vw, 80px)`, sem cartão; depois o próximo compromisso como chamada com a pílula "Ver checklist". Nada pequeno e isolado sob a imagem grande.
- **Celular deitado** (`orientation: landscape` e altura até 500px):
  - a foto da cidade fica em 3:1, para não passar da área visível;
  - abaixo de 834px, a barra fica numa linha só (52px em vez de 101px);
- **Margem lateral:** `--gutter-e` e `--gutter-d`, nunca menores que a área segura do iPhone deitado.
- **Validação:** conferir as orientações vertical e horizontal (por exemplo 390×844, 844×390, 1024×768 e 1280×800).

- **Programação:** dias agrupados por trecho; a partir de 834px a foto e a cidade ficam fixas numa coluna de 280px enquanto os dias rolam.
- **Hospedagens:** um cartão por estadia, na ordem da viagem, com foto da cidade à esquerda a partir de 834px e acima dela no celular; datas, quarto, café e tarifa em campos separados.

## Gráficos
| Série | Cor |
|---|---|
| Previsto | `--cor-grafico-previsto` (Steel) |
| Pago | `--cor-texto` |
| A pagar | `--cor-alerta` |
| Gasto diário | `--cor-link` |

As cores são lidas do CSS no momento de desenhar. O raio das barras (4px, o `--radius-md` do documento) está escrito direto em `graficos.js`, porque o Chart.js não lê variáveis CSS; ele não existe em `tokens.css`.

O laranja em área maior que um rótulo é a única extensão de uso de cor: ele marca "a pagar" pelo mesmo motivo que marca pendências.

## Movimento (referência: apple.com/iphone-duo e apple.com/iphone-18-pro)
Todo efeito tem uma função. A escolha depende do que o elemento faz, não de onde ele está.

| Categoria | Exemplos | Comportamento |
| --- | --- | --- |
| Imagem clicável | Cartão de cidade, vizinhas, foto do trecho, galeria do hotel | Cursor sobre ela: `scale` até 1,04×. Toque: resposta em `:active`. Só reage quem abre algo |
| Imagem editorial | Abertura, foto do trecho, capa da galeria (`data-rolagem`) | Assenta de 1,1× (1,16× em tela estreita) para 1× com a rolagem. Termina com o centro da foto a 40% da altura, nunca em menos de 35% de uma tela |
| Imagem informativa | Foto do topo da cidade (`data-paralaxe`) | Paralaxe de ±5% (±9% em tela estreita), sem hover |
| Imagem narrativa | Foto do palco do roteiro | Só troca por esmaecimento de 500 ms, sem zoom nem hover: quem muda é o conteúdo |
| Coluna que acompanha | `.trecho__lado`, dia em `.atracoes` | `position: sticky`, com o conteúdo passando ao lado |
| Título de seção | `data-revelar` | Opacidade de 0,08 a 1 enquanto sobe de 90% a 55% da altura. É função da posição atual, calculada a cada quadro em `atualizarTitulos`, sem gatilho nem estado: subir, descer ou saltar dá sempre o mesmo resultado |
| Bloco e cartão | `data-subir` | Sobe 30px em 0,5 s, curva `cubic-bezier(0, 0, 0.2, 1)` |
| Controle de carrossel | `.carrossel__controles` | Gota: nasce como círculo, cresce com leve excesso (460 ms, `--ease-gota`), alarga (640 ms, `--ease-alarga`, atraso de 180 ms), entram os pontos (560 ms) e as setas (700 ms). Uma vez só, por `IntersectionObserver` |
| Troca de página | `.entrando` | Só o conteúdo, 240 ms. Nada de View Transitions da página inteira |

- **Cursor e rolagem não se misturam:** o cursor usa a propriedade CSS `scale`, e o GSAP usa `transform`. Transição em `transform` numa foto com rolagem faz a imagem arrastar atrás do dedo.
- **Celular:** nenhum efeito depende de cursor para existir. Foto já visível ao abrir percorre o efeito inteiro, a partir do topo da página.
- **Transições de interface:** curva `--ease-apple` e durações `--dur-curta` (240 ms), `--dur-link` (320 ms) e `--dur-longa` (500 ms).
- **Carrosséis:** rolagem nativa com encaixe, sem rolagem automática.
- **Gráficos:** animação de entrada quando ficam visíveis.
- **Movimento reduzido:** `prefers-reduced-motion: reduce` desliga tudo: sem palco fixo no roteiro, sem gota, sem zoom.

### Desempenho no celular
- **Fotos do Roteiro:** o carregamento é por orientação (ver "Roteiro"). Resolução e qualidade dos arquivos não mudam.
- **Quadro de rolagem:** o que depende de medida é medido uma vez (`medirRoteiro`), e cada quadro só escreve o que mudou. Não leia layout nem reescreva o mesmo estilo a cada quadro.
- **Efeitos caros:** sem `mask-image` em conteúdo que se move (use degradês por cima) e sem desfoque quando o fundo é liso (`.topo--sobre-palco`).
- **Barra do Safari:** dispara `resize` durante a rolagem. Só mudança de largura pede nova medição.

### Roteiro
A orientação da tela decide a apresentação (`HORIZONTAL`, em `movimento.js`), em qualquer aparelho, e a troca acontece sem recarregar a página, mantendo a parada do leitor. Não há seletor de modos.

**Vertical: coluna própria, no fluxo da página** (`.roteiro--vertical`)
- A linha corre pela lateral e cada parada traz cidade, data, trajeto, luz do dia e foto em 3:2. A partir de 600px de largura, texto e foto ficam lado a lado.
- Nada fica preso e nenhuma foto troca. Durante a rolagem, só a linha avança, o ponto enche (`--enche`) e a parada alcançada ganha cor e foto plena, por transição curta.
- A ponta da linha acompanha 60% da altura da tela. O quadro de rolagem só faz contas com `scrollY`, sem ler layout; a linha e os pontos só são escritos com a seção por perto.
- As fotos recebem o arquivo a uma tela de distância (`fotosDasParadas`): 800px no celular, que já passam de 2,5× ali. A altura é reservada pela proporção, então nada salta ao carregar.
- Com as fotos passando atrás do menu, o fundo dele fica sólido (`.topo--sobre-fotos`), para não desfocá-las a cada quadro.

**Horizontal: palco fixo** (`.roteiro--fixo`)
- A seção tem a altura do percurso (`100svh + (paradas − 1) × --trecho`), e o palco fica preso nela por `position: sticky`. A rolagem continua sendo a do navegador.
- A linha é o indicador principal. Foto e detalhe acompanham a parada atual. A última parada é alcançada em 96% do percurso; depois o palco é solto e a seção seguinte sobe.
- A composição segue o espaço disponível (`COMPACTA`, em `movimento.js`, e o mesmo limite em `componentes.css`):

| Tela | Composição |
| --- | --- |
| A partir de 834px de largura e 640px de altura | Duas colunas: nome da seção, título, abertura (com 760px de altura ou mais), foto e detalhe à esquerda; trilha vertical à direita, com todos os locais. 34% da altura por trecho |
| Menos que isso | Foto em 3:2 na altura que sobrar, ao lado do nome da seção, do título e do detalhe. Abaixo, a trilha deita: a linha corre da esquerda para a direita, com todos os locais à vista. 30% da altura por trecho. Abaixo de 360px de altura, saem o título e as datas da trilha |

- O limite vem de medida: com menos de 640px de altura, a foto da composição em duas colunas vira tira; com menos de 834px de largura, as colunas não cabem. O iPad na horizontal fica nas duas colunas.
- **Fotos:** troca por esmaecimento, depois de decodificada, com as vizinhas preparadas antes. Só a atual e a que está saindo são desenhadas.
- **Bolinhas:** a trilha tem folga interna, para contorno e aumento não serem cortados.
- **Toque** (`.roteiro--toque`: aparelho sem cursor ou tela até 833px, na horizontal):
  - os pontos avançam cerca de 0,3px por pixel rolado na composição de duas colunas (16% da altura por trecho);
  - o ponto enche pela rolagem, nos últimos 20px da linha até o centro dele, sem transição por tempo;
  - foto e texto mudam juntos, com o texto esperando até 120ms; a troca da foto leva 240ms (500ms no computador);
  - duas fotos ficam prontas de cada lado da parada atual.

## Exceções conhecidas
- **Dimensões de layout sem token no documento:**
  - largura dos cards da galeria;
  - altura mínima dos gráficos;
  - espessura da linha do roteiro;
  - ponto de quebra de 834px.
- **Barra superior:** `saturate(180%)` junto do `blur(20px)` medido na Apple (decisão do portal) e esmaecimento das bordas da lista de seções com `mask-image` em degradê (só transparência, nenhuma cor nova).
- **Raio das barras dos gráficos:** 4px direto em `graficos.js` (ver "Gráficos").

## Testes de layout
`scripts/checar-layout.js` roda na página aberta e aponta:
- rolagem horizontal;
- títulos encostados em divisórias;
- imagens ampliadas;
- legendas cobertas;
- paradas do roteiro marcadas fora de hora;
- barra flutuante encostada no topo;
- campos com menos de 16px;
- contraste dos tokens de papel.

Para testar em `http://localhost:4173/?amostra`, o portal usa `data/amostra.json` em vez da planilha.

## Telas sobrepostas e galerias
- **Voucher e fotos ampliadas:** tela cheia, em `dialog`, com entrada por esmaecimento curto (`--dur-curta`).
- **Registrar:** página própria em duas etapas (cartões de escolha e formulário por grupos, largura máxima de 760px), com entrada de 12px e 0,5 s na curva de entrada.
- **Fotos:** moldura 3:2 nos trechos e nas capas, a proporção das fotos das cidades; quando duas cidades dividem um trecho, ficam lado a lado em qualquer largura, com a coluna da foto mais larga no computador. Trecho de um dia centra o texto na altura da foto.
- **Hospedagens:** a partir de 834px, sob as fotos, um painel `--cor-faixa` com localização e estacionamento ocupa o resto da coluna. Abaixo disso, o painel vem depois do texto: ali ele não tem fundo próprio e continua a lista de fatos, com a mesma divisória. Pagamento e cancelamento abrem na largura toda do cartão. Na tela cheia, a foto aparece inteira (`object-fit: contain`).
- **Vazios e erros:** `.vazio` para listas sem itens; `.falha` no topo quando os dados não carregam, com "Tentar de novo".

## Painel superior e navegação
- **Forma:** no alto da página, faixa quadrada integrada ao topo; a partir de 24px de rolagem, cápsula suspensa com raio de 20px; volta à faixa abaixo de 8px. Vale para computador e celular, nas duas orientações. Os dois limites evitam oscilação.
- **Como se transforma:** só o fundo (`.topo::before`) muda, com `--ease-capsula` (560 ms, leve excesso) na ida e `--ease-alarga` (420 ms) na volta. Textos, botões e altura do painel não se mexem.
- **Itens:** marca (leva ao Painel), Programação, Hospedagens, Viagem, Checklist e a ação Registrar. Um item novo só entra se for destino frequente; o resto vai para atalhos internos (`.atalhos`).
- **Orçamento fora do painel:** é informação mais particular. Abre pelo Resumo da viagem, no Painel, e por Viagem. Nenhum item fica marcado nessa página.
- **Estabilidade:** troca de página não pode tocar no painel. Nada de View Transitions da página inteira, e o painel nunca é remontado.
- **Âncoras:** a seção começa no topo da tela, e o `padding-top` reserva a altura do painel.
- **Carregamento:** a barra azul (`.carregamento`) ocupa toda a largura, na base de `.topo`, e indica leitura ou gravação real na planilha.
- **Ícone:** a bandeira da Escócia, plana, sem texto nem efeitos: azul `#005eb8` (Pantone 300) e cruz branca de canto a canto, com largura de 1/5 do lado. É a mesma em todos os contextos e nos dois temas; os arquivos saem de `scripts/gerar-icones.py`.
  - **Aba e favoritos** (`bandeira-16`, `-32`, `-48`, `-192`); **tela inicial do iPhone e do iPad e favoritos do Safari** (`bandeira-180`); **instalação no Android e no computador** (`bandeira-192`, `-512`, este também como `maskable`).
  - A imagem é opaca e vai até as bordas: cantos e máscaras do sistema não deixam fundo aparecendo.
  - Ao mudar o desenho, troque o nome dos arquivos: os navegadores guardam o ícone pelo endereço.
- **Programação:** o texto de cada trecho começa no topo da foto, sempre.
- **Todas as cidades:** a faixa cinza é o painel da seção. Ocupa ao menos uma tela (`min-height: 100svh`, exceto em telas muito baixas), com coluna de até 1200px e cartões de 340 a 440px.
