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
  let footerLink;
  let footerWrapper;
  let reopenedFromFooter = false;

  function storedChoice() {
    try {
      const value = localStorage.getItem(CHOICE_KEY);
      return value === 'accepted' || value === 'rejected' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function storeChoice(value) {
    try {
      localStorage.setItem(CHOICE_KEY, value);
    } catch (_) {
      // Sem armazenamento disponível, o consentimento será pedido novamente.
    }
  }

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function startAnalytics() {
    if (loaded) return;
    loaded = true;
    window['ga-disable-' + ID] = false;
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
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(script);
  }

  function forgetAnalyticsCookies() {
    const paths = new Set(['/']);
    let prefix = '';
    for (const segment of location.pathname.split('/').filter(Boolean)) {
      prefix += '/' + segment;
      paths.add(prefix);
      paths.add(prefix + '/');
    }
    document.cookie.split(';').forEach((part) => {
      const name = part.split('=')[0].trim();
      if (!/^_ga($|_)/.test(name)) return;
      for (const path of paths) {
        document.cookie = name + '=; Max-Age=0; Path=' + path + '; SameSite=Lax';
      }
    });
  }

  function restoreFocus() {
    if (reopenedFromFooter && footerLink) {
      footerLink.focus({ preventScroll: true });
    } else {
      const main = document.querySelector('main');
      if (main) {
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    }
    reopenedFromFooter = false;
  }

  function choose(value) {
    storeChoice(value);
    banner.hidden = true;
    footerWrapper.hidden = false;
    restoreFocus();
    if (value === 'accepted') {
      startAnalytics();
    } else if (loaded) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      window['ga-disable-' + ID] = true;
      forgetAnalyticsCookies();
      location.reload();
    }
  }

  function actionButton(label, className, value) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', () => choose(value));
    return button;
  }

  function init() {
    if (!document.body) return;

    banner = document.createElement('section');
    banner.id = 'cgdi-ga4-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'cgdi-ga4-title');
    banner.setAttribute('aria-describedby', 'cgdi-ga4-description');

    const heading = document.createElement('h2');
    heading.id = 'cgdi-ga4-title';
    heading.textContent = 'Cookies opcionais';

    const description = document.createElement('p');
    description.id = 'cgdi-ga4-description';
    description.textContent = 'Com sua permissão, usamos cookies para medir visitas e melhorar este site. Recusar não afeta sua navegação.';

    const actions = document.createElement('div');
    actions.className = 'cgdi-ga4-actions';
    const rejectButton = actionButton('Recusar', 'cgdi-ga4-reject', 'rejected');
    const acceptButton = actionButton('Permitir análise', 'cgdi-ga4-accept', 'accepted');
    actions.append(rejectButton, acceptButton);

    banner.append(heading, description, actions);

    // A preferência permanece editável no rodapé, sem botão flutuante.
    footerWrapper = document.createElement('div');
    footerWrapper.className = 'cgdi-ga4-footer';
    footerLink = document.createElement('a');
    footerLink.href = '#';
    footerLink.textContent = 'Preferências de privacidade';
    footerLink.addEventListener('click', (event) => {
      event.preventDefault();
      reopenedFromFooter = true;
      banner.hidden = false;
      rejectButton.focus({ preventScroll: true });
    });
    footerWrapper.appendChild(footerLink);
    const footers = document.querySelectorAll('footer, [role="contentinfo"]');
    const footer = footers.length ? footers[footers.length - 1] : document.body;
    footer.appendChild(footerWrapper);
    document.body.appendChild(banner);

    const choice = storedChoice();
    banner.hidden = choice !== null;
    footerWrapper.hidden = choice === null;
    if (choice === 'accepted') startAnalytics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();'''

CSS = r'''#cgdi-ga4-consent, #cgdi-ga4-consent *, .cgdi-ga4-footer, .cgdi-ga4-footer * { box-sizing: border-box; }
#cgdi-ga4-consent { position: fixed; z-index: 2147483000; bottom: 20px; right: 20px; left: 20px; max-width: 440px; max-height: min(90vh, 680px); overflow-y: auto; margin-left: auto; padding: 18px; border: 1px solid #d5dbe5; border-top: 4px solid #1351b4; background: #fff; color: #252525; border-radius: 4px; box-shadow: 0 8px 28px rgba(0,0,0,.18); font: 400 15px/1.55 Rawline, Arial, sans-serif; }
#cgdi-ga4-consent h2 { margin: 0 0 10px; color: #1b1b1b; font: 700 18px/1.35 Rawline, Arial, sans-serif; }
#cgdi-ga4-consent p { margin: 0 0 10px; }
.cgdi-ga4-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-wrap: wrap; }
#cgdi-ga4-consent button { min-height: 44px; padding: 9px 18px; border: 1px solid #1351b4; border-radius: 20px; font: 700 15px/1.45 Rawline, Arial, sans-serif; cursor: pointer; }
#cgdi-ga4-consent .cgdi-ga4-reject { background: #fff; color: #1351b4; }
#cgdi-ga4-consent .cgdi-ga4-accept { background: #1351b4; color: #fff; }
#cgdi-ga4-consent .cgdi-ga4-reject:hover { background: #edf3ff; }
#cgdi-ga4-consent .cgdi-ga4-accept:hover { background: #0c326f; }
.cgdi-ga4-footer { padding: 12px 16px; text-align: center; font: 400 14px/1.5 Rawline, Arial, sans-serif; }
.cgdi-ga4-footer a { color: #1351b4; text-decoration: underline; text-underline-offset: 3px; }
#cgdi-ga4-consent button:focus-visible, .cgdi-ga4-footer a:focus-visible { outline: 3px solid #ffcd07; outline-offset: 3px; }
#cgdi-ga4-consent[hidden], .cgdi-ga4-footer[hidden] { display: none !important; }
@media (max-width: 520px) { #cgdi-ga4-consent { right: 8px; left: 8px; bottom: 8px; padding: 16px; max-width: none; } .cgdi-ga4-actions { flex-direction: column; align-items: stretch; } #cgdi-ga4-consent button { width: 100%; } }
@media (prefers-contrast: more) { #cgdi-ga4-consent { border: 2px solid currentColor; } }'''


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
