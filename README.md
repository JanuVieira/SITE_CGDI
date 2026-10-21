# Site CGDI

Repositório do site da auditoria do ambiente digital da CGDI e dos protótipos
de navegação do INPI.

O código-fonte da aplicação está em [`projeto-inpi-cgdi/`](projeto-inpi-cgdi/).
Consulte também a [documentação técnica do projeto](projeto-inpi-cgdi/README.md).

## Como baixar

### Opção 1 — baixar um arquivo ZIP

1. Na página do repositório no GitHub, clique em **Code**.
2. Selecione **Download ZIP**.
3. Descompacte o arquivo no computador.

Essa opção é indicada para quem quer apenas consultar ou executar o projeto,
sem trabalhar com o histórico do Git.

### Opção 2 — clonar com Git

Com o Git instalado, execute:

```sh
git clone https://github.com/JanuVieira/SITE_CGDI.git
cd SITE_CGDI/projeto-inpi-cgdi
```

Para baixar atualizações posteriormente:

```sh
git pull
```

## Como executar localmente

O projeto requer Node.js 22 a 25. Não há dependências externas para instalar.
Dentro da pasta `projeto-inpi-cgdi`, execute:

```sh
npm run dev
```

Depois, abra no navegador o endereço informado pelo servidor.

Para validar os arquivos antes de publicar:

```sh
npm run check
npm run build
npm run check:artifact
```

O build é criado em `_site/`. Essa pasta e os demais arquivos locais listados
no `.gitignore` não fazem parte do código versionado.
