'use strict';
const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selectedProject=4,angle='wide';const allSelection={};const visibleProjects=new Set(PROJECTS.map(p=>p.id));
let checked={};try{checked=JSON.parse(localStorage.getItem('zosia-shopping-v1')||'{}')}catch{}
const fmt=p=>`${p.date} · ${p.title}`;
const matching=p=>p.images.filter(x=>angle==='all'||x.group===angle||(angle==='bed'&&['p4-5','p4-7'].includes(x.id))).sort((a,b)=>Number(a.original.endsWith('.jpg')&&a.id.startsWith('p4-'))-Number(b.original.endsWith('.jpg')&&b.id.startsWith('p4-')));
function imageMarkup(im,lazy=false){
 if(!im.planView)return `<img src="${im.src}" alt="${esc(im.label)}" ${lazy?'loading="lazy"':''} width="${im.width}" height="${im.height}">`;
 const [x,y,w,h,rotation]=im.planView;
 return `<span class="plan-frame"><svg viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(im.label)} — okno po lewej, drzwi u góry po prawej"><image href="${im.src}" width="${im.width}" height="${im.height}" ${rotation?`transform="rotate(${rotation} ${x+w/2} ${y+h/2})"`:''}/></svg></span>`;
}
const imgCard=(im,cls='')=>`<figure class="image-card ${cls}"><button data-image="${im.id}" aria-label="Powiększ: ${esc(im.label)}">${imageMarkup(im,true)}</button><figcaption>${esc(im.label)}<small>${esc(im.original)}</small></figcaption></figure>`;
function renderProject(){
 $('#project-tabs').innerHTML=PROJECTS.map(p=>`<button role="tab" aria-selected="${p.id===selectedProject}" class="tab ${p.id===selectedProject?'active':''}" data-project="${p.id}"><small>PROJEKT 0${p.id+1} / ${p.date}</small>${esc(p.title)}</button>`).join('');
 const p=PROJECTS[selectedProject];$('#project-detail').innerHTML=`<div role="tabpanel"><div class="project-head"><div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></div><button class="outline" data-shopping="${p.id}">Lista zakupów (${p.shopping.length}) ↗</button></div><div class="gallery">${[...p.images].sort((a,b)=>Number(a.group==='plan')-Number(b.group==='plan')||Number(a.original.endsWith('.jpg')&&a.id.startsWith('p4-'))-Number(b.original.endsWith('.jpg')&&b.id.startsWith('p4-'))).map(im=>imgCard(im)).join('')}</div>${p.id===0?'<a class="pdf" href="assets/p0-3.pdf" target="_blank" rel="noopener">Konfiguracja szafy PAX · oryginalny PDF ↗</a>':''}</div>`;
}
function resolveImage(pid,id){const ims=matching(PROJECTS[pid]);return ims.find(x=>x.id===id)||ims[0]||null}
function imageOptions(ims,im){return ims.map(x=>`<option value="${x.id}" ${x.id===im?.id?'selected':''}>${esc(x.label)}</option>`).join('')}
function panelImage(im){return im?`<button class="compare-img" data-image="${im.id}" aria-label="Powiększ: ${esc(im.label)}">${imageMarkup(im)}</button><div class="compare-caption">${esc(im.label)}</div>`:'<div class="empty">W tym projekcie nie ma ujęcia w tej grupie. Wybierz inną perspektywę lub „Wszystkie ujęcia”.</div>'}
function renderCompare(){
 $('#plan-alignment-note').hidden=angle!=='plan';
 const projects=PROJECTS.filter(p=>visibleProjects.has(p.id));
 if(!projects.length){$('#compare-body').innerHTML='<div class="empty">Zaznacz co najmniej jedną wersję do porównania.</div>';return}
 $('#compare-body').innerHTML=`<div class="all-grid" data-count="${projects.length}">${projects.map(p=>{
  const ims=matching(p),im=resolveImage(p.id,allSelection[p.id]);allSelection[p.id]=im?.id;
  return `<article data-compare-project="${p.id}"><h3>0${p.id+1} · ${esc(p.title)}</h3><small>${p.date}</small><div class="panel-controls"><label>Ujęcie<select aria-label="Ujęcie — ${p.date}" data-all-project="${p.id}" ${ims.length?'':'disabled'}>${ims.length?imageOptions(ims,im):'<option>Brak ujęcia</option>'}</select></label></div>${panelImage(im)}</article>`
 }).join('')}</div>`;
}
$('#compare-projects').innerHTML=PROJECTS.map(p=>`<label class="version-toggle"><input type="checkbox" data-visible-project="${p.id}" checked><span><b>${p.date}</b><small>${esc(p.title)}</small></span></label>`).join('');
$('#compare-projects').addEventListener('change',e=>{const s=e.target;if(s.dataset.visibleProject===undefined)return;const id=Number(s.dataset.visibleProject);if(s.checked)visibleProjects.add(id);else visibleProjects.delete(id);renderCompare()});
function renderShopping(){const chosen=$('#shopping-project').value,type=$('#shopping-type').value,term=$('#shopping-search').value.toLocaleLowerCase('pl');let total=0;$('#shopping-list').innerHTML=PROJECTS.filter(p=>chosen==='all'||p.id===Number(chosen)).map(p=>{const rows=p.shopping.map((item,i)=>({...item,key:`${p.id}-${i}`})).filter(x=>(type==='all'||x.type===type)&&(x.name+' '+x.note+' '+x.category+' '+x.type).toLocaleLowerCase('pl').includes(term));total+=rows.length;return rows.length?`<div class="shopping-group"><h3>0${p.id+1} · ${esc(p.title)}<small>${p.date} / ${rows.length} propozycji</small></h3>${rows.map(item=>`<div class="shopping-row"><input type="checkbox" aria-label="Odhacz ${esc(item.name)}" data-check="${item.key}" ${checked[item.key]?'checked':''}><a class="shopping-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-labelledby="shopping-name-${item.key}"><span class="tag">${esc(item.type)}</span><h4 id="shopping-name-${item.key}">${esc(item.name)}</h4>${item.note?`<p>${esc(item.note)}</p>`:''}</a></div>`).join('')}</div>`:''}).join('');if(!total)$('#shopping-list').innerHTML='<div class="empty">Brak pasujących propozycji.</div>'}
const shoppingTypes=[...new Set(PROJECTS.flatMap(p=>p.shopping.map(item=>item.type)))].sort((a,b)=>a.localeCompare(b,'pl'));
$('#shopping-type').innerHTML+=shoppingTypes.map(type=>`<option value="${esc(type)}">${esc(type)}</option>`).join('');
$('#shopping-project').innerHTML+=PROJECTS.map(p=>`<option value="${p.id}">${esc(fmt(p))}</option>`).join('');
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.project!==undefined){selectedProject=Number(b.dataset.project);renderProject()}if(b.dataset.shopping!==undefined){$('#shopping-project').value=b.dataset.shopping;renderShopping();$('#zakupy').scrollIntoView({behavior:'smooth'})}if(b.dataset.image){const im=PROJECTS.flatMap(p=>p.images).find(x=>x.id===b.dataset.image);const d=$('#lightbox');$('#lightbox-media').innerHTML=imageMarkup(im);d.querySelector('p').textContent=im.label;d.querySelector('a').href=im.src;d.showModal()}});
$('#compare-body').addEventListener('change',e=>{const s=e.target;if(s.dataset.allProject!==undefined){allSelection[Number(s.dataset.allProject)]=s.value;renderCompare()}});
$('#angle').addEventListener('change',e=>{angle=e.target.value;renderCompare()});$('#shopping-project').addEventListener('change',renderShopping);$('#shopping-type').addEventListener('change',renderShopping);$('#shopping-search').addEventListener('input',renderShopping);$('#shopping-list').addEventListener('change',e=>{if(e.target.dataset.check){checked[e.target.dataset.check]=e.target.checked;try{localStorage.setItem('zosia-shopping-v1',JSON.stringify(checked))}catch{}}});$('#print').onclick=()=>window.print();$('#close-lightbox').onclick=()=>$('#lightbox').close();$('#lightbox').addEventListener('click',e=>{if(e.target===$('#lightbox'))$('#lightbox').close()});
$('#project-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();selectedProject=e.key==='Home'?0:e.key==='End'?4:(selectedProject+(e.key==='ArrowRight'?1:4))%5;renderProject();$(`[data-project="${selectedProject}"]`).focus()});
renderProject();renderCompare();renderShopping();
