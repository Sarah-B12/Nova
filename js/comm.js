/* ===========================================================
   COMM — Communication. 5 sous-onglets : Amis, Messages, Annonces, Population, Carnet.
   Multijoueur simulé (annuaire de joueurs fictifs) en attendant le backend.
   Ce module : sous-onglets + LISTE D'AMIS (recherche, profil, ajout, blocage).
   =========================================================== */

// Annuaire : cache des infos PUBLIQUES des joueurs (rempli depuis la vue serveur profils_publics).
let _annuaire = {};                                       // nom -> { nom, niveau, faction, metier, enLigne }
function _joueurSim(nom){ return _annuaire[nom] || null; }
function _presenceEnLigne(da){ return da ? (Date.now()-new Date(da).getTime() < 120000) : false; }   // actif < 2 min
function _mapProf(r){ return { id:r.id, nom:r.nom, niveau:r.niveau, faction:r.faction, metier:r.formation, enLigne:_presenceEnLigne(r.derniere_activite) }; }
async function _chercherServeur(q){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return [];
  const { data, error } = await sb.from("profils_publics").select("*").ilike("nom", "%"+q+"%").neq("nom", etat.nom||"").limit(15);
  if(error){ console.warn("[comm] recherche:", error.message); return []; }
  const arr=(data||[]).map(_mapProf); for(const j of arr) _annuaire[j.nom]=j; return arr;
}
async function _chargerAmisServeur(noms){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO || !noms.length) return;
  const { data, error } = await sb.from("profils_publics").select("*").in("nom", noms);
  if(error){ console.warn("[comm] annuaire:", error.message); return; }
  for(const r of (data||[])) _annuaire[r.nom]=_mapProf(r);
}
function _facNomComm(fid){ const f=(typeof FACTIONS!=="undefined")?FACTIONS.find(x=>x.id===fid):null; return f?f.nom:"—"; }

let commVue = "amis";
let _commQ = "";
let _commRecherche = null;   // null = pas de recherche ; [] = aucun résultat
let _notifMsg = 0, _notifAmis = 0;
async function compterNotifs(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  const s=await sessionActuelle(); if(!s) return;
  try{
    const [mq, aq] = await Promise.all([
      sb.from("messages").select("id",{count:"exact",head:true}).eq("a_id",s.user.id).eq("lu",false).eq("efface_a",false),
      sb.from("amis").select("demandeur",{count:"exact",head:true}).eq("destinataire",s.user.id).eq("statut","attente")
    ]);
    _notifMsg = mq.count||0; _notifAmis = aq.count||0;
  }catch(e){ console.warn("[comm] notifs:", e.message); }
  majBadges();
}
function majBadges(){
  const B = n => ` <span style="background:var(--orange,#ff8a3d);color:#0a1020;border-radius:9px;padding:0 6px;font-size:11px;font-weight:700;vertical-align:middle">${n}</span>`;
  const tot=_notifMsg+_notifAmis;
  const c=document.querySelector('[data-onglet="comm"]'); if(c) c.innerHTML = "Comm" + (tot>0?B(tot):"");
  const a=document.querySelector('#comm-nav [data-comm="amis"]'); if(a) a.innerHTML = "Amis" + (_notifAmis>0?B(_notifAmis):"");
  const mm=document.querySelector('#comm-nav [data-comm="messages"]'); if(mm) mm.innerHTML = "Messages" + (_notifMsg>0?B(_notifMsg):"");
}

function changerComm(c){
  commVue = c;
  _commQ=""; _commRecherche=null;                       // repartir propre à chaque changement d'onglet
  document.querySelectorAll("#comm-nav .comm-lien").forEach(b=>b.classList.toggle("actif", b.dataset.comm===c));
  majComm();
}

function majComm(){
  const z=document.querySelector("#comm-vue"); if(!z) return;
  _commStyle();
  if(commVue==="amis"){ z.innerHTML = vueAmis(); brancherAmis(z); return; }
  if(commVue==="messages"){ z.innerHTML = `<p class="vide">Chargement…</p>`; _rendreMessages(z); return; }
  if(commVue==="annonces"){ z.innerHTML = `<p class="vide">Chargement…</p>`; _rendreAnnonces(z); return; }
  if(commVue==="population"){ _rendrePopulation(z); return; }
  if(commVue==="carnet"){ _rendreCarnet(z); return; }
}

/* ---------- Amis (serveur : demandes réciproques) ---------- */
let _relCache = {};        // autreId -> { statut, role, nom }
let _monId = null;

async function _idDe(nom){
  if(_annuaire[nom] && _annuaire[nom].id) return _annuaire[nom].id;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return null;
  const { data } = await sb.from("profils_publics").select("id").eq("nom", nom).maybeSingle();
  return data ? data.id : null;
}
async function _chargerRelations(){
  _relCache={}; const out={ amis:[], envoyees:[], recues:[] };
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return out;
  const s=await sessionActuelle(); if(!s) return out; _monId=s.user.id;
  const { data:rels, error } = await sb.from("amis").select("*");
  if(error){ console.warn("[comm] amis:", error.message); return out; }
  const autres=(rels||[]).map(r=> r.demandeur===_monId ? r.destinataire : r.demandeur);
  const profs={};
  if(autres.length){
    const { data:pubs } = await sb.from("profils_publics").select("*").in("id", autres);
    for(const p of (pubs||[])){ const m=_mapProf(p); profs[p.id]=m; _annuaire[p.nom]=m; }
  }
  for(const r of (rels||[])){
    const aid = r.demandeur===_monId ? r.destinataire : r.demandeur;
    const role = r.demandeur===_monId ? "demandeur" : "destinataire";
    const info = profs[aid] || { id:aid, nom:"(inconnu)", niveau:"?", faction:null, metier:"—", enLigne:false };
    _relCache[aid] = { statut:r.statut, role, nom:info.nom };
    if(r.statut==="accepte") out.amis.push(info);
    else if(role==="demandeur") out.envoyees.push(info);
    else out.recues.push(info);
  }
  return out;
}
function _etatRelation(id){ const r=_relCache[id]; if(!r) return null; if(r.statut==="accepte") return "ami"; return r.role==="demandeur"?"envoyee":"recue"; }

function vueAmis(){
  let h = `<div class="comm-recherche"><input id="ami-q" placeholder="Rechercher un joueur par pseudo…" value="${_commQ.replace(/"/g,'&quot;')}"><button class="mini" id="ami-chercher">Chercher</button></div>`;
  if(_commRecherche!==null){
    h += `<h4 class="comm-titre">Résultats</h4>`;
    if(!_commRecherche.length) h += `<p class="vide">Aucun joueur trouvé pour « ${_commQ.replace(/</g,'&lt;')} ».</p>`;
    for(const j of _commRecherche) h += _ligneJoueur(j, { recherche:true });
  }
  h += `<div id="amis-listes"><p class="vide">Chargement…</p></div>`;
  return h;
}
function _ligneJoueur(j, o){
  const dot = `<span class="comm-dot ${j.enLigne?"on":"off"}" title="${j.enLigne?"en ligne":"hors ligne"}"></span>`;
  const fac = _facNomComm(j.faction);
  const cred = (j.credits!=null && j.credits!=="?") ? ` · ${j.credits} ₡` : "";
  const infos = o.ami
    ? `<span class="comm-meta">niv. ${j.niveau}${cred} · ${j.metier||"—"} · ${fac}</span>`
    : `<span class="comm-meta">niv. ${j.niveau} · ${j.metier||"—"} · ${fac}</span>`;
  let btns="";
  if(o.recherche){
    if(j.nom===etat.nom) btns=`<span class="itip-gris">c'est toi</span>`;
    else if(etat.bloques.includes(j.nom)) btns=`<button class="mini" data-debloq="${j.nom}">Débloquer</button>`;
    else {
      const et=_etatRelation(j.id);
      if(et==="ami") btns=`<span class="itip-gris">déjà ami</span>`;
      else if(et==="envoyee") btns=`<span class="itip-gris">demande envoyée</span>`;
      else if(et==="recue") btns=`<button class="mini" data-accept="${j.nom}">Accepter</button><button class="mini danger" data-refuse="${j.nom}">Refuser</button>`;
      else btns=`<button class="mini" data-demande="${j.nom}">Ajouter</button><button class="mini danger" data-bloq="${j.nom}">Bloquer</button>`;
    }
  } else if(o.ami){
    btns=`<button class="mini danger" data-retire="${j.nom}">Retirer</button>`;
  }
  return `<div class="comm-ligne">${dot}<button class="comm-nom" data-profil="${j.nom}">${j.nom}</button>${infos}<span class="comm-btns">${btns}</span></div>`;
}
async function brancherAmis(z){
  const bc=z.querySelector("#ami-chercher"), qi=z.querySelector("#ami-q");
  const go=async()=>{ _commQ=(qi.value||"").trim(); _commRecherche = _commQ ? await _chercherServeur(_commQ) : null; majComm(); };
  if(bc) bc.addEventListener("click", go);
  if(qi) qi.addEventListener("keydown", e=>{ if(e.key==="Enter") go(); });
  _brancherActionsAmis(z);
  await _majListesAmis();
}
function _brancherActionsAmis(z){
  z.querySelectorAll("[data-profil]").forEach(b=>b.addEventListener("click",()=>voirProfilJoueur(b.dataset.profil)));
  z.querySelectorAll("[data-demande]").forEach(b=>b.addEventListener("click",()=>envoyerDemande(b.dataset.demande)));
  z.querySelectorAll("[data-accept]").forEach(b=>b.addEventListener("click",()=>repondreDemande(b.dataset.accept,true)));
  z.querySelectorAll("[data-refuse]").forEach(b=>b.addEventListener("click",()=>repondreDemande(b.dataset.refuse,false)));
  z.querySelectorAll("[data-retire]").forEach(b=>b.addEventListener("click",()=>retirerAmi(b.dataset.retire)));
  z.querySelectorAll("[data-annule]").forEach(b=>b.addEventListener("click",()=>retirerAmi(b.dataset.annule)));
  z.querySelectorAll("[data-bloq]").forEach(b=>b.addEventListener("click",()=>bloquerJoueur(b.dataset.bloq)));
  z.querySelectorAll("[data-debloq]").forEach(b=>b.addEventListener("click",()=>debloquerJoueur(b.dataset.debloq)));
}
async function _majListesAmis(){
  const zc=document.querySelector("#amis-listes"); if(!zc) return;
  const { amis, envoyees, recues } = await _chargerRelations();
  for(const a of amis){ try{ const { data } = await sb.rpc("credits_ami",{ cible:a.id }); if(data!=null) a.credits=data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "comm.js#1"); } }
  let h="";
  if(recues.length){
    h+=`<h4 class="comm-titre">Demandes reçues (${recues.length})</h4>`;
    for(const j of recues) h+=`<div class="comm-ligne"><span class="comm-dot off"></span><button class="comm-nom" data-profil="${j.nom}">${j.nom}</button><span class="comm-btns"><button class="mini" data-accept="${j.nom}">Accepter</button><button class="mini danger" data-refuse="${j.nom}">Refuser</button></span></div>`;
  }
  h+=`<h4 class="comm-titre">Mes amis (${amis.length})</h4>`;
  if(!amis.length) h+=`<p class="vide">Aucun ami confirmé. Cherche un joueur, ouvre son profil, envoie une demande.</p>`;
  for(const j of amis) h+=_ligneJoueur(j, { ami:true });
  if(envoyees.length){
    h+=`<h4 class="comm-titre">Demandes envoyées (${envoyees.length})</h4>`;
    for(const j of envoyees) h+=`<div class="comm-ligne"><span class="comm-dot off"></span><span class="comm-nom" style="cursor:default">${j.nom}</span><span class="comm-btns"><span class="itip-gris">en attente</span> <button class="mini danger" data-annule="${j.nom}">Annuler</button></span></div>`;
  }
  if(etat.bloques.length){
    h+=`<h4 class="comm-titre">Bloqués (${etat.bloques.length})</h4>`;
    h+=`<p class="itip-gris" style="margin:2px 0 6px">Un joueur bloqué n'apparaît plus et ne peut pas t'ajouter.</p>`;
    for(const nom of etat.bloques) h+=`<div class="comm-ligne"><span class="comm-dot off"></span><button class="comm-nom" data-profil="${nom}">${nom}</button><span class="comm-btns"><button class="mini" data-debloq="${nom}">Débloquer</button></span></div>`;
  }
  zc.innerHTML=h;
  _brancherActionsAmis(zc);
  compterNotifs();
}
async function envoyerDemande(nom){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  if(nom===etat.nom) return;
  if(etat.bloques.includes(nom)){ journal(`${nom} est bloqué — débloque-le d'abord.`,"alerte"); return; }
  const s=await sessionActuelle(); if(!s) return;
  const cible=await _idDe(nom); if(!cible){ journal("Joueur introuvable.","alerte"); return; }
  const { data:rev } = await sb.from("amis").select("statut").eq("demandeur",cible).eq("destinataire",s.user.id).maybeSingle();
  if(rev){ await sb.from("amis").update({statut:"accepte"}).eq("demandeur",cible).eq("destinataire",s.user.id); journal(`Vous êtes maintenant amis avec ${nom}.`,"gain"); majComm(); return; }
  const { error } = await sb.from("amis").insert({ demandeur:s.user.id, destinataire:cible, statut:"attente" });
  if(error){ if(error.code==="23505") journal("Demande déjà en cours ou déjà amis.","alerte"); else console.warn("[comm] demande:",error.message); }
  else journal(`Demande d'ami envoyée à ${nom}.`,"gain");
  majComm();
}
async function repondreDemande(nom, accepter){
  const s=await sessionActuelle(); if(!s) return;
  const autre=await _idDe(nom); if(!autre) return;
  if(accepter){ await sb.from("amis").update({statut:"accepte"}).eq("demandeur",autre).eq("destinataire",s.user.id); journal(`${nom} est maintenant ton ami.`,"gain"); }
  else { await sb.from("amis").delete().eq("demandeur",autre).eq("destinataire",s.user.id); journal(`Demande de ${nom} refusée.`,"alerte"); }
  majComm();
}
async function retirerAmi(nom){
  const s=await sessionActuelle(); if(!s) return;
  const autre=await _idDe(nom); if(!autre) return;
  await sb.from("amis").delete().or(`and(demandeur.eq.${s.user.id},destinataire.eq.${autre}),and(demandeur.eq.${autre},destinataire.eq.${s.user.id})`);
  journal(`Relation avec ${nom} retirée.`,"alerte"); majComm();
}
function bloquerJoueur(nom){
  if(nom===etat.nom) return;
  if(!etat.bloques.includes(nom)) etat.bloques.push(nom);
  journal(`${nom} bloqué.`,"alerte"); sauvegarder();
  retirerAmi(nom);
}
function debloquerJoueur(nom){
  etat.bloques = etat.bloques.filter(n=>n!==nom); journal(`${nom} débloqué.`,"gain"); sauvegarder(); majComm();
}

/* ---------- Profil (modale) ---------- */
function _commProfil(){ let m=document.querySelector("#comm-profil"); if(!m){ m=document.createElement("div"); m.id="comm-profil"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) m.hidden=true; }); } return m; }
function _dateHeure(iso){ if(!iso) return "—"; const d=new Date(iso); const p2=n=>String(n).padStart(2,"0"); return `${p2(d.getDate())}/${p2(d.getMonth()+1)} à ${p2(d.getHours())}:${p2(d.getMinutes())}`; }
async function _chargerProfilComplet(nom){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return null;
  const { data } = await sb.from("profils_publics").select("*").eq("nom", nom).maybeSingle();
  return data || null;
}
async function voirProfilJoueur(nom){ if(typeof ouvrirPageProfil==="function") ouvrirPageProfil(nom); }

/* ---------- Messages (serveur) ---------- */
const MSG_MAX = 20;          // messages affichés par page (pas un quota)
const MSG_BOITE = 30;        // plafond RÉEL de la réception — doit égaler PLAFOND dans message_envoyer()
const MSG_JOURS = 30;
let msgVue = "recus";
let _msgPrefill = null;
let _msgRecusCache = [], _msgEnvoyesCache = [];
/* Nombre de messages affichés par boîte. MSG_MAX n'est PAS un quota : rien
   n'est jamais supprimé automatiquement, c'était une simple limite de lecture.
   Les messages au-delà existaient donc en base mais restaient hors de portée
   jusqu'à leur purge à 30 jours. Le bouton « Plus anciens » les rend
   accessibles, par paliers de MSG_MAX. */
let _msgVus = { recus: MSG_MAX, envoyes: MSG_MAX };
let _msgTotaux = { recus: 0, envoyes: 0 };
function _msgDate(d){ const j=Math.floor((Date.now()-d)/86400000); if(j<=0) return "aujourd'hui"; if(j===1) return "hier"; return `il y a ${j} j`; }

async function _chargerMessages(){
  const out={ recus:[], envoyes:[] };
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return out;
  const s=await sessionActuelle(); if(!s) return out; _monId=s.user.id;
  const lim = new Date(Date.now()-MSG_JOURS*86400000).toISOString();
  // `count:"exact"` donne le total en base : c'est lui qui décide d'afficher
  // ou non le bouton « Plus anciens ».
  const [rq, eq] = await Promise.all([
    /* ⚠ PAS de filtre sur 30 jours en réception : rien n'y est purgé, et un
       message ancien occupe quand même une place du plafond. Le filtrer
       afficherait « 30/30 » avec une boîte en apparence vide. */
    sb.from("messages").select("*",{count:"exact"}).eq("a_id",s.user.id).eq("efface_a",false).order("cree_le",{ascending:false}).limit(_msgVus.recus),
    sb.from("messages").select("*",{count:"exact"}).eq("de_id",s.user.id).eq("efface_de",false).gte("cree_le",lim).order("cree_le",{ascending:false}).limit(_msgVus.envoyes)
  ]);
  _msgTotaux.recus   = (typeof rq.count === "number") ? rq.count : (rq.data||[]).length;
  _msgTotaux.envoyes = (typeof eq.count === "number") ? eq.count : (eq.data||[]).length;
  if(rq.error) console.warn("[comm] messages reçus:", rq.error.message);
  if(eq.error) console.warn("[comm] messages envoyés:", eq.error.message);
  const rec=rq.data||[], env=eq.data||[];
  const ids=new Set(); rec.forEach(m=>ids.add(m.de_id)); env.forEach(m=>ids.add(m.a_id));
  const noms={};
  if(ids.size){ const { data:pubs } = await sb.from("profils_publics").select("id,nom").in("id",[...ids]); for(const p of (pubs||[])) noms[p.id]=p.nom; }
  out.recus   = rec.map(m=>({ ...m, ts:new Date(m.cree_le).getTime(), de:noms[m.de_id]||"(inconnu)" }));
  out.envoyes = env.map(m=>({ ...m, ts:new Date(m.cree_le).getTime(), a: noms[m.a_id]||"(inconnu)" }));
  return out;
}
function vueMessages(recus, envoyes){
  const nNL=recus.filter(m=>!m.lu).length;
  /* Le compteur affiche le TOTAL en base, pas le nombre affiché : « 20/20 »
     ressemblait à un quota atteint alors que rien n'était plein. */
  let h=`<div class="msg-nav">`
    + `<button class="msg-lien${msgVue==="recus"?" actif":""}" data-msg="recus">Réception (${_msgTotaux.recus}/${MSG_BOITE})${nNL?` · ${nNL} non lu${nNL>1?"s":""}`:""}</button>`
    + `<button class="msg-lien${msgVue==="envoyes"?" actif":""}" data-msg="envoyes">Envoyés (${_msgTotaux.envoyes})</button>`
    + `<button class="msg-lien${msgVue==="ecrire"?" actif":""}" data-msg="ecrire">Écrire</button></div>`;
  h+= (msgVue==="recus")
    ? `<p class="itip-gris" style="margin:0 0 8px">Ta réception garde <b>${MSG_BOITE} messages</b> au maximum, sans limite de durée : à toi de faire le tri. <b>Pleine, plus personne ne peut t'écrire.</b></p>`
    : `<p class="itip-gris" style="margin:0 0 8px">Tes envois quittent cette liste au bout de <b>${MSG_JOURS} jours</b>. Le destinataire, lui, garde le message tant qu'il ne le supprime pas.</p>`;
  if(msgVue==="ecrire"){
    return h+`<div class="msg-ecrire">
      <input id="msg-dest" placeholder="Destinataire (pseudo)" maxlength="24">
      <input id="msg-obj" placeholder="Objet" maxlength="60">
      <div class="mur-outils" id="msg-outils"></div>
      <textarea id="msg-texte" placeholder="Ton message…" maxlength="1000" rows="6"></textarea>
      <button class="mini" id="msg-envoyer">Envoyer</button></div>`;
  }
  const liste = msgVue==="recus"?recus:envoyes;
  if(!liste.length) return h+`<p class="vide">Aucun message ${msgVue==="recus"?"reçu":"envoyé"}.</p>`;
  h+=`<div class="msg-liste">`;
  liste.forEach((m,i)=>{
    const qui = msgVue==="recus"?("De "+m.de):("À "+m.a);
    const nonlu = !m.lu ? " nonlu" : "";               // reçu non ouvert OU envoyé pas encore lu → mis en valeur
    /* ⚠ La ligne était un <button> : on ne peut pas y imbriquer la croix
       (bouton dans un bouton = HTML invalide, et le clic remonterait au
       parent). D'où un conteneur avec deux boutons frères. */
    h+=`<div class="msg-ligne${nonlu}">
        <button class="msg-item${nonlu}" data-open="${i}"><span class="msg-obj">${(m.objet||"(sans objet)").replace(/</g,"&lt;")}</span><span class="msg-qui">${qui} · ${_msgDate(m.ts)}</span></button>
        <button class="msg-x" data-suppr-i="${i}" title="Supprimer" aria-label="Supprimer ce message">✕</button>
      </div>`;
  });
  const total = _msgTotaux[msgVue] || 0;
  if(liste.length < total){
    h += `<button class="mini msg-plus" id="msg-plus">Plus anciens (${total - liste.length} restant${total-liste.length>1?"s":""})</button>`;
  }
  return h+`</div>`;
}
async function _rendreMessages(z){
  const { recus, envoyes } = await _chargerMessages();
  _msgRecusCache=recus; _msgEnvoyesCache=envoyes;
  z.innerHTML = vueMessages(recus, envoyes);
  brancherMessages(z);
  compterNotifs();
}
// Brouillons : les redessins de panneau ne doivent pas effacer une saisie en cours.
let _msgForm = { dest:"", obj:"", txt:"" };
let _annForm = { obj:"", txt:"" };
function _commBrouillon(z, id, cle, obj, evt){
  const n = z.querySelector(id); if(!n) return;
  if(obj[cle]) n.value = obj[cle];
  n.addEventListener(evt||"input", ()=>{ obj[cle]=n.value; });
}
function brancherMessages(z){
  z.querySelectorAll(".msg-lien").forEach(b=>b.addEventListener("click",()=>{
    msgVue=b.dataset.msg;
    _msgVus = { recus: MSG_MAX, envoyes: MSG_MAX };   // repli à 20 en changeant d'onglet
    _popCache = null;                                  // la population se relit à chaque visite
    majComm();
  }));
  z.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>ouvrirMessage(msgVue, parseInt(b.dataset.open,10))));
  const bp=z.querySelector("#msg-plus");
  if(bp) bp.addEventListener("click", ()=>{ _msgVus[msgVue] = (_msgVus[msgVue]||MSG_MAX) + MSG_MAX; majComm(); });
  z.querySelectorAll("[data-suppr-i]").forEach(b=>b.addEventListener("click", async e=>{
    e.stopPropagation();
    const liste = msgVue==="recus" ? _msgRecusCache : _msgEnvoyesCache;   // noms réels des caches
    const m = liste && liste[parseInt(b.dataset.supprI, 10)];              // data-suppr-i → dataset.supprI
    if(!m) return;
    const quoi = msgVue==="recus" ? "Supprimer ce message ?"
               : (m.lu ? "Retirer ce message de tes envoyés ?"
                       : "Rappeler ce message ? Il sera aussi retiré chez le destinataire, qui ne l'a pas encore lu.");
    const ok = (typeof confirmerJoli==="function")
      ? await confirmerJoli("Supprimer", quoi, "Supprimer", true)
      : confirm(quoi);
    if(!ok) return;
    await supprimerMessage(msgVue, m, null);
  }));
  const env=z.querySelector("#msg-envoyer"); if(env) env.addEventListener("click", envoyerMessage);
  _commBrouillon(z, "#msg-dest", "dest", _msgForm);
  _commBrouillon(z, "#msg-obj",  "obj",  _msgForm);
  _commBrouillon(z, "#msg-texte","txt",  _msgForm);
  if(typeof _paletteEmoji==="function") _paletteEmoji("#msg-outils", "#msg-texte");
  // Le préremplissage (« Écrire à ce joueur ») a priorité sur le brouillon.
  if(_msgPrefill){ const d=z.querySelector("#msg-dest"), o=z.querySelector("#msg-obj");
    if(d){ d.value=_msgPrefill.dest||""; _msgForm.dest=d.value; }
    if(o){ o.value=_msgPrefill.obj||"";  _msgForm.obj=o.value; }
    _msgPrefill=null; }
}
async function envoyerMessage(){
  const dest=(document.querySelector("#msg-dest").value||"").trim();
  const obj=(document.querySelector("#msg-obj").value||"").trim();
  const txt=(document.querySelector("#msg-texte").value||"").trim();
  _msgForm={ dest:"", obj:"", txt:"" };
  if(!dest){ journal("Indique un destinataire.","alerte"); return; }
  if(dest===etat.nom){ journal("Tu ne peux pas t'écrire à toi-même.","alerte"); return; }
  if(!txt){ journal("Le message est vide.","alerte"); return; }
  if(etat.bloques.includes(dest)){ journal(`${dest} est dans tes bloqués — débloque-le pour lui écrire.`,"alerte"); return; }
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible.","alerte"); return; }
  const s=await sessionActuelle(); if(!s) return;
  const aId=await _idDe(dest); if(!aId){ journal("Destinataire introuvable.","alerte"); return; }
  /* ⚠ L'insertion directe est révoquée côté serveur : le plafond de 30
     messages reçus se contournerait depuis F12. Tout passe par la RPC. */
  const { data:r, error } = await sb.rpc("message_envoyer", { p_a:aId, p_objet:obj, p_texte:txt });
  if(error){ console.warn("[comm] envoi:",error.message); journal("Échec de l'envoi.","alerte"); return; }
  if(!r || !r.ok){
    const e = r && r.err;
    if(e==="boite_pleine")      journal(`La boîte de ${dest} est pleine (${r.plafond} messages) — il doit faire de la place avant que tu puisses lui écrire.`,"alerte");
    else if(e==="trop_long")    journal("Message trop long.","alerte");
    else if(e==="vide")         journal("Le message est vide.","alerte");
    else if(e==="destinataire") journal("Destinataire introuvable.","alerte");
    else journal("Envoi refusé.","alerte");
    _msgForm={ dest, obj, txt };            // on rend son texte au joueur
    majComm(); return;
  }
  journal(`Message envoyé à ${dest}.${(r.restant<=5)?` Il ne reste que ${r.restant} place${r.restant>1?"s":""} dans sa boîte.`:""}`,"gain");
  msgVue="envoyes"; majComm();
}
function _msgModal(){ let m=document.querySelector("#comm-msg"); if(!m){ m=document.createElement("div"); m.id="comm-msg"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m){ m.hidden=true; majComm(); } }); } return m; }
async function ouvrirMessage(type, i){
  const arr=(type==="recus"?_msgRecusCache:_msgEnvoyesCache); const m=arr[i]; if(!m) return;
  if(type==="recus" && !m.lu){ m.lu=true; try{ await sb.from("messages").update({lu:true}).eq("id",m.id); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "comm.js#2"); } if(typeof compterNotifs==="function") compterNotifs(); }
  const modal=_msgModal();
  /* Le pseudo devient cliquable : on lit souvent un message en se demandant
     qui est l'expéditeur. `voirProfilJoueur` existe déjà dans ce fichier. */
  const autre = type==="recus" ? m.de : m.a;
  const qui = (type==="recus" ? "De " : "À ")
    + `<b class="msg-qui-lien" data-profil="${echapper(autre||"")}" title="Voir le profil de ${echapper(autre||"")}">${echapper(autre||"?")}</b>`;
  const statut = (type==="envoyes") ? (m.lu?" · lu":" · non lu") : "";
  const suppLabel = (type==="envoyes" && !m.lu) ? "Supprimer pour tous" : "Supprimer";
  modal.innerHTML=`<div class="picker-cadre msg-cadre"><div class="picker-tete"><b>${(m.objet||"(sans objet)").replace(/</g,"&lt;")}</b><button class="mini" data-fermer="1">Fermer</button></div>
    <div class="msg-corps"><p class="itip-gris">${qui} · ${_msgDate(m.ts)}${statut}</p>
    <p style="white-space:pre-wrap; line-height:1.55">${(m.texte||"").replace(/</g,"&lt;")}</p></div>
    <div class="actions" style="margin-top:10px">${type==="recus"?`<button class="mini" data-rep="1">Répondre</button>`:""}<button class="mini danger" data-suppr="1">${suppLabel}</button></div></div>`;
  modal.hidden=false;
  modal.querySelector("[data-fermer]").addEventListener("click",()=>{ modal.hidden=true; majComm(); });
  const rp=modal.querySelector("[data-rep]"); if(rp) rp.addEventListener("click",()=>{ _msgPrefill={ dest:m.de, obj:(/^re\s*:/i.test(m.objet||"")?m.objet:"Re : "+(m.objet||"")) }; modal.hidden=true; msgVue="ecrire"; majComm(); });
  const sp=modal.querySelector("[data-suppr]"); if(sp) sp.addEventListener("click",()=>supprimerMessage(type, m, modal));
  const lp=modal.querySelector("[data-profil]");
  if(lp && autre) lp.addEventListener("click",()=>{
    modal.hidden=true;                       // sinon la fiche s'ouvrirait derrière
    if(typeof voirProfilJoueur==="function") voirProfilJoueur(autre);
  });
}
async function supprimerMessage(type, m, modal){
  try{
    if(type==="recus"){ await sb.from("messages").update({efface_a:true}).eq("id",m.id); journal("Message supprimé.","alerte"); }
    else if(!m.lu){ await sb.from("messages").delete().eq("id",m.id); journal("Message rappelé — retiré aussi chez le destinataire (non lu).","alerte"); }
    else { await sb.from("messages").update({efface_de:true}).eq("id",m.id); journal("Message retiré de tes envoyés.","alerte"); }
  }catch(e){ console.warn("[comm] suppression:",e.message); }
  if(modal) modal.hidden=true;      // null quand on supprime depuis la liste
  majComm();
}

/* ---------- Petites annonces (serveur : mur partagé) ---------- */
const ANNONCE_MAX = 5;
const ANNONCE_JOURS = 30;
let _annCache = [];
async function _chargerAnnonces(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return { toutes:[], miennes:0 };
  const s=await sessionActuelle(); if(s) _monId=s.user.id;
  const lim = new Date(Date.now()-ANNONCE_JOURS*86400000).toISOString();
  const { data:anns, error } = await sb.from("annonces").select("*").gte("cree_le",lim).order("cree_le",{ascending:false}).limit(60);
  if(error){ console.warn("[comm] annonces:", error.message); return { toutes:[], miennes:0 }; }
  const rows=anns||[];
  const ids=[...new Set(rows.map(a=>a.auteur_id))];
  const info={};
  if(ids.length){ const { data:pubs } = await sb.from("profils_publics").select("id,nom,faction").in("id",ids); for(const p of (pubs||[])) info[p.id]={ nom:p.nom, faction:p.faction }; }
  const toutes = rows.map(a=>({ id:a.id, objet:a.objet, texte:a.texte, auteur:(info[a.auteur_id]&&info[a.auteur_id].nom)||"(inconnu)", faction:(info[a.auteur_id]&&info[a.auteur_id].faction)||null, moi:a.auteur_id===_monId }));
  const miennes = toutes.filter(a=>a.moi).length;
  return { toutes, miennes };
}
function vueAnnonces(toutes, miennes){
  let h=`<div class="annonce-form">
    <input id="ann-obj" placeholder="Objet de ton annonce" maxlength="50">
    <textarea id="ann-texte" placeholder="Ton annonce…" maxlength="280" rows="3"></textarea>
    <div class="annonce-form-bas"><span class="itip-gris">Tes annonces : ${miennes}/${ANNONCE_MAX} · conservées ${ANNONCE_JOURS} j</span><button class="mini" id="ann-publier">Publier</button></div>
  </div>`;
  h+=`<div class="annonce-mur">`;
  if(!toutes.length) h+=`<p class="vide">Aucune annonce pour l'instant. Sois le premier à publier !</p>`;
  for(const a of toutes) h+=_carteAnnonce(a);
  return h+`</div>`;
}
/* CARNET — bloc-notes personnel. Vit dans etat.carnet, donc dans `donnees` :
   aucune table ni RPC, il suit la sauvegarde du profil et se retrouve sur tous
   les appareils du joueur. Personne d'autre n'y a accès (RLS sur profils).
   Le collage est AUTORISÉ : le bloquer n'aurait été qu'un ralentisseur
   (F12, JS désactivé ou une capture d'écran le contournent), au prix d'une
   gêne réelle pour les joueurs sur mobile et les lecteurs d'écran. */
/* POPULATION — annuaire par faction.
   Un Régent n'avait aucun moyen de savoir qui compose sa faction : il ne
   voyait que les candidats en période d'élection. Lecture seule sur
   `profils_publics`, qui n'expose ni crédits ni `donnees`.
   ⚠ On charge UNE faction à la fois : tout afficher d'un coup serait long à
   lire et lourd à transférer. */
let _popFaction = null, _popQ = "", _popVus = 60, _popCache = null;
const POP_PAS = 60;

async function _rendrePopulation(z){
  if(!_popFaction) _popFaction = etat.faction || (typeof FACTIONS!=="undefined" ? FACTIONS[0].id : null);
  const fs = (typeof FACTIONS!=="undefined") ? FACTIONS : [];
  let h = `<div class="pop-nav">` + fs.map(f =>
      `<button class="msg-lien${f.id===_popFaction?" actif":""}" data-pop="${f.id}">${echapper(f.nom)}</button>`
    ).join("") + `</div>
    <div class="dev-champ" style="margin:8px 0"><input id="pop-q" placeholder="Filtrer par pseudo…" value="${echapper(_popQ)}"></div>
    <div id="pop-liste"><p class="vide">Chargement…</p></div>`;
  z.innerHTML = h;

  z.querySelectorAll("[data-pop]").forEach(b => b.addEventListener("click", () => {
    _popFaction = b.dataset.pop; _popQ = ""; _popVus = POP_PAS; _popCache = null; majComm();
  }));
  const q = z.querySelector("#pop-q");
  if(q) q.addEventListener("input", () => { _popQ = q.value; _popVus = POP_PAS; _peuplerPopulation(z); });

  await _peuplerPopulation(z);
  const qq = z.querySelector("#pop-q");
  if(qq && _popQ){ qq.focus(); qq.setSelectionRange(_popQ.length, _popQ.length); }
}

async function _peuplerPopulation(z){
  const zl = z.querySelector("#pop-liste"); if(!zl) return;
  if(!_popCache || _popCache.faction !== _popFaction){
    if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ zl.innerHTML = `<p class="vide">Serveur indisponible.</p>`; return; }
    const { data, error } = await sb.from("profils_publics")
      .select("id,nom,niveau,formation,derniere_activite")
      .eq("faction", _popFaction).order("nom", { ascending:true });
    if(error){ console.warn("[population]", error.message); zl.innerHTML = `<p class="vide">Lecture impossible.</p>`; return; }
    _popCache = { faction:_popFaction, liste:(data||[]) };
  }
  const norme = t => String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const filtre = norme(_popQ);
  const tous = _popCache.liste.filter(p => !filtre || norme(p.nom).includes(filtre));
  const vus = tous.slice(0, _popVus);
  const fac = (typeof FACTIONS!=="undefined") ? FACTIONS.find(f=>f.id===_popFaction) : null;

  if(!tous.length){
    zl.innerHTML = `<p class="vide">${filtre ? "Aucun pseudo ne correspond." : "Personne dans cette faction."}</p>`;
    return;
  }
  let h = `<p class="itip-gris" style="margin:0 0 8px"><b>${tous.length}</b> membre${tous.length>1?"s":""}${fac?` — ${echapper(fac.nom)}`:""}${filtre?` (sur ${_popCache.liste.length})`:""}</p><div class="pop-liste">`;
  vus.forEach(p => {
    const enLigne = (typeof _presenceEnLigne==="function") && _presenceEnLigne(p.derniere_activite);
    h += `<button class="pop-item" data-profil="${echapper(p.nom)}">
        <span class="comm-dot ${enLigne?"on":"off"}"></span>
        <span class="pop-nom">${echapper(p.nom)}</span>
        <span class="pop-meta">Niv ${p.niveau|0}${p.formation?` · ${echapper(p.formation)}`:""}</span>
      </button>`;
  });
  h += `</div>`;
  if(vus.length < tous.length) h += `<button class="mini msg-plus" id="pop-plus">Voir plus (${tous.length - vus.length} restant${tous.length-vus.length>1?"s":""})</button>`;
  zl.innerHTML = h;

  zl.querySelectorAll("[data-profil]").forEach(b => b.addEventListener("click", () => {
    if(typeof voirProfilJoueur==="function") voirProfilJoueur(b.dataset.profil);
  }));
  const bp = zl.querySelector("#pop-plus");
  if(bp) bp.addEventListener("click", () => { _popVus += POP_PAS; _peuplerPopulation(z); });
}

const CARNET_MAX = 6000;
function _rendreCarnet(z){
  const v = etat.carnet || "";
  z.innerHTML = `
    <p class="vide" style="margin:0 0 8px">Tes notes, indices et hypothèses. Enregistré sur ton compte — tu les retrouveras partout. Personne d'autre ne les voit.</p>
    <textarea class="carnet-zone" id="carnet-zone" maxlength="${CARNET_MAX}" placeholder="Ce que tu as vu, ce que tu crois comprendre…">${echapper(v)}</textarea>
    <div class="carnet-pied"><span id="carnet-etat">Enregistré</span><span id="carnet-compte">${v.length} / ${CARNET_MAX}</span></div>`;

  const t = z.querySelector("#carnet-zone");
  const et = z.querySelector("#carnet-etat");
  const cp = z.querySelector("#carnet-compte");
  let minuteur = null;

  t.addEventListener("input", ()=>{
    etat.carnet = t.value.slice(0, CARNET_MAX);
    cp.textContent = `${etat.carnet.length} / ${CARNET_MAX}`;
    et.textContent = "…";
    clearTimeout(minuteur);
    minuteur = setTimeout(()=>{                 // on ne sauvegarde pas à chaque frappe
      if(typeof sauvegarder==="function") sauvegarder();
      et.textContent = "Enregistré";
    }, 900);
  });
}

async function _rendreAnnonces(z){
  const { toutes, miennes } = await _chargerAnnonces();
  _annCache = toutes; _annMiennes = miennes;
  z.innerHTML = vueAnnonces(toutes, miennes);
  brancherAnnonces(z);
}
let _annMiennes = 0;
function _carteAnnonce(a){
  const fac = a.faction ? _facNomComm(a.faction) : "";
  return `<div class="annonce-carte${a.moi?" moi":""}">
    <div class="annonce-obj">${(a.objet||"(sans objet)").replace(/</g,"&lt;")}</div>
    <div class="annonce-txt">${(a.texte||"").replace(/</g,"&lt;")}</div>
    <div class="annonce-sign">— <button class="comm-nom" data-profil="${a.auteur}">${a.auteur}</button>${fac?` · ${fac}`:""}${a.moi?` <button class="annonce-suppr" data-suppr="${a.id}">supprimer</button>`:""}${(!a.moi && typeof estAdmin==="function" && estAdmin())?` <button class="annonce-suppr" data-admann="${a.id}" style="color:#ff5257">✕ modérer</button>`:""}</div>
  </div>`;
}
function brancherAnnonces(z){
  _commBrouillon(z, "#ann-obj",   "obj", _annForm);
  _commBrouillon(z, "#ann-texte", "txt", _annForm);
  const b=z.querySelector("#ann-publier"); if(b) b.addEventListener("click", publierAnnonce);
  z.querySelectorAll("[data-suppr]").forEach(x=>x.addEventListener("click",()=>supprimerAnnonce(x.dataset.suppr)));
  z.querySelectorAll("[data-profil]").forEach(x=>x.addEventListener("click",()=>voirProfilJoueur(x.dataset.profil)));
  z.querySelectorAll("[data-admann]").forEach(x=>x.addEventListener("click",async()=>{ try{ await sb.rpc("admin_suppr_annonce",{p_id:Number(x.dataset.admann)}); journal("Annonce supprimée (modération).","alerte"); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "comm.js#3"); } majComm(); }));
}
async function publierAnnonce(){
  const obj=(document.querySelector("#ann-obj").value||"").trim(); _annForm={ obj:"", txt:"" };
  const txt=(document.querySelector("#ann-texte").value||"").trim();
  if(!obj){ journal("Donne un objet à ton annonce.","alerte"); return; }
  if(!txt){ journal("Ton annonce est vide.","alerte"); return; }
  if(_annMiennes>=ANNONCE_MAX){ journal(`Maximum ${ANNONCE_MAX} annonces — supprime-en une d'abord.`,"alerte"); return; }
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ journal("Serveur indisponible.","alerte"); return; }
  const s=await sessionActuelle(); if(!s) return;
  const { error } = await sb.from("annonces").insert({ auteur_id:s.user.id, objet:obj, texte:txt });
  if(error){ console.warn("[comm] publication:",error.message); journal("Échec de la publication.","alerte"); return; }
  journal("Annonce publiée.","gain"); majComm();
}
async function supprimerAnnonce(id){
  try{ await sb.from("annonces").delete().eq("id", id); journal("Annonce retirée.","alerte"); }
  catch(e){ console.warn("[comm] suppr annonce:",e.message); }
  majComm();
}

/* ---------- Style ---------- */
let _commStyleMonte=false;
function _commStyle(){
  if(_commStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    #comm-nav{ margin-bottom:12px; }
    .carnet-zone{ width:100%; min-height:340px; resize:vertical; background:#0f1830;
      border:1px solid var(--line); border-radius:10px; color:var(--texte);
      padding:12px; font-family:inherit; font-size:14px; line-height:1.55; }
    .carnet-pied{ display:flex; justify-content:space-between; align-items:center;
      gap:10px; margin-top:8px; font-size:12px; color:var(--sourdine); }
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
    .msg-cadre{ width:min(720px,94vw); max-height:88vh; display:flex; flex-direction:column; }
    .msg-cadre .msg-corps{ overflow:auto; flex:1; margin:4px 0; padding-right:6px; }
    .pf-cadre{ width:min(560px,94vw); }
    .pf-haut{ display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap; margin-bottom:6px; }
    .pf-cadre .pf-portrait{ width:130px; aspect-ratio:3/4; }
    .pf-info{ flex:1; min-width:160px; }
    .pf-info p{ margin:3px 0; }
    .pf-desc{ white-space:pre-wrap; line-height:1.55; font-size:14px; }
    .pf-amis{ font-size:13px; color:var(--texte); }
    .msg-nav{ display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px; }
    .msg-lien{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--sourdine); padding:6px 10px; cursor:pointer; font:inherit; font-size:13px; }
    .msg-lien.actif{ color:var(--orange-hi); border-color:var(--orange); }
    .msg-liste{ display:flex; flex-direction:column; gap:4px; }
    .msg-item{ display:flex; justify-content:space-between; gap:12px; align-items:baseline; background:none; border:1px solid var(--line); border-radius:8px; padding:9px 12px; cursor:pointer; text-align:left; font:inherit; color:var(--texte); flex-wrap:wrap; }
    .msg-item:hover{ border-color:var(--bleu); }
    .msg-item.nonlu{ border-left:3px solid var(--orange); }
    .msg-item.nonlu .msg-obj{ font-weight:700; }
    .msg-obj{ color:var(--texte); } .msg-qui{ color:var(--sourdine); font-size:12px; }
    .msg-ligne{ display:flex; align-items:stretch; gap:6px; }
    .msg-ligne .msg-item{ flex:1; min-width:0; }
    .msg-ligne .msg-obj{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .msg-x{ flex:0 0 auto; width:34px; background:none; border:1px solid var(--line);
      border-radius:8px; color:var(--sourdine); font-size:14px; cursor:pointer; line-height:1; }
    .msg-x:hover{ border-color:#ff5257; color:#ff7a7e; }
    .msg-qui-lien{ cursor:pointer; color:var(--bleu,#5aa8e6); border-bottom:1px dotted currentColor; }
    .msg-qui-lien:hover{ color:#fff; }
    .msg-plus{ display:block; width:100%; margin-top:8px; }
    .pop-nav{ display:flex; gap:6px; flex-wrap:wrap; }
    .pop-liste{ display:flex; flex-direction:column; gap:5px; }
    .pop-item{ display:flex; align-items:center; gap:9px; width:100%; text-align:left;
      background:#0f1830; border:1px solid var(--line); border-radius:9px 3px 9px 3px;
      color:var(--texte); padding:8px 11px; font-family:inherit; font-size:13px; cursor:pointer; }
    .pop-item:hover{ border-color:var(--bleu); }
    .pop-nom{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pop-meta{ font-family:"Space Mono",monospace; font-size:11px; color:var(--sourdine); white-space:nowrap; }
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
