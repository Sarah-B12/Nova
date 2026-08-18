/* ===========================================================
   USURE & VOL
   - Durée de vie des objets (en jours, plafond 30). Les denrées (plantes,
     nourriture, bio) périssent vite ; minerais et métal/tech tiennent ~30 j.
     Le plafond de 30 j garantit que le marché entre joueurs tourne (rien d'éternel).
   - Vulnérabilité au vol par objet (les vaisseaux sont quasi involables).
   Les objets du SAC périssent ; le coffre de la maison ne périt pas (à décider).
   =========================================================== */
const USURE_MAX = 30;   // jours

// Durée de vie par défaut selon la catégorie / le type
const DUREE_VIE_CAT = { plante:3, organique:6, minerai:30, animal:18, conso:8, fabrique:30, graine:10, bebe:15 };
// Exceptions par objet (denrées périssables, consommables, fabriqués « bio »)
const DUREE_VIE_ITEM = {
  sporelle:3, nectine:4, ferragave:5, sylve:6, proteines:4,          // matières
  o2:30, kit:18, ration:5,                                            // consommables boutique
  fab_biogel:8, fab_ration_chaude:5, fab_recharge_d_oxygene:20, fab_kit_de_soin:14, fab_boite_de_soin:10,
  fab_biocarburant:10, fab_biocarburant_raffine:12, fab_stimulant:8, fab_antidote:8,
  fab_tank_a_oxygene:22, fab_combinaison_pressurisee:22, fab_biofil_renforce:20
  // lingots, composants, armes, armures, implants, pièces et vaisseaux : 30 j (défaut)
};
function dureeVie(id){
  if(DUREE_VIE_ITEM[id]!=null) return Math.min(USURE_MAX, DUREE_VIE_ITEM[id]);
  const it=item(id); if(!it) return USURE_MAX;
  return Math.min(USURE_MAX, DUREE_VIE_CAT[it.cat] ?? DUREE_VIE_CAT[it.type] ?? USURE_MAX);
}
// Jours restants avant disparition d'une pile du sac (pour l'affichage). null si non suivi.
function joursRestants(id){
  if(!etat.sacDate || etat.sacDate[id]==null) return null;
  return Math.max(0, dureeVie(id) - (Date.now()-etat.sacDate[id])/JOUR_MS);
}

/* --- Vulnérabilité au vol : probabilité de base qu'un objet soit dérobé (0 = jamais). --- */
const VOL_CAT = { plante:0.5, organique:0.5, minerai:0.4, animal:0.4, conso:0.45, fabrique:0.3 };
function risqueVol(id){
  const it=item(id); if(!it) return 0.35;
  const n=(it.nom||"").toLowerCase();
  if(/vaisseau|cargo|navette/.test(n)) return 0.02;                                                  // vaisseaux : quasi involables
  if(n.includes("implant")) return 0.05;                                                             // dans le corps
  if(/casque|plastron|jambi|couteau|pistolet|lame|fusil|canon|drone|tourelle/.test(n)) return 0.15;  // équipement/pièces portées
  return VOL_CAT[it.cat] ?? VOL_CAT[it.type] ?? 0.35;                                                 // matières/consommables du sac
}

/* Reporte une date d'acquisition en gardant la plus ANCIENNE (empêche de « rafraîchir » un objet en le déplaçant). */
function reporterDate(map, id, ts){ if(ts==null) return; map[id] = (map[id]!=null) ? Math.min(map[id], ts) : ts; }
function _verbeUsure(it){ return (it && (it.cat==="plante" || it.cat==="organique" || it.type==="conso")) ? "a péri" : "s'est usé"; }

/* --- Péremption : sac, coffre de la maison ET équipement porté (au temps). --- */
function majUsure(){
  if(!etat.sac) return;
  etat.sacDate = etat.sacDate||{}; etat.coffreDate = etat.coffreDate||{}; etat.equipementDate = etat.equipementDate||{};
  const now = Date.now(); let perte = false;
  // Sac
  for(const id of Object.keys(etat.sac)){
    if((etat.sac[id]||0) <= 0) continue;
    if(etat.sacDate[id] == null){ etat.sacDate[id] = now; continue; }
    if(now - etat.sacDate[id] > dureeVie(id)*JOUR_MS){
      const nb = etat.sac[id], it = item(id);
      delete etat.sac[id]; delete etat.sacDate[id]; etat.sacOrdre = etat.sacOrdre.filter(x=>x!==id);
      journal(`${nb}× ${it?it.nom:id} ${_verbeUsure(it)} et a disparu du sac.`,"alerte"); perte = true;
    }
  }
  // Coffre de la maison (ne préserve pas)
  if(etat.coffre) for(const id of Object.keys(etat.coffre)){
    if((etat.coffre[id]||0) <= 0) continue;
    if(etat.coffreDate[id] == null){ etat.coffreDate[id] = now; continue; }
    if(now - etat.coffreDate[id] > dureeVie(id)*JOUR_MS){
      const nb = etat.coffre[id], it = item(id);
      delete etat.coffre[id]; delete etat.coffreDate[id];
      journal(`${nb}× ${it?it.nom:id} ${_verbeUsure(it)} (rangement de la maison).`,"alerte"); perte = true;
    }
  }
  // Équipement porté (s'use au temps aussi)
  if(etat.equipement) for(const slot of Object.keys(etat.equipement)){
    const id = etat.equipement[slot]; if(!id) continue;
    if(etat.equipementDate[slot] == null){ etat.equipementDate[slot] = now; continue; }
    if(now - etat.equipementDate[slot] > dureeVie(id)*JOUR_MS){
      const it = item(id);
      etat.equipement[slot] = null; delete etat.equipementDate[slot];
      journal(`${it?it.nom:id} s'est usé et a lâché.`,"alerte"); perte = true;
    }
  }
  if(perte && typeof sauvegarder==="function") sauvegarder();
}
