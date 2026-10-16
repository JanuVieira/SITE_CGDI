(function(){'use strict';
const root=document.querySelector('.home-v2-pdf');if(!root)return;
// Normaliza os elementos da V2 para a API reutilizável de cgdi-card.
// O conteúdo permanece no HTML da página; os atributos apenas definem seus slots.
function mountCardSlots(){
  root.querySelectorAll('cgdi-card').forEach((card)=>{
    const icon=card.querySelector(':scope > svg.v2-icon:first-child');
    if(icon)icon.setAttribute('data-card-icon','');

    if(card.getAttribute('variant')==='feature'){
      card.querySelector(':scope > .v2-feature-copy')?.setAttribute('data-card-body','');
      card.querySelector(':scope > img.v2-feature-image')?.setAttribute('data-card-media','');
    }
    if(card.getAttribute('variant')==='media'){
      card.querySelector(':scope > img')?.setAttribute('data-card-media','');
      card.querySelector(':scope > div')?.setAttribute('data-card-body','');
    }
  });
}
mountCardSlots();

// Notícias ilustrativas: navegação manual sem autoplay, com controle por teclado.
const carousel=document.getElementById('v2-carrossel-noticias');
if(carousel){
  const items=[...carousel.querySelectorAll('.v2-feature-card')];
  const dots=[...carousel.querySelectorAll('.v2-dot')];
  const status=carousel.querySelector('#v2-noticia-status');
  let active=0;
  function show(n){
    active=(n+items.length)%items.length;
    items.forEach((el,i)=>{el.hidden=i!==active;});
    dots.forEach((el,i)=>{el.setAttribute('aria-current',i===active?'true':'false');});
    if(status)status.textContent=`Notícia ${active+1} de ${items.length}`;
  }
  carousel.querySelector('#v2-noticia-prev')?.addEventListener('click',()=>show(active-1));
  carousel.querySelector('#v2-noticia-next')?.addEventListener('click',()=>show(active+1));
  dots.forEach((el,i)=>el.addEventListener('click',()=>show(i)));
  show(0);
}
// O componente de avaliação é compartilhado com o projeto: só muda sua
// localização na Home 2, mantendo o mesmo modal, armazenamento e comportamento.
const slot=document.getElementById('v2-survey-slot');
const main=document.querySelector('main.home-v2-pdf');
if(slot && main){
  function place(){
    const banner=main.querySelector('.cgdi-research');
    if(!banner || banner.parentNode===slot)return banner?.parentNode===slot;
    slot.appendChild(banner);
    const t=banner.querySelector('.cgdi-research-copy h2');
    const desc=banner.querySelector('.cgdi-research-copy p');
    if(t)t.textContent='Esta página ajudou você?';
    if(desc)desc.textContent='Conte como foi sua experiência nesta página. Sua avaliação fica salva somente neste navegador.';
    return true;
  }
  if(!place()){
    const observer=new MutationObserver(()=>{if(place())observer.disconnect()});
    observer.observe(main,{childList:true});
  }
}

})();
