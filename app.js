const slides=JSON.parse(document.getElementById('slides-data').textContent);
const assetData=JSON.parse(document.getElementById('asset-data').textContent);
const root=document.getElementById('slideshow'),stage=document.getElementById('evidence-stage'),graph=document.getElementById('workflow-diagram');
let slideIndex=0,beatIndex=0;
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function hydrate(){stage.querySelectorAll('[src],[href]').forEach(el=>{for(const key of ['src','href']){const v=el.getAttribute(key);if(assetData[v])el.setAttribute(key,assetData[v]);}});}
function drawFlow(flow){
 if(flow.retry){drawRetryFlow(flow);return;}
 const mobile=matchMedia('(max-width:900px)').matches,boxW=mobile?102:122,gap=mobile?24:28;
 const cols=flow.layers.length,w=mobile?340:cols*boxW+(cols-1)*gap+12,h=mobile?cols*82+16:Math.max(106,...flow.layers.map(l=>l.length*35+8));
 const positions={};
 flow.layers.forEach((layer,c)=>layer.forEach((id,r)=>{const n=layer.length;positions[id]=mobile?{x:n===1?108:n===4?6+r*83:8+r*110,y:8+c*82,w:n===1?124:n===4?78:102,h:56}:{x:6+c*(boxW+gap),y:n===1?(h-52)/2:(h-n*35+3)/2+r*35,w:boxW,h:n===1?52:32};}));
 if(flow.loop){const base=positions[flow.loop.from];if(!mobile)base.y=4;positions[flow.loop.node.id]=mobile?{x:8,y:base.y+30,w:94,h:40}:{x:base.x,y:72,w:122,h:32};}
 let svg='<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#789183"/></marker><marker id="b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ab532c"/></marker></defs>';
 for(let i=0;i<flow.layers.length-1;i++){for(const from of flow.layers[i])for(const to of flow.layers[i+1]){const a=positions[from],b=positions[to];const fresh=flow.new.includes(to);let d;if(mobile){const ax=a.x+a.w/2,ay=a.y+a.h,bx=b.x+b.w/2,by=b.y,m=(ay+by)/2;d=`M${ax} ${ay}V${m}H${bx}V${by}`;}else{const ax=a.x+a.w,ay=a.y+a.h/2,bx=b.x,by=b.y+b.h/2,m=(ax+bx)/2;d=`M${ax} ${ay}H${m}V${by}H${bx}`;}svg+=`<path data-edge="${from}-${to}" class="flow-edge ${fresh?'new':''}" d="${d}" marker-end="url(#${fresh?'b':'a'})"/>`;}}
 if(flow.loop){const a=positions[flow.loop.from],b=positions[flow.loop.node.id];let p,q;if(mobile){p=`M${a.x} ${a.y+20}H${b.x+b.w/2}V${b.y}`;q=`M${b.x+b.w} ${b.y+b.h/2}H${a.x+6}V${a.y+a.h}`;}else{p=`M${a.x+a.w/3} ${a.y+a.h}V${b.y}`;q=`M${b.x+b.w} ${b.y+b.h/2}H${b.x+b.w+12}V${a.y+a.h/2}H${a.x+a.w}`;}svg+=`<path class="flow-edge new" d="${p}" marker-end="url(#b)"/><path class="flow-edge new loop" d="${q}" marker-end="url(#b)"/>`;}
 for(const n of [...flow.nodes,...(flow.loop?[flow.loop.node]:[])]){const p=positions[n.id];if(!p)continue;const lines=(mobile?n.label.replace('Text + math','Text +|math'):n.label).split('|'),ty=p.y+p.h/2-(lines.length-1)*10+7;svg+=`<g data-node="${n.id}" class="flow-node ${flow.new.includes(n.id)?'new':''} ${n.id==='html'?'output':''}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="6"/><text text-anchor="middle" x="${p.x+p.w/2}" y="${ty}">${lines.map((s,i)=>`<tspan x="${p.x+p.w/2}" dy="${i?21:0}">${xml(s)}</tspan>`).join('')}</text></g>`;}
 graph.setAttribute('viewBox',`0 0 ${w} ${h}`);graph.setAttribute('width',w);graph.setAttribute('height',h);graph.innerHTML=svg;document.dispatchEvent(new CustomEvent('demo:flow'));
}
function show(s,b=0,hash=true){
 document.dispatchEvent(new CustomEvent("demo:before-render"));
 slideIndex=Math.max(0,Math.min(slides.length-1,s));beatIndex=Math.max(0,Math.min(slides[slideIndex].beats.length-1,b));const slide=slides[slideIndex],beat=slide.beats[beatIndex];
 root.dataset.slide=slideIndex;root.dataset.beat=beatIndex;
 const tone=beat.tone||'explain';root.dataset.tone=tone;document.body.dataset.tone=tone;document.getElementById('scene-role').textContent={problem:'PROBLEM',solution:'IMPROVEMENT',explain:'EXPLANATION'}[tone];
 document.getElementById('slide-title').textContent=beat.title??slide.question;document.getElementById('slide-answer').textContent=beat.answer??slide.answer;
 root.dataset.presentation=beat.presentation||'';document.querySelector('.heading').hidden=false;document.getElementById('slide-title').hidden=beat.title==='';document.getElementById('slide-answer').hidden=!(beat.answer??slide.answer);document.querySelector('.flow').hidden=beat.showFlow===false;document.querySelector('.flow').classList.toggle('retry-flow',!!(beat.flow||slide.flow).retry);
 document.getElementById('slide-counter').textContent=`Slide ${slideIndex+1} / ${slides.length}`;document.getElementById('beat-counter').textContent=`Step ${beatIndex+1} / ${slide.beats.length}`;
 document.getElementById('slide-select').value=String(slideIndex);
 stage.innerHTML=beat.publicHTML;
 stage.classList.remove('scene-enter');void stage.offsetWidth;stage.classList.add('scene-enter');hydrate();drawFlow(beat.flow||slide.flow);document.fonts.ready.then(circleMatrixCells);
 document.getElementById('prev').disabled=slideIndex===0&&beatIndex===0;document.getElementById('next').disabled=slideIndex===slides.length-1&&beatIndex===slide.beats.length-1;
 document.getElementById('next').textContent=slideIndex===slides.length-1&&beatIndex===slide.beats.length-1?'End':'Next →';
 document.querySelectorAll('[data-jump]').forEach(el=>{el.classList.toggle('active',Number(el.dataset.jump)<slideIndex);el.setAttribute('aria-current',String(Number(el.dataset.jump)===slideIndex));});
 if(hash)history.replaceState(null,'',`#slide-${slideIndex+1}/step-${beatIndex+1}`);
 window.scrollTo({top:0,left:0,behavior:'instant'});root.scrollTo({top:0,left:0,behavior:'instant'});
 document.dispatchEvent(new CustomEvent('demo:render'));
}
function next(){if(beatIndex<slides[slideIndex].beats.length-1)show(slideIndex,beatIndex+1);else if(slideIndex<slides.length-1)show(slideIndex+1,0);}
function prev(){if(beatIndex>0)show(slideIndex,beatIndex-1);else if(slideIndex>0)show(slideIndex-1,slides[slideIndex-1].beats.length-1);}
document.getElementById('next').addEventListener('click',next);document.getElementById('prev').addEventListener('click',prev);
document.getElementById('slide-select').addEventListener('change',e=>show(Number(e.target.value),0));document.querySelectorAll('[data-jump]').forEach(el=>el.addEventListener('click',()=>show(Number(el.dataset.jump),0)));
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,button,summary,a,[contenteditable],[data-scroll-region]'))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();next();}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();prev();}else if(e.key==='Home'){e.preventDefault();show(0,0);}else if(e.key==='End'){e.preventDefault();show(slides.length-1,slides.at(-1).beats.length-1);}});
stage.addEventListener('click',e=>{const t=e.target.closest('[data-issue]');if(!t)return;stage.querySelectorAll('[data-issue]').forEach(el=>el.classList.toggle('issue-active',el.dataset.issue===t.dataset.issue));});
document.getElementById('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{document.getElementById('announcer').textContent='Fullscreen is unavailable in this browser. The slideshow remains usable.';}});
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;document.getElementById('fullscreen').setAttribute('aria-pressed',String(on));document.getElementById('fullscreen').textContent=on?'Exit fullscreen':'Fullscreen';drawFlow(slides[slideIndex].beats[beatIndex].flow||slides[slideIndex].flow);});
function fromHash(){const m=location.hash.match(/^#slide-(\d+)\/step-(\d+)$/);if(m)show(Number(m[1])-1,Number(m[2])-1,false);else show(0,0,false);}
window.addEventListener('hashchange',fromHash);window.addEventListener('resize',()=>drawFlow(slides[slideIndex].beats[beatIndex].flow||slides[slideIndex].flow));fromHash();

function drawRetryFlow(flow){
 const nodes=[['page','Page',10,25],['qwen','Qwen',175,25],['check','Fits?',340,25],['json','JSON',505,25],['parse','Parser',670,25],['html','HTML',835,25],['dpi','Resize',340,145]];
 const edges=[['page-qwen','M140 53H175'],['qwen-check','M305 53H340'],['check-json','M470 53H505'],['json-parse','M635 53H670'],['parse-html','M800 53H835'],['check-dpi','M405 81V145'],['dpi-qwen','M340 173H240V81']];
 graph.setAttribute('viewBox','0 0 975 210');graph.setAttribute('width','975');graph.setAttribute('height','210');
 graph.innerHTML='<defs><marker id="retry-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ab532c"/></marker></defs>'+edges.map(([id,d])=>`<path data-edge="${id}" d="${d}" class="flow-edge new" marker-end="url(#retry-arrow)"/>`).join('')+nodes.map(([id,label,x,y])=>`<g data-node="${id}" class="flow-node ${['check','dpi'].includes(id)?'new':''} ${id==='html'?'output':''}"><rect x="${x}" y="${y}" width="130" height="56" rx="7"/><text x="${x+65}" y="${y+35}" text-anchor="middle">${label}</text></g>`).join('')+'<text class="flow-condition" x="488" y="18" text-anchor="middle">Yes</text><text class="flow-condition" x="422" y="119">Context exceeded</text>';
 document.dispatchEvent(new CustomEvent('demo:flow'));
}

function circleMatrixCells(){
 stage.querySelectorAll('[data-matrix-cells]').forEach(w=>{
  w.querySelector('.cell-rings')?.remove();
  const columns=w.querySelectorAll('.katex-html .mtable > .col-align-c'),base=w.getBoundingClientRect();
  let shapes='';for(const [row,col] of JSON.parse(w.dataset.matrixCells)){
   const list=columns[col-1]?.querySelector('.vlist');const slot=list?.children[row-1];if(!slot)continue;
   const cell=slot.querySelector(':scope > .mord')||slot;const b=cell.getBoundingClientRect();
   shapes+=`<ellipse cx="${b.left-base.left+b.width/2}" cy="${b.top-base.top+b.height/2}" rx="${Math.max(15,b.width/2+7)}" ry="${Math.max(14,b.height/2+6)}"/>`;
  }
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','cell-rings');svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);svg.setAttribute('aria-hidden','true');svg.innerHTML=shapes;w.append(svg);
 });
}
window.addEventListener('resize',circleMatrixCells);

stage.addEventListener("scroll",e=>{if(e.target.classList?.contains("math-block"))circleMatrixCells();},true);


/* Apply the presentation's already-frozen appearance; no editing or storage. */
(() => {
 const applyFlow=()=>{
  const p=slides[slideIndex].beats[beatIndex].appearance;
  for(const [id,styles] of Object.entries(p.flowStyles||{})){
   const node=graph.querySelector('[data-node="'+id+'"]');if(!node)continue;
   const text=node.querySelector('text'),rect=node.querySelector('rect');
   for(const [key,value] of Object.entries(styles)){
    if(key==='backgroundColor')rect.style.fill=value;
    else if(key==='color')text.style.fill=value;
    else text.style[key]=value;
   }
  }
 };
 const apply=()=>{
  const p=slides[slideIndex].beats[beatIndex].appearance;
  for(const [id,key] of [['slide-title','title'],['slide-answer','subtitle'],['scene-role','role']]){
   const el=document.getElementById(id),saved=p[key];el.innerHTML=saved.html;
   saved.style===null?el.removeAttribute('style'):el.setAttribute('style',saved.style);
   el.hidden=saved.hidden;
  }
  for(const el of [document.body,root]){
   el.style.removeProperty('--paper');if(p.background)el.style.setProperty('--paper',p.background);
  }
  applyFlow();
 };
 document.addEventListener('demo:render',apply);document.addEventListener('demo:flow',applyFlow);apply();
 window.DemoDeck=Object.freeze({slides,getPosition:()=>({slide:slideIndex,step:beatIndex}),go:(s,b=0)=>show(s,b)});
})();

/* Browse the unedited generated slides, served as static documents. */
(() => {
 let index=0;const count=7;
 function frame(el){el.removeAttribute('srcdoc');el.src='generated/slide-'+(index+1)+'.html';el.title='Generated slide '+(index+1)+' of '+count;}
 function large(region){const dialog=region.querySelector('dialog');dialog.querySelector('[data-large-counter]').textContent='Generated slide '+(index+1)+' / '+count;frame(dialog.querySelector('iframe'));dialog.querySelector('[data-large-prev]').disabled=index===0;dialog.querySelector('[data-large-next]').disabled=index===count-1;}
 function show(i){
  const region=document.querySelector('[data-v10-final-comparison]');if(!region)return;
  index=Math.max(0,Math.min(count-1,i));frame(region.querySelector('[data-production-frame]'));
  region.querySelector('[data-production-counter]').textContent='Slide '+(index+1)+' / '+count;
  region.querySelector('[data-production-prev]').disabled=index===0;region.querySelector('[data-production-next]').disabled=index===count-1;
  if(region.querySelector('dialog')?.open)large(region);
 }
 function prepare(){
  const r=document.querySelector('[data-v10-final-comparison]');if(!r)return;
  const d=r.querySelector('dialog');
  r.querySelector('[data-production-prev]').addEventListener('click',()=>show(index-1));r.querySelector('[data-production-next]').addEventListener('click',()=>show(index+1));
  r.querySelector('[data-production-expand]').addEventListener('click',()=>{large(r);d.showModal();});d.querySelector('[data-production-close]').addEventListener('click',()=>d.close());
  d.querySelector('[data-large-prev]').addEventListener('click',()=>show(index-1));d.querySelector('[data-large-next]').addEventListener('click',()=>show(index+1));show(0);
 }
 document.addEventListener('demo:render',prepare);prepare();
 window.DemoComparison=Object.freeze({show,getIndex:()=>index,getCount:()=>count});
})();

// GIF bytes stay embedded and unchanged. Pausing swaps to their first frame.
(() => {
 function prepareAnimations(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('#evidence-stage [data-animated-src]').forEach(img=>{
   const control=img.closest('.v9-animation')?.querySelector('.v9-animation-toggle')||img.parentElement.querySelector('.v9-animation-toggle');
   if(!control)return;
   function setPlaying(value){img.src=assetData[value?img.dataset.animatedSrc:img.dataset.stillSrc]||(value?img.dataset.animatedSrc:img.dataset.stillSrc);img.dataset.playing=String(value);control.textContent=value?'Pause animation':'Play animation';control.setAttribute('aria-pressed',String(value));}
   setPlaying(!reduced);control.addEventListener('click',()=>setPlaying(img.dataset.playing!=='true'));
  });
 }
 document.addEventListener('demo:render',prepareAnimations);prepareAnimations();
})();
