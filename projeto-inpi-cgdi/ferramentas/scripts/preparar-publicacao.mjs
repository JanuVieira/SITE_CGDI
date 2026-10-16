import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const repositoryRoot = resolve(projectRoot, '..');
const defaultSource = join(projectRoot, 'public');
const defaultOutput = join(repositoryRoot, '_site');
const redirectConfigPath = new URL('../configuracao/redirecionamentos.json', import.meta.url);

const publicEntries = [
  'index.html',
  'projeto',
  'prototipos',
  'vendor'
];
const requiredPages = [
  'index.html',
  'projeto/auditoria-acessibilidade/index.html',
  'projeto/fluxos-dos-prototipos/index.html',
  'prototipos/estrutura-atual-revisada/index.html',
  'prototipos/orientado-a-acao/index.html'
];
const publicExtensions = new Set([
  '.css', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json', '.otf',
  '.pdf', '.png', '.svg', '.ttf', '.webmanifest', '.webp', '.woff', '.woff2', '.xml'
]);
const blockedSegments = new Set([
  'legado (revisar)', 'legado', 'sanitizar', 'sanitizar (revisar)', 'quarentena', 'ferramentas',
  'scripts', 'node_modules', '.git', '.github'
]);

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith('--')) {
    throw new Error(`O argumento ${name} exige um caminho.`);
  }
  return resolve(process.cwd(), process.argv[index + 1]);
}

function inside(parent, child) {
  const result = relative(parent, child);
  return result === '' || (!result.startsWith(`..${sep}`) && result !== '..');
}

async function isFile(path) {
  try {
    return (await lstat(path)).isFile();
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function assertAllowedRelative(path) {
  for (const segment of path.split(sep)) {
    if (blockedSegments.has(segment.toLocaleLowerCase('pt-BR'))) {
      throw new Error(`Caminho bloqueado na publicação: ${path}`);
    }
  }
}

function normalizeConfiguredPath(value, label) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.includes('\\')) {
    throw new Error(`${label} inválido: ${String(value)}`);
  }
  const segments = value.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error(`${label} contém segmento inseguro: ${value}`);
  }
  if (!/^[a-z0-9./-]+$/.test(value) || extname(value) !== '.html') {
    throw new Error(`${label} deve usar minúsculas, ASCII, kebab-case e extensão .html: ${value}`);
  }
  return segments.join(sep);
}

async function copyPublicTree(source, target, relativePath, counters) {
  assertAllowedRelative(relativePath);
  const sourcePath = join(source, relativePath);
  const info = await lstat(sourcePath);
  if (info.isSymbolicLink()) throw new Error(`Links simbólicos não são publicados: ${relativePath}`);
  if (info.isDirectory()) {
    const entries = await readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      await copyPublicTree(source, target, join(relativePath, entry.name), counters);
    }
    return;
  }
  if (!info.isFile() || !publicExtensions.has(extname(sourcePath).toLowerCase())) return;
  const targetPath = join(target, relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath);
  counters.files += 1;
  counters.bytes += info.size;
}

async function generateRedirects(target, counters) {
  const configuration = JSON.parse(await readFile(redirectConfigPath, 'utf8'));
  if (configuration.versao !== 1 || !configuration.redirecionamentos || Array.isArray(configuration.redirecionamentos)) {
    throw new Error('Configuração de redirecionamentos inválida.');
  }

  let redirects = 0;
  for (const [legacyPublicPath, canonicalPublicPath] of Object.entries(configuration.redirecionamentos)) {
    const legacyPath = normalizeConfiguredPath(legacyPublicPath, 'Rota anterior');
    const canonicalPath = normalizeConfiguredPath(canonicalPublicPath, 'Rota canônica');
    assertAllowedRelative(legacyPath);
    assertAllowedRelative(canonicalPath);
    if (!await isFile(join(target, canonicalPath))) {
      throw new Error(`Destino canônico ausente no staging: ${canonicalPublicPath}`);
    }
    if (await isFile(join(target, legacyPath))) {
      throw new Error(`A rota anterior já existe na fonte ativa: ${legacyPublicPath}`);
    }

    const relativeTarget = posix.relative(posix.dirname(legacyPublicPath), canonicalPublicPath);
    const html = [
      '<!doctype html>',
      '<html lang="pt-BR">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width,initial-scale=1">',
      '  <meta name="robots" content="noindex,nofollow">',
      `  <meta http-equiv="refresh" content="0;url=${relativeTarget}">`,
      `  <link rel="canonical" href="${relativeTarget}">`,
      '  <title>Endereço atualizado — CGDI</title>',
      '</head>',
      `<body><p>Este endereço mudou. <a href="${relativeTarget}">Acessar a página atual</a>.</p></body>`,
      '</html>',
      ''
    ].join('\n');
    const targetPath = join(target, legacyPath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, html, 'utf8');
    counters.files += 1;
    counters.bytes += Buffer.byteLength(html);
    redirects += 1;
  }
  return redirects;
}

const source = argument('--source', defaultSource);
const output = argument('--output', defaultOutput);
if (inside(source, output) || inside(output, source)) {
  throw new Error('Origem e destino do staging não podem conter um ao outro.');
}
if (await isFile(output)) throw new Error(`O destino de staging já existe como arquivo: ${output}`);
try {
  await lstat(output);
  throw new Error(`O destino de staging já existe; remova-o explicitamente antes de continuar: ${output}`);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
for (const page of requiredPages) {
  if (!await isFile(join(source, page))) throw new Error(`Página pública obrigatória ausente: ${page}`);
}

await mkdir(dirname(output), { recursive: true });
const temporary = await mkdtemp(join(dirname(output), '.cgdi-stage-'));
const counters = { files: 0, bytes: 0 };
let redirects = 0;
try {
  for (const entry of publicEntries) await copyPublicTree(source, temporary, entry, counters);
  redirects = await generateRedirects(temporary, counters);
  await writeFile(join(temporary, '.nojekyll'), '', 'utf8');
  for (const page of requiredPages) {
    if (!await isFile(join(temporary, page))) throw new Error(`Staging incompleto: ${page}`);
  }
  await rename(temporary, output);
} catch (error) {
  await rm(temporary, { recursive: true, force: true });
  throw error;
}

console.log(JSON.stringify({
  source,
  output,
  allowlist: publicEntries,
  redirecionamentos: redirects,
  arquivos: counters.files,
  bytes: counters.bytes
}, null, 2));
