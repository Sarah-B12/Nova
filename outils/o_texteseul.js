/* ===========================================================
   o_texteseul.js — v1.92 (22/10) : vérifie qu'une réécriture est « TEXTE SEUL » (K53).
   Compare deux versions de js/quetes-data.js, quête par quête : tout doit être
   identique (épreuves, cibles, leurres, choix, ordre des options, coûts, cercles,
   récompenses, consignes, indices, textes d'épreuve, boutons, réponses, éléments
   d'ordre…) SAUF les champs de narration listés dans NARRATION.
   Usage :  node o_texteseul.js <ancien quetes-data.js> <nouveau> q17 [q18 …]
   Sortie : « OK » par quête, ou la liste des chemins qui diffèrent. Compte aussi
   les « Un temps » (K53 : au plus un par quête) et les paragraphes par écran.
   =========================================================== */
const fs = require("fs"), vm = require("vm");

// Champs que la réécriture a le droit de changer (narration, journal, messages).
const NARRATION = new Set(["intro","arrivee","reussite","journal","echec","fini","glisse",
  "bloque","bute","trouve","fele","pariForce","brulant","commentaires","colle"]);

function charger(f){
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(f, "utf8") + "\n;this.__Q = QUETES;", ctx);
  return ctx.__Q;
}
function squelette(v){
  if(Array.isArray(v)) return v.map(squelette);
  if(v && typeof v === "object"){
    const o = {};
    for(const k of Object.keys(v).sort()) o[k] = NARRATION.has(k) ? "‹texte›" : squelette(v[k]);
    return o;
  }
  return v;
}
function diff(a, b, chemin, out){
  if(JSON.stringify(a) === JSON.stringify(b)) return;
  if(a && b && typeof a === "object" && typeof b === "object"){
    const cles = new Set([...Object.keys(a), ...Object.keys(b)]);
    for(const k of cles) diff(a[k], b[k], chemin + "." + k, out);
    return;
  }
  out.push(chemin + " : " + JSON.stringify(a) + " → " + JSON.stringify(b));
}
function textes(q){
  const t = [];
  (function marche(v){
    if(typeof v === "string") t.push(v);
    else if(Array.isArray(v)) v.forEach(marche);
    else if(v && typeof v === "object") Object.values(v).forEach(marche);
  })(q);
  return t.join("\n");
}

const [,, fa, fb, ...ids] = process.argv;
const A = charger(fa), B = charger(fb);
let ok = true;
for(const id of ids){
  const qa = A.find(q => q.id === id), qb = B.find(q => q.id === id);
  if(!qa || !qb){ console.log(id, ": introuvable"); ok = false; continue; }
  const out = [];
  diff(squelette(qa), squelette(qb), id, out);
  const tb = textes(qb);
  const unTemps = (tb.match(/Un temps/g) || []).length;
  const ecrans = [qb.intro, ...qb.etapes.map(e => e.arrivee), ...qb.etapes.map(e => e.defi && e.defi.reussite)]
    .filter(Boolean).map(x => Array.isArray(x) ? x.length : 1);
  console.log(`${id} : ${out.length ? "DIFFÉRENCES" : "OK (texte seul)"} · « Un temps » : ${unTemps}` +
    ` · paragraphes par écran : ${ecrans.join(" ")}`);
  out.forEach(l => console.log("   ", l));
  if(out.length) ok = false;
  // Les autres quêtes doivent être strictement identiques.
}
const autres = A.map(q => q.id).filter(id => !ids.includes(id));
const changees = autres.filter(id => JSON.stringify(A.find(q => q.id === id)) !== JSON.stringify(B.find(q => q.id === id)));
console.log(changees.length ? "⚠ Autres quêtes modifiées : " + changees.join(", ") : "Autres quêtes : inchangées.");
process.exit(ok && !changees.length ? 0 : 1);
