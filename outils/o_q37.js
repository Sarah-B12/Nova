// v2.37 — Q37 « Ce qui entre » (K161, K163, K164) : chaque étape se dessine ; aucun type repris de
// Q36 ; brouillage (« signal ») et crevasse (son échec, sa fin) se gagnent et se perdent ; le choix
// « compétence » ; le journal (INDICATIF NON RECONNU — ORIGINE : TERMINUS ; l'étiquette, pas ce qu'il y
// a dedans ; DIRE AUX AUTRES…) ; la plaque reste à Dagon (pas d'objet) ; écriture ; Dagon ne rit pas.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x => setTimeout(x, ms));
  const q = queteData("q37"); r.existe = !!q; r.suitQ36 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q36")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q37", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // brouillage,choix,crevasse,ordre,scene (v2.46)
  q.etapes.forEach((e, i) => { a.etape = i; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); _seqFin();
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q37/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // e2_planete_violette ×4, e2_base
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ36 = [...types("q37")].filter(t => types("q36").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // brouillage,crevasse,ordre

  // Brouillage : « signal », « Chercher la balise » ; gagné en suivant, perdu sinon.
  const dB = q.etapes[0].defi; a.etape = 0;
  z.innerHTML = _defiHTML(dB); r.brouLibelle = /60 s de signal/.test(z.textContent) && /signal : 60 s/.test(z.textContent) && /Chercher la balise/.test(z.textContent) && !/appel/i.test(z.textContent);
  async function brouiller(suivre, duree){
    ok = 0; ko = 0; dernierEchec = ""; const d = Object.assign({}, dB, { duree, tenir:1 });
    z.innerHTML = _defiHTML(d); _defiWire(z, d); z.querySelector("#qj-br-go").click();
    const P = QUETES_JEUX.brouillage._partie; if(suivre) P.regler(P.fc + 0.05, null);
    for(let k = 0; k < 300 && !ok && !ko; k++){ await att(30); if(suivre) P.regler(null, P.cible.d); }
    _seqFin(); return { ok, ko, msg:dernierEchec };
  }
  const bG = await brouiller(true, 20), bP = await brouiller(false, 1);
  r.brouillage = { gagne: bG.ok === 1, perdu: bP.ko === 1 && /« Déjà \? »/.test(bP.msg) };

  // v2.46 : les boutons − et + (téléphone) : désactivés avant le début ; un appui = un pas ; appui maintenu =
  // le curseur avance seul ; la fréquence calée, ses boutons se désactivent ; le décalage fait le tour.
  { ok = 0; ko = 0; const d = Object.assign({}, dB, { duree:30, tenir:20 });
    z.innerHTML = _defiHTML(d); _defiWire(z, d);
    const btn = k => z.querySelector(`[data-br="${k}"]`), f = z.querySelector("#qj-br-f"), dd = z.querySelector("#qj-br-d");
    const avant = ["f-","f+","d-","d+"].every(k => btn(k) && btn(k).disabled);
    z.querySelector("#qj-br-go").click(); const P = QUETES_JEUX.brouillage._partie;
    const actifs = ["f-","f+","d-","d+"].every(k => !btn(k).disabled);
    const f0 = +f.value; btn("f+").dispatchEvent(new Event("pointerdown")); btn("f+").dispatchEvent(new Event("pointerup")); const unPas = Math.abs(+f.value - f0 - 0.02) < 1e-9;
    const d0 = +dd.value; btn("d+").dispatchEvent(new Event("pointerdown")); await att(300); btn("d+").dispatchEvent(new Event("pointerup")); const d1 = +dd.value; await att(120); const arrete = +dd.value === d1;
    dd.value = "6.27"; P.d = 6.27; btn("d+").dispatchEvent(new Event("pointerdown")); btn("d+").dispatchEvent(new Event("pointerup")); const tour = +dd.value < 0.1;
    P.regler(P.fc, null); const fCalee = btn("f-").disabled && btn("f+").disabled && !btn("d+").disabled;
    P.fini = true; _seqFin();
    r.boutonsBrouillage = { avant, actifs, unPas, maintenu: d1 - d0 > 0.1, arrete, tour, fCalee }; }   // tout vrai

  // Le choix « compétence » (ordre du serveur v257).
  r.cercles = q.etapes[1].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // assembleurs,eclats,veilleurs
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 1

  // Crevasse : le plus court chemin sort (sa fin) ; tourner en rond épuise les pas (son échec).
  const dC = q.etapes[2].defi; a.etape = 2;
  { ok = 0; a._qj = null; z.innerHTML = _defiHTML(dC); const G = a._qj, n = G.n, fin = (n - 1) * n + G.ce;
    const prev = Array(n*n).fill(-1), dir = Array(n*n).fill(""); prev[G.cs] = G.cs; const f = [G.cs];
    while(f.length){ const i = f.shift(); for(const [b, p, k] of [[1,-n,"N"],[2,1,"E"],[4,n,"S"],[8,-1,"O"]]) if(G.cases[i] & b && prev[i+p] < 0){ prev[i+p] = i; dir[i+p] = k; f.push(i+p); } }
    const chemin = []; for(let i = fin; i !== G.cs; i = prev[i]) chemin.unshift(dir[i]);
    const m0 = msgs.length; for(const k of chemin){ z.innerHTML = _defiHTML(dC); _defiWire(z, dC); z.querySelector(`[data-qcv="${k}"]`).click(); }
    r.crevasseGagnee = ok === 1 && msgs.slice(m0).some(m => /forme dorée/.test(m)); }
  { ko = 0; dernierEchec = ""; a._qj = null; z.innerHTML = _defiHTML(dC); const G = a._qj, n = G.n;
    const ouvert = k => { const b = { N:1, E:2, S:4, O:8 }[k]; return a._qj && (a._qj.cases[a._qj.pos] & b); };
    for(let s = 0; s < 400 && !ko; s++){ z.innerHTML = _defiHTML(dC); _defiWire(z, dC);
      const k = ["N","O","E","S"].find(ouvert) || "N"; z.querySelector(`[data-qcv="${k}"]`).click(); }
    r.crevassePerdue = ko === 1 && /phares faiblissent/.test(dernierEchec) && /8 h/.test(dernierEchec); }

  // Le journal, la plaque, la récompense.
  const jr = q.etapes[3].defi.reussite.join(" ");
  r.journal = /INDICATIF NON RECONNU — ORIGINE : TERMINUS/.test(jr) && /MAAR-12/.test(jr) && /l'étiquette, pas ce qu'il y a dedans/.test(jr) && /DIRE AUX AUTRES DE NE PAS ESSAYER/.test(jr);
  // v2.46 : le journal est une épreuve d'ordre (était une attente) : 0 → 5 gagne ; un échange perd (son texte).
  { const dO = q.etapes[3].defi; a.etape = 3;
    ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
    for(let i = 0; i < 6; i++) z.querySelector(`.q-ordre-el[data-i="${i}"]`).click();
    z.querySelector("#q-ordre-valider").click(); const g = ok === 1 && ko === 0;
    ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
    [0,2,1,3,4,5].forEach(i => z.querySelector(`.q-ordre-el[data-i="${i}"]`).click());
    z.querySelector("#q-ordre-valider").click();
    r.journalOrdre = { entrees: dO.elements.length, gagne: g, perdu: ko === 1 && /à bout de souffle/.test(dernierEchec) }; }
  r.plaqueChezDagon = /ne te la rend pas/.test(q.etapes[4].arrivee.join(" ")) && !(q.recompense.objets);
  r.recompense = q.recompense;

  // Prise au Nid ; pas au Trouble.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.radioGorge = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q37, vrai
  majHub(); changerHub("quete"); r.banniere = /Ce qui entre/.test(document.querySelector("#hub-quete").innerHTML);
  const T = espaceLieu("e2_planete_violette"); etat.posEspace = { x:T.x, y:T.y }; r.priseTrouble = !_priseIci(q);

  // Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","motDuree"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.dagonRit = tout.split(/(?<=[.!?])\s+/).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans|^(dire aux autres|aux autres de|autres de ne|de ne pas|ne pas essayer)$/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
