/* ===========================================================
   BOOTSTRAP — Initialisation de l'état, câblage des événements et démarrage.
   Chargé en dernier : toutes les données et fonctions sont déjà définies.
   =========================================================== */
let etat = charger();

/* ---------- Onglets ---------- */
document.querySelectorAll(".onglet").forEach(o => o.addEventListener("click", () => {
  document.querySelectorAll(".onglet").forEach(x=>x.classList.toggle("actif", x===o));
  document.querySelectorAll(".panneau").forEach(p=>p.classList.toggle("actif", p.dataset.panneau===o.dataset.onglet));
  if(o.dataset.onglet==="parametres" && typeof majParametres==="function") majParametres();
  if(o.dataset.onglet==="comm" && typeof changerComm==="function") changerComm(typeof commVue!=="undefined"?commVue:"amis");
}));

/* ---------- Câblage ---------- */
const ACTIONS={ reposer, explorer };
document.querySelectorAll("button.action[data-action]").forEach(b => b.addEventListener("click", ()=>{
  const r = raisonAction(b.dataset.action);
  if(r){ journal(r, "alerte"); return; }
  ACTIONS[b.dataset.action]();
}));
// Les boutons « Sauvegarder » et « Réinitialiser » ont été retirés :
// la sauvegarde est automatique, et la réinitialisation effaçait la partie.
document.querySelector("#ouvrir-carte").addEventListener("click", ouvrirCarte);
const _bOrb=document.querySelector("#ouvrir-orbite");
if(_bOrb) _bOrb.addEventListener("click", ouvrirOrbite);
const _bOrbF=document.querySelector("#orbite-fermer");
if(_bOrbF) _bOrbF.addEventListener("click", fermerOrbite);
document.querySelector("#carte-fermer").addEventListener("click", fermerCarte);
document.querySelectorAll(".hub-lien").forEach(b => b.addEventListener("click", ()=>changerHub(b.dataset.hub)));
document.querySelectorAll("#hub-centre .sous-lien").forEach(b => b.addEventListener("click", ()=>changerCentre(b.dataset.centre)));
document.querySelectorAll(".sous-lien").forEach(b => b.addEventListener("click", ()=>{
  document.querySelectorAll(".sous-lien").forEach(x=>x.classList.toggle("actif", x===b));
  document.querySelector("#sous-maison").hidden = b.dataset.sous!=="maison";
  document.querySelector("#sous-recolte").hidden = b.dataset.sous!=="recolte";
  if(b.dataset.sous==="recolte") majRecolte();
  if(b.dataset.sous==="maison") majMaison();
}));
document.querySelector("#modale-carte").addEventListener("click", e => { if(e.target.id==="modale-carte") fermerCarte(); });
document.querySelector("#struct-fermer").addEventListener("click", fermerStruct);
document.querySelector("#struct-demolir").addEventListener("click", ()=>{ if(structSel!=null) demolir(structSel); });
document.querySelector("#modale-struct").addEventListener("click", e => { if(e.target.id==="modale-struct") fermerStruct(); });
document.addEventListener("keydown", e => { if(e.key==="Escape"){ fermerCarte(); fermerStruct(); } });
document.querySelector("#desc-editer").addEventListener("click", () => { const ed=document.querySelector("#desc-edition"); ed.hidden=!ed.hidden; if(!ed.hidden) document.querySelector("#desc-champ").value=etat.description; });
document.querySelector("#desc-enregistrer").addEventListener("click", () => { etat.description=document.querySelector("#desc-champ").value; document.querySelector("#desc-edition").hidden=true; afficher(); sauvegarder(); journal("Description mise à jour."); });
document.querySelector("#mur-publier").addEventListener("click", publierMur);
document.querySelector("#mur-champ").addEventListener("keydown", e => { if(e.key==="Enter" && (e.ctrlKey||e.metaKey)) publierMur(); });
if(typeof _brancherCompteurMur==="function") _brancherCompteurMur("#mur-champ","#mur-compte",500);
if(typeof _remplirBarreMur==="function"){ _remplirBarreMur("#mur-outils"); _brancherOutilsMur("#mur-champ","#mur-outils"); }
document.querySelector("#mur-visibilite").addEventListener("change", e => { etat.murOuvertA=e.target.value; sauvegarder(); });
document.querySelector("#auth-valider").addEventListener("click", validerAuth);
document.querySelector("#auth-tab-c").addEventListener("click", ()=>basculerAuth("connexion"));
document.querySelector("#auth-tab-i").addEventListener("click", ()=>basculerAuth("inscription"));
const _ma=document.querySelector("#modale-auth"); if(_ma) _ma.addEventListener("click", e=>{ if(e.target===_ma) fermerAuth(); });
const _bdeco=document.querySelector("#btn-deco"); if(_bdeco) _bdeco.addEventListener("click", deconnexion);
const _voir=document.querySelector("#auth-voir"); if(_voir) _voir.addEventListener("change", e=>{ const t=e.target.checked?"text":"password"; ["#auth-mdp","#auth-mdp2"].forEach(s=>{ const el=document.querySelector(s); if(el) el.type=t; }); });
document.querySelector("#bienvenue-ok").addEventListener("click", fermerBienvenue);
document.querySelectorAll(".comm-lien").forEach(b => b.addEventListener("click", () => changerComm(b.dataset.comm)));
document.querySelector("#auth-mdp").addEventListener("keydown", e => { if(e.key==="Enter") validerAuth(); });

/* ---------- Démarrage ---------- */
construireCompetences(); construireCarte();
(async function demarrer(){
  if(SERVEUR_DISPO){
    const session = await sessionActuelle();
    if(session){
      const prof = await chargerDepuisServeur();
      if(prof && prof.donnees && prof.donnees.inscrit){ etat = hydraterEtat(prof.donnees); if(typeof prof.credits==="number"){ etat.credits=prof.credits; if(typeof initCredits==="function") initCredits(prof.credits); } if(typeof prof.reputation==="number") etat.reputation=prof.reputation; etat.roleAdmin=prof.role_admin||null; etat.cercles=prof.cercles||{}; etat.avatar=prof.avatar||null; if(prof.faction) etat.faction=prof.faction; /* COLONNES : le client ne les pousse plus, il DOIT les relire ici */ afficher(); journal("Systèmes en ligne. Surveille ton énergie."); if(typeof compterNotifs==="function") compterNotifs(); if(typeof compterPoste==="function") compterPoste(); if(typeof compterAnnonce==="function") compterAnnonce(); if(typeof syncPrison==="function") syncPrison(); if(typeof syncEffetsCombat==="function") syncEffetsCombat(); if(!etat.avatar && typeof ouvrirAvatar==="function") ouvrirAvatar({obligatoire:true}); /* rattrapage : inscription interrompue avant le choix */ }
      else { etat = nouvelEtat(); afficher(); ouvrirEntree(); }
    } else { etat = nouvelEtat(); afficher(); ouvrirEntree(); }
  } else {
    afficher();
    if(!etat.inscrit) ouvrirEntree(); else journal("Mode local (serveur indisponible).","alerte");
  }
})();
// Vrai si le joueur est en train de saisir : on ne redessine pas sous ses doigts.
function _saisieEnCours(){
  const a=document.activeElement; if(!a) return false;
  const t=(a.tagName||"").toUpperCase();
  return t==="INPUT" || t==="TEXTAREA" || t==="SELECT" || a.isContentEditable===true;
}
// Rafraîchit l'affichage de l'énergie qui remonte avec le temps (ne consomme rien).
setInterval(() => { if (etat.inscrit) majJaugesSeules(); }, 60000);
setInterval(() => { if(etat.inscrit && typeof compterNotifs==="function") compterNotifs(); }, 60000);
setInterval(() => { if(etat.inscrit && typeof pousserCredits==="function") pousserCredits(); }, 60000);
setInterval(() => { if(etat.inscrit && typeof compterPoste==="function") compterPoste(); }, 60000);
setInterval(() => { if(etat.inscrit && typeof compterAnnonce==="function") compterAnnonce(); }, 60000);
setInterval(() => { if(etat.inscrit && typeof syncPrison==="function") syncPrison(); }, 60000);
setInterval(() => { if(etat.inscrit && typeof syncEffetsCombat==="function") syncEffetsCombat(); }, 60000);
/* v0.66 — le sac ne se relisait qu'au CHARGEMENT : un objet offert par la
   console du staff, ou tout ajout venu du serveur, n'apparaissait qu'après un
   rafraîchissement manuel. On relit périodiquement (sac_lire est peu coûteux),
   et dès que l'onglet revient au premier plan. */
setInterval(() => { if(etat.inscrit && typeof chargerStocksServeur==="function") chargerStocksServeur(); }, 60000);
document.addEventListener("visibilitychange", ()=>{
  if(document.hidden || !etat.inscrit) return;
  if(typeof chargerStocksServeur==="function") chargerStocksServeur();
  if(typeof rechargerCredits==="function")     rechargerCredits();
});
/* Phase 4 : stocks, jauges, pause et mort appartiennent au serveur.
   ⚠ Ce bloc ne tournait qu'au CHARGEMENT DE LA PAGE, et sortait aussitôt si
   le joueur n'était pas encore connecté (`etat.inscrit` faux). Quand on se
   connectait ensuite sans recharger, plus personne ne les chargeait : sac
   vide, et jauges restées aux DÉFAUTS CLIENT (100/100/100) alors que le
   serveur pouvait en compter 20. D'où « le sac disparaît, sauf si je fais un
   refresh ». La synchronisation est donc une fonction, appelée ici ET après
   chaque connexion ou inscription (navigation.js). */
async function syncApresConnexion(){
  if(!etat.inscrit) return;
  const t = [];
  if(typeof chargerStocksServeur==="function") t.push(chargerStocksServeur());
  if(typeof chargerJaugesServeur==="function") t.push(chargerJaugesServeur());   // jauges serveur
  if(typeof _syncPause==="function") t.push(_syncPause());                        // état de pause serveur
  if(typeof syncMort==="function")   t.push(syncMort());                          // couloir de la mort
  /* ⚠ v0.63 — les comptes rendus déposés par le serveur pendant l'absence
     (colis reçus, ventes, expéditions…) n'étaient relevés que par la minuterie
     de 60 s, ou en ouvrant Le Centre. Qui rouvrait le jeu 2 min et le refermait
     ne voyait jamais ce qui s'était passé. On les relève à la connexion. */
  if(typeof syncEffetsCombat==="function") t.push(syncEffetsCombat());
  if(typeof boissonCharger==="function")  t.push(boissonCharger());        // v0.77 : effet de boisson en cours
  await Promise.all(t);
  if(typeof afficher==="function") afficher();
  if(typeof majEcranPause==="function") majEcranPause();   // écran bloquant si en pause
  if(typeof majEcranMort==="function")  majEcranMort();    // écran bloquant si mort
}
setTimeout(syncApresConnexion, 1200);
