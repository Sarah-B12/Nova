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
const AV_VISAGE     = { h:20, f:10 };  // visages disponibles par genre
const AV_CHEVEUX    = { h:0,  f:0 };
const AV_PILOSITE   = 0;               // pilosité : HOMME uniquement (la rangée est masquée pour les femmes)
const AV_ACCESSOIRE = { h:0, f:0 };    // accessoires par genre (morphologies différentes)

let _svgPortrait = null, _avStyleMonte = false;

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
  if(!m){ m=document.createElement("div"); m.id="avatar-modale"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) _fermerAvatar(); }); }
  return m;
}
function ouvrirAvatar(){
  _avStyle();
  if(!etat.avatar) etat.avatar = { genre:"h", visage:0, cheveux:0, pilosite:0, accessoire:0 };
  _renderAvModal(); _avModal().hidden=false;
}
function _fermerAvatar(){ _avModal().hidden=true; if(typeof sauvegarder==="function") sauvegarder(); if(typeof afficher==="function") afficher(); }
function _renderAvModal(){
  const m=_avModal(); const a=etat.avatar; const g=a.genre||"h";
  let h=`<div class="picker-cadre av-cadre"><div class="picker-tete"><b>Personnaliser l'avatar</b><button class="mini" data-fermer="1">Terminer</button></div>`;
  h+=`<div class="av-haut"><div class="av-portrait" id="av-portrait"></div>
      <div class="av-genre">
        <button class="mini${g==="h"?" actif":""}" data-genre="h">Homme</button>
        <button class="mini${g==="f"?" actif":""}"${AV_VISAGE.f?"":" disabled"} data-genre="f">Femme${AV_VISAGE.f?"":" · à venir"}</button>
      </div></div>`;
  h+=_avRangee("Visage","visage", AV_VISAGE[g]||0, false, g);
  h+=_avRangee("Cheveux","cheveux", AV_CHEVEUX[g]||0, true, g);
  if(g==="h") h+=_avRangee("Pilosité","pilosite", AV_PILOSITE, true, g);   // hommes uniquement
  h+=_avRangee("Accessoire","accessoire", AV_ACCESSOIRE[g]||0, true, g);
  h+=`</div>`;
  m.innerHTML=h;
  _majAvPortrait();
  m.querySelector("[data-fermer]").addEventListener("click", _fermerAvatar);
  m.querySelectorAll("[data-genre]").forEach(b=>b.addEventListener("click",()=>{
    if(b.disabled) return;
    // Les couches sont genrées : coiffure et accessoire du genre précédent n'ont
    // pas d'équivalent. On remet tout à zéro plutôt que d'afficher un trou.
    a.genre=b.dataset.genre; a.visage=0; a.cheveux=0; a.pilosite=0; a.accessoire=0;
    _majAvPortrait(); _renderAvModal(); }));
  m.querySelectorAll("[data-choix]").forEach(b=>b.addEventListener("click",()=>{ const p=b.dataset.choix.split(":"); a[p[0]]=parseInt(p[1],10); _majAvPortrait(); _renderAvModal(); }));
}
function _avRangee(titre, couche, n, avecAucun, g){
  let opts="";
  if(avecAucun) opts+=`<button class="av-vig${!etat.avatar[couche]?" actif":""}" data-choix="${couche}:0" title="Aucun"><span class="av-x">∅</span></button>`;
  for(let i=1;i<=n;i++){
    const file = (couche==="pilosite") ? `${couche}/${i}` : `${couche}/${g}_${i}`;
    opts+=`<button class="av-vig${etat.avatar[couche]===i?" actif":""}" data-choix="${couche}:${i}"><img src="images/avatars/${file}.png" onerror="this.parentElement.style.display='none'"></button>`;
  }
  if(!n) opts+=`<span class="itip-gris" style="align-self:center">à venir</span>`;
  return `<div class="av-rangee"><div class="av-rangee-tete">${titre}</div><div class="av-vigs">${opts}</div></div>`;
}
function _majAvPortrait(){
  const el=document.querySelector("#av-portrait"); if(!el) return;
  const L=_avCouches(etat.avatar);
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
  `;
  document.head.appendChild(st);
}
