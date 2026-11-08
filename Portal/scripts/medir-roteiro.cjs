// Mede o custo da rolagem no Roteiro no Chrome, com processador 6× mais lento e toque emulado.
// Requer servidor local e o Playwright da playwright-cli. Uso: node scripts/medir-roteiro.cjs 4173
const path=require('path');const NG=require('child_process').execSync('npm root -g').toString().trim();const {chromium}=require(path.join(NG,'@playwright/cli/node_modules/playwright-core'));
const porta=process.argv[2]||'4173';
(async()=>{const b=await chromium.launch({channel:'chrome'});
 const res=[];
 for(let rodada=0;rodada<3;rodada++){
 const c=await b.newContext({viewport:{width:390,height:664},hasTouch:true,isMobile:true,deviceScaleFactor:3,colorScheme:'dark'});
 const p=await c.newPage();await p.goto(`http://localhost:${porta}/?amostra#painel`);await p.waitForSelector('.parada',{state:'attached'});await p.waitForTimeout(800);
 const s=await c.newCDPSession(p);await s.send('Performance.enable');await s.send('Emulation.setCPUThrottlingRate',{rate:6});
 const met=async()=>Object.fromEntries((await s.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 await p.evaluate(()=>document.getElementById('roteiro').scrollIntoView());await p.waitForTimeout(600);
 const m0=await met();
 const fr=await p.evaluate(async()=>{const inicio=document.getElementById('roteiro').getBoundingClientRect().top+scrollY;const dist=document.getElementById('roteiro').offsetHeight-innerHeight;const d=[];let ult=performance.now();const t0=ult;const T=8000;let topImg=0;
  await new Promise(ok=>{const f=(t)=>{d.push(t-ult);ult=t;const q=(performance.now()-t0)/T;if(q>=1){ok();return}const tri=q<.5?q*2:2-q*2;scrollTo({top:inicio+dist*tri,behavior:'instant'});requestAnimationFrame(f)};requestAnimationFrame(f)});
  d.shift();d.sort((a,b)=>a-b);return {n:d.length,med:+d[d.length>>1].toFixed(1),p95:+d[Math.floor(d.length*.95)].toFixed(1),max:+d[d.length-1].toFixed(1),lentos:d.filter(x=>x>34).length,longos:d.filter(x=>x>100).length}});
 const m1=await met();
 res.push({...fr,layouts:m1.LayoutCount-m0.LayoutCount,estilos:m1.RecalcStyleCount-m0.RecalcStyleCount,layoutMs:Math.round((m1.LayoutDuration-m0.LayoutDuration)*1e3),estiloMs:Math.round((m1.RecalcStyleDuration-m0.RecalcStyleDuration)*1e3),scriptMs:Math.round((m1.ScriptDuration-m0.ScriptDuration)*1e3),tarefasMs:Math.round((m1.TaskDuration-m0.TaskDuration)*1e3)});
 const fotos=await p.evaluate(()=>[...document.querySelectorAll('#roteiro-midia img')].map(i=>[i.currentSrc.split('/').pop(),i.complete]));
 if(rodada===0)res.fotos=fotos;
 await c.close();}
 console.log(res.map(r=>JSON.stringify(r)).join('\n'));console.log(JSON.stringify(res.fotos));await b.close()})();
