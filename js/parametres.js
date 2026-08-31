/* ===========================================================
   PARAMÈTRES — faction (cooldown + blocage admin), pause (min 3 j / max 60 j),
   compte (e-mail, mot de passe), apparence (cooldown 6 mois + crédits).
   Note : la baisse quotidienne de santé/moral « à minuit » (déclin après pause)
   reste À FAIRE — impossible tant que JOUR_MS = 20 s (debug).
   =========================================================== */
const FACTION_COOLDOWN_J   = 30;    // jours entre deux changements de faction
const PAUSE_MIN_J          = 3;     // pause minimale (anti-abus anti-vol)
const PAUSE_MAX_J          = 60;    // pause maximale (sortie auto ensuite)
const APPARENCE_COOLDOWN_J = 180;   // 6 mois
const APPARENCE_COUT       = 500;   // crédits (placeholder, ajustable)

function _pjm(){ return (typeof JOUR_MS!=="undefined") ? JOUR_MS : 86400000; }
function _pfmtJours(ms){ ms=Math.max(0,ms); const j=ms/_pjm(); if(j>=1) return `${Math.floor(j)} j`; const h=Math.ceil(j*24); return `${h} h`; }
function _factionBloquee(){ return etat.factionChangeBloque !== false; }   // bloqué par défaut (vieilles saves incluses)

/* ---------- Pause ---------- */
function enPauseDepuis(){ return etat.enPause ? Date.now()-(etat.pauseLe||0) : 0; }
function verifPauseAuto(){
  if(etat.enPause && enPauseDepuis() >= PAUSE_MAX_J*_pjm()){
    etat.enPause=false; etat.pauseLe=0;
    journal(`Pause maximale (${PAUSE_MAX_J} j) atteinte — ton personnage sort de pause de lui-même. Sans soins, sa santé et son moral vont décliner.`,"alerte");
    if(typeof sauvegarder==="function") sauvegarder();
  }
}
function basculerPause(){
  if(!etat.enPause){
    if(!confirm(`Mettre en pause ?\n\n• Minimum ${PAUSE_MIN_J} jours (impossible de reprendre avant).\n• Maximum ${PAUSE_MAX_J} jours (sortie automatique ensuite).\n• Aucune action possible pendant la pause.`)) return;
    etat.enPause=true; etat.pauseLe=Date.now(); journal("Personnage mis en pause.","alerte");
  } else {
    const reste = PAUSE_MIN_J*_pjm() - enPauseDepuis();
    if(reste>0){ journal(`Reprise impossible avant ${_pfmtJours(reste)} (pause minimale ${PAUSE_MIN_J} j).`,"alerte"); return; }
    etat.enPause=false; etat.pauseLe=0; journal("Personnage réactivé.","gain");
  }
  if(typeof sauvegarder==="function") sauvegarder(); if(typeof afficher==="function") afficher(); majParametres();
}

/* ---------- Faction ---------- */
function peutChangerFaction(){
  if(_factionBloquee()) return { ok:false, raison:"Changements de faction temporairement bloqués (équilibrage des populations). Ils rouvriront quand il y aura assez de joueurs." };
  const reste = (etat.factionLe||0)+FACTION_COOLDOWN_J*_pjm()-Date.now();
  if(reste>0) return { ok:false, raison:`Prochain changement possible dans ${_pfmtJours(reste)}.` };
  return { ok:true };
}
function changerFaction(fid){
  const p=peutChangerFaction(); if(!p.ok){ journal(p.raison,"alerte"); return; }
  const f=(typeof FACTIONS!=="undefined")?FACTIONS.find(x=>x.id===fid):null;
  if(!f || f.id===etat.faction) return;
  if(!confirm(`Rejoindre ${f.nom} ? Tu déménages dans sa ville. Prochain changement possible seulement dans ${FACTION_COOLDOWN_J} jours.`)) return;
  etat.faction=f.id; etat.factionLe=Date.now(); if(typeof posDefaut==="function") etat.pos=posDefaut();
  journal(`Tu as rejoint ${f.nom}.`,"gain");
  if(typeof sauvegarder==="function") sauvegarder(); if(typeof afficher==="function") afficher(); majParametres();
}

/* ---------- Compte / apparence ---------- */
function sauverEmail(){
  const el=document.querySelector("#param-email"); if(!el) return;
  etat.email=(el.value||"").trim();
  journal("E-mail enregistré (local pour l'instant — il sera rattaché à ton compte serveur).","gain");
  if(typeof sauvegarder==="function") sauvegarder();
}
function modifierApparence(){
  if(typeof ouvrirAvatar==="function") ouvrirAvatar();
  else journal("Éditeur d'apparence indisponible.","alerte");
}

/* ---------- Rendu ---------- */
let _paramStyleMonte=false;
function _paramStyle(){
  if(_paramStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    .param-inline{ display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    .param-inline select, .param-inline input{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:7px 9px; font-family:inherit; }
    .param-inline input{ min-width:170px; }`;
  document.head.appendChild(st); _paramStyleMonte=true;
}
function majParametres(){
  const z=document.querySelector("#parametres-vue"); if(!z) return;
  _paramStyle();
  // Pause
  let pauseP, pauseBtn;
  if(etat.enPause){
    const reste=PAUSE_MIN_J*_pjm()-enPauseDepuis(); const restMax=PAUSE_MAX_J*_pjm()-enPauseDepuis();
    pauseP=`En pause depuis ${_pfmtJours(enPauseDepuis())}. Sortie automatique dans ${_pfmtJours(restMax)}.`;
    pauseBtn=`<button id="param-pause"${reste>0?" disabled":""}>${reste>0?`Reprendre — dans ${_pfmtJours(reste)}`:"Reprendre"}</button>`;
  } else {
    pauseP=`Gèle toutes les actions. Minimum ${PAUSE_MIN_J} j, maximum ${PAUSE_MAX_J} j (sortie auto, puis déclin).`;
    pauseBtn=`<button id="param-pause">Mettre en pause</button>`;
  }
  // Faction
  const pf=peutChangerFaction();
  const fOpts=(typeof FACTIONS!=="undefined"?FACTIONS:[]).filter(f=>f.id!==etat.faction).map(f=>`<option value="${f.id}">${f.nom}</option>`).join("");
  const factionCtrl = pf.ok
    ? `<span class="param-inline"><select id="param-faction-sel">${fOpts}</select><button id="param-faction-btn">Changer</button></span>`
    : `<button disabled>Indisponible</button>`;
  const factionP = pf.ok ? `Déménagement inclus. Ensuite bloqué ${FACTION_COOLDOWN_J} j.` : pf.raison;
  // Apparence
  const appReste=(etat.apparenceLe||0)+APPARENCE_COOLDOWN_J*_pjm()-Date.now();
  const appP=`Change ton avatar : ${APPARENCE_COUT} ₡, une fois tous les 6 mois.`+(appReste>0?` Prochain dans ${_pfmtJours(appReste)}.`:``);

  z.innerHTML=`
    <div class="reglage"><div><b>Personnage</b><p>${pauseP}</p></div>${pauseBtn}</div>
    <div class="reglage"><div><b>Changer de faction</b><p>${factionP}</p></div>${factionCtrl}</div>
    <div class="reglage"><div><b>Apparence</b><p>${appP}</p></div><button id="param-apparence">Personnaliser</button></div>
    <div class="reglage"><div><b>E-mail d'inscription</b><p>Rattaché à ton compte (serveur à venir).</p></div><span class="param-inline"><input id="param-email" type="email" placeholder="ton@email" value="${etat.email||""}"><button id="param-email-btn">Enregistrer</button></span></div>
    <div class="reglage"><div><b>Mot de passe</b><p>Sera géré par ton compte serveur (page d'inscription).</p></div><button disabled title="Nécessite le compte serveur">À venir</button></div>`;

  const bp=z.querySelector("#param-pause"); if(bp) bp.addEventListener("click", basculerPause);
  const bf=z.querySelector("#param-faction-btn"); if(bf) bf.addEventListener("click", ()=>{ const s=z.querySelector("#param-faction-sel"); if(s) changerFaction(s.value); });
  const be=z.querySelector("#param-email-btn"); if(be) be.addEventListener("click", sauverEmail);
  const ba=z.querySelector("#param-apparence"); if(ba) ba.addEventListener("click", modifierApparence);
}
