// v2.88 (v290, K261) — SOURCE des recettes serveur (`_fab_recettes()`, sql/v290_fabrication.sql,
// BACKEND_PLAN §190) : pour chaque recette de FORMATIONS (js/formations.js), clé « formation:seuil » →
//   p : objet produit · i : ingrédients DANS L'ORDRE [id, quantité, 1 si matière première] (l'ordre compte :
//   Maître-artisan et Récup d'atelier prennent le PREMIER des plus gros lots, comme fabriquer()) ·
//   x : XP d'atelier (xpAtelier) · v : 1 si c'est un vaisseau (permis exigé).
// Une recette dont un ingrédient est inconnu (« intermédiaire d'un autre métier ») n'est pas fabricable : absente.
//   node outils/o_banc.js . recettes
// ⚠ Changer une recette, un seuil, un niveau requis ou un prix de cristal dans le jeu, c'est changer le
// serveur (barème dupliqué, §6) : relancer, comparer `jsonb` avec la fonction en base, passer une migration.
(function(){
  const R = {}; let total = 0, exclues = [];
  for(const cle of Object.keys(FORMATIONS).sort()){
    for(const [seuil, nom, ingTxt] of FORMATIONS[cle].recettes){
      total++;
      const ings = parseIngredients(ingTxt);
      if(ings.some(g => g.id === null)){ exclues.push(cle + ":" + seuil); continue; }
      const p = PROD_PAR_NOM[normNom(nom)];
      const o = { p: p.id, i: ings.map(g => [g.id, g.qte, (item(g.id) && item(g.id).type === "matiere") ? 1 : 0]) };
      const x = xpAtelier(nom); if(x > 0) o.x = x;
      if(typeof estVaisseau === "function" && estVaisseau(p.id)) o.v = 1;
      R[cle + ":" + seuil] = o;
    }
  }
  const cles = Object.keys(R).sort();
  const trie = {}; for(const k of cles) trie[k] = R[k];
  return { recettes: total, fabricables: cles.length, exclues, avecXp: cles.filter(k => R[k].x).length,
           vaisseaux: cles.filter(k => R[k].v), jsonb: JSON.stringify(trie) };
})()
