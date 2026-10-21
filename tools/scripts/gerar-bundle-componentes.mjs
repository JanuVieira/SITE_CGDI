import { readFile, writeFile } from 'node:fs/promises';

const componentRoot = new URL('../../public/prototipos/componentes/', import.meta.url);
const bundlePath = new URL('../../public/prototipos/componentes/templates-gerados.js', import.meta.url);
const canonicalTemplates = [
  'portal/template.html',
  'navegacao-prototipos/template.html',
  'calendario/template.html',
  'pre-download/template.html'
];

const entries = await Promise.all(canonicalTemplates.map(async relativePath => [
  relativePath,
  await readFile(new URL(relativePath, componentRoot), 'utf8')
]));
const templates = Object.fromEntries(entries);
const output = [
  '/* Gerado por tools/scripts/gerar-bundle-componentes.mjs. Não editar diretamente. */',
  'window.CGDI_COMPONENT_TEMPLATES = ' + JSON.stringify(templates) + ';',
  ''
].join('\n');

if (process.argv.includes('--check')) {
  const current = await readFile(bundlePath, 'utf8');
  if (current !== output) {
    throw new Error('O bundle componentes/templates-gerados.js está desatualizado. Execute npm run generate:components.');
  }
  console.log('Bundle de componentes sincronizado com as quatro fontes canônicas.');
} else {
  await writeFile(bundlePath, output, 'utf8');
  console.log('Bundle de componentes gerado a partir das quatro fontes canônicas.');
}
