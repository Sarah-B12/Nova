/* ===========================================================
   COMM — Communication. 3 sous-onglets : Amis, Messages, Annonces.
   Multijoueur simulé (annuaire de joueurs fictifs) en attendant le backend.
   Ce module : sous-onglets + LISTE D'AMIS (recherche, profil, ajout, blocage).
   =========================================================== */

// Annuaire simulé (remplacé par le backend le moment venu).
const SIM_JOUEURS = [
  { nom:"Kael-42",  niveau:12, credits:1830, metier:"Fabricant d'armes", faction:"ignis",        enLigne:true  },
  { nom:"Vira-19",  niveau:7,  credits:640,  metier:"Biotech",           faction:"cultivateurs", enLigne:false },
  { nom:"Toz-88",   niveau:15, credits:3120, metier:"Ingénieur",         faction:"rouage",       enLigne:true  },
  { nom:"Sela-23",  niveau:4,  credits:210,  metier:"Constructeur",      faction:"toundra",      enLigne:false },
  { nom:"Brann-60", niveau:9,  credits:980,  metier:"Fabricant d'armes", faction:"nomades",      enLigne:true  },
  { nom:"Nyx-7",    niveau:21, credits:5400, metier:"Ingénieur",         faction:"ignis",        enLigne:false },
  { nom:"Lume-31",  niveau:6,  credits:475,  metier:"Biotech",           faction:"cultivateurs", enLigne:true  },
  { nom:"Orin-14",  niveau:11, credits:1520, metier:"Constructeur",      faction:"toundra",      enLigne:false },
  { nom:"Yara-52",  niveau:8,  credits:860,  metier:"Biotech",           faction:"nomades",      enLigne:true  },
  { nom:"Dax-9",    niveau:13, credits:2240, metier:"Fabricant d'armes", faction:"rouage",       enLigne:false }
];
function _joueurSim(nom){ return SIM_JOUEURS.find(j=>j.nom===nom) || null; }
function _facNomComm(fid){ const f=(typeof FACTIONS!=="undefined")?FACTIONS.find(x=>x.id===fid):null; return f?f.nom:"—"; }

let commVue = "amis";
let _commQ = "";
let _commRecherche = null;   // null = pas de recherche ; [] = aucun résultat

function changerComm(c){
  commVue = c;
  document.querySelectorAll("#comm-nav .comm-lien").forEach(b=>b.classList.toggle("actif", b.dataset.comm===c));
  majComm();
}

function majComm(){
  const z=document.querySelector("#comm-vue"); if(!z) return;
  _commStyle();
  if(commVue==="amis"){ z.innerHTML = vueAmis(); brancherAmis(z); return; }
  if(commVue==="messages"){ _purgerMessages(); _semerMessages(); z.innerHTML = vueMessages(); brancherMessages(z); return; }
  if(commVue==="annonces"){ _purgerAnnonces(); z.innerHTML = vueAnnonces(); brancherAnnonces(z); return; }
}

/* ---------- Amis ---------- */
function vueAmis(){
  let h = `<div class="comm-recherche"><input id="ami-q" placeholder="Rechercher un joueur par pseudo…" value="${_commQ.replace(/"/g,'&quot;')}"><button class="mini" id="ami-chercher">Chercher</button></div>`;

  if(_commRecherche!==null){
    h += `<h4 class="comm-titre">Résultats</h4>`;
    if(!_commRecherche.length) h += `<p class="vide">Aucun joueur trouvé pour « ${_commQ} ».</p>`;
    for(const j of _commRecherche){
      h += _ligneJoueur(j, { recherche:true, estAmi:etat.amis.includes(j.nom), estBloque:etat.bloques.includes(j.nom), moi:j.nom===etat.nom });
    }
  }

  h += `<h4 class="comm-titre">Mes amis (${etat.amis.length})</h4>`;
  if(!etat.amis.length) h += `<p class="vide">Aucun ami pour l'instant. Cherche quelqu'un ci-dessus, ouvre son profil, ajoute-le.</p>`;
  for(const nom of etat.amis){
    const j=_joueurSim(nom) || { nom, niveau:"?", credits:"?", metier:"—", faction:null, enLigne:false };
    h += _ligneJoueur(j, { ami:true });
  }

  if(etat.bloques.length){
    h += `<h4 class="comm-titre">Bloqués (${etat.bloques.length})</h4>`;
    h += `<p class="itip-gris" style="margin:2px 0 6px">Un joueur bloqué ne peut plus t'envoyer de messages ni écrire sur ton chat perso.</p>`;
    for(const nom of etat.bloques){
      h += `<div class="comm-ligne"><span class="comm-dot off"></span><button class="comm-nom" data-profil="${nom}">${nom}</button><span class="comm-btns"><button class="mini" data-debloq="${nom}">Débloquer</button></span></div>`;
    }
  }
  return h;
}
function _ligneJoueur(j, o){
  const dot = `<span class="comm-dot ${j.enLigne?"on":"off"}" title="${j.enLigne?"en ligne":"hors ligne"}"></span>`;
  const fac = _facNomComm(j.faction);
  const infos = o.ami
    ? `<span class="comm-meta">niv. ${j.niveau} · ${j.credits} ₡ · ${j.metier||"—"} · ${fac}</span>`
    : `<span class="comm-meta">niv. ${j.niveau} · ${j.metier||"—"} · ${fac}</span>`;
  let btns = "";
  if(o.recherche){
    if(o.moi) btns = `<span class="itip-gris">c'est toi</span>`;
    else if(o.estBloque) btns = `<button class="mini" data-debloq="${j.nom}">Débloquer</button>`;
    else btns = `${o.estAmi?`<span class="itip-gris">déjà ami</span>`:`<button class="mini" data-ajout="${j.nom}">Ajouter</button>`}<button class="mini danger" data-bloq="${j.nom}">Bloquer</button>`;
  } else if(o.ami){
    btns = `<button class="mini danger" data-retire="${j.nom}">Retirer</button>`;
  }
  return `<div class="comm-ligne">${dot}<button class="comm-nom" data-profil="${j.nom}">${j.nom}</button>${infos}<span class="comm-btns">${btns}</span></div>`;
}
function brancherAmis(z){
  const bc=z.querySelector("#ami-chercher"), qi=z.querySelector("#ami-q");
  const go=()=>{ _commQ=(qi.value||"").trim(); _commRecherche = _commQ ? SIM_JOUEURS.filter(j=>j.nom.toLowerCase().includes(_commQ.toLowerCase())) : null; majComm(); };
  if(bc) bc.addEventListener("click", go);
  if(qi) qi.addEventListener("keydown", e=>{ if(e.key==="Enter") go(); });
  z.querySelectorAll("[data-profil]").forEach(b=>b.addEventListener("click",()=>voirProfilJoueur(b.dataset.profil)));
  z.querySelectorAll("[data-ajout]").forEach(b=>b.addEventListener("click",()=>ajouterAmi(b.dataset.ajout)));
  z.querySelectorAll("[data-bloq]").forEach(b=>b.addEventListener("click",()=>bloquerJoueur(b.dataset.bloq)));
  z.querySelectorAll("[data-debloq]").forEach(b=>b.addEventListener("click",()=>debloquerJoueur(b.dataset.debloq)));
  z.querySelectorAll("[data-retire]").forEach(b=>b.addEventListener("click",()=>retirerAmi(b.dataset.retire)));
}
function ajouterAmi(nom){
  if(nom===etat.nom) return;
  if(etat.bloques.includes(nom)){ journal(`${nom} est bloqué — débloque-le d'abord.`,"alerte"); return; }
  if(!etat.amis.includes(nom)){ etat.amis.push(nom); journal(`${nom} ajouté à tes amis.`,"gain"); }
  sauvegarder(); majComm();
}
function retirerAmi(nom){
  etat.amis = etat.amis.filter(n=>n!==nom); journal(`${nom} retiré de tes amis.`,"alerte"); sauvegarder(); majComm();
}
function bloquerJoueur(nom){
  if(nom===etat.nom) return;
  etat.amis = etat.amis.filter(n=>n!==nom);
  if(!etat.bloques.includes(nom)) etat.bloques.push(nom);
  journal(`${nom} bloqué : il ne pourra plus te contacter.`,"alerte"); sauvegarder(); majComm();
}
function debloquerJoueur(nom){
  etat.bloques = etat.bloques.filter(n=>n!==nom); journal(`${nom} débloqué.`,"gain"); sauvegarder(); majComm();
}

/* ---------- Profil (modale) ---------- */
function _commProfil(){ let m=document.querySelector("#comm-profil"); if(!m){ m=document.createElement("div"); m.id="comm-profil"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) m.hidden=true; }); } return m; }
function voirProfilJoueur(nom){
  const j=_joueurSim(nom);
  const m=_commProfil();
  const estAmi=etat.amis.includes(nom), estBloque=etat.bloques.includes(nom), moi=nom===etat.nom;
  if(!j && !moi){ // ami hors annuaire
    m.innerHTML = `<div class="picker-cadre"><div class="picker-tete"><b>${nom}</b><button class="mini" data-fermer="1">Fermer</button></div><p class="vide">Profil indisponible.</p></div>`;
  } else {
    const p = moi ? { nom:etat.nom, niveau:etat.niveau, credits:etat.credits, metier:(etat.metier||"—"), faction:etat.faction, enLigne:true } : j;
    m.innerHTML = `<div class="picker-cadre"><div class="picker-tete"><b>${p.nom}${moi?" (toi)":""}</b><button class="mini" data-fermer="1">Fermer</button></div>
      <p><span class="comm-dot ${p.enLigne?"on":"off"}"></span> ${p.enLigne?"En ligne":"Hors ligne"}</p>
      <p>Niveau <b>${p.niveau}</b> · ${p.metier||"—"} · ${_facNomComm(p.faction)}</p>
      ${(estAmi||moi)?`<p>Crédits : <b>${p.credits} ₡</b></p>`:`<p class="itip-gris">Ajoute ${p.nom} en ami pour voir ses crédits.</p>`}
      <p class="vide" style="margin-top:8px">Profil public (description RP, mur…) — la version complète viendra avec le multijoueur.</p>
      ${!moi?`<div class="actions" style="margin-top:8px">${estBloque?`<button class="mini" data-debloq="${p.nom}">Débloquer</button>`:`${estAmi?`<button class="mini danger" data-retire="${p.nom}">Retirer des amis</button>`:`<button class="mini" data-ajout="${p.nom}">Ajouter en ami</button>`}<button class="mini danger" data-bloq="${p.nom}">Bloquer</button>`}</div>`:""}
    </div>`;
  }
  m.hidden=false;
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
  const act=(sel,fn)=>{ const b=m.querySelector(sel); if(b) b.addEventListener("click",()=>{ fn(b.dataset.ajout||b.dataset.bloq||b.dataset.debloq||b.dataset.retire); m.hidden=true; }); };
  act("[data-ajout]", ajouterAmi); act("[data-bloq]", bloquerJoueur); act("[data-debloq]", debloquerJoueur); act("[data-retire]", retirerAmi);
}

/* ---------- Messages ---------- */
const MSG_MAX = 20;
const MSG_JOURS = 30;
let msgVue = "recus";
let _msgPrefill = null;
function _mjm(){ return (typeof JOUR_MS!=="undefined")?JOUR_MS:86400000; }
function _msgDate(d){ const j=Math.floor((Date.now()-d)/_mjm()); if(j<=0) return "aujourd'hui"; if(j===1) return "hier"; return `il y a ${j} j`; }
function _purgerMessages(){
  const lim=Date.now()-MSG_JOURS*_mjm();
  if(!Array.isArray(etat.msgRecus)) etat.msgRecus=[];
  if(!Array.isArray(etat.msgEnvoyes)) etat.msgEnvoyes=[];
  etat.msgRecus=etat.msgRecus.filter(m=>m.date>=lim).slice(0,MSG_MAX);
  etat.msgEnvoyes=etat.msgEnvoyes.filter(m=>m.date>=lim).slice(0,MSG_MAX);
}
function _semerMessages(){
  if(etat.msgSemes) return; etat.msgSemes=true;
  if(!Array.isArray(etat.msgRecus)) etat.msgRecus=[];
  etat.msgRecus.unshift(
    { id:Date.now()-2, de:"Kael-42", objet:"Bienvenue à Silène", texte:"Salut ! J'ai vu que tu débarquais. Si tu cherches du métal volcanique, passe me voir à Ignis. Et un conseil : ne te précipite pas, ce caillou récompense les patients. Bonne chance.", date:Date.now()-1*_mjm(), lu:false },
    { id:Date.now()-1, de:"Vira-19", objet:"Échange ?", texte:"J'ai des kits de soin en trop. Tu fabriques quoi de ton côté ? On pourrait s'arranger, j'aime bien tisser des liens avec les nouveaux.", date:Date.now()-2*_mjm(), lu:false }
  );
  if(typeof sauvegarder==="function") sauvegarder();
}
function vueMessages(){
  const nR=etat.msgRecus.length, nE=etat.msgEnvoyes.length, nNL=etat.msgRecus.filter(m=>!m.lu).length;
  let h=`<div class="msg-nav">`
    + `<button class="msg-lien${msgVue==="recus"?" actif":""}" data-msg="recus">Réception (${nR}/${MSG_MAX})${nNL?` · ${nNL} non lu${nNL>1?"s":""}`:""}</button>`
    + `<button class="msg-lien${msgVue==="envoyes"?" actif":""}" data-msg="envoyes">Envoyés (${nE}/${MSG_MAX})</button>`
    + `<button class="msg-lien${msgVue==="ecrire"?" actif":""}" data-msg="ecrire">Écrire</button></div>`;
  h+=`<p class="itip-gris" style="margin:0 0 8px">Messages conservés <b>${MSG_JOURS} jours</b> · chaque boîte contient <b>${MSG_MAX} messages</b> au maximum.</p>`;
  if(msgVue==="ecrire"){
    return h+`<div class="msg-ecrire">
      <input id="msg-dest" placeholder="Destinataire (pseudo)" maxlength="24">
      <input id="msg-obj" placeholder="Objet" maxlength="60">
      <textarea id="msg-texte" placeholder="Ton message…" maxlength="1000" rows="6"></textarea>
      <button class="mini" id="msg-envoyer">Envoyer</button></div>`;
  }
  const liste = msgVue==="recus"?etat.msgRecus:etat.msgEnvoyes;
  if(!liste.length) return h+`<p class="vide">Aucun message ${msgVue==="recus"?"reçu":"envoyé"}.</p>`;
  h+=`<div class="msg-liste">`;
  liste.forEach((m,i)=>{
    const qui = msgVue==="recus"?("De "+m.de):("À "+m.a);
    h+=`<button class="msg-item${(msgVue==="recus"&&!m.lu)?" nonlu":""}" data-open="${i}"><span class="msg-obj">${(m.objet||"(sans objet)").replace(/</g,"&lt;")}</span><span class="msg-qui">${qui} · ${_msgDate(m.date)}</span></button>`;
  });
  return h+`</div>`;
}
function brancherMessages(z){
  z.querySelectorAll(".msg-lien").forEach(b=>b.addEventListener("click",()=>{ msgVue=b.dataset.msg; majComm(); }));
  z.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>ouvrirMessage(msgVue, parseInt(b.dataset.open,10))));
  const env=z.querySelector("#msg-envoyer"); if(env) env.addEventListener("click", envoyerMessage);
  if(_msgPrefill){ const d=z.querySelector("#msg-dest"), o=z.querySelector("#msg-obj"); if(d) d.value=_msgPrefill.dest||""; if(o) o.value=_msgPrefill.obj||""; _msgPrefill=null; }
}
function envoyerMessage(){
  const dest=(document.querySelector("#msg-dest").value||"").trim();
  const obj=(document.querySelector("#msg-obj").value||"").trim();
  const txt=(document.querySelector("#msg-texte").value||"").trim();
  if(!dest){ journal("Indique un destinataire.","alerte"); return; }
  if(dest===etat.nom){ journal("Tu ne peux pas t'écrire à toi-même.","alerte"); return; }
  if(!txt){ journal("Le message est vide.","alerte"); return; }
  if(etat.bloques.includes(dest)){ journal(`${dest} est dans tes bloqués — débloque-le pour lui écrire.`,"alerte"); return; }
  if(etat.msgEnvoyes.length>=MSG_MAX){ journal(`Boîte d'envoi pleine (${MSG_MAX} max) — supprime d'anciens messages.`,"alerte"); return; }
  etat.msgEnvoyes.unshift({ id:Date.now(), a:dest, objet:obj, texte:txt, date:Date.now() });
  journal(`Message envoyé à ${dest}.`,"gain");
  if(typeof sauvegarder==="function") sauvegarder();
  msgVue="envoyes"; majComm();
}
function _msgModal(){ let m=document.querySelector("#comm-msg"); if(!m){ m=document.createElement("div"); m.id="comm-msg"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m){ m.hidden=true; majComm(); } }); } return m; }
function ouvrirMessage(type, i){
  const arr=(type==="recus"?etat.msgRecus:etat.msgEnvoyes); const m=arr[i]; if(!m) return;
  if(type==="recus" && !m.lu){ m.lu=true; if(typeof sauvegarder==="function") sauvegarder(); }
  const modal=_msgModal();
  const qui = type==="recus"?("De <b>"+m.de+"</b>"):("À <b>"+m.a+"</b>");
  modal.innerHTML=`<div class="picker-cadre"><div class="picker-tete"><b>${(m.objet||"(sans objet)").replace(/</g,"&lt;")}</b><button class="mini" data-fermer="1">Fermer</button></div>
    <p class="itip-gris">${qui} · ${_msgDate(m.date)}</p>
    <p style="white-space:pre-wrap; line-height:1.55">${(m.texte||"").replace(/</g,"&lt;")}</p>
    <div class="actions" style="margin-top:10px">${type==="recus"?`<button class="mini" data-rep="1">Répondre</button>`:""}<button class="mini danger" data-suppr="1">Supprimer</button></div></div>`;
  modal.hidden=false;
  modal.querySelector("[data-fermer]").addEventListener("click",()=>{ modal.hidden=true; majComm(); });
  const rp=modal.querySelector("[data-rep]"); if(rp) rp.addEventListener("click",()=>{ _msgPrefill={ dest:m.de, obj:(/^re\s*:/i.test(m.objet||"")?m.objet:"Re : "+(m.objet||"")) }; modal.hidden=true; msgVue="ecrire"; majComm(); });
  const sp=modal.querySelector("[data-suppr]"); if(sp) sp.addEventListener("click",()=>{ arr.splice(i,1); if(typeof sauvegarder==="function") sauvegarder(); modal.hidden=true; journal("Message supprimé.","alerte"); majComm(); });
}

/* ---------- Petites annonces ---------- */
const ANNONCE_MAX = 5;
const ANNONCE_JOURS = 30;
const SIM_ANNONCES = [
  { objet:"Vends métal volcanique", texte:"Gros lot de Cendrite et Voltane à écouler, prix à débattre. Passez me voir à Ignis.", auteur:"Kael-42", faction:"ignis" },
  { objet:"Cherche kits de soin", texte:"J'échange rations fraîches et Sylve contre des kits de soin. Réponse par message.", auteur:"Vira-19", faction:"cultivateurs" },
  { objet:"Ingénieur sur commande", texte:"Je fabrique circuits, câblages et composants. Tarif correct pour les habitués.", auteur:"Toz-88", faction:"rouage" },
  { objet:"Recrute pour une virée", texte:"Monte un groupe pour ratisser le nord de Silène. Costauds et discrets bienvenus.", auteur:"Brann-60", faction:"nomades" },
  { objet:"Givrite contre Cristal", texte:"Stock de Givrite pur. Intéressée par du Cristal de Nyx ou du matériel de pointe.", auteur:"Sela-23", faction:"toundra" },
  { objet:"Conseil aux nouveaux", texte:"Débutants : ne foncez pas tête baissée. Apprenez un métier, bâtissez, parlez aux gens. Ça paie.", auteur:"Nyx-7", faction:"ignis" }
];
function _purgerAnnonces(){ if(!Array.isArray(etat.annonces)) etat.annonces=[]; const lim=Date.now()-ANNONCE_JOURS*_mjm(); etat.annonces=etat.annonces.filter(a=>a.date>=lim); }
function vueAnnonces(){
  const n=etat.annonces.length;
  let h=`<div class="annonce-form">
    <input id="ann-obj" placeholder="Objet de ton annonce" maxlength="50">
    <textarea id="ann-texte" placeholder="Ton annonce…" maxlength="280" rows="3"></textarea>
    <div class="annonce-form-bas"><span class="itip-gris">Tes annonces : ${n}/${ANNONCE_MAX} · conservées ${ANNONCE_JOURS} j</span><button class="mini" id="ann-publier">Publier</button></div>
  </div>`;
  h+=`<div class="annonce-mur">`;
  for(const a of etat.annonces) h+=_carteAnnonce({ objet:a.objet, texte:a.texte, auteur:etat.nom||"Toi", faction:etat.faction, moi:true, id:a.id });
  for(const a of SIM_ANNONCES) h+=_carteAnnonce(a);
  return h+`</div>`;
}
function _carteAnnonce(a){
  const fac = a.faction ? _facNomComm(a.faction) : "";
  return `<div class="annonce-carte${a.moi?" moi":""}">
    <div class="annonce-obj">${(a.objet||"(sans objet)").replace(/</g,"&lt;")}</div>
    <div class="annonce-txt">${(a.texte||"").replace(/</g,"&lt;")}</div>
    <div class="annonce-sign">— ${a.auteur}${fac?` · ${fac}`:""}${a.moi?` <button class="annonce-suppr" data-suppr="${a.id}">supprimer</button>`:""}</div>
  </div>`;
}
function brancherAnnonces(z){
  const b=z.querySelector("#ann-publier"); if(b) b.addEventListener("click", publierAnnonce);
  z.querySelectorAll("[data-suppr]").forEach(x=>x.addEventListener("click",()=>supprimerAnnonce(parseInt(x.dataset.suppr,10))));
}
function publierAnnonce(){
  const obj=(document.querySelector("#ann-obj").value||"").trim();
  const txt=(document.querySelector("#ann-texte").value||"").trim();
  if(!obj){ journal("Donne un objet à ton annonce.","alerte"); return; }
  if(!txt){ journal("Ton annonce est vide.","alerte"); return; }
  if(etat.annonces.length>=ANNONCE_MAX){ journal(`Maximum ${ANNONCE_MAX} annonces — supprime-en une d'abord.`,"alerte"); return; }
  etat.annonces.unshift({ id:Date.now(), objet:obj, texte:txt, date:Date.now() });
  journal("Annonce publiée.","gain"); if(typeof sauvegarder==="function") sauvegarder(); majComm();
}
function supprimerAnnonce(id){ etat.annonces=etat.annonces.filter(a=>a.id!==id); journal("Annonce retirée.","alerte"); if(typeof sauvegarder==="function") sauvegarder(); majComm(); }

/* ---------- Style ---------- */
let _commStyleMonte=false;
function _commStyle(){
  if(_commStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    #comm-nav{ margin-bottom:12px; }
    .comm-lien{ background:none; border:none; border-bottom:2px solid transparent; color:var(--sourdine); padding:8px 12px; cursor:pointer; font:inherit; font-size:14px; }
    .comm-lien.actif{ color:var(--orange-hi); border-bottom-color:var(--orange); }
    .comm-recherche{ display:flex; gap:8px; margin-bottom:6px; }
    .comm-recherche input{ flex:1; background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:8px 10px; font-family:inherit; }
    .comm-titre{ margin:14px 0 6px; font-family:"Space Mono",monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--sourdine); }
    .comm-ligne{ display:flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:8px; padding:7px 10px; margin:4px 0; flex-wrap:wrap; }
    .comm-dot{ width:10px; height:10px; border-radius:50%; flex:0 0 auto; }
    .comm-dot.on{ background:#8bd450; box-shadow:0 0 6px #8bd450aa; } .comm-dot.off{ background:#ff5257; }
    .comm-nom{ background:none; border:none; color:var(--bleu); cursor:pointer; font:inherit; text-decoration:underline; padding:0; font-weight:700; }
    .comm-meta{ color:var(--sourdine); font-size:13px; }
    .comm-btns{ margin-left:auto; display:flex; gap:6px; flex-wrap:wrap; }
    #comm-profil, #comm-msg{ position:fixed; inset:0; z-index:200; background:rgba(4,8,20,.7); display:grid; place-items:center; padding:20px; }
    #comm-profil[hidden], #comm-msg[hidden]{ display:none; }
    .msg-nav{ display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px; }
    .msg-lien{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--sourdine); padding:6px 10px; cursor:pointer; font:inherit; font-size:13px; }
    .msg-lien.actif{ color:var(--orange-hi); border-color:var(--orange); }
    .msg-liste{ display:flex; flex-direction:column; gap:4px; }
    .msg-item{ display:flex; justify-content:space-between; gap:12px; align-items:baseline; background:none; border:1px solid var(--line); border-radius:8px; padding:9px 12px; cursor:pointer; text-align:left; font:inherit; color:var(--texte); flex-wrap:wrap; }
    .msg-item:hover{ border-color:var(--bleu); }
    .msg-item.nonlu{ border-left:3px solid var(--orange); }
    .msg-item.nonlu .msg-obj{ font-weight:700; }
    .msg-obj{ color:var(--texte); } .msg-qui{ color:var(--sourdine); font-size:12px; }
    .msg-ecrire{ display:flex; flex-direction:column; gap:8px; }
    .msg-ecrire input, .msg-ecrire textarea{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:9px 11px; font-family:inherit; }
    .msg-ecrire textarea{ resize:vertical; }
    .annonce-form{ display:flex; flex-direction:column; gap:8px; border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:14px; background:rgba(16,40,37,.3); }
    .annonce-form input, .annonce-form textarea{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:9px 11px; font-family:inherit; }
    .annonce-form textarea{ resize:vertical; }
    .annonce-form-bas{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .annonce-mur{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px,1fr)); gap:12px; }
    .annonce-carte{ display:flex; flex-direction:column; gap:8px; border:1px solid var(--edge); border-top:3px solid var(--bleu); border-radius:10px; padding:12px 14px; background:linear-gradient(160deg, rgba(20,41,78,.5), rgba(10,23,48,.5)); box-shadow:0 0 14px rgba(90,168,230,.08) inset; }
    .annonce-carte.moi{ border-top-color:var(--orange); box-shadow:0 0 14px rgba(255,138,61,.10) inset; }
    .annonce-obj{ font-weight:700; color:var(--orange-hi); }
    .annonce-txt{ font-size:13px; line-height:1.5; flex:1; white-space:pre-wrap; }
    .annonce-sign{ font-family:"Space Mono",monospace; font-size:12px; color:var(--sourdine); font-style:italic; }
    .annonce-suppr{ background:none; border:none; color:#ff5257; cursor:pointer; font:inherit; text-decoration:underline; margin-left:6px; }`;
  document.head.appendChild(st); _commStyleMonte=true;
}
