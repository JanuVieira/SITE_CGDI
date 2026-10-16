/* Shared progressive enhancement for all four variants; no fake transactions. */
(()=>{'use strict';
 const toggle=document.getElementById('shell-menu-toggle'),panel=document.getElementById('shell-nav-panel');
 if(toggle&&panel){toggle.addEventListener('click',()=>{let open=panel.classList.toggle('shell-is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu principal de navegação':'Abrir menu principal de navegação')});document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&panel.classList.contains('shell-is-open')){panel.classList.remove('shell-is-open');toggle.setAttribute('aria-expanded','false');toggle.focus()}})}
 const sourceCards=document.querySelectorAll('[data-search]');const input=document.querySelector('[data-card-search]');if(input&&sourceCards.length){input.addEventListener('input',()=>{const q=input.value.toLocaleLowerCase('pt-BR').trim();sourceCards.forEach(el=>{el.hidden=!el.dataset.search.includes(q)})})}
 const selector=document.querySelector('.states-info select');
 const mapStates=document.querySelectorAll('.states-map a[href^="noticias-uf.html"]');
 if(selector && mapStates.length){selector.addEventListener('change',()=>{const uf=selector.value;const action=document.querySelector('.states-info .state-action');if(action)action.setAttribute('aria-label','Consultar informações de '+selector.selectedOptions[0]?.textContent.trim());});}
})();