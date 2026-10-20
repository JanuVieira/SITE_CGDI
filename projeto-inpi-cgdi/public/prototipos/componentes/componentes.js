/* Componentes canônicos compartilhados pelos dois protótipos ativos. */
(() => {
  'use strict';

  const script = document.currentScript;
  if (!script?.src) return;
  const componentRoot = new URL('./', script.src);
  const prototypeRoot = new URL('../', componentRoot);
  const publicRoot = new URL('../', prototypeRoot);

  const fetchDocument = async relativePath => {
    const bundled = window.CGDI_COMPONENT_TEMPLATES?.[relativePath];
    if (bundled) return new DOMParser().parseFromString(bundled, 'text/html');
    const response = await fetch(new URL(relativePath, componentRoot));
    if (!response.ok) throw new Error(`Não foi possível carregar ${relativePath}.`);
    return new DOMParser().parseFromString(await response.text(), 'text/html');
  };

  function initMenu(root) {
    const trigger = root.querySelector('#shell-menu-toggle');
    const panel = root.querySelector('#shell-nav-panel');
    const setOpen = open => {
      if (!trigger || !panel) return;
      panel.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? 'Fechar menu principal de navegação' : 'Abrir menu principal de navegação');
    };
    trigger?.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && trigger?.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        trigger.focus();
      }
    });
    document.addEventListener('click', event => {
      const path = event.composedPath();
      if (panel?.classList.contains('is-open') && !path.includes(panel) && !path.includes(trigger)) setOpen(false);
    });
  }

  function initFooter(root) {
    const groups = root.querySelectorAll('.footer-wrapper > .list-navigation > li');
    groups.forEach((group, index) => {
      const submenu = [...group.children].find(child => child.matches('ul'));
      const heading = [...group.children].find(child => child.matches('a'));
      if (!submenu || !heading || group.querySelector(':scope > .cgdi-footer-heading')) return;

      const headingRow = document.createElement('div');
      headingRow.className = 'cgdi-footer-heading';
      const button = document.createElement('button');
      const submenuId = `cgdi-footer-group-${index + 1}`;
      submenu.id = submenuId;
      button.type = 'button';
      button.className = 'shell-footer-expand';
      button.setAttribute('aria-controls', submenuId);
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', `Expandir opções de ${heading.textContent.trim()}`);
      button.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14" data-icon-vertical></path><path d="M5 12h14"></path></svg>';
      heading.before(headingRow);
      headingRow.append(heading, button);

      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        group.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', `${open ? 'Recolher' : 'Expandir'} opções de ${heading.textContent.trim()}`);
        button.querySelector('[data-icon-vertical]').toggleAttribute('hidden', open);
      });
    });

    root.querySelectorAll('.portal-redes a').forEach(link => {
      if (link.querySelector('svg')) return;
      link.insertAdjacentHTML('afterbegin', '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"></path></svg>');
    });
  }

  function normalizeBreadcrumb() {
    const existing = document.querySelector('cgdi-breadcrumb');
    if (existing) {
      if (document.body?.dataset.version === 'V1') {
        const list = existing.querySelector('ol');
        const prototypeHomeHref = new URL('index.html', publicRoot).href;
        const hasPrototypeHome = [...(list?.querySelectorAll('a[href]') || [])]
          .some(link => link.href === prototypeHomeHref);
        if (list && !hasPrototypeHome) {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = prototypeHomeHref;
          link.textContent = 'Protótipos CGDI';
          item.append(link);
          list.prepend(item);
        }
      }
      return;
    }
    const current = document.querySelector(
      'nav.cgdi-breadcrumb, nav.cgdi-crumb, #portal-breadcrumbs-wrapper nav, nav#breadcrumbs'
    );
    const breadcrumb = document.createElement('cgdi-breadcrumb');
    if (current) {
      if (current.id) breadcrumb.id = current.id;
      breadcrumb.className = current.className || 'br-breadcrumb';
      breadcrumb.setAttribute('aria-label', current.getAttribute('aria-label') || 'Você está aqui');
      breadcrumb.innerHTML = current.innerHTML;
      current.replaceWith(breadcrumb);
      return;
    }

    const content = document.querySelector('main > .container-lg, main .v2-container, main');
    if (!content) return;
    breadcrumb.className = 'br-breadcrumb cgdi-breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Você está aqui');
    breadcrumb.innerHTML = `<ol><li><a href="${new URL('index.html', publicRoot).href}">Protótipos CGDI</a></li><li aria-current="page">INPI para empreender e inovar</li></ol>`;
    content.prepend(breadcrumb);
  }

  async function mountPrototypeNav() {
    const duplicateHosts = [...document.querySelectorAll('cgdi-prototype-nav')];
    duplicateHosts.slice(1).forEach(host => host.remove());
    if (duplicateHosts[0]?.dataset.cgdiComponentReady === 'true') return;
    const doc = await fetchDocument('navegacao-prototipos/template.html');
    const template = doc.getElementById('cgdi-prototype-nav-template');
    if (!template) throw new Error('Template ausente: cgdi-prototype-nav-template.');
    const host = duplicateHosts[0] || document.createElement('cgdi-prototype-nav');
    host.dataset.cgdiComponent = 'prototype-nav';
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    root.replaceChildren(template.content.cloneNode(true));
    root.querySelector('[data-cgdi-prototype-home]').href = new URL('index.html', publicRoot).href;
    host.dataset.cgdiComponentReady = 'true';
    if (!host.isConnected) {
      const skipLink = document.querySelector('.shell-skip');
      skipLink?.after(host) ?? document.body.insertBefore(host, document.body.firstChild);
    }
  }

  // Destinos ainda não publicados não são links no protótipo. Isso evita
  // saídas da página e elimina a necessidade de abrir um aviso modal.
  function enablePendingHeaderControls(root) {
    root.querySelectorAll('a[data-cgdi-prototype-resource="pending"], a[data-prototype-resource="pending"], a[href^="javascript:"]').forEach(link => {
      link.href = '#';
      link.removeAttribute('target');
      link.removeAttribute('data-cgdi-prototype-resource');
      link.removeAttribute('data-prototype-resource');
      link.removeAttribute('aria-disabled');
      link.removeAttribute('role');
      link.removeAttribute('tabindex');
      delete link.dataset.cgdiUnavailable;
      delete link.dataset.cgdiExternalDisabled;
      if (link.dataset.cgdiNoopBound !== 'true') {
        link.addEventListener('click', event => event.preventDefault());
        link.dataset.cgdiNoopBound = 'true';
      }
    });
    root.querySelectorAll('form[data-cgdi-prototype-resource="pending"], form[data-prototype-resource="pending"]').forEach(form => {
      form.removeAttribute('action');
      form.removeAttribute('data-cgdi-prototype-resource');
      form.removeAttribute('data-prototype-resource');
      form.removeAttribute('aria-disabled');
      form.querySelectorAll('button, input, select, textarea').forEach(control => {
        control.disabled = false;
        control.removeAttribute('aria-disabled');
      });
      if (form.dataset.cgdiNoopBound !== 'true') {
        form.addEventListener('submit', event => event.preventDefault());
        form.dataset.cgdiNoopBound = 'true';
      }
    });
  }

  function disablePendingDestinations(root = document) {
    root.querySelectorAll('a[data-cgdi-prototype-resource="pending"], a[data-prototype-resource="pending"], a[href^="javascript:"]').forEach(link => {
      link.removeAttribute('href');
      link.removeAttribute('target');
      link.removeAttribute('data-cgdi-prototype-resource');
      link.removeAttribute('data-prototype-resource');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('role', 'link');
      link.tabIndex = -1;
      link.dataset.cgdiUnavailable = 'true';
    });
    root.querySelectorAll('form[data-cgdi-prototype-resource="pending"], form[data-prototype-resource="pending"]').forEach(form => {
      form.removeAttribute('action');
      form.removeAttribute('data-cgdi-prototype-resource');
      form.removeAttribute('data-prototype-resource');
      form.setAttribute('aria-disabled', 'true');
      form.querySelectorAll('button, input, select, textarea').forEach(control => control.disabled = true);
      if (form.dataset.cgdiPendingBound !== 'true') {
        form.addEventListener('submit', event => event.preventDefault());
        form.dataset.cgdiPendingBound = 'true';
      }
    });
  }

  async function mountShell() {
    let topHost = document.querySelector('[data-cgdi-component="portal-top"]');
    let footerHost = document.querySelector('[data-cgdi-component="portal-footer"]');
    if (!topHost) {
      topHost = document.createElement('cgdi-portal-top');
      topHost.dataset.cgdiComponent = 'portal-top';
      const skipLink = document.querySelector('.shell-skip');
      skipLink?.after(topHost) ?? document.body.prepend(topHost);
    }
    if (!footerHost) {
      footerHost = document.createElement('cgdi-portal-footer');
      footerHost.dataset.cgdiComponent = 'portal-footer';
      document.body.append(footerHost);
    }

    document.querySelectorAll('.shell-govbar, #site-header').forEach(node => node.remove());
    document.querySelectorAll('footer.portal-footer, footer#portal-footer').forEach(node => node.remove());

    const hosts = [topHost, footerHost];
    const doc = await fetchDocument('portal/template.html');
    for (const host of hosts) {
      const id = host.matches('cgdi-portal-top') ? 'cgdi-portal-top' : 'cgdi-portal-footer';
      const template = doc.getElementById(id);
      if (!template) throw new Error(`Template ausente: ${id}.`);
      const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('portal/portal.css', componentRoot).href;
      const fragment = template.content.cloneNode(true);
      if (id === 'cgdi-portal-top') {
        const logo = fragment.querySelector('[data-cgdi-asset="govbr-logo"]');
        if (logo) logo.src = new URL('assets/img/logo-govbr.png', prototypeRoot).href;
      }
      root.replaceChildren(style, fragment);
      if (id === 'cgdi-portal-top') enablePendingHeaderControls(root);
      else disablePendingDestinations(root);
      if (id === 'cgdi-portal-top') initMenu(root);
      if (id === 'cgdi-portal-footer') initFooter(root);
      host.dataset.cgdiComponentReady = 'true';
    }
    normalizeBreadcrumb();
    document.dispatchEvent(new CustomEvent('cgdi:shell-ready'));
  }

  async function mountCalendars() {
    const hosts = [...document.querySelectorAll('cgdi-calendar, [data-cgdi-component="calendar"]')];
    if (!hosts.length) return;
    if (!document.querySelector('link[data-cgdi-calendar-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('calendario/calendario.css', componentRoot).href;
      style.dataset.cgdiCalendarStyle = 'true';
      document.head.append(style);
    }
    const doc = await fetchDocument('calendario/template.html');
    const template = doc.getElementById('cgdi-calendar-template');
    if (!template) throw new Error('Template ausente: cgdi-calendar-template.');

    hosts.forEach((host, index) => {
      if (host.dataset.cgdiComponentReady === 'true') return;
      if (host.dataset.calendarMode === 'legacy') {
        host.classList.add('cgdi-calendar', 'cgdi-calendar--legacy');
        host.dataset.cgdiComponent = 'calendar';
        host.dataset.cgdiComponentReady = 'true';
        return;
      }
      host.replaceChildren(template.content.cloneNode(true));
      const calendar = host.querySelector('.cgdi-calendar');
      const title = calendar.querySelector('.cgdi-calendar__title');
      const titleId = `cgdi-calendar-title-${index + 1}`;
      title.id = titleId;
      calendar.setAttribute('aria-labelledby', titleId);
      if (host.dataset.title) title.textContent = host.dataset.title;
      const intro = calendar.querySelector('.cgdi-calendar__intro');
      if (host.dataset.intro) intro.textContent = host.dataset.intro;

      const search = calendar.querySelector('[data-calendar-search]');
      const filter = calendar.querySelector('[data-calendar-filter]');
      const events = [...calendar.querySelectorAll('[data-calendar-event]')];
      const count = calendar.querySelector('[data-calendar-count]');
      const empty = calendar.querySelector('[data-calendar-empty]');
      const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const update = () => {
        const term = normalize(search.value.trim());
        const status = filter.value;
        let visible = 0;
        events.forEach(event => {
          const shown = (!term || normalize(event.textContent).includes(term))
            && (status === 'todos' || event.dataset.status === status);
          event.hidden = !shown;
          if (shown) visible += 1;
        });
        count.textContent = visible
          ? `Exibindo ${visible} de ${events.length} eventos do exemplo`
          : 'Nenhum evento do exemplo exibido';
        empty.hidden = visible !== 0;
      };
      search.addEventListener('input', update);
      filter.addEventListener('change', update);
      host.dataset.cgdiComponent = 'calendar';
      host.dataset.cgdiComponentReady = 'true';
    });
  }

  function upgradeLegacyCalendars() {
    document.querySelectorAll('.event_listing').forEach(listing => {
      if (listing.closest('cgdi-calendar')) return;
      const host = document.createElement('cgdi-calendar');
      host.dataset.calendarMode = 'legacy';
      listing.replaceWith(host);
      host.append(listing);
    });
  }

  function upgradeLegacyCards() {
    const mappings = [
      ['article.service-card', 'service'],
      ['article.topic-card', 'topic'],
      ['article.card-v1', 'compact'],
      ['article.impact-v4-card', 'compact']
    ];
    mappings.forEach(([selector, variant]) => {
      document.querySelectorAll(selector).forEach(legacy => {
        if (legacy.closest('cgdi-card')) return;
        const card = document.createElement('cgdi-card');
        [...legacy.attributes].forEach(attribute => card.setAttribute(attribute.name, attribute.value));
        card.setAttribute('variant', variant);
        card.append(...legacy.childNodes);
        legacy.replaceWith(card);
      });
    });
  }

  function promoteElement(element, tagName, componentName) {
    if (!element || element.closest(tagName)) return element;
    const component = document.createElement(tagName);
    [...element.attributes].forEach(attribute => component.setAttribute(attribute.name, attribute.value));
    component.append(...element.childNodes);
    component.dataset.cgdiComponent = componentName;
    component.dataset.cgdiComponentReady = 'true';
    element.replaceWith(component);
    return component;
  }

  function mountV1EditorialComponents() {
    if (!document.body?.matches('.cgdi-page[data-version]')) return;
    if (!document.querySelector('link[data-cgdi-editorial-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('estrutura-editorial/estrutura-editorial.css', componentRoot).href;
      style.dataset.cgdiEditorialStyle = 'true';
      document.head.append(style);
    }

    document.querySelectorAll('header.page-intro').forEach(element => promoteElement(element, 'cgdi-page-intro', 'page-intro'));
    document.querySelectorAll('h1.v2-opening-title').forEach(heading => {
      if (heading.closest('cgdi-page-intro')) return;
      const intro = document.createElement('cgdi-page-intro');
      intro.dataset.cgdiComponent = 'page-intro';
      intro.dataset.cgdiComponentReady = 'true';
      heading.replaceWith(intro);
      intro.append(heading);
    });
    document.querySelectorAll('h1.documentFirstHeading').forEach(heading => {
      if (heading.closest('cgdi-page-intro')) return;
      const intro = document.createElement('cgdi-page-intro');
      intro.dataset.cgdiComponent = 'page-intro';
      intro.dataset.cgdiComponentReady = 'true';
      heading.replaceWith(intro);
      intro.append(heading);
    });
    document.querySelectorAll('.documentByLine').forEach(element => promoteElement(element, 'cgdi-metadata', 'metadata'));
    document.querySelectorAll('.documentActions').forEach(element => promoteElement(element, 'cgdi-page-actions', 'page-actions'));
    document.querySelectorAll('.callout').forEach(element => promoteElement(element, 'cgdi-callout', 'callout'));
    document.querySelectorAll('.resource-notice, .prototype-note').forEach(element => promoteElement(element, 'cgdi-callout', 'callout'));
    document.querySelectorAll('.portalMessage').forEach(element => promoteElement(element, 'cgdi-status-message', 'status-message'));
    document.querySelectorAll('dl.image-inline.captioned').forEach(element => promoteElement(element, 'cgdi-media-figure', 'media-figure'));
    document.querySelectorAll('.info-evento, .data-local-evento').forEach(element => promoteElement(element, 'cgdi-event-details', 'event-details'));

    document.querySelectorAll('#content-core iframe').forEach(frame => {
      if (frame.closest('cgdi-embedded-content')) return;
      const host = document.createElement('cgdi-embedded-content');
      host.dataset.cgdiComponent = 'embedded-content';
      host.dataset.cgdiComponentReady = 'true';
      frame.before(host);
      host.append(frame);
    });
    document.querySelectorAll('#content-core table').forEach(table => {
      if (table.closest('cgdi-data-table, cgdi-content-grid, cgdi-pre-download')) return;
      const tagName = table.querySelector('th') ? 'cgdi-data-table' : 'cgdi-content-grid';
      const host = document.createElement(tagName);
      host.dataset.cgdiComponent = tagName === 'cgdi-data-table' ? 'data-table' : 'content-grid';
      host.dataset.cgdiComponentReady = 'true';
      table.before(host);
      host.append(table);
    });
    document.querySelectorAll('ul.toggable-content').forEach(list => {
      const accordion = promoteElement(list, 'cgdi-accordion', 'accordion');
      accordion.querySelectorAll(':scope > li').forEach((item, index) => {
        const trigger = item.querySelector(':scope > .toggle');
        const panel = item.querySelector(':scope > .conteudo');
        if (!trigger || !panel || trigger.matches('button')) return;
        const button = document.createElement('button');
        const panelId = panel.id || `cgdi-accordion-panel-${index + 1}`;
        panel.id = panelId;
        button.type = 'button';
        button.className = trigger.className;
        button.innerHTML = trigger.innerHTML;
        button.setAttribute('aria-controls', panelId);
        button.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
        trigger.replaceWith(button);
        button.addEventListener('click', () => {
          const open = button.getAttribute('aria-expanded') !== 'true';
          button.setAttribute('aria-expanded', String(open));
          button.classList.toggle('closed', !open);
          panel.hidden = !open;
        });
      });
    });

    document.querySelectorAll('.service-grid, .topic-grid, .v2-grid').forEach(grid => {
      if (grid.closest('cgdi-card-grid')) return;
      const host = document.createElement('cgdi-card-grid');
      host.dataset.cgdiComponent = 'card-grid';
      host.dataset.cgdiComponentReady = 'true';
      grid.before(host);
      host.append(grid);
    });
    document.querySelectorAll('ul.resource-list').forEach(list => promoteElement(list, 'cgdi-resource-list', 'resource-list'));
    document.querySelectorAll('form.state-finder').forEach(form => {
      if (form.closest('cgdi-state-finder')) return;
      const host = document.createElement('cgdi-state-finder');
      host.dataset.cgdiComponent = 'state-finder';
      host.dataset.cgdiComponentReady = 'true';
      form.before(host);
      host.append(form);
    });
    document.querySelectorAll('section.state-news, section.states-section').forEach(section => promoteElement(section, 'cgdi-state-news', 'state-news'));
    document.querySelectorAll('section.v2-feature').forEach(section => promoteElement(section, 'cgdi-news-carousel', 'news-carousel'));
    document.querySelectorAll('.v2-story-band').forEach(element => promoteElement(element, 'cgdi-feature-band', 'feature-band'));
    document.querySelectorAll('.v2-formats').forEach(element => {
      if (element.closest('cgdi-format-navigation')) return;
      const host = document.createElement('cgdi-format-navigation');
      host.dataset.cgdiComponent = 'format-navigation';
      host.dataset.cgdiComponentReady = 'true';
      element.before(host);
      host.append(element);
    });
  }

  function ensureFeedbackHost() {
    if (document.querySelector('cgdi-page-feedback')) return;
    const main = document.querySelector('main, #main-content');
    if (!main) return;
    const host = document.createElement('cgdi-page-feedback');
    host.dataset.cgdiComponent = 'page-feedback';
    main.append(host);
  }

  function disableExternalLinks(root = document) {
    root.querySelectorAll('a[href^="http://"], a[href^="https://"], a[href^="//"], a[href^="mailto:"], a[href^="tel:"]').forEach(link => {
      if (link.dataset.cgdiLinkOficial === 'true') return;
      link.removeAttribute('href');
      link.removeAttribute('target');
      link.removeAttribute('data-cgdi-prototype-resource');
      link.setAttribute('role', 'link');
      link.setAttribute('aria-disabled', 'true');
      link.dataset.cgdiExternalDisabled = 'true';
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
      });
    });
  }

  function mountCards() {
    const cards = [...document.querySelectorAll('cgdi-card')];
    if (!cards.length) return;
    if (!document.querySelector('link[data-cgdi-card-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('cards/cards.css', componentRoot).href;
      style.dataset.cgdiCardStyle = 'true';
      document.head.append(style);
    }
    const allowed = new Set(['feature', 'standard', 'support', 'large', 'media', 'metric', 'report', 'inverse', 'service', 'topic', 'compact']);
    cards.forEach(card => {
      if (!allowed.has(card.getAttribute('variant'))) card.setAttribute('variant', 'standard');
      /* O host reutilizável mantém a classe estrutural oficial do card GOV.BR. */
      card.classList.add('cgdi-card', 'br-card');
      const directChildren = [...card.children];
      directChildren.find(child => child.matches('svg'))?.setAttribute('data-card-icon', '');
      directChildren.find(child => child.matches('img'))?.setAttribute('data-card-media', '');
      if (['feature', 'media'].includes(card.getAttribute('variant'))) {
        directChildren.find(child => child.matches('div'))?.setAttribute('data-card-body', '');
      }
      card.dataset.cgdiComponent = 'card';
      card.dataset.cgdiComponentReady = 'true';
    });
  }

  function loadResearchComponent() {
    if (!document.querySelector('link[data-cgdi-research-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('pesquisa/pesquisa.css', componentRoot).href;
      style.dataset.cgdiResearchStyle = 'true';
      document.head.append(style);
    }
    if (customElements.get('cgdi-page-feedback')) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-cgdi-research-script]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const research = document.createElement('script');
      research.src = new URL('pesquisa/pesquisa.js', componentRoot).href;
      research.dataset.cgdiResearchScript = 'true';
      research.addEventListener('load', resolve, { once: true });
      research.addEventListener('error', () => reject(new Error('Não foi possível carregar o componente de pesquisa.')), { once: true });
      document.head.append(research);
    });
  }

  async function enhancePreDownloads() {
    const hosts = document.querySelectorAll('cgdi-pre-download');
    if (!hosts.length) return;
    const templateDocument = await fetchDocument('pre-download/template.html');
    const emptyTemplate = templateDocument.getElementById('cgdi-pre-download-empty-template');
    if (!emptyTemplate) throw new Error('Template ausente: cgdi-pre-download-empty-template.');
    if (!document.querySelector('link[data-cgdi-pre-download-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('pre-download/pre-download.css', componentRoot).href;
      style.dataset.cgdiPreDownloadStyle = 'true';
      document.head.append(style);
    }
    if (!document.querySelector('script[data-cgdi-pre-download-script]')) {
      const behavior = document.createElement('script');
      behavior.src = new URL('pre-download/pre-download.js', componentRoot).href;
      behavior.defer = true;
      behavior.dataset.cgdiPreDownloadScript = 'true';
      document.head.append(behavior);
    }
    hosts.forEach(card => {
      if (!card.firstElementChild) card.replaceChildren(emptyTemplate.content.cloneNode(true));
      card.dataset.cgdiComponentReady = 'true';
      card.dispatchEvent(new CustomEvent('cgdi:pre-download-ready', { bubbles: true }));
    });
  }

  class CgdiBreadcrumb extends HTMLElement {
    connectedCallback() { this.setAttribute('role', 'navigation'); }
  }
  if (!customElements.get('cgdi-breadcrumb')) customElements.define('cgdi-breadcrumb', CgdiBreadcrumb);

  class CgdiCalendar extends HTMLElement {}
  if (!customElements.get('cgdi-calendar')) customElements.define('cgdi-calendar', CgdiCalendar);

  class CgdiCard extends HTMLElement {}
  if (!customElements.get('cgdi-card')) customElements.define('cgdi-card', CgdiCard);

  for (const tagName of ['cgdi-page-intro', 'cgdi-metadata', 'cgdi-page-actions', 'cgdi-callout', 'cgdi-status-message', 'cgdi-media-figure', 'cgdi-event-details', 'cgdi-embedded-content', 'cgdi-data-table', 'cgdi-content-grid', 'cgdi-accordion', 'cgdi-card-grid', 'cgdi-resource-list', 'cgdi-state-finder', 'cgdi-state-news', 'cgdi-news-carousel', 'cgdi-feature-band', 'cgdi-format-navigation']) {
    if (!customElements.get(tagName)) customElements.define(tagName, class extends HTMLElement {});
  }

  const reportInitializationError = (label, error) => {
    console.error(`[CGDI componentes: ${label}]`, error);
  };
  const runInitializer = (label, initializer) => {
    try {
      return Promise.resolve(initializer()).catch(error => reportInitializationError(label, error));
    } catch (error) {
      reportInitializationError(label, error);
      return Promise.resolve();
    }
  };

  runInitializer('adaptação de cards legados', upgradeLegacyCards);
  runInitializer('adaptação de calendários legados', upgradeLegacyCalendars);
  runInitializer('componentes editoriais', mountV1EditorialComponents);
  runInitializer('host de avaliação', ensureFeedbackHost);
  runInitializer('links externos', disableExternalLinks);
  runInitializer('destinos pendentes', disablePendingDestinations);
  runInitializer('cards', mountCards);
  runInitializer('navegação entre protótipos', mountPrototypeNav);
  runInitializer('shell institucional', async () => {
    await mountShell();
    disablePendingDestinations();
  });
  runInitializer('calendários', mountCalendars);
  runInitializer('avaliação de página', loadResearchComponent);
  runInitializer('pré-download', enhancePreDownloads);
})();

