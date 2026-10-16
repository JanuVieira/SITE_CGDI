/* P03 V2. Agenda local acessível, sem navegação externa automática. */
(() => {
  'use strict';
  const init = () => {
    const root = document.querySelector('main.p03-page cgdi-calendar');
    if (!root || root.dataset.p03Initialized === 'v2') return;
    const search = root.querySelector('#p03-search');
    const mode = root.querySelector('#p03-mode');
    const views = [...root.querySelectorAll('[data-p03-view]')];
    const items = [...root.querySelectorAll('[data-calendar-event]')];
    const count = root.querySelector('#p03-results');
    const empty = root.querySelector('#p03-empty');
    const dialog = document.getElementById('p03-dialog');
    if (!search || !mode || !views.length || !count || !empty || !dialog) return;
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dtf = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'});
    const now = Object.fromEntries(dtf.formatToParts(new Date()).map(part => [part.type,part.value]));
    const current = `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}`;
    const entries = items.map(item => {
      const status = item.dataset.status === 'cancelado' ? 'cancelado' : `${item.dataset.date}T${item.dataset.end}` < current ? 'passado' : 'proximo';
      item.dataset.p03Effective = status;
      const label = item.querySelector('[data-p03-state]');
      if (label) label.textContent = status === 'cancelado' ? 'Cancelado' : status === 'passado' ? 'Encerrado' : 'Programado';
      const action = item.querySelector('[data-p03-open]');
      if (action) { const text=action.querySelector('[data-p03-action-label]'); if (text) text.textContent=status === 'cancelado' ? 'Ver informações' : 'Ver evento'; }
      return {item,status};
    });
    const counts = {proximos:0,anteriores:0,cancelados:0,todos:entries.length};
    entries.forEach(({status})=>{ counts[status === 'proximo' ? 'proximos' : status === 'passado' ? 'anteriores' : 'cancelados']++; });
    views.forEach(btn=>{ const el=btn.querySelector('[data-p03-count]'); if (el) el.textContent=counts[btn.dataset.p03View]; });
    let view='proximos';
    const refresh = () => {
      const term = normalize(search.value.trim());
      let found=0;
      entries.forEach(({item,status}) => {
        const statusMatch = view === 'todos' || (view === 'proximos' && status === 'proximo') || (view === 'anteriores' && status === 'passado') || (view === 'cancelados' && status === 'cancelado');
        const modeMatch=mode.value === 'todos' || item.dataset.mode === mode.value;
        const textMatch=!term || normalize(item.querySelector('.p03-event-body')?.textContent).includes(term);
        item.hidden = !(statusMatch && modeMatch && textMatch);
        if (!item.hidden) found++;
      });
      count.textContent = `${found} ${found === 1 ? 'evento encontrado' : 'eventos encontrados'}`;
      empty.textContent = found ? '' : view === 'cancelados' && counts.cancelados === 0 ? 'Nenhum cancelamento confirmado na agenda consultada.' : 'Nenhum evento corresponde aos filtros. Tente outra busca.';
      empty.hidden=found>0;
    };
    views.forEach(btn=>btn.addEventListener('click',()=>{
      view=btn.dataset.p03View;
      views.forEach(other=>other.setAttribute('aria-pressed',other===btn?'true':'false'));
      refresh();
    }));
    search.addEventListener('input',refresh);
    mode.addEventListener('change',refresh);

    const modalTitle=dialog.querySelector('#p03-dialog-title');
    const fields={
      date:dialog.querySelector('[data-p03-detail-date]'),
      status:dialog.querySelector('[data-p03-detail-status]'),
      time:dialog.querySelector('[data-p03-detail-time]'),
      mode:dialog.querySelector('[data-p03-detail-mode]'),
      place:dialog.querySelector('[data-p03-detail-place]')
    };
    const tools=dialog.querySelector('[data-p03-source-tools]');
    const source=dialog.querySelector('#p03-source-url');
    const copy=dialog.querySelector('[data-p03-copy]');
    const copyStatus=dialog.querySelector('[data-p03-copy-status]');
    let lastTrigger=null;
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-p03-open]');
      if (!button) return;
      const article=button.closest('[data-calendar-event]');
      if (!article) return;
      lastTrigger=button;
      modalTitle.textContent=article.querySelector('h3')?.textContent.trim() || 'Evento';
      fields.date.textContent=article.querySelector('time')?.getAttribute('datetime')?.split('-').reverse().join('/') || '';
      fields.status.textContent=article.querySelector('[data-p03-state]')?.textContent || '';
      fields.time.textContent=article.dataset.timeLabel || '';
      fields.mode.textContent=article.dataset.mode === 'online' ? 'Online' : 'Presencial';
      fields.place.textContent=article.querySelector('.p03-place')?.textContent.trim() || '';
      source.value=article.dataset.source || '';
      tools.hidden=!source.value;
      copyStatus.textContent='';
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    });
    const close=()=>{ if(typeof dialog.close==='function') dialog.close();else dialog.removeAttribute('open'); };
    dialog.querySelector('[data-p03-close]').addEventListener('click',close);
    dialog.addEventListener('click',event=>{if(event.target===dialog) close();});
    dialog.addEventListener('close',()=>lastTrigger?.focus());
    copy.addEventListener('click',async()=>{
      if (!source.value) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard indisponível');
        await navigator.clipboard.writeText(source.value);
        copyStatus.textContent='Link copiado.';
      } catch {
        source.focus();source.select();
        copyStatus.textContent='Selecione e copie o endereço acima.';
      }
    });
    root.dataset.p03Initialized='v2';
    refresh();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
