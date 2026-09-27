(async function(){
  const vieux = sb.rpc;
  sb.rpc = (nom, a) => ({ then(ok){ return Promise.resolve({ data: { ok:true, nom:"Testeuse", total:3, jours:7, mouvements:[
    { d: Date.now(), item:"ferragave", lieu:"sac", delta:-6, lot: Date.now()-5*864e5, source:"perimer", motif:null },
    { d: Date.now()-6e4, item:"credits", lieu:"compte", delta:-12, lot:null, source:"poste_envoyer", motif:null },
    { d: Date.now()-9e4, item:"cendrite", lieu:"sac", delta:6, lot: Date.now()-9e4, source:"agir", motif:"mine<b>" } ] }, error:null }).then(ok); } });
  const z = document.createElement("div"); document.body.appendChild(z);
  await afficherMouvementsStaff(z, "u1");
  const n1 = z.querySelectorAll("tr").length;
  const sel = z.querySelector(".mvt-filtre"); sel.value = "credits"; sel.dispatchEvent(new Event("change"));
  const n2 = z.querySelectorAll("tr").length;
  sb.rpc = vieux;
  return { lignes: n1, filtreCredits: n2, options: sel.options.length, echappe: !z.innerHTML.includes("<b>"),
           apercu: z.querySelector("tr").textContent };
})()
