(async function(){ await new Promise(x=>setTimeout(x,1500)); const r={};
  const f0 = etat.faction;
  for(const f of ["ignis","cultivateurs","toundra","rouage","nomades"]){ etat.faction=f; r[f]=[nomPalier(1), nomPalier(5), imgMaison(1), cheminMaisonRepli(f,1)].join(" | "); }
  etat.faction=f0; return r; })();
