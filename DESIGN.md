# DESIGN — Portal Escócia 2027

Fonte da verdade: `x/Documentação/Identidade Visual - iPhone Duo.md` (vault Arthur's Ideaverse), aplicada integralmente. Os tokens estão transcritos em `assets/css/tokens.css`; nenhum CSS usa cor, raio ou sombra fora deles.

## Princípios
- Galeria branca: `--color-gallery-white` como tela, faixas `--color-studio-mist` alternadas.
- Tinta `--color-ink` para texto; `--color-slate` para texto secundário.
- Azul só em links (`--color-apple-blue`) e no controle de destaque (`--color-pricing-blue`, pill compacta).
- Pendências ⚠️ em texto `--color-launch-orange`, sem fundo nem borda.
- Superfícies planas: sem sombras projetadas, sem gradientes; separação por contraste de fundo e contorno de 1px (`--shadow-subtle`).
- Cards e mídia com `--radius-cards` (28px); botões `--radius-buttons`; navegação flutuante `--radius-navigation`.
- Tipografia: SF Pro nativa (iPhone/Mac) via `-apple-system`; substitutas Inter, Helvetica Neue, Arial. Títulos em 600, nunca 700.
- Escala móvel: o display vai de `--text-feature-heading` (40px) a `--text-hero-display` (80px) com `clamp`, sem criar tamanhos novos.
- Gráficos: Previsto `--color-steel`, Reservado/pago `--color-ink`, Real `--color-apple-blue`.

## Movimento (referência: apple.com/iphone-duo)
- Títulos `[data-revelar]`: opacidade ligada à rolagem (de quase transparente ao preto).
- Blocos `[data-subir]`: sobem 40px e aparecem ao entrar na tela.
- Roteiro: seção fixada (pin) com a linha avançando pelas paradas (scrub).
- Gráficos: animação de entrada quando ficam visíveis.
- `prefers-reduced-motion: reduce` desliga todo o movimento.

## Exceções conhecidas
Dimensões de layout sem token no documento (largura dos cards da galeria, altura mínima dos gráficos, espessura da linha do roteiro, ponto de quebra de 834px) usam valores diretos.
