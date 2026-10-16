import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const componentRoot = new URL('../componentes/', import.meta.url);
const bundlePath = new URL('../componentes/templates.js', import.meta.url);
const canonicalTemplates = [
  'navegacao-prototipos/template.html',
  'ambiente-teste/template.html',
  'mapa/template.html',
  'calendario/template.html',
  'pre-download/template.html'
];

const previous = await readFile(bundlePath, 'utf8');
const match = previous.match(/window\.CGDI_COMPONENT_TEMPLATES\s*=\s*(\{[\s\S]*\});\s*$/);
if (!match) throw new Error('Não foi possível ler o bundle de templates atual.');

const templates = JSON.parse(match[1]);
for (const relativePath of canonicalTemplates) {
  templates[relativePath] = await readFile(new URL(relativePath, componentRoot), 'utf8');
}

const output = [
  '/* Gerado por scripts/generate-component-bundle.mjs. Não editar diretamente. */',
  `window.CGDI_COMPONENT_TEMPLATES = ${JSON.stringify(templates)};`,
  ''
].join('\n');

await writeFile(bundlePath, output, 'utf8');
console.log(`Bundle de componentes atualizado em ${root}componentes/templates.js`);
