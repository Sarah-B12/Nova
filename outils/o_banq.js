// v1.36d — bannière du donneur : masquée pendant une quête prise à la Carcasse seulement
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const z=document.querySelector("#hub-quete"); if(!z) return { err:"pas de #hub-quete" };
  _priseIci = () => true;
  const sauve = JSON.parse(JSON.stringify(etat.quetes));
  const r = {};
  for(const [nom, id] of [["ville (q4, Sorn)","q4"],["carcasse (q6, Galm)","q6"]]){
    etat.quetes.active = null; queteProchaine = () => queteData(id); majQueteHub();
    const avant = !!z.querySelector(".quete-banniere");
    etat.quetes.active = { id, etape: 0 }; majQueteHub();
    r[nom] = { avant, pendant: !!z.querySelector(".quete-banniere") };
  }
  etat.quetes = sauve; majQueteHub();
  return r;
})();
