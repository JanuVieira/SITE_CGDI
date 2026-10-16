# Ferramentas do projeto

Esta pasta não faz parte da publicação.

## Organização

- `scripts/`: geração, manutenção, servidor local e preparação do build;
- `testes/`: contratos estruturais, dados da auditoria e interações móveis;
- `configuracao/`: redirects e outros contratos declarativos.

## Ao adicionar uma página

1. Criar uma rota em minúsculas, ASCII e `kebab-case`, com `index.html`.
2. Manter recursos exclusivos em `assets/css`, `assets/js` e `assets/img`
   dentro da área responsável.
3. Criar um caminho navegável a partir da home ou de um índice canônico.
4. Incluir título, um único `h1`, `main`, skip-link, textos alternativos e
   estados de foco.
5. Executar `npm run check` e `npm run check:mobile`.

Compatibilidade com uma URL antiga deve ser declarada em
`configuracao/redirecionamentos.json`; não crie cópias estáticas em
`public/`.
