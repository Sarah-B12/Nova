// v1.63 — La bouture capricieuse (node outils/o_banc.js . bouture)
// Panneau de la mission (drones, soins, « Les racines »), Mousse-amie sur le
// terrain, objets personnels hors de la Poste.
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  const appels = [];
  let ICI = false;
  enEcart = () => ICI; surLieuEspace = () => ICI;
  sauverMaintenant = async () => {};
  const G = { cs:1, ce:3, cailloux:[0, 4, 12], limite:9 };
  const base = { id:7, type:"bouture", nom:"La bouture capricieuse", intro:"Sur Mousseron, au milieu des mousses géantes…",
    secrete:false, revele:true, difficulte:"facile", niveau_min:8, taille_min:2, taille_max:4, postes:{}, statut:"en_cours", test:false,
    refus:null, mon_groupe:3, mon_statut:"actif", deja:true, mesure:"facile", coffre:null, invitations:[],
    groupes:[{ id:3, ouvert:true, statut:"lance", fondateur:"Bob", moi_fondateur:false, membres:[{nom:"Bob",statut:"actif"},{nom:"Testeuse",statut:"actif",moi:true}] }] };
  let LECTURE;
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push(nom + " " + JSON.stringify(a||{}));
    if(nom === "missions_lire") return Promise.resolve({ data:LECTURE, error:null });
    if(nom === "bouture_faire_fuir") return Promise.resolve({ data:{ ok:true, reussi:true, definitif:false, tentative:1 }, error:null });
    if(nom === "bouture_soigner") return Promise.resolve({ data:{ ok:true, jour:2 }, error:null });
    return orig(nom, a); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => corps().textContent.replace(/\s+/g, " ");
  const voir = async (vue) => { LECTURE = { ok:true, jour:"2026-11-04", gains:[], missions:[ Object.assign({}, base, { vue }) ] };
    _queteSous = "missions"; await missionsCharger(); majQueteHub(); await new Promise(x => setTimeout(x, 30)); };

  // 1. Drones, loin de Mousseron.
  await voir({ phase:"drones", limite:"2026-11-05", tentatives:0, jours:[] });
  r.intro = txt().includes("Sur Mousseron, au milieu");
  r.loin = txt().includes("Rends-toi sur Mousseron (carte de Triptolème)") && txt().includes("jeudi 5 novembre") && !corps().querySelector("[data-mi-fuir]");
  // 2. Sur place : le bouton.
  ICI = true; await voir({ phase:"drones", limite:"2026-11-05", tentatives:0, jours:[] });
  const bf = corps().querySelector("[data-mi-fuir]");
  r.bouton = bf && bf.textContent === "Faire fuir les drones";
  bf.click(); await new Promise(x => setTimeout(x, 80));
  r.appelFuir = appels.some(a => a.startsWith("bouture_faire_fuir {\"p_mission\":7}"));
  // 3. Premier échec le jour même : pas de bouton.
  await voir({ phase:"drones", limite:"2026-11-05", tentatives:1, epreuve_jour:"2026-11-04", jours:[] });
  r.retenter = txt().includes("Vous pourrez retenter demain.") && txt().includes("du jeudi 5 novembre au vendredi 6 novembre") && !corps().querySelector("[data-mi-fuir]");
  // 4. Soins : la grille, un tracé, « Faire boire ».
  const jours = [{ jour:"2026-11-03", n:1, soigneurs:["Bob"] }, { jour:"2026-11-04", n:2, soigneurs:["Bob"] }, { jour:"2026-11-05", n:3, soigneurs:[] }, { jour:"2026-11-06", n:4, soigneurs:[] }];
  await voir({ phase:"soins", soin_debut:"2026-11-03", jour_soin:2, moi_soigne:false, jours, grille:G });
  r.soins = { jours: corps().querySelectorAll(".mi-jour").length, deja: txt().includes("Quelqu'un est passé aujourd'hui"),
    titre: txt().includes("Jour 2 sur 4 — la bouture a soif. Relie-la à l'eau."), cailloux: corps().querySelectorAll(".mi-r-case.caillou").length,
    boireGrise: corps().querySelector("[data-r-boire]").disabled };
  // Chemin : (0,1) ↓ (1,1) ↓ (2,1) ↓ (3,1) → (3,2) → (3,3) ↓ (4,3) ↓ eau.
  const poser = (i, t, tours) => { const z = corps(); [...z.querySelectorAll("[data-r-outil]")].find(b => b.dataset.rOutil === t).click();
    corps().querySelector(`[data-r-case="${i}"]`).click(); for(let k = 0; k < tours; k++) corps().querySelector(`[data-r-case="${i}"]`).click(); };
  poser(1, "I", 0); poser(6, "I", 0); poser(11, "I", 0);
  poser(16, "L", 0);   // N+E
  poser(17, "I", 1);   // E+O
  poser(18, "L", 2);   // S+O
  poser(23, "I", 0);
  r.atteint = txt().includes("Les racines atteignent l'eau.") && !corps().querySelector("[data-r-boire]").disabled
            && txt().includes("Racines : 7 / 9");
  poser(23, "X", 0);
  r.efface = txt().includes("Les racines n'atteignent pas encore l'eau.") && txt().includes("Racines : 6 / 9");
  poser(23, "I", 0);
  corps().querySelector("[data-r-boire]").click(); await new Promise(x => setTimeout(x, 80));
  const ap = appels.find(a => a.startsWith("bouture_soigner"));
  r.appelSoin = ap && JSON.parse(ap.slice(16)).p_pieces.length === 7;
  // 5. Déjà soigné / loin.
  await voir({ phase:"soins", soin_debut:"2026-11-03", jour_soin:2, moi_soigne:true, jours, grille:G });
  r.moiSoigne = txt().includes("Tu as soigné la bouture aujourd'hui.") && !corps().querySelector("#mi-racines");
  ICI = false; await voir({ phase:"soins", soin_debut:"2026-11-03", jour_soin:2, moi_soigne:false, jours, grille:G });
  r.soinLoin = txt().includes("Rends-toi sur Mousseron pour la soigner.") && !corps().querySelector("#mi-racines");
  // 6. Mousse-amie sur le terrain.
  etat.terrain.parcelles = Array(N_PLOTS).fill(null);
  etat.terrain.parcelles[7] = { type:"biodome", cases:[{ plante:"sylve", croissance:0, arrose:0, soin:Date.now() }, null, null, null] };
  etat.terrain.parcelles[8] = { type:"mousse", pose: Date.now() - 3 * 86400000 };
  r.voisins = { sept: mousseVoisine(7), treize: mousseVoisine(13), quatorze: mousseVoisine(14), neuf: mousseVoisine(9) };
  r.joursRestants = mousseJoursRestants(etat.terrain.parcelles[8]);
  etat.terrain.parcelles[8].pose = Date.now() - 11 * 86400000;
  r.morte = !mousseVoisine(7);
  // 7. Objet personnel : propre, avec sa fiche.
  r.objet = { nom: item("mousse_amie").nom, perso: estObjetPersonnel("mousse_amie"), vie: dureeVie("mousse_amie"), pasDePrix: !PRIX_ITEM.mousse_amie };
  return r;
})();
