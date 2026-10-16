#!/usr/bin/env python3
"""Marca uma cópia para GitHub Pages com cache busting por commit.

Não modifica os arquivos-fonte do projeto. Executar APENAS depois que
_site já foi montado pelo workflow.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import posixpath
import re
from urllib.parse import urlsplit

TAG_RE = re.compile(r"<(?:link|script)\b[^>]*>", re.I | re.S)
ATTR_RE = re.compile(r"\b(?P<name>href|src)\s*=\s*(?P<quote>['\"])(?P<url>.*?)(?P=quote)", re.I | re.S)
BASE_RE = re.compile(r"<base\b[^>]*\bhref\s*=\s*['\"]([^'\"]+)['\"]", re.I)
HEAD_END_RE = re.compile(r"</head\s*>", re.I)
VERSION_PARAM = "cgdi_v"

REFRESH_JS = r'''/* Atualiza páginas antigas sem afetar a navegação ou o conteúdo do projeto. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script) return;
  const embedded = script.dataset.cgdiBuild;
  const manifestURL = new URL('../version.json', script.src);
  let checking = false;

  async function checkVersion() {
    if (checking || document.visibilityState === 'hidden') return;
    checking = true;
    try {
      const url = new URL(manifestURL);
      url.searchParams.set('_', String(Date.now()));
      const response = await fetch(url, {cache: 'no-store', credentials: 'same-origin'});
      if (!response.ok) return;
      const data = await response.json();
      const latest = data && data.version;
      if (typeof latest !== 'string' || !/^[a-f0-9]{40}$/.test(latest)) return;
      if (latest === embedded) return;
      const currentURL = new URL(window.location.href);
      // Bloqueia recarregamentos infinitos se um servidor ainda servir HTML antigo.
      if (currentURL.searchParams.get('cgdi_build') === latest) return;
      currentURL.searchParams.set('cgdi_build', latest);
      window.location.replace(currentURL.href);
    } catch (_) {
      // Sem conexão, mantém a página acessível. A próxima visita repetirá a verificação.
    } finally {
      checking = false;
    }
  }

  checkVersion();
  window.addEventListener('pageshow', event => {
    if (event.persisted) checkVersion();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkVersion();
  });
})();
'''


def asset_tag_busted(match: re.Match[str], version: str) -> str:
    tag = match.group(0)
    lower = tag.lower()
    is_script = lower.startswith('<script')
    if not is_script and not re.search(r"\brel\s*=\s*['\"][^'\"]*\bstylesheet\b", tag, re.I):
        return tag
    attr_name = 'src' if is_script else 'href'

    def replace_attr(attr_match: re.Match[str]) -> str:
        if attr_match.group('name').lower() != attr_name:
            return attr_match.group(0)
        value = attr_match.group('url')
        # Não altera destinos externos, URLs absolutas, referências ou data URIs.
        parsed = urlsplit(value.replace('&amp;', '&'))
        if (parsed.scheme or parsed.netloc or value.startswith(('/', '#', '//')) or not parsed.path):
            return attr_match.group(0)
        # O resultado é estável por commit, sem alterar nome, pasta nem hash.
        separator = '&amp;' if '?' in value else '?'
        if re.search(r'(?:\?|&amp;|&)cgdi_v=', value):
            raise ValueError('Página já tem a marca de versão, build duplicado?')
        return f'{attr_match.group("name")}={attr_match.group("quote")}{value}{separator}{VERSION_PARAM}={version[:12]}{attr_match.group("quote")}'

    return ATTR_RE.sub(replace_attr, tag)


def root_from_html(site: Path, file: Path, html: str) -> str:
    # <base href="../"> muda a interpretação de caminhos relativos em duas páginas.
    base = BASE_RE.search(html)
    effective_dir = file.parent
    if base:
        raw = base.group(1)
        parts = urlsplit(raw)
        if parts.scheme or parts.netloc or raw.startswith('/'):
            raise ValueError(f'Base href não local em {file}: {raw}')
        effective_dir = (file.parent / parts.path).resolve()
    try:
        effective_dir.relative_to(site.resolve())
    except ValueError as e:
        raise ValueError(f'Base href fora do site em {file}') from e
    prefix = os.path.relpath(site.resolve(), effective_dir).replace(os.sep, '/')
    return '' if prefix == '.' else f'{prefix}/'


def stamp(site: Path, version: str) -> dict[str, int]:
    if not re.fullmatch(r'[a-f0-9]{40}', version):
        raise ValueError('Versão esperada: SHA de 40 caracteres do commit do Git.')
    if not (site / 'index.html').is_file():
        raise ValueError('Arquivo _site/index.html ausente.')
    if (site / 'version.json').exists() or (site / 'assets/cgdi-cache-check.js').exists():
        raise ValueError('Destino já está carimbado, não publicar duas vezes.')
    html_files = sorted(site.rglob('*.html'))
    # Os templates de componentes são fragmentos, não documentos navegáveis.
    targets: list[tuple[Path, str]] = []
    for file in html_files:
        if 'componentes' in file.relative_to(site).parts or 'recursos' in file.relative_to(site).parts:
            continue
        html = file.read_text(encoding='utf-8')
        if not HEAD_END_RE.search(html):
            continue
        prefix = root_from_html(site, file, html)
        replaced = TAG_RE.sub(lambda m: asset_tag_busted(m, version), html)
        js = f'<script async src="{prefix}assets/cgdi-cache-check.js?cgdi_v={version[:12]}" data-cgdi-build="{version}"></script>'
        replaced, count = HEAD_END_RE.subn(lambda m: f'{js}\n{m.group(0)}', replaced, count=1)
        if count != 1:
            raise ValueError(f'Falha ao inserir verificação: {file}')
        targets.append((file, replaced))

    required = {'index.html', 'projetos/v1/p00.html', 'projetos/v2/p00.html', 'diagnosticos/index.html'}
    found = {f.relative_to(site).as_posix() for f, _ in targets}
    missing = required - found
    if missing:
        raise ValueError(f'Páginas obrigatórias ausentes: {sorted(missing)}')

    # Sem alterações até a validação acima terminar.
    for file, result in targets:
        file.write_text(result, encoding='utf-8')
    (site / 'assets').mkdir(exist_ok=True)
    (site / 'assets/cgdi-cache-check.js').write_text(REFRESH_JS, encoding='utf-8')
    (site / 'version.json').write_text(json.dumps({'version': version}, indent=2) + '\n', encoding='utf-8')
    return {'html_atualizados': len(targets), 'total_html_encontrados': len(html_files)}


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', type=Path, required=True)
    ap.add_argument('--version', required=True)
    args = ap.parse_args()
    print(json.dumps(stamp(args.site.resolve(), args.version), ensure_ascii=False))
