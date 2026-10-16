# Relatório de análise e organização

Data da revisão: 2026-10-16.

## Inventário de entrada

- 939 arquivos analisados;
- 311 conteúdos únicos por SHA-256;
- 87 grupos de duplicatas exatas;
- aproximadamente 98,78 MiB de redundância;
- 76 arquivos e 5,2 MiB na antiga árvore `VIGENTE/`, posteriormente
  reorganizada como `public/`;
- 822 arquivos e 111 MiB no antigo `LEGADO (REVISAR)/`;
- 23 MiB no antigo `SANITIZAR/`.

As maiores repetições estão nas capturas brutas do portal. Elas foram
preservadas sem links simbólicos ou deduplicação destrutiva para manter a
autonomia do acervo.

## Classificação final

| Classe | Local |
| --- | --- |
| Página inicial oficial | `public/index.html` |
| Site e novas páginas do projeto | `public/projeto/` |
| Protótipos ativos | `public/prototipos/` |
| Componentes e recursos dos protótipos | `public/prototipos/componentes/` e `public/prototipos/assets/` |
| Dependências vendorizadas | `public/vendor/` |
| Automação | `ferramentas/scripts/` |
| Testes | `ferramentas/testes/` |
| Configuração de publicação | `ferramentas/configuracao/` |
| Materiais para revisão | `quarentena/a-revisar/` |
| Duplicatas | `quarentena/duplicatas/` |
| Histórico bruto | `quarentena/legado/` |

## Decisões aplicadas

1. A home em `public/index.html` permaneceu como única entrada.
2. Fichas, planilhas, auditoria de acessibilidade e os dois protótipos foram
   preservados na home.
3. Foi criada a rota `projeto/fluxos-dos-prototipos/` com o mapa das 14
   páginas canônicas.
4. Os fluxos históricos ficaram na quarentena porque continham rotas antigas,
   fragmentos ausentes e Mermaid remoto.
5. As 24 rotas anteriores passaram a ser geradas somente no build.
6. Ativos exclusivos foram agrupados dentro de cada análise ou protótipo.
7. Oito blocos CSS embutidos foram extraídos para arquivos por página.
8. Código sem consumidor foi movido para
   `quarentena/a-revisar/codigo/sem-consumidor/`.
9. O bundle de componentes passou a ser determinístico e validado sem alterar
   arquivos durante `npm run check`.
10. Identificadores internos V1/V2 e P01/P03/P04/P06/P07 foram mantidos onde
    sua troca ofereceria risco visual; eles não aparecem como rotas públicas.
11. O pacote passou a se chamar `projeto-inpi-cgdi`; a fonte publicável passou
    a usar `public/`, separando o site em `projeto/` e os protótipos em
    `prototipos/`.

## Verificação

- 14 páginas canônicas alcançáveis a partir da home;
- 266 referências locais verificadas;
- dados e denominadores da auditoria de acessibilidade consistentes;
- 24 redirects gerados no build;
- quarentena e ferramentas ausentes do artefato;
- 36 de 36 interações móveis aprovadas em 320, 360, 390 e 412 px;
- Google Docs e Google Drive da home responderam HTTP 200;
- nenhum destino externo auditado respondeu 404 ou 410; o LinkedIn bloqueou a
  verificação automatizada com código 999.
