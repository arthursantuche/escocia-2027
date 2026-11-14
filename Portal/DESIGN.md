# DESIGN — Portal Escócia 2027

Fonte da verdade: `x/Documentação/Identidade Visual - Apple.md` (vault Arthur's Ideaverse): modo claro pela parte "iPhone Duo - Modo claro", modo escuro pela parte "iPhone 18 Pro - Modo escuro" e movimento pela parte "Animações e comportamento visual - Apple". Como aplicar: `x/Documentação/Diretório - Identidade Visual - Apple.md`. Os tokens estão transcritos em `assets/css/tokens.css`.

Neste texto, "o documento" e "a identidade" são sempre a Identidade Visual - Apple, que fica no vault, fora do repositório. Se este arquivo e o código divergirem, vale o código: corrija o arquivo.

## Vocabulário
- **Painel:** a página inicial (`#painel`), com Abertura, Resumo da viagem, Roteiro, cidades e Pendências. As demais páginas são Programação, Hospedagens, Viagem, Checklist, Orçamento, Registrar e Cidade.
- **Barra superior** ou **menu:** o cabeçalho fixo (`.topo`), que é faixa no alto da página e cápsula ao rolar. **Barra azul** ou **barra de carregamento:** a linha `.carregamento`, na base dele.
- **Kicker:** o texto de 21px acima de um título ou o nome de um item. **Display:** o título da Abertura.
- **Parada:** cada local do Roteiro. **Trilha:** a lista de paradas com a linha. **Palco:** o Roteiro preso na tela, na horizontal. **Trecho:** os dias seguidos numa mesma base, na Programação. **Estadia:** o cartão de um hotel. **Vizinhas:** parada anterior e próxima, no fim da página da cidade.
- **Computador:** a partir de 834px de largura. **Celular** ou **tela estreita:** abaixo disso. **Celular deitado:** `orientation: landscape` com altura até 500px.

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
  | `--cor-veu`, `--cor-sobre-veu` | véu e texto de "+N" sobre a última miniatura da galeria, iguais nos dois temas |
  | `--cor-papel` | folha do voucher, branca nos dois temas |
  | `--contorno-sutil` | contorno de 1px em `--cor-contorno-suave` (barra, cartões de contorno) |
  | `--contorno-forte` | contorno de 1px em `--cor-contorno` (campos, pílulas, círculos do roteiro) |

- Nenhum CSS usa cor fora dos tokens: `grep -nE '#[0-9a-f]{3,6}|rgba?\(' assets/css/*.css` só acha `tokens.css`. Raios e contornos usam tokens, com as exceções listadas em "Exceções conhecidas".

## Princípios
- **Galeria:** `--cor-fundo` como tela e faixas `--cor-faixa` alternadas, com cartões `--cor-cartao`.
- **Texto:** `--cor-texto` para texto e `--cor-texto-2` para texto secundário.
- **Azul:** `--cor-link` em links, no item atual do menu, no anel de foco, em "obrigatório", na barra de progresso e na de carregamento e na série "Gasto diário"; `--cor-acao` só no botão preenchido (pílula compacta).
- **Laranja** (`--cor-alerta`): o que pede atenção. Pendências ⚠️, erro de campo, ação que apaga, saldo negativo e a série "A pagar". Em texto, sem fundo nem borda.
- **Superfícies planas:** sem sombras projetadas e sem gradiente como preenchimento. A separação vem do contraste de fundo e do contorno de 1px (`--contorno-sutil`). Degradê só para esmaecer uma borda: as pontas da lista do menu e da trilha do roteiro.
- **Raios:** cards com `--radius-cards` e mídia com `--radius-images` (os dois de 28px), botões com `--radius-buttons` e navegação flutuante com `--radius-navigation` (20px).
- **Tipografia:**
  - SF Pro nativa (iPhone/Mac) via `-apple-system`; substitutas Inter, Helvetica Neue e Arial;
  - títulos em 600, nunca 700;
  - títulos que quebram linha usam altura de linha 1,08 e `text-wrap: balance`, para nenhuma palavra ficar sozinha na última linha;
  - o kicker tem altura de linha 1,0 e serve a textos de uma linha. Onde ele sempre quebra (o título do próximo compromisso), usa 1,21 (`--leading-product-nav-title`).
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
  - o `manifest.webmanifest` usa `#f5f5f7` em `theme_color` e `background_color`, porque o manifesto não aceita uma cor por tema;
  - a tela de abertura do app instalado pode piscar em branco no modo escuro. Isso só se confirma no iPhone.

## Layout
- **Espaço depois de títulos:**
  - a regra é 32px depois de `.titulo` e 16px depois de `.kicker`, inclusive antes de um aviso de lista vazia. No CSS: `h2.titulo + :not(a)` e `.conteudo > h2.kicker + …`, em `base.css`; o título de página (`h1`) recebe o respiro de `.pagina__cabecalho`;
  - título nunca encosta em divisória nem em bloco com fundo;
  - subtítulo (`.introducao`) e link na linha do título fazem parte dele e podem ficar a 12px;
  - duas seções seguidas com o mesmo fundo: use `.secao--continua`, para não somar os dois respiros;
  - `scripts/testar-telas.js` mede isso nas rotas da lista `ROTAS` dele (faltam `pendencias`, `registrar/nota` e `registrar/salvo`) e só reprova abaixo de 24px depois de `.titulo` e de 8px depois de `.kicker`; subtítulo e link na linha do título ficam fora da medida.
- **Seções:** 90px de respiro acima e abaixo no computador e 64px no celular, inclusive no celular deitado com 834px ou mais de largura (`orientation: landscape` e altura até 500px).
- **Linhas de texto dentro de um item de lista:** 4px (`--spacing-4`) entre as linhas. Vale para atrações, trens e carros (`.atracao > div`, em `paginas.css`) e para cidade e resumo na lista de paradas (`.parada__texto`, em `componentes.css`).
- **Imagens:**
  - a moldura de 28px recorta a imagem, e parallax ou zoom nunca saem dela;
  - legenda abaixo, fora da moldura;
  - resolução de pelo menos 2× a largura exibida.
- **Campos:**
  - 48px de altura, padding de 20px, texto de 17px (o iOS dá zoom abaixo de 16px), contorno `--contorno-forte` e raio `--radius-inputs`;
  - listas com seta própria;
  - foco com anel `--cor-link` e erro em `--cor-alerta`;
  - dois campos na mesma linha (`.linha-campos`): rótulo, campo e mensagem ficam em linhas comuns (`subgrid`), então a mensagem de erro de um não desalinha o vizinho; a segunda coluna nunca fica menor que o próprio conteúdo;
  - "obrigatório" em `--cor-link` e "opcional" em `--cor-texto-2`, sem opacidade.
- **Toque:** área de pelo menos 44×44px. Exceção: os pontos dos carrosséis são alvos de 24 × 44px (ponto de 8px com folga), a medida da referência, porque ficam lado a lado numa cápsula. No Checklist, o rótulo estende a área da caixa de 24px a 44px de largura e à altura da linha.
- **Ação em forma de link** (`.link-botao`, o "Remover" de Registrar): sem moldura, texto de 14px, altura de 44px; em `--cor-alerta` quando apaga algo.
- **Item de lista com seletor de status:** texto à esquerda e seletor à direita. Com texto longo (trem e carro, em Viagem), abaixo de 600px o seletor vai para baixo do texto (`.atracao--empilha`).
- **Formulário depois de lista ou do texto de lista vazia** (`.lista + .formulario`, `.legenda + .formulario`): 32px de espaço.
- **Texto sob o título das páginas:** `.copy.introducao`, 17px em `--cor-texto-2` (não 14px de legenda).
- **Abertura:** a bandeira em 5:3, sem corte, com até 1000px de largura e no máximo 70% da altura da tela; sob ela, números-chave (`.numeros`: dias para o embarque, noites, cidades) em `clamp(40px, 7vw, 80px)`, sem cartão; depois o próximo compromisso como chamada com a pílula "Ver checklist". Nada pequeno e isolado sob a imagem grande.
- **Celular deitado** (`orientation: landscape` e altura até 500px):
  - a foto da cidade fica em 3:1, para não passar da área visível;
  - abaixo de 834px, a barra fica numa linha só (52px em vez de 101px);
- **Margem lateral:** `--gutter-e` e `--gutter-d`, nunca menores que a área segura do iPhone deitado.
- **Validação:** conferir as orientações vertical e horizontal (por exemplo 390×844, 844×390, 1024×768 e 1280×800).

- **Programação:** dias agrupados por trecho. A partir de 834px de largura e com mais de 700px de altura, a foto e a cidade acompanham a rolagem numa coluna de 280px; o trecho de duas cidades não acompanha.
- **Hospedagens:** um cartão por estadia, na ordem da viagem, com a galeria de fotos do hotel à esquerda a partir de 834px e acima do texto no celular (sem fotos cadastradas, entra a foto da cidade, que não abre nada); datas, quarto, camas e café em campos separados.

## Gráficos
| Série | Cor |
|---|---|
| Previsto | `--cor-grafico-previsto` (Steel) |
| Pago | `--cor-texto` |
| A pagar | `--cor-alerta` |
| Gasto diário | `--cor-link` |

As cores são lidas do CSS no momento de desenhar. No gasto diário, cada barra tem no máximo 48px de largura, para um dia só não ocupar o gráfico inteiro. O raio das barras (4px, o `--radius-md` do documento) está escrito direto em `graficos.js`, porque o Chart.js não lê variáveis CSS; ele não existe em `tokens.css`.

O laranja em área maior que um rótulo é a única extensão de uso de cor: ele marca "a pagar" pelo mesmo motivo que marca pendências.

## Movimento (referência: apple.com/iphone-duo e apple.com/iphone-18-pro)
Todo efeito tem uma função. A escolha depende do que o elemento faz, não de onde ele está.

| Categoria | Exemplos | Comportamento |
| --- | --- | --- |
| Imagem clicável | Cartão de cidade, vizinhas, foto do trecho, galeria do hotel | Cursor sobre ela: `scale` até 1,04×. Toque: em `:active`, o cartão recua para 0,985×; na galeria, cujas fotos encostam nas bordas do cartão, a foto vai a 85% de opacidade. Só reage quem abre algo. Um elemento pode somar categorias: a foto do trecho é clicável e editorial |
| Imagem editorial | Abertura, foto do trecho, capa da galeria (`data-rolagem`) | Assenta de 1,1× (1,16× em tela estreita) para 1× com a rolagem. Termina com o centro da foto a 40% da altura, nunca em menos de 35% de uma tela |
| Imagem informativa | Foto do topo da cidade (`data-paralaxe`) | Paralaxe de ±5% (±9% em tela estreita), sem hover |
| Imagem narrativa | Foto do palco do roteiro | Só troca por esmaecimento de 500 ms, sem zoom nem hover: quem muda é o conteúdo |
| Coluna que acompanha | `.trecho__lado`, dia em `.atracoes` | `position: sticky`, com o conteúdo passando ao lado |
| Título de seção | `data-revelar` | Opacidade de 0,08 a 1 enquanto sobe de 90% a 55% da altura. É função da posição atual, calculada a cada quadro em `atualizarTitulos`, sem gatilho nem estado: subir, descer ou saltar dá sempre o mesmo resultado |
| Bloco e cartão | `data-subir` | Sobe 30px em 0,5 s, curva `cubic-bezier(0, 0, 0.2, 1)` |
| Controle de carrossel | `.carrossel__controles` | Gota: nasce como círculo, cresce com leve excesso (460 ms, `--ease-gota`), alarga (640 ms, `--ease-alarga`, atraso de 180 ms), entram os pontos (depois de 560 ms) e as setas (depois de 700 ms). Uma vez só, quando 90% do controle está na tela (`IntersectionObserver`) |
| Troca de página | `.entrando` | Só o conteúdo, 240 ms. Nada de View Transitions da página inteira |
| Aviso flutuante | `.aviso` | Surge por esmaecimento de 240 ms e some depois de 3,5 s |

- **Cursor e rolagem não se misturam:** o cursor usa a propriedade CSS `scale`, e o GSAP usa `transform`. Transição em `transform` numa foto com rolagem faz a imagem arrastar atrás do dedo.
- **Celular:** nenhum efeito depende de cursor para existir. Foto já visível ao abrir percorre o efeito inteiro, a partir do topo da página.
- **Transições de interface:** curva `--ease-apple` e durações `--dur-curta` (240 ms), `--dur-link` (320 ms) e `--dur-longa` (500 ms).
- **Carrosséis:** rolagem nativa com encaixe, sem rolagem automática.
- **Gráficos:** animação de entrada quando ficam visíveis.
- **Movimento reduzido** (`prefers-reduced-motion: reduce`):
  - somem o palco fixo (o roteiro vira a lista completa, com todas as paradas marcadas, nas duas orientações), a gota, o zoom e a paralaxe das fotos, o clarear dos títulos, a subida dos blocos, a entrada de página e do aviso, a resposta ao toque em escala e a animação dos gráficos, da barra azul e do indicador do voucher;
  - ficam as colunas que acompanham a rolagem (`position: sticky`), que não são animação.
- **Indicadores de espera:** só giram ou correm enquanto algo carrega. São dois: a barra azul do menu e o círculo do voucher (`.carregando__ponto`). Fora isso, nada se move sozinho.

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
| A partir de 834px de largura **e** 640px de altura | Duas colunas: nome da seção, título, abertura (com 760px de altura ou mais), foto e detalhe à esquerda; trilha vertical à direita, com todos os locais. 34% da altura por trecho |
| Largura até 833px **ou** altura até 639px | Foto em 3:2 na altura que sobrar, ao lado do nome da seção, do título e do detalhe. Abaixo, a trilha deita: a linha corre da esquerda para a direita, com todos os locais à vista. 30% da altura por trecho. Abaixo de 360px de altura, saem o título e as datas da trilha |

- O limite vem de medida: com menos de 640px de altura, a foto da composição em duas colunas vira tira; com menos de 834px de largura, as colunas não cabem. O iPad na horizontal fica nas duas colunas.
- **Fotos:** troca por esmaecimento, depois de decodificada, com as vizinhas preparadas antes. Só a atual e a que está saindo são desenhadas.
- **Bolinhas:** a trilha tem folga interna, para contorno e aumento não serem cortados.
- **Toque** (`.roteiro--toque`: aparelho sem cursor ou tela até 833px, na horizontal):
  - na composição de duas colunas, cada trecho consome 16% da altura da tela em vez de 34%, e os pontos avançam cerca de 0,3px por pixel rolado; na composição menor, valem os 30% da tabela;
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
- **Raio das barras dos gráficos:** 4px direto em `graficos.js` (ver "Gráficos"). Pelo mesmo motivo, o texto dos gráficos tem 12px e a dica tem raio de 10px escritos lá.
- **Título do Roteiro no palco estreito:** 28px, tamanho que não existe na identidade, para o título caber ao lado da foto.
- **Raios sem token próprio:** o círculo do indicador do voucher (`50%`) e os cantos da página do voucher e da foto ampliada, que usam tokens de espaçamento (8 e 12px).
- **Contornos de 2px** de foco e de erro dos campos, escritos com `--cor-link` e `--cor-alerta` direto na regra.

## Testes de layout
`scripts/checar-layout.js` roda na página aberta e aponta:
- rolagem horizontal;
- títulos encostados em divisórias;
- imagens ampliadas;
- legendas cobertas;
- paradas do roteiro marcadas fora de hora;
- cápsula do menu encostada no topo (medida no pseudo-elemento `.topo::before`);
- campos com menos de 16px;
- áreas de toque menores que 44px, em telas de toque (aviso);
- contraste dos tokens de papel.

Para testar em `http://localhost:4173/?amostra`, o portal usa `data/amostra.json` em vez da planilha.

## Telas sobrepostas e galerias
- **Voucher e fotos ampliadas:** tela cheia, em `dialog`, com entrada por esmaecimento curto (`--dur-curta`).
- **Registrar:** página própria em duas etapas (cartões de escolha e formulário por grupos, largura máxima de 760px), com entrada de 12px e 0,5 s na curva de entrada.
- **Fotos:** moldura 3:2 nos trechos e nas capas, a proporção das fotos das cidades; quando duas cidades dividem um trecho, ficam lado a lado (uma sobre a outra abaixo de 360px), com a coluna da foto mais larga no computador. O texto começa sempre no topo da foto.
- **Hospedagens:** a partir de 834px, sob as fotos, um painel `--cor-faixa` com localização e estacionamento ocupa o resto da coluna. Abaixo disso, o painel vem depois do texto: ali ele não tem fundo próprio e continua a lista de fatos, com a mesma divisória. Pagamento e cancelamento abrem na largura toda do cartão. Na tela cheia, a foto aparece inteira (`object-fit: contain`).
- **Vazios e erros:** cartão `.vazio` para as listas principais sem itens (Atrações, Restaurantes, Programação, Hospedagens) e uma linha de legenda para as listas menores (Notas, Gastos, Logística, Trem e carro); `.falha` no topo quando os dados não carregam, com "Tentar de novo".
- **Carregamento da primeira abertura** (`.carregando` no `body`, até os dados chegarem):
  - blocos neutros (`--cor-faixa`; sobre a faixa, `--cor-cartao`) no lugar do período, dos viajantes, dos números-chave, dos cartões do resumo, do roteiro, das cidades e das pendências, com as medidas do conteúdo final: nada salta quando ele chega;
  - o próximo compromisso só aparece quando existe;
  - página interna aberta direto pelo endereço mostra os blocos dela (nome, título, texto e mídia), nunca o Painel, e o item do menu já vem marcado;
  - os blocos não pulsam: enquanto carrega, só a barra azul se move;
  - o estado continua enquanto o diálogo do código de acesso está aberto e quando a leitura falha sem cópia no aparelho;
  - depois da primeira abertura, o site abre com a cópia do aparelho e este estado mal chega a ser visto;
  - a estrutura (linhas de texto de larguras diferentes e bloco de mídia) foi adaptada dos componentes Skeleton e Card Skeleton do catálogo 21st.dev, reescrita em CSS com os tokens do portal.

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
