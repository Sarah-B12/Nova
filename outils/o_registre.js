// v1.45 — Registre du Protocole : palier, fiche, effets, signalement (node o_banc.js .. registre)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const rpcOrig = sb.rpc.bind(sb); const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args }); if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); jOrig(t); };
  rep.registre_lire = () => ({ data:{ ok:true, palier:"inconnu" }, error:null });
  await chargerRegistre();
  r.fiche = document.querySelector("#stat-registre").textContent;
  const base = chancePatrouille();
  rep.registre_lire = () => ({ data:{ ok:true, palier:"prioritaire" }, error:null });
  await chargerRegistre();
  r.ficheP = document.querySelector("#stat-registre").textContent;
  r.freq = +(chancePatrouille() / base).toFixed(3);
  r.effets = registreEffets();
  // victoire forcée : butin et XP majorés, signalement « battue »
  _registrePalier = "signale";
  rep.registre_patrouille = (a) => ({ data:{ ok:true, compte:true, palier:"recherche" }, error:null });
  const rnd = Math.random; Math.random = () => 0.01;
  appels.length = 0; journ.length = 0;
  await resoudreCombat({}); await dort(50);
  Math.random = rnd;
  r.combat = { signal:(appels.find(a => a.nom === "registre_patrouille") || {}).args, journal: journ.slice(0, 3), palier:_registrePalier };
  return r;
})();
