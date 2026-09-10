/* ===========================================================
   NAVIGATION — Navigation entre hubs et inscription du personnage.
   =========================================================== */

function montrerHub(h){
  document.querySelectorAll(".hub-vue").forEach(el => el.hidden = (el.id !== "hub-"+h));
  document.querySelectorAll(".hub-lien").forEach(b => b.classList.toggle("actif", b.dataset.hub===h));
}
function changerHub(h){ montrerHub(h); if(h==="terrain") majTerrain(); if(h==="centre") majCentre(); if(h==="quete" && typeof majQueteHub==="function") majQueteHub(); if(h==="marche" && typeof renderMarche==="function") renderMarche(); if(h==="poste" && typeof majPoste==="function") majPoste(); if(h==="boutique" && typeof renderBoutique==="function") renderBoutique(); if(h==="voler" && typeof majVoler==="function") majVoler(); }
// Affiche les destinations selon l'endroit (temps réel). Terrain : chez soi seulement.
function majHub(){
  const nav=document.querySelector("#hub-nav"); if(!nav) return;
  const ville=villeActuelle(); const chezSoi = ville===etat.faction;
  const dispo={ terrain:chezSoi, inn:(!!ville && !chezSoi), centre:!!ville, poste:!!ville, marche:!!ville, boutique:!!ville, voler:!!ville,
    quete:(typeof queteActive==="function" && !!queteActive()) || chezSoi };
  document.querySelectorAll(".hub-lien").forEach(b=>{ b.style.display = dispo[b.dataset.hub] ? "" : "none"; });
  const actif=document.querySelector(".hub-lien.actif"); const cur=actif?actif.dataset.hub:null;
  if(!cur || !dispo[cur]){
    const prem=["terrain","inn","centre","marche","boutique","quete","poste","voler"].find(h=>dispo[h]);
    if(prem) changerHub(prem); else montrerHub("vide");
  } else {
    changerHub(cur);   // rafraîchir le contenu de l'onglet courant (ex. Le Centre après un déplacement)
  }
}
function montrerBienvenue(){ const m=document.querySelector("#modale-bienvenue"); if(m) m.hidden=false; }
function fermerBienvenue(){ const m=document.querySelector("#modale-bienvenue"); if(m) m.hidden=true; etat.bienvenueVue=true; if(typeof sauvegarder==="function") sauvegarder(); }
/* ---------- Auth (Supabase) ---------- */
let _authMode = "inscription";
let _entreeStyleMonte=false;
function _entreeStyle(){
  if(_entreeStyleMonte) return; _entreeStyleMonte=true;
  const st=document.createElement("style");
  st.textContent=`
    #page-entree{ position:fixed; inset:0; z-index:40; display:grid; place-items:center; padding:24px; overflow:auto;
      background:radial-gradient(circle at 30% 15%, #16324a, #0a1428 62%), linear-gradient(160deg,#0a1428,#0a0f1e); }
    #page-entree[hidden]{ display:none; }
    .ent-wrap{ max-width:640px; text-align:center; }
    .ent-titre{ font-size:clamp(40px,9vw,64px); margin:0; color:var(--orange-hi,#ffb060); letter-spacing:2px; text-shadow:0 0 34px rgba(255,138,61,.45); }
    .ent-sous{ font-size:clamp(15px,2.6vw,19px); color:var(--bleu,#5aa8e6); margin:10px 0 26px; font-style:italic; }
    .ent-pitch{ font-size:16px; line-height:1.75; color:var(--texte,#dfe8f2); margin:0 auto 32px; max-width:560px; }
    .ent-boutons{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
    .ent-boutons .valider{ min-width:170px; font-family:"Exo 2",sans-serif; font-weight:700; font-size:16px; letter-spacing:.04em; color:#06110f; background:linear-gradient(135deg,var(--orange,#ff8a3d),var(--bleu,#5aa8e6)); border:none; border-radius:var(--r-s,10px); padding:13px 20px; cursor:pointer; }
    .ent-boutons .valider:hover{ filter:brightness(1.08); }
  `;
  document.head.appendChild(st);
}
function ouvrirEntree(){
  _entreeStyle();
  let m=document.querySelector("#page-entree");
  if(!m){
    m=document.createElement("div"); m.id="page-entree"; document.body.appendChild(m);
    m.innerHTML=`<div class="ent-wrap">
      <h1 class="ent-titre">Nova Epic</h1>
      <p class="ent-sous">Survivre ensemble sous l'œil du Protocole</p>
      <p class="ent-pitch">Maar, planète hostile née d'un ancien cratère. Cinq factions s'y partagent des terres rudes, entre mines, dômes et machines rafistolées. Mais quelque chose veille au-dessus de Maar — et le Protocole n'oublie jamais.</p>
      <div class="ent-boutons"><button class="valider" id="ent-connexion">Connexion</button><button class="valider" id="ent-inscription">Inscription</button></div>
    </div>`;
    m.querySelector("#ent-connexion").addEventListener("click",()=>{ _authMode="connexion"; ouvrirAuth(); });
    m.querySelector("#ent-inscription").addEventListener("click",()=>{ _authMode="inscription"; ouvrirAuth(); });
  }
  m.hidden=false;
}
function fermerEntree(){ const m=document.querySelector("#page-entree"); if(m) m.hidden=true; }
function ouvrirAuth(){ const m=document.querySelector("#modale-auth"); if(!m) return; m.hidden=false; const tabs=m.querySelector(".auth-tabs"); if(tabs) tabs.style.display="none"; basculerAuth(_authMode);
  const el=document.querySelector(_authMode==="inscription"?"#auth-pseudo":"#auth-email"); if(el) el.focus(); }
function ouvrirInscription(){ ouvrirAuth(); }                 // compat
function fermerAuth(){ const m=document.querySelector("#modale-auth"); if(m) m.hidden=true; }
function authInfo(t){ const e=document.querySelector("#auth-info"); if(e) e.textContent=t; }
function authErreur(t){ const e=document.querySelector("#auth-erreur"); if(!e) return; if(t){ e.textContent=t; e.hidden=false; } else e.hidden=true; }
function basculerAuth(mode){
  _authMode=mode; authErreur("");
  const ps=document.querySelector("#auth-pseudo"); if(ps) ps.hidden=(mode!=="inscription");
  const m2=document.querySelector("#auth-mdp2"); if(m2) m2.hidden=(mode!=="inscription");
  const bt=document.querySelector("#auth-valider"); if(bt) bt.textContent = mode==="inscription" ? "Rejoindre Silène" : "Se connecter";
  const tc=document.querySelector("#auth-tab-c"), ti=document.querySelector("#auth-tab-i");
  [tc,ti].forEach(b=>{ if(b){ b.style.borderColor=""; b.style.color=""; } });
  const act = mode==="connexion" ? tc : ti;
  if(act){ act.style.borderColor="var(--orange,#ff8a3d)"; act.style.color="var(--orange-hi,#ffb060)"; }
  authInfo(mode==="inscription"
    ? "Crée ton compte pour rejoindre Silène. Ton pseudo sera définitif ; ta faction est attribuée au hasard."
    : "Reconnecte-toi à ton personnage.");
}
function validerAuth(){ if(_authMode==="inscription") inscrire(); else connecter(); }
function _authMsg(e){ const m=(e&&e.message)||"", l=m.toLowerCase();
  if(l.includes("already registered")||l.includes("already been")) return "Cet e-mail a déjà un compte — connecte-toi.";
  if(l.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if(l.includes("database error")) return "Ce pseudo est peut-être déjà pris. Essaies-en un autre.";
  if(l.includes("password")) return "Mot de passe trop court (6 caractères minimum).";
  if(l.includes("email")) return "E-mail invalide.";
  return m || "Une erreur est survenue.";
}
async function _attribuerFaction(){
  const ids = FACTIONS.map(f=>f.id);
  if(typeof SERVEUR_DISPO!=="undefined" && SERVEUR_DISPO){
    try{ const { data, error } = await sb.rpc("faction_moins_peuplee", { factions: ids });
      if(!error && data && ids.includes(data)) return FACTIONS.find(f=>f.id===data);
    }catch(e){ console.warn("[serveur] faction:", e.message); }
  }
  return FACTIONS[alea(0, FACTIONS.length-1)];      // repli : au hasard
}
async function inscrire(){
  if(!SERVEUR_DISPO){ authErreur("Serveur indisponible."); return; }
  const pseudo=(document.querySelector("#auth-pseudo").value||"").trim();
  const email=(document.querySelector("#auth-email").value||"").trim();
  const mdp=document.querySelector("#auth-mdp").value||"";
  if(!pseudo){ authErreur("Choisis un pseudo."); return; }
  if(!email || !mdp){ authErreur("E-mail et mot de passe requis."); return; }
  if(mdp.length<6){ authErreur("Mot de passe : 6 caractères minimum."); return; }
  const mdp2=(document.querySelector("#auth-mdp2")||{}).value||"";
  if(mdp!==mdp2){ authErreur("Les mots de passe ne correspondent pas."); return; }
  authInfo("Création du compte…"); authErreur("");
  const { data, error } = await sInscrire(email, mdp, pseudo);
  if(error){ authErreur(_authMsg(error)); return; }
  if(!data || !data.session){ const r = await seConnecter(email, mdp); if(r && r.error){ authErreur(_authMsg(r.error)); return; } }   // signUp n'établit pas toujours la session → on se connecte
  etat = nouvelEtat();
  const f=await _attribuerFaction();
  etat.nom=pseudo; etat.faction=f.id; etat.inscrit=true; etat.creeLe=Date.now(); etat.pos=posDefaut();
  for(let i=0;i<6;i++){ if(await sessionActuelle()) break; await new Promise(r=>setTimeout(r,200)); }   // attendre que la session soit prête
  // ⚠ `faction` ne part plus dans sauverSurServeur() : le trigger la protège dès
  // qu'elle a une valeur. L'attribution initiale passe par cet update ciblé, seul
  // cas autorisé (old.faction IS NULL). Sans lui, le compte resterait sans faction.
  if(typeof _premiereFaction==="function") await _premiereFaction(f.id);
  await sauverSurServeur();
  fermerAuth(); fermerEntree(); afficher();
  journal(`Bienvenue, ${pseudo}. Faction attribuée : ${f.nom}.`,"gain");
  // Étape OBLIGATOIRE : le genre est figé à vie, il doit être choisi sciemment
  // et non hérité d'un défaut. L'éditeur ne se ferme que sur validation serveur.
  if(typeof ouvrirAvatar==="function") await ouvrirAvatar({obligatoire:true});
  if(typeof syncApresConnexion==="function") await syncApresConnexion();   // même raison qu'à la connexion
  montrerBienvenue();
}
async function connecter(){
  if(!SERVEUR_DISPO){ authErreur("Serveur indisponible."); return; }
  const email=(document.querySelector("#auth-email").value||"").trim();
  const mdp=document.querySelector("#auth-mdp").value||"";
  if(!email || !mdp){ authErreur("E-mail et mot de passe requis."); return; }
  authInfo("Connexion…"); authErreur("");
  const { error } = await seConnecter(email, mdp);
  if(error){ authErreur(_authMsg(error)); return; }
  const prof = await chargerDepuisServeur();
  if(prof && prof.donnees && prof.donnees.inscrit){ etat = hydraterEtat(prof.donnees); if(typeof prof.credits==="number"){ etat.credits=prof.credits; if(typeof initCredits==="function") initCredits(prof.credits); } if(typeof prof.reputation==="number") etat.reputation=prof.reputation; etat.roleAdmin=prof.role_admin||null; etat.cercles=prof.cercles||{}; if(prof.faction) etat.faction=prof.faction; /* COLONNE : cf. bootstrap.js */ }
  else { etat = nouvelEtat(); const f=await _attribuerFaction(); etat.nom=(prof&&prof.nom)||etat.nom||"Opérateur"; etat.faction=f.id; etat.inscrit=true; etat.creeLe=Date.now(); etat.pos=posDefaut(); if(typeof _premiereFaction==="function") await _premiereFaction(f.id); await sauverSurServeur(); }
  if(prof && prof.avatar) etat.avatar = prof.avatar;   /* l'avatar vient de la COLONNE, plus de donnees */
  fermerAuth(); fermerEntree(); afficher();
  journal(`Bon retour, ${etat.nom}.`,"gain");
  /* ⚠ Sans ceci, le sac restait vide et les jauges aux défauts client jusqu'au
     prochain rechargement de page : la synchronisation Phase 4 ne tournait
     qu'au démarrage (bootstrap.js), pas après une connexion. */
  if(typeof syncApresConnexion==="function") await syncApresConnexion();
  // Rattrapage : compte créé avant cette règle, ou inscription interrompue
  // avant la validation de l'avatar (rechargement de page, onglet fermé).
  if(!etat.avatar && typeof ouvrirAvatar==="function") await ouvrirAvatar({obligatoire:true});
}
async function deconnexion(){
  if(typeof _pauseConfirm === "function"){
    const ok = await _pauseConfirm("Se déconnecter ?", [
      "Ta partie est <b>sauvegardée sur le serveur</b>.",
      "Tu retrouveras ton personnage exactement où tu le laisses."
    ], "Se déconnecter");
    if(!ok) return;
  } else if(!confirm("Se déconnecter ? Ta partie est sauvegardée sur le serveur.")) return;
  await sauverSurServeur(); await seDeconnecter(); location.reload();
}

/* ---------- Construction dynamique ---------- */
