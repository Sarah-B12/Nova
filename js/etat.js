/* ===========================================================
   ETAT — État du joueur : création, helpers purs, sauvegarde et chargement (localStorage).
   =========================================================== */
function nouvelEtat(){
  return {
    inscrit:false, nom:"", faction:null, pos:null, metier:null, creeLe:Date.now(), enPause:false, pauseLe:0, factionLe:0, factionChangeBloque:true, email:"", apparenceLe:0, avatar:null, bienvenueVue:false, protocoleActif:true,
    energie:100, energieMaj:Date.now(), reposLe:0, regenMaj:0,
    credits:1000, niveau:1, xp:0, pointsCompetence:0, retours:0,
    competences:{ force:10, agilite:10, intelligence:10 },   // égales au départ : aucune voie de Cercle favorisée
    equipement:{ tete:null, torse:null, jambes:null, arme:null, arme2:null, drone:null, implant:null }, equipementDate:{},
    vaisseau:null, vaisseauDate:null, carburant:0, permisVaisseau:false, soute:{}, souteDate:{}, prisonJusqua:0, prisonFaction:null,
    jauges:{ o2:90, sante:100, moral:80 },
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
function reductionO2(){ return Math.floor(etat.competences.agilite/5); }   // (déprécié — voir coutO2)
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
function sauvegarder(){ try{ localStorage.setItem(CLE, JSON.stringify(etat)); }catch(e){} if(typeof planifierSauveServeur==="function") planifierSauveServeur(); }
// Normalise un objet d'état (localStorage OU serveur) vers un état complet et cohérent.
function hydraterEtat(s){
  const base=nouvelEtat();
  const sac = {...(s.sac||{})};
  if(s.materiaux){ for(const k in s.materiaux){ if(s.materiaux[k]>0) sac[k]=(sac[k]||0)+s.materiaux[k]; } }
  let ordre = (s.sacOrdre||[]).filter(id => (sac[id]||0)>0);
  for(const id in sac){ if(sac[id]>0 && !ordre.includes(id)) ordre.push(id); }
  return { ...base, ...s,
    competences:{...base.competences,...(s.competences||{})},
    jauges:{...base.jauges,...(s.jauges||{})},
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
  try{ const brut=localStorage.getItem(CLE); if(brut) return hydraterEtat(JSON.parse(brut)); }catch(e){}
  return nouvelEtat();
}
function reinitialiser(){ if(!confirm("Effacer la partie locale et te déconnecter ?"))return; try{localStorage.removeItem(CLE);}catch(e){} if(typeof seDeconnecter==="function"){ seDeconnecter().finally(()=>location.reload()); } else { etat=nouvelEtat(); document.querySelector("#journal").innerHTML=""; afficher(); (typeof ouvrirAuth==="function"?ouvrirAuth:ouvrirInscription)(); } }

