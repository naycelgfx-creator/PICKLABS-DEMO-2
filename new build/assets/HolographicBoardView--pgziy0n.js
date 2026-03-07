import{b as s,j as e}from"./vendor-react-CzJxRraw.js";import{L as v}from"./LiveTicketPanel-gTniUaX8.js";import"./vendor-others-DecU2WqX.js";import"./vendor-ui-Ce1ZTWB2.js";import"./vendor-tsparticles-CVp8axEG.js";import"./data-player-db-BKCVVeKs.js";import"./index-Ci8uq1O3.js";import"./vendor-framer-DJMLjyBE.js";const b=[{team:"Lakers",line:"-4.5",type:"lime-glow"},{team:"Warriors",line:"+2.0",type:"orange-outline"}],F=({activeTickets:p})=>{const[l,c]=s.useState(!1),[f,n]=s.useState(!0),d=s.useRef([]);s.useEffect(()=>{typeof DeviceOrientationEvent<"u"&&typeof DeviceOrientationEvent.requestPermission=="function"?n(!0):(n(!1),c(!0))},[]);const m=t=>{let r=t.gamma||0,i=t.beta||0;r=Math.max(-45,Math.min(45,r)),i=Math.max(-45,Math.min(45,i));const o=(r+45)/90*100,h=(i+45)/90*100;d.current.forEach(a=>{a&&(a.classList.add("is-active"),a.style.setProperty("--x",`${o}%`),a.style.setProperty("--y",`${h}%`))})},x=t=>{if(!l)return;const r=t.clientX/window.innerWidth*100,i=t.clientY/window.innerHeight*100;d.current.forEach(o=>{o&&(o.classList.add("is-active"),o.style.setProperty("--x",`${r}%`),o.style.setProperty("--y",`${i}%`))})};s.useEffect(()=>(l&&(window.addEventListener("deviceorientation",m),window.addEventListener("mousemove",x)),()=>{window.removeEventListener("deviceorientation",m),window.removeEventListener("mousemove",x)}),[l]);const u=()=>{typeof DeviceOrientationEvent<"u"&&typeof DeviceOrientationEvent.requestPermission=="function"?DeviceOrientationEvent.requestPermission().then(t=>{t==="granted"?(c(!0),n(!1)):alert("Permission denied. 3D features will be disabled.")}).catch(console.error):(c(!0),n(!1))};return e.jsxs("div",{className:"w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-start gap-8 bg-[#151518] p-6 pt-24 font-sans text-white relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-6 right-6 z-[100] h-10 w-full max-w-sm",children:e.jsx(v,{activeTickets:p})}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
                .tilt-card {
                    background-color: #222226;
                    width: 100%;
                    max-width: 400px;
                    padding: 30px;
                    border-radius: 16px;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid transparent;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    transition: transform 0.2s ease-out;
                }
                .tilt-card:hover {
                    transform: scale(1.02);
                }

                .lime-glow { border-color: #2EFA6B; box-shadow: 0 0 15px rgba(46, 250, 107, 0.2); }
                .orange-outline { border-color: #FF5E00; box-shadow: 0 0 15px rgba(255, 94, 0, 0.2); }

                .tilt-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease-out;
                    z-index: 10;
                    background: radial-gradient(
                        circle at var(--x, 50%) var(--y, 50%), 
                        rgba(255, 255, 255, 0.2) 0%, 
                        rgba(255, 255, 255, 0) 60%   
                    );
                }

                .lime-glow::before {
                    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(46, 250, 107, 0.3) 0%, transparent 60%);
                }
                .orange-outline::before {
                    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255, 94, 0, 0.3) 0%, transparent 60%);
                }

                .tilt-card.is-active::before {
                    opacity: 1;
                }
            `}}),e.jsxs("div",{className:"text-center mb-4",children:[e.jsxs("h1",{className:"text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white mb-2",children:["3D ",e.jsx("span",{className:"text-[#A3FF00]",children:"Holographic"})," Board"]}),e.jsx("p",{className:"text-slate-400 text-sm",children:"Experience our gyro-activated dynamic betting cards."})]}),f&&e.jsx("button",{onClick:u,className:"bg-gradient-to-r from-[#2EFA6B] to-[#FF5E00] text-black font-black px-8 py-4 rounded-xl shadow-[0_4px_15px_rgba(46,250,107,0.4)] hover:scale-105 transition-transform",children:"Unlock 3D Motion Features"}),e.jsx("div",{className:"flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-center z-10",children:b.map((t,r)=>e.jsxs("div",{className:`tilt-card ${t.type}`,ref:i=>d.current[r]=i,children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 m-0",children:t.team}),e.jsx("p",{className:`text-4xl font-black m-0 mb-4 ${t.type==="lime-glow"?"text-[#2EFA6B]":"text-[#FF5E00]"}`,children:t.line}),e.jsx("p",{className:"text-[#A0A0A5] text-sm",children:"Move your phone or mouse to see the edge."})]},r))})]})};export{F as HolographicBoardView};
