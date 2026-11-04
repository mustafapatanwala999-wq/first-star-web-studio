/* Star buddy: the normal cursor leaves a trail of gold dust, and a small gold star with a face follows
   a little behind it. It smiles, blinks, gasps when you move fast, laughs over buttons and links and
   bursts sparkles on click. Fine pointers only; off for reduced motion. */
(()=>{
  if(!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d=document, html=d.documentElement; html.classList.add('fine');
  const css=d.createElement('style');
  css.textContent=`
.cur,.cur-dot{display:none!important}
.fine,.fine a,.fine button{cursor:auto}.fine a,.fine button,.fine [role=button],.fine [data-cursor]{cursor:pointer}
.bd-dust{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9997}
.bd-star{position:fixed;left:0;top:0;width:24px;height:24px;margin:-12px 0 0 -12px;pointer-events:none;z-index:9999;filter:drop-shadow(0 0 5px rgba(245,184,0,.55))}
.bd-star svg{width:100%;height:100%;overflow:visible;display:block}
.bd-star .ch{opacity:0;transition:opacity .2s}
.bd-star.laugh .ch{opacity:.55}
`;
  d.head.appendChild(css);

  const cv=d.createElement('canvas'); cv.className='bd-dust'; d.body.appendChild(cv);
  const g=cv.getContext('2d'); let dpr=1;
  const fit=()=>{ dpr=Math.min(2,devicePixelRatio||1); cv.width=innerWidth*dpr; cv.height=innerHeight*dpr; }; fit(); addEventListener('resize',fit);
  const P=[], GOLD=['255,214,90','245,184,0','255,236,170','232,160,20'];
  // one grain of dust: drifts out from the pointer, falls a little, twinkles and fades
  function emit(px,py,dx,dy,n,pow){ for(let k=0;k<n&&P.length<260;k++){ const a=Math.random()*6.283, v=(.2+Math.random()*.9)*pow;
    P.push({x:px+(Math.random()-.5)*3,y:py+(Math.random()-.5)*3,vx:Math.cos(a)*v-dx*.04,vy:Math.sin(a)*v-dy*.04+.15,
      r:.7+Math.random()*1.9,life:0,max:520+Math.random()*700,c:GOLD[Math.random()*4|0],star:Math.random()<.22,tw:Math.random()*6}); } }
  function dust(dt){ g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,innerWidth,innerHeight); g.globalCompositeOperation='lighter';
    for(let i=P.length-1;i>=0;i--){ const p=P[i]; p.life+=dt; if(p.life>p.max){ P.splice(i,1); continue; }
      const f=dt/16; p.vx*=Math.pow(.96,f); p.vy=p.vy*Math.pow(.96,f)+.022*f; p.x+=p.vx*f; p.y+=p.vy*f;
      const k=1-p.life/p.max, al=k*(.65+.35*Math.sin(p.tw+p.life/70)), r=p.r*(.4+.6*k);
      g.fillStyle=`rgba(${p.c},${al})`;
      if(p.star){ const L=r*3.2; g.beginPath(); g.moveTo(p.x,p.y-L); g.quadraticCurveTo(p.x,p.y,p.x+L,p.y); g.quadraticCurveTo(p.x,p.y,p.x,p.y+L);
        g.quadraticCurveTo(p.x,p.y,p.x-L,p.y); g.quadraticCurveTo(p.x,p.y,p.x,p.y-L); g.fill(); }
      else { g.shadowColor=`rgba(245,184,0,${al})`; g.shadowBlur=6; g.beginPath(); g.arc(p.x,p.y,r,0,6.283); g.fill(); g.shadowBlur=0; } }
    g.globalCompositeOperation='source-over'; }

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

  let x=innerWidth/2, y=innerHeight/2, px=x, py=y, sx=x, sy=y, vx=0, vy=0, last=performance.now(), idle=0, over=null, down=false, seen=false;
  star.style.opacity=0;
  addEventListener('pointermove',e=>{ x=e.clientX; y=e.clientY; idle=0; if(!seen){ seen=true; px=sx=x; py=sy=y; star.style.opacity=''; } },{passive:true});
  d.addEventListener('pointerover',e=>{ over=e.target.closest('a,button,[role=button],.opt,.dot,[data-cursor]'); });
  d.documentElement.addEventListener('pointerleave',()=>{ star.style.opacity=0; seen=false; });
  addEventListener('pointerdown',()=>{ down=true; emit(x,y,0,0,26,2.6); hold=Date.now()+700; set('laugh'); });
  addEventListener('pointerup',()=>{ down=false; });

  let blinkAt=performance.now()+2400, tilt=0;
  (function tick(t){
    const dt=Math.min(50,t-last); last=t; idle+=dt;
    // gold dust pours from the cursor tip, more the faster you move
    const mdx=x-px, mdy=y-py, dist=Math.hypot(mdx,mdy); px=x; py=y;
    if(seen && dist>.5) emit(x,y,mdx,mdy,Math.min(7,1+dist/7|0),.7);
    if(seen && over && Math.random()<.18) emit(x,y,0,0,1,.5);
    // the star trails a little behind and below the pointer, lagging on a soft spring; at rest it bobs
    let tx=x+20, ty=y+22;
    if(idle>1200) ty+=Math.sin(t/420)*3;
    vx=(vx+(tx-sx)*.045)*.8; vy=(vy+(ty-sy)*.045)*.8; sx+=vx; sy+=vy;
    const sp=Math.hypot(vx,vy); tilt+=(Math.max(-35,Math.min(35,vx*2.4))-tilt)*.2;
    const sq=down?.78:1, st=1+Math.min(.28,sp*.012);
    star.style.transform=`translate(${sx}px,${sy}px) rotate(${tilt}deg) scale(${sq*st},${sq/st})`;
    face.setAttribute('transform',`translate(${Math.max(-1.6,Math.min(1.6,vx*.15))},${Math.max(-1.2,Math.min(1.2,vy*.15))})`);
    if(Date.now()>hold){
      if(over) set(over.matches('[data-cursor="view"]')?'wow':'laugh');
      else if(sp>9) set('wow');
      else if(idle>1200) set(Math.floor(t/1800)%3===2?'wink':'smile');
      else if(t>blinkAt){ set('blink'); if(t>blinkAt+140){ blinkAt=t+2200+Math.random()*2600; set('smile'); } }
      else set('smile');
    }
    dust(dt);
    requestAnimationFrame(tick);
  })(last);
})();
