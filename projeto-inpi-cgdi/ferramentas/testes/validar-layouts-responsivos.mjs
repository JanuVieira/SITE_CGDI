const endpoint = process.env.CGDI_CDP_ENDPOINT || 'http://127.0.0.1:9225';
const base = process.env.CGDI_BASE_URL || 'http://127.0.0.1:4173';
const baseOrigin = new URL(base).origin;

const pages = [
  'index.html',
  'projeto/auditoria-acessibilidade/index.html',
  'projeto/fluxos-dos-prototipos/index.html',
  'prototipos/estrutura-atual-revisada/index.html',
  'prototipos/estrutura-atual-revisada/acoes-e-resultados/index.html',
  'prototipos/estrutura-atual-revisada/materiais-e-dados/index.html',
  'prototipos/estrutura-atual-revisada/materiais-e-dados/cartilhas/index.html',
  'prototipos/estrutura-atual-revisada/eventos/index.html',
  'prototipos/estrutura-atual-revisada/mentorias/index.html',
  'prototipos/estrutura-atual-revisada/palestras/index.html',
  'prototipos/estrutura-atual-revisada/cooperacao-tecnica/index.html',
  'prototipos/estrutura-atual-revisada/atendimento-presencial/index.html',
  'prototipos/estrutura-atual-revisada/federacoes-e-secretarias/index.html',
  'prototipos/orientado-a-acao/index.html'
];

// Pontos representativos dos quatro contextos de grid do GOV.BR, incluindo
// as duas extremidades que mais expõem estouros e limites de container.
const viewports = [
  { width: 320, height: 844, label: 'mobile-estreito' },
  { width: 390, height: 844, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet-retrato' },
  { width: 900, height: 800, label: 'desktop-minimo-prototipo' },
  { width: 1024, height: 768, label: 'tablet-paisagem' },
  { width: 1280, height: 800, label: 'desktop' },
  { width: 1440, height: 900, label: 'desktop-largo' }
];

const target = await fetch(`${endpoint}/json/new?${encodeURIComponent('about:blank')}`, {
  method: 'PUT'
}).then(response => {
  if (!response.ok) throw new Error(`Chrome DevTools indisponível: HTTP ${response.status}.`);
  return response.json();
});

const socket = new WebSocket(target.webSocketDebuggerUrl);
let serial = 0;
const pending = new Map();
let browserEvents = [];
const requestUrls = new Map();

function isLocalResource(url) {
  try {
    return new URL(url).origin === baseOrigin;
  } catch {
    return false;
  }
}

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    return;
  }
  if (!message.method) return;
  if (message.method === 'Network.requestWillBeSent') {
    requestUrls.set(message.params.requestId, message.params.request?.url || '');
  }
  if (message.method === 'Runtime.exceptionThrown') {
    browserEvents.push({ type: 'exception', text: message.params.exceptionDetails?.text || 'Erro JavaScript' });
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    browserEvents.push({
      type: 'console',
      text: message.params.args?.map(argument => argument.value || argument.description || '').join(' ') || 'console.error'
    });
  }
  if (message.method === 'Network.responseReceived'
      && message.params.response?.status >= 400
      && isLocalResource(message.params.response.url)) {
    const { status, url } = message.params.response;
    // O servidor estático não publica favicon; a requisição automática do navegador não afeta a página.
    if (!url.endsWith('/favicon.ico')) browserEvents.push({ type: 'http', text: `${status} ${url}` });
  }
  if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
    const url = requestUrls.get(message.params.requestId) || '';
    if (isLocalResource(url)) {
      browserEvents.push({ type: 'network', text: `${message.params.errorText || 'Falha de rede'} ${url}`.trim() });
    }
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++serial;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async expression => {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
};

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitUntilReady(timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const ready = await evaluate(`(() => {
      if (document.readyState === 'loading') return false;
      const required = [...document.querySelectorAll(
        'cgdi-prototype-nav, cgdi-portal-top, cgdi-portal-footer'
      )];
      const feedback = document.querySelector('cgdi-page-feedback');
      return required.every(host => host.dataset.cgdiComponentReady === 'true')
        && (!feedback || feedback.dataset.cgdiFeedbackReady === 'true');
    })()`);
    if (ready) return;
    await wait(50);
  }
  throw new Error('Tempo excedido ao aguardar os componentes compartilhados.');
}

async function openPage(path, viewport) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 768
  });
  browserEvents = [];
  await send('Page.navigate', { url: `${base}/${path}` });
  await waitUntilReady();
  // Dá uma volta de renderização para folhas de estilo injetadas pelos componentes.
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
}

const auditExpression = `(() => {
  const visible = element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };
  const rectOf = element => {
    const rect = element.getBoundingClientRect();
    return {
      tag: element.localName,
      id: element.id || '',
      className: typeof element.className === 'string' ? element.className.slice(0, 100) : '',
      left: Math.round(rect.left * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10
    };
  };
  const outside = [...document.body.querySelectorAll('main *, main')]
    .filter(visible)
    .filter(element => {
      const rect = element.getBoundingClientRect();
      if (rect.left >= -1 && rect.right <= innerWidth + 1) return false;
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.body) {
        const style = getComputedStyle(ancestor);
        if (/(auto|scroll)/.test(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth) return false;
        ancestor = ancestor.parentElement;
      }
      return true;
    })
    .slice(0, 8)
    .map(rectOf);
  const mediaOutside = [...document.querySelectorAll('main img, main iframe, main video, main canvas')]
    .filter(visible)
    .filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1;
    })
    .slice(0, 8)
    .map(rectOf);
  const interactive = [...document.querySelectorAll(
    'main a[href], main button:not([disabled]), main input:not([disabled]), main select:not([disabled]), main textarea:not([disabled]), main summary, main [role="button"]'
  )].filter(visible);
  const smallTargets = innerWidth <= 575
    ? interactive.filter(element => {
        // A política do projeto exige 44 px para controles isolados. Links
        // textuais realmente inseridos numa frase são tratados separadamente.
        if (element.matches('a') && getComputedStyle(element).display === 'inline') {
          const textContainer = element.closest('p, li, dd, dt, figcaption, blockquote');
          const containerText = textContainer?.textContent?.replace(/\s+/g, ' ').trim() || '';
          const linkText = element.textContent?.replace(/\s+/g, ' ').trim() || '';
          if (textContainer && containerText.length > linkText.length) return false;
        }
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).slice(0, 12).map(rectOf)
    : [];
  const main = document.querySelector('main');
  const mainRect = main?.getBoundingClientRect();
  const h1 = document.querySelector('h1');
  const h1Rect = h1?.getBoundingClientRect();
  const h1Range = h1 ? document.createRange() : null;
  h1Range?.selectNodeContents(h1);
  const h1TextRects = h1Range
    ? [...h1Range.getClientRects()]
      .filter(rect => rect.width > 0 && rect.height > 0)
    : [];
  const h1LineTops = h1TextRects.map(rect => Math.round(rect.top));
  const brokenH1Words = [];
  if (h1) {
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      for (const match of textNode.data.matchAll(/\\S+/g)) {
        const wordRange = document.createRange();
        wordRange.setStart(textNode, match.index);
        wordRange.setEnd(textNode, match.index + match[0].length);
        const tops = [...wordRange.getClientRects()]
          .filter(rect => rect.width > 0 && rect.height > 0)
          .map(rect => Math.round(rect.top));
        if (new Set(tops).size > 1) brokenH1Words.push(match[0]);
      }
    }
  }
  const componentHosts = [...document.querySelectorAll('[data-cgdi-component]')];
  const unreadyComponents = componentHosts
    .filter(host => ['prototype-nav', 'portal-top', 'portal-footer'].includes(host.dataset.cgdiComponent))
    .filter(host => host.dataset.cgdiComponentReady !== 'true')
    .map(host => host.localName);
  const canonicalHref = value => {
    const url = new URL(value, location.href);
    url.hash = '';
    url.pathname = url.pathname.replace(/\\/index\\.html$/, '/');
    return url.href;
  };
  const breadcrumbHrefs = [...document.querySelectorAll(
    'cgdi-breadcrumb a[href], nav.cgdi-breadcrumb a[href], nav.cgdi-crumb a[href], #portal-breadcrumbs-wrapper nav a[href], nav#breadcrumbs a[href]'
  )].map(link => canonicalHref(link.getAttribute('href')));
  const duplicateBreadcrumbHrefs = breadcrumbHrefs.filter((href, index) => breadcrumbHrefs.indexOf(href) !== index);
  const orphanListItems = [...document.querySelectorAll('li')]
    .filter(item => !item.closest('ul, ol, menu'))
    .slice(0, 12)
    .map(rectOf);
  return {
    title: document.title,
    viewport: innerWidth,
    documentOverflow: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    ) - innerWidth,
    main: mainRect ? rectOf(main) : null,
    h1Count: document.querySelectorAll('h1').length,
    h1: h1Rect ? {
      left: Math.round(Math.min(h1Rect.left, ...h1TextRects.map(rect => rect.left)) * 10) / 10,
      right: Math.round(Math.max(h1Rect.right, ...h1TextRects.map(rect => rect.right)) * 10) / 10,
      width: Math.round(h1Rect.width * 10) / 10,
      lineCount: new Set(h1LineTops).size,
      brokenWords: [...new Set(brokenH1Words)]
    } : null,
    bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
    outside,
    mediaOutside,
    smallTargets,
    unreadyComponents,
    feedbackReady: !document.querySelector('cgdi-page-feedback')
      || document.querySelector('cgdi-page-feedback').dataset.cgdiFeedbackReady === 'true',
    duplicateBreadcrumbHrefs: [...new Set(duplicateBreadcrumbHrefs)],
    orphanListItems
  };
})()`;

const results = [];
try {
  await Promise.all([
    send('Page.enable'),
    send('Runtime.enable'),
    send('Network.enable')
  ]);
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.setBlockedURLs', { urls: ['https://app.powerbi.com/*'] });

  for (const viewport of viewports) {
    for (const path of pages) {
      try {
        await openPage(path, viewport);
        const metrics = await evaluate(auditExpression);
        const errors = [...browserEvents];
        const failures = [];
        const prototypeOrFlow = path.startsWith('prototipos/') || path === 'projeto/fluxos-dos-prototipos/index.html';
        const singleLineMinimum = prototypeOrFlow ? 900 : 1024;
        if (metrics.documentOverflow > 1) failures.push(`overflow global de ${metrics.documentOverflow}px`);
        if (!metrics.main) failures.push('região main ausente');
        if (metrics.h1Count !== 1) failures.push(`${metrics.h1Count} elementos h1`);
        if (path !== 'index.html' && metrics.h1 && viewport.width >= singleLineMinimum && metrics.h1.lineCount > 1) {
          failures.push(`h1 ocupa ${metrics.h1.lineCount} linhas em ${viewport.width}px`);
        }
        if (metrics.h1 && (metrics.h1.left < -1 || metrics.h1.right > viewport.width + 1)) {
          failures.push('h1 ultrapassa a viewport');
        }
        if (metrics.h1 && viewport.width <= 575 && metrics.h1.brokenWords.length) {
          failures.push(`h1 quebra palavras no móvel: ${metrics.h1.brokenWords.join(', ')}`);
        }
        if (metrics.bodyFontSize < 14) failures.push(`fonte base de ${metrics.bodyFontSize}px`);
        if (metrics.outside.length) failures.push(`${metrics.outside.length} elementos fora da viewport`);
        if (metrics.mediaOutside.length) failures.push(`${metrics.mediaOutside.length} mídias fora da viewport`);
        if (metrics.smallTargets.length) failures.push(`${metrics.smallTargets.length} alvos menores que 44px`);
        if (metrics.unreadyComponents.length) failures.push('componentes compartilhados não inicializados');
        if (!metrics.feedbackReady) failures.push('componente de avaliação não inicializado');
        if (metrics.duplicateBreadcrumbHrefs.length) failures.push(`${metrics.duplicateBreadcrumbHrefs.length} destinos duplicados no breadcrumb`);
        if (metrics.orphanListItems.length) failures.push(`${metrics.orphanListItems.length} itens de lista sem lista ancestral`);
        if (errors.length) failures.push(`${errors.length} erros de execução ou recurso`);
        results.push({ path, viewport: viewport.label, width: viewport.width, ok: failures.length === 0, failures, metrics, errors });
      } catch (error) {
        results.push({
          path,
          viewport: viewport.label,
          width: viewport.width,
          ok: false,
          failures: [error.message],
          metrics: null,
          errors: [...browserEvents]
        });
      }
    }
  }
} finally {
  await fetch(`${endpoint}/json/close/${target.id}`).catch(() => {});
  socket.close();
}

const failures = results.filter(result => !result.ok);
console.log(JSON.stringify({
  pages: pages.length,
  viewports: viewports.length,
  scenarios: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  failures
}, null, 2));
if (failures.length) process.exitCode = 1;
