// v3.33 — vérification « quêtes » (node outils/o_banc.js . v333) : le combat de quête est décidé par le SERVEUR
// (quete_combat, v329, K328) ; le jeu suit son issue, dit ses refus (pause, prison, tot, hors_quete), garde en attente un
// gain de Cercle « tot » (K327). Et l'atout du jeu (_combatStats) = _quete_atout du serveur sur les mêmes cas (essais PG16).
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const journ = []; journal = t => journ.push(String(t));
  const appels = []; let REP = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push({ nom, a });
    if(REP[nom]) return Promise.resolve({ data:REP[nom], error:null });
    return orig(nom, a); };
  sauverMaintenant = async () => {}; sauverSurServeur = () => {}; sauvegarder = () => {}; afficher = () => {};
  let reussi = 0, echec = null; reussirDefi = () => { reussi++; }; echouerDefi = t => { echec = t; };
  let ordre = []; consommerMunitions = async () => { ordre.push("munitions"); };
  _appliquerCerclesQ = async () => true;
  const combat = async (rep) => {
    REP.quete_combat = rep; reussi = 0; echec = null; journ.length = 0; ordre = [];
    const z = document.createElement("div"); z.innerHTML = '<button id="q-cbt-btn">x</button>';
    etat.quetes = etat.quetes || {}; etat.quetes.active = { id:"q11", etape:3 };
    _wireCombat(z, { nom:"Le gardien", puissance:62, gain:2 });
    const b = z.querySelector("#q-cbt-btn"); b.click(); await dort(50);
    return { reussi, echec, journ:[...journ], bouton:!b.disabled, appel:appels.filter(x => x.nom === "quete_combat").pop() };
  };
  // 1. Victoire nette (le serveur décide, l'étape passe) ; les munitions après l'appel.
  let c = await combat({ ok:true, issue:"nette", perte:0, puissance:62, atout:{ force:70, agilite:10, intelligence:10, best:"force", val:70 } });
  r.nette = c.reussi === 1 && c.journ.includes("Victoire nette.") && c.appel.a.p_quete === "q11" && c.appel.a.p_etape === 3;
  // 2. Victoire arrachée : la santé vient du serveur.
  c = await combat({ ok:true, issue:"arrachee", perte:13, jauges:{ o2:100, sante:87, moral:100 }, atout:{ force:50, agilite:10, intelligence:10, best:"force", val:50 } });
  r.arrachee = c.reussi === 1 && c.journ.includes("Victoire arrachée (−13 santé).") && etat.jauges.sante === 87;
  // 3. Échec : l'étape se verrouille.
  c = await combat({ ok:true, issue:"echec", perte:12, jauges:{ o2:100, sante:75, moral:100 }, atout:{ force:20, agilite:10, intelligence:10, best:"force", val:20 } });
  r.echec = c.reussi === 0 && /te domine \(−12 santé\)/.test(c.echec || "") && etat.jauges.sante === 75;
  // 4. Refus : dit, le bouton se rouvre, rien ne passe.
  c = await combat({ ok:false, err:"tot" });
  r.refusTot = c.reussi === 0 && !c.echec && c.bouton && c.journ.includes(QUETE_REFUS_GESTE.tot);
  c = await combat({ ok:false, err:"pause" });
  r.refusPause = c.journ.includes("Tu es en pause : les quêtes attendent ton retour.") && c.reussi === 0;
  // 5. Cercle « tot » : gardé en attente (pas perdu).
  delete etat.cerclesAttente;
  REP.cercles_ajouter = { ok:false, err:"tot" };
  r.cercleTot = (await _envoyerCercles("q12:6", { racines:5 })) === "echec";
  REP.cercles_ajouter = { ok:false, err:"hors_quete" };
  r.cercleHorsQuete = (await _envoyerCercles("q12:6", { racines:5 })) === "refuse";
  // 6. Gain de choix « tot » : en attente.
  delete etat.choixAttente; REP.quete_choix_gain = { ok:false, err:"tot" };
  await _gainChoixQ("q12", 0);
  r.choixTot = !!(etat.choixAttente && etat.choixAttente.q12 === 0);
  // 7. Refus de fin de quête nouveaux.
  r.refusFin = ["pause","combat","affut","bete"].every(k => typeof QUETE_REFUS[k] === "string");
  // 8. L'atout du jeu = celui du serveur (essais PG16 : 25/15/15, 41, 33/15/20, 10/5/6, égalité → agilité).
  etat.competences = { force:20, agilite:10, intelligence:10 };
  etat.equipement = { tete:null, torse:null, jambes:null, arme:"fab_pistolet_a_plasma", arme2:"fab_pistolet_a_plasma", drone:null, implant:"fab_implant_maitre" };
  etat.sac = {}; etat.munEntamees = {}; etat.boisson = null; etat.jauges = { o2:100, sante:100, moral:100 };
  const s1 = _combatStats();
  etat.munEntamees = { fab_munitions_a_plasma:3 };
  const s2 = _combatStats();
  etat.boisson = { mods:{ force:-8, intelligence:5 }, fin: new Date(Date.now() + 86400e3).toISOString() };
  const s3 = _combatStats();
  etat.jauges.moral = 0;
  const s4 = _combatStats();
  etat.jauges.moral = 100; etat.boisson = null; etat.equipement = { tete:null, torse:null, jambes:null, arme:null, arme2:null, drone:null, implant:null };
  etat.competences = { force:10, agilite:30, intelligence:30 };
  const s5 = _combatStats();
  r.atout = [s1.force, s1.agilite, s1.intelligence, s2.force, s3.force, s3.agilite, s3.intelligence, s4.force, s4.agilite, s4.intelligence, s5.best].join(",");
  r.atoutIdentique = r.atout === "25,15,15,41,33,15,20,10,5,6,agilite";
  // 9. Message d'abandon : 5 h, plus « minuit ».
  r.abandon = !/jusqu'à minuit/.test(abandonnerQuete.toString()) && /VERROU_DEFI_H\} h/.test(abandonnerQuete.toString());
  r.version = document.querySelector('link[href*="base.css"]').getAttribute("href");
  return r;
})()
