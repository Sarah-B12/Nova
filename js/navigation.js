/* ===========================================================
   NAVIGATION — Navigation entre hubs et inscription du personnage.
   =========================================================== */

function montrerHub(h){
  // v0.66 : les bulles ne suivent plus le joueur d'un écran à l'autre.
  if(typeof fermerToutesBulles==="function") fermerToutesBulles();
  document.querySelectorAll(".hub-vue").forEach(el => el.hidden = (el.id !== "hub-"+h));
  document.querySelectorAll(".hub-lien").forEach(b => b.classList.toggle("actif", b.dataset.hub===h));
}
/* v1.48 — l'auberge a une image PAR FACTION (images/lieux/auberge_<faction>.png),
   avec repli sur images/lieux/auberge.png (v1.50c, ex-images/inn.png) tant que le fichier n'existe pas. */
function _innBanniere(){
  /* v1.54 — l'image n'est plus SUPPRIMÉE quand un fichier manque (avant : l'image
     par défaut, absente, était retirée de la page au chargement, et celle de la
     faction n'avait plus où s'afficher). Masquée tant que rien ne charge. */
  const img = document.querySelector("#inn-img"); if(!img || typeof etat === "undefined" || !etat.faction) return;
  // v1.69 : au Perchoir (Triptolème), l'auberge a sa propre image.
  // v1.76 : l'auberge de la CITÉ OÙ L'ON EST (et non plus celle de sa faction) ;
  // le Rhizome accepte aussi `auberge_rhizome.png`. Puis le repli commun.
  const ici = (typeof villeActuelle === "function" && villeActuelle()) || etat.faction;
  const essais = (etat.secteur === "ecart") ? ["images/lieux/auberge_perchoir.png"]
               : [`images/lieux/auberge_${ici}.png`, ...(ici === "cultivateurs" ? ["images/lieux/auberge_rhizome.png"] : [])];
  essais.push("images/lieux/auberge.png");
  const voulu = essais[0];
  if(img.dataset.voulu === voulu) return;
  img.dataset.voulu = voulu; let k = 0;
  img.onload  = () => { img.hidden = false; };
  img.onerror = () => { k++; if(k < essais.length) img.src = essais[k]; else img.hidden = true; };
  img.src = voulu;
}
/* v1.54 — bannière de la Boutique : celle du Perchoir (Triptolème) diffère de
   celle de Silène. Masquée tant que le fichier manque (jamais retirée). */
function _boutiqueBanniere(){
  const ban = document.querySelector("#boutique-ban"), img = document.querySelector("#boutique-img"); if(!ban || !img) return;
  const voulu = (typeof etat !== "undefined" && etat && etat.secteur === "ecart") ? "images/lieux/boutique_perchoir.png"
              : (typeof etat !== "undefined" && etat && etat.secteur === "ceres") ? "images/lieux/boutique_nid.png"   // v1.96 : masquée tant qu'elle n'existe pas
              : "images/lieux/boutique.png";
  if(img.dataset.voulu === voulu) return;
  img.dataset.voulu = voulu; ban.hidden = true;
  img.onload = () => { ban.hidden = false; }; img.onerror = () => { ban.hidden = true; };
  img.src = voulu;
}
/* ⚠ v1.88e — `rafraichir` : majHub() redessine l'onglet courant à CHAQUE afficher()
   (crédits, jauges…). Pour le Bar, c'était fatal : le bonneteau et la cuve
   s'ouvraient dans une table aussitôt remplacée — la mise était prise, rien ne se
   jouait (retour de l'autrice). Un rafraîchissement ne redessine donc plus le Bar
   s'il est déjà affiché ; seul un vrai changement d'onglet le reconstruit. */
function changerHub(h, rafraichir){
  /* v2.75 (K240) : quitter la fenêtre du Fléau en plein combat le rompt (défaite). */
  if(h !== "fleau" && !rafraichir && typeof fleauCombatEnCours === "function" && fleauCombatEnCours()) fleauQuitter();
  if(h==="inn") _innBanniere(); if(h==="boutique") _boutiqueBanniere(); montrerHub(h); if(h==="terrain") majTerrain(); if(h==="centre") majCentre(); if(h==="quete" && typeof majQueteHub==="function") majQueteHub(rafraichir);
  if(h==="bar" && typeof majBar==="function"){ const bv=document.querySelector("#bar-vue"); if(!(rafraichir && bv && bv.childElementCount)) majBar(bv); } if(h==="marche" && typeof renderMarche==="function") renderMarche(); if(h==="poste" && typeof majPoste==="function") majPoste(); if(h==="boutique" && typeof renderBoutique==="function") renderBoutique(); if(h==="voler" && typeof majVoler==="function") majVoler(); if(h==="garage" && typeof majGarage==="function") majGarage(); if(h==="gisement" && typeof majGisement==="function") majGisement(); if(h==="arene" && typeof majArene==="function") majArene(); if(h==="fleau" && typeof majFleau==="function") majFleau(rafraichir); if(h==="descente" && typeof majDescente==="function") majDescente(); }
// Affiche les destinations selon l'endroit (temps réel). Terrain : chez soi seulement.
function majHub(){
  const nav=document.querySelector("#hub-nav"); if(!nav) return;
  const ville=villeActuelle(); const chezSoi = ville===etat.faction;
  /* v0.87 — LA BASE DE L'ÉCART réutilise les mêmes hubs, avec sa propre liste :
     ni terrain, ni marché, ni vol. Le Centre y est réduit au gouvernement
     (voir formations.js) : pas de bureaux, pas d'expéditions. */
  const base = (typeof surBase==="function") && surBase();
  /* v0.91 — La Carcasse : un seul service pour l'instant, le garage. La liste
     est là pour grossir — l'arc Q6→Q15 prévoit DEUX quêtes par lieu. */
  const carcasse = (typeof surCarcasse==="function") && surCarcasse();
  const gravier  = (typeof surGravier==="function")  && surGravier();
  const nid      = (typeof surNid==="function")      && surNid();   // v1.96 : Cérès, Le Nid (K93 : carburant, remorquage)
  const fleau    = (typeof surFleau==="function")    && surFleau(); // v2.06 : Cérès, le Fléau (K81 : une attaque par jour)
  const auDessusBraise = (typeof surOrbiteBraise==="function") && surOrbiteBraise();   // v0.98 : La Braise OU Le Suaire
  // v0.99 — l'onglet de descente porte le nom de la planète survolée.
  { const bl=document.querySelector('.hub-lien[data-hub="descente"]'), c=(typeof surfaceCfg==="function"&&typeof surOrbitePlanete==="function")?surfaceCfg(surOrbitePlanete()):null; if(bl && c) bl.textContent=c.nom; }
  const vide = { terrain:false, inn:false, centre:false, poste:false, marche:false, voler:false, boutique:false, quete:false, garage:false, gisement:false, arene:false, descente:false, fleau:false };
  const qEnCours = (typeof queteActive==="function" && !!queteActive());
  /* v2.47 — BOUTIQUE MOBILE (no1, « depuis n'importe où ») : elle manquait à La Braise, en surface (Ancolie),
     à La Carcasse, au Gravier et au Fléau (retour d'un testeur). Partout, désormais, à +10 % hors des villes. */
  const mobile = (typeof aptBoutiquePartout==="function") && aptBoutiquePartout();
  const dispo = auDessusBraise
    ? { ...vide, descente:true, quete:qEnCours, boutique:mobile }
    : (typeof enSurface==="function" && enSurface())
    /* v0.98 : au sol d'une planète, pas de service. v1.87 : en Ancolie, à la station,
       42-U1F donne ses quêtes (lieuPrise:"station") ; au lac gelé, le gisement de Sélénite. */
    ? { ...vide, boutique:mobile, quete:qEnCours || ((typeof aLaStation==="function") && aLaStation()),
        gisement:(typeof surSelenite==="function") && surSelenite(),
        bar:(typeof barStation==="function") && barStation() }   // v1.88 : K55, la buvette de la station
    : carcasse
    ? { ...vide, garage:true, quete:true, boutique:mobile }   // v0.97 : Galm donne les quêtes Q6→
    : gravier
    ? { ...vide, gisement:true, quete:(typeof queteActive==="function" && !!queteActive()), boutique:mobile }
    : nid
    /* v1.96 — Le Nid : la Boutique, réduite au carburant (boutique.js). Le remorquage
       n'a pas d'onglet : c'est le secours (orbite.js) qui y dépose une coque clouée.
       v2.32 — Q32 s'y prend (Aruns et Dagon, K150) ; la Boutique n'ouvre qu'à la fin de Q32 (K155). */
    ? { ...vide, boutique:(typeof nidOuvert==="function") && nidOuvert(),   // v2.32 (K155) : fermée avant la fin de Q32
        quete:qEnCours || (typeof queteProchaine==="function" && !!queteProchaine() && queteProchaine().lieuPrise==="nid") }   // v2.32 : Q32 s'y prend
    : fleau
    ? { ...vide, fleau:true, quete:qEnCours, boutique:mobile }   // v2.06 : le combat du jour et le classement
    : base
    /* v0.92 — L'ARÈNE n'existe qu'au Perchoir. `arene_adversaires()` refuse de
       toute façon ceux qui n'ont pas fini Q5, mais l'onglet ne doit pas
       s'afficher ailleurs : un service visible et vide est pire qu'absent. */
    /* v0.97 — plus de quêtes AU Perchoir : elles se prennent à La Carcasse. L'onglet
       n'y reste que pour suivre une quête EN COURS. */
    ? { terrain:false, inn:true, centre:true, poste:true, marche:false, voler:false, boutique:true, quete:(typeof queteActive==="function" && !!queteActive()), garage:false, arene:true }
    : { terrain:chezSoi, inn:(!!ville && !chezSoi), centre:!!ville, poste:!!ville, marche:!!ville, voler:!!ville, garage:false, arene:false,
        boutique:(!!ville || (typeof aptBoutiquePartout==="function" && aptBoutiquePartout())),   // Boutique mobile (no1)
        quete:(typeof queteActive==="function" && !!queteActive()) || chezSoi
          /* v1.98 — Asulf donne ses quêtes à La Toundra (K90), à tout le monde. */
          || (ville==="toundra" && typeof queteProchaine==="function" && !!queteProchaine() && queteProchaine().lieuPrise==="toundra") };
  /* v1.61 — H18 : une affaire de mission en cours (groupe, invitation, gain)
     ouvre le lieu Quêtes PARTOUT, pour la suivre loin du comptoir. */
  if(typeof missionsAffaireEnCours==="function" && missionsAffaireEnCours()) dispo.quete = true;
  /* v1.97 (K103, K106) — hors de Silène, l'onglet Voler / Hacker existe partout :
     les poches sur un lieu, le hack n'importe où sur la carte. Il ne s'ouvre jamais
     de lui-même (voir `prem`). */
  const horsS = (typeof horsSilene==="function") && horsSilene();
  if(horsS) dispo.voler = true;
  document.querySelectorAll(".hub-lien").forEach(b=>{ b.style.display = dispo[b.dataset.hub] ? "" : "none"; });
  const actif=document.querySelector(".hub-lien.actif"); const cur=actif?actif.dataset.hub:null;
  if(!cur || !dispo[cur]){
    const prem=["terrain","inn","centre","marche","boutique","quete","bar","poste","voler","garage","gisement","arene","fleau"].find(h=>dispo[h] && (ville || base || nid || h!=="boutique") && !(horsS && h==="voler"));   // en pleine nature : on n'ouvre pas la boutique d'office
    /* ⚠ v0.91 — `montrerHub("vide")` est le vrai filet : si AUCUN onglet n'est
       disponible ici, on n'en laisse surtout pas un périmé affiché. C'est ce
       qui s'est produit avec Le Gisement resté seul après un atterrissage. */
    if(prem) changerHub(prem); else montrerHub("vide");
  } else {
    changerHub(cur, true);   // rafraîchir le contenu de l'onglet courant (ex. Le Centre après un déplacement)
  }
}
function montrerBienvenue(){ const m=document.querySelector("#modale-bienvenue"); if(m) m.hidden=false; }
function fermerBienvenue(){ const m=document.querySelector("#modale-bienvenue"); if(m) m.hidden=true; if(typeof NOVA_CONTROLE !== "undefined" && NOVA_CONTROLE) return; /* v2.21c */ etat.bienvenueVue=true; if(typeof sauvegarder==="function") sauvegarder(); }
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
      <!-- v3.13 (K285, autrice, 18/11) : le texte d'accueil suit le LORE (plus de cratère ; « Maar » n'est connu qu'en Q1 ;
           le joueur est d'ici et ne choisit pas sa faction ; rien de dévoilé). -->
      <p class="ent-pitch">Tu as grandi sur Silène, dans des cités bâties sur ce que d'autres ont laissé derrière eux. Cinq factions y tiennent bon, et la tienne compte sur toi : enrôle-toi pour ses expéditions, ou brigue une place à son gouvernement. Apprends un métier, cultive, commerce, vole s'il le faut, construis ton vaisseau… et découvre ce qui s'est vraiment passé ici. Mais méfie-toi : quelque chose veille sur Silène — et le Protocole n'oublie jamais.</p>
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
  // v3.14 (K286) : « Mot de passe oublié ? » seulement à la connexion ; le renvoi n'apparaît qu'après un besoin.
  const lo=document.querySelector("#auth-oubli"); if(lo) lo.hidden=(mode!=="connexion");
  const lr=document.querySelector("#auth-renvoi"); if(lr) lr.hidden=true;
}
function validerAuth(){ if(_authMode==="inscription") inscrire(); else connecter(); }
function _authMsg(e){ const m=(e&&e.message)||"", l=m.toLowerCase();
  if(l.includes("already registered")||l.includes("already been")) return "Cet e-mail a déjà un compte — connecte-toi.";
  // v3.14 (K286) : la confirmation par e-mail et la limite d'envoi (avant « email », qui les avalerait)
  if(_nonConfirme(e)) return "Ton adresse n'est pas encore confirmée. Clique sur le lien de l'e-mail reçu à l'inscription (pense à regarder dans tes indésirables), ou demande un nouvel e-mail ci-dessous.";
  if(l.includes("rate limit") || l.includes("security purposes") || (e && e.status===429)) return "Trop d'e-mails demandés d'affilée. Attends une minute, puis réessaie.";
  if(l.includes("banned") || l.includes("user_banned")) return "Ton compte est suspendu pour le moment.";   // v2.22 (K139)
  if(l.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if(l.includes("database error")) return "Ce pseudo est peut-être déjà pris. Essaies-en un autre.";
  if(l.includes("password")) return "Mot de passe trop court (6 caractères minimum).";
  if(l.includes("email")) return "E-mail invalide.";
  return m || "Une erreur est survenue.";
}
function _nonConfirme(e){ const l=((e&&e.message)||"").toLowerCase(); return l.includes("not confirmed") || !!(e && e.code==="email_not_confirmed"); }
/* v3.14 (K286) — LE COMPTE ATTEND SA CONFIRMATION. L'e-mail est parti ; la joueuse entrera en cliquant
   sur son lien (bootstrap.js termine alors l'inscription), ou par Connexion une fois confirmé. */
let _emailAttente = "";
function _attenteConfirmation(email){
  _emailAttente = email || _emailAttente;
  basculerAuth("connexion");
  const lr=document.querySelector("#auth-renvoi"); if(lr) lr.hidden=false;
  authInfo(`Presque fini : un e-mail vient de partir vers ${_emailAttente}. Clique sur le lien qu'il contient pour entrer sur Silène. Il peut mettre quelques minutes à arriver : pense à regarder dans tes indésirables.`);
}
async function renvoyerEmailConfirmation(){
  if(!SERVEUR_DISPO){ authErreur("Serveur indisponible."); return; }
  const email=((document.querySelector("#auth-email")||{}).value||"").trim() || _emailAttente;
  if(!email){ authErreur("Écris d'abord ton adresse e-mail dans le champ ci-dessus."); return; }
  authErreur(""); authInfo("Envoi…");
  const { error } = await renvoyerConfirmation(email);
  if(error){ authInfo(""); authErreur(_authMsg(error)); return; }
  _emailAttente = email;
  authInfo(`Un nouvel e-mail de confirmation vient de partir vers ${email}. Pense à regarder dans tes indésirables.`);
}
async function motDePasseOublie(){
  if(!SERVEUR_DISPO){ authErreur("Serveur indisponible."); return; }
  const email=((document.querySelector("#auth-email")||{}).value||"").trim();
  if(!email){ authErreur("Écris d'abord ton adresse e-mail dans le champ ci-dessus, puis clique de nouveau sur « Mot de passe oublié ? »."); return; }
  authErreur(""); authInfo("Envoi…");
  const { error } = await demanderNouveauMdp(email);
  if(error){ authInfo(""); authErreur(_authMsg(error)); return; }
  authInfo(`Si un compte existe pour ${email}, un e-mail vient de partir avec un lien pour choisir un nouveau mot de passe. Pense à regarder dans tes indésirables.`);
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
/* ⚠ v0.58 — Le pseudo n'était pas filtré : « <img onerror=…> » passait, puis
   s'injectait dans le HTML des AUTRES joueurs (amis, annonces, marché, mur,
   console staff). Même règle côté serveur (contrainte profils_nom_sain). */
const PSEUDO_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{2,19}$/u;
async function inscrire(){
  if(!SERVEUR_DISPO){ authErreur("Serveur indisponible."); return; }
  const pseudo=(document.querySelector("#auth-pseudo").value||"").trim();
  const email=(document.querySelector("#auth-email").value||"").trim();
  const mdp=document.querySelector("#auth-mdp").value||"";
  if(!pseudo){ authErreur("Choisis un pseudo."); return; }
  if(!PSEUDO_RE.test(pseudo)){ authErreur("Pseudo : 3 à 20 caractères — lettres, chiffres, espace, point, tiret ou tiret bas, en commençant par une lettre ou un chiffre."); return; }
  if(!email || !mdp){ authErreur("E-mail et mot de passe requis."); return; }
  if(mdp.length<6){ authErreur("Mot de passe : 6 caractères minimum."); return; }
  const mdp2=(document.querySelector("#auth-mdp2")||{}).value||"";
  if(mdp!==mdp2){ authErreur("Les mots de passe ne correspondent pas."); return; }
  authInfo("Création du compte…"); authErreur("");
  const { data, error } = await sInscrire(email, mdp, pseudo);
  if(error){ authErreur(_authMsg(error)); return; }
  /* v3.14 (K286) — CONFIRMATION PAR E-MAIL. Supabase ne dit plus « déjà inscrit » : il rend un compte SANS
     identité (pour que personne ne puisse sonder les adresses). Et un compte neuf n'a pas de session tant
     que l'adresse n'est pas confirmée : on n'essaie pas d'entrer, on dit d'aller lire l'e-mail. */
  if(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length===0){ authInfo(""); authErreur("Cet e-mail a déjà un compte — connecte-toi."); return; }
  if(data && data.user && !data.session && !data.user.email_confirmed_at){ _attenteConfirmation(email); return; }
  if(!data || !data.session){ const r = await seConnecter(email, mdp); if(r && r.error){ if(_nonConfirme(r.error)){ _attenteConfirmation(email); return; } authErreur(_authMsg(r.error)); return; } }   // signUp n'établit pas toujours la session → on se connecte
  etat = nouvelEtat();
  const f=await _attribuerFaction();
  etat.nom=pseudo; etat.faction=f.id; etat.inscrit=true; etat.creeLe=Date.now(); etat.pos=posDefaut();
  for(let i=0;i<6;i++){ if(await sessionActuelle()) break; await new Promise(r=>setTimeout(r,200)); }   // attendre que la session soit prête
  // ⚠ `faction` ne part plus dans sauverSurServeur() : le trigger la protège dès
  // qu'elle a une valeur. L'attribution initiale passe par cet update ciblé, seul
  // cas autorisé (old.faction IS NULL). Sans lui, le compte resterait sans faction.
  if(typeof _premiereFaction==="function") await _premiereFaction(f.id);
  /* ⚠ v0.92b — `sauverSurServeur()` refuse d'écrire tant que le profil n'a pas
     été lu dans cette page. À l'inscription il n'y a rien à lire : l'état vient
     d'être créé ici, il fait autorité. On lève la garde explicitement. */
  if(typeof marquerProfilLu==="function") marquerProfilLu();
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
  let premiere = null;   // v3.14 : la faction, si c'est la première entrée (fin d'inscription)
  const email=(document.querySelector("#auth-email").value||"").trim();
  const mdp=document.querySelector("#auth-mdp").value||"";
  if(!email || !mdp){ authErreur("E-mail et mot de passe requis."); return; }
  authInfo("Connexion…"); authErreur("");
  const { error } = await seConnecter(email, mdp);
  if(error){ authInfo(""); authErreur(_authMsg(error)); if(_nonConfirme(error)){ _emailAttente=email; const lr=document.querySelector("#auth-renvoi"); if(lr) lr.hidden=false; } return; }
  const prof = await chargerDepuisServeur();
  /* ⚠⚠ v0.94b — CETTE LIGNE RELISAIT LES COLONNES À LA MAIN. Le correctif n°6
     de la v0.92 avait créé `appliquerColonnesProfil()` pour qu'il n'y ait
     qu'UN endroit où les colonnes serveur reviennent dans `etat`… et n'avait
     été appliqué que dans `bootstrap.js`. Les deux copies sont restées
     équivalentes jusqu'à ce que la v0.94 ajoute `xp` à la liste : depuis,
     une connexion EXPLICITE (par ce chemin) laissait `etat.xpTotal` vide,
     `majNiveauDepuisXp()` sortait aussitôt, et le joueur s'affichait
     « Niv 1 · XP 0/20 » — rien de perdu en base, mais de quoi faire peur.
     ⚠ NE JAMAIS recopier ici ce que fait `appliquerColonnesProfil` : toute
       colonne ajoutée à CLES_SERVEUR doit être relue à UN SEUL endroit. */
  if(prof && prof.donnees && prof.donnees.inscrit){
    etat = hydraterEtat(prof.donnees);
    if(typeof appliquerColonnesProfil==="function") appliquerColonnesProfil(prof);
  }
  else premiere = await _terminerInscription(prof);   // v3.14 : première entrée après la confirmation par e-mail
  if(prof && prof.avatar) etat.avatar = prof.avatar;   /* l'avatar vient de la COLONNE, plus de donnees */
  fermerAuth(); fermerEntree(); afficher();
  journal(premiere ? `Bienvenue, ${etat.nom}. Faction attribuée : ${premiere.nom}.` : `Bon retour, ${etat.nom}.`,"gain");
  /* ⚠ Sans ceci, le sac restait vide et les jauges aux défauts client jusqu'au
     prochain rechargement de page : la synchronisation Phase 4 ne tournait
     qu'au démarrage (bootstrap.js), pas après une connexion. */
  if(typeof syncApresConnexion==="function") await syncApresConnexion();
  // Rattrapage : compte créé avant cette règle, ou inscription interrompue
  // avant la validation de l'avatar (rechargement de page, onglet fermé).
  if(!etat.avatar && typeof ouvrirAvatar==="function") await ouvrirAvatar({obligatoire:true});
  if(premiere) montrerBienvenue();
}
/* v3.14 (K286) — LA FIN DE L'INSCRIPTION, À LA PREMIÈRE ENTRÉE. Avec la confirmation par e-mail, le compte
   (et sa ligne profils, avec le pseudo) existe avant que la joueuse puisse entrer : l'état de départ et la
   faction se font donc à sa première entrée — par le lien de l'e-mail (bootstrap.js) ou par Connexion.
   Une faction déjà posée au serveur (inscription interrompue) est GARDÉE : en tirer une autre ici
   l'aurait mise en désaccord avec la colonne, que _premiereFaction ne réécrit jamais.
   Rend la faction (pour le message de bienvenue). */
async function _terminerInscription(prof){
  const deja = prof && prof.faction && FACTIONS.find(x=>x.id===prof.faction);
  const f = deja || await _attribuerFaction();
  etat = nouvelEtat();
  etat.nom=(prof&&prof.nom)||etat.nom||"Opérateur"; etat.faction=f.id; etat.inscrit=true; etat.creeLe=Date.now(); etat.pos=posDefaut();
  if(!deja && typeof _premiereFaction==="function") await _premiereFaction(f.id);
  if(typeof marquerProfilLu==="function") marquerProfilLu();
  await sauverSurServeur();
  return f;
}
/* v3.14 (K286) — NOUVEAU MOT DE PASSE, après le lien « mot de passe oublié ». Le lien a ouvert une session :
   il prouve que la joueuse lit cette boîte, l'ancien mot de passe n'est donc pas redemandé (contrairement
   aux Paramètres). Même règle de longueur que les Paramètres : 8 caractères. */
function ouvrirNouveauMdp(){
  let m=document.querySelector("#modale-nouveau-mdp");
  if(!m){
    m=document.createElement("div"); m.className="modale"; m.id="modale-nouveau-mdp"; m.hidden=true;
    m.innerHTML=`<div class="membrane modale-boite">
      <h2>Nouveau mot de passe</h2>
      <p style="margin:0">Choisis ton nouveau mot de passe (8 caractères minimum).</p>
      <input type="password" id="nmdp-1" placeholder="Nouveau mot de passe" autocomplete="new-password">
      <input type="password" id="nmdp-2" placeholder="Confirme le mot de passe" autocomplete="new-password">
      <p id="nmdp-erreur" style="color:#ff5257;margin:0 0 8px" hidden></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="valider" id="nmdp-ok">Enregistrer</button><button id="nmdp-plus-tard">Plus tard</button></div>
    </div>`;
    document.body.appendChild(m);
    m.querySelector("#nmdp-ok").addEventListener("click", enregistrerNouveauMdp);
    m.querySelector("#nmdp-2").addEventListener("keydown", e=>{ if(e.key==="Enter") enregistrerNouveauMdp(); });
    m.querySelector("#nmdp-plus-tard").addEventListener("click", ()=>{ m.hidden=true;
      journal("Ton mot de passe n'a pas changé. Pour en choisir un autre plus tard, redemande un e-mail depuis l'écran de connexion (Mot de passe oublié ?).","alerte"); });
  }
  if(!m.hidden) return;
  m.hidden=false;
  const e1=m.querySelector("#nmdp-1"); if(e1){ e1.value=""; e1.focus(); }
  const e2=m.querySelector("#nmdp-2"); if(e2) e2.value="";
}
async function enregistrerNouveauMdp(){
  const m=document.querySelector("#modale-nouveau-mdp"); if(!m) return;
  const err=m.querySelector("#nmdp-erreur"), dire=t=>{ err.textContent=t; err.hidden=!t; };
  const a=(m.querySelector("#nmdp-1")||{}).value||"", b=(m.querySelector("#nmdp-2")||{}).value||"";
  if(a.length<8){ dire("Le mot de passe doit faire au moins 8 caractères."); return; }
  if(a!==b){ dire("Les deux mots de passe ne correspondent pas."); return; }
  dire(""); const bt=m.querySelector("#nmdp-ok"); if(bt){ bt.disabled=true; bt.textContent="Enregistrement…"; }
  try{
    const { error } = await sb.auth.updateUser({ password: a });
    if(error){
      const l=(error.message||"").toLowerCase();
      dire(l.includes("different") ? "C'est déjà ton mot de passe actuel : choisis-en un autre."
         : (l.includes("session") || l.includes("jwt")) ? "Le lien a expiré. Redemande un e-mail depuis l'écran de connexion (Mot de passe oublié ?)."
         : "Changement refusé : "+error.message);
      return;
    }
    m.hidden=true;
    journal("Mot de passe changé. Utilise-le désormais pour te connecter.","gain");
  } finally { if(bt){ bt.disabled=false; bt.textContent="Enregistrer"; } }
}
/* v3.14 (K286) — CE QUE DIT LE LIEN D'UN E-MAIL, une fois la page prête (bootstrap.js). La confirmation
   d'inscription se raconte d'elle-même (message de bienvenue) ; le mot de passe oublié ouvre sa fenêtre
   (bootstrap.js). Restent le changement d'adresse et les liens morts. Le # est ensuite retiré de
   l'adresse, pour qu'un rechargement ne répète rien. */
function _annoncerLien(){
  if(typeof NOVA_LIEN==="undefined" || !NOVA_LIEN) return;
  const dire=(t,x)=>{ if(typeof alerterJoli==="function") alerterJoli(t,x); else alert(x); };
  if(NOVA_LIEN.erreur) dire("Lien expiré", "Ce lien a expiré ou a déjà servi. Si besoin, redemande un e-mail : depuis l'écran de connexion (mot de passe oublié, confirmation de l'inscription) ou depuis les Paramètres (changement d'adresse).");
  else if(NOVA_LIEN.message && /other email/i.test(NOVA_LIEN.message)) dire("Changement d'adresse", "Premier lien accepté. Clique maintenant sur le lien envoyé à ton autre adresse : le changement se fera après ce second clic. Pense à regarder dans tes indésirables.");
  else if(NOVA_LIEN.type==="email_change") dire("Adresse changée", "Ta nouvelle adresse e-mail est confirmée. Utilise-la désormais pour te connecter.");
  if((location.hash||"").length>1){ try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "navigation.js#lien"); } }
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

/* ---------- v1.11 — DÉCONNEXION POUR INACTIVITÉ ----------
   45 minutes sans toucher à rien → sauvegarde, puis déconnexion. Un
   avertissement tombe à 44 minutes, avec un bouton pour rester.
   (v3.12, demande d'une testeuse via l'autrice : 30 → 45 minutes.)
   ⚠ ON NE SE FIE PAS À `setTimeout` SEUL : un onglet en arrière-plan voit ses
   minuteries ralenties (et sur mobile, gelées). On compare donc des HORODATAGES
   à chaque réveil — c'est le même piège que `visibilitychange` en v0.91.
   ⚠ La sauvegarde passe AVANT la déconnexion : sinon les dernières minutes de
   jeu partent à la poubelle.
   ⚠ Rien ne se perd à être déconnecté : l'énergie remonte hors ligne, les
   cultures poussent, la position est gardée. C'est une sécurité (téléphone
   posé, ordinateur partagé), pas une punition. */
const INACTIF_MS   = 45 * 60 * 1000;
const INACTIF_AVERT_MS = 44 * 60 * 1000;
let _derniereAction = Date.now();
let _avertiInactif  = false;
function _reveilActivite(){
  _derniereAction = Date.now();
  if(_avertiInactif){ _avertiInactif = false; const z=document.querySelector("#inactif-avert"); if(z) z.remove(); }
}
["pointerdown","keydown","wheel","touchstart"].forEach(ev =>
  document.addEventListener(ev, _reveilActivite, { passive:true, capture:true }));

function _avertirInactif(){
  if(document.querySelector("#inactif-avert")) return;
  const d = document.createElement("div");
  d.id = "inactif-avert";
  d.style.cssText = "position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:9500;"
    + "background:rgba(14,22,42,.98); border:1px solid #ff9a44; border-radius:12px; padding:12px 16px;"
    + "max-width:min(420px, calc(100vw - 24px)); text-align:center; box-shadow:0 10px 30px rgba(0,0,0,.6);";
  d.innerHTML = `<div style="margin-bottom:8px">Tu es inactif depuis 44 minutes — <b>déconnexion dans 1 minute</b>.</div>`;
  const b = document.createElement("button"); b.className = "mini"; b.textContent = "Je suis là";
  b.addEventListener("click", _reveilActivite);
  d.appendChild(b); document.body.appendChild(d);
}
async function _deconnexionInactif(){
  try{ if(typeof sauverSurServeur === "function") await sauverSurServeur(); }
  catch(e){ if(typeof _catchLog === "function") _catchLog(e, "navigation.js#inactif"); }
  try{ if(typeof seDeconnecter === "function") await seDeconnecter(); }catch(e){}
  try{ sessionStorage.setItem("nova_inactif", "1"); }catch(e){}
  location.reload();
}
async function _verifierInactivite(){
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO) return;
  // ⚠ Pas de raccourci `estConnecte()` : il n'existe pas. La session fait foi.
  if(typeof sessionActuelle === "function"){ const s = await sessionActuelle(); if(!s) return; }
  const ecoule = Date.now() - _derniereAction;
  if(ecoule >= INACTIF_MS){ _deconnexionInactif(); return; }
  if(ecoule >= INACTIF_AVERT_MS && !_avertiInactif){ _avertiInactif = true; _avertirInactif(); }
}
setInterval(_verifierInactivite, 20000);
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) _verifierInactivite(); });

/* ---------- Construction dynamique ---------- */
