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
  trop_long:"2 000 caractères au plus.",
  // v1.37 — enfants (v161)
  enfant:"Un enfant est déjà là (ou attendu) : un seul à la fois.",
  aucun_enfant:"Il n'y a pas d'enfant à nommer.",
  pas_encore:"Le bébé n'est pas encore arrivé.",
  scelle:"Le prénom est scellé : le stade « petit » est passé.",
  prenom:"Prénom invalide : 2 à 20 lettres (espaces, traits d'union et apostrophes permis).",
  // v1.38 — gestes (v162)
  gele:"Tout est figé : l'un de vous est en pause ou au Couloir.",
  deja_geste:"Tu as déjà fait ton geste aujourd'hui.",
  geste:"Ce geste n'est pas possible à cet âge.",
  objet:"Il faut une ration chaude ou une plante comestible.",
  domaine:"Domaine inconnu.",
  // v1.39 — cachette de l'Éclaireur (v163)
  aucune:"Il n'y a pas de cachette à fouiller en ce moment.",
  deja_fouillee:"La cachette a déjà été fouillée.",
  ailleurs:"La cachette est sur la carte de Silène.",
  sac:"Fais de la place dans ton sac : il faut 2 places libres."
};

/* v1.37 — E2 : l'action 21 s'adapte au couple (genre connu et figé) :
   couple de même genre → « Demander à adopter », même mécanique. Le serveur
   dit lequel (`union.enfant_mode`, v161). */
const ACTION_ADOPTER = { nom:"Demander à adopter",
  phrase:"Vous avez rempli le dossier à quatre mains et l'avez envoyé. Il en faudra peut-être d'autres.",
  seul:"{nom} aimerait demander à adopter." };
function _modeEnfant(){ const u = _union && _union.union; return (u && u.enfant_mode) || "bebe"; }
function _actionCouple(n){ return (n === 21 && _modeEnfant() === "adoption") ? ACTION_ADOPTER : ACTIONS_COUPLE[n]; }

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
    if(data.union) _coqueEnfant();                      // v1.39 : Mécano
    if(data.union) _cfVerifier();                       // v1.48 : pastille des Confidences
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
  // v1.40 — décision de l'autrice : divorce et veuvage effacent les enfants du couple.
  if(_aDesEnfants(u)) h += `<p class="itip-gris">⚠ Au divorce, tout ce qui concerne vos enfants sera effacé : la Famille, les lettres, les cachettes.</p>`;
  if(!d) return h + avert + `<p class="itip-gris">Demander le divorce coûte 50 points de Complicité.</p><div class="actions"><button class="mini danger" data-u="divorcer">Demander le divorce</button></div>`;
  if(d.par_moi){
    const pret = Date.now() >= new Date(d.forcable_le).getTime();
    return h + `<p>Tu as demandé le divorce le ${_uDate(d.depuis)}. ${pret ? "Tu peux maintenant le prononcer." : `Sans réponse, tu pourras le prononcer le ${_uDate(d.forcable_le)}.`}</p>` + avert +
      `<div class="actions"><button class="mini" data-u="divorce-annuler">Annuler la demande</button>${pret ? `<button class="mini danger" data-u="divorcer">Prononcer le divorce</button>` : ""}</div>`;
  }
  return h + `<p><b>${echapper(u.nom)}</b> demande le divorce. Sans réponse de ta part, il sera prononcé à partir du ${_uDate(d.forcable_le)}.</p>` + avert +
    `<div class="actions"><button class="mini danger" data-u="divorcer">Accepter le divorce</button></div>`;
}
function _aDesEnfants(u){ return !!(u && ((u.enfant && u.enfant.stade !== "aucun") || (u.famille && u.famille.length))); }
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
        + ((u && !u.je_suis_hote) ? " Au divorce, tout ce que tu as construit pendant le mariage (hors maison) sera détruit ; tu retrouveras ton terrain d'avant." : "")
        + (_aDesEnfants(u) ? " Tout ce qui concerne vos enfants sera effacé : la Famille, les lettres, les cachettes." : "");   // v1.40 (v164)
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
  const A = _actionCouple(n); if(!A) return "";
  detail = detail || {};
  if(n === 1) return A.phrase.replace("{cadeau}", detail.cadeau || "petit cadeau");
  if(n === 5 && detail.ratee) return A.ratee;
  // v1.37 : tentative à deux ratée → « Pas cette fois. » (reussi, v161).
  if(n === 21) return detail.tentative ? A.phrase + (detail.reussi === false ? " Pas cette fois." : "") : A.seul.replace("{nom}", qui || "?");
  return A.phrase;
}
async function majCouple(){
  const el = document.querySelector("#couple-vue"); if(!el) return;
  if(!_union) await chargerUnion();
  const u = _union && _union.union;
  if(!u){ el.innerHTML = `<h2>Couple</h2><p class="vide">Tu n'es pas marié·e. Les demandes se font aux Unions, au Centre.</p>`; return; }
  const onglets = [["actions","Actions"],["famille","Famille"],["reserve","Réserve"],["confidences","Confidences"],["ceremonie","Cérémonie"]];
  el.innerHTML = `<h2>Couple <span class="pts">avec ${echapper(u.nom || "?")}</span></h2>
    <div class="sous-menu">${onglets.map(([k,t]) => `<button class="sous-lien${_coupleOnglet===k?" actif":""}" data-co="${k}">${t}</button>`).join("")}</div>
    <div id="couple-corps"></div>`;
  el.querySelectorAll("[data-co]").forEach(b => b.addEventListener("click", () => { _coupleOnglet = b.dataset.co; majCouple(); }));
  _cfMarques();                                                    // v1.48 : pastille « nouveau message »
  const c = el.querySelector("#couple-corps");
  if(_coupleOnglet === "famille") return _coupleFamille(c, u);
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
  const A = _actionCouple(n); if(!A) return "";
  if(n === 1) return A.phrase.replace("{cadeau}", "petit cadeau");
  return A.phrase;
}
function _carteFaite(qui, n, detail, nomQui){
  if(n == null) return `<div class="co-carte co-attente"><div class="co-img co-vide"></div>
      <div><div class="co-qui">${qui}</div><div class="itip-gris">${qui === "Toi" ? "Tu n'as pas encore fait ton action aujourd'hui." : "N'a pas encore fait son action aujourd'hui."}</div></div></div>`;
  const A = _actionCouple(n) || { nom:"?" };
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
  /* v1.37 — E1 : tant qu'un enfant est attendu ou à la maison, l'action 21
     est remplacée par une carte grisée. */
  const enf = (u.enfant && u.enfant.stade !== "aucun") ? u.enfant : null;   // v1.39 : « aucun » = cachette seule
  const dispo = [ ...(j.mes_actions || []), ...(enf ? [] : [21]), ...((j.toujours || [9,10,20]).filter(a => a !== 21)) ];
  const fait = j.mon_choix != null;
  h += `<h4 class="co-titre">Actions possibles aujourd'hui</h4>`
     + (fait ? `<p class="itip-gris">Tu as déjà fait ton action de couple aujourd'hui. Reviens demain (minuit, heure de Paris).</p>` : "")
     + `<div class="co-liste">` + dispo.map(a => {
          const A = _actionCouple(a); if(!A) return "";
          return `<button class="co-choix${A.negative ? " co-neg" : ""}" data-act="${a}"${fait ? " disabled" : ""}>
            ${_imgAction(a)}<span><span class="co-nom">${A.nom}</span><i class="co-phrase">${echapper(_phraseApercu(a))}</i></span></button>`;
        }).join("")
     + (enf ? `<div class="co-choix co-enfant" aria-disabled="true">${_imgAction(21)}<span><span class="co-nom">${enf.stade === "attendu" ? "Un enfant est attendu" : "Un enfant est déjà là"}</span>
          <i class="co-phrase">Un seul à la fois. Retrouvez-le dans Famille.</i></span></div>` : "")
     + `</div>`;
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

/* ===========================================================
   v1.37 — FAMILLE (enfants, brique 1 : arrivée, prénom, croissance).
   Cadrage : PASSATION partie D, E1-E7. Tout est décidé au serveur
   (v161 : _enfant_tenter, _enfant_maj, enfant_nommer) ; `union.enfant`
   = l'enfant attendu ou à la maison, `union.famille` = ceux qui sont partis.
   Stades : petit 3 j, enfant 7 j, adolescent 11 j, départ à 21 j. Un parent
   en pause ou au Couloir fige tout (décision A, 04/10).
   =========================================================== */
const STADES_ENFANT = { attendu:"Attendu", petit:"Tout-petit", enfant:"Enfant", ado:"Adolescent·e" };
const RE_PRENOM = /^[A-Za-zÀ-ÖØ-öø-ÿŒœ]+([ '’-][A-Za-zÀ-ÖØ-öø-ÿŒœ]+)*$/;   // = _enfant_prenom (serveur)
function _prenomPropre(t){
  const p = String(t || "").trim().replace(/\s+/g, " ");
  return (p.length >= 2 && p.length <= 20 && RE_PRENOM.test(p)) ? p : null;
}
function _jours(n){ return `${n} jour${n > 1 ? "s" : ""}`; }
// Affichage seul : le tirage est fait par le serveur (70 % × (C/100)², E1).
function chanceEnfant(c){ return Math.round(70 * Math.pow((Number(c) || 0) / 100, 2)); }

/* v1.38 — brique 2 : soins, bien-être, vocation, lettre (v162). Textes. */
const VOCATIONS = { bricoleur:"Bricoleur", eclaireur:"Éclaireur", cuistot:"Cuistot", soigneur:"Soigneur", mecano:"Mécano", gardien:"Gardien" };
// Ce que l'on apprend (bouton « Lui apprendre ») → la vocation du même nom.
const DOMAINES_LECON = { bricoleur:"Réparer", eclaireur:"Explorer", cuistot:"Cuisiner", soigneur:"Soigner", mecano:"Mécanique", gardien:"Veiller" };
const NOURRITURE_ENFANT = ["fab_ration_chaude", "ferragave", "nectine", "sporelle"];   // = _enfant_nourriture (serveur)
const GESTES_ENFANT = {
  nourrir:   { nom:"Nourrir", gain:15, stades:["petit","enfant","ado"], phrases:{
    petit:"Une cuillère dans la bouche, trois sur la table.",
    enfant:"Assiette vide. Les légumes ont disparu… sous la table.",
    ado:"L'assiette est vide en trente secondes. Le « merci » est en option." } },
  calin:     { nom:"Câliner et coucher", gain:8, stades:["petit","enfant","ado"], phrases:{
    petit:"Une berceuse, deux fois. Chantée faux, et ça a marché.",
    enfant:"« Encore cinq minutes. » Il y en a eu vingt.",
    ado:"Un câlin ? « Bon. Vite, alors. »" } },
  jouer:     { nom:"Jouer", gain:10, stades:["enfant","ado"], phrases:{
    enfant:"Cache-cache dans la cité. Perdu deux fois, et pas exprès.",
    ado:"Une partie de cartes. Perdue avec panache." } },
  apprendre: { nom:"Lui apprendre", gain:5, stades:["enfant"], phrases:{
    bricoleur:"Un tournevis, une vieille radio, une heure de patience.",
    eclaireur:"Lire une carte, trouver le nord, compter ses pas.",
    cuistot:"Éplucher une Ferragave sans y laisser un doigt.",
    soigneur:"Un pansement sur la patte d'une peluche. Elle s'en remettra.",
    mecano:"Le nom de chaque pièce d'un moteur. Ou presque.",
    gardien:"Monter la garde devant la porte. Avec le plus grand sérieux." } }
};
function _phraseGeste(g, stade){
  if(!g) return "";
  const G = GESTES_ENFANT[g.geste]; if(!G) return "";
  if(g.geste === "apprendre") return G.phrases[g.detail] || "";
  return G.phrases[stade] || G.phrases.enfant || "";
}
function _nomGeste(g){
  if(!g) return "";
  const G = GESTES_ENFANT[g.geste] || { nom:"?" };
  if(g.geste === "apprendre") return `${G.nom} : ${DOMAINES_LECON[g.detail] || "?"}`;
  if(g.geste === "nourrir" && g.detail) return `${G.nom} (${_uNom(g.detail)})`;
  return G.nom;
}
/* La lettre (E3d) : 5 modèles × une phrase selon la vocation. Le serveur ne
   garde que le numéro du modèle : les textes vivent ici. */
const LETTRE_VOCATION = {
  bricoleur:"Ici, tout grince. On vient me chercher dès qu'une porte refuse de fermer ; j'ai toujours un tournevis dans la poche.",
  eclaireur:"Je passe mes journées dehors, à repérer les chemins que personne ne prend. Je compte encore mes pas.",
  cuistot:"Je fais la cuisine pour toute une tablée maintenant. Personne ne se plaint. Sauf de la salade, comme toujours.",
  soigneur:"On m'appelle pour les coupures, les fièvres et les chagrins. Les pansements, c'est vous qui me les avez appris.",
  mecano:"J'ai du cambouis jusqu'aux coudes du matin au soir. Hier, un moteur a redémarré rien qu'en m'entendant arriver. Enfin, presque.",
  gardien:"Je monte la garde aux portes de la cité. Les nuits sont longues ; je pense à vous, et elles le sont moins.",
  aucune:"Je ne sais pas encore ce que je veux faire. Je cherche. Vous disiez que ce n'était pas grave : je m'en souviens."
};
const LETTRES_ENFANT = {
  1:"Bonjour à vous deux,\n\nÇa fait des semaines que je veux vous écrire. {voc}\n\nJe vais bien. Mangez correctement, dormez assez — oui, c'est moi qui le dis, pour une fois.\n\n{prenom}",
  2:"À vous deux,\n\nLa maison me manque, surtout le soir. {voc}\n\nJe ne reviens pas tout de suite, mais je n'oublie rien.\n\nAvec tout mon amour,\n{prenom}",
  3:"Bonjour,\n\nJe vous écris sur le seul papier que j'ai trouvé, alors je fais court. {voc}\n\nGardez-moi une place à table, au cas où.\n\n{prenom}",
  4:"À mes parents,\n\nOn me demande souvent d'où je viens. Je réponds : d'une maison où l'on se disputait pour la vaisselle. {voc}\n\nMerci pour tout. Vraiment.\n\n{prenom}",
  5:"Bonjour à vous deux,\n\nHier soir, j'ai regardé Maar tourner, et j'ai pensé à vous. {voc}\n\nÀ bientôt, j'espère.\n\n{prenom}"
};
function texteLettre(p){
  const m = LETTRES_ENFANT[(p.lettre && p.lettre.modele) || 1] || LETTRES_ENFANT[1];
  return m.replace("{voc}", LETTRE_VOCATION[p.vocation] || LETTRE_VOCATION.aucune).replace("{prenom}", p.prenom || "");
}

function _imgGeste(g, d){   // v1.48 : comme les actions de couple ; absente = rien
  const f = g === "apprendre" && d ? `geste_apprendre_${d}` : `geste_${g}`;
  return `<img class="fa-geste-img" src="images/famille/${f}.png" alt="" onerror="this.remove()">`;
}
function _carteGeste(qui, g, stade){
  if(!g) return `<div class="co-carte co-attente"><div><div class="co-qui">${qui}</div><div class="itip-gris">Pas encore de geste aujourd'hui.</div></div></div>`;
  return `<div class="co-carte">${_imgGeste(g.geste, g.detail)}<div><div class="co-qui">${qui} <span class="co-fait">✓ fait</span></div><div class="co-nom">${echapper(_nomGeste(g))}</div>
    <i class="co-phrase">${echapper(_phraseGeste(g, stade))}</i></div></div>`;
}
function _blocSoins(e, u){
  const G = e.gestes || {}, fait = !!G.moi, bloque = fait || e.gele;
  let h = `<div class="jauge fa-jauge"><div class="jauge-tete"><span>Bien-être</span><span class="val">${e.bien_etre}</span></div>
    <div class="piste"><div class="remplissage${e.bien_etre < 30 ? " fa-bas" : ""}" style="width:${e.bien_etre}%"></div></div></div>`;
  if(e.soir === 1) h += `<p class="itip-gris">Hier soir : bien-être de 70 ou plus, Complicité +1.</p>`;
  else if(e.soir === -2) h += `<p class="u-alerte">Hier soir : bien-être sous 30, Complicité −2.</p>`;
  if(e.jours_zero > 0) h += `<p class="u-alerte">À 0 depuis ${_jours(e.jours_zero)} : au troisième jour entier, l'enfant fugue.</p>`;
  h += `<h4 class="gsec">Les gestes du jour</h4>`;   // v1.48 : titre AU-DESSUS des deux cartes
  h += `<div class="co-jour">${_carteGeste(echapper(u.nom || "?"), G.autre, e.stade)}${_carteGeste("Toi", G.moi, e.stade)}</div>`;
  h += `<h4 class="gsec">Ton geste</h4>`;
  if(e.gele) h += `<p class="itip-gris">Tout est figé : l'un de vous est en pause ou au Couloir.</p>`;
  else if(fait) h += `<p class="itip-gris">Tu as fait ton geste aujourd'hui. Reviens demain (minuit, heure de Paris).</p>`;
  h += `<div class="fa-gestes">`;
  // Nourrir : une ration ou une plante comestible du SAC.
  const vivres = NOURRITURE_ENFANT.filter(id => (etat.sac && etat.sac[id]) > 0);
  if(vivres.length) h += vivres.map(id => `<button class="mini fa-gbtn" data-geste="nourrir" data-detail="${id}"${bloque ? " disabled" : ""}>${_imgGeste("nourrir")}Nourrir — ${echapper(_uNom(id))} <span class="qte">×${etat.sac[id]}</span> (+15)</button>`).join("");
  else h += `<button class="mini" disabled title="Une ration chaude ou une plante comestible (Ferragave, Nectine, Sporelle) dans le sac.">Nourrir (rien dans le sac)</button>`;
  h += `<button class="mini fa-gbtn" data-geste="calin"${bloque ? " disabled" : ""}>${_imgGeste("calin")}Câliner et coucher (+8)</button>`;
  if(GESTES_ENFANT.jouer.stades.includes(e.stade)) h += `<button class="mini fa-gbtn" data-geste="jouer"${bloque ? " disabled" : ""}>${_imgGeste("jouer")}Jouer (+10)</button>`;
  h += `</div>`;
  if(e.stade === "enfant"){
    h += `<h4 class="gsec">Lui apprendre <span class="itip-gris">(+5, et une leçon)</span></h4><div class="fa-gestes">`
      + Object.entries(DOMAINES_LECON).map(([k, t]) => `<button class="mini fa-gbtn" data-geste="apprendre" data-detail="${k}"${bloque ? " disabled" : ""}>${_imgGeste("apprendre", k)}${t} <span class="qte">${(e.lecons || {})[k] || 0}</span></button>`).join("")
      + `</div><p class="itip-gris">À l'adolescence, le domaine le plus travaillé (par vous deux) devient sa vocation ; à égalité, le hasard tranche. Sans aucune leçon : pas de vocation.</p>`;
  } else if(e.stade === "ado"){
    h += `<p>Vocation : <b>${e.vocation ? VOCATIONS[e.vocation] || e.vocation : "aucune"}</b>${e.vocation ? "" : " — faute de leçons, pas d'aide."}</p>`;
    if(e.vocation) h += _blocAide(e);
  }
  h += `<p class="itip-gris">Un geste par jour chacun. Le bien-être perd 10 chaque nuit. Le soir : 70 ou plus → Complicité +1 ; sous 30 → −2. Trois jours entiers à 0 : l'enfant fugue.</p>`;
  return h;
}

/* v1.39 — brique 3 : les aides de minuit (v163). Une par nuit, adolescent
   d'au moins 40 de bien-être le soir. Textes ici ; le serveur décide. */
const AIDES_VOCATION = {
  bricoleur:"Chaque nuit, répare de 10 % la structure la plus abîmée de vos deux terrains.",
  eclaireur:"Tous les 3 jours, repère une cachette sur la carte de Silène : le premier de vous deux qui s'y rend la fouille, le jour même ou le lendemain.",
  cuistot:"Chaque nuit, cuisine une plante comestible (réserve commune, sinon un coffre) : +5 de moral chacun.",
  soigneur:"Chaque nuit : +5 de santé chacun.",
  mecano:"Chaque nuit : +5 PV de coque au vaisseau équipé de chacun.",
  gardien:"Quand vous êtes tous les deux hors de Silène, les dégâts du Protocole et des expéditions sur vos terrains sont divisés par deux."
};
function _blocAide(e){
  let h = `<p class="itip-gris">${AIDES_VOCATION[e.vocation] || ""} Aucune aide si son bien-être est sous 40 le soir.</p>`;
  if(e.vocation === "gardien") h += `<p>${e.gardien ? "Veille en ce moment : vous êtes tous les deux hors de Silène." : "Veille dès que vous êtes tous les deux hors de Silène."}</p>`;
  else if(e.aide && e.aide.texte) h += `<p class="fa-aide">Dernière aide (${_uDate(e.aide.le)}) : ${echapper((typeof joliserItems === "function") ? joliserItems(e.aide.texte) : e.aide.texte)}</p>`;
  if(e.cachette) h += _blocCachette(e.cachette);
  return h;
}
// Position sur la carte de Silène (null ailleurs : La Braise, Le Suaire, Triptolème).
function _posSilene(){
  const s = etat && etat.secteur;
  if(s === "braise" || s === "suaire" || s === "ecart") return null;
  return etat.pos || null;
}
function _blocCachette(k){
  if(k.fouillee) return `<p class="itip-gris">La cachette (${k.x}, ${k.y}) a été fouillée${k.par_moi ? " par toi" : ""}.</p>`;
  const p = _posSilene();
  const d = p ? Math.round(Math.hypot(p.x - k.x, p.y - k.y)) : null;
  const ici = d != null && d <= 80;
  return `<div class="fa-cachette"><p><b>Cachette</b> en <b>(${k.x}, ${k.y})</b> sur la carte de Silène — jusqu'au ${_uDate(k.jusqua)} inclus.
      <span class="itip-gris">${p ? (ici ? "Tu y es." : `Tu es à ${d} u.`) : "Tu n'es pas sur la carte de Silène."}</span></p>
    <button class="mini" id="fa-fouiller"${ici ? "" : " disabled"}>Fouiller ici</button></div>`;
}
/* Mécano : les PV de coque déposés par le serveur (la coque vit dans donnees). */
let _coqueTs = 0;
async function _coqueEnfant(){
  if(Date.now() - _coqueTs < 60000) return; _coqueTs = Date.now();
  let d = null; try{ ({ data:d } = await sb.rpc("enfant_coque_prendre")); }catch(e){ return; }
  if(!d || !d.ok || !(d.points > 0)) return;
  const qui = d.prenom || "Votre enfant";
  if(etat.vaisseau && typeof reparerPv === "function"){
    const g = reparerPv(d.points);
    _jc(g > 0 ? `${qui} a révisé ton vaisseau : +${g} PV de coque.` : `${qui} a révisé ton vaisseau : la coque était déjà intacte.`, "gain");
    if(typeof majVaisseau === "function") majVaisseau();
    if(typeof sauvegarder === "function") sauvegarder();
  } else _jc(`${qui} voulait réviser ton vaisseau, mais aucun n'est équipé.`, "");
}

function _faBanniere(c, e, adopt){
  const ban = c.querySelector("#fa-ban"), img = c.querySelector("#fa-ban-img"); if(!ban || !img) return;
  const ad = adopt || e.adopte;
  const essais = e.stade === "attendu" ? [ad ? "famille_adoption" : "famille_naissance"]
               : (ad ? [`famille_${e.stade}_adoption`, `famille_${e.stade}`] : [`famille_${e.stade}`]);
  let k = 0;
  img.onload  = () => { ban.hidden = false; };
  img.onerror = () => { k++; if(k < essais.length) img.src = `images/couple/${essais[k]}.png`; else ban.hidden = true; };
  img.src = `images/couple/${essais[0]}.png`;
}
function _coupleFamille(c, u){
  const e = (u.enfant && u.enfant.stade !== "aucun") ? u.enfant : null, adopt = _modeEnfant() === "adoption";
  const cachette = u.enfant && u.enfant.cachette;           // v1.39 : peut survivre au départ
  /* v1.55 — bannière TOUT EN HAUT selon le stade (dossier images/couple/) :
     attendu → famille_naissance.png (couple mixte) ou famille_adoption.png (même
     genre) ; puis famille_petit / famille_enfant / famille_ado.png, avec une
     variante _adoption si elle existe (ex. famille_petit_adoption.png). Masquée
     tant qu'aucun fichier ne charge. */
  let h = e ? `<div class="lieu-banniere fa-banniere" id="fa-ban" hidden><img id="fa-ban-img" alt=""></div>` : "";
  if(!e){
    h += `<div class="sous-carte fa-carte"><h3>Pas d'enfant à la maison</h3>
      <p>${adopt ? "Pour accueillir un enfant, choisissez tous les deux « Demander à adopter » le même jour (Actions)."
                 : "Pour accueillir un enfant, choisissez tous les deux « Essayer d'avoir un bébé » le même jour (Actions)."}</p>
      <p class="itip-gris">Chance à chaque essai à deux : 70 % × (Complicité ÷ 100)², soit <b>${chanceEnfant(u.complicite)} %</b> aujourd'hui. Un enfant à la fois.</p></div>`;
  } else if(e.stade === "attendu"){
    h += `<div class="sous-carte fa-carte"><h3>Un bébé est attendu</h3>
      <p>${adopt ? "Votre bébé sera à la maison" : "Le bébé arrivera"} dans <b>${_jours(e.restant)}</b> (à minuit, heure de Paris).</p>
      ${e.gele ? `<p class="itip-gris">Tout est figé : l'un de vous est en pause ou au Couloir.</p>` : ""}</div>`;
  } else {
    const titre = e.prenom ? echapper(e.prenom) : "Le bébé <span class=\"itip-gris\">(pas encore de prénom)</span>";
    // v1.48 — phrasé revu ; une bannière par stade (images/famille/<stade>.png, s'affiche dès qu'elle existe).
    const suite = { petit:`Encore ${_jours(e.restant)} avant de grandir. Ensuite, son prénom sera définitif.`,
                    enfant:`Encore ${_jours(e.restant)} avant l'adolescence.`,
                    ado:`Encore ${_jours(e.restant)} avant de quitter la maison.` }[e.stade] || "";
    h += `<div class="sous-carte fa-carte"><h3>${titre} <span class="qte">${STADES_ENFANT[e.stade] || ""}</span></h3>
      <p class="itip-gris">${suite}</p>`;
    if(e.nommable){
      h += `<div class="fa-nom"><input type="text" id="fa-prenom" maxlength="20" placeholder="${e.prenom ? "Actuel : " + echapper(e.prenom) : "Un prénom…"}">
          <button class="mini" id="fa-nommer">${e.prenom ? "Changer" : "Choisir ce prénom"}</button></div>
        <p class="itip-gris">À choisir à deux : chacun peut le donner ou le changer jusqu'à la fin du stade « petit ». Ensuite, il est scellé. Faute de prénom, on lui en trouvera un.</p>`;
    }
    if(typeof e.bien_etre === "number") h += _blocSoins(e, u);      // v1.38 (serveur v162)
    if(e.histoire && typeof _blocHistoire === "function") h += _blocHistoire(e, u);   // v1.41 (histoires.js, v165)
    h += `</div>`;
  }
  if(cachette && !(e && e.stade === "ado")) h += _blocCachette(cachette);
  const partis = u.famille || [];
  if(partis.length){
    h += `<h4 class="gsec">Enfants partis</h4><div class="fa-partis">` + partis.map(p => {
      const voc = p.vocation ? echapper(VOCATIONS[p.vocation] || p.vocation) : "sans vocation";
      const quand = p.statut === "fugue" ? "parti trop tôt" : p.statut === "proches" ? "chez des proches" : "départ";
      const lettre = p.lettre ? `<details class="fa-lettre"><summary>Sa lettre (${_uDate(p.lettre.recue_le)})</summary><p>${echapper(texteLettre(p)).replace(/\n/g, "<br>")}</p></details>` : "";
      return `<div class="fa-parti"><b>${echapper(p.prenom || "?")}</b> — ${voc} <span class="itip-gris">· ${quand}${p.parti_le ? " le " + _uDate(p.parti_le) : ""}</span>${lettre}</div>`;
    }).join("") + `</div>`;
  }
  c.innerHTML = h;
  if(e) _faBanniere(c, e, adopt);
  const b = c.querySelector("#fa-nommer");
  if(b) b.addEventListener("click", async () => {
    const champ = c.querySelector("#fa-prenom");
    const p = _prenomPropre(champ && champ.value);
    if(!p){ _jc(UNION_REFUS.prenom, "alerte"); return; }
    b.disabled = true;
    const r = await _uRpc("enfant_nommer", { p_prenom:p });
    b.disabled = false;
    if(!r) return;
    _jc(`Prénom choisi : ${r.prenom}.`, "gain");
    if(champ) champ.value = "";       // la relecture de 45 s ne redessine pas un champ rempli
    await chargerUnion(); majCouple();
  });
  const champ = c.querySelector("#fa-prenom");
  if(champ) champ.addEventListener("keydown", ev => { if(ev.key === "Enter"){ ev.preventDefault(); b.click(); } });
  if(e && typeof _brancherHistoire === "function") _brancherHistoire(c, e, u);   // v1.41
  // v1.39 — la cachette de l'Éclaireur (enfant_fouiller, v163).
  const bf = c.querySelector("#fa-fouiller");
  if(bf) bf.addEventListener("click", async () => {
    const p = _posSilene(); if(!p){ _jc(UNION_REFUS.ailleurs, "alerte"); return; }
    bf.disabled = true;
    let d = null; try{ ({ data:d } = await sb.rpc("enfant_fouiller", { p_x:Math.round(p.x), p_y:Math.round(p.y) })); }catch(err){}
    bf.disabled = false;
    if(!d){ _jc("Le serveur n'a pas répondu — réessaie.", "alerte"); return; }
    if(!d.ok){ _jc(d.err === "loin" ? "Rien ici : la cachette est plus loin." : (UNION_REFUS[d.err] || `Fouille refusée (${d.err}).`), "alerte"); return; }
    const liste = Object.entries(d.gains || {}).map(([id, n]) => `${n}× ${_uNom(id)}`).join(", ");
    _jc(`Cachette de ${d.prenom || "votre enfant"} : ${liste || "rien"}.`, "gain");
    if(typeof chargerStocksServeur === "function") await chargerStocksServeur();
    await chargerUnion(); majCouple(); if(typeof afficher === "function") afficher();
  });
  // v1.38 — les gestes (enfant_geste, v162).
  c.querySelectorAll("[data-geste]").forEach(bt => bt.addEventListener("click", async () => {
    if(bt.disabled) return;
    c.querySelectorAll("[data-geste]").forEach(x => { x.disabled = true; });
    const g = bt.dataset.geste, d = bt.dataset.detail || null;
    const r = await _uRpc("enfant_geste", { p_geste:g, p_detail:d });
    if(r){
      _jc(`${_nomGeste({ geste:g, detail:d })} : bien-être ${r.bien_etre}.`, "gain");
      if(g === "nourrir" && typeof chargerStocksServeur === "function") await chargerStocksServeur();
    }
    await chargerUnion(); majCouple();
    if(r && typeof afficher === "function") afficher();
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
  _cfVu(liste);                                                    // v1.48 : lu → la pastille s'éteint
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
  if(typeof _histJeuEnCours !== "undefined" && _histJeuEnCours) return;   // v1.41 : pas pendant un mini-jeu d'histoire
  const champ = [...p.querySelectorAll("textarea, input[type=text]")];
  if(champ.some(t => document.activeElement === t || (t.value || "").trim())) return;
  chargerUnion().then(() => majCouple());
}, 45000);
document.addEventListener("visibilitychange", () => { if(!document.hidden && etat && etat.inscrit) chargerUnion(); });

/* ===========================================================
   v1.48 — PASTILLE « NOUVEAU MESSAGE » DES CONFIDENCES (demande de l'autrice).
   Côté client seulement : on retient la date du dernier message de sa moitié
   déjà lu (etat._cfVu) ; toutes les 90 s (onglet visible), on regarde s'il y en
   a un plus récent. Pastille sur l'onglet « Couple » et sur « Confidences » ;
   elle s'éteint dès que les Confidences sont affichées.
   =========================================================== */
let _cfNouveau = false;
function _cfDernierDeLui(liste){
  let d = ""; for(const m of (liste || [])) if(!m.moi && m.cree_le && m.cree_le > d) d = m.cree_le;
  return d;
}
function _cfMarques(){
  const o = document.querySelector('.onglet[data-onglet="couple"]'); if(o) o.classList.toggle("a-nouveau", _cfNouveau);
  const b = document.querySelector('[data-co="confidences"]'); if(b) b.classList.toggle("a-nouveau", _cfNouveau);
}
function _cfVu(liste){
  const d = _cfDernierDeLui(liste);
  if(d && (!etat._cfVu || d > etat._cfVu)) etat._cfVu = d;
  _cfNouveau = false; _cfMarques();
}
let _cfVerifTs = 0;
async function _cfVerifier(){
  if(!(_union && _union.union) || Date.now() - _cfVerifTs < 60000) return;
  _cfVerifTs = Date.now();
  if(_coupleOnglet === "confidences" && document.querySelector("#cf-fil")) return;   // déjà sous les yeux
  let r = null; try{ ({ data:r } = await sb.rpc("union_chat_lire", { p_limite:60 })); }catch(e){ return; }
  if(!r || !r.ok) return;
  const d = _cfDernierDeLui(r.liste);
  _cfNouveau = !!(d && (!etat._cfVu || d > etat._cfVu));
  _cfMarques();
}
setInterval(() => { if(!document.hidden) _cfVerifier(); }, 90000);
