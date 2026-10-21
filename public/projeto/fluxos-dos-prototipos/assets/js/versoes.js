(() => {
  'use strict';

  const selector = document.querySelector('[data-variant-selector]');
  const mobileSelector = document.querySelector('[data-variant-selector-mobile]');
  const preview = document.querySelector('[data-component-preview]');
  const currentSolution = document.querySelector('[data-current-solution]');
  const alert = document.querySelector('[data-component-alert]');
  if (!selector || !mobileSelector || !preview || !currentSolution || !alert) return;

  const messages = {
    success: 'Download iniciado. Verifique a pasta de downloads do seu dispositivo.',
    error: 'Não foi possível iniciar o download. Tente novamente ou abra o PDF em uma nova aba.'
  };

  function selectOption(attribute, value) {
    selector.querySelectorAll(`[${attribute}]`).forEach(option => {
      const selected = option.getAttribute(attribute) === value;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
  }

  function setViewport(viewport) {
    preview.dataset.viewport = viewport;
    currentSolution.dataset.viewport = viewport;
    const currentImage = currentSolution.querySelector('[data-current-solution-image]');
    if (currentImage) {
      currentImage.src = viewport === 'mobile'
        ? currentImage.dataset.mobileSrc
        : currentImage.dataset.desktopSrc;
    }
    selectOption('data-viewport-option', viewport);
    const mobileSelect = mobileSelector.querySelector('[data-viewport-select]');
    if (mobileSelect) mobileSelect.value = viewport;
  }

  function setVersion(version) {
    const current = version === 'current';
    selector.dataset.version = version;
    preview.hidden = current;
    currentSolution.hidden = !current;
    document.querySelectorAll('[data-state-controls]').forEach(control => {
      control.hidden = current;
    });
    selectOption('data-version-option', version);
    const mobileSelect = mobileSelector.querySelector('[data-version-select]');
    if (mobileSelect) mobileSelect.value = version;
  }

  function setState(state) {
    selectOption('data-state-option', state);
    const mobileSelect = mobileSelector.querySelector('[data-state-select]');
    if (mobileSelect) mobileSelect.value = state;
    alert.hidden = state === 'default';
    alert.textContent = messages[state] || '';
    if (state === 'success') alert.dataset.type = 'success';
    else if (state === 'error') alert.dataset.type = 'danger';
    else delete alert.dataset.type;
    alert.setAttribute('role', state === 'error' ? 'alert' : 'status');
  }

  selector.addEventListener('click', event => {
    const versionOption = event.target.closest('[data-version-option]');
    const viewportOption = event.target.closest('[data-viewport-option]');
    const stateOption = event.target.closest('[data-state-option]');
    if (versionOption) setVersion(versionOption.dataset.versionOption);
    if (viewportOption) {
      setViewport(viewportOption.dataset.viewportOption);
    }
    if (stateOption) {
      setState(stateOption.dataset.stateOption);
    }
  });

  mobileSelector.addEventListener('change', event => {
    if (event.target.matches('[data-version-select]')) setVersion(event.target.value);
    if (event.target.matches('[data-viewport-select]')) setViewport(event.target.value);
    if (event.target.matches('[data-state-select]')) setState(event.target.value);
  });
})();
