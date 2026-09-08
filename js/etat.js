/* ===========================================================
   ETAT — État du joueur : création, helpers purs, sauvegarde et chargement (localStorage).
   =========================================================== */
function nouvelEtat(){
  return {
    inscrit:false, nom:"", faction:null, pos:null, metier:null, creeLe:Date.now(), enPause:false, pauseLe:0, factionLe:0, factionChangeBloque:true, email:"", apparenceLe:0, avatar:null, bienvenueVue:false, protocoleActif:true,
    energie:100, energieMaj:Date.now(), reposLe:0, regenMaj:0,
    /* ⚠ `credits` appartient au SERVEUR (colonne protégée, jamais poussée).
       Ce défaut n'est qu'un point de départ local : il était à 1000, si bien
       qu'un nouveau joueur voyait 1 000 ₡ juste après l'inscription puis 0 au
       rechargement, quand chargerDepuisServeur() écrasait la valeur. Le vrai
       montant de départ est le DEFAULT de la colonne profils.credits. */
    credits:0, niveau:1, xp:0, pointsCompetence:0, retours:0,
    competences:{ force:10, agilite:10, intelligence:10 },   // égales au départ : aucune voie de Cercle favorisée
    equipement:{ tete:null, torse:null, jambes:null, arme:null, arme2:null, drone:null, implant:null }, equipementDate:{},
    vaisseau:null, vaisseauDate:null, carburant:0, permisVaisseau:false, soute:{}, souteDate:{}, prisonJusqua:0, prisonFaction:null,
    /* ⚠ Défauts alignés sur ceux des COLONNES profils.o2/sante/moral (100 chacune).
       Ils valaient 90/100/80 : un nouveau joueur voyait 90 % d'O₂ et 80 % de moral
       à l'inscription, avant que chargerJaugesServeur() ne rétablisse les vrais 100.
       Les jauges appartiennent au serveur (jauges_lire / agir) — voir CLES_SERVEUR. */
    jauges:{ o2:100, sante:100, moral:100 },
    sac:{}, sacDate:{}, sacOrdre:[], coffre:{}, coffreDate:{}, maison:{ palier:0, plot:null, chantier:null }, terrain:{ parcelles: Array(N_PLOTS).fill(null) },
    description:"", mur:[], murOuvertA:"amis", journal:[], amis:[], bloques:[], msgRecus:[], msgEnvoyes:[], msgSemes:false, annonces:[],
    formation:null, pas:{}, pasFini:false, pasPlie:false,
    aptitudes:{ pa:0, pris:[] }, marches:{}, marchesSemes:false,
    quetes:{ done:[], active:null }
  };
}

/* ---------- Utilitaires ---------- */
function borne(v){ return Math.max(0, Math.min(MAX, v)); }
function alea(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function bonusCredits(){ return Math.floor(intelligenceEffective()/5); }
// Chance de « doubler une trouvaille » = Intelligence (jusqu'à ~20 % à 200) + Drone récupérateur (+15 %). Plafond 40 %.
function chanceDouble(){ return Math.min(0.40, intelligenceEffective()/1000 + (typeof equipDouble==="function" ? equipDouble() : 0)/100); }
// Compétences effectives = compétence de base + bonus d'équipement (helpers définis dans equipement.js).
// Moral à 0 (ou moins) : très grosse pénalité (−70 %) sur Force/Agilité/Intelligence — sans « mort ».
function penaliteMoral(){ return (etat.jauges && etat.jauges.moral <= 0) ? 0.30 : 1; }
function forceEffective(){ return Math.round((etat.competences.force + (typeof equipForce==="function" ? equipForce() : 0)) * penaliteMoral()); }
function agiliteEffective(){ return Math.round((etat.competences.agilite + (typeof equipAgi==="function" ? equipAgi() : 0)) * penaliteMoral()); }
function intelligenceEffective(){ return Math.round((etat.competences.intelligence + (typeof equipInt==="function" ? equipInt() : 0)) * penaliteMoral()); }
// Coût O₂ : l'Agilité réduit jusqu'à −50 % à 200 ; Poumons d'acier −1 ; l'équipement lourd rajoute du coût.
function coutO2(base){ const c = base * (1 - Math.min(0.5, agiliteEffective()/400)) + (typeof equipO2==="function"?equipO2():0); return Math.max(1, Math.round(c - aptO2Bonus())); }
function echapper(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function ageJours(){ return Math.floor((Date.now() - etat.creeLe) / MS_JOUR); }
/* ---------- Sauvegarde ---------- */
/* ⚠ localStorage NE DOIT PAS conserver les données du serveur (stocks, lots,
   `_lotsSynchro`, reflets d'équipement) : au rechargement, `charger()` les
   restaurait telles quelles et `majUsure` croyait les lots synchronisés alors
   qu'aucune réponse serveur n'était encore arrivée — il pouvait donc demander
   au serveur de périmer des lots périmés... dans la copie locale seulement.
   La liste vit dans `serveur.js` (CLES_SERVEUR) : une seule source. */
function _etatLocalPersistable(){
  if(typeof _etatSansStocks === "function") return _etatSansStocks();
  return etat;   // repli : serveur.js absent (ne devrait jamais arriver)
}
function sauvegarder(){ try{ localStorage.setItem(CLE, JSON.stringify(_etatLocalPersistable())); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "etat.js#1"); } if(typeof planifierSauveServeur==="function") planifierSauveServeur(); }
// Normalise un objet d'état (localStorage OU serveur) vers un état complet et cohérent.
function hydraterEtat(s){
  const base=nouvelEtat();
  const sac = {...(s.sac||{})};
  if(s.materiaux){ for(const k in s.materiaux){ if(s.materiaux[k]>0) sac[k]=(sac[k]||0)+s.materiaux[k]; } }
  /* ⚠ `sac` ne vient plus du localStorage : il arrive de sac_lire(). Tant qu'il est
     vide, on NE FILTRE PAS `sacOrdre` — sinon l'ordre choisi par le joueur au
     glisser-déposer serait effacé à chaque rechargement (le filtre le comparerait
     à un sac vide). Le tri est refait sur le vrai sac dans _appliquerEtatStocks(). */
  const sacConnu = Object.keys(sac).length > 0;
  let ordre = sacConnu ? (s.sacOrdre||[]).filter(id => (sac[id]||0)>0) : (s.sacOrdre||[]).slice();
  for(const id in sac){ if(sac[id]>0 && !ordre.includes(id)) ordre.push(id); }
  return { ...base, ...s,
    /* ⚠ Les sauvegardes existantes (localStorage ET `profils.donnees`) contiennent
       encore `_lotsSynchro:true` et une liste de lots figée : on les neutralise ici,
       sinon le correctif ne prendrait effet qu'après la première réécriture.
       Ces trois valeurs ne sont légitimes que si elles viennent de sac_lire(). */
    lots:[], _lotsSynchro:false, equipeServeur:{}, forceCombatServeur:undefined,
    competences:{...base.competences,...(s.competences||{})},
    /* ⚠ On ne restaure PAS s.jauges : o2/sante/moral sont des colonnes serveur,
       lues par chargerJaugesServeur() au démarrage. Une copie persistée
       s'affichait à sa place le temps de la requête. */
    jauges:{...base.jauges},
    sac, sacOrdre:ordre, coffre:{...(s.coffre||{})},
    soute:{...(s.soute||{})}, souteDate:{...(s.souteDate||{})},
    maison:{ palier:0, plot:null, chantier:null, ...(s.maison&&typeof s.maison.palier==="number" ? s.maison : {}) }, mur:(s.mur||[]),
    aptitudes:{...base.aptitudes, ...(s.aptitudes||{})},
    quetes:{ done:(s.quetes&&Array.isArray(s.quetes.done))?s.quetes.done:[], active:(s.quetes&&s.quetes.active)||null },
    terrain:{ parcelles: normaliserParcelles(s.terrain) },
    creeLe: s.creeLe || Date.now(),
    energie: (typeof s.energie==="number" ? s.energie : 100),
    energieMaj: s.energieMaj || Date.now() };
}
function charger(){
  try{ const brut=localStorage.getItem(CLE); if(brut) return hydraterEtat(JSON.parse(brut)); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "etat.js#2"); }
  return nouvelEtat();
}
function reinitialiser(){ if(!confirm("Effacer la partie locale et te déconnecter ?"))return; try{localStorage.removeItem(CLE);}catch(e){ if(typeof _catchLog==="function") _catchLog(e, "etat.js#3"); } if(typeof seDeconnecter==="function"){ seDeconnecter().finally(()=>location.reload()); } else { etat=nouvelEtat(); document.querySelector("#journal").innerHTML=""; afficher(); (typeof ouvrirAuth==="function"?ouvrirAuth:ouvrirInscription)(); } }

