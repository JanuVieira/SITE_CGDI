# projeto-inpi-cgdi

Site da auditoria do ambiente digital da CGDI e fonte dos protótipos de
navegação do INPI.

## Duas famílias visuais

A publicação é dividida por responsabilidade:

- `public/projeto/`: páginas do site do projeto, como auditorias, fluxos e as
  próximas entregas institucionais;
- `public/prototipos/`: propostas navegáveis, componentes e recursos visuais
  exclusivos dos protótipos.

`public/index.html` é a única página inicial oficial. Ela conecta documentos,
planilhas, páginas do projeto e protótipos, sem misturar os dois sistemas
visuais.

```text
projeto-inpi-cgdi/
├── public/
│   ├── index.html
│   ├── projeto/
│   │   ├── assets/
│   │   ├── auditoria-acessibilidade/
│   │   └── fluxos-dos-prototipos/
│   ├── prototipos/
│   │   ├── assets/
│   │   ├── componentes/
│   │   ├── estrutura-atual-revisada/
│   │   └── orientado-a-acao/
│   └── vendor/
├── documentacao/
├── ferramentas/
└── quarentena/
```

## Onde criar novas páginas

- Nova página do projeto: `public/projeto/<nome-da-pagina>/index.html`.
- Nova página de um protótipo: dentro da proposta responsável em
  `public/prototipos/<nome-do-prototipo>/`.
- Recurso compartilhado somente pelo site: `public/projeto/assets/`.
- Recurso compartilhado somente pelos protótipos: `public/prototipos/assets/`
  ou `public/prototipos/componentes/`.
- Recurso exclusivo de uma página: `assets/` dentro da própria rota.

Não importe CSS ou JavaScript de `prototipos/` em páginas de `projeto/`. Links
de navegação entre as duas áreas são permitidos.

## Convenções

- nomes em minúsculas, ASCII e `kebab-case`;
- uma pasta com `index.html` para cada rota navegável;
- código gerado identificado e nunca editado diretamente;
- conteúdo incerto preservado em `quarentena/`, fora da publicação;
- compatibilidade com URLs antigas gerada no build, sem cópias na fonte.

## Comandos

Execute a partir desta pasta:

```sh
npm run generate:components
npm run check
npm run check:mobile
npm run build
npm run dev
```

`npm run check` é somente leitura. `npm run build` cria `../_site/` por uma
lista permitida e gera os redirects declarados em
`ferramentas/configuracao/redirecionamentos.json`.

Veja [ARQUITETURA.md](ARQUITETURA.md) para as rotas e os contratos técnicos.
