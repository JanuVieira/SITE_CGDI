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
  await send('Page.navigate', { url: `${base}/${path}` });
  await wait(1400);
};
const box = selector => `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)return null; const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; })()`;
const fits = rect => rect && rect.left >= -1 && rect.right <= rect.viewport + 1 && rect.width <= rect.viewport + 1;
const results = [];
const record = (name, width, data, ok) => results.push({ name, width, ok, ...data });

await send('Page.enable');
await send('Runtime.enable');

for (const width of [320, 390]) {
  await open('projetos/v1/p00.html', width);
  const header = await evaluate(`(async()=>{await new Promise(r=>setTimeout(r,400));const host=document.querySelector('cgdi-portal-top');const root=host?.shadowRoot;const button=root?.querySelector('#shell-menu-toggle');button?.click();await new Promise(r=>setTimeout(r,100));const panel=root?.querySelector('#shell-nav-panel');const r=panel?.getBoundingClientRect();return {viewport:innerWidth,expanded:button?.getAttribute('aria-expanded'),rect:r&&{left:r.left,right:r.right,width:r.width},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Cabeçalho: menu aberto', width, header, header.expanded === 'true' && header.rect && header.rect.left >= -1 && header.rect.right <= width + 1 && header.overflow <= 1);

  const feedback = await evaluate(`(async()=>{const button=document.querySelector('cgdi-page-feedback .cgdi-feedback-open');button?.click();await new Promise(r=>setTimeout(r,100));const dialog=document.querySelector('cgdi-page-feedback dialog');const panel=dialog?.querySelector('.cgdi-feedback-dialog-panel');const r=panel?.getBoundingClientRect();return {viewport:innerWidth,open:dialog?.open,rect:r&&{left:r.left,right:r.right,width:r.width,bottom:r.bottom},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Pesquisa: modal aberto', width, feedback, feedback.open === true && feedback.rect && feedback.rect.left >= -1 && feedback.rect.right <= width + 1 && feedback.overflow <= 1);

  await open('projetos/v1/p03.html', width);
  const eventDialog = await evaluate(`(async()=>{document.querySelector('[data-p03-open]')?.click();await new Promise(r=>setTimeout(r,100));const dialog=document.querySelector('#p03-dialog');const r=dialog?.getBoundingClientRect();return {viewport:innerWidth,open:dialog?.open,rect:r&&{left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Calendário: detalhes do evento', width, eventDialog, eventDialog.open === true && eventDialog.rect && eventDialog.rect.left >= -1 && eventDialog.rect.right <= width + 1 && eventDialog.rect.top >= -1 && eventDialog.rect.bottom <= 845 && eventDialog.overflow <= 1);

  await open('projetos/v1/p14.html', width);
  const predownload = await evaluate(`(async()=>{const button=document.querySelector('[data-pd-toggle]');button?.click();await new Promise(r=>setTimeout(r,100));const card=button?.closest('cgdi-pre-download');const r=card?.getBoundingClientRect();return {viewport:innerWidth,expanded:button?.getAttribute('aria-expanded'),rect:r&&{left:r.left,right:r.right,width:r.width},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Pré-download: expandido', width, predownload, predownload.expanded === 'true' && predownload.rect && predownload.rect.left >= -1 && predownload.rect.right <= width + 1 && predownload.overflow <= 1);

  await open('projetos/v2/p00.html', width);
  const carousel = await evaluate(`(async()=>{const next=document.querySelector('#v2-noticia-next');next?.click();await new Promise(r=>setTimeout(r,100));const active=[...document.querySelectorAll('.v2-feature-card')].findIndex(el=>!el.hidden);const dot=document.querySelector('.v2-dot[aria-current="true"]');const r=dot?.getBoundingClientRect();return {viewport:innerWidth,active,dot:r&&{width:r.width,height:r.height},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('V2: carrossel acionado', width, carousel, carousel.active === 1 && carousel.dot && carousel.dot.width >= 44 && carousel.dot.height >= 44 && carousel.overflow <= 1);

  const footer = await evaluate(`(async()=>{const host=document.querySelector('cgdi-portal-footer');const root=host?.shadowRoot;const button=root?.querySelector('.shell-footer-expand');button?.click();await new Promise(r=>setTimeout(r,100));const region=root?.getElementById(button?.getAttribute('aria-controls'));const r=region?.getBoundingClientRect();return {viewport:innerWidth,expanded:button?.getAttribute('aria-expanded'),rect:r&&{left:r.left,right:r.right,width:r.width},overflow:document.documentElement.scrollWidth-innerWidth};})()`);
  record('Rodapé: seção expandida', width, footer, footer.expanded === 'true' && footer.rect && footer.rect.left >= -1 && footer.rect.right <= width + 1 && footer.overflow <= 1);
}

const failures = results.filter(item => !item.ok);
console.log(JSON.stringify({ total: results.length, passed: results.length - failures.length, failures, results }, null, 2));
await fetch(`${endpoint}/json/close/${target.id}`);
socket.close();
if (failures.length) process.exitCode = 1;
