(function(){
  const r = {};
  // 1. normaliserParcelles : types connus, inconnu, ancien nom `structures`
  const cas = [
    { parcelles: [{type:"mine"},{type:"mine",stock:3,max:9,x:1},{type:"biodome",cases:[1,null,{a:1},4,5]},{type:"enclos"},
                  {type:"atelier",n:1},{type:"maison",p:2},{type:"hangar",drones:[{t:1},null,{t:3}]},{type:"serre"},{type:"__proto__"},{type:"toString"},null,"x"] },
    { structures: [{type:"atelier"}] }, null, {}, { parcelles:"pas un tableau" }
  ];
  r.parcelles = cas.map(c => JSON.stringify(normaliserParcelles(c).slice(0,12)));
  // 2. placementExport : l'export relu redonne exactement le tableau
  const txt = placementExport();
  const relu = (new Function(txt.replace("const ESPACE_LIEUX", "var X") + "; return X;"))();
  const trie = o => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v);
  r.exportIdentique = trie(relu) === trie(ESPACE_LIEUX);   // l'ordre des clés peut changer, pas le contenu
  r.exportNb = relu.length;
  // 3. hydraterEtat : champ inconnu de terrain gardé, `structures` retiré, prison et transitoires neutralisés, registre gardé
  const h = hydraterEtat({ inscrit:true, terrain:{ parcelles:[{type:"mine"}], structures:[1], futurChamp:42 }, prisonJusqua:9e15, prisonFaction:"x",
                           _pauseResteMin:5, _aRoleGouv:true, _pauseCumulApplique:77, quetes:{done:["q1"],active:"q2",verrous:{q2:1}} });
  r.hydrate = { futur: h.terrain.futurChamp, structuresDansJSON: "structures" in JSON.parse(JSON.stringify(h.terrain)), n: h.terrain.parcelles.length,
                prison: [h.prisonJusqua, h.prisonFaction], reste: h._pauseResteMin, role: h._aRoleGouv, cumul: h._pauseCumulApplique, quetes: h.quetes };
  // 4. _etatSansStocks : rien de serveur ni de transitoire ne part dans donnees
  etat.prisonJusqua = 5; etat._jourReelMs = 1; etat._sacEchec = false;
  const c = _etatSansStocks();
  r.sansStocks = ["sac","jauges","xp","prisonJusqua","prisonFaction","_jourReelMs","_sacEchec","_pauseResteMin","_aRoleGouv"].filter(k => k in c);
  r.garde = ["_pauseCumulApplique","terrain","quetes","niveauCredite"].filter(k => k in c);
  // 5. _pjm : jour réel (valeur annoncée par le serveur)
  etat._jourReelMs = 86400000; r.pjm = _pjm();
  return r;
})()
