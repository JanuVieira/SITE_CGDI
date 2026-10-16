# Storytelling da auditoria INPI

Página editorial isolada em `diagnosticos/index.html`, com estilos próprios e dados estruturados em `diagnosticos/data/auditoria-inpi.json`.

## Fonte e limites

A implementação usa somente os números, ressalvas e orientações presentes no prompt recebido em 15/10/2026. O arquivo citado como fonte canônica, `INPI_storytelling_completo.md`, não acompanhou o anexo. Por isso, exemplos reais, URLs de evidência e referências detalhadas da matriz não foram inventados nem publicados.

As categorias automatizadas são apresentadas como sinais para revisão. URLs, ocorrências, registros e PDFs únicos permanecem separados. Categorias sobrepostas não são somadas.

## Verificação

Execute `npm run check`. O teste adicional confere a soma dos registros de texto nativo, os percentuais dos PDFs e seus denominadores.
