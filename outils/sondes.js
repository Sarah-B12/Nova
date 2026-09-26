// v1.20 — sondes : énergie débitée avant, gain décidé par le serveur (node banc.js .. sondes)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; let rep = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return rep[n] ? rep[n](a) : orig(n, a); };
  lancerTirSonde = (win, lose) => { r.duelLance = true; return win(); };   // on gagne le duel d'office
  const journ = []; const jOrig = journal; journal = (t, c) => { journ.push(t); };

  // 1. assez d'énergie, 1re du jour
  etat.energie = 50; const avant = etat.credits;
  rep.agir = () => Promise.resolve({ data:{ ok:true, etat:{ sac:{}, coffre:{}, soute:{}, lots:[] }, energie:45 }, error:null });
  rep.sonde_victoire = () => Promise.resolve({ data:{ ok:true, gain:77, rang:1, plafond:false, solde:avant+77 }, error:null });
  await sondeCombat(); await dort(50);
  r.cas1 = { ordre: appels.map(a=>a.n).filter(n=>n==="agir"||n==="sonde_victoire"), cout: (appels.find(a=>a.n==="agir")||{a:{}}).a.p_cout, credits: etat.credits - avant, msg: journ.slice(-1)[0] };

  // 2. plafond atteint
  appels.length = 0; const av2 = etat.credits;
  rep.sonde_victoire = () => Promise.resolve({ data:{ ok:true, gain:0, rang:11, plafond:true, solde:av2 }, error:null });
  await sondeCombat(); await dort(50);
  r.cas2 = { credits: etat.credits - av2, msg: journ.slice(-1)[0] };

  // 3. énergie refusée par le serveur : pas de duel, la rencontre se rouvre
  appels.length = 0; r.duelLance = false;
  rep.agir = () => Promise.resolve({ data:{ ok:false, err:"energie" }, error:null });
  await sondeCombat(); await dort(50);
  r.cas3 = { duel: r.duelLance, victoireDemandee: appels.some(a=>a.n==="sonde_victoire"), modaleRouverte: !document.querySelector("#sonde-modale").hidden };

  // 4. bouton désactivé sans énergie
  etat.energie = 3; ouvrirSonde();
  r.cas4 = { boutonGrise: document.querySelector('[data-s="attaquer"]').disabled };
  journal = jOrig;
  return r;
})()
