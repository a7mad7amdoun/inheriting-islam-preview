document.documentElement.classList.add('js');
const catalog=JSON.parse(document.getElementById('artwork-data').textContent);
const key='inheriting-islam-artwork-shortlist-v1';
let saved=new Set();
try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(data))saved=new Set(data.filter(id=>catalog.some(a=>a.id===id)));}catch{}
let collection=['hybrid','cut-paper'].includes(new URL(location.href).searchParams.get('collection'))?new URL(location.href).searchParams.get('collection'):'All';
let scene='dark';
let category='All',activeId=null,lastTrigger=null,toastTimer;
const cards=[...document.querySelectorAll('.art-card')],dialog=document.getElementById('detail');
const search=document.getElementById('search'),status=document.getElementById('results-status');
function announce(message){const t=document.getElementById('toast');clearTimeout(toastTimer);t.textContent=message;t.hidden=false;toastTimer=setTimeout(()=>{t.hidden=true;},3200);}
function update(){const q=search.value.trim().toLocaleLowerCase();let visible=0;for(const card of cards){const item=catalog.find(a=>a.id===card.dataset.id);const match=(collection==='All'||item.collection===collection)&&(category==='All'||category==='Saved'&&saved.has(item.id)||category===item.category)&&(!q||[item.title,item.category,item.use,item.description,item.id,item.lighting,item.collection].join(' ').toLocaleLowerCase().includes(q));card.hidden=!match;if(match)visible++;const b=card.querySelector('.save');b.setAttribute('aria-pressed',String(saved.has(item.id)));b.setAttribute('aria-label',(saved.has(item.id)?'Remove from shortlist: ':'Save to shortlist: ')+item.title);}
status.textContent=`${visible} of ${catalog.length} artworks${category==='Saved'?' in your shortlist':''}`;document.getElementById('empty').hidden=visible>0;document.getElementById('saved-count').textContent=saved.size;document.getElementById('export-shortlist').disabled=!saved.size;if(activeId)updateDialogSave();}
function save(id){saved.has(id)?saved.delete(id):saved.add(id);let persists=true;try{localStorage.setItem(key,JSON.stringify([...saved]));}catch{persists=false;}update();announce((saved.has(id)?'Added to your shortlist.':'Removed from your shortlist.')+(persists?'':' Available for this visit only.'));}
function updateDialogSave(){const b=document.getElementById('dialog-save');b.textContent=saved.has(activeId)?'Remove from shortlist':'Save to shortlist';b.setAttribute('aria-pressed',String(saved.has(activeId)));}
function show(id,trigger){const item=catalog.find(a=>a.id===id);if(!item)return;activeId=id;if(trigger)lastTrigger=trigger;document.getElementById('detail-title').textContent=item.title;document.getElementById('detail-number').textContent=`Artwork ${item.id} · ${item.category} · ${scene} artwork`;document.getElementById('detail-description').textContent=item.description;document.getElementById('detail-use').textContent=`Suggested use · ${item.use}`;const img=document.getElementById('detail-image');img.src=item.pairs[scene].original;img.alt=item.alt;const link=document.getElementById('detail-download');link.href=item.pairs[scene].original;link.download=item.slug+'-'+scene+'.png';document.getElementById('detail-size').textContent=`${item.width} × ${item.height} px · original PNG`;updateDialogSave();if(!dialog.open){dialog.showModal();document.body.style.overflow='hidden';}const u=new URL(location.href);u.hash='art-'+id;history.replaceState(null,'',u);}
function close(){dialog.close();}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();}));
document.querySelectorAll('[data-collection]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.collection===collection));b.addEventListener('click',()=>{collection=b.dataset.collection;document.querySelectorAll('[data-collection]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const u=new URL(location.href);if(collection==='All')u.searchParams.delete('collection');else u.searchParams.set('collection',collection);history.replaceState(null,'',u);update();});});
search.addEventListener('input',update);
cards.forEach(card=>{card.querySelector('.art-preview').addEventListener('click',e=>show(card.dataset.id,e.currentTarget));card.querySelector('.save').addEventListener('click',()=>save(card.dataset.id));});
document.getElementById('dialog-save').addEventListener('click',()=>save(activeId));document.getElementById('close-detail').addEventListener('click',close);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';activeId=null;const u=new URL(location.href);if(u.hash.startsWith('#art-')){u.hash='collection';history.replaceState(null,'',u);}if(lastTrigger&&!lastTrigger.closest('[hidden]'))lastTrigger.focus();else search.focus();});
function navigate(delta){const ids=cards.filter(c=>!c.hidden).map(c=>c.dataset.id);const current=ids.indexOf(activeId);if(!ids.length)return;show(ids[(current+delta+ids.length)%ids.length]);}
document.getElementById('previous').addEventListener('click',()=>navigate(-1));document.getElementById('next').addEventListener('click',()=>navigate(1));
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}});
document.getElementById('export-shortlist').addEventListener('click',()=>{const chosen=catalog.filter(a=>saved.has(a.id));const content='INHERITING ISLAM — ARTWORK SHORTLIST\n\n'+chosen.map(a=>`${a.id}. ${a.title}\nCollection: ${a.collection==='hybrid'?'02 · Paper, stone & light':'01 · Zellige cut paper'}\nSuggested use: ${a.use}\n${a.description}\n${new URL('#art-'+a.id,location.href).href}\n`).join('\n');const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='inheriting-islam-artwork-shortlist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Your shortlist has been downloaded.');});
document.getElementById('copy-art-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(new URL('#art-'+activeId,location.href).href);announce('Artwork link copied.');}catch{announce('Copy the artwork link from your browser’s address bar.');}});
update();const match=location.hash.match(/^#art-(\d{2})$/);if(match)show(match[1]);

function changeScene(next){
 scene=next;
 const hero=catalog.find(a=>a.id==='25');document.querySelector('.intro-art img').src=hero.pairs[scene].preview;
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===scene)));
 for(const card of cards){const item=catalog.find(a=>a.id===card.dataset.id);card.querySelector('.art-preview img').src=item.pairs[scene].preview;const link=card.querySelector('.card-footer a');link.href=item.pairs[scene].original;link.download=item.slug+'-'+scene+'.png';card.querySelector('.card-meta span:last-child').textContent='No. '+item.id+' · '+scene+' artwork';}
 if(activeId)show(activeId);
}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>changeScene(b.dataset.scene)));
changeScene(scene);
