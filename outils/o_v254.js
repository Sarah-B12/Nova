// v2.54 — la voie de la Toundra remaniée (K188) : ordre, coûts, migration des PA, Cœur de givre.
// node o_banc.js .. v254
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  const voie = APT_FACTIONS.toundra.noeuds;
  r.ordre = voie.map((n, i) => `${n.id}:${aptCout(i)}`).join(" ");                              // to1:1 to3:1 to4:1 to5:2
  r.trempe = aptToutesChaines().some(c => c.noeuds.some(n => n.id === "to2"));                  // false
  // Migration : chaque ancienne voie possible (préfixes de to1, to2, to3, to4), plus un joueur d'une autre faction
  const migre = (pris, pa) => { const e = { pris: pris.slice(), pa, v: 125 }; _aptMigrer(e); return `${e.pris.join(",")}|pa ${e.pa}|v ${e.v}`; };
  r.migration = [
    migre(["to1"], 0),                          // to1|pa 0
    migre(["to1","to2"], 0),                    // to1|pa 1
    migre(["to1","to2","to3"], 0),              // to1,to3|pa 1
    migre(["to1","to2","to3","to4"], 0),        // to1,to3,to4|pa 2  (5 PA payés = 3 gardés + 2 rendus)
    migre(["sv1","sv3","ig1"], 1),              // inchangé, pa 1
  ];
  const e2 = { pris:["to1","to3"], pa:0, v:254 }; _aptMigrer(e2); r.dejaMigre = e2.pris.join(",");   // to1,to3 (rien ne repasse)
  // Cœur de givre : 3 jours au lieu de 4, et l'aiguille avance d'autant
  etat.aptitudes = { pris:[], pa:0, v:254 };
  etat.seleniteConnue = true; etat.selenite = { debut: Date.now() - 3 * _selJour(), gels:0 };
  const sans = [_selPousseJ(), Math.round(selenitePousse() * 100), seleniteMure()];
  etat.aptitudes.pris = ["to1","to3","to4","to5"];
  const avec = [_selPousseJ(), Math.round(selenitePousse() * 100), seleniteMure()];
  r.givre = { sans, avec };                                                                    // sans [4, 75, false] ; avec [3, 100, true]
  r.texte = voie[3].nom + " : " + voie[3].effet;
  r.metabolisme = (() => { etat.aptitudes.pris = ["sv1","sv3"]; return aptCombatDegats(20); })();     // 15 (Trempe ne compte plus)
  return r;
})();
