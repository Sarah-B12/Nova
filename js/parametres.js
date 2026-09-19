/* ===========================================================
   PARAMÈTRES — faction (cooldown + blocage admin), pause (min 3 j / max 60 j),
   compte (e-mail, mot de passe), apparence (cooldown 6 mois + crédits).
   Note : le déclin quotidien est FAIT côté serveur (cron `nova_quotidien`).
   JOUR_MS est passé en temps réel (24 h) et vaut `config.jour_ms`.
   =========================================================== */
const FACTION_COOLDOWN_J   = 30;    // jours entre deux changements de faction
/* ⚠ v0.95 — PAUSE_MIN_J / PAUSE_MAX_J ne sont plus que des REPLIS : les vraies
   valeurs sont `config.pause_min_j` / `pause_max_j`, renvoyées par pause_etat()
   et lues par _pMinJ() / _pMaxJ(). */
const PAUSE_MIN_J          = 3;     // pause minimale (anti-abus anti-vol)
const PAUSE_MAX_J          = 90;    // pause maximale (sortie auto ensuite, par le cron)

/* ⚠ Le verrou d'apparence est détenu par le SERVEUR (profils.apparence_le +
   RPC apparence_etat). `etat.apparenceLe` n'était jamais écrit : le texte
   « 500 ₡ / 6 mois » était purement décoratif et rien n'empêchait de se
   repersonnaliser en boucle. On interroge le serveur et on cache la réponse.
   `_appEnCours` évite la boucle chargerApparenceEtat → majParametres → … */
let _appEtat = null, _appEnCours = false;
async function chargerApparenceEtat(force){
  if(_appEnCours) return;
  if(_appEtat && !force) return;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  _appEnCours = true;
  try{
    const { data, error } = await sb.rpc("apparence_etat");
    if(!error && data && data.ok) _appEtat = data;
  } finally {
    _appEnCours = false;
  }
  majParametres();
}

/* ⚠ v0.95 — JOUR RÉEL, pas jour de jeu. Tout ce que formate _pfmtJours() est
   une échéance RÉELLE fixée par le serveur (fin de pause, verrou de faction,
   verrou d'apparence). Elle était divisée par JOUR_MS : juste tant que
   JOUR_MS vaut 24 h, faux dès qu'on l'accélère pour tester (piège n°16).
   `_jourReel()` (pause.js) renvoie la durée annoncée par pause_etat(). */
/* v0.95 — délai entre deux changements de faction : `config.faction_jours`,
   renvoyé par faction_etat(). FACTION_COOLDOWN_J n'est plus qu'un repli. */
function _facJours(){ return (_facEtat && typeof _facEtat.jours==="number") ? _facEtat.jours : FACTION_COOLDOWN_J; }
function _pMinJ(){ return (typeof etat._pauseMinJ==="number") ? etat._pauseMinJ : PAUSE_MIN_J; }
function _pMaxJ(){ return (typeof etat._pauseMaxJ==="number") ? etat._pauseMaxJ : PAUSE_MAX_J; }
function _pjm(){ return (typeof _jourReel==="function") ? _jourReel() : 86400000; }
function _pfmtJours(ms){ ms=Math.max(0,ms); const j=ms/_pjm(); if(j>=1) return `${Math.floor(j)} j`; const h=Math.ceil(j*24); return `${h} h`; }
/* ⚠ Le cooldown de faction et le blocage d'équilibrage sont détenus par le
   SERVEUR (profils.faction_le + config.faction_bloquee + RPC faction_etat).
   Avant, `changerFaction` écrivait etat.faction en local et le client poussait
   la colonne : les deux garde-fous se contournaient depuis F12. */
let _facEtat = null, _facEnCours = false;
async function chargerFactionEtat(force){
  if(_facEnCours) return;
  if(_facEtat && !force) return;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  _facEnCours = true;
  try{
    const { data, error } = await sb.rpc("faction_etat");
    if(!error && data && data.ok) _facEtat = data;
  } finally {
    _facEnCours = false;
  }
  majParametres();
}

/* ---------- Pause ---------- */
/* ⚠ PHASE avant-lancement : la pause est détenue par le SERVEUR
   (profils.pause_depuis). Elle protège du déclin quotidien : la laisser côté
   client permettrait de se déclarer en pause à vie pour ne jamais décliner.
   etat.enPause n'est plus qu'un reflet, rafraîchi par _syncPause(). */
function enPauseDepuis(){ return etat.enPause ? Date.now()-(etat.pauseLe||0) : 0; }

async function _syncPause(){
  if(typeof sb === "undefined") return null;
  try{
    const { data } = await sb.rpc("pause_etat");
    if(data && data.ok){
      if(data.jour_reel_ms) etat._jourReelMs = data.jour_reel_ms;   // durée d'un jour RÉEL
      if(typeof data.min_j === "number") etat._pauseMinJ = data.min_j;   // v0.95 : bornes lues au serveur
      if(typeof data.max_j === "number") etat._pauseMaxJ = data.max_j;
      etat.enPause = !!data.en_pause;
      etat.pauseLe = data.en_pause ? (Date.now() - (data.depuis_ms||0)) : 0;
      etat._pauseResteMin = data.reste_min_ms || 0;
      etat._pauseResteMax = data.reste_max_ms || 0;
      // La pause gèle l'usure : le serveur a décalé les dates des lots et des
      // offres. Les dates que le CLIENT détient encore (vaisseau, équipement
      // porté) doivent suivre le même décalage — y compris si la sortie de
      // pause a eu lieu hors ligne, d'où ce cumul comparé à ce qu'on a déjà appliqué.
      const cumul = data.cumul_ms || 0;
      const applique = etat._pauseCumulApplique || 0;
      if(cumul > applique){
        const d = cumul - applique;
        if(etat.vaisseauDate) etat.vaisseauDate += d;
        /* v0.91 — les deux horloges de vaisseau ajoutées avec la Navette de
           réserve doivent suivre le même dégel, sinon un joueur qui met le jeu
           en pause perd ses dix jours pendant qu'il ne joue pas. */
        if(etat.navetteFin) etat.navetteFin += d;
        if(etat.vaisseauAge) for(const k in etat.vaisseauAge){
          if(etat.vaisseauAge[k]) etat.vaisseauAge[k] += d;
        }
        if(etat.equipementDate) for(const k in etat.equipementDate){
          if(etat.equipementDate[k]) etat.equipementDate[k] += d;
        }
        etat._pauseCumulApplique = cumul;
        if(typeof sauvegarder==="function") sauvegarder();
      }
    }
    return data;
  }catch(e){ return null; }
}
// La sortie automatique passé le maximum est faite par le cron (nova-pause-auto) :
// un joueur absent ne se connecte pas pour la déclencher lui-même.
function verifPauseAuto(){ /* serveur */ }
async function basculerPause(){
  if(!etat.enPause){
    const ok = await _pauseConfirm("Mettre en pause ?", [
      `Minimum <b>${_pMinJ()} jours</b> — impossible de reprendre avant.`,
      `Maximum <b>${_pMaxJ()} jours</b> — sortie automatique ensuite.`,
      "Aucune action possible pendant la pause.",
      "Ton personnage ne décline pas et ne peut être ni volé ni attaqué."
    ], "Mettre en pause");
    if(!ok) return;
    const { data } = await sb.rpc("pause_entrer");
    if(!data || !data.ok){
      journal(data && data.err==="mort" ? "Impossible : ton personnage est mort." : "Mise en pause impossible.","alerte");
      return;
    }
    await _syncPause(); journal("Personnage mis en pause.","alerte");
    if(typeof majEcranPause==="function") majEcranPause();
  } else {
    const { data } = await sb.rpc("pause_sortir");
    if(!data || !data.ok){
      const r = (data && data.reste_min_ms) || 0;
      journal(`Reprise impossible avant ${_pfmtJours(r)} (pause minimale ${_pMinJ()} j).`,"alerte");
      return;
    }
    await _syncPause();
    // Le serveur vient de décaler les dates des lots et des offres (dégel).
    // Sans cette resynchro immédiate, majUsure travaillerait sur des dates
    // périmées et annoncerait des pertes fantômes jusqu'au prochain rechargement.
    if(typeof chargerStocksServeur==="function") await chargerStocksServeur();
    if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
    journal("Personnage réactivé.","gain");
    if(typeof majEcranPause==="function") majEcranPause();
    if(typeof afficher==="function") afficher();
  }
  if(typeof sauvegarder==="function") sauvegarder(); if(typeof afficher==="function") afficher(); majParametres();
}

/* ---------- Faction ---------- */
function peutChangerFaction(){
  if(!_facEtat) return { ok:false, raison:"Lecture de l'état…" };
  if(_facEtat.bloque) return { ok:false, raison:"Changements de faction temporairement bloqués (équilibrage des populations). Ils rouvriront quand il y aura assez de joueurs." };
  if(_facEtat.verrou){
    const reste = new Date(_facEtat.prochain).getTime() - Date.now();
    return { ok:false, raison:`Prochain changement possible dans ${_pfmtJours(reste)}.` };
  }
  return { ok:true };
}
async function changerFaction(fid){
  const p=peutChangerFaction(); if(!p.ok){ journal(p.raison,"alerte"); return; }
  const f=(typeof FACTIONS!=="undefined")?FACTIONS.find(x=>x.id===fid):null;
  if(!f || f.id===etat.faction) return;
  if(!confirm(`Rejoindre ${f.nom} ? Tu déménages dans sa ville. Prochain changement possible seulement dans ${_facJours()} jours.`)) return;

  const { data, error } = await sb.rpc("changer_faction", { p_faction: f.id });
  if(error){ journal("Échec : "+error.message,"alerte"); return; }
  if(!data || !data.ok){
    const err = data && data.err;
    if(err==="bloque")               journal("Les changements de faction sont bloqués pour l'instant.","alerte");
    else if(err==="verrou")          journal(`Prochain changement possible le ${new Date(data.prochain).toLocaleString()}.`,"alerte");
    else if(err==="faction_inconnue") journal("Faction inconnue.","alerte");
    else if(err==="deja")            journal("Tu appartiens déjà à cette faction.","alerte");
    /* ⚠ v0.93 — CHACUN DE CES DEUX REFUS A UNE PORTE DE SORTIE, et le message
       doit la nommer. Un « Changement refusé » sec devant un Régent qui veut
       partir, c'est un joueur qui croit à un bug et qui écrit au support. */
    else if(err==="regent")          journal("Tu es Régent : transmets d'abord ton mandat (Centre → Gouvernement) avant de changer de faction.","alerte");
    else if(err==="candidat")        journal("Tu es candidat à l'élection en cours : retire d'abord ta candidature avant de changer de faction.","alerte");
    else journal("Changement refusé.","alerte");
    await chargerFactionEtat(1);
    return;
  }

  // La destination vient du serveur (table `villes`), pas de posDefaut().
  /* ⚠ v0.92 — AVANT d'écrire la nouvelle faction : `aptBranche()` lit la
     faction COURANTE. Placé après, ce remboursement rendrait les PA de la
     branche d'ARRIVÉE — des points jamais dépensés. */
  const paRendus = (typeof aptRembourserFaction==="function") ? (aptRembourserFaction()||0) : 0;
  etat.faction=f.id;
  if(typeof data.x==="number" && typeof data.y==="number") etat.pos={x:data.x, y:data.y};
  journal(`Tu as rejoint ${f.nom}.`+(paRendus>0?` Les ${paRendus} PA de ta branche d'origine te sont rendus.`:""),"gain");
  if(typeof sauvegarder==="function") sauvegarder();
  /* ⚠ PIEGE N°11, TROISIEME OCCURRENCE. Le changement de faction DEPLACE le
     joueur (ligne au-dessus : `etat.pos` reçoit les coordonnées de sa nouvelle
     cité, lues dans `villes`). `afficher()` redessine, mais ne recalcule pas le
     LIEU : le hub restait celui de l'ancienne cité jusqu'à la première action.
     `majApresDeplacement()` est le point d'entrée unique (majHub + majOrbite +
     afficher) — même correctif que `mort.js` en v0.92.
     ⚠ CE FICHIER EST LE SEUL DU PROJET EN CRLF : conserver les fins de ligne. */
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  else if(typeof afficher==="function") afficher();
  await chargerFactionEtat(1);
}

/* ---------- Compte / apparence ---------- */
function sauverEmail(){
  const el=document.querySelector("#param-email"); if(!el) return;
  etat.email=(el.value||"").trim();
  journal("E-mail enregistré (local pour l'instant — il sera rattaché à ton compte serveur).","gain");
  if(typeof sauvegarder==="function") sauvegarder();
}
/* Changement de mot de passe.
   ⚠ Supabase n'exige PAS l'ancien mot de passe pour updateUser({password}) :
   une session ouverte sur un poste partagé suffirait à verrouiller le compte.
   On le re-vérifie donc nous-mêmes via signInWithPassword avant d'accepter
   (même utilisateur, donc la session est simplement renouvelée). */
let _mdpOuvert = false;
function basculerMdp(){ _mdpOuvert = !_mdpOuvert; majParametres();
  if(_mdpOuvert){ const f=document.querySelector("#param-mdp-actuel"); if(f) f.focus(); } }

async function changerMotDePasse(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible.","alerte"); return; }
  const z=document.querySelector("#parametres-vue"); if(!z) return;
  const actuel = (z.querySelector("#param-mdp-actuel")||{}).value || "";
  const neuf   = (z.querySelector("#param-mdp-neuf")||{}).value   || "";
  const conf   = (z.querySelector("#param-mdp-conf")||{}).value   || "";

  if(!actuel || !neuf){ journal("Remplis les trois champs.","alerte"); return; }
  if(neuf.length < 8){ journal("Le nouveau mot de passe doit faire au moins 8 caractères.","alerte"); return; }
  if(neuf !== conf){ journal("Les deux nouveaux mots de passe ne correspondent pas.","alerte"); return; }
  if(neuf === actuel){ journal("Le nouveau mot de passe est identique à l'ancien.","alerte"); return; }

  const btn = z.querySelector("#param-mdp-valider"); if(btn){ btn.disabled=true; btn.textContent="Vérification…"; }
  try{
    const { data:u } = await sb.auth.getUser();
    const email = u && u.user ? u.user.email : null;
    if(!email){ journal("Session introuvable — reconnecte-toi.","alerte"); return; }

    const { error:eVerif } = await sb.auth.signInWithPassword({ email, password: actuel });
    if(eVerif){ journal("Mot de passe actuel incorrect.","alerte"); return; }

    const { error:eMaj } = await sb.auth.updateUser({ password: neuf });
    if(eMaj){ journal("Changement refusé : "+eMaj.message,"alerte"); return; }

    _mdpOuvert = false;
    journal("Mot de passe modifié.","gain");
  } finally {
    if(btn){ btn.disabled=false; btn.textContent="Valider"; }
    majParametres();
  }
}

async function modifierApparence(){
  if(typeof ouvrirAvatar!=="function"){ journal("Éditeur d'apparence indisponible.","alerte"); return; }
  await ouvrirAvatar();          // c'est lui qui revérifie le verrou côté serveur
  await chargerApparenceEtat(1); // et qui a pu débiter : on rafraîchit le décompte
}

/* ---------- Rendu ---------- */
let _paramStyleMonte=false;
function _paramStyle(){
  if(_paramStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    .param-inline{ display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    .param-inline select, .param-inline input{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:7px 9px; font-family:inherit; }
    .param-inline input{ min-width:170px; }
    .param-mdp-form{ display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .param-mdp-form input{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:7px 9px; font-family:inherit; min-width:170px; flex:1 1 170px; }`;
  document.head.appendChild(st); _paramStyleMonte=true;
}
function majParametres(){
  const z=document.querySelector("#parametres-vue"); if(!z) return;
  _paramStyle();
  // Pause
  let pauseP, pauseBtn;
  if(etat.enPause){
    /* v0.95 — restes lus au SERVEUR (pause_etat, via _syncPause) ; le calcul
       local ne sert plus que de repli avant la première synchro. */
    const reste   = (typeof etat._pauseResteMin==="number") ? etat._pauseResteMin : _pMinJ()*_pjm()-enPauseDepuis();
    const restMax = (typeof etat._pauseResteMax==="number") ? etat._pauseResteMax : _pMaxJ()*_pjm()-enPauseDepuis();
    pauseP=`En pause depuis ${_pfmtJours(enPauseDepuis())}. Sortie automatique dans ${_pfmtJours(restMax)}.`;
    pauseBtn=`<button id="param-pause"${reste>0?" disabled":""}>${reste>0?`Reprendre — dans ${_pfmtJours(reste)}`:"Reprendre"}</button>`;
  } else {
    pauseP=`Gèle toutes les actions. Minimum ${_pMinJ()} j, maximum ${_pMaxJ()} j (sortie auto, puis déclin).`;
    pauseBtn=`<button id="param-pause">Mettre en pause</button>`;
  }
  // Faction — état serveur (chargé une fois, puis mis en cache)
  if(!_facEtat) chargerFactionEtat();
  const pf=peutChangerFaction();
  const fOpts=(typeof FACTIONS!=="undefined"?FACTIONS:[]).filter(f=>f.id!==etat.faction).map(f=>`<option value="${f.id}">${f.nom}</option>`).join("");
  const factionCtrl = pf.ok
    ? `<span class="param-inline"><select id="param-faction-sel">${fOpts}</select><button id="param-faction-btn">Changer</button></span>`
    : `<button disabled>Indisponible</button>`;
  const factionP = pf.ok ? `Déménagement inclus. Ensuite bloqué ${_facJours()} j.` : pf.raison;
  // Apparence — état serveur (chargé une fois, puis mis en cache)
  if(!_appEtat) chargerApparenceEtat();
  const ae = _appEtat;
  let appP, appBtn;
  if(!ae){
    appP = "Lecture de l'état…";
    appBtn = `<button disabled>Personnaliser</button>`;
  } else if(ae.gratuit){
    appP = "Premier choix gratuit. Ton genre sera ensuite figé à vie et l'avatar verrouillé 6 mois.";
    appBtn = `<button id="param-apparence">Personnaliser</button>`;
  } else if(ae.verrou){
    const reste = new Date(ae.prochain).getTime() - Date.now();
    appP = `Verrouillé — prochain changement dans ${_pfmtJours(reste)}. Il coûtera ${ae.cout} ₡.`;
    appBtn = `<button disabled title="Verrouillé jusqu'au ${new Date(ae.prochain).toLocaleString()}">Personnaliser</button>`;
  } else if((ae.credits|0) < (ae.cout|0)){
    appP = `Changement possible, mais il coûte ${ae.cout} ₡ et tu en as ${ae.credits}.`;
    appBtn = `<button disabled title="Crédits insuffisants">Personnaliser</button>`;
  } else {
    appP = `Changement possible : ${ae.cout} ₡, puis verrouillé 6 mois. Le genre reste figé.`;
    appBtn = `<button id="param-apparence">Personnaliser</button>`;
  }

  // Mot de passe
  const mdpP = _mdpOuvert ? "Saisis ton mot de passe actuel, puis le nouveau (8 caractères minimum)."
                          : "Modifiable à tout moment. L'ancien mot de passe est redemandé.";
  const mdpCtrl = `<button id="param-mdp">${_mdpOuvert?"Annuler":"Changer"}</button>`;
  const mdpForm = _mdpOuvert ? `<div class="reglage param-mdp-form">
      <input id="param-mdp-actuel" type="password" autocomplete="current-password" placeholder="Mot de passe actuel">
      <input id="param-mdp-neuf"   type="password" autocomplete="new-password"     placeholder="Nouveau mot de passe">
      <input id="param-mdp-conf"   type="password" autocomplete="new-password"     placeholder="Confirmer">
      <button id="param-mdp-valider">Valider</button>
    </div>` : "";

  z.innerHTML=`
    <div class="reglage"><div><b>Personnage</b><p>${pauseP}</p></div>${pauseBtn}</div>
    <div class="reglage"><div><b>Changer de faction</b><p>${factionP}</p></div>${factionCtrl}</div>
    <div class="reglage"><div><b>Apparence</b><p>${appP}</p></div>${appBtn}</div>
    <div class="reglage"><div><b>E-mail d'inscription</b><p>Rattaché à ton compte (serveur à venir).</p></div><span class="param-inline"><input id="param-email" type="email" placeholder="ton@email" value="${etat.email||""}"><button id="param-email-btn">Enregistrer</button></span></div>
    <div class="reglage"><div><b>Mot de passe</b><p>${mdpP}</p></div>${mdpCtrl}</div>
    ${mdpForm}`;

  const bp=z.querySelector("#param-pause"); if(bp) bp.addEventListener("click", basculerPause);
  const bf=z.querySelector("#param-faction-btn"); if(bf) bf.addEventListener("click", ()=>{ const s=z.querySelector("#param-faction-sel"); if(s) changerFaction(s.value); });
  const be=z.querySelector("#param-email-btn"); if(be) be.addEventListener("click", sauverEmail);
  const ba=z.querySelector("#param-apparence"); if(ba) ba.addEventListener("click", modifierApparence);
  const bm=z.querySelector("#param-mdp"); if(bm) bm.addEventListener("click", basculerMdp);
  const bmv=z.querySelector("#param-mdp-valider"); if(bmv) bmv.addEventListener("click", changerMotDePasse);
  const cf=z.querySelector("#param-mdp-conf"); if(cf) cf.addEventListener("keydown", e=>{ if(e.key==="Enter") changerMotDePasse(); });
}
