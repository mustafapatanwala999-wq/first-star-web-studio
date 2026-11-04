/* Star buddy: an elegant ring follows the pointer and a little gold star with a face chases it.
   It smiles, blinks, gasps when you move fast, laughs over buttons and links, bursts sparkles on click,
   and runs little laps around the ring when you stop. Fine pointers only; off for reduced motion. */
(()=>{
  if(!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d=document, html=d.documentElement; html.classList.add('fine');
  const css=d.createElement('style');
  css.textContent=`
.fine,.fine a,.fine button,.fine input,.fine select,.fine label{cursor:none}
.fine input[type=text],.fine input[type=email],.fine input[type=tel],.fine textarea{cursor:text}
.bd-ring{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1px solid rgba(245,184,0,.6);pointer-events:none;z-index:9998;transition:width .45s cubic-bezier(.16,1,.3,1),height .45s cubic-bezier(.16,1,.3,1),margin .45s cubic-bezier(.16,1,.3,1),border-color .3s,background .3s}
.bd-ring.link{width:58px;height:58px;margin:-29px 0 0 -29px;border-color:#f5b800;background:rgba(245,184,0,.06)}
.bd-ring.down{width:26px;height:26px;margin:-13px 0 0 -13px}
.bd-star{position:fixed;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;pointer-events:none;z-index:9999;filter:drop-shadow(0 0 8px rgba(245,184,0,.65))}
.bd-star svg{width:100%;height:100%;overflow:visible;display:block}
.bd-star .ch{opacity:0;transition:opacity .2s}
.bd-star.laugh .ch{opacity:.55}
.bd-spark{position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px;border-radius:50%;background:#ffd35a;box-shadow:0 0 10px #f5b800;pointer-events:none;z-index:9997}
.cur-dot{display:none!important}`;
  d.head.appendChild(css);

  let ring=d.querySelector('.cur');           // the studio homepage already has a ring with VIEW states
  const own=!ring; if(own){ ring=d.createElement('div'); ring.className='bd-ring'; d.body.appendChild(ring); }
  const star=d.createElement('div'); star.className='bd-star';
  star.innerHTML=`<svg viewBox="-12 -12 24 24"><path fill="#f5b800" stroke="#ffd35a" stroke-width=".6" stroke-linejoin="round" d="M0-12Q2.2-6.2 5-5Q6.2-2.2 12 0Q6.2 2.2 5 5Q2.2 6.2 0 12Q-2.2 6.2-5 5Q-6.2 2.2-12 0Q-6.2-2.2-5-5Q-2.2-6.2 0-12Z"/>
<g class="face"><ellipse class="ch" cx="-3.6" cy="1.6" rx="1.4" ry=".8" fill="#ff6b6b"/><ellipse class="ch" cx="3.6" cy="1.6" rx="1.4" ry=".8" fill="#ff6b6b"/>
<path class="el" stroke="#07081a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
<path class="er" stroke="#07081a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
<path class="m" stroke="#07081a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g></svg>`;
  d.body.appendChild(star);
  const el=star.querySelector('.el'), er=star.querySelector('.er'), m=star.querySelector('.m'), face=star.querySelector('.face');

  // expressions: eyes and mouth paths (the face is drawn in the star's -12..12 box)
  const F={
    smile:{l:'M-2.4-1.9v.7',r:'M2.4-1.9v.7',m:'M-1.6 1.2Q0 2.8 1.6 1.2'},
    blink:{l:'M-3.1-1.5h1.4',r:'M1.7-1.5h1.4',m:'M-1.6 1.2Q0 2.8 1.6 1.2'},
    laugh:{l:'M-3.2-1.2Q-2.4-2.6-1.6-1.2',r:'M1.6-1.2Q2.4-2.6 3.2-1.2',m:'M-2.2 .8Q0 4.6 2.2 .8Z'},
    wow:{l:'M-2.4-2.1v1.1',r:'M2.4-2.1v1.1',m:'M-.8 1.6a.8 1 0 1 0 1.6 0a.8 1 0 1 0-1.6 0'},
    wink:{l:'M-3.2-1.2Q-2.4-2.6-1.6-1.2',r:'M2.4-1.9v.7',m:'M-1.8 1Q0 3.2 1.8 1'}
  };
  let mood='', hold=0;
  function set(k){ if(k===mood) return; mood=k; const f=F[k]; el.setAttribute('d',f.l); er.setAttribute('d',f.r); m.setAttribute('d',f.m);
    m.setAttribute('fill',k==='laugh'?'#07081a':'none'); star.classList.toggle('laugh',k==='laugh'||k==='wink'); }
  set('smile');

  let x=innerWidth/2, y=innerHeight/2, rx=x, ry=y, sx=x, sy=y, vx=0, vy=0, last=performance.now(), idle=0, over=null, down=false, seen=false;
  star.style.opacity=0; if(own) ring.style.opacity=0;
  addEventListener('pointermove',e=>{ x=e.clientX; y=e.clientY; idle=0; if(!seen){ seen=true; rx=sx=x; ry=sy=y; star.style.opacity=''; if(own) ring.style.opacity=''; } },{passive:true});
  d.addEventListener('pointerover',e=>{ over=e.target.closest('a,button,[role=button],.opt,.dot,[data-cursor]'); if(own) ring.classList.toggle('link',!!over); });
  d.documentElement.addEventListener('pointerleave',()=>{ star.style.opacity=0; if(own) ring.style.opacity=0; seen=false; });
  addEventListener('pointerdown',()=>{ down=true; if(own) ring.classList.add('down'); burst(sx,sy,10); hold=Date.now()+700; set('laugh'); });
  addEventListener('pointerup',()=>{ down=false; if(own) ring.classList.remove('down'); });

  function burst(cx,cy,n){ for(let k=0;k<n;k++){ const s=d.createElement('i'); s.className='bd-spark'; d.body.appendChild(s);
    const a=Math.random()*6.283, r=24+Math.random()*34;
    s.animate([{transform:`translate(${cx}px,${cy}px) scale(1)`,opacity:1},{transform:`translate(${cx+Math.cos(a)*r}px,${cy+Math.sin(a)*r}px) scale(.2)`,opacity:0}],
      {duration:520+Math.random()*260,easing:'cubic-bezier(.16,1,.3,1)'}).onfinish=()=>s.remove(); } }

  let blinkAt=performance.now()+2400, tilt=0;
  (function tick(t){
    const dt=Math.min(50,t-last); last=t; idle+=dt;
    if(own){ rx+=(x-rx)*.22; ry+=(y-ry)*.22; ring.style.transform=`translate(${rx}px,${ry}px)`; }
    // the star chases a point just behind the pointer; after 1.6 s still, it runs laps around the ring
    let tx=x+18, ty=y+18;
    if(idle>1600 && !over){ const a=(t/520)%(Math.PI*2), r=30+Math.sin(t/300)*4; tx=x+Math.cos(a)*r; ty=y+Math.sin(a)*r*.8; }
    vx=(vx+(tx-sx)*.09)*.72; vy=(vy+(ty-sy)*.09)*.72; sx+=vx; sy+=vy;
    const sp=Math.hypot(vx,vy); tilt+=(Math.max(-35,Math.min(35,vx*2.4))-tilt)*.2;
    const sq=down?.78:1, st=1+Math.min(.28,sp*.012);
    star.style.transform=`translate(${sx}px,${sy}px) rotate(${tilt}deg) scale(${sq*st},${sq/st})`;
    face.setAttribute('transform',`translate(${Math.max(-1.6,Math.min(1.6,vx*.15))},${Math.max(-1.2,Math.min(1.2,vy*.15))})`);
    if(Date.now()>hold){
      if(over) set(over.matches('[data-cursor="view"]')?'wow':'laugh');
      else if(sp>9) set('wow');
      else if(idle>1600) set(Math.floor(t/1800)%3===2?'wink':'smile');
      else if(t>blinkAt){ set('blink'); if(t>blinkAt+140){ blinkAt=t+2200+Math.random()*2600; set('smile'); } }
      else set('smile');
    }
    if(over && !down && Math.random()<.04) burst(sx,sy,1);
    requestAnimationFrame(tick);
  })(last);
})();
