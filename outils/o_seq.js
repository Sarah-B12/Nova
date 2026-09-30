// v1.36c — séquence (Q3/Q5) : pas de double clignotement entre deux vagues
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const z=document.createElement("div"); document.body.appendChild(z);
  const d={ type:"sequence", longueur:5, cadence:[0,2,1,3,2], texte:["TEST"] };
  z.innerHTML=_htmlSequence(d); _wireSequence(z,d);
  const pads=[...z.querySelectorAll(".q-seq-pad")]; const t0=Date.now(); const log=[];
  new MutationObserver(()=>{ log.push([Date.now()-t0, pads.map(p=>p.classList.contains("actif")?1:0).join("")]); })
    .observe(z,{ subtree:true, attributes:true, attributeFilter:["class"] });
  z.querySelector("#q-seq-go").click();
  await new Promise(x=>setTimeout(x,1500));      // vague 1 montrée (touche 0)
  const clic=Date.now()-t0; pads[0].click();      // le joueur répond 0
  await new Promise(x=>setTimeout(x,2600));      // pause + vague 2 (0, 2)
  // Allumages de la touche 0 après le clic du joueur : écart entre son extinction et le rallumage.
  const on0=[], off0=[]; let prev="0";
  for(const [t,e] of log){ const v=e[0]; if(t>=clic){ if(v==="1"&&prev!=="1") on0.push(t); if(v==="0"&&prev==="1") off0.push(t); } prev=v; }
  return { log: log.map(x=>x.join(" ")).join(" | "), clic, allumages0:on0, extinctions0:off0, pauseNoire: on0.length>1 ? on0[1]-off0[0] : null, etat:z.querySelector("#q-seq-etat").textContent };
})();
