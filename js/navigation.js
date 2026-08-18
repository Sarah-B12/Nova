/* ===========================================================
   NAVIGATION — Navigation entre hubs et inscription du personnage.
   =========================================================== */

function montrerHub(h){
  document.querySelectorAll(".hub-vue").forEach(el => el.hidden = (el.id !== "hub-"+h));
  document.querySelectorAll(".hub-lien").forEach(b => b.classList.toggle("actif", b.dataset.hub===h));
}
function changerHub(h){ montrerHub(h); if(h==="terrain") majTerrain(); if(h==="centre") majCentre(); if(h==="marche" && typeof renderMarche==="function") renderMarche(); if(h==="boutique" && typeof renderBoutique==="function") renderBoutique(); }
// Affiche les destinations selon l'endroit (temps réel). Terrain : chez soi seulement.
function majHub(){
  const nav=document.querySelector("#hub-nav"); if(!nav) return;
  const ville=villeActuelle();
  const dispo={ terrain: ville===etat.faction, centre: !!ville, poste: !!ville, marche: !!ville, boutique: !!ville, voler: !!ville };
  document.querySelectorAll(".hub-lien").forEach(b=>{ const h=b.dataset.hub; if(h!=="activites") b.style.display = dispo[h] ? "" : "none"; });
  const actif=document.querySelector(".hub-lien.actif"); const cur=actif?actif.dataset.hub:"activites";
  if(cur!=="activites" && !dispo[cur]) montrerHub("activites");
}
function ouvrirInscription(){ document.querySelector("#modale-inscription").hidden=false; document.querySelector("#inscription-nom").focus(); }
function fermerInscription(){ document.querySelector("#modale-inscription").hidden=true; }
function inscrire(){
  const nom=document.querySelector("#inscription-nom").value.trim();
  if(!nom){ document.querySelector("#inscription-nom").focus(); return; }
  const f=FACTIONS[alea(0,FACTIONS.length-1)];
  etat.nom=nom; etat.faction=f.id; etat.inscrit=true; etat.creeLe=Date.now(); etat.pos=posDefaut();
  sauvegarder(); fermerInscription(); afficher();
  journal(`Inscription validée. Bienvenue, ${nom}. Faction attribuée : ${f.nom}.`,"gain");
}

/* ---------- Construction dynamique ---------- */
