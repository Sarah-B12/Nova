// v2.42 — Q42 « Rencontre » (K167, K168) : chaque étape se dessine ; aucun type repris de Q41 ;
// calques (trois copies) et message (RAN·CON·TRE) se gagnent et se perdent ; le son RAN (Ω traversé)
// est nouveau, unique, dans un mot dont les autres sons sont connus ; AREPO pas méchante (la note ne
// parle que de la plante) ; K168 : plus AUCUN « Un temps » dans toutes les quêtes ; écriture.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q42"); r.existe = !!q; r.suitQ41 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q41")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q42", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // calques,message,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._calq = null; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres" || c.lieu !== "e2_planete_oeil") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q42/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ41 = [...types("q42")].filter(t => types("q41").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // calques,message

  // Calques : les trois copies ; la bonne position gagne ; la dernière vérification ratée = son échec.
  const dC = q.etapes[0].defi; a.etape = 0;
  const calq = juste => { a._calq = null; ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _htmlCalques(dC); _wireCalques(z, dC); const c = a._calq;
    if(juste){ c.oB = c.solB; c.oC = c.solC; if(z.querySelector("[data-qc-inv]")) c.inv = true; } else { c.oB = (c.solB + 3) % 7; c.essais = CALQ_ESSAIS - 1; }
    z.querySelector("#q-calq-ok").click(); };
  z.innerHTML = _htmlCalques(dC); r.calqNoms = dC.noms.every(n => z.textContent.includes(n));
  calq(true); r.calqGagne = ok === 1; calq(false); r.calqPerdu = ko === 1 && /brouillent les unes les autres/.test(dernierEchec);

  // Message : [?]·CON·TRE ; RAN gagne, PLI perd (8 h).
  const dM = q.etapes[1].defi; a.etape = 1;
  const msg = rep => { ok = 0; ko = 0; dernierEchec = ""; a._qj = null; z.innerHTML = `<div data-qj-zone>${QUETES_JEUX.message.html(dM)}</div>`; QUETES_JEUX.message.wire(z, dM); if(rep) z.querySelector(`[data-qj-msg="${rep}"]`).click(); };
  msg(null); r.message = { glyphes: z.querySelectorAll(".gly").length, inconnuColore: !!z.querySelector(".mi-msg-inconnu .gly"), boutons: [...z.querySelectorAll("[data-qj-msg]")].map(b => b.dataset.qjMsg).sort().join(",") };
  msg("RAN"); r.message.gagne = ok === 1 && ko === 0; msg("PLI"); r.message.perdu = ko === 1 && /elle a le temps/.test(dernierEchec) && /8 h/.test(dernierEchec);
  r.sonRan = { existe: !!GLYPHES_ANCIEN.RAN, forme: (GLYPHES_ANCIEN.RAN || []).join("/"), autresConnus: ["CON","TRE"].every(s => GLYPHES_ANCIEN[s]),
    unique: Object.values(GLYPHES_ANCIEN).filter(g => g.join("/") === (GLYPHES_ANCIEN.RAN || []).join("/")).length === 1, nbSons: Object.keys(GLYPHES_ANCIEN).length };   // O/trait, 39
  // v2.43 : les formes de QUA (Π barré) et TAINE (Σ traversé) ne servent à rien d'autre (K167).
  r.formesRestantes = [["QUA","I/barre"],["TAINE","S/trait"]].every(([son, f]) => Object.entries(GLYPHES_ANCIEN).every(([k, g]) => g.join("/") !== f || k === son));   // vrai

  r.cercles = q.etapes[2].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // langues,racines,eclats
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 2
  r.recompense = q.recompense;
  const fin = q.etapes[3].arrivee.join(" ");
  r.areponPasMechante = /Pas un mot sur les gens/.test(fin) && /Ils savaient, pour la plante/.test(fin) && /Pas pour nous/.test(fin) && /n'a jamais relié les deux/.test(fin);
  r.suite = /SECTEURS TOUCHÉS/.test(fin);

  // Prise au Nid.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q42, vrai

  // K168 : plus AUCUN « Un temps » dans le texte d'aucune quête (les commentaires du code ne comptent pas).
  const texteDe = x => { const t = []; const tr = o => { if(typeof o === "string") t.push(o); else if(Array.isArray(o)) o.forEach(tr); else if(o && typeof o === "object") Object.values(o).forEach(tr); }; tr(x); return t.join(" "); };
  r.unTempsPartout = QUETES.map(x => [x.id, (texteDe(x).match(/Un temps/g) || []).length]).filter(([, n]) => n > 0);   // []
  r.lendemainsSansUnTemps = !Object.values(LENDEMAIN_VOIX).some(t => /Un temps/.test(t));

  // Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","mots","propositions","noms"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
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
