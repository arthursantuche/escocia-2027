# CLAUDE.md — Portal Escócia 2027

Site da viagem, publicado em https://arthursantuche.github.io/escocia-2027/. Este arquivo só aponta caminhos e as regras que não mudam; o detalhe está nos documentos abaixo.

## Antes de mexer
1. No vault do Obsidian (`~/Documents/Arthur's Ideaverse`), leia o `CLAUDE.md` da raiz, que leva ao `me`, ao Vault Map e ao Skill Map (a seção 3 do Skill Map é o ciclo obrigatório de documentação de toda tarefa).
2. Leia o `Efforts/Escócia 2027/Portal/Diretório - Portal Escócia 2027.md`, seção 2.1: ele diz qual documento ler para cada tarefa e qual é a fonte única de cada assunto.
3. Para trabalhar: Guia de Manutenção - Portal Escócia 2027, seções 7 e 8 (como trabalhar e o que não muda sem decisão do Arthur). Para o código: Referência técnica. Para onde mora cada dado: Arquitetura e armazenamento. Para o visual: `Portal/DESIGN.md` e, no vault, o Diretório - Identidade Visual - Apple.

## Regras fixas
- Site estático, sem build: HTML, CSS e JavaScript em módulos, em `Portal/`.
- Só tokens no CSS: nenhuma cor fora de `Portal/assets/css/tokens.css`.
- Dados da viagem só na planilha; nunca no código. Passaporte, CNH e cartão não entram em lugar nenhum.
- O código de acesso nunca é escrito em arquivo, captura ou resposta, nem digitado por IA em navegador.
- Mudou arquivo publicado: suba a revisão `VERSAO` em `Portal/sw.js`; versão nova pela regra de `Portal/DESIGN.md`, "Versão".
- Mudança visual: prévia local aprovada pelo Arthur antes de publicar. Commit, push e etiqueta só com autorização dele.

## Testar
Servidor `portal-sem-cache` (`.claude/launch.json`), em `http://127.0.0.1:4174/?amostra`. Depois:
```bash
node Portal/scripts/testar-lote.cjs
node Portal/scripts/checar-indicadores.cjs
```
Tamanhos, temas, WebKit e limites: Referência técnica - Portal Escócia 2027, seção 10.
