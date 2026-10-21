# Arquitetura do projeto INPI CGDI

## Limite de publicação

`public/` é a raiz publicável. `tools/`, `docs/`, arquivos do npm e metadados
do repositório nunca entram no artefato final.

O build permite apenas:

- `public/index.html`;
- `public/projeto/`;
- `public/prototipos/`;
- `public/vendor/`.

## Responsabilidades

| Área | Responsabilidade |
| --- | --- |
| `public/index.html` | Entrada oficial e ligação entre todas as entregas |
| `public/projeto/` | Site institucional do projeto e futuras páginas |
| `public/prototipos/` | Propostas visuais, componentes e fluxos demonstráveis |
| `public/vendor/` | Dependências externas vendorizadas usadas por mais de uma família |
| `docs/` | Arquitetura, dependências e referências do projeto |
| `tools/` | Build, manutenção, testes e configuração |

Backups, duplicatas, capturas brutas e materiais sem contrato ativo não fazem
parte do repositório corrente. Quando necessários, devem ser preservados em
armazenamento de arquivo separado do código ativo.

O site do projeto pode apontar para um protótipo, mas não pode carregar CSS ou
JavaScript dele. Esse limite é verificado automaticamente.

## Rotas canônicas

| Conteúdo | Rota a partir de `public/` |
| --- | --- |
| Página inicial | `index.html` |
| Auditoria de acessibilidade | `projeto/auditoria-acessibilidade/` |
| Fluxos dos protótipos | `projeto/fluxos-dos-prototipos/` |
| Estrutura atual revisada | `prototipos/estrutura-atual-revisada/` |
| Ações e resultados | `prototipos/estrutura-atual-revisada/acoes-e-resultados/` |
| Materiais e dados | `prototipos/estrutura-atual-revisada/materiais-e-dados/` |
| Cartilhas | `prototipos/estrutura-atual-revisada/materiais-e-dados/cartilhas/` |
| Eventos | `prototipos/estrutura-atual-revisada/eventos/` |
| Mentorias | `prototipos/estrutura-atual-revisada/mentorias/` |
| Palestras | `prototipos/estrutura-atual-revisada/palestras/` |
| Cooperação técnica | `prototipos/estrutura-atual-revisada/cooperacao-tecnica/` |
| Atendimento presencial | `prototipos/estrutura-atual-revisada/atendimento-presencial/` |
| Federações e secretarias | `prototipos/estrutura-atual-revisada/federacoes-e-secretarias/` |
| Página inicial orientada à ação | `prototipos/orientado-a-acao/` |

Os valores internos `data-version="V1"` e `data-version="V2"` continuam como
contratos técnicos de CSS. Eles não definem nomes de pastas nem URLs públicas.

## Propriedade dos recursos

- `projeto/assets/`: identidade visual compartilhada do site do projeto;
- `projeto/*/assets/`: recursos exclusivos de uma página do projeto;
- `prototipos/assets/`: base visual e imagens comuns aos protótipos;
- `prototipos/componentes/`: fontes canônicas e bundle gerado dos componentes;
- `prototipos/*/assets/`: recursos exclusivos de cada proposta;
- `vendor/`: dependências de terceiros, com procedência registrada em
  `docs/dependencias.md`.

## Compatibilidade

As 24 URLs anteriores são declaradas em
`tools/config/redirecionamentos.json` e geradas apenas em `_site/`.
Isso preserva links compartilhados sem manter páginas duplicadas em `public/`.
No workflow, o carimbo de versão acrescenta `version.json` e
`assets/cgdi-cache-check.js` somente ao artefato `_site/`; esses arquivos não
fazem parte da fonte.

## Adição de páginas

Uma página nova precisa ter rota semântica, ser alcançável pela home ou por um
índice canônico, possuir título, `main`, um único `h1`, skip-link, foco visível
e recursos locais. Depois da inclusão, execute `npm run check` e a validação
móvel adequada à mudança.
