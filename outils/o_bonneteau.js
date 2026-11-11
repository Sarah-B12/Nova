// v2.73 (K236) — le bonneteau : le tenancier triche (la bille n'est sous aucun gobelet) ; node o_banc.js .. bonneteau
(async function(){
  const r = {}; const att = ms => new Promise(x => setTimeout(x, ms)); await att(1500);
  const journaux = []; const jOrig = journal; journal = (t) => journaux.push(String(t));
  const vRpc = sb.rpc;
  const partie = async (rep) => {
    journaux.length = 0;
    sb.rpc = async (nom, args) => {
      if(nom === "bonneteau_etat") return { data:{ ok:true, partie:false }, error:null };
      if(nom === "bonneteau_ouvrir") return { data:{ ok:true, mise:args.p_mise, depart:2, melanges:[[1,2],[2,3],[1,3]], mult:2, solde:900 }, error:null };
      if(nom === "bonneteau_choisir") return { data:Object.assign({ ok:true, choix:args.p_gobelet, mise:100, solde:900 }, rep(args.p_gobelet)), error:null };
      return { data:null, error:null }; };
    const zb = document.createElement("div"); document.body.appendChild(zb);
    await _tableBonneteau(zb); zb.querySelector("#bon-mise").value = "100"; zb.querySelector("#bon-go").click();
    await att(6500);
    const gob = [...zb.querySelectorAll(".bon-gob")].find(g => g.style.left.startsWith("calc(82%"));   // la vraie place : à droite
    gob.click(); await att(60);
    const out = { billeVisible: zb.querySelectorAll(".a-bille").length, leves: zb.querySelectorAll(".leve").length,
                  ecran: (zb.querySelector("#bon-res") || zb).textContent.trim().slice(0, 140), journal: journaux.find(t => /Bonneteau/.test(t)) || "" };
    zb.remove(); return out;
  };
  r.triche  = await partie(() => ({ triche:true, bon:null, gagne:false, gain:0, net:-100 }));
  r.honnete = await partie(g => ({ triche:false, bon:3, gagne:g === 3, gain:200, net:100 }));
  r.gainsAffiches = (BAR_JEUX.find(j => j.id === "bonneteau") || {}).gains;
  sb.rpc = vRpc; journal = jOrig;
  return r;
})();
