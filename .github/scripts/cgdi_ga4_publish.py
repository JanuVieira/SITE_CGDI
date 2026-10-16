#!/usr/bin/env python3
"""Acrescenta GA4 com consentimento somente à cópia _site do GitHub Pages.

Os arquivos sob projeto-inpi-cgdi/public NÃO são modificados.
Este script roda DEPOIS de stamp_pages.py, no GitHub Actions.
"""
from __future__ import annotations

import argparse
import html as htmllib
import json
import os
from pathlib import Path
import posixpath
import re
from urllib.parse import urlsplit

MEASUREMENT_ID = "G-RYCRDYSL5G"
VERSION_RE = re.compile(r"^[a-f0-9]{40}$")
HEAD_RE = re.compile(r"</head\s*>", re.I)
BASE_RE = re.compile(r"<base\b[^>]*\bhref\s*=\s*(['\"])(.*?)\1", re.I | re.S)
META_RE = re.compile(r"<meta\b[^>]*>", re.I | re.S)
CSP_ATTR_RE = re.compile(r"\bhttp-equiv\s*=\s*(['\"])Content-Security-Policy\1", re.I)
CONTENT_ATTR_RE = re.compile(r"\bcontent\s*=\s*(['\"])(.*?)\1", re.I | re.S)
REFRESH_ATTR_RE = re.compile(r"\bhttp-equiv\s*=\s*(['\"])refresh\1", re.I)
REQUIRED = {
    "index.html",
    "projeto/auditoria-acessibilidade/index.html",
    "projeto/fluxos-dos-prototipos/index.html",
    "prototipos/estrutura-atual-revisada/index.html",
    "prototipos/orientado-a-acao/index.html",
}

SCRIPT_DOMAINS = ("https://www.googletagmanager.com",)
CONNECT_DOMAINS = (
    "https://www.google-analytics.com", "https://region1.google-analytics.com",
    "https://www.googletagmanager.com",
)
IMAGE_DOMAINS = ("https://www.google-analytics.com", "https://region1.google-analytics.com")

JS = r'''(() => {
  'use strict';
  const ID = 'G-RYCRDYSL5G';
  const CHOICE_KEY = 'cgdi.ga4.consent.v1';
  let loaded = false;
  let banner;
  let preferencesButton;

  function storedChoice() {
    try {
      const value = localStorage.getItem(CHOICE_KEY);
      return value === 'accepted' || value === 'rejected' ? value : null;
    } catch (_) { return null; }
  }
  function storeChoice(value) {
    try { localStorage.setItem(CHOICE_KEY, value); } catch (_) { /* Sem persistência. */ }
  }
  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
  function startAnalytics() {
    if (loaded) return;
    loaded = true;
    window['ga-disable-' + ID] = false;
    // Outros tipos de armazenamento e personalização permanecem desativados.
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('config', ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(tag);
  }
  function forgetAnalyticsCookies() {
    document.cookie.split(';').forEach(function (part) {
      const name = part.split('=')[0].trim();
      if (!/^_ga($|_)/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
    });
  }
  function choose(value) {
    storeChoice(value);
    banner.hidden = true;
    preferencesButton.hidden = false;
    if (value === 'accepted') {
      startAnalytics();
    } else if (loaded) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      window['ga-disable-' + ID] = true;
      forgetAnalyticsCookies();
      window.location.reload();
    }
  }
  function makeButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
  }
  function init() {
    if (!document.body) return;
    banner = document.createElement('section');
    banner.id = 'cgdi-ga4-consent';
    banner.setAttribute('aria-label', 'Preferências de privacidade');
    const title = document.createElement('strong');
    title.textContent = 'Análise de visitas';
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Com sua autorização, usamos o Google Analytics para entender as visitas ao protótipo. Você pode recusar sem perder acesso ao conteúdo.';
    const actions = document.createElement('div');
    actions.className = 'cgdi-ga4-actions';
    actions.appendChild(makeButton('Recusar', 'cgdi-ga4-reject', () => choose('rejected')));
    actions.appendChild(makeButton('Aceitar análise', 'cgdi-ga4-accept', () => choose('accepted')));
    const more = document.createElement('a');
    more.href = 'https://policies.google.com/technologies/partner-sites?hl=pt-BR';
    more.target = '_blank';
    more.rel = 'noopener noreferrer';
    more.textContent = 'Como o Google utiliza dados';
    banner.append(title, paragraph, actions, more);
    preferencesButton = makeButton('Privacidade', 'cgdi-ga4-settings', () => {
      banner.hidden = false;
      preferencesButton.hidden = true;
      banner.querySelector('button')?.focus();
    });
    document.body.append(banner, preferencesButton);
    const choice = storedChoice();
    banner.hidden = Boolean(choice);
    preferencesButton.hidden = !choice;
    if (choice === 'accepted') startAnalytics();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
'''

CSS = r'''#cgdi-ga4-consent,#cgdi-ga4-consent *, .cgdi-ga4-settings { box-sizing: border-box; }
#cgdi-ga4-consent { position: fixed; z-index: 2147483000; bottom: 16px; right: 16px; left: 16px; max-width: 560px; margin-left: auto; padding: 20px; border: 1px solid #bfc8d6; background: #fff; color: #1b1b1b; border-radius: 6px; box-shadow: 0 8px 32px #0003; font-family: Rawline, Arial, sans-serif; font-size: 15px; line-height: 1.5; }
#cgdi-ga4-consent strong { display: block; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
#cgdi-ga4-consent p { margin: 0 0 12px; }
#cgdi-ga4-consent a { display: inline-block; margin-top: 12px; color: #1351b4; text-decoration: underline; }
.cgdi-ga4-actions { display: flex; gap: 8px; flex-wrap: wrap; }
#cgdi-ga4-consent button, .cgdi-ga4-settings { min-height: 44px; padding: 8px 16px; border-radius: 20px; border: 1px solid #1351b4; font: 700 15px/1.5 Rawline, Arial, sans-serif; cursor: pointer; }
.cgdi-ga4-reject { background: #fff; color: #1351b4; }
.cgdi-ga4-accept { background: #1351b4; color: #fff; }
.cgdi-ga4-settings { position: fixed; z-index: 2147483000; bottom: 12px; right: 12px; background: #fff; color: #1351b4; border-color: #bfc8d6; box-shadow: 0 2px 8px #0002; }
#cgdi-ga4-consent button:focus-visible, #cgdi-ga4-consent a:focus-visible, .cgdi-ga4-settings:focus-visible { outline: 3px solid #ffcd07; outline-offset: 3px; }
#cgdi-ga4-consent[hidden], .cgdi-ga4-settings[hidden] { display: none !important; }
@media(max-width:420px) { #cgdi-ga4-consent { padding: 14px; bottom: 8px; right: 8px; left: 8px; } }
'''


def page_prefix(site: Path, path: Path, content: str) -> str:
    effective_dir = path.parent
    base = BASE_RE.search(content)
    if base:
        raw = htmllib.unescape(base.group(2))
        parsed = urlsplit(raw)
        if parsed.scheme or parsed.netloc or raw.startswith('/'):
            raise ValueError(f'Base href não local: {path}')
        effective_dir = (path.parent / parsed.path).resolve()
        if not effective_dir.is_relative_to(site.resolve()):
            raise ValueError(f'Base href fora do site: {path}')
    prefix = os.path.relpath(site.resolve(), effective_dir).replace(os.sep, '/')
    return '' if prefix == '.' else prefix + '/'


def amend_csp(tag: str) -> str:
    match = CONTENT_ATTR_RE.search(tag)
    if not match:
        raise ValueError('CSP meta sem atributo content')
    original = htmllib.unescape(match.group(2))
    directives = [chunk.strip() for chunk in original.split(';') if chunk.strip()]
    items: list[tuple[str, list[str]]] = []
    for directive in directives:
        parts = directive.split()
        items.append((parts[0].lower(), parts[1:]))
    seen = {key for key, _ in items}
    for must in ('script-src', 'connect-src', 'img-src'):
        if must not in seen:
            raise ValueError(f'CSP sem {must}; revisão manual necessária')
    result = []
    for key, values in items:
        extra = ()
        if key in ('script-src', 'script-src-elem'):
            extra = SCRIPT_DOMAINS
        elif key == 'connect-src':
            extra = CONNECT_DOMAINS
        elif key == 'img-src':
            extra = IMAGE_DOMAINS
        for domain in extra:
            if domain not in values:
                values.append(domain)
        result.append(' '.join((key, *values)))
    new_value = '; '.join(result)
    # O HTML original usa aspas duplas para content, logo preservamos a citação original.
    if match.group(1) == "'":
        new_value = new_value.replace("'", '&#39;')
    return tag[:match.start(2)] + new_value + tag[match.end(2):]


def add_to_html(site: Path, path: Path, html: str, suffix: str) -> str | None:
    if 'componentes' in path.relative_to(site).parts or 'recursos' in path.relative_to(site).parts:
        return None
    if not HEAD_RE.search(html):
        return None
    if any(REFRESH_ATTR_RE.search(m.group(0)) for m in META_RE.finditer(html)):
        return None
    if 'cgdi-ga4-consent.js' in html or 'googletagmanager.com/gtag/js' in html:
        raise ValueError(f'GA4 já presente: {path}')
    prefix = page_prefix(site, path, html)
    meta_matches = [m for m in META_RE.finditer(html) if CSP_ATTR_RE.search(m.group(0))]
    if len(meta_matches) > 1:
        raise ValueError(f'Múltiplas políticas CSP no HTML: {path}')
    if meta_matches:
        m = meta_matches[0]
        html = html[:m.start()] + amend_csp(m.group(0)) + html[m.end():]
    tags = (
        f'<link rel="stylesheet" href="{prefix}assets/cgdi-ga4-consent.css?cgdi_v={suffix}">'
        f'<script defer src="{prefix}assets/cgdi-ga4-consent.js?cgdi_v={suffix}"></script>'
    )
    new_html, count = HEAD_RE.subn(lambda m: tags + '\n' + m.group(0), html, count=1)
    if count != 1:
        raise ValueError(f'Falha ao atualizar {path}')
    return new_html


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    args = parser.parse_args()
    site = args.site.resolve(strict=True)
    version = json.loads((site / 'version.json').read_text(encoding='utf-8')).get('version')
    if not isinstance(version, str) or not VERSION_RE.fullmatch(version):
        raise ValueError('version.json não contém SHA válido')
    if not (site / 'assets/cgdi-cache-check.js').is_file():
        raise ValueError('Controle de cache não foi preparado anteriormente')
    if (site / 'assets/cgdi-ga4-consent.js').exists() or (site / 'assets/cgdi-ga4-consent.css').exists():
        raise ValueError('GA4 já aplicado na cópia de publicação')
    planned: list[tuple[Path, str]] = []
    suffix = version[:12]
    for file in sorted(site.rglob('*.html')):
        if file.is_symlink():
            raise ValueError(f'Link simbólico encontrado: {file}')
        result = add_to_html(site, file, file.read_text(encoding='utf-8'), suffix)
        if result is not None:
            planned.append((file, result))
    found = {p.relative_to(site).as_posix() for p, _ in planned}
    if not REQUIRED.issubset(found):
        raise ValueError(f'Páginas obrigatórias ausentes: {sorted(REQUIRED - found)}')
    # Somente depois da validação completa modificamos a cópia de publicação.
    for file, updated in planned:
        file.write_text(updated, encoding='utf-8')
    (site / 'assets/cgdi-ga4-consent.js').write_text(JS, encoding='utf-8')
    (site / 'assets/cgdi-ga4-consent.css').write_text(CSS, encoding='utf-8')
    print(json.dumps({'ga4': MEASUREMENT_ID, 'html_integrados': len(planned), 'consentimento_previo': True}, ensure_ascii=False))


if __name__ == '__main__':
    main()
