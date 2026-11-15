// v3.05 (v307, K275) — les actions de terrain « chez soi » vérifiées par le serveur. Produit :
//   · `cas` : 600 situations (graine fixe) — faction, carte, position (centres, bords des cercles à ±1, au hasard) —
//     avec la réponse du JEU (surMonTerrain). Le banc SQL refait chaque cas avec `_terrain_chez_soi` : aucun écart permis ;
//   · `villes` : VILLES (js/data.js), à comparer à la table `villes` ;
//   · `refus` : le message du jeu quand le serveur répond « chez_soi » (terrainRpc, reparer_structure).
//   node outils/o_banc.js . chezsoi
(async function(){
  await new Promise(x => setTimeout(x, 300));
  let g = 20261117;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const F = Object.keys(VILLES), s0 = JSON.stringify({ f: etat.faction, s: etat.secteur, p: etat.pos });
  const cas = [];
  for(let i = 0; i < 600; i++){
    const fac = choix(F), sect = alea() < 0.85 ? "silene" : choix(["ecart","braise","ancolie","ceres","suaire"]);
    const v = VILLES[choix(F)], t = alea(), ang = alea() * 2 * Math.PI;
    let x, y;
    if(t < 0.25){ x = v.x; y = v.y; }
    else if(t < 0.6){ const r = v.r + choix([-1, 0, 1]); x = Math.round(v.x + r * Math.cos(ang)); y = Math.round(v.y + r * Math.sin(ang)); }
    else if(t < 0.7){ x = v.x + choix([-1, 1]) * (v.r + choix([-1, 0, 1])); y = v.y; }
    else { x = Math.round(alea() * 2400); y = Math.round(alea() * 1600); }
    etat.faction = fac; etat.secteur = sect; etat.pos = { x, y };
    cas.push({ i, faction: fac, secteur: sect, x, y, chez_soi: surMonTerrain() });
  }
  const s = JSON.parse(s0); etat.faction = s.f; etat.secteur = s.s; etat.pos = s.p;
  // le message affiché quand le serveur refuse « chez_soi »
  const vus = []; const jo = journal; journal = (t) => { vus.push(String(t)); };
  _terrainRefus({ ok: false, err: "chez_soi" });
  const src = typeof reparerStructure === "function" ? reparerStructure.toString() : ""; journal = jo;
  return { n: cas.length, chezSoi: cas.filter(c => c.chez_soi).length, refusTerrain: vus[0] || "",
           refusReparation: /err==="chez_soi"/.test(src), villes: Object.fromEntries(F.map(f => [f, [VILLES[f].x, VILLES[f].y, VILLES[f].r]])), cas };
})()
