/* Cursor sparkle: the gold ring follows the pointer and a few gold sparkles drift out of the cursor tip
   as it moves, with a small burst on click. Kept light: one small canvas, a pre-drawn glow sprite,
   at most 48 sparkles, and the loop sleeps when nothing is moving. Fine pointers only; off for reduced motion. */
(()=>{
  if(!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d=document; d.documentElement.classList.add('fine');
  const css=d.createElement('style');
  css.textContent=`
.fine,.fine a,.fine button,.fine input,.fine select,.fine label{cursor:none}
.fine input[type=text],.fine input[type=email],.fine input[type=tel],.fine textarea{cursor:text}
.bd-ring{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1px solid rgba(245,184,0,.6);pointer-events:none;z-index:9998;transition:width .45s cubic-bezier(.16,1,.3,1),height .45s cubic-bezier(.16,1,.3,1),margin .45s cubic-bezier(.16,1,.3,1),border-color .3s,background .3s}
.bd-ring.link{width:58px;height:58px;margin:-29px 0 0 -29px;border-color:#f5b800;background:rgba(245,184,0,.06)}
.bd-dot{position:fixed;left:0;top:0;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;background:#f5b800;pointer-events:none;z-index:9999}
.cur.view{width:86px;height:86px;margin:-43px 0 0 -43px;background:rgba(7,8,26,.55);border-color:#f5b800;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.cur.view span{color:#f5b800}
.bd-spark{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9997}`;
  d.head.appendChild(css);

  // the homepage has its own ring and dot (site.js); other pages get one here
  let ring=null, dot=null;
  if(!d.querySelector('.cur')){ ring=d.createElement('div'); ring.className='bd-ring'; dot=d.createElement('div'); dot.className='bd-dot'; ring.style.opacity=dot.style.opacity=0; d.body.append(ring,dot); }

  const cv=d.createElement('canvas'); cv.className='bd-spark'; d.body.appendChild(cv);
  const g=cv.getContext('2d');
  const fit=()=>{ cv.width=innerWidth; cv.height=innerHeight; }; fit(); addEventListener('resize',fit);
  // one glow sprite, drawn once, so each sparkle is a single cheap drawImage
  const spr=d.createElement('canvas'); spr.width=spr.height=32; const sg=spr.getContext('2d');
  const rg=sg.createRadialGradient(16,16,0,16,16,16); rg.addColorStop(0,'rgba(255,246,210,1)'); rg.addColorStop(.25,'rgba(255,214,90,.9)'); rg.addColorStop(1,'rgba(245,184,0,0)');
  sg.fillStyle=rg; sg.fillRect(0,0,32,32);

  const P=[]; let x=0, y=0, rx=0, ry=0, lx=0, ly=0, seen=false, over=false, raf=0, last=0;
  function emit(n,pow){ for(let k=0;k<n && P.length<48;k++){ const a=Math.random()*6.283, v=(.3+Math.random())*pow;
    P.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v+.2,s:8+Math.random()*9,life:0,max:500+Math.random()*500}); } }
  function wake(){ if(!raf){ last=performance.now(); raf=requestAnimationFrame(tick); } }
  addEventListener('pointermove',e=>{ x=e.clientX; y=e.clientY;
    if(!seen){ seen=true; rx=lx=x; ry=ly=y; if(ring){ ring.style.opacity=''; dot.style.opacity=''; } }
    if(dot) dot.style.transform=`translate(${x}px,${y}px)`;
    const dd=Math.hypot(x-lx,y-ly); if(dd>14){ emit(dd>60?2:1,.6); lx=x; ly=y; }
    wake(); },{passive:true});
  d.addEventListener('pointerover',e=>{ over=!!e.target.closest('a,button,[role=button],.opt,.dot,.cc,[data-cursor]'); ring?.classList.toggle('link',over); });
  d.documentElement.addEventListener('pointerleave',()=>{ seen=false; if(ring){ ring.style.opacity=0; dot.style.opacity=0; } });
  addEventListener('pointerdown',()=>{ emit(14,2.2); wake(); });

  function tick(t){
    const dt=Math.min(50,t-last), f=dt/16; last=t;
    let moving=false;
    if(ring){ rx+=(x-rx)*.2; ry+=(y-ry)*.2; ring.style.transform=`translate(${rx}px,${ry}px)`; moving=Math.abs(x-rx)+Math.abs(y-ry)>.3; }
    g.clearRect(0,0,cv.width,cv.height); g.globalCompositeOperation='lighter';
    for(let i=P.length-1;i>=0;i--){ const p=P[i]; p.life+=dt; if(p.life>=p.max){ P[i]=P[P.length-1]; P.pop(); continue; }
      p.vx*=.96; p.vy=p.vy*.96+.03*f; p.x+=p.vx*f; p.y+=p.vy*f;
      const k=1-p.life/p.max, s=p.s*(.35+.65*k); g.globalAlpha=k; g.drawImage(spr,p.x-s/2,p.y-s/2,s,s); }
    g.globalAlpha=1; g.globalCompositeOperation='source-over';
    raf = (P.length||moving) ? requestAnimationFrame(tick) : 0;
  }
})();
