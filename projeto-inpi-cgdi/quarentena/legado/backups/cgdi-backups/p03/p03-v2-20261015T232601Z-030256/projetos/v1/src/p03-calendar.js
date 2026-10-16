/* P03. Filtros locais da agenda. Nenhuma chamada externa e nenhum dado simulado. */
(() => {
  'use strict';
  const init = () => {
    const root = document.querySelector('main.p03-page cgdi-calendar');
    if (!root || root.dataset.p03Initialized === 'true') return;
    const search = root.querySelector('#p03-search');
    const period = root.querySelector('#p03-period');
    const mode = root.querySelector('#p03-mode');
    const records = [...root.querySelectorAll('[data-calendar-event]')];
    const count = root.querySelector('#p03-results');
    const empty = root.querySelector('#p03-empty');
    if (!search || !period || !mode || !count || !empty) return;
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'
    }).formatToParts(new Date());
    const dateValue = Object.fromEntries(dateParts.map(item => [item.type, item.value]));
    const today = [dateValue.year, dateValue.month, dateValue.day].join('-');
    const refresh = () => {
      const term = normalize(search.value.trim());
      let visible = 0;
      records.forEach(event => {
        const day = event.dataset.date;
        const periodMatch = period.value === 'todos' ||
          (period.value === 'proximos' ? day >= today : day < today);
        const modeMatch = mode.value === 'todos' || event.dataset.mode === mode.value;
        const textMatch = !term || normalize(event.textContent).includes(term);
        event.hidden = !(periodMatch && modeMatch && textMatch);
        if (!event.hidden) visible++;
      });
      count.textContent = `${visible} ${visible === 1 ? 'evento encontrado' : 'eventos encontrados'}`;
      empty.hidden = visible > 0;
    };
    search.addEventListener('input', refresh);
    period.addEventListener('change', refresh);
    mode.addEventListener('change', refresh);
    root.dataset.p03Initialized = 'true';
    refresh();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
