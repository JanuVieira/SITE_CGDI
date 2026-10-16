/* CGDI | Avaliação de página | protótipo, sem envio ou armazenamento */
(() => {
  'use strict';
  let serial = 0;
  const element = (tag, classes = '', text) => {
    const node = document.createElement(tag);
    if (classes) node.className = classes;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  class CGDIPageFeedback extends HTMLElement {
    connectedCallback() {
      if (this.dataset.cgdiFeedbackReady === 'true') return;
      this.dataset.cgdiFeedbackReady = 'true';
      const uid = `cgdi-feedback-${++serial}`;
      const card = element('section', 'cgdi-feedback br-card');
      card.setAttribute('aria-labelledby', `${uid}-call`);
      const graphic = element('span', 'cgdi-feedback-icon');
      graphic.setAttribute('aria-hidden', 'true');
      graphic.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 10.5h8M8 14h5"/></svg>';
      const copy = element('div', 'cgdi-feedback-copy');
      const title = element('h2', 'cgdi-feedback-call-title', 'Avalie esta página');
      title.id = `${uid}-call`;
      copy.append(title, element('p', 'cgdi-feedback-call-description', 'Ajude a melhorar nosso conteúdo.'));
      const intro = element('div', 'cgdi-feedback-call-content');
      intro.append(graphic, copy);
      const trigger = element('button', 'br-button primary cgdi-feedback-open', 'Avaliar página');
      trigger.type = 'button';
      card.append(intro, trigger);

      const dialog = element('dialog', 'br-modal cgdi-feedback-dialog');
      dialog.setAttribute('aria-labelledby', `${uid}-heading`);
      
      const panel = element('div', 'cgdi-feedback-dialog-panel');
      const heading = element('h2', 'cgdi-feedback-dialog-title', 'Avalie esta página');
      heading.id = `${uid}-heading`;
      const context = element('p', 'cgdi-feedback-dialog-description', '');
      context.id = `${uid}-context`;
      const header = element('header', 'cgdi-feedback-dialog-header');
      header.append(heading);
      const form = element('form', 'cgdi-feedback-form');
      form.noValidate = true;
      const body = element('div', 'cgdi-feedback-dialog-body');
      const stepper = element('ol', 'cgdi-feedback-stepper');
      stepper.setAttribute('aria-label', 'Etapas da avaliação');
      const stepItems = [1, 2].map((number, index) => {
        const item = element('li', 'cgdi-feedback-stepper-item');
        item.setAttribute('aria-label', `Etapa ${number} de 2`);
        const marker = element('span', 'cgdi-feedback-stepper-marker', String(number));
        marker.setAttribute('aria-hidden', 'true');
        item.append(marker);
        stepper.append(item);
        return item;
      });
      const stepIndicator = element('p', 'cgdi-feedback-step-indicator sr-only');
      stepIndicator.setAttribute('aria-live', 'polite');
      const ratingStep = element('div', 'cgdi-feedback-step cgdi-feedback-rating-step');
      const fieldset = element('fieldset', 'cgdi-feedback-fieldset');
      const legend = element('legend', 'cgdi-feedback-question', 'Que nota você dá a esta página?');
      const scale = element('div', 'cgdi-feedback-choices');
      const labels = ['Muito ruim', 'Ruim', 'Regular', 'Boa', 'Excelente'];
      const radios = [];
      labels.forEach((name, index) => {
        const label = element('label', 'cgdi-feedback-tile');
        const input = element('input', 'br-radio cgdi-feedback-radio');
        input.type = 'radio';
        input.name = `${uid}-rating`;
        input.value = String(index + 1);
        input.setAttribute('aria-label', `${index + 1} de 5, ${name}`);
        const numeral = element('span', 'cgdi-feedback-number', String(index + 1));
        numeral.setAttribute('aria-hidden', 'true');
        const meaning = element('span', 'cgdi-feedback-rating-label', name);
        meaning.setAttribute('aria-hidden', 'true');
        label.append(numeral, meaning, input);
        scale.append(label);
        radios.push(input);
      });
      const endpoints = element('div', 'cgdi-feedback-scale-labels');
      endpoints.append(element('span', '', '1 · Muito ruim'), element('span', '', '5 · Excelente'));
      fieldset.append(legend, scale, endpoints);
      ratingStep.append(fieldset);

      const commentStep = element('div', 'cgdi-feedback-step cgdi-feedback-comment-step');
      commentStep.hidden = true;
      const selected = element('p', 'cgdi-feedback-selected');
      const commentHeading = element('h3', 'cgdi-feedback-question', 'Quer comentar?');
      
      const textareaWrap = element('div', 'br-textarea cgdi-feedback-textarea');
      const textareaLabel = element('label', '', 'Comentário (opcional)');
      textareaLabel.htmlFor = `${uid}-comment`;
      const textarea = element('textarea');
      textarea.id = `${uid}-comment`;
      textarea.rows = 4;
      textarea.maxLength = 1000;
      textarea.placeholder = 'Escreva seu comentário';
      textareaWrap.append(textareaLabel, textarea);
      const notice = element('p', 'cgdi-feedback-notice', 'Demonstração. Não envie dados pessoais.');
      commentStep.append(selected, textareaWrap, notice);
      body.append(stepper, stepIndicator, ratingStep, commentStep);
      const footer = element('footer', 'cgdi-feedback-actions');
      const cancel = element('button', 'br-button secondary', 'Cancelar');
      cancel.type = 'button';
      const proceed = element('button', 'br-button primary', 'Prosseguir');
      proceed.type = 'button';
      footer.append(cancel, proceed);
      form.append(body, footer);

      const success = element('div', 'cgdi-feedback-success');
      success.hidden = true;
      const successHeading = element('h3', 'cgdi-feedback-question', 'Obrigado pela avaliação!');
      successHeading.tabIndex = -1;
      const successCopy = element('p', 'cgdi-feedback-muted', 'Demonstração. Resposta não enviada.');
      const dismiss = element('button', 'br-button primary', 'Fechar');
      dismiss.type = 'button';
      const successIcon = element('span', 'cgdi-feedback-success-icon');
      successIcon.setAttribute('aria-hidden', 'true');
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2.6');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      const check = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      check.setAttribute('d', 'M5 12.5l4.5 4.5L19 7.5');
      icon.append(check);
      successIcon.append(icon);
      const successContent = element('div', 'cgdi-feedback-success-content');
      successContent.append(successIcon, successHeading, successCopy);
      success.append(successContent, dismiss);
      panel.append(header, form, success);
      dialog.append(panel);
      this.replaceChildren(card, dialog);

      let step = 1;
      const updateSelection = () => {
        for (const radio of radios) radio.parentElement.classList.toggle('is-selected', radio.checked);
        proceed.disabled = step === 1 && !radios.some(r => r.checked);
      };
      const showStep = n => {
        step = n;
        stepIndicator.textContent = `Etapa ${n} de 2`;
        stepItems.forEach((item, index) => {
          const active = index + 1 === n;
          const complete = index + 1 < n;
          item.classList.toggle('is-active', active);
          item.classList.toggle('is-complete', complete);
          item.toggleAttribute('aria-current', active);
        });
        ratingStep.hidden = n !== 1;
        commentStep.hidden = n !== 2;
        proceed.textContent = 'Prosseguir';
        updateSelection();
        body.scrollTop = 0;
        if (n === 1) (radios.find(r => r.checked) || radios[0]).focus({preventScroll:true});
        else textarea.focus({preventScroll:true});
      };
      const reset = () => {
        form.reset();
        form.hidden = false;
        success.hidden = true;
        header.hidden = false;
        step = 1;
        ratingStep.hidden = false;
        commentStep.hidden = true;
        body.hidden = false;
        footer.hidden = false;
        updateSelection();
      };
      const close = () => { if (dialog.open) dialog.close(); };
      trigger.addEventListener('click', () => {
        reset();
        if (typeof dialog.showModal !== 'function') return;
        dialog.showModal();
        showStep(1);
      });
      cancel.addEventListener('click', close);
      dismiss.addEventListener('click', close);
      dialog.addEventListener('close', () => { reset(); if (trigger.isConnected) trigger.focus({preventScroll:true}); });
      radios.forEach(radio => radio.addEventListener('change', updateSelection));
      proceed.addEventListener('click', () => {
        if (step === 1) {
          const checked = radios.find(r => r.checked);
          if (!checked) return;
          selected.textContent = `Nota ${checked.value} de 5`;
          showStep(2);
          return;
        }
        form.hidden = true;
        header.hidden = true;
        success.hidden = false;
        successHeading.focus({preventScroll:true});
      });
      form.addEventListener('submit', event => event.preventDefault());
    }
  }

  // Cada nome exige um construtor próprio na Custom Elements Registry.
  if (!customElements.get('cgdi-page-feedback')) customElements.define('cgdi-page-feedback', CGDIPageFeedback);
  if (!customElements.get('cgdi-card-pesquisa')) {
    class CGDILegacyFeedback extends CGDIPageFeedback {}
    customElements.define('cgdi-card-pesquisa', CGDILegacyFeedback);
  }
})();
