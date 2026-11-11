// v2.74 — simuler des parties de Quatre alignés (la maison joue en premier).
// node outils/o_quatre_sim.js <profondeur maison> <bruit maison> <debutant|moyen|bon|tres_bon> <nombre de parties>
// Réglages actuels : tenancier 2 0.1 · habitué 4 0 · vieux du fond 6 0 (K239).
const I = require('./o_quatre_ia.js');
const [,, mprof, mbruit, jnom, N] = process.argv;
const joueurs = { debutant:{prof:1,bruit:0.3}, moyen:{prof:2,bruit:0.1}, bon:{prof:4,bruit:0.05}, tres_bon:{prof:6,bruit:0} };
const m = { prof:+mprof, bruit:+mbruit }, j = joueurs[jnom];
let v=0,n=0;
for(let k=0;k<+N;k++){
  const g = new Array(42).fill(0); let p = 2, r = 0;
  for(let t=0;t<42;t++){ const c = p===2 ? I.choisir(g,2,m.prof,m.bruit) : I.choisir(g,1,j.prof,j.bruit); I.poser(g,c,p); if(I.gagne(g,p)){ r=p; break; } p=3-p; }
  if(r===1) v++; else if(r===0) n++;
}
console.log(`maison prof ${mprof} bruit ${mbruit} · ${jnom} : ${Math.round(100*v/N)}% gagne · ${Math.round(100*n/N)}% nul (${N} parties)`);
