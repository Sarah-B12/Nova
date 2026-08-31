/* ===========================================================
   NAVIGATION — Navigation entre hubs et inscription du personnage.
   =========================================================== */

function montrerHub(h){
  document.querySelectorAll(".hub-vue").forEach(el => el.hidden = (el.id !== "hub-"+h));
  document.querySelectorAll(".hub-lien").forEach(b => b.classList.toggle("actif", b.dataset.hub===h));
}
function changerHub(h){ montrerHub(h); if(h==="terrain") majTerrain(); if(h==="centre") majCentre(); if(h==="quete" && typeof majQueteHub==="function") majQueteHub(); if(h==="marche" && typeof renderMarche==="function") renderMarche(); if(h==="boutique" && typeof renderBoutique==="function") renderBoutique(); if(h==="voler" && typeof majVoler==="function") majVoler(); }
// Affiche les destinations selon l'endroit (temps réel). Terrain : chez soi seulement.
function majHub(){
  const nav=document.querySelector("#hub-nav"); if(!nav) return;
  const ville=villeActuelle(); const chezSoi = ville===etat.faction;
  const dispo={ terrain:chezSoi, inn:(!!ville && !chezSoi), centre:!!ville, poste:!!ville, marche:!!ville, boutique:!!ville, voler:!!ville,
    quete:(typeof queteActive==="function" && !!queteActive()) || chezSoi };
  document.querySelectorAll(".hub-lien").forEach(b=>{ b.style.display = dispo[b.dataset.hub] ? "" : "none"; });
  const actif=document.querySelector(".hub-lien.actif"); const cur=actif?actif.dataset.hub:null;
  if(!cur || !dispo[cur]){
    const prem=["terrain","inn","centre","marche","boutique","quete","poste","voler"].find(h=>dispo[h]);
    if(prem) changerHub(prem); else montrerHub("vide");
  }
}
function montrerBienvenue(){ const m=document.querySelector("#modale-bienvenue"); if(m) m.hidden=false; }
function fermerBienvenue(){ const m=document.querySelector("#modale-bienvenue"); if(m) m.hidden=true; etat.bienvenueVue=true; if(typeof sauvegarder==="function") sauvegarder(); }
function ouvrirInscription(){ document.querySelector("#modale-inscription").hidden=false; document.querySelector("#inscription-nom").focus(); }
function fermerInscription(){ document.querySelector("#modale-inscription").hidden=true; }
function inscrire(){
  const nom=document.querySelector("#inscription-nom").value.trim();
  if(!nom){ document.querySelector("#inscription-nom").focus(); return; }
  const f=FACTIONS[alea(0,FACTIONS.length-1)];
  etat.nom=nom; etat.faction=f.id; etat.inscrit=true; etat.creeLe=Date.now(); etat.pos=posDefaut();
  sauvegarder(); fermerInscription(); afficher();
  journal(`Inscription validée. Bienvenue, ${nom}. Faction attribuée : ${f.nom}.`,"gain");
  montrerBienvenue();
}

/* ---------- Construction dynamique ---------- */
