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

/* ---------- Accès ---------- */
window.addEventListener("keydown", e => {
  if(e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")){ e.preventDefault(); ouvrirDev(); }
});
function ouvrirDev(){
  if(typeof estAdmin!=="function" || !estAdmin()) return;   // réservé dev/admin (les actions sont revérifiées serveur)
  monterDev();
  const m = document.querySelector("#dev-modale");
  const dev = (typeof estDev==="function" && estDev());
  m.querySelector('[data-dev="recherche"]').style.display = dev ? "" : "none";
  m.querySelector('[data-dev="activ"]').style.display = dev ? "" : "none";
  m.querySelector('[data-dev="cadeaux"]').style.display = dev ? "" : "none";
  m.querySelector(".dev-tete b").textContent = dev ? "CONSOLE DEV" : "CONSOLE ADMIN";
  const premier = dev ? "recherche" : "gouv";
  m.querySelectorAll(".dev-onglet").forEach(x=>x.classList.toggle("actif", x.dataset.dev===premier));
  ["recherche","activ","cadeaux","gouv"].forEach(v=>{ const el=m.querySelector("#dev-"+v); if(el) el.hidden=(v!==premier); });
  m.hidden = false;
  majDev();
}
function fermerDev(){ const m=document.querySelector("#dev-modale"); if(m) m.hidden = true; }

/* ---------- Actions dev ---------- */
async function devDonnerCredits(n){
  n = parseInt(n,10)||0; if(!n) return;
  if(_devCible){
    const { data, error } = await sb.rpc("admin_offrir_credits",
      { p_profil:_devCible.id, p_montant:n, p_motif:"don console dev" });
    if(error || !data || !data.ok){
      alert("Échec : " + ((data && data.err) || (error && error.message) || "?")); return;
    }
    journal(`[DEV] ${n>0?"+":""}${n} ₡ à ${data.nom} (solde : ${data.solde} ₡).`,"gain");
    return;
  }
  // Pour soi : on passe par la RPC admin aussi, pour que le don soit journalisé
  // et pour ne pas dépendre du plafond de crediter().
  try{
    const { data:me } = await sb.auth.getUser();
    const { data, error } = await sb.rpc("admin_offrir_credits",
      { p_profil: me.user.id, p_montant: n, p_motif: "don console dev (soi)" });
    if(error || !data || !data.ok){ alert("Échec du don."); return; }
    if(typeof rechargerCredits === "function") await rechargerCredits();
    journal(`[DEV] ${n>0?"+":""}${n} ₡.`,"gain");
  }catch(e){ alert("Échec du don."); return; }
  sauvegarder(); afficher(); majDev();
}
function devDonnerPA(n){ n=parseInt(n,10)||0; if(!n) return; if(!etat.aptitudes) etat.aptitudes={pa:0,pris:[]}; etat.aptitudes.pa=Math.max(0,(etat.aptitudes.pa||0)+n); journal(`[DEV] ${n>0?"+":""}${n} PA.`,"gain"); sauvegarder(); afficher(); majDev(); }
// ⚠ PHASE 4 : le sac appartient au serveur. Écrire dans etat.sac ne créait que
// des objets FANTÔMES — visibles à l'écran, inexistants pour le serveur, d'où
// des « il te manque de quoi faire ça » à la fabrication ou au marché.
/* Cible des dons : null = moi. Renseignée par la recherche ci-dessous. */
let _devCible = null;   // { id, nom }

async function devChercherCible(){
  const q = (document.querySelector("#dev-dest-nom").value||"").trim();
  const z = document.querySelector("#dev-dest-res"); if(!z) return;
  if(!q){ _devCible = null; _devMajCible(); z.innerHTML = ""; return; }
  const { data, error } = await sb.rpc("admin_chercher_profil", { p_nom: q });
  if(error || !data || !data.ok){ z.textContent = "Recherche impossible."; return; }
  const l = data.profils || [];
  if(!l.length){ z.textContent = "Aucun joueur trouvé."; return; }
  z.innerHTML = l.map(p=>`<button class="mini" data-cible="${p.id}" data-nom="${p.nom}" style="margin:2px">
      ${p.nom} <span class="itip-gris">(${p.faction||"—"}, ${p.credits} ₡${p.mort?", MORT":""}${p.pause?", en pause":""})</span></button>`).join("");
  z.querySelectorAll("[data-cible]").forEach(b=>b.addEventListener("click",()=>{
    _devCible = { id:b.dataset.cible, nom:b.dataset.nom }; _devMajCible();
  }));
}
function _devMajCible(){
  const e = document.querySelector("#dev-dest-actuel");
  if(e) e.textContent = _devCible ? _devCible.nom : "Moi";
}

async function devDonnerObjet(id, qte){
  qte = parseInt(qte,10)||0; if(!id || qte<=0) return;
  if(_devCible){
    const { data, error } = await sb.rpc("admin_offrir_objet",
      { p_profil:_devCible.id, p_item:id, p_qte:qte, p_motif:"don console dev" });
    if(error || !data || !data.ok){
      alert("Échec : " + ((data && data.err) || (error && error.message) || "?"));
      return;
    }
    journal(`[DEV] ${data.donne}× ${item(id).nom} remis à ${data.nom}${data.partiel?" (sac plein, don partiel)":""}.`,"gain");
    return;
  }
  const r = await agirServeur({ ajouter:{ [id]: qte }, motif:"dev_cadeau" });
  if(!r) return;
  const recu = (r.ajoutes||{})[id] || 0;
  if(recu < qte) journal(`[DEV] +${recu} ${item(id).nom} — le reste n'entrait pas (sac plein).`,"alerte");
  else journal(`[DEV] +${recu} ${item(id).nom} (donné).`,"gain");
  sauvegarder(); afficher(); majDev();
}
function devPause(){ etat.enPause = !etat.enPause; journal(`[DEV] personnage ${etat.enPause?"mis en pause":"réactivé"}.`,"alerte"); sauvegarder(); afficher(); majDev(); }
function devEnergie(){ etat.energie=100; etat.energieMaj=Date.now(); journal("[DEV] énergie rechargée à 100 %.","gain"); sauvegarder(); afficher(); majDev(); }
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
  const { data, error } = await sb.rpc("nova_declin");
  if(error){ alert("Échec : "+error.message); return; }
  journal(`[DEV] déclin appliqué : ${data.touches} profil(s), ${data.morts} mort(s).`,"alerte");
  if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
  afficher(); majDev();
}
// Déclenche TOUT le lot quotidien : déclin, sorties de pause, destruction des
// morts, planification du Protocole, ménage. Sinon il faut attendre 0 h 05 UTC.
async function devQuotidien(){
  if(!confirm("Lancer les tâches quotidiennes ?\n\nDéclin, sorties de pause, DESTRUCTION des personnages morts depuis trop longtemps, planification du Protocole.")) return;
  const { data, error } = await sb.rpc("nova_quotidien");
  if(error){ alert("Échec : "+error.message); return; }
  journal(`[DEV] tâches quotidiennes exécutées : ${JSON.stringify(data)}`,"alerte");
  if(typeof _syncPause==="function") await _syncPause();
  if(typeof chargerStocksServeur==="function") await chargerStocksServeur();
  if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
  if(typeof syncMort==="function") await syncMort();
  if(typeof majEcranPause==="function") majEcranPause();
  afficher(); majDev();
}
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
function devFactionBloc(){ const bloque=(etat.factionChangeBloque!==false); etat.factionChangeBloque=!bloque; journal("[DEV→admin] changement de faction "+((etat.factionChangeBloque!==false)?"BLOQUÉ":"DÉBLOQUÉ")+".","alerte"); sauvegarder(); if(typeof majParametres==="function") majParametres(); afficher(); majDev(); }
function devPermis(){ etat.permisVaisseau = !etat.permisVaisseau; journal(`[DEV] permis de vaisseau ${etat.permisVaisseau?"accordé":"retiré"}.`,"gain"); sauvegarder(); afficher(); majDev(); }
function _devRafraichirQuetes(){ if(typeof rafraichirQuetes==="function") rafraichirQuetes(); else if(typeof afficher==="function") afficher(); }
function devResetQuete(id){ if(!id) return; const q=etat.quetes||(etat.quetes={done:[],active:null}); q.done=(q.done||[]).filter(x=>x!==id); if(q.active&&q.active.id===id) q.active=null; journal(`[DEV] quête ${id} réinitialisée.`,"gain"); sauvegarder(); _devRafraichirQuetes(); majDev(); }
function devResetQuetes(){ etat.quetes={done:[],active:null}; journal("[DEV] toutes les quêtes réinitialisées.","gain"); sauvegarder(); _devRafraichirQuetes(); majDev(); }

/* ---------- Rendu ---------- */
function _devCartePerso(){
  const pos = etat.pos ? `${Math.round(etat.pos.x)}, ${Math.round(etat.pos.y)}` : "—";
  const cree = etat.creeLe ? new Date(etat.creeLe).toLocaleString("fr-FR") : "—";
  return `<div class="dev-carte">
    <div class="dev-carte-tete"><b>${etat.nom||"(sans pseudo)"}</b> <span class="qte">${etat.faction||"—"} · Niv ${etat.niveau}</span></div>
    <div class="dev-grid">
      <span>Crédits</span><b>${etat.credits} ₡</b>
      <span>Énergie</span><b>${Math.floor(etat.energie)} %</b>
      <span>Position</span><b>${pos}</b>
      <span>IP</span><b class="dev-dim">— (backend requis)</b>
      <span>Compte créé</span><b>${cree}</b>
      <span>État</span><b>${etat.enPause?"⏸ EN PAUSE":"actif"}</b>
      <span>Permis vaisseau</span><b>${etat.permisVaisseau?"✅ oui":"— non"}</b>
    </div>
    <div class="dev-bloc" style="margin-top:12px"><h4>Quêtes (debug)</h4>
      <div class="dev-champ"><select id="dev-quete-sel">${(typeof QUETES!=="undefined"?QUETES:[]).map(q=>`<option value="${q.id}">${q.id} — ${q.nom}${(etat.quetes&&etat.quetes.done&&etat.quetes.done.includes(q.id))?" ✓ faite":((etat.quetes&&etat.quetes.active&&etat.quetes.active.id===q.id)?" ⏳ en cours":"")}</option>`).join("")}</select><button class="mini" id="dev-quete-reset">Réinitialiser</button></div>
      <button class="mini" id="dev-quete-reset-all" style="margin-top:6px">Tout réinitialiser (quêtes)</button>
    </div>
  </div>`;
}
function majDev(){
  const r = document.querySelector("#dev-recherche");
  if(r){
    const q = (document.querySelector("#dev-q")?.value || "").trim().toLowerCase();
    const match = !q || (etat.nom||"").toLowerCase().includes(q);
    r.innerHTML =
      `<p class="dev-note">En solo, un seul compte existe (le tien). La recherche multi-comptes, les IP et l'entrée dans un compte tiers nécessiteront le <b>backend multijoueur</b>.</p>
       <div class="dev-champ"><input id="dev-q" placeholder="Rechercher un pseudo…" value="${q}"><button class="mini" id="dev-chercher">Chercher</button></div>
       <div id="dev-res">${match ? _devCartePerso() : `<p class="vide">Aucun compte pour « ${q} ».</p>`}</div>`;
    r.querySelector("#dev-chercher").addEventListener("click", majDev);
    r.querySelector("#dev-q").addEventListener("keydown", e=>{ if(e.key==="Enter") majDev(); });
    const bqr=r.querySelector("#dev-quete-reset"); if(bqr) bqr.addEventListener("click", ()=>{ const sel=r.querySelector("#dev-quete-sel"); if(sel) devResetQuete(sel.value); });
    const bqa=r.querySelector("#dev-quete-reset-all"); if(bqa) bqa.addEventListener("click", devResetQuetes);
  }
  const av = document.querySelector("#dev-activ");
  if(av){
    av.innerHTML = `<p class="dev-note">Interrupteurs de test sur <b>ce personnage</b>. Sans effet sur les autres joueurs.</p>
    <div class="dev-actions">
      <button class="mini" id="dev-pause">${etat.enPause?"Réactiver":"Mettre en pause"}</button>
      <button class="mini" id="dev-permis">${etat.permisVaisseau?"Retirer permis vaisseau":"Accorder permis vaisseau"}</button>
      <button class="mini" id="dev-energie">Recharger énergie (100%)</button>
      <button class="mini" id="dev-prison">Libérer de prison</button>
      <button class="mini" id="dev-journal-vider">Vider le journal</button>
      <button class="mini" id="dev-declin" title="Applique une journée de déclin à TOUS les profils">Forcer le déclin quotidien</button>
      <button class="mini" id="dev-quotidien" title="Déclin + sorties de pause + destruction des morts + Protocole + ménage">Forcer les tâches quotidiennes</button>
      <button class="mini" id="dev-recaler-comp">Recaler compétences (10/10/10)</button>
      <button class="mini" id="dev-facbloc">${(etat.factionChangeBloque!==false)?"Débloquer":"Bloquer"} changement de faction</button>
      <button class="mini" id="dev-protocole" title="Interceptions sur le terrain, pour ce personnage seulement">Patrouilles : ${(etat.protocoleActif!==false)?"ON":"OFF"}</button>
      <button class="mini" id="dev-imperso" disabled title="Nécessite le backend multijoueur">Entrer dans le compte</button>
    </div>`;
    const bp=av.querySelector("#dev-pause"); if(bp) bp.addEventListener("click", devPause);
    const bpv=av.querySelector("#dev-permis"); if(bpv) bpv.addEventListener("click", devPermis);
    const ben=av.querySelector("#dev-energie"); if(ben) ben.addEventListener("click", devEnergie);
    const bpr=av.querySelector("#dev-prison"); if(bpr) bpr.addEventListener("click", devLibererPrison);
    const bjv=av.querySelector("#dev-journal-vider"); if(bjv) bjv.addEventListener("click", devViderJournal);
    const bdc=av.querySelector("#dev-declin"); if(bdc) bdc.addEventListener("click", devDeclin);
    const bqt=av.querySelector("#dev-quotidien"); if(bqt) bqt.addEventListener("click", devQuotidien);
    const brc=av.querySelector("#dev-recaler-comp"); if(brc) brc.addEventListener("click", devRecalerCompetences);
    const bfb=av.querySelector("#dev-facbloc"); if(bfb) bfb.addEventListener("click", devFactionBloc);
    const bpro=av.querySelector("#dev-protocole"); if(bpro) bpro.addEventListener("click", devProtocole);
  }
  const c = document.querySelector("#dev-cadeaux");
  if(c){
    const opts = TOUS_ITEMS.slice().sort((a,b)=>a.nom.localeCompare(b.nom)).map(it=>`<option value="${it.id}">${it.nom}</option>`).join("");
    c.innerHTML =
      `<div class="dev-bloc"><h4>Destinataire</h4>
         <p class="dev-note">Laisse vide pour t'attribuer le don à toi-même. Sinon tape un pseudo et choisis dans la liste.<br>
           <b>Chaque don est journalisé</b> dans admin_log et annoncé au joueur.</p>
         <div class="dev-champ"><input id="dev-dest-nom" type="text" placeholder="Pseudo du joueur…"><button class="mini" id="dev-dest-chercher">Chercher</button></div>
         <div id="dev-dest-res" class="dev-note"></div>
         <p class="dev-note">Cible actuelle : <b id="dev-dest-actuel">Moi</b></p>
       </div>
       <div class="dev-bloc"><h4>Crédits</h4><div class="dev-champ"><input id="dev-cred" type="number" value="1000"><button class="mini" id="dev-don-cred">Créditer</button></div></div>
       <div class="dev-bloc"><h4>Points d'aptitude (PA)</h4><div class="dev-champ"><input id="dev-pa" type="number" value="1"><button class="mini" id="dev-don-pa">Donner PA</button></div></div>
       <div class="dev-bloc"><h4>Objet (tout item du jeu)</h4><div class="dev-champ"><select id="dev-item">${opts}</select><input id="dev-qte" type="number" value="1" min="1" style="max-width:64px"><button class="mini" id="dev-don-item">Donner</button></div><p class="dev-note" style="margin:6px 0 0">Le don ignore la limite du sac (pratique pour tester : Sylve, Biofibre, etc.).</p></div>`;
    c.querySelector("#dev-dest-chercher").addEventListener("click", devChercherCible);
    c.querySelector("#dev-dest-nom").addEventListener("keydown", e=>{ if(e.key==="Enter") devChercherCible(); });
    _devMajCible();
    c.querySelector("#dev-don-cred").addEventListener("click", ()=>devDonnerCredits(c.querySelector("#dev-cred").value));
    c.querySelector("#dev-don-pa").addEventListener("click", ()=>devDonnerPA(c.querySelector("#dev-pa").value));
    c.querySelector("#dev-don-item").addEventListener("click", ()=>devDonnerObjet(c.querySelector("#dev-item").value, c.querySelector("#dev-qte").value));
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
      h += `<div class="dev-bloc"><h4>Staff actuel</h4><div id="dev-staff"><p class="dev-note">Chargement…</p></div></div>`;
      h += `<div class="dev-bloc"><h4>Expédition (test)</h4><p class="dev-note">Avance l'échéance de l'expédition de ta faction à <b>maintenant</b>. Le cron la résoudra à la minute suivante, exactement comme en vrai.</p><div class="dev-champ"><button class="mini" id="dev-exp-avancer">Avancer l'échéance à maintenant</button></div></div>`;
      h += `<div class="dev-bloc"><h4>Journal admin <button class="mini" id="dev-log-vider" style="float:right;padding:2px 8px">Tout effacer</button></h4><div id="dev-log"><p class="dev-note">Chargement…</p></div></div>`;
    }
    g.innerHTML = h;
    g.querySelector("#dev-nom-btn").addEventListener("click", devNommer);
    const ab=g.querySelector("#dev-adm-btn"); if(ab) ab.addEventListener("click", devDefinirRole);
    if(typeof estDev==="function" && estDev()){ _devChargerProto(); _devChargerStaff(); _devChargerLog(); const bv=g.querySelector("#dev-log-vider"); if(bv) bv.addEventListener("click", devViderLog); g.querySelectorAll("[data-phase]").forEach(b=>b.addEventListener("click",()=>devForcerPhase(b.dataset.phase||null))); const bre=g.querySelector("#dev-reset-elec"); if(bre) bre.addEventListener("click", devResetElection); const bea=g.querySelector("#dev-exp-avancer"); if(bea) bea.addEventListener("click", devAvancerExpedition); }
  }
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
  if(error || !res || !res.ok){ alert("Échec : "+((res&&res.err)||"?")); return; }
  journal("[DEV] journal admin vidé.","alerte"); _devChargerLog();
}
async function _devChargerProto(){
  const z=document.querySelector("#dev-proto"); if(!z) return;
  let def="?", actif=false, menace=null;
  try{ const { data } = await sb.rpc("protocole_defense"); def=data; }catch(e){}
  try{ const { data } = await sb.rpc("protocole_est_actif"); actif=(data===true); }catch(e){}
  try{ const { data } = await sb.rpc("protocole_menace"); menace=data; }catch(e){}
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
    const { data:res, error } = await sb.rpc("admin_protocole_test", { p_cible: etat.faction||null, p_puissance: "moyenne" });
    if(error||!res||!res.ok){ alert("Échec : "+((res&&res.err)||(error&&error.message)||"?")); return; }
    journal(`[DEV] attaque du Protocole ${res.action==="creee"?"créée":"avancée"} — résolution à la minute suivante (si les attaques sont actives).`,"alerte");
    _devChargerProto();
  });
}
async function _devChargerStaff(){
  const z=document.querySelector("#dev-staff"); if(!z) return;
  try{
    const { data } = await sb.rpc("admin_liste_staff");
    const rows=data||[];
    if(!rows.length){ z.innerHTML=`<p class="dev-note">Aucun staff pour l'instant.</p>`; return; }
    z.innerHTML = rows.map(r=>`<div class="dev-champ" style="margin:3px 0"><span style="flex:1"><b>${r.nom}</b> · <span class="dev-dim">${r.role_admin}</span></span><button class="mini" data-demettre="${r.id}">Démettre</button></div>`).join("");
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
    z.innerHTML = rows.map(r=>`<div class="dev-note" style="margin:3px 0"><b style="color:#ff8a3d">${noms[r.acteur]||"?"}</b> · ${r.action}${r.cible?` → ${noms[r.cible]||"?"}`:""}${r.detail?` <span class="dev-dim">(${r.detail})</span>`:""} <span class="dev-dim">${new Date(r.cree_le).toLocaleString("fr-FR")}</span></div>`).join("");
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
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="dev-modale"; m.hidden=true;
  m.innerHTML = `<div class="dev-cadre">
    <div class="dev-tete"><b>CONSOLE DEV</b><span class="dev-warn">accès restreint · non sécurisé côté client</span><button class="mini" id="dev-fermer">Fermer</button></div>
    <div class="dev-onglets"><button class="dev-onglet actif" data-dev="recherche">Recherche</button><button class="dev-onglet" data-dev="activ">Activations</button><button class="dev-onglet" data-dev="cadeaux">Cadeaux</button><button class="dev-onglet" data-dev="gouv">Gouvernement</button></div>
    <div class="dev-vue" id="dev-recherche"></div>
    <div class="dev-vue" id="dev-activ" hidden></div>
    <div class="dev-vue" id="dev-cadeaux" hidden></div>
    <div class="dev-vue" id="dev-gouv" hidden></div>
  </div>`;
  document.body.appendChild(m);
  m.querySelector("#dev-fermer").addEventListener("click", fermerDev);
  m.addEventListener("click", e=>{ if(e.target.id==="dev-modale") fermerDev(); });
  m.querySelectorAll(".dev-onglet").forEach(b=>b.addEventListener("click",()=>{
    m.querySelectorAll(".dev-onglet").forEach(x=>x.classList.toggle("actif",x===b));
    ["recherche","activ","cadeaux","gouv"].forEach(v=>{ const el=m.querySelector("#dev-"+v); if(el) el.hidden=(b.dataset.dev!==v); });
  }));
  _devMonte = true;
}
