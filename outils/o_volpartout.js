// v1.97 — LE VOL PARTOUT (K103 → K108) : où l'on fait les poches, où l'on hacke,
// l'onglet, la geôle du Perchoir, la traque en Ancolie. Le serveur (v222) a ses
// propres tests (PostgreSQL) ; ici, le client. Tout ce qui est noté « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, msgs = [], appels = [];
  journal = (m) => msgs.push(String(m)); sauverMaintenant = async () => {}; sauvegarder = () => {};
  const orig = sb.rpc.bind(sb); sb.rpc = (n, a) => { appels.push(n); return orig(n, a); };
  etat.aptitudes = { pa:0, pris:["om1","om2","om3","om4"], v:125 }; etat.equipement = etat.equipement || {}; etat.equipement.arme = ITEM_HACK_VOL;
  etat.prisonJusqua = 0; etat.energie = 80; etat.vaisseau = "fab_navette_legere"; etat.espace1 = true;
  const P = espaceLieu("base"), C = espaceLieu("epave"), N = espaceLieu("e2_base"), M = espaceLieu("pp_vert");
  const ici = () => { const l = lieuVolIci(); return l ? l.id : null; };
  const visibles = () => [...document.querySelectorAll(".hub-lien")].filter(b => b.style.display !== "none").map(b => b.dataset.hub);
  const actif = () => { const a = document.querySelector(".hub-lien.actif"); return a ? a.dataset.hub : null; };

  // 1. Où l'on est « sur un lieu » : chaque lieu nommé de chaque carte, en son centre.
  const echecs = [];
  for(const s of ["ecart","ceres"]){ etat.secteur = s;
    for(const l of carteEspace(s).lieux().filter(l => l.nom)){ etat.posEspace = { x:l.x, y:l.y }; if(ici() !== l.id) echecs.push(s + ":" + l.id); } }
  for(const s of ["braise","suaire","ancolie"]){ etat.secteur = s;
    for(const l of SURFACES[s].lieux.filter(l => l.nom)){ etat.surface = { x:l.x, y:l.y, abord:false }; if(ici() !== l.id) echecs.push(s + ":" + l.id); } }
  r.chaqueLieu = { echecs, nb: ["ecart","ceres"].reduce((n,s) => n + carteEspace(s).lieux().filter(l=>l.nom).length, 0)
                          + ["braise","suaire","ancolie"].reduce((n,s) => n + SURFACES[s].lieux.filter(l=>l.nom).length, 0) };   // [], 40 (= vol_lieux)

  // 2. Vol / hack selon l'endroit.
  etat.secteur = "ecart"; etat.posEspace = { x:P.x + 10, y:P.y }; r.perchoir = { lieu: ici(), vol: _volIci("vol"), hack: _volIci("hack") };   // base, vrai, vrai
  etat.posEspace = { x:M.x, y:M.y }; r.mousseron = { lieu: ici(), vol: _volIci("vol") };                                                        // pp_vert, vrai
  etat.posEspace = { x:1000, y:1000 }; r.videTripto = { lieu: ici(), vol: _volIci("vol"), hack: _volIci("hack"), nom: _lieuVolNom("hack") };   // null, faux, vrai, « sur Triptolème »
  etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y }; r.nid = { lieu: ici(), nom: _lieuVolNom("vol") };                                // e2_base, « au Nid »
  etat.secteur = "ancolie"; etat.surface = { x:1780, y:600, abord:false }; r.lac = ici();                                                     // selenite
  etat.surface = { x:600, y:600, abord:false }; r.ancolieNature = { vol: _volIci("vol"), hack: _volIci("hack") };                            // faux, vrai
  etat.secteur = "silene"; etat.pos = { ...VILLES[etat.faction] }; r.silene = { ville: _volIci("vol") && _volIci("hack"), lieu: ici() };     // vrai, null
  etat.pos = { x:VILLES[etat.faction].x + 400, y:VILLES[etat.faction].y + 400 }; r.sileneNature = !_volIci("vol") && !_volIci("hack");     // vrai

  // 3. L'onglet : partout hors de Silène, jamais ouvert d'office dans le vide.
  etat.secteur = "ecart"; etat.posEspace = { x:1000, y:1000 }; majHub();
  r.ongletVide = { voler: visibles().includes("voler"), pasOuvert: actif() !== "voler" };                                                      // vrai, vrai
  etat.posEspace = { x:C.x, y:C.y }; majHub(); r.ongletCarcasse = visibles().includes("voler") && visibles().includes("garage");
  etat.secteur = "silene"; etat.pos = { x:VILLES[etat.faction].x + 400, y:VILLES[etat.faction].y + 400 }; majHub(); r.ongletNatureSilene = !visibles().includes("voler");   // vrai : inchangé

  // 4. La vue Voler / Hacker dans le vide : poches grisées, hack prêt ; tenterVoler n'appelle pas le serveur.
  etat.secteur = "ecart"; etat.posEspace = { x:1000, y:1000 }; changerHub("voler");
  const z = document.querySelector("#voler-vue");
  r.vueVide = { pochesGrisees: z.querySelector("#vol-voler").disabled, hackPret: !z.querySelector("#vol-hacker").disabled,
    texte: /aucun lieu/.test(z.innerHTML) && /sur Triptolème/.test(z.innerHTML) && /72 h après un hack/.test(z.innerHTML) };
  appels.length = 0; msgs.length = 0; await tenterVoler();
  r.pochesRefusees = !appels.includes("vol_preparer") && /sur un lieu/.test(msgs[0] || "");
  etat.posEspace = { x:P.x, y:P.y }; changerHub("voler"); r.vuePerchoir = !document.querySelector("#vol-voler").disabled && /au Perchoir/.test(document.querySelector("#voler-vue").innerHTML);

  // 5. La geôle du Perchoir : un voleur pris au Nid y est conduit.
  etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y }; etat.prisonJusqua = Date.now() + 3600e3; etat.prisonFaction = "perchoir";
  msgs.length = 0; _conduireEnPrison();
  r.geole = { secteur: etat.secteur, auPerchoir: surBase(), texte: /geôle du Perchoir/.test(msgs[0] || "") };                               // ecart, vrai, vrai
  msgs.length = 0; _conduireEnPrison(); r.geoleUneFois = msgs.length === 0;
  etat.secteur = "ancolie"; etat.surface = { x:1063, y:905, abord:false }; _conduireEnPrison(); r.geoleDepuisAncolie = etat.secteur === "ecart" && surBase();
  etat.prisonJusqua = 0; etat.prisonFaction = null;

  // 6. La traque : Ancolie a ses outils de carte, comme La Braise.
  r.traqueAncolie = _TQ_CARTES.some(c => c.secteurs.includes("ancolie") && c.modale === "#modale-braise");
  r.contractions = ["Le Perchoir","Les Solfatares","La Carcasse","Aire d'atterrissage","Mousseron"].map(aLieu);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  return r;
})();
