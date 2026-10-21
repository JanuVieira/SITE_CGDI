# Site CGDI

Site da auditoria do ambiente digital da CGDI e fonte dos protótipos de
navegação do INPI.

## Estrutura do repositório

```text
SITE_CGDI/
├── public/          # conteúdo publicado no GitHub Pages
│   ├── index.html   # página inicial oficial
│   ├── projeto/     # auditorias, fluxos e entregas institucionais
│   ├── prototipos/  # propostas navegáveis e componentes compartilhados
│   └── vendor/      # dependências externas mantidas localmente
├── docs/            # arquitetura, dependências e referências
├── tools/           # scripts, configuração do build e testes
├── .github/         # automação de validação e publicação
├── package.json
└── README.md
```

Somente `public/` é fonte do site publicado. `docs/` e `tools/` nunca entram
no artefato de produção.

## Como baixar

### Baixar um arquivo ZIP

1. Na página do repositório no GitHub, clique em **Code**.
2. Selecione **Download ZIP**.
3. Descompacte o arquivo no computador.

Essa opção é indicada para quem quer apenas consultar ou executar o projeto,
sem trabalhar com o histórico do Git.

### Clonar com Git

Com o Git instalado, execute:

```sh
git clone https://github.com/JanuVieira/SITE_CGDI.git
cd SITE_CGDI
```

Para baixar atualizações posteriormente:

```sh
git pull
```

## Como executar localmente

O projeto requer Node.js 22 a 25 e Python 3. Não há pacotes npm externos para
instalar. Na raiz do repositório, execute:

```sh
npm run dev
```

Depois, abra no navegador o endereço informado pelo servidor.

## Validação e build

```sh
npm run check
npm run build
npm run check:artifact
```

O build é criado em `_site/` e não faz parte do código versionado.

As validações de interação e responsividade também exigem Google Chrome ou
Chromium com o protocolo de depuração na porta `9225`. Os comandos disponíveis
estão documentados em [`tools/README.md`](tools/README.md).

## Organização do conteúdo

- Nova página do projeto: `public/projeto/<nome-da-pagina>/index.html`.
- Nova página de protótipo: `public/prototipos/<nome-do-prototipo>/`.
- Recursos compartilhados pelo site: `public/projeto/assets/`.
- Recursos compartilhados pelos protótipos: `public/prototipos/assets/` ou
  `public/prototipos/componentes/`.
- Recurso exclusivo de uma página: diretório `assets/` dentro da própria rota.

Não importe CSS ou JavaScript de `prototipos/` nas páginas de `projeto/`.
Links de navegação entre as duas áreas são permitidos.

## Convenções

- nomes ativos em minúsculas, ASCII e `kebab-case`;
- um diretório com `index.html` para cada rota navegável;
- código gerado identificado e nunca editado diretamente;
- compatibilidade com URLs antigas gerada no build, sem cópias na fonte;
- materiais históricos e backups permanecem fora do repositório ativo.

Consulte a [arquitetura](docs/arquitetura.md), a
[estrutura pública](docs/estrutura-publica.md) e a
[documentação dos componentes](docs/componentes.md) para conhecer os contratos
técnicos do projeto.
