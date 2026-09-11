/* ===========================================================
   MARCHÉ — marché réel PAR FACTION (serveur, dépôt-vente).
   On ne voit/achète que les offres de la faction où l'on se trouve.
   Dépôt : taxe 10 % (serveur), objet retiré du sac. Achat : atomique serveur.
   Les crédits sont autoritatifs côté serveur (colonne profils.credits).
   =========================================================== */
(function(){ if(document.querySelector("#marche-style-inj")) return; const st=document.createElement("style"); st.id="marche-style-inj";
  st.textContent=`.vente-ligne input, .vente-qte, .vente-prix{ background:#0f1830!important; border:1px solid var(--line)!important; border-radius:8px!important; color:var(--texte,#dfe8f2)!important; padding:6px 8px!important; font-family:inherit; }`;
  document.head.appendChild(st); })();
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
let _offresCache = [];
let _marcheMonId = null;
let _estArchitecte = false;

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

/* --- Crédits autoritatifs serveur --- */
async function _syncCredits(){
  if(typeof pousserCredits==="function"){ const av=etat.credits; await pousserCredits(); if(etat.credits!==av && typeof afficher==="function") afficher(); }
}
async function _chargerOffres(faction){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return [];
  const { data, error } = await sb.from("offres").select("*").eq("faction", faction).order("prix",{ascending:true}).limit(300);
  if(error){ console.warn("[marche]", error.message); return []; }
  const rows=data||[]; const ids=[...new Set(rows.map(o=>o.vendeur_id))];
  const noms={}; if(ids.length){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",ids); for(const p of (pubs||[])) noms[p.id]=p.nom; }
  return rows.map(o=>({ ...o, vendeurNom: noms[o.vendeur_id]||"(inconnu)" }));
}

/* --- Rendu --- */
async function renderMarche(){
  if(typeof cacherItemTip==="function") cacherItemTip();
  const z = document.querySelector("#marche-vue"); if(!z) return;
  const faction = marcheFaction();
  if(!faction){ z.innerHTML = `<p class="vide">Rends-toi dans une <b>ville de faction</b> (onglet Planète) pour accéder à son marché. Chaque faction a le sien.</p>`; return; }
  z.innerHTML = `<p class="vide">Chargement du marché…</p>`;
  const s=(typeof sessionActuelle==="function")?await sessionActuelle():null; _marcheMonId=s?s.user.id:null;
  try{ const {data}=await sb.from("gouvernement").select("profil_id").eq("faction",etat.faction).eq("role","architecte").maybeSingle(); _estArchitecte=!!(data && data.profil_id===_marcheMonId); }catch(e){ _estArchitecte=false; }
  await _syncCredits();
  _offresCache = await _chargerOffres(faction);
  const fc = FACTIONS.find(f=>f.id===faction);
  const mesN = _offresCache.filter(o=>o.vendeur_id===_marcheMonId).length;
  let html = `<div class="marche-tete"><h3 style="color:${fc.couleur};margin:0">Marché — ${fc.nom}</h3>`
    + `<span class="actions" style="gap:6px"><button class="mini" id="marche-mesventes-btn">Mes ventes${mesN?` (${mesN})`:""}</button><button class="mini" id="marche-vendre-btn">Mettre en vente</button></span></div>`;
  html += `<div class="marche-tabs">` + CAT_MARCHE.map(c=>`<button class="marche-tab${c.id===marcheTab?" actif":""}" data-cat="${c.id}">${c.nom}</button>`).join("") + `</div>`;
  const achat = _offresCache.filter(o=>o.vendeur_id!==_marcheMonId && categorieMarche(o.item_id)===marcheTab);
  html += `<div class="marche-liste">`;
  if(!achat.length) html += `<p class="vide">Aucun objet en vente dans cette catégorie.</p>`;
  /* ⚠ UNE SEULE LIGNE PAR OBJET, tous vendeurs et tous prix confondus. Le
     marché affichait autant de lignes qu'il y avait de lots, ce qui donnait
     plusieurs « Couteau de survie » d'affilée et rendait la comparaison
     impossible.
     L'offre mise en avant — et celle qu'achète le bouton — est la MOINS
     CHÈRE ; à prix égal, la PLUS ANCIENNEMENT déposée. Le tri est donc
     prix croissant, puis date de dépôt croissante.
     ⚠ On ne fusionne pas les lots eux-mêmes : acheter_offre() prend
     l'identifiant d'UN lot et l'achète en entier. Le bouton dit donc combien
     d'unités il rapporte. */
  const _grp = {}; const _ordre = [];
  for(const o of achat){
    if(!_grp[o.item_id]){ _grp[o.item_id] = []; _ordre.push(o.item_id); }
    _grp[o.item_id].push(o);
  }
  for(const iid of _ordre){
    const lots = _grp[iid].sort((a,b) =>
      (a.prix - b.prix) || (new Date(a.cree_le) - new Date(b.cree_le)));
    const o = lots[0];                                   // la moins chère, la plus ancienne à égalité
    const total = lots.reduce((s,x) => s + x.quantite, 0);
    const pmax = lots[lots.length-1].prix;
    const p = PRIX_ITEM[iid] || {};
    const cls = o.prix < p.moy ? "prix-bas" : (o.prix > p.moy ? "prix-haut" : "prix-moyen");
    const detail = lots.length > 1
      ? `${total} en vente · ${lots.length} offres de ${o.prix} à ${pmax} ₡ · moy ${p.moy||"?"} ₡`
      : `${o.quantite} en vente · ${echapper(o.vendeurNom||"?")} · moy ${p.moy||"?"} ₡`;
    html += `<div class="marche-ligne" data-item="${iid}"><span class="marche-ic">${iconeItem(iid)}</span>`
      + `<span class="marche-nom">${item(iid).nom}<span class="qte">${detail}</span></span>`
      + `<span class="marche-prix ${cls}">${o.prix} ₡</span>`
      + `<button class="mini" data-acheter="${o.id}" title="Vendu par ${echapper(o.vendeurNom||"?")}">Acheter${o.quantite>1?` ×${o.quantite}`:""}</button>${_estArchitecte?`<button class="mini" data-acheterfac="${o.id}" title="Payé par la caisse, va dans la réserve de faction">Pour la faction</button>`:""}</div>`;
  }
  html += `</div>`;
  z.innerHTML = html;
  if(typeof brancherTips==="function") brancherTips(z);
  z.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>{ marcheTab=b.dataset.cat; renderMarche(); }));
  z.querySelectorAll("[data-acheter]").forEach(b=>b.addEventListener("click",()=>acheterOffre(b.dataset.acheter)));
  z.querySelectorAll("[data-acheterfac]").forEach(b=>b.addEventListener("click",()=>acheterOffreFaction(b.dataset.acheterfac)));
  const vb = z.querySelector("#marche-vendre-btn"); if(vb) vb.addEventListener("click", ouvrirVente);
  const mb = z.querySelector("#marche-mesventes-btn"); if(mb) mb.addEventListener("click", ouvrirMesVentes);
}

/* --- Acheter (atomique serveur) --- */
async function acheterOffre(offreId){
  const o = _offresCache.find(x=>String(x.id)===String(offreId)); if(!o) return;
  if(typeof estVaisseau==="function" && estVaisseau(o.item_id) && !etat.permisVaisseau){ journal("Achat de vaisseau verrouillé : permis de vaisseau requis (quête à venir).","alerte"); return; }
  if(placesLibres() < 1){ journal("Sac plein.","alerte"); return; }
  const { data:res, error } = await rpcAvecSolde("acheter_offre", { offre: Number(offreId) });
  if(error || !res || !res.ok){
    const err=res&&res.err;
    if(err==="fonds") journal("Crédits insuffisants.","alerte");
    else if(err==="introuvable") journal("Cette offre n'est plus disponible.","alerte");
    else if(err==="soi") journal("C'est ta propre offre.","alerte");
    else if(err==="sac_plein") journal("Sac plein — fais de la place avant d'acheter.","alerte");
    else journal("Achat impossible.","alerte");
    renderMarche(); return;
  }
  // L'objet est livré DANS la transaction serveur : on ne fait qu'appliquer l'état renvoyé.
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  // Solde déjà appliqué par rpcAvecSolde (écart local en attente conservé).
  journal(`Acheté : ${res.quantite}× ${item(res.item).nom} — ${res.cout} ₡.`,"gain");
  apresAction(); renderMarche();
}

async function acheterOffreFaction(offreId){
  const { data:res, error } = await sb.rpc("acheter_offre_faction", { offre: Number(offreId) });
  if(error || !res || !res.ok){
    const e=res&&res.err;
    if(e==="caisse") journal(`Caisse insuffisante (${res.cout} ₡).`,"alerte");
    else if(e==="reserve_pleine") journal("Réserve de faction pleine (50).","alerte");
    else if(e==="pas_architecte") journal("Réservé à l'Architecte.","alerte");
    else if(e==="introuvable") journal("Offre indisponible.","alerte");
    else journal("Achat faction impossible.","alerte");
    renderMarche(); return;
  }
  journal(`Acheté pour la faction : ${item(res.item)?item(res.item).nom:res.item} — ${res.cout} ₡ (caisse).`,"gain");
  renderMarche();
}

/* --- Mettre en vente (dépôt-vente, taxe serveur) --- */
async function mettreEnVente(id, prix, qte){
  const faction = marcheFaction(); if(!faction){ journal("Va dans une ville de faction pour vendre.","alerte"); return; }
  const dispo = etat.sac[id]||0; if(dispo <= 0) return;
  const p = PRIX_ITEM[id]; if(!p){ journal("Cet objet n'a pas de valeur de marché.","alerte"); return; }
  qte  = Math.max(1, Math.min(dispo, Math.floor(qte||1)));
  prix = Math.max(p.min, Math.min(p.max, Math.round(prix||p.moy)));
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible.","alerte"); return; }
  const { data:res, error } = await rpcAvecSolde("deposer_offre", { p_faction:faction, p_item:id, p_qte:qte, p_prix:prix });
  if(error || !res || !res.ok){
    if(res && res.err==="taxe") journal(`Taxe de ${res.taxe} ₡ — crédits insuffisants.`,"alerte");
    else if(res && res.err==="manque") journal(`Tu ne possèdes que ${res.possede}× cet objet.`,"alerte");
    else journal("Mise en vente impossible.","alerte");
    return;
  }
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  if(etat.pas) etat.pas.vendu=true;   // solde déjà appliqué par rpcAvecSolde
  journal(`Mis en vente à ${FACTIONS.find(f=>f.id===faction).nom} : ${qte}× ${item(id).nom} à ${prix} ₡ (taxe ${res.taxe} ₡).`,"gain");
  apresAction(); renderMarche(); ouvrirVente();
}

/* --- Retirer une de ses offres (rend le lot ; taxe non remboursée) --- */
async function retirerOffre(offreId){
  const o = _offresCache.find(x=>String(x.id)===String(offreId)); if(!o) return;
  const { data:res, error } = await sb.rpc("retirer_offre", { offre: Number(offreId) });
  if(error || !res || !res.ok){
    if(res && res.err==="sac_plein") journal("Sac plein — libère de la place pour récupérer ce lot.","alerte");
    else journal("Retrait impossible.","alerte");
    renderMarche(); return;
  }
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  journal(`Retiré du marché : ${res.quantite}× ${item(res.item).nom}`
    + (res.partiel ? " (le reste attend : sac plein)" : "") + " — taxe non remboursée.","alerte");
  // ⚠ renderMarche() recharge les offres depuis le serveur : sans await, la
  // modale « Mes ventes » se redessinait sur le cache d'avant le retrait.
  apresAction(); await renderMarche(); ouvrirMesVentes();
}

/* --- Modale : mise en vente --- */
let _venteMonte = false;
function monterVenteModal(){ if(_venteMonte) return; const m=document.createElement("div"); m.id="marche-vente"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) m.hidden=true; }); _venteMonte=true; }
function ouvrirVente(){
  const faction = marcheFaction(); if(!faction) return;
  monterVenteModal();
  const m = document.querySelector("#marche-vente");
  const vendables = TOUS_ITEMS.filter(a=>(etat.sac[a.id]||0)>0 && PRIX_ITEM[a.id]);
  let html = `<div class="picker-cadre"><div class="picker-tete"><b>Mettre en vente — ${FACTIONS.find(f=>f.id===faction).nom}</b><button class="mini" data-fermer="1">Fermer</button></div>`;
  html += `<p class="vide" style="margin:0 0 8px"><b>Taxe : ${(typeof aptPris==="function" && aptPris("no2")) ? "5 % du prix total (Marchand)" : "10 % du prix total"}</b>, prélevée à la mise en vente (non remboursée). L'objet quitte ton sac.</p>`;
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
  const mes = _offresCache.filter(o=>o.vendeur_id===_marcheMonId).sort((a,b)=> item(a.item_id).nom.localeCompare(item(b.item_id).nom) || a.prix-b.prix);
  let html = `<div class="picker-cadre"><div class="picker-tete"><b>Mes ventes — ${FACTIONS.find(f=>f.id===faction).nom}</b><button class="mini" data-fermer="1">Fermer</button></div>`;
  html += `<p class="vide" style="margin:0 0 8px">Retirer une offre te rend l'objet. La taxe déjà payée n'est pas remboursée.</p>`;
  if(!mes.length) html += `<p class="vide">Tu n'as rien en vente ici.</p>`;
  for(const o of mes){
    html += `<div class="vente-ligne" data-item="${o.item_id}"><span class="picker-ic">${iconeItem(o.item_id)}</span>`
      + `<span class="picker-nom"><b>${item(o.item_id).nom}</b> <span class="qte">×${o.quantite} à ${o.prix} ₡</span></span>`
      + `<button class="mini danger" data-retirer="${o.id}">Retirer</button></div>`;
  }
  html += `</div>`;
  m.innerHTML = html; m.hidden = false;
  if(typeof brancherTips==="function") brancherTips(m);
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
  m.querySelectorAll("[data-retirer]").forEach(b=>b.addEventListener("click",()=>retirerOffre(b.dataset.retirer)));
}
