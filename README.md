# Escócia 2027

Portal da viagem à Escócia (23/02 a 08/03/2027): painel, roteiro com luz do dia, orçamento (previsto, a pagar, pago e saldo), preços das hospedagens, checklist, cidades e registro de gastos e notas. Claro ou escuro, conforme o sistema. Site estático (HTML, CSS e JavaScript, sem build) publicado no GitHub Pages, que lê e grava uma planilha Google Sheets por um Web App do Apps Script.

A documentação completa (decisões, operação, manutenção) fica no vault do Obsidian do autor, em `Efforts/Escócia 2027/Portal/Documentação - Portal Escócia 2027.md`.

## Estrutura
- `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`: o portal (PWA).
- `data/amostra.json`: dados de exemplo e reserva offline; gerado por `node scripts/gerar-amostra.js`.
- `apps-script/`: `Api.gs` (Web App) e `Setup.gs` (criação da planilha e `migrarRevisao`, migração de 27/10/2026).
- `scripts/`: geração da planilha, da amostra e das fotos (`baixar-fotos.py`), e `checar-layout.js` (checagem de layout no navegador).
- `DESIGN.md`: regras de design do portal (Identidade Visual - Apple, claro e escuro).

## Rodar localmente
```bash
python3 -m http.server 4173
```
Abra http://localhost:4173/?amostra para usar `data/amostra.json` sem código de acesso e sem gravar na planilha (só em localhost). Para checar o layout, no console da página:
```js
const { checarLayout } = await import('/scripts/checar-layout.js'); checarLayout();
```

## Publicar
Cada push na `main` publica pelo workflow `.github/workflows/pages.yml`. Ao mudar arquivos do site, suba `VERSAO` em `sw.js`.

## Créditos
Fotos das cidades e da abertura: Wikimedia Commons (CC0, CC BY e CC BY-SA), recortadas e redimensionadas; autores, licenças e alterações em `assets/img/cidades/creditos.json`, exibidos sob cada foto e na página Viagem. GSAP e Chart.js em `assets/vendor/`, com as licenças nos próprios arquivos.

Nenhum dado pessoal, credencial ou código de acesso fica neste repositório.
