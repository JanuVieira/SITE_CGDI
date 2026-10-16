# Componentes compartilhados da CGDI

Esta é a fonte canônica dos elementos usados pelo projeto vigente. Nesta etapa,
V1 e V2 são as únicas versões com HTML publicado; V3 e V4 permanecem reservadas.

- `shell/portal-shell.html`: templates do cabeçalho Gov.br/INPI e do rodapé.
- `navegacao-prototipos/`: barra superior que retorna ao índice dos protótipos.
- `pre-download/`: comportamento e contrato visual responsivo dos cartões de arquivo; cada instância usa o elemento `<cgdi-pre-download>`.
- `estrutura/`: componentes editoriais de todas as versões: introdução, metadados, ações, callout, mensagem de estado, mídia, evento, conteúdo incorporado, tabela, grades, listas de recursos, navegação por formatos, notícias e acordeão.
- `mapa/`: mapa interativo do Brasil, baseado na Home V1.
- `calendario/`: agenda reutilizável, baseada na Home V2, com busca, filtro e layout compacto responsivo; use `<cgdi-calendar data-cgdi-component="calendar"></cgdi-calendar>`.
- `cards/`: família reutilizável de cards da V2; use `<cgdi-card variant="feature|standard|support|large|media|metric|report|inverse|service|topic|compact">`.
- `pesquisa/`: avaliação local “Esta página ajudou você?”.
- `ambiente-teste/`: modal somente para rotas internas ainda não implementadas; destinos externos ficam desabilitados no protótipo.
- `componentes.js`: carregador único dos componentes.
- `componentes.css`: estilos mínimos compartilhados.

As páginas canônicas ficam em `../projetos/v1/` e `../projetos/v2/`. A V1
mantém o fluxo completo; a V2 mantém somente sua home nesta etapa.
Os HTML dessas versões mantêm apenas o conteúdo editorial e os hosts dos
componentes; o shell compartilhado não deve ser copiado para dentro das páginas.

O `cgdi-card` aceita HTML semântico comum. O controlador identifica automaticamente
o SVG direto como ícone, a imagem direta como mídia e, nas variações `feature` e
`media`, a `div` direta como corpo. As páginas consumidoras não precisam usar
classes `v2-*`; essas classes permanecem somente onde a Home V2 ainda precisa de
seletores próprios, como no carrossel.

