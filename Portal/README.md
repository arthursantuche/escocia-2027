# Escócia 2027

Portal da viagem à Escócia (23/02 a 08/03/2027). Versão 2.1, publicada em https://arthursantuche.github.io/escocia-2027/. Histórico em `CHANGELOG.md`.

Mostra roteiro com luz do dia, programação, cidades, hospedagens com voucher, orçamento, checklist e registro de gastos, atrações, restaurantes e notas. Site estático em HTML, CSS e JavaScript, sem build. Os dados ficam numa planilha Google Sheets, lida e gravada por um Web App do Apps Script. Funciona sem sinal depois de aberto uma vez.

A documentação completa, com o guia de manutenção, fica no Vault do Obsidian do autor, em `Efforts/Escócia 2027/Portal/`.

## Estrutura
Esta pasta, `Portal/`, é o site. Na raiz do repositório ficam só `.github/` (publicação) e o `.gitignore`.

- `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`: o site.
- `data/amostra.json`: dados de exemplo, sem informações pessoais, para testar com `?amostra`.
- `apps-script/Api.gs`: a API, colada no projeto do Apps Script da planilha.
- `scripts/`: testes (`testar-telas.js`, `testar-trilha.js`, `checar-layout.js`, `checar-indicadores.cjs`, `medir-roteiro.cjs`, `visualizador-webkit.swift`), fotos (`baixar-fotos.py`) e ícones (`gerar-icones.py`). Não são publicados.
- `DESIGN.md`: regras de design e de movimento do portal, com o porquê de cada efeito e a regra de versões.
- `CHANGELOG.md`: histórico de versões.

## Rodar localmente
```bash
# dentro de Portal/
python3 -m http.server 4173
```
Abra http://localhost:4173/?amostra para usar os dados de exemplo, sem código de acesso e sem gravar na planilha. Para testar mudanças sem o cache do navegador, use a configuração `portal-sem-cache` de `.claude/launch.json` (porta 4174), que responde com `Cache-Control: no-store`. Testes, no console da página:
```js
const { testarTelas } = await import('/scripts/testar-telas.js'); await testarTelas();
const { testarTrilha } = await import('/scripts/testar-trilha.js'); await testarTrilha();
```
Indicadores de cursor e de foco cortados, no terminal, com o servidor `portal-sem-cache` no ar: `node Portal/scripts/checar-indicadores.cjs`.

## Publicar
Cada push na `main` publica pelo workflow `.github/workflows/pages.yml`, na raiz do repositório. Ao mudar arquivos do site, altere a revisão em `VERSAO`, em `sw.js`, para os aparelhos baixarem a versão nova; se a mudança for visível, suba também `VERSAO_SITE` (regra em `DESIGN.md`, "Versão"), registre-a em `CHANGELOG.md` e crie a etiqueta `v<versão>`.

## Créditos e privacidade
Fotos das cidades: Wikimedia Commons (CC0, CC BY e CC BY-SA), com autores e licenças em `assets/img/cidades/creditos.json`, exibidos no site. GSAP, Chart.js e pdf.js ficam em `assets/vendor/`.

Nenhum dado pessoal, credencial, código de acesso, código de reserva ou voucher fica neste repositório.
