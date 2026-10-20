(() => {
  'use strict';

  const imageLinks = [...document.querySelectorAll('.evidence-figure > a[href]')]
    .filter(link => link.querySelector('img'));

  if (imageLinks.length) {
    const dialog = document.createElement('dialog');
    dialog.className = 'image-viewer';
    dialog.setAttribute('aria-labelledby', 'image-viewer-title');
    dialog.innerHTML = `
      <div class="image-viewer__panel">
        <header class="image-viewer__header">
          <p class="image-viewer__title" id="image-viewer-title">Imagem ampliada</p>
          <button class="image-viewer__close" type="button" aria-label="Fechar imagem e voltar à página" data-image-viewer-close>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            <span>Fechar</span>
          </button>
        </header>
        <div class="image-viewer__body">
          <img src="" alt="" data-image-viewer-image>
        </div>
        <p class="image-viewer__caption" data-image-viewer-caption></p>
      </div>`;
    document.body.append(dialog);

    const viewerImage = dialog.querySelector('[data-image-viewer-image]');
    const viewerCaption = dialog.querySelector('[data-image-viewer-caption]');
    const closeButton = dialog.querySelector('[data-image-viewer-close]');
    let lastTrigger = null;

    const closeViewer = () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };

    imageLinks.forEach(link => {
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        event.preventDefault();
        const thumbnail = link.querySelector('img');
        const caption = link.closest('figure')?.querySelector('figcaption');
        lastTrigger = link;
        viewerImage.src = link.href;
        viewerImage.alt = thumbnail?.alt || '';
        viewerCaption.textContent = caption?.textContent.trim() || thumbnail?.alt || '';
        viewerCaption.hidden = !viewerCaption.textContent;
        document.body.classList.add('has-image-viewer');
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        closeButton.focus();
      });
    });

    closeButton.addEventListener('click', closeViewer);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeViewer();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('has-image-viewer');
      viewerImage.removeAttribute('src');
      lastTrigger?.focus();
    });
  }
})();
