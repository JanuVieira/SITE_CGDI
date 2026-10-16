const endpoint = process.env.CGDI_CDP_ENDPOINT || 'http://127.0.0.1:9225';
const base = process.env.CGDI_BASE_URL || 'http://127.0.0.1:4173';

const pages = [
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

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    return;
  }
  if (!message.method) return;
  if (message.method === 'Runtime.exceptionThrown') {
    browserEvents.push({ type: 'exception', text: message.params.exceptionDetails?.text || 'Erro JavaScript' });
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    browserEvents.push({
      type: 'console',
      text: message.params.args?.map(argument => argument.value || argument.description || '').join(' ') || 'console.error'
    });
  }
  if (message.method === 'Network.responseReceived' && message.params.response?.status >= 400) {
    const { status, url } = message.params.response;
    // O servidor estático não publica favicon; a requisição automática do navegador não afeta a página.
    if (!url.endsWith('/favicon.ico')) browserEvents.push({ type: 'http', text: `${status} ${url}` });
  }
  if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
    browserEvents.push({ type: 'network', text: message.params.errorText || 'Falha de rede' });
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
      if (document.readyState !== 'complete') return false;
      const required = [...document.querySelectorAll(
        'cgdi-prototype-nav, cgdi-portal-top, cgdi-portal-footer'
      )];
      return required.length === 3
        && required.every(host => host.dataset.cgdiComponentReady === 'true')
        && document.querySelector('cgdi-page-feedback')?.dataset.cgdiFeedbackReady === 'true';
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
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).slice(0, 12).map(rectOf)
    : [];
  const main = document.querySelector('main');
  const mainRect = main?.getBoundingClientRect();
  const componentHosts = [...document.querySelectorAll('[data-cgdi-component]')];
  const unreadyComponents = componentHosts
    .filter(host => ['prototype-nav', 'portal-top', 'portal-footer'].includes(host.dataset.cgdiComponent))
    .filter(host => host.dataset.cgdiComponentReady !== 'true')
    .map(host => host.localName);
  return {
    title: document.title,
    viewport: innerWidth,
    documentOverflow: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    ) - innerWidth,
    main: mainRect ? rectOf(main) : null,
    h1Count: document.querySelectorAll('h1').length,
    bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
    outside,
    mediaOutside,
    smallTargets,
    unreadyComponents,
    feedbackReady: document.querySelector('cgdi-page-feedback')?.dataset.cgdiFeedbackReady === 'true'
  };
})()`;

const results = [];
try {
  await Promise.all([
    send('Page.enable'),
    send('Runtime.enable'),
    send('Network.enable')
  ]);

  for (const viewport of viewports) {
    for (const path of pages) {
      try {
        await openPage(path, viewport);
        const metrics = await evaluate(auditExpression);
        const errors = [...browserEvents];
        const failures = [];
        if (metrics.documentOverflow > 1) failures.push(`overflow global de ${metrics.documentOverflow}px`);
        if (!metrics.main) failures.push('região main ausente');
        if (metrics.h1Count !== 1) failures.push(`${metrics.h1Count} elementos h1`);
        if (metrics.bodyFontSize < 14) failures.push(`fonte base de ${metrics.bodyFontSize}px`);
        if (metrics.outside.length) failures.push(`${metrics.outside.length} elementos fora da viewport`);
        if (metrics.mediaOutside.length) failures.push(`${metrics.mediaOutside.length} mídias fora da viewport`);
        if (metrics.smallTargets.length) failures.push(`${metrics.smallTargets.length} alvos menores que 44px`);
        if (metrics.unreadyComponents.length) failures.push('componentes compartilhados não inicializados');
        if (!metrics.feedbackReady) failures.push('componente de avaliação não inicializado');
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
