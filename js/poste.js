/* ===========================================================
   LA POSTE — envoi entre joueurs (objet / cadeau / crédits).
   Serveur : fonctions poste_envoyer / poste_recuperer / poste_refuser / poste_purge.
   Délais : 3 j chez le destinataire → retour 3 j chez l'expéditeur → suppression.
   Taxe non remboursée. Crédits autoritatifs serveur (resynchro après chaque op).
   =========================================================== */
(function(){ if(document.querySelector("#poste-style")) return;
  const st=document.createElement("style"); st.id="poste-style";
  st.textContent=`
    .poste-onglets{ display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
    .poste-onglets .lien-carte{ flex:0 0 auto; min-width:130px; }
    .poste-ligne{ display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:8px; padding:9px 11px; margin:6px 0; }
    .poste-txt{ flex:1; }
    .poste-envoi{ display:flex; flex-direction:column; gap:9px; max-width:460px; }
    /* Ne PAS viser tous les input de .poste-envoi sans restriction : les boutons
       radio heritaient de width:100% et du padding. Chrome les ignore sur un
       radio, Safari/iPad les applique — chaque bouton prenait toute la largeur
       de son label et se posait sur le texte. */
    .poste-envoi input:not([type=radio]):not([type=checkbox]), .poste-envoi select{ width:100%; box-sizing:border-box; background:#0f1830; border:1px solid var(--line); border-radius:var(--r-s,10px); color:var(--texte,#dfe8f2); padding:9px 11px; font-family:inherit; font-size:14px; }
    .poste-envoi input:not([type=radio]):focus, .poste-envoi select:focus{ outline:none; border-color:var(--orange,#ff8a3d); }
    /* Taille imposee : sans cela, iOS agrandit les radios de facon imprevisible. */
    .poste-types input[type=radio]{ width:18px; height:18px; min-width:18px; flex:0 0 18px;
      margin:0; padding:0; accent-color:var(--orange,#ff8a3d); }
    .poste-envoi input:-webkit-autofill{ -webkit-box-shadow:0 0 0 40px #0f1830 inset !important; -webkit-text-fill-color:var(--texte,#dfe8f2) !important; }
    .poste-envoi #poste-qte{ width:80px; } .poste-envoi #poste-prix{ width:180px; }
    .poste-types{ display:flex; flex-wrap:wrap; gap:12px; }
    .poste-types label{ display:flex; align-items:center; gap:7px; cursor:pointer; font-size:14px; white-space:nowrap; }
    .poste-dispo{ font-family:"Space Mono",monospace; font-size:12px; color:var(--sourdine); margin-left:-4px; }
    .hub-banniere{ width:100%; max-height:150px; object-fit:cover; border-radius:10px; margin-bottom:12px; display:block; }
  `;
  document.head.appendChild(st);
})();
let posteVue = "boite";
let _posteCache = [];

// Temps restant avant qu'un colis non récupéré ne reparte vers l'expéditeur.
function _resteAvant(echeance){
  if(!echeance) return "";
  const ms = new Date(echeance).getTime() - Date.now();
  if(ms <= 0) return "échéance passée";
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
  return h >= 24 ? `${Math.floor(h/24)} j ${h%24} h` : (h >= 1 ? `${h} h ${m} min` : `${m} min`);
}
function _ligneEnvoye(o){
  const quoi = o.type==="credits"
    ? `${o.montant} ₡`
    : `${o.quantite}× ${(typeof item==="function" && item(o.item_id)) ? item(o.item_id).nom : o.item_id}`;
  const cr = o.type==="objet" && o.montant>0 ? ` <span class="itip-gris">(contre ${o.montant} ₡)</span>` : "";
  return `<div class="poste-ligne">
    <div><b>${quoi}</b>${cr} — pour <b>${echapper(o.aNom||"?")}</b>${o.type==="cadeau"?" (cadeau)":""}</div>
    <div class="itip-gris" style="font-size:12px">Retour à l'expéditeur dans <b>${_resteAvant(o.echeance)}</b> si non récupéré.</div>
  </div>`;
}
let _posteMonId = null;
let _postePrec = -1;

function _posteBanniere(){ return `<img src="images/poste.png" alt="La Poste" class="hub-banniere" onerror="this.remove()">`; }

async function _chargerPoste(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return [];
  const s=await sessionActuelle(); if(!s) return []; _posteMonId=s.user.id;
  try{ await sb.rpc("poste_purge"); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "poste.js#1"); }
  const { data, error } = await sb.from("poste").select("*").order("cree_le",{ascending:false});
  if(error){ console.warn("[poste]", error.message); return []; }
  const rows=data||[]; const ids=new Set(); rows.forEach(r=>{ ids.add(r.de_id); ids.add(r.a_id); });
  const noms={}; if(ids.size){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",[...ids]); for(const p of (pubs||[])) noms[p.id]=p.nom; }
  return rows.map(r=>({ ...r, deNom:noms[r.de_id]||"(inconnu)", aNom:noms[r.a_id]||"(inconnu)" }));
}

async function majPoste(){
  const z=document.querySelector("#poste-vue"); if(!z) return;
  z.innerHTML = _posteBanniere() + `<p class="vide">Chargement…</p>`;
  _posteCache = await _chargerPoste();
  const recus  = _posteCache.filter(o=>o.statut==="attente" && o.a_id===_posteMonId);
  const retours= _posteCache.filter(o=>o.statut==="retour"  && o.de_id===_posteMonId);
  const envoyes= _posteCache.filter(o=>o.statut==="attente" && o.de_id===_posteMonId);
  let h = _posteBanniere();
  h += `<p class="itip-gris" style="margin:0 0 10px">Le destinataire a <b>3 jours</b> pour récupérer ou refuser. Sinon, l'envoi <b>retourne à l'expéditeur</b> (3 jours de plus pour le récupérer). Passé ce délai, tout est <b>supprimé</b>. La taxe n'est jamais remboursée.</p>`;
  h += `<div class="poste-onglets"><button class="lien-carte${posteVue==="boite"?" actif":""}" data-pv="boite">Boîte (${recus.length+retours.length})</button><button class="lien-carte${posteVue==="envoyer"?" actif":""}" data-pv="envoyer">Envoyer</button></div>`;
  if(posteVue==="envoyer"){ h += _vueEnvoyer(); }
  else {
    if(!recus.length && !retours.length) h += `<p class="vide">Ta boîte est vide.</p>`;
    if(recus.length){ h += `<h4 class="comm-titre">Reçus</h4>`; for(const o of recus) h += _ligneRecu(o); }
    if(retours.length){ h += `<h4 class="comm-titre">Retours (non récupérés)</h4>`; for(const o of retours) h += _ligneRetour(o); }
    if(envoyes.length){ h += `<h4 class="comm-titre">Envoyés (en attente chez le destinataire)</h4>`; for(const o of envoyes) h += _ligneEnvoye(o); }
  }
  z.innerHTML = h;
  _brancherPoste(z);
}

function _ligneRecu(o){
  const quand = (typeof _dateHeure==="function") ? _dateHeure(o.echeance) : "";
  let desc;
  if(o.type==="credits") desc = `<b>${echapper(o.deNom||"?")}</b> t'envoie <b>${o.montant} ₡</b>`;
  else if(o.type==="cadeau") desc = `🎁 Un <b>cadeau</b> de <b>${echapper(o.deNom||"?")}</b> (contenu caché)`;
  else desc = `<b>${echapper(o.deNom||"?")}</b> t'envoie <b>${item(o.item_id)?item(o.item_id).nom:o.item_id}</b> ×${o.quantite}` + (o.montant>0?` <span class="itip-gris">contre ${o.montant} ₡</span>`:` <span class="itip-gris">(gratuit)</span>`);
  return `<div class="poste-ligne"><span class="poste-txt">${desc}<span class="itip-gris" style="display:block;font-size:11px">à récupérer avant le ${quand}</span></span><span class="comm-btns"><button class="mini" data-recup="${o.id}">${o.type==="objet"&&o.montant>0?`Récupérer (${o.montant} ₡)`:"Récupérer"}</button><button class="mini danger" data-refus="${o.id}">Refuser</button></span></div>`;
}
function _ligneRetour(o){
  const quand = (typeof _dateHeure==="function") ? _dateHeure(o.echeance) : "";
  let desc;
  if(o.type==="credits") desc = `Retour de <b>${o.montant} ₡</b> (non reçus par ${echapper(o.aNom||"?")})`;
  else desc = `Retour de <b>${item(o.item_id)?item(o.item_id).nom:o.item_id}</b> ×${o.quantite} (non reçu par ${echapper(o.aNom||"?")})`;
  return `<div class="poste-ligne"><span class="poste-txt">${desc}<span class="itip-gris" style="display:block;font-size:11px">à récupérer avant le ${quand}</span></span><span class="comm-btns"><button class="mini" data-recup="${o.id}">Récupérer</button></span></div>`;
}

function _vueEnvoyer(){
  const sac = TOUS_ITEMS.filter(a=>(etat.sac[a.id]||0)>0);
  const opts = sac.map(a=>`<option value="${a.id}">${a.nom} (×${etat.sac[a.id]})</option>`).join("");
  return `<div class="poste-envoi">
    <input type="text" id="poste-dest" placeholder="Destinataire (pseudo)" maxlength="24">
    <div class="poste-types">
      <label><input type="radio" name="poste-type" value="objet" checked> Objet</label>
      <label><input type="radio" name="poste-type" value="cadeau"> Cadeau</label>
      <label><input type="radio" name="poste-type" value="credits"> Crédits</label>
    </div>
    <div id="poste-bloc-objet">
      ${sac.length?`<select id="poste-item">${opts}</select>
      <input type="number" id="poste-qte" min="1" value="1" title="Quantité" style="max-width:70px"><span class="poste-dispo" id="poste-dispo"></span>
      <input type="number" id="poste-prix" min="0" value="0" title="Prix à payer par le destinataire (0 = gratuit)" placeholder="Prix (0=gratuit)">`
      :`<p class="vide">Ton sac est vide.</p>`}
    </div>
    <div id="poste-bloc-credits" hidden><input type="number" id="poste-montant" min="1" value="100" placeholder="Montant en crédits"></div>
    <p class="itip-gris" id="poste-taxe">Taxe : —</p>
    <button class="mini" id="poste-envoyer-btn">Envoyer</button>
  </div>`;
}

function _brancherPoste(z){
  z.querySelectorAll("[data-pv]").forEach(b=>b.addEventListener("click",()=>{ posteVue=b.dataset.pv; majPoste(); }));
  z.querySelectorAll("[data-recup]").forEach(b=>b.addEventListener("click",()=>posteRecuperer(b.dataset.recup)));
  z.querySelectorAll("[data-refus]").forEach(b=>b.addEventListener("click",()=>posteRefuser(b.dataset.refus)));
  const be=z.querySelector("#poste-envoyer-btn"); if(be) be.addEventListener("click", posteEnvoyer);
  const maj=()=>_majTaxe(z);
  z.querySelectorAll('[name="poste-type"]').forEach(r=>r.addEventListener("change",()=>{
    const t=_posteTypeChoisi(z);
    const bo=z.querySelector("#poste-bloc-objet"), bc=z.querySelector("#poste-bloc-credits");
    if(bo) bo.hidden = (t==="credits"); if(bc) bc.hidden = (t!=="credits");
    const pp=z.querySelector("#poste-prix"); if(pp) pp.style.display = (t==="cadeau")?"none":"";   // cadeau = gratuit
    maj();
  }));
  ["#poste-item","#poste-qte","#poste-montant"].forEach(s=>{ const el=z.querySelector(s); if(el) el.addEventListener("input", maj); });
  maj();
}
function _posteTypeChoisi(z){ const r=z.querySelector('[name="poste-type"]:checked'); return r?r.value:"objet"; }
/* ⚠ On pouvait saisir une quantité supérieure au stock. L'envoi était déjà
   borné (posteEnvoyer ~168), mais la TAXE affichée était calculée sur le
   chiffre saisi : l'aperçu annonçait le prix de 10 objets alors que 3
   partaient. On borne donc à la saisie, et on rappelle le stock à côté. */
function _posteBornerQte(z, id){
  const c = z.querySelector("#poste-qte"); if(!c) return 1;
  const dispo = Math.max(0, (etat.sac && etat.sac[id]) || 0);
  let q = parseInt(c.value, 10);
  if(!Number.isFinite(q) || q < 1) q = 1;
  if(dispo > 0 && q > dispo) q = dispo;
  c.max = dispo || 1;
  if(String(q) !== c.value) c.value = q;
  const d = z.querySelector("#poste-dispo");
  if(d) d.textContent = dispo ? `/ ${dispo}` : "";
  return q;
}

function _taxeObjet(id, qte){ const p=(typeof PRIX_ITEM!=="undefined")?PRIX_ITEM[id]:null; return p?Math.ceil(0.10*(p.moy||0)*qte):0; }
function _majTaxe(z){
  const t=_posteTypeChoisi(z); const el=z.querySelector("#poste-taxe"); if(!el) return;
  if(t==="credits"){ const m=parseInt((z.querySelector("#poste-montant")||{}).value,10)||0; el.innerHTML=`Coût total : <b>${m + Math.ceil(0.10*m)} ₡</b> (${m} + taxe ${Math.ceil(0.10*m)} ₡).`; }
  else { const id=(z.querySelector("#poste-item")||{}).value; const q=_posteBornerQte(z, id); el.innerHTML=`Taxe d'envoi : <b>${_taxeObjet(id,q)} ₡</b> (10 % du prix de base).`; }
}

async function posteEnvoyer(){
  const z=document.querySelector("#poste-vue"); if(!z) return;
  const dest=(z.querySelector("#poste-dest").value||"").trim();
  if(!dest){ journal("Indique un destinataire.","alerte"); return; }
  if(dest===etat.nom){ journal("Tu ne peux pas t'envoyer à toi-même.","alerte"); return; }
  const type=_posteTypeChoisi(z);
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible.","alerte"); return; }
  const aId = (typeof _idDe==="function") ? await _idDe(dest) : null;
  if(!aId){ journal("Destinataire introuvable.","alerte"); return; }
  let p_item=null, p_qte=1, p_montant=0, p_taxe=0;
  if(type==="credits"){
    p_montant=parseInt((z.querySelector("#poste-montant")||{}).value,10)||0;
    if(p_montant<1){ journal("Montant invalide.","alerte"); return; }
  } else {
    p_item=(z.querySelector("#poste-item")||{}).value;
    if(!p_item){ journal("Choisis un objet.","alerte"); return; }
    p_qte=Math.max(1, Math.min(etat.sac[p_item]||0, parseInt((z.querySelector("#poste-qte")||{}).value,10)||1));
    if((etat.sac[p_item]||0) < p_qte){ journal("Tu n'as pas cette quantité.","alerte"); return; }
    p_montant = (type==="objet") ? Math.max(0, parseInt((z.querySelector("#poste-prix")||{}).value,10)||0) : 0;
    p_taxe = _taxeObjet(p_item, p_qte);
  }
  if(typeof pousserCredits==="function") await pousserCredits();
  const { data:res, error } = await sb.rpc("poste_envoyer", { p_a:aId, p_type:type, p_item:p_item, p_qte:p_qte, p_montant:p_montant, p_taxe:p_taxe });
  if(error || !res || !res.ok){
    if(res && res.err==="fonds") journal(`Fonds insuffisants (coût ${res.cout} ₡).`,"alerte");
    else if(res && res.err==="manque") journal(`Tu ne possèdes que ${res.possede}× cet objet.`,"alerte");
    else journal("Envoi impossible.","alerte");
    return;
  }
  // L'objet a quitté le sac DANS la transaction serveur : il est « dans le colis ».
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  if(typeof rechargerCredits==="function") await rechargerCredits();
  const quoi = type==="credits" ? `${p_montant} ₡` : `${p_qte}× ${item(p_item)?item(p_item).nom:p_item}`;
  journal(`Envoyé à ${dest} : ${quoi}${type==="cadeau"?" (cadeau)":""}.`,"poste","poste");
  apresAction(); majPoste();
}

async function posteRecuperer(id){
  const o=_posteCache.find(x=>String(x.id)===String(id)); if(!o) return;
  if(o.statut==="attente" && o.type==="objet" && o.montant>0 && etat.credits < o.montant){ journal(`Il faut ${o.montant} ₡ pour récupérer cet objet.`,"alerte"); return; }
  if(typeof pousserCredits==="function") await pousserCredits();
  const { data:res, error } = await sb.rpc("poste_recuperer", { p_id: Number(id) });
  if(error || !res || !res.ok){
    if(res && res.err==="fonds") journal(`Crédits insuffisants (${res.cout} ₡).`,"alerte");
    else if(res && res.err==="sac_plein") journal("Sac plein — fais de la place avant de récupérer.","alerte");
    else journal("Récupération impossible.","alerte");
    majPoste(); return;
  }
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  if(typeof rechargerCredits==="function") await rechargerCredits();
  // v0.59 : on garde une trace de QUI (expéditeur, ou destinataire pour un retour).
  const deQui = (o.statut==="retour") ? ` (retour de ton envoi à ${o.aNom})` : ` de ${o.deNom}`;
  if(res.type==="credits") journal(`Récupéré${deQui} : ${res.montant} ₡.`,"poste","poste");
  else journal(`Récupéré${deQui} : ${res.quantite}× ${item(res.item)?item(res.item).nom:res.item}`
    + (res.paye?` (payé ${res.paye} ₡)`:"") + (res.partiel?" — le reste attend, sac plein":"") + ".","poste","poste");
  apresAction(); majPoste();
}

async function posteRefuser(id){
  const o=_posteCache.find(x=>String(x.id)===String(id));
  const { data:res, error } = await sb.rpc("poste_refuser", { p_id: Number(id) });
  if(error || !res || !res.ok){ journal("Refus impossible.","alerte"); }
  else journal(`Envoi${o?` de ${o.deNom}`:""} refusé — il retourne à l'expéditeur.`,"poste","poste");
  majPoste();
}

/* Notification (badge sur l'onglet + journal voyant à l'arrivée) */
async function compterPoste(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  const s=await sessionActuelle(); if(!s) return;
  try{ await sb.rpc("poste_purge"); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "poste.js#2"); }
  const { count } = await sb.from("poste").select("id",{count:"exact",head:true})
    .or(`and(a_id.eq.${s.user.id},statut.eq.attente),and(de_id.eq.${s.user.id},statut.eq.retour)`);
  const n=count||0;
  const b=document.querySelector('#hub-nav [data-hub="poste"]');
  if(b) b.innerHTML = "La Poste" + (n>0?` <span style="background:var(--orange,#ff8a3d);color:#0a1020;border-radius:9px;padding:0 6px;font-size:11px;font-weight:700">${n}</span>`:"");
  /* ⚠ v0.63 — au premier passage _postePrec valait -1 : un colis arrivé
     pendant l'absence n'était JAMAIS annoncé. Et le message ne disait ni de qui
     ni quoi. Le détail vient maintenant des événements serveur (déclencheur
     poste_evenement) ; ici on ne garde qu'un rappel s'il reste du courrier. */
  if(_postePrec < 0){ if(n > 0) journal(`${n} envoi(s) t'attendent à La Poste.`,"poste","poste"); }
  else if(n > _postePrec) journal("Tu as du courrier à La Poste !","poste","poste");
  _postePrec=n;
}
