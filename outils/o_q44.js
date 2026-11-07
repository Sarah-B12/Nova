// v2.44 — Q44 « Au passage d'après » (K167) : chaque étape se dessine ; aucun type repris de Q43 ;
// labyrinthe (sa fin) ; message CEN·TAINE (TAINE gagne, une autre perd) ; le son TAINE (Σ traversé),
// nouveau, unique ; les TROIS sons de QUA·RAN·TAINE sont désormais connus ; le plan de reprise
// (passage 12, dossier Maar) ; Dagon mène l'étape du mur ; jamais « levée » ni « quarantaine » ; écriture.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q44"); r.existe = !!q; r.suitQ43 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q43")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q44", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // labyrinthe,message,attente,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._lab = null; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q44/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // bogue ×2, nid ×3
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ43 = [...types("q44")].filter(t => types("q43").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // message
  r.labyrinthe = { fini: q.etapes[0].defi.fini, ratable: DEFIS_UNTRY.has("labyrinthe") };

  // Message : CEN·[?] ; TAINE gagne, BLO perd (son texte).
  const dM = q.etapes[1].defi; a.etape = 1;
  const msg = rep => { ok = 0; ko = 0; dernierEchec = ""; a._qj = null; z.innerHTML = `<div data-qj-zone>${QUETES_JEUX.message.html(dM)}</div>`; QUETES_JEUX.message.wire(z, dM); if(rep) z.querySelector(`[data-qj-msg="${rep}"]`).click(); };
  msg(null); r.message = { glyphes: z.querySelectorAll(".gly").length, inconnuColore: !!z.querySelector(".mi-msg-inconnu .gly"), boutons: [...z.querySelectorAll("[data-qj-msg]")].map(b => b.dataset.qjMsg).sort().join(",") };
  msg("TAINE"); r.message.gagne = ok === 1 && ko === 0; msg("BLO"); r.message.perdu = ko === 1 && /se replie de lui-même/.test(dernierEchec) && /8 h/.test(dernierEchec);
  r.sonTaine = { existe: !!GLYPHES_ANCIEN.TAINE, forme: (GLYPHES_ANCIEN.TAINE || []).join("/"), avecConnu: !!GLYPHES_ANCIEN.CEN,
    unique: Object.values(GLYPHES_ANCIEN).filter(g => g.join("/") === (GLYPHES_ANCIEN.TAINE || []).join("/")).length === 1, nbSons: Object.keys(GLYPHES_ANCIEN).length };   // S/trait, 41
  r.quarantaineLisible = ["QUA","RAN","TAINE"].every(s => GLYPHES_ANCIEN[s]);           // vrai : prêt pour Q45

  r.attenteMs = q.etapes[2].defi.duree;                                                 // 1800000
  r.dagonMene = /C'est Dagon qui se lève/.test(q.etapes[2].arrivee.join(" "));
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // racines,veilleurs,langues
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3
  r.recompense = q.recompense;
  const plan = q.etapes[1].arrivee.join(" "), fin = q.etapes[4].arrivee.join(" ");
  r.plan = /REPRISE PRÉVUE AU PASSAGE N° 12/.test(plan) && /APRÈS DÉCISION SUR LE DOSSIER MAAR/.test(plan);
  r.pasAbandon = /Personne n'a décidé de les abandonner/.test(fin) && /Ils allaient revenir/.test(fin);

  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q44, vrai
  const noms = QUETES.map(x => x.nom); r.titresEnDouble = noms.filter((n, i) => noms.indexOf(n) !== i);   // []

  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","mots","propositions"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 0
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques|répètes)[^.«]*«)/i.test(tout);   // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée","cill"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.dagonRit = tout.split(/(?<=[.!?])\s+/).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
