// v3.23 — l'onglet Missions suit le joueur (node outils/o_banc.js . v323)
// Retour de l'autrice : arrivée sur Mousseron, l'onglet Missions ne montrait pas
// le bouton de la bouture avant un rechargement de la page.
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  let ICI = false;
  etat.secteur = "ecart";
  enEcart = () => true;
  const surLieu0 = surLieuEspace;
  surLieuEspace = l => (l && l.id === "pp_vert") ? ICI : false;
  sauverMaintenant = async () => {};
  const base = { id:7, type:"bouture", nom:"La bouture capricieuse", intro:"Sur Mousseron, au milieu des mousses géantes…",
    secrete:false, revele:true, difficulte:"facile", niveau_min:8, taille_min:2, taille_max:4, postes:{}, statut:"en_cours", test:false,
    refus:null, mon_groupe:3, mon_statut:"actif", deja:true, mesure:"facile", coffre:null, invitations:[],
    groupes:[{ id:3, ouvert:true, statut:"lance", fondateur:"Bob", moi_fondateur:false, membres:[{nom:"Bob",statut:"actif"},{nom:"Testeuse",statut:"actif",moi:true}] }] };
  const drones = { phase:"drones", limite:"2026-11-22", tentatives:0, jours:[] };
  let LECTURE = { ok:true, jour:"2026-11-21", gains:[], missions:[ Object.assign({}, base, { vue:drones }) ] };
  let lectures = 0;
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => {
    if(nom === "missions_lire"){ lectures++; return Promise.resolve({ data:JSON.parse(JSON.stringify(LECTURE)), error:null }); }
    if(nom === "mission_chat_nouveaux") return Promise.resolve({ data:{ ok:true, groupes:{} }, error:null });
    return orig(nom, a); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => (corps() ? corps().textContent : "").replace(/\s+/g, " ");
  const bouton = () => !!(corps() && corps().querySelector("[data-mi-fuir]"));
  const toucher = () => document.querySelector("#hub-quete").dispatchEvent(new Event("pointerdown", { bubbles:true }));

  // 1. Loin de Mousseron, l'onglet Missions ouvert.
  await missionsCharger();
  changerHub("quete"); _queteSous = "missions"; majQueteHub(); await dort(50);
  r.loin = { onglet: !document.querySelector("#hub-quete").hidden, rendsToi: txt().includes("Rends-toi sur Mousseron"), bouton: bouton() };

  // 2. Le vol vers Mousseron (majApresDeplacement, comme volVers) : le bouton doit paraître.
  ICI = true; majApresDeplacement(); await dort(50);
  r.arrivee = { bouton: bouton(), rendsToi: txt().includes("Rends-toi sur Mousseron") };

  // 3. On repart : le bouton disparaît.
  ICI = false; majApresDeplacement(); await dort(50);
  r.depart = { bouton: bouton(), rendsToi: txt().includes("Rends-toi sur Mousseron") };

  // 4. Même si on a touché l'onglet juste avant de partir (garde des 90 secondes).
  toucher(); ICI = true; majApresDeplacement(); await dort(50);
  r.arriveeApresToucher = bouton();

  // 5. Sur place, sans bouger : la garde des 90 secondes protège toujours une partie en cours.
  toucher();
  corps().insertAdjacentHTML("beforeend", `<div id="partie-en-cours"></div>`);
  LECTURE.missions[0].vue = Object.assign({}, drones, { tentatives:0, limite:"2026-11-23" });
  await missionsCharger(); missionsRedessiner(); await dort(50);
  r.partieGardee = !!document.querySelector("#partie-en-cours");
  majHub(); await dort(50);
  r.partieGardeeHub = !!document.querySelector("#partie-en-cours");

  // 6. Revenir sur l'onglet Quêtes relit les missions (état d'il y a 2 minutes).
  ICI = true;
  changerHub("boutique"); await dort(20);
  LECTURE.missions[0].vue = { phase:"soins", soin_debut:"2026-11-21", jour_soin:1, moi_soigne:false,
    jours:[{ jour:"2026-11-21", n:1, soigneurs:[] }, { jour:"2026-11-22", n:2, soigneurs:[] }, { jour:"2026-11-23", n:3, soigneurs:[] }, { jour:"2026-11-24", n:4, soigneurs:[] }],
    grille:{ cs:1, ce:3, cailloux:[0, 4, 12], limite:9 } };
  const avant = lectures;
  document.querySelector('.hub-lien[data-hub="quete"]').click(); await dort(80);
  r.relu = { lecture: lectures > avant, soins: txt().includes("Jour 1 sur 4 — la bouture a soif"), racines: !!corps().querySelector("#mi-racines") };

  // 7. Les autres lieux de mission sont dans la signature (Bardane, la balise, l'entrepôt).
  const sig0 = _queteSignature();
  surLieuEspace = l => (l && l.id === "satellite1");
  r.bardane = _queteSignature() !== sig0;
  surLieuEspace = surLieu0;
  return r;
})();
