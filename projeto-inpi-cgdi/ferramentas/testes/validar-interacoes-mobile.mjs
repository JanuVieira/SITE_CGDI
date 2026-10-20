const endpoint = process.env.CGDI_CDP_ENDPOINT || 'http://127.0.0.1:9225';
const base = process.env.CGDI_BASE_URL || 'http://127.0.0.1:4173';

const target = await fetch(`${endpoint}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
let serial = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(new Error(message.error.message)) : resolve(message.result);
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
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const viewport = async width => send('Emulation.setDeviceMetricsOverride', {
  width, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: width, screenHeight: 844
});
const open = async (path, width) => {
  await viewport(width);
  const url = `${base}/${path}`;
  await send('Page.navigate', { url });
  const started = Date.now();
  while (Date.now() - started < 5000) {
    const ready = await evaluate(`(() => {
      if (location.href !== ${JSON.stringify(url)} || document.readyState === 'loading') return false;
      const components = [...document.querySelectorAll(
        'cgdi-prototype-nav, cgdi-portal-top, cgdi-portal-footer'
      )];
      const feedback = document.querySelector('cgdi-page-feedback');
      return components.every(host => host.dataset.cgdiComponentReady === 'true')
        && (!feedback || feedback.dataset.cgdiFeedbackReady === 'true');
    })()`);
    if (ready) {
      await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      return;
    }
    await wait(50);
  }
  throw new Error(`Tempo excedido ao abrir ${path}.`);
};
const box = selector => `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)return null; const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; })()`;
const fits = rect => rect && rect.left >= -1 && rect.right <= rect.viewport + 1 && rect.width <= rect.viewport + 1;
const results = [];
const record = (name, width, data, ok) => results.push({ name, width, ok, ...data });

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setBlockedURLs', { urls: ['https://app.powerbi.com/*'] });

for (const width of [320, 360, 390, 412]) {
  await open('index.html', width);
  const home = await evaluate(`(()=>{const visible=el=>{const style=getComputedStyle(el);const rect=el.getBoundingClientRect();return !el.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>0&&rect.height>0;};const allCards=[...document.querySelectorAll('.delivery-card')];const cards=allCards.filter(visible);const firstAction=cards[0]?.querySelector('.br-button');const r=firstAction?.getBoundingClientRect();return {viewport:innerWidth,cards:cards.length,hiddenCards:allCards.length-cards.length,action:r&&{left:r.left,right:r.right,height:r.height},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Home: entregas principais', width, home, home.cards === 5 && home.action && home.action.left >= -1 && home.action.right <= width + 1 && home.action.height >= 44 && home.overflow <= 1);

  await open('projeto/fluxos-dos-prototipos/index.html', width);
  const flows = await evaluate(`(()=>{const routes=document.querySelectorAll('.route-grid > li');const grid=document.querySelector('.route-grid');const r=grid?.getBoundingClientRect();return {viewport:innerWidth,routes:routes.length,rect:r&&{left:r.left,right:r.right,width:r.width},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Fluxos: mapa de rotas', width, flows, flows.routes === 8 && flows.rect && flows.rect.left >= -1 && flows.rect.right <= width + 1 && flows.overflow <= 1);

  await open('prototipos/estrutura-atual-revisada/index.html', width);
  const header = await evaluate(`(async()=>{await new Promise(r=>setTimeout(r,400));const host=document.querySelector('cgdi-portal-top');const root=host?.shadowRoot;const button=root?.querySelector('#shell-menu-toggle');button?.click();await new Promise(r=>setTimeout(r,100));const panel=root?.querySelector('#shell-nav-panel');const r=panel?.getBoundingClientRect();return {viewport:innerWidth,expanded:button?.getAttribute('aria-expanded'),rect:r&&{left:r.left,right:r.right,width:r.width},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Cabeçalho: menu aberto', width, header, header.expanded === 'true' && header.rect && header.rect.left >= -1 && header.rect.right <= width + 1 && header.overflow <= 1);

  const feedback = await evaluate(`(async()=>{const button=document.querySelector('cgdi-page-feedback .cgdi-feedback-open');button?.click();await new Promise(r=>setTimeout(r,100));const dialog=document.querySelector('cgdi-page-feedback dialog');const panel=dialog?.querySelector('.cgdi-feedback-dialog-panel');const r=panel?.getBoundingClientRect();return {viewport:innerWidth,open:dialog?.open,rect:r&&{left:r.left,right:r.right,width:r.width,bottom:r.bottom},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Pesquisa: modal aberto', width, feedback, feedback.open === true && feedback.rect && feedback.rect.left >= -1 && feedback.rect.right <= width + 1 && feedback.overflow <= 1);

  await open('prototipos/estrutura-atual-revisada/eventos/index.html', width);
  const eventDialog = await evaluate(`(async()=>{document.querySelector('[data-p03-open]')?.click();await new Promise(r=>setTimeout(r,100));const dialog=document.querySelector('#p03-dialog');const r=dialog?.getBoundingClientRect();return {viewport:innerWidth,open:dialog?.open,rect:r&&{left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Calendário: detalhes do evento', width, eventDialog, eventDialog.open === true && eventDialog.rect && eventDialog.rect.left >= -1 && eventDialog.rect.right <= width + 1 && eventDialog.rect.top >= -1 && eventDialog.rect.bottom <= 845 && eventDialog.overflow <= 1);

  await open('prototipos/estrutura-atual-revisada/materiais-e-dados/cartilhas/index.html', width);
  const predownload = await evaluate(`(async()=>{const button=document.querySelector('[data-pd-toggle]');button?.click();await new Promise(r=>setTimeout(r,100));const card=button?.closest('cgdi-pre-download');const r=card?.getBoundingClientRect();const actions=[...document.querySelectorAll('.pd-action')].map(action=>{const box=action.getBoundingClientRect();return {href:action.getAttribute('href'),official:action.dataset.cgdiLinkOficial,ariaDisabled:action.getAttribute('aria-disabled'),unavailable:action.dataset.cgdiUnavailable||action.dataset.cgdiExternalDisabled||null,tabIndex:action.tabIndex,height:box.height,left:box.left,right:box.right};});return {viewport:innerWidth,expanded:button?.getAttribute('aria-expanded'),rect:r&&{left:r.left,right:r.right,width:r.width},actions,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  const actionsEnabled = predownload.actions.length === 4 && predownload.actions.every(action =>
    action.href?.startsWith('https://www.gov.br/inpi/') &&
    action.official === 'true' &&
    action.ariaDisabled === null &&
    action.unavailable === null &&
    action.tabIndex >= 0 &&
    action.height >= 44 &&
    action.left >= -1 &&
    action.right <= width + 1
  );
  record('Pré-download: ações e expansão', width, predownload, predownload.expanded === 'true' && predownload.rect && predownload.rect.left >= -1 && predownload.rect.right <= width + 1 && actionsEnabled && predownload.overflow <= 1);

  await open('prototipos/orientado-a-acao/index.html', width);
  const carousel = await evaluate(`(async()=>{const next=document.querySelector('#v2-noticia-next');next?.click();await new Promise(r=>setTimeout(r,100));const active=[...document.querySelectorAll('.v2-feature-card')].findIndex(el=>!el.hidden);const dot=document.querySelector('.v2-dot[aria-current="true"]');const r=dot?.getBoundingClientRect();return {viewport:innerWidth,active,dot:r&&{width:r.width,height:r.height},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Orientado à ação: carrossel acionado', width, carousel, carousel.active === 1 && carousel.dot && carousel.dot.width >= 44 && carousel.dot.height >= 44 && carousel.overflow <= 1);

  const footer = await evaluate(`(async()=>{const host=document.querySelector('cgdi-portal-footer');const root=host?.shadowRoot;const button=root?.querySelector('.shell-footer-expand');button?.click();await new Promise(r=>setTimeout(r,100));const region=root?.getElementById(button?.getAttribute('aria-controls'));const r=region?.getBoundingClientRect();return {viewport:innerWidth,expanded:button?.getAttribute('aria-expanded'),rect:r&&{left:r.left,right:r.right,width:r.width},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Rodapé: seção expandida', width, footer, footer.expanded === 'true' && footer.rect && footer.rect.left >= -1 && footer.rect.right <= width + 1 && footer.overflow <= 1);

  await open('prototipos/estrutura-atual-revisada/federacoes-e-secretarias/index.html', width);
  const federations = await evaluate(`(async()=>{await new Promise(r=>setTimeout(r,300));const official=[...document.querySelectorAll('[data-cgdi-link-oficial="true"]')];return {viewport:innerWidth,total:official.length,disabled:official.filter(link=>link.dataset.cgdiExternalDisabled==='true'||link.getAttribute('aria-disabled')==='true'||!link.getAttribute('href')).length,unavailableText:[...document.querySelectorAll('#conteudo *')].filter(el=>el.textContent?.toLowerCase().includes('indisponível')).length,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Federações: destinos oficiais disponíveis', width, federations, federations.total === 4 && federations.disabled === 0 && federations.unavailableText === 0 && federations.overflow <= 1);
}

const failures = results.filter(item => !item.ok);
console.log(JSON.stringify({ total: results.length, passed: results.length - failures.length, failures, results }, null, 2));
await fetch(`${endpoint}/json/close/${target.id}`);
socket.close();
if (failures.length) process.exitCode = 1;
