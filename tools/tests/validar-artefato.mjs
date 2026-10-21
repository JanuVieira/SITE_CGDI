import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, posix, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const sourceRoot = join(projectRoot, 'public');
const redirectConfigPath = new URL('../config/redirecionamentos.json', import.meta.url);
const publicEntries = ['index.html', 'projeto', 'prototipos', 'vendor'];
const publicExtensions = new Set([
  '.css', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json', '.mp4', '.otf',
  '.pdf', '.png', '.svg', '.ttf', '.webmanifest', '.webp', '.woff', '.woff2', '.xml'
]);
const finalExtraFiles = [
  'version.json',
  'assets/cgdi-cache-check.js',
  'assets/cgdi-ga4-consent.js',
  'assets/cgdi-ga4-consent.css'
];
const shaPattern = /^[a-f0-9]{40}$/;

function parseArguments() {
  const args = process.argv.slice(2);
  const finalMode = args.includes('--final');
  const unknownOptions = args.filter(argument => argument.startsWith('--') && argument !== '--final');
  if (unknownOptions.length) throw new Error(`Opção desconhecida: ${unknownOptions.join(', ')}`);
  const paths = args.filter(argument => !argument.startsWith('--'));
  if (paths.length > 1) throw new Error('Informe no máximo um diretório de artefato.');
  return {
    finalMode,
    artifactRoot: resolve(projectRoot, paths[0] || '_site')
  };
}

function portable(path) {
  return path.split(sep).join('/');
}

async function listFiles(root, relativePath = '') {
  const directory = join(root, relativePath);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = join(relativePath, entry.name);
    assert.ok(!entry.isSymbolicLink(), `O artefato não pode conter link simbólico: ${portable(child)}`);
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    else if (entry.isFile()) files.push(portable(child));
  }
  return files;
}

async function requireArtifactDirectory(path) {
  let information;
  try {
    information = await stat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Artefato ausente: ${path}. Execute npm run build antes da validação.`);
    }
    throw error;
  }
  if (!information.isDirectory()) throw new Error(`O caminho do artefato não é um diretório: ${path}`);
}

function tags(html, name) {
  const uncommented = html.replace(/<!--[\s\S]*?-->/g, '');
  return uncommented.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
}

function attributes(tag) {
  const result = new Map();
  const pattern = /\b([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  for (const match of tag.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function selectTags(html, name, predicate) {
  return tags(html, name)
    .map(tag => ({ tag, attributes: attributes(tag) }))
    .filter(item => predicate(item.attributes));
}

function relContains(value, expected) {
  return String(value || '').toLowerCase().split(/\s+/).includes(expected);
}

function assetReferences(html, tagName, attributeName, filename) {
  return selectTags(html, tagName, values => {
    const value = values.get(attributeName);
    if (!value) return false;
    const pathname = value.split(/[?#]/, 1)[0];
    return pathname === `assets/${filename}` || pathname.endsWith(`/assets/${filename}`);
  });
}

function isTransformableDocument(path, html) {
  const segments = path.split('/');
  return !segments.includes('componentes') &&
    !segments.includes('recursos') &&
    /<\/head\s*>/i.test(html);
}

function assertVersionedReference(reference, attributeName, filename, suffix, page) {
  const value = reference.attributes.get(attributeName);
  const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(
    value,
    new RegExp(`(?:^|/)assets/${escapedFilename}\\?cgdi_v=${suffix}$`),
    `Referência sem a versão esperada em ${page}: ${value}`
  );
}

function validateAnalyticsCsp(html, page) {
  const policies = selectTags(
    html,
    'meta',
    values => values.get('http-equiv')?.toLowerCase() === 'content-security-policy'
  );
  assert.equal(policies.length, 1, `${page} deve conter uma única CSP para publicar o Analytics.`);
  const directives = new Map();
  for (const chunk of String(policies[0].attributes.get('content') || '').split(';')) {
    const parts = chunk.trim().split(/\s+/).filter(Boolean);
    if (parts.length) directives.set(parts[0].toLowerCase(), new Set(parts.slice(1)));
  }
  const required = new Map([
    ['script-src', ['https://www.googletagmanager.com']],
    ['connect-src', [
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'https://www.googletagmanager.com'
    ]],
    ['img-src', [
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com'
    ]]
  ]);
  if (directives.has('script-src-elem')) {
    required.set('script-src-elem', ['https://www.googletagmanager.com']);
  }
  for (const [directive, sources] of required) {
    assert.ok(directives.has(directive), `CSP final sem ${directive}: ${page}`);
    const values = directives.get(directive);
    assert.equal(values.has("'none'"), false, `CSP final bloqueia ${directive} com 'none': ${page}`);
    for (const source of sources) {
      assert.ok(values.has(source), `CSP final sem ${source} em ${directive}: ${page}`);
    }
  }
}

function validateRedirect(html, legacyPath, canonicalPath) {
  const relativeTarget = posix.relative(posix.dirname(legacyPath), canonicalPath);
  const robots = selectTags(
    html,
    'meta',
    values => values.get('name')?.toLowerCase() === 'robots'
  );
  assert.equal(robots.length, 1, `Redirect deve ter uma única meta robots: ${legacyPath}`);
  const robotDirectives = String(robots[0].attributes.get('content') || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  assert.ok(robotDirectives.includes('noindex'), `Redirect sem noindex: ${legacyPath}`);
  assert.ok(robotDirectives.includes('nofollow'), `Redirect sem nofollow: ${legacyPath}`);

  const refreshes = selectTags(
    html,
    'meta',
    values => values.get('http-equiv')?.toLowerCase() === 'refresh'
  );
  assert.equal(refreshes.length, 1, `Redirect deve ter uma única meta refresh: ${legacyPath}`);
  const refresh = String(refreshes[0].attributes.get('content') || '')
    .match(/^\s*0\s*;\s*url\s*=\s*(.*?)\s*$/i);
  assert.ok(refresh, `Meta refresh inválida: ${legacyPath}`);
  assert.equal(refresh[1], relativeTarget, `Destino incorreto na meta refresh: ${legacyPath}`);

  const canonicals = selectTags(html, 'link', values => relContains(values.get('rel'), 'canonical'));
  assert.equal(canonicals.length, 1, `Redirect deve ter um único canonical: ${legacyPath}`);
  assert.equal(
    canonicals[0].attributes.get('href'),
    relativeTarget,
    `Destino incorreto no canonical: ${legacyPath}`
  );

  const fallbacks = selectTags(html, 'a', values => values.get('href') === relativeTarget);
  assert.equal(fallbacks.length, 1, `Redirect deve oferecer um único link de fallback: ${legacyPath}`);
}

function validateFinalPage(html, path, version, redirectPaths, transformablePaths) {
  const transformable = transformablePaths.has(path);
  const redirect = redirectPaths.has(path);
  const suffix = version.slice(0, 12);
  const cacheScripts = assetReferences(html, 'script', 'src', 'cgdi-cache-check.js');
  const gaScripts = assetReferences(html, 'script', 'src', 'cgdi-ga4-consent.js');
  const gaStyles = assetReferences(html, 'link', 'href', 'cgdi-ga4-consent.css');

  assert.equal(
    cacheScripts.length,
    transformable ? 1 : 0,
    `${path} deve conter ${transformable ? 'uma única' : 'nenhuma'} injeção de cache.`
  );
  if (transformable) {
    assertVersionedReference(cacheScripts[0], 'src', 'cgdi-cache-check.js', suffix, path);
    assert.equal(
      cacheScripts[0].attributes.get('data-cgdi-build'),
      version,
      `SHA incorreto na injeção de cache: ${path}`
    );
  }

  const expectedGaReferences = transformable && !redirect ? 1 : 0;
  assert.equal(
    gaScripts.length,
    expectedGaReferences,
    `${path} deve conter ${expectedGaReferences ? 'um único script' : 'nenhum script'} de consentimento GA.`
  );
  assert.equal(
    gaStyles.length,
    expectedGaReferences,
    `${path} deve conter ${expectedGaReferences ? 'uma única folha' : 'nenhuma folha'} de consentimento GA.`
  );
  if (expectedGaReferences) {
    assertVersionedReference(gaScripts[0], 'src', 'cgdi-ga4-consent.js', suffix, path);
    assertVersionedReference(gaStyles[0], 'href', 'cgdi-ga4-consent.css', suffix, path);
    validateAnalyticsCsp(html, path);
  }
  if (redirect) {
    assert.doesNotMatch(
      html,
      /cgdi-ga4|googletagmanager\.com|google-analytics\.com|G-RYCRDYSL5G/i,
      `Redirect não pode receber GA: ${path}`
    );
  }

  return {
    cache: transformable ? 1 : 0,
    ga: expectedGaReferences
  };
}

const { finalMode, artifactRoot } = parseArguments();
await requireArtifactDirectory(artifactRoot);

const sourceFiles = [];
for (const entry of publicEntries) {
  const path = join(sourceRoot, entry);
  const information = await stat(path);
  if (information.isDirectory()) sourceFiles.push(...await listFiles(sourceRoot, entry));
  else sourceFiles.push(portable(entry));
}
const publishedSourceFiles = sourceFiles.filter(path => publicExtensions.has(extname(path).toLowerCase()));

const configuration = JSON.parse(await readFile(redirectConfigPath, 'utf8'));
assert.equal(configuration.versao, 1, 'Versão desconhecida da configuração de redirects.');
assert.ok(
  configuration.redirecionamentos &&
  typeof configuration.redirecionamentos === 'object' &&
  !Array.isArray(configuration.redirecionamentos),
  'Configuração de redirects inválida.'
);
const redirects = Object.entries(configuration.redirecionamentos);
const redirectPaths = new Set(redirects.map(([legacyPath]) => legacyPath));
const transformablePaths = new Set(redirectPaths);

const expectedFiles = new Set([...publishedSourceFiles, '.nojekyll']);
for (const [legacyPath] of redirects) expectedFiles.add(legacyPath);
if (finalMode) finalExtraFiles.forEach(path => expectedFiles.add(path));
const artifactFiles = await listFiles(artifactRoot);
const artifactFileSet = new Set(artifactFiles);

assert.deepEqual(
  artifactFiles.sort(),
  [...expectedFiles].sort(),
  finalMode
    ? 'O artefato final deve conter somente a árvore pública, os redirects, .nojekyll e os quatro arquivos gerados permitidos.'
    : 'O artefato deve conter somente a árvore pública permitida, os redirects e .nojekyll.'
);

for (const path of publishedSourceFiles) {
  const source = await readFile(join(sourceRoot, path));
  const published = await readFile(join(artifactRoot, path));
  if (!finalMode || extname(path).toLowerCase() !== '.html') {
    assert.ok(source.equals(published), `Arquivo publicado diverge da fonte: ${path}`);
    continue;
  }
  const sourceHtml = source.toString('utf8');
  if (isTransformableDocument(path, sourceHtml)) {
    transformablePaths.add(path);
  } else {
    assert.ok(source.equals(published), `HTML não elegível foi alterado: ${path}`);
  }
}

for (const [legacyPath, canonicalPath] of redirects) {
  const redirect = await readFile(join(artifactRoot, legacyPath), 'utf8');
  validateRedirect(redirect, legacyPath, canonicalPath);
  assert.ok(artifactFileSet.has(canonicalPath), `Destino do redirect não foi publicado: ${canonicalPath}`);
}

for (const blocked of ['archive', 'tools', 'package.json', 'package-lock.json', 'node_modules']) {
  assert.equal(
    artifactFiles.some(path => path === blocked || path.startsWith(`${blocked}/`)),
    false,
    `Conteúdo privado encontrado no artefato: ${blocked}`
  );
}

let cachePages = 0;
let gaPages = 0;
let version;
if (finalMode) {
  const manifest = JSON.parse(await readFile(join(artifactRoot, 'version.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest).sort(), ['version'], 'version.json deve conter somente a chave version.');
  assert.equal(typeof manifest.version, 'string', 'version.json deve conter uma versão textual.');
  assert.match(manifest.version, shaPattern, 'version.json deve conter um SHA Git de 40 caracteres hexadecimais.');
  version = manifest.version;

  const gaScript = await readFile(join(artifactRoot, 'assets/cgdi-ga4-consent.js'), 'utf8');
  assert.match(
    gaScript,
    /localStorage\.setItem\(CHOICE_KEY,\s*value\)/,
    'O JS de consentimento deve persistir a escolha feita pelo usuário.'
  );
  assert.match(
    gaScript,
    /banner\.hidden\s*=\s*true/,
    'O banner de consentimento deve desaparecer imediatamente após a escolha.'
  );
  assert.match(
    gaScript,
    /banner\.hidden\s*=\s*choice\s*!==\s*null\s*&&\s*!reviewMode/,
    'Uma escolha persistida deve impedir que o banner reapareça na navegação comum.'
  );
  assert.doesNotMatch(
    gaScript,
    /cgdi-ga4-privacy-settings|\bprivacyButton\b/,
    'O artefato não deve recriar um botão persistente de cookies após a escolha.'
  );

  for (const path of artifactFiles.filter(path => extname(path).toLowerCase() === '.html')) {
    const html = await readFile(join(artifactRoot, path), 'utf8');
    const counts = validateFinalPage(html, path, version, redirectPaths, transformablePaths);
    cachePages += counts.cache;
    gaPages += counts.ga;
  }
}

if (finalMode) {
  console.log(
    `Artefato final validado: SHA ${version}, ${cachePages} páginas com controle de cache, ` +
    `${gaPages} páginas com consentimento GA e ${redirects.length} redirects sem GA.`
  );
} else {
  console.log(
    `Artefato validado: ${publishedSourceFiles.length} arquivos públicos, ` +
    `${redirects.length} redirects e nenhum arquivo fora da allowlist.`
  );
}
