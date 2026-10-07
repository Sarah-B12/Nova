/* ===========================================================
   DEV-CONSOLE — Console de développement / modération.
   Réservée à toi (et plus tard aux modérateurs). NON destinée aux joueurs.

   ⚠️ SÉCURITÉ : côté client, RIEN n'est réellement inaccessible (un joueur
   déterminé peut lire le JS ou le localStorage). Ce mot de passe + raccourci
   ne font que DISSUADER. La vraie protection viendra du BACKEND : ne servir /
   n'activer ce fichier que pour les comptes admin (vérif côté serveur).

   Ouverture : Ctrl + Shift + D  →  mot de passe.
   =========================================================== */
let _devMonte = false;

/* ===========================================================
   v1.34 — RANGEMENT DE LA CONSOLE (décidé avec l'autrice le 28/09).
   Onglets rangés par « sur qui ça agit », sections à titres bien visibles.
   Les blocs sont TOUJOURS construits par majDev() (mêmes id, mêmes
   branchements) dans une zone cachée (.dev-stage) ; _devRanger() les déplace
   ici. Un nœud déplacé garde ses écouteurs : aucune action n'a changé.
   `sel` : élément à déplacer · `bloc` : prendre son .dev-bloc parent ·
   `up` : prendre ce parent · `titre:false` : retirer le petit titre du bloc
   (la section en a déjà un) · `bouton` : bouton isolé, rangé en ligne.
   =========================================================== */
const DEV_ONGLETS = [
  { id:"joueurs", nom:"Joueurs", sections:[
    { id:"chercher", titre:"🔎 Rechercher un joueur", items:[
      { sel:"#dev-recherche > p.dev-note" }, { sel:"#dev-q", up:".dev-champ" }, { sel:"#dev-res" } ] },
    { id:"pa", titre:"✨ Donner des points d'Aptitude", items:[ { sel:"#dev-pa-btn", bloc:true, titre:false } ] },
    { id:"apparence", titre:"🎭 Apparence — verrou", items:[ { sel:"#dev-app-lire", bloc:true, titre:false } ] } ] },
  { id:"perso", nom:"Mon perso", devSeul:true, sections:[
    { id:"etat", titre:"❤️ État", note:"Tests sur <b>ce personnage</b> seulement.", items:[
      { sel:"#dev-energie", bouton:true }, { sel:"#dev-pause", bouton:true }, { sel:"#dev-prison", bouton:true },
      { sel:"#dev-recaler-comp", bouton:true }, { sel:"#dev-journal-vider", bouton:true } ] },
    { id:"tranq", titre:"🌙 Mode tranquillité", items:[ { sel:"#dev-tranq", bloc:true, titre:false } ] },
    { id:"acces", titre:"🔑 Accès", items:[
      { sel:"#dev-permis", bouton:true }, { sel:"#dev-espace1", bouton:true }, { sel:"#dev-facbloc", bouton:true } ] },
    { id:"vaisseau", titre:"🚀 Vaisseau", items:[
      { sel:"#dev-coque", bouton:true }, { sel:"#dev-coque-ok", bouton:true }, { sel:"#dev-sonde", bouton:true } ] },
    { id:"terrain", titre:"🏗️ Terrain", items:[ { sel:"#dev-abimer", bouton:true }, { sel:"#dev-integrite-reset", bouton:true } ] },
    { id:"patrouilles", titre:"🛡️ Patrouilles", items:[ { sel:"#dev-protocole", bouton:true } ] },
    { id:"outils", titre:"🛠️ Outils", note:"Édition du fichier de la carte spatiale — pas un test de jeu.", items:[ { sel:"#dev-placement", bouton:true } ] } ] },
  { id:"evts", nom:"Événements", devSeul:true, sections:[
    { id:"calendrier", titre:"📅 À venir", items:[] },
    { id:"debris", titre:"☄️ Chute de débris (test)", items:[ { sel:"#dev-debris-lancer", bloc:true, titre:false } ] },
    { id:"expe", titre:"⚔️ Expédition (test)", items:[ { sel:"#dev-exp-avancer", bloc:true, titre:false } ] },
    { id:"proto", titre:"🤖 Protocole (debug)", items:[ { sel:"#dev-proto", bloc:true, titre:false } ] },
    { id:"tous", titre:"⚠️ Touche TOUS les joueurs", danger:true, note:"Ces boutons agissent sur <b>tous les profils</b>, pas seulement sur toi.", items:[
      { sel:"#dev-declin", bouton:true }, { sel:"#dev-quotidien", bouton:true } ] } ] },
  { id:"gouv", nom:"Gouvernement", sections:[
    { id:"roles", titre:"👑 Nommer / démettre un rôle", items:[ { sel:"#dev-nom-btn", bloc:true, titre:false } ] },
    { id:"election", titre:"🗳️ Phase d'élection (test)", items:[ { sel:"#dev-reset-elec", bloc:true, titre:false } ] },
    { id:"cand", titre:"📜 Candidatures — élection en cours", items:[ { sel:"#dev-cand-go", bloc:true, titre:false } ] } ] },
  { id:"staff", nom:"Staff", devSeul:true, sections:[
    { id:"staff", titre:"👥 Staff actuel", items:[ { sel:"#dev-staff", bloc:true, titre:false } ] },
    { id:"admin", titre:"🔐 Définir un admin", items:[ { sel:"#dev-adm-btn", bloc:true, titre:false } ] } ] },
  { id:"journal", nom:"Journal", devSeul:true, sections:[
    { id:"journal", titre:"🧾 Journal admin", items:[ { sel:"#dev-log", bloc:true } ] } ] }
];
function _devMontrerOnglet(id){
  const m = document.querySelector("#dev-modale"); if(!m) return;
  m.querySelectorAll(".dev-onglet").forEach(x=>x.classList.toggle("actif", x.dataset.dev===id));
  DEV_ONGLETS.forEach(o=>{ const el=m.querySelector("#dev-t-"+o.id); if(el) el.hidden = (o.id!==id); });
  if(id === "evts") _devChargerCalendrier();
}
function _devRanger(){
  const m = document.querySelector("#dev-modale"), stage = m && m.querySelector(".dev-stage"); if(!stage) return;
  for(const o of DEV_ONGLETS) for(const sec of o.sections){
    const S = m.querySelector(`#dev-t-${o.id} [data-sec="${sec.id}"]`); if(!S) continue;
    const corps = S.querySelector(".dev-sec-corps");
    for(const it of sec.items){
      const n = stage.querySelector(it.sel); if(!n) continue;   // pas reconstruit : l'ancien reste en place
      const el = it.bloc ? n.closest(".dev-bloc") : (it.up ? n.closest(it.up) : n); if(!el) continue;
      const cle = sec.id + "|" + it.sel;
      const ancien = [...corps.querySelectorAll("[data-rang]")].find(x => x.dataset.rang === cle); if(ancien) ancien.remove();
      el.dataset.rang = cle;
      if(it.titre === false){ const h = el.querySelector(":scope > h4"); if(h && !h.querySelector("*")) h.remove(); }
      if(it.bouton){
        let ligne = corps.querySelector(":scope > .dev-actions"); if(!ligne){ ligne = document.createElement("div"); ligne.className = "dev-actions"; corps.appendChild(ligne); }
        ligne.appendChild(el);
      } else corps.appendChild(el);
    }
    if(sec.id === "calendrier" && !corps.querySelector("#dev-cal")){
      corps.innerHTML = `<div class="dev-champ"><button class="mini" id="dev-cal-go">Rafraîchir</button></div><div id="dev-cal"><p class="dev-note">Chargement…</p></div>`;
      corps.querySelector("#dev-cal-go").addEventListener("click", _devChargerCalendrier);
    }
    S.hidden = !corps.querySelector("*");   // section vide (ex. admin sans droits dev) : masquée
  }
}
/* v1.34 — Calendrier des événements à venir (admin_calendrier, v134). Les
   élections suivent une règle fixe (1-2 dépôt, 3-4 vote, 5+ résultat) : calculées ici. */
async function _devChargerCalendrier(){
  const z = document.querySelector("#dev-cal"); if(!z) return;
  let d = null;
  try{ const r = await sb.rpc("admin_calendrier"); d = r.data; if(r.error) throw r.error; }
  catch(e){ z.innerHTML = `<p class="dev-note">Calendrier indisponible (v134_calendrier.sql installé ?).</p>`; if(typeof _catchLog==="function") _catchLog(e,"dev-console.js#calendrier"); return; }
  if(!d || !d.ok){ z.innerHTML = `<p class="dev-note">Refusé : réservé au dev.</p>`; return; }
  const J = s => new Date(String(s).length <= 10 ? s + "T12:00:00" : s);
  const fj = s => J(s).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" });
  const fh = s => J(s).toLocaleString("fr-FR", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
  const nomCarte = c => (typeof debrisNomCarte==="function") ? debrisNomCarte(c) : c;
  const L = [];   // { t: date de tri, quand, quoi, detail }
  for(const e of d.debris) L.push({ t:J(e.debut), quand:`${fj(e.debut)} → ${fj(e.fin)}`, quoi:"☄️ Chute de débris", detail:`${nomCarte(e.carte)}${e.test?" · <i>test dev</i>":""}${e.annonce?"":" · pas encore annoncée"}` });
  for(const p of d.poste) L.push({ t:J(p.debut), quand:`${fh(p.debut)} → ${fh(p.fin)}`, quoi:"📮 Poste perturbée", detail:"retard 48 h, taxe ×3" });
  for(const a of d.protocole) L.push({ t:J(a.date), quand:fh(a.date), quoi:"🤖 Attaque du Protocole", detail:`${echapper(String(a.cible||"?"))} · puissance ${a.puissance}` });
  // v1.46 — Registre (v171) : jours de forteresse, secrets pour les joueurs.
  for(const f of (d.forteresses || [])) L.push({ t:J(f), quand:fj(f), quoi:"🏰 Jour de forteresse", detail:"quai barricadé : défense du Protocole 250 (plafond 400), pour toutes les factions" });
  for(const x of d.expeditions) L.push({ t:J(x.date), quand:fh(x.date), quoi:"⚔️ Expédition", detail:`${echapper(String(x.faction||"?"))} → ${echapper(String(x.cible||"?"))} (${echapper(String(x.objectif||"?"))})` });
  // Élections : prochain cycle
  const auj = J(d.jour), jm = auj.getDate();
  const debMois = (dt, n) => new Date(dt.getFullYear(), dt.getMonth() + n, 1, 12);
  const cyc = jm <= 4 ? debMois(auj, 0) : debMois(auj, 1);
  const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  const plus = (dt, k) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + k, 12);
  L.push({ t:cyc, quand:`${fj(iso(cyc))} → ${fj(iso(plus(cyc,1)))}`, quoi:"🗳️ Élection : dépôt", detail:"candidatures" });
  L.push({ t:plus(cyc,2), quand:`${fj(iso(plus(cyc,2)))} → ${fj(iso(plus(cyc,3)))}`, quoi:"🗳️ Élection : vote", detail:"puis résultat le 5" });
  // Tirages du mois prochain (débris, poste) : pas encore connus
  const moisPro = debMois(auj, 1);
  const pasEncore = [];
  if(!d.debris.some(e => !e.test)) pasEncore.push("la chute de débris");
  if(!d.poste.length) pasEncore.push("la perturbation de la Poste");
  L.sort((a,b) => a.t - b.t);
  z.innerHTML = `<table class="dev-cal"><tbody>${L.map(l=>`<tr><td class="q">${l.quand}</td><td><b>${l.quoi}</b><br><span class="dev-dim">${l.detail}</span></td></tr>`).join("")}</tbody></table>`
    + (pasEncore.length ? `<p class="dev-note" style="margin-top:8px">Pas encore tiré${pasEncore.length>1?"s":""} : ${pasEncore.join(" et ")} — tirage le ${fj(iso(moisPro))} (ou déjà passé ce mois-ci).</p>` : "");
}

/* ---------- Accès ---------- */
window.addEventListener("keydown", e => {
  if(e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")){ e.preventDefault(); ouvrirDev(); }
});
function ouvrirDev(){
  if(typeof estAdmin!=="function" || !estAdmin()) return;   // réservé dev/admin (les actions sont revérifiées serveur)
  monterDev();
  const m = document.querySelector("#dev-modale");
  const dev = (typeof estDev==="function" && estDev());
  // v1.34 : les admin (modérateurs) ne voient que Joueurs et Gouvernement.
  DEV_ONGLETS.forEach(o=>{ const b=m.querySelector(`[data-dev="${o.id}"]`); if(b) b.style.display = (dev || !o.devSeul) ? "" : "none"; });
  m.querySelector(".dev-tete b").textContent = dev ? "CONSOLE DEV" : "CONSOLE ADMIN";
  m.hidden = false;
  majDev();
  _devMontrerOnglet("joueurs");   // la fiche joueur pour tout le staff
}
function fermerDev(){ const m=document.querySelector("#dev-modale"); if(m) m.hidden = true; }

/* ---------- Actions dev ---------- */
// ⚠ PHASE 4 : le sac appartient au serveur. Écrire dans etat.sac ne créait que
// des objets FANTÔMES — visibles à l'écran, inexistants pour le serveur, d'où
// des « il te manque de quoi faire ça » à la fabrication ou au marché.
/* Cible des dons : null = moi. Renseignée par la recherche ci-dessous. */


// ⚠ La pause appartient au SERVEUR (profils.pause_depuis). Basculer etat.enPause
// en local affichait l'écran sans mettre le personnage en pause : il déclinait
// quand même et restait attaquable. On passe par les RPC.
async function devPause(){
  const rpc = etat.enPause ? "pause_sortir" : "pause_entrer";
  const { data, error } = await sb.rpc(rpc);
  if(error){ alert("Échec : "+error.message); return; }
  if(data && data.ok === false && data.err === "trop_tot"){
    if(!confirm("Pause minimale non écoulée. Forcer la sortie ?")) return;
    const { error:e2 } = await sb.rpc("admin_pause_forcer_sortie");
    if(e2){ alert("Échec : "+e2.message); return; }
  }
  if(typeof _syncPause==="function") await _syncPause();
  if(typeof chargerStocksServeur==="function") await chargerStocksServeur();
  journal(`[DEV] personnage ${etat.enPause?"mis en pause":"réactivé"}.`,"alerte");
  if(typeof majEcranPause==="function") majEcranPause();
  sauvegarder(); afficher(); majDev();
}
async function devEnergie(){
  // L'énergie appartient au serveur : un etat.energie = 100 local serait
  // écrasé au premier appel suivant. On passe par la RPC dédiée.
  const { data, error } = await sb.rpc("admin_recharger_energie", { p_profil: null });
  if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
  if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
  etat.energie=100; etat.energieMaj=Date.now(); journal("[DEV] énergie rechargée à 100 %.","gain"); sauvegarder(); afficher(); majDev(); }
function devLibererPrison(){ etat.prisonJusqua=0; etat.prisonFaction=null; journal("[DEV] libéré de prison.","gain"); sauvegarder(); afficher(); majDev(); }
function devRecalerCompetences(){
  if(!confirm("Remettre les compétences à 10/10/10 + les points de niveau non dépensés ?\n(Les points déjà gagnés sont recrédités.)")) return;
  const pts = Math.max(0, (etat.niveau-1)) * (typeof PTS_PAR_NIVEAU!=="undefined" ? PTS_PAR_NIVEAU : 3);
  etat.competences = { force:10, agilite:10, intelligence:10 };
  etat.pointsCompetence = pts;
  journal(`[DEV] compétences remises à 10/10/10, ${pts} point(s) à redistribuer.`,"alerte");
  sauvegarder(); afficher(); majDev();
}
async function devDeclin(){
  const { data, error } = await sb.rpc("admin_nova_declin");   // enveloppe : vérifie est_dev() côté serveur
  if(error){ alert("Échec : "+error.message); return; }
  if(data && data.ok === false){ alert("Refusé : réservé aux développeurs."); return; }
  journal(`[DEV] déclin appliqué : ${data.touches} profil(s), ${data.morts} mort(s).`,"alerte");
  if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
  afficher(); majDev();
}
// Déclenche TOUT le lot quotidien : déclin, sorties de pause, destruction des
// morts, planification du Protocole, ménage. Sinon il faut attendre 0 h 05 UTC.
async function devQuotidien(){
  if(!confirm("Lancer les tâches quotidiennes ?\n\nDéclin, sorties de pause, DESTRUCTION des personnages morts depuis trop longtemps, planification du Protocole.")) return;
  const { data, error } = await sb.rpc("admin_nova_quotidien");   // enveloppe : vérifie est_dev() côté serveur
  if(error){ alert("Échec : "+error.message); return; }
  if(data && data.ok === false){ alert("Refusé : réservé aux développeurs."); return; }
  journal(`[DEV] tâches quotidiennes exécutées : ${JSON.stringify(data)}`,"alerte");
  if(typeof _syncPause==="function") await _syncPause();
  if(typeof chargerStocksServeur==="function") await chargerStocksServeur();
  if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
  if(typeof syncMort==="function") await syncMort();
  if(typeof majEcranPause==="function") majEcranPause();
  afficher(); majDev();
}
// (devDonnerCredits / devDonnerObjet / devDonnerPA / devChercherCible retirées :
//  remplacées par la fiche joueur, qui cible n'importe quel compte et journalise.)
function devViderJournal(){
  if(!confirm("Effacer tout le journal de ce personnage ?")) return;
  const n = (etat.journal||[]).length;
  etat.journal = [];
  if(typeof majJournal==="function") majJournal();
  journal(`[DEV] journal vidé (${n} entrée${n>1?"s":""}).`,"alerte");
  sauvegarder(); afficher(); majDev();
}
async function devAvancerExpedition(){
  const { data:res, error } = await sb.rpc("admin_avancer_expedition");
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
  journal(`[DEV] échéance avancée à maintenant — le cron résoudra dans la minute.`,"alerte");
  if(typeof majCentre==="function") majCentre();
}
function devProtocole(){ etat.protocoleActif = !(etat.protocoleActif!==false); journal("[DEV] patrouilles du Protocole "+((etat.protocoleActif!==false)?"activées":"désactivées")+" (ce personnage uniquement).","alerte"); sauvegarder(); afficher(); majDev(); }
/* Le blocage n'est plus un drapeau local (il ne valait que pour ce personnage
   et se contournait) : c'est `config.faction_bloquee`, lu par changer_faction. */
async function devFactionBloc(){
  const { data:etatFac } = await sb.rpc("faction_etat");
  const bloque = !!(etatFac && etatFac.bloque);
  const { data, error } = await sb.rpc("admin_faction_switch", { p_bloque: !bloque });
  if(error){ alert("Échec : "+error.message); return; }
  if(!data || !data.ok){ alert("Refusé : réservé aux développeurs."); return; }
  etat.factionChangeBloque = data.bloque;   // reflet d'affichage seulement
  journal("[DEV→admin] changement de faction "+(data.bloque?"BLOQUÉ":"DÉBLOQUÉ")+" (pour TOUS les joueurs).","alerte");
  if(typeof chargerFactionEtat==="function") await chargerFactionEtat(1);
  if(typeof majParametres==="function") majParametres(); afficher(); majDev();
}
function devPermis(){ etat.permisVaisseau = !etat.permisVaisseau; journal(`[DEV] permis de vaisseau ${etat.permisVaisseau?"accordé":"retiré"}.`,"gain"); sauvegarder(); afficher(); majDev(); }
/* v0.83 — `espace1` est un drapeau DISTINCT du vaisseau (récompense de Q5) :
   sans lui, le bouton Orbite reste caché même avec un vaisseau équipé. */
function devEspace1(){ etat.espace1 = !etat.espace1; journal(`[DEV] route vers l'orbite ${etat.espace1?"ouverte":"fermée"}.`,"gain"); sauvegarder(); afficher(); majDev(); }
function _devRafraichirQuetes(){ if(typeof rafraichirQuetes==="function") rafraichirQuetes(); else if(typeof afficher==="function") afficher(); }
function devResetQuete(id){ if(!id) return; const q=etat.quetes||(etat.quetes={done:[],active:null}); q.done=(q.done||[]).filter(x=>x!==id); if(q.active&&q.active.id===id) q.active=null; journal(`[DEV] quête ${id} réinitialisée.`,"gain"); sauvegarder(); _devRafraichirQuetes(); majDev(); }
/* v1.03 : `paRecu` survit à la remise à zéro (les PA ne se touchent qu'une fois). */
function devResetQuetes(){ const pr=(etat.quetes&&etat.quetes.paRecu)||[]; etat.quetes={done:[],active:null,paRecu:pr}; journal("[DEV] toutes les quêtes réinitialisées.","gain"); sauvegarder(); _devRafraichirQuetes(); majDev(); }

/* ---------- Rendu ---------- */
/* Mode tranquillité — onglet Recherche, donc accessible aux DEUX consoles
   (dev et admin), comme la fiche joueur. L'état vit dans profils.tranquillite,
   colonne protégée par le trigger : un joueur ne peut pas se l'accorder. */
/* Candidatures : lecture modération, toutes factions confondues.
   La RLS de `candidatures` cloisonne par faction — d'où la RPC
   admin_candidatures(), qui contrôle est_admin() côté serveur.
   Les programmes sont dans des <details> : une élection à cinq factions
   fait sinon plusieurs écrans de défilement. */
async function devCandidatures(){
  const z = document.querySelector("#dev-cand"); if(!z) return;
  z.innerHTML = `<p class="dev-note">Chargement…</p>`;
  // p_cycle omis : la RPC retombe sur le cycle en cours, le seul qu'on surveille.
  const { data, error } = await sb.rpc("admin_candidatures", { p_cycle: null });
  if(error){ z.innerHTML = `<p class="dev-note">Échec : ${echapper(error.message)}</p>`; return; }
  if(!data || !data.ok){ z.innerHTML = `<p class="dev-note">Refusé : réservé au staff.</p>`; return; }
  const liste = data.liste || [];
  if(!liste.length){ z.innerHTML = `<p class="dev-note">Aucune candidature pour le cycle ${echapper(data.cycle)}.</p>`; return; }

  const parFac = {};
  liste.forEach(c => { (parFac[c.faction] = parFac[c.faction] || []).push(c); });
  const nomFac = f => (typeof FACTIONS!=="undefined" && (FACTIONS.find(x=>x.id===f)||{}).nom) || f;

  let h = `<p class="dev-note">Cycle <b>${echapper(data.cycle)}</b> — ${liste.length} candidature(s).</p>`;
  Object.keys(parFac).sort().forEach(f => {
    h += `<div class="cand-fac"><b>${echapper(nomFac(f))}</b> <span class="dev-note">${parFac[f].length}</span></div>`;
    parFac[f].forEach(c => {
      const d = c.cree_le ? new Date(c.cree_le).toLocaleString() : "";
      h += `<details class="cand-item">
        <summary>${echapper(c.nom)} <span class="dev-note">· ${c.longueur} car. · ${echapper(d)}</span></summary>
        <div class="cand-prog">${echapper(c.programme || "(programme vide)")}</div>
        <button class="mini" data-suppr="${c.profil_id}" data-fac="${f}" data-cy="${echapper(data.cycle)}">Supprimer cette candidature</button>
      </details>`;
    });
  });
  z.innerHTML = h;

  z.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", async () => {
    if(!confirm("Supprimer cette candidature ?")) return;
    const { data:r, error:e } = await sb.rpc("admin_suppr_candidature",
      { p_profil: b.dataset.suppr, p_faction: b.dataset.fac, p_cycle: b.dataset.cy });
    if(e || (r && r.ok === false)){ alert("Échec : " + (e ? e.message : "refusé")); return; }
    journal("[STAFF] candidature supprimée.","alerte");
    devCandidatures();
  }));
}

let _tranqActif = null;
async function _majBoutonTranquillite(){
  const b = document.querySelector("#dev-tranq"); if(!b) return;
  if(_tranqActif === null){
    const { data, error } = await sb.rpc("tranquillite_etat");
    if(error || !data || !data.ok){ b.textContent = "Mode tranquillité (indisponible)"; b.disabled = true; return; }
    _tranqActif = !!data.actif;
  }
  b.disabled = false;
  b.textContent = _tranqActif ? "Mode tranquillité : ON — désactiver" : "Mode tranquillité : OFF — activer";
}
async function devTranquillite(){
  const b = document.querySelector("#dev-tranq"); if(b) b.disabled = true;
  const { data, error } = await sb.rpc("admin_tranquillite", { p_actif: !_tranqActif });
  if(error){ alert("Échec : "+error.message); if(b) b.disabled=false; return; }
  if(!data || !data.ok){ alert("Refusé : réservé au staff."); if(b) b.disabled=false; return; }
  _tranqActif = !!data.actif;
  journal("[STAFF] mode tranquillité "+(_tranqActif?"ACTIVÉ — jauges restaurées":"DÉSACTIVÉ")+".","alerte");
  if(_tranqActif && typeof chargerJaugesServeur==="function") await chargerJaugesServeur();   // relit o2/sante/moral remis à 100
  await _majBoutonTranquillite();
  afficher();
}

function majDev(){
  // ⚠ `dev` était lu ici alors qu'il n'est déclaré que dans ouvrirDev() :
  // ReferenceError ligne ~190, qui interrompait majDev() et empêchait la
  // construction des onglets Journal et Gouvernement. Déclaré localement.
  const dev = (typeof estDev==="function" && estDev());
  const r = document.querySelector("#dev-recherche");
  if(r && !r.dataset.pret){
    // ⚠ L'ancienne recherche cherchait dans l'état LOCAL : elle ne pouvait
    // trouver que soi-même. Elle interroge désormais le serveur, et la fiche
    // porte ses propres actions de dépannage — un modérateur n'a jamais besoin
    // de se connecter sur le compte de quelqu'un.
    r.dataset.pret = "1";
    r.innerHTML =
      `<p class="dev-note">Recherche parmi <b>tous les comptes</b>. Chaque action est journalisée et annoncée au joueur.</p>
       <div class="dev-champ"><input id="dev-q" placeholder="Rechercher un pseudo…"><button class="mini" id="dev-chercher">Chercher</button></div>
       <div id="dev-res"><p class="dev-note">Tape un pseudo (une partie suffit) puis Entrée.</p></div>
       <div class="dev-bloc"><h4>Candidatures — élection en cours</h4>
         <p class="dev-note">Programmes de <b>toutes</b> les factions, pour vérifier qu'aucun ne pose problème. Repliés par défaut : clique un nom pour le dérouler.</p>
         <div class="dev-champ"><button class="mini" id="dev-cand-go">Rafraîchir</button></div>
         <div id="dev-cand"><p class="dev-note">Chargement…</p></div></div>
       <div class="dev-bloc"><h4>Mode tranquillité</h4>
         <p class="dev-note">Sur <b>ton</b> personnage : plus de déclin quotidien, et santé / moral / O₂ remis à 100 chaque nuit. Les dégâts de combat sont réparés le lendemain — tu n'es pas invulnérable.</p>
         <div class="dev-actions"><button class="mini" id="dev-tranq">Mode tranquillité …</button></div></div>`;
    r.querySelector("#dev-chercher").addEventListener("click", devChercherJoueur);
    r.querySelector("#dev-tranq").addEventListener("click", devTranquillite);
    r.querySelector("#dev-cand-go").addEventListener("click", devCandidatures);
    devCandidatures();   // chargé d'office : c'est le cycle en cours qu'on surveille
    _majBoutonTranquillite();
    r.querySelector("#dev-q").addEventListener("keydown", e=>{ if(e.key==="Enter") devChercherJoueur(); });
  }
  const av = document.querySelector("#dev-activ");
  if(av){
    av.innerHTML = `<p class="dev-note">Interrupteurs de test sur <b>ce personnage</b>. Sans effet sur les autres joueurs.</p>
    <div class="dev-actions">
      <button class="mini" id="dev-pause">${etat.enPause?"Réactiver":"Mettre en pause"}</button>
      <button class="mini" id="dev-permis">${etat.permisVaisseau?"Retirer permis vaisseau":"Accorder permis vaisseau"}</button>
      <button class="mini" id="dev-espace1">${etat.espace1?"Fermer la route de l'orbite":"Ouvrir la route de l'orbite"}</button>
      <button class="mini" id="dev-placement">Placement carte spatiale</button>
      <button class="mini" id="dev-energie">Recharger énergie (100%)</button>
      <button class="mini" id="dev-prison">Libérer de prison</button>
      <button class="mini" id="dev-journal-vider">Vider le journal</button>
      <button class="mini" id="dev-declin" title="Applique une journée de déclin à TOUS les profils">Forcer le déclin quotidien</button>
      <button class="mini" id="dev-quotidien" title="Déclin + sorties de pause + destruction des morts + Protocole + ménage">Forcer les tâches quotidiennes</button>
      <button class="mini" id="dev-recaler-comp">Recaler compétences (10/10/10)</button>
      <button class="mini" id="dev-abimer" title="Retire 25 % d'intégrité à une structure bâtie, tirée au hasard">Abîmer une structure (−25 %)</button>
      <button class="mini" id="dev-integrite-reset" title="Remet toutes tes structures à 100 %">Réparer toutes les structures</button>
      <button class="mini" id="dev-coque" title="Retire 30 PV à la coque du vaisseau équipé">Abîmer la coque (−30 PV)</button>
      <button class="mini" id="dev-coque-ok" title="Remet la coque à neuf">Réparer la coque</button>
      <button class="mini" id="dev-sonde" title="Déclenche une interception, sans attendre les 15 %">Croiser une sonde</button>
      <button class="mini" id="dev-facbloc">${(etat.factionChangeBloque!==false)?"Débloquer":"Bloquer"} changement de faction</button>
      <button class="mini" id="dev-protocole" title="Interceptions sur le terrain, pour ce personnage seulement">Patrouilles : ${(etat.protocoleActif!==false)?"ON":"OFF"}</button>
      <button class="mini" id="dev-imperso" disabled title="Nécessite le backend multijoueur">Entrer dans le compte</button>
    </div>`;
    const bp=av.querySelector("#dev-pause"); if(bp) bp.addEventListener("click", devPause);
    const bpv=av.querySelector("#dev-permis"); if(bpv) bpv.addEventListener("click", devPermis);
    // v0.83 : outil d'édition de FICHIER (js/espace-data.js), pas une fonctionnalité de jeu.
    const be1=av.querySelector("#dev-espace1"); if(be1) be1.addEventListener("click", devEspace1);
    const bpl=av.querySelector("#dev-placement");
    if(bpl) bpl.addEventListener("click", ()=>{
      if(typeof placementBasculer!=="function"){ journal("Mode placement indisponible.","alerte"); return; }
      fermerDev();
      if(typeof ouvrirOrbite==="function") ouvrirOrbite(true);   // true = forcer : outil de dev
      placementBasculer();
    });
    const ben=av.querySelector("#dev-energie"); if(ben) ben.addEventListener("click", devEnergie);
    const bpr=av.querySelector("#dev-prison"); if(bpr) bpr.addEventListener("click", devLibererPrison);
    const bjv=av.querySelector("#dev-journal-vider"); if(bjv) bjv.addEventListener("click", devViderJournal);
    const bdc=av.querySelector("#dev-declin"); if(bdc) bdc.addEventListener("click", devDeclin);
    const bqt=av.querySelector("#dev-quotidien"); if(bqt) bqt.addEventListener("click", devQuotidien);
    const brc=av.querySelector("#dev-recaler-comp"); if(brc) brc.addEventListener("click", devRecalerCompetences);
    const bab=av.querySelector("#dev-abimer"); if(bab) bab.addEventListener("click", ()=>{ if(typeof devAbimerStructure==="function") devAbimerStructure(); });
    const bir=av.querySelector("#dev-integrite-reset"); if(bir) bir.addEventListener("click", ()=>{ if(typeof devReparerTout==="function") devReparerTout(); });
    const bcq=av.querySelector("#dev-coque");
    if(bcq) bcq.addEventListener("click", ()=>{
      if(!etat.vaisseau){ journal("[dev] Aucun vaisseau équipé.","alerte"); return; }
      abimerVaisseau(30, "console dev");
      journal(`[dev] Coque : ${pvVaisseau()}/${pvMax()} PV.`,"alerte");
    });
    const bso=av.querySelector("#dev-sonde");
    if(bso) bso.addEventListener("click", ()=>{
      if(typeof enEcart!=="function" || !enEcart()){ journal("[dev] Il faut être dans le secteur Triptolème.","alerte"); return; }
      if(typeof ouvrirSonde==="function") ouvrirSonde();
    });
    const bcr=av.querySelector("#dev-coque-ok");
    if(bcr) bcr.addEventListener("click", ()=>{
      if(!etat.vaisseau){ journal("[dev] Aucun vaisseau équipé.","alerte"); return; }
      reparerPv(pvMax()); journal(`[dev] Coque remise à neuf : ${pvVaisseau()}/${pvMax()} PV.`,"gain");
      if(typeof majVaisseau==="function") majVaisseau();
      if(typeof sauvegarder==="function") sauvegarder();
    });
    const bfb=av.querySelector("#dev-facbloc"); if(bfb) bfb.addEventListener("click", devFactionBloc);
    const bpro=av.querySelector("#dev-protocole"); if(bpro) bpro.addEventListener("click", devProtocole);
    /* ⚠ Ces deux boutons existaient dans le HTML et leurs fonctions étaient
       définies (devResetQuete / devResetQuetes), mais RIEN ne les reliait :
       ils étaient inertes depuis toujours. */
    const bqr=av.querySelector("#dev-quete-reset");
    if(bqr) bqr.addEventListener("click", ()=>{
      const sel=av.querySelector("#dev-quete-sel");
      if(sel && sel.value) devResetQuete(sel.value);
    });
    const bqa=av.querySelector("#dev-quete-reset-all");
    if(bqa) bqa.addEventListener("click", async ()=>{
      const ok = (typeof confirmerJoli==="function")
        ? await confirmerJoli("Réinitialiser les quêtes", "Toutes les quêtes repassent à zéro, y compris celle en cours. Les récompenses déjà reçues ne sont pas reprises.", "Tout réinitialiser", true)
        : confirm("Réinitialiser TOUTES les quêtes ?");
      if(ok) devResetQuetes();
    });
  }
  // (Onglet Cadeaux supprimé : la fiche joueur de l'onglet Recherche fait mieux —
  //  elle cible n'importe quel joueur, journalise et le prévient.)
  const jl = document.querySelector("#dev-journal");
  if(jl && dev){
    jl.innerHTML = `<div class="dev-bloc"><h4>Journal admin
        <button class="mini" id="dev-log-vider" style="float:right;padding:2px 8px">Tout effacer</button></h4>
      <p class="dev-note">Toutes les actions du staff : nominations, dons, suppressions, consultations de journaux, refus de crédit suspects (<b>crediter_refuse</b>).</p>
      <div id="dev-log"><p class="dev-note">Chargement…</p></div></div>`;
    const bv = jl.querySelector("#dev-log-vider");
    if(bv) bv.addEventListener("click", devViderLog);
    _devChargerLog();
  }
  const g = document.querySelector("#dev-gouv");
  if(g){
    const facOpts = (typeof FACTIONS!=="undefined"?FACTIONS:[]).map(f=>`<option value="${f.id}">${f.nom}</option>`).join("");
    const roleOpts = `<option value="regent">Régent</option><option value="architecte">Architecte</option><option value="chef_guerre">Stratège</option><option value="espion">Ombre</option>`;
    let h = `<div class="dev-bloc"><h4>Nommer / démettre un rôle</h4>
      <div class="dev-champ"><select id="dev-nom-fac">${facOpts}</select><select id="dev-nom-role">${roleOpts}</select></div>
      <div class="dev-champ" style="margin-top:6px"><input id="dev-nom-pseudo" placeholder="Pseudo (vide = démettre)"><button class="mini" id="dev-nom-btn">Appliquer</button></div></div>`;
    if(typeof estDev==="function" && estDev()){
      h += `<div class="dev-bloc"><h4>Définir un admin (dev)</h4>
        <div class="dev-champ"><input id="dev-adm-pseudo" placeholder="Pseudo"><select id="dev-adm-role"><option value="admin">Admin</option><option value="dev">Dev</option><option value="">Aucun</option></select><button class="mini" id="dev-adm-btn">Définir</button></div></div>`;
      h += `<div class="dev-bloc"><h4>Phase élection (test)</h4><div class="dev-champ"><button class="mini" data-phase="depot">Dépôt</button><button class="mini" data-phase="vote">Vote</button><button class="mini" data-phase="resultat">Résultat</button><button class="mini" data-phase="">Auto (date)</button></div><div class="dev-champ" style="margin-top:6px"><button class="mini danger" id="dev-reset-elec">Réinitialiser le cycle (test)</button></div></div>`;
      h += `<div class="dev-bloc"><h4>Protocole (debug)</h4><div id="dev-proto"><p class="dev-note">Chargement…</p></div></div>`;
      /* v1.13 — APPARENCE : ouvrir / fermer le verrou. Ici, dans les outils DEV
         (pas dans la console admin, décision du 23/09). Vide = sur soi ; un
         pseudo = sur ce joueur. Le verrou est côté serveur, donc ouvrir
         l'éditeur ne suffirait pas : c'est `profils.apparence_le` qu'on bouge. */
      h += `<div class="dev-bloc"><h4>Apparence — verrou</h4>
        <div class="dev-champ"><input id="dev-app-pseudo" placeholder="Pseudo (vide = moi)">
          <button class="mini" id="dev-app-lire">Voir l'état</button></div>
        <div class="dev-champ" style="margin-top:6px">
          <button class="mini" data-app="ouvrir">Ouvrir (gratuit)</button>
          <button class="mini" data-app="expirer">Ouvrir (payant)</button>
          <button class="mini danger" data-app="fermer">Refermer</button></div>
        <p class="dev-note" id="dev-app-etat">—</p>
        <p class="dev-note"><b>Ouvrir (gratuit)</b> : le serveur croit à un premier choix — aucun coût, et <b>le genre redevient modifiable</b>. <b>Ouvrir (payant)</b> : le verrou est écoulé mais le régime normal s'applique — genre figé, 5 000 ₡. <b>Refermer</b> : reverrouillé 180 jours. Tracé dans le journal admin.</p></div>`;
      h += `<div class="dev-bloc"><h4>Donner des points d'Aptitude</h4>
        <div class="dev-champ"><input id="dev-pa-pseudo" placeholder="Pseudo"><input id="dev-pa-n" type="number" min="1" max="30" value="1" style="width:5em">
          <button class="mini" id="dev-pa-btn">Donner</button></div>
        <p class="dev-note">1 à 30 PA. Le joueur les reçoit à sa prochaine relève (au plus 2 min s'il est en ligne, sinon à sa connexion), avec un message dans son journal. Journalisé.</p></div>`;   // v1.26
      h += `<div class="dev-bloc"><h4>Chute de débris (test)</h4>
        <div class="dev-champ"><select id="dev-debris-carte"><option value="">Au hasard</option><option value="braise">La Braise</option><option value="suaire">Le Suaire</option><option value="silene">Silène</option></select>
          <button class="mini" id="dev-debris-lancer">Lancer maintenant</button><button class="mini danger" id="dev-debris-arreter">Arrêter</button></div>
        <p class="dev-note">Commence <b>aujourd'hui</b>, pour 3 jours, <b>visible par toi seul</b> (l'annonce n'arrive qu'à toi ; les joueurs ne voient rien). Relancer remplace ta chute de test. <b>Arrêter</b> ne touche jamais l'événement du mois.</p></div>`;   // v1.31
      h += `<div class="dev-bloc"><h4>Staff actuel</h4><div id="dev-staff"><p class="dev-note">Chargement…</p></div></div>`;
      h += `<div class="dev-bloc"><h4>Expédition (test)</h4><p class="dev-note">Avance l'échéance de l'expédition de ta faction à <b>maintenant</b>. Le cron la résoudra à la minute suivante, exactement comme en vrai.</p><div class="dev-champ"><button class="mini" id="dev-exp-avancer">Avancer l'échéance à maintenant</button></div></div>`;
      // (Le journal admin a son propre onglet — l'onglet Gouvernement était trop long.)
    }
    g.innerHTML = h;
    /* v1.13 — branchement du bloc Apparence. */
    const _appZ = g.querySelector("#dev-app-etat");
    const _appDire = (d)=>{
      if(!_appZ) return;
      if(!d || !d.ok){ _appZ.textContent = "Échec : " + ((d && d.err) || "?"); return; }
      _appZ.innerHTML = d.gratuit
        ? `<b>${echapper(d.nom)}</b> — <b style="color:#6fd08a">ouverte</b>, changement gratuit, genre modifiable.`
        : (d.verrou
            ? `<b>${echapper(d.nom)}</b> — <b style="color:var(--coral,#ff6b6b)">verrouillée</b> jusqu'au ${new Date(d.prochain).toLocaleString()}.`
            : `<b>${echapper(d.nom)}</b> — <b>déverrouillée</b> (régime normal : 5 000 ₡, genre figé).`);
    };
    const _appAppel = async (mode)=>{
      const pseudo = (g.querySelector("#dev-app-pseudo")||{}).value || "";
      let pid = null;
      if(pseudo.trim()){
        try{ const { data } = await sb.from("profils").select("id").eq("nom", pseudo.trim()).maybeSingle();
          if(!data){ _appZ.textContent = "Joueur introuvable."; return; }
          pid = data.id;
        }catch(e){ _appZ.textContent = "Recherche impossible."; return; }
      }
      let d = null;
      try{ d = (await sb.rpc("admin_apparence", { p_profil: pid, p_mode: mode })).data; }
      catch(e){ if(typeof _catchLog==="function") _catchLog(e, "dev-console.js#apparence"); }
      _appDire(d);
      if(d && d.ok && mode !== "lire") journal(`[DEV] Apparence ${mode} pour ${d.nom}.`, "alerte");
    };
    const _appLire = g.querySelector("#dev-app-lire"); if(_appLire) _appLire.addEventListener("click", ()=>_appAppel("lire"));
    g.querySelectorAll("[data-app]").forEach(b=>b.addEventListener("click", ()=>_appAppel(b.dataset.app)));
    g.querySelector("#dev-nom-btn").addEventListener("click", devNommer);
    const _paB = g.querySelector("#dev-pa-btn"); if(_paB) _paB.addEventListener("click", devDonnerPA);   // v1.26
    const _dbL = g.querySelector("#dev-debris-lancer");  if(_dbL) _dbL.addEventListener("click", devDebrisLancer);    // v1.31
    const _dbA = g.querySelector("#dev-debris-arreter"); if(_dbA) _dbA.addEventListener("click", devDebrisArreter);   // v1.31
    const ab=g.querySelector("#dev-adm-btn"); if(ab) ab.addEventListener("click", devDefinirRole);
    if(typeof estDev==="function" && estDev()){ _devChargerProto(); _devChargerStaff(); g.querySelectorAll("[data-phase]").forEach(b=>b.addEventListener("click",()=>devForcerPhase(b.dataset.phase||null))); const bre=g.querySelector("#dev-reset-elec"); if(bre) bre.addEventListener("click", devResetElection); const bea=g.querySelector("#dev-exp-avancer"); if(bea) bea.addEventListener("click", devAvancerExpedition); }
  }
  _devRanger();   // v1.34 : range chaque bloc dans son onglet
}
async function devDonnerPA(){
  const pseudo = (document.querySelector("#dev-pa-pseudo").value||"").trim();
  const n = Math.round(Number(document.querySelector("#dev-pa-n").value));
  if(!pseudo){ alert("Indique un pseudo."); return; }
  if(!(n >= 1 && n <= 30)){ alert("De 1 à 30 PA."); return; }
  const id = (typeof _idDe==="function") ? await _idDe(pseudo) : null; if(!id){ alert("Pseudo introuvable."); return; }
  const { data:res, error } = await sb.rpc("admin_donner_pa", { p_profil:id, p_n:n });
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
  journal(`[DEV] ${n} PA donné${n>1?"s":""} à ${res.nom}.`,"alerte");
  if(id === (typeof _monId!=="undefined" ? _monId : null)) aptConsommerDons();
}
/* v1.31 — chute de débris de TEST (admin_debris_lancer / admin_debris_arreter). */
async function devDebrisLancer(){
  const carte = (document.querySelector("#dev-debris-carte")||{}).value || null;
  const { data:res, error } = await sb.rpc("admin_debris_lancer", { p_carte:carte });
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
  journal(`[DEV] Chute de débris de test lancée sur ${typeof debrisNomCarte==="function" ? debrisNomCarte(res.carte) : res.carte}.`,"alerte");
  if(typeof syncEffetsCombat==="function") await syncEffetsCombat();   // relève l'annonce tout de suite
  if(typeof debrisCharger==="function") await debrisCharger();
}
async function devDebrisArreter(){
  const { data:res, error } = await sb.rpc("admin_debris_arreter");
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
  journal(`[DEV] Chute de débris de test arrêtée (${res.n}).`,"alerte");
  if(typeof debrisCharger==="function") await debrisCharger();
}
async function devNommer(){
  const fac=document.querySelector("#dev-nom-fac").value, role=document.querySelector("#dev-nom-role").value;
  const pseudo=(document.querySelector("#dev-nom-pseudo").value||"").trim();
  let id=null; if(pseudo){ id=(typeof _idDe==="function")?await _idDe(pseudo):null; if(!id){ alert("Pseudo introuvable."); return; } }
  const { data:res, error } = await sb.rpc("admin_nommer",{ p_faction:fac, p_role:role, p_profil:id });
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
  journal(`[ADMIN] ${role} de ${fac} → ${pseudo||"vacant"}.`,"alerte"); majDev();
}
async function devDefinirRole(){
  const pseudo=(document.querySelector("#dev-adm-pseudo").value||"").trim(); if(!pseudo) return;
  const role=document.querySelector("#dev-adm-role").value||null;
  const id=(typeof _idDe==="function")?await _idDe(pseudo):null; if(!id){ alert("Pseudo introuvable."); return; }
  const { data:res, error } = await sb.rpc("admin_definir_role",{ p_profil:id, p_role:role });
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
  journal(`[DEV] ${pseudo} → ${role||"aucun"}.`,"alerte"); majDev();
}
async function devResetElection(){
  if(!confirm("Effacer candidatures + votes + résultats du cycle en cours (test) ?")) return;
  const { data:res, error } = await sb.rpc("admin_reset_election");
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||"?")); return; }
  journal("[DEV] élection du cycle réinitialisée.","alerte");
  if(typeof majCentre==="function") majCentre();
}
async function devForcerPhase(p){
  const { data:res, error } = await sb.rpc("admin_forcer_phase",{ p_phase:p });
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||"?")); return; }
  journal("[DEV] phase élection forcée : "+(p||"auto (date)")+".","alerte");
}
async function devViderLog(){
  if(!confirm("Effacer TOUT le journal admin ? (irréversible)")) return;
  const { data:res, error } = await sb.rpc("admin_vider_log");
  if(error || !res || !res.ok){
    alert("Échec : " + ((res && res.err) || (error && error.message) || "réponse inattendue"));
    return;
  }
  journal(`[DEV] journal admin vidé (${res.supprimes} entrée(s)).`,"alerte"); _devChargerLog();
}
async function _devChargerProto(){
  const z=document.querySelector("#dev-proto"); if(!z) return;
  let def="?", actif=false, menace=null;
  try{ const { data } = await sb.rpc("protocole_defense"); def=data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "dev-console.js#1"); }
  try{ const { data } = await sb.rpc("protocole_est_actif"); actif=(data===true); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "dev-console.js#2"); }
  try{ const { data } = await sb.rpc("protocole_menace"); menace=data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "dev-console.js#3"); }
  const etatTxt = actif
    ? `<b style="color:#ff5257">ATTAQUES ACTIVES</b>`
    : `<b style="color:#8b95a8">attaques désactivées</b>`;
  const mTxt = (menace && menace.active)
    ? `Offensive en préparation : <b>${menace.cible}</b>, puissance <b>${menace.puissance}</b>, dans <b>${menace.jours} j</b>.`
    : `Aucune offensive en préparation.`;
  z.innerHTML = `<p class="dev-note">Défense de base aujourd'hui : <b>${def}</b> (varie 40–80/jour).<br>Défense effective = min(150, base + nb_attaquants×3).<br>Attaque = force moy. × √(nb attaquants) ; succès si Attaque > Défense × (0.85–1.15 aléa).<br>Butin réussite : <b>défense×10 ₡/joueur</b> + 5% chance de Cristal de Nyx.</p>
    <p class="dev-note">État des attaques du Protocole : ${etatTxt}<br>${mTxt}</p>
    <div class="dev-champ"><button class="mini" id="dev-proto-switch">${actif?"Désactiver les attaques":"Activer les attaques"}</button><button class="mini" id="dev-proto-test">Déclencher une attaque maintenant</button></div>`;
  const bsw=z.querySelector("#dev-proto-switch");
  if(bsw) bsw.addEventListener("click", async ()=>{
    if(actif && !confirm("Désactiver les attaques du Protocole ? Les offensives en préparation seront annulées.")) return;
    const { data:res, error } = await sb.rpc("admin_protocole_switch", { p_actif: !actif });
    if(error||!res||!res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
    journal(`[DEV] attaques du Protocole ${res.actif?"activées":"désactivées"}.`,"alerte");
    _devChargerProto();
  });
  const bts=z.querySelector("#dev-proto-test");
  if(bts) bts.addEventListener("click", async ()=>{
    /* v0.91 — « moyenne » (coef 0,80) ne passait jamais : p_att ne dépend que du
       NOMBRE de joueurs actifs, quand p_def dépend de leur FORCE. Sur un serveur
       peu peuplé avec un personnage équipé, l'attaque ne pouvait pas réussir et
       le bouton semblait cassé. Un bouton de test doit tester le pire cas. */
    const { data:res, error } = await sb.rpc("admin_protocole_test", { p_cible: etat.faction||null, p_puissance: "ecrasante" });
    if(error||!res||!res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
    journal(`[DEV] attaque du Protocole ${res.action==="creee"?"créée":"avancée"} (puissance écrasante) — résolution à la minute suivante.`,"alerte");
    journal("[DEV] Pour qu'elle RÉUSSISSE : sors de la zone de ta cité (ou décolle) avant la résolution — sinon ta force de combat la repousse.","alerte");
    _devChargerProto();
  });
}
async function _devChargerStaff(){
  const z=document.querySelector("#dev-staff"); if(!z) return;
  try{
    const { data } = await sb.rpc("admin_liste_staff");
    const rows=data||[];
    if(!rows.length){ z.innerHTML=`<p class="dev-note">Aucun staff pour l'instant.</p>`; return; }
    z.innerHTML = rows.map(r=>`<div class="dev-champ" style="margin:3px 0"><span style="flex:1"><b>${echapper(r.nom)}</b> · <span class="dev-dim">${r.role_admin}</span></span><button class="mini" data-demettre="${r.id}">Démettre</button></div>`).join("");
    z.querySelectorAll("[data-demettre]").forEach(b=>b.addEventListener("click",async()=>{
      if(!confirm("Démettre ce membre du staff (repasse joueur normal) ?")) return;
      const { data:res, error } = await sb.rpc("admin_definir_role",{ p_profil:b.dataset.demettre, p_role:null });
      if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||"?")); return; }
      journal("[DEV] membre du staff démis.","alerte"); majDev();
    }));
  }catch(e){ z.innerHTML=`<p class="dev-note">Liste indisponible.</p>`; }
}
async function _devChargerLog(){
  const z=document.querySelector("#dev-log"); if(!z) return;
  try{
    const { data } = await sb.from("admin_log").select("*").order("cree_le",{ascending:false}).limit(50);
    const rows=data||[]; const ids=new Set(); rows.forEach(r=>{ if(r.acteur)ids.add(r.acteur); if(r.cible)ids.add(r.cible); });
    const noms={}; if(ids.size){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",[...ids]); for(const p of (pubs||[])) noms[p.id]=p.nom; }
    if(!rows.length){ z.innerHTML=`<p class="dev-note">Aucune action enregistrée.</p>`; return; }
    z.innerHTML = rows.map(r=>`<div class="dev-note" style="margin:3px 0"><b style="color:#ff8a3d">${echapper(noms[r.acteur]||"?")}</b> · ${r.action}${r.cible?` → ${echapper(noms[r.cible]||"?")}`:""}${r.detail?` <span class="dev-dim">(${echapper(r.detail)})</span>`:""} <span class="dev-dim">${new Date(r.cree_le).toLocaleString("fr-FR")}</span></div>`).join("");
  }catch(e){ z.innerHTML=`<p class="dev-note">Journal indisponible.</p>`; }
}
function monterDev(){
  if(_devMonte) return;
  const st = document.createElement("style");
  st.textContent = `
    #dev-modale{ position:fixed; inset:0; z-index:9999; background:rgba(4,8,20,.72); display:grid; place-items:center; padding:20px; }
    #dev-modale[hidden]{ display:none; }
    .dev-cadre{ width:min(560px,96vw); max-height:92vh; overflow:auto; background:#0b1220; border:1px solid #2a3550; border-radius:14px; padding:16px 18px; box-shadow:0 20px 60px rgba(0,0,0,.6); color:#dfe7f5; font-family:"Exo 2",sans-serif; }
    .dev-tete{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .dev-tete b{ font-family:"Space Mono",monospace; letter-spacing:.12em; color:#ff8a3d; }
    .dev-tete .dev-warn{ font-size:10px; color:#8b95a8; margin-right:auto; }
    .dev-onglets{ display:flex; gap:6px; border-bottom:1px solid #2a3550; margin-bottom:14px; }
    .dev-onglet{ background:none; border:none; border-bottom:2px solid transparent; color:#8b95a8; font-weight:600; padding:6px 10px; cursor:pointer; }
    .dev-onglet.actif{ color:#ff8a3d; border-bottom-color:#ff8a3d; }
    .dev-vue[hidden]{ display:none; }
    .dev-note{ font-size:11.5px; color:#8b95a8; line-height:1.45; margin:0 0 10px; }
    .dev-dim{ color:#8b95a8; }
    .dev-champ{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .cand-fac{ margin:12px 0 5px; font-size:12px; letter-spacing:.05em; text-transform:uppercase; color:var(--orange-hi,#ffb060); }
    .cand-item{ border:1px solid var(--line); border-radius:8px; margin-bottom:6px; background:#0f1830; }
    .cand-item summary{ cursor:pointer; padding:7px 10px; font-size:13px; }
    .cand-item[open] summary{ border-bottom:1px solid var(--line); }
    .cand-prog{ padding:9px 11px; font-size:13px; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
    .cand-item .mini{ margin:0 11px 10px; }
    .dev-champ input, .dev-champ select{ background:#0f1830; border:1px solid #2a3550; border-radius:8px; color:#dfe7f5; padding:8px 10px; font-family:inherit; flex:1; min-width:120px; }
    .dev-bloc{ margin:0 0 14px; } .dev-bloc h4{ margin:0 0 6px; font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:#9fb0c4; }
    .dev-carte{ border:1px solid #2a3550; border-radius:10px; padding:12px; background:#0f1830; }
    .dev-carte-tete{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px; }
    .dev-carte-tete .qte{ font-family:"Space Mono",monospace; font-size:11px; color:#5aa8e6; }
    .dev-grid{ display:grid; grid-template-columns:auto 1fr; gap:4px 12px; font-size:13px; }
    .dev-grid span{ color:#8b95a8; }
    .dev-actions{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
    #dev-modale .mini{ background:#16233c; border:1px solid #2a3550; color:#dfe7f5; border-radius:8px; padding:7px 12px; font-family:inherit; font-size:12px; cursor:pointer; }
    #dev-modale .mini:disabled{ opacity:.4; cursor:not-allowed; }
    #dev-modale .mini:hover:not(:disabled){ border-color:#ff8a3d; }
    /* v1.34 — sections à titres bien visibles */
    .dev-onglets{ flex-wrap:wrap; }
    .dev-sec{ margin:0 0 18px; padding:2px 0 2px 12px; border-left:3px solid #ff8a3d; }
    .dev-sec[hidden]{ display:none; }
    .dev-sec > h3{ margin:0 0 8px; font-size:15px; font-weight:700; color:#ffb060; letter-spacing:.02em; }
    .dev-sec.danger{ border-left-color:#ff5d5d; background:rgba(255,93,93,.06); border-radius:0 8px 8px 0; padding:8px 10px 6px 12px; }
    .dev-sec.danger > h3{ color:#ff7b7b; }
    .dev-sec .dev-bloc{ margin:0 0 6px; }
    .dev-sec .dev-actions{ margin-top:4px; }
    .dev-stage{ display:none !important; }
    table.dev-cal{ width:100%; border-collapse:collapse; font-size:12.5px; }
    table.dev-cal td{ padding:6px 6px; border-bottom:1px solid #1d2a44; vertical-align:top; }
    table.dev-cal td.q{ white-space:nowrap; color:#9fb0c4; font-family:"Space Mono",monospace; font-size:11px; }
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="dev-modale"; m.hidden=true;
  m.innerHTML = `<div class="dev-cadre">
    <div class="dev-tete"><b>CONSOLE DEV</b><span class="dev-warn">accès restreint · non sécurisé côté client</span><button class="mini" id="dev-fermer">Fermer</button></div>
    <!-- v1.34 : ZONE DE CONSTRUCTION, jamais affichée. majDev() y construit les
         blocs (mêmes id, mêmes branchements qu'avant) ; _devRanger() les range
         ensuite dans les onglets ci-dessous. ⚠ Elle est placée AVANT les onglets :
         pendant une reconstruction, un id existe deux fois (bloc neuf ici, ancien
         dans son onglet) ; document.querySelector trouve ainsi le NEUF — c'est
         lui que les chargeurs (Protocole, staff, journal) doivent remplir. -->
    <div class="dev-stage" hidden><div id="dev-recherche"></div><div id="dev-activ"></div><div id="dev-gouv"></div><div id="dev-journal"></div></div>
    <div class="dev-onglets">${DEV_ONGLETS.map((o,i)=>`<button class="dev-onglet${i?"":" actif"}" data-dev="${o.id}">${o.nom}</button>`).join("")}</div>
    ${DEV_ONGLETS.map((o,i)=>`<div class="dev-vue" id="dev-t-${o.id}"${i?" hidden":""}>${o.sections.map(s=>`<section class="dev-sec${s.danger?" danger":""}" data-sec="${s.id}"><h3>${s.titre}</h3>${s.note?`<p class="dev-note">${s.note}</p>`:""}<div class="dev-sec-corps"></div></section>`).join("")}</div>`).join("")}
  </div>`;
  document.body.appendChild(m);
  m.querySelector("#dev-fermer").addEventListener("click", fermerDev);
  m.addEventListener("click", e=>{ if(e.target.id==="dev-modale") fermerDev(); });
  m.querySelectorAll(".dev-onglet").forEach(b=>b.addEventListener("click",()=>_devMontrerOnglet(b.dataset.dev)));
  _devMonte = true;
}


/* ===========================================================
   FICHE JOUEUR (staff) — recherche serveur + actions de dépannage.
   Remplace l'ancienne recherche locale, qui ne trouvait que soi-même.
   =========================================================== */
let _ficheJoueur = null;   // dernier joueur sélectionné

async function devChercherJoueur(){
  const z = document.querySelector("#dev-res"); if(!z) return;
  const q = (document.querySelector("#dev-q")?.value || "").trim();
  if(!q){ z.innerHTML = `<p class="dev-note">Tape un pseudo (une partie suffit).</p>`; return; }
  z.innerHTML = `<p class="dev-note">Recherche…</p>`;
  const { data, error } = await sb.rpc("admin_fiche_joueur", { p_nom: q });
  if(error || !data || !data.ok){
    z.innerHTML = `<p class="vide">Recherche impossible — ${(data&&data.err)||(error&&error.message)||"?"}</p>`;
    return;
  }
  const l = data.profils || [];
  if(!l.length){ z.innerHTML = `<p class="vide">Aucun compte pour « ${q.replace(/</g,"&lt;")} ».</p>`; return; }
  if(l.length === 1){ _devAfficherFiche(l[0]); return; }
  z.innerHTML = `<p class="dev-note">${l.length} résultats :</p>` +
    l.map((p,i)=>`<button class="mini" data-fiche="${i}" style="margin:2px">${echapper(p.nom)} <span class="dev-note">(${p.faction||"—"})</span></button>`).join("");
  z.querySelectorAll("[data-fiche]").forEach(b=>b.addEventListener("click",()=>_devAfficherFiche(l[+b.dataset.fiche])));
}

function _devAfficherFiche(p){
  _ficheJoueur = p;
  const z = document.querySelector("#dev-res"); if(!z) return;
  const oui = v => v ? "✅ oui" : "— non";
  const dh  = v => v ? new Date(v).toLocaleString("fr-FR") : "—";
  const etatTxt = p.mort ? `<b style="color:#ff5257">MORT</b> (depuis ${dh(p.mort_le)})`
                : p.en_pause ? `<b style="color:#ff8a3d">EN PAUSE</b> (depuis ${dh(p.pause_depuis)})`
                : p.en_prison ? `<b style="color:#ff8a3d">EN PRISON</b>` : "actif";
  const opts = (typeof TOUS_ITEMS!=="undefined")
    ? TOUS_ITEMS.slice().sort((a,b)=>a.nom.localeCompare(b.nom)).map(it=>`<option value="${it.id}">${it.nom}</option>`).join("")
    : "";

  z.innerHTML = `
    <div class="dev-bloc">
      <h4>${echapper(p.nom)} <span class="dev-note" style="float:right">${p.faction||"—"} · Niv ${p.niveau} · ${p.role_admin||"joueur"}</span></h4>
      <table class="dev-fiche">
        <tr><td>Crédits</td><td><b>${p.credits} ₡</b></td><td>Énergie</td><td><b>${p.energie} %</b></td></tr>
        <tr><td>Santé</td><td><b>${p.sante} %</b></td><td>Moral</td><td><b>${p.moral} %</b></td></tr>
        <tr><td>O₂</td><td><b>${p.o2} %</b></td><td>Sac</td><td><b>${p.sac}/${p.sac_max}</b></td></tr>
        <tr><td>Position</td><td><b>${p.pos_x ?? "—"}, ${p.pos_y ?? "—"}</b> ${p.chez_soi?"(chez lui)":""}</td>
            <td>Force combat</td><td><b>${p.force_combat}</b></td></tr>
        <tr><td>Réputation</td><td><b>${p.reputation}</b></td><td>Gouvernement</td><td><b>${p.role_gouv||"—"}</b></td></tr>
        <tr><td>Permis vaisseau</td><td>${oui(p.permis_vaisseau)}</td><td>Vaisseau</td><td>${p.vaisseau||"—"}</td></tr>
        <tr><td>Compte créé</td><td colspan="3">${dh(p.cree_le)} · dernière activité ${dh(p.derniere_activite)}</td></tr>
        <tr><td>E-mail</td><td colspan="3" class="dev-note">${echapper(p.email||"—")}</td></tr>
        <tr><td>État</td><td colspan="3">${etatTxt}</td></tr>
        <tr><td>Compagnon</td><td colspan="3"><span id="f-bete">…</span> <button class="mini" id="f-bete-renommer" hidden>Renommer</button></td></tr>
      </table>
    </div>

    <div class="dev-bloc"><h4>Dépannage</h4>
      <div class="dev-actions">
        <button class="mini" id="f-soigner" title="Santé, moral, O₂ et énergie à 100 — et ressuscite si besoin">Tout remettre à 100 %</button>
        <button class="mini" id="f-pause">${p.en_pause ? "Réveiller" : "Mettre en pause"}</button>
      </div>
    </div>

    <div class="dev-bloc"><h4>Crédits</h4>
      <div class="dev-champ"><input id="f-cred" type="number" value="1000">
        <button class="mini" id="f-cred-btn">Créditer</button></div>
    </div>

    <div class="dev-bloc"><h4>Niveau</h4>
      <div class="dev-champ"><input id="f-niv" type="number" min="2" max="60" value="${Math.min(60, Math.max(2, ((p.niveau|0) || 1) + 1))}" style="max-width:72px">
        <button class="mini" id="f-niv-btn">Monter à ce niveau</button></div>
      <p class="dev-note">v1.47 : monter seulement (les points déjà distribués ne se reprennent pas). Les points de compétence arrivent au prochain chargement du joueur. Tracé dans le journal du staff ; le joueur est prévenu.</p>
    </div>

    <div class="dev-bloc"><h4>Objet</h4>
      <div class="dev-champ"><select id="f-item">${opts}</select>
        <input id="f-qte" type="number" value="1" min="1" style="max-width:64px">
        <button class="mini" id="f-item-btn">Donner</button></div>
    </div>

    <div class="dev-bloc"><h4>Quêtes</h4>
      <div class="dev-champ"><select id="f-quete">
          <option value="">— Toutes les quêtes —</option>
          ${(typeof QUETES!=="undefined"?QUETES:[]).map(q=>`<option value="${q.id}">${q.id.toUpperCase()} — ${echapper(q.nom)}</option>`).join("")}
        </select>
        <label class="dev-note" style="display:flex;align-items:center;gap:5px"><input type="checkbox" id="f-quete-affut"> effacer aussi les jours d'affût</label>
        <button class="mini" id="f-quete-verrou">Lever le verrou d'échec</button>
        <button class="mini danger" id="f-quete-btn">Rendre rejouable</button></div>
      <p class="dev-note"><b>Lever le verrou</b> : la quête choisie (ou toutes) redevient jouable tout de suite, sans attendre les 8 h — la progression n'est pas touchée.<br>
      <b>Rendre rejouable</b> : la quête repart à zéro (abandonnée si en cours). Les <b>PA</b> et les <b>points de Cercle</b> déjà gagnés ne seront pas reversés ; la bête reste. Le joueur connecté devra recharger sa page.</p>
    </div>

    <div class="dev-bloc"><h4>Journal du joueur</h4>
      <div class="dev-champ"><button class="mini" id="f-journal">Afficher les 200 dernières entrées</button></div>
      <div id="f-journal-zone"></div>
    </div>

    <div class="dev-bloc"><h4>Mouvements (objets et crédits, 7 jours)</h4>
      <div class="dev-champ"><button class="mini" id="f-mouvements">Afficher</button></div>
      <div id="f-mouvements-zone"></div>
    </div>`;

  if(!document.querySelector("#dev-fiche-style")){
    const st=document.createElement("style"); st.id="dev-fiche-style";
    st.textContent = `.dev-fiche{ width:100%; border-collapse:collapse; font-size:12px; }
      .dev-fiche td{ padding:3px 6px; border-bottom:1px solid rgba(255,255,255,.06); }
      .dev-fiche td:nth-child(odd){ color:var(--texte-2,#9fb3c8); width:22%; }`;
    document.head.appendChild(st);
  }

  const rafraichir = async () => {
    const { data } = await sb.rpc("admin_fiche_joueur", { p_nom: p.nom });
    const maj = (data && data.ok && (data.profils||[]).find(x=>x.id===p.id));
    if(maj) _devAfficherFiche(maj);
  };

  /* v1.00 — la bête du joueur (Q15). Le joueur ne peut jamais la renommer ;
     le staff oui (admin_renommer_bete, tracé dans admin_log). */
  (async ()=>{
    const el=z.querySelector("#f-bete"), br=z.querySelector("#f-bete-renommer"); if(!el) return;
    const b = (typeof beteDe==="function") ? await beteDe(p.id) : null;
    if(!b){ el.textContent="aucun"; return; }
    const i = (typeof beteInfo==="function") ? beteInfo(b.espece) : null;
    el.innerHTML = `<b>${echapper(b.nom)}</b> <span class="dev-note">(${i?i.nom:b.espece})</span>`; br.hidden=false;
    br.addEventListener("click", async ()=>{
      const n = prompt(`Nouveau nom pour le compagnon de ${p.nom} (2 à 20 lettres ; espaces, tirets, apostrophes entre deux lettres) :`, b.nom);
      if(n==null) return;
      if(typeof beteNomValide==="function" && !beteNomValide(n)){ alert("Nom refusé : 2 à 20 lettres, espaces, tirets ou apostrophes seulement entre deux lettres."); return; }
      const { data, error } = await sb.rpc("admin_renommer_bete", { p_profil: p.id, p_nom: n });
      if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
      journal(`[STAFF] Compagnon de ${p.nom} renommé : ${data.ancien} → ${data.nom}.`,"alerte"); rafraichir();
    });
  })();

  z.querySelector("#f-soigner").addEventListener("click", async ()=>{
    if(!confirm(`Remettre santé, moral, O₂ et énergie de ${p.nom} à 100 % ?`)) return;
    const { data, error } = await sb.rpc("admin_soigner", { p_profil: p.id });
    if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
    journal(`[STAFF] ${p.nom} remis à 100 %.`,"gain"); rafraichir();
  });

  z.querySelector("#f-pause").addEventListener("click", async ()=>{
    const vers = !p.en_pause;
    if(!confirm(`${vers?"Mettre en pause":"Réveiller"} ${p.nom} ?`)) return;
    const { data, error } = await sb.rpc("admin_pause_joueur", { p_profil: p.id, p_en_pause: vers });
    if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
    journal(`[STAFF] ${p.nom} ${vers?"mis en pause":"réveillé"}.`,"alerte"); rafraichir();
  });

  // v1.47 — monter un personnage à un niveau (admin_fixer_niveau, v173).
  z.querySelector("#f-niv-btn").addEventListener("click", async ()=>{
    const n = parseInt(z.querySelector("#f-niv").value,10)||0;
    if(n < 2 || n > 60){ alert("Niveau entre 2 et 60."); return; }
    if(!confirm(`Monter ${p.nom} au niveau ${n} ? On ne peut pas revenir en arrière.`)) return;
    const { data, error } = await sb.rpc("admin_fixer_niveau", { p_profil: p.id, p_niveau: n });
    if(error || !data || !data.ok){
      const e = data && data.err;
      alert(e==="pas_plus_haut" ? `${p.nom} est déjà au niveau ${n} ou plus haut : l'outil ne fait que monter.`
          : "Échec : "+(e||(error&&error.message)||"?"));
      return;
    }
    journal(`[STAFF] ${data.nom} passe au niveau ${data.niveau} (${data.xp} XP).`,"gain");
    // Si c'est soi-même : on adopte le nouveau total tout de suite (points crédités).
    try{ const ses = (typeof sessionActuelle === "function") ? await sessionActuelle() : null;
         if(ses && ses.user && ses.user.id === p.id && typeof adopterXpTotal === "function") adopterXpTotal(data.xp); }catch(e){}
    rafraichir();
  });

  z.querySelector("#f-cred-btn").addEventListener("click", async ()=>{
    const n = parseInt(z.querySelector("#f-cred").value,10)||0; if(!n) return;
    const { data, error } = await sb.rpc("admin_offrir_credits",
      { p_profil: p.id, p_montant: n, p_motif: "console staff" });
    if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
    journal(`[STAFF] ${n>0?"+":""}${n} ₡ à ${p.nom} (solde ${data.solde} ₡).`,"gain"); rafraichir();
  });

  z.querySelector("#f-item-btn").addEventListener("click", async ()=>{
    const id = z.querySelector("#f-item").value;
    const q  = parseInt(z.querySelector("#f-qte").value,10)||0; if(!id||q<=0) return;
    const { data, error } = await sb.rpc("admin_offrir_objet",
      { p_profil: p.id, p_item: id, p_qte: q, p_motif: "console staff" });
    if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
    journal(`[STAFF] ${data.donne}× ${item(id).nom} à ${p.nom}${data.partiel?" (sac plein)":""}.`,"gain"); rafraichir();
  });

  /* v1.03 — remise à zéro d'une quête POUR UN AUTRE JOUEUR (RPC admin_reset_quete).
     ⚠ Elle incrémente `_rev` : l'onglet du joueur, s'il est ouvert, se verra
     refuser sa prochaine sauvegarde et lui demandera de recharger. Sans ça, il
     réécrirait son ancienne progression par-dessus la remise à zéro. */
  z.querySelector("#f-quete-btn").addEventListener("click", async ()=>{
    const qid = z.querySelector("#f-quete").value || null;
    const affut = !!z.querySelector("#f-quete-affut").checked;
    const quoi = qid ? qid.toUpperCase() : "TOUTES les quêtes";
    if(!confirm(`Rendre ${quoi} rejouable pour ${p.nom} ?${affut?"\nLes jours d'affût déjà tenus seront effacés.":""}`)) return;
    const { data, error } = await sb.rpc("admin_reset_quete",
      { p_profil: p.id, p_quete: qid, p_affut: affut });
    if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
    journal(`[STAFF] ${quoi} remise à zéro pour ${p.nom}${data.affut_efface?` (${data.affut_efface} jour(s) d'affût effacé(s))`:""}.`,"alerte");
  });

  /* v1.04 — lever le verrou d'échec (8 h) sans toucher à la progression.
     Marche aussi sur soi-même : il suffit de chercher son propre pseudo. */
  z.querySelector("#f-quete-verrou").addEventListener("click", async ()=>{
    const qid = z.querySelector("#f-quete").value || null;
    const { data, error } = await sb.rpc("admin_debloquer_quete", { p_profil: p.id, p_quete: qid });
    if(error || !data || !data.ok){ alert("Échec : "+((data&&data.err)||(error&&error.message)||"?")); return; }
    journal(data.leves ? `[STAFF] ${data.leves} verrou(s) levé(s) pour ${p.nom}.` : `[STAFF] ${p.nom} n'avait aucun verrou${qid?" sur "+qid.toUpperCase():""}.`, "gain");
  });

  // v0.96 — rendu partagé avec la page profil (profil-page.js)
  z.querySelector("#f-mouvements").addEventListener("click", ()=>{
    if(typeof afficherMouvementsStaff === "function") afficherMouvementsStaff(z.querySelector("#f-mouvements-zone"), p.id);
  });

  z.querySelector("#f-journal").addEventListener("click", async ()=>{
    const zj = z.querySelector("#f-journal-zone");
    zj.innerHTML = `<p class="dev-note">Chargement…</p>`;
    const { data, error } = await sb.rpc("admin_journal_joueur", { p_profil: p.id, p_limite: 200 });
    if(error || !data || !data.ok){
      zj.innerHTML = `<p class="dev-note">Impossible — ${(data&&data.err)||(error&&error.message)||"?"}</p>`; return;
    }
    const cls = { alerte:"#ff8a3d", gain:"#8bd450", poste:"#6cc8ff" };
    const lignes = (data.journal||[]).slice().sort((a,b)=>(b&&b.d||0)-(a&&a.d||0)).map(e=>{
      if(typeof e === "string") return `<div>${e.replace(/</g,"&lt;")}</div>`;
      const q = e && e.d ? new Date(e.d).toLocaleString("fr-FR") : "—";
      let t = (e && (e.t || e.txt)) || JSON.stringify(e);
      if(typeof rendreLibelles==="function") t = rendreLibelles(t);   // v0.92 : marqueurs {fac:id}
      const c = cls[e && e.type] || "";
      return `<div><span class="dev-note">${q}${e.cat?" ["+e.cat+"]":""}</span> <span${c?` style="color:${c}"`:""}>${String(t).replace(/</g,"&lt;")}</span></div>`;
    }).join("");
    zj.innerHTML = `<div style="max-height:300px;overflow:auto;font-size:11px;line-height:1.6">${lignes||'<p class="dev-note">Journal vide.</p>'}</div>
      <p class="dev-note">${data.total} entrées au total.</p>`;
  });
}
