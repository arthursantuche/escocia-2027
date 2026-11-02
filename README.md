# Escócia 2027

Portal da viagem à Escócia (23/02 a 08/03/2027). Versão 2.0, publicada em https://arthursantuche.github.io/escocia-2027/.

Mostra roteiro com luz do dia, programação, cidades, hospedagens com voucher, orçamento, checklist e registro de gastos, atrações, restaurantes e notas. Site estático em HTML, CSS e JavaScript, sem build. Os dados ficam numa planilha Google Sheets, lida e gravada por um Web App do Apps Script. Funciona sem sinal depois de aberto uma vez.

A documentação completa, com o guia de manutenção, fica no Vault do Obsidian do autor, em `Efforts/Escócia 2027/Portal/`.

## Estrutura
O site fica em `Portal/`:

- `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`: o site.
- `data/amostra.json`: dados de exemplo, sem informações pessoais, para testar com `?amostra`.
- `apps-script/Api.gs`: a API, colada no projeto do Apps Script da planilha.
- `scripts/`: testes (`testar-telas.js`, `testar-trilha.js`, `checar-layout.js`, `medir-roteiro.cjs`, `visualizador-webkit.swift`), fotos (`baixar-fotos.py`) e ícones (`gerar-icones.py`). Não são publicados.
- `DESIGN.md`: regras de design e de movimento do portal.

## Rodar localmente
```bash
python3 -m http.server 4173 --directory Portal
```
Abra http://localhost:4173/?amostra para usar os dados de exemplo, sem código de acesso e sem gravar na planilha. Testes, no console da página:
```js
const { testarTelas } = await import('/scripts/testar-telas.js'); await testarTelas();
const { testarTrilha } = await import('/scripts/testar-trilha.js'); await testarTrilha();
```

## Publicar
Cada push na `main` publica pelo workflow `.github/workflows/pages.yml`. Ao mudar arquivos do site, altere a revisão em `VERSAO`, em `Portal/sw.js`, para os aparelhos baixarem a versão nova.

## Créditos e privacidade
Fotos das cidades: Wikimedia Commons (CC0, CC BY e CC BY-SA), com autores e licenças em `assets/img/cidades/creditos.json`, exibidos no site. GSAP, Chart.js e pdf.js ficam em `assets/vendor/`.

Nenhum dado pessoal, credencial, código de acesso, código de reserva ou voucher fica neste repositório.
