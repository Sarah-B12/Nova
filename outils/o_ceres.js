// v1.96 — CÉRÈS JOUABLE, SANS QUÊTES (CADRAGE_CERES §5, étape 1) : la carte, la Gorge
// dans les deux sens, Le Nid (carburant en ancien, remorquage), le tir durci (K65),
// le secours (choix A), les cibles de quête, les noms de secteur, la sauvegarde.
// Chaque valeur attendue est notée à côté : tout ce qui n'est pas « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, att = ms => new Promise(x=>setTimeout(x,ms)), msgs = [];
  journal = (m) => msgs.push(String(m)); sauverMaintenant = async () => {}; agirServeur = async () => ({ ok:true });
  let ouvertes = 0; const vraiOuvrir = ouvrirOrbite; ouvrirOrbite = () => { ouvertes++; };
  etat.espace1 = true; etat.permisVaisseau = true; etat.vaisseau = "fab_navette_legere"; etat.ancolie = true; etat.verrouMaar = false;
  etat.carburant = 40; etat.energie = 100; etat.credits = 5000; etat.sac = Object.assign(etat.sac || {}, { fab_biocarburant:5 });
  etat.ceres = false; etat.quetes = { done:["q1"], active:null, verrous:{} };
  const lire = s => { const b = document.querySelector(s); return (!b || b.hidden) ? "—" : `${b.querySelector("span").textContent} [${b.querySelector(".cout").textContent}]${b.style.opacity ? " (grisé)" : ""}`; };
  const T = espaceLieu("trou_noir"), G = espaceLieu("e2_gorge"), N = espaceLieu("e2_base"), P = espaceLieu("base");

  // 1. Données : dix lieux nommés, aucun nom officiel, la bestiole jamais nommée.
  r.donnees = { dix: ESPACE2_LIEUX.length === 10, tousNommes: ESPACE2_LIEUX.every(l => l.nom && l.desc && (l.type === "lieu" || l.ici)),
    nid: N.nom === "Le Nid" && N.type === "lieu", gorge: G.nom === "La Gorge" && G.type === "lieu",
    aucunOfficiel: ESPACE2_LIEUX.every(l => !l.officiel), jamaisBestiole: !ESPACE2_LIEUX.some(l => /bestiole|paupi|œil fermé|oeil ferm/i.test(JSON.stringify([l.nom,l.desc,l.ici,l.usage]))),
    espaceLieuTrouve: !!espaceLieu("e2_comete") && !!espaceLieu("comete") };            // vrai partout

  // 2. La Gorge de Triptolème : fermée, sauf Q20 ét. 1, une étape « gorge », Cérès connue.
  r.gorge = { ferme: !lieuOuvert(T) };
  etat.quetes.active = { id:"q20", etape:0 }; r.gorge.q20e1 = lieuOuvert(T);
  etat.quetes.active.etape = 1; r.gorge.q20e2Ferme = !lieuOuvert(T);
  const q = queteData("q20"); q.etapes[1].gorge = true; r.gorge.etapeMarquee = lieuOuvert(T); delete q.etapes[1].gorge;
  etat.quetes.active = null; etat.ceres = true; r.gorge.ceresConnue = lieuOuvert(T) && usageLieu(T) === "Passage vers Cérès";
  etat.ceres = false;

  // 3. Le bouton « Cérès » : absent tant que la route n'est pas connue.
  etat.secteur = "ecart"; etat.posEspace = { x:P.x, y:P.y }; majBoutonOrbite(); r.boutonAbsent = lire("#ouvrir-ceres") === "—";
  etat.ceres = true; majBoutonOrbite(); r.boutonPerchoir = lire("#ouvrir-ceres");                           // grisé « depuis la Gorge »
  etat.posEspace = { x:T.x, y:T.y }; majBoutonOrbite(); r.boutonGorge = lire("#ouvrir-ceres");              // actif, coût d'un saut
  etat.secteur = "silene"; etat.pos = { ...VILLES[etat.faction] }; majBoutonOrbite(); r.boutonSilene = lire("#ouvrir-ceres");   // grisé « par la Gorge »
  msgs.length = 0; boutonCeres(); r.clicDepuisSilene = /de l'autre côté de la Gorge/.test(msgs[0]);

  // 4. Passer la Gorge : refus loin d'elle, refus sans de quoi revenir, puis passage.
  etat.secteur = "ecart"; etat.posEspace = { x:P.x, y:P.y }; msgs.length = 0; await passerLaGorge(); r.refusLoin = etat.secteur === "ecart" && /rejoins-la/.test(msgs[0]);
  etat.posEspace = { x:T.x, y:T.y }; const sacB = etat.sac.fab_biocarburant; etat.sac.fab_biocarburant = 0; etat.carburant = 20;
  msgs.length = 0; await passerLaGorge(); r.refusAutonomie = etat.secteur === "ecart" && /de quoi revenir/.test(msgs[0]);
  etat.sac.fab_biocarburant = sacB; etat.carburant = 40; ouvertes = 0; msgs.length = 0;
  await passerLaGorge();
  r.passage = { secteur: etat.secteur, surGorgeCeres: surGorgeCeres(), carburant: etat.carburant, carteOuverte: ouvertes === 1, recit: /Secteur Cérès/.test(msgs.join(" ")) };   // ceres, vrai, 22, vrai, vrai

  // 5. À Cérès : les lieux de Triptolème sont hors d'atteinte, même aux mêmes coordonnées.
  etat.posEspace = { x:P.x, y:P.y };
  r.isolement = { pasLePerchoir: !surLieuEspace(P) && !surBase(), pasCarcasse: !surCarcasse(), enEspace: enEspace(), pasEnEcart: !enEcart(), base: baseEspace().id };   // … , "e2_base"

  // 6. Les boutons, à Cérès.
  etat.posEspace = { x:N.x, y:N.y }; majBoutonOrbite();
  r.boutonsNid = ["#ouvrir-carte","#ouvrir-orbite","#ouvrir-ancolie","#ouvrir-ceres"].map(lire);
  etat.posEspace = { x:G.x, y:G.y }; majBoutonOrbite(); r.boutonTriptoGorge = lire("#ouvrir-orbite");       // actif
  msgs.length = 0; boutonSilene(); r.silenePasDirect = /repasse d'abord la Gorge/.test(msgs[0]);

  // 7. La carte de Cérès : son fond, ses dix images, son titre, sa règle de sortie.
  ouvrirOrbite = vraiOuvrir; majOrbite();
  const svg = document.querySelector("#carte-orbite"), h = svg.innerHTML;
  r.carte = { fond: h.includes("carte_espace_2.png"), images: (h.match(/images\/espace2\//g) || []).length, aucuneDeTripto: !/images\/espace\//.test(h),
    titre: document.querySelector("#orbite-titre").textContent, sortie: /par la Gorge uniquement/.test(document.querySelector("#orbite-info").innerHTML),
    halo: /stroke="#ffffff"/.test(h) };                                                                        // vrai, 10, vrai, « Secteur Cérès », vrai, vrai
  etat.secteur = "ecart"; etat.posEspace = { x:P.x, y:P.y }; majOrbite();
  r.carteTripto = { titre: document.querySelector("#orbite-titre").textContent, fond: svg.innerHTML.includes("carte_espace_1.png"), pasCeres: !/espace2/.test(svg.innerHTML) };
  etat.secteur = "ceres"; etat.posEspace = { x:G.x, y:G.y }; ouvrirOrbite = () => {};

  // 8. Voler à Cérès : vers un décor (il se raconte), vers Le Nid ; « aller ET revenir au Nid ».
  etat.carburant = 40; msgs.length = 0; const V = espaceLieu("e2_planete_oeil");
  const vv = volPossible({ x:V.x, y:V.y }); r.retourAuNid = vv.ok && vv.retour && vv.retour.litres > 0;
  const vraiSonde = tenterSonde; tenterSonde = () => false;
  await volVers(V); r.volDecor = { arrive: surLieuEspace(V), raconte: msgs.some(m => /La Bogue : Tu en fais le tour/.test(m)) };
  { const sb0 = etat.sac.fab_biocarburant; etat.sac.fab_biocarburant = 0; etat.carburant = 1;
    r.apercu = /revenir au Nid/.test(_apercuVol(espaceLieu("e2_etoile_bleue"))) && _alaBaseTxt() === "au Nid";   // vrai
    etat.sac.fab_biocarburant = sb0; etat.carburant = 40; }
  await volVers(N); r.auNid = surNid();
  tenterSonde = vraiSonde;

  // 9. Le Nid : la Boutique seule (carburant), étiquettes en ancien ; rien d'autre.
  majHub();
  const vis = [...document.querySelectorAll(".hub-lien")].filter(b => b.style.display !== "none").map(b => b.dataset.hub);
  r.ongletsNid = vis;                                                                                          // ["boutique"]
  changerHub("boutique"); const bq = document.querySelector("#boutique-vue").innerHTML;
  r.boutiqueNid = { textes: /Le Nid/.test(bq) && /ancien/.test(bq), seulCarburant: _catalogueBoutique().every(a => a.cat === "carburant") && _catalogueBoutique().length === 2,
    glyphes: (bq.match(/class="gly"/g) || []).length, pasDeTexteCarburant: !/carburant de vaisseau/.test(bq), prixPerchoir: _prixBoutique(_catalogueBoutique()[0]) === 320 };   // …, 9 glyphes
  r.sonsNouveaux = ["PUL","SION","CEN","TRE"].every(s => GLYPHES_ANCIEN[s]) &&
    new Set(Object.values(GLYPHES_ANCIEN).map(g => g.join("/"))).size === Object.keys(GLYPHES_ANCIEN).length;  // vrai : aucune forme en double
  agirServeur = async (o) => ({ ok:true, ajoutes: o.ajouter || {} });
  etat.credits = 1000; const avant = etat.credits; await acheterBoutique("fab_biocarburant"); r.achatNid = avant - etat.credits === 320;
  agirServeur = async () => ({ ok:true });
  etat.posEspace = { x:G.x, y:G.y }; majHub(); r.ongletsGorge = [...document.querySelectorAll(".hub-lien")].filter(b => b.style.display !== "none").map(b => b.dataset.hub);   // []

  // 10. Les quêtes : Cérès n'est pas Silène ; un lieu e2_ est sur la carte « ceres ».
  r.quetes = { carte: _carteJoueur(), cibleSilene: !_dansCible({ x:etat.pos.x, y:etat.pos.y, r:500 }),
    cibleCeres: _cibleResolue({ lieu:"e2_gorge" }).carte, dansCibleCeres: _dansCible({ lieu:"e2_gorge" }), cibleTripto: !_dansCible({ lieu:"trou_noir" }) };   // ceres, vrai, ceres, vrai, vrai

  // 11. Repasser la Gorge : retour sur le trou noir de Triptolème.
  etat.carburant = 40; msgs.length = 0; boutonTriptoleme(); await att(50);
  r.retour = { secteur: etat.secteur, surGorge: surGorgeTriptoleme(), carburant: etat.carburant };            // ecart, vrai, 22

  // 12. Le secours à Cérès (choix A) : coque clouée → Le Nid ; plus de vaisseau → chez soi.
  // (abimerVaisseau lance lui-même le remorquage dès que la coque est clouée.)
  etat.secteur = "ceres"; etat.posEspace = { x:G.x, y:G.y }; msgs.length = 0; abimerVaisseau(pvMax() + 50, "banc"); await att(30);
  r.secoursCloue = { secteur: etat.secteur, auNid: surNid(), pv: pvVaisseau() > 0, texte: msgs.some(m => /jusqu'au Nid/.test(m)), pasDeCargo: !msgs.some(m => /cargo/.test(m)) };
  const vs = etat.vaisseau; etat.vaisseau = null; msgs.length = 0; await secoursOrbite();
  r.secoursSansVaisseau = { secteur: etat.secteur, chezSoi: villeActuelle() === etat.faction, texte: /chez toi, sur Silène/.test(msgs[0]), pasDeCargo: !/cargo/.test(msgs[0]) };
  etat.vaisseau = vs; reparerPv(pvMax());

  // 13. Le tir de sondage durci : grille +2, glissade tous les deux tirs manqués, échos grisés.
  _apt = () => false; etat.vaisseau = "fab_navette_legere";
  lancerTirSonde(() => {}, () => {}); const nT = _tirN; const txtT = document.querySelector("#tir-modale").innerHTML; _tirFermer();
  lancerTirSonde(() => {}, () => {}, { durci:true }); const txtC = document.querySelector("#tir-modale").innerHTML;
  r.durci = { grille: _tirN - nT, annonce: /glisse d'une case/.test(txtC), triptoSansGlisse: !/glisse/.test(txtT), asteroides: _tirAst.size === _tirN };   // 2, vrai, vrai, vrai
  _tirRendre();
  const libre = () => { for(let y=0;y<_tirN;y++) for(let x=0;x<_tirN;x++){ const k=x+","+y; if(_tirVus[k]==null && !_tirAst.has(k) && !(x===_tirCoeur.x && y===_tirCoeur.y)) return [x,y]; } };
  let c0 = { ..._tirCoeur }; let [a1,b1] = libre(); _tirSalve(a1,b1); r.durci.apres1 = _tirCoeur.x === c0.x && _tirCoeur.y === c0.y;   // pas encore
  let [a2,b2] = libre(); _tirSalve(a2,b2);
  r.durci.glisse = Math.abs(_tirCoeur.x - c0.x) + Math.abs(_tirCoeur.y - c0.y) === 1 && _tirGlisse === 1;
  r.durci.pasSurJoue = _tirVus[_tirCoeur.x + "," + _tirCoeur.y] == null && !_tirAst.has(_tirCoeur.x + "," + _tirCoeur.y);
  const m2 = document.querySelector("#tir-modale").innerHTML; r.durci.grises = (m2.match(/ vieux/g) || []).length === 2 && /Le cœur a glissé/.test(m2);
  _tirFermer();
  let glissesTripto = 0; lancerTirSonde(() => {}, () => {}); _tirRendre(); c0 = { ..._tirCoeur };
  for(let i=0;i<3;i++){ const [x,y] = libre(); _tirSalve(x,y); } r.durci.triptoImmobile = _tirCoeur.x === c0.x && _tirCoeur.y === c0.y; _tirFermer();
  // Les sondes interceptent aussi à Cérès ; le duel y lance le tir durci.
  etat.secteur = "ceres"; let ouvert = 0; const vraiOS = ouvrirSonde; ouvrirSonde = () => ouvert++; const vr = Math.random; Math.random = () => 0.01;
  r.sondeCeres = tenterSonde() && ouvert === 1; Math.random = vr; ouvrirSonde = vraiOS;
  let opts = null; const vraiLT = lancerTirSonde; lancerTirSonde = (w, l, o) => { opts = o; }; await sondeCombat(); lancerTirSonde = vraiLT;
  r.duelCeresDurci = !!(opts && opts.durci);

  // 14. Noms de secteur (liste d'amis, traque) et sauvegarde.
  r.noms = ["silene","ecart","ancolie","braise","ceres"].map(nomSecteur);                                    // Silène, Triptolème, Ancolie, La Braise, Cérès
  r.traque = _tqSecteurNom("ceres") === "Cérès" && _TQ_CARTES.some(c => c.secteurs.includes("ceres"));
  let envoye = null; const vraiRpc = sb.rpc; sb.rpc = (nom, a) => { if(nom === "sauver_profil") envoye = a.p_maj.secteur; return vraiRpc.call(sb, nom, a); };
  etat.secteur = "ceres"; await _sauverMaintenantInterne(); sb.rpc = vraiRpc; r.sauveCeres = envoye;          // "ceres"
  r.posSileneCouple = _posSilene() === null && _debrisCarteIci() === "ceres";

  // 15. La Gorge de Triptolème, sans Cérès connue : le clic dit « verrouillé », comme avant.
  etat.ceres = false; etat.secteur = "ecart"; etat.posEspace = { x:P.x, y:P.y }; majOrbite();
  const g = document.querySelector('#carte-orbite [data-lieu="trou_noir"]'); g.dispatchEvent(new window.MouseEvent("click", { bubbles:true }));
  r.gorgeFermeeClic = /verrouillé/.test(document.querySelector("#orbite-info").innerHTML);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  return r;
})();
