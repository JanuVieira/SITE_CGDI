// Stepper lateral compartilhado: marca o capítulo visível a partir dos links de âncora.
(() => {
  'use strict';

  const links = [...document.querySelectorAll('.story-stepper a[href^="#"]')];
  const steps = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  if (!steps.length || !('IntersectionObserver' in window)) return;

  function setCurrent(id) {
    links.forEach(link => {
      const current = link.hash === `#${id}`;
      link.classList.toggle('is-current', current);
      if (current) {
        link.setAttribute('aria-current', 'step');
        const navigation = link.closest('.story-stepper');
        if (navigation && navigation.scrollWidth > navigation.clientWidth) {
          navigation.scrollTo({
            left: link.offsetLeft - (navigation.clientWidth - link.offsetWidth) / 2,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
          });
        }
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      const targetId = link.hash.slice(1);
      if (steps.some(step => step.id === targetId)) setCurrent(targetId);
    });
  });
  const initialId = window.location.hash.slice(1);
  if (steps.some(step => step.id === initialId)) setCurrent(initialId);

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setCurrent(visible.target.id);
  }, { rootMargin: '-18% 0px -58% 0px', threshold: [0, .15, .35, .6] });

  steps.forEach(step => observer.observe(step));
})();
