# Histórico de versões — Portal Escócia 2027

Regra de numeração em `DESIGN.md`, seção "Versão". Só versões numeradas entram aqui. Cada uma tem uma etiqueta `v<versão>` no Git, que identifica o commit publicado. Datas em dd/mm/aaaa.

## 2.2 — 15/11/2026
Conformidade com as diretrizes da Apple (Human Interface Guidelines): áreas de toque e folga da barra no celular deitado.

- **Áreas de toque:** links soltos que tinham de 18 a 25px de altura passam a ter alvo de 44 × 44px, por uma área invisível que não muda a linha nem o layout: título "Escócia 2027" na barra, "Ver orçamento" e "Ver roteiro" no Painel, nome da cidade no título de cada trecho da Programação, endereço e "Página do hotel no Booking" na estadia, "Abrir no Google Maps", "Ver reserva e como chegar" e "Editar" nas páginas de cidade. Os itens do menu, que tinham 41px no computador e no iPad e 37px no celular deitado, passam a 44px sem a barra crescer.
- **Barra no celular pequeno deitado** (iPhone SE e mini): a cápsula do menu ficava a 2px da borda da tela; agora fica a 4px, como no celular em pé. A barra cresce 4px nessas telas.
- `checar-layout.js` passa a medir links e a área invisível dos alvos, e a avisar quando qualquer das duas medidas fica abaixo de 44px.
- Revisão do cache: `rev16`.

## 2.1 — 15/11/2026
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
Primeira versão no repositório: portal completo, com Painel, Programação, Hospedagens, Viagem, Checklist, Orçamento, Registrar e páginas das cidades, lendo e gravando na planilha. O histórico anterior não foi registrado.
