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
    .emo-panneau{ display:flex; flex-wrap:wrap; gap:3px; width:100%; margin-top:5px;
                  background:#0f1830; border:1px solid var(--line); border-radius:8px; padding:6px; }
    .emo-panneau .mur-emo{ font-size:19px; line-height:1; padding:5px; background:none; border:0; cursor:pointer; border-radius:6px; }
    .emo-panneau .mur-emo:hover{ background:#1b2848; }
    .pp-jauges{ margin:8px 0 4px; display:flex; flex-direction:column; gap:4px; max-width:260px; }
    .pp-jauge{ display:flex; align-items:center; gap:7px; font-size:12px; color:var(--sourdine); }
    .pp-jauge > span:first-child{ min-width:44px; }
    .pp-jauge b{ min-width:34px; text-align:right; color:var(--texte); }
    .pp-jbar{ flex:1; height:7px; background:#0f1830; border-radius:4px; overflow:hidden; }
    .pp-jbar i{ display:block; height:100%; border-radius:4px; }
    .j-o2{ background:#4aa3ff; } .j-sante{ background:#48c98a; } .j-moral{ background:#e8a33d; }
    .pp-mort{ color:#ff5257; font-size:13px; margin:8px 0 4px; }
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

/* Palette dépliable, pour les champs SANS mise en forme (messages privés).
   ⚠ Ne pas y remettre les boutons B/I/U : les MP sont rendus bruts
   (comm.js ~328, simple échappement), les balises [b] s'y afficheraient
   littéralement. Seul le mur passe par _formatMur(). */
const EMOJIS_PALETTE = [
  "🙂","😀","😂","🤣","😅","😉","😍","😘","😎","🤔",
  "😐","😴","😢","😭","😡","😱","🤗","🙏","👍","👎",
  "👋","💪","🎉","🔥","❤️","💔","⭐","✅","❌","⚠️",
  "💰","⚙️","🌿","🍖","🔧","🚀"
];
function _paletteEmoji(outilsSel, champSel){
  const z=document.querySelector(outilsSel); if(!z) return;
  z.innerHTML = `<button type="button" class="mur-b emo-toggle" title="Emoji">😊</button>`
    + `<div class="emo-panneau" hidden>${EMOJIS_PALETTE.map(e=>`<button type="button" class="mur-emo" data-emo="${e}">${e}</button>`).join("")}</div>`;
  const champ=document.querySelector(champSel); if(!champ) return;
  const bt=z.querySelector(".emo-toggle"), pan=z.querySelector(".emo-panneau");
  bt.addEventListener("click", ()=>{ pan.hidden = !pan.hidden; if(!pan.hidden) champ.focus(); });
  pan.querySelectorAll("[data-emo]").forEach(b=>b.addEventListener("click",()=>{
    _insertAtCursor(champ, b.dataset.emo);
    champ.dispatchEvent(new Event("input"));   // prévient le brouillon et les compteurs
  }));
}
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
/* Jauges d'un profil : visibles pour soi-même et pour ses AMIS uniquement.
   Le serveur (RPC profil_jauges) vérifie le lien dans les deux sens ; le
   client n'a aucun moyen de forcer l'affichage. Elles ne sont volontairement
   PAS dans `profils_publics`, qui est lisible par tout le monde : un moral à 0
   divise les compétences par ~3, donc trahit la valeur au combat. */
async function _ppChargerJauges(id){
  const z=document.querySelector("#pp-jauges"); if(!z || !id) return;
  let d=null;
  try{ const r=await sb.rpc("profil_jauges",{ p_profil:id }); d=r.data; }
  catch(e){ if(typeof _catchLog==="function") _catchLog(e, "profil-page.js#jauges"); return; }
  if(!d || !d.ok) return;                       // non_ami : on n'affiche rien du tout
  if(d.mort){ z.innerHTML = `<p class="pp-mort">Personnage mort — en attente de résurrection.</p>`; return; }
  const barre=(lib,v,cls)=>`<div class="pp-jauge"><span>${lib}</span>
      <span class="pp-jbar"><i class="${cls}" style="width:${Math.max(0,Math.min(100,v))}%"></i></span>
      <b>${Math.round(v)}%</b></div>`;
  z.innerHTML = `<div class="pp-jauges">
      ${barre("O₂", d.o2, "j-o2")}
      ${barre("Santé", d.sante, "j-sante")}
      ${barre("Moral", d.moral, "j-moral")}
    </div>`;
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
  if(!moi && p.id){ try{ const {data}=await sb.rpc("credits_ami",{cible:p.id}); credits=data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "profil-page.js#1"); } }
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
        <div class="pp-nom">${echapper(p.nom)}${moi?" (toi)":(estAmi?` <span class="pp-ami">Ami(e) ✓</span>`:"")}</div>
        <p class="itip-gris"><span class="comm-dot ${enLigne?"on":"off"}"></span> ${enLigne?"En ligne":"Hors ligne"} · dernière activité le ${_dateHeure(p.derniere_activite)}</p>
        <p>Faction : <b>${_facNomComm(p.faction)}</b></p>
        <p>Formation : <b>${p.formation||"—"}</b></p>
        <p>Niveau : <b>${p.niveau}</b></p>
        ${credLigne}
        <div id="pp-jauges"></div>
        <div class="pp-actions">${actions}<button class="mini" data-terrain="${p.id}">Voir son terrain</button>${(typeof estAdmin==="function" && estAdmin()) ? `<button class="mini" data-jrnstaff="${p.id}">Journal du joueur</button>` : ""}</div>
      </div>
    </div>
    <div class="rep-badges" style="justify-content:center">${(typeof _badgesReput==="function")?_badgesReput(p.reputation||0, p.cercles||{}, p.faction):""}</div>
    <div id="pp-terrain" hidden></div>
    <div id="pp-journal-staff" hidden></div>
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
  // Modération : consultation du journal, réservée au staff (le bouton n'existe
  // que pour eux, et la RPC revérifie de toute façon).
  const bjs = m.querySelector("[data-jrnstaff]");
  if(bjs) bjs.addEventListener("click", ()=>_ppJournalStaff(bjs.dataset.jrnstaff));
  const bte = m.querySelector("[data-terrain]");
  if(bte) bte.addEventListener("click", ()=>{
    const z = document.querySelector("#pp-terrain");
    // Bascule : un second clic referme, pour ne pas encombrer la page.
    if(z && !z.hidden){ z.hidden = true; bte.textContent = "Voir son terrain"; return; }
    bte.textContent = "Masquer le terrain";
    _ppTerrain(bte.dataset.terrain);
  });
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
  _ppChargerJauges(p.id);   // asynchrone : le serveur décide si le lien d'amitié autorise l'affichage

  _ppChargerMur(p.id);
  _ppChargerAmis(p.id);
}
async function _ppChargerMur(profilId, sel){
  sel=sel||"#pp-mur-liste"; const z=document.querySelector(sel); if(!z) return;
  try{
    const lim = new Date(Date.now()-48*3600*1000).toISOString();          // les messages du mur expirent à 48 h
    const s=await sessionActuelle(); const moiId=s?s.user.id:null;
    if(moiId===profilId){ try{ await sb.from("mur").delete().eq("profil_id",profilId).lt("cree_le",lim); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "profil-page.js#2"); } }   // purge réelle sur mon propre mur
    const { data:msgs } = await sb.from("mur").select("*").eq("profil_id",profilId).gte("cree_le",lim).order("cree_le",{ascending:false}).limit(50);
    const rows=msgs||[]; const ids=[...new Set(rows.map(r=>r.auteur_id))];
    const noms={}; if(ids.length){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",ids); for(const pp of (pubs||[])) noms[pp.id]=pp.nom; }
    if(!rows.length){ z.innerHTML=`<p class="vide">Aucun message sur ce mur.</p>`; return; }
    z.innerHTML = rows.map(r=>{
      const auteur=noms[r.auteur_id]||"(inconnu)";
      const monMur = moiId && (profilId===moiId);
      const peutSuppr = monMur || (typeof estAdmin==="function" && estAdmin());
      return `<div class="mur-msg">${peutSuppr?`<button class="mur-x" data-murx="${r.id}" data-mien="${monMur?1:0}">×</button>`:""}<span class="mur-date itip-gris">${_dateHeure(r.cree_le)}</span> <button class="comm-nom" data-profil="${echapper(auteur||"")}">${echapper(auteur||"?")}</button> <span class="mur-txt">${_formatMur(r.texte)}</span></div>`;
    }).join("");
    z.querySelectorAll("[data-profil]").forEach(b=>b.addEventListener("click",()=>ouvrirPageProfil(b.dataset.profil)));
    z.querySelectorAll("[data-murx]").forEach(b=>b.addEventListener("click",async()=>{ try{ if(b.dataset.mien==="1"){ await sb.from("mur").delete().eq("id",b.dataset.murx); } else { await sb.rpc("admin_suppr_mur",{p_id:Number(b.dataset.murx)}); } }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "profil-page.js#3"); } _ppChargerMur(profilId, sel); }));
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


/* ===========================================================
   MODÉRATION — journal d'un joueur, visible par le staff.
   Le journal vit dans donnees.journal ; la RLS interdit (à raison) de lire le
   profil d'un autre, d'où la RPC admin_journal_joueur. Chaque consultation est
   journalisée dans admin_log : un outil de surveillance doit lui-même laisser
   une trace.
   =========================================================== */
function _ppStyleJournalStaff(){
  if(document.querySelector("#pp-jrnstaff-style")) return;
  const st=document.createElement("style"); st.id="pp-jrnstaff-style";
  st.textContent = `
    #pp-journal-staff{ margin-top:16px; border:1px solid var(--edge,#24344d);
      border-radius:10px; background:rgba(255,255,255,.03); padding:12px; }
    #pp-journal-staff[hidden]{ display:none !important; }
    #pp-journal-staff h3{ margin:0 0 8px; font-size:14px; color:var(--orange-hi,#ffb06a); }
    #pp-journal-staff .jl{ font-family:"Space Mono",monospace; font-size:11px;
      line-height:1.6; max-height:320px; overflow:auto; }
    #pp-journal-staff .jl div{ padding:2px 0; border-bottom:1px solid rgba(255,255,255,.05); }
    #pp-journal-staff .jd{ color:var(--texte-2,#9fb3c8); margin-right:6px; }
  `;
  document.head.appendChild(st);
}

async function _ppJournalStaff(profilId){
  const z = document.querySelector("#pp-journal-staff"); if(!z) return;
  _ppStyleJournalStaff();
  z.hidden = false;
  z.innerHTML = `<h3>Journal du joueur</h3><p class="itip-gris">Chargement…</p>`;
  try{
    const { data, error } = await sb.rpc("admin_journal_joueur", { p_profil: profilId, p_limite: 200 });
    if(error || !data || !data.ok){
      // On affiche la VRAIE cause : « consultation impossible » sans motif
      // oblige à deviner, et c'est exactement ce qu'on veut éviter.
      const motif = (data && data.err) || (error && error.message) || "réponse inattendue";
      console.error("[admin_journal_joueur]", motif, error || data);
      z.innerHTML = `<h3>Journal du joueur</h3><p class="itip-gris">Consultation impossible — ${String(motif).replace(/</g,"&lt;")}</p>`;
      return;
    }
    // Format réel d'une entrée : { d: horodatage, t: texte, cat: catégorie, type: gain|alerte|… }
    const cls = { alerte:"#ff8a3d", gain:"#8bd450", poste:"#6cc8ff" };
    const lignes = (data.journal||[])
      .slice()
      .sort((a,b)=>(b&&b.d||0)-(a&&a.d||0))          // plus récentes d'abord
      .map(e=>{
        if(typeof e === "string") return `<div>${e.replace(/</g,"&lt;")}</div>`;
        const q = e && e.d ? new Date(e.d).toLocaleString("fr-FR") : "—";
        const txt = (e && (e.t || e.txt || e.texte)) || JSON.stringify(e);
        const c = cls[e && e.type] || "";
        const cat = (e && e.cat) ? ` <span class="jd">[${e.cat}]</span>` : "";
        return `<div><span class="jd">${q}</span>${cat} <span${c?` style="color:${c}"`:""}>${String(txt).replace(/</g,"&lt;")}</span></div>`;
      }).join("");
    z.innerHTML = `<h3>Journal de ${echapper(data.nom)} <span class="itip-gris">(${(data.journal||[]).length} entrées, plus récentes d'abord)</span></h3>
      <div class="jl">${lignes || '<p class="itip-gris">Journal vide.</p>'}</div>`;
    if(data.total > (data.journal||[]).length){
      z.insertAdjacentHTML("beforeend",
        `<p class="itip-gris" style="margin:6px 0 0">${data.total} entrées au total, ${(data.journal||[]).length} affichées.</p>`);
    }
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "profil-page.js#journalStaff");
    z.innerHTML = `<h3>Journal du joueur</h3><p class="itip-gris">Erreur de chargement.</p>`;
  }
}


/* ===========================================================
   TERRAIN D'UN AUTRE JOUEUR — vitrine en lecture seule.
   Le terrain vit dans donnees.terrain, illisible pour un autre joueur (RLS) :
   la RPC profil_terrain n'expose que la DISPOSITION (type de structure, cases
   occupées, drones) et la faction, pour le fond. Aucun stock, aucun crédit.
   =========================================================== */
function _ppStyleTerrain(){
  if(document.querySelector("#pp-terrain-style")) return;
  const st=document.createElement("style"); st.id="pp-terrain-style";
  st.textContent = `
    #pp-terrain{ margin-top:16px; }
    #pp-terrain[hidden]{ display:none !important; }
    #pp-terrain h3{ margin:0 0 8px; font-size:14px; color:var(--orange-hi,#ffb06a); }
    /* ⚠ Aucun background ici : le fond vient de .terrain-grille (terrain.css),
       dont les chemins sont relatifs au dossier css/. Déclaré ici, « ../images »
       se résoudrait depuis la PAGE et ne trouverait rien. */
    #pp-terrain .ppt-grille{ position:relative; aspect-ratio:3/2; border-radius:var(--r-s,10px);
      display:grid; grid-template-columns:repeat(6,1fr); grid-template-rows:repeat(4,1fr);
      gap:0.5%; padding:3.4% 5%; }
    #pp-terrain .ppt-case{ position:relative; border:1px dashed rgba(150,180,220,.22);
      border-radius:8px; display:grid; place-items:center; }
    #pp-terrain .ppt-case.plein{ border:1px solid transparent; }
    #pp-terrain .ppt-case img{ width:100%; height:100%; object-fit:contain; display:block; }
    #pp-terrain .ppt-glyphe{ font-size:18px; }
  `;
  document.head.appendChild(st);
}

async function _ppTerrain(profilId){
  const z = document.querySelector("#pp-terrain"); if(!z) return;
  _ppStyleTerrain();
  z.hidden = false;
  z.innerHTML = `<h3>Terrain</h3><p class="itip-gris">Chargement…</p>`;
  try{
    const { data, error } = await sb.rpc("profil_terrain", { p_profil: profilId });
    if(error || !data || !data.ok){
      const motif = (data && data.err) || (error && error.message) || "réponse inattendue";
      z.innerHTML = `<h3>Terrain</h3><p class="itip-gris">Consultation impossible — ${String(motif).replace(/</g,"&lt;")}</p>`;
      return;
    }
    const IMGT = (typeof IMG !== "undefined") ? IMG : {};
    const NOMS = (typeof STRUCTURES !== "undefined") ? STRUCTURES : {};
    const parc = data.parcelles || [];
    const cases = [];
    for(let i=0;i<24;i++){
      const p = parc[i];
      if(!p || !p.type){ cases.push(`<div class="ppt-case"></div>`); continue; }
      const nom = (NOMS[p.type] && NOMS[p.type].nom) || p.type;
      let dedans = "";
      if(p.type === "maison"){
        // imgMaison() choisit tentes ou maisons selon estNomade(), qui lit NOTRE
        // faction : on reconstruit le chemin avec celle du joueur consulté.
        const std = ["cabane","petite_maison","maison","villa","palace"];
        const nom5 = ["tente1","tente2","tente3","tente4","tente5"];
        const pal = data.palier || 0;
        dedans = (pal >= 1 && pal <= 5)
          ? `<img src="images/maisons/${(data.faction==="nomades"?nom5:std)[pal-1]}.png" alt="Maison" onerror="this.replaceWith(document.createTextNode('🏠'))">`
          : `<span class="ppt-glyphe">🏠</span>`;
      } else if(IMGT[p.type]){
        dedans = `<img src="${IMGT[p.type]}" alt="${nom}">`;
      } else {
        dedans = `<span class="ppt-glyphe">⬢</span>`;
      }
      // Pas de badge de remplissage : la vitrine montre ce qui est BÂTI, le
      // détail du contenu ne regarde que le propriétaire. L'infobulle du
      // survol donne déjà le nom de la structure.
      cases.push(`<div class="ppt-case plein" title="${nom}">${dedans}</div>`);
    }
    const batis = parc.filter(x=>x && x.type).length;
    z.innerHTML = `<h3>Terrain de ${echapper(data.nom)} <span class="itip-gris">(${batis}/24 parcelles bâties)</span></h3>
      <div class="ppt-grille" data-faction="${data.faction||""}">${cases.join("")}</div>`;
    // Le fond de faction est géré par terrain.css, via l'attribut data-faction.
    const g = z.querySelector(".ppt-grille");
    if(g && data.faction) g.classList.add("terrain-grille");
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "profil-page.js#terrain");
    z.innerHTML = `<h3>Terrain</h3><p class="itip-gris">Erreur de chargement.</p>`;
  }
}
