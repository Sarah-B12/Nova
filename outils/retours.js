// v1.19 — retours testeurs du 27/09 (node banc.js .. retours)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  const actif = (id, etape) => { etat.quetes.active = { id, etape, _sur:true, _resolu:false, _echecLe:0, _attenteLe:0, _memVue:false }; return etat.quetes.active; };
  let reussi = 0; const reussirOrig = reussirDefi; reussirDefi = () => { reussi++; };

  // 3. Triangulation Q10 : jamais sous l'image du Gravier
  const g = espaceLieu("asteroides"); const c = { carte:"espace", x:2113, y:1393, r:300 };
  let sous = 0, hors = 0, dmin = 1e9;
  for(let i=0;i<3000;i++){ const p=_triTirer(c); const dd=Math.hypot(p.x-g.x,p.y-g.y); dmin=Math.min(dmin,dd); if(dd < g.t/2) sous++; if(dd > c.r) hors++; }
  r.tri = { sous, hors, distMin: Math.round(dmin), rayonImage: g.t/2 };
  // partie en cours avec une source sous l'image, sans relevé → retirée
  const a10 = actif("q10", 0); a10._tri = { src:{ x:g.x, y:g.y }, releves:[], ratees:0 };
  const t = _triEtat({}); r.triRepare = Math.round(Math.hypot(t.src.x-g.x, t.src.y-g.y)) >= g.t/2;
  // avec un relevé : on ne touche à rien
  a10._tri = { src:{ x:g.x, y:g.y }, releves:[{x:1,y:1,f:3}], ratees:0 };
  r.triGardeSiReleve = _triEtat({}).src.x === g.x;

  // 2. Tuyauterie : jamais résolue au départ ; pas de validation au clic ; vanne
  let dejaFaits = 0; for(let i=0;i<3000;i++){ const x=_tuyGenerer(5,5); if(_tuyIrrigues(x.masques,5,5,x.sr,x.kr).gagne) dejaFaits++; }
  r.tuyDejaResolus = dejaFaits;
  const a8 = actif("q8", 3); const z = document.createElement("div"); document.body.appendChild(z);
  const d4 = queteData("q8").etapes[3].defi;
  z.innerHTML = _htmlTuyauterie(d4); _wireTuyauterie(z, d4);
  // on résout le circuit « à la main » : on tourne chaque case jusqu'à ce que ça passe, par force brute sur le chemin
  const T = a8._tuy; const sol = _tuyGenerer; // (non utilisé)
  // recherche : pivote chaque case 0-3 fois, glouton par propagation
  const C=5,L=5;
  function resoudre(){ for(let tour=0; tour<60; tour++){ for(let i=0;i<C*L;i++){ for(let k=0;k<4;k++){ if(_tuyIrrigues(T.masques,C,L,T.sr,T.kr).gagne) return true; const avant=_tuyIrrigues(T.masques,C,L,T.sr,T.kr).eau.size; T.masques[i]=_tuyPivot(T.masques[i]); if(_tuyIrrigues(T.masques,C,L,T.sr,T.kr).eau.size < avant){ for(let q=0;q<3;q++) T.masques[i]=_tuyPivot(T.masques[i]); break; } } } } return _tuyIrrigues(T.masques,C,L,T.sr,T.kr).gagne; }
  const vanne = z.querySelector("#q-tuy-vanne");
  vanne.click(); const avantVanne = reussi;
  const resolu = resoudre();
  z.querySelector("[data-i]").click(); z.querySelector("[data-i]").click(); z.querySelector("[data-i]").click(); z.querySelector("[data-i]").click(); // 4 quarts = inchangé
  const apresClics = reussi;
  vanne.click();
  r.tuy = { vanneTropTot: avantVanne, resoluParLeBanc: resolu, validePendantLesClics: apresClics - avantVanne, valideALaVanne: reussi - apresClics };

  // 4. Combat : le texte dit le seuil
  const vraie = _combatStats; _combatStats = () => ({ force:26, agilite:5, intelligence:3, best:"force", val:26 });
  const h = _htmlCombat({ puissance:40, nom:"Bras" });
  r.combat = { pourcent: /\(\d+ %\)/.test(h), manque: /il te manque 2 points/.test(h), seuil: /il faut <b>28<\/b>/.test(h) };
  _combatStats = vraie;

  // 5. Mémoire Q13 étape 2 : bouton, pas d'info avant, info après, question après la durée
  const a13 = actif("q13", 1); const d13 = queteData("q13").etapes[1].defi;
  const h0 = _htmlMemoire(d13);
  const z2 = document.createElement("div"); document.body.appendChild(z2); z2.innerHTML = h0; _wireMemoire(z2, d13);
  const avant = { bouton: !!z2.querySelector("#q-mem-go"), infoCachee: !/CASIER 212/.test(h0) };
  z2.querySelector("#q-mem-go").click();
  const h1 = _htmlMemoire(d13);
  const pendant = { info: /CASIER 212/.test(h1), cpt: (h1.match(/q-mem-cpt">(\d+)/)||[])[1] };
  a13._memDebut = Date.now() - 9000;                  // « rechargement » après la fin : pas de second regard
  const h2 = _htmlMemoire(d13);
  r.memoire = { duree: d13.duree, avant, pendant, apres: { question: /numéro du casier/.test(h2), info: /CASIER 212/.test(h2) } };
  // avancer remet à zéro
  a13._memDebut = 123; a13._resolu=true; await avancerQuete(); r.memRemise = etat.quetes.active ? etat.quetes.active._memDebut : "pas de quête";

  reussirDefi = reussirOrig;
  return r;
})()
