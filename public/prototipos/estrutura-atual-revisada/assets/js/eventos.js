/* P03 V3. Botões, radio e modal no padrão GovBR-DS do projeto. */
(() => {
  'use strict';
  const init = () => {
    const root = document.querySelector('main.p03-page cgdi-calendar');
    if (!root || root.dataset.p03Initialized === 'v3') return;
    const search = root.querySelector('#p03-search');
    const mode = root.querySelector('#p03-mode');
    const items = [...root.querySelectorAll('[data-calendar-event]')];
    const count = root.querySelector('#p03-results');
    const empty = root.querySelector('#p03-empty');
    const dialog = document.getElementById('p03-dialog');
    if (!search || !mode || !count || !empty || !dialog) return;
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const entries = items.map(item => {
      item.querySelectorAll('[data-p03-state]').forEach(label => {
        label.textContent = 'Programado';
      });
      return {item};
    });
    const refresh = () => {
      const term = normalize(search.value.trim());
      let found=0;
      entries.forEach(({item}) => {
        const modeMatch=mode.value === 'todos' || item.dataset.mode === mode.value;
        const textMatch=!term || normalize(item.querySelector('.p03-event-body')?.textContent).includes(term);
        item.hidden = !(modeMatch && textMatch);
        if (!item.hidden) found++;
      });
      count.textContent = `${found} ${found === 1 ? 'evento encontrado' : 'eventos encontrados'}`;
      empty.textContent = found ? '' : 'Nenhum evento corresponde aos filtros. Tente outra busca.';
      empty.hidden=found>0;
    };
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
    const sourceOpen=dialog.querySelector('[data-p03-source-open]');
    const sourceUnavailable=dialog.querySelector('[data-p03-source-unavailable]');
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
      const sourceUrl=article.dataset.source || '';
      source.value=sourceUrl;
      tools.hidden=!sourceUrl;
      sourceUnavailable.hidden=Boolean(sourceUrl);
      if(sourceUrl){
        sourceOpen.href=sourceUrl;
        sourceOpen.dataset.cgdiLinkOficial='true';
        sourceOpen.hidden=false;
      }else{
        sourceOpen.removeAttribute('href');
        delete sourceOpen.dataset.cgdiLinkOficial;
        sourceOpen.hidden=true;
      }
      copyStatus.textContent='';
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    });
    const close=()=>{ if(typeof dialog.close==='function') dialog.close();else dialog.removeAttribute('open'); };
    dialog.querySelector('[data-p03-close]').addEventListener('click',close);
    dialog.querySelector('[data-p03-close-footer]').addEventListener('click',close);
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
    root.dataset.p03Initialized='v3';
    refresh();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
