// v2.49 (K172, K173) — SIMULATION DE LA PROGRESSION : XP, niveaux, quêtes, selon le temps de jeu.
// Usage : node outils/o_sim_xp.js ..                 (depuis le dossier « Nova Epic » : node outils/o_sim_xp.js .)
//         node outils/o_sim_xp.js .. --sans-atelier  (sans l'XP d'atelier : le jeu d'avant la v2.49)
//         node outils/o_sim_xp.js .. --atelier=20,10 (essayer un autre barème : XP par Sélénite, par Nyx)
//         node outils/o_sim_xp.js .. --bareme=courbe (récompenses des quêtes d'un barème candidat, o_baremes_quetes.js ;
//                                                    l'XP des choix suit dans la même proportion)
//         node outils/o_sim_xp.js .. --gardiens=14,17,21,27,28 (niveau du joueur « moyen » à Q11, Q16, Q19, Q27, Q30)
//         node outils/o_sim_xp.js .. --activite=1.5   (activité hors quêtes ×1,5 : test de sensibilité)
//
// Outil autonome (pas de jsdom). Il LIT dans le jeu, sans les recopier :
//   la courbe d'XP (xpCumulPour, js/systeme.js), le niveau requis des objets (NIVEAUX_OBJETS),
//   les récompenses et les combats de chaque quête (js/quetes-data.js), les recettes et l'XP d'atelier
//   (xpAtelier, XP_ATELIER_*, js/formations.js).
// Il RECOPIE (⚠ à tenir à jour si le jeu change) :
//   - l'XP des options de choix (serveur : _choix_gains ; barème H86, K44, K50, K63, BACKEND §93…) → CHOIX_XP ;
//   - le niveau auquel un joueur « moyen » passe chaque gardien (K70, tableau de PASSATION v1.93s) → GARDIENS ;
//   - les gains d'XP des actions (terrain.js, actions.js, patrouille.js, voler.js, sonde.js, GDD Arène, BACKEND §42)
//     → GAINS. Les PROFILS de joueurs, eux, sont des HYPOTHÈSES, calées sur les vrais joueurs (base du 08/11).
"use strict";
const fs = require("fs"), path = require("path");
const RAC = process.argv[2] || "..";
const _at = process.argv.find(a => a.startsWith("--atelier="));
const ATELIER = !process.argv.includes("--sans-atelier");
const FACT = +((process.argv.find(a => a.startsWith("--activite=")) || "=1").split("=")[1]) || 1;

/* ---------- Lecture du jeu (sans navigateur) ---------- */
function charger(fichier, noms, base){
  const src = fs.readFileSync(path.join(RAC, "js", fichier), "utf8");
  const stub = new Proxy(function(){}, { get:(t,k) => k === Symbol.toPrimitive ? (() => 0) : (k === "then" ? undefined : stub), apply:() => stub, construct:() => stub });
  const p = new Proxy(base || {}, { has:(t,k) => typeof k === "string" && k !== "__out", get:(t,k) => (k in t) ? t[k] : (k === Symbol.unscopables ? undefined : (k in globalThis ? globalThis[k] : stub)), set:(t,k,v) => { t[k] = v; return true; } });
  const out = {};
  new Function("__p", "__out", "with(__p){\n" + src + "\n;" + noms.map(n => `try{ __out[${JSON.stringify(n)}]=${n}; }catch(e){}`).join("") + "\n}")(p, out);
  return out;
}
const { xpCumulPour, NIVEAUX_OBJETS, NIVEAU_MAX } = charger("systeme.js", ["xpCumulPour", "NIVEAUX_OBJETS", "NIVEAU_MAX"]);
const { QUETES } = charger("quetes-data.js", ["QUETES"]);
const _bar = (process.argv.find(a => a.startsWith("--bareme=")) || "").split("=")[1];
const BAREME = _bar ? require("./o_baremes_quetes.js").bareme(_bar, QUETES) : null;   // [{id, xp, credits}] ou null
const JEU = charger("formations.js", ["FORMATIONS", "normNom", "xpAtelier", "_cristauxFab", "XP_ATELIER_SEL", "XP_ATELIER_NYX", "XP_ATELIER_MIN", "XP_ATELIER_NIV"],
                    { niveauRequis: id => NIVEAUX_OBJETS[id] || 0 });
const { FORMATIONS, normNom } = JEU;
const _SEUILS = []; for(let n = 0; n <= 200; n++) _SEUILS.push(xpCumulPour(n));
const niveauDe = xp => { let n = 1; while(n < (NIVEAU_MAX || 199) && xp >= _SEUILS[n + 1]) n++; return n; };   // v2.50 : NIVEAU_MAX (K178)

/* ---------- Copies documentées ---------- */
const { CHOIX_XP } = require("./o_baremes_quetes.js");   // XP des options de choix (copie du serveur, voir ce fichier)
const GARDIENS = { q11:14, q16:17, q19:21, q27:27, q30:28 };   // niveau du joueur « moyen » (K70 ; recalés en v2.50, K177 ; voir o_gardiens.js)
{ const g = (process.argv.find(x => x.startsWith("--gardiens=")) || "").split("=")[1];   // --gardiens=14,17,21,27,28 : essayer d'autres seuils
  if(g) g.split(",").map(Number).forEach((v, i) => { GARDIENS[["q11","q16","q19","q27","q30"][i]] = v; }); }
const GAINS = {
  miner:3, recolte:2,                              // terrain.js (une récolte ou une tonte)
  patrouille: 0.85*10 + 0.15*3,                    // gagnée 10, perdue 3 (actions.js) ; 85 % de victoires supposées
  duel: 8,                                         // GDD : 12 / 4 × écart de force ; ~8 en moyenne supposée
  sonde: 10, vol: 0.6*8 + 0.2*3 + 0.2*2,           // sonde.js ; voler.js (réussi / vide / raté)
  selenite: 5,                                     // selenite.js, une aiguille tous les 4 jours
  expedition: n => (0.6*4 + 0.4*2) * Math.min(n, 20) // BACKEND §42 : 4 × niveau / 2 × niveau, plafonné à 20 ; 60 % de victoires
};
const MISSIONS = [ { niv:8, xp:100 }, { niv:20, xp:250 }, { niv:20, xp:250 }, { niv:20, xp:300 }, { niv:35, xp:500 } ];  // H/G9 ; une tous les 40 à 60 jours

/* ---------- Les profils (HYPOTHÈSES) ---------- */
const PROFILS = {
  occasionnel: { nom:"Occasionnel (30 min/j)", quete:0.35, debut:1, jour:{ miner:3, recolte:2, patrouille:0.2 },
                 expeditionTous:0, mission:0, seleniteJour:0.15 },
  regulier:    { nom:"Régulier (1 h/j)",       quete:0.65, debut:2, jour:{ miner:4, recolte:3, patrouille:0.4, duel:0.5, sonde:0.3, vol:0.2 },
                 expeditionTous:10, mission:0.5, seleniteJour:0.3 },
  assidu:      { nom:"Assidu (3 h/j)",         quete:1.0,  debut:5, jour:{ miner:6, recolte:4, patrouille:1, duel:1.5, sonde:0.5, vol:0.3, selenite:0.25 },
                 expeditionTous:4, mission:1, seleniteJour:0.6 }
};
const REUSSITE_JOUR = 0.75;   // chance de finir la quête le jour où on s'y met (sinon : verrou de 8 h, attente, etc.)

/* ---------- XP d'atelier (K173, v2.49) : lue dans le jeu (xpAtelier, formations.js) ----------
   --atelier=a,b remplace le barème du jeu (a par Sélénite, b par Nyx, a au moins) pour comparer. */
const [ATELIER_SEL, ATELIER_NYX] = _at ? _at.split("=")[1].split(",").map(Number) : [JEU.XP_ATELIER_SEL, JEU.XP_ATELIER_NYX];
const ATELIER_MIN = _at ? ATELIER_SEL : JEU.XP_ATELIER_MIN, ATELIER_NIV = JEU.XP_ATELIER_NIV;
const GROS = [];
for(const [cle, fo] of Object.entries(FORMATIONS)) for(const [, n] of fo.recettes){
  const xpJeu = JEU.xpAtelier(n); if(!xpJeu) continue;
  const c = JEU._cristauxFab(n);
  GROS.push({ cle, n, niv: NIVEAUX_OBJETS["fab_" + normNom(n).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")] || ATELIER_NIV, sel:c.sel, nyx:c.nyx,
              xp: _at ? Math.max(ATELIER_MIN, Math.round(ATELIER_SEL * c.sel + ATELIER_NYX * c.nyx)) : xpJeu });
}
// XP d'atelier par Sélénite transformée, en moyenne sur les gros objets qui en contiennent
const _avecSel = GROS.filter(g => g.sel > 0);
const XP_PAR_SEL = _avecSel.reduce((a, g) => a + g.xp, 0) / _avecSel.reduce((a, g) => a + g.sel, 0);

/* ---------- La simulation ---------- */
let _graine = 12345; const alea = () => (_graine = (_graine * 1103515245 + 12345) % 2147483648) / 2147483648;
function activiteJour(P, niv){
  let x = 0; for(const [k, n] of Object.entries(P.jour)) x += n * GAINS[k];
  if(P.expeditionTous) x += GAINS.expedition(niv) / P.expeditionTous;
  return x * FACT;
}
function simuler(P, jours){
  let xp = 0, qi = 0, attente = 0, dimancheQ38 = -1, prochaineMission = 20 + Math.floor(alea() * 20);
  const res = { niv:{}, finQ:{}, atteint:{}, jq:[] };   // v2.79 : jq[i] = jour où la quête i est finie (o_economie.js)
  for(let j = 0; j < jours; j++){
    const dim = (j % 7) === 6;     // jour 0 = un lundi
    // Quêtes : Q1 → Q5 libres (plusieurs le même jour), puis une par jour au plus (dès Q6)
    let faites = 0;
    while(qi < QUETES.length && j >= attente){
      const q = QUETES[qi], libre = qi < 5;
      if(!libre && faites > 0) break;
      if(libre && faites >= P.debut) break;
      if(alea() >= (libre ? 1 : P.quete)) break;
      const g = GARDIENS[q.id]; if(g && niveauDe(xp) < g) break;
      if(q.id === "q38" && !dim) break;
      if(q.id === "q40" && !(dim && j > dimancheQ38)) break;
      if(!libre && alea() >= REUSSITE_JOUR) break;
      const rx = BAREME ? BAREME[qi].xp : (q.recompense.xp || 0), kx = (q.recompense.xp ? rx / q.recompense.xp : 1);
      let gx = rx;
      for(const e of q.etapes || []) if(e.defi && e.defi.type === "combat") gx += e.defi.xp || 8;
      const ch = CHOIX_XP[q.id]; if(ch) gx += Math.round(ch[Math.floor(alea() * ch.length)] * kx);
      xp += gx; faites++; qi++; res.jq[qi - 1] = j;
      if(q.id === "q38") dimancheQ38 = j;
      if(qi === 15 || qi === 30 || qi === 45) res.finQ[qi] = j + 1;
      if(!libre) attente = j + 1;
    }
    const niv = niveauDe(xp);
    xp += activiteJour(P, niv);
    if(ATELIER && niv >= ATELIER_NIV) xp += P.seleniteJour * XP_PAR_SEL;
    if(P.mission && j >= prochaineMission){
      const m = MISSIONS[Math.floor(alea() * MISSIONS.length)];
      if(niveauDe(xp) >= m.niv && alea() < P.mission) xp += alea() < 0.7 ? m.xp : m.xp / 10;
      prochaineMission = j + 40 + Math.floor(alea() * 21);
    }
    for(const L of [20, 25, 30, 35, 40]) if(!res.atteint[L] && niveauDe(xp) >= L) res.atteint[L] = j + 1;
    if([7, 30, 60, 90, 180, 365].includes(j + 1)) res.niv[j + 1] = niveauDe(xp);
  }
  return res;
}
function mediane(v){ const w = v.filter(x => x != null).sort((a, b) => a - b); if(w.length < v.length / 2) return null; return w[Math.floor(w.length / 2)]; }
function lancer(P, n = 1000){
  _graine = 12345;   // même tirage pour chaque profil et chaque variante : les écarts viennent des règles, pas du hasard
  const R = []; for(let i = 0; i < n; i++) R.push(simuler(P, 730));
  const m = f => mediane(R.map(f));
  return { niv: [7, 30, 60, 90, 180, 365].map(d => m(r => r.niv[d])), finQ: [15, 30, 45].map(k => m(r => r.finQ[k])),
           atteint: [20, 25, 30, 35, 40].map(L => m(r => r.atteint[L])) };
}
const fj = d => d == null ? "> 2 ans" : (d < 60 ? d + " j" : (d / 30.4).toFixed(1).replace(".", ",") + " mois");

/* v2.79 : l'outil de l'économie (o_economie.js) réutilise la simulation des quêtes ; les sorties ne s'impriment
   que si l'on lance CE fichier. */
module.exports = { simuler, PROFILS, QUETES, niveauDe, graine: v => { _graine = v; } };
if(require.main === module){
/* ---------- Sorties ---------- */
if(BAREME) console.log(`Barème des quêtes : ${_bar} (o_baremes_quetes.js)`);
console.log(`Nova Epic — simulation de la progression${ATELIER ? ` AVEC l'XP d'atelier (${_at ? "barème essayé" : "barème du jeu, K173"})` : " SANS l'XP d'atelier"}${FACT !== 1 ? ` (activité ×${FACT})` : ""}\n`);
console.log("1. Courbe : XP totale pour atteindre un niveau, et coût du niveau suivant");
for(const n of [5, 10, 15, 20, 25, 30, 35, 40]) console.log(`   niv ${String(n).padStart(2)} : ${String(xpCumulPour(n)).padStart(6)} XP   (niveau suivant : ${xpCumulPour(n + 1) - xpCumulPour(n)})`);
let rec = 0, moy = 0;
console.log("\n2. Les quêtes seules (récompense + combats + choix moyen) → niveau");
QUETES.forEach((q, i) => {
  const rx = BAREME ? BAREME[i].xp : (q.recompense.xp || 0), kx = q.recompense.xp ? rx / q.recompense.xp : 1;
  rec += rx; for(const e of q.etapes || []) if(e.defi && e.defi.type === "combat") rec += e.defi.xp || 8;
  const ch = CHOIX_XP[q.id]; if(ch) moy += kx * ch.reduce((a, b) => a + b, 0) / ch.length;
  if([5, 11, 15, 16, 19, 20, 27, 30, 31, 45].includes(i + 1)) console.log(`   après Q${String(i + 1).padStart(2)} : ${String(Math.round(rec + moy)).padStart(6)} XP → niveau ${niveauDe(rec + moy)}`);
});
console.log("\n3. Activité hors quêtes (XP par jour, hypothèses)  — vrais joueurs (08/11) : Kyraa ≈ 19, Nanamy ≈ 26, Xunbel ≈ 33, Asulf ≈ 47");
for(const P of Object.values(PROFILS)) console.log(`   ${P.nom.padEnd(24)} niveau 10 : ${activiteJour(P, 10).toFixed(0).padStart(3)}   niveau 20+ : ${activiteJour(P, 20).toFixed(0).padStart(3)}${ATELIER ? `   + atelier ${(P.seleniteJour * XP_PAR_SEL).toFixed(0)} (dès le niveau ${ATELIER_NIV})` : ""}`);
if(ATELIER){
  console.log(`\n4. XP d'atelier par objet (≥ niveau ${ATELIER_NIV} ; ${ATELIER_SEL} par Sélénite, ${ATELIER_NYX} par Nyx, au moins ${ATELIER_MIN})`);
  for(const g of GROS) console.log(`   ${g.cle.padEnd(12)} ${g.n.padEnd(22)} niv ${String(g.niv).padStart(2)}  Sél ${g.sel}  Nyx ${g.nyx}  → ${g.xp} XP`);
  console.log(`   soit ≈ ${XP_PAR_SEL.toFixed(0)} XP par Sélénite transformée`);
}
console.log(`\n${ATELIER ? 5 : 4}. Médiane de ${1000} parties par profil`);
console.log("   profil                    | niv J+7 | J+30 | J+60 | J+90 | J+180 | J+365 | fin Q15 | fin Q30 | fin Q45 | niv 20 | niv 30 | niv 35 | niv 40");
for(const P of Object.values(PROFILS)){
  const r = lancer(P);
  console.log(`   ${P.nom.padEnd(25)} | ${r.niv.map(x => String(x).padStart(4)).join(" | ")}  | ${r.finQ.map(d => fj(d).padStart(7)).join(" | ")} | ${[r.atteint[0], r.atteint[2], r.atteint[3], r.atteint[4]].map(d => fj(d).padStart(6)).join(" | ")}`);
}
}
