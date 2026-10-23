/* ===========================================================
   AVATAR en couches : visage → pilosité → accessoire → cheveux.
   v1.88c — l'ACCESSOIRE passe DERRIÈRE les cheveux (retour de l'autrice).
   v1.88c — COULEUR DES CHEVEUX (cheveux ET pilosité) : brun (les fichiers actuels,
             sans suffixe), blond, noir, roux, gris. Nommage : on ajoute
             « _<couleur> » avant « .png » — cheveux/h_3_blond.png,
             cheveux/h_7_derriere_roux.png, pilosite/2_gris.png. Un fichier de
             couleur absent retombe sur le brun (jamais de trou dans le portrait).
   Toutes les images : images/avatars/<couche>/<fichier>.png (666×900 transparent).
   Toutes les couches doivent partager le MÊME cadrage : elles se superposent
   pixel pour pixel, un décalage se verrait immédiatement.
   Nommage : visage / cheveux / accessoire = "<genre>_<n>.png" (h_1, f_1…)
             pilosite = "<n>.png" (homme uniquement).
   v1.44 — COIFFURES EN DEUX MORCEAUX : "<genre>_<n>_derriere.png" (passe
             DERRIÈRE le visage) + "<genre>_<n>_devant.png" (devant), et pas
             de "<genre>_<n>.png". Les déclarer dans AV_CHEVEUX_DEUX. Le joueur
             choisit une seule coiffure ; les deux morceaux se placent seuls.
   Les COMPTES ci-dessous disent au sélecteur ce qui existe — il suffit de les
   augmenter à mesure que tu ajoutes des images (les rangées apparaissent seules).
   =========================================================== */
const AV_VISAGE     = { h:7, f:7 };   // visages disponibles par genre (compté sur images/avatars/visage/)
const AV_CHEVEUX    = { h:7,  f:13 };   // coiffures disponibles par genre
const AV_CHEVEUX_DEUX = { h:[7], f:[] }; // v1.44 : coiffures en deux morceaux (_derriere / _devant)
const AV_PILOSITE   = 7;               // pilosité : HOMME uniquement (la rangée est masquée pour les femmes)
const AV_ACCESSOIRE = { h:0, f:1 };    // accessoires par genre (morphologies différentes)
const AV_COULEURS = [                  // v1.88c : la première est celle des fichiers sans suffixe
  { id:"brun",  nom:"Brun",           teinte:"#5b3a24" },
  { id:"blond", nom:"Blond",          teinte:"#d9b46a" },
  { id:"noir",  nom:"Noir",           teinte:"#1c1916" },
  { id:"roux",  nom:"Roux",           teinte:"#a5482a" },
  { id:"gris",  nom:"Poivre et sel",  teinte:"#9b9b98" }
];

let _svgPortrait = null, _avStyleMonte = false;

/* ⚠ L'avatar appartient au SERVEUR (colonne profils.avatar, écrite par la RPC
   changer_apparence). L'éditeur travaille donc sur un BROUILLON : rien n'est
   appliqué à etat.avatar tant que le serveur n'a pas validé et débité.
   Avant, il écrivait directement en local — on pouvait se repersonnaliser à
   l'infini et gratuitement, verrou et coût étant purement décoratifs. */
let _avObligatoire = false;  // inscription : ni Annuler, ni fermeture au clic hors cadre
let _avEtatServeur = null;   // dernière réponse de apparence_etat()
let _avBrouillon   = null;   // copie de travail, jamais persistée
const _AV_VIDE = { genre:"h", visage:0, cheveux:0, pilosite:0, accessoire:0, couleur:"brun" };

function _avFmtDuree(ms){
  ms = Math.max(0, ms);
  const j = ms / ((typeof JOUR_MS!=="undefined") ? JOUR_MS : 86400000);
  if(j >= 1) return `${Math.floor(j)} j`;
  const h = Math.ceil(j*24);
  return h > 1 ? `${h} h` : "moins d'une heure";
}

/* Une couche = "dossier/fichier", ou "dossier/fichier@couleur" (v1.88c) : on tente le
   fichier de couleur, et s'il manque, le brun, puis rien. */
function _avImg(couche, cls){
  const [base, coul] = String(couche).split("@");
  if(!coul) return `<img class="${cls}" src="images/avatars/${base}.png" alt="" onerror="this.style.display='none'">`;
  return `<img class="${cls}" src="images/avatars/${base}_${coul}.png" alt="" onerror="if(!this.dataset.r){this.dataset.r='1';this.src='images/avatars/${base}.png';}else{this.style.display='none';}">`;
}
/* ===========================================================
   v1.91 — K58 : LES CADRES D'AVATAR (admins, modérateurs, bêta-testeurs).
   ⚠ BRANCHÉS MAIS INVISIBLES : CADRES_VISIBLES = false. Tant qu'il l'est, seuls les
   devs les voient (pour vérifier le rendu) ; les joueurs, eux compris, ne voient rien.
   Le jour de la surprise : passer CADRES_VISIBLES à true.
   - Qui a quel cadre : `avatar.cadre` (« admins », « testeurs »…), posé à la main
     dans la base (voir BACKEND_PLAN §110). changer_apparence (v213) le CONSERVE : un
     joueur ne peut ni le retirer ni se l'attribuer en changeant d'apparence.
   - Image : images/cadres/cadre_<id>.png, fond transparent, même rapport que le
     portrait. Posé AU-DESSUS des calques de l'avatar, SOUS la bête.
   =========================================================== */
const CADRES_VISIBLES = false;
const AV_CADRES = { admins:"Admins et modérateurs", testeurs:"Bêta-testeurs" };
function cadreAvatarHtml(a){
  const id = a && a.cadre;
  if(!id || !Object.prototype.hasOwnProperty.call(AV_CADRES, id)) return "";
  if(!CADRES_VISIBLES && !(typeof estDev === "function" && estDev())) return "";
  return `<img class="av-cadre" src="images/cadres/cadre_${id}.png" alt="" title="${AV_CADRES[id]}" onerror="this.remove()">`;
}
function _avCoul(a){ const c = a && a.couleur; return (c && c !== "brun" && AV_COULEURS.some(x => x.id === c)) ? "@" + c : ""; }
function _avDeux(g, n){ return !!n && (AV_CHEVEUX_DEUX[g] || []).includes(n); }
function _avCouches(a){
  a = a || etat.avatar || {}; const g = a.genre || "h"; const L = [];
  const deux = _avDeux(g, a.cheveux), c = _avCoul(a);    // v1.44 : arrière des cheveux AVANT le visage
  if(deux)         L.push(`cheveux/${g}_${a.cheveux}_derriere${c}`);
  if(a.visage)     L.push(`visage/${g}_${a.visage}`);
  if(a.pilosite)   L.push(`pilosite/${a.pilosite}${c}`);
  if(a.accessoire) L.push(`accessoire/${g}_${a.accessoire}`);   // v1.88c : derrière les cheveux
  if(a.cheveux)    L.push(deux ? `cheveux/${g}_${a.cheveux}_devant${c}` : `cheveux/${g}_${a.cheveux}${c}`);
  return L;
}

/* ---------- Portrait de profil ---------- */
function majAvatar(){
  const p = document.querySelector("#portrait"); if(!p) return;
  _avStyle();                                             // injecte le CSS des couches dès le 1er rendu
  if(_svgPortrait === null) _svgPortrait = p.innerHTML;   // garde le placeholder SVG d'origine
  const sig = JSON.stringify(etat.avatar || null);
  if(p.dataset.avsig === sig) return;                     // inchangé → pas de reconstruction
  p.dataset.avsig = sig;
  const L = _avCouches();
  p.innerHTML = L.length ? L.map(c=>_avImg(c,"av-couche")).join("") : _svgPortrait;
}

/* ---------- Sélecteur ---------- */
/* v1.93l — BUG « la fenêtre part à gauche » (retour de l'autrice, capture à l'appui) : avec
   un ZOOM (pincement sur téléphone/tablette, ou zoom du navigateur), `position:fixed; inset:0`
   se cale sur la page entière (layout viewport) et non sur la partie visible (visual
   viewport) : la fenêtre était centrée hors de l'écran. On la cale sur `visualViewport`
   (position et taille de la partie visible) à l'ouverture, et tant qu'elle reste ouverte
   (le zoom ou le défilement peuvent changer). Sans zoom : exactement comme avant. */
function _avCalerVue(){
  const m = document.querySelector("#avatar-modale"), vv = window.visualViewport;
  if(!m || m.hidden || !vv) return;
  m.style.boxSizing = "border-box"; m.style.inset = "auto"; m.style.left = vv.offsetLeft + "px"; m.style.top = vv.offsetTop + "px";
  m.style.width = vv.width + "px"; m.style.height = vv.height + "px";
}
function _avSuivreVue(oui){
  const vv = window.visualViewport; if(!vv) return;
  vv.removeEventListener("resize", _avCalerVue); vv.removeEventListener("scroll", _avCalerVue);
  if(oui){ vv.addEventListener("resize", _avCalerVue); vv.addEventListener("scroll", _avCalerVue); _avCalerVue(); }
}
function _avModal(){
  let m=document.querySelector("#avatar-modale");
  if(!m){ m=document.createElement("div"); m.id="avatar-modale"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m && !_avObligatoire) _fermerAvatar(); }); }
  return m;
}
async function ouvrirAvatar(opts){
  _avStyle();
  _avObligatoire = !!(opts && opts.obligatoire);
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible — apparence non modifiable.","alerte"); _avObligatoire=false; return; }
  const { data, error } = await sb.rpc("apparence_etat");
  if(error || !data || !data.ok){ journal("Impossible de lire l'état de l'apparence.","alerte"); _avObligatoire=false; return; }
  _avEtatServeur = data;
  if(data.verrou){
    _avObligatoire = false;
    const reste = new Date(data.prochain).getTime() - Date.now();
    journal(`Apparence verrouillée : prochain changement possible dans ${_avFmtDuree(reste)}.`,"alerte");
    return;
  }
  _avBrouillon = Object.assign({}, _AV_VIDE, etat.avatar || data.avatar || {});
  _renderAvModal(); _avModal().hidden=false; _avSuivreVue(true);   // v1.93l : centrée sur la partie visible
}
/* Fermeture SANS validation : on jette le brouillon, rien n'est débité. */
function _fermerAvatar(){
  if(_avObligatoire){ journal("Choisis ton apparence pour continuer — elle sera figée ensuite.","alerte"); return; }
  _avModal().hidden=true; _avSuivreVue(false); _avBrouillon=null; if(typeof afficher==="function") afficher();
}

/* Validation : c'est le serveur qui décide, débite et fige le genre. */
async function _validerAvatar(){
  const a = _avBrouillon; if(!a) return;
  if(!a.visage){ journal("Choisis un visage.","alerte"); return; }
  if(JSON.stringify(a) === JSON.stringify(etat.avatar||null)){ _fermerAvatar(); return; }

  const e = _avEtatServeur || {};
  if(!e.gratuit){
    if((e.credits|0) < (e.cout|0)){ journal(`Il te faut ${e.cout} ₡ pour changer d'apparence (tu en as ${e.credits}).`,"alerte"); return; }
    if(!await confirmerJoli("Changer d'apparence", `Changer d'apparence coûte ${e.cout} ₡.\n\nTon genre reste figé, et tu ne pourras pas y retoucher avant 6 mois. Confirmer ?`, "Confirmer")) return;
  }

  const btn = document.querySelector("#av-valider");
  if(btn){ btn.disabled = true; btn.textContent = "Validation…"; }
  const { data, error } = await sb.rpc("changer_apparence", { p_avatar: a });
  if(btn){ btn.disabled = false; btn.textContent = "Terminer"; }

  if(error){ journal("Échec : "+error.message,"alerte"); return; }
  if(!data || !data.ok){
    const err = data && data.err;
    if(err==="verrou")         journal(`Apparence encore verrouillée jusqu'au ${new Date(data.prochain).toLocaleString()}.`,"alerte");
    else if(err==="genre_fige")    journal("Ton genre a été choisi à l'inscription : il ne peut plus changer.","alerte");
    else if(err==="credits")       journal(`Crédits insuffisants : ${data.cout} ₡ requis, tu en as ${data.credits}.`,"alerte");
    else if(err==="visage_requis") journal("Choisis un visage.","alerte");
    else journal("Changement refusé.","alerte");
    return;
  }

  etat.avatar = a;
  if(typeof data.credits==="number" && typeof appliquerSoldeServeur==="function") appliquerSoldeServeur(data.credits);
  journal(data.gratuit ? "Apparence enregistrée." : `Apparence modifiée pour ${data.cout} ₡.`, "gain");
  _avModal().hidden=true; _avSuivreVue(false); _avBrouillon=null; _avObligatoire=false;
  if(typeof majAvatar==="function") majAvatar();
  if(typeof afficher==="function") afficher();
  if(typeof majParametres==="function") majParametres();
}
/* ⚠ _renderAvModal reconstruit tout le HTML à chaque clic : les rangées de
   vignettes sont en overflow-x:auto, leur défilement horizontal repartait donc
   à zéro et on était renvoyé à la première coiffure. On mémorise la position
   de chaque rangée (clé = nom de la couche) et on la restaure après coup. */
function _avScrollsLire(m){
  const pos = {};
  (m ? m.querySelectorAll(".av-vigs") : []).forEach(z=>{ pos[z.dataset.couche] = z.scrollLeft; });
  return pos;
}
function _avScrollsEcrire(m, pos){
  if(!m || !pos) return;
  m.querySelectorAll(".av-vigs").forEach(z=>{
    const v = pos[z.dataset.couche];
    if(typeof v === "number") z.scrollLeft = v;
  });
}

function _renderAvModal(){
  const m=_avModal(); const a=_avBrouillon; if(!a) return; const g=a.genre||"h";
  const _pos = _avScrollsLire(m);
  const fige = !!(_avEtatServeur && _avEtatServeur.defini);   // genre choisi à l'inscription = figé à vie
  const e = _avEtatServeur || {};
  const tarif = _avObligatoire ? `Choisis ton visage. <b>Le genre est définitif</b> et l'apparence sera verrouillée 6 mois.`
              : e.gratuit ? `Premier choix : gratuit. Ton genre sera ensuite figé à vie et l'apparence verrouillée 6 mois.`
                          : `Ce changement coûtera ${e.cout} ₡ (tu en as ${e.credits}) et sera verrouillé 6 mois.`;
  let h=`<div class="picker-cadre av-cadre"><div class="picker-tete"><b>Personnaliser l'avatar</b>
      <span class="av-actions">${_avObligatoire?"":`<button class="mini" data-fermer="1">Annuler</button>`}<button class="mini av-ok" id="av-valider">Terminer</button></span></div>
    <p class="dev-note av-tarif">${tarif}</p>`;
  h+=`<div class="av-haut"><div class="av-portrait" id="av-portrait"></div>
      <div class="av-genre">
        <button class="mini${g==="h"?" actif":""}"${fige?" disabled":""} data-genre="h">Homme</button>
        <button class="mini${g==="f"?" actif":""}"${(fige||!AV_VISAGE.f)?" disabled":""} data-genre="f">Femme${AV_VISAGE.f?"":" · à venir"}</button>
        ${fige?`<span class="itip-gris" style="align-self:center">genre figé</span>`:""}
      </div></div>`;
  h+=_avRangee("Visage","visage", AV_VISAGE[g]||0, false, g);
  // v1.88c : la couleur des cheveux (et de la pilosité), avant les coiffures.
  const coulCur = a.couleur || "brun";
  h+=`<div class="av-rangee"><div class="av-rangee-tete">Couleur des cheveux</div><div class="av-couleurs">${AV_COULEURS.map(c=>
      `<button class="av-coul${coulCur===c.id?" actif":""}" data-couleur="${c.id}" title="${c.nom}"><span style="background:${c.teinte}"></span>${c.nom}</button>`).join("")}</div></div>`;
  h+=_avRangee("Cheveux","cheveux", AV_CHEVEUX[g]||0, true, g);
  if(g==="h") h+=_avRangee("Pilosité","pilosite", AV_PILOSITE, true, g);   // hommes uniquement
  h+=_avRangee("Accessoire","accessoire", AV_ACCESSOIRE[g]||0, true, g);
  h+=`</div>`;
  m.innerHTML=h;
  _majAvPortrait();
  const bfe=m.querySelector("[data-fermer]"); if(bfe) bfe.addEventListener("click", _fermerAvatar);
  const bok=m.querySelector("#av-valider"); if(bok) bok.addEventListener("click", _validerAvatar);
  m.querySelectorAll("[data-genre]").forEach(b=>b.addEventListener("click",()=>{
    if(b.disabled) return;
    // Les couches sont genrées : coiffure et accessoire du genre précédent n'ont
    // pas d'équivalent. On remet tout à zéro plutôt que d'afficher un trou.
    if(fige) return;   // genre figé côté serveur : la RPC refuserait de toute façon
    a.genre=b.dataset.genre; a.visage=0; a.cheveux=0; a.pilosite=0; a.accessoire=0;
    _majAvPortrait(); _renderAvModal(); }));
  m.querySelectorAll("[data-choix]").forEach(b=>b.addEventListener("click",()=>{ const p=b.dataset.choix.split(":"); a[p[0]]=parseInt(p[1],10); _majAvPortrait(); _renderAvModal(); }));
  m.querySelectorAll("[data-couleur]").forEach(b=>b.addEventListener("click",()=>{ a.couleur=b.dataset.couleur; _majAvPortrait(); _renderAvModal(); }));   // v1.88c
  // (les [data-choix] écrivent dans _avBrouillon, jamais dans etat.avatar)
  _avScrollsEcrire(m, _pos);   // rendre au joueur la position où il était
}
function _avRangee(titre, couche, n, avecAucun, g){
  let opts="";
  const cur = _avBrouillon || _AV_VIDE;
  if(avecAucun) opts+=`<button class="av-vig${!cur[couche]?" actif":""}" data-choix="${couche}:0" title="Aucun"><span class="av-x">∅</span></button>`;
  for(let i=1;i<=n;i++){
    const file = (couche==="pilosite") ? `${couche}/${i}` : `${couche}/${g}_${i}`;
    /* v1.88c : cheveux et pilosité en vignette dans la couleur choisie (repli sur le brun ;
       la vignette ne disparaît que si même le brun manque). */
    const c = (couche==="cheveux" || couche==="pilosite") ? _avCoul(cur).slice(1) : "";
    const src = (f) => c ? `images/avatars/${f}_${c}.png` : `images/avatars/${f}.png`;
    const repli = (f, cacher) => c ? `if(!this.dataset.r){this.dataset.r='1';this.src='images/avatars/${f}.png';}else{${cacher}}` : cacher;
    // v1.44 : une coiffure en deux morceaux = une seule vignette, les deux calques superposés.
    const img = (couche==="cheveux" && _avDeux(g, i))
      ? `<img class="av-vig-c" src="${src(file+"_derriere")}" onerror="${repli(file+"_derriere","this.parentElement.style.display='none'")}"><img class="av-vig-c" src="${src(file+"_devant")}" alt="" onerror="${repli(file+"_devant","this.style.display='none'")}">`
      : `<img src="${src(file)}" onerror="${repli(file,"this.parentElement.style.display='none'")}">`;
    opts+=`<button class="av-vig${cur[couche]===i?" actif":""}" data-choix="${couche}:${i}">${img}</button>`;
  }
  if(!n) opts+=`<span class="itip-gris" style="align-self:center">à venir</span>`;
  return `<div class="av-rangee"><div class="av-rangee-tete">${titre}</div><div class="av-vigs" data-couche="${couche}">${opts}</div></div>`;
}
function _majAvPortrait(){
  const el=document.querySelector("#av-portrait"); if(!el) return;
  const L=_avCouches(_avBrouillon);
  el.innerHTML = L.length ? L.map(c=>_avImg(c,"av-couche")).join("") : `<span class="av-x-grand">?</span>`;
}

/* ---------- Style ---------- */
function _avStyle(){
  if(_avStyleMonte) return; _avStyleMonte=true;
  const st=document.createElement("style");
  st.textContent=`
    .av-couche{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    #avatar-modale{ position:fixed; inset:0; z-index:250; background:rgba(4,8,20,.75); display:grid; place-items:center; padding:20px; }
    #avatar-modale[hidden]{ display:none; }
    .av-cadre{ max-width:520px; width:100%; max-height:88vh; overflow:auto; }
    .av-haut{ display:flex; gap:16px; align-items:center; margin-bottom:10px; }
    .av-portrait{ position:relative; width:180px; aspect-ratio:666/900; flex:0 0 auto; border-radius:16px; overflow:hidden; background:radial-gradient(circle at 50% 35%,#123152,#0a1730); border:1px solid var(--edge); display:grid; place-items:center; -webkit-mask-image:linear-gradient(to bottom,#000 74%,transparent 100%); mask-image:linear-gradient(to bottom,#000 74%,transparent 100%); }
    .av-x-grand{ font-size:40px; color:var(--sourdine); }
    .av-genre{ display:flex; gap:8px; flex-wrap:wrap; }
    .av-genre .mini.actif{ border-color:var(--orange); color:var(--orange-hi); }
    .av-rangee{ margin:10px 0; }
    .av-rangee-tete{ font-family:"Space Mono",monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--sourdine); margin-bottom:6px; }
    .av-vigs{ display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; }
    .av-vig{ position:relative; width:60px; aspect-ratio:666/900; height:auto; flex:0 0 auto; border:2px solid var(--line); border-radius:10px; overflow:hidden; background:#0a1730; cursor:pointer; padding:0; }
    .av-vig img{ width:100%; height:100%; object-fit:cover; }
    .av-vig img.av-vig-c{ position:absolute; inset:0; }
    .av-vig.actif{ border-color:var(--orange); box-shadow:0 0 0 2px var(--orange) inset; }
    .av-x{ color:var(--sourdine); font-size:22px; }
    .av-actions{ display:flex; gap:8px; }
    .av-ok{ border-color:var(--orange); color:var(--orange-hi); }
    .av-tarif{ margin:0 0 10px; }
    .av-couleurs{ display:flex; gap:8px; flex-wrap:wrap; }
    .av-coul{ display:flex; align-items:center; gap:6px; padding:5px 10px; border:2px solid var(--line); border-radius:10px; background:#0a1730; color:var(--texte); cursor:pointer; font-size:13px; }
    .av-coul span{ width:16px; height:16px; border-radius:50%; border:1px solid rgba(255,255,255,.35); }
    .av-coul.actif{ border-color:var(--orange); color:var(--orange-hi); }
  `;
  document.head.appendChild(st);
}
