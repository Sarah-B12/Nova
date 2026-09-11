/* ===========================================================
   AVATAR en couches : visage → pilosité → cheveux → accessoire.
   Toutes les images : images/avatars/<couche>/<fichier>.png (666×900 transparent).
   Toutes les couches doivent partager le MÊME cadrage : elles se superposent
   pixel pour pixel, un décalage se verrait immédiatement.
   Nommage : visage / cheveux / accessoire = "<genre>_<n>.png" (h_1, f_1…)
             pilosite = "<n>.png" (homme uniquement).
   Les COMPTES ci-dessous disent au sélecteur ce qui existe — il suffit de les
   augmenter à mesure que tu ajoutes des images (les rangées apparaissent seules).
   =========================================================== */
const AV_VISAGE     = { h:20, f:7 };   // visages disponibles par genre (compté sur images/avatars/visage/)
const AV_CHEVEUX    = { h:0,  f:4 };   // coiffures : f_1..f_4 (aucune pour les hommes pour l'instant)
const AV_PILOSITE   = 0;               // pilosité : HOMME uniquement (la rangée est masquée pour les femmes)
const AV_ACCESSOIRE = { h:0, f:0 };    // accessoires par genre (morphologies différentes)

let _svgPortrait = null, _avStyleMonte = false;

/* ⚠ L'avatar appartient au SERVEUR (colonne profils.avatar, écrite par la RPC
   changer_apparence). L'éditeur travaille donc sur un BROUILLON : rien n'est
   appliqué à etat.avatar tant que le serveur n'a pas validé et débité.
   Avant, il écrivait directement en local — on pouvait se repersonnaliser à
   l'infini et gratuitement, verrou et coût étant purement décoratifs. */
let _avObligatoire = false;  // inscription : ni Annuler, ni fermeture au clic hors cadre
let _avEtatServeur = null;   // dernière réponse de apparence_etat()
let _avBrouillon   = null;   // copie de travail, jamais persistée
const _AV_VIDE = { genre:"h", visage:0, cheveux:0, pilosite:0, accessoire:0 };

function _avFmtDuree(ms){
  ms = Math.max(0, ms);
  const j = ms / ((typeof JOUR_MS!=="undefined") ? JOUR_MS : 86400000);
  if(j >= 1) return `${Math.floor(j)} j`;
  const h = Math.ceil(j*24);
  return h > 1 ? `${h} h` : "moins d'une heure";
}

function _avImg(couche, cls){ return `<img class="${cls}" src="images/avatars/${couche}.png" alt="" onerror="this.style.display='none'">`; }
function _avCouches(a){
  a = a || etat.avatar || {}; const g = a.genre || "h"; const L = [];
  if(a.visage)     L.push(`visage/${g}_${a.visage}`);
  if(a.pilosite)   L.push(`pilosite/${a.pilosite}`);
  if(a.cheveux)    L.push(`cheveux/${g}_${a.cheveux}`);
  if(a.accessoire) L.push(`accessoire/${g}_${a.accessoire}`);
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
  _renderAvModal(); _avModal().hidden=false;
}
/* Fermeture SANS validation : on jette le brouillon, rien n'est débité. */
function _fermerAvatar(){
  if(_avObligatoire){ journal("Choisis ton apparence pour continuer — elle sera figée ensuite.","alerte"); return; }
  _avModal().hidden=true; _avBrouillon=null; if(typeof afficher==="function") afficher();
}

/* Validation : c'est le serveur qui décide, débite et fige le genre. */
async function _validerAvatar(){
  const a = _avBrouillon; if(!a) return;
  if(!a.visage){ journal("Choisis un visage.","alerte"); return; }
  if(JSON.stringify(a) === JSON.stringify(etat.avatar||null)){ _fermerAvatar(); return; }

  const e = _avEtatServeur || {};
  if(!e.gratuit){
    if((e.credits|0) < (e.cout|0)){ journal(`Il te faut ${e.cout} ₡ pour changer d'apparence (tu en as ${e.credits}).`,"alerte"); return; }
    if(!confirm(`Changer d'apparence coûte ${e.cout} ₡.\n\nTon genre reste figé, et tu ne pourras pas y retoucher avant 6 mois. Confirmer ?`)) return;
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
  _avModal().hidden=true; _avBrouillon=null; _avObligatoire=false;
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
  // (les [data-choix] écrivent dans _avBrouillon, jamais dans etat.avatar)
  _avScrollsEcrire(m, _pos);   // rendre au joueur la position où il était
}
function _avRangee(titre, couche, n, avecAucun, g){
  let opts="";
  const cur = _avBrouillon || _AV_VIDE;
  if(avecAucun) opts+=`<button class="av-vig${!cur[couche]?" actif":""}" data-choix="${couche}:0" title="Aucun"><span class="av-x">∅</span></button>`;
  for(let i=1;i<=n;i++){
    const file = (couche==="pilosite") ? `${couche}/${i}` : `${couche}/${g}_${i}`;
    opts+=`<button class="av-vig${cur[couche]===i?" actif":""}" data-choix="${couche}:${i}"><img src="images/avatars/${file}.png" onerror="this.parentElement.style.display='none'"></button>`;
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
    .av-vig.actif{ border-color:var(--orange); box-shadow:0 0 0 2px var(--orange) inset; }
    .av-x{ color:var(--sourdine); font-size:22px; }
    .av-actions{ display:flex; gap:8px; }
    .av-ok{ border-color:var(--orange); color:var(--orange-hi); }
    .av-tarif{ margin:0 0 10px; }
  `;
  document.head.appendChild(st);
}
