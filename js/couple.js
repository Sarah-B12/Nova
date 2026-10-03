/* ===========================================================
   MARIAGE — v1.36 (client). BACKEND_PLAN §56-61 ; cadrage : PASSATION
   partie D (décisions 1-32).

   Deux écrans :
   • l'onglet UNIONS du Centre (majUnions) : demandes, divorce, choix de
     faction après un divorce, derniers textes de mariage ;
   • l'onglet principal COUPLE (majCouple), visible seulement une fois
     marié·e : Actions du jour (Complicité), Réserve commune, Cérémonie.

   Tout est décidé AU SERVEUR (union_*, reserve_*) : ici on affiche et on
   appelle. `_union` = dernière réponse de union_lire (jamais persistée).
   ⚠ `union_lire` renvoie aussi `moi` (faction, position) : un déménagement
     décidé par le conjoint (mariage accepté, couple qui change de faction)
     est appliqué ici sans recharger la page.
   ⚠ Libellés : on ne vit pas « chez » son conjoint, on vit AVEC (décision 31).
   =========================================================== */

let _union = null;                 // réponse de union_lire
let _coupleOnglet = "actions";     // sous-onglet de Couple
let _unionsTextes = null;          // derniers textes (bas des Unions), chargés à l'ouverture
let _editionSignal = 0;            // dernier « j'écris » envoyé (ms)

/* v1.36e — toutes les lignes de journal de ce fichier vont dans l'onglet
   « Couple » du journal. */
function _jc(t, type){ journal(t, type || "", "couple"); }

/* Les 20 actions (décisions 16, 17, 32) + « Essayer d'avoir un bébé » (21). */
const ACTIONS_COUPLE = {
  1:  { nom:"Offrir un petit cadeau",                  phrase:"Un {cadeau}. Parfaitement inutile. Parfaitement précieux." },
  2:  { nom:"Promenade au bord du petit lac",          phrase:"Ça a failli se finir en bain de minuit." },
  3:  { nom:"Regarder Maar tourner depuis le Perchoir", phrase:"Maar a fait un tour complet. Vous n'avez rien vu, trop occupés à vous regarder." },
  4:  { nom:"S'envoyer en l'air… dans l'espace",       phrase:"Le pilote automatique a préféré regarder ailleurs." },
  5:  { nom:"Cuisiner une ration chaude ensemble",     phrase:"Tiède, un peu trop salée. La meilleure de la semaine.", ratee:"Elle a brûlé. Vous en riez encore." },
  6:  { nom:"Nourrir les bêtes de l'enclos à deux",    phrase:"Le cuprin a eu double ration. Il ne dira rien." },
  7:  { nom:"Laisser un mot doux sur le mur",          phrase:"Un mot doux sur le mur. Trois fautes d'orthographe. Il est parfait." },
  8:  { nom:"Danser dans la cour de la cité",          phrase:"Pas de musique. Vous n'en aviez pas besoin." },
  9:  { nom:"Se chamailler pour la vaisselle",         phrase:"Il n'y a que deux gamelles. Vous avez trouvé le moyen de vous disputer pour trois.", negative:true },
  10: { nom:"Bouder dans son coin",                    phrase:"Le coin est froid. L'autre aussi, ce soir.", negative:true },
  11: { nom:"Graver vos initiales sur un lingot de Cendrite", phrase:"Un amour en fusion." },
  12: { nom:"Se tenir chaud en pleine Toundra",        phrase:"Il gèle dehors. Pas entre vous." },
  13: { nom:"Planter une Ferragave à deux",            phrase:"Elle ne poussera pas plus vite. Mais c'est plus mignon." },
  14: { nom:"Compter les astéroïdes",                  phrase:"Vous tombez d'accord sur 412. Puis sur 413." },
  15: { nom:"S'envoyer une lettre d'amour par la Poste", phrase:"Il habite à trois pas. Elle arrivera dans deux jours." },
  16: { nom:"Recoller les morceaux… de la coque",      phrase:"Au sens propre, pour une fois." },
  17: { nom:"Brosser un cuirasson à quatre mains",     phrase:"Il ronronne. Enfin, il grince, mais avec affection." },
  18: { nom:"Faire la course jusqu'au petit lac",      phrase:"Match nul. Vous avez triché tous les deux." },
  19: { nom:"Déchiffrer des glyphes de l'ancien à deux", phrase:"Vous lisez « Point de rassemblement ». Vous y voyez un signe." },
  20: { nom:"Ronfler toute la nuit",                   phrase:"Le Protocole a cru à une attaque.", negative:true },
  21: { nom:"Essayer d'avoir un bébé",                 phrase:"Vous avez essayé. Le matelas s'en souviendra.", seul:"{nom} aimerait essayer d'avoir un bébé." }
};

const UNION_REFUS = {
  cible:"Choisis la personne à qui tu fais ta demande.",
  introuvable:"Ce joueur n'existe plus.",
  mort:"Impossible : quelqu'un est au Couloir.",
  prison:"Impossible depuis la prison.",
  deja_marie:"Déjà marié·e.",
  delai:"Il faut attendre 30 jours après un divorce pour se remarier.",
  demande_en_cours:"Tu as déjà une demande en attente : annule-la d'abord.",
  hote_sans_maison:"Pose d'abord l'emplacement de ton logement.",
  regent:"Un Régent ne quitte pas sa faction : transmets d'abord ton mandat.",
  candidat:"Retire d'abord ta candidature du cycle en cours.",
  demande:"Cette demande n'est plus valable.",
  aucune:"Aucune demande en cours.",
  pas_marie:"Tu n'es pas marié·e.",
  couple_en_pause:"Le couple est en pause : ta moitié est au Couloir.",
  deja:"Tu as déjà fait ton action de couple aujourd'hui.",
  action:"Cette action n'est pas disponible aujourd'hui.",
  drones:"Retire d'abord tes drones de tes hangars.",
  attente:"Le divorce ne peut pas encore être prononcé.",
  aucun_choix:"Plus de choix de faction possible.",
  faction_inconnue:"Faction inconnue.",
  fermee:"La réserve est fermée (Complicité sous 20 %).",
  objet_lie:"Un objet lié ne quitte pas le sac.",
  manque:"Tu n'en as plus assez.",
  pleine:"La réserve est pleine.",
  sac_plein:"Sac plein — fais de la place d'abord.",
  quantite:"Quantité invalide.",
  loin:"La réserve est à la maison : rentre chez toi.",
  fige:"Le texte est figé : les deux semaines sont passées.",
  trop_long:"2 000 caractères au plus."
};

function _uNom(id){ const it = (typeof item==="function") ? item(id) : null; return it ? it.nom : id; }
function _uDate(iso){ try{ return new Date(iso).toLocaleDateString("fr-FR", { day:"numeric", month:"long" }); }catch(e){ return ""; } }
function _uRefus(d){
  const e = d && d.err;
  if(e === "delai" && d.jusqua) _jc(`Il faut attendre le ${_uDate(d.jusqua)} pour se remarier.`, "alerte");
  else if(e === "attente" && d.forcable_le) _jc(`Le divorce pourra être prononcé le ${_uDate(d.forcable_le)}.`, "alerte");
  else if(e === "hote_sans_maison" && d.qui === "cible") _jc("L'autre doit d'abord poser l'emplacement de son logement.", "alerte");
  else if((e === "regent" || e === "candidat") && d.qui === "cible") _jc("L'autre est Régent ou candidat : il doit d'abord transmettre ou se retirer.", "alerte");
  else _jc(UNION_REFUS[e] || `Refusé par le serveur (${e || "réponse vide"}).`, "alerte");
}
async function _uRpc(nom, args){
  if(typeof sb === "undefined"){ _jc("Serveur indisponible.","alerte"); return null; }
  try{
    const { data, error } = await sb.rpc(nom, args || {});
    if(error){ _jc("Le serveur n'a pas répondu — réessaie.","alerte"); console.warn("[couple]", nom, error.message); return null; }
    if(!data || !data.ok){ _uRefus(data); return null; }
    if(data.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
    return data;
  }catch(e){ _jc("Connexion au serveur perdue — réessaie.","alerte"); return null; }
}

/* ---------- Lecture ---------- */
async function chargerUnion(){
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO || !etat || !etat.inscrit) return null;
  try{
    const { data, error } = await sb.rpc("union_lire");
    if(error || !data || !data.ok) return null;
    _union = data;
    _appliquerMoiUnion(data.moi);
    majOngletCouple();
    return data;
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "couple.js#charger"); return null; }
}
/* Déménagement décidé par le conjoint : on adopte la faction et la position. */
function _appliquerMoiUnion(m){
  if(!m || !m.faction || m.faction === etat.faction) return;
  etat.faction = m.faction;
  if(m.x != null && m.y != null && (m.secteur || "silene") === "silene") etat.pos = { x:m.x, y:m.y };
  _jc("Ton foyer a déménagé : tu vis désormais dans la cité de ta nouvelle faction.", "alerte");
  if(typeof chargerTerrain === "function") chargerTerrain();
  if(typeof afficher === "function") afficher();
}
function estMarie(){ return !!(_union && _union.union); }
function majOngletCouple(){
  /* v1.36t — sur son propre Profil (l'onglet du jeu) : « Marié·e à X », avec
     un lien vers la page de sa moitié. */
  const lc = document.querySelector("#stat-couple");
  if(lc){
    const u = _union && _union.union;
    if(u && u.nom){
      lc.innerHTML = `Marié·e à <a class="lien-couple" role="button" tabindex="0">${echapper(u.nom)}</a>`;
      const a = lc.querySelector("a"); const ouvrir = () => { if(typeof ouvrirPageProfil === "function") ouvrirPageProfil(u.nom); };
      a.addEventListener("click", ouvrir); a.addEventListener("keydown", e => { if(e.key === "Enter") ouvrir(); });
      lc.hidden = false;
    } else { lc.hidden = true; lc.innerHTML = ""; }
  }
  const b = document.querySelector('.onglet[data-onglet="couple"]'); if(!b) return;
  b.style.display = estMarie() ? "" : "none";
  if(!estMarie() && b.classList.contains("actif")){
    const p = document.querySelector('.onglet[data-onglet="profil"]'); if(p) p.click();
  }
}
/* Après une action qui déménage (mariage, divorce, choix de faction). */
async function _uApresDemenagement(r){
  if(r && r.demenagement && r.demenagement.faction){
    etat.faction = r.demenagement.faction;
    if(r.demenagement.x != null) etat.pos = { x:r.demenagement.x, y:r.demenagement.y };
  }
  if(typeof chargerTerrain === "function") await chargerTerrain();
  await chargerUnion();
  if(typeof sauverMaintenant === "function") sauverMaintenant();
  if(typeof afficher === "function") afficher();
}

/* ===========================================================
   ONGLET UNIONS (Centre)
   =========================================================== */
async function majUnions(el){
  if(!el) el = document.querySelector("#centre-corps"); if(!el) return;
  if(!_union){ el.innerHTML = `<h3>Unions</h3><p class="vide">Chargement…</p>`; await chargerUnion(); }
  if(!_union){ el.innerHTML = `<h3>Unions</h3><p class="vide">Serveur indisponible.</p>`; return; }
  const u = _union.union;
  let h = `<h3>Unions</h3>`;
  if(u) h += _uBlocMarie(u);
  else {
    if(_union.choix_faction) h += _uBlocChoixFaction(_union.choix_faction);
    h += _uBlocRecues(_union.recues || []);
    h += _union.envoyee ? _uBlocEnvoyee(_union.envoyee) : await _uBlocDemander();
  }
  h += `<h4 style="margin:18px 0 6px">Derniers mariages</h4><div id="unions-textes"><p class="vide">Chargement…</p></div>`;
  el.innerHTML = h;
  _uBrancher(el);
  _uChargerTextes(el.querySelector("#unions-textes"));
}

function _uBlocMarie(u){
  let h = `<p>Tu vis avec <b>${echapper(u.nom || "?")}</b> depuis le ${_uDate(u.marie_le)}. Complicité : <b>${u.complicite} %</b>.</p>`;
  const avert = u.je_suis_hote ? "" :
    `<p class="itip-gris">⚠ Au divorce, tout ce que tu as construit pendant le mariage (hors maison) sera détruit ; tu retrouveras ton terrain d'avant, tel que tu l'as laissé. Retire d'abord tes drones.</p>`;
  const d = u.divorce;
  if(!d) return h + avert + `<p class="itip-gris">Demander le divorce coûte 50 points de Complicité.</p><div class="actions"><button class="mini danger" data-u="divorcer">Demander le divorce</button></div>`;
  if(d.par_moi){
    const pret = Date.now() >= new Date(d.forcable_le).getTime();
    return h + `<p>Tu as demandé le divorce le ${_uDate(d.depuis)}. ${pret ? "Tu peux maintenant le prononcer." : `Sans réponse, tu pourras le prononcer le ${_uDate(d.forcable_le)}.`}</p>` + avert +
      `<div class="actions"><button class="mini" data-u="divorce-annuler">Annuler la demande</button>${pret ? `<button class="mini danger" data-u="divorcer">Prononcer le divorce</button>` : ""}</div>`;
  }
  return h + `<p><b>${echapper(u.nom)}</b> demande le divorce. Sans réponse de ta part, il sera prononcé à partir du ${_uDate(d.forcable_le)}.</p>` + avert +
    `<div class="actions"><button class="mini danger" data-u="divorcer">Accepter le divorce</button></div>`;
}
function _uBlocChoixFaction(c){
  const f = (typeof _facNomComm === "function") ? _facNomComm : (x => x);
  return `<div class="u-choix"><p>Après ton divorce, tu peux rester dans <b>${f(c.actuelle)}</b> ou rentrer dans <b>${f(c.origine)}</b>, jusqu'au ${_uDate(c.jusqua)}.</p>
    <div class="actions"><button class="mini" data-u="rester">Rester dans ${f(c.actuelle)}</button><button class="mini" data-u="rentrer">Rentrer dans ${f(c.origine)}</button></div></div>`;
}
function _uBlocRecues(recues){
  if(!recues.length) return "";
  return `<h4 style="margin:12px 0 6px">Demandes reçues</h4>` + recues.map(r =>
    `<div class="u-demande"><p><b>${echapper(r.nom || "?")}</b> te demande en mariage — ${r.il_vient ? "il ou elle viendrait s'installer dans ta maison" : "tu t'installerais dans sa maison"}${r.il_vient ? "" : " (et dans sa faction)"}.</p>
      <div class="actions"><button class="mini" data-u="accepter" data-id="${r.id}">Accepter</button><button class="mini danger" data-u="refuser" data-id="${r.id}">Décliner</button></div></div>`).join("");
}
function _uBlocEnvoyee(e){
  return `<p>Ta demande à <b>${echapper(e.nom || "?")}</b> attend sa réponse (${e.je_viens ? "tu viendrais t'installer dans sa maison" : "il ou elle viendrait s'installer dans la tienne"}).</p>
    <div class="actions"><button class="mini" data-u="annuler">Annuler ma demande</button></div>`;
}
async function _uBlocDemander(){
  if(_union.delai) return `<p class="vide">Tu pourras te remarier à partir du ${_uDate(_union.delai)}.</p>`;
  let amis = [];
  try{ if(typeof _chargerRelations === "function") amis = (await _chargerRelations()).amis || []; }catch(e){}
  if(!amis.length) return `<p class="vide">On demande en mariage parmi ses <b>amis</b> (Le Réseau). Tu n'en as pas encore.</p>`;
  /* v1.36j — retour de l'autrice : on ne propose pas les amis déjà mariés
     (unions_maries, v153 ; le serveur refuserait de toute façon). */
  try{
    const { data } = await sb.rpc("unions_maries", { p_ids: amis.map(a => a.id) });
    if(Array.isArray(data) && data.length){ const pris = new Set(data); amis = amis.filter(a => !pris.has(a.id)); }
  }catch(e){}
  if(!amis.length) return `<p class="vide">Tous tes amis sont déjà mariés.</p>`;
  return `<h4 style="margin:12px 0 6px">Demander en mariage</h4>
    <div class="u-form">
      <select id="u-cible">${amis.map(a => `<option value="${a.id}">${echapper(a.nom)}</option>`).join("")}</select>
      <label><input type="radio" name="u-ou" value="viens" checked> Viens chez moi</label>
      <label><input type="radio" name="u-ou" value="je"> Je viens chez toi</label>
      <button class="mini" data-u="demander">Demander</button>
    </div>
    <p class="itip-gris">Celui qui vient s'installer rejoint la faction de l'autre et reçoit un terrain neuf ; le sien est mis en veille, intact, jusqu'à un éventuel divorce.</p>`;
}
async function _uChargerTextes(z){
  if(!z) return;
  try{
    if(!_unionsTextes){ const { data } = await sb.rpc("union_derniers_textes", { p_nb:10 }); _unionsTextes = (data && data.ok) ? data.textes : []; }
    if(!_unionsTextes.length){ z.innerHTML = `<p class="vide">Aucun texte de mariage pour l'instant.</p>`; return; }
    z.innerHTML = _unionsTextes.map(t => {
      const tx = echapper(t.texte || "").replace(/\n/g, "<br>");
      const tete = `<b>${echapper(t.a)}</b> & <b>${echapper(t.b)}</b> — ${_uDate(t.marie_le)}`;
      return (t.texte || "").length > 280
        ? `<details class="u-texte"><summary>${tete}</summary><p>${tx}</p></details>`
        : `<div class="u-texte"><p>${tete}</p><p>${tx}</p></div>`;
    }).join("");
  }catch(e){ z.innerHTML = `<p class="vide">Indisponible.</p>`; }
}
function _uBrancher(el){
  el.querySelectorAll("[data-u]").forEach(b => b.addEventListener("click", async () => {
    const a = b.dataset.u; let r = null;
    if(a === "demander"){
      const cible = el.querySelector("#u-cible"); const ou = el.querySelector('input[name="u-ou"]:checked');
      if(!cible || !cible.value) return;
      r = await _uRpc("union_demander", { p_cible:cible.value, p_je_viens:(ou && ou.value === "je") });
      if(r) _jc("Demande envoyée.", "gain");
    } else if(a === "annuler"){ r = await _uRpc("union_annuler"); if(r) _jc("Demande annulée.", "alerte"); }
    else if(a === "refuser"){ r = await _uRpc("union_repondre", { p_id:Number(b.dataset.id), p_accepte:false }); if(r) _jc("Demande déclinée.", "alerte"); }
    else if(a === "accepter"){
      if(!await confirmerJoli("Dire oui", "Dire oui ? Celui qui s'installe chez l'autre rejoint sa faction et reçoit un terrain neuf ; son terrain actuel est mis en veille.", "Oui")) return;
      r = await _uRpc("union_repondre", { p_id:Number(b.dataset.id), p_accepte:true });
      if(r){ _jc("Vous êtes mariés !", "gain"); await _uApresDemenagement(r); }
    }
    else if(a === "divorcer"){
      const u = _union && _union.union;
      /* v1.36g : DEMANDER coûte 50 points de Complicité (v150), et sous 20 % la
         réserve commune se ferme. On le dit avant. */
      const demande = !!(u && !u.divorce);
      const msg = (demande ? "Demander le divorce ? La Complicité perdra 50 points (sous 20 %, la réserve commune se ferme)."
                           : "Confirmer le divorce ?")
        + ((u && !u.je_suis_hote) ? " Au divorce, tout ce que tu as construit pendant le mariage (hors maison) sera détruit ; tu retrouveras ton terrain d'avant." : "");
      if(!await confirmerJoli("Divorce", msg, "Confirmer", true)) return;
      r = await _uRpc("union_divorcer");
      if(r && r.divorce){ _jc("Le divorce est prononcé.", "alerte"); await _uApresDemenagement(r); }
      else if(r && r.demande) _jc(`Demande de divorce envoyée. Complicité : ${r.complicite} %.`, "alerte");
    }
    else if(a === "divorce-annuler"){ r = await _uRpc("union_divorce_annuler"); if(r) _jc("Demande de divorce retirée.", "gain"); }
    else if(a === "rester" || a === "rentrer"){
      r = await _uRpc("union_choisir_faction", { p_rentrer:a === "rentrer" });
      if(r){ _jc(a === "rentrer" ? "Tu rentres dans ta faction d'origine." : "Tu restes dans ta faction actuelle.", "gain"); await _uApresDemenagement(r); }
    }
    if(r){ await chargerUnion(); majUnions(el); }
  }));
}

/* ===========================================================
   ONGLET COUPLE
   =========================================================== */
function _phraseAction(n, detail, qui){
  const A = ACTIONS_COUPLE[n]; if(!A) return "";
  detail = detail || {};
  if(n === 1) return A.phrase.replace("{cadeau}", detail.cadeau || "petit cadeau");
  if(n === 5 && detail.ratee) return A.ratee;
  if(n === 21) return detail.tentative ? A.phrase : A.seul.replace("{nom}", qui || "?");
  return A.phrase;
}
async function majCouple(){
  const el = document.querySelector("#couple-vue"); if(!el) return;
  if(!_union) await chargerUnion();
  const u = _union && _union.union;
  if(!u){ el.innerHTML = `<h2>Couple</h2><p class="vide">Tu n'es pas marié·e. Les demandes se font aux Unions, au Centre.</p>`; return; }
  const onglets = [["actions","Actions"],["reserve","Réserve"],["confidences","Confidences"],["ceremonie","Cérémonie"]];
  el.innerHTML = `<h2>Couple <span class="pts">avec ${echapper(u.nom || "?")}</span></h2>
    <div class="sous-menu">${onglets.map(([k,t]) => `<button class="sous-lien${_coupleOnglet===k?" actif":""}" data-co="${k}">${t}</button>`).join("")}</div>
    <div id="couple-corps"></div>`;
  el.querySelectorAll("[data-co]").forEach(b => b.addEventListener("click", () => { _coupleOnglet = b.dataset.co; majCouple(); }));
  const c = el.querySelector("#couple-corps");
  if(_coupleOnglet === "reserve") return _coupleReserve(c, u);
  if(_coupleOnglet === "confidences") return _coupleConfidences(c, u);
  if(_coupleOnglet === "ceremonie") return _coupleCeremonie(c, u);
  return _coupleActions(c, u);
}

/* v1.36s — l'onglet Actions, refait (demande de l'autrice) :
   1. l'action du jour de ta moitié (image, nom, phrase — ou « pas encore ») ;
   2. la tienne, de la même façon ;
   3. dessous, les actions possibles aujourd'hui, chacune avec son image et sa
      phrase (la phrase n'est plus écrite au journal).
   Images : images/couple/<numéro>.png (masquée si absente). On ne dit jamais
   « conjoint » (mot genré) : son prénom, ou « ta moitié ». */
function _imgAction(n){
  return `<img class="co-img" src="images/couple/${n}.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;
}
function _phraseApercu(n){
  const A = ACTIONS_COUPLE[n]; if(!A) return "";
  if(n === 1) return A.phrase.replace("{cadeau}", "petit cadeau");
  return A.phrase;
}
function _carteFaite(qui, n, detail, nomQui){
  if(n == null) return `<div class="co-carte co-attente"><div class="co-img co-vide"></div>
      <div><div class="co-qui">${qui}</div><div class="itip-gris">${qui === "Toi" ? "Tu n'as pas encore fait ton action aujourd'hui." : "N'a pas encore fait son action aujourd'hui."}</div></div></div>`;
  const A = ACTIONS_COUPLE[n] || { nom:"?" };
  return `<div class="co-carte${A.negative ? " co-neg" : ""}">${_imgAction(n)}
      <div><div class="co-qui">${qui} <span class="co-fait">✓ fait</span></div><div class="co-nom">${A.nom}</div>
      <i class="co-phrase">${echapper(_phraseAction(n, detail, nomQui))}</i></div></div>`;
}
function _coupleActions(c, u){
  const j = u.jour || {};
  let h = `<div class="jauge"><div class="jauge-tete"><span>Complicité</span><span class="val">${u.complicite}</span></div>
    <div class="piste"><div class="remplissage" style="width:${u.complicite}%"></div></div></div>`;
  if(u.en_pause){ c.innerHTML = h + `<p class="vide">Le couple est en pause : ${echapper(u.nom)} est au Couloir. La Complicité est figée.</p>`; return; }
  h += `<div class="co-jour">${_carteFaite(echapper(u.nom || "?"), j.son_choix, j.son_detail, u.nom)}${_carteFaite("Toi", j.mon_choix, j.mon_detail, etat.nom)}</div>`;
  const dispo = [ ...(j.mes_actions || []), 21, ...((j.toujours || [9,10,20]).filter(a => a !== 21)) ];
  const fait = j.mon_choix != null;
  h += `<h4 class="co-titre">Actions possibles aujourd'hui</h4>`
     + (fait ? `<p class="itip-gris">Tu as déjà fait ton action de couple aujourd'hui. Reviens demain (minuit, heure de Paris).</p>` : "")
     + `<div class="co-liste">` + dispo.map(a => {
          const A = ACTIONS_COUPLE[a]; if(!A) return "";
          return `<button class="co-choix${A.negative ? " co-neg" : ""}" data-act="${a}"${fait ? " disabled" : ""}>
            ${_imgAction(a)}<span><span class="co-nom">${A.nom}</span><i class="co-phrase">${echapper(_phraseApercu(a))}</i></span></button>`;
        }).join("") + `</div>`;
  c.innerHTML = h;
  c.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", async () => {
    if(b.disabled) return;
    const r = await _uRpc("union_agir", { p_action:Number(b.dataset.act) });
    if(!r) return;
    if(typeof r.moral === "number"){ etat.jauges = etat.jauges || {}; etat.jauges.moral = r.moral; }
    // v1.36s : plus de phrase au journal — elle s'affiche dans la carte « Toi ».
    await chargerUnion(); majCouple(); if(typeof afficher === "function") afficher();
  }));
}

/* v1.36t — la réserve présentée comme le Rangement de la maison (demande de
   l'autrice) : une grille de tuiles (icône, quantité) à gauche — autant de cases
   que de places —, la liste « À déposer (sac) » à droite. Un clic sur une tuile
   prend 1 exemplaire ; un petit badge dit à qui est l'objet. */
function _coupleReserve(c, u){
  const R = u.reserve || { place:0, utilise:0, objets:[] };
  const ici = (typeof coffreAccessible === "function") ? coffreAccessible() : true;
  if(R.place <= 0 && !R.objets.length){
    c.innerHTML = `<p class="vide">La réserve est fermée : la Complicité est sous 20 %. Chacun a retrouvé ses objets dans son coffre.</p>`;
    return;
  }
  let h = "";
  if(!ici) h += `<p class="itip-gris">La réserve est à la maison : rentre chez toi pour y déposer ou y prendre.</p>`;
  if(R.utilise > R.place && R.place > 0) h += `<p class="itip-gris">Elle déborde : on peut seulement en retirer.</p>`;
  h += `<div class="rangee2" style="margin-top:6px">
      <div class="sous-carte" style="margin:0"><h3>Réserve commune <span class="qte">${R.utilise}/${R.place}</span></h3>
        <p class="itip-gris" style="margin:0 0 8px">Place : Complicité ÷ 5. Touche un objet pour en prendre un.</p>
        <div class="sac-grille" id="reserve-grille"></div></div>
      <div class="sous-carte" style="margin:0"><h3>À déposer (sac)</h3><div id="reserve-depot"></div></div>
    </div>`;
  c.innerHTML = h;

  const g = c.querySelector("#reserve-grille");
  const cible = Math.max(R.place, R.objets.length, 6);
  for(let i = 0; i < Math.ceil(cible / 6) * 6; i++){
    const t = document.createElement("div");
    const o = R.objets[i];
    if(o){
      t.className = "tuile utilisable"; t.dataset.item = o.item;
      t.title = `${_uNom(o.item)} — ${o.a_moi ? "à toi" : "à " + (u.nom || "ta moitié")}`;
      t.innerHTML = `<span class="icone">${(typeof iconeItem === "function") ? iconeItem(o.item) : ""}</span><span class="compte">${o.qte}</span>
        <span class="co-proprio${o.a_moi ? " moi" : ""}">${o.a_moi ? "toi" : echapper((u.nom || "?").slice(0, 3))}</span>`;
      if(typeof montrerItemTip === "function"){ t.addEventListener("mouseenter", () => montrerItemTip(t, o.item)); t.addEventListener("mouseleave", cacherItemTip); }
      /* v1.36w — retour (tablette) : un toucher prenait l'objet sans qu'on sache
         ce que c'était, et l'appui long ouvrait le menu du navigateur
         (« enregistrer l'image »…). Désormais un toucher (ou un clic) ouvre une
         FICHE : nom, quantité, propriétaire, description complète au doigt,
         puis « Prendre 1 » / « Tout prendre ». */
      t.addEventListener("click", () => { if(typeof cacherItemTip === "function") cacherItemTip(); _ficheReserve(o, u, ici); });
    } else t.className = (i < R.place) ? "tuile vide" : "tuile vide co-hors";
    g.appendChild(t);
  }

  const dl = c.querySelector("#reserve-depot");
  const libre = R.place - R.utilise;
  const sac = Object.entries(etat.sac || {}).filter(([id, n]) => n > 0 && !(typeof estObjetLie === "function" && estObjetLie(id)));
  if(!ici || !sac.length){ dl.innerHTML = `<p class="vide">${ici ? "Rien à déposer." : "Rentre chez toi pour déposer."}</p>`; return; }
  for(const [id, n] of sac){
    const d = document.createElement("div"); d.className = "item-ligne";
    d.innerHTML = `<span>${echapper(_uNom(id))} <span class="qte">×${n}</span></span>`;
    const span = document.createElement("span");
    for(const [txt, q] of [["Déposer", 1], ["Tout", n]]){
      const b = document.createElement("button"); b.className = "mini"; b.textContent = txt; b.disabled = libre <= 0;
      b.addEventListener("click", async () => {
        const r = await _uRpc("reserve_deposer", { p_item:id, p_qte:q });
        if(r){ _jc(`Réserve : ${r.depose}× ${_uNom(id)} déposé${r.depose > 1 ? "s" : ""}.`, "gain"); await chargerUnion(); majCouple(); }
      });
      span.appendChild(b);
    }
    d.appendChild(span); dl.appendChild(d);
  }
}

/* Fiche d'un objet de la réserve (même cadre que le menu d'objet du sac). */
function _ficheReserve(o, u, ici){
  if(typeof monterMenuObjet === "function") monterMenuObjet();
  const m = document.querySelector("#menu-objet"); if(!m) return;
  const a = o.a_moi ? "à toi" : `à ${echapper(u.nom || "ta moitié")}`;
  let h = `<div class="menu-cadre"><div class="menu-tete"><span class="menu-ic">${(typeof iconeItem === "function") ? iconeItem(o.item) : ""}</span>
      <b>${echapper(_uNom(o.item))}</b> <span class="qte">×${o.qte}</span><button class="mini" data-fermer="1">✕</button></div>
      <p class="itip-gris" style="margin:4px 0 8px">Dans la réserve commune — ${a}.</p>`;
  if(typeof infoItemHTML === "function"){ const inf = infoItemHTML(o.item); if(inf) h += `<div class="menu-infos">${inf}</div>`; }
  if(ici){
    h += `<button class="menu-act" data-pr="1">Prendre 1</button>`;
    if(o.qte > 1) h += `<button class="menu-act" data-pr="${o.qte}">Tout prendre (${o.qte})</button>`;
  } else h += `<p class="itip-gris">La réserve est à la maison : rentre chez toi pour y prendre.</p>`;
  m.innerHTML = h + `</div>`; m.hidden = false;
  m.querySelector("[data-fermer]").addEventListener("click", () => { m.hidden = true; });
  m.querySelectorAll("[data-pr]").forEach(b => b.addEventListener("click", async () => {
    m.hidden = true;
    const r = await _uRpc("reserve_retirer", { p_item:o.item, p_qte:Number(b.dataset.pr) });
    if(r){ _jc(`Réserve : ${r.retire}× ${_uNom(o.item)} pris.`, "gain"); await chargerUnion(); majCouple(); }
  }));
}

/* ===========================================================
   v1.36x — CONFIDENCES : la petite discussion du couple (demande de
   l'autrice, sur le modèle de la Concertation du gouvernement). 200
   caractères par message, effacés au bout de 3 jours (serveur :
   union_chat_lire / union_chat_ecrire, v160 ; accès revérifié à chaque
   appel). Rafraîchie toutes les 15 s tant que l'onglet est ouvert.
   =========================================================== */
let _cfRendu = 0, _cfTimer = null, _cfBrouillon = "";   // v1.36z : le brouillon survit à un changement d'onglet
function _coupleConfidences(c, u){
  const jeton = ++_cfRendu;
  c.innerHTML = `<p class="itip-gris" style="margin:0 0 8px">Rien que vous deux. Les messages s'effacent au bout de <b>3 jours</b>.</p>
    <div class="cf-fil" id="cf-fil"><p class="vide">Chargement…</p></div>
    <div class="mur-outils" id="cf-outils"></div>
    <div class="cf-saisie">
      <textarea id="cf-txt" rows="2" maxlength="200" placeholder="Un mot pour ${echapper(u.nom || "ta moitié")}…"></textarea>
      <div class="cf-cote"><span class="itip-gris" id="cf-compte">0/200</span><button class="mini" id="cf-envoi">Envoyer</button></div>
    </div>`;
  const champ = c.querySelector("#cf-txt"), compte = c.querySelector("#cf-compte");
  champ.value = _cfBrouillon; compte.textContent = `${champ.value.length}/200`;
  champ.addEventListener("input", () => { _cfBrouillon = champ.value; compte.textContent = `${champ.value.length}/200`; });
  // v1.36y — la palette d'emojis des messages privés (profil-page.js, _paletteEmoji).
  if(typeof _paletteEmoji === "function") _paletteEmoji("#cf-outils", "#cf-txt");
  const envoyer = async () => {
    const t = (champ.value || "").trim(); if(!t) return;
    const b = c.querySelector("#cf-envoi"); if(b) b.disabled = true;
    let d = null; try{ ({ data:d } = await sb.rpc("union_chat_ecrire", { p_texte:t })); }catch(e){}
    if(b) b.disabled = false;
    if(!d || !d.ok){
      const e = d && d.err;
      _jc(e === "trop_vite" ? "Doucement : trop de messages d'affilée." : e === "trop_long" ? "200 caractères au plus." :
          e === "pas_marie" ? "Tu n'es plus marié·e." : "Envoi impossible.", "alerte");
      return;
    }
    champ.value = ""; _cfBrouillon = ""; compte.textContent = "0/200";
    await _cfCharger(c, true);
  };
  c.querySelector("#cf-envoi").addEventListener("click", envoyer);
  champ.addEventListener("keydown", e => { if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); envoyer(); } });   // Entrée : envoyer ; Maj+Entrée : ligne
  _cfCharger(c, true);
  clearInterval(_cfTimer);
  _cfTimer = setInterval(() => {
    if(jeton !== _cfRendu || !document.querySelector("#cf-fil")){ clearInterval(_cfTimer); return; }
    if(!document.hidden) _cfCharger(c, false);
  }, 15000);
}
async function _cfCharger(c, forcerBas){
  const fil = c.querySelector("#cf-fil"); if(!fil) return;
  let r = null; try{ ({ data:r } = await sb.rpc("union_chat_lire", { p_limite:60 })); }catch(e){}
  if(!r || !r.ok){ fil.innerHTML = `<p class="vide">Lecture impossible.</p>`; return; }
  const liste = r.liste || [];
  if(!liste.length){ fil.innerHTML = `<p class="vide">Aucun message pour l'instant.</p>`; return; }
  const enBas = forcerBas || (fil.scrollHeight - fil.scrollTop - fil.clientHeight < 40);
  fil.innerHTML = liste.map(m => {
    const q = m.cree_le ? new Date(m.cree_le).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "";
    return `<div class="cf-msg${m.moi ? " moi" : ""}"><div class="cf-tete">${m.moi ? "Toi" : echapper(m.nom)} <span class="itip-gris">${echapper(q)}</span></div>
      <div class="cf-txt">${echapper(m.texte)}</div></div>`;
  }).join("");
  if(enBas) fil.scrollTop = fil.scrollHeight;
}

function _coupleCeremonie(c, u){
  const C = u.ceremonie || {};
  if(C.fige){
    c.innerHTML = `<p class="itip-gris">Le texte de votre mariage est figé.</p><div class="u-texte"><p>${echapper(C.texte || "").replace(/\n/g, "<br>")}</p></div>`;
    return;
  }
  const alerte = C.edition ? `<p class="u-alerte">✍️ ${echapper(u.nom)} est en train de modifier le texte.</p>` : "";
  c.innerHTML = `<p>Votre texte de mariage, à écrire à deux. Il sera figé le <b>${_uDate(C.fige_le)}</b>. S'il reste vide, un texte sera écrit pour vous.</p>
    ${alerte}<div id="u-conflit"></div>
    <textarea id="u-texte" maxlength="2000" rows="8" style="width:100%;box-sizing:border-box">${echapper(C.texte || "")}</textarea>
    <div class="actions"><span class="itip-gris" id="u-compte"></span><button class="mini" id="u-sauver">Enregistrer</button></div>`;
  let version = C.maj_le || null;
  const ta = c.querySelector("#u-texte"), compte = c.querySelector("#u-compte");
  const maj = () => { compte.textContent = `${ta.value.length}/2000`; };
  maj();
  ta.addEventListener("input", () => { maj(); _uSignalerEdition(true); });
  ta.addEventListener("focus", () => _uSignalerEdition(true));
  ta.addEventListener("blur", () => _uSignalerEdition(false));
  c.querySelector("#u-sauver").addEventListener("click", async () => {
    try{
      const { data, error } = await sb.rpc("union_texte_sauver", { p_texte:ta.value, p_version:version });
      if(error){ _jc("Le serveur n'a pas répondu — réessaie.","alerte"); return; }
      if(data && data.err === "conflit"){
        // Rien n'est écrasé : on montre la version de l'autre, puis on peut enregistrer.
        version = data.maj_le;
        c.querySelector("#u-conflit").innerHTML = `<p class="u-alerte">${echapper(u.nom)} a modifié le texte pendant que tu écrivais. Voici sa version ; reprends ce qu'il faut, puis enregistre.</p>
          <div class="u-texte"><p>${echapper(data.texte || "").replace(/\n/g, "<br>")}</p></div>`;
        return;
      }
      if(!data || !data.ok){ _uRefus(data); return; }
      version = data.maj_le; _editionSignal = 0;
      _jc("Texte de mariage enregistré.", "gain");
      await chargerUnion();
    }catch(e){ _jc("Connexion au serveur perdue — réessaie.","alerte"); }
  });
}
/* « J'écris » : au plus une fois toutes les 30 s ; « j'ai fini » à la sortie. */
function _uSignalerEdition(enCours){
  const t = Date.now();
  if(enCours && t - _editionSignal < 30000) return;
  _editionSignal = enCours ? t : 0;
  try{ sb.rpc("union_texte_editer", { p_en_cours:!!enCours }); }catch(e){}
}

/* Rafraîchissement : l'onglet Couple ouvert voit le choix de l'autre et
   l'avertissement d'écriture (toutes les 45 s, onglet visible seulement). */
setInterval(() => {
  if(document.hidden || !estMarie()) return;
  const p = document.querySelector('.panneau[data-panneau="couple"]');
  if(!p || !p.classList.contains("actif")) return;
  /* v1.36z — retour testeur : dans Confidences, le texte en cours s'effaçait
     (cette relecture redessinait tout l'onglet). Confidences a sa propre
     relecture (du fil seulement) ; et on ne redessine JAMAIS pendant qu'un
     champ de l'onglet a le focus ou contient du texte. */
  if(_coupleOnglet === "confidences") return;
  const champ = [...p.querySelectorAll("textarea, input[type=text]")];
  if(champ.some(t => document.activeElement === t || (t.value || "").trim())) return;
  chargerUnion().then(() => majCouple());
}, 45000);
document.addEventListener("visibilitychange", () => { if(!document.hidden && etat && etat.inscrit) chargerUnion(); });
