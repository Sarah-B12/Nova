/* ===========================================================
   LA POSTE — envoi entre joueurs (objet / cadeau / crédits).
   Serveur : fonctions poste_envoyer / poste_recuperer / poste_refuser / poste_purge.
   Délais : 3 j chez le destinataire → retour 3 j chez l'expéditeur → suppression.
   Taxe non remboursée. Crédits autoritatifs serveur (resynchro après chaque op).
   =========================================================== */
(function(){ if(document.querySelector("#poste-style")) return;
  const st=document.createElement("style"); st.id="poste-style";
  st.textContent=`
    /* v0.76 : mêmes onglets que Terrain et Le Centre (.sous-menu/.sous-lien,
       définis dans css/terrain.css) — plus de style propre à la Poste. */
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
    /* v1.02 — chaque chiffre a son étiquette (retour testeur : « 1 / 1 » et « 0 »
       côte à côte, sans rien dire de ce qu'ils étaient). */
    .poste-champs{ display:flex; flex-wrap:wrap; gap:10px; margin-top:9px; }
    .poste-champ{ display:flex; flex-direction:column; gap:4px; flex:1 1 140px; min-width:0; font-size:12px; color:var(--sourdine); }
    .poste-champ.qte{ flex:0 1 130px; }
    .poste-champ-titre{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .poste-champ-note{ font-size:11px; opacity:.85; min-height:14px; }
    .poste-types{ display:flex; flex-wrap:wrap; gap:12px; }
    .poste-types label{ display:flex; align-items:center; gap:7px; cursor:pointer; font-size:14px; white-space:nowrap; }
    .poste-dispo{ font-family:"Space Mono",monospace; font-size:11px; color:var(--sourdine); }
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

/* v1.11 — PERTURBATIONS DU RÉSEAU. Cinq jours par mois, tirés au hasard et sans
   prévenir : 48 h avant qu'un envoi soit retirable, et taxe triplée. L'état
   vient du serveur (`poste_perturbee`) ; le client ne fait que l'afficher.
   ⚠ La taxe envoyée au serveur reste le BARÈME NORMAL (`p_taxe`) : c'est
   `poste_envoyer` qui multiplie. Ici, on ne multiplie que l'AFFICHAGE. */
let _postePert = null;
let _posteAvertiSession = false;
function _postePerturbee(){ return !!(_postePert && _postePert.active); }
function _posteMultTaxe(){ return _postePerturbee() ? (_postePert.taxe_mult||3) : 1; }
function _posteBanniere(){
  if(!_postePerturbee())
    return `<img src="images/poste.png" alt="La Poste" class="hub-banniere" onerror="this.remove()">`;
  /* L'image perturbée peut ne pas être encore déposée : le bandeau de repli
     dit la même chose, pour qu'on ne prenne jamais ça pour une panne. */
  return `<img src="images/poste_perturbee.png" alt="La Poste — perturbations" class="hub-banniere" onerror="this.remove()">
    <div class="poste-perturb">
      <div class="poste-perturb-titre">⚠ PERTURBATIONS DU RÉSEAU</div>
      <p>Les relais dérivent. Pendant <b>5 jours</b>, tout ce que tu envoies met <b>48 h</b> à arriver chez le destinataire, et la <b>taxe est triplée</b>.</p>
      <p>Pour ce qui presse, passe par le <b>marché</b> : il est ouvert et immédiat.</p>
    </div>`;
}

async function _chargerPoste(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return [];
  const s=await sessionActuelle(); if(!s) return []; _posteMonId=s.user.id;
  try{ await sb.rpc("poste_purge"); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "poste.js#1"); }
  try{ const { data } = await sb.rpc("poste_perturbee"); _postePert = data || null; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "poste.js#pert"); }
  if(_postePerturbee() && !_posteAvertiSession){
    _posteAvertiSession = true;
    journal("La Poste est perturbée : 48 h de retard sur les envois et taxe triplée. Le marché, lui, reste immédiat.","alerte");
  }
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
  if((typeof surBase==="function") && surBase())
    h += `<p class="vide" style="border-left:3px solid var(--orange);padding-left:10px">Poste du Perchoir : tout part en vaisseau. La taxe sur les <b>objets</b> est de <b>15 %</b> au lieu de 5 %.</p>`;
  h += `<p class="itip-gris" style="margin:0 0 10px">Le destinataire a <b>3 jours</b> pour récupérer ou refuser. Sinon, l'envoi <b>retourne à l'expéditeur</b> (3 jours de plus pour le récupérer). Passé ce délai, tout est <b>supprimé</b>. La taxe n'est jamais remboursée.</p>`;
  h += `<div class="sous-menu"><button class="sous-lien${posteVue==="boite"?" actif":""}" data-pv="boite">Boîte${(recus.length+retours.length)?` (${recus.length+retours.length})`:""}</button><button class="sous-lien${posteVue==="envoyer"?" actif":""}" data-pv="envoyer">Envoyer</button></div>`;
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

function _posteEnRoute(o){ return !!(o.dispo_le && new Date(o.dispo_le).getTime() > Date.now()); }   // v1.11
function _ligneRecu(o){
  const quand = (typeof _dateHeure==="function") ? _dateHeure(o.echeance) : "";
  if(_posteEnRoute(o)){
    const quoi = o.type==="credits" ? `<b>${o.montant} ₡</b>`
      : (o.type==="cadeau" ? "🎁 un <b>cadeau</b>" : `<b>${item(o.item_id)?item(o.item_id).nom:o.item_id}</b> ×${o.quantite}`);
    return `<div class="poste-ligne"><span class="poste-txt">${quoi} de <b>${echapper(o.deNom||"?")}</b> — <b>en route</b><span class="itip-gris" style="display:block;font-size:11px">réseau perturbé : disponible dans ${_resteAvant(o.dispo_le)}</span></span></div>`;
  }
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
  const sac = TOUS_ITEMS.filter(a=>(etat.sac[a.id]||0)>0 && !(typeof estObjetLie==="function" && estObjetLie(a.id)));   // v0.97
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
      <div class="poste-champs">
        <label class="poste-champ qte"><span class="poste-champ-titre">Quantité</span>
          <input type="number" id="poste-qte" min="1" value="1" inputmode="numeric">
          <span class="poste-champ-note poste-dispo" id="poste-dispo"></span></label>
        <label class="poste-champ" id="poste-prix-lbl"><span class="poste-champ-titre">Prix à payer (₡)</span>
          <input type="number" id="poste-prix" min="0" value="0" inputmode="numeric">
          <span class="poste-champ-note">payé par le destinataire · 0 = gratuit</span></label>
      </div>`
      :`<p class="vide">Ton sac est vide.</p>`}
    </div>
    <div id="poste-bloc-credits" hidden><label class="poste-champ"><span class="poste-champ-titre">Montant à envoyer (₡)</span>
      <input type="number" id="poste-montant" min="1" value="100" inputmode="numeric"></label></div>
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
    const pp=z.querySelector("#poste-prix-lbl"); if(pp) pp.style.display = (t==="cadeau")?"none":"";   // cadeau = gratuit
    maj();
  }));
  ["#poste-item","#poste-qte","#poste-montant"].forEach(s=>{ const el=z.querySelector(s); if(el) el.addEventListener("input", maj); });
  /* ⚠ `change` et `blur` SEULEMENT : c'est là qu'on a le droit de corriger la
     saisie. `_posteFige` dit à `_majTaxe` qu'il peut écrire dans le champ.
     Le changement d'objet borne aussi, puisque le stock disponible change. */
  const q=z.querySelector("#poste-qte");
  if(q){ ["change","blur"].forEach(ev=>q.addEventListener(ev,()=>{ _posteFige=true; maj(); _posteFige=false; })); }
  const it=z.querySelector("#poste-item");
  if(it) it.addEventListener("change",()=>{ _posteFige=true; maj(); _posteFige=false; });
  _posteFige=true; maj(); _posteFige=false;
}
let _posteFige = false;   // v0.93 : vrai uniquement quand on a le droit d'écrire dans #poste-qte
function _posteTypeChoisi(z){ const r=z.querySelector('[name="poste-type"]:checked'); return r?r.value:"objet"; }
/* ⚠ On pouvait saisir une quantité supérieure au stock. L'envoi était déjà
   borné (posteEnvoyer ~168), mais la TAXE affichée était calculée sur le
   chiffre saisi : l'aperçu annonçait le prix de 10 objets alors que 3
   partaient. On borne donc à la saisie, et on rappelle le stock à côté. */
/* ⚠⚠ v0.93 — ON NE CORRIGE PAS UN CHAMP PENDANT QU'ON ÉCRIT DEDANS.
   La version précédente réécrivait la valeur à CHAQUE frappe. En effaçant le
   champ pour saisir autre chose, `c.value` valait "", `q` retombait à 1, et la
   ligne d'écriture remettait aussitôt « 1 » dans le champ. Chaque chiffre tapé
   venait donc se coller derrière : taper « 2 » donnait « 12 », aussitôt borné
   au stock. Le joueur voyait la totalité de son sac quoi qu'il tape, et ne
   pouvait plus envoyer 2 ou 3 unités.
   C'est le correctif du piège n°6 (saisie supérieure au stock) qui a créé
   celui-ci : la borne est juste, le MOMENT où on l'appliquait ne l'était pas.

   `ecrire` sépare les deux usages :
     · à la frappe (`input`)  → on CALCULE pour l'aperçu de taxe, sans toucher
       au champ. Un champ vide vaut 1 pour l'aperçu, et reste vide à l'écran.
     · à la validation (`change`, `blur`) → là seulement on borne et on écrit,
       quand la personne a fini sa phrase. */
function _posteBornerQte(z, id, ecrire){
  const c = z.querySelector("#poste-qte"); if(!c) return 1;
  const dispo = Math.max(0, (etat.sac && etat.sac[id]) || 0);
  let q = parseInt(c.value, 10);
  if(!Number.isFinite(q) || q < 1) q = 1;
  if(dispo > 0 && q > dispo) q = dispo;
  c.max = dispo || 1;
  if(ecrire && String(q) !== c.value) c.value = q;
  const d = z.querySelector("#poste-dispo");
  if(d) d.textContent = dispo ? `${dispo} dans le sac` : "";   // v1.02 : « / 1 » ne disait rien
  return q;
}

/* v0.87 — depuis le Perchoir (Triptolème), tout transite par un vaisseau : la taxe
   passe de 10 % à 25 %. Une seule constante, reprise par l'affichage ET par
   l'envoi, pour qu'ils ne divergent jamais. */
/* v0.91 — taxes revues à la baisse : 10 % → 5 % sur Silène, 25 % → 15 % depuis
   Triptolème. L'écart entre les deux reste net (le triple), mais l'envoi cesse
   d'être dissuasif au point que personne ne s'en serve. */
function tauxPoste(){ return ((typeof surBase==="function") && surBase()) ? 0.15 : 0.05; }
function _taxeObjet(id, qte){ const p=(typeof PRIX_ITEM!=="undefined")?PRIX_ITEM[id]:null; return p?Math.ceil(tauxPoste()*(p.moy||0)*qte):0; }
function _majTaxe(z){
  const t=_posteTypeChoisi(z); const el=z.querySelector("#poste-taxe"); if(!el) return;
  /* v0.91 — la réserve de la v0.87 est levée : `poste_envoyer` lit désormais
     `profils.secteur` et applique le MÊME barème aux crédits qu'aux objets
     (5 % au sol, 15 % depuis Triptolème). L'affichage peut donc enfin dire vrai
     dans les deux cas.
     ⚠ Le client ne transmet toujours pas la taxe sur les crédits (p_taxe:0) :
     c'est le serveur qui la calcule. `tauxPoste()` ne sert qu'à l'AFFICHAGE —
     les deux barèmes doivent rester d'accord, ici et dans le SQL. */
  if(t==="credits"){ const m=parseInt((z.querySelector("#poste-montant")||{}).value,10)||0;
    const tx=Math.ceil(tauxPoste()*m)*_posteMultTaxe();   // v1.11 : affichage triplé si perturbé
    el.innerHTML=`Coût total : <b>${m + tx} ₡</b> (${m} + taxe ${tx} ₡, soit ${Math.round(tauxPoste()*100)*_posteMultTaxe()} %)${_postePerturbee()?" — <b>taxe triplée</b> (réseau perturbé)":""}.`; }
  else { const id=(z.querySelector("#poste-item")||{}).value; const q=_posteBornerQte(z, id, !!_posteFige);
    const tx=_taxeObjet(id,q)*_posteMultTaxe();   // v1.11 : affichage triplé si perturbé
    el.innerHTML=`Taxe d'envoi : <b>${tx} ₡</b> (${Math.round(tauxPoste()*100)*_posteMultTaxe()} % du prix de base)${_postePerturbee()?" — <b>taxe triplée</b>, colis remis dans 48 h (réseau perturbé)":""}.`; }
}

async function posteEnvoyer(){
  if(refusPrison("envoyer un colis")) return;
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
  if(res && res.err==="en_transit"){ journal(`Ce colis est encore en route (réseau perturbé) : disponible dans ${_resteAvant(res.dispo_le)}.`,"alerte"); return; }   // v1.11
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
