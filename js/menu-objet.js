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
  const vais = (typeof estVaisseau==="function") && estVaisseau(id);
  const prixMarche = (typeof PRIX_ITEM!=="undefined") && PRIX_ITEM[id];
  const brade = valeurBrade(id);
  if(!conso && !equip && !vais && !prixMarche && brade==null) return;   // rien à faire

  let html = `<div class="menu-cadre"><div class="menu-tete"><span class="menu-ic">${iconeItem(id)}</span><b>${it.nom}</b> <span class="qte">×${etat.sac[id]}</span><button class="mini" data-fermer="1">✕</button></div>`;
  if(conso)      html += `<button class="menu-act" data-act="consommer">Consommer</button>`;
  if(equip)      html += `<button class="menu-act" data-act="equiper">Équiper</button>`;
  if(vais)       html += `<button class="menu-act" data-act="equiper-vaisseau">Équiper (vaisseau)</button>`;
  if(prixMarche) html += `<button class="menu-act" data-act="vendre">Vendre au marché — fixe ton prix…</button>`;
  /* Bradage : au-delà d'une unité, on propose une quantité plutôt que d'obliger
     à recommencer objet par objet. Les retraits sont FIFO côté serveur
     (inv_retirer), donc ce sont TOUJOURS les lots les plus anciens — donc les
     plus proches de la péremption — qui partent en premier. */
  if(brade!=null){
    const u = Math.max(1, Math.round(brade/2));
    const dispo = etat.sac[id]||0;
    /* ⚠ La quantité est ENCADRÉE avec le bouton Brader. Posée seule entre
       « Vendre au marché… » et « Brader », elle se lisait comme un réglage de
       la vente. Le cadre et l'intitulé lèvent l'ambiguïté. */
    if(dispo > 1){
      html += `<div class="menu-groupe">
        <div class="menu-groupe-t">Brader — vente immédiate, ${u} ₡ l'unité</div>
        <div class="menu-qte">
          <button class="mini" data-q="-1">−</button>
          <input id="brade-q" type="number" inputmode="numeric" min="1" max="${dispo}" value="1">
          <button class="mini" data-q="1">+</button>
          <button class="mini" data-q="max">Tout (${dispo})</button>
        </div>
        <button class="menu-act brader" data-act="brader">Brader <span id="brade-n">1</span> — <span id="brade-t">${u}</span> ₡</button>
      </div>`;
    } else {
      html += `<button class="menu-act brader" data-act="brader">Brader — ${u} ₡</button>`;
    }
  }
  html += `</div>`;

  const m=document.querySelector("#menu-objet"); m.innerHTML=html; m.hidden=false;
  m.querySelector("[data-fermer]").addEventListener("click", fermerMenuObjet);
  m.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click", ()=>menuActionObjet(b.dataset.act, id)));

  const champ = m.querySelector("#brade-q");
  if(champ){
    const dispo = etat.sac[id]||0, u = Math.max(1, Math.round(valeurBrade(id)/2));
    const maj = ()=>{
      let n = parseInt(champ.value,10); if(!Number.isFinite(n)) n = 1;
      n = Math.max(1, Math.min(dispo, n));
      champ.value = n;
      m.querySelector("#brade-n").textContent = n;
      m.querySelector("#brade-t").textContent = n * u;
    };
    champ.addEventListener("input", maj);
    m.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click", ()=>{
      champ.value = b.dataset.q==="max" ? dispo : (parseInt(champ.value,10)||1) + parseInt(b.dataset.q,10);
      maj();
    }));
    maj();
  }
}

let _brdQte = 1;   // lue AVANT fermerMenuObjet(), qui vide le menu et perd le champ
function menuActionObjet(act, id){
  if(act==="brader"){
    const c=document.querySelector("#brade-q");
    _brdQte = c ? Math.max(1, parseInt(c.value,10)||1) : 1;
  }
  fermerMenuObjet();
  if(act==="consommer" && typeof utiliser==="function") utiliser(id);
  else if(act==="equiper" && typeof equiper==="function") equiper(id);
  else if(act==="equiper-vaisseau" && typeof equiperVaisseau==="function") equiperVaisseau(id);
  else if(act==="brader") braderObjet(id, _brdQte);
  else if(act==="vendre") vendreDepuisMenu(id);
}

async function braderObjet(id, qte){
  const v=valeurBrade(id); if(v==null) return;
  const dispo = etat.sac[id]||0; if(dispo<=0) return;
  const n = Math.max(1, Math.min(dispo, parseInt(qte,10)||1));
  /* ⚠ v0.58 — BRADE SERVEUR. Avant : agir() retirait l'objet, puis le gain
     partait par crediter(), plafonné à 2 000 ₡ par appel. Au-delà (drones,
     cockpit blindé, vaisseau maître, ou 30 lingots d'un coup), le serveur
     REFUSAIT le gain en silence : objet détruit, zéro crédit. La RPC brader()
     retire et paie dans la même transaction, au prix de la table prix_brade
     (copie serveur de valeurBrade()/2 — à resynchroniser si PRIX_ITEM change). */
  const { data:res, error } = await rpcAvecSolde("brader", { p_item:id, p_qte:n });
  if(error || !res || !res.ok){
    const e = res && res.err;
    if(e==="manque")          journal("Tu n'as plus assez de cet objet dans le sac.","alerte");
    else if(e==="invendable") journal("Cet objet ne se brade pas.","alerte");
    else if(e==="prison")     journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte");
    else                      journal("Brade refusée par le serveur.","alerte");
    return;
  }
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  if(etat.pas) etat.pas.vendu=true;
  journal(`${item(id).nom}${n>1?` ×${n}`:""} bradé — +${res.gain} ₡.`,"gain");
  apresAction();
}

function vendreDepuisMenu(id){
  if(typeof marcheFaction==="function" && !marcheFaction()){
    journal("Il faut être dans une ville de faction pour vendre au marché (sinon « Brader »).","alerte"); return;
  }
  const ong=document.querySelector('[data-onglet="planete"]'); if(ong) ong.click();
  setTimeout(()=>{ if(typeof changerHub==="function") changerHub("marche"); if(typeof ouvrirVente==="function") ouvrirVente(); }, 0);
}
