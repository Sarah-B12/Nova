// v1.67 — Le casse (node outils/o_banc.js . casse)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  const appels = [];
  sauverMaintenant = async () => {}; confirmerJoli = async () => true;
  let ICI = null; villeActuelle = () => ICI;
  const base = { id:21, type:"casse", nom:"Le casse", intro:"Un marché, ses vitrines…", secrete:true, revele:true, difficulte:"rude",
    niveau_min:20, taille_min:2, taille_max:4, postes:{ crocheteur:1, guetteur:1 }, statut:"en_cours", test:false, refus:null,
    mon_groupe:8, mon_statut:"actif", deja:true, mesure:"facile", invitations:[], epreuve:{ tentatives:0 },
    coffre:{ vide:false, minimum:true, scelle:false, mes_depots:{}, sortes:[] },
    groupes:[{ id:8, ouvert:false, statut:"lance", fondateur:"Testeuse", moi_fondateur:true, membres:[{nom:"Testeuse",statut:"actif",moi:true},{nom:"Eve",statut:"actif"}] }] };
  let LECTURE;
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push(nom + " " + JSON.stringify(a||{}));
    if(nom === "missions_lire") return Promise.resolve({ data:LECTURE, error:null });
    if(nom.startsWith("casse_")) return Promise.resolve({ data:{ ok:true, reussi:true, offres:6 }, error:null });
    return orig(nom, a); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => corps().textContent.replace(/\s+/g, " ");
  const voir = async (vue) => { LECTURE = { ok:true, jour:"2026-12-21", gains:[], missions:[ Object.assign({}, base, { vue }) ] };
    _queteSous = "missions"; await missionsCharger(); majQueteHub(); await new Promise(x => setTimeout(x, 30)); };
  const fac = FACTIONS[1].id;
  const ronde = { n:6, observe:8, avance:3, boucles:[[0,1,7,6], [20,21,22,21]] };
  // 1. Cible choisie, pas de repérage : sélecteur pour le meneur ; ronde seulement dans la cité.
  await voir({ phase:"preparation", limite:"2026-12-23", cible:fac, meneur:true, postes_tenus:{ crocheteur:"Testeuse", guetteur:"Eve" }, ronde });
  r.selecteur = !!corps().querySelector("#mi-cible") && corps().querySelector("#mi-cible").value === fac;
  r.loin = txt().includes("Le repérage se fait dans la cité visée") && !corps().querySelector("#mi-ronde");
  ICI = fac; await voir({ phase:"preparation", limite:"2026-12-23", cible:fac, meneur:true, postes_tenus:{}, ronde });
  r.ronde = !!corps().querySelector("[data-ro-go]") && corps().querySelectorAll(".mi-ro-case").length === 36;
  // Réponses : phase « répondre » forcée (l'observation dure 8 × 450 ms).
  _ronde.phase = "repondre"; _mRondeMaj(document.querySelector("#hub-quete"));
  corps().querySelector('[data-ro-case="7"]').click(); corps().querySelector('[data-ro-case="21"]').click();
  await new Promise(x => setTimeout(x, 80));
  const ar = appels.find(a => a.startsWith("casse_ronde"));
  r.appelRonde = ar && JSON.parse(ar.slice(12)).p_reponses.join(",") === "7,21";
  // 2. Repérage fait hier : « Commencer le casse » (meneur) ; absent → grisé.
  const rep = { par:"Eve", jour:"2026-12-20", vendeurs:12, niveau:2 };
  await voir({ phase:"preparation", limite:"2026-12-23", cible:fac, meneur:true, postes_tenus:{}, reperage:rep, absent:"Eve" });
  r.cibleInfo = txt().includes("12 vendeurs en vitrine, Bien gardé");
  r.absentGrise = corps().querySelector("[data-mi-commencer]").disabled && txt().includes("il manque Eve");
  await voir({ phase:"preparation", limite:"2026-12-23", cible:fac, meneur:true, postes_tenus:{}, reperage:rep, absent:null });
  corps().querySelector("[data-mi-commencer]").click(); await new Promise(x => setTimeout(x, 80));
  r.appelCommencer = appels.some(a => a.startsWith("casse_commencer"));
  // Repérage fait aujourd'hui : demain.
  await voir({ phase:"preparation", limite:"2026-12-23", cible:fac, meneur:true, postes_tenus:{}, reperage:Object.assign({}, rep, { jour:"2026-12-21" }) });
  r.demain = txt().includes("Le casse peut se tenter dès demain.") && !corps().querySelector("[data-mi-commencer]");
  // 3. Le casse : goupilles (crocheteur).
  await voir({ phase:"casse", cible:fac, meneur:true, mon_poste:"crocheteur", postes_tenus:{}, reperage:rep, casse:{ jour:"2026-12-21", faits:{} } });
  r.goupilles = txt().includes("Goupille 1 sur 5");
  for(let k = 0; k < 5; k++){ _goup.pos = 0.5; corps().querySelector("[data-gp-bloquer]").dispatchEvent(new MouseEvent("pointerdown", { bubbles:true, cancelable:true })); }
  await new Promise(x => setTimeout(x, 80));
  r.appelGoupilles = appels.some(a => a.startsWith("casse_poste"));
  await voir({ phase:"casse", cible:fac, meneur:true, mon_poste:"crocheteur", postes_tenus:{}, reperage:rep, casse:{ jour:"2026-12-21", faits:{} } });
  _goup.pos = 0.02; corps().querySelector("[data-gp-bloquer]").dispatchEvent(new MouseEvent("pointerdown", { bubbles:true, cancelable:true }));
  r.goupilleRatee = _goup.k === 0;
  // Brouillage (guetteur) : rendu.
  await voir({ phase:"casse", cible:fac, meneur:false, mon_poste:"guetteur", postes_tenus:{}, reperage:rep, casse:{ jour:"2026-12-21", faits:{ crocheteur:true } } });
  r.brouillage = !!corps().querySelector("#mi-br-f") && txt().includes("tiens-la 5 secondes");
  // Les deux faits : « Vider les vitrines ».
  await voir({ phase:"casse", cible:fac, meneur:false, mon_poste:"guetteur", postes_tenus:{}, reperage:rep, casse:{ jour:"2026-12-21", faits:{ crocheteur:true, guetteur:true } } });
  corps().querySelector("[data-mi-vider]").click(); await new Promise(x => setTimeout(x, 80));
  r.appelVider = appels.some(a => a.startsWith("casse_vider"));
  // 4. La cape.
  r.cape = { slot: slotEquip("cape_voleur"), brade: valeurBrade("cape_voleur"), vie: dureeVie("cape_voleur"), perso: estObjetPersonnel("cape_voleur"), pasDeMarche: !PRIX_ITEM.cape_voleur };
  return r;
})();
