// v2.74 (K237 → K239) — QUATRE ALIGNÉS : le modèle JS de l'ordinateur du serveur (`_q4_*`, v281), MÊME calcul
// (négamax alpha-bêta, 69 fenêtres, menaces selon la parité de leur ligne, marge de 4 points entre coups presque
// aussi bons). Sert à simuler des milliers de parties pour régler les gains : outils/o_quatre_sim.js.
// ⚠ Si l'on change l'ordinateur au serveur, changer ce fichier AUSSI, puis remesurer.
// Quatre alignés : IA (négamax alpha-bêta) — modèle JS de référence pour la simulation.
// Grille : tableau de 42 (ligne 0 = en bas), 0 vide, 1 joueur, 2 maison. Colonnes 0..6.
const W = 7, H = 6;
const FEN = [];   // les 69 fenêtres de 4 cases
for(let y=0;y<H;y++) for(let x=0;x<W;x++){
  if(x+3<W) FEN.push([0,1,2,3].map(k=>y*W+x+k));
  if(y+3<H) FEN.push([0,1,2,3].map(k=>(y+k)*W+x));
  if(x+3<W && y+3<H) FEN.push([0,1,2,3].map(k=>(y+k)*W+x+k));
  if(x-3>=0 && y+3<H) FEN.push([0,1,2,3].map(k=>(y+k)*W+x-k));
}
const ORDRE = [3,2,4,1,5,0,6];
function hauteur(g,c){ for(let y=0;y<H;y++) if(!g[y*W+c]) return y; return H; }
function poser(g,c,p){ const y=hauteur(g,c); if(y>=H) return -1; g[y*W+c]=p; return y*W+c; }
function gagne(g,p){ return FEN.some(f=>f.every(i=>g[i]===p)); }
function pleine(g){ for(let c=0;c<W;c++) if(!g[(H-1)*W+c]) return false; return true; }
function aligneEn(g,idx,p){   // poser p en idx ferait-il 4 ?
  const x=idx%W, y=(idx-x)/W;
  for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){ let n=1;
    for(let k=1;;k++){ const a=x+k*dx,b=y+k*dy; if(a<0||a>=W||b<0||b>=H||g[b*W+a]!==p) break; n++; }
    for(let k=1;;k++){ const a=x-k*dx,b=y-k*dy; if(a<0||a>=W||b<0||b>=H||g[b*W+a]!==p) break; n++; }
    if(n>=4) return true; }
  return false;
}
let PARITE = true; let MARGE = +(process.env.MARGE || 4);
function evaluer(g,p){   // du point de vue de p ; la maison (2) joue en premier
  const o = 3-p; let s = 0;
  for(const f of FEN){ let a=0,b=0,vide=-1; for(const i of f){ if(g[i]===p) a++; else if(g[i]===o) b++; else vide=i; }
    if(b===0){ if(a===3) s += 5 + (((p===2) === (Math.floor(vide/W)%2===0)) ? 40 : 12); else if(a===2) s+=2; }
    else if(a===0){ if(b===3) s -= 4 + (((o===2) === (Math.floor(vide/W)%2===0)) ? 40 : 12); else if(b===2) s-=2; } }
  for(let y=0;y<H;y++){ if(g[y*W+3]===p) s+=3; else if(g[y*W+3]===o) s-=3; }
  return s;
}
let NOEUDS = 0;
function negamax(g,p,prof,alpha,beta){
  NOEUDS++;
  if(pleine(g)) return 0;
  // gagner tout de suite
  for(const c of ORDRE){ if(hauteur(g,c)>=H) continue; const i=poser(g,c,p); const w=gagne(g,p); g[i]=0; if(w) return 1000+prof; }
  if(prof===0) return evaluer(g,p);
  let best = -1e9;
  for(const c of ORDRE){
    if(hauteur(g,c)>=H) continue;
    const i=poser(g,c,p); const v = -negamax(g,3-p,prof-1,-beta,-alpha); g[i]=0;
    if(v>best) best=v; if(v>alpha) alpha=v; if(alpha>=beta) break;
  }
  return best;
}
// Choix d'un coup : profondeur prof ; « bruit » : probabilité de jouer un coup sûr au hasard ; égalités départagées au hasard.
function choisir(g,p,prof,bruit=0, rnd=Math.random){
  const coups = ORDRE.filter(c=>hauteur(g,c)<H);
  for(const c of coups){ const i=poser(g,c,p); const w=gagne(g,p); g[i]=0; if(w) return c; }
  if(prof<=0) return coups[Math.floor(rnd()*coups.length)];
  const notes = coups.map(c=>{ const i=poser(g,c,p); const v=-negamax(g,3-p,prof-1,-1e9,1e9); g[i]=0; return [c,v]; });
  const max = Math.max(...notes.map(n=>n[1]));
  if(bruit>0 && rnd()<bruit){ const surs = notes.filter(n=>n[1]>-500); if(surs.length) return surs[Math.floor(rnd()*surs.length)][0]; }
  const marge = (max > -500 && max < 500) ? MARGE : 0;   // varier entre les coups presque aussi bons : pas de partie qu'on rejoue par cœur
  const top = notes.filter(n=>n[1]>=max-marge); return top[Math.floor(rnd()*top.length)][0];
}
module.exports = { aligneEn, setParite:(b)=>{PARITE=b;}, W,H,FEN,ORDRE,hauteur,poser,gagne,pleine,evaluer,negamax,choisir, noeuds:()=>NOEUDS, raz:()=>{NOEUDS=0;} };
