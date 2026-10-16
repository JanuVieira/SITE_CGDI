// MCO: JS exclusivo para interações dos elementos originais.
(()=>{
 const trigger=document.getElementById('shell-menu-toggle');
 const panel=document.getElementById('shell-nav-panel');
 function setOpen(open){if(!trigger||!panel)return; panel.classList.toggle('is-open',open);trigger.setAttribute('aria-expanded',String(open));trigger.setAttribute('aria-label',open?'Fechar menu principal de navegação':'Abrir menu principal de navegação');}
 trigger?.addEventListener('click',()=>setOpen(trigger.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&trigger?.getAttribute('aria-expanded')==='true'){setOpen(false);trigger.focus();}});
 document.addEventListener('click',e=>{if(panel?.classList.contains('is-open')&&!panel.contains(e.target)&&!trigger.contains(e.target))setOpen(false);});
 document.querySelectorAll('#portal-footer .list-navigation>li').forEach((li,i)=>{const nested=li.querySelector(':scope > ul');if(!nested)return;const a=li.querySelector(':scope > a');if(!a)return;const b=document.createElement('button');b.type='button';b.className='shell-footer-expand';b.setAttribute('aria-label','Exibir links de '+a.textContent.trim());b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','shell-footer-links-'+i);b.textContent='+';nested.id='shell-footer-links-'+i;a.after(b);b.addEventListener('click',()=>{const open=li.classList.toggle('is-open');b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',(open?'Ocultar':'Exibir')+' links de '+a.textContent.trim());b.textContent=open?'−':'+';});});
})();
