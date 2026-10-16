import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = async version => (await readdir(join(root, 'projetos', version), { recursive: true })).filter(file => file.endsWith('.html'));
const required = [
  'componentes/componentes.css',
  'componentes/shell/shell.css',
  'componentes/fundamentos.css',
  'componentes/templates.js',
  'componentes/componentes.js'
];
const externalInteraction = /<(?:a|form|iframe)\b[^>]*(?:href|action|src)="(?:https?:)?\/\/|<(?:a|form)\b[^>]*(?:href|action)="(?:mailto:|tel:)/i;
const externalResource = /<link\b(?=[^>]*\bhref="(?:https?:)?\/\/)[^>]*>/i;

function collectAttributeValues(html, attribute) {
  return [...html.matchAll(new RegExp(`\\b${attribute}="([^"]+)"`, 'gi'))].map(match => match[1]);
}

const v1 = await pages('v1');
const v2 = await pages('v2');
assert.ok(v1.length > 0, 'V1 deve manter suas páginas HTML.');
assert.deepEqual(v2, ['p00.html'], 'V2 deve publicar somente sua home nesta etapa.');
assert.deepEqual(await pages('v3'), [], 'V3 deve permanecer reservada e sem HTML.');
assert.deepEqual(await pages('v4'), [], 'V4 deve permanecer reservada e sem HTML.');

for (const [version, files] of [['v1', v1], ['v2', v2]]) {
  for (const file of files) {
    const html = await readFile(join(root, 'projetos', version, file), 'utf8');
    for (const path of required) assert.match(html, new RegExp(path.replaceAll('.', '\\.').replaceAll('/', '\\/')));
    for (const component of ['cgdi-prototype-nav', 'cgdi-portal-top', 'cgdi-breadcrumb', 'cgdi-page-intro', 'cgdi-page-feedback', 'cgdi-portal-footer']) {
      assert.match(html, new RegExp(`<${component}\\b`), `${version}/${file} deve declarar ${component}`);
    }
    assert.doesNotMatch(html, externalInteraction, `${version}/${file} não deve expor saída externa pelo protótipo`);
    assert.doesNotMatch(html, externalResource, `${version}/${file} não deve carregar recurso externo.`);
    assert.match(html, /http-equiv="Content-Security-Policy"/i, `${version}/${file} deve bloquear carregamentos externos.`);
    assert.doesNotMatch(html, /__CGDI_[A-Z0-9_]+__/, `${version}/${file} não deve publicar marcadores de build.`);
    assert.doesNotMatch(html, /<a\b[^>]*\bhref="p(?:0[3-9]|1[0-3]|1[5-9]|[2-9]\d)\.html"/i, `${version}/${file} não deve apontar para páginas V1 ainda não publicadas.`);

    const ids = collectAttributeValues(html, 'id');
    assert.equal(new Set(ids).size, ids.length, `${version}/${file} não deve repetir IDs.`);
    const idSet = new Set(ids);
    for (const fragment of collectAttributeValues(html, 'href').filter(value => value.startsWith('#') && value.length > 1 && value !== '#cgdi-ambiente-teste')) {
      assert.ok(idSet.has(fragment.slice(1)), `${version}/${file} deve resolver o fragmento interno ${fragment}.`);
    }
    for (const controlled of collectAttributeValues(html, 'aria-controls')) {
      assert.ok(idSet.has(controlled), `${version}/${file} deve associar aria-controls="${controlled}" a um ID existente.`);
    }
  }
}

const v1Home = await readFile(join(root, 'projetos', 'v1', 'p00.html'), 'utf8');
assert.doesNotMatch(v1Home, /<h1[^>]*>INPI para empreender e inovar<\/h1>\s*<p>/, 'V1 não deve ter texto auxiliar abaixo do h1.');
assert.match(v1Home, /href="p02\.html"/, 'O segundo card da V1 deve levar à P02.');
assert.match(v1Home, /meta name="cgdi-prototype-version" content="V1"/, 'A Home V1 deve declarar sua versão sem marcador pendente.');
assert.match(v1Home, /href="\.\.\/\.\.\/index\.html"/, 'A Home V1 deve retornar à entrada interna dos protótipos.');
const v1P02 = await readFile(join(root, 'projetos', 'v1', 'p02.html'), 'utf8');
assert.match(v1P02, /<h1[^>]*>Materiais e dados do INPI<\/h1>/, 'A P02 deve apresentar seu título editorial.');
assert.equal((v1P02.match(/<cgdi-card(?!-)\b/g) || []).length, 6, 'A P02 deve usar seis cards reutilizáveis.');
assert.doesNotMatch(v1P02, /<cgdi-pre-download\b/, 'A P02 deve manter apenas cards padrão na grade de conteúdos.');
assert.match(v1P02, /href="p14\.html"/, 'O card de Cartilhas da P02 deve levar à página interna de cartilhas.');
const v1P14 = await readFile(join(root, 'projetos', 'v1', 'p14.html'), 'utf8');
assert.equal((v1P14.match(/<cgdi-pre-download\b/gi) || []).length, 2, 'A P14 deve apresentar as duas cartilhas com cgdi-pre-download.');
for (const marker of ['pd-card-body', 'pd-cover-mask', 'pd-file', 'pd-subjects', 'pd-details', 'pd-metadata', 'pd-primary-actions', 'data-pd-toggle']) {
  assert.match(v1P14, new RegExp(marker), `A P14 deve manter a estrutura canônica do pré-download: ${marker}.`);
}
assert.match(v1P14, /aria-controls="pd-details-pi"/, 'O controle da primeira cartilha deve estar associado aos detalhes.');
assert.match(v1P14, /aria-controls="pd-details-software"/, 'O controle da segunda cartilha deve estar associado aos detalhes.');
const v2Home = await readFile(join(root, 'projetos', 'v2', 'p00.html'), 'utf8');
assert.match(v2Home, /<li aria-current="page">INPI para empreender e inovar · V2<\/li>/, 'V2 deve ter breadcrumb interno e objetivo.');
assert.match(v2Home, /<a href="\.\.\/\.\.\/index\.html">[\s\S]*?Versões dos protótipos/, 'V2 deve retornar à entrada interna dos protótipos.');

const feedbackScript = await readFile(join(root, 'componentes', 'pesquisa', 'pesquisa.js'), 'utf8');
const feedbackStyle = await readFile(join(root, 'componentes', 'pesquisa', 'pesquisa.css'), 'utf8');
const mapTemplate = await readFile(join(root, 'componentes', 'mapa', 'template.html'), 'utf8');
const componentStyle = await readFile(join(root, 'componentes', 'componentes.css'), 'utf8');
const componentScript = await readFile(join(root, 'componentes', 'componentes.js'), 'utf8');
assert.match(feedbackScript, /cgdi-feedback-stepper/, 'O modal de pesquisa deve ter stepper.');
assert.match(feedbackStyle, /cgdi-feedback-stepper-item\.is-active/, 'O stepper deve apresentar estado ativo.');
assert.doesNotMatch(mapTemplate, /<text[^>]*>[^<]{3,}<\/text>/, 'O mapa deve exibir siglas, não nomes extensos.');
assert.match(componentStyle, /cgdi-map \.states-map svg a text \{[\s\S]*?fill:#1b1b1b!important;[\s\S]*?font-weight:400!important;[\s\S]*?stroke:none!important;/, 'As siglas do mapa devem usar peso regular e contraste sobre a paleta clara.');
assert.match(componentStyle, /cgdi-map \.states-map svg \.sudeste \{ fill:#d1d9ff!important; \}/, 'O mapa deve preservar a paleta clara original.');
assert.match(componentStyle, /\.states-info > p \{ color:#fff!important; \}/, 'O texto ao lado do mapa deve ter contraste sobre o fundo azul.');
assert.match(componentStyle, /cgdi-map \.states-map svg a:focus-visible path/, 'O mapa deve ter foco visível nas unidades federativas.');
assert.match(componentScript, /card\.classList\.add\('cgdi-card', 'br-card'\)/, 'Todos os cards reutilizáveis devem receber a classe estrutural br-card do GOV.BR.');

console.log(`Vigente validado: ${v1.length} página(s) V1, ${v2.length} página V2 e V3/V4 reservadas.`);
