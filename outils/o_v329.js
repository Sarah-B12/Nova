// v3.29 — le casse de la Poste (node outils/o_banc.js . v329) ; le casse d'un marché, inchangé (o_casse.js).
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  _mEssais = new Proxy({}, { get: () => true }); _mEssaiPayer = async () => true;
  const appels = []; let confirmTxt = "";
  sauverMaintenant = async () => {}; confirmerJoli = async (t, m) => { confirmTxt = m; return true; };
  let BASE = false; surBase = () => BASE; villeActuelle = () => null;
  let REP = { ok:true, reussi:true, offres:7, poste:true };
  const base = { id:21, type:"casse", nom:"Le casse", intro:"…", secrete:true, revele:true, difficulte:"rude",
    niveau_min:20, taille_min:2, taille_max:4, postes:{ crocheteur:1, guetteur:1 }, statut:"en_cours", test:false, refus:null,
    mon_groupe:8, mon_statut:"actif", deja:true, mesure:"facile", invitations:[], epreuve:{ tentatives:0 },
    coffre:{ vide:false, minimum:true, scelle:false, mes_depots:{}, sortes:[] },
    groupes:[{ id:8, ouvert:false, statut:"lance", fondateur:"Testeuse", moi_fondateur:true, membres:[{nom:"Testeuse",statut:"actif",moi:true},{nom:"Eve",statut:"actif"}] }] };
  let LECTURE;
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push({ nom, a });
    if(nom === "missions_lire") return Promise.resolve({ data:LECTURE, error:null });
    if(nom.startsWith("casse_")) return Promise.resolve({ data:REP, error:null });
    return orig(nom, a); };
  const journ = []; journal = t => journ.push(t);
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => corps().textContent.replace(/\s+/g, " ");
  const voir = async (vue, g) => { const m = Object.assign({}, base, { vue }); if(g) m.groupes = [Object.assign({}, base.groupes[0], g)];
    LECTURE = { ok:true, jour:"2026-12-21", gains:[], missions:[ m ] };
    _queteSous = "missions"; await missionsCharger(); majQueteHub(); await dort(30); };
  const ronde = { n:6, observe:8, avance:3, boucles:[[0,1,7,6], [20,21,22,21]] };

  // 1. Le sélecteur propose la Poste ; on la vise.
  await voir({ phase:"preparation", limite:"2026-12-23", cible:null, meneur:true, postes_tenus:{}, ronde });
  const sel = corps().querySelector("#mi-cible");
  r.option = !!sel && [...sel.options].some(o => o.value === "poste" && o.textContent.includes("La Poste")) && [...sel.options].some(o => o.textContent.startsWith("Le marché de"));
  r.aide = txt().includes("La Poste est mieux gardée qu'un marché");
  sel.value = "poste"; corps().querySelector("[data-mi-viser]").click(); await dort(80);
  const ac = appels.find(x => x.nom === "casse_cible"); r.appelCible = ac && ac.a.p_faction === "poste";

  // 2. Cible Poste, loin du Perchoir : « Rends-toi au Perchoir » ; au Perchoir : la ronde.
  await voir({ phase:"preparation", limite:"2026-12-23", cible:"poste", meneur:true, postes_tenus:{}, ronde });
  r.cible = txt().includes("Cible : la Poste, au centre de tri du Perchoir");
  r.loin = txt().includes("Rends-toi au Perchoir pour le faire") && !corps().querySelector("#mi-ronde");
  r.etape = txt().includes("Un marché ou le centre de tri de la Poste");
  BASE = true; r.signature = missionsLieux().endsWith("true");
  await voir({ phase:"preparation", limite:"2026-12-23", cible:"poste", meneur:true, postes_tenus:{}, ronde });
  r.ronde = !!corps().querySelector("#mi-ronde") && txt().includes("au centre de tri du Perchoir");

  // 3. Le repérage : des colis, pas des vendeurs ; absent → « au Perchoir » ; le message de confirmation.
  const rp = { par:"Eve", jour:"2026-12-20", vendeurs:9, niveau:2, poste:true, destinataires:6 };
  await voir({ phase:"preparation", limite:"2026-12-23", cible:"poste", meneur:true, postes_tenus:{}, reperage:rp, absent:"Eve" });
  r.reperage = txt().includes("9 colis attendaient au tri, pour 6 destinataires, bien gardé") && !txt().includes("vendeur");
  r.absent = txt().includes("Toute l'équipe doit être au Perchoir (il manque Eve)");
  await voir({ phase:"preparation", limite:"2026-12-23", cible:"poste", meneur:true, postes_tenus:{}, reperage:Object.assign({}, rp, { vendeurs:0, destinataires:0 }), absent:null });
  r.reperageVide = txt().includes("aucun colis n'attendait au tri");
  corps().querySelector("[data-mi-commencer]").click(); await dort(80);
  r.confirmer = confirmTxt.includes("Personne ne doit quitter le Perchoir");
  await voir({ phase:"preparation", limite:"2026-12-23", cible:"poste", meneur:false, postes_tenus:{}, reperage:rp, absent:null }, { moi_fondateur:false });
  r.pasMeneur = txt().includes("quand toute l'équipe sera au Perchoir");

  // 4. Le casse : « Personne ne quitte le Perchoir », puis « Vider les casiers du tri », message de réussite.
  await voir({ phase:"casse", cible:"poste", meneur:false, mon_poste:null, postes_tenus:{}, reperage:rp, casse:{ jour:"2026-12-21", faits:{ crocheteur:true } } });
  r.reste = txt().includes("vider les casiers. Personne ne quitte le Perchoir");
  await voir({ phase:"casse", cible:"poste", meneur:false, mon_poste:"guetteur", postes_tenus:{}, reperage:rp, casse:{ jour:"2026-12-21", faits:{ crocheteur:true, guetteur:true } } });
  const bv = corps().querySelector("[data-mi-vider]");
  r.bouton = bv && bv.textContent === "Vider les casiers du tri" && txt().includes("Étape 3 sur 3 — Les casiers");
  bv.click(); await dort(120);
  r.reussite = journ.some(t => String(t).includes("7 colis emportés"));
  REP = { ok:true, reussi:false, definitif:false, poste:true };
  await voir({ phase:"casse", cible:"poste", meneur:false, mon_poste:"guetteur", postes_tenus:{}, reperage:rp, casse:{ jour:"2026-12-21", faits:{ crocheteur:true, guetteur:true } } });
  corps().querySelector("[data-mi-vider]").click(); await dort(120);
  r.echec = journ.some(t => String(t).includes("pendant que vous vidiez les casiers"));

  // 5. Le marché, inchangé.
  const fac = FACTIONS[1].id; REP = { ok:true, reussi:true, offres:6 };
  await voir({ phase:"casse", cible:fac, meneur:false, mon_poste:"guetteur", postes_tenus:{}, reperage:{ par:"Eve", jour:"2026-12-20", vendeurs:12, niveau:2 }, casse:{ jour:"2026-12-21", faits:{ crocheteur:true, guetteur:true } } });
  const bm = corps().querySelector("[data-mi-vider]");
  r.marche = bm && bm.textContent === "Vider les vitrines" && txt().includes("Cible : le marché de") && txt().includes("12 vendeurs en vitrine");
  bm.click(); await dort(120);
  r.marcheMsg = journ.some(t => String(t).includes("6 offres emportées"));
  return r;
})();
