# Estrutura da publicação

`public/index.html` é a entrada oficial. O conteúdo abaixo dela é separado em
duas famílias visuais independentes:

1. `projeto/` — auditorias, documentação navegável e futuras entregas do site;
2. `prototipos/` — propostas de interface e os componentes que as sustentam.

Recursos compartilhados pertencem à menor área que realmente os compartilha.
Assim, uma folha usada por várias páginas do projeto fica em
`projeto/assets/`; uma folha usada pelos dois protótipos fica em
`prototipos/assets/`; um recurso de uma única rota permanece junto dela.

Dependências externas comuns ficam em `vendor/`. Documentação, automações,
testes e materiais arquivados ficam fora de `public/`.

Os templates HTML em `prototipos/componentes/` são fragmentos, não páginas
navegáveis. A descoberta de páginas e o carimbo de publicação os excluem.
