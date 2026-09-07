/* ===========================================================
   PROFIL-PAGE — Page profil plein écran (visite d'un joueur).
   Overlay #page-profil ouvert en JS (SPA) : portrait, infos, dernière
   activité, description RP, crédits (entre amis), mur (public/amis),
   visiteurs 24 h, liste d'amis. Clic sur un pseudo => ouvre ce profil.
   =========================================================== */
// Style global (injecté par JS pour éviter tout cache CSS) : pseudos cliquables + croix de suppression.
(function(){ if(document.querySelector("#pp-style-global")) return;
  const st=document.createElement("style"); st.id="pp-style-global";
  st.textContent = `
    .comm-nom{ background:none!important; border:none!important; color:var(--bleu,#5aa8e6); cursor:pointer; font:inherit; text-decoration:underline; padding:0; font-weight:700; }
    .comm-nom:hover{ filter:brightness(1.2); }
    .mur-x{ background:none!important; border:none!important; color:#ff5257; cursor:pointer; font-size:15px; float:right; padding:0 4px; line-height:1.2; }
    .mur-ecrire{ margin-top:16px; }
    .mur-outils{ display:flex; align-items:center; gap:5px; flex-wrap:wrap; margin-bottom:8px; }
    .mur-b{ background:rgba(16,40,37,.7)!important; color:var(--texte,#dfe8f2)!important; border:1px solid var(--edge,#3a5a52)!important; border-radius:8px 3px 8px 3px; padding:4px 11px!important; cursor:pointer; font-size:14px; min-width:30px; }
    .mur-b:hover{ border-color:var(--orange,#ff8a3d)!important; }
  `;
  document.head.appendChild(st);
})();
// Brouillon du mur en cours d'écriture (survit aux redessins de la page profil).
let _murBrouillon = { id:null, txt:"" };
let _ppNom = null;
function _ppEl(){ let m=document.querySelector("#page-profil"); if(!m){ m=document.createElement("div"); m.id="page-profil"; m.hidden=true; document.body.appendChild(m); } return m; }
function fermerPageProfil(){ const m=document.querySelector("#page-profil"); if(m) m.hidden=true; _ppNom=null; }
let _ppStyleMonte=false;
function _ppStyle(){
  if(_ppStyleMonte) return; _ppStyleMonte=true;
  const st=document.createElement("style");
  st.textContent=`
    #page-profil{ position:fixed; inset:0; z-index:300; background:var(--fond,#0a1428); overflow:auto; padding:20px; }
    #page-profil[hidden]{ display:none; }
    .pp-wrap{ max-width:1000px; margin:0 auto; }
    .pp-tete{ display:flex; align-items:center; gap:14px; margin-bottom:16px; }
    .pp-tete h2{ margin:0; }
    .pp-haut{ display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; }
    .pp-haut .pp-portrait{ width:200px; aspect-ratio:3/4; flex:0 0 auto; }
    .pp-info{ flex:1; min-width:220px; }
    .pp-info p{ margin:4px 0; }
    .pp-nom{ font-size:22px; font-weight:700; color:var(--orange-hi,#ffb060); }
    .pp-ami{ color:#8bd450; font-size:14px; margin-left:6px; }
    .pp-actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
    .pp-desc{ white-space:pre-wrap; line-height:1.55; border:1px solid var(--line); border-radius:10px; padding:12px; background:rgba(15,24,48,.4); }
    .pp-bas{ display:grid; grid-template-columns:1fr 300px; gap:20px; margin-top:10px; align-items:start; }
    .pp-cote .pp-bloc{ border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:14px; }
    .pp-cote h3{ margin:0 0 8px; font-size:15px; }
    .pp-mur .mur-msg{ border:1px solid var(--line); border-radius:8px; padding:8px 10px; margin:5px 0; }
    .pp-mur .mur-x{ background:none; border:none; color:#ff5257; cursor:pointer; float:right; font-size:15px; }
    .pp-mur .mur-date{ font-size:11px; margin-right:6px; }
    @media(max-width:760px){ .pp-bas{ grid-template-columns:1fr; } }
  `;
  document.head.appendChild(st);
}
const MUR_EMOS = ["😀","😂","😍","😎","😢","😠","😅","🙂","❤️","🔥","🎉","😏"];
function _remplirBarreMur(sel){
  const z=document.querySelector(sel); if(!z) return;
  z.innerHTML = `<button type="button" class="mur-b" data-wrap="b"><b>B</b></button>`
    + `<button type="button" class="mur-b" data-wrap="i"><i>I</i></button>`
    + `<button type="button" class="mur-b" data-wrap="u"><u>U</u></button>`
    + `<span class="mur-emos">${MUR_EMOS.map(e=>`<button type="button" class="mur-emo" data-emo="${e}">${e}</button>`).join("")}</span>`;
}
function _wrapSelection(ta, pre, post){
  const s=ta.selectionStart, e=ta.selectionEnd, v=ta.value, sel=v.slice(s,e);
  ta.value = v.slice(0,s)+pre+sel+post+v.slice(e);
  ta.focus(); ta.selectionStart=ta.selectionEnd = sel ? (e+pre.length+post.length) : (s+pre.length);
}
function _insertAtCursor(ta, txt){
  const s=ta.selectionStart, e=ta.selectionEnd, v=ta.value;
  ta.value = v.slice(0,s)+txt+v.slice(e); ta.focus(); ta.selectionStart=ta.selectionEnd=s+txt.length;
}
function _brancherOutilsMur(champSel, outilsSel){
  const champ=document.querySelector(champSel), outils=document.querySelector(outilsSel);
  if(!champ || !outils) return;
  const notif=()=>champ.dispatchEvent(new Event("input"));
  outils.querySelectorAll("[data-wrap]").forEach(b=>b.addEventListener("click",()=>{ const t=b.dataset.wrap; _wrapSelection(champ,`[${t}]`,`[/${t}]`); notif(); }));
  outils.querySelectorAll("[data-emo]").forEach(b=>b.addEventListener("click",()=>{ _insertAtCursor(champ, b.dataset.emo); notif(); }));
}
// Rendu d'un message de mur : échappe le HTML, puis convertit [b][i][u] et les retours ligne.
function _formatMur(t){
  let s=(t||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  s=s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi,"<b>$1</b>")
     .replace(/\[i\]([\s\S]*?)\[\/i\]/gi,"<i>$1</i>")
     .replace(/\[u\]([\s\S]*?)\[\/u\]/gi,"<u>$1</u>");
  return s.replace(/\n/g,"<br>");
}
function _brancherCompteurMur(champSel, compteSel, max){
  const champ=document.querySelector(champSel), cpt=document.querySelector(compteSel);
  if(!champ || !cpt) return;
  const maj=()=>{ const n=(champ.value||"").length; cpt.textContent=n; if(cpt.parentElement) cpt.parentElement.classList.toggle("trop", n>max); };
  champ.addEventListener("input", maj); maj();
}
async function ouvrirPageProfil(nom){
  if(!nom) return;
  _ppStyle(); if(typeof _avStyle==="function") _avStyle();
  const m=_ppEl(); m.hidden=false; _ppNom=nom;
  m.innerHTML = `<div class="pp-wrap"><div class="pp-tete"><button class="mini" id="pp-retour">← Retour</button><h2>Profil</h2></div><p class="vide">Chargement…</p></div>`;
  m.querySelector("#pp-retour").addEventListener("click", fermerPageProfil);

  const moi = nom===etat.nom;
  let p;
  if(moi){ p={ id:_monId, nom:etat.nom, faction:etat.faction, formation:(typeof _nomFormation==="function"?_nomFormation():null), niveau:etat.niveau, avatar:etat.avatar, description_rp:etat.description, derniere_activite:new Date().toISOString(), mur_public:(etat.murOuvertA==="tous"), reputation:(etat.reputation||0), cercles:(etat.cercles||{}) }; }
  else { p = (typeof _chargerProfilComplet==="function") ? await _chargerProfilComplet(nom) : null; }
  if(_ppNom!==nom) return;                                  // l'utilisateur a ouvert un autre profil entre-temps
  const back=()=>{ const r=m.querySelector("#pp-retour"); if(r) r.addEventListener("click", fermerPageProfil); };
  if(!p){ m.querySelector(".pp-wrap").innerHTML = `<div class="pp-tete"><button class="mini" id="pp-retour">← Retour</button><h2>Profil</h2></div><p class="vide">Profil indisponible.</p>`; back(); return; }

  const s = (typeof sessionActuelle==="function") ? await sessionActuelle() : null;
  if(s) _monId=s.user.id;

  let credits = moi ? etat.credits : null;
  if(!moi && p.id){ try{ const {data}=await sb.rpc("credits_ami",{cible:p.id}); credits=data; }catch(e){} }
  const estAmi = !moi && credits!=null;
  const estBloque = etat.bloques.includes(nom);
  const enLigne = (typeof _presenceEnLigne==="function") ? _presenceEnLigne(p.derniere_activite) : false;
  const L = (typeof _avCouches==="function") ? _avCouches(p.avatar) : [];
  const portrait = L.length ? L.map(c=>_avImg(c,"av-couche")).join("") : `<div class="av-x-grand">?</div>`;
  const desc = (p.description_rp && p.description_rp.trim()) ? ((typeof renduDescription==="function")?renduDescription(p.description_rp):p.description_rp.replace(/</g,"&lt;")) : `<p class="vide">Aucune description.</p>`;
  const credLigne = moi ? `<p>Crédits : <b>${etat.credits} ₡</b></p>` : (estAmi ? `<p>Crédits : <b>${credits} ₡</b></p>` : `<p class="itip-gris">Crédits visibles entre amis.</p>`);
  const actions = moi ? "" : (estBloque ? `<button class="mini" data-debloq="${nom}">Débloquer</button>` : `${estAmi?`<button class="mini danger" data-retire="${nom}">Retirer des amis</button>`:`<button class="mini" data-demande="${nom}">Ajouter en ami</button>`}<button class="mini" data-message="${nom}">Message</button><button class="mini danger" data-bloq="${nom}">Bloquer</button>`);
  const peutEcrire = moi || p.mur_public || estAmi;

  m.innerHTML = `<div class="pp-wrap">
    <div class="pp-tete"><button class="mini" id="pp-retour">← Retour</button><h2>Profil</h2></div>
    <div class="pp-haut">
      <div class="pp-portrait av-portrait">${portrait}</div>
      <div class="pp-info">
        <div class="pp-nom">${p.nom}${moi?" (toi)":(estAmi?` <span class="pp-ami">Ami(e) ✓</span>`:"")}</div>
        <p class="itip-gris"><span class="comm-dot ${enLigne?"on":"off"}"></span> ${enLigne?"En ligne":"Hors ligne"} · dernière activité le ${_dateHeure(p.derniere_activite)}</p>
        <p>Faction : <b>${_facNomComm(p.faction)}</b></p>
        <p>Formation : <b>${p.formation||"—"}</b></p>
        <p>Niveau : <b>${p.niveau}</b></p>
        ${credLigne}
        <div class="pp-actions">${actions}</div>
      </div>
    </div>
    <div class="rep-badges" style="justify-content:center">${(typeof _badgesReput==="function")?_badgesReput(p.reputation||0, p.cercles||{}):""}</div>
    <h2 style="margin-top:20px">Description RP</h2>
    <div class="pp-desc">${desc}</div>
    <div class="pp-bas">
      <div class="pp-mur">
        <h2>Mur</h2>
        <div id="pp-mur-liste"><p class="vide">Chargement…</p></div>
        ${peutEcrire ? `<div class="mur-ecrire"><div class="mur-outils" id="pp-mur-outils"></div><textarea id="pp-mur-champ" rows="3" placeholder="Écrire sur le mur de ${p.nom}…"></textarea><div class="mur-bas"><span class="mur-compteur"><span id="pp-mur-compte">0</span>/500</span><button class="mini" id="pp-mur-publier">Publier</button></div></div>` : `<p class="itip-gris">Le mur de ${p.nom} est réservé à ses amis.</p>`}
      </div>
      <div class="pp-cote">
        <div class="pp-bloc"><h3>Amis</h3><div id="pp-amis"><p class="vide">…</p></div></div>
      </div>
    </div>
  </div>`;

  m.querySelector("#pp-retour").addEventListener("click", fermerPageProfil);
  const act=(sel,fn)=>{ const b=m.querySelector(sel); if(b) b.addEventListener("click",()=>fn(b.dataset.demande||b.dataset.bloq||b.dataset.debloq||b.dataset.retire)); };
  act("[data-demande]", async v=>{ await envoyerDemande(v); ouvrirPageProfil(nom); });
  act("[data-retire]",  async v=>{ await retirerAmi(v); ouvrirPageProfil(nom); });
  act("[data-debloq]",  v=>{ debloquerJoueur(v); ouvrirPageProfil(nom); });
  act("[data-bloq]",    v=>{ bloquerJoueur(v); fermerPageProfil(); });
  const bmsg=m.querySelector("[data-message]"); if(bmsg) bmsg.addEventListener("click",()=>{ fermerPageProfil(); _msgPrefill={dest:nom,obj:""}; msgVue="ecrire"; const c=document.querySelector('[data-onglet="comm"]'); if(c) c.click(); if(typeof changerComm==="function") changerComm("messages"); });
  const ch0=m.querySelector("#pp-mur-champ");
  if(ch0){ // brouillon par profil visité : on ne mélange pas les murs
    if(_murBrouillon.id===p.id && _murBrouillon.txt) ch0.value=_murBrouillon.txt;
    ch0.addEventListener("input", ()=>{ _murBrouillon={ id:p.id, txt:ch0.value }; });
  }
  const pub=m.querySelector("#pp-mur-publier"); if(pub) pub.addEventListener("click",()=>_ppPublierMur(p.id));
  const champ=m.querySelector("#pp-mur-champ"); if(champ) champ.addEventListener("keydown",e=>{ if(e.key==="Enter" && (e.ctrlKey||e.metaKey)) _ppPublierMur(p.id); });
  _brancherCompteurMur("#pp-mur-champ","#pp-mur-compte",500);
  _remplirBarreMur("#pp-mur-outils"); _brancherOutilsMur("#pp-mur-champ","#pp-mur-outils");

  _ppChargerMur(p.id);
  _ppChargerAmis(p.id);
}
async function _ppChargerMur(profilId, sel){
  sel=sel||"#pp-mur-liste"; const z=document.querySelector(sel); if(!z) return;
  try{
    const lim = new Date(Date.now()-48*3600*1000).toISOString();          // les messages du mur expirent à 48 h
    const s=await sessionActuelle(); const moiId=s?s.user.id:null;
    if(moiId===profilId){ try{ await sb.from("mur").delete().eq("profil_id",profilId).lt("cree_le",lim); }catch(e){} }   // purge réelle sur mon propre mur
    const { data:msgs } = await sb.from("mur").select("*").eq("profil_id",profilId).gte("cree_le",lim).order("cree_le",{ascending:false}).limit(50);
    const rows=msgs||[]; const ids=[...new Set(rows.map(r=>r.auteur_id))];
    const noms={}; if(ids.length){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",ids); for(const pp of (pubs||[])) noms[pp.id]=pp.nom; }
    if(!rows.length){ z.innerHTML=`<p class="vide">Aucun message sur ce mur.</p>`; return; }
    z.innerHTML = rows.map(r=>{
      const auteur=noms[r.auteur_id]||"(inconnu)";
      const monMur = moiId && (profilId===moiId);
      const peutSuppr = monMur || (typeof estAdmin==="function" && estAdmin());
      return `<div class="mur-msg">${peutSuppr?`<button class="mur-x" data-murx="${r.id}" data-mien="${monMur?1:0}">×</button>`:""}<span class="mur-date itip-gris">${_dateHeure(r.cree_le)}</span> <button class="comm-nom" data-profil="${auteur}">${auteur}</button> <span class="mur-txt">${_formatMur(r.texte)}</span></div>`;
    }).join("");
    z.querySelectorAll("[data-profil]").forEach(b=>b.addEventListener("click",()=>ouvrirPageProfil(b.dataset.profil)));
    z.querySelectorAll("[data-murx]").forEach(b=>b.addEventListener("click",async()=>{ try{ if(b.dataset.mien==="1"){ await sb.from("mur").delete().eq("id",b.dataset.murx); } else { await sb.rpc("admin_suppr_mur",{p_id:Number(b.dataset.murx)}); } }catch(e){} _ppChargerMur(profilId, sel); }));
  }catch(e){ console.warn("[profil] mur:",e.message); z.innerHTML=`<p class="vide">Mur indisponible.</p>`; }
}
async function _ppPublierMur(profilId){
  const champ=document.querySelector("#pp-mur-champ"); if(!champ) return;
  _murBrouillon={ id:null, txt:"" };
  const txt=(champ.value||"").trim(); if(!txt) return;
  if(txt.length>500){ journal("Message trop long (500 caractères maximum).","alerte"); return; }
  const s=await sessionActuelle(); if(!s){ journal("Connecte-toi.","alerte"); return; }
  const { error } = await sb.from("mur").insert({ profil_id:profilId, auteur_id:s.user.id, texte:txt });
  if(error){ console.warn("[profil] publier mur:",error.message); journal("Impossible d'écrire sur ce mur.","alerte"); return; }
  champ.value=""; _ppChargerMur(profilId);
}
async function _ppChargerAmis(profilId){
  const z=document.querySelector("#pp-amis"); if(!z) return;
  try{
    const { data:la } = await sb.rpc("amis_de",{cible:profilId});
    const noms=(la||[]).map(x=>x.nom);
    if(!noms.length){ z.innerHTML=`<p class="vide">Aucun ami.</p>`; return; }
    z.innerHTML = noms.map(n=>`<button class="comm-nom" data-profil="${n}">${n}</button>`).join(" · ");
    z.querySelectorAll("[data-profil]").forEach(b=>b.addEventListener("click",()=>ouvrirPageProfil(b.dataset.profil)));
  }catch(e){ z.innerHTML=`<p class="vide">—</p>`; }
}
