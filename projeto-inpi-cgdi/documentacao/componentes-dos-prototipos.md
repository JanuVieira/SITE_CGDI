# Componentes compartilhados da CGDI

As fontes canônicas dos elementos usados pelos dois protótipos ativos ficam
em `public/prototipos/componentes/`:

- `portal/template.html`: cabeçalho Gov.br/INPI e rodapé;
- `navegacao-prototipos/`: retorno à página inicial do projeto;
- `pre-download/`: cartões responsivos de arquivo;
- `estrutura-editorial/`: componentes editoriais e layouts reutilizáveis;
- `calendario/`: agenda com busca, filtro e estados;
- `cards/`: família de cards;
- `pesquisa/`: avaliação local “Esta página ajudou você?”;
- `componentes.js`: carregador e comportamento compartilhado;
- `componentes.css`: estilos mínimos compartilhados;
- `templates-gerados.js`: artefato gerado para funcionar também em `file://`.

A lista fechada de templates-fonte está em
`ferramentas/scripts/gerar-bundle-componentes.mjs`. Gere o bundle com
`npm run generate:components`; não edite `templates-gerados.js` diretamente.

Os HTML dos protótipos mantêm o conteúdo editorial e os hosts dos componentes.
O portal não deve ser copiado para cada página. Ações sem destino publicado
nascem sem `href` e são marcadas como indisponíveis pelo carregador.
