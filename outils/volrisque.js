// v1.22 — SOURCE du barème de vol. Régénère les lignes de la table serveur
// `vol_risque` (v122_vol_reel.sql, BACKEND_PLAN §38) :
//   node outils/banc.js . volrisque
// Sortie : [item_id, risque, lot_max] pour chaque objet connu, vaisseaux et
// navettes exclus (ils ne se volent pas). ⚠ Changer un chiffre ici, c'est
// changer la table : recoller le bloc `insert into public.vol_risque`.
(function(){
  /* --- Vulnérabilité au vol : probabilité de base qu'un objet soit dérobé (0 = jamais). --- */
  const VOL_CAT = { plante:0.5, organique:0.5, minerai:0.4, animal:0.4, conso:0.45, fabrique:0.3 };
  function risqueVol(id){
    const it=item(id); if(!it) return 0.35;
    const n=(it.nom||"").toLowerCase();
    if(/vaisseau|cargo|navette/.test(n)) return 0.02;                                                  // vaisseaux : quasi involables
    if(n.includes("implant")) return 0.05;                                                             // dans le corps
    if(/casque|plastron|jambi|couteau|pistolet|lame|fusil|canon|drone|tourelle/.test(n)) return 0.15;  // équipement/pièces portées
    return (VOL_CAT[it.cat] ?? VOL_CAT[it.type] ?? 0.35) * _facteurValeurVol(id);                       // matières/consommables du sac
  }
  
  /* Un objet cher est mieux gardé, mieux planqué, plus lourd à sortir d'une poche.
     Sans ce facteur, une pièce à 600 ₡ se volait aussi facilement qu'un caillou :
     la catégorie seule ne distinguait pas un Composant avancé d'un objet à 40 ₡.
     Courbe en racine carrée autour d'un prix de référence, bornée pour qu'aucun
     objet ne devienne ni impossible ni gratuit. */
  const VOL_PRIX_REF = 60;      // prix « ordinaire » : facteur 1
  function _facteurValeurVol(id){
    const p = (typeof PRIX_ITEM !== "undefined") ? PRIX_ITEM[id] : null;
    const prix = p ? (p.moy || p.min || 0) : 0;
    if(!prix) return 1;
    return Math.max(0.25, Math.min(1.5, Math.sqrt(VOL_PRIX_REF / prix)));
  }
  /* Combien d'unités partent d'un coup : au-delà d'un certain prix, une seule. */
  function _lotVolable(id, dispo){
    const p = (typeof PRIX_ITEM !== "undefined") ? PRIX_ITEM[id] : null;
    const prix = p ? (p.moy || p.min || 0) : 0;
    const max = prix >= 200 ? 1 : (prix >= 80 ? 2 : 3);
    return Math.min(dispo, 1 + Math.floor(Math.random() * max));
  }
  
  const ids = new Set(); (TOUS_ITEMS||[]).forEach(i=>i&&i.id&&ids.add(i.id));
  Object.keys(PRIX_ITEM||{}).forEach(k=>ids.add(k));
  const out = [];
  ids.forEach(id=>{
    if(/vaisseau|navette/.test(id)) return;
    const p = PRIX_ITEM[id]; const prix = p ? (p.moy||p.min||0) : 0;
    out.push([id, Math.round(risqueVol(id)*10000)/10000, prix>=200 ? 1 : (prix>=80 ? 2 : 3)]);
  });
  out.sort((a,b)=>a[0]<b[0]?-1:1);
  return { n: out.length, sql: out.map(([i,r,l])=>`  ('${i}', ${r}, ${l})`).join(",\n") };
})()
