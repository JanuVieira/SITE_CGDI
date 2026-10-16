import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

for (const version of ['v1', 'v2']) {
  const directory = join(root, 'projetos', version);
  const published = new Set((await readdir(directory, { recursive: true }))
    .filter(file => file.endsWith('.html'))
    .map(file => file.replaceAll('\\', '/')));
  const files = [...published];

  for (const file of files) {
    const path = join(directory, file);
    const original = await readFile(path, 'utf8');
    let normalized = original;
    if (version === 'v2' && file === 'p00.html') {
      normalized = normalized.replace(
        /<a\b[^>]*data-cgdi-unavailable="true"[^>]*>([\s\S]*?<span>Versões dos protótipos<\/span>)<\/a>/i,
        '<a href="../../index.html">$1</a>'
      );
    }
    if (version === 'v1' && file === 'p00.html' && published.has('p02.html')) {
      normalized = normalized.replace(
        /<a\b[^>]*data-cgdi-unavailable="true"[^>]*>(Consultar guias e vídeos[\s\S]*?<\/svg>)<\/a>/i,
        '<a class="service-link" href="p02.html" aria-label="Consultar guias e vídeos — Guias, vídeos e cartilhas">$1</a>'
      );
    }
    normalized = normalized.replace(/<a\b([^>]*?)\bhref="([^"]+\.html(?:#[^"]*)?)"([^>]*)>/gi, (tag, before, href, after) => {
      if (/^(?:https?:)?\/\//i.test(href) || href.startsWith('/')) return tag;
      if (href === '../../index.html') return tag;
      const target = new URL(href, `https://prototype.invalid/${file}`).pathname.slice(1);
      if (published.has(target)) return tag;
      const attributes = `${before}${after}`.replace(/\s(?:aria-disabled|data-cgdi-unavailable)="[^"]*"/gi, '');
      return `<a${attributes} aria-disabled="true" data-cgdi-unavailable="true">`;
    });
    if (normalized !== original) await writeFile(path, normalized, 'utf8');
  }
}

console.log('Links para páginas ainda não publicadas foram desativados.');
