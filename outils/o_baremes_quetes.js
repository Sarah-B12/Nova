// v2.50 (K174 → K176) — LES RÉCOMPENSES DES QUÊTES : le barème du jeu et les barèmes comparés, côte à côte.
// Usage : node outils/o_baremes_quetes.js ..          (tableaux : XP, crédits, PA, quête par quête et par arc)
//         node outils/o_sim_xp.js .. --bareme=avant   (simulation avec un barème : actuel | avant | pente | courbe)
// Lit les récompenses actuelles dans js/quetes-data.js et la courbe dans js/systeme.js. Les barèmes candidats sont
// des FORMULES (ci-dessous). Décidé : la pente (K174, faite en v2.50), crédits et PA inchangés (K175, K176).
"use strict";
const fs = require("fs"), path = require("path");

function charger(rac, fichier, noms){
  const src = fs.readFileSync(path.join(rac, "js", fichier), "utf8");
  const stub = new Proxy(function(){}, { get:(t,k) => k === Symbol.toPrimitive ? (() => 0) : (k === "then" ? undefined : stub), apply:() => stub, construct:() => stub });
  const p = new Proxy({}, { has:(t,k) => typeof k === "string" && k !== "__out", get:(t,k) => (k in t) ? t[k] : (k === Symbol.unscopables ? undefined : (k in globalThis ? globalThis[k] : stub)), set:(t,k,v) => { t[k] = v; return true; } });
  const out = {};
  new Function("__p", "__out", "with(__p){\n" + src + "\n;" + noms.map(n => `try{ __out[${JSON.stringify(n)}]=${n}; }catch(e){}`).join("") + "\n}")(p, out);
  return out;
}
const r5 = x => Math.round(x / 5) * 5, r50 = x => Math.round(x / 50) * 50;

/* ---------- L'XP des options de choix ----------
   ⚠ COPIE du serveur (_choix_gains, version v268 ; barème H86, K44, K50, K63, K174) : à tenir à jour si un choix change.
   Dans l'ordre des options ; 0 = l'option ne donne pas d'XP (objets, crédits ou compétence). */
const CHOIX_XP = {   // v268 (K174) : l'XP des choix suit la pente
  q3:[0,40,0], q6:[0,0,60], q7:[70,40,0], q8:[45,0,85], q10:[55,0,100], q12:[70,115,0], q14:[135,0,135],
  q16:[80,25,0], q17:[0,90,0], q19:[50,100,0], q20:[100,35,0], q21:[0,90,35], q22:[40,95,0], q23:[85,35,0],
  q25:[100,35,0], q26:[90,35,0], q27:[0,95,35], q29:[100,40,0], q30:[40,100,0], q31:[145,50,0], q32:[135,0,0],
  q34:[135,45,0], q35:[140,0,45], q36:[145,45,0], q38:[145,0,45], q39:[150,45,0], q40:[155,0,45],
  q41:[160,0,45], q42:[165,0,45], q43:[170,0,45], q44:[170,0,45], q45:[175,0,45]
};

/* ---------- Les barèmes (XP et crédits par quête ; n = numéro de la quête, 1 à 45) ---------- */
const AVANT_XP = [25,40,55,80,120,140,160,180,200,220,240,260,280,300,320,340,350,360,370,400,
  420,440,460,480,500,520,540,560,580,600,420,440,460,480,500,520,540,560,580,600,620,640,660,680,700];   // v2.49 et avant
const BAREMES = {
  actuel: { nom:"Actuel (jeu)", desc:"ce que donne le jeu (depuis la v2.50 : la pente, K174)",
            xp:(n, q) => q.recompense.xp || 0, credits:(n, q) => q.recompense.credits || 0 },
  avant:  { nom:"Avant (v2.49)", desc:"l'ancien barème (Q31 repartait à 420 XP) ; crédits inchangés (K175)",
            xp:n => AVANT_XP[n - 1], credits:(n, q) => q.recompense.credits || 0 },
  pente:  { nom:"Une seule pente", desc:"XP = 20 + 16,5 par quête (Q45 : 745) — retenue (K174) ; crédits = 5 × XP (écartés, K175)",
            xp:n => r5(20 + 16.5 * (n - 1)), credits:n => r50(5 * r5(20 + 16.5 * (n - 1))) },
  courbe: { nom:"Montée qui s'adoucit", desc:"XP = 30 + 39,8 × (n−1)^0,765 (écartée, K174) ; crédits = 5 × XP",
            xp:n => r5(30 + 39.8 * Math.pow(n - 1, 0.765)), credits:n => r50(5 * r5(30 + 39.8 * Math.pow(n - 1, 0.765))) }
};
/* Les PA (dix en tout, K111) : trois répartitions possibles, indépendantes du barème d'XP. */
const PA = {
  actuel: { nom:"Actuel (moments forts, gardé : K176)", quetes:["q2","q5","q8","q12","q14","q15","q20","q30","q31","q45"] },
  regulier: { nom:"Régulier (environ toutes les 4 à 5 quêtes)", quetes:["q3","q7","q11","q15","q20","q25","q30","q35","q40","q45"] },
  jalons: { nom:"Jalons de l'histoire, mieux répartis", quetes:["q2","q5","q10","q15","q20","q25","q30","q35","q40","q45"] }
};

function bareme(nom, QUETES){
  const B = BAREMES[nom]; if(!B) throw new Error("barème inconnu : " + nom + " (" + Object.keys(BAREMES).join(", ") + ")");
  return QUETES.map((q, i) => ({ id:q.id, xp:B.xp(i + 1, q), credits:B.credits(i + 1, q) }));
}
module.exports = { BAREMES, PA, CHOIX_XP, bareme };

/* ---------- Tableaux (quand on lance ce fichier) ---------- */
if(require.main === module){
  const RAC = process.argv[2] || "..";
  const { xpCumulPour } = charger(RAC, "systeme.js", ["xpCumulPour"]);
  const { QUETES } = charger(RAC, "quetes-data.js", ["QUETES"]);
  const niv = x => { let n = 1; while(x >= xpCumulPour(n + 1)) n++; return n; };
  const cout = n => xpCumulPour(n + 1) - xpCumulPour(n);
  const noms = Object.keys(BAREMES), tous = {};
  for(const b of noms) tous[b] = bareme(b, QUETES);
  // « Quêtes seules » : récompense + combats d'étape + choix moyen (l'XP des choix suit le barème dans la même proportion)
  const parcours = b => { let T = 0; return tous[b].map((x, i) => { const q = QUETES[i], L = niv(T), part = x.xp / cout(L);
    const k = q.recompense.xp ? x.xp / q.recompense.xp : 1, ch = CHOIX_XP[q.id];
    T += x.xp + (ch ? k * ch.reduce((a, c) => a + c, 0) / ch.length : 0);
    for(const e of q.etapes || []) if(e.defi && e.defi.type === "combat") T += e.defi.xp || 8;
    return { L, part, apres:niv(T), T }; }); };
  const P = {}; for(const b of noms) P[b] = parcours(b);

  console.log("Barèmes :"); for(const b of noms) console.log(`  ${b.padEnd(7)} — ${BAREMES[b].nom} : ${BAREMES[b].desc}`);
  console.log("\n1. Quête par quête — XP (et en % du niveau en cours pour qui ne fait que les quêtes)");
  console.log("   quête | " + noms.map(b => b.padEnd(15)).join(" | "));
  QUETES.forEach((q, i) => console.log(`   ${q.id.padEnd(5)} | ` + noms.map(b => `${String(tous[b][i].xp).padStart(4)} (${String(Math.round(P[b][i].part * 100)).padStart(3)} %)`.padEnd(15)).join(" | ")));
  console.log("\n2. Quête par quête — crédits");
  console.log("   quête | " + noms.map(b => b.padEnd(7)).join(" | "));
  QUETES.forEach((q, i) => console.log(`   ${q.id.padEnd(5)} | ` + noms.map(b => String(tous[b][i].credits).padStart(7)).join(" | ")));
  console.log("\n3. Par arc — total XP / total crédits / niveau atteint avec les quêtes seules (choix compris)");
  for(const [a, z] of [["Q1 → Q15", [0, 15]], ["Q16 → Q30", [15, 30]], ["Q31 → Q45", [30, 45]]]){
    console.log(`   ${a.padEnd(10)} | ` + noms.map(b => { const s = tous[b].slice(z[0], z[1]);
      return `${b} ${s.reduce((t, x) => t + x.xp, 0)} XP, ${s.reduce((t, x) => t + x.credits, 0)} ₡ → niv ${P[b][z[1] - 1].apres}`; }).join("  ·  "));
  }
  console.log("   Total     | " + noms.map(b => `${b} ${tous[b].reduce((t, x) => t + x.xp, 0)} XP, ${tous[b].reduce((t, x) => t + x.credits, 0)} ₡`).join("  ·  "));
  console.log("\n4. Les PA (10 en tout) — après Q5 / Q15 / Q30 / Q45");
  for(const [k, p] of Object.entries(PA)){
    const a = n => p.quetes.filter(q => +q.slice(1) <= n).length;
    console.log(`   ${p.nom.padEnd(44)} ${a(5)} / ${a(15)} / ${a(30)} / ${a(45)}   (${p.quetes.join(" ")})`);
  }
}
