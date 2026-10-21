# Ferramentas do projeto

Esta pasta não faz parte da publicação.

## Organização

- `scripts/`: geração, manutenção, servidor local e preparação do build;
- `tests/`: contratos estruturais, dados da auditoria e interações móveis;
- `config/`: redirects e outros contratos declarativos.

## Ao adicionar uma página

1. Criar uma rota em minúsculas, ASCII e `kebab-case`, com `index.html`.
2. Manter recursos exclusivos em `assets/css`, `assets/js` e `assets/img`
   dentro da área responsável.
3. Criar um caminho navegável a partir da home ou de um índice canônico.
4. Incluir título, um único `h1`, `main`, skip-link, textos alternativos e
   estados de foco.
5. Executar `npm run check` e `npm run check:mobile`.

Compatibilidade com uma URL antiga deve ser declarada em
`config/redirecionamentos.json`; não crie cópias estáticas em
`public/`.

## Testes no navegador

As verificações responsivas e de interação exigem Node.js 22 a 25, Python 3 e
Google Chrome ou Chromium com o protocolo de depuração na porta `9225`.

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

No Linux, use o executável disponível, normalmente `google-chrome` ou
`chromium`. Com o servidor e o navegador ativos, execute:

```sh
npm run check:browser
```

Os endpoints podem ser personalizados com `CGDI_BASE_URL` e
`CGDI_CDP_ENDPOINT`. Os testes bloqueiam iframes externos do Power BI para
validar o contêiner e o layout locais sem depender de serviços de terceiros.
