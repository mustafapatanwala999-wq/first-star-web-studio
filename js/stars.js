/* First Star particle engine: one field of gold points that morphs between shapes.
   Raw WebGL1, no dependencies. Shapes are sampled in a [-1,1]-ish space. */
(function(){
const TAU = Math.PI*2, R = Math.random;

function make(n){ return new Float32Array(n*3); }
function filler(arr){ let k=0; return { put(x,y,z){ if(k>=arr.length) return false; arr[k++]=x; arr[k++]=y; arr[k++]=z||0; return true; }, get left(){ return (arr.length-k)/3; }, done(){ return k>=arr.length; } }; }
const jit = (s)=> (R()-.5)*s;

/* --- primitive samplers --- */
function sparkle(f, n, cx, cy, r, thick){
  for(let i=0;i<n;i++){
    const t=R()*TAU, c=Math.cos(t), s=Math.sin(t);
    const bx=Math.sign(c)*Math.pow(Math.abs(c),3.1)*r, by=Math.sign(s)*Math.pow(Math.abs(s),3.1)*r;
    const u = R()<.42 ? 1 : Math.pow(R(),.55);
    f.put(cx+bx*u+jit(.006), cy+by*u+jit(.006), jit(thick*r*(1-u*.85)));
  }
}
function line(f, n, x0,y0,x1,y1, w){ for(let i=0;i<n;i++){ const t=R(); f.put(x0+(x1-x0)*t+jit(w), y0+(y1-y0)*t+jit(w), jit(.02)); } }
function rect(f, n, x,y,w,h, j){ // outline, (x,y)=centre
  const P=2*(w+h); for(let i=0;i<n;i++){ let d=R()*P, px, py;
    if(d<w){px=x-w/2+d;py=y+h/2;} else if((d-=w)<h){px=x+w/2;py=y+h/2-d;} else if((d-=h)<w){px=x+w/2-d;py=y-h/2;} else {d-=w;px=x-w/2;py=y-h/2+d;}
    f.put(px+jit(j||.006), py+jit(j||.006), jit(.02)); } }
function fill(f, n, x,y,w,h, z){ for(let i=0;i<n;i++) f.put(x+(R()-.5)*w, y+(R()-.5)*h, jit(z||.04)); }
function circle(f, n, x,y,r, j, filled){ for(let i=0;i<n;i++){ const a=R()*TAU, rr= filled? r*Math.sqrt(R()) : r+jit(j||.01); f.put(x+Math.cos(a)*rr, y+Math.sin(a)*rr, jit(.03)); } }
function dust(f, n, spread){ for(let i=0;i<n;i++){ const a=R()*TAU, r=spread*(.55+R()*.6); f.put(Math.cos(a)*r*1.4, Math.sin(a)*r, jit(.8)); } }

/* --- shapes (each returns Float32Array N*3) with a bounding box for layout --- */
const SHAPES = {
  star:{ w:1.95, h:1.85, gen(N){ const a=make(N), f=filler(a);
    sparkle(f, N*.8|0, -.12, -.08, .86, .35); sparkle(f, N*.12|0, .66, .58, .2, .3); dust(f, f.left, 1.25); return a; } },
  doc:{ w:1.05, h:1.4, gen(N){ const a=make(N), f=filler(a), W=1, H=1.36;
    rect(f, N*.2|0, 0,0,W,H, .005);
    fill(f, N*.06|0, -.12, .5, .6, .07); fill(f, N*.04|0, -.2, .4, .44, .04);
    const rows=13, per=(N*.52/rows)|0; for(let r=0;r<rows;r++){ const y=.28-r*.068, end=-.4+ (r%4===3? .45 : .72+R()*.08); line(f, per, -.4,y, end,y, .008); }
    line(f, N*.04|0, -.4,-.6, -.05,-.6, .006); circle(f, N*.07|0, .28,-.56, .09, .008);
    while(!f.done()) f.put(jit(1.6), jit(1.9), jit(.6)*.5);
    return rot2(a, -.08); } },
  browser:{ w:2.05, h:1.3, gen(N){ const a=make(N), f=filler(a), W=2, H=1.25, top=H/2;
    rect(f, N*.15|0, 0,0,W,H, .005); line(f, N*.04|0, -W/2,top-.13, W/2,top-.13, .004);
    for(let i=0;i<3;i++) circle(f, N*.008|0, -W/2+.09+i*.07, top-.065, .018, .004, true);
    fill(f, N*.02|0, .5, top-.065, .6, .05);
    fill(f, N*.1|0, -.48, .18, .78, .1); fill(f, N*.07|0, -.58, .03, .58, .09);
    line(f, N*.03|0, -.86,-.12, -.3,-.12, .006); line(f, N*.02|0, -.86,-.18, -.45,-.18, .006);
    rect(f, N*.03|0, -.74,-.32, .24,.08, .004); rect(f, N*.025|0, -.46,-.32, .24,.08, .004);
    fill(f, N*.2|0, .48, -.02, .82, .78, .03); sparkle(f, N*.05|0, .48,-.02, .22, .4);
    for(let i=0;i<3;i++) rect(f, N*.025|0, -.62+i*.62, -.5, .5,.12, .004);
    while(!f.done()) f.put(jit(2.8), jit(1.8), jit(.6)*.5);
    return a; } },
  photos:{ w:2.05, h:1.06, gen(N){ const a=make(N), f=filler(a), pw=.62, ph=.46;
    for(let r=0;r<2;r++) for(let c=0;c<3;c++){ const x=-.69+c*.69, y=.26-r*.53, k=N*.15|0;
      rect(f, k*.3|0, x,y,pw,ph, .004); circle(f, k*.12|0, x+.15,y+.1, .06, 0, true);
      const m=k*.4|0; for(let i=0;i<m;i++){ const t=R(), px=x-pw/2+t*pw, peak=Math.max(0,.17-Math.abs(t-.38)*.55)+Math.max(0,.11-Math.abs(t-.75)*.5); f.put(px, y-ph/2+R()*peak*1.1+.02, jit(.03)); }
      fill(f, k*.12|0, x,y-ph/2+.03, pw*.96,.05); }
    while(!f.done()) f.put(jit(2.8), jit(1.6), jit(.6)*.5);
    return a; } },
  phone:{ w:.75, h:1.4, gen(N){ const a=make(N), f=filler(a), W=.66, H=1.32;
    rect(f, N*.2|0, 0,0,W,H, .005); fill(f, N*.02|0, 0,H/2-.05, .16,.03); fill(f, N*.015|0, 0,-H/2+.04, .2,.012);
    fill(f, N*.2|0, 0,.32, .56,.4); sparkle(f, N*.04|0, 0,.32, .11, .4);
    fill(f, N*.06|0, -.06,.04, .44,.06); fill(f, N*.04|0, -.1,-.04, .36,.045);
    line(f, N*.03|0, -.25,-.12, .2,-.12, .005); rect(f, N*.03|0, -.15,-.21, .22,.06, .004);
    rect(f, N*.04|0, 0,-.37, .56,.16, .004); rect(f, N*.03|0, 0,-.53, .56,.1, .004);
    while(!f.done()) f.put(jit(2.4), jit(1.8), jit(.6)*.5);
    return a; } },
  tick:{ w:1.7, h:1.7, gen(N){ const a=make(N), f=filler(a);
    circle(f, N*.34|0, 0,0,.78, .025); circle(f, N*.06|0, 0,0,.9, .004);
    line(f, N*.17|0, -.38,.0, -.1,-.3, .045); line(f, N*.3|0, -.1,-.3, .42,.33, .045);
    while(!f.done()) f.put(jit(2.8), jit(2), jit(.8)*.5);
    return a; } },
  galaxy:{ w:5, h:2.4, gen(N){ const a=make(N), f=filler(a);
    for(let i=0;i<N;i++){ const arm=i%2, r=Math.pow(R(),.65)*2.5, ang=r*2.1+arm*Math.PI+jit(.5)*(1+r*.3);
      f.put(Math.cos(ang)*r, jit(.12)*(1.2-r*.3), Math.sin(ang)*r); }
    return a; } }
};
function rot2(a, ang){ const c=Math.cos(ang), s=Math.sin(ang); for(let i=0;i<a.length;i+=3){ const x=a[i], y=a[i+1]; a[i]=x*c-y*s; a[i+1]=x*s+y*c; } return a; }
// order points top-to-bottom (softened) so morphs flow like a curtain instead of a blizzard
function order(a){ const n=a.length/3, idx=[...Array(n).keys()], key=new Float32Array(n);
  for(let i=0;i<n;i++) key[i]=-a[i*3+1]+R()*.35; idx.sort((p,q)=>key[p]-key[q]);
  const o=new Float32Array(a.length); idx.forEach((s,d)=>{ o[d*3]=a[s*3]; o[d*3+1]=a[s*3+1]; o[d*3+2]=a[s*3+2]; }); return o; }

const VS=`attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 aR;
uniform float uProg,uTime,uAspect,uScale,uDpr,uSize,uRotY,uRotX,uSwirl; uniform vec2 uOff,uMouse;
varying float vA; varying float vC;
float ez(float t){ return t<.5?4.*t*t*t:1.-pow(-2.*t+2.,3.)/2.; }
void main(){
  float p=clamp(uProg*1.6-aR.x*.6,0.,1.), e=ez(p);
  vec3 pos=mix(aFrom,aTo,e);
  float sw=sin(p*3.14159)*uSwirl;
  pos+=sw*vec3(sin(aR.y*40.+pos.y*3.),cos(aR.z*40.+pos.x*3.),sin(aR.x*30.))*.32;
  pos+=vec3(sin(uTime*.5+aR.y*20.),cos(uTime*.4+aR.z*20.),0.)*.006;
  float cy=cos(uRotY), sy=sin(uRotY); pos=vec3(cy*pos.x+sy*pos.z,pos.y,-sy*pos.x+cy*pos.z);
  float cx=cos(uRotX), sx=sin(uRotX); pos=vec3(pos.x,cx*pos.y-sx*pos.z,sx*pos.y+cx*pos.z);
  pos*=uScale; pos.xy+=uOff;
  vec2 d=pos.xy-uMouse; float dl=length(d); pos.xy+=d/(dl+1e-4)*smoothstep(.32,0.,dl)*.1;
  float persp=3.2/(3.2-pos.z);
  gl_Position=vec4(pos.x*persp/uAspect,pos.y*persp,0.,1.);
  float tw=.55+.45*sin(uTime*(1.+aR.z*2.)+aR.y*50.);
  gl_PointSize=uSize*(.55+aR.z*1.25)*persp*uDpr*(.8+.4*tw);
  vA=.4+.6*tw; vC=aR.y;
}`;
const FS=`precision mediump float; varying float vA; varying float vC; uniform float uAlpha;
void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); float a=smoothstep(.5,0.,d); a*=a;
  vec3 col=vC>.8?vec3(1.,.93,.8):mix(vec3(.96,.6,0.),vec3(1.,.8,.25),vC*1.25);
  float k=a*vA*uAlpha; gl_FragColor=vec4(col*k,k); }`;

window.FirstStars = function(canvas, opts){
  const gl = canvas.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  if(!gl) return null;
  const sh=(t,s)=>{ const o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
  const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const N = opts.count;
  const shapes={}; for(const k in SHAPES) shapes[k]=order(SHAPES[k].gen(N));
  const rnd=new Float32Array(N*3); for(let i=0;i<rnd.length;i++) rnd[i]=R();
  const from=new Float32Array(N*3); for(let i=0;i<N;i++){ const a=R()*TAU, b=Math.acos(2*R()-1), r=2.5+R()*2; from[i*3]=Math.sin(b)*Math.cos(a)*r; from[i*3+1]=Math.sin(b)*Math.sin(a)*r; from[i*3+2]=Math.cos(b)*r*.4; }
  let to=shapes.star;
  const buf=(data,name,usage)=>{ const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,data,usage); const l=gl.getAttribLocation(pr,name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l,3,gl.FLOAT,false,0,0); return b; };
  const bFrom=buf(from,'aFrom',gl.DYNAMIC_DRAW), bTo=buf(to,'aTo',gl.DYNAMIC_DRAW); buf(rnd,'aR',gl.STATIC_DRAW);
  const U={}; ['uProg','uTime','uAspect','uScale','uDpr','uSize','uRotY','uRotX','uSwirl','uOff','uMouse','uAlpha'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE); gl.clearColor(0,0,0,0);

  const S = { prog:0, swirl:1, scale:.7, offX:0, offY:0, alpha:1, rotX:0, size:opts.size||2.2, mx:0, my:0, tmx:0, tmy:0, spin:0, vel:0 };
  let W=1,H=1,aspect=1,dpr=1, running=true, t0=performance.now();
  function resize(){ dpr=Math.min(devicePixelRatio||1, opts.maxDpr||1.75); W=canvas.clientWidth; H=canvas.clientHeight; canvas.width=W*dpr|0; canvas.height=H*dpr|0; gl.viewport(0,0,canvas.width,canvas.height); aspect=W/H; }
  resize();
  function ez(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
  // where every point is right now (mirrors the vertex shader before rotation), so a new morph starts from there
  function current(){ const o=new Float32Array(N*3), P=S.prog, sw=S.swirl;
    for(let i=0;i<N;i++){ const r0=rnd[i*3],r1=rnd[i*3+1],r2=rnd[i*3+2]; const p=Math.min(1,Math.max(0,P*1.6-r0*.6)), e=ez(p), k=Math.sin(p*Math.PI)*sw;
      const x=from[i*3]+(to[i*3]-from[i*3])*e, y=from[i*3+1]+(to[i*3+1]-from[i*3+1])*e, z=from[i*3+2]+(to[i*3+2]-from[i*3+2])*e;
      o[i*3]=x+k*Math.sin(r1*40+y*3)*.32; o[i*3+1]=y+k*Math.cos(r2*40+x*3)*.32; o[i*3+2]=z+k*Math.sin(r0*30)*.32; }
    return o; }
  function morph(name){ if(to===shapes[name]) return false; const cur=current(); from.set(cur); to=shapes[name];
    gl.bindBuffer(gl.ARRAY_BUFFER,bFrom); gl.bufferData(gl.ARRAY_BUFFER,from,gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,bTo); gl.bufferData(gl.ARRAY_BUFFER,to,gl.DYNAMIC_DRAW); S.prog=0; return true; }
  function frame(now){ if(!running) return; const t=(now-t0)/1000;
    S.mx+=(S.tmx-S.mx)*.06; S.my+=(S.tmy-S.my)*.06; S.vel*=.92; S.spin+=S.vel*.0006;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uProg,S.prog); gl.uniform1f(U.uTime,t); gl.uniform1f(U.uAspect,aspect); gl.uniform1f(U.uScale,S.scale);
    gl.uniform1f(U.uDpr,dpr); gl.uniform1f(U.uSize,S.size*Math.min(1.25,Math.max(.85,H/850))); gl.uniform1f(U.uSwirl,S.swirl);
    gl.uniform1f(U.uRotY, Math.sin(t*.22)*.32 + S.mx*.35 + S.spin); gl.uniform1f(U.uRotX, S.rotX + Math.cos(t*.17)*.06 - S.my*.2);
    gl.uniform2f(U.uOff,S.offX,S.offY); gl.uniform2f(U.uMouse, S.mx*aspect, S.my); gl.uniform1f(U.uAlpha,S.alpha);
    gl.drawArrays(gl.POINTS,0,N); if(!opts.still) requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  return { S, morph, resize, box:k=>SHAPES[k], get aspect(){return aspect;}, pause(){running=false;}, play(){ if(!running){running=true;requestAnimationFrame(frame);} }, draw(){ requestAnimationFrame(frame); } };
};
})();
