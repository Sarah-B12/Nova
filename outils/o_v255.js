// v2.55 — Réparateur répare enfin (K189) : le coût de réparation, avec et sans ro1.
// node o_banc.js .. v255
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  etat.terrain = etat.terrain || {}; etat.terrain.parcelles = etat.terrain.parcelles || [];
  etat.terrain.parcelles[0] = { type:"mine", stock:500, max:500 };
  etat.terrain.parcelles[1] = { type:"atelier" };
  INTEGRITE["0"] = 0; INTEGRITE["1"] = 40;
  const cout = () => [0, 1].map(p => { const c = coutReparation(p); return JSON.stringify(c.matieres) + " " + c.energie + "%"; });
  etat.aptitudes = { pris:[], pa:0, v:254 }; r.sans = cout();                      // mine {cendrite:8} 5 % ; atelier {cendrite:3, voltane:3} 5 %
  etat.aptitudes.pris = ["ro1"];             r.avec = cout();                      // mine {cendrite:6} 4 % ; atelier {cendrite:2, voltane:2} 4 % (comme le serveur, v272)
  r.texte = Object.values(APT_FACTIONS).flatMap(f => f.noeuds).find(n => n.id === "ro1").effet;
  return r;
})();
