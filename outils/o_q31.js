// v1.98 — Q31 « Une sonde de plus » (K90, K91, K110) : chaque étape se dessine et se
// branche ; pas de type répété avec Q30 ; le message (porté de H43) et l'ordre se
// gagnent et se perdent ; la Gorge s'ouvre pendant l'étape `gorge:true` et pour de bon
// après le saut ; Asulf donne la quête à La Toundra (à tous), bannière avec repli ;
// règles d'écriture (K53, K68) ; récompense. Tout ce qui est noté « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x=>setTimeout(x,ms));
  const q = queteData("q31"); r.existe = !!q;
  const vraiQA = queteActive;
  const a = { id:"q31", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  // 1. Les étapes : rendu, branchement, cibles, images ; pas de type répété avec Q30.
  r.types = q.etapes.map(e => e.defi.type).join(",");                                         // message,ordre,choix,saut,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         if(!_cibleResolue(e.cible)) r.erreurs.push(`${i} : cible introuvable`);
         if(!/^images\/quetes\/q31\/\d\.png$/.test(e.image)) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ30 = [...types("q31")].filter(t => types("q30").has(t));                  // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).length;                    // ≥ 1
  r.cartes = q.etapes.map(e => _cibleResolue(e.cible).carte).join(",");                       // espace,silene,silene,espace,ceres

  // 2. Le message : un son inconnu, montré ; la bonne réponse gagne, une autre perd (8 h).
  const dM = q.etapes[0].defi; a.etape = 0;
  ok = 0; ko = 0; a._qj = null; z.innerHTML = `<div data-qj-zone>${QUETES_JEUX.message.html(dM)}</div>`; QUETES_JEUX.message.wire(z, dM);
  r.message = { glyphes: z.querySelectorAll(".gly").length, inconnuColore: !!z.querySelector(".mi-msg-inconnu .gly"),
    boutons: [...z.querySelectorAll("[data-qj-msg]")].map(b => b.dataset.qjMsg).sort().join(",") };
  z.querySelector('[data-qj-msg="CUL"]').click(); r.message.gagne = ok === 1 && ko === 0;
  ok = 0; ko = 0; a._qj = null; z.innerHTML = `<div data-qj-zone>${QUETES_JEUX.message.html(dM)}</div>`; QUETES_JEUX.message.wire(z, dM);
  z.querySelector('[data-qj-msg="BLI"]').click(); r.message.perdu = ko === 1 && /8 h/.test(dernierEchec);
  // Règles du LORE §11 bis : CUL est nouveau, dans un mot qui contient un son connu (TURE) ;
  // la forme de CUL n'est prise par aucun autre son.
  r.sonCul = { existe: !!GLYPHES_ANCIEN.CUL, avecConnu: !!GLYPHES_ANCIEN.TURE,
    unique: Object.entries(GLYPHES_ANCIEN).filter(([s, g]) => g.join("/") === GLYPHES_ANCIEN.CUL.join("/")).length === 1 };

  // 3. L'ordre : dans l'ordre de Bardane, il gagne ; sinon il perd, avec son texte.
  const dO = q.etapes[1].defi; a.etape = 1;
  r.ordreMemeMots = JSON.stringify(dO.elements.map(e => e.sons)) === JSON.stringify(dM.mots.map(w => w.map(s => (s && s.inconnu) || s)));   // vrai
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
  r.ordreGlyphesSeuls = z.querySelectorAll(".q-ordre-el .gly").length > 0 && [...z.querySelectorAll(".q-ordre-el")].every(b => !/[A-Za-z]{3}/.test(b.textContent));
  for(let i = 0; i < 4; i++) z.querySelector(`.q-ordre-el[data-i="${i}"]`).click();
  z.querySelector("#q-ordre-valider").click(); r.ordreGagne = ok === 1 && ko === 0;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
  [1,0,2,3].forEach(i => z.querySelector(`.q-ordre-el[data-i="${i}"]`).click());
  z.querySelector("#q-ordre-valider").click(); r.ordrePerdu = ko === 1 && /sonde cassée/.test(dernierEchec);

  // 4. La Gorge : fermée avant, ouverte pendant l'étape 4 (gorge:true), passée par le saut.
  etat.ceres = false; const T = espaceLieu("trou_noir");
  a.etape = 2; r.gorgeAvant = !lieuOuvert(T);                                                  // vrai
  a.etape = 3; r.gorgeEtape4 = lieuOuvert(T);                                                  // vrai
  etat.secteur = "ecart"; etat.posEspace = { x:T.x, y:T.y };
  ok = 0; z.innerHTML = _defiHTML(q.etapes[3].defi); _defiWire(z, q.etapes[3].defi);
  z.querySelector("#qj-saut").click(); await att(30);
  r.saut = { gagne: ok === 1, secteur: etat.secteur, surGorgeCeres: surGorgeCeres(), ceres: etat.ceres };   // vrai, ceres, vrai, vrai
  a.etape = 4; r.cibleArrivee = _dansCible(q.etapes[4].cible);                                 // vrai
  r.recompense = q.recompense;

  // 5. Asulf à La Toundra : la quête s'y prend, pour toutes les factions ; ailleurs, sa radio.
  queteActive = vraiQA; etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{} };
  r.prochaine = queteProchaine() && queteProchaine().id;                                       // q31
  etat.secteur = "silene"; etat.faction = "ignis";
  etat.pos = { x:VILLES.toundra.x, y:VILLES.toundra.y }; r.priseToundra = _priseIci(q);       // vrai
  majHub(); r.ongletToundra = [...document.querySelectorAll(".hub-lien")].some(b => b.dataset.hub === "quete" && b.style.display !== "none");
  changerHub("quete"); const hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /asulf_toundra_1\.png/.test(hz) && /data-repli="images\/quetes\/asulf\.png"/.test(hz) && /Asulf — La Toundra/.test(hz) && /Accepter la quête/.test(hz);
  etat.pos = { x:VILLES.ignis.x, y:VILLES.ignis.y }; r.priseChezSoi = !_priseIci(q);         // vrai : seulement à La Toundra
  majQueteHub(); r.radioAilleurs = /La Toundra/.test(document.querySelector("#hub-quete").innerHTML);

  // 6. Écriture : K68 (le joueur jamais entre guillemets), K53 (un seul « Un temps »).
  const tout = JSON.stringify(q);
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                          // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);            // faux
  r.motsInterdits = ["bestiole","œil fermé","quarantaine"].filter(m => tout.toLowerCase().includes(m));   // []
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
