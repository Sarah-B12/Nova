#!/usr/bin/env node
/* ===========================================================
   v2.06 — LE FLÉAU : RÉGLAGE ET COPIES (BACKEND_PLAN §6, §128)
     node outils/o_fleau_sim.js
         → simule des combats avec les règles EXACTES du serveur (v231, fleau_tour)
           et deux joueurs : « appliqué » (une répartition fixe, le canon fini quand il
           peut) et « fort » (essaie chaque répartition, à l'aide de parties simulées).
     node outils/o_fleau_sim.js --verifier sql/v231_fleau.sql
         → compare ce que le serveur recopie du client : coque et canon des vaisseaux
           (VAISSEAUX, js/vaisseau.js), module d'AREPO (MODULE_COQUE), la cellule, le
           coût d'énergie, et la place du Fléau (lieu de vol_lieux, outils/o_vol_lieux.js).
   ⚠ Toute retouche d'une règle du combat : la changer ICI et dans fleau_tour, puis relancer.
   =========================================================== */
const fs = require("fs"), path = require("path"), vm = require("vm");
const racine = path.join(__dirname, "..");
const lire = f => fs.readFileSync(path.join(racine, f), "utf8");

// Règles de fleau_tour (v231). Coefficients : K85.
const R = { puissance:4, canon:10, bien:0.22, autre:0.08, plafond:0.75, coqueFleau:2.0, coupBase:30, coupForce:0.2, emballe:1.3, tours:12 };
const NAV = { navette:{ pv:120, coef:1.6, canon:0 }, cargo:{ pv:260, coef:1.3, canon:0 }, maitre:{ pv:340, coef:1, canon:1 } };
const COUPS = ["piques","rayon","decharge"];
const tirer = (av, serie) => { const t = (av && serie >= 2) ? COUPS.filter(x => x !== av) : COUPS; return t[Math.floor(Math.random()*t.length)]; };
function reduc(coup, [b, c, m]){
  const r = coup === "piques" ? R.bien*m + R.autre*b : coup === "rayon" ? R.bien*b + R.autre*m : R.bien*c + R.autre*(b+m);
  return Math.min(R.plafond, r);
}
// Une passe : le canon, puis le coup s'il tient.
function passe(s, coup, rep, f){
  const n = { ...s }; n.H -= R.canon * rep[1]; n.t++;
  if(n.H <= 0){ n.fin = "gagne"; return n; }
  const a = (R.coupBase + R.coupForce * f) * (0.85 + Math.random()*0.30) * (n.H < n.H0/2 ? R.emballe : 1);
  n.C = Math.max(0, n.C - Math.max(1, Math.round(a * (1 - reduc(coup, rep)))));
  if(n.C <= 0) n.fin = "cloue"; else if(n.t >= R.tours) n.fin = "tours";
  return n;
}
// K126 : passé la moitié de sa coque, il annonce DEUX coups et n'en lâche qu'un.
const PARE = { piques:2, rayon:0, decharge:1 };   // l'indice du système qui pare : [bouclier, canon, moteurs]
const annonces = (s, coup) => s.H < s.H0/2 ? [coup, COUPS.filter(x => x !== coup)[Math.floor(Math.random()*2)]] : [coup];
const repFixe = (cands, pts, k, H) => {
  if(H <= pts * R.canon) return [0, Math.ceil(H / R.canon), pts - Math.ceil(H / R.canon)];
  if(cands.length === 1){
    const coup = cands[0];
    if(coup === "decharge") return [0, pts, 0];
    const c = Math.min(k, pts), reste = pts - c;
    return coup === "piques" ? [0, c, reste] : [reste, c, 0];
  }
  // Deux coups possibles : le canon d'abord, puis le reste partagé entre les deux parades.
  const r = [0, Math.min(k, pts), 0]; let reste = pts - r[1], i = 0;
  while(reste > 0){ r[PARE[cands[i % 2]]]++; reste--; i++; }
  return r;
};
function combat(f, v, k, cel, fort){
  const N = NAV[v], pts = R.puissance + (cel && N.canon ? 1 : 0), H0 = Math.round(R.coqueFleau * f);
  let s = { C:N.pv, H:H0, H0, t:0 }, coup = tirer(null, 0), serie = 1, cellules = 0;
  while(!s.fin){
    if(cel && N.canon) cellules++;
    const cands = annonces(s, coup);
    const rep = fort ? choisir(s, cands, pts, f, N) : repFixe(cands, pts, k, s.H);
    s = passe(s, coup, rep, f);
    const nv = tirer(coup, serie); serie = nv === coup ? serie + 1 : 1; coup = nv;
  }
  const score = s.fin === "gagne" ? (f + 100 * s.C / N.pv) * N.coef : Math.min(f, 190) * (s.H0 - Math.max(0, s.H)) / s.H0 * N.coef;   // K125
  return { gagne: s.fin === "gagne", coque: s.C / N.pv, score, cellules };
}
// Le joueur « fort » ne sait pas lequel des deux coups part : il essaie chaque répartition
// contre l'un et l'autre, et garde la meilleure en moyenne.
function choisir(s, cands, pts, f, N){
  let best = null, bv = -1;
  for(let b = 0; b <= pts; b++) for(let c = 0; c <= pts - b; c++){
    const rep = [b, c, pts - b - c]; let v = 0;
    for(let i = 0; i < 40; i++){
      let x = passe(s, cands[i % cands.length], rep, f), cp = tirer(null, 0);
      while(!x.fin){ x = passe(x, cp, repFixe(annonces(x, cp), pts, 1 + i % 3, x.H), f); cp = tirer(null, 0); }
      v += x.fin === "gagne" ? f + 100 * x.C / N.pv : Math.min(f, 190) * (x.H0 - Math.max(0, x.H)) / x.H0;
    }
    if(v > bv){ bv = v; best = rep; }
  }
  return best;
}
function serie(f, v, cel, fort, n){
  let meilleur = null;
  for(const k of fort ? [0] : [0,1,2,3,4]){
    let g = 0, cq = 0, sc = 0, cl = 0;
    for(let i = 0; i < n; i++){ const r = combat(f, v, k, cel, fort); if(r.gagne){ g++; cq += r.coque; } sc += r.score; cl += r.cellules; }
    const x = { gagne:Math.round(100*g/n), coque:g ? Math.round(100*cq/g) : 0, score:Math.round(sc/n), cellules:+(cl/n).toFixed(1) };
    if(!meilleur || x.score > meilleur.score) meilleur = x;
  }
  return meilleur;
}

function verifier(fsql){
  const sql = fs.readFileSync(path.resolve(fsql), "utf8"), ctx = { console, etat:{}, TOUS_ITEMS:[], IMG_ITEM:{} };
  vm.createContext(ctx);
  vm.runInContext(lire("js/vaisseau.js") + "\n;this.VAISSEAUX=VAISSEAUX; this.MODULE_COQUE=MODULE_COQUE;", ctx);
  const f = lire("js/fleau.js"), ecarts = [];
  const coef = { fab_vaisseau_maitre:"1.0", fab_vaisseau_cargo:"1.3", fab_navette_legere:"1.6", navette_reserve:"1.6" };
  for(const id of Object.keys(coef)){
    const v = ctx.VAISSEAUX[id], ligne = `when '${id}'`;
    const i = sql.indexOf(ligne); if(i < 0){ ecarts.push(id + " absent du serveur"); continue; }
    const l = sql.slice(i, sql.indexOf("\n", i));
    const m = l.match(/"pv":(\d+),"coef":([\d.]+),"canon":(\d)/);
    if(!m || +m[1] !== v.pv || m[2] !== coef[id] || +m[3] !== (v.canon || 0)) ecarts.push(`${id} : client pv ${v.pv} canon ${v.canon||0}, serveur ${l.trim()}`);
  }
  if(!sql.includes(`round(v_max * ${ctx.MODULE_COQUE})`)) ecarts.push("module d'AREPO : MODULE_COQUE " + ctx.MODULE_COQUE + " absent du serveur");
  if(!/FLEAU_CELLULE\s*=\s*"fab_cellule_d_energie"/.test(f) || !sql.includes(`'{"fab_cellule_d_energie":1}'`)) ecarts.push("cellule d'énergie");
  if(!/FLEAU_ENERGIE\s*=\s*10;/.test(f) || !sql.includes("least(13, coalesce(p_cout, 10))")) ecarts.push("coût d'énergie (10, borné [5 ; 13])");
  const regles = ["v_pts := 4 +", "10 * v_c", "least(0.75", "0.22 * v_m + 0.08 * v_b", "0.22 * v_b + 0.08 * v_m", "0.22 * v_c + 0.08 * (v_b + v_m)",
                  "(30 + 0.2 * c.force) * (0.85 + random() * 0.30)", "then 1.3 else 1 end", "c.tour >= 12", "round(2.0 * v_force)", "v_gain  := 5 * c.force", "least(c.force, 190)", "c.annonce2 := case when c.fleau < c.fleau_max / 2.0"];
  regles.filter(x => !sql.includes(x)).forEach(x => ecarts.push("règle du combat absente : " + x));
  const { lieuxVol } = require("./o_vol_lieux.js");
  const fl = lieuxVol().find(l => l.secteur === "ceres" && l.id === "e2_oeil_piques");
  if(!fl) ecarts.push("le Fléau n'est pas un lieu nommé (vol_lieux)");
  return { conforme: !ecarts.length, ecarts, fleau: fl };
}

if(require.main === module){
  const i = process.argv.indexOf("--verifier");
  if(i >= 0){ const r = verifier(process.argv[i+1]); console.log(JSON.stringify(r, null, 1)); process.exit(r.conforme ? 0 : 1); }
  const lignes = [];
  for(const f of [75, 85, 100, 115, 130, 160, 190, 300, 330]){
    const L = { force:f };
    for(const v of ["navette","cargo","maitre"]) L[v] = serie(f, v, true, false, 2000);
    L.maitreSansCellule = serie(f, "maitre", false, false, 2000);
    L.maitreFort = serie(f, "maitre", true, true, 60);
    lignes.push(L);
  }
  lignes.forEach(L => console.log(`force ${String(L.force).padStart(3)} | ` + ["navette","cargo","maitre","maitreSansCellule","maitreFort"].map(k =>
    `${k} ${L[k].gagne}% (coque ${L[k].coque}%, score ${L[k].score}${k.startsWith("maitre") && k !== "maitreSansCellule" ? `, ${L[k].cellules} cel.` : ""})`).join(" | ")));
}
module.exports = { combat, serie, verifier };
