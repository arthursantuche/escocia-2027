# Histórico de versões — Portal Escócia 2027

Regra de numeração em `DESIGN.md`, seção "Versão". Só versões numeradas entram aqui. Cada uma tem uma etiqueta `v<versão>` no Git, que identifica o commit publicado. Datas em dd/mm/aaaa. O detalhe de cada intervenção (diagnóstico, decisões, testes) fica no vault, na Auditoria de qualidade - Portal Escócia 2027.

## Visão geral
| Versão | Publicada em | Commit | Etiqueta | Revisão do cache | Em uma linha |
| --- | --- | --- | --- | --- | --- |
| Antes da 2.0 | até 08/11/2026 | — | — | `rev1` a `rev12` | Sem registro (seção "Antes da 2.0", no fim) |
| 2.0 | 08/11/2026 | `d4b49df` | `v2.0` | `rev13` | Primeira versão no repositório |
| 2.0, revisão 14 | 14/11/2026 | `7f62136` | — | `rev14` | Auditoria de qualidade, publicada sem número próprio |
| 2.1 | 15/11/2026 | `45b5563` | `v2.1` | `rev15` | Animações, rodapé, sistema de espaçamento, regra de versões |
| 2.2 | 15/11/2026 | `ed8feba` | `v2.2` | `rev16` | Áreas de toque pelas diretrizes da Apple; folga da cápsula |
| 2.3 | 16/11/2026 | `29389a4` | `v2.3` | `rev17` | Indicadores de cursor e de foco inteiros; zoom das fotos com rolagem |
| 2.4 | 16/11/2026 | ver etiqueta | `v2.4` | `rev18` | Setas e pontos dos carrosséis reagem ao cursor e ao toque |

Até aqui, seis versões publicadas (2.0, a revisão 14 da 2.0, que pela regra atual seria secundária, 2.1, 2.2, 2.3 e 2.4), mais as revisões sem registro de antes do repositório.

## 2.4 — 16/11/2026
Controles dos carrosséis com estado de cursor e de toque, medidos em apple.com.

- **Setas** (computador): o fundo clareia com o cursor e escurece ao ser pressionado, nos valores das setas translúcidas de apple.com (`rgba(223,223,227,0.6976)` e `rgba(193,193,198,0.6544)` no claro; `rgba(73,73,76,0.7256)` e `rgba(57,57,60,0.7424)` no escuro), em 100 ms lineares. Desativada, a seta não reage.
- **Pontos:** o ponto que não é o atual escurece com o cursor, no mesmo passo de opacidade que a Apple usa (+0,12), em 120 ms ao entrar.
- Em tela de toque não há cursor: só a seta pressionada responde. Nada muda de tamanho nem de lugar, e a gota de entrada continua igual.
- Commit da 2.3 completado na tabela acima (antes, só a etiqueta).
- Revisão do cache: `rev18`.

## 2.3 — 16/11/2026 · `29389a4`
Auditoria dos estados de interação (cursor, foco e toque) em todas as páginas.

- **Cartões do Resumo da viagem:** o contorno que aparece ao passar o cursor perdia o lado de cima. O trilho do carrossel rola na horizontal e, por isso, recorta também em cima e embaixo; não havia respiro em cima. Agora tem 4px, devolvidos com margem negativa (nada sai do lugar).
- **Anel de foco do teclado** inteiro também nos cartões do Resumo e das Sete cidades, nos itens do menu (a lista também rola na horizontal) e nas fotos da galeria das estadias (o cartão recorta as fotos; o anel vem para dentro e acompanha o canto arredondado).
- **Zoom do cursor** volta a funcionar na foto de cada trecho da Programação e na capa da galeria: o GSAP, que faz a foto assentar com a rolagem, escrevia `scale: none` na imagem e apagava o zoom. Com movimento reduzido, continua sem zoom.
- **"Pagamento, cancelamento e contato"** sublinha ao passar o cursor, como as outras ações em forma de link.
- `scripts/checar-indicadores.cjs`: força os estados de cursor e de foco e aponta indicador cortado.
- Revisão do cache: `rev17`.


## 2.2 — 15/11/2026 · `ed8feba`
Conformidade com as diretrizes da Apple (Human Interface Guidelines): áreas de toque e folga da barra no celular deitado.

- **Áreas de toque:** links soltos que tinham de 18 a 25px de altura passam a ter alvo de 44 × 44px, por uma área invisível que não muda a linha nem o layout: título "Escócia 2027" na barra, "Ver orçamento" e "Ver roteiro" no Painel, nome da cidade no título de cada trecho da Programação, endereço e "Página do hotel no Booking" na estadia, "Abrir no Google Maps", "Ver reserva e como chegar" e "Editar" nas páginas de cidade. Os itens do menu, que tinham 41px no computador e no iPad e 37px no celular deitado, passam a 44px sem a barra crescer.
- **Barra no celular pequeno deitado** (iPhone SE e mini): a cápsula do menu ficava a 2px da borda da tela; agora fica a 4px, como no celular em pé. A barra cresce 4px nessas telas.
- `checar-layout.js` passa a medir links e a área invisível dos alvos, e a avisar quando qualquer das duas medidas fica abaixo de 44px.
- Revisão do cache: `rev16`.

## 2.1 — 15/11/2026 · `45b5563`
Animações revistas, rodapé reorganizado, sistema de espaçamento e regra de versões.

- **Sistema de espaçamento:** papéis de espaço (`--espaco-junto` a `--espaco-secao`), padding de cartões em dois níveis, coluna e medida de leitura como tokens em `tokens.css`, aplicados às regras compartilhadas. Corrigidos: lista colada no gráfico do Orçamento e na nota de créditos da Viagem; "⚠️ pendente" colado no item, no Painel; datas das estadias sem os 4px entre as linhas; kicker a 8px do título no Roteiro (12px nas demais); dois links de voltar com espaços diferentes; campos empilhados a 12px em telas estreitas; introduções e notas com até 136 caracteres por linha no computador (agora até ~85). `checar-layout.js` passa a apontar divisórias e linhas encostadas e linhas longas demais.

- **Foto do topo da cidade:** a paralaxe foi trocada pelo assentar com a rolagem, o mesmo efeito das fotos da Programação, da abertura e da galeria. A paralaxe deixava a foto sempre ampliada e cortada (no iPhone, só 70% dela aparecia); agora ela termina inteira, a 1×, com o mesmo custo de processamento. O gancho `data-paralaxe` saiu do código.
- **Roteiro:** revisto e mantido sem efeito de rolagem nas fotos, com a decisão e a medição registradas em `DESIGN.md` ("Onde não há efeito, e por quê").
- **Rodapé:** de cima para baixo, notas, linha de sincronização, linha fina e identificação. "Buscar novidades" virou ação em forma de link, na mesma linha de "Atualizado em …"; "1 alteração" ou "N alterações aguardando sinal".
- **Versões:** a numeração deixou de ser fixa em 2.0; regra em `DESIGN.md` e este histórico.
- **Publicação:** ações do GitHub atualizadas para versões em Node.js 24 (`checkout@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`).
- Revisão do cache: `rev15`.

## 2.0, revisão 14 — 14/11/2026 · `7f62136`
Auditoria de qualidade, publicada ainda como "versão 2.0", antes da regra de versões. É a única entrada sem número próprio e sem etiqueta; pela regra atual, seria uma versão secundária.

- Estado de carregamento da primeira abertura (estrutura adaptada de componentes do catálogo 21st.dev).
- Refinamentos de tipografia, campos lado a lado com erro, botão "Remover", área de toque do Checklist, textos de prazo e de noites, fotos de hotel em 1920px, respiro no iPhone deitado.
- Acessibilidade: `aria-current="page"`, `aria-busy`, contraste de "opcional", movimento reduzido completo.
- Links da planilha só em `http(s)`; Painel sem a chave `saida_escocia` não quebra.
- `checar-layout.js` mais confiável; configuração `portal-sem-cache`.

## 2.0 — 08/11/2026 · `d4b49df`
Primeira versão no repositório: portal completo, com Painel, Programação, Hospedagens, Viagem, Checklist, Orçamento, Registrar e páginas das cidades, lendo e gravando na planilha. O que veio antes está na seção abaixo.

## Antes da 2.0
Houve versões do portal antes do repositório, mas não há registro delas: o conteúdo sobre versões anteriores à 2.0 foi descartado a pedido do Arthur, e o repositório começa na 2.0. O que se pode comprovar:
- a 2.0 já foi publicada com a revisão de cache `rev13`, então houve 12 revisões publicadas antes dela (`rev1` a `rev12`), sem data nem conteúdo conhecidos;
- a API em uso é a implantação "Portal 2.0", na versão 7 do Apps Script (numeração do Google, sem relação com a versão do site); as versões 1 a 6 da implantação também não têm registro;
- o Guia de Manutenção, no vault, registra o portal já em funcionamento em 03/11/2026.

Não se sabe quantas versões numeradas houve antes da 2.0, nem quais foram as datas e mudanças. Se aparecer um registro confiável, ele entra aqui, em ordem cronológica.

