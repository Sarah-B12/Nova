// v2.41 — Q41 « Une sonde de plus » (K166, K168) : chaque étape se dessine ; aucun type repris de
// Q40 ; séquence (son échec) et ronde (« Trappe », son échec) se gagnent et se perdent ; DÉPÔT
// ACCEPTÉ, CONSERVATION, ACCÈS : BUREAU — FERMÉ ; la Bogue montre sa trappe après Q41 ; K168 : plus
// aucun « Un temps » de Q32 à Q41 ; écriture, Dagon ne rit pas, répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x => setTimeout(x, ms));
  const q = queteData("q41"); r.existe = !!q; r.suitQ40 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q40")) + 1;
  const vraiQA = queteActive, vraiMQH = majQueteHub;
  const a = { id:"q41", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // sequence,ronde,attente,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); _seqFin();
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q41/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // e2_cercles_bleus, e2_planete_oeil ×4
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ40 = [...types("q41")].filter(t => types("q40").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // sequence,ronde

  // Séquence (tempo accéléré) : suivie → gagnée ; un feu faux → son échec.
  const dS = Object.assign({}, q.etapes[0].defi, { allume:15, pas:25 }); a.etape = 0;
  async function sequence(juste){
    ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dS); _defiWire(z, dS);
    const pads = [...z.querySelectorAll(".q-seq-pad")], vus = [], et = z.querySelector("#q-seq-etat");
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
  r.sequence = { gagnee: sG.ok === 1, perdue: sP.ko === 1 && /Recraché avant même d'avoir frappé/.test(sP.msg), longueur: dS.longueur };

  // Ronde : « Trappe », 1 point, 4 pas d'avance.
  const dR = q.etapes[1].defi; a.etape = 1;
  majQueteHub = () => { if(_seqEnCours()) return; _clearQ(); z.innerHTML = _defiHTML(dR); _defiWire(z, dR); };
  async function ronde(juste){
    ok = 0; ko = 0; dernierEchec = ""; a._qj = null; majQueteHub(); z.querySelector("#qj-ronde-go").click();
    await att(dR.observe * 650 + 400); const R = a._qj;
    R.boucles.forEach(b => { const bonne = b[(R.t + dR.avance) % b.length]; z.querySelector(`[data-qr="${juste ? bonne : (bonne + 1) % 36}"]`).click(); });
    return { ok, ko, msg:dernierEchec };
  }
  const rG = await ronde(true), rP = await ronde(false);
  r.ronde = { gagnee: rG.ok === 1, perdue: rP.ko === 1 && /plaque fermée/.test(rP.msg), nom: dR.nom, nb: dR.nb, avance: dR.avance };
  majQueteHub = vraiMQH;

  r.attenteMs = q.etapes[2].defi.duree;                                                 // 1800000
  r.depotAccepte = /DÉPÔT ACCEPTÉ/.test(q.etapes[2].defi.reussite.join(" "));
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // veilleurs,assembleurs,eclats
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3
  const fond = q.etapes[4].arrivee.join(" ");
  r.fond = /CONSERVATION/.test(fond) && /ACCÈS : BUREAU — FERMÉ/.test(fond) && /en morceaux/.test(fond);
  r.recompense = q.recompense;

  // La Bogue : sa description change après Q41 (bogueDepot), et revient si le drapeau manque.
  etat.secteur = "ceres"; etat.bogueDepot = false; carteEspace("ceres").lieux(); const B = espaceLieu("e2_planete_oeil");
  const avant = B.desc; etat.bogueDepot = true; carteEspace("ceres").lieux(); const apres = B.desc;
  etat.bogueDepot = false; carteEspace("ceres").lieux();
  r.bogue = { avant: /close de partout/.test(avant), apres: /trappe éclairée : DÉPÔT/.test(apres), retour: B.desc === avant };

  // Prise au Nid.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q41, vrai

  // K168 : plus aucun « Un temps » de Q32 à Q41.
  const texteDe = x => { const t = []; const tr = o => { if(typeof o === "string") t.push(o); else if(Array.isArray(o)) o.forEach(tr); else if(o && typeof o === "object") Object.values(o).forEach(tr); }; tr(x); return t.join(" "); };
  r.unTempsQ32Q41 = QUETES.filter(x => +x.id.slice(1) >= 32 && +x.id.slice(1) <= 41).map(x => (texteDe(x).match(/Un temps/g) || []).length).reduce((s, n) => s + n, 0);   // 0

  // Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom"].includes(k)) tour(v); }); };
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
