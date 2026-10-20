import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../public/', import.meta.url));
const redirectConfigPath = new URL('../configuracao/redirecionamentos.json', import.meta.url);
const requiredEntries = [
  'index.html',
  'projeto/auditoria-acessibilidade/index.html',
  'projeto/fluxos-dos-prototipos/index.html',
  'prototipos/estrutura-atual-revisada/index.html',
  'prototipos/orientado-a-acao/index.html'
];
const pageRoots = [
  'projeto',
  'prototipos/estrutura-atual-revisada',
  'prototipos/orientado-a-acao'
];
const localAttributes = /\b(?:href|src|poster|data-source)\s*=\s*["']([^"']*)["']/gi;
const externalStylesOrScripts = /<(?:link|script)\b[^>]*(?:href|src)=["'](?:https?:)?\/\//i;
const ignoredSchemes = /^(?:data:|blob:|mailto:|tel:|javascript:|https?:|\/\/)/i;
const cleanName = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr'
]);

async function listFiles(directory, extension = '') {
  try {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && (!extension || entry.name.endsWith(extension)))
      .map(entry => join(entry.parentPath, entry.name));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function exists(path) {
  try {
    return await stat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function publicName(path) {
  return relative(root, path).split(sep).join('/');
}

function collectAttributeValues(html, attribute) {
  const pattern = new RegExp("\\b" + attribute + "\\s*=\\s*([\"'])(.*?)\\1", 'gis');
  return [...html.matchAll(pattern)].map(match => match[2]);
}

function attributeFromTag(tag, attribute) {
  const pattern = new RegExp("\\b" + attribute + "\\s*=\\s*([\"'])(.*?)\\1", 'is');
  return tag.match(pattern)?.[2] ?? null;
}

function hasAttribute(tag, attribute) {
  const pattern = new RegExp("\\s" + attribute + "(?:\\s*=|\\s|/?>)", 'i');
  return pattern.test(tag);
}

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

// A validação não precisa construir um DOM completo, mas precisa respeitar a
// ancestralidade para não considerar links dentro de conteúdo oculto como
// rotas navegáveis e para conferir a estrutura das listas.
function inspectMarkup(html) {
  const stack = [];
  const navigableHrefs = [];
  const orphanListItems = [];
  const tokens = html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>/gi);

  for (const match of tokens) {
    const token = match[0];
    if (token.startsWith('<!--') || /^<![^-]/.test(token)) continue;
    const parsed = token.match(/^<\s*(\/?)\s*([a-z][\w:-]*)/i);
    if (!parsed) continue;
    const closing = parsed[1] === '/';
    const tagName = parsed[2].toLowerCase();

    if (closing) {
      const openIndex = stack.map(entry => entry.tagName).lastIndexOf(tagName);
      if (openIndex !== -1) stack.length = openIndex;
      continue;
    }

    const style = attributeFromTag(token, 'style') || '';
    const hidden = stack.some(entry => entry.hidden)
      || tagName === 'template'
      || hasAttribute(token, 'hidden')
      || hasAttribute(token, 'inert')
      || attributeFromTag(token, 'aria-hidden')?.toLowerCase() === 'true'
      || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(style);

    if (tagName === 'li' && !stack.some(entry => ['ul', 'ol', 'menu'].includes(entry.tagName))) {
      orphanListItems.push(lineAt(html, match.index));
    }

    if (tagName === 'a') {
      const href = attributeFromTag(token, 'href');
      const disabled = hasAttribute(token, 'disabled')
        || attributeFromTag(token, 'aria-disabled')?.toLowerCase() === 'true';
      if (!hidden && !disabled && href) navigableHrefs.push(href);
    }

    if (!voidElements.has(tagName) && !/\/\s*>$/.test(token)) {
      stack.push({ tagName, hidden });
    }
  }

  return { navigableHrefs, orphanListItems };
}

function breadcrumbFragments(html) {
  const customElements = html.match(/<cgdi-breadcrumb\b[^>]*>[\s\S]*?<\/cgdi-breadcrumb>/gi) || [];
  const navigationElements = html.match(
    /<nav\b[^>]*(?:class|id)=["'][^"']*(?:breadcrumb|breadcrumbs|cgdi-crumb)[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi
  ) || [];
  return [...customElements, ...navigationElements];
}

function normalizedHref(owner, href) {
  const value = href.replaceAll('&amp;', '&').trim();
  try {
    const url = new URL(value, `https://cgdi.invalid/${publicName(owner)}`);
    url.pathname = url.pathname.replace(/\/index\.html$/, '/');
    return url.href;
  } catch {
    return value;
  }
}

async function resolveLocalReference(owner, rawReference) {
  const reference = rawReference.replaceAll('&amp;', '&').trim();
  if (!reference || reference.startsWith('#') || ignoredSchemes.test(reference) || reference.startsWith('/')) return null;
  const pathPart = reference.split(/[?#]/, 1)[0];
  if (!pathPart) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    assert.fail(publicName(owner) + ' contém caminho local inválido: ' + rawReference);
  }

  let target = resolve(dirname(owner), decoded);
  const outside = relative(root, target);
  assert.ok(
    outside !== '..' && !outside.startsWith('..' + sep),
    publicName(owner) + ' referencia arquivo fora de public: ' + rawReference
  );

  let targetStat = await exists(target);
  if (targetStat?.isDirectory()) {
    target = join(target, 'index.html');
    targetStat = await exists(target);
  } else if (!targetStat && !extname(target)) {
    target = join(target, 'index.html');
    targetStat = await exists(target);
  }
  assert.ok(
    targetStat?.isFile(),
    publicName(owner) + ' referencia arquivo local ausente: ' + rawReference
  );
  return target;
}

for (const entry of requiredEntries) {
  assert.ok(
    (await exists(join(root, entry)))?.isFile(),
    'Entrada pública obrigatória ausente: ' + entry
  );
}

for (const developmentEntry of [
  'analises', 'assets', 'componentes', 'diagnosticos', 'projetos', 'scripts',
  'ferramentas', 'package.json', 'package-lock.json', 'node_modules',
  'quarentena', 'README.md'
]) {
  assert.equal(
    await exists(join(root, developmentEntry)),
    null,
    'Conteúdo não canônico não deve permanecer na raiz public: ' + developmentEntry
  );
}

const allFiles = await listFiles(root);
assert.equal(
  allFiles.filter(file => extname(file).toLowerCase() === '.md').length,
  0,
  'Documentação Markdown deve permanecer fora de public.'
);
for (const file of allFiles) {
  for (const segment of publicName(file).split('/')) {
    if (segment === 'README.md') continue;
    assert.match(
      segment,
      cleanName,
      'Nome fora do padrão minúsculas/ASCII/kebab-case: ' + publicName(file)
    );
  }
}

const pages = [join(root, 'index.html')];
for (const directory of pageRoots) pages.push(...await listFiles(join(root, directory), '.html'));
pages.sort();
assert.ok(pages.length >= requiredEntries.length, 'Nenhuma coleção de páginas ativas foi encontrada.');

const pageSet = new Set(pages.map(page => resolve(page)));
const directOnlyPages = new Set([
  resolve(join(root, 'projeto/fluxos-dos-prototipos/index.html'))
]);
const graph = new Map();
let referenceCount = 0;

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const name = publicName(page);
  const markup = inspectMarkup(html);
  assert.match(html, /<!doctype html>/i, name + ' deve declarar HTML5.');
  assert.match(html, /<html\b[^>]*\blang=["']pt-BR["']/i, name + ' deve declarar pt-BR.');
  assert.match(html, /<meta\b[^>]*\bname=["']viewport["']/i, name + ' deve declarar viewport responsivo.');
  assert.match(html, /<title>[^<]+<\/title>/i, name + ' deve apresentar título não vazio.');
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const descriptionTags = metaTags.filter(tag =>
    attributeFromTag(tag, 'name')?.toLowerCase() === 'description'
  );
  assert.equal(descriptionTags.length, 1, name + ' deve apresentar uma única meta description.');
  const description = attributeFromTag(descriptionTags[0], 'content')?.trim() || '';
  assert.ok(
    description.length >= 50 && description.length <= 180,
    name + ' deve apresentar meta description entre 50 e 180 caracteres.'
  );
  const cspTags = metaTags.filter(tag =>
    attributeFromTag(tag, 'http-equiv')?.toLowerCase() === 'content-security-policy'
  );
  assert.equal(cspTags.length, 1, name + ' deve apresentar uma única política CSP.');
  const csp = attributeFromTag(cspTags[0], 'content') || '';
  assert.match(csp, /\bbase-uri\s+'self'(?:\s*;|$)/, name + ' deve restringir base-uri na CSP.');
  assert.match(csp, /\bobject-src\s+'none'(?:\s*;|$)/, name + ' deve bloquear object-src na CSP.');
  assert.match(csp, /\bscript-src\s+'self'(?:\s*;|$)/, name + ' deve restringir scripts na CSP.');
  assert.match(html, /<main\b/i, name + ' deve apresentar uma região main.');
  assert.match(
    html,
    /<a\b[^>]*class=["'][^"']*(?:skip-link|shell-skip)[^"']*["'][^>]*href=["']#[^"']+["']/i,
    name + ' deve oferecer link para pular ao conteúdo.'
  );
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, name + ' deve apresentar exatamente um h1.');
  assert.doesNotMatch(html, externalStylesOrScripts, name + ' não deve carregar CSS ou JavaScript externo.');
  assert.doesNotMatch(
    html,
    /(?:href|src)=["'][^"']*(?:projetos\/v[12]|diagnosticos\/|analises\/(?:acessibilidade|fluxos)\/|prototipos\/estrutura-atual\/)/i,
    name + ' ainda referencia uma rota descontinuada.'
  );

  if (name.startsWith('projeto/')) {
    const htmlWithoutSharedPreDownload = html.replace(
      /<(?:link|script)\b[^>]*(?:href|src)=["'][^"']*prototipos\/componentes\/pre-download\/pre-download\.(?:css|js)["'][^>]*>(?:<\/script>)?/gi,
      ''
    );
    assert.doesNotMatch(
      htmlWithoutSharedPreDownload,
      /<(?:link|script)\b[^>]*(?:href|src)=["'][^"']*prototipos\//i,
      name + ' não deve carregar recursos dos protótipos além do componente compartilhado de pré-download.'
    );
  }

  if (name.startsWith('prototipos/')) {
    assert.doesNotMatch(html, /<style\b/i, name + ' deve manter estilos em arquivos CSS.');
    assert.match(
      html,
      /frame-src 'self' https:\/\/app\.powerbi\.com/,
      name + ' deve aplicar a política de frames oficial dos protótipos.'
    );
  }

  const ids = collectAttributeValues(html, 'id');
  assert.equal(new Set(ids).size, ids.length, name + ' não deve repetir IDs.');
  const idSet = new Set(ids);
  const fragments = collectAttributeValues(html, 'href')
    .filter(value => value.startsWith('#') && value.length > 1);
  for (const fragment of fragments) {
    assert.ok(idSet.has(fragment.slice(1)), name + ' deve resolver o fragmento interno ' + fragment + '.');
  }
  for (const controlled of collectAttributeValues(html, 'aria-controls')) {
    assert.ok(
      idSet.has(controlled),
      name + ' deve associar aria-controls="' + controlled + '" a um ID existente.'
    );
  }

  assert.deepEqual(
    markup.orphanListItems,
    [],
    name + ' contém <li> fora de <ul>, <ol> ou <menu> nas linhas ' + markup.orphanListItems.join(', ') + '.'
  );

  const breadcrumbs = breadcrumbFragments(html);
  assert.ok(breadcrumbs.length <= 1, name + ' não deve apresentar breadcrumbs duplicados.');
  for (const breadcrumb of breadcrumbs) {
    const seenHrefs = new Set();
    for (const href of collectAttributeValues(breadcrumb, 'href')) {
      const key = normalizedHref(page, href);
      assert.ok(!seenHrefs.has(key), name + ' repete o destino ' + href + ' no breadcrumb.');
      seenHrefs.add(key);
    }
  }

  for (const match of html.matchAll(/<[a-z][^>]*\bdata-v2-inert-action\b[^>]*>/gi)) {
    const tag = match[0];
    const disabled = hasAttribute(tag, 'disabled')
      || hasAttribute(tag, 'inert')
      || attributeFromTag(tag, 'aria-disabled')?.toLowerCase() === 'true';
    const destination = attributeFromTag(tag, 'href') || attributeFromTag(tag, 'formaction');
    assert.ok(
      disabled || (destination && destination !== '#' && !/^javascript:/i.test(destination)),
      name + ':' + lineAt(html, match.index) + ' contém controle data-v2-inert-action acionável sem destino.'
    );
  }

  if (name === 'prototipos/orientado-a-acao/index.html') {
    assert.doesNotMatch(
      html,
      /indispon[ií]vel/i,
      name + ' não deve acrescentar “indisponível” aos rótulos dos controles.'
    );
    const buttons = html.match(/<button\b[^>]*>/gi) || [];
    for (const button of buttons) {
      assert.ok(!hasAttribute(button, 'disabled'), name + ' deve manter todos os botões visualmente habilitados.');
      assert.ok(!/\bv2-action-off\b/i.test(button), name + ' não deve aplicar estado visual desabilitado aos botões.');
    }
  }

  for (const imageTag of html.match(/<img\b[^>]*>/gi) || []) {
    assert.notEqual(attributeFromTag(imageTag, 'alt'), null, name + ' contém imagem sem atributo alt.');
  }
  for (const anchorTag of html.match(/<a\b[^>]*>/gi) || []) {
    const href = attributeFromTag(anchorTag, 'href');
    const target = attributeFromTag(anchorTag, 'target');
    const rel = new Set(
      (attributeFromTag(anchorTag, 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean)
    );
    if (target === '_blank') {
      assert.ok(
        rel.has('noopener') && rel.has('noreferrer'),
        name + ' deve proteger links target="_blank".'
      );
    }
    if (attributeFromTag(anchorTag, 'data-cgdi-link-oficial') === 'true') {
      assert.match(
        href || '',
        /^(?:https:\/\/|mailto:)/i,
        name + ' contém link oficial sem destino HTTPS ou e-mail.'
      );
    }
  }

  for (const match of html.matchAll(localAttributes)) {
    referenceCount += 1;
    await resolveLocalReference(page, match[1]);
  }
  const edges = new Set();
  for (const href of markup.navigableHrefs) {
    const target = await resolveLocalReference(page, href);
    if (target && pageSet.has(resolve(target))) edges.add(resolve(target));
  }
  graph.set(resolve(page), edges);
}

for (const cssFile of allFiles.filter(file => extname(file) === '.css')) {
  const css = await readFile(cssFile, 'utf8');
  for (const match of css.matchAll(/url\(\s*(?:["']([^"']+)["']|([^)"'\s]+))\s*\)/gi)) {
    referenceCount += 1;
    await resolveLocalReference(cssFile, match[1] || match[2]);
  }
}

const reachable = new Set();
const queue = [resolve(join(root, 'index.html'))];
while (queue.length) {
  const current = queue.shift();
  if (reachable.has(current)) continue;
  reachable.add(current);
  for (const target of graph.get(current) || []) {
    if (!reachable.has(target)) queue.push(target);
  }
}
for (const page of pageSet) {
  if (directOnlyPages.has(page)) continue;
  assert.ok(
    reachable.has(page),
    'Página canônica não alcançável a partir da home: ' + publicName(page)
  );
}

const home = await readFile(join(root, 'index.html'), 'utf8');
for (const requiredHref of [
  'https://docs.google.com/document/',
  'https://drive.google.com/drive/folders/',
  'projeto/auditoria-acessibilidade/index.html',
  'prototipos/estrutura-atual-revisada/index.html',
  'prototipos/orientado-a-acao/index.html'
]) {
  assert.ok(home.includes(requiredHref), 'A home deve preservar o acesso a ' + requiredHref);
}

const bookletPage = await readFile(
  join(root, 'prototipos', 'estrutura-atual-revisada', 'materiais-e-dados', 'cartilhas', 'index.html'),
  'utf8'
);
const preDownloadActions = bookletPage.match(/<a\b[^>]*\bpd-action\b[^>]*>/gi) || [];
assert.equal(preDownloadActions.length, 4, 'A página de cartilhas deve apresentar quatro ações de arquivo.');
assert.equal((bookletPage.match(/class=["']pd-file-size["']/gi) || []).length, 2, 'Cada cartilha deve informar o tamanho do PDF.');
for (const action of preDownloadActions) {
  const href = attributeFromTag(action, 'href') || '';
  assert.match(href, /^https:\/\/www\.gov\.br\/inpi\/.*\.pdf$/i, 'Ação de cartilha sem PDF oficial do INPI.');
  assert.equal(attributeFromTag(action, 'data-cgdi-link-oficial'), 'true', 'PDF oficial deve permanecer habilitado pelo carregador.');
  assert.equal(attributeFromTag(action, 'aria-disabled'), null, 'Ação de cartilha publicada não pode nascer desabilitada.');
  assert.doesNotMatch(action, /\bdata-cgdi-(?:unavailable|external-disabled)\b/i, 'Ação de cartilha publicada não pode carregar estado indisponível.');
  if (/\bpd-open\b/i.test(action)) {
    assert.equal(attributeFromTag(action, 'target'), '_blank', 'A visualização do PDF deve abrir em nova aba.');
  }
  if (/\bpd-download\b/i.test(action)) {
    assert.match(action, /\bdownload=["'][^"']+["']/i, 'A ação de download deve sugerir um nome de arquivo.');
  }
}

const componentCatalogPath = join(root, 'prototipos', 'componentes', 'catalogo-componentes.json');
const componentCatalogText = await readFile(componentCatalogPath, 'utf8');
const componentCatalog = JSON.parse(componentCatalogText);
assert.equal(componentCatalog.paginaInicial, '../../index.html');
assert.deepEqual(componentCatalog.prototiposAtivos, {
  estruturaAtualRevisada: '../estrutura-atual-revisada/index.html',
  orientadoAAcao: '../orientado-a-acao/index.html'
});
assert.doesNotMatch(
  componentCatalogText,
  /(?:projetos\/v[12]|diagnosticos\/|analises\/|prototipos\/estrutura-atual\/|ambiente-teste)/i,
  'O catálogo de componentes contém contrato descontinuado.'
);

const redirectConfiguration = JSON.parse(await readFile(redirectConfigPath, 'utf8'));
assert.equal(redirectConfiguration.versao, 1, 'Versão desconhecida da configuração de redirects.');
const redirects = Object.entries(redirectConfiguration.redirecionamentos || {});
assert.equal(redirects.length, 24, 'A configuração deve preservar as 24 rotas anteriores conhecidas.');
for (const [legacyPath, canonicalPath] of redirects) {
  assert.equal(
    await exists(join(root, legacyPath)),
    null,
    'Redirect estático não deve permanecer em public: ' + legacyPath
  );
  assert.ok(
    (await exists(join(root, canonicalPath)))?.isFile(),
    'Destino canônico de redirect ausente: ' + canonicalPath
  );
}

console.log(
  'public validado: ' + (pages.length - directOnlyPages.size) + ' páginas canônicas alcançáveis, ' +
  directOnlyPages.size + ' página técnica de acesso direto, ' +
  referenceCount + ' referências locais e contratos de publicação íntegros.'
);
