// v1.85 — LOT 1 (Q16 → Q20) : chaque épreuve se dessine et se branche, les épreuves
// nouvelles (quetes-jeux.js) se gagnent ou se perdent, le saut mène en Ancolie,
// la Gorge ne s'ouvre qu'à l'étape 0 de Q20, le verrou de Maar tient.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const a = { id:"q16", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  const _mqhOrig = majQueteHub; majQueteHub = () => {}; sauverMaintenant = async () => {};
  let ok = 0, ko = 0; reussirDefi = () => { ok++; }; echouerDefi = () => { ko++; };
  const z = document.createElement("div"); document.body.appendChild(z);
  // 1. Toutes les étapes de Q16 → Q20 se dessinent et se branchent sans erreur.
  r.etapes = {};
  for(const id of ["q16","q17","q18","q19","q20"]){
    const q = queteData(id); r.etapes[id] = q.etapes.length;
    q.etapes.forEach((e, i) => { a.id = id; a.etape = i; a._qj = null;
      try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
           if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${id}/${i} : épreuve inconnue ${e.defi.type}`);
           if(e.cible && !_cibleResolue(e.cible)) r.erreurs.push(`${id}/${i} : cible introuvable`);
      }catch(err){ r.erreurs.push(`${id}/${i} : ${err.message}`); } });
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
  }
  // 2. La ronde : le minuteur tourne jusqu'au bout MALGRÉ les redessins, puis la bonne réponse gagne.
  ok = 0; a.id = "q16"; a.etape = 1; a._qj = null; const dR = queteData("q16").etapes[1].defi;
  const hub = document.querySelector("#hub-quete") || (()=>{ const h=document.createElement("div"); h.id="hub-quete"; document.body.appendChild(h); return h; })();
  majQueteHub = _mqhOrig;
  const zq = () => document.querySelector("#hub-quete-corps") || z;
  // on joue dans un conteneur à nous : _defiHTML + _defiWire, et le redessin = la même chose
  majQueteHub = () => { if(_seqEnCours()) return; _clearQ(); z.innerHTML = _defiHTML(dR); _defiWire(z, dR); };
  majQueteHub(); z.querySelector("#qj-ronde-go").click();
  for(let k = 0; k < 4; k++){ await new Promise(x=>setTimeout(x,400)); majQueteHub(); }   // redessins parasites
  await new Promise(x=>setTimeout(x, (dR.observe) * 650 + 400));
  const R = a._qj; r.ronde = { phase:R && R.phase, t:R && R.t };
  for(const b of R.boucles){ z.querySelector(`[data-qr="${b[(R.t + dR.avance) % b.length]}"]`).click(); }
  r.rondeGagnee = ok === 1; majQueteHub = () => {};
  // 3. La crevasse : le plus court chemin (BFS) sort ; le labyrinthe est parfait.
  ok = 0; a.id = "q17"; a.etape = 0; a._qj = null; const dC = queteData("q17").etapes[0].defi;
  z.innerHTML = _defiHTML(dC); const G = a._qj, n = G.n, fin = (n - 1) * n + G.ce;
  const prev = Array(n*n).fill(-1), dir = Array(n*n).fill(""); prev[G.cs] = G.cs; const f = [G.cs];
  while(f.length){ const i = f.shift(); for(const [b, p, k] of [[1,-n,"N"],[2,1,"E"],[4,n,"S"],[8,-1,"O"]]) if(G.cases[i] & b && prev[i+p] < 0){ prev[i+p] = i; dir[i+p] = k; f.push(i+p); } }
  const chemin = []; for(let i = fin; i !== G.cs; i = prev[i]) chemin.unshift(dir[i]);
  for(const k of chemin){ z.innerHTML = _defiHTML(dC); _defiWire(z, dC); z.querySelector(`[data-qcv="${k}"]`).click(); }
  r.crevasse = { pas:chemin.length, max:G.max, gagnee: ok === 1 };
  // 4. L'impossible : deux échecs, puis on lâche → l'histoire avance.
  ok = 0; a.id = "q20"; a.etape = 2; a._qj = null; const dI = queteData("q20").etapes[2].defi;
  z.innerHTML = _defiHTML(dI); a._qj.tour = 2; z.innerHTML = _defiHTML(dI); _defiWire(z, dI);
  const lacher = z.querySelector("#qj-imp-lacher"); r.impossible = { boutonLacher: !!lacher, champCache: !z.querySelector("#qj-imp-champ") };
  if(lacher) lacher.click(); r.impossible.avance = ok === 1;
  // 5. La Gorge : verrouillée hors de Q20 étape 0.
  const gorge = espaceLieu("trou_noir"); a.id = "q19"; a.etape = 0; r.gorgeQ19 = lieuOuvert(gorge);
  a.id = "q20"; a.etape = 0; r.gorgeQ20e0 = lieuOuvert(gorge); a.etape = 1; r.gorgeQ20e1 = lieuOuvert(gorge);
  // 6. Le saut : on se retrouve en Ancolie, au point de chute, et la cible de l'étape 2 est atteinte.
  ok = 0; a.etape = 0; etat.secteur = "ecart"; const dS = queteData("q20").etapes[0].defi;
  z.innerHTML = _defiHTML(dS); _defiWire(z, dS); z.querySelector("#qj-saut").click(); await new Promise(x=>setTimeout(x,30));
  r.saut = { secteur:etat.secteur, ancolie:etat.ancolie, avance: ok === 1, carte:_carteJoueur(),
             dansChute:_dansCible(queteData("q20").etapes[1].cible), enSurface:enSurface() };
  // 7. Zones thermiques d'Ancolie.
  etat.surface = { x:400, y:250 }; r.zoneChaudeVolcan = enZoneChaude(); r.zoneFroideVolcan = enZoneFroide();
  etat.surface = { x:1950, y:400 }; r.zoneFroideGlaces = enZoneFroide();
  etat.surface = { x:1031, y:880 }; r.zoneStation = enZoneChaude() || enZoneFroide();
  // 8. Le verrou de Maar : partir pour Triptolème est refusé, avec la voix de 42-U1F.
  etat.secteur = "silene"; etat.verrouMaar = true; etat.espace1 = true; const vSauve = etat.vaisseau; etat.vaisseau = etat.vaisseau || "navette_legere";
  const j0 = (typeof _journal!=="undefined" ? 0 : 0); let dernier = ""; const jOrig = journal; journal = (t) => { dernier = t; };
  await partirVersEcart(); r.verrouTriptoleme = /affiche MAAR/.test(dernier);   // v1.87l : K54, le calculateur en panne etat.vaisseau = vSauve;
  // 9. Décoller d'Ancolie pendant Q20 : refusé.
  etat.secteur = "ancolie"; etat.surface = { x:1110, y:960, abord:true }; a.id = "q20";
  await _decollerVersSilene(SURFACES.ancolie); r.decollageQ20Refuse = /causé/.test(dernier) && etat.secteur === "ancolie";
  journal = jOrig;
  // 10. Les données : récompenses (K35, K39) et glyphes nouveaux.
  r.recompenses = ["q16","q17","q18","q19","q20"].map(id => { const k = queteData(id).recompense; return `${id}:${k.xp}xp/${k.pa||0}pa`; }).join(" ");
  r.glyphesDesTin = !!(GLYPHES_ANCIEN.DES && GLYPHES_ANCIEN.TIN);
  r.q20avert = !!queteData("q20").avert;
  return r;
})();
