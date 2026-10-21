/* Comportamento compartilhado do componente de pré-download. */
(() => {
  'use strict';

  function setExpanded(card, expanded) {
    const details = card.querySelector('.pd-details');
    const toggle = card.querySelector('[data-pd-toggle]');
    const cardBody = card.querySelector('.pd-card');
    if (!details || !toggle) return;
    // A capa mantém a altura do estado compacto: abrir os detalhes não a redimensiona.
    const cover = card.querySelector('.pd-cover-mask');
    if (cover) cover.style.height = expanded ? `${cover.getBoundingClientRect().height}px` : '';
    details.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    card.classList.toggle('is-expanded', expanded);
    cardBody?.classList.toggle('is-expanded', expanded);
    const label = card.querySelector('[data-pd-toggle-label]');
    if (label) label.textContent = expanded ? 'Contrair informações' : 'Expandir informações';
  }

  function connect(card) {
    if (!(card instanceof Element) || !card.matches('cgdi-pre-download')) return;
    if (card.dataset.pdBound === 'true') return;
    const toggle = card.querySelector('[data-pd-toggle]');
    const details = card.querySelector('.pd-details');
    if (!toggle || !details) return;
    if (!details.id) {
      const used = document.querySelectorAll('cgdi-pre-download .pd-details[id]').length;
      let index = used + 1;
      while (document.getElementById(`cgdi-pd-details-${index}`)) index++;
      details.id = `cgdi-pd-details-${index}`;
    }
    toggle.setAttribute('aria-controls', details.id);
    card.dataset.pdBound = 'true';
    toggle.addEventListener('click', () => {
      setExpanded(card, toggle.getAttribute('aria-expanded') !== 'true');
    });
    card.querySelectorAll('.pd-action[href^="#"]').forEach(action => {
      if (action.getAttribute('href') !== `#${details.id}`) return;
      action.removeAttribute('href');
      action.setAttribute('role', 'link');
      action.setAttribute('aria-disabled', 'true');
      action.tabIndex = -1;
      action.dataset.cgdiUnavailable = 'true';
      const label = action.querySelector('span');
      if (label) {
        label.textContent = action.classList.contains('pd-download')
          ? 'Download indisponível'
          : 'Visualização indisponível';
      }
    });
    setExpanded(card, toggle.getAttribute('aria-expanded') === 'true');
  }

  document.querySelectorAll('cgdi-pre-download').forEach(connect);
  document.addEventListener('cgdi:pre-download-ready', event => connect(event.target));
})();
