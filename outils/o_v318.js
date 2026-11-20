// v3.18 — la ronde (« 3 pas plus tard » enfin vrai), les vendeurs du marché, les aptitudes au journal,
// la solde des mercenaires.   node outils/o_banc.js . v318
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(400);
  // 1. La ronde : le dernier pas montré + 3 = ce qu'attend le serveur (_ronde_ok : observe + avance).
  const R = { n:6, observe:4, avance:3, boucles:[[0,1,2,3,4,5,11,10,9,8,7,6]] };
  _missions = { ok:true, jour:"2026-11-20", missions:[{ id:9, type:"casse", vue:{ ronde:R } }] };
  const z = document.createElement("div"); z.innerHTML = `<div id="mi-ronde" data-mi-mission="9"></div>`; document.body.appendChild(z);
  _ronde = { cle:null, t:0, phase:"pret", rep:[], timer:null }; _mRondeMaj(z);
  const vus = [];
  const obs = new MutationObserver(() => { const c = z.querySelector(".mi-ro-case span"); if(c && _ronde.phase === "observer"){ const i = +c.parentElement.dataset.roCase; if(vus[vus.length - 1] !== i) vus.push(i); } });
  obs.observe(z, { childList:true, subtree:true });
  z.querySelector("[data-ro-go]").click();
  await dort(450 * (R.observe + 3));
  obs.disconnect();
  const b = R.boucles[0], dernier = vus[vus.length - 1];
  const attendu = b[(R.observe + R.avance) % b.length];
  r.ronde = { vus, dernierVu: dernier, troisPasPlusTard: b[(b.indexOf(dernier) + 3) % b.length], attenduServeur: attendu,
              juste: b[(b.indexOf(dernier) + 3) % b.length] === attendu, phase: _ronde.phase,
              texte: /3 pas plus tard/.test(z.textContent) };
  // 2. Les vendeurs d'un groupe de lots
  r.vendeurs = [_marcheVendeurs([{ vendeurNom:"Test1" }]), _marcheVendeurs([{ vendeurNom:"Test1" }, { vendeurNom:"Kyraa" }]),
                _marcheVendeurs([{ vendeurNom:"A" }, { vendeurNom:"B" }, { vendeurNom:"A" }, { vendeurNom:"C" }]),
                _marcheVendeurs([{ vendeurNom:"A" }, { vendeurNom:"B" }, { vendeurNom:"C" }, { vendeurNom:"D" }, { vendeurNom:"E" }]),
                _marcheVendeurs([{ vendeurNom:"<b>x</b>" }])];
  // 3. Les aptitudes au journal
  r.aptitudes = ["Aptitude acquise : Intrusion.", "Aptitude acquise : Discrétion.", "Pas assez de points d'Aptitude."].map(_categoriser);
  r.volsToujours = _categoriser("Tu as volé 30 ₡ à Kyraa.");
  // 4. La solde (barème dupliqué de v316)
  r.solde = { MERC_SOLDE, MERC_JOURS };
  return r;
})()
