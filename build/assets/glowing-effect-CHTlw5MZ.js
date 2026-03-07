import{b as r,j as d}from"./vendor-react-uONrOFLY.js";import{c as y}from"./utils-CDtSqND-.js";import{a as S}from"./vendor-framer-DnhUOivb.js";if(typeof G>"u")var G=window;const $=r.memo(({blur:w=0,inactiveZone:x=.7,proximity:a=0,spread:R=20,variant:s="default",glow:k=!1,className:F,movementDuration:E=2,borderWidth:P=1,disabled:l=!0})=>{const g=r.useRef(null),u=r.useRef({x:0,y:0}),n=r.useRef(0),p=r.useCallback(t=>{g.current&&(n.current&&cancelAnimationFrame(n.current),n.current=requestAnimationFrame(()=>{const e=g.current;if(!e)return;const{left:c,top:m,width:b,height:v}=e.getBoundingClientRect(),i=t?.x??u.current.x,o=t?.y??u.current.y;t&&(u.current={x:i,y:o});const f=[c+b*.5,m+v*.5],M=Math.hypot(i-f[0],o-f[1]),_=.5*Math.min(b,v)*x;if(M<_){e.style.setProperty("--active","0");return}const A=i>c-a&&i<c+b+a&&o>m-a&&o<m+v+a;if(e.style.setProperty("--active",A?"1":"0"),!A)return;const h=parseFloat(e.style.getPropertyValue("--start"))||0,L=(180*Math.atan2(o-f[1],i-f[0])/Math.PI+90-h+180)%360-180,N=h+L;S(h,N,{duration:E,ease:[.16,1,.3,1],onUpdate:C=>{e.style.setProperty("--start",String(C))}})}))},[x,a,E]);r.useEffect(()=>{if(l)return;const t=()=>p(),e=c=>p(c);return window.addEventListener("scroll",t,{passive:!0}),document.body.addEventListener("pointermove",e,{passive:!0}),()=>{n.current&&cancelAnimationFrame(n.current),window.removeEventListener("scroll",t),document.body.removeEventListener("pointermove",e)}},[p,l]);const j=s==="white"?"repeating-conic-gradient(from 236.84deg at 50% 50%, var(--black), var(--black) calc(25% / 5))":s==="green"?`radial-gradient(circle, #0df20d 10%, #0df20d00 20%),
                       radial-gradient(circle at 40% 40%, #00ff88 5%, #00ff8800 15%),
                       radial-gradient(circle at 60% 60%, #0df20d 10%, #0df20d00 20%),
                       radial-gradient(circle at 40% 60%, #39ff14 10%, #39ff1400 20%),
                       repeating-conic-gradient(
                         from 236.84deg at 50% 50%,
                         #0df20d 0%,
                         #00ff88 calc(25% / 5),
                         #39ff14 calc(50% / 5),
                         #00c832 calc(75% / 5),
                         #0df20d calc(100% / 5)
                       )`:`radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
                       radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
                       radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%),
                       radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
                       repeating-conic-gradient(
                         from 236.84deg at 50% 50%,
                         #dd7bbb 0%,
                         #d79f1e calc(25% / 5),
                         #5a922c calc(50% / 5),
                         #4c7894 calc(75% / 5),
                         #dd7bbb calc(100% / 5)
                       )`;return d.jsxs(d.Fragment,{children:[d.jsx("div",{className:y("pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",k&&"opacity-100",s==="white"&&"border-white",s==="green"&&"border-primary",l&&"!block")}),d.jsx("div",{ref:g,style:{"--blur":`${w}px`,"--spread":R,"--start":"0","--active":"0","--glowingeffect-border-width":`${P}px`,"--repeating-conic-gradient-times":"5","--gradient":j},className:y("pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",k&&"opacity-100",w>0&&"blur-[var(--blur)]",F,l&&"!hidden"),children:d.jsx("div",{className:y("glow","rounded-[inherit]",'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',"after:[border:var(--glowingeffect-border-width)_solid_transparent]","after:[background:var(--gradient)] after:[background-attachment:fixed]","after:opacity-[var(--active)] after:transition-opacity after:duration-300","after:[mask-clip:padding-box,border-box]","after:[mask-composite:intersect]","after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]")})})]})});$.displayName="GlowingEffect";export{$ as G};
