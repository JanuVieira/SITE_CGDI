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
npm run check:responsive
npm run check:mobile
npm run check:browser
npm run build
npm run check:artifact
npm run check:published
npm run dev
```

`npm run check` é somente leitura. `npm run build` cria `../_site/` por uma
lista permitida e gera os redirects declarados em
`ferramentas/configuracao/redirecionamentos.json`.

`npm run check:artifact` deve ser executado logo depois do build, antes dos
carimbos exclusivos do workflow. Ele compara os arquivos publicados com
`public/`, valida os redirects declarados e rejeita qualquer arquivo fora da
allowlist.

`npm run check:published` valida o mesmo diretório depois dos carimbos de cache
e da integração de analytics. Esse modo aceita somente `version.json` e os três
arquivos gerados em `assets/`, confere o SHA do commit, as injeções únicas nas
páginas elegíveis, a ausência de GA nos redirects e o controle persistente de
preferências de privacidade. O workflow executa as duas validações nas etapas
correspondentes. Para verificar outro diretório, acrescente seu caminho ao
comando, por exemplo `npm run check:published -- ../site-final`.

## Testes no navegador

As verificações responsivas e de interação exigem:

- Node.js 22 a 25;
- Python 3 para o servidor estático local;
- Google Chrome ou Chromium com o protocolo de depuração na porta `9225`.

Em um terminal, inicie o site:

```sh
npm run dev
```

Em outro terminal, inicie um navegador headless. No macOS:

```sh
CGDI_CHROME_PROFILE="$(mktemp -d)"
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9225 \
  --user-data-dir="$CGDI_CHROME_PROFILE" \
  about:blank
```

No Linux, substitua o caminho pelo executável disponível, normalmente
`google-chrome` ou `chromium`. Com os dois serviços ativos, execute:

```sh
npm run check:browser
```

`check:browser` executa as duas suítes em sequência e consolida as falhas sem
deixar de iniciar a segunda quando a primeira falha. O workflow usa esse mesmo
runner e limita a etapa completa a 10 minutos.

Os endpoints podem ser personalizados com `CGDI_BASE_URL` e
`CGDI_CDP_ENDPOINT`. Os testes bloqueiam o carregamento dos iframes externos do
Power BI: eles validam o contêiner e o layout locais sem depender da rede ou da
disponibilidade de terceiros. O workflow de publicação inicia e encerra o
servidor e o Chrome automaticamente.

Veja [ARQUITETURA.md](ARQUITETURA.md) para as rotas e os contratos técnicos.
