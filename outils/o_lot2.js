// v1.87 — LOT 2 (Q21 → Q25) : chaque étape se dessine et se branche ; les épreuves
// nouvelles (tir, goupilles, réaction, rangement) se gagnent et se perdent ; la prise à
// la station ; l'air mince d'Ancolie (K47) ; le gisement de Sélénite (K48).
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x=>setTimeout(x,ms));
  const a = { id:"q21", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  majQueteHub = () => {}; sauverMaintenant = async () => {};
  let ok = 0, ko = 0, dernierEchec = ""; reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const motifs = []; agirServeur = async (o) => { motifs.push(o.motif); return { ok:true, ajoutes:o.ajouter || {} }; };
  const jOrig = journal; let journaux = []; journal = (t) => { journaux.push(String(t)); };
  const z = document.createElement("div"); document.body.appendChild(z);
  const IDS = ["q21","q22","q23","q24","q25"];

  // 1. Toutes les étapes se dessinent et se branchent ; cibles et images.
  r.etapes = {};
  for(const id of IDS){
    const q = queteData(id); r.etapes[id] = q.etapes.map(e => e.defi.type).join(",");
    q.etapes.forEach((e, i) => { a.id = id; a.etape = i; a._qj = null; a._tri = null; a._lab = null; a._trav = null; a._calq = null; a._memVue = false; a._memDebut = 0;
      try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
           if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${id}/${i} : épreuve inconnue ${e.defi.type}`);
           if(!_cibleResolue(e.cible)) r.erreurs.push(`${id}/${i} : cible introuvable`);
           const im = (e.image && typeof e.image === "object") ? e.image.valeurs[e.image.defaut] : e.image;   // v1.93j : bannière selon la bête
           if(im !== `images/quetes/${id}/${i + 1}.png`) r.erreurs.push(`${id}/${i} : image ${im}`);
      }catch(err){ r.erreurs.push(`${id}/${i} : ${err.message}`); } });
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
    _seqFin();
  }
  // Jamais le même type dans deux quêtes consécutives (hors choix, attente) — Q20 compris.
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente"].includes(t)));
  r.repetitions = []; ["q20",...IDS].reduce((p, c) => { for(const t of types(c)) if(types(p).has(t)) r.repetitions.push(`${p}/${c}:${t}`); return c; });

  // 2. La prise à la station.
  etat.quetes = { done:["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q14","q15","q16","q17","q18","q19","q20"], active:null, verrous:{} };
  const qp = queteProchaine(); r.prochaine = qp && qp.id;
  etat.secteur = "silene"; r.priseSilene = _priseIci(qp);
  etat.secteur = "ancolie"; etat.surface = { x:1110, y:960, abord:true }; r.priseQuai = _priseIci(qp);
  etat.surface = { x:1031, y:880, abord:false }; r.priseStation = _priseIci(qp);
  etat.surface = { x:1780, y:600, abord:false }; r.priseLac = _priseIci(qp);

  // 3. L'air d'Ancolie (K47).
  const cA = SURFACES.ancolie;
  r.air = { o2Mult:cA.o2Mult, airLibre:!!cA.air, abri:cA.abri };
  etat.surface = { x:1031, y:1040, abord:false }; r.air.bord160 = aLaStation();
  etat.surface = { x:1031, y:1041, abord:false }; r.air.hors161 = aLaStation();
  etat.surface = { x:640, y:520, abord:false }; r.air.retourRelais = coutRetourVaisseau();
  const cRel = coutBraise(1031, 880); r.air.coutAller = cRel && cRel.coutO;
  // Entrer dans la zone de la station refait l'air (appel serveur après la sauvegarde).
  motifs.length = 0; etat.enPause = false; etat.jauges = etat.jauges || {}; etat.jauges.o2 = 90; etat.energie = 100;
  const vqa = queteActive; queteActive = () => null;
  await voyagerBraise(1031, 880); r.air.motifsEntree = motifs.slice();
  motifs.length = 0; await voyagerBraise(1200, 700); r.air.motifsSortie = motifs.slice();
  queteActive = vqa;

  // 4. Le tir (Q21) : gagné en visant juste, perdu à court de coups.
  const dT = Object.assign({}, queteData("q21").etapes[1].defi, { cible:3, duree:20 });
  ok = 0; ko = 0; a.id = "q21"; a.etape = 1; a._qj = null;
  z.innerHTML = _defiHTML(dT); _defiWire(z, dT); z.querySelector("#qj-tir-go").click();
  const svgT = z.querySelector("#qj-tir");
  for(let k = 0; k < 120 && !ok; k++){ await att(100);
    const P = QUETES_JEUX.tir._partie; for(const o of (P.objets || []).slice()){ const ev = new MouseEvent("pointerdown", { clientX:o.x, clientY:o.y, bubbles:true }); svgT.dispatchEvent(ev); } }
  r.tirGagne = ok === 1 && ko === 0;
  ok = 0; ko = 0; a._qj = null; const dT2 = Object.assign({}, dT, { tirs:1 });
  z.innerHTML = _defiHTML(dT2); _defiWire(z, dT2); z.querySelector("#qj-tir-go").click();
  z.querySelector("#qj-tir").dispatchEvent(new MouseEvent("pointerdown", { clientX:299, clientY:1, bubbles:true }));
  r.tirPerdu = ko === 1 && ok === 0; r.seqLibere = !_seqEnCours();

  // 5. Les goupilles (Q23) : gagnées en frappant dans le vert ; deux fêlures = échec.
  const dG = queteData("q23").etapes[1].defi;
  ok = 0; ko = 0; a.id = "q23"; a.etape = 1;
  z.innerHTML = _defiHTML(dG); _defiWire(z, dG); z.querySelector("#qj-goup-go").click();
  let M = QUETES_JEUX.goupilles._partie;
  for(let k = 0; k < dG.nb; k++){ M.etat.pos = 0.5; M.coup(); }
  r.goupillesGagnees = ok === 1 && ko === 0;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dG); _defiWire(z, dG); z.querySelector("#qj-goup-go").click();
  M = QUETES_JEUX.goupilles._partie; M.etat.pos = 0.5; M.coup(); M.etat.pos = 0.02; M.coup(); r.goupillesUneFelure = ko === 0 && M.etat.k === 0;
  M.etat.pos = 0.02; M.coup(); r.goupillesDeuxFelures = ko === 1;
  _seqFin();
  // v1.89f — le coup part à l'APPUI (pointerdown), pas au clic ; un clic seul ne frappe pas.
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dG); _defiWire(z, dG); z.querySelector("#qj-goup-go").click();
  M = QUETES_JEUX.goupilles._partie;
  M.etat.pos = 0.5; z.querySelector("[data-gp-coup]").dispatchEvent(new MouseEvent("pointerdown", { bubbles:true, cancelable:true }));
  r.goupillesAppui = M.etat.k === 1;
  M.etat.pos = 0.5; z.querySelector("[data-gp-coup]").click(); r.goupillesClicSeulSansEffet = M.etat.k === 1;
  M.arreter(); _seqFin();

  // 6. La réaction en chaîne (Q22) : niveaux tirés, toujours solubles, jamais à n − 1 ; on gagne avec la solution.
  const gen = []; const t0 = Date.now();
  for(let k = 0; k < 15; k++){ const R = reacGenerer(7, 5, 3, 8, 2); gen.push(R ? { b:R.bornes.length, s:_reacSolutions(R, 3, 10), s2:_reacSolutions(R, 2, 1) } : null); }
  r.reaction = { nulls:gen.filter(x => !x).length, bornes:[...new Set(gen.filter(Boolean).map(x => x.b))], maxSol:Math.max(...gen.filter(Boolean).map(x => x.s)), aDeux:gen.filter(x => x && x.s2 > 0).length, msParNiveau:Math.round((Date.now() - t0) / 15) };
  const dR = queteData("q22").etapes[1].defi; ok = 0; ko = 0; a.id = "q22"; a.etape = 1; a._qj = null;
  z.innerHTML = QUETES_JEUX.reaction.html(dR); const S = a._qj, R = S.R, N = R.w * R.h;
  let sol = null; for(let i = 0; i < N && !sol; i++) for(let j = i + 1; j < N && !sol; j++) for(let k = j + 1; k < N && !sol; k++){ const l = _reacAllume(R, [i, j, k]); if(R.bornes.every(b => l.has(b))) sol = [i, j, k]; }
  majQueteHub = () => { z.innerHTML = _defiHTML(dR); _defiWire(z, dR); }; majQueteHub();
  for(const i of sol) z.querySelector(`[data-reac="${i}"]`).dispatchEvent(new MouseEvent("click", { bubbles:true }));
  z.querySelector("#qj-reac-go").click(); r.reactionGagnee = ok === 1;
  // Raté deux fois → échec.
  ok = 0; ko = 0; a._qj = null; majQueteHub();
  for(let e = 0; e < 2; e++){ const S2 = a._qj; const mauvais = [...Array(N).keys()].find(i => !R.bornes.length || true); S2.choix = [0]; majQueteHub();
    const R2 = S2.R; if(R2.bornes.every(b => _reacAllume(R2, [0]).has(b))) break; z.querySelector("#qj-reac-go").click(); }
  r.reactionPerdue = ko === 1;
  majQueteHub = () => {};

  // 7. Le rangement (Q24) : on le résout (retour sur trace) et on le pose case par case.
  const dRg = queteData("q24").etapes[0].defi; ok = 0; a.id = "q24"; a.etape = 0; a._qj = null;
  z.innerHTML = _defiHTML(dRg); const RG = a._qj.R;
  const occ = Array(RG.w * RG.h).fill(-1), plan = [];
  const resoudre = (k) => {
    const libre = occ.indexOf(-1); if(libre < 0) return true;
    for(let p = 0; p < RG.pieces.length; p++){ if(plan.some(x => x.p === p)) continue;
      for(let rot = 0; rot < 4; rot++){ const c = _rgCellules(RG.pieces[p], rot);
        const [ax, ay] = c.slice().sort((u, v) => u[1] - v[1] || u[0] - v[0])[0];
        const x0 = libre % RG.w - ax, y0 = Math.floor(libre / RG.w) - ay;
        if(x0 < 0 || y0 < 0 || c.some(([u, v]) => x0 + u >= RG.w || y0 + v >= RG.h || occ[(y0 + v) * RG.w + x0 + u] >= 0)) continue;
        c.forEach(([u, v]) => occ[(y0 + v) * RG.w + x0 + u] = p); plan.push({ p, rot, x:x0, y:y0 });
        if(resoudre(k + 1)) return true;
        plan.pop(); c.forEach(([u, v]) => occ[(y0 + v) * RG.w + x0 + u] = -1); } }
    return false; };
  r.rangement = { pieces:RG.pieces.length, soluble:resoudre(0) };
  majQueteHub = () => { z.innerHTML = _defiHTML(dRg); _defiWire(z, dRg); }; majQueteHub();
  for(const s of plan){
    z.querySelector(`[data-qrg-piece="${s.p}"]`).click();
    for(let k = 0; k < s.rot; k++) z.querySelector("#qj-rg-tourner").click();
    const an = _rgAncre(_rgCellules(RG.pieces[s.p], s.rot));
    z.querySelector(`[data-qrg-case="${(s.y + an[1]) * RG.w + s.x + an[0]}"]`).click();
  }
  r.rangement.gagne = ok === 1; r.rangement.poses = RG.pose.length; r.rangement.journal = journaux.slice(-3); majQueteHub = () => {};

  // 8. Triangulation à source fixe (Q23), mémoire en code compact (Q24), énigme par mots-clés (Q25).
  a.id = "q23"; a.etape = 0; a._tri = null; const tri = _triEtat(queteData("q23").etapes[0].defi); r.triSource = tri && tri.src;
  const dM = queteData("q24").etapes[1].defi; ok = 0; ko = 0; a.id = "q24"; a.etape = 1; a._memVue = true;
  z.innerHTML = _defiHTML(dM); _defiWire(z, dM); z.querySelector("#q-mem-champ").value = "7 b 12 / 409"; z.querySelector("#q-mem-btn").click();
  r.memoireCompacte = ok === 1;
  const dE = queteData("q25").etapes[2].defi; a.id = "q25"; a.etape = 2; r.enigme = {};
  for(const rep of ["Il serait radié", "déserteur", "comme Sorn", "rien", "il partirait"]){ ok = 0; z.innerHTML = _defiHTML(dE); _defiWire(z, dE); z.querySelector("#q-enig-champ").value = rep; z.querySelector("#q-enig-btn").click(); r.enigme[rep] = ok === 1; }

  // 9. Le gisement de Sélénite (K48).
  etat.secteur = "ancolie"; etat.surface = { x:1780, y:600, abord:false }; etat.seleniteConnue = false; etat.selenite = null;
  r.sel = { cacheAvantQ23:!surSelenite() && !lieuBraiseIci() };
  etat.seleniteConnue = true; r.sel.visibleApres = surSelenite() && lieuBraiseIci().id === "selenite";
  const J = JOUR_MS;
  etat.selenite = { debut:Date.now() - 2 * J }; r.sel.pousse2j = Math.round(selenitePousse() * 100);
  const zs = document.createElement("div"); document.body.appendChild(zs);
  majSelenite(zs); r.sel.boutonJeune = !!zs.querySelector("#sel-degager");
  etat.selenite = { debut:Date.now() - 4.5 * J }; majSelenite(zs); r.sel.boutonMure = !!zs.querySelector("#sel-degager");
  // Gel : mûre et oubliée (7 jours) → fendue, repartie de la moitié il y a 1 jour → 75 %.
  etat.selenite = { debut:Date.now() - 7 * J }; r.sel.apresGel = Math.round(selenitePousse() * 100); r.sel.gels = etat.selenite.gels;
  // Dégager : énergie d'abord, puis les coups ; gagné → 1 ou 2 cristaux, l'aiguille repart de zéro.
  etat.energie = 100; etat.selenite = { debut:Date.now() - 4.2 * J }; majSelenite(zs); motifs.length = 0;
  const vAgir = agirServeur; let ajout = null; agirServeur = async (o) => { motifs.push(o.motif); if(o.ajouter) ajout = o.ajouter; return { ok:true, ajoutes:o.ajouter || {} }; };
  const gm = goupillesMoteur; let moteur = null; goupillesMoteur = (zone, o) => { moteur = gm(zone, o); return moteur; };
  await seleniteDegager(zs);
  for(let k = 0; k < SELENITE_COUPS; k++){ moteur.etat.pos = 0.5; moteur.coup(); } await att(20);
  r.sel.gagne = { motifs:motifs.slice(), ajout, repart:Math.round(selenitePousse() * 100) };
  // Raté : fendue, repart de la moitié.
  etat.selenite = { debut:Date.now() - 4.2 * J }; majSelenite(zs); await seleniteDegager(zs); moteur.etat.pos = 0.01; moteur.coup(); await att(80);
  r.sel.rateRepart = Math.round(selenitePousse() * 100);
  goupillesMoteur = gm; agirServeur = vAgir;
  // La part des doublés (25 %).
  let deux = 0; for(let k = 0; k < 20000; k++) if(Math.random() < SELENITE_DOUBLE) deux++; r.sel.partDeux = Math.round(deux / 200);
  // L'onglet « Le Gisement » au lac, « Quêtes » à la station.
  etat.surface = { x:1780, y:600, abord:false }; majHub(); r.sel.ongletGisement = document.querySelector('.hub-lien[data-hub="gisement"]').style.display !== "none";
  etat.surface = { x:1031, y:880, abord:false }; majHub(); r.ongletQueteStation = document.querySelector('.hub-lien[data-hub="quete"]').style.display !== "none";

  // 9 bis. v1.87c — un clic ne redessine que l'épreuve : la bannière reste le MÊME nœud,
  // et l'onglet entier n'est jamais reconstruit (la page ne saute plus).
  { let complets = 0; const vMaj = majQueteHub; majQueteHub = () => { complets++; };
    a.id = "q17"; a.etape = 0; a._qj = null;
    const dC = queteData("q17").etapes[0].defi, hub = document.createElement("div"); document.body.appendChild(hub);
    hub.innerHTML = `<img id="banniere-test" src="x.png">` + _defiHTML(dC); _defiWire(hub, dC);
    const img = hub.querySelector("#banniere-test"), g = a._qj;
    // un pas possible depuis la case de départ
    const k = ["N","E","S","O"].find(k => g.cases[g.pos] & { N:1, E:2, S:4, O:8 }[k]);
    hub.querySelector(`[data-qcv="${k}"]`).click();
    const k2 = ["N","E","S","O"].find(k => g.cases[g.pos] & { N:1, E:2, S:4, O:8 }[k]);
    hub.querySelector(`[data-qcv="${k2}"]`).click();
    r.redessinLocal = { pas:g.pas, banniereIntacte:hub.querySelector("#banniere-test") === img, redessinsComplets:complets };
    majQueteHub = vMaj; hub.remove(); }

  // 9 ter. v1.87f — calques : la 3e bande arrive à l'envers en Q15, Q18 et Q25 (⇄) ; `inverse:false` reste possible.
  { r.calques = {};
    const essai = (id, etape) => { a.id = id; a.etape = etape; a._calq = null; ok = 0;
      const d = queteData(id).etapes[etape].defi; const zc = document.createElement("div"); document.body.appendChild(zc);
      zc.innerHTML = _htmlCalques(d); _wireCalques(zc, d); const c = a._calq;
      const info = { bouton:!!zc.querySelector("[data-qc-inv]"), consigneEnvers:/retourne la dernière bande/.test(zc.innerHTML) };
      c.oB = c.solB; c.oC = c.solC; if(info.bouton) c.inv = true;     // la bonne position (et retournée si besoin)
      zc.querySelector("#q-calq-ok").click(); info.gagne = ok === 1; zc.remove(); return info; };
    r.calques.q15 = essai("q15", 3); r.calques.q18 = essai("q18", 1); r.calques.q25 = essai("q25", 1);
    a.id = "q18"; a.etape = 1; a._calq = Object.assign(_calqGenerer(true)); delete a._calq.invActif;   // partie commencée avant v1.87e
    const zc = document.createElement("div"); zc.innerHTML = _htmlCalques(queteData("q18").etapes[1].defi); r.calques.ancienneGardeBouton = !!zc.querySelector("[data-qc-inv]");
    { a._calq = null; const dSans = Object.assign({}, queteData("q18").etapes[1].defi, { inverse:false }); const zs = document.createElement("div");
      zs.innerHTML = _htmlCalques(dSans); r.calques.sansRetournement = !zs.querySelector("[data-qc-inv]"); } }

  // 9 quater. v1.87g — traversée : un pari forcé ne coûte pas de plaque, une erreur évitable si.
  { const d = queteData("q19").etapes[1].defi, C = d.colonnes, L = d.lignes; r.traversee = {};
    const jouerClic = (etatTrav, i) => { a.id = "q19"; a.etape = 1; a._trav = JSON.parse(JSON.stringify(etatTrav));
      const zt = document.createElement("div"); document.body.appendChild(zt); zt.innerHTML = _defiHTML(d); _defiWire(zt, d);
      zt.querySelector(`#q-trav-grille [data-i="${i}"]`).click(); const p = a._trav.plaques; zt.remove(); return p; };
    const acc = (t, i) => !t.vus.includes(i) && _travVoisins(i, C, L).some(n => t.vus.includes(n) && !t.lave[n]);
    let force = null, evitable = null;
    for(let k = 0; k < 400 && !(force && evitable); k++){
      const g = _travGenerer(C, L, d.lave), t = { lave:g.lave, vus:[g.depart], marques:[], plaques:3 };
      for(let pas = 0; pas < 40; pas++){
        const cand = [...Array(C * L).keys()].filter(i => acc(t, i)), laveAcc = cand.filter(i => t.lave[i]), sures = cand.filter(i => !t.lave[i]);
        if(laveAcc.length){ const existe = _travCaseSureExiste(C, L, t.lave, t.vus);
          if(!existe && !force) force = { t:JSON.parse(JSON.stringify(t)), i:laveAcc[0] };
          if(existe && !evitable) evitable = { t:JSON.parse(JSON.stringify(t)), i:laveAcc[0] }; }
        if(!sures.length) break; const i = sures[Math.floor(Math.random() * sures.length)]; t.vus.push(i); if(i < C) break;
      }
    }
    r.traversee.pariForceGratuit = force ? jouerClic(force.t, force.i) === 3 : "introuvable";
    r.traversee.erreurEvitablePayee = evitable ? jouerClic(evitable.t, evitable.i) === 2 : "introuvable";
    r.traversee.consigne = /tenter ta chance/.test(_defiHTML(d)); }

  // 9 quinquies. v1.87h — l'épreuve impossible (Q20) refuse le collage, la ligne ne se copie pas.
  { const d = queteData("q20").etapes[2].defi; a.id = "q20"; a.etape = 2; a._qj = null; journaux = [];
    const zi = document.createElement("div"); document.body.appendChild(zi); zi.innerHTML = _defiHTML(d); _defiWire(zi, d);
    const chAvant = zi.querySelector("#qj-imp-champ"), lgAvant = zi.querySelector("#qj-imp-ligne").textContent;
    r.impossibleAvant = { champFerme:chAvant.disabled, ligneMasquee:/^░+$/.test(lgAvant) };
    zi.querySelector("#qj-imp-go").click(); const ch = zi.querySelector("#qj-imp-champ");
    r.impossibleAvant.apres = { champOuvert:!ch.disabled, ligneVisible:!/░/.test(zi.querySelector("#qj-imp-ligne").textContent) };
    const ev = new Event("paste", { bubbles:true, cancelable:true }); ch.dispatchEvent(ev);
    const cp = new Event("copy", { bubbles:true, cancelable:true }); zi.querySelector("#qj-imp-ligne").dispatchEvent(cp);
    r.impossibleColle = { collageRefuse:ev.defaultPrevented, copieRefusee:cp.defaultPrevented, asulf:journaux.some(t => /Copier-coller/.test(t)),
      nonSelectionnable:/user-select:none/.test(zi.innerHTML) };
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; } _seqFin(); zi.remove(); }

  // 9 sexies. v1.87k — une seule ligne sous la carte, pas de 🚀 sur la station.
  { etat.secteur = "ancolie"; etat.surface = { x:391, y:1250, abord:false }; majCarteBraise();
    const inf = document.querySelector("#braise-info");
    r.ligneCarte = { chute:inf.textContent, uneLigne:/nowrap/.test(inf.getAttribute("style") || ""), bulle:!!inf.querySelector("b[title]"),
      fuseeStation:/🚀\s*La station/.test(document.querySelector("#carte-braise").innerHTML) };
    etat.surface = { x:1031, y:880, abord:true }; majCarteBraise(); r.ligneCarte.station = inf.textContent; }

  // 9 septies. v1.88 — K55 : le bar de la station, après Q20, à gauche de « Quêtes ».
  { const vRpc = sb.rpc; let appels = [];
    sb.rpc = async (nom, args) => { appels.push(nom);
      if(nom === "bar_catalogue") return { data:[ { id:"eau", nom:"Eau trouble", faction:null, prix:100, texte:"" }, { id:"terreau", nom:"Terreau", faction:"cultivateurs", prix:200, texte:"" } ], error:null };
      if(nom === "boisson_etat") return { data:{ ok:true, active:false }, error:null };
      if(nom === "boire") return { data:{ ok:true, id:"eau", nom:"Eau trouble", tirage:"bon", mods:{ moral_immediate:5 }, prix:100, solde:900, fin:new Date(Date.now()+864e5).toISOString() }, error:null };
      return { data:null, error:null }; };
    _barCatalogue = null; journaux = [];
    etat.secteur = "ancolie"; etat.surface = { x:1031, y:880, abord:false };
    etat.ancolie = false; r.bar = { avantQ20:barStation() };
    etat.ancolie = true; r.bar.apresQ20 = barStation();
    majHub(); const onglet = document.querySelector('.hub-lien[data-hub="bar"]');
    r.bar.ongletVisible = onglet.style.display !== "none";
    r.bar.avantQuetes = onglet.nextElementSibling && onglet.nextElementSibling.dataset.hub === "quete";
    const zb = document.querySelector("#bar-vue"); await majBar(zb); await att(30);
    r.bar.titre = (zb.querySelector("h3") || {}).textContent;
    r.bar.boissons = [...zb.querySelectorAll("[data-boire]")].map(b => b.dataset.boire);
    // v1.90b — K57 : la carte du jour ajoute les boissons de faction qu'elle nomme.
    { const v0 = sb.rpc; sb.rpc = async (n, a) => n === "bar_menu_station" ? { data:["terreau"], error:null } : v0(n, a);
      await majBar(zb); await att(30); r.bar.carteDuJour = [...zb.querySelectorAll("[data-boire]")].map(b => b.dataset.boire);
      r.bar.mention = /carte du jour/.test(zb.textContent); sb.rpc = v0; await majBar(zb); await att(30); }
    zb.querySelector('[data-boire="eau"]').click(); await att(60);
    r.bar.impute = journaux.some(t => /Imputé au matricule 42-U1F/.test(t));   // v1.88c : une seule ligne
    etat.surface = { x:1780, y:600, abord:false }; r.bar.horsStation = !barStation();
    // v1.88b : la ligne de la fiche est stylée même sans passer par le bar, et s'ouvre au toucher.
    document.querySelector("#bar-style") && document.querySelector("#bar-style").remove();
    etat.boisson = { id:"eau", nom:"Eau trouble", tirage:"bon", mods:{ energie_cout:1.25 }, fin:new Date(Date.now()+3600e3).toISOString() };
    majBoissonFiche(); const fb = document.querySelector("#fiche-boisson"), lg = fb.querySelector(".bo-ligne");
    r.bar.fiche = { style:!!document.querySelector("#bar-style"), nomSeul:lg.childNodes.length && !/—/.test(lg.querySelector("b").parentNode.firstElementChild.nextSibling.textContent || ""),
      fermee:!lg.classList.contains("ouvert") };
    lg.click(); r.bar.fiche.ouverteAuToucher = lg.classList.contains("ouvert");
    majBoissonFiche(); r.bar.fiche.resteOuverteAuRedessin = !!fb.querySelector(".bo-ligne.ouvert");
    document.body.click(); r.bar.fiche.fermeeAilleurs = !fb.querySelector(".bo-ligne.ouvert");
    sb.rpc = vRpc; etat.boisson = null; }

  // 9 octies. v1.88c — les lignes de quête vont dans « Quêtes » ; le journal se lit au-delà de 80.
  { journal = jOrig; const av = etat.journal; etat.journal = [];
    journal("Ta lampe baisse. Tu rebrousses chemin à tâtons, la main sur la paroi. Nouvelle tentative plus tard.", "alerte");
    journal("Un courant te happe : la coque se tord, et une jointure de Cristal saute.", "alerte");
    journal(queteData("q16").etapes[6].defi.options[1].journal, "gain");
    journal("Tu as récolté 3 sporelles.", "gain");
    r.journalQuetes = etat.journal.map(e => e.cat);
    etat.journal = Array.from({ length:150 }, (_, k) => ({ t:"ligne " + k, type:"", cat:"systeme", d:Date.now() - k * 1000 }));
    majJournal(); const jz = document.querySelector("#journal");
    r.journalPlus = { avant:jz.querySelectorAll(".msg").length, bouton:!!jz.querySelector("#journal-plus") };
    jz.querySelector("#journal-plus").click(); r.journalPlus.apres = jz.querySelectorAll(".msg").length;
    etat.journal = av; journal = (t) => { journaux.push(String(t)); }; }

  // 9 nonies. v1.88d — le vrai bonneteau (animation, choix, journal) et les dés détaillés.
  { const vRpc = sb.rpc; journaux = []; let choisi = null;
    sb.rpc = async (nom, args) => {
      if(nom === "bonneteau_etat") return { data:{ ok:true, partie:false }, error:null };
      if(nom === "bonneteau_ouvrir") return { data:{ ok:true, mise:args.p_mise, depart:2, melanges:[[1,2],[2,3],[1,3]], mult:2, solde:900 }, error:null };
      if(nom === "bonneteau_choisir"){ choisi = args.p_gobelet; return { data:{ ok:true, choix:args.p_gobelet, bon:3, gagne:args.p_gobelet === 3, mise:100, gain:200, net:100, solde:1100 }, error:null }; }
      if(nom === "jeu_des") return { data:{ ok:true, pari:"haut", d1:3, d2:2, total:5, gagne:false, mise:50, gain:0, net:-50, solde:950 }, error:null };
      return { data:null, error:null }; };
    const zb = document.createElement("div"); document.body.appendChild(zb);
    await _tableBonneteau(zb); zb.querySelector("#bon-mise").value = "100"; zb.querySelector("#bon-go").click();
    await att(6500);
    // départ 2 → [1,2] : 1 → [2,3] : 1 → [1,3] : 3. La bille est sous le gobelet de droite.
    const gob = [...zb.querySelectorAll(".bon-gob")].find(g => g.style.left.startsWith("calc(82%"));
    const choixPret = zb.querySelector("#bon-table").classList.contains("choix");
    gob.click(); await att(60);
    r.bonneteau = { choixPret, gobeletDeDroite:choisi === 3, billeDessous:gob.classList.contains("a-bille"),
      journal:journaux.find(t => /Bonneteau/.test(t)) || "" };
    const zd = document.createElement("div"); document.body.appendChild(zd); _tableDes(zd);
    zd.querySelector("#des-lancer").click(); await att(2500);
    r.des = journaux.find(t => /Dés du fond/.test(t)) || "";
    sb.rpc = vRpc; zb.remove(); zd.remove(); }

  // 9 decies. v1.88e — par le VRAI chemin de l'interface (onglet Bar → Tables de jeu →
  // S'asseoir → Miser) : la table n'est plus remplacée par le rafraîchissement général.
  { const vRpc = sb.rpc;
    sb.rpc = async (nom, args) => {
      if(nom==="bar_catalogue") return {data:[{id:"eau",nom:"Eau trouble",faction:null,prix:100,texte:""}],error:null};
      if(nom==="boisson_etat") return {data:{ok:true,active:false},error:null};
      if(nom==="bar_jeux_etat") return {data:{ok:true,jeux:{des:"ok",cuve:"ok",bonneteau:"ok",puissance4:"ok"},mise_max:500,mise_min:50,joues_aujourdhui:0},error:null};
      if(nom==="bonneteau_etat" || nom==="cuve_etat") return {data:{ok:true,partie:false},error:null};
      if(nom==="bonneteau_ouvrir") return {data:{ok:true,mise:100,depart:2,melanges:[[1,2],[2,3]],mult:2,solde:900},error:null};
      if(nom==="cuve_ouvrir") return {data:{ok:true,mise:100,tirages:0,restants:6,solde:900,prochain_gain:110},error:null};
      return {data:null,error:null}; };
    etat.secteur="ancolie"; etat.surface={x:1031,y:880,abord:false}; etat.ancolie=true;
    majHub(); changerHub("bar"); await att(100);
    const v=document.querySelector("#bar-vue");
    const jeuxBtn=[...v.querySelectorAll("button")].find(b=>/Tables de jeu/.test(b.textContent)); jeuxBtn.click(); await att(100);
    v.querySelector('[data-jeu="bonneteau"]').click(); await att(100);
    v.querySelector("#bon-go").click(); await att(3800);
    r.barUI = { bonneteauJoue:!!v.querySelector("#bon-table.choix") };
    // la cuve, même chemin
    majBar(v); await att(50); [...v.querySelectorAll("button")].find(b=>/Tables de jeu/.test(b.textContent)).click(); await att(100);
    v.querySelector('[data-jeu="cuve"]').click(); await att(100);
    v.querySelector("#cuve-go").click(); await att(200);
    r.barUI.cuveOuverte = !!v.querySelector("#cuve-tirer");
    sb.rpc = vRpc; }

  // 9 undecies. v1.88f — au doigt : le nom du lieu au premier toucher (Ancolie,
  // Triptolème), le départ au second ; les Bureaux au Perchoir.
  { r.toucher = {};
    // Ancolie : la barre de visée dit le lieu visé.
    etat.secteur = "ancolie"; etat.surface = { x:1031, y:880, abord:false };
    const mb = document.querySelector("#modale-braise"); if(mb) mb.classList.add("ouverte");
    majCarteBraise();
    _viseeSol.poser(391, 1250);
    const barre = document.querySelector(".visee-barre");
    r.toucher.ancolie = barre ? barre.querySelector(".visee-nom").textContent + " | " + barre.querySelector("button").textContent : "pas de barre";
    _viseeSol.poser(700, 1100); r.toucher.ancolieVide = barre.querySelector(".visee-nom").hidden;
    _viseeSol.effacer(); if(mb) mb.classList.remove("ouverte");
    // Triptolème : premier toucher = nom et coût, second = départ.
    const vVol = volVers; let vole = null; volVers = (l) => { vole = l.id; };
    etat.secteur = "ecart"; etat.espace = { x:200, y:200 }; etat.vaisseau = etat.vaisseau || {};
    const mo = document.querySelector("#modale-orbite"); if(mo) mo.classList.add("ouverte");
    if(typeof majOrbite === "function") majOrbite();
    const svgE = document.querySelector("#carte-orbite");
    const lieuG = svgE ? [...svgE.querySelectorAll("[data-lieu]")].find(g => { const l = espaceLieu(g.dataset.lieu); return l && !(l.verrou && !lieuOuvert(l)) && !surLieuEspace(l); }) : null;
    if(lieuG){
      const touche = () => { lieuG.dispatchEvent(new MouseEvent("pointerdown", { bubbles:true })); _orbPointeur = "touch"; lieuG.dispatchEvent(new MouseEvent("click", { bubbles:true })); };
      touche(); r.toucher.tripPremier = { parti:vole, info:(document.querySelector("#orbite-info")||{}).textContent || "" };
      touche(); r.toucher.tripSecond = vole === lieuG.dataset.lieu;
      vole = null; _orbPointeur = "mouse"; _orbSel = null; lieuG.dispatchEvent(new MouseEvent("click", { bubbles:true })); r.toucher.tripSouris = vole === lieuG.dataset.lieu;
    } else r.toucher.trip = "carte de Triptolème introuvable";
    volVers = vVol; if(mo) mo.classList.remove("ouverte");
    // Le Perchoir : l'onglet Bureau n'est plus masqué d'office.
    const vBase = window.surBase; window.surBase = () => true; etat._aRoleGouv = true;
    majCentre(); const bb = document.querySelector('#hub-centre [data-centre="bureau"]');
    r.toucher.bureauPerchoir = bb ? bb.style.display !== "none" : "pas de bouton";
    window.surBase = vBase; etat.secteur = "silene"; }

  // 9 duodecies. v1.88g — profil : la bête au pied du portrait, les blasons nommés.
  { etat.bete = { espece:(typeof BETES!=="undefined" && BETES[0] && BETES[0].id) || "x", nom:"Plume" };
    await ouvrirPageProfil(etat.nom); await att(150);
    const pp = document.querySelector("#page-profil");
    r.profil = { compagnonAuPortrait:!!pp.querySelector(".pp-cadre .pp-compagnon"), ancienneVignette:!!pp.querySelector(".pp-bete"),
      ligneInfo:/Compagnon : Plume/.test(pp.querySelector(".pp-info").textContent),
      nomsBlasons:[...pp.querySelectorAll(".rep-badges.grand .rep-nom")].map(x => x.textContent) };
    if(typeof fermerPageProfil === "function") fermerPageProfil();
    const hud = document.createElement("div"); hud.className = "rep-badges"; hud.innerHTML = _badgesReput(3, { racines:5 }, etat.faction); document.body.appendChild(hud);
    const b = hud.querySelectorAll(".rep-badge")[2]; b.click(); r.profil.bulleAuToucher = b.classList.contains("ouvert") && /Racines/.test(b.querySelector(".rep-bulle").textContent);
    document.body.click(); r.profil.bulleFermee = !b.classList.contains("ouvert"); hud.remove(); }

  // 10. Récompenses (K35, K39) et gains des choix les plus forts : jamais un niveau entier.
  r.recompenses = IDS.map(id => { const k = queteData(id).recompense; return `${id}:${k.credits}₡/${k.xp}xp/${k.pa||0}pa`; }).join(" ");
  r.untry = ["tir","goupilles","reaction","ronde","crevasse"].every(t => DEFIS_UNTRY.has(t)) && !DEFIS_UNTRY.has("rangement");
  r.flagsQ23 = queteData("q23").recompense.flags;
  r.journauxAir = journaux.filter(t => /auvent/.test(t)).length;
  journal = jOrig;
  // v1.93j — Q21 ét. 4 (et Q16 ét. 1) : la bannière suit la bête, l'image commune en repli.
  const imQ = (q, i) => queteData(q).etapes[i].image;
  etat.bete = { espece:"sentinelle", nom:"Bip" };
  r.beteBanniere = { q21:_varie(imQ("q21", 3)), q16:_varie(imQ("q16", 0)), html:/data-repli="images\/quetes\/q21\/4\.png"/.test(_imgQueteHTML(imQ("q21", 3))) };
  etat.bete = null; r.beteBanniere.sansBete = _varie(imQ("q21", 3));
  r.beteBanniere.htmlSimple = !/data-repli/.test(_imgQueteHTML(imQ("q21", 0)));
  return r;
})();
