// v2.32 — Q32 « Une sonde qui s'arrête » (K150 → K155) : chaque étape se dessine et se
// branche ; aucun type repris de Q31 ; la plaque (glyphes, son TOUR) et l'énigme se gagnent
// et se perdent ; la quête se prend AU NID (Aruns et Dagon), le lendemain de Q31 ; la
// boutique du Nid reste fermée jusqu'à la fin de Q32 (K155) ; règles d'écriture (K53, K68),
// secrets (LORE §8 bis) et répétitions. Tout ce qui est noté « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q32"); r.existe = !!q; r.suitQ31 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q31")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q32", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);
  const N = espaceLieu("e2_base");

  // 1. Les étapes : rendu, branchement, cibles (toutes au Nid), images ; pas de type de Q31.
  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // glyphes,attente,enigme,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres" || c.lieu !== "e2_base") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q32/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ31 = [...types("q32")].filter(t => types("q31").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).length;              // 1 (la plaque)

  // 2. La plaque (glyphes) : TOUR est nouveau, de forme unique, dans un mot avec RE (connu).
  const dG = q.etapes[0].defi; a.etape = 0;
  r.sonTour = { existe: !!GLYPHES_ANCIEN.TOUR, forme: (GLYPHES_ANCIEN.TOUR || []).join("/"),
    unique: Object.values(GLYPHES_ANCIEN).filter(g => g.join("/") === (GLYPHES_ANCIEN.TOUR||[]).join("/")).length === 1,
    avecConnu: dG.paires.some(p => p.sons.includes("TOUR") && p.sons.includes("RE")),
    tousSonsConnus: dG.paires.every(p => p.sons.every(s => GLYPHES_ANCIEN[s])) };
  const repondre = (bon) => { z.innerHTML = _defiHTML(dG); _defiWire(z, dG);
    const sels = [...z.querySelectorAll(".q-gly-sel")];
    sels.forEach((s, i) => { s.value = dG.paires[i].sens; });
    if(!bon){ sels[3].value = "Départ"; }
    z.querySelector("#q-gly-valider").click(); };
  ok = 0; ko = 0; repondre(true);  r.plaqueGagne = ok === 1 && ko === 0;
  r.plaqueGlyphes = z.querySelectorAll(".q-gly-sym .gly").length;                     // 9 (2+3+3+2 = 10 sons)
  ok = 0; ko = 0; repondre(false); r.plaquePerdue = ko === 1 && /Aruns efface/.test(dernierEchec) && /5 h/.test(dernierEchec);
  r.leurres = dG.distracteurs;

  // 3. L'énigme : « couronne » passe (même dans une phrase), « le Nid » non.
  const dE = q.etapes[2].defi; a.etape = 2;
  const essai = t => { z.innerHTML = _defiHTML(dE); _defiWire(z, dE); z.querySelector("#q-enig-champ").value = t; z.querySelector("#q-enig-btn").click(); };
  ok = 0; essai("La Couronne"); r.enigmeCouronne = ok === 1;
  ok = 0; essai("il faut aller à la couronne !"); r.enigmePhrase = ok === 1;
  ok = 0; essai("le nid"); r.enigmeFausse = ok === 0;

  // 4. L'attente : une heure ; le choix : trois Cercles, dans l'ordre du serveur (v252).
  r.attenteMs = q.etapes[1].defi.duree;                                                 // 3600000
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // veilleurs,assembleurs,langues
  r.recompense = q.recompense;

  // 5. Au Nid : avant Q32 finie, pas de boutique ; la quête s'y prend ; la bannière à deux noms.
  queteActive = vraiQA;
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = false; etat.ceres = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id;                                // q32
  r.surNid = surNid(); r.priseNid = _priseIci(q);                                       // vrai, vrai
  majHub();
  const vis = h => [...document.querySelectorAll(".hub-lien")].some(b => b.dataset.hub === h && b.style.display !== "none");
  r.avant = { onglet: vis("quete"), boutique: vis("boutique"), usage: usageLieu(N), vente: _carburantEnVenteIci() };   // vrai, faux, Remorquage, faux
  changerHub("quete"); let hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /aruns_dagon\.png/.test(hz) && /data-repli="images\/quetes\/q31\/5\.png"/.test(hz) && /Aruns et Dagon — Le Nid/.test(hz) && /Accepter la quête/.test(hz);
  // Le lendemain : Q31 finie aujourd'hui → la scène des lanternes, pas de bouton.
  etat.quetes.finJour = { q31: jourDeJeu() }; majQueteHub();
  hz = document.querySelector("#hub-quete").innerHTML;
  r.lendemain = /lanternes du Nid s'éteignent/.test(hz) && !/Accepter la quête/.test(hz);
  etat.quetes.finJour = {};
  // Ailleurs (Triptolème) : pas de prise, la radio grésille, le Nid nommé.
  etat.secteur = "ecart"; const B = espaceLieu("base"); etat.posEspace = { x:B.x, y:B.y };
  r.priseAilleurs = !_priseIci(q); majQueteHub(); r.texteAilleurs = /lanternes du <b>Nid<\/b>/.test(document.querySelector("#hub-quete").innerHTML);
  // Achat refusé au Nid tant que le module est fermé (même si l'onglet était forcé).
  etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  const cr0 = etat.credits; const msg0 = msgs.length; await acheterBoutique("fab_biocarburant");
  r.achatRefuse = etat.credits === cr0 && msgs.slice(msg0).some(m => /personne ne te vend/.test(m));
  // Après Q32 (drapeau de la récompense) : la boutique ouvre, le carburant se vend, l'usage revient.
  etat.nidOuvert = true; majHub();
  r.apres = { boutique: vis("boutique"), usage: usageLieu(N), vente: _carburantEnVenteIci() };   // vrai, Carburant · Remorquage, vrai
  etat.nidOuvert = false; etat.quetes.done.push("q32"); r.apresParQuete = nidOuvert();   // vrai (filet)

  // 6. Écriture : K68, K53, secrets et mots interdits ; le nom « Aruns » seul (K152).
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","hublot","creux"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.repliquesTraduites = (tout.match(/«[^»]*»/g) || []).filter(x => !/^« (Aruns|Dagon)\. »$/.test(x));               // [] : seuls leurs noms
  r.sousLaPeau = (tout.match(/Sous la peau de Dagon, ses veines/g) || []).length;       // 1 (demande de l'autrice ; l'autre fois : « Ses veines, sous sa peau bleue »)
  // Répétitions : suites de trois mots pleins répétées dans la quête (hors expressions voulues).
  const VOULU = new Set(["la grande forme"]);
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !VOULU.has(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.comme = (tout.match(/\bcomme\b/g) || []).length;
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
