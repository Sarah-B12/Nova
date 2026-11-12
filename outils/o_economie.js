// v2.79 (balance, point 6) — L'ÉCONOMIE : prix, métiers, gestes, voyages, profils de joueurs.
// Décisions K245 → K250 (PASSATION). Depuis la v2.79, la section 1 VÉRIFIE que PRIX_ITEM suit la règle du barème
// (cristaux compris) : un écart = un prix à corriger (puis prix_brade, prix_moyen, vol_risque au serveur).
// Usage (depuis le dossier « Nova Epic ») :
//   node outils/o_economie.js .                  → tout
//   node outils/o_economie.js . --prix           → seulement les prix recalculés (K245) et le bloc à recoller
//   node outils/o_economie.js . --selenite=0     → le calcul des prix avec une Sélénite à 0 ₡ (= l'ancien barème)
//
// Il LIT dans le jeu, sans les recopier : PRIX_ITEM (js/prix.js), les recettes (FORMATIONS, js/formations.js),
// les matières (js/data.js), la boutique et le Perchoir (BOUTIQUE, BASE_BOUTIQUE), les structures (js/terrain.js),
// les vaisseaux (js/vaisseau.js), le saut (js/orbite.js), le butin des patrouilles (js/patrouille.js), les récompenses
// des quêtes, et la progression des quêtes (o_sim_xp.js : même simulation, même graine).
// Il RECOPIE (⚠ à tenir à jour) les gains décidés par le SERVEUR (expéditions, Fléau, sondes, missions) → SERVEUR.
// Les PROFILS (ce que fait un joueur par jour) sont des HYPOTHÈSES : celles de o_sim_xp.js.
"use strict";
const fs = require("fs"), path = require("path");
const RAC = process.argv[2] || "..";
const ARG = k => { const a = process.argv.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : null; };
const SEUL_PRIX = process.argv.includes("--prix");

/* ---------- Lecture du jeu : plusieurs fichiers dans une même portée (comme dans la page) ---------- */
function charger(fichiers, noms){
  const src = fichiers.map(f => fs.readFileSync(path.join(RAC, "js", f), "utf8")).join("\n;\n");
  const stub = new Proxy(function(){}, { get:(t,k) => k === Symbol.toPrimitive ? (() => 0) : (k === "then" ? undefined : stub), apply:() => stub, construct:() => stub });
  const base = {};
  const p = new Proxy(base, { has:(t,k) => typeof k === "string" && k !== "__out", get:(t,k) => (k in t) ? t[k] : (k === Symbol.unscopables ? undefined : (k in globalThis ? globalThis[k] : stub)), set:(t,k,v) => { t[k] = v; return true; } });
  const out = {};
  new Function("__p", "__out", "with(__p){\n" + src + "\n;" + noms.map(n => `try{ __out[${JSON.stringify(n)}]=${n}; }catch(e){}`).join("") + "\n}")(p, out);
  return out;
}
const J = charger(["data.js", "prix.js", "systeme.js", "formations.js", "terrain.js", "maison.js", "vaisseau.js", "orbite.js", "patrouille.js"],
  ["PRIX_ITEM", "FORMATIONS", "parseIngredients", "TOUS_ITEMS", "MATIERES", "BOUTIQUE", "BASE_BOUTIQUE", "STRUCTURES", "MAISON_PALIERS",
   "VAISSEAUX", "SAUT_UNITES", "PAS_ESPACE_C", "PATROUILLE_DROPS", "PATROUILLE_DROP_TAUX", "PATROUILLE_DROP_DOUBLE", "PATROUILLE_CRISTAL",
   "MINE_LOT", "NIVEAUX_OBJETS"]);
const { PRIX_ITEM, FORMATIONS, parseIngredients } = J;
const nomDe = id => { const it = (J.TOUS_ITEMS || []).find(x => x.id === id); return it ? it.nom : id; };
const f0 = n => Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ");
const pad = (s, n) => String(s).padStart(n), padg = (s, n) => String(s).padEnd(n);

/* ---------- 1. Les prix des objets fabriqués : la règle du barème ----------
   Relevée dans PRIX_ITEM (et vérifiée ci-dessous sur tous les objets) :
     moyen = somme des ingrédients au prix moyen + 8 (le travail) ; minimum = 0,7 × moyen ; maximum = 1,8 × moyen.
   Les matières premières et les deux cristaux ont leurs prix à eux (ils ne se fabriquent pas). */
const TRAVAIL = 8, K_MIN = 0.7, K_MAX = 1.8;
const RECETTES = {};   // id → [{id, qte}]
for(const fo of Object.values(FORMATIONS)) for(const [, nom, ing] of fo.recettes){
  const ings = parseIngredients(ing);
  const id = ings.length && (J.TOUS_ITEMS || []).find(x => x.nom === nom) ? J.TOUS_ITEMS.find(x => x.nom === nom).id : null;
  if(id) RECETTES[id] = ings.map(g => ({ id:g.id, qte:g.qte }));
}
function prixRecette(selenite){
  const memo = {};
  const moy = id => {
    if(id in memo) return memo[id];
    let v;
    if(id === "selenite") v = selenite;
    else if(!RECETTES[id]) v = PRIX_ITEM[id] ? PRIX_ITEM[id].moy : 0;
    else v = RECETTES[id].reduce((a, g) => a + g.qte * moy(g.id), 0) + TRAVAIL;
    return memo[id] = v;
  };
  const r = {};
  for(const id of Object.keys(RECETTES)) { const m = moy(id); r[id] = { min:Math.round(K_MIN * m), moy:m, max:Math.round(K_MAX * m) }; }
  return r;
}
// Cristaux contenus (recettes décomposées)
function cristaux(id, memo = {}){
  if(id in memo) return memo[id];
  if(id === "selenite") return memo[id] = { sel:1, nyx:0 };
  if(id === "cristal") return memo[id] = { sel:0, nyx:1 };
  if(!RECETTES[id]) return memo[id] = { sel:0, nyx:0 };
  const c = { sel:0, nyx:0 };
  for(const g of RECETTES[id]){ const x = cristaux(g.id, memo); c.sel += g.qte * x.sel; c.nyx += g.qte * x.nyx; }
  return memo[id] = c;
}
const SEL_VRAIE = PRIX_ITEM.selenite.moy, NYX = PRIX_ITEM.cristal.moy;
const ANCIEN = prixRecette(SEL_VRAIE), NOUVEAU = prixRecette(+(ARG("selenite") ?? SEL_VRAIE));   // v2.79 : ANCIEN = le barème recalculé, qui doit égaler PRIX_ITEM
let ecartsAncien = Object.keys(ANCIEN).filter(id => PRIX_ITEM[id] && ["min","moy","max"].some(k => ANCIEN[id][k] !== PRIX_ITEM[id][k]));
const sansPrix = Object.keys(RECETTES).filter(id => !PRIX_ITEM[id]);

console.log("Nova Epic — l'économie (outils/o_economie.js)\n");
console.log("1. Le barème des prix des objets fabriqués");
console.log(`   Règle : moyen = ingrédients au prix moyen + ${TRAVAIL} ; minimum = ${K_MIN} × moyen ; maximum = ${K_MAX} × moyen.`);
console.log(`   Recalculé (cristaux à leur prix, K245/K247) : ${Object.keys(ANCIEN).length - sansPrix.length - ecartsAncien.length} objets sur ${Object.keys(ANCIEN).length - sansPrix.length} identiques à PRIX_ITEM`
  + (ecartsAncien.length ? ` ; ⚠ ÉCARTS (à corriger dans js/prix.js, puis les tables serveur) : ${ecartsAncien.join(", ")}` : " → le barème est cohérent.")
  + (sansPrix.length ? ` (sans prix : ${sansPrix.join(", ")})` : ""));
const touches = Object.keys(NOUVEAU).filter(id => PRIX_ITEM[id] && NOUVEAU[id].moy !== PRIX_ITEM[id].moy).sort((a, b) => NOUVEAU[a].moy - NOUVEAU[b].moy);
console.log(`\n   Avec la Sélénite à son prix moyen (${f0(+(ARG("selenite") ?? SEL_VRAIE))} ₡) — ${touches.length} objets changent :`);
console.log("   objet                     | Sél | Nyx | aujourd'hui min · moy · max     | recalculé min · moy · max        | cristaux seuls");
for(const id of touches){
  const a = PRIX_ITEM[id], n = NOUVEAU[id], c = cristaux(id);
  console.log(`   ${padg(nomDe(id), 25)} | ${pad(c.sel, 3)} | ${pad(c.nyx, 3)} | ${pad(f0(a.min), 7)} · ${pad(f0(a.moy), 7)} · ${pad(f0(a.max), 7)} | ${pad(f0(n.min), 8)} · ${pad(f0(n.moy), 8)} · ${pad(f0(n.max), 8)} | ${pad(f0(c.sel * SEL_VRAIE + c.nyx * NYX), 7)}`);
}
if(SEUL_PRIX){
  console.log("\n   Lignes à recoller dans js/prix.js :");
  for(const id of touches) console.log(`  ${id}: { min:${NOUVEAU[id].min}, moy:${NOUVEAU[id].moy}, max:${NOUVEAU[id].max} }, // ${nomDe(id)}`);
  process.exit(0);
}

/* ---------- 2. Ce que gagne un artisan ---------- */
console.log("\n2. Les métiers : acheter les ingrédients au marché (prix moyen), revendre l'objet au prix moyen");
console.log(`   Par construction du barème, la marge est de ${TRAVAIL} ₡ par fabrication, moins la commission de mise en vente`);
console.log("   (10 % du prix minimum) : un artisan qui ACHÈTE ses matières ne gagne rien au prix moyen ; il gagne en les");
console.log("   produisant lui-même (mine, terrain, patrouilles), ou en vendant au-dessus du prix moyen (jusqu'à 1,8 ×).");
const MARGES = [];
for(const id of Object.keys(RECETTES)) if(PRIX_ITEM[id]){
  const ing = RECETTES[id].reduce((a, g) => a + g.qte * (PRIX_ITEM[g.id] ? PRIX_ITEM[g.id].moy : 0), 0);
  MARGES.push({ id, ing, moy:PRIX_ITEM[id].moy, max:PRIX_ITEM[id].max, com:Math.ceil(0.1 * PRIX_ITEM[id].min) });
}
const pertes = MARGES.filter(m => m.max < m.ing);
console.log(`   Objets qu'on ne peut PAS vendre sans perte, même au prix maximum (ingrédients aux prix d'aujourd'hui) : ${pertes.length}`);
for(const m of pertes) console.log(`     ${padg(nomDe(m.id), 25)} ingrédients ${pad(f0(m.ing), 7)} ₡ > maximum ${pad(f0(m.max), 7)} ₡`);

/* ---------- 3. Ce que rapporte un geste ---------- */
const mins = J.MATIERES.filter(m => m.cat === "minerai" && m.poids >= 1);
const poidsT = mins.reduce((a, m) => a + m.poids, 0);
const minMoy = mins.reduce((a, m) => a + m.poids * PRIX_ITEM[m.id].moy, 0) / poidsT;
const minBrade = mins.reduce((a, m) => a + m.poids * Math.max(1, Math.round(PRIX_ITEM[m.id].min / 2)), 0) / poidsT;
const LOT = (3 + 6) / 2;                                      // terrain.js : alea(3, 6)
const pool = J.PATROUILLE_DROPS.filter(id => PRIX_ITEM[id]);
const poolMoy = pool.reduce((a, id) => a + PRIX_ITEM[id].moy, 0) / pool.length;
const poolBrade = pool.reduce((a, id) => a + Math.max(1, Math.round(PRIX_ITEM[id].min / 2)), 0) / pool.length;
const nbObj = J.PATROUILLE_DROP_TAUX * (1 + J.PATROUILLE_DROP_DOUBLE);
const SERVEUR = {   // ⚠ COPIES du serveur (BACKEND_PLAN §42, §76-77, §80, v231 ; GDD Arène, sondes)
  patrouilleCredits: 85 + 6,                // v2.79 (K248) : alea(70,100) + Int ÷ 5 (≈ 30 d'Intelligence), × Registre ≈ 1
  sonde: 195 * 0.7,                         // v282 (K248) : 1re victoire du jour 120–270 ₡ ; 70 % de victoires supposées
  expedition: 15 * 72,                      // v282 (K248) : 15 × défense ; défense ≈ (40..80 + 3 × 4 participants) × (1 + Registre/200)
  fleau: f => 5 * f,                        // victoire : 5 × force (K248 : 12 ×, migration à venir après lecture de _fleau_clore)
  missions: [ { nom:"bouture", niv:8, cr:300 }, { nom:"balise", niv:20, cr:800 }, { nom:"infiltration", niv:20, cr:400 },
              { nom:"casse", niv:20, cr:0 }, { nom:"satellite", niv:35, cr:2000 } ]
};
const RECOLTE = { unites:7, moy:5, brade:2, graine:7 };       // Sylve : 5–9 ; graine 6–8 ₡ ; petits amortis sur 7 tontes
console.log("\n3. Ce que rapporte un geste (valeur au prix moyen ; entre parenthèses, ce que paie la brade)");
console.log(`   Miner (8 %)                 : ${LOT} minerais × ${minMoy.toFixed(1)} ₡ = ${f0(LOT * minMoy)} ₡ (${f0(LOT * minBrade)})   → ${(LOT * minMoy / 8).toFixed(1)} ₡ par % d'énergie`);
console.log(`   Cultiver (≈ 13 %)           : ${RECOLTE.unites} unités × ${RECOLTE.moy} ₡ − graine ${RECOLTE.graine} = ${f0(RECOLTE.unites * RECOLTE.moy - RECOLTE.graine)} ₡   → ${((RECOLTE.unites * RECOLTE.moy - RECOLTE.graine) / 13).toFixed(1)} ₡ par %`);
console.log(`   Patrouille gagnée (≤ 5/j)   : ${SERVEUR.patrouilleCredits} ₡ + ${nbObj.toFixed(2)} objet × ${f0(poolMoy)} ₡ (${f0(poolBrade)}) + ${J.PATROUILLE_CRISTAL * 100} % de Nyx = ${f0(SERVEUR.patrouilleCredits + nbObj * poolMoy + J.PATROUILLE_CRISTAL * NYX)} ₡`);
console.log(`   Sonde (5 %)                 : 120–270 ₡ la 1re du jour, puis 40–90 (10 payées au plus) — v282`);
console.log(`   Expédition gagnée (15 %)    : ≈ ${f0(SERVEUR.expedition)} ₡ par participant → ${(SERVEUR.expedition / 15).toFixed(0)} ₡ par %`);
console.log(`   Fléau gagné (10 %)          : 5 × force = ${f0(SERVEUR.fleau(75))} à ${f0(SERVEUR.fleau(190))} ₡`);

/* ---------- 4. Voyager, tenir un vaisseau ---------- */
const BIDON = { fab_biocarburant:20, fab_biocarburant_raffine:60 };   // litres par bidon (vaisseau.js, GDD §13)
const prixL = (v, perchoir) => { const b = J.BASE_BOUTIQUE.find(a => a.id === v.carb); return (perchoir ? b.prix : PRIX_ITEM[v.carb].moy) / BIDON[v.carb]; };
const S = J.SAUT_UNITES;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) / J.PAS_ESPACE_C;
const PERCHOIR = [685, 728], GORGE1 = [1163, 824], GORGE2 = [2146, 1371], NID = [1675, 1052], FLEAU = [286, 864];   // espace-data.js, espace2-data.js
const NAVS = Object.keys(J.VAISSEAUX).filter(id => PRIX_ITEM[id]);   // la navette de réserve (cadeau) n'a pas de prix
const TRAJETS = {
  "Silène ⇄ Perchoir": 2 * S,
  "Silène ⇄ le Nid":   2 * (S + dist(PERCHOIR, GORGE1) + S + dist(GORGE2, NID)),
  "le Nid ⇄ le Fléau": 2 * dist(NID, FLEAU)
};
console.log("\n4. Le carburant d'un aller-retour (unités × consommation ; prix moyen du marché | prix du Perchoir) et le vaisseau par jour");
console.log("   trajet                | " + NAVS.map(id => padg(J.VAISSEAUX[id].nom, 20)).join(" | "));
for(const [t, u] of Object.entries(TRAJETS))
  console.log(`   ${padg(t, 21)} | ` + NAVS.map(id => J.VAISSEAUX[id]).map(v => padg(`${f0(u * v.conso * prixL(v))} | ${f0(u * v.conso * prixL(v, true))} ₡`, 20)).join(" | ") + `   (${u.toFixed(0)} unités)`);
const VIE = { fab_navette_legere:30, fab_vaisseau_cargo:30, fab_vaisseau_maitre:45 };
console.log("   le vaisseau, par jour  | " + NAVS.map(id => padg(`${f0(PRIX_ITEM[id].moy / VIE[id])} ₡ (recalculé : ${f0(NOUVEAU[id].moy / VIE[id])})`, 20)).join(" | "));

/* ---------- 5. Les profils : ce qu'on gagne, ce qu'on dépense, ce qu'on peut s'offrir ---------- */
const SIM = require("./o_sim_xp.js");
const QC = SIM.QUETES.map(q => q.recompense.credits || 0);
const ESPACE = qi => qi >= 15 && qi < 30 ? "perchoir" : (qi >= 30 ? "nid" : null);   // Q16 → Q30 : Triptolème ; Q31 → Q45 : Cérès
const ACHATS = [
  ["Navette légère (marché)", PRIX_ITEM.fab_navette_legere.moy],
  ["Vaisseau Cargo (marché)", PRIX_ITEM.fab_vaisseau_cargo.moy],
  ["Un drone, aujourd'hui", PRIX_ITEM.fab_drone_de_recolte.moy],
  ["Un drone, recalculé", NOUVEAU.fab_drone_de_recolte.moy],
  ["Vaisseau maître, aujourd'hui", PRIX_ITEM.fab_vaisseau_maitre.moy],
  ["Réattribution des aptitudes", 50000],
  ["Vaisseau maître, recalculé", NOUVEAU.fab_vaisseau_maitre.moy]
];
function journeeEco(P, niv){
  const j = P.jour, r = { credits:0, prod:0, brade:0, depense:0 };
  r.credits += (j.patrouille || 0) * 0.85 * SERVEUR.patrouilleCredits + (j.sonde || 0) * SERVEUR.sonde;
  if(P.expeditionTous) r.credits += 0.6 * SERVEUR.expedition / P.expeditionTous;
  r.prod += (j.miner || 0) * LOT * minMoy + (j.recolte || 0) * RECOLTE.unites * RECOLTE.moy + (j.patrouille || 0) * 0.85 * (nbObj * poolMoy + J.PATROUILLE_CRISTAL * NYX);
  r.brade += (j.miner || 0) * LOT * minBrade + (j.recolte || 0) * RECOLTE.unites * RECOLTE.brade + (j.patrouille || 0) * 0.85 * (nbObj * poolBrade + J.PATROUILLE_CRISTAL * PRIX_ITEM.cristal.min / 2);
  r.depense += (j.recolte || 0) * RECOLTE.graine;
  return r;
}
const STRUCT_DEPART = Object.values(J.STRUCTURES).reduce((a, s) => a + s.prix, 0) - J.STRUCTURES.hangar.prix;   // mine, bio-dôme, enclos, atelier
function simulerEco(P, n = 1000){
  SIM.graine(12345);
  const R = [];
  for(let k = 0; k < n; k++){
    const x = SIM.simuler(P, 730);
    const finQ = {}; x.jq.forEach((d, i) => { (finQ[d] = finQ[d] || []).push(i); });
    let liquide = 0, cumQ = 0, cumAutre = 0, cumProd = 0, cumDep = STRUCT_DEPART, qi = 0, navFin = -1;
    let missionProchaine = 30;
    const res = { a:{}, j:{}, apresQ45:null, q:{} };
    for(let d = 0; d < 730; d++){
      for(const i of finQ[d] || []){ cumQ += QC[i]; qi = i + 1;
        if(i === 4) navFin = d + 10;   // Q5 : la navette de réserve, 10 jours
        const ou = ESPACE(i); if(ou) cumDep += TRAJETS[ou === "nid" ? "Silène ⇄ le Nid" : "Silène ⇄ Perchoir"] * prixL(J.VAISSEAUX.fab_navette_legere);
      }
      const e = journeeEco(P, 0);
      cumAutre += e.credits; cumProd += e.prod; cumDep += e.depense;
      if(qi >= 5 && d > navFin && x.jq.length > 15 && d >= x.jq[14]) cumDep += PRIX_ITEM.fab_navette_legere.moy / 30;   // un vaisseau à soi dès l'arc 2
      if(P.mission && d >= missionProchaine){
        const m = SERVEUR.missions[Math.floor(Math.random() * SERVEUR.missions.length)];
        if(Math.random() < P.mission && Math.random() < 0.7) cumAutre += m.cr;
        missionProchaine = d + 40 + Math.floor(Math.random() * 21);
      }
      liquide = cumQ + cumAutre - cumDep;
      if([30, 90, 180, 365].includes(d + 1)) res.j[d + 1] = { q:cumQ, autre:cumAutre, dep:cumDep, prod:cumProd, liq:liquide };
      for(const [nom, prix] of ACHATS) if(res.a[nom] == null && liquide >= prix) res.a[nom] = d + 1;
    }
    if(x.jq[44] != null){ const d = x.jq[44]; res.apresQ45 = d; }
    R.push(res);
  }
  return R;
}
const med = v => { const w = v.filter(x => x != null).sort((a, b) => a - b); return w.length < v.length / 2 ? null : w[Math.floor(w.length / 2)]; };
const fj = d => d == null ? "> 2 ans" : (d < 60 ? d + " j" : (d / 30.4).toFixed(1).replace(".", ",") + " mois");
console.log("\n5. Les profils (activité de o_sim_xp.js ; crédits = quêtes + patrouilles + sondes + expéditions + missions ;");
console.log("   dépenses = structures de départ, graines, carburant d'un aller-retour en navette par quête dans l'espace, une navette");
console.log("   tous les 30 jours dès l'arc 2 ; la production — matières, butin — est comptée À PART : elle ne devient des crédits");
console.log("   que si on la vend ou la brade). Médianes de 1 000 parties.");
for(const [cle, P] of Object.entries(SIM.PROFILS)){
  const R = simulerEco(P);
  const e = journeeEco(P, 0);
  console.log(`\n   ${P.nom}`);
  console.log(`     par jour, hors quêtes : crédits ${f0(e.credits)} ₡ · production ${f0(e.prod)} ₡ au prix moyen (${f0(e.brade)} ₡ bradée) · graines ${f0(e.depense)} ₡`);
  console.log("     jour  | quêtes   | autres crédits | dépenses | en poche | production (prix moyen)");
  for(const d of [30, 90, 180, 365]){
    const g = k => med(R.map(r => r.j[d][k]));
    console.log(`     J+${padg(d, 4)}| ${pad(f0(g("q")), 8)} | ${pad(f0(g("autre")), 14)} | ${pad(f0(g("dep")), 8)} | ${pad(f0(g("liq")), 8)} | ${pad(f0(g("prod")), 8)}`);
  }
  console.log("     on peut s'offrir (crédits en poche, sans rien vendre) :");
  for(const [nom, prix] of ACHATS) console.log(`       ${padg(nom, 30)} ${pad(f0(prix), 7)} ₡ → ${fj(med(R.map(r => r.a[nom])))}`);
  console.log(`     après Q45 (vers ${fj(med(R.map(r => r.apresQ45)))}) : il ne reste que ${f0(e.credits)} ₡ par jour de crédits (+ missions), plus ce qu'il vend.`);
}

/* ---------- 6. Le Fléau : ce qu'une attaque rapporte, frais déduits ----------
   ⚠ RELEVÉ de `node outils/o_fleau_sim.js` (v2.79, règles de fleau_tour v231) : chance de victoire et coque qui reste
   en moyenne, par force du jour. À relever de nouveau si les règles du combat changent.
   Frais : la coque perdue (kits du Nid, 40 PV ; ou le prix par PV de La Carcasse), le carburant le Nid ⇄ le Fléau,
   les Cellules d'énergie du maître quand il charge le canon. Options : --kit-nid=450 --gain-fleau=5 */
const FLEAU_SIM = {   // force : [victoire, coque restante] pour navette, cargo, maître (canon chargé), maître sans cellule ; cellules du maître
  75:  { navette:[0.75,0.30], cargo:[1.00,0.62], maitre:[1.00,0.81,5.6], maitreSans:[1.00,0.71] },
  85:  { navette:[0.42,0.17], cargo:[0.99,0.52], maitre:[1.00,0.77,6.3], maitreSans:[1.00,0.63] },
  100: { navette:[0.13,0.11], cargo:[0.97,0.39], maitre:[1.00,0.70,6.3], maitreSans:[0.97,0.53] },
  115: { navette:[0.00,0.00], cargo:[0.81,0.25], maitre:[1.00,0.60,7.3], maitreSans:[0.98,0.35] },
  130: { navette:[0.00,0.00], cargo:[0.50,0.16], maitre:[1.00,0.52,8.3], maitreSans:[0.97,0.23] },
  160: { navette:[0.00,0.00], cargo:[0.03,0.06], maitre:[0.98,0.32,10.3], maitreSans:[0.24,0.14] }
};
const KIT_NID = +(ARG("kit-nid") ?? J.BASE_BOUTIQUE.find(a => a.id === "kit_reparation").prix), KIT_PV = 40, CARCASSE_PV = 1.5;
const GAIN_F = +(ARG("gain-fleau") ?? 5);
const PV = { navette:J.VAISSEAUX.fab_navette_legere.pv, cargo:J.VAISSEAUX.fab_vaisseau_cargo.pv, maitre:J.VAISSEAUX.fab_vaisseau_maitre.pv, maitreSans:J.VAISSEAUX.fab_vaisseau_maitre.pv };
const CARB = { navette:J.VAISSEAUX.fab_navette_legere, cargo:J.VAISSEAUX.fab_vaisseau_cargo, maitre:J.VAISSEAUX.fab_vaisseau_maitre, maitreSans:J.VAISSEAUX.fab_vaisseau_maitre };
const NOMV = { navette:"navette", cargo:"cargo", maitre:"maître (canon chargé)", maitreSans:"maître (sans cellule)" };
console.log(`\n6. Le Fléau : une attaque, frais déduits (gain ${GAIN_F} × force en victoire ; kit du Nid ${KIT_NID} ₡ pour ${KIT_PV} PV = ${(KIT_NID / KIT_PV).toFixed(2)} ₡ par PV ; La Carcasse ${CARCASSE_PV} ₡ par PV)`);
console.log("   force | " + Object.values(NOMV).map(n => padg(n, 27)).join(" | "));
for(const [f, row] of Object.entries(FLEAU_SIM)){
  const cells = Object.keys(NOMV).map(v => {
    const [w, c, cel] = row[v], perdu = PV[v] * (1 - c), carb = TRAJETS["le Nid ⇄ le Fléau"] * CARB[v].conso * prixL(CARB[v]);
    const gain = w * GAIN_F * f, autres = carb + (cel || 0) * PRIX_ITEM.fab_cellule_d_energie.moy;
    return padg(`${pad(f0(gain - perdu * KIT_NID / KIT_PV - autres), 6)} kits | ${pad(f0(gain - perdu * CARCASSE_PV - autres), 6)} Carc.`, 27);
  });
  console.log(`   ${pad(f, 5)} | ` + cells.join(" | "));
}
console.log(`   Secours « coque à zéro » à Cérès : 200 ₡, remorqué au Nid avec 25 % de la coque — en kits, ces 25 % coûteraient :`
  + ["navette", "cargo", "maitre"].map(v => ` ${NOMV[v].split(" ")[0]} ${f0(Math.ceil(PV[v] * 0.25) * KIT_NID / KIT_PV)} ₡`).join(","));

/* ---------- 7. PROPOSITION (v2.79, à valider décision par décision) ----------
   Les réglages proposés sont dans PROP ; chacun se change en ligne de commande pour comparer :
     --nyx=600 --sel=1500   prix moyen des cristaux (minimum 0,5 ×, maximum 1,6 ×, comme aujourd'hui)
     --marge=0              le travail de l'artisan : ce pourcentage des ingrédients, 8 ₡ au moins (0 = 8 ₡ fixes, comme aujourd'hui : proposition retenue le 12/11)
     --brade=0.5            la brade paie cette part du prix moyen (aujourd'hui : la moitié du minimum = 0,35 × moyen)
     --patr=60              crédits moyens d'une patrouille gagnée (aujourd'hui 22 + Int ÷ 5)
     --gravier=2            jours de Gravier par semaine pour le régulier (pour l'assidu : le double ; l'occasionnel : 0) */
const PROP = { nyx:+(ARG("nyx") ?? PRIX_ITEM.cristal.moy), sel:+(ARG("sel") ?? PRIX_ITEM.selenite.moy), marge:+(ARG("marge") ?? 0), brade:+(ARG("brade") ?? 0.5),   // v2.79 : défauts = ce qui est DÉCIDÉ (K245 → K250)
               patr:+(ARG("patr") ?? SERVEUR.patrouilleCredits), gravier:+(ARG("gravier") ?? 2),
               bradeMin:ARG("brade-min") != null ? +ARG("brade-min") : (ARG("brade") != null ? null : 0.5), cristalMin:+(ARG("cristal-min") ?? 0.5),   // K249 : brade = la moitié du minimum
               sondeX:+(ARG("sonde-x") ?? 1), expeX:+(ARG("expe-x") ?? 1), fleauX:+(ARG("fleau-x") ?? 12), fleauSem:+(ARG("fleau-sem") ?? 2) };
/* Activités (K248) : --sonde-x (× les crédits des sondes), --expe-x (× les crédits des expéditions contre le Protocole),
   --fleau-x (le Fléau paie fleau-x × force), --fleau-sem (attaques du Fléau par semaine du régulier ; assidu le double). */
function prixPropose(){
  const memo = {};
  const moy = id => {
    if(id in memo) return memo[id];
    let v;
    if(id === "selenite") v = PROP.sel; else if(id === "cristal") v = PROP.nyx;
    else if(!RECETTES[id]) v = PRIX_ITEM[id] ? PRIX_ITEM[id].moy : 0;
    else { const ing = RECETTES[id].reduce((a, g) => a + g.qte * moy(g.id), 0); v = Math.round(ing + Math.max(TRAVAIL, PROP.marge * ing)); }
    return memo[id] = v;
  };
  const r = {};
  for(const id of Object.keys(PRIX_ITEM)){
    const m = moy(id);
    if(id === "cristal" || id === "selenite") r[id] = { min:Math.round(PROP.cristalMin * m), moy:m, max:Math.round(1.6 * m) };   // --cristal-min (aujourd'hui 0,5)
    else if(RECETTES[id]) r[id] = { min:Math.round(K_MIN * m), moy:m, max:Math.round(K_MAX * m) };
    else r[id] = { ...PRIX_ITEM[id] };
  }
  r.kit_reparation = { min:70, moy:100, max:140 };   // K246 : 150 ₡ au comptoir, le marché reste en dessous
  return r;
}
const PP = prixPropose();
// La brade proposée : --brade-min=0.8 → cette part du prix MINIMUM (toujours sous le minimum, K248) ; sinon --brade × moyen.
// Arrondi vers le bas, et toujours au moins 1 ₡ de moins que le minimum (règle de l'autrice, 12/11) ; 1 ₡ au moins.
const bradeP = id => Math.max(1, Math.min(PP[id].min - 1, Math.round(PROP.bradeMin != null ? PROP.bradeMin * PP[id].min : PROP.brade * PP[id].moy)));
const sortie = [];
sortie.push(`7. PROPOSITION — Nyx ${PROP.nyx} ₡, Sélénite ${PROP.sel} ₡, travail ${Math.round(PROP.marge * 100)} % (8 ₡ au moins), brade ${PROP.bradeMin != null ? PROP.bradeMin + " × minimum" : PROP.brade + " × moyen"}, patrouille ${PROP.patr} ₡`);
sortie.push("   objet | aujourd'hui min · moy · max | proposé min · moy · max | brade aujourd'hui → proposée");
const ordre = Object.keys(PRIX_ITEM).sort((a, b) => PRIX_ITEM[a].moy - PRIX_ITEM[b].moy);
for(const id of ordre){
  const a = PRIX_ITEM[id], n = PP[id];
  sortie.push(`   ${nomDe(id)} | ${f0(a.min)} · ${f0(a.moy)} · ${f0(a.max)} | ${f0(n.min)} · ${f0(n.moy)} · ${f0(n.max)} | ${f0(Math.max(1, Math.round(a.min / 2)))} → ${f0(bradeP(id))}`);
}
fs.writeFileSync("/tmp/proposition_prix.txt", sortie.join("\n") + "\n");
console.log(`\n7. PROPOSITION — détail des ${ordre.length} prix dans /tmp/proposition_prix.txt`);
// Les revenus après Q45, aujourd'hui et proposés (crédits par jour)
const minBradeP = mins.reduce((a, m) => a + m.poids * bradeP(m.id), 0) / poidsT;
const poolBradeP = pool.reduce((a, id) => a + bradeP(id), 0) / pool.length;
function revenu(P, prop){
  const j = P.jour, pw = (j.patrouille || 0) * 0.85;
  const cr = pw * (prop ? PROP.patr : SERVEUR.patrouilleCredits) + (j.sonde || 0) * SERVEUR.sonde + (P.expeditionTous ? 0.6 * SERVEUR.expedition / P.expeditionTous : 0);
  const br = (j.miner || 0) * LOT * (prop ? minBradeP : minBrade) + (j.recolte || 0) * RECOLTE.unites * (prop ? bradeP("sylve") : RECOLTE.brade)
           + pw * nbObj * (prop ? poolBradeP : poolBrade);
  const gjours = P.nom.startsWith("Assidu") ? 2 * PROP.gravier : (P.nom.startsWith("Régulier") ? PROP.gravier : 0);
  const nyx = gjours / 7 * 8 * 0.2;                                                     // Nyx par jour (Gravier)
  const gr = nyx * (prop ? bradeP("cristal") : PRIX_ITEM.cristal.min / 2);
  // le Fléau, en cargo, kits à 150 ₡ (K246), jours sourds et vifs (75 à 115) ; aujourd'hui : kits à 450 et 5 × force
  const fsem = P.nom.startsWith("Assidu") ? 2 * PROP.fleauSem : (P.nom.startsWith("Régulier") ? PROP.fleauSem : 0);
  const kitPV = KIT_NID / 40, gx = prop ? PROP.fleauX : 5;   // « proposé » = le Fléau à 12 × force (K248, migration à venir)
  const netF = [75, 85, 100, 115].reduce((acc, f) => { const [w, c] = FLEAU_SIM[f].cargo;
    return acc + w * gx * f - PV.cargo * (1 - c) * kitPV - TRAJETS["le Nid ⇄ le Fléau"] * J.VAISSEAUX.fab_vaisseau_cargo.conso * prixL(J.VAISSEAUX.fab_vaisseau_cargo); }, 0) / 4;
  const fl = fsem / 7 * netF;
  const crX = prop ? (j.sonde || 0) * SERVEUR.sonde * (PROP.sondeX - 1) + (P.expeditionTous ? 0.6 * SERVEUR.expedition * (PROP.expeX - 1) / P.expeditionTous : 0) : 0;
  const aig = (P.nom.startsWith("Occasionnel") ? 0.5 : 1) * 1.25 / 4;                   // l'aiguille : 1,25 cristal tous les 4 jours (après Q23)
  const ag = aig * (prop ? bradeP("selenite") : PRIX_ITEM.selenite.min / 2);
  return { cr:cr + crX, br, gr, ag, fl, netF, tot:cr + crX + br + gr + ag + fl };
}
console.log("   Ce qu'un joueur fait entrer chaque jour APRÈS Q45 (crédits + ce qu'il brade : production, butin, Nyx du Gravier, Sélénite de l'aiguille) :");
for(const P of Object.values(SIM.PROFILS)){
  const a = revenu(P, false), n = revenu(P, true);
  console.log(`     ${padg(P.nom, 24)} aujourd'hui ${pad(f0(a.tot), 5)} ₡ (crédits ${f0(a.cr)}, brade ${f0(a.br)}, Gravier ${f0(a.gr)}, aiguille ${f0(a.ag)}, Fléau ${f0(a.fl)})   proposé ${pad(f0(n.tot), 5)} ₡ (crédits ${f0(n.cr)}, brade ${f0(n.br)}, Gravier ${f0(n.gr)}, aiguille ${f0(n.ag)}, Fléau ${f0(n.fl)})`);
}
const reg = SIM.PROFILS.regulier, ra = revenu(reg, false).tot, rn = revenu(reg, true).tot;
console.log("   Combien de JOURS de ce revenu (régulier, après Q45) pour s'offrir :");
for(const id of ["fab_navette_legere", "fab_vaisseau_cargo", "fab_casque_lourd", "fab_implant_de_force", "fab_drone_de_recolte", "fab_vaisseau_maitre", "cristal", "selenite"])
  console.log(`     ${padg(nomDe(id), 22)} aujourd'hui ${pad(f0(PRIX_ITEM[id].moy), 6)} ₡ = ${pad((PRIX_ITEM[id].moy / ra).toFixed(0), 4)} j   (recalculé K245 : ${f0((NOUVEAU[id] || PRIX_ITEM[id]).moy)} ₡ = ${((NOUVEAU[id] || PRIX_ITEM[id]).moy / ra).toFixed(0)} j)   proposé ${pad(f0(PP[id].moy), 6)} ₡ = ${pad((PP[id].moy / rn).toFixed(0), 4)} j`);
