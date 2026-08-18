/* ===========================================================
   BOUTIQUE — officielle, identique dans toutes les factions, stock ILLIMITÉ.
   Vend les graines (prérequis pour planter), les bébés animaux (prérequis pour
   élever), et des consommables Biotech (Recharge d'oxygène, Kit de soin,
   Biocarburant) à prix > max marché, pour pousser vers les Biotech / le marché.
   =========================================================== */
let boutiqueTab = "graines";

function renderBoutique(){
  const z = document.querySelector("#boutique-vue"); if(!z) return;
  let html = `<p class="vide" style="margin:0 0 10px">Boutique officielle — mêmes prix partout, stock illimité. Les <b>graines</b> et <b>bébés</b> sont indispensables pour cultiver et élever.</p>`;
  html += `<div class="marche-tabs">` + CAT_BOUTIQUE.map(c=>`<button class="marche-tab${c.id===boutiqueTab?" actif":""}" data-bcat="${c.id}">${c.nom}</button>`).join("") + `</div>`;
  html += `<div class="marche-liste">`;
  const arts = BOUTIQUE.filter(a=>a.cat===boutiqueTab);
  if(!arts.length) html += `<p class="vide">Rien ici.</p>`;
  for(const a of arts){
    let sous = "";
    if(a.cat==="graines"){ const g=GRAINES.find(x=>x.id===a.id); sous = g ? `donne de la ${plante(g.plante).nom}` : ""; }
    else if(a.cat==="bebes"){ const b=BEBES.find(x=>x.id===a.id); sous = b ? `produit du ${item(animal(b.animal).produit).nom}` : ""; }
    else { const e=effetConso(a.id); sous = e ? `+${e.soin} ${e.jauge} à l'usage` : "carburant de vaisseau"; }
    html += `<div class="marche-ligne" data-item="${a.id}"><span class="marche-ic">${iconeItem(a.id)}</span>`
      + `<span class="marche-nom">${a.nom}<span class="qte">${sous}</span></span>`
      + `<span class="marche-prix">${a.prix} ₡</span>`
      + `<button class="mini" data-boutique="${a.id}">Acheter</button></div>`;
  }
  html += `</div>`;
  z.innerHTML = html;
  z.querySelectorAll("[data-bcat]").forEach(b=>b.addEventListener("click",()=>{ boutiqueTab=b.dataset.bcat; renderBoutique(); }));
  z.querySelectorAll("[data-boutique]").forEach(b=>b.addEventListener("click",()=>acheterBoutique(b.dataset.boutique)));
  if(typeof brancherTips==="function") brancherTips(z);
}

function acheterBoutique(id){
  const a = BOUTIQUE.find(x=>x.id===id); if(!a) return;
  if(etat.credits < a.prix){ journal("Crédits insuffisants.","alerte"); return; }
  if(placesLibres() <= 0){ journal("Sac plein.","alerte"); return; }
  etat.credits -= a.prix; ajouterAuSac(id, 1);
  journal(`Boutique : ${a.nom} acheté — ${a.prix} ₡.`,"gain");
  apresAction(); renderBoutique();
}
