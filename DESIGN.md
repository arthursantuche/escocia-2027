# DESIGN — Portal Escócia 2027

Fonte da verdade: `x/Documentação/Identidade Visual - iPhone Duo.md` (vault Arthur's Ideaverse), aplicada integralmente, incluindo as seções "Tema escuro (extensão)" e "Regras de layout do portal". Os tokens estão transcritos em `assets/css/tokens.css`.

## Tokens
- **Paleta** (`--color-*`): os valores literais do documento. Só `tokens.css` usa a paleta diretamente.
- **Papéis** (`--cor-*`, `--contorno-*`): o restante do CSS e os gráficos usam só estes. Eles apontam para a paleta e mudam no tema escuro:

  | Token | Uso |
  |---|---|
  | `--cor-fundo` | tela |
  | `--cor-faixa` | faixa alternada ou superfície sobre a tela |
  | `--cor-cartao` | cartão sobre a faixa |
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
- **Superfícies:** `#000000` → `#161617` → `#1d1d1f`, cada elevação um passo mais claro.
- **Cores que mudam porque reprovariam no contraste:**
  - links passam a `#2997ff`;
  - pendências passam a `#f56300`.
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
  - 32px depois de `.titulo` e 16px depois de `.kicker`;
  - título nunca encosta em divisória.
- **Seções:** 90px no computador e 64px no celular.
- **Imagens:**
  - a moldura de 28px recorta a imagem, e parallax ou zoom nunca saem dela;
  - legenda abaixo, fora da moldura;
  - resolução de pelo menos 2× a largura exibida.
- **Campos:**
  - 48px de altura, padding de 20px, texto de 17px (o iOS dá zoom abaixo de 16px), contorno `--contorno-forte` e raio `--radius-inputs`;
  - listas com seta própria;
  - foco com anel `--cor-link` e erro em `--cor-alerta`.
- **Toque:** área de pelo menos 44×44px.

## Gráficos
| Série | Cor |
|---|---|
| Previsto | `--cor-grafico-previsto` (Steel) |
| Pago | `--cor-texto` |
| A pagar | `--cor-alerta` |
| Gasto diário | `--cor-link` |

As cores são lidas do CSS no momento de desenhar. O raio das barras (4px, o `--radius-md` do documento) está escrito direto em `graficos.js`, porque o Chart.js não lê variáveis CSS; ele não existe em `tokens.css`.

O laranja em área maior que um rótulo é a única extensão de uso de cor: ele marca "a pagar" pelo mesmo motivo que marca pendências.

## Movimento (referência: apple.com/iphone-duo)
- **Títulos `[data-revelar]`:** a opacidade acompanha a rolagem, de quase transparente a opaco.
- **Blocos `[data-subir]`:** sobem 40px e aparecem ao entrar na tela.
- **Roteiro:**
  - sem pin;
  - uma linha guia a 60% da altura da tela faz a linha crescer, do centro do primeiro círculo ao do último;
  - cada círculo enche quando a linha chega a ele.
- **Abertura:** a foto sai de 1,12× para 1× com a rolagem, dentro da moldura.
- **Carrosséis (Resumo e Cidades):** rolagem nativa com encaixe; pontos e setas do `carrossel.js`, sem rolagem automática.
- **Troca de página:** esmaecimento de 0,25 s (View Transitions), a barra fica fixa; sem transição na primeira montagem.
- **Gráficos:** animação de entrada quando ficam visíveis.
- **Movimento reduzido:** `prefers-reduced-motion: reduce` desliga todo o movimento.

## Exceções conhecidas
- **Dimensões de layout sem token no documento:**
  - largura dos cards da galeria;
  - altura mínima dos gráficos;
  - espessura da linha do roteiro;
  - ponto de quebra de 834px.
- **Ícone do app:** usa Helvetica Neue, substituta prevista no documento.
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
