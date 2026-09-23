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
  /* ⚠ v0.94 — le Biogel N'EST PAS un consommable : c'est un INTERMÉDIAIRE
     (3 Nectine → 1 Biogel), ingrédient du Kit de soin, du Biocarburant, du
     Stimulant, de l'Antidote et du Drone de récolte. Il n'a aucune entrée dans
     `EFFET_CONSO`, donc il s'affichait dans l'onglet Consommables sans pouvoir
     être consommé. Il part en « Composants & pièces », avec les autres
     intermédiaires. ⚠ Ne pas confondre avec le Biocarburant, qui reste en
     « Matières bio » (il sert de carburant de vaisseau). */
  if(it.type==="conso" || /oxygène|oxygene|soin|ration|stimulant|antidote|tank/.test(n)) return "conso";
  if(it.cat==="plante" || it.cat==="organique" || it.cat==="animal" || /sylve|biofibre|biocarburant|\bfil\b|prot[eé]ine|nectine|sporelle|ferragave|filaine|cuir/.test(n)) return "bio";
  return "composants";
}
function marcheFaction(){ return (typeof villeActuelle==="function") ? villeActuelle() : null; }

/* ⚠⚠ v0.94 — LE MARCHÉ VENDAIT DES CADAVRES.
   `deposer_offre` garde la date du lot (`offres.acquis_le`) et `acheter_offre`
   la rend telle quelle à l'acheteur : « l'objet continue de vieillir en
   vitrine », « pas de blanchiment par le marché ». L'intention est juste.
   Mais RIEN ne retirait les offres périmées — `nova_purges` ne touchait pas à
   `offres` — et le marché n'affichait aucune fraîcheur. Une Ferragave (5 j)
   déposée il y a une semaine restait en vente, se payait plein tarif, et
   mourait dans le sac de l'acheteur à la synchro suivante. Le vendeur gardait
   les crédits. C'est ce qui a coûté ses Ferragave à un testeur.
   Le serveur purge désormais (brique 2) ; ici on AFFICHE le temps restant et
   on refuse ce qui est mort, pour la fenêtre entre deux purges.
   ⚠ `acquis_le` est déjà renvoyé : `_chargerOffres` fait un `select("*")`.
   ⚠ La durée reste dans `usure.js` — SOURCE UNIQUE. Le serveur ne stocke
     qu'une date, il n'apprend aucun barème. */
function _offreJours(o){
  if(!o || !o.acquis_le || typeof dureeVie!=="function") return null;
  const t0 = new Date(o.acquis_le).getTime();
  if(!isFinite(t0)) return null;
  return (t0 + dureeVie(o.item_id)*JOUR_MS - Date.now()) / JOUR_MS;
}
function _offreMorte(o){ const j=_offreJours(o); return j!=null && j<=0; }
// Badge « 3 j » / « <1 j », dans les couleurs déjà utilisées pour l'usure.
function _offreBadge(o){
  const j = _offreJours(o); if(j==null) return "";
  const cls = j<1 ? "usure-critique" : (j<3 ? "usure-basse" : "");
  return ` <span class="picker-usure ${cls}">${j<1 ? "<1" : Math.floor(j)} j</span>`;
}

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
/* ⚠ v0.94 — ACHETER EN BAS DE PAGE REMONTAIT LA VUE. `renderMarche()` remplace
   tout `#marche-vue`, en passant par un « Chargement… » qui fait s'effondrer la
   hauteur : le navigateur n'a plus rien à quoi accrocher le défilement et
   revient en haut. Acheter deux fois le même objet obligeait à redescendre.
   On mémorise la position AVANT, on la rend APRÈS, et on ne montre le
   « Chargement… » que si la vue est vide (premier affichage). */
function _marcheGardeScroll(){
  const z = document.querySelector("#marche-vue");
  const conteneurs = [];
  let n = z && z.parentElement;
  while(n && n !== document.body){
    if(n.scrollHeight > n.clientHeight + 4) conteneurs.push([n, n.scrollTop]);
    n = n.parentElement;
  }
  const y = window.scrollY || 0;
  // Après un innerHTML, la hauteur n'est rétablie qu'à la frame suivante.
  return () => requestAnimationFrame(()=>{
    conteneurs.forEach(([c,t])=>{ c.scrollTop = t; });
    if(y) window.scrollTo(0, y);
  });
}

/* ⚠ v1.05 — LA CAISSE NE PAIE QUE CE QUI SERT À LA DÉFENSE (retour testeur :
   l'Architecte pouvait acheter n'importe quoi avec l'argent de la faction).
   La liste de référence est `defense_recettes` : tout composant qui entre dans
   un objet de défense, et rien d'autre. Elle est lue une fois par page.
   ⚠ Ceinture côté serveur à ajouter dans `acheter_offre_faction` : sans elle,
   la console du navigateur contourne ce filtre (BACKEND_PLAN, à faire). */
let _composantsDefense = null;
async function _chargerComposantsDefense(){
  try{
    const { data } = await sb.from("defense_recettes").select("composant_id");
    _composantsDefense = new Set((data||[]).map(r=>r.composant_id));
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "marche.js#composants"); }
}
function _utileALaDefense(id){ return !!(_composantsDefense && _composantsDefense.has(id)); }

async function renderMarche(){
  if(typeof cacherItemTip==="function") cacherItemTip();
  const z = document.querySelector("#marche-vue"); if(!z) return;
  const _rendreScroll = _marcheGardeScroll();
  const faction = marcheFaction();
  if(!faction){ z.innerHTML = `<p class="vide">Rends-toi dans une <b>ville de faction</b> (onglet Planète) pour accéder à son marché. Chaque faction a le sien.</p>`; return; }
  if(!z.innerHTML.trim()) z.innerHTML = `<p class="vide">Chargement du marché…</p>`;   // v0.94 : pas d'effondrement en cours de route
  const s=(typeof sessionActuelle==="function")?await sessionActuelle():null; _marcheMonId=s?s.user.id:null;
  if(!_composantsDefense) await _chargerComposantsDefense();   // v1.05 : une fois par page
  try{ const {data}=await sb.from("gouvernement").select("profil_id").eq("faction",etat.faction).eq("role","architecte").maybeSingle(); _estArchitecte=!!(data && data.profil_id===_marcheMonId); }catch(e){ _estArchitecte=false; }
  await _syncCredits();
  _offresCache = await _chargerOffres(faction);
  const fc = FACTIONS.find(f=>f.id===faction);
  const mesN = _offresCache.filter(o=>o.vendeur_id===_marcheMonId).length;
  let html = `<div class="marche-tete"><h3 style="color:${fc.couleur};margin:0">Marché — ${fc.nom}</h3>`
    + `<span class="actions" style="gap:6px"><button class="mini" id="marche-mesventes-btn">Mes ventes${mesN?` (${mesN})`:""}</button><button class="mini" id="marche-vendre-btn">Mettre en vente</button></span></div>`;
  html += `<div class="marche-tabs">` + CAT_MARCHE.map(c=>`<button class="marche-tab${c.id===marcheTab?" actif":""}" data-cat="${c.id}">${c.nom}</button>`).join("") + `</div>`;
  // ⚠ v0.94 : les offres mortes ne s'achètent plus. Elles disparaîtront à la
  // purge horaire ; d'ici là, elles ne doivent ni s'afficher ni se vendre.
  const achat = _offresCache.filter(o=>o.vendeur_id!==_marcheMonId && categorieMarche(o.item_id)===marcheTab && !_offreMorte(o));
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
      /* v0.64 — le bouton affichait « Acheter ×40 » alors qu'acheter_offre ne
         vend QU'UNE unité : on croyait devoir prendre tout le lot. Le stock
         disponible reste ici, le bouton dit « Acheter 1 », et le prix est à
         l'unité. */
      ? `${total} en vente · ${lots.length} offres de ${o.prix} à ${pmax} ₡ l'unité · moy ${p.moy||"?"} ₡`
      : `${o.quantite} en vente par ${echapper(o.vendeurNom||"?")} · ${o.prix} ₡ l'unité · moy ${p.moy||"?"} ₡`;
    // v0.94 : `data-jours` porte l'échéance de CETTE offre — sans lui,
    // l'infobulle affichait la durée de vie à neuf (l'objet n'est pas au sac).
    const _j = _offreJours(o);
    html += `<div class="marche-ligne" data-item="${iid}"${_j!=null?` data-jours="${_j.toFixed(3)}"`:""}><span class="marche-ic">${iconeItem(iid)}</span>`
      + `<span class="marche-nom">${item(iid).nom}${_offreBadge(o)}<span class="qte">${detail}</span></span>`
      + `<span class="marche-prix ${cls}">${o.prix} ₡</span>`
      + `<button class="mini" data-acheter="${o.id}" title="Vendu par ${echapper(o.vendeurNom||"?")} — ${o.prix} ₡ l'unité${o.quantite>1?` (${o.quantite} dispo)`:""}">Acheter 1</button>${(_estArchitecte && _utileALaDefense(iid))?`<button class="mini" data-acheterfac="${o.id}" title="Payé par la caisse, va dans la réserve de faction">Pour la faction</button>`:""}</div>`;
  }
  html += `</div>`;
  z.innerHTML = html;
  if(typeof brancherTips==="function") brancherTips(z);
  z.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>{ marcheTab=b.dataset.cat; renderMarche(); }));
  z.querySelectorAll("[data-acheter]").forEach(b=>b.addEventListener("click",()=>acheterOffre(b.dataset.acheter)));
  z.querySelectorAll("[data-acheterfac]").forEach(b=>b.addEventListener("click",()=>acheterOffreFaction(b.dataset.acheterfac)));
  const vb = z.querySelector("#marche-vendre-btn"); if(vb) vb.addEventListener("click", ouvrirVente);
  const mb = z.querySelector("#marche-mesventes-btn"); if(mb) mb.addEventListener("click", ouvrirMesVentes);
  _rendreScroll();
}

/* --- Acheter (atomique serveur) --- */
async function acheterOffre(offreId){
  if(refusPrison("acheter")) return;
  const o = _offresCache.find(x=>String(x.id)===String(offreId)); if(!o) return;
  if(typeof estVaisseau==="function" && estVaisseau(o.item_id) && !etat.permisVaisseau){ journal("Achat de vaisseau verrouillé : permis de vaisseau requis (quête à venir).","alerte"); return; }
  /* ⚠ v0.94 — dernier filet avant l'achat : le cache a pu vieillir pendant que
     la fenêtre restait ouverte, et le lot mourrait dans le sac à la synchro
     suivante, crédits perdus. */
  if(_offreMorte(o)){ journal("Ce lot est périmé : il va être retiré du marché.","alerte"); renderMarche(); return; }
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
  if(refusPrison("acheter")) return;
  const { data:res, error } = await sb.rpc("acheter_offre_faction", { offre: Number(offreId) });
  if(error || !res || !res.ok){
    const e=res&&res.err;
    if(e==="caisse") journal(`Caisse insuffisante (${res.cout} ₡).`,"alerte");
    else if(e==="reserve_pleine") journal("Réserve de faction pleine (50).","alerte");
    else if(e==="pas_architecte") journal("Réservé à l'Architecte.","alerte");
    else if(e==="pas_defense") journal("La caisse ne paie que les composants qui entrent dans un objet de défense.","alerte");
    else if(e==="introuvable") journal("Offre indisponible.","alerte");
    else journal("Achat faction impossible.","alerte");
    renderMarche(); return;
  }
  journal(`Acheté pour la faction : ${item(res.item)?item(res.item).nom:res.item} — ${res.cout} ₡ (caisse).`,"gain");
  renderMarche();
}

/* --- Mettre en vente (dépôt-vente, taxe serveur) --- */
async function mettreEnVente(id, prix, qte){
  if(refusPrison("mettre en vente")) return;
  const faction = marcheFaction(); if(!faction){ journal("Va dans une ville de faction pour vendre.","alerte"); return; }
  const dispo = etat.sac[id]||0; if(dispo <= 0) return;
  const p = PRIX_ITEM[id]; if(!p){ journal("Cet objet n'a pas de valeur de marché.","alerte"); return; }
  qte  = Math.max(1, Math.min(dispo, Math.floor(qte||1)));
  prix = Math.max(p.min, Math.min(p.max, Math.round(prix||p.moy)));
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible.","alerte"); return; }
  /* ⚠ v0.94 — c'est le CLIENT qui calcule l'échéance, et lui seul : `usure.js`
     reste la source unique des durées de vie. Le serveur ne reçoit qu'une date,
     qu'il range dans `offres.expire_le` pour pouvoir purger.
     On part du temps restant du LOT LE PLUS ANCIEN, pas de `dureeVie()` à
     neuf : le serveur retire en FIFO (`inv_date_plus_ancienne`), c'est donc ce
     lot-là qui part en vitrine. Sans ça, une mise en vente rajeunirait
     l'objet — exactement le « blanchiment par le marché » qu'on refuse.
     Si les lots ne sont pas encore synchronisés, on n'invente pas de date :
     l'offre ne sera pas purgée, ce qui vaut mieux qu'une purge trop tôt. */
  const _jr  = (typeof joursRestantsLot==="function") ? joursRestantsLot(id, "sac") : null;
  const _exp = (_jr!=null) ? new Date(Date.now() + _jr*JOUR_MS).toISOString() : null;
  if(_exp==null) console.warn("[marche] lots non synchronisés : offre déposée sans échéance.", id);
  const { data:res, error } = await rpcAvecSolde("deposer_offre", { p_faction:faction, p_item:id, p_qte:qte, p_prix:prix, p_expire_le:_exp });
  if(error || !res || !res.ok){
    if(res && res.err==="taxe") journal(`Taxe de ${res.taxe} ₡ — crédits insuffisants.`,"alerte");
    else if(res && res.err==="manque") journal(`Tu ne possèdes que ${res.possede}× cet objet.`,"alerte");
    else journal("Mise en vente impossible.","alerte");
    return;
  }
  if(res.etat && typeof _appliquerEtatStocks==="function") _appliquerEtatStocks(res.etat);
  if(etat.pas) etat.pas.vendu=true;   // solde déjà appliqué par rpcAvecSolde
  journal(`Mis en vente à ${FACTIONS.find(f=>f.id===faction).nom} : ${qte}× ${item(id).nom} à ${prix} ₡ (taxe ${res.taxe} ₡)${res.bonus_eclats ? ` — les Éclats ajoutent ${res.bonus_eclats} ₡ à la caisse` : ""}.`,"gain");   // v1.10
  apresAction(); renderMarche(); ouvrirVente();
}

/* --- Retirer une de ses offres (rend le lot ; taxe non remboursée) --- */
async function retirerOffre(offreId){
  if(refusPrison("retirer une offre")) return;
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
    // v0.94 : le vendeur voit ce qui va être purgé, et peut le retirer avant.
    const mort = _offreMorte(o);
    const _j = _offreJours(o);
    html += `<div class="vente-ligne" data-item="${o.item_id}"${_j!=null?` data-jours="${_j.toFixed(3)}"`:""}><span class="picker-ic">${iconeItem(o.item_id)}</span>`
      + `<span class="picker-nom"><b>${item(o.item_id).nom}</b>${mort ? ` <span class="picker-usure usure-critique">périmé</span>` : _offreBadge(o)} <span class="qte">×${o.quantite} à ${o.prix} ₡</span></span>`
      + `<button class="mini danger" data-retirer="${o.id}">Retirer</button></div>`;
  }
  html += `</div>`;
  m.innerHTML = html; m.hidden = false;
  if(typeof brancherTips==="function") brancherTips(m);
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
  m.querySelectorAll("[data-retirer]").forEach(b=>b.addEventListener("click",()=>retirerOffre(b.dataset.retirer)));
}
