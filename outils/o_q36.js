// v2.36 — Q36 « Le quai » (lot 2, K160 → K163) : chaque étape se dessine ; aucun type repris de
// Q35 ; séquence (son échec), labyrinthe (sa fin), piratage (sa fin, son échec ; Q16 garde les
// siens) ; le registre (date, ARUNS, PROCÉDURE, jamais « quarantaine ») ; la navette, sortie ;
// au lot 2, les PNJ parlent entre guillemets, jamais le joueur ; le texte « ailleurs » suit la
// radio (K158) ; Dagon ne rit plus (K163) ; répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x => setTimeout(x, ms));
  const q = queteData("q36"); r.existe = !!q; r.suitQ35 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q35")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q36", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  // 1. Les étapes.
  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // sequence,labyrinthe,piratage,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._lab = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; } _seqFin();
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres" || c.lieu !== "e2_planete_glace_doree") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q36/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ35 = [...types("q36")].filter(t => types("q35").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // sequence,piratage

  // 2. La séquence (tempo accéléré pour le banc) : on suit les feux → gagné ; un feu faux → son échec.
  const dS = Object.assign({}, q.etapes[0].defi, { allume:15, pas:25 }); a.etape = 0;
  async function sequence(juste){
    ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dS); _defiWire(z, dS);
    const pads = [...z.querySelectorAll(".q-seq-pad")], vus = [];
    const et = z.querySelector("#q-seq-etat");
    const obs = new MutationObserver(ms => ms.forEach(m => { if(!/actif/.test(m.oldValue || "") && m.target.classList.contains("actif") && /^Regarde/.test(et.textContent)){ const i = pads.indexOf(m.target), t = Date.now(); if(!(vus._t && vus._i === i && t - vus._t < 12)) vus.push(i); vus._t = t; vus._i = i; } }));
    pads.forEach(p => obs.observe(p, { attributes:true, attributeOldValue:true, attributeFilter:["class"] }));
    z.querySelector("#q-seq-go").click();
    for(let v = 1; v <= dS.longueur && !ok && !ko; v++){
      for(let k = 0; k < 600 && !/À toi/.test(et.textContent); k++) await att(10);
      const demo = vus.splice(0);
      if(!juste){ pads[(demo[0] + 1) % pads.length].click(); break; }
      for(const i of demo) pads[i].click();
      vus.splice(0); await att(30);
    }
    obs.disconnect(); _seqFin(); return { ok, ko, msg:dernierEchec };
  }
  const sG = await sequence(true), sP = await sequence(false);
  r.sequence = { gagnee: sG.ok === 1, perdue: sP.ko === 1 && /balise s'éteint/.test(sP.msg) && /5 h/.test(sP.msg) };

  // 3. Le labyrinthe : se dessine ; sa fin propre.
  r.labyrinthe = { fini: q.etapes[1].defi.fini, ratable: DEFIS_UNTRY.has("labyrinthe") };   // …, faux

  // 4. Le piratage (lent pour le banc) : STOP dans le vert ×4 → « Matricule accepté. » ; deux ratés → son échec.
  const dP = Object.assign({}, q.etapes[2].defi, { vitesse:4000 }); a.etape = 2;
  async function pirater(juste){
    ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dP); _defiWire(z, dP); const m0 = msgs.length;
    const zone = z.querySelector("#q-pir-zone"), cur = z.querySelector("#q-pir-curseur"), stop = z.querySelector("#q-pir-stop");
    for(let k = 0; k < 8000 && !ok && !ko; k++){
      await att(5); const p = parseFloat(cur.style.left) || 0, g = parseFloat(zone.style.left), w = parseFloat(zone.style.width);
      const dedans = p >= g + 0.5 && p <= g + w - 0.5;
      if(juste ? dedans : (!dedans && (p < g - 3 || p > g + w + 3))) stop.click();
    }
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
    return { ok, ko, msg:dernierEchec, fin: msgs.slice(m0).includes("Matricule accepté.") };
  }
  const pG = await pirater(true), pP = await pirater(false);
  r.piratage = { gagne: pG.ok === 1 && pG.fin, perdu: pP.ko === 1 && /se rendort en ronronnant/.test(pP.msg) };
  { const d16 = QUETES.flatMap(x => x.etapes.map(e => e.defi)).find(d => d.type === "piratage" && !d.echec && !d.fini); r.autresPiratagesInchanges = !!d16; }

  // 5. Le choix (ordre du serveur v256), la récompense, le registre.
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // veilleurs,assembleurs,racines
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3
  r.recompense = q.recompense;
  const reg = q.etapes[2].defi.reussite.join(" ");
  r.registre = /EN ATTENTE/.test(reg) && /Départ prévu/.test(reg) && /ARUNS — EN ATTENTE/.test(reg) && /FERMETURE — PROCÉDURE/.test(reg);
  r.navette = /NAVETTE DE SERVICE — SORTIE/.test(q.etapes[4].arrivee.join(" "));

  // 6. La prise au Nid, le texte « ailleurs » avant / après la radio (Q35), le lendemain.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id;                                // q36
  r.priseNid = _priseIci(q); majHub(); changerHub("quete");
  let hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /Aruns et Dagon — Le Nid/.test(hz) && /Le quai/.test(hz) && /Accepter la quête/.test(hz);
  etat.quetes.finJour = { q35: jourDeJeu() }; majQueteHub(); hz = document.querySelector("#hub-quete").innerHTML;
  r.lendemain = /ronfle, très fort/.test(hz) && /y penser tout seul/.test(hz) && !/Accepter la quête/.test(hz);
  etat.quetes.finJour = {}; etat.secteur = "ecart"; const B = espaceLieu("base"); etat.posEspace = { x:B.x, y:B.y };
  majQueteHub(); r.ailleursApresRadio = /Ils te cherchent, au <b>Nid<\/b>/.test(document.querySelector("#hub-quete").innerHTML);
  etat.radioGorge = false; majQueteHub(); r.ailleursAvantRadio = /grésillement/.test(document.querySelector("#hub-quete").innerHTML);

  // 7. Écriture (lot 2 : les PNJ entre guillemets, jamais le joueur) ; Dagon ne rit plus (K163).
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  const dagonRit = QUETES.filter(x => ["q32","q33","q34","q35","q36"].includes(x.id)).flatMap(x => { const t = []; const tr = o => { if(typeof o === "string") t.push(o); else if(Array.isArray(o)) o.forEach(tr); else if(o && typeof o === "object") Object.values(o).forEach(tr); }; tr(x); return t; })
    .flatMap(s => s.split(/(?<=[.!?])\s+/)).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));
  r.dagonRit = dagonRit;                                                                   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
