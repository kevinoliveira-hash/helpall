# Refinamento de experiência · 0.4 beta

Arquivo Figma fornecido por Kevin: https://www.figma.com/design/o60AqwhSPcCDTeBdgA8HpF/help-all?node-id=1-2

A implementação visual está em `dist/refinement.css`, carregada por último. Essa camada preserva os exemplos do catálogo, pedidos, comunidade e HelpCoins. Dados e regras do banco não foram alterados.

## Decisões

- Hierarquia de títulos e espaçamentos com petróleo, esmeralda, superfícies claras e dourado para HELP.
- Mais contraste e tamanhos legíveis para descrições, avaliações, localização e valores.
- Cartões com espaçamento consistente; em celulares estreitos, uma coluna evita textos apertados.
- Áreas principais de toque de 44 pixels ou mais; foco de teclado visível.
- Cabeçalho fixo e navegação inferior com estado ativo claro e respeito à área segura do celular.
- Todos os exemplos continuam disponíveis; removida a regra visual que ocultava o terceiro cartão em algumas telas.
- Formulário beta com superfície própria, campos confortáveis e explicação local preservada.
- Movimento reduzido respeitado e sem alteração nas ações existentes.

## Como manter

Edite a camada de refinamento para ajustes visuais. Evite replicar regras na base sem necessidade. Dados fictícios continuam em `dist/data.js`. Conteúdo do beta permanece em `dist/beta.js`. O modo beta continua sem login real e sem envio do cadastro ao banco.

A prancha `HELP-ALL-experiencia-04` foi importada no arquivo Figma fornecido como camadas vetoriais editáveis. A fonte SVG está em `design-references/HELP-ALL-experiencia-04.svg`; `node scripts/design-board.mjs` a regenera. Ela documenta o visual implementado, não substitui os fluxos funcionais do app.
