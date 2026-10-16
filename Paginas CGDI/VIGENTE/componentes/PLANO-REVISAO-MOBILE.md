# Plano de revisão mobile dos componentes CGDI

## Escopo

Revisar as fontes canônicas em `componentes/` e validar todas as páginas publicadas
da V1 e da V2 que as consomem. Correções específicas de página só devem existir
quando o conteúdo não puder ser resolvido pelo componente compartilhado.

## Critérios de aceite

- funcionar entre 320 px e 740 px sem rolagem horizontal da página;
- usar alvos interativos de, no mínimo, 44 × 44 px;
- permitir quebra de textos longos sem cortar conteúdo;
- reorganizar grades em uma coluna quando necessário;
- manter campos com fonte mínima de 16 px para evitar zoom automático;
- conter menus, modais e painéis dentro do viewport;
- oferecer rolagem local em tabelas e regiões realmente largas;
- preservar foco visível, ordem de leitura e nomes acessíveis;
- respeitar `prefers-reduced-motion` nos componentes animados;
- manter desktop e conteúdo editorial inalterados.

## Plano de execução

1. Inventariar componentes e páginas consumidoras.
2. Consolidar regras comuns de contenção, tipografia e controles.
3. Revisar cada família de componente nos breakpoints 740, 480 e 380 px.
4. Regenerar `componentes/templates.js` a partir dos templates canônicos.
5. Validar V1 e V2 em 320, 360, 390 e 740 px.
6. Executar auditoria estrutural, verificação de conteúdo e `git diff --check`.

## Matriz de revisão

| Componente | Fonte canônica | Verificações mobile | Estado |
| --- | --- | --- | --- |
| Cabeçalho | `shell/shell.css` | logo, ministério, menu, nome e busca | Revisado |
| Rodapé | `shell/shell.css` | acordeões, redes, selos e alvos de toque | Revisado |
| Navegação do protótipo | `navegacao-prototipos/template.html` | empilhamento, quebra e foco | Revisado |
| Aviso de ambiente | `ambiente-teste/template.html` e `componentes.css` | modal integral, fechar e ação | Revisado |
| Estrutura editorial | `estrutura/estrutura.css` | introdução, metadados, tabelas e acordeão | Revisado |
| Cards | `cards/cards.css` | grades, mídia, ações, métricas e relatórios | Revisado |
| Calendário | `calendario/calendario.css` | filtros, eventos, data e ação | Revisado |
| Mapa | `mapa/template.html` e `componentes.css` | escala, rótulos e foco | Revisado |
| Pesquisa | `pesquisa/pesquisa.css` | chamada, modal, escala e ações | Revisado |
| Pré-download | `pre-download/pre-download.css` | metadados, ações e expansão | Revisado |

## Aplicação nas páginas

V1 e V2 carregam `componentes/componentes.css`, `componentes/fundamentos.css` e
os estilos específicos montados pelo carregador. O bundle `templates.js` é gerado
automaticamente por `npm run check`, propagando mudanças de templates sem copiar
HTML para cada página.

## Resultados da execução

- 11 páginas representativas da V1 e da V2 foram verificadas em 320, 360, 390 e
  740 px: 44 combinações sem rolagem horizontal da página.
- O cabeçalho foi validado com o menu fechado e aberto em 320 e 390 px.
- A chamada de avaliação e seu modal, os detalhes de evento, o pré-download
  expandido, o carrossel da V2 e os acordeões do rodapé foram acionados em 320 e
  390 px: 12 estados interativos aprovados.
- Os pontos do carrossel e os controles mobile mantêm alvo mínimo de 44 × 44 px.
- A verificação automatizada pode ser repetida com
  `node scripts/validate-mobile-interactions.mjs`, usando o servidor local na
  porta 4173 e o Chrome com depuração remota na porta 9225.
- `npm run check` e `git diff --check` integram o fechamento da revisão.
