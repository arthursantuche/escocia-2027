# Escócia 2027

Portal da viagem à Escócia (23/02 a 08/03/2027): painel, roteiro, orçamento, checklist, cidades e registro de gastos e notas. Site estático (HTML, CSS e JavaScript, sem build) publicado no GitHub Pages, que lê e grava uma planilha Google Sheets por um Web App do Apps Script.

A documentação completa (decisões, operação, manutenção) fica no vault do Obsidian do autor, em `Efforts/Escócia 2027/Portal/Documentação - Portal Escócia 2027.md`.

## Estrutura
- `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`: o portal (PWA).
- `data/amostra.json`: dados de exemplo e reserva offline; gerado por `node scripts/gerar-amostra.js`.
- `apps-script/`: `Api.gs` (Web App) e `Setup.gs` (criação da planilha).
- `scripts/`: geração da planilha, da amostra e das fotos.
- `DESIGN.md`: regras de design (Identidade Visual iPhone Duo).

## Rodar localmente
```bash
python3 -m http.server 4173
```
Abra http://localhost:4173.

## Publicar
Cada push na `main` publica pelo workflow `.github/workflows/pages.yml`. Ao mudar arquivos do site, suba `VERSAO` em `sw.js`.

## Créditos
Fotos das cidades: Wikimedia Commons, autores e licenças em `assets/img/cidades/creditos.json` (exibidos no portal). GSAP e Chart.js em `assets/vendor/`, com as licenças nos próprios arquivos.

Nenhum dado pessoal, credencial ou código de acesso fica neste repositório.
