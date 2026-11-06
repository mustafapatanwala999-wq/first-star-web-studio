(()=>{
const html=document.documentElement, $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE=matchMedia('(pointer: fine)').matches;
const mobile=()=>innerWidth<861;
if(RM) html.classList.add('rm'); if(FINE) html.classList.add('fine');
if('scrollRestoration' in history) history.scrollRestoration='manual';
const toTop=()=>window.scrollTo(0,0); toTop(); addEventListener('pagehide',toTop); addEventListener('pageshow',e=>{ if(e.persisted) location.reload(); });
gsap.registerPlugin(ScrollTrigger, SplitText);
const EXPO='expo.out';

/* Concepts: unsolicited, not client work. Names and photos belong to each business. */
const C=[['achievement-first','Achievement First','c'],['yachts1','Yachts1','c'],['hotels','Hotel Quillon','s'],['arabiancourtyard','Arabian Courtyard Hotel & Spa','c'],['retail','Pickle Street Goods','s'],['alshirawi','Al Shirawi Group','c']];

/* ---------------- particles ---------------- */
let stars=null;
try{ stars=window.FirstStars($('#gl'),{count:mobile()?4200:7000,size:mobile()?2.5:2.8,still:RM}); }catch(e){ stars=null; }
if(!stars) html.classList.add('no-gl');
const PRESET={
  hero(a,m){ return m? {x:0,y:.52,w:a*1.9,h:.66} : {x:a*.5,y:.12,w:a*.85,h:1.45}; },
  story(a,m){ return m? {x:0,y:.36,w:a*1.75,h:.66} : {x:a*.47,y:.06,w:a*.8,h:1.25}; },
  galaxy(a,m){ return {x:0,y:-.05,s:m? .5:a*.42,alpha:.62,rotX:1.12}; },
  tally(a,m){ return m? {x:a*.45,y:.62,s:.24,alpha:.8,spinRate:.35,bob:1} : {x:-a*.5,y:.42,s:.36,alpha:.8,spinRate:.35,bob:1}; },
  studio(a,m){ return m? {x:a*.55,y:.72,s:.2,alpha:.8,spinRate:.3,bob:1} : {x:a*.72,y:.6,s:.28,alpha:.85,spinRate:.3,bob:1}; },
  contact(a,m){ return m? {x:0,y:.3,s:.55,alpha:.6,spinRate:.22,bob:1} : {x:0,y:.04,s:.95,alpha:.55,spinRate:.22,bob:1}; }
};
let curShape='star', curPreset='hero';
function layout(shape,preset){ const a=stars.aspect, m=a<1, p=PRESET[preset](a,m), b=stars.box(shape);
  const s=p.s ?? Math.min(p.w/b.w, p.h/b.h); return {offX:p.x, offY:p.y, scale:s, alpha:p.alpha ?? 1, rotX:p.rotX ?? 0, spinRate:p.spinRate ?? 0, bob:p.bob ?? 0}; }
function setStage(shape,preset,instant){ if(!stars) return; curShape=shape; curPreset=preset;
  const L=layout(shape,preset);
  const changed=stars.morph(shape);
  if(changed || stars.S.prog<1){ if(RM||instant){ stars.S.prog=1; } else gsap.fromTo(stars.S,{prog:changed?0:stars.S.prog},{prog:1,duration:.95,ease:'none',overwrite:'auto'}); }
  if(!L.spinRate){ const per=shape==='star'?Math.PI/2:Math.PI*2; L.rz=Math.round(stars.S.rz/per)*per; }
  if(RM||instant){ Object.assign(stars.S,L); } else gsap.to(stars.S,{...L,duration:1.1,ease:EXPO,overwrite:'auto'});
  if(RM) stars.draw(); }
if(stars){ Object.assign(stars.S, layout('star','hero'), {prog:0, alpha:0}); }
addEventListener('pointermove',e=>{ if(!stars) return; stars.S.tmx=e.clientX/innerWidth*2-1; stars.S.tmy=-(e.clientY/innerHeight*2-1); },{passive:true});

/* ---------------- smooth scroll ---------------- */
let lenis=null;
if(!RM && window.Lenis){ lenis=new Lenis({lerp:.12,wheelMultiplier:.9}); lenis.on('scroll',ScrollTrigger.update); gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0); }
const scrollTo=(target)=>{ lenis? lenis.scrollTo(target,{duration:1.6,easing:t=>1-Math.pow(1-t,4)}) : (typeof target==='number'? window.scrollTo(0,target) : $(target)?.scrollIntoView()); };
$$('[data-link]').forEach(a=>a.addEventListener('click',e=>{ const h=a.getAttribute('href'); if(h&&h.startsWith('#')){ e.preventDefault(); scrollTo(h==='#top'?0:h); } }));

/* ---------------- HUD: clock, scene, progress ---------------- */
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const tick=()=>{ const t=fmt.format(new Date()); $('#clock').textContent=t+' GST'; $('#clock2').textContent=t.slice(0,5)+' GST'; }; tick(); setInterval(tick,1000);
const GLYPH='ABCDEFGHIJKLMNOPQRSTUVWXYZ/·0123456789';
function scramble(el,text){ if(RM){ el.textContent=text; return; } let f=0; const len=text.length; clearInterval(el._sc);
  el._sc=setInterval(()=>{ f++; el.textContent=text.split('').map((ch,i)=> i<f/2 || ch===' ' ? ch : GLYPH[Math.random()*GLYPH.length|0]).join(''); if(f/2>=len){ clearInterval(el._sc); el.textContent=text; } },28); }
const scenes=$$('[data-scene]');
scenes.forEach((s,i)=>ScrollTrigger.create({trigger:s,start:'top 55%',end:'bottom 55%',refreshPriority:-1,onToggle:self=>{ if(self.isActive){ $('#sceneN').textContent=String(i+1).padStart(2,'0'); scramble($('#sceneL'),s.dataset.scene); } }}));
const pBar=$('#progBar'), pN=$('#progN');
function onProg(){ const max=document.documentElement.scrollHeight-innerHeight, p=max>0? Math.min(1,scrollY/max):0; pBar.style.transform=`scaleX(${p})`; pN.textContent=String(Math.round(p*100)).padStart(3,'0'); }
lenis? lenis.on('scroll',e=>{ onProg(); if(stars) stars.S.vel+=e.velocity*.6; }) : addEventListener('scroll',onProg,{passive:true});

/* ---------------- cursor + magnetic ---------------- */
if(FINE && !RM){
  const cur=$('.cur'), dot=$('.cur-dot'); let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;
  addEventListener('pointermove',e=>{ x=e.clientX; y=e.clientY; dot.style.transform=`translate(${x}px,${y}px)`; },{passive:true});
  gsap.ticker.add(()=>{ cx+=(x-cx)*.34; cy+=(y-cy)*.34; cur.style.transform=`translate(${cx}px,${cy}px)`; });
  document.addEventListener('pointerover',e=>{ const v=e.target.closest('[data-cursor="view"]'), l=e.target.closest('a,button'); cur.classList.toggle('view',!!v); cur.classList.toggle('link',!v&&!!l); });
  $$('[data-mag]').forEach(b=>{ b.addEventListener('pointermove',e=>{ const r=b.getBoundingClientRect(); gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.22,y:(e.clientY-r.top-r.height/2)*.35,duration:.5,ease:'power3.out'}); });
    b.addEventListener('pointerleave',()=>gsap.to(b,{x:0,y:0,duration:.9,ease:'elastic.out(1,.4)'})); });
}

/* ---------------- hero entrance ---------------- */
const heroLines=$$('.hero .ln'), heroTexts=heroLines.map(l=>l.firstElementChild), bars=$$('.hero .ln .bar');
function heroIn(){
  if(RM){ gsap.set('.sel .box,.sel .h',{scale:1,scaleX:1}); gsap.set('.sel .tag',{opacity:1}); return; }
  const tl=gsap.timeline();
  // gold bars type across each line, then pull away as the words slide up out of them
  tl.fromTo(bars,{scaleX:0,transformOrigin:'left'},{scaleX:1,duration:.45,stagger:.08,ease:'expo.inOut'})
    .fromTo(heroTexts,{yPercent:60,opacity:0},{yPercent:0,opacity:1,duration:.9,stagger:.08,ease:EXPO},'>-0.12')
    .to(bars,{scaleX:0,transformOrigin:'right',duration:.6,stagger:.08,ease:EXPO},'<')
    .from(['.hero .eyebrow','.typer'],{opacity:0,y:12,duration:.8,stagger:.1,ease:EXPO,onComplete:typer},'<')
    .fromTo('.sel .box',{scaleX:0},{scaleX:1,duration:.7,ease:EXPO},'-=.35')
    .fromTo('.sel .h',{scale:0},{scale:1,duration:.5,stagger:.05,ease:'back.out(3)'},'-=.4')
    .fromTo('.sel .tag',{opacity:0,y:6},{opacity:1,y:0,duration:.5,ease:EXPO},'-=.4')
    .from('.hero .fade',{opacity:0,y:24,duration:1.1,stagger:.1,ease:EXPO},'-=.9');
  return tl;
}
gsap.set(heroTexts,{opacity:0});

/* ---------------- typer: "We'll design your ___ homepage for free" cycles through kinds of business ---------------- */
const TW=['restaurant','clinic','hotel','law firm','salon','school','real estate','café','car rental','dental'];
let typing=false;
function typer(){
  if(RM||typing) return; typing=true; const el=$('#tpW'); let w=0, i=TW[0].length, del=true;
  (function step(){ const word=TW[w];
    if(del){ i--; el.textContent=word.slice(0,i); if(i<=0){ del=false; w=(w+1)%TW.length; } setTimeout(step, i<=0?260:45); }
    else { const nw=TW[w]; i++; el.textContent=nw.slice(0,i); if(i>=nw.length){ del=true; setTimeout(step,1700); } else setTimeout(step,70+Math.random()*60); } })();
}

/* ---------------- intro: a star bursts in, charges up, explodes into the particle star ---------------- */
let started=false;
function startSite(fast){
  if(started) return; started=true;
  lenis?.start(); setStage('star','hero');
  if(stars){ gsap.fromTo(stars.S,{prog:0},{prog:1,duration:fast?1.25:1.7,ease:fast?'expo.out':'none',overwrite:'auto'}); gsap.to(stars.S,{alpha:1,duration:fast?.5:1.6,ease:'power2.out'}); }
  heroIn(); if(!fast) ScrollTrigger.refresh(); else setTimeout(()=>(window.requestIdleCallback||setTimeout)(()=>ScrollTrigger.refresh(),{timeout:1200}),1700);
}
function intro(){
  if(RM || !$('#intro')){ $('#intro')?.remove(); startSite(); return; }
  toTop(); lenis?.scrollTo(0,{immediate:true,force:true}); lenis?.stop();
  const rays=$('.i-rays'); for(let k=0;k<14;k++){ const r=document.createElement('i'); r.className='i-ray'; r.style.transform=`rotate(${k/14*360}deg)`; rays.appendChild(r); }
  const tl=gsap.timeline({paused:true}), L1=$('.i-l1'), L2=$('.i-l2');
  const type=(el,text,dur,at)=>{ const o={n:0}; tl.to(o,{n:text.length,duration:dur,ease:'none',onUpdate:()=>{ el.textContent=text.slice(0,Math.round(o.n)); }},at); };
  type(L1,'Welcome.',.55,'+=.15');
  tl.call(()=>{ L1.classList.add('done'); L2.classList.add('on'); });
  type(L2,'Book your free website now',.95,'+=.12');
  tl.to({}, {duration:.55})
    .to('.i-type',{scale:.06,opacity:0,duration:.45,ease:'expo.in'})
    .fromTo('.i-dot',{scale:0},{scale:1.7,duration:.28,ease:'back.out(3)'},'-=.12')
    .to('.i-dot',{scale:1,duration:.2,ease:'power2.out'})
    .to('.i-dot',{scale:.4,duration:.25,ease:'power2.in'},'+=.25')
    .set('.i-dot',{opacity:0})
    .fromTo('.i-star',{scale:0,rotate:-220},{scale:1.15,rotate:0,duration:.55,ease:'back.out(2.6)'},'-=.02')
    .to('.i-word',{opacity:1,letterSpacing:'.32em',duration:.6,ease:EXPO},'-=.25')
    .fromTo('.i-ring',{scale:.3,opacity:.9},{scale:1.25,opacity:0,duration:.7,ease:EXPO,immediateRender:false},'-=.55')
    .to('.i-star',{scale:.92,rotate:-18,duration:.22,ease:'power2.in'},'-=.15')
    .to('.i-star',{x:'random(-3,3)',y:'random(-3,3)',duration:.04,repeat:5,yoyo:true,ease:'none'})
    .addLabel('boom')
    .to('.i-star',{scale:9,rotate:140,duration:.45,ease:'expo.in'},'boom')
    .to('.i-word',{opacity:0,y:20,duration:.25},'boom')
    .fromTo('.i-ray',{opacity:1,scaleY:.2},{opacity:0,scaleY:3.2,duration:.6,ease:EXPO,stagger:.008,immediateRender:false},'boom+=.32')
    .fromTo('.i-flash',{opacity:0,scale:.4},{opacity:1,scale:2.6,duration:.18,ease:'power2.out',immediateRender:false},'boom+=.36')
    .call(()=>startSite(true),null,'boom+=.42')
    .to('.i-bg',{opacity:0,duration:.35,ease:'power1.out'},'boom+=.38')
    .to(['.i-flash','.i-star'],{opacity:0,duration:.6,ease:'power2.out'},'boom+=.5')
        .call(()=>$('#intro')?.remove());
  // wait for the fonts (they re-split the text, a heavy moment) and two clean frames, so the star never stalls mid-move
  Promise.race([document.fonts?.ready||Promise.resolve(), new Promise(r=>setTimeout(r,2000))])
    .then(()=>{ ScrollTrigger.refresh(); requestAnimationFrame(()=>requestAnimationFrame(()=>tl.play())); });
  $('.i-skip').addEventListener('click',()=>{ tl.kill(); stars?.play(); gsap.set('main',{clearProps:'filter,transform'}); $('#intro')?.remove(); startSite(true); });
}

/* ---------------- story: pinned, copy swaps while the stars morph ---------------- */
const sts=$$('.st'), ticks=$$('.rail-ticks span');
let stIdx=-1;
sts.forEach(st=>{ st._split=SplitText.create($('h2',st),{type:'lines',mask:'lines',autoSplit:true,onSplit(self){ st._lines=self.lines; gsap.set(self.lines,{yPercent: st===sts[stIdx]?0:110}); }}); });
function resetSt(){ stIdx=0; ticks.forEach((t,k)=>t.classList.toggle('on',k===0));
  sts.forEach((st,k)=>{ gsap.killTweensOf([st._lines,$('.eyebrow',st),$('p',st)]); st.style.visibility=k? 'hidden':'visible'; if(k===0){ gsap.set(st._lines,{yPercent:0}); gsap.set([$('.eyebrow',st),$('p',st)],{opacity:1,y:0}); } }); }
function showSt(i,dir){
  if(i===stIdx) return; const prev=sts[stIdx], next=sts[i]; stIdx=i;
  ticks.forEach((t,k)=>t.classList.toggle('on',k===i));
  if(prev){ gsap.to(prev._lines,{yPercent:dir>0?-110:110,duration:.6,stagger:.04,ease:'expo.in',overwrite:true}); gsap.to([$('.eyebrow',prev),$('p',prev)],{opacity:0,y:dir>0?-14:14,duration:.4,overwrite:true,onComplete:()=>{ if(prev!==sts[stIdx]) prev.style.visibility='hidden'; }}); }
  next.style.visibility='visible';
  gsap.fromTo(next._lines,{yPercent:dir>0?110:-110},{yPercent:0,duration:1.2,stagger:.07,ease:EXPO,delay:prev?.35:0,overwrite:true});
  gsap.fromTo([$('.eyebrow',next),$('p',next)],{opacity:0,y:dir>0?18:-18},{opacity:1,y:0,duration:1,stagger:.08,ease:EXPO,delay:prev?.5:.1,overwrite:true});
  setStage(next.dataset.shape,'story');
}
if(!RM){
  ScrollTrigger.create({trigger:'.story',start:'top top',end:()=>'+='+innerHeight*sts.length*.9,pin:'.story-pin',pinSpacing:true,anticipatePin:1,
    onUpdate(self){ const i=Math.min(sts.length-1,Math.floor(self.progress*sts.length*.999)); showSt(i,self.direction); },
    onEnter(){ showSt(0,1); setStage(sts[0].dataset.shape,'story'); }, onEnterBack(){ showSt(sts.length-1,-1); }, onLeaveBack(){ resetSt(); setStage('star','hero'); }});
  resetSt();
} else { sts.forEach(st=>{ st.style.visibility='visible'; }); }

/* ---------------- other sections steer the stars ---------------- */
[['#work','galaxy','galaxy'],['.tally','star','tally'],['#studio','star','studio'],['#contact','star','contact']].forEach(([sel,shape,preset])=>{
  ScrollTrigger.create({trigger:sel,start:'top 60%',end:'bottom 40%',onToggle:s=>{ if(s.isActive) setStage(shape,preset); }});
});

/* ---------------- headline chips + ribbon marquees (speed follows scroll) ---------------- */
function marquee(track,speed){ track.innerHTML+=track.innerHTML; let x=0; const half=()=>track.scrollWidth/2;
  if(RM) return; gsap.ticker.add((t,dt)=>{ const v=lenis? Math.abs(lenis.velocity):0; x-=speed*(1+Math.min(v,60)*.08)*dt/16; const h=half(); if(-x>=h) x+=h; if(x>0) x-=h; track.style.transform=`translate3d(${x}px,0,0)`; }); }
marquee($('#chips'),.9);
const star='<svg viewBox="-13 -13 26 26"><path d="M0 -13 C1.6 -1.6 1.6 -1.6 13 0 C1.6 1.6 1.6 1.6 0 13 C-1.6 1.6 -1.6 1.6 -13 0 C-1.6 -1.6 -1.6 -1.6 0 -13Z"/></svg>';
$('#ribbon').innerHTML=['Your photos','<em>your words</em>','Phone first','<em>motion with a reason</em>','Designed before you ask','<em>you decide after</em>'].map(w=>`<span>${w}</span>${star}`).join('');
marquee($('#ribbon'),1.2);

/* ---------------- concept cards: stacked, the one underneath sinks ---------------- */
const cards=$$('.card');
if(!RM) cards.forEach((c,i)=>{
  gsap.fromTo($('.frame img',c),{scale:1.18},{scale:1,ease:'none',scrollTrigger:{trigger:c,start:'top bottom',end:'top top',scrub:true}});
  gsap.from($$('.meta > *',c),{y:40,opacity:0,stagger:.08,duration:1,ease:EXPO,scrollTrigger:{trigger:c,start:'top 40%',toggleActions:'play none none reverse'}});
  const nx=cards[i+1]; if(!nx) return;
  gsap.to($('.card-in',c),{scale:.9,y:-30,ease:'none',scrollTrigger:{trigger:nx,start:'top bottom',end:'top top',scrub:true}});
  gsap.to($('.shade',c),{opacity:.7,ease:'none',scrollTrigger:{trigger:nx,start:'top bottom',end:'top top',scrub:true}});
});

/* ---------------- tally ---------------- */
const bigN=$('#bigN');
if(!RM){ bigN.textContent='0';
  ScrollTrigger.create({trigger:'.tally',start:'top 65%',once:true,onEnter(){
    const o={v:0}; gsap.to(o,{v:+bigN.dataset.to,duration:2.4,ease:EXPO,onUpdate:()=>bigN.textContent=Math.round(o.v)});
    $$('.row .b i').forEach((b,k)=>gsap.to(b,{scaleX:parseFloat(getComputedStyle(b).getPropertyValue('--w')),duration:1.6,delay:.2+k*.1,ease:EXPO}));
  }});
} else $$('.row .b i').forEach(b=>b.style.transform='');

/* ---------------- text reveals ---------------- */
if(!RM){
  SplitText.create('.contact h2',{type:'lines',mask:'lines',autoSplit:true,onSplit(self){ return gsap.from(self.lines,{yPercent:110,duration:1.3,stagger:.1,ease:EXPO,scrollTrigger:{trigger:'.contact',start:'top 60%',toggleActions:'play none none reverse'}}); }});
  SplitText.create('.founder blockquote',{type:'words',autoSplit:true,onSplit(self){ return gsap.fromTo(self.words,{opacity:.5},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:'.founder blockquote',start:'top 80%',end:'bottom 45%',scrub:true}}); }});
  $$('.pr').forEach(p=>gsap.from(p.children,{y:30,opacity:0,stagger:.08,duration:1.1,ease:EXPO,scrollTrigger:{trigger:p,start:'top 85%'}}));
  gsap.from('.work-note > *',{y:30,opacity:0,stagger:.1,duration:1.1,ease:EXPO,scrollTrigger:{trigger:'.work-note',start:'top 88%'}});
  gsap.from('.tally h2,.tally .rows,.tally .note',{y:30,opacity:0,stagger:.1,duration:1.1,ease:EXPO,scrollTrigger:{trigger:'.tally',start:'top 65%'}});
  gsap.from('.contact p,.contact .ctas',{y:30,opacity:0,stagger:.1,duration:1.1,ease:EXPO,scrollTrigger:{trigger:'.contact',start:'top 55%'}});
}

/* ---------------- viewer ---------------- */
const dlg=$('#viewer'), vs=$('#vScroll'); let raf=0, took=false;
function openViewer(i){ const [k,name,type]=C[i], gif=type==='s', v=dlg.querySelector('.viewer');
  v.classList.toggle('gif',gif);
  if(gif){ $('#vImg').src=`img/samples/${k}.gif`; $('#vImg').alt=`${name}, sample homepage by First Star Web Studio, playing`;
    $('#vUrl').textContent='sample · '+name.toLowerCase(); $('#vNote').textContent=`${name} is a sample brand we invented to show our craft. Not a real business or client.`; }
  else { $('#vImg').src=`img/full/${k}.webp`; $('#vImg').alt=`Full page of the unsolicited homepage concept for ${name}`;
    $('#vUrl').textContent='concept · '+name.toLowerCase(); $('#vNote').textContent=`Unsolicited concept for ${name}. Not a client project; not affiliated with ${name}.`; }
  vs.scrollTop=0; took=false; lenis?.stop(); dlg.showModal();
  if(!gif && !RM) setTimeout(()=>{ cancelAnimationFrame(raf); let last=performance.now(); const step=t=>{ if(took||!dlg.open) return; vs.scrollTop+=(t-last)*.13; last=t; if(vs.scrollTop+vs.clientHeight<vs.scrollHeight-2) raf=requestAnimationFrame(step); }; raf=requestAnimationFrame(step); },900); }
['wheel','touchstart','pointerdown','keydown'].forEach(ev=>vs.addEventListener(ev,()=>took=true,{passive:true}));
$('#cards').addEventListener('click',e=>{ const t=e.target.closest('[data-i]'); if(t) openViewer(+t.dataset.i); });
$('#vClose').onclick=$('#vX').onclick=()=>dlg.close(); dlg.addEventListener('click',e=>{ if(e.target===dlg) dlg.close(); }); dlg.addEventListener('close',()=>{ lenis?.start(); $('#vImg').src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; });

/* ---------------- copy email ---------------- */
$('#copy').addEventListener('click',async()=>{ try{ await navigator.clipboard.writeText('firststarwebstudio@gmail.com'); const c=$('#copied'); c.classList.add('on'); setTimeout(()=>c.classList.remove('on'),1800); }catch(e){ location.href='mailto:firststarwebstudio@gmail.com'; } });

/* ---------------- resize + go ---------------- */
let rt, lw=innerWidth; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(stars){ stars.resize(); Object.assign(stars.S, layout(curShape,curPreset)); if(RM) stars.draw(); } if(innerWidth!==lw){ lw=innerWidth; ScrollTrigger.refresh(); } },150); });
document.addEventListener('visibilitychange',()=>{ if(!stars||RM) return; document.hidden? stars.pause() : stars.play(); });
intro(); (document.fonts?.ready||Promise.resolve()).then(()=>ScrollTrigger.refresh());
})();
