/* ===========================================================
   BOOTSTRAP — Initialisation de l'état, câblage des événements et démarrage.
   Chargé en dernier : toutes les données et fonctions sont déjà définies.
   =========================================================== */
let etat = charger();

/* ---------- Onglets ---------- */
document.querySelectorAll(".onglet").forEach(o => o.addEventListener("click", () => {
  document.querySelectorAll(".onglet").forEach(x=>x.classList.toggle("actif", x===o));
  document.querySelectorAll(".panneau").forEach(p=>p.classList.toggle("actif", p.dataset.panneau===o.dataset.onglet));
}));

/* ---------- Câblage ---------- */
const ACTIONS={ reposer, explorer, combattre };
document.querySelectorAll("button.action[data-action]").forEach(b => b.addEventListener("click", ()=>{
  const r = raisonAction(b.dataset.action);
  if(r){ journal(r, "alerte"); return; }
  ACTIONS[b.dataset.action]();
}));
document.querySelector("#btn-sauver").addEventListener("click", ()=>{ sauvegarder(); journal("Partie sauvegardée."); });
document.querySelector("#btn-reset").addEventListener("click", reinitialiser);
document.querySelector("#ouvrir-carte").addEventListener("click", ouvrirCarte);
document.querySelector("#carte-fermer").addEventListener("click", fermerCarte);
document.querySelectorAll(".hub-lien").forEach(b => b.addEventListener("click", ()=>changerHub(b.dataset.hub)));
document.querySelectorAll("#hub-centre .lien-carte").forEach(b => b.addEventListener("click", ()=>changerCentre(b.dataset.centre)));
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
document.querySelector("#btn-pause").addEventListener("click", () => {
  etat.enPause = !etat.enPause;
  document.querySelector("#btn-pause").textContent = etat.enPause ? "Reprendre" : "Mettre en pause";
  journal(etat.enPause ? "Personnage mis en pause." : "Personnage réactivé.");
  afficher(); sauvegarder();
});
document.querySelector("#desc-editer").addEventListener("click", () => { const ed=document.querySelector("#desc-edition"); ed.hidden=!ed.hidden; if(!ed.hidden) document.querySelector("#desc-champ").value=etat.description; });
document.querySelector("#desc-enregistrer").addEventListener("click", () => { etat.description=document.querySelector("#desc-champ").value; document.querySelector("#desc-edition").hidden=true; afficher(); sauvegarder(); journal("Description mise à jour."); });
document.querySelector("#mur-publier").addEventListener("click", publierMur);
document.querySelector("#mur-champ").addEventListener("keydown", e => { if(e.key==="Enter") publierMur(); });
document.querySelector("#mur-visibilite").addEventListener("change", e => { etat.murOuvertA=e.target.value; sauvegarder(); });
document.querySelector("#inscription-valider").addEventListener("click", inscrire);
document.querySelector("#inscription-nom").addEventListener("keydown", e => { if(e.key==="Enter") inscrire(); });

/* ---------- Démarrage ---------- */
construireBoutique(); construireCompetences(); construireCarte();
document.querySelector("#btn-pause").textContent = etat.enPause ? "Reprendre" : "Mettre en pause";
afficher();
if(!etat.inscrit) ouvrirInscription(); else journal("Systèmes en ligne. Surveille ton énergie.");
// Rafraîchit l'affichage de l'énergie qui remonte avec le temps (ne consomme rien).
setInterval(() => { if (etat.inscrit) afficher(); }, 60000);
