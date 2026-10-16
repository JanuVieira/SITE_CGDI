(function(){
'use strict';
const d=document;
const dlg=d.querySelector('#cgdi-v1-doc-dialog');
if(!dlg)return;
const close=dlg.querySelector('.v1-doc-close');
const titulo=dlg.querySelector('[data-documento-titulo]');
const formato=dlg.querySelector('[data-documento-formato]');
const tamanho=dlg.querySelector('[data-documento-tamanho]');
const origem=dlg.querySelector('[data-documento-origem]');
const baixar=dlg.querySelector('[data-documento-baixar]');
const abrir=dlg.querySelector('[data-documento-abrir]');
let focusAnterior=null;
function nome(a,u){
 const texto=(a.textContent||'').trim().replace(/\s+/g,' ');
 const candidato=a.closest('figure,li,article,td,div');
 const imagem=candidato&&candidato.querySelector('img');
 const alt=imagem&&imagem.getAttribute('alt');
 const parent=candidato&&candidato.textContent.trim().replace(/\s+/g,' ');
 return (texto&&texto.length>3?texto:(parent&&parent.length>3&&parent.length<190?parent:(alt&&alt.length>3?alt:'')))||decodeURIComponent(u.split('/').pop().split('?')[0]).replace(/[-_]/g,' ');
}
d.addEventListener('click',function(e){
 const a=e.target.closest&&e.target.closest('a[data-v1-doc]');
 if(!a)return;
 if(!dlg.showModal)return; // navegador antigo mantém o acesso direto
 const u=a.href;
 if(!/^https?:\/\//.test(u))return;
 e.preventDefault(); focusAnterior=a;
 const fmt=a.dataset.v1Formato||'Arquivo';
 titulo.textContent=nome(a,u); formato.textContent=fmt;
 tamanho.textContent='Tamanho não informado no acervo local';
 origem.href=u; origem.textContent='Endereço do documento (fonte original)';
 baixar.href=u; baixar.setAttribute('download','');
 abrir.href=u;
 dlg.showModal();
});
close.addEventListener('click',function(){dlg.close()});
dlg.addEventListener('close',function(){if(focusAnterior)focusAnterior.focus()});
})();
