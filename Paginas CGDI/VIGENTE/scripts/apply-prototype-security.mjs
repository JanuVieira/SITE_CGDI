import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const policy = "default-src 'self' data: blob:; base-uri 'self'; connect-src 'self'; font-src 'self' data:; frame-src 'self'; img-src 'self' data: blob:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'";
const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;

for (const version of ['v1', 'v2']) {
  const directory = join(root, 'projetos', version);
  const files = (await readdir(directory, { recursive: true })).filter(file => file.endsWith('.html'));
  for (const file of files) {
    const path = join(directory, file);
    let secured = await readFile(path, 'utf8');
    secured = secured.replace(/<link\b(?=[^>]*\bhref=["'](?:https?:)?\/\/)[^>]*>\s*/gi, '');
    if (!/http-equiv=["']Content-Security-Policy["']/i.test(secured)) {
      const withPolicy = secured.replace(/<head(\s[^>]*)?>/i, match => `${match}${meta}`);
      if (withPolicy === secured) throw new Error(`A tag <head> não foi encontrada em ${version}/${file}.`);
      secured = withPolicy;
    }
    await writeFile(path, secured, 'utf8');
  }
}

console.log('Política de segurança aplicada às páginas V1 e V2.');
