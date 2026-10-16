/* Apenas dados e rotas locais. Não aciona URL externa. */
(async()=>{
'use strict';
const params=new URLSearchParams(location.search);
const tidy=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(location.pathname.endsWith('/recurso.html')){
 const target=document.querySelector('#detalhes-recurso');
 try{const list=await (await fetch('../assets/catalogo-referencias.json')).json();const item=list.find(x=>x.id===params.get('id'));
 if(item){target.replaceChildren();const h=document.createElement('h2');h.textContent=item.rotulos?.[0]||item.tipo;const p=document.createElement('p');p.textContent='Tipo de recurso: '+item.tipo+'. Esta referência foi preservada do conteúdo original, mas não há reprodução funcional neste protótipo. Nenhum site externo será aberto.';target.append(h,p);}else{target.textContent='A referência solicitada não foi identificada no catálogo do protótipo.';}}
 catch(_){target.textContent='O catálogo local não pôde ser carregado. Abra o protótipo usando um servidor HTTP local.';}
}
if(location.pathname.endsWith('/busca.html')){
 const input=document.querySelector('#busca-conteudo'),box=document.querySelector('#resultados-busca');const q=params.get('SearchableText')||'';if(input)input.value=q;
 if(q.trim())try{
 const data=await (await fetch('../assets/paginas-busca.json')).json();const words=tidy(q).split(/\s+/).filter(Boolean);const items=data.filter(x=>words.every(w=>tidy(x.titulo+' '+x.descricao+' '+x.conteudo).includes(w)));
 box.innerHTML='<h2>Resultados para “'+esc(q)+'”</h2>'+(items.length?('<p>'+items.length+' página(s) encontrada(s).</p><ul class="busca-resultados">'+items.map(x=>'<li><a href="'+x.id+'.html">'+esc(x.titulo)+'</a><p>'+esc(x.descricao)+'</p></li>').join('')+'</ul>'):'<p>Nenhuma das 38 páginas internas contém todos os termos pesquisados.</p>');
 }catch(_){box.textContent='A busca local precisa ser executada por servidor HTTP.';}
}
if(location.pathname.endsWith('/noticias-uf.html')){
 const uf=params.get('uf')||'';const states={AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PR:'Paraná',PB:'Paraíba',PA:'Pará',PE:'Pernambuco',PI:'Piauí',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RJ:'Rio de Janeiro',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SE:'Sergipe',SP:'São Paulo',TO:'Tocantins'};
 document.querySelector('#nome-estado').textContent=states[uf]?states[uf]+' ('+uf+')':'Unidade federativa não identificada';
}
if(location.pathname.endsWith('/calendario.html')){
 const m=params.get('modo')||'all';const labels={future:'Próximos eventos',past:'Eventos anteriores',month:'Visão mensal',week:'Visão semanal',day:'Visão diária'};
 document.querySelector('#rotulo-visualizacao').textContent=(labels[m]||'Calendário')+': a visualização dinâmica original não está reproduzida neste protótipo; consulte a relação de eventos documentados.';
}
})();
