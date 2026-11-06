// v2.39 — Q39 « Ce qu'elle regarde » : chaque étape se dessine ; aucun type repris de Q38 ;
// la tuyauterie se dessine ; l'ordre (cinq vues) se gagne dans l'ordre de l'histoire et se perd avec
// son texte ; la fiche (LIGNE DE SILÈNE, ACCUSÉ DE RÉCEPTION : AUCUN) ; le clin d'œil des transats
// (le toit d'Asulf) ; écriture : jamais « œil » ni « quarantaine », Dagon ne rit pas, répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q39"); r.existe = !!q; r.suitQ38 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q38")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q39", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // tuyauterie,ordre,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._tuy = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres" || c.lieu !== "e2_oeil_espace") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q39/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ38 = [...types("q39")].filter(t => types("q38").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // ordre
  a.etape = 0; a._tuy = null; z.innerHTML = _defiHTML(q.etapes[0].defi); r.tuyauterie = !!a._tuy || z.querySelectorAll("[data-tuy], .q-tuy-case, svg, button").length > 0;

  // L'ordre : 0 → 4 gagne (« l'histoire » de Silène) ; un échange perd, avec son texte.
  const dO = q.etapes[1].defi; a.etape = 1;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
  for(let i = 0; i < 5; i++) z.querySelector(`.q-ordre-el[data-i="${i}"]`).click();
  z.querySelector("#q-ordre-valider").click(); r.ordreGagne = ok === 1 && ko === 0;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
  [0,2,1,3,4].forEach(i => z.querySelector(`.q-ordre-el[data-i="${i}"]`).click());
  z.querySelector("#q-ordre-valider").click(); r.ordrePerdu = ko === 1 && /La Vigie, elle, n'a pas bougé/.test(dernierEchec);
  r.vues = dO.elements.length;                                                           // 5

  r.cercles = q.etapes[2].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // veilleurs,eclats,assembleurs
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 2
  r.recompense = q.recompense;
  const fiche = q.etapes[3].arrivee.join(" ");
  r.fiche = /OBJET SUIVI : LIGNE DE SILÈNE/.test(fiche) && /DESTINATAIRE : BUREAU DES CULTURES/.test(fiche) && /ACCUSÉ DE RÉCEPTION : AUCUN/.test(fiche);
  r.transatsClairs = /le toit d'Asulf, et combien de transats/.test(q.etapes[1].arrivee.join(" "));

  // Prise au Nid ; pas à la Vigie.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q39, vrai
  majHub(); changerHub("quete"); r.banniere = /Ce qu'elle regarde/.test(document.querySelector("#hub-quete").innerHTML);
  const V = espaceLieu("e2_oeil_espace"); etat.posEspace = { x:V.x, y:V.y }; r.priseVigie = !_priseIci(q);

  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée","cill"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.dagonRit = tout.split(/(?<=[.!?])\s+/).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  const VOULU = new Set(["ligne de silène"]);   // la fiche nomme ce que le joueur vient de voir
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !VOULU.has(t) && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
