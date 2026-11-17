# DESIGN — Portal Escócia 2027

Fonte da verdade: `x/Documentação/Identidade Visual - Apple/Identidade Visual - Apple.md` (vault Arthur's Ideaverse): modo claro pela parte "iPhone Duo - Modo claro", modo escuro pela parte "iPhone 18 Pro - Modo escuro" e movimento pela parte "Animações e comportamento visual - Apple". Como aplicar: `x/Documentação/Identidade Visual - Apple/Diretório - Identidade Visual - Apple.md`. Os tokens estão transcritos em `assets/css/tokens.css`.

Neste texto, "o documento" e "a identidade" são sempre a Identidade Visual - Apple, que fica no vault, fora do repositório. Se este arquivo e o código divergirem, vale o código: corrija o arquivo.

## Vocabulário
- **Painel:** a página inicial (`#painel`), com Abertura, Resumo da viagem, Roteiro, cidades e Pendências. As demais páginas são Programação, Hospedagens, Viagem, Checklist, Orçamento, Registrar e Cidade.
- **Barra superior** ou **menu:** o cabeçalho fixo (`.topo`), que é faixa no alto da página e cápsula ao rolar. **Barra azul** ou **barra de carregamento:** a linha `.carregamento`, na base dele.
- **Kicker:** o texto de 21px acima de um título ou o nome de um item. **Display:** o título da Abertura.
- **Parada:** cada local do Roteiro. **Trilha:** a lista de paradas com a linha. **Palco:** o Roteiro preso na tela, na horizontal. **Trecho:** os dias seguidos numa mesma base, na Programação. No Roteiro, a variável `--trecho` é outra coisa: a distância de rolagem entre duas paradas. **Estadia:** o cartão de um hotel. **Vizinhas:** parada anterior e próxima, no fim da página da cidade.
- **Computador:** a partir de 834px de largura. **Celular** ou **tela estreita:** abaixo disso. **Celular deitado:** `orientation: landscape` com altura até 500px.

## Versão
A versão do código está em `VERSAO_SITE` (`assets/js/config.js`) e aparece no rodapé como "Portal Escócia 2027 · versão X.Y"; a que está publicada fica registrada no vault, no Diretório - Portal Escócia 2027, seção 2.1. O histórico fica em `CHANGELOG.md`.

| O que mudou | Número | Exemplo |
| --- | --- | --- |
| Estrutura, páginas, identidade visual ou formato dos dados (planilha e API) | Principal: 2.x → 3.0 | Página nova no menu, troca da identidade, aba nova que a API grava |
| Algo visível ou de funcionamento, sem mudar a estrutura | Secundário: 2.1 → 2.2 | Ajuste de layout, animação, texto fixo, componente, correção |
| Arquivo do site sem efeito visível (por exemplo, a lista de arquivos do `sw.js`) | Nenhum; só a revisão do cache | Incluir uma foto na lista do uso sem sinal |
| Só documentação e testes (`DESIGN.md`, `CHANGELOG.md`, `README.md`, `scripts/`), que não vão para o site | Nenhum, e a revisão do cache também não muda | Revisão deste arquivo |

- **Revisão do cache** (`VERSAO`, em `sw.js`, no formato `escocia2027-<versão>-rev<n>`): muda sempre que um arquivo publicado muda (os de `index.html`, `manifest.webmanifest`, `sw.js`, `assets/` e `data/`), com ou sem número novo. É ela que faz os aparelhos baixarem os arquivos novos; o `n` só cresce.
- **A cada versão numerada:**
  - uma entrada em `CHANGELOG.md`, com data e o que mudou (só versões numeradas entram lá);
  - uma etiqueta `v<versão>` no commit publicado, que é quem identifica o commit (`v2.0` marca o `d4b49df`);
  - o número novo no Diretório - Portal Escócia 2027, seção 2.1, no vault: é o único documento do vault que registra a versão.

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
- **Celular:** adapte, não reproduza a disposição do computador; a mesma lógica e a mesma qualidade, com a composição que cabe na tela. A orientação escolhe a apresentação do Roteiro e, na horizontal, o espaço disponível escolhe a composição. Sem modos nem seletores para o leitor. Altura de tela em `svh`; margens nunca menores que a área segura (`--gutter-e`, `--gutter-d`, `env(safe-area-inset-*)`).

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

## Espaçamento
O sistema completo (filosofia, definições, como decidir um caso novo, celular e orientação, certo e errado, o que reutilizar) está no Diretório - Identidade Visual - Apple, seção 7.1, no vault (`x/Documentação/Identidade Visual - Apple/Diretório - Identidade Visual - Apple.md`). Aqui ficam os valores do portal e as exceções.

**Regra:** espaço entre elementos sai de um papel (`--espaco-*`, `--element-gap`), escolhido pelo que os dois elementos são um para o outro. O degrau da escala (`--spacing-*`) só aparece direto dentro de um componente, quando nenhum papel descreve a relação; o comentário da regra diz qual papel ele substitui e por quê.

| Token | Valor | Relação |
| --- | --- | --- |
| `--espaco-junto` | 4px | Linhas de uma mesma unidade (nome e detalhe, rótulo, data e hora, item e estado) |
| `--espaco-par` | 8px | Par: rótulo e campo, link de voltar e cabeçalho, kicker e linha curta num cartão |
| `--espaco-perto` | 12px | Um explica o outro: kicker e título, título e introdução, foto e legenda, ações lado a lado |
| `--espaco-grupo` | 16px | Peças de um componente; kicker de bloco e conteúdo; padding dos itens de lista; texto e lista abaixo |
| `--element-gap` | 20px | Componentes irmãos: cartões de uma grade, campos de formulário |
| `--espaco-bloco` | 32px | Título de seção e conteúdo; bloco e bloco; gráfico e lista abaixo |
| `--espaco-cabecalho` | 40px | Cabeçalho de página e conteúdo; grupos de formulário; texto e foto grande |
| `--espaco-secao` | 90px (`--section-gap`) com 834px de largura ou mais, exceto na horizontal com até 500px de altura; 64px nos demais casos | Seção e seção (definido em `tokens.css`, com as duas `@media`) |
| `--card-padding` | 28px | Cartões de conteúdo (resumo, essenciais, dicas, próximo compromisso) |
| `--card-padding-compacto` | 24px | Cartões densos ou divididos com foto (estadia, escolha, texto do cartão de cidade, lista vazia) |
| `--largura-conteudo` | 980px | Coluna de conteúdo |
| `--medida-leitura` | 66ch | Texto corrido de várias linhas: introduções, notas soltas, glossário, textos de itens e tarefas |

**Exceções do portal** (cada uma com o motivo):
- **Pílulas:** 16px de padding lateral no conteúdo; 20px nas que ficam ao lado de campos de 48px (formulários e `.registrar__acoes`), para equilibrar com a altura deles.
- **Título do Roteiro no palco estreito** (o Roteiro preso na tela, na horizontal): 28px, para caber ao lado da foto (ver "Exceções conhecidas", mais abaixo).
- **Tabelas:** 12px na vertical e 8px na horizontal dentro das células (no lugar de `--espaco-grupo`), pela densidade dos números.
- **Detalhe da parada no palco:** altura fixa de 84 a 88px, para trocar de parada sem mexer no resto.
- **Programação:** coluna da foto de 280px e coluna da data de 72px; **Hospedagens:** galeria de 340px e rótulos de 120px: medidas de componente, não espaços.
- **Painel prático da estadia:** 20px na vertical e 24px na horizontal (no lugar de `--card-padding-compacto` nos quatro lados), por ser uma faixa estreita sob a galeria.
- **Trilha deitada do Roteiro** (iPhone na horizontal): nome e data sob cada ponto ficam sem os 4px de `--espaco-junto`. A trilha tem 64px de altura fixa; com mais 4px, a data seria cortada ou a foto do palco encolheria. A diferença de tamanho (14px e 12px) e a meia entrelinha já separam as duas linhas.

**Verificação:** `scripts/testar-telas.js` (respiro depois de títulos) e `scripts/checar-layout.js` (divisória encostada, linhas encostadas, medida de leitura) apontam o que sair destas regras.

## Layout
- **Espaço depois de títulos:**
  - a regra é `--espaco-bloco` (32px) depois de `.titulo` e `--espaco-grupo` (16px) depois de `.kicker`, inclusive antes de um aviso de lista vazia. No CSS: `h2.titulo + :not(a)` e `.conteudo > h2.kicker + …`, em `base.css`; o título de página (`h1`) recebe o respiro de `.pagina__cabecalho`;
  - título nunca encosta em divisória nem em bloco com fundo;
  - subtítulo (`.introducao`) e link na linha do título fazem parte dele e podem ficar a 12px;
  - duas seções seguidas com o mesmo fundo: use `.secao--continua`, para não somar os dois respiros;
  - `scripts/testar-telas.js` mede isso nas rotas da lista `ROTAS` dele (faltam `pendencias`, `registrar/nota` e `registrar/salvo`) e só reprova abaixo de 24px depois de `.titulo` e de 8px depois de `.kicker`; subtítulo e link na linha do título ficam fora da medida.
- **Seções:** `--espaco-secao`: 90px de respiro acima e abaixo no computador e 64px no celular, inclusive no celular deitado com 834px ou mais de largura (`orientation: landscape` e altura até 500px).
- **Linhas de texto dentro de um item de lista:** 4px (`--espaco-junto`) entre as linhas, inclusive o estado do item ("⚠️ pendente") e as datas das estadias. Vale para atrações, trens e carros (`.atracao > div`, em `paginas.css`) e para cidade e resumo na lista de paradas (`.parada__texto`, em `componentes.css`).
- **Imagens:**
  - a moldura de 28px recorta a imagem, e o zoom nunca sai dela;
  - legenda abaixo, fora da moldura;
  - resolução de pelo menos 2× a largura exibida.
- **Campos:**
  - 48px de altura, padding de 20px, texto de 17px (o iOS dá zoom abaixo de 16px), contorno `--contorno-forte` e raio `--radius-inputs`;
  - listas com seta própria;
  - foco com anel `--cor-link` e erro em `--cor-alerta`;
  - campos a 20px um do outro (`--element-gap`), também quando empilham abaixo de 380px;
  - dois campos na mesma linha (`.linha-campos`): rótulo, campo e mensagem ficam em linhas comuns (`subgrid`), então a mensagem de erro de um não desalinha o vizinho; a segunda coluna nunca fica menor que o próprio conteúdo;
  - "obrigatório" em `--cor-link` e "opcional" em `--cor-texto-2`, sem opacidade.
- **Toque:** área de pelo menos 44×44px, o tamanho padrão de controle da HIG (o mínimo dela é 28×28pt). Como cada caso chega lá:
  - pílulas, campos, link de voltar, ação em forma de link e itens do menu têm 44px de altura própria (o menu, com `min-height`, também no computador e no celular deitado);
  - links soltos com menos de 44px (título da barra, "Ver …" na linha do título, nome da cidade no título do trecho, endereço e "Página do hotel" na estadia, links de item de lista e de registro) ganham uma área invisível de 44×44px centrada neles, pela regra de alvo mínimo em `componentes.css`, sem mudar a linha nem o layout. "Buscar novidades" tem regra própria, com folga também dos lados;
  - no Checklist, o rótulo estende a área da caixa de 24px a 44px de largura e à altura da linha;
  - ficam de fora links dentro de texto corrido ou de legenda (créditos de foto), como permite o critério de alvos do WCAG;
  - exceção: o nome da parada atual no palco do Roteiro não ganha a área invisível (ela passaria do bloco de detalhe, de altura fixa, e cobriria as linhas de baixo); no toque, o alvo é a foto logo acima, que leva ao mesmo lugar, e o nome continua sendo o link do teclado e dos leitores de tela;
  - exceção: os pontos dos carrosséis são alvos de 24 × 44px (ponto de 8px com folga), a medida de apple.com, porque ficam lado a lado numa cápsula. Ficam 4px abaixo do mínimo da HIG na largura; o desvio é aceito porque os alvos são contíguos (sem área morta entre eles), têm 44px de altura e o carrossel também se move ao deslizar e, no computador, pelas setas.
  - A comparação completa com a HIG está no Diretório - Identidade Visual - Apple, seção 7.1, "Relação com as diretrizes da Apple (HIG)".
- **Ação em forma de link** (`.link-botao`, o "Remover" de Registrar): sem moldura, texto de 14px, altura de 44px; em `--cor-alerta` quando apaga algo.
- **Item de lista com seletor de status:** texto à esquerda e seletor à direita. Com texto longo (trem e carro, em Viagem), abaixo de 600px o seletor vai para baixo do texto (`.atracao--empilha`).
- **Formulário depois de lista ou do texto de lista vazia** (`.lista + .formulario`, `.legenda + .formulario`): 32px de espaço.
- **Lista com divisória logo abaixo** de um texto: 16px; de um gráfico: 32px. A divisória nunca encosta no que vem antes.
- **Link de voltar** (`.voltar`, em todas as páginas que têm um): alvo de 44px e 8px até o cabeçalho.
- **Texto sob o título das páginas:** `.copy.introducao`, 17px em `--cor-texto-2` (não 14px de legenda).
- **Abertura:** a bandeira em 5:3, sem corte, com até 1000px de largura e no máximo 70% da altura da tela; sob ela, números-chave (`.numeros`: dias para o embarque, noites, cidades) em `clamp(40px, 7vw, 80px)`, sem cartão; depois o próximo compromisso como chamada com a pílula "Ver checklist". Nada pequeno e isolado sob a imagem grande.
- **Celular deitado** (`orientation: landscape` e altura até 500px):
  - a foto da cidade fica em 3:1, para não passar da área visível;
  - abaixo de 834px, a barra fica numa linha só (52px em vez de 101px), com 4px acima e abaixo da cápsula, como no celular em pé;
- **Margem lateral:** `--gutter-e` e `--gutter-d`, nunca menores que a área segura do iPhone deitado.
- **Validação:** conferir as orientações vertical e horizontal, nos tamanhos e temas da Referência técnica - Portal Escócia 2027, seção 10, no vault.

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
Todo efeito tem uma função. A escolha depende do que o elemento faz, não de onde ele está, e a ausência de um efeito também é decisão: está registrada em "Onde não há efeito, e por quê".

### Efeitos e por que existem
| Categoria | Onde | Comportamento | Por quê |
| --- | --- | --- | --- |
| Imagem que abre a página ou o trecho (`data-rolagem`) | Bandeira da Abertura, foto do topo da cidade, fotos da Programação, capa da galeria do hotel | Assenta de 1,1× (1,16× em tela estreita) para 1× com a rolagem e termina quando o centro da foto chega a 40% da altura da janela. O efeito dura no mínimo 35% da altura da janela de rolagem; foto já visível ao abrir a página começa no topo dela, em qualquer aparelho | Dá profundidade à chegada da imagem principal, como nas páginas da referência, e termina com a foto **inteira** e em 1×: o leitor vê a composição completa quando para de rolar. É o único efeito de **escala** ligado à rolagem em fotos (a foto do roteiro só muda de opacidade); a mesma categoria tem o mesmo comportamento em todas as páginas |
| Cartão de texto clicável | Cartões do Resumo da viagem | Cursor: contorno de 1px em `--cor-contorno` (`--contorno-forte`), nos quatro lados. Toque: recuo para 0,985× | Sem foto para aproximar, o contorno indica que o cartão abre uma página. O trilho do carrossel tem 4px de respiro em cima para o contorno não ser cortado |
| Cartão de escolha | Tipos de registro, em Registrar | Cursor: a seta desliza 4px. Toque: recuo para 0,98× | A seta já diz "seguir"; movê-la é o sinal natural |
| Imagem clicável | Cartão de cidade, vizinhas, foto do trecho, galeria do hotel, foto e nome da parada atual do Roteiro (palco), foto de cada parada na vertical | Cursor sobre ela: `scale` até 1,04×. No palco do Roteiro, o cursor sobre a foto **ou** sobre o nome aproxima a foto e deixa o nome azul, como no cartão de cidade (`:has()`, em `componentes.css`); os dois levam à página da cidade da parada atual. Toque: em `:active`, o cartão recua para 0,985×; na galeria, cujas fotos encostam nas bordas do cartão, a foto vai a 85% de opacidade | Indica que a foto abre algo. Só reage quem abre algo. Uma foto pode somar categorias: a do trecho abre a cidade e também assenta com a rolagem |
| Foto do roteiro (narrativa) | Paradas na vertical; palco na horizontal | Na vertical, a parada ainda não alcançada fica a 45% de opacidade e chega à plena quando a linha a alcança. No palco, a foto troca por esmaecimento (500 ms no computador, 240 ms no toque) | Quem conta a história é a linha que avança; a foto acompanha a parada. Ver "Onde não há efeito" |
| Linha e pontos do roteiro | Trilha | A linha cresce com a rolagem; o ponto da parada alcançada enche | Mostra onde o leitor está no percurso. Diferenças entre computador e toque em "Computador e iPhone" |
| Coluna que acompanha | `.trecho__lado`, dia em `.atracoes` | `position: sticky`, com o conteúdo passando ao lado | Mantém o contexto (cidade, dia) enquanto a lista passa |
| Título de seção | `data-revelar` | Opacidade de 0,08 a 1 enquanto o topo do título sobe de 90% a 55% da altura da janela. É função da posição atual, calculada a cada quadro em `atualizarTitulos`, sem gatilho nem estado | Marca a entrada numa seção sem mover texto. Por ser só função da posição, subir, descer ou saltar dá o mesmo resultado |
| Bloco e cartão | `data-subir` | Sobe 30px em 0,5 s, curva `cubic-bezier(0, 0, 0.2, 1)`, quando o topo chega a 92% da janela; uma vez por página | Dá ritmo à chegada de listas e cartões. Por tempo, e não pela rolagem, para nada ficar meio apagado quando o leitor para |
| Controle de carrossel | `.carrossel__controles` | Gota: nasce como círculo, cresce com leve excesso (460 ms, `--ease-gota`), alarga (640 ms, `--ease-alarga`, atraso de 180 ms), entram os pontos (depois de 560 ms) e as setas (depois de 700 ms). Uma vez só, quando 90% do controle está na tela | Medido na página do iPhone 18 Pro: chama a atenção para o fato de haver mais cartões ao lado |
| Cursor e toque nos controles de carrossel | Setas e pontos | Seta: o fundo clareia com o cursor (`--cor-controle-hover`, 100 ms lineares) e escurece ao ser pressionada (`--cor-controle-ativo`); desativada, não reage. Ponto que não é o atual: escurece com o cursor (`--cor-glifo-hover`, 120 ms lineares ao entrar). Nada muda de tamanho nem de lugar | Valores das setas translúcidas e dos pontos de apple.com, medidos em 16/11/2026 (o passo do ponto é derivado). Antes da 2.4 os controles não reagiam ao cursor, ao contrário dos demais botões |
| Sem estado de cursor, por decisão | Item atual do menu, ponto atual do carrossel, campos de formulário (texto, lista, caixa de seleção) | Só o anel de foco | O item atual já está em `--cor-link` e o ponto atual já está destacado; os campos da referência não reagem ao cursor |
| Troca de página | `.entrando` | O conteúdo novo entra por esmaecimento (opacidade de 0 a 1) em 240 ms; o menu não se move | Continuidade sem tocar no menu. Nada de View Transitions da página inteira: elas capturavam o menu e o faziam piscar |
| Aviso flutuante | `.aviso` | Surge por esmaecimento de 240 ms e some depois de 3,5 s | Confirma uma ação sem tirar o leitor do lugar |
| Gráfico | Resumo da viagem e Orçamento | As barras crescem de zero ao valor em 900 ms (`easeOutQuart`), uma vez, quando 30% do gráfico está na tela | Mostra a proporção entre as categorias no momento em que o leitor chega a ele. Igual no computador e no iPhone |
| Foto que surge | Toda foto ao terminar de carregar (`img.carregada`) | Esmaecimento de 500 ms | Evita a foto aparecendo de repente |
| Toque em controles | Pílulas (0,97×), cartões de escolha (0,98×), cartões e fotos clicáveis (0,985×), em `:active` | Recuo enquanto o dedo está na tela | Substitui o hover no toque: confirma que o toque foi recebido |
| Indicadores de espera | Barra azul do menu; círculo do voucher | Correm ou giram só enquanto algo carrega | São os únicos movimentos que não vêm da rolagem nem do toque, e só existem enquanto há espera real |

### Onde não há efeito, e por quê
- **Fotos do roteiro não assentam com a rolagem.** Na vertical, a parada já tem dois sinais (o ponto que enche e a foto que chega à opacidade plena) e a linha avança ao lado; um terceiro movimento na mesma área competiria com o indicador de progresso, que é o que importa ali. Medido em 15/11/2026 no iPhone emulado com processador 6× mais lento: com o efeito nas oito fotos, o trabalho de script e estilo durante a rolagem do roteiro sobe de 10 a 20%, sem ganho visível com a página parada. No palco da horizontal, a foto fica presa na tela; crescer ou encolher enquanto ela está parada pareceria a foto se mexendo sozinha.
- **Cartões das cidades não reagem à rolagem.** Eles já correm no carrossel e respondem ao cursor e ao toque; um efeito de rolagem em sete fotos lado a lado seria só repetição.
- **Paralaxe: não há.** Até a versão 2.0 a foto do topo da cidade tinha paralaxe. Ela exigia a foto 12% a 20% maior que a moldura, sempre: no iPhone só 70% da foto aparecia, ampliada 1,2×, em qualquer ponto da rolagem, e a foto nunca era vista inteira. Na 2.1 ela passou a assentar com a rolagem, como a da Programação, com o mesmo custo de processamento medido e a foto inteira no fim.
- **Nada se move sozinho**, além dos indicadores de espera: sem rolagem automática nos carrosséis e sem animação contínua.

### Computador e iPhone
| Efeito | Computador (com cursor) | iPhone e telas de toque | Por que a diferença |
| --- | --- | --- | --- |
| Imagem clicável | `scale` 1,04× com o cursor | Recuo de 0,985× ou 85% de opacidade no toque | Não há cursor; o toque responde no próprio gesto |
| Imagem que abre a página | 1,1× → 1× | 1,16× → 1× | Em tela estreita a foto é pequena diante da rolagem; com 1,1× o efeito quase não se percebe |
| Roteiro | Quem decide a apresentação é a **orientação da tela**, não o aparelho (detalhes em "Roteiro"). No computador: palco preso na tela, com foto e detalhe à esquerda e a trilha à direita; o ponto enche por transição de 240 ms quando a linha passa por ele | iPhone em pé: lista vertical, com foto em cada parada, sem palco. iPhone deitado: palco com a foto em cima e a trilha deitada embaixo. iPad deitado: o palco do computador. Em todos, o ponto enche junto com a rolagem | No toque, o ponto enche **junto com a rolagem** (`--enche`), nos últimos 20px da linha até o centro dele: uma transição por tempo deixava o ponto atrás do dedo. No palco de duas colunas com toque (iPad deitado), a rolagem entre paradas cai de 34% para 16% da altura da tela, para os pontos andarem tanto por pixel rolado quanto no computador |
| Foto do palco | Troca em 500 ms | Troca em 240 ms, com o texto esperando até 120 ms | Um gesto rápido atravessa várias paradas; a troca longa ficava para trás |
| Menu sobre fotos e palco | Vidro com desfoque | Fundo sólido sobre as fotos da vertical; sem desfoque sobre o palco | Desfocar fotos em movimento a cada quadro pesava no iPhone; sobre o palco o fundo é liso e o desfoque não muda nada |
| Setas dos carrosséis | Visíveis a partir de 834px; clareiam com o cursor e escurecem ao clique | Só pontos e arrasto; no iPad com setas, só o escurecer ao toque | No toque, arrastar é o gesto natural, e não há cursor para reagir |

### Regras de implementação
- **Cursor e rolagem não se misturam:** o cursor usa a propriedade CSS `scale`, e o GSAP usa `transform`. Transição em `transform` numa foto com rolagem faz a imagem arrastar atrás do dedo. O GSAP escreve `scale: none` no estilo das imagens que anima: na foto do trecho e na capa da galeria, a regra do cursor tem `!important`, só sem movimento reduzido (`paginas.css`). Até a 2.2 o zoom do cursor não acontecia nessas duas fotos.
- **Indicadores inteiros:** contorno de cursor e anel de foco (2px, a 2px do elemento) aparecem nos quatro lados. Contêiner que recorta (o trilho dos carrosséis e a lista do menu, que rolam na horizontal) tem respiro de 4px devolvido com margem negativa; nas fotos da estadia, que o cartão recorta, o anel vem para dentro, e a capa tem o raio do cartão no canto que coincide com ele. Regra geral no Diretório - Identidade Visual - Apple, seção 10.1.
- **Ação em forma de link** ("Remover", "Buscar novidades", "Pagamento, cancelamento e contato"): sublinha com o cursor.
- **Celular:** nenhum efeito depende de cursor para existir.
- **Transições de interface:** curva `--ease-apple` e durações `--dur-curta` (240 ms), `--dur-link` (320 ms) e `--dur-longa` (500 ms).
- **Carrosséis:** rolagem nativa com encaixe, sem rolagem automática. **Cada cartão tem uma posição de encaixe própria:** o trilho tem, no fim, o espaço que falta para o último cartão chegar à borda de encaixe (`padding-inline-end` calculado com `--cartao`, a largura do cartão). Sem isso, os últimos cartões dividiam a mesma posição final, e setas e pontos pulavam (do 4º para o 7º nas Sete cidades) ou voltavam ao início (no Resumo, até a 2.4). No computador, no fim do trilho, o último cartão fica à esquerda, como os demais. Setas, pontos e indicador usam a mesma conta do cartão atual, e cliques seguidos contam a partir do destino anterior (`carrossel.js`). A galeria ampliada das fotos de hotel segue a mesma regra: uma foto por clique, setas desativadas no começo e no fim.
- **Gráficos:** animação de entrada quando ficam visíveis.
- **Efeito novo:** antes de acrescentar, veja se uma categoria acima já resolve; se não, registre a categoria, o porquê e a diferença entre computador e iPhone nesta seção.
- **Movimento reduzido** (`prefers-reduced-motion: reduce`):
  - somem: o palco fixo e a troca de foto dele (o roteiro vira a lista completa, com todas as paradas marcadas e as fotos a 100%); o assentar das fotos com a rolagem; o `scale` do cursor e o recuo no toque; a gota; o clarear dos títulos; a subida dos blocos; a entrada de página e do aviso; a animação dos gráficos, da barra azul e do indicador do voucher;
  - ficam: as colunas que acompanham a rolagem (`position: sticky`) e os 85% de opacidade da galeria ao toque, que não são movimento.

### Desempenho no celular
- **Fotos do Roteiro:** o carregamento é por orientação (ver "Roteiro"). Resolução e qualidade dos arquivos não mudam.
- **Quadro de rolagem:** o que depende de medida é medido uma vez (`medirRoteiro`), e cada quadro só escreve o que mudou. Não leia layout nem reescreva o mesmo estilo a cada quadro.
- **Efeitos caros:** sem `mask-image` em conteúdo que se move (use degradês por cima) e sem desfoque quando o fundo é liso (`.topo--sobre-palco`).
- **Barra do Safari:** dispara `resize` durante a rolagem. Só mudança de largura pede nova medição.
- **Imagens:** não desenhe várias imagens grandes ao mesmo tempo, nem com opacidade zero; antes de trocar para uma imagem ainda não decodificada, use `img.decode()`. Esconder uma imagem com CSS não evita o download: atribua o arquivo só quando ela for aparecer. Nunca reduza a qualidade dos arquivos: o `srcset` escolhe o tamanho adequado à tela.
- **Um problema, uma apresentação:** não altere a horizontal para resolver um problema da vertical ou do toque. Use `@media (orientation: portrait)`, `.roteiro--vertical` e `.roteiro--toque`.
- **Indicadores ligados à rolagem:** valor calculado pela posição, não transição por tempo; confira quantos pixels o indicador anda por pixel rolado, com `scripts/medir-roteiro.cjs`.
- O iPhone sofre mais que o computador, e o teste no Mac não mostra isso.

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
- áreas de toque com menos de 44px de altura ou de largura, em telas de toque, contando a área invisível do `::after` (aviso; ficam fora os links em texto corrido ou legenda e os pontos dos carrosséis);
- contraste dos tokens de papel.

`scripts/testar-lote.cjs` roda no terminal toda a bateria: `testarTelas` e `checarLayout` em todas as rotas, `testarTrilha`, navegação dos carrosséis elemento por elemento, item marcado no menu e erros de JavaScript, em cinco tamanhos e nos dois temas, no Chrome ou no WebKit (`MOTOR=webkit`). Deve terminar com "Nenhum problema".

`scripts/checar-indicadores.cjs` roda no terminal (`node`, com o Playwright do computador) e força `:hover` e `:focus-visible` em cada elemento interativo, apontando contorno, sombra ou anel de foco cortado por um contêiner que recorta. Deve terminar com "Nenhum indicador cortado".

Com `?amostra` em `127.0.0.1` ou `localhost`, o portal usa `data/amostra.json` em vez da planilha. Servidor, tamanhos de tela e como rodar em lote: Referência técnica - Portal Escócia 2027, seção 10, no vault (servidor `portal-sem-cache`, de `.claude/launch.json`).

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

## Rodapé
Igual em todas as páginas, sobre a faixa (`--cor-faixa`), em texto de legenda.
Ordem, de cima para baixo: notas; linha de sincronização; linha fina; identificação.
- **Notas:** "Dados de pesquisa verificados em … · Cotação R$ … por £1" e, abaixo, "Itens com ⚠️ ainda precisam ser confirmados ou reservados." Aparecem quando os dados chegam.
- **Linha de sincronização:** a hora da última leitura e a ação "Buscar novidades", juntas numa só linha: "Atualizado em dd/mm/aaaa, às hh:mm · Buscar novidades".
  - Sem sinal, o começo da linha vira "Sem conexão: cópia salva em dd/mm/aaaa, às hh:mm", e "Buscar novidades" continua no fim, para tentar de novo.
  - Com gravações esperando, entra antes da ação "1 alteração aguardando sinal" ou "N alterações aguardando sinal".
  - "Buscar novidades" é uma ação em forma de link, logo depois da hora: azul (`--cor-link`), como tudo o que reage no portal, sublinhada ao passar o cursor e com alvo de toque de 44px sem mudar a altura da linha. Enquanto busca, vira "Buscando…" em cinza; o resultado sai no aviso flutuante.
  - A linha só quebra antes do " · Buscar novidades", nunca no meio da ação.
- **Identificação:** "Portal Escócia 2027 · versão X.Y", abaixo de uma linha fina (`--cor-divisoria`) que a separa das notas e da sincronização, como o rodapé da referência.

## Painel superior e navegação
- **Forma:** no alto da página, faixa quadrada integrada ao topo; a partir de 24px de rolagem, cápsula suspensa com raio de 20px; volta à faixa abaixo de 8px. Vale para computador e celular, nas duas orientações. Os dois limites evitam oscilação.
- **Como se transforma:** só o fundo (`.topo::before`) muda, com `--ease-capsula` (560 ms, leve excesso) na ida e `--ease-alarga` (420 ms) na volta. Textos, botões e altura do painel não se mexem.
- **Itens:** marca (leva ao Painel; fica azul com o cursor, como os demais itens), Programação, Hospedagens, Viagem, Checklist e a ação Registrar. Um item novo só entra se for destino frequente; o resto vai para atalhos internos (`.atalhos`).
- **Orçamento fora do painel:** é informação mais particular. Abre pelo Resumo da viagem, no Painel, e por Viagem. Nenhum item fica marcado nessa página.
- **Estabilidade:** troca de página não pode tocar no painel. Nada de View Transitions da página inteira, e o painel nunca é remontado. A página nova começa no topo.
- **Âncoras:** a seção começa no topo da tela, e o `padding-top` reserva a altura do painel.
- **Folga da cápsula:** 4px entre a cápsula e o topo da tela abaixo de 834px de largura (em pé e deitado) e 6px a partir de 834px, somados à área segura; nas laterais, 8px mais a área segura abaixo de 834px, 12px a partir de 834px e, a partir de 1048px, alinhada à coluna de 1024px. `checar-layout.js` reprova menos de 4px do topo.
- **Carregamento:** a barra azul (`.carregamento`) ocupa toda a largura, na base de `.topo`, nunca dentro da cápsula, e indica leitura ou gravação real na planilha.
- **Ícone:** a bandeira da Escócia, plana, sem texto nem efeitos: azul `#005eb8` (Pantone 300) e cruz branca de canto a canto, com largura de 1/5 do lado. É a mesma em todos os contextos e nos dois temas; os arquivos saem de `scripts/gerar-icones.py`.
  - **Aba e favoritos** (`bandeira-16`, `-32`, `-48`, `-192`); **tela inicial do iPhone e do iPad e favoritos do Safari** (`bandeira-180`); **instalação no Android e no computador** (`bandeira-192`, `-512`, este também como `maskable`).
  - A imagem é opaca e vai até as bordas: cantos e máscaras do sistema não deixam fundo aparecendo.
  - Ao mudar o desenho, troque o nome dos arquivos: os navegadores guardam o ícone pelo endereço.
- **Programação:** o texto de cada trecho começa no topo da foto, sempre. A foto de Edimburgo acompanhando a rolagem é a referência de qualidade da página.
- **Todas as cidades:** a faixa cinza é o painel da seção. Ocupa ao menos uma tela (`min-height: 100svh`, exceto em telas muito baixas), com coluna de até 1200px e cartões de 340 a 440px. A borda preta inferior ao chegar pela âncora é aceita: não mexa por causa dela.
