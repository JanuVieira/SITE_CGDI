import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../public/', import.meta.url));
const policy = "default-src 'self' data: blob:; base-uri 'self'; connect-src 'self'; font-src 'self' data:; frame-src 'self' https://app.powerbi.com; img-src 'self' data: blob:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'";
const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;

for (const prototype of ['estrutura-atual-revisada', 'orientado-a-acao']) {
  const directory = join(root, 'prototipos', prototype);
  const files = (await readdir(directory, { recursive: true })).filter(file => file.endsWith('.html'));
  for (const file of files) {
    const path = join(directory, file);
    let secured = await readFile(path, 'utf8');
    secured = secured.replace(/<link\b(?=[^>]*\bhref=["'](?:https?:)?\/\/)[^>]*>\s*/gi, '');
    if (!/http-equiv=["']Content-Security-Policy["']/i.test(secured)) {
      const withPolicy = secured.replace(/<head(\s[^>]*)?>/i, match => `${match}${meta}`);
      if (withPolicy === secured) throw new Error(`A tag <head> não foi encontrada em ${prototype}/${file}.`);
      secured = withPolicy;
    }
    await writeFile(path, secured, 'utf8');
  }
}

console.log('Política de segurança aplicada aos protótipos ativos.');
