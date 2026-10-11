// v1.64 — La balise sous la glace (node outils/o_banc.js . balise)
// Marqueur de la carte, panneau (préparation, descente), « La crevasse »,
// « Le message », « Le nœud » (tracé suivi), régulateur au vaisseau.
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  const appels = [];
  sauverMaintenant = async () => {};
  confirmerJoli = async () => true;
  etat.secteur = "suaire"; etat.surface = { x:1000, y:610 };
  const B = { x:2000, y:1300 };
  // Labyrinthe 3 × 3 minuscule pour le banc : couloir en S.
  const crev = { n:3, cs:0, ce:2, pas:8, rayon:1, cases:[4, 0, 0, 1|2, 8|4, 0, 0, 1|2, 8] };   // (0,0)→S(1,0)→E(1,1)→S(2,1)→E(2,2)
  const base = { id:9, type:"balise", nom:"La balise sous la glace", intro:"Sous la glace du Suaire…",
    secrete:false, revele:true, difficulte:"rude", niveau_min:20, taille_min:3, taille_max:4,
    postes:{ encordeur:1, eclaireur:1, dechiffreur:1 }, statut:"en_cours", test:false, refus:null, mon_groupe:4, mon_statut:"actif",
    deja:true, mesure:"equilibree", invitations:[], epreuve:{ tentatives:0 },
    coffre:{ vide:false, minimum:true, scelle:false, mes_depots:{},
      sortes:[ { id:"lampe", nom:"Lampes", min:3, max:9, unites:3, recettes:[{ fab_cellule_d_energie:1, fab_composant_avance:1 }] } ] },
    groupes:[{ id:4, ouvert:true, statut:"lance", fondateur:"Bob", moi_fondateur:false,
      membres:[{nom:"Bob",statut:"actif",poste:"encordeur"},{nom:"Testeuse",statut:"actif",moi:true,poste:"eclaireur"},{nom:"Eve",statut:"actif",poste:"dechiffreur"}] }] };
  let LECTURE;
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push(nom + " " + JSON.stringify(a||{}));
    if(nom === "missions_lire") return Promise.resolve({ data:LECTURE, error:null });
    if(nom === "vaisseau_installer") return Promise.resolve({ data:{ ok:true, type:"regulateur", expire_le:new Date(Date.now()+15*864e5).toISOString() }, error:null });
    if(nom.startsWith("balise_") || nom === "mission_deposer_unites") return Promise.resolve({ data:{ ok:true, unites:2, sens:"Demande de confirmation" }, error:null });
    return orig(nom, a); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => corps().textContent.replace(/\s+/g, " ");
  const voir = async (vue) => { LECTURE = { ok:true, jour:"2026-12-01", gains:[], missions:[ Object.assign({}, base, { vue }) ] };
    _queteSous = "missions"; await missionsCharger(); majQueteHub(); await new Promise(x => setTimeout(x, 30)); };
  const tenus = { encordeur:"Bob", eclaireur:"Testeuse", dechiffreur:"Eve" };

  // 1. Préparation, loin de la balise ; la carte du Suaire montre le point.
  await voir({ phase:"preparation", limite:"2026-12-03", balise:B, tentatives:0, mon_poste:"eclaireur", postes_tenus:tenus, tempete_min:675 });
  r.loin = txt().includes("Rends-toi à la balise (point marqué sur la carte du Suaire)") && txt().includes("au plus tard le jeudi 3 décembre");
  r.marqueur = missionsMarqueursCarte("suaire").includes("La balise") && missionsMarqueursCarte("braise") === "";
  etat.sac = { fab_cellule_d_energie:5, fab_composant_avance:2 };
  await voir({ phase:"preparation", limite:"2026-12-03", balise:B, tentatives:0, mon_poste:"eclaireur", postes_tenus:tenus, tempete_min:675 });
  const bu = corps().querySelector("[data-mi-unite]");
  r.unites = bu && bu.textContent === "Déposer 2 × Lampes";
  // 2. Sur place : « Lancer la descente », avec la durée du serveur.
  etat.surface = { x:2010, y:1300 };
  r.lieuIci = missionsLieuIci().includes("Un signal monte de sous la glace.");
  await voir({ phase:"preparation", limite:"2026-12-03", balise:B, tentatives:0, mon_poste:"eclaireur", postes_tenus:tenus, tempete_min:675 });
  const bd = corps().querySelector("[data-mi-descendre]");
  r.boutonDescente = !!bd && bd.dataset.miMinutes === "675";
  bd.click(); await new Promise(x => setTimeout(x, 80));
  r.appelDescente = appels.some(a => a.startsWith("balise_descendre {\"p_mission\":9}"));
  // 3. Descente : la crevasse (je suis l'éclaireur).
  const desc = { n:1, debut:new Date().toISOString(), tempete:new Date(Date.now() + 3 * 3600e3).toISOString(), faits:{ encordeur:true } };
  await voir({ phase:"descente", balise:B, tentatives:0, mon_poste:"eclaireur", postes_tenus:tenus, descente:desc, crevasse:crev });
  r.tempete = /La tempête : dans 2 h 5\d min/.test(txt()) || /La tempête : dans 3 h 00 min/.test(txt());
  r.lumiere = corps().querySelectorAll(".mi-cv.vu").length === 4;   // coin (0,0), rayon 1 : 2 × 2
  const fl = d => corps().querySelector(`[data-cv="${d}"]`).click();
  fl("E");                                    // mur : pas compté
  r.murNonCompte = txt().includes("Pas restants : 8");
  fl("S"); fl("E"); fl("S"); fl("E");
  await new Promise(x => setTimeout(x, 80));
  const ac = appels.find(a => a.startsWith("balise_crevasse"));
  r.crevasse = ac && JSON.parse(ac.slice(16)).p_pas === "SESE";
  // 4. Le message (déchiffreur) : l'inconnu n'arrive que par sa forme.
  const msg = { mots:[["DE",{ forme:["L","renverse"] }],["DE"],["CON","FIRM","ATION"]], propositions:["LUNE","MANDE","ROGE","VIGNE"] };
  await voir({ phase:"descente", balise:B, tentatives:0, mon_poste:"dechiffreur", postes_tenus:tenus, descente:desc, message:msg });
  r.message = { glyphes: corps().querySelectorAll(".mi-msg svg.gly").length === 6, inconnu: corps().querySelectorAll(".mi-msg-inconnu").length === 1,
    boutons: [...corps().querySelectorAll("[data-msg]")].map(b => b.textContent).join(",") };
  [...corps().querySelectorAll("[data-msg]")].find(b => b.textContent === "MANDE").click();
  await new Promise(x => setTimeout(x, 80));
  r.appelMessage = appels.some(a => a.startsWith("balise_message") && a.includes("\"p_son\":\"MANDE\""));
  // 5. Le nœud (encordeur) : suivre le tracé point par point.
  _noeud = { k:2, pts:null, prog:0, actif:false };
  await voir({ phase:"descente", balise:B, tentatives:0, mon_poste:"encordeur", postes_tenus:tenus, descente:Object.assign({}, desc, { faits:{} }) });
  r.noeudTitre = txt().includes("Nœud 3 sur 3 — suis la corde du doigt, sans lever ni sortir.");
  const svg = corps().querySelector("#mi-noeud-svg");
  svg.getBoundingClientRect = () => ({ left:0, top:0, width:300, height:300 });
  svg.setPointerCapture = () => {};
  const ev = (type, p) => { const e = new window.Event(type); e.clientX = p[0]; e.clientY = p[1]; e.pointerId = 1; svg.dispatchEvent(e); };
  ev("pointerdown", _noeud.pts[0]);
  for(const p of _noeud.pts) ev("pointermove", p);
  await new Promise(x => setTimeout(x, 80));
  r.appelNoeud = appels.some(a => a.startsWith("balise_noeud"));
  // Sortie du tracé : le nœud recommence.
  _noeud = { k:0, pts:null, prog:0, actif:false };
  await voir({ phase:"descente", balise:B, tentatives:0, mon_poste:"encordeur", postes_tenus:tenus, descente:Object.assign({}, desc, { faits:{} }) });
  const svg2 = corps().querySelector("#mi-noeud-svg"); svg2.getBoundingClientRect = () => ({ left:0, top:0, width:300, height:300 }); svg2.setPointerCapture = () => {};
  const ev2 = (type, p) => { const e = new window.Event(type); e.clientX = p[0]; e.clientY = p[1]; e.pointerId = 1; svg2.dispatchEvent(e); };
  const p0 = _noeud.pts[0]; ev2("pointerdown", p0); ev2("pointermove", [p0[0] + 80, p0[1] + 80]);
  r.noeudRate = _noeud.prog === 0 && !_noeud.actif && _noeud.k === 0;
  // 6. Tourelle quand les trois postes sont faits.
  await voir({ phase:"descente", balise:B, tentatives:0, mon_poste:"eclaireur", postes_tenus:tenus,
               descente:Object.assign({}, desc, { faits:{ encordeur:true, eclaireur:true, dechiffreur:true } }) });
  r.tourelle = !!corps().querySelector("[data-mi-tourelle]") && txt().includes("pivote vers vous");
  // 7. Régulateur.
  r.glyphes = typeof glypheSVG === "function" && glypheSVG("RE").includes("<svg") && glypheSVG("SERV") !== glypheSVG("DE");
  _modulesVaisseau = {};
  const m0 = malusCarburant();
  etat.sac.regulateur_arepo = 1;
  await installerRegulateur();
  r.regulateur = { avant: m0, apres: malusCarburant(), jours: moduleJoursRestants("regulateur"), perso: estObjetPersonnel("regulateur_arepo") };
  return r;
})();
