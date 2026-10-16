# Código sem consumidor

Arquivos retirados de `VIGENTE/` em 2026-10-16 porque não participavam do
comportamento publicado:

- `ativos-globais/js/main.js`: procurava o shell no documento, mas o shell é
  renderizado em Shadow DOM e já possui comportamento em `componentes.js`;
- `ativos-globais/css/icon-alignment.css` e `shell-original.css`: não
  atravessavam o Shadow DOM; as regras úteis da skip-link foram consolidadas em
  `assets/css/prototipos-base.css`;
- `analises/acessibilidade/acessibilidade.js`: procurava uma tabela removida
  da página e não produzia efeito;
- `componentes/ambiente-teste/`: modal sem instâncias; destinos pendentes
  agora nascem sem `href` e recebem estado indisponível diretamente.

Esses arquivos são referência histórica. Não devem voltar ao site sem novo
consumidor, teste e registro no inventário.
