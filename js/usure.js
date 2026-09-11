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
  // (o2 / kit / ration boutique retirés — remplacés par les fab_ Biotech)
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
// Jours restants avant disparition (affichage du badge « Xj »).
// On prend le lot le PLUS ANCIEN : c'est lui qui partira en premier, et c'est
// aussi lui que les retraits consomment d'abord (FIFO).
function joursRestants(id, lieu){
  if(typeof joursRestantsLot === "function"){
    const j = joursRestantsLot(id, lieu||"sac");
    if(j != null) return j;
  }
  return null;
}

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

/* Reporte une date d'acquisition en gardant la plus ANCIENNE (empêche de « rafraîchir » un objet en le déplaçant). */
function reporterDate(map, id, ts){ if(ts==null) return; map[id] = (map[id]!=null) ? Math.min(map[id], ts) : ts; }
function _verbeUsure(it){ return (it && (it.cat==="plante" || it.cat==="organique" || it.type==="conso")) ? "a péri" : "s'est usé"; }

/* --- Péremption : sac, coffre de la maison ET équipement porté (au temps). --- */
/* ⚠ PHASE 4 : sac / coffre / soute appartiennent au SERVEUR. On ne supprime
   plus rien localement (ce serait écrasé au prochain appel) : on collecte ce
   qui a péri et on demande au serveur de le retirer via la RPC perimer().
   Les dates restent client (donnees) — un tricheur peut donc éviter la
   péremption, mais pas créer d'objets. À durcir avec la Phase 4 stricte. */
/* ⚠ v0.59 — ÉQUIPEMENT USÉ = FANTÔME. L'objet n'était retiré qu'en LOCAL : il
   restait dans `inventaire` (lieu equipe) côté serveur, comptait toujours dans
   force_combat_serveur (expéditions) et occupait une place d'équipement.
   On le détruit désormais côté serveur avant de l'effacer ici. */
async function _detruireEquipeServeur(id){
  if(typeof sb === "undefined" || !sb) return true;
  const lots = (etat.lots||[]).filter(l => l && l.lieu==="equipe" && l.item===id && l.qte>0)
                              .sort((a,b) => a.acquis - b.acquis);
  if(!lots.length) return true;                    // le serveur ne le porte pas : rien à faire
  try{
    if(lots[0].qte === 1){
      const { data, error } = await sb.rpc("perimer", { p_lots:[{ item:id, lieu:"equipe", acquis:lots[0].acquis }] });
      if(error || !data || !data.ok || data.gele) return false;
      _appliquerEtatStocks(data.etat); return true;
    }
    // Lot de plusieurs exemplaires (deux armes identiques) : perimer() effacerait
    // tout le lot. On en redescend UN au sac, puis on le retire.
    if(!await rangerServeur(id, 1, "sac", "equipe")) return false;
    return !!await agirServeur({ retirer:{ [id]:1 }, motif:"usure_equipement" });
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "usure.js#equipe"); return false; }
}
async function majUsure(){
  etat.equipementDate = etat.equipementDate||{};
  const now = Date.now(); let perte = false;

  /* PHASE 4 — les stocks sont des LOTS détenus par le serveur.
     Le client ne tient plus de dates : il lit etat.lots, repère ceux qui ont
     dépassé leur durée de vie, et demande au serveur de les retirer.
     Chaque lot vieillit pour son propre compte : ajouter du frais ne condamne
     plus l'ancien, et l'ancien ne condamne plus le frais. */
  // ⚠ Tant que les lots n'ont pas été chargés depuis le serveur, on ne périme RIEN.
  // Sinon, au rechargement, une liste périmée ferait supprimer des lots bien vivants.
  if(!etat._lotsSynchro){ if(perte && typeof sauvegarder=="function") sauvegarder(); return; }

  // ⚠ EN PAUSE : on ne périme RIEN non plus. Les dates ne sont dégelées qu'à la
  // SORTIE de pause ; d'ici là elles paraissent dépassées. Un joueur pausé qui se
  // connecte pour voir son écran déclenche afficher() donc majUsure, et aurait
  // fait détruire des objets parfaitement vivants.
  if(etat.enPause){ if(perte && typeof sauvegarder=="function") sauvegarder(); return; }
  const expires = [];
  for(const l of (etat.lots||[])){
    if(!l || !(l.qte > 0)) continue;
    if(l.lieu === "equipe") continue;   // l'équipement porté s'use à part (etat.equipementDate)
    const dv = (typeof dureeVie==="function") ? dureeVie(l.item) : null;
    if(dv == null) continue;
    if(now - l.acquis > dv * JOUR_MS){
      const it = (typeof item==="function") ? item(l.item) : null;
      const ou = l.lieu==="coffre" ? " (rangement de la maison)" : (l.lieu==="soute" ? " (soute du vaisseau)" : " et a disparu du sac");
      // ⚠ Le message n'est PAS écrit ici : on l'écrira seulement si le serveur
      // confirme la suppression. Sinon le joueur lisait un deuil qui n'avait
      // pas eu lieu — et le relisait à CHAQUE connexion, en doublons.
      expires.push({ item:l.item, lieu:l.lieu, acquis:l.acquis,
                     _msg:`${l.qte}× ${it?it.nom:l.item} ${_verbeUsure(it)}${ou}.` });
    }
  }
  if(expires.length && typeof sb !== "undefined"){
    // On envoie sans le champ d'affichage : le serveur n'en a que faire.
    const lots = expires.map(x=>({ item:x.item, lieu:x.lieu, acquis:x.acquis }));
    try{
      const { data, error } = await sb.rpc("perimer", { p_lots: lots });
      if(error){
        // Ne PAS avaler l'erreur : une conversion de date ratée avait fait
        // échouer TOUTE péremption en silence pendant des heures de test.
        console.error("[perimer] échec :", error.message, lots);
      } else if(data && data.ok){
        if(data.gele){
          console.warn("[perimer] stock gelé (pause) — rien supprimé.");
        } else if((data.lots || 0) > 0){
          // Confirmé par le serveur : maintenant seulement, on informe.
          expires.forEach(x => journal(x._msg, "alerte"));
          perte = true;
        }
        if(typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(data.etat);
      }
    }catch(e){ console.error("[perimer] exception :", e); }
  }

  // Drones installés dans un hangar : ils ont quitté le sac, donc rien ne les
  // usait. Ils vieillissent depuis leur date de pose, comme l'équipement porté.
  if(etat.terrain && Array.isArray(etat.terrain.parcelles)){
    for(const p of etat.terrain.parcelles){
      if(!p || p.type!=="hangar" || !Array.isArray(p.drones)) continue;
      p.drones.forEach((dr, si)=>{
        if(!dr) return;
        if(dr.pose == null){ dr.pose = now; return; }          // ancien drone : on le date maintenant
        const did = (typeof DRONE_ITEMS!=="undefined") ? DRONE_ITEMS[dr.type] : null;
        if(!did) return;
        if(now - dr.pose > dureeVie(did)*JOUR_MS){
          const it = item(did);
          p.drones[si] = null;
          journal(`${it?it.nom:"Un drone"} s'est usé et a cessé de fonctionner.`,"alerte"); perte = true;
        }
      });
    }
  }

  // Équipement porté (s'use au temps aussi)
  if(etat.equipement) for(const slot of Object.keys(etat.equipement)){
    const id = etat.equipement[slot]; if(!id) continue;
    if(etat.equipementDate[slot] == null){ etat.equipementDate[slot] = now; continue; }
    if(now - etat.equipementDate[slot] > dureeVie(id)*JOUR_MS){
      const it = item(id);
      if(!await _detruireEquipeServeur(id)) continue;   // échec : on réessaiera au prochain passage
      etat.equipement[slot] = null; delete etat.equipementDate[slot];
      journal(`${it?it.nom:id} s'est usé et a lâché.`,"alerte"); perte = true;
    }
  }
  // Vaisseau équipé (la coque s'use aussi : sinon la formation Constructeur ne sert qu'une fois)
  if(etat.vaisseau){
    if(etat.vaisseauDate == null){ etat.vaisseauDate = now; }
    else if(now - etat.vaisseauDate > dureeVie(etat.vaisseau)*JOUR_MS){
      const it = item(etat.vaisseau);
      // La soute part avec le vaisseau : on rapatrie ce qui tient, le reste est perdu.
      for(const sid of Object.keys(etat.soute||{})){
        const q = etat.soute[sid]||0; if(q<=0) continue;
        const tient = Math.max(0, Math.min(q, placesLibres()));
        if(tient > 0) await rangerServeur(sid, tient, "sac", "soute");
      }
      const restants = (etat.lots||[]).filter(l => l.lieu==="soute" && l.qte>0)
        .map(l => ({ item:l.item, lieu:"soute", acquis:l.acquis }));
      if(restants.length && typeof sb !== "undefined"){
        try{ const { data } = await sb.rpc("perimer", { p_lots: restants });
             if(data && data.ok) _appliquerEtatStocks(data.etat); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "usure.js#1"); }
      }
      etat.vaisseau = null; etat.vaisseauDate = null;
      journal(`${it?it.nom:"Ton vaisseau"} s'est usé et a rendu l'âme. Soute vidée dans le sac (ce qui tenait).`,"alerte"); perte = true;
    }
  }
  if(perte && typeof sauvegarder=="function") sauvegarder();
}
