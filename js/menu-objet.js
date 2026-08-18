/* ===========================================================
   MENU OBJET — au clic sur un objet du sac : petite fenêtre de choix.
   - Consommer (si consommable)   - Équiper (si équipement)
   - Vendre au marché (redirige)  - Brader (vente immédiate au prix min / 2)
   =========================================================== */

// Valeur de référence pour brader : prix min du marché, sinon prix Boutique (graines/bébés).
function valeurBrade(id){
  if(typeof PRIX_ITEM!=="undefined" && PRIX_ITEM[id]) return PRIX_ITEM[id].min;
  const b = (typeof BOUTIQUE!=="undefined") ? BOUTIQUE.find(a=>a.id===id) : null;
  return b ? b.prix : null;
}

let _menuMonte=false;
function monterMenuObjet(){
  if(_menuMonte) return;
  const m=document.createElement("div"); m.id="menu-objet"; m.hidden=true;
  document.body.appendChild(m);
  m.addEventListener("click", e=>{ if(e.target===m) fermerMenuObjet(); });
  _menuMonte=true;
}
function fermerMenuObjet(){ const m=document.querySelector("#menu-objet"); if(m) m.hidden=true; }

function ouvrirMenuObjet(id){
  monterMenuObjet();
  const it=item(id); if(!it || (etat.sac[id]||0)<=0) return;
  const conso = (typeof effetConso==="function") && effetConso(id);
  const equip = (typeof slotEquip==="function") && slotEquip(id);
  const prixMarche = (typeof PRIX_ITEM!=="undefined") && PRIX_ITEM[id];
  const brade = valeurBrade(id);
  if(!conso && !equip && !prixMarche && brade==null) return;   // rien à faire

  let html = `<div class="menu-cadre"><div class="menu-tete"><span class="menu-ic">${iconeItem(id)}</span><b>${it.nom}</b> <span class="qte">×${etat.sac[id]}</span><button class="mini" data-fermer="1">✕</button></div>`;
  if(conso)      html += `<button class="menu-act" data-act="consommer">Consommer</button>`;
  if(equip)      html += `<button class="menu-act" data-act="equiper">Équiper</button>`;
  if(prixMarche) html += `<button class="menu-act" data-act="vendre">Vendre au marché…</button>`;
  if(brade!=null) html += `<button class="menu-act brader" data-act="brader">Brader — ${Math.max(1,Math.round(brade/2))} ₡</button>`;
  html += `</div>`;

  const m=document.querySelector("#menu-objet"); m.innerHTML=html; m.hidden=false;
  m.querySelector("[data-fermer]").addEventListener("click", fermerMenuObjet);
  m.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click", ()=>menuActionObjet(b.dataset.act, id)));
}

function menuActionObjet(act, id){
  fermerMenuObjet();
  if(act==="consommer" && typeof utiliser==="function") utiliser(id);
  else if(act==="equiper" && typeof equiper==="function") equiper(id);
  else if(act==="brader") braderObjet(id);
  else if(act==="vendre") vendreDepuisMenu(id);
}

function braderObjet(id){
  const v=valeurBrade(id); if(v==null || (etat.sac[id]||0)<=0) return;
  const gain=Math.max(1, Math.round(v/2));
  retirerDuSac(id,1); etat.credits += gain;
  journal(`${item(id).nom} bradé — +${gain} ₡.`,"gain");
  apresAction();
}

function vendreDepuisMenu(id){
  if(typeof marcheFaction==="function" && !marcheFaction()){
    journal("Il faut être dans une ville de faction pour vendre au marché (sinon « Brader »).","alerte"); return;
  }
  const ong=document.querySelector('[data-onglet="planete"]'); if(ong) ong.click();
  setTimeout(()=>{ if(typeof changerHub==="function") changerHub("marche"); if(typeof ouvrirVente==="function") ouvrirVente(); }, 0);
}
