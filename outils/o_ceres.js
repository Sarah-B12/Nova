// v1.96 — CÉRÈS JOUABLE, SANS QUÊTES (CADRAGE_CERES §5, étape 1) : la carte, la Gorge
// dans les deux sens, Le Nid (carburant en ancien, remorquage), le tir durci (K65),
// le secours (choix A), les cibles de quête, les noms de secteur, la sauvegarde.
// Chaque valeur attendue est notée à côté : tout ce qui n'est pas « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  /* v3.02 (v304) : changements de carte, sauts de quête et secours passent par le serveur (carte_changer, carte_quete,
     secours_orbite) : on rejoue ici ce qu'il fait, avec les règles du jeu, pour comparer aux versions d'avant (qui
     n'appellent pas ces fonctions). L'arrivée reste posée par la page, comme avant. */
  { const rpc304 = sb.rpc;
    sb.rpc = (n, a) => {
      const rep = d => Promise.resolve({ data:d, error:null });
      if(n === "carte_changer"){
        const v = a.p_vers, de = etat.secteur || "silene";
        const type = (de === "ecart" && v === "ceres") || (de === "ceres" && v === "ecart") ? "gorge"
                   : (de === "silene" && v === "ancolie") || (de === "ancolie" && v === "silene") ? "ancolie" : "saut";
        const c = type === "gorge" ? coutSaut(true) : type === "ancolie" ? coutSautSurface(SURFACES.ancolie) : coutSaut();
        if(!c) return rep({ ok:false, err:"aucun" });
        if((etat.carburant || 0) < c.litres) return rep({ ok:false, err:"carburant", litres:c.litres, carburant:etat.carburant || 0 });
        return rep({ ok:true, type, litres:c.litres, cout_e:c.energie, carburant:Math.max(0, (etat.carburant || 0) - c.litres), reservoir:c.reservoir, de, secteur:v });
      }
      if(n === "carte_quete") return rep({ ok:true, secteur:a.p_carte });
      if(n === "secours_orbite"){
        const cloue = !!etat.vaisseau && vaisseauCloue(), sec = !!etat.vaisseau && !cloue && vaisseauSansRetour();
        if(etat.vaisseau && !cloue && !sec) return rep({ ok:false, err:"pas_de_secours" });
        const p25 = repPalier(typeof REP_PALIER_RAPATRIEMENT !== "undefined" ? REP_PALIER_RAPATRIEMENT : 25), cr = Math.max(0, etat.credits || 0);
        const frais = sec ? Math.floor(cr * (p25 ? SECOURS_SEC_PALIER : SECOURS_SEC)) : (!etat.vaisseau && p25) ? SECOURS_FRAIS_PALIER : SECOURS_FRAIS;
        const du = Math.min(frais, cr), d = { ok:true, cas: cloue ? "cloue" : sec ? "sec" : "sans", frais, du, solde:cr - du, palier:p25 };
        if(cloue) Object.assign(d, { vaisseau:etat.vaisseau, coque:Math.ceil(pvMax() * PV_REMORQUAGE), max:pvMax(), secteur: enCeres() ? "ceres" : "ecart" });
        else d.secteur = "silene";
        return rep(d);
      }
      return rpc304(n, a); }; }
  fugueuseLa = () => true;   // v2.38 (K162) : la Fugueuse n'est là que le dimanche ; le banc la veut toujours (résultats stables)
  const r = {}, att = ms => new Promise(x=>setTimeout(x,ms)), msgs = [];
  journal = (m) => msgs.push(String(m)); sauverMaintenant = async () => {}; agirServeur = async () => ({ ok:true });
  /* v3.01 (v303) : sauts, vols et pleins passent par le serveur (saut_payer, espace_voler, carburant_plein) : on rejoue
     ici ce qu'il fait, avec les formules du jeu, pour comparer aux versions d'avant (qui n'appellent pas ces fonctions). */
  { const rpcE = sb.rpc;
    const verser = () => { const v = vaisseauActif(); if(!v) return null; if((etat.carburant || 0) >= v.reservoir) return { err:"plein" };
      const lieu = (etat.sac[v.carb] || 0) > 0 ? "sac" : ((etat.soute && etat.soute[v.carb]) || 0) > 0 ? "soute" : null;
      if(!lieu) return { err:"manque" };
      if(lieu === "sac") etat.sac[v.carb]--; else etat.soute[v.carb]--;
      const av = etat.carburant || 0; etat.carburant = Math.min(v.reservoir, av + (CARBURANT_LITRES[v.carb] || 0));
      return { ok:true, ajoute:etat.carburant - av, carburant:etat.carburant, reservoir:v.reservoir }; };
    sb.rpc = (n, a) => {
      if(n === "saut_payer"){ const c = a.p_type === "gorge" ? coutSaut(true) : a.p_type === "ancolie" ? coutSautSurface(SURFACES.ancolie) : coutSaut();
        if(!c) return Promise.resolve({ data:{ ok:false, err:"aucun" }, error:null });
        if((etat.carburant || 0) < c.litres) return Promise.resolve({ data:{ ok:false, err:"carburant", litres:c.litres, carburant:etat.carburant || 0 }, error:null });
        return Promise.resolve({ data:{ ok:true, type:a.p_type, litres:c.litres, cout_e:c.energie, carburant:Math.max(0, (etat.carburant || 0) - c.litres), reservoir:c.reservoir }, error:null }); }
      if(n === "carburant_plein"){ const x = verser(); return Promise.resolve({ data: x && x.ok ? x : { ok:false, err:(x && x.err) || "aucun" }, error:null }); }
      if(n === "espace_voler"){ const dest = { x:a.p_x, y:a.p_y }, j = volPossible(dest);
        if(!j.ok) return Promise.resolve({ data: j.err === "retour" ? { ok:false, err:"retour", besoin:j.besoin, autonomie:autonomieCarburant() }
                                                              : { ok:false, err:j.err, cout:j.cout && j.cout.energie }, error:null });
        const pleins = []; let g = 0;
        while((etat.carburant || 0) < j.cout.litres && g++ < 20){ const x = verser(); if(!x || !x.ok) break; pleins.push({ ajoute:x.ajoute, carburant:x.carburant }); }
        if((etat.carburant || 0) < j.cout.litres) return Promise.resolve({ data:{ ok:false, err:"transfert", pleins, carburant:etat.carburant }, error:null });
        return Promise.resolve({ data:{ ok:true, x:dest.x, y:dest.y, d:j.cout.d, cout_e:j.cout.energie, litres:j.cout.litres,
                                        carburant:Math.max(0, (etat.carburant || 0) - j.cout.litres), pleins }, error:null }); }
      return rpcE(n, a); }; }
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
  // v2.32 (K155) : la Boutique n'ouvre qu'à la fin de Q32 (drapeau `nidOuvert`) ; fermée : banc o_q32.
  etat.nidOuvert = true;
  majHub();
  const vis = [...document.querySelectorAll(".hub-lien")].filter(b => b.style.display !== "none").map(b => b.dataset.hub);
  r.ongletsNid = vis;                                                                                          // ["boutique"]
  changerHub("boutique"); const bq = document.querySelector("#boutique-vue").innerHTML;
  r.boutiqueNid = { textes: /module du relais/.test(bq) && /ancien/.test(bq),   /* v2.77 (K242) */ carburantEtKit: _catalogueBoutique().map(a => a.id).join() === "fab_biocarburant,fab_biocarburant_raffine,kit_reparation",   // v2.63 : + le kit
    glyphes: (bq.match(/class="gly"/g) || []).length, pasDeTexteCarburant: !/carburant de vaisseau/.test(bq), prixPerchoir: _prixBoutique(_catalogueBoutique()[0]) === 320 };   // …, 9 glyphes
  r.sonsNouveaux = ["PUL","SION","CEN","TRE"].every(s => GLYPHES_ANCIEN[s]) &&
    new Set(Object.values(GLYPHES_ANCIEN).map(g => g.join("/"))).size === Object.keys(GLYPHES_ANCIEN).length;  // vrai : aucune forme en double
  agirServeur = async (o) => ({ ok:true, ajoutes: o.ajouter || {} });
  // v2.87 (v289) : l'achat passe par boutique_acheter — doublure du serveur (prix du Nid : 320 ₡).
  const vRpcB = sb.rpc.bind(sb); let argsB = null;
  sb.rpc = (n, a) => n === "boutique_acheter"
    ? (argsB = a, Promise.resolve({ data:{ ok:true, item:a.p_item, recu:1, demande:a.p_qte, prix:320, total:320, solde:680, comptoir:"nid", etat:null }, error:null }))
    : vRpcB(n, a);
  etat.credits = 1000; const avant = etat.credits; await acheterBoutique("fab_biocarburant"); r.achatNid = avant - etat.credits === 320 && !!argsB;
  sb.rpc = vRpcB;
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
  /* v3.00 (v302) : le remorquage d'un vaisseau cloué passe par coque_remorquage (200 ₡, 25 % de coque rendus par le
     serveur) : on rejoue ici ce qu'il fait, pour comparer aux versions d'avant. */
  const vR12 = sb.rpc;
  sb.rpc = (n, a2) => { if(n !== "coque_remorquage") return vR12(n, a2);
    const du = Math.min(200, Math.max(0, etat.credits || 0));
    return Promise.resolve({ data: { ok:true, vaisseau:etat.vaisseau, coque:Math.ceil(pvMax() * PV_REMORQUAGE), max:pvMax(), frais:200, du,
                                     solde:Math.max(0, (etat.credits || 0) - du) }, error:null }); };
  etat.secteur = "ceres"; etat.posEspace = { x:G.x, y:G.y }; msgs.length = 0; abimerVaisseau(pvMax() + 50, "banc"); await att(30);
  r.secoursCloue = { secteur: etat.secteur, auNid: surNid(), pv: pvVaisseau() > 0, texte: msgs.some(m => /jusqu'au Nid/.test(m)), pasDeCargo: !msgs.some(m => /cargo/.test(m)) };
  const vs = etat.vaisseau; etat.vaisseau = null; msgs.length = 0; await secoursOrbite();
  r.secoursSansVaisseau = { secteur: etat.secteur, chezSoi: villeActuelle() === etat.faction, texte: /chez toi, sur Silène/.test(msgs[0]), pasDeCargo: !/cargo/.test(msgs[0]) };
  etat.vaisseau = vs; _poserPv(vs, pvMax()); sb.rpc = vR12;   // v3.00 : reparerPv retirée

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
  let opts = null; const vraiLT = lancerTirSonde; lancerTirSonde = (w, l, o) => { opts = o; };
  const vRpcS = sb.rpc.bind(sb); sb.rpc = (n, a) => n === "sonde_engager" ? Promise.resolve({ data:{ ok:true, energie:90 }, error:null }) : vRpcS(n, a);   // v2.89 (v291)
  await sondeCombat(); lancerTirSonde = vraiLT; sb.rpc = vRpcS;
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
