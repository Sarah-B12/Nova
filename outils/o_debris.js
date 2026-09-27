// v1.31 — chutes de débris : panneau, visière, fouille, patrouilles (node o_banc.js .. debris)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; let rep = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return rep[n] ? Promise.resolve({ data: rep[n](a), error: null }) : orig(n, a); };
  const journ = []; journal = (t) => { journ.push(t); };
  sauverMaintenant = async () => {}; sauverSurServeur = async () => {};
  rep.agir = () => ({ ok:true, ajoutes:{}, energie:70, jauges:{ o2:90, sante:80, moral:80 }, etat:null });

  // 1. Pas d'événement : rien nulle part
  rep.debris_etat = () => ({ actif:false });
  await debrisCharger();
  r.sansEvenement = { ici: debrisIci(), panneau: document.querySelector("#debris-silene").hidden };

  // 2. Événement sur La Braise, joueur sur Silène
  rep.debris_etat = () => ({ actif:true, carte:"braise", fin:"2026-10-26", faites:0, fini:false });
  etat.secteur = "silene"; etat.pos = { x:1225, y:325 };
  await debrisCharger(); majCarte();
  r.surSilene = { ici: debrisIci(), texte: document.querySelector("#debris-silene").textContent.replace(/\s+/g," ").trim(),
                  surfaceCache: document.querySelector("#debris-surface").hidden };
  r.libelle = rendreLibelles("Des débris ont été vus tomber sur {carte:braise}. Et {carte:suaire}, {carte:silene}.");
  const chanceSilene = chancePatrouille();

  // 3. Au sol de La Braise : panneau, patrouilles ×1,5
  etat.secteur = "braise"; etat.surface = { x:1000, y:800, abord:false };
  let sondes = 0;
  rep.debris_sonder = (a) => { sondes++; return { ok:true, ici:true, carte:"braise", fini:false, palier: sondes===1?2:4, tendance: sondes===1?null:"chaud", sur_point:false }; };
  majCarteBraise(); await dort(30);
  r.surBraise = { ici: debrisIci(), chance: [chanceSilene, chancePatrouille()],
                  texte: document.querySelector("#debris-surface").textContent.replace(/\s+/g," ").trim() };

  // 4. Déplacement au sol : sonde bavarde + tentative de patrouille
  let tentatives = 0; const tpOrig = tenterPatrouille; tenterPatrouille = () => { tentatives++; };
  etat.jauges.o2 = 100; etat.enPause = false;
  await voyagerBraise(1200, 800); await dort(30);
  const sonde = appels.filter(a=>a.n==="debris_sonder").pop();
  r.deplacement = { sondeEnvoyee: sonde && sonde.a, message: journ.filter(t=>/Visière/.test(t)).pop(), patrouilleTentee: tentatives,
                    thermo: document.querySelector("#debris-surface .debris-thermo i").style.width };

  // 5. Sur le point : bouton, fouille réussie
  rep.debris_sonder = () => ({ ok:true, ici:true, carte:"braise", fini:false, palier:5, tendance:"chaud", sur_point:true });
  await voyagerBraise(1260, 800); await dort(30);
  const btn = document.querySelector("#debris-surface .debris-fouiller");
  r.surPoint = { bouton: btn && btn.textContent, message: journ.filter(t=>/vire au blanc/.test(t)).length };
  rep.debris_fouiller = () => ({ ok:true, ajoutes:{ fab_fil:1, fab_servomoteur:1 }, rangs:{ fab_fil:1, fab_servomoteur:3 }, energie:64,
                                 jauges:{ o2:88, sante:80, moral:80 }, etat:null, fini:false });
  rep.debris_sonder = () => ({ ok:true, ici:true, carte:"braise", fini:false, palier:1, tendance:null, sur_point:false });
  btn.click(); await dort(60);
  r.fouille = { args: (appels.filter(a=>a.n==="debris_fouiller").pop()||{}).a, energie: etat.energie, o2: etat.jauges.o2,
                messages: journ.slice(-3), bouton: !!document.querySelector("#debris-surface .debris-fouiller") };

  // 6. Refus : sac, énergie ; puis dernière fouille
  _debris.surPoint = true; majDebris();
  rep.debris_fouiller = () => ({ ok:false, err:"sac", libre:1 });
  document.querySelector("#debris-surface .debris-fouiller").click(); await dort(30);
  r.refusSac = journ.slice(-1)[0];
  rep.debris_fouiller = () => ({ ok:false, err:"energie", energie:4, requis:6 });
  document.querySelector("#debris-surface .debris-fouiller").click(); await dort(30);
  r.refusEnergie = journ.slice(-1)[0];
  rep.debris_fouiller = () => ({ ok:true, ajoutes:{ fab_lame_a_singularite:1 }, rangs:{ fab_lame_a_singularite:4 }, energie:58, etat:null, fini:true });
  document.querySelector("#debris-surface .debris-fouiller").click(); await dort(30);
  r.derniere = { messages: journ.slice(-2), fini: _debris.fini,
                 panneau: document.querySelector("#debris-surface").textContent.replace(/\s+/g," ").trim() };
  const nbSondes = appels.filter(a=>a.n==="debris_sonder").length;
  await voyagerBraise(1400, 800); await dort(30);
  r.apresFini = { nouvellesSondes: appels.filter(a=>a.n==="debris_sonder").length - nbSondes, patrouilleEncore: tentatives };

  // 7. Combat : dureté +20 et 15 XP sur la carte des débris seulement
  tenterPatrouille = tpOrig;
  forceEffective = () => 50; aptCombatFcReduc = () => 0; alea = (a) => a;
  if(typeof aptCombatBonusVictoire === "function") aptCombatBonusVictoire = () => 0;
  if(typeof aptCombatBonusProtocole === "function") aptCombatBonusProtocole = () => 0;
  let xp = []; const gxOrig = gagnerXp; gagnerXp = (n) => { xp.push(n); };
  butinPatrouille = async () => [];
  const rnd = Math.random; Math.random = () => 0.36;   // gagne à dureté 6 (40 %), perd à 26 (32 %)
  await resoudreCombat({}); const gagneDebris = journ.slice(-1)[0];
  Math.random = () => 0.01; await resoudreCombat({}); const xpDebris = xp.slice(-1)[0];
  etat.secteur = "silene";
  Math.random = () => 0.36; await resoudreCombat({}); const gagneSilene = journ.slice(-1)[0];
  Math.random = () => 0.01; await resoudreCombat({}); const xpSilene = xp.slice(-1)[0];
  Math.random = rnd; gagnerXp = gxOrig;
  r.combat = { debris: /neutralisée/.test(gagneDebris) ? "gagné" : "perdu", silene: /neutralisée/.test(gagneSilene) ? "gagné" : "perdu",
               xp: [xpDebris, xpSilene] };

  // 8. La Braise SANS événement : aucune patrouille au sol
  rep.debris_etat = () => ({ actif:false }); await debrisCharger();
  etat.secteur = "braise"; tentatives = 0; tenterPatrouille = () => { tentatives++; };
  await voyagerBraise(1500, 900); await dort(30);
  r.braiseSansEvenement = { patrouille: tentatives, panneauCache: document.querySelector("#debris-surface").hidden };

  // 9. Console dev
  rep.admin_debris_lancer = (a) => ({ ok:true, carte: a.p_carte || "suaire", id:9 });
  rep.admin_debris_arreter = () => ({ ok:true, n:1 });
  rep.debris_etat = () => ({ actif:true, carte:"suaire", fin:"2026-09-29", faites:0, fini:false });
  syncEffetsCombat = async () => {};
  await devDebrisLancer(); r.devLancer = { appel: (appels.filter(a=>a.n==="admin_debris_lancer").pop()||{}).a, msg: journ.slice(-1)[0], carte: _debris.carte };
  rep.debris_etat = () => ({ actif:false });
  await devDebrisArreter(); r.devArreter = { msg: journ.slice(-1)[0], actif: _debris.actif };

  r.erreurs = typeof __erreurs !== "undefined" ? __erreurs : undefined;
  return r;
})();
