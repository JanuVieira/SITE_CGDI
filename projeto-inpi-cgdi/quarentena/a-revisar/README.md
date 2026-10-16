# Materiais para sanitização

Esta pasta reúne materiais que não pertencem à arquitetura ativa, mas podem
conter dados, documentação, mídia ou código aproveitáveis após revisão.

A única página inicial oficial do projeto está em `../../public/index.html`.
Nenhum arquivo desta pasta deve ser publicado, carregado por uma página ativa
ou tratado como fonte canônica antes de ser sanitizado e validado.

## Estrutura

- `dados/`: relatórios e conjuntos de dados que precisam de validação;
- `documentacao/`: análises e documentos potencialmente desatualizados;
- `midia/`: imagens e outros arquivos visuais selecionados para tratamento;
- `codigo/`: trechos ou implementações que exigem revisão antes do reuso;
- `paginas/`: páginas obsoletas ou incompletas mantidas para análise;
- `codigo/sem-consumidor/`: implementações retiradas do ativo por não terem
  consumidor;
- `paginas/redirecionamentos-estaticos/`: redirects preservados depois de
  serem substituídos por geração no build.

## Processo de promoção

1. Confirmar origem, licença, atualidade e consumidor do item.
2. Normalizar o nome para minúsculas em `kebab-case`, sem acentos.
3. Corrigir o tipo e a extensão, remover metadados desnecessários e eliminar
   dependências quebradas.
4. Validar conteúdo, links, acessibilidade e comportamento responsivo.
5. Registrar a decisão no manifesto antes de mover o item para a estrutura
   ativa.

O diretório irmão `../legado/` preserva o material bruto. Seu
conteúdo não deve ser modificado durante a sanitização; itens reaproveitáveis
devem ser derivados dele e rastreados pelo hash de origem.
