/* ===========================================================
   DEV-CONSOLE — Console de développement / modération.
   Réservée à toi (et plus tard aux modérateurs). NON destinée aux joueurs.

   ⚠️ SÉCURITÉ : côté client, RIEN n'est réellement inaccessible (un joueur
   déterminé peut lire le JS ou le localStorage). Ce mot de passe + raccourci
   ne font que DISSUADER. La vraie protection viendra du BACKEND : ne servir /
   n'activer ce fichier que pour les comptes admin (vérif côté serveur).

   Ouverture : Ctrl + Shift + D  →  mot de passe.
   =========================================================== */
const DEV_PASS = "silene-admin";     // ← À CHANGER (et à déplacer côté serveur en prod).
let _devAuth = false, _devMonte = false;

/* ---------- Accès ---------- */
window.addEventListener("keydown", e => {
  if(e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")){ e.preventDefault(); ouvrirDev(); }
});
function ouvrirDev(){
  if(!_devAuth){
    const p = prompt("Console dev — mot de passe :");
    if(p !== DEV_PASS){ if(p !== null) alert("Accès refusé."); return; }
    _devAuth = true;
  }
  monterDev();
  document.querySelector("#dev-modale").hidden = false;
  majDev();
}
function fermerDev(){ const m=document.querySelector("#dev-modale"); if(m) m.hidden = true; }

/* ---------- Actions dev ---------- */
function devDonnerCredits(n){ n=parseInt(n,10)||0; if(!n) return; etat.credits += n; journal(`[DEV] ${n>0?"+":""}${n} ₡.`,"gain"); sauvegarder(); afficher(); majDev(); }
function devDonnerObjet(id, qte){ qte=parseInt(qte,10)||0; if(!id||qte<=0) return; if(!etat.sac[id]) etat.sacOrdre.push(id); etat.sac[id]=(etat.sac[id]||0)+qte; journal(`[DEV] +${qte} ${item(id).nom} (donné, hors limite de sac).`,"gain"); sauvegarder(); afficher(); majDev(); }
function devPause(){ etat.enPause = !etat.enPause; journal(`[DEV] personnage ${etat.enPause?"mis en pause":"réactivé"}.`,"alerte"); sauvegarder(); afficher(); majDev(); }

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
    </div>
    <div class="dev-actions">
      <button class="mini" id="dev-pause">${etat.enPause?"Réactiver":"Mettre en pause"}</button>
      <button class="mini" id="dev-imperso" disabled title="Nécessite le backend multijoueur">Entrer dans le compte</button>
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
    const bp=r.querySelector("#dev-pause"); if(bp) bp.addEventListener("click", devPause);
  }
  const c = document.querySelector("#dev-cadeaux");
  if(c){
    const opts = TOUS_ITEMS.slice().sort((a,b)=>a.nom.localeCompare(b.nom)).map(it=>`<option value="${it.id}">${it.nom}</option>`).join("");
    c.innerHTML =
      `<p class="dev-note">Destinataire : <b>Moi (solo)</b>. Offrir à un autre joueur (cadeau/remboursement) nécessitera le backend.</p>
       <div class="dev-bloc"><h4>Crédits</h4><div class="dev-champ"><input id="dev-cred" type="number" value="1000"><button class="mini" id="dev-don-cred">Créditer</button></div></div>
       <div class="dev-bloc"><h4>Objet (tout item du jeu)</h4><div class="dev-champ"><select id="dev-item">${opts}</select><input id="dev-qte" type="number" value="1" min="1" style="max-width:64px"><button class="mini" id="dev-don-item">Donner</button></div><p class="dev-note" style="margin:6px 0 0">Le don ignore la limite du sac (pratique pour tester : Sylve, Biofibre, etc.).</p></div>`;
    c.querySelector("#dev-don-cred").addEventListener("click", ()=>devDonnerCredits(c.querySelector("#dev-cred").value));
    c.querySelector("#dev-don-item").addEventListener("click", ()=>devDonnerObjet(c.querySelector("#dev-item").value, c.querySelector("#dev-qte").value));
  }
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
    .dev-actions{ display:flex; gap:8px; margin-top:12px; }
    #dev-modale .mini{ background:#16233c; border:1px solid #2a3550; color:#dfe7f5; border-radius:8px; padding:7px 12px; font-family:inherit; font-size:12px; cursor:pointer; }
    #dev-modale .mini:disabled{ opacity:.4; cursor:not-allowed; }
    #dev-modale .mini:hover:not(:disabled){ border-color:#ff8a3d; }
  `;
  document.head.appendChild(st);
  const m = document.createElement("div"); m.id="dev-modale"; m.hidden=true;
  m.innerHTML = `<div class="dev-cadre">
    <div class="dev-tete"><b>CONSOLE DEV</b><span class="dev-warn">accès restreint · non sécurisé côté client</span><button class="mini" id="dev-fermer">Fermer</button></div>
    <div class="dev-onglets"><button class="dev-onglet actif" data-dev="recherche">Recherche</button><button class="dev-onglet" data-dev="cadeaux">Cadeaux</button></div>
    <div class="dev-vue" id="dev-recherche"></div>
    <div class="dev-vue" id="dev-cadeaux" hidden></div>
  </div>`;
  document.body.appendChild(m);
  m.querySelector("#dev-fermer").addEventListener("click", fermerDev);
  m.addEventListener("click", e=>{ if(e.target.id==="dev-modale") fermerDev(); });
  m.querySelectorAll(".dev-onglet").forEach(b=>b.addEventListener("click",()=>{
    m.querySelectorAll(".dev-onglet").forEach(x=>x.classList.toggle("actif",x===b));
    m.querySelector("#dev-recherche").hidden = b.dataset.dev!=="recherche";
    m.querySelector("#dev-cadeaux").hidden = b.dataset.dev!=="cadeaux";
  }));
  _devMonte = true;
}
