// v2.87 (v289, K260) — SOURCE du catalogue serveur de la Boutique (`_boutique_catalogue()`,
// sql/v289_boutique.sql, BACKEND_PLAN §189) : comptoir des cités (BOUTIQUE, aussi la boutique
// mobile à +10 %), Perchoir (BASE_BOUTIQUE sans les `nidSeul`), Nid (NID_ARTICLES).
//   node outils/o_banc.js . boutique
// Sortie : le catalogue et le bloc jsonb à recoller dans la migration. ⚠ Changer un prix ou un
// article dans js/data.js ou js/boutique.js, c'est changer le serveur (barème dupliqué, §6) :
// relancer, comparer `jsonb` avec la fonction en base, et passer une migration si ça diffère.
(function(){
  const nid = _surNidBoutique, base = _surBaseBoutique;
  const lire = (n, b) => { _surNidBoutique = () => n; _surBaseBoutique = () => b;
    const o = {}; for(const a of _catalogueBoutique()) o[a.id] = a.prix; return o; };
  const cat = { cite: lire(false, false), perchoir: lire(false, true), nid: lire(true, false) };
  _surNidBoutique = nid; _surBaseBoutique = base;
  const tous = new Set([].concat(...Object.values(cat).map(Object.keys)));
  cat.permis = [...tous].filter(id => typeof estVaisseau === "function" && estVaisseau(id)).sort();
  const trie = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
  const c = { cite: trie(cat.cite), nid: trie(cat.nid), perchoir: trie(cat.perchoir), permis: cat.permis };
  return { articles: { cite: Object.keys(c.cite).length, perchoir: Object.keys(c.perchoir).length, nid: Object.keys(c.nid).length },
           catalogue: c, jsonb: JSON.stringify(c) };
})()
