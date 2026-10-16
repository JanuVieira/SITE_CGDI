import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = new URL('../../public/projeto/auditoria-acessibilidade/dados/auditoria-acessibilidade.json', import.meta.url);
const data = JSON.parse(await readFile(source, 'utf8'));
assert.equal(data.texto_nativo.inteiro + data.texto_nativo.ausente + data.texto_nativo.parcial, data.texto_nativo.total_registros);
const expected = new Map([['pdf-sem-estrutura',62.6],['pdf-sem-idioma',64.5],['pdf-sem-titulo',54.7]]);
for (const item of data.descobertas.filter(item => expected.has(item.id))) {
  const calculated = Math.round(item.quantidade / item.denominador * 1000) / 10;
  assert.equal(calculated, expected.get(item.id), `${item.id}: percentual inconsistente`);
  assert.equal(item.denominador, data.escopo.pdfs_unicos, `${item.id}: denominador deve usar PDFs únicos`);
}
for (const item of data.descobertas.filter(item => item.capitulo !== 'pdf')) assert.equal(item.percentual, null, `${item.id}: não deve publicar percentual sem denominador validado`);

console.log('Dados da auditoria de acessibilidade validados: somas, percentuais e denominadores conferem.');
