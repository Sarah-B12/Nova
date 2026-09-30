// v1.36e — Q7 : cadenas à 4 logements / 7 essais ; séquence plus rapide
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const q=queteData("q7"); const e1=q.etapes[0].defi, e2=q.etapes[1].defi;
  const z=document.createElement("div"); document.body.appendChild(z);
  z.innerHTML=_htmlSequence(e2); _wireSequence(z,e2);
  const pads=[...z.querySelectorAll(".q-seq-pad")]; const t0=Date.now(); const on=[];
  new MutationObserver(()=>{ const v=pads.map(p=>p.classList.contains("actif")?1:0).join(""); on.push([Date.now()-t0,v]); })
    .observe(z,{ subtree:true, attributes:true, attributeFilter:["class"] });
  z.querySelector("#q-seq-go").click();
  await new Promise(x=>setTimeout(x,900));
  const z2=document.createElement("div"); z2.innerHTML=_htmlCadenas(e1);
  return { cadenas:{ logements:z2.querySelectorAll(".q-cad-slot").length, essais:e1.essais },
           sequence:{ allume:e2.allume, pas:e2.pas, premierAllumage: on.slice(0,2).map(x=>x.join(":")) } };
})();
