/* ===========================================================
   MARCHÉ — un marché distinct PAR FACTION (mise en vente locale à la ville).
   Affiche, par type d'objet, la MEILLEURE offre des AUTRES (on ne s'achète pas
   à soi-même : ses propres offres sont masquées à l'achat, mais retirables via
   « Mes ventes »). Prix coloré selon le prix moyen.
   =========================================================== */
const CAT_MARCHE = [
  { id:"minerais",   nom:"Minerais & lingots" },
  { id:"bio",        nom:"Matières bio" },
  { id:"armes",      nom:"Armes & munitions" },
  { id:"armures",    nom:"Armures" },
  { id:"implants",   nom:"Implants & drones" },
  { id:"composants", nom:"Composants & pièces" },
  { id:"vaisseaux",  nom:"Vaisseaux" },
  { id:"conso",      nom:"Consommables" }
];
let marcheTab = "minerais";

function categorieMarche(id){
  const it = item(id); if(!it) return "composants";
  const n = (it.nom||"").toLowerCase();
  if(it.cat==="minerai" || /lingot/.test(n)) return "minerais";
  if(/casque|plastron|jambi/.test(n)) return "armures";
  if(/implant|drone/.test(n)) return "implants";
  if(/couteau|pistolet|lame|fusil|canon|munition|tourelle/.test(n)) return "armes";
  if(/^vaisseau|^navette/.test(n)) return "vaisseaux";
  if(it.type==="conso" || /oxygène|oxygene|soin|ration|stimulant|antidote|biogel|tank/.test(n)) return "conso";
  if(it.cat==="plante" || it.cat==="organique" || it.cat==="animal" || /sylve|biofibre|biocarburant|\bfil\b|prot[eé]ine|nectine|sporelle|ferragave|filaine|cuir/.test(n)) return "bio";
  return "composants";
}

function marcheFaction(){ return (typeof villeActuelle==="function") ? villeActuelle() : null; }
function commissionTaux(){ return (etat.aptitudes && Array.isArray(etat.aptitudes.pris) && etat.aptitudes.pris.includes("no2")) ? 0.05 : 0.10; }
function _moi(){ return etat.nom || "Toi"; }

/* --- Offres --- */
function offresItem(faction, id){ return (etat.marches[faction]||[]).filter(o=>o.id===id).sort((a,b)=> a.prix-b.prix || a.date-b.date); }
// Achetables = celles des AUTRES uniquement.
function offresAchat(faction, id){ return offresItem(faction, id).filter(o=>o.vendeur!==_moi()); }
function meilleureOffre(faction, id){ return offresAchat(faction, id)[0] || null; }
function mesOffres(faction){ return (etat.marches[faction]||[]).filter(o=>o.vendeur===_moi()).sort((a,b)=> a.prix-b.prix || a.date-b.date); }

/* --- Semis PNJ (démo) --- */
function semerMarches(){
  if(!etat.marches) etat.marches = {};
  if(etat.marchesSemes) return;
  if(typeof PRIX_ITEM==="undefined"){ return; }
  const noms = ["Kael","Vira","Toz","Nyx-7","Brann","Sela","Orin","Dax","Lume","Ferro","Cass","Yara"];
  const ids = Object.keys(PRIX_ITEM);
  for(const f of FACTIONS){
    etat.marches[f.id] = etat.marches[f.id] || [];
    const pool = ids.slice().sort(()=>Math.random()-0.5).slice(0, 24);
    for(const id of pool){
      const p = PRIX_ITEM[id]; const n = 1 + Math.floor(Math.random()*3);
      for(let k=0;k<n;k++){
        etat.marches[f.id].push({ id, prix: Math.round(p.min + Math.random()*(p.max-p.min)), date: Date.now()-Math.floor(Math.random()*1e7), vendeur: noms[Math.floor(Math.random()*noms.length)] });
      }
    }
  }
  etat.marchesSemes = true;
  if(typeof sauvegarder==="function") sauvegarder();
}

/* --- Acheter (jamais sa propre offre) --- */
function acheterOffre(faction, id){
  const o = meilleureOffre(faction, id); if(!o) return;
  if(typeof estVaisseau==="function" && estVaisseau(id) && !etat.permisVaisseau){ journal("Achat de vaisseau verrouillé : permis de vaisseau requis (quête à venir).","alerte"); return; }
  if(etat.credits < o.prix){ journal("Crédits insuffisants.","alerte"); return; }
  if(placesLibres() <= 0){ journal("Sac plein.","alerte"); return; }
  etat.credits -= o.prix;
  ajouterAuSac(id, 1);
  const arr = etat.marches[faction]; const i = arr.indexOf(o); if(i>=0) arr.splice(i,1);
  journal(`Acheté : ${item(id).nom} — ${o.prix} ₡.`,"gain");
  apresAction(); renderMarche();
}

/* --- Retirer ses propres offres (rend l'objet ; commission non remboursée) --- */
function retirerGroupe(faction, id, prix, qte){
  const arr = etat.marches[faction]; if(!arr) return;
  let done = 0;
  for(let k=0;k<qte;k++){
    if(placesLibres() <= 0) break;
    const idx = arr.findIndex(o=>o.id===id && o.prix===prix && o.vendeur===_moi());
    if(idx < 0) break;
    arr.splice(idx,1); ajouterAuSac(id,1); done++;
  }
  if(done>0) journal(`Retiré du marché : ${done}× ${item(id).nom}.`,"alerte");
  if(done<qte) journal("Sac plein — retrait partiel.","alerte");
  apresAction(); renderMarche(); ouvrirMesVentes();
}

/* --- Mettre en vente (quantité au choix) --- */
function mettreEnVente(id, prix, qte){
  const faction = marcheFaction(); if(!faction){ journal("Va dans une ville de faction pour vendre.","alerte"); return; }
  const dispo = etat.sac[id]||0; if(dispo <= 0) return;
  const p = PRIX_ITEM[id]; if(!p){ journal("Cet objet n'a pas de valeur de marché.","alerte"); return; }
  qte  = Math.max(1, Math.min(dispo, Math.floor(qte||1)));
  prix = Math.max(p.min, Math.min(p.max, Math.round(prix||p.moy)));
  const comU = Math.max(1, Math.round(p.min * commissionTaux()));   // commission PAR objet
  const com  = comU * qte;
  if(etat.credits < com){ journal(`Commission de ${com} ₡ (${qte} × ${comU}) — crédits insuffisants.`,"alerte"); return; }
  etat.credits -= com;
  etat.marches[faction] = etat.marches[faction] || [];
  for(let k=0;k<qte;k++){ retirerDuSac(id,1); etat.marches[faction].push({ id, prix, date: Date.now()+k, vendeur: _moi() }); }
  if(etat.pas) etat.pas.vendu=true;
  journal(`Mis en vente à ${FACTIONS.find(f=>f.id===faction).nom} : ${qte}× ${item(id).nom} à ${prix} ₡ (commission ${com} ₡).`,"gain");
  apresAction(); renderMarche(); ouvrirVente();
}

/* --- Rendu du marché --- */
function renderMarche(){
  const z = document.querySelector("#marche-vue"); if(!z) return;
  const faction = marcheFaction();
  if(!faction){ z.innerHTML = `<p class="vide">Rends-toi dans une <b>ville de faction</b> (onglet Planète) pour accéder à son marché. Chaque faction a le sien.</p>`; return; }
  semerMarches();
  const fc = FACTIONS.find(f=>f.id===faction);
  const nMes = mesOffres(faction).length;
  let html = `<div class="marche-tete"><h3 style="color:${fc.couleur};margin:0">Marché — ${fc.nom}</h3>`
    + `<span class="actions" style="gap:6px"><button class="mini" id="marche-mesventes-btn">Mes ventes${nMes?` (${nMes})`:""}</button><button class="mini" id="marche-vendre-btn">Mettre en vente</button></span></div>`;
  html += `<div class="marche-tabs">` + CAT_MARCHE.map(c=>`<button class="marche-tab${c.id===marcheTab?" actif":""}" data-cat="${c.id}">${c.nom}</button>`).join("") + `</div>`;
  // Achat : uniquement les offres des AUTRES.
  const arr = (etat.marches[faction] || []).filter(o=>o.vendeur!==_moi());
  const ids = [...new Set(arr.filter(o=>categorieMarche(o.id)===marcheTab).map(o=>o.id))]
    .sort((a,b)=> meilleureOffre(faction,a).prix - meilleureOffre(faction,b).prix);
  html += `<div class="marche-liste">`;
  if(!ids.length) html += `<p class="vide">Aucun objet en vente dans cette catégorie.</p>`;
  for(const id of ids){
    const offres = offresAchat(faction, id); const o = offres[0]; const p = PRIX_ITEM[id] || {};
    const cls = o.prix < p.moy ? "prix-bas" : (o.prix > p.moy ? "prix-haut" : "prix-moyen");
    html += `<div class="marche-ligne" data-item="${id}"><span class="marche-ic">${iconeItem(id)}</span>`
      + `<span class="marche-nom">${item(id).nom}<span class="qte">${offres.length} en vente · moy ${p.moy} ₡</span></span>`
      + `<span class="marche-prix ${cls}">${o.prix} ₡</span>`
      + `<button class="mini" data-acheter="${id}">Acheter</button></div>`;
  }
  html += `</div>`;
  z.innerHTML = html;
  if(typeof brancherTips==="function") brancherTips(z);
  z.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>{ marcheTab=b.dataset.cat; renderMarche(); }));
  z.querySelectorAll("[data-acheter]").forEach(b=>b.addEventListener("click",()=>acheterOffre(faction, b.dataset.acheter)));
  const vb = z.querySelector("#marche-vendre-btn"); if(vb) vb.addEventListener("click", ouvrirVente);
  const mb = z.querySelector("#marche-mesventes-btn"); if(mb) mb.addEventListener("click", ouvrirMesVentes);
}

/* --- Modale : mise en vente (avec quantité) --- */
let _venteMonte = false;
function monterVenteModal(){ if(_venteMonte) return; const m=document.createElement("div"); m.id="marche-vente"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) m.hidden=true; }); _venteMonte=true; }
function ouvrirVente(){
  const faction = marcheFaction(); if(!faction) return;
  monterVenteModal();
  const m = document.querySelector("#marche-vente");
  const vendables = TOUS_ITEMS.filter(a=>(etat.sac[a.id]||0)>0 && PRIX_ITEM[a.id]);
  let html = `<div class="picker-cadre"><div class="picker-tete"><b>Mettre en vente — ${FACTIONS.find(f=>f.id===faction).nom}</b><button class="mini" data-fermer="1">Fermer</button></div>`;
  html += `<p class="vide" style="margin:0 0 8px">Commission : <b>${Math.round(commissionTaux()*100)} % du prix min</b>, par objet, prélevée à la mise en vente.</p>`;
  if(!vendables.length) html += `<p class="vide">Aucun objet vendable dans ton sac.</p>`;
  for(const it of vendables){ const pr=PRIX_ITEM[it.id]; const dispo=etat.sac[it.id];
    html += `<div class="vente-ligne" data-item="${it.id}"><span class="picker-ic">${iconeItem(it.id)}</span>`
      + `<span class="picker-nom"><b>${it.nom}</b> <span class="qte">×${dispo}</span><span class="itip-gris">${pr.min}–${pr.max} ₡ · moy ${pr.moy}</span></span>`
      + `<input type="number" class="vente-qte" min="1" max="${dispo}" value="1" data-id="${it.id}" title="Quantité" style="max-width:58px">`
      + `<input type="number" class="vente-prix" min="${pr.min}" max="${pr.max}" value="${pr.moy}" data-id="${it.id}" title="Prix unitaire">`
      + `<button class="mini" data-vendre="${it.id}">Vendre</button></div>`;
  }
  html += `</div>`;
  m.innerHTML = html; m.hidden = false;
  if(typeof brancherTips==="function") brancherTips(m);
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
  m.querySelectorAll("[data-vendre]").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.vendre;
    const pi=m.querySelector(`.vente-prix[data-id="${id}"]`); const qi=m.querySelector(`.vente-qte[data-id="${id}"]`);
    mettreEnVente(id, parseInt(pi.value,10), parseInt(qi?qi.value:1,10));
  }));
}

/* --- Modale : mes ventes (retrait) --- */
let _mesVentesMonte = false;
function monterMesVentesModal(){ if(_mesVentesMonte) return; const m=document.createElement("div"); m.id="marche-mesventes"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) m.hidden=true; }); _mesVentesMonte=true; }
function ouvrirMesVentes(){
  const faction = marcheFaction(); if(!faction) return;
  monterMesVentesModal();
  const m = document.querySelector("#marche-mesventes");
  const mes = mesOffres(faction);
  const groupes = {};
  for(const o of mes){ const k=o.id+"@"+o.prix; (groupes[k]=groupes[k]||{id:o.id, prix:o.prix, qte:0}).qte++; }
  const list = Object.values(groupes).sort((a,b)=> item(a.id).nom.localeCompare(item(b.id).nom) || a.prix-b.prix);
  let html = `<div class="picker-cadre"><div class="picker-tete"><b>Mes ventes — ${FACTIONS.find(f=>f.id===faction).nom}</b><button class="mini" data-fermer="1">Fermer</button></div>`;
  html += `<p class="vide" style="margin:0 0 8px">Retirer une offre te rend l'objet. La commission déjà payée n'est pas remboursée.</p>`;
  if(!list.length) html += `<p class="vide">Tu n'as rien en vente ici.</p>`;
  for(const g of list){
    html += `<div class="vente-ligne" data-item="${g.id}"><span class="picker-ic">${iconeItem(g.id)}</span>`
      + `<span class="picker-nom"><b>${item(g.id).nom}</b> <span class="qte">×${g.qte} à ${g.prix} ₡</span></span>`
      + `<button class="mini danger" data-retirer="${g.id}@${g.prix}@${g.qte}">Retirer tout</button></div>`;
  }
  html += `</div>`;
  m.innerHTML = html; m.hidden = false;
  if(typeof brancherTips==="function") brancherTips(m);
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
  m.querySelectorAll("[data-retirer]").forEach(b=>b.addEventListener("click",()=>{
    const [id,prix,qte]=b.dataset.retirer.split("@"); retirerGroupe(faction, id, parseInt(prix,10), parseInt(qte,10));
  }));
}
