import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../public/', import.meta.url));
const prototypeRoot = join(root, 'prototipos');
const activePrototypes = ['estrutura-atual-revisada', 'orientado-a-acao'];

async function exists(path) {
  try {
    return await stat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

const files = (await Promise.all(activePrototypes.map(async prototype => {
  const directory = join(prototypeRoot, prototype);
  return (await readdir(directory, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
    .map(entry => join(entry.parentPath, entry.name));
}))).flat();
let changed = 0;

for (const path of files) {
  const original = await readFile(path, 'utf8');
  let normalized = original;
  for (const tag of original.match(/<a\b[^>]*\bhref=["'][^"']+["'][^>]*>/gi) || []) {
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href || /^(?:#|\/|https?:|mailto:|tel:|data:|blob:|\/\/)/i.test(href)) continue;
    const localPath = href.split(/[?#]/, 1)[0];
    if (!localPath || (!localPath.endsWith('.html') && !localPath.endsWith('/'))) continue;
    let target = resolve(dirname(path), decodeURIComponent(localPath));
    const targetStat = await exists(target);
    if (targetStat?.isDirectory()) target = join(target, 'index.html');
    if ((await exists(target))?.isFile()) continue;
    const disabled = tag
      .replace(/\s+href=["'][^"']+["']/i, '')
      .replace(/\s+(?:aria-disabled|data-cgdi-unavailable)=["'][^"']*["']/gi, '')
      .replace(/>$/, ' aria-disabled="true" data-cgdi-unavailable="true">');
    normalized = normalized.replace(tag, disabled);
  }
  if (normalized !== original) {
    await writeFile(path, normalized, 'utf8');
    changed += 1;
  }
}

console.log(`Links HTML indisponíveis revisados: ${changed} página(s) alterada(s).`);
