// v2.45 — Q45 « Le motif » (fin de l'arc de Cérès ; K94, K111, K158, K167) : chaque étape se dessine ;
// aucun type repris de Q44 ; piratage (MAAR-12/42 : sa fin, son échec) ; l'énigme montre QUA·RAN·TAINE EN
// GLYPHES et n'accepte que « quarantaine » ; le mot n'apparaît dans AUCUNE autre quête de l'arc (Q16 : un
// leurre d'autrefois, voulu) ; la levée (Q35) ; 1 PA (10 au total) ; la dernière phrase répond à Q32 ; écriture.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x => setTimeout(x, ms));
  const q = queteData("q45"); r.existe = !!q; r.suitQ44 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q44")) + 1;
  r.derniere = QUETES[QUETES.length - 1].id;                                              // q45
  const vraiQA = queteActive;
  const a = { id:"q45", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // piratage,enigme,scene,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q45/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ44 = [...types("q45")].filter(t => types("q44").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // piratage

  // Piratage (lent pour le banc) : « Matricule lu. » ; deux ratés → son échec.
  const dP = Object.assign({}, q.etapes[0].defi, { vitesse:4000 }); a.etape = 0;
  async function pirater(juste){
    ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dP); _defiWire(z, dP); const m0 = msgs.length;
    const zone = z.querySelector("#q-pir-zone"), cur = z.querySelector("#q-pir-curseur"), stop = z.querySelector("#q-pir-stop");
    for(let k = 0; k < 8000 && !ok && !ko; k++){
      await att(5); const p = parseFloat(cur.style.left) || 0, g = parseFloat(zone.style.left), w = parseFloat(zone.style.width);
      const dedans = p >= g + 0.5 && p <= g + w - 0.5;
      if(juste ? dedans : (!dedans && (p < g - 3 || p > g + w + 3))) stop.click();
    }
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
    return { ok, ko, msg:dernierEchec, fin: msgs.slice(m0).includes("Matricule lu.") };
  }
  const pG = await pirater(true), pP = await pirater(false);
  r.piratage = { gagne: pG.ok === 1 && pG.fin, perdu: pP.ko === 1 && /au nez de quelqu'un/.test(pP.msg) };

  // L'énigme : le mot en glyphes (3 signes, ceux de QUA, RAN, TAINE) ; « quarantaine » seule gagne.
  const dE = q.etapes[1].defi; a.etape = 1;
  const essai = t => { ok = 0; z.innerHTML = _defiHTML(dE); _defiWire(z, dE); z.querySelector("#q-enig-champ").value = t; z.querySelector("#q-enig-btn").click(); return ok; };
  z.innerHTML = _defiHTML(dE);
  r.enigmeGlyphes = { nb: z.querySelectorAll(".q-enig-gly svg.gly").length, memes: (() => { const t = document.createElement("div"); t.innerHTML = glyphesMot(["QUA","RAN","TAINE"]); return [...z.querySelectorAll(".q-enig-gly svg.gly")].map(x => x.innerHTML).join("|") === [...t.querySelectorAll("svg.gly")].map(x => x.innerHTML).join("|"); })() };   // 3, vrai
  r.enigme = { mot: essai("Quarantaine") === 1, phrase: essai("c'est une quarantaine") === 1, quarante: essai("quarante") === 0, levee: essai("levée") === 0 };
  r.autresEnigmesSansGlyphes = !/q-enig-gly/.test(_defiHTML(QUETES.flatMap(x => x.etapes.map(e => e.defi)).find(d => d.type === "enigme" && !d.glyphes)));

  // Le mot et la levée : nulle part ailleurs dans l'arc (Q31 → Q44) ; Q16 garde son leurre d'autrefois.
  const texteDe = x => { const t = []; const tr = o => { if(typeof o === "string") t.push(o); else if(Array.isArray(o)) o.forEach(tr); else if(o && typeof o === "object") Object.values(o).forEach(tr); }; tr(x); return t.join(" "); };
  r.motAilleursDansLArc = QUETES.filter(x => +x.id.slice(1) >= 31 && x.id !== "q45" && /quarantaine/i.test(texteDe(x))).map(x => x.id);   // [] (Q4, Q9, Q16 : leurres d'autrefois, voulus)
  r.leurresAnciens = QUETES.filter(x => +x.id.slice(1) < 31 && /quarantaine/i.test(texteDe(x))).map(x => x.id);
  r.leveeDansLArc = QUETES.filter(x => +x.id.slice(1) >= 31 && +x.id.slice(1) <= 44 && /\blevée\b/i.test(texteDe(x))).map(x => x.id);   // []
  const tout45 = texteDe(q);
  r.premierMotApresEnigme = tout45.indexOf("Quarantaine. Tu l'écris") >= 0 && !/quarantaine/i.test(q.intro.join(" ") + q.etapes[0].arrivee.join(" ") + q.etapes[1].arrivee.join(" "));
  r.levee = /Et la levée, tu l'as vue partir/.test(q.etapes[2].arrivee.join(" ")) && /Rien n'a changé/.test(q.etapes[2].arrivee.join(" "));
  r.pasMechante = /Pas pour punir : pour protéger le reste/.test(tout45);
  r.echoQ32 = /Tu sais maintenant qu'elles marchent/.test(q.etapes[4].arrivee.join(" ")) && /elles marchaient/.test(texteDe(queteData("q32")));
  r.titreSansLeMot = !/quarantaine/i.test(q.nom);

  // Récompense : 1 PA ; au total, 10 PA par les quêtes (K111).
  r.recompense = q.recompense;
  r.paTotal = QUETES.reduce((s, x) => s + ((x.recompense && x.recompense.pa) || 0), 0);   // 10
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // racines,langues,veilleurs
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3

  // Prise au Nid ; aucun titre en double.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q45, vrai
  etat.quetes.done.push("q45"); r.apresLaFin = queteProchaine() ? queteProchaine().id : null;   // null : plus de quête
  const noms = QUETES.map(x => x.nom); r.titresEnDouble = noms.filter((n, i) => noms.indexOf(n) !== i);   // []

  // Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","glyphes","motsCles"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 0
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques|répètes)[^.«]*«)/i.test(tout);   // faux
  r.motsInterdits = ["bestiole","œil","paupière","Campbell","creux","cill"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.dagonRit = tout.split(/(?<=[.!?])\s+/).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
