// v1.65 — L'infiltration (node outils/o_banc.js . infiltration)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  const appels = [];
  sauverMaintenant = async () => {};
  confirmerJoli = async () => true;
  etat.secteur = "braise"; etat.surface = { x:1656, y:875 };
  const Z = { x:900, y:700, r:350 }, E = { x:1000, y:800 };
  const base = { id:11, type:"infiltration", nom:"L'infiltration", intro:"Sous la cendre de La Braise…",
    secrete:false, revele:true, difficulte:"rude", niveau_min:20, taille_min:3, taille_max:5,
    postes:{ artificier:1, porteur:4 }, statut:"en_cours", test:false, refus:null, mon_groupe:5, mon_statut:"actif",
    deja:true, mesure:"equilibree", invitations:[], epreuve:{ tentatives:0 },
    coffre:{ vide:false, minimum:true, scelle:false, mes_depots:{}, sortes:[] },
    groupes:[{ id:5, ouvert:true, statut:"lance", fondateur:"Bob", moi_fondateur:false, membres:[{nom:"Bob",statut:"actif"},{nom:"Testeuse",statut:"actif",moi:true}] }] };
  let LECTURE, RELEVE = { ok:true, trouvee:false };
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push(nom + " " + JSON.stringify(a||{}));
    if(nom === "missions_lire") return Promise.resolve({ data:LECTURE, error:null });
    if(nom === "infiltration_relever") return Promise.resolve({ data:RELEVE, error:null });
    if(nom === "caisse_ouvrir") return Promise.resolve({ data:{ ok:true, objets:{ fab_composant_avance:2, cristal:1 } }, error:null });
    if(nom.startsWith("infiltration_")) return Promise.resolve({ data:{ ok:true, score:0.9 }, error:null });
    return orig(nom, a); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => corps().textContent.replace(/\s+/g, " ");
  const voir = async (vue) => { LECTURE = { ok:true, jour:"2026-12-10", gains:[], missions:[ Object.assign({}, base, { vue }) ] };
    _queteSous = "missions"; await missionsCharger(); majQueteHub(); await new Promise(x => setTimeout(x, 30)); };
  const vb = { limite:"2026-12-12", zone:Z, tentatives:0, artificier:"Testeuse", porteurs:[{nom:"Bob",score:null}] };

  // 1. Relevé : la zone sur la carte, pas l'entrée ; un pas dans la zone interroge le serveur.
  await voir(Object.assign({ phase:"releve", mon_poste:"artificier" }, vb));
  r.zone = missionsMarqueursCarte("braise").includes("quelque part par ici") && !missionsMarqueursCarte("braise").includes("<rect");
  r.texteReleve = txt().includes("Cherche l'entrée dans la zone marquée") && txt().includes("au plus tard le samedi 12 décembre");
  etat.surface = { x:2300, y:1500 }; await missionsApresPas();
  r.horsZoneMuet = !appels.some(a => a.startsWith("infiltration_relever"));
  etat.surface = { x:950, y:720 }; await missionsApresPas();
  r.dansZoneDemande = appels.some(a => a.startsWith("infiltration_relever"));
  // 2. Brèche : la paroi, les charges limitées.
  const paroi = { w:7, h:5, portee:3, fissures:[[0,1],[1,2]], piliers:[0,2] };
  etat.surface = { x:1010, y:800 };
  await voir(Object.assign({ phase:"breche", mon_poste:"artificier", entree:E, charges:2, paroi, trouvee_par:"Bob" }, vb));
  r.entreeCarte = missionsMarqueursCarte("braise").includes("L'entrepôt d'AREPO");
  r.lieuIci = (missionsLieuIci() || "").includes("Une porte de cendre et de métal");
  const n = i => corps().querySelector(`[data-p-noeud="${i}"]`);
  n(1).dispatchEvent(new window.Event("click")); n(5).dispatchEvent(new window.Event("click")); n(6).dispatchEvent(new window.Event("click"));
  r.chargesMax = _paroi.charges.length === 2 && txt().includes("Charges : 0 / 2");
  n(5).dispatchEvent(new window.Event("click"));
  r.chargeRetiree = _paroi.charges.join(",") === "1";
  corps().querySelector("[data-p-feu]").click(); await new Promise(x => setTimeout(x, 80));
  const ab = appels.find(a => a.startsWith("infiltration_breche"));
  r.appelBreche = ab && JSON.parse(ab.slice(20)).p_charges.join(",") === "1";
  // 3. Rangement : poser, tourner, retirer, valider.
  const rg = { w:6, h:5, pieces:[ [[0,0],[1,0]], [[0,0],[0,1],[1,1]], [[0,0]] ] };
  await voir(Object.assign({ phase:"rangement", mon_poste:"porteur", entree:E, charges:2, rangement:rg }, vb));
  const c = i => corps().querySelector(`[data-rg-case="${i}"]`);
  c(0).click();                                  // pièce 0 en (0,0)-(1,0)
  corps().querySelector("[data-rg-tourner]").click();   // pièce 1 tournée
  c(4).click();
  r.rempli = txt().includes("Rempli : 17 %");    // 5 cases sur 30
  c(20).click(); r.troisPosees = _rang.pose.length === 3;
  c(17).click(); r.dejaToutPose = _rang.pose.length === 3;
  c(0).click(); r.retrait = !_rang.pose.some(p => p.p === 0);
  r.boutonValider = corps().querySelector("[data-rg-valider]") ? corps().querySelector("[data-rg-valider]").disabled : "absent";
  corps().querySelector("[data-rg-valider]").click(); await new Promise(x => setTimeout(x, 150));
  r.appelRanger = appels.some(a => a.startsWith("infiltration_ranger"));
  // 4. Sentinelles.
  await voir(Object.assign({ phase:"sentinelles", mon_poste:"porteur", entree:E }, vb));
  r.sentinelles = !!corps().querySelector("[data-mi-sentinelles]") && txt().includes("vous barrent la sortie");
  // 5. La caisse : objet, menu, ouverture.
  r.caisse = { nom: item("caisse_arepo_5").nom, perso: estObjetPersonnel("caisse_arepo_5") };
  await ouvrirCaisseArepo("caisse_arepo_3");
  r.ouverture = appels.some(a => a.startsWith("caisse_ouvrir {\"p_item\":\"caisse_arepo_3\"}"));
  return r;
})();
