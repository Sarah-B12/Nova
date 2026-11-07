// v2.43 — Q43 « Quatre » (K167) : chaque étape se dessine ; aucun type repris de Q42 ; réaction
// (« Réveiller la mémoire », son échec) et glyphes (QUA·TRE, son échec) se gagnent et se perdent ;
// le son QUA (Π barré) nouveau et unique, la dernière forme libre gardée pour TAINE ; l'ordre de
// coupure (les quatre secteurs, Cérès, MOTIF : VOIR DOSSIER MAAR — sans le mot) ; Asulf donne la
// quête à La Toundra ; Q41 renommée (pas deux titres pareils) ; écriture.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q43"); r.existe = !!q; r.suitQ42 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q42")) + 1;
  const vraiQA = queteActive, vraiMQH = majQueteHub;
  const a = { id:"q43", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // reaction,glyphes,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.lieu !== "antenne") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q43/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.carte = _cibleResolue(q.etapes[0].cible).carte;                                       // espace (Triptolème)
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ42 = [...types("q43")].filter(t => types("q42").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // reaction,glyphes

  // Réaction : la solution gagne (« La mémoire s'allume. ») ; deux essais ratés = son échec.
  const dR = q.etapes[0].defi; a.etape = 0; a._qj = null;
  majQueteHub = () => { z.innerHTML = _defiHTML(dR); _defiWire(z, dR); }; majQueteHub();
  r.reacBouton = /Réveiller la mémoire/.test(z.textContent);
  { const R = a._qj.R, N = R.w * R.h; let sol = null;
    for(let i = 0; i < N && !sol; i++) for(let j = i + 1; j < N && !sol; j++) for(let k = j + 1; k < N && !sol; k++){ const l = _reacAllume(R, [i, j, k]); if(R.bornes.every(b => l.has(b))) sol = [i, j, k]; }
    ok = 0; const m0 = msgs.length; for(const i of sol) z.querySelector(`[data-reac="${i}"]`).dispatchEvent(new MouseEvent("click", { bubbles:true }));
    z.querySelector("#qj-reac-go").click(); r.reacGagnee = ok === 1 && msgs.slice(m0).includes("La mémoire s'allume."); }
  ok = 0; ko = 0; dernierEchec = ""; a._qj = null; majQueteHub();
  for(let e = 0; e < 2; e++){ const S2 = a._qj; S2.choix = [0]; majQueteHub(); if(S2.R.bornes.every(b => _reacAllume(S2.R, [0]).has(b))) break; z.querySelector("#qj-reac-go").click(); }
  r.reacPerdue = ko === 1 && /vexé pour lui/.test(dernierEchec);
  majQueteHub = vraiMQH;

  // Glyphes : QUA·TRE ; les bons sens gagnent, une erreur perd (son texte).
  const dG = q.etapes[1].defi; a.etape = 1;
  const repondre = bon => { ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dG); _defiWire(z, dG);
    const sels = [...z.querySelectorAll(".q-gly-sel")]; sels.forEach((s, i) => { s.value = dG.paires[i].sens; }); if(!bon) sels[3].value = "Trois";
    z.querySelector("#q-gly-valider").click(); };
  repondre(true); r.glyphesGagnes = ok === 1; repondre(false); r.glyphesPerdus = ko === 1 && /un relais n'y aurait rien compris/.test(dernierEchec);
  r.sonQua = { existe: !!GLYPHES_ANCIEN.QUA, forme: (GLYPHES_ANCIEN.QUA || []).join("/"), avecConnu: !!GLYPHES_ANCIEN.TRE && !!GLYPHES_ANCIEN.RAN,
    unique: Object.values(GLYPHES_ANCIEN).filter(g => g.join("/") === (GLYPHES_ANCIEN.QUA || []).join("/")).length === 1, nbSons: Object.keys(GLYPHES_ANCIEN).length };   // I/barre, 40
  r.taineEncoreLibre = Object.entries(GLYPHES_ANCIEN).every(([k, g]) => g.join("/") !== "S/trait" || k === "TAINE");   // vrai (v2.44 : réservée à TAINE)

  r.cercles = q.etapes[2].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // veilleurs,langues,assembleurs
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 2
  r.recompense = q.recompense;
  const fin = q.etapes[3].arrivee.join(" ");
  r.ordre = /COUPURE DES LIAISONS/.test(fin) && /MAAR-3, MAAR-7, MAAR-9, MAAR-12/.test(fin) && /RELAIS DE CÉRÈS, QUI LES REÇOIT/.test(fin) && /MOTIF : VOIR DOSSIER MAAR/.test(fin);
  r.pasMechante = /On coupe quand on a peur de quelque chose/.test(fin);
  r.motifPasEcrit = !/QUA·RAN|QUARANT/i.test(JSON.stringify(q));

  // Q41 renommée : aucun titre de quête en double.
  const noms = QUETES.map(x => x.nom); r.titresEnDouble = noms.filter((n, i) => noms.indexOf(n) !== i);   // []
  r.q41 = queteData("q41").nom;                                                          // Dépôt accepté

  // Asulf donne la quête à La Toundra ; pas ailleurs.
  queteActive = vraiQA; etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  r.prochaine = queteProchaine() && queteProchaine().id;                                // q43
  etat.secteur = "silene"; etat.faction = "ignis"; etat.radioGorge = true;
  etat.pos = { x:VILLES.toundra.x, y:VILLES.toundra.y }; r.priseToundra = _priseIci(q); // vrai
  majHub(); changerHub("quete"); const hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /asulf_toundra_2\.png/.test(hz) && /data-repli="images\/quetes\/asulf_toundra_1\.png"/.test(hz) && /Asulf — La Toundra/.test(hz) && /Quatre/.test(hz);
  etat.pos = { x:VILLES.ignis.x, y:VILLES.ignis.y }; r.priseAilleurs = !_priseIci(q);    // vrai

  // Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","sons","picto"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 0
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques|répètes)[^.«]*«)/i.test(tout);   // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée","cill"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  const VOULU = /^(ordre du bureau|maar- maar- maar-)$/;   // l'ordre du Bureau, cité deux fois (en-tête, puis en clair)
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !VOULU.test(t) && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
