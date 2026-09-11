/* ===========================================================
   GOUVERNEMENT — vue « Le Centre → Gouvernement » (Étape 5.1 : caisse + dons).
   Caisse par faction (alimentée par la taxe du marché + les dons, plafond 500 ₡/24 h).
   Visible seulement par les membres de la faction (RLS serveur).
   =========================================================== */
(function(){ if(document.querySelector("#gouv-style")) return;
  const st=document.createElement("style"); st.id="gouv-style";
  st.textContent=`
    .gouv-caisse{ display:flex; justify-content:space-between; align-items:center; gap:12px; border:1px solid var(--line); border-radius:10px; padding:12px 14px; background:rgba(15,24,48,.4); margin:6px 0 4px; }
    .gouv-caisse b{ font-size:20px; }
    .gouv-don{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:10px; }
    .gouv-don input{ width:120px; background:#0f1830; border:1px solid var(--line); border-radius:var(--r-s,10px); color:var(--texte,#dfe8f2); padding:8px 10px; }
    .gouv-don input:focus{ outline:none; border-color:var(--orange,#ff8a3d); }
    .gouv-role{ display:flex; justify-content:space-between; align-items:center; border:1px solid var(--line); border-radius:8px; padding:8px 12px; margin:5px 0; }
    .bur-menu{ display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
    .bur-lien{ padding:5px 12px; border-radius:8px 3px 8px 3px; background:rgba(16,40,37,.7); color:var(--sourdine); border:1px solid var(--line); cursor:pointer; }
    .bur-lien.actif{ color:var(--orange-hi,#ffb060); border-color:var(--orange,#ff8a3d); }
    .def-slots{ display:flex; gap:10px; margin:6px 0 12px; }
    .def-slot{ width:64px; height:64px; border:1px solid var(--line); border-radius:10px; display:grid; place-items:center; position:relative; background:rgba(15,24,48,.4); }
    .def-slot.vide{ color:var(--sourdine); font-size:20px; }
    .def-slot.rempli{ cursor:pointer; border-color:var(--orange,#ff8a3d); }
    .def-img{ width:100%; height:100%; object-fit:contain; border-radius:10px; }
    .def-emoji{ place-items:center; font-size:26px; }
    .def-j{ position:absolute; bottom:2px; right:4px; font-size:10px; background:rgba(0,0,0,.6); padding:0 3px; border-radius:4px; }
    .coffre-cases{ display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 12px; }
    .coffre-case{ width:44px; height:44px; border:1px solid var(--line); border-radius:8px; display:grid; place-items:center; position:relative; background:rgba(15,24,48,.4); }
    .coffre-case svg{ width:26px; height:26px; }
    .coffre-case img{ width:100%; height:100%; object-fit:contain; padding:3px; box-sizing:border-box; }
    .coffre-case.defobj{ cursor:pointer; border-color:var(--orange,#ff8a3d); }
    .cc-n{ position:absolute; bottom:1px; right:3px; font-size:11px; font-weight:700; }
    .cc-j{ position:absolute; bottom:1px; right:2px; font-size:9px; background:rgba(0,0,0,.6); padding:0 2px; border-radius:3px; }
    #def-tip{ position:fixed; z-index:400; background:#0f1830; border:1px solid var(--orange,#ff8a3d); border-radius:8px; padding:8px 10px; font-size:13px; pointer-events:none; max-width:230px; line-height:1.5; }
    #def-tip[hidden]{ display:none; }
    .gsec{ color:var(--orange-hi,#ffb060); font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin:20px 0 8px; padding:6px 10px; border-left:3px solid var(--orange,#ff8a3d); background:rgba(255,138,61,.07); border-radius:0 6px 6px 0; }
    .frag-slots{ display:flex; gap:10px; margin:6px 0 4px; }
    .frag-slot{ width:56px; height:56px; border:1px solid var(--line); border-radius:10px; display:grid; place-items:center; background:rgba(15,24,48,.4); }
    .frag-slot.rempli{ border-color:var(--orange,#ff8a3d); }
    .frag-slot.vide{ color:var(--sourdine); font-size:20px; }
    .frag-img{ width:100%; height:100%; object-fit:contain; border-radius:10px; padding:3px; box-sizing:border-box; }
    .frag-emoji{ place-items:center; font-size:24px; }
    .gouv-annonce{ border:1px solid var(--orange,#ff8a3d); border-radius:10px; padding:10px 12px; margin-bottom:12px; background:rgba(255,138,61,.08); }
    .gouv-annonce-txt{ margin-top:4px; white-space:pre-wrap; line-height:1.5; }
    .reg-compose{ display:flex; flex-direction:column; gap:8px; max-width:520px; margin-bottom:12px; }
    .exp-aide{ border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin-top:12px; font-size:12px; line-height:1.7; color:var(--sourdine); background:rgba(15,24,48,.4); }
    .rep-badges{ display:flex; justify-content:center; gap:18px; margin:12px 0 4px; flex-wrap:wrap; }
    .rep-badge{ display:flex; flex-direction:column; align-items:center; gap:2px; }
    .rep-ic{ font-size:22px; line-height:1; }
    .rep-img{ width:34px; height:34px; object-fit:contain; display:block;
      filter:drop-shadow(0 1px 2px rgba(0,0,0,.55)); }
    .rep-badge{ cursor:default; }
    .conc-fil{ max-height:340px; overflow-y:auto; display:flex; flex-direction:column; gap:7px;
      border:1px solid var(--line); border-radius:10px; background:#0b1224; padding:10px; }
    .conc-msg{ background:#0f1830; border:1px solid var(--line); border-radius:9px 3px 9px 3px;
      padding:7px 10px; max-width:82%; align-self:flex-start; }
    .conc-msg.moi{ align-self:flex-end; border-color:rgba(90,168,230,.45); background:rgba(90,168,230,.08); }
    .conc-tete{ font-family:"Space Mono",monospace; font-size:11px; color:var(--orange-hi,#ffb060); margin-bottom:3px; }
    .conc-msg.moi .conc-tete{ color:#7cc4f5; }
    .conc-txt{ font-size:13px; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
    .conc-saisie{ display:flex; gap:7px; align-items:flex-end; margin-top:9px; }
    .conc-saisie textarea{ flex:1; background:#0f1830; border:1px solid var(--line); border-radius:10px 4px 10px 4px;
      color:var(--texte); padding:9px 11px; font-family:inherit; font-size:13px; resize:vertical; }
    .conc-saisie textarea:focus{ outline:none; border-color:var(--orange); }
    .ann-carte{ border:1px solid var(--line); border-left:3px solid var(--orange,#ff8a3d);
      border-radius:12px 4px 12px 4px; background:rgba(255,138,61,.05); padding:13px 15px; margin-top:6px; }
    .ann-tete{ font-size:12px; letter-spacing:.05em; text-transform:uppercase; color:var(--orange-hi,#ffb060); margin-bottom:9px; }
    .ann-txt{ font-size:14px; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
    .centre-pastille{ display:inline-block; min-width:17px; padding:0 5px; margin-left:6px;
      background:var(--orange,#ff8a3d); color:#0a1020; border-radius:9px;
      font-family:"Space Mono",monospace; font-size:11px; font-weight:700; text-align:center; }
    .gouv-blason{ display:flex; justify-content:center; margin:10px 0 14px; }
    .gouv-blason img{ width:132px; height:132px; object-fit:contain;
      filter:drop-shadow(0 3px 10px rgba(0,0,0,.55)); }
    @media (max-width:560px){ .gouv-blason img{ width:96px; height:96px; } }
    .rep-n{ font-size:14px; font-weight:700; color:var(--orange-hi,#ffb060); }
    .gouv-textarea{ width:100%; box-sizing:border-box; background:#0f1830; border:1px solid var(--line); border-radius:var(--r-s,10px); color:var(--texte,#dfe8f2); padding:10px; font-family:inherit; font-size:14px; resize:vertical; margin-bottom:10px; }
  `;
  document.head.appendChild(st);
})();
function _gouvFacNom(fid){ const f=(typeof FACTIONS!=="undefined")?FACTIONS.find(x=>x.id===fid):null; return f?f.nom:"ta faction"; }
const CERCLES = [
  // `ic` = repli si le blason images/blasons/<id>.png manque (onerror).
  { id:"eclats",      nom:"Les Éclats",            ic:"💠" },
  { id:"racines",     nom:"Les Racines",           ic:"🌿" },
  { id:"veilleurs",   nom:"Les Veilleurs",         ic:"🔭" },
  { id:"langues",     nom:"Les Langues-violacées", ic:"👅" },
  { id:"assembleurs", nom:"Les Assembleurs",       ic:"⚙️" }
];
/* Badges de réputation : blasons dessinés (images/blasons/<id>.png).
   ⚠ 3e paramètre AJOUTÉ : la faction, pour choisir le bon blason du premier
   badge. Sans elle on retombe sur la médaille 🎖️ générique.
   Chaque image a un repli emoji via onerror, donc un blason manquant
   n'efface pas le badge. */
/* Blason de faction en grand, sous le titre de l'onglet Gouvernement.
   Repli silencieux : sans faction ou sans fichier, on n'affiche rien plutôt
   qu'un cadre vide (l'emoji 🎖️ n'aurait aucun sens à cette taille). */
function _blasonFaction(fac){
  if(!fac) return "";
  const f = (typeof FACTIONS!=="undefined") ? FACTIONS.find(x=>x.id===fac) : null;
  return `<div class="gouv-blason"><img src="images/blasons/${fac}.png"
      alt="${f?f.nom:fac}" title="${f?f.nom:fac}" onerror="this.parentNode.remove()"></div>`;
}

function _badgesReput(repFaction, cercles, faction){
  cercles = cercles || {};
  const fac = (typeof FACTIONS!=="undefined") ? FACTIONS.find(f=>f.id===faction) : null;
  const badges = [ { id:faction||null, ic:"🎖️", nom:fac?`Réputation — ${fac.nom}`:"Réputation de faction", val:(repFaction||0) } ];
  CERCLES.forEach(c=>badges.push({ id:c.id, ic:c.ic, nom:c.nom, val:(cercles[c.id]||0) }));
  return badges.map(b=>{
    const vis = b.id
      ? `<img class="rep-img" src="images/blasons/${b.id}.png" alt="" loading="lazy"
             onerror="this.outerHTML='<span class=\'rep-ic\'>${b.ic}</span>'">`
      : `<span class="rep-ic">${b.ic}</span>`;
    return `<div class="rep-badge" title="${b.nom}">${vis}<span class="rep-n">${b.val}</span></div>`;
  }).join("");
}
const GOUV_ROLES = [ {id:"regent",nom:"Régent"}, {id:"architecte",nom:"Architecte"}, {id:"chef_guerre",nom:"Stratège"}, {id:"espion",nom:"Ombre"} ];
async function _chargerGouvernement(fac){
  try{
    const { data:rows } = await sb.from("gouvernement").select("*").eq("faction", fac);
    const parRole={}; (rows||[]).forEach(r=>{ parRole[r.role]=r.profil_id; });
    const ids=[...new Set((rows||[]).map(r=>r.profil_id).filter(Boolean))];
    const noms={}; if(ids.length){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",ids); for(const pp of (pubs||[])) noms[pp.id]=pp.nom; }
    return { parRole, noms };
  }catch(e){ return { parRole:{}, noms:{} }; }
}

/* ⚠ COURSE DE RENDU. Cette fonction est `async` et enchaîne plusieurs `await`
   entre la réinitialisation de `el.innerHTML` et l'ajout de ses blocs
   (gouvernement, fragments, annonce). Deux appels rapprochés — par exemple
   `apresAction()` puis le `majCentre()` explicite après un don — se
   chevauchaient : chacun repartait de zéro, puis TOUS DEUX ajoutaient leurs
   blocs au contenu final. D'où les sections « Gouvernement » et « Fragments »
   en double, voire en triple.
   Parade : un jeton de version. Après chaque `await`, un rendu abandonne s'il
   n'est plus le plus récent. */
let _gouvRendu = 0;
async function majGouvernement(el){
  const _jeton = ++_gouvRendu;
  const _perime = () => _jeton !== _gouvRendu;
  if(!el) return;
  /* ⚠ On affiche le gouvernement de la faction où l'on SE TROUVE, pas la
     sienne : en visite chez Ignis, c'est le gouvernement d'Ignis qui compte.
     Hors de toute ville (en pleine zone sauvage), on retombe sur la sienne. */
  const ville = (typeof villeActuelle==="function") ? villeActuelle() : null;
  const fac = ville || etat.faction;
  const chezMoi = (fac === etat.faction);
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ el.innerHTML = `<h3>Gouvernement — ${_gouvFacNom(fac)}</h3><p class="vide">Serveur indisponible.</p>`; return; }
  /* ⚠ `solde = null` signifie « je n'ai PAS LE DROIT de savoir », pas « zéro ».
     La policy `caisse_voir` réserve la lecture aux membres de la faction :
     hors de chez soi, la requête renvoie une liste vide sans erreur. Afficher
     0 ₡ laissait croire à une caisse épuisée — information fausse, et
     précieuse pour qui la croirait. */
  let solde = null, dejaJour = 0;
  try{ const { data } = await sb.from("caisses").select("solde").eq("faction", fac).maybeSingle(); if(data && typeof data.solde==="number") solde = data.solde; }catch(e){ console.warn("[gouv] caisse:", e.message); }
  try{ const s=await sessionActuelle(); if(s){ const lim=new Date(Date.now()-24*3600*1000).toISOString(); const { data } = await sb.from("dons").select("montant").gte("cree_le", lim); dejaJour=(data||[]).reduce((a,d)=>a+(d.montant||0),0); } }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#1"); }
  const reste = Math.max(0, 500 - dejaJour);
  el.innerHTML = `<h3>Gouvernement — ${_gouvFacNom(fac)}</h3>
    ${chezMoi ? "" : `<p class="itip-gris" style="margin:0 0 8px">Tu consultes le gouvernement d'une faction qui n'est pas la tienne.</p>`}
    ${_blasonFaction(fac)}
    <div class="gouv-caisse"><span>Caisse de la faction</span>${solde===null
      ? `<b class="itip-gris" title="Réservée aux membres de cette faction">— non communiqué</b>`
      : `<b class="or">${solde.toLocaleString("fr-FR")} ₡</b>`}</div>
    <p class="itip-gris">${solde===null
      ? `Le montant d'une caisse n'est connu que de sa faction. L'Ombre peut tenter de l'apprendre par espionnage.`
      : `Alimentée par les <b>taxes du marché</b> de la faction et les <b>dons</b> des membres.`}</p>
    ${solde===null ? "" : `<div class="gouv-don">
      <input type="number" id="gouv-don-montant" min="1" max="${reste}" value="${Math.min(100,reste)}" ${reste<=0?"disabled":""}>
      <button class="mini" id="gouv-don-btn" ${reste<=0?"disabled":""}>Faire un don</button>
      <span class="itip-gris">Reste aujourd'hui : <b>${reste} ₡</b> / 500</span>
    </div>`}`;
    /* ⚠ Pas de bloc de don hors de sa faction : caisse_don() verse toujours
       dans SA PROPRE caisse, quelle que soit la page consultée. L'afficher
       ici laissait croire qu'on finançait la faction visitée. */
  const b = el.querySelector("#gouv-don-btn"); if(b) b.addEventListener("click", faireDon);
  /* ⚠ L'annonce du Régent a quitté ce panneau : elle a son propre onglet
     « Annonce » (majAnnonceFaction, plus bas). Un rectangle coincé en tête du
     Gouvernement passait inaperçu et alourdissait la vue. */
  const gouv = await _chargerGouvernement(fac);
  const s2 = await sessionActuelle(); const moiId = s2?s2.user.id:null;
  const jeSuisRegent = gouv.parRole["regent"] && gouv.parRole["regent"]===moiId;
  const rolesHtml = GOUV_ROLES.map(r=>{
    const id=gouv.parRole[r.id]; const nom=id?(gouv.noms[id]||"(?)"):null;
    let ctrl="";
    /* Le Régent peut transmettre sa charge — RPC à part, car il y perd son
       pouvoir et le poste ne peut pas rester vacant. */
    if(jeSuisRegent && r.id==="regent"){ ctrl += `<button class="mini" data-transmettre="1">Transmettre la charge</button>`; }
    if(jeSuisRegent && r.id!=="regent"){ ctrl += `<button class="mini" data-nommer="${r.id}">${nom?"Changer":"Nommer"}</button>`; if(nom) ctrl += `<button class="mini danger" data-demrole="${r.id}">Démettre</button>`; }
    if(id===moiId && r.id!=="regent") ctrl += `<button class="mini danger" data-demission="${r.id}">Démissionner</button>`;
    return `<div class="gouv-role"><span>${r.nom} : ${nom?`<button class="comm-nom" data-profil="${echapper(nom)}">${echapper(nom)}</button>`:'<span class="itip-gris">vacant</span>'}</span><span class="comm-btns">${ctrl}</span></div>`;
  }).join("");
  if(_perime()) return;
  const bloc = document.createElement("div");
  bloc.innerHTML = `<h4 class="gsec" style="margin-top:16px">Gouvernement</h4>${rolesHtml}${jeSuisRegent?'<p class="itip-gris" style="margin-top:6px">Tu es Régent : tu peux nommer ou démettre les autres rôles.</p>':""}`;
  el.appendChild(bloc);
  bloc.querySelectorAll("[data-profil]").forEach(x=>x.addEventListener("click",()=>{ if(typeof ouvrirPageProfil==="function") ouvrirPageProfil(x.dataset.profil); }));
  bloc.querySelectorAll("[data-nommer]").forEach(b=>b.addEventListener("click",()=>_regentNommer(b.dataset.nommer)));
  bloc.querySelectorAll("[data-transmettre]").forEach(b=>b.addEventListener("click", _regentTransmettre));
  bloc.querySelectorAll("[data-demrole]").forEach(b=>b.addEventListener("click",()=>_regentDemettre(b.dataset.demrole)));
  bloc.querySelectorAll("[data-demission]").forEach(b=>b.addEventListener("click",()=>_demissionner(b.dataset.demission)));
  try{
    const { data:frags } = await sb.from("fragments").select("*");
    if(_perime()) return;
    const tous=frags||[]; const mine=tous.filter(f=>f.detenteur===fac);
    let fh=`<h4 class="gsec" style="margin-top:16px">Fragments du Protocole (${mine.length}/2)</h4>`;
    fh+=`<div class="frag-slots">`;
    for(let i=0;i<2;i++){ const f=mine[i];
      if(f) fh+=`<div class="frag-slot rempli" title="${(f.nom+' — '+f.effet).replace(/"/g,'&quot;')}"><img src="images/items/${f.id}.png" class="frag-img" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="frag-emoji" style="display:none">🧩</span></div>`;
      else fh+=`<div class="frag-slot vide">·</div>`;
    }
    fh+=`</div>`;
    if(mine.length) fh+=`<p class="itip-gris" style="font-size:12px">`+mine.map(f=>`<b>${f.nom}</b> : ${f.effet}`).join("<br>")+`</p>`;
    if(tous.length) fh+=`<p class="itip-gris" style="margin-top:6px;font-size:12px">Localisation : `+tous.map(f=>`${f.nom.replace(/Fragment (de l'|d'|de |du )/,"")} → <b>${f.detenteur==="protocole"?"Protocole":_gouvFacNom(f.detenteur)}</b>`).join(" · ")+`</p>`;
    const b2=document.createElement("div"); b2.innerHTML=fh; el.appendChild(b2);
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#3"); }
}
/* ===========================================================
   ANNONCE — onglet dédié, réservé à SA PROPRE faction (masqué ailleurs,
   voir `masque.annonce` dans formations.js). Marque l'annonce comme lue,
   ce qui éteint la pastille de l'onglet.
   =========================================================== */
/* Pastilles des onglets du Centre : une annonce non lue, une expédition
   programmée. Interrogées à part du rendu pour que l'information apparaisse
   même quand le joueur est sur un autre onglet. */
async function majPastillesCentre(){
  const fac = etat.faction; if(!fac) return;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  const pose = (onglet, libelle, n) => {
    const b = document.querySelector(`#hub-centre [data-centre="${onglet}"]`);
    if(b) b.innerHTML = libelle + (n ? `<span class="centre-pastille">${n}</span>` : "");
  };
  try{
    const [a, e] = await Promise.all([
      sb.from("annonce_faction").select("cree_le").eq("faction",fac).maybeSingle(),
      sb.from("expeditions").select("id").eq("faction",fac).eq("resolue",false).limit(5)
    ]);
    const nouvelle = a.data && a.data.cree_le && etat.annonceFactionVue !== a.data.cree_le;
    pose("annonce", "Transmission", nouvelle ? 1 : 0);
    pose("guerres", "Expéditions", (e.data||[]).length);
  }catch(err){ if(typeof _catchLog==="function") _catchLog(err, "gouvernement.js#pastilles"); }
}

let _annRendu = 0;
async function majAnnonceFaction(el){
  const jeton = ++_annRendu;
  const fac = etat.faction;
  el.innerHTML = `<h3>Transmission — ${_gouvFacNom(fac)}</h3><p class="vide">Chargement…</p>`;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ el.innerHTML += `<p class="vide">Serveur indisponible.</p>`; return; }

  let ann = null;
  try{
    const { data, error } = await sb.from("annonce_faction").select("*").eq("faction",fac).maybeSingle();
    if(error) throw error;
    ann = data;
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#annonce");
    if(jeton === _annRendu) el.innerHTML = `<h3>Transmission — ${_gouvFacNom(fac)}</h3><p class="vide">Lecture impossible.</p>`;
    return;
  }
  if(jeton !== _annRendu) return;   // un autre rendu a pris la main

  let h = `<h3>Transmission — ${_gouvFacNom(fac)}</h3>${_blasonFaction(fac)}`;
  if(ann && ann.texte && ann.texte.trim()){
    const rendu = (typeof _formatMur==="function") ? _formatMur(ann.texte) : ann.texte.replace(/</g,"&lt;");
    const quand = ann.cree_le ? new Date(ann.cree_le).toLocaleString("fr-FR") : "";
    h += `<div class="ann-carte">
        <div class="ann-tete">📡 Transmission du Régent${quand?` <span class="itip-gris">· ${echapper(quand)}</span>`:""}</div>
        <div class="ann-txt">${rendu}</div></div>`;
    // Marquée comme lue : c'est ce qui éteint la pastille de l'onglet.
    if(etat.annonceFactionVue !== ann.cree_le){
      etat.annonceFactionVue = ann.cree_le;
      if(typeof sauvegarder==="function") sauvegarder();
    }
  } else {
    h += `<p class="vide">Aucune transmission en cours. Le Régent peut en diffuser une depuis son Bureau.</p>`;
  }
  el.innerHTML = h;
  if(typeof majPastillesCentre==="function") majPastillesCentre();
}

let _bureauVue = null;
function _bureauNom(b){ return {regent:"Régent",architecte:"Architecte",chef_guerre:"Stratège",espion:"Ombre",concertation:"Concertation"}[b]||b; }

/* ===========================================================
   CONCERTATION — discussion entre les quatre charges d'une faction.
   Les MP ne permettent pas un échange à quatre, et un successeur n'en
   hériterait pas : l'historique est attaché à la FACTION.
   Serveur : gouv_chat_lire / gouv_chat_ecrire, qui revérifient l'appartenance
   au gouvernement à chaque appel — perdre son poste, c'est perdre l'accès.
   Messages effacés au bout de 5 jours (gouv_chat_purge, cron horaire).
   =========================================================== */
let _concRendu = 0, _concTimer = null;

async function _rendreConcertation(z, fac){
  const jeton = ++_concRendu;
  z.innerHTML = `<h3>Concertation — ${_gouvFacNom(fac)}</h3>
    <p class="itip-gris" style="margin:0 0 8px">Visible des seules charges de ta faction. Les messages s'effacent au bout de <b>5 jours</b>.</p>
    <div class="conc-fil" id="conc-fil"><p class="vide">Chargement…</p></div>
    <div class="conc-saisie">
      <textarea id="conc-txt" rows="2" maxlength="800" placeholder="Écrire au gouvernement…"></textarea>
      <button class="mini" id="conc-envoi">Envoyer</button>
    </div>`;

  const envoyer = async () => {
    const c = z.querySelector("#conc-txt"); const t = (c.value||"").trim();
    if(!t) return;
    const b = z.querySelector("#conc-envoi"); if(b) b.disabled = true;
    const { data:r, error } = await sb.rpc("gouv_chat_ecrire", { p_texte: t });
    if(b) b.disabled = false;
    if(error || !r || !r.ok){
      const e = r && r.err;
      if(e==="pas_membre")      journal("Tu n'es plus membre du gouvernement.","alerte");
      else if(e==="trop_vite")  journal("Trop de messages coup sur coup — laisse passer un moment.","alerte");
      else if(e==="trop_long")  journal("Message trop long (800 caractères).","alerte");
      else journal("Envoi impossible.","alerte");
      return;
    }
    c.value = "";
    await _concCharger(z, true);
  };
  z.querySelector("#conc-envoi").addEventListener("click", envoyer);
  z.querySelector("#conc-txt").addEventListener("keydown", e => {
    if(e.key==="Enter" && (e.ctrlKey||e.metaKey)) envoyer();   // Ctrl+Entrée : envoyer
  });

  await _concCharger(z, true);
  // Rafraîchissement pendant qu'on reste sur l'onglet.
  clearInterval(_concTimer);
  _concTimer = setInterval(() => {
    if(jeton !== _concRendu || !document.querySelector("#conc-fil")){ clearInterval(_concTimer); return; }
    _concCharger(z, false);
  }, 20000);
}

async function _concCharger(z, forcerBas){
  const fil = z.querySelector("#conc-fil"); if(!fil) return;
  const { data:r, error } = await sb.rpc("gouv_chat_lire", { p_limite: 60 });
  if(error || !r || !r.ok){
    fil.innerHTML = `<p class="vide">${(r && r.err==="pas_membre") ? "Réservé aux charges du gouvernement." : "Lecture impossible."}</p>`;
    return;
  }
  const liste = r.liste || [];
  if(!liste.length){ fil.innerHTML = `<p class="vide">Aucun message. Ouvre la discussion.</p>`; return; }

  // Ne recoller en bas que si l'on y était déjà : sinon on arrache la lecture.
  const enBas = forcerBas || (fil.scrollHeight - fil.scrollTop - fil.clientHeight < 40);
  fil.innerHTML = liste.map(m => {
    const q = m.cree_le ? new Date(m.cree_le).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "";
    return `<div class="conc-msg${m.moi?" moi":""}">
        <div class="conc-tete">${echapper(m.nom)} <span class="itip-gris">${echapper(q)}</span></div>
        <div class="conc-txt">${echapper(m.texte)}</div></div>`;
  }).join("");
  if(enBas) fil.scrollTop = fil.scrollHeight;
}
async function compterAnnonce(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  try{
    const { data } = await sb.from("annonce_faction").select("cree_le,texte").eq("faction",etat.faction).maybeSingle();
    const b=document.querySelector('#hub-centre [data-centre="gouvernement"]'); if(!b) return;
    const nouvelle = data && data.texte && data.texte.trim() && data.cree_le && (!etat.annonceFactionVue || new Date(data.cree_le)>new Date(etat.annonceFactionVue));
    b.innerHTML = "Gouvernement" + (nouvelle?` <span style="background:var(--orange,#ff8a3d);color:#0a1020;border-radius:9px;padding:0 6px;font-size:11px;font-weight:700">1</span>`:"");
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#4"); }
}
async function _chargerMesRolesGouv(){
  try{ const s=await sessionActuelle(); if(!s) return [];
    const { data } = await sb.from("gouvernement").select("role").eq("faction",etat.faction).eq("profil_id",s.user.id);
    return (data||[]).map(r=>r.role);
  }catch(e){ return []; }
}
const OBJECTIFS=[{id:"pillage",nom:"Pillage"},{id:"sabotage",nom:"Sabotage"},{id:"raid",nom:"Raid éclair"},{id:"assaut",nom:"Assaut"}];
function _expObjNom(id){ return (OBJECTIFS.find(o=>o.id===id)||{}).nom||id; }
function _htmlObjectifsExplication(){
  return `<div class="exp-aide"><b>Les objectifs d'expédition :</b><br>
    <b>Pillage</b> — voler des crédits du coffre adverse : 20 % vont au coffre de ta faction, le reste est partagé entre les enrôlés.<br>
    <b>Sabotage</b> — endommager la défense adverse (ronge la péremption ; ne détruit un objet que s'il est déjà très usé).<br>
    <b>Raid éclair</b> — opération rapide et peu risquée : petits gains, faibles pertes en cas d'échec.<br>
    <b>Assaut</b> — grande offensive : gros gains possibles, mais coûteuse et risquée.</div>`;
}
function _expCibleNom(id){ if(id==="protocole") return "Le Protocole"; return ((typeof FACTIONS!=="undefined"?FACTIONS:[]).find(f=>f.id===id)||{}).nom||id; }
// Brouillon du formulaire d'expédition : les rafraîchissements périodiques
// redessinent Le Centre, on ne veut pas perdre les choix du Stratège.
let _expForm = { cible:"", obj:"", jours:"1", desc:"" };
// Mêmes brouillons pour les autres zones de saisie du Gouvernement.
let _regForm = { annonce:null, dest:"", msg:"" };
let _candForm = { prog:null };
function _brouillon(el, id, cle, obj, evt){
  const n = el.querySelector(id); if(!n) return;
  if(obj[cle]!=null) n.value = obj[cle];
  n.addEventListener(evt||"input", ()=>{ obj[cle]=n.value; });
}
async function _chargerExpedition(fac){
  let exp=null, enroles=[], moiEnrole=false, moiParticipe=false, nbParticipants=0;
  try{ const { data } = await sb.from("expeditions").select("*").eq("faction",fac).eq("resolue",false)
        .order("date_prevue",{ascending:true}).limit(1);
    exp=(data&&data[0])||null; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#5"); }
  if(exp){ try{
    const { data } = await sb.from("expedition_enroles").select("profil_id").eq("expedition_id",exp.id);
    const ids=(data||[]).map(r=>r.profil_id);
    const s=await sessionActuelle(); const moiId=s?s.user.id:null; moiEnrole=ids.includes(moiId);
    const noms={}; if(ids.length){ const { data:pubs } = await sb.from("profils_publics").select("id,nom").in("id",ids); for(const p of (pubs||[])) noms[p.id]=p.nom; }
    enroles=ids.map(id=>noms[id]||"(?)");
    try{ const { data:pp } = await sb.from("expedition_participants").select("profil_id").eq("expedition_id",exp.id); const pids=(pp||[]).map(r=>r.profil_id); nbParticipants=pids.length; moiParticipe=pids.includes(moiId); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#6"); }
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#7"); } }
  const enResolution = !!(exp && !exp.resolue && exp.date_prevue && new Date(exp.date_prevue)<=Date.now());
  return { exp, enroles, moiEnrole, moiParticipe, nbParticipants, enResolution };
}
async function _htmlProtoDef(exp){
  // Renseignement classé : la défense du jour ne se lit qu'en console dev.
  // Pour les joueurs, c'est à l'Ombre d'aller la chercher en hackant le Protocole.
  return "";
}
function _htmlExpeditionInfo(exp, enroles){
  const date=exp.date_prevue?((typeof _dateHeure==="function")?_dateHeure(exp.date_prevue):new Date(exp.date_prevue).toLocaleString("fr-FR")):"non fixée";
  return `<div class="gouv-annonce"><b>${_expObjNom(exp.objectif)}</b> → cible : <b>${_expCibleNom(exp.cible)}</b><br><span class="itip-gris">Prévu : ${date}</span>${exp.description?`<div style="margin-top:6px">${exp.description.replace(/</g,"&lt;")}</div>`:""}<div class="itip-gris" style="margin-top:6px">Enrôlés (${enroles.length}) : ${enroles.length?enroles.join(", "):"personne"}</div></div>`;
}
async function _htmlDefenseConsult(fac){
  try{
    const { data } = await sb.from("reserve").select("*").eq("faction",fac).eq("en_defense",true);
    const objs=data||[]; let defAll={};
    try{ const { data:d } = await sb.from("defense_objets").select("*"); (d||[]).forEach(x=>defAll[x.id]=x); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#8"); }
    let sd=0,sr=0,se=0; const noms=[];
    objs.forEach(o=>{ const d=defAll[o.item_id]; if(d){ sd+=d.def; sr+=d.riposte; se+=d.detection; noms.push(d.nom); } });
    return `<p>Total : 🛡️ <b>${sd}</b> · ⚔️ <b>${sr}</b> · 👁️ <b>${se}</b> <span class="itip-gris">(${objs.length}/4 cases)</span></p>${noms.length?`<p class="itip-gris">${noms.join(", ")}</p>`:'<p class="vide">Aucun objet en défense.</p>'}`;
  }catch(e){ return `<p class="vide">Indisponible.</p>`; }
}
async function majExpeditions(el){
  if(!el) return; const fac=etat.faction;
  el.innerHTML=`<p class="vide">Chargement…</p>`;
  const { exp, enroles, moiEnrole } = await _chargerExpedition(fac);
  let h=`<h3>Expéditions — ${_gouvFacNom(fac)}</h3>`;
  if(!exp){ h+=`<p class="vide">Aucune expédition en cours. Le Stratège peut en lancer une (Bureau → Stratège).</p>`+_htmlObjectifsExplication(); el.innerHTML=h; return; }
  const info=await _chargerExpedition(fac);
  h+=_htmlExpeditionInfo(exp, enroles);
  h+=await _htmlProtoDef(exp);
  if(info.enResolution){
    h+=`<div class="gouv-annonce" style="border-color:#ff5257;background:rgba(255,82,87,.08)">⚔️ <b>Ralliement ouvert — l'assaut se résout automatiquement.</b><br><span class="itip-gris">Participants confirmés : ${info.nbParticipants}. Confirme ta présence maintenant : le combat est résolu peu après l'heure annoncée.</span></div>`;
    if(info.moiEnrole && !info.moiParticipe) h+=`<div style="margin-top:8px"><button class="mini" id="exp-participer">Participer à l'assaut (−15% énergie)</button></div>`;
    else if(info.moiParticipe) h+=`<p class="itip-gris" style="margin-top:6px">✓ Tu participes à cet assaut.</p>`;
  } else {
    h+=`<p class="itip-gris" style="margin-top:6px">Tu ne participeras que si tu es <b>dans ta faction</b> et as <b>≥15% d'énergie</b> au moment de la résolution.</p>`;
    h+=`<div style="margin-top:8px"><button class="mini${moiEnrole?" danger":""}" id="exp-enrole">${moiEnrole?"Me désinscrire":"M'enrôler"}</button></div>`;
  }
  h+=_htmlObjectifsExplication();
  el.innerHTML=h;
  const be=el.querySelector("#exp-enrole"); if(be) be.addEventListener("click", ()=>_expEnroler(!moiEnrole));
  const bp=el.querySelector("#exp-participer"); if(bp) bp.remove();
}
async function _expEnroler(v){
  const { data:res, error } = await sb.rpc("enroler",{ p_enrole:v });
  if(error||!res||!res.ok){ journal("Action impossible.","alerte"); return; }
  journal(v?"Tu es enrôlé pour l'expédition.":"Tu t'es désinscrit.","gain"); if(typeof majCentre==="function") majCentre();
}
async function _rendreBureauStratege(el, fac){
  if(!el) return;
  el.innerHTML=`<p class="vide">Chargement…</p>`;
  const roles=await _chargerMesRolesGouv(); const estStrat=roles.includes("chef_guerre");
  const { exp, enroles } = await _chargerExpedition(fac);
  const defHtml=await _htmlDefenseConsult(fac);
  let h=`<h3>Bureau du Stratège</h3>`;
  h+=`<h4 class="gsec">Défense de la faction</h4>${defHtml}`;
  h+=`<h4 class="gsec" style="margin-top:16px">Expédition</h4>`;
  if(exp){
    h+=_htmlExpeditionInfo(exp, enroles);
    h+=await _htmlProtoDef(exp);
    const info=await _chargerExpedition(fac);
    if(info.enResolution) h+=`<div style="margin-top:8px"><span class="itip-gris">${info.nbParticipants} participant(s) — la résolution est <b>automatique</b> à l'heure prévue.</span></div>`;
    if(estStrat) h+=`<div style="margin-top:8px"><button class="mini danger" id="exp-suppr">Annuler l'expédition</button></div>`;
  } else if(estStrat){
    const _sel=(v,ref)=>(String(v)===String(ref)?" selected":"");
    const cibles=`<option value="protocole"${_sel("protocole",_expForm.cible)}>Le Protocole</option>`+(typeof FACTIONS!=="undefined"?FACTIONS:[]).filter(f=>f.id!==fac).map(f=>`<option value="${f.id}"${_sel(f.id,_expForm.cible)}>${f.nom}</option>`).join("");
    const objs=OBJECTIFS.map(o=>`<option value="${o.id}"${_sel(o.id,_expForm.obj)}>${o.nom}</option>`).join("");
    h+=`<div class="reg-compose"><label class="itip-gris">Cible<select id="exp-cible" class="gouv-textarea" style="padding:8px">${cibles}</select></label><label class="itip-gris" id="exp-obj-lbl">Objectif<select id="exp-obj" class="gouv-textarea" style="padding:8px">${objs}</select></label><label class="itip-gris">Échéance<select id="exp-jours" class="gouv-textarea" style="padding:8px">${[1,2,3,4,5].map(j=>`<option value="${j}"${_sel(j,_expForm.jours)}>Dans ${j} jour${j>1?"s":""}</option>`).join("")}</select></label><span class="itip-gris" id="exp-quand" style="font-size:12px"></span><textarea id="exp-desc" class="gouv-textarea" rows="2" placeholder="Courte description…">${(_expForm.desc||"").replace(/</g,"&lt;")}</textarea><button class="mini" id="exp-creer">Créer l'expédition</button></div>`;
  } else h+=`<p class="vide">Aucune expédition en cours.</p>`;
  h+=_htmlObjectifsExplication();
  if(estStrat){
    h+=`<h4 class="gsec">Mercenaires</h4>`;
    h+=`<p class="itip-gris" style="font-size:12px">Dès <b>50</b> de réputation dans un Cercle, engage ses mercenaires (payés par la <b>caisse</b>). Ils renforcent l'attaque ET la défense de la faction (+10 puissance chacun). Rompable à tout moment, sans remboursement.</p>`;
    let mercs={}; try{ const { data } = await sb.from("mercenaires").select("*").eq("faction",fac); (data||[]).forEach(mm=>mercs[mm.cercle]=mm.nombre); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#9"); }
    const cc=etat.cercles||{}; let any=false;
    (typeof CERCLES!=="undefined"?CERCLES:[]).forEach(c=>{ const rp=cc[c.id]||0; if(rp>=50){ any=true;
      const mx=rp>=90?3:rp>=70?2:1, cur=mercs[c.id]||0, prix=1500*(cur+1);
      h+=`<div class="gouv-role"><span>${c.ic} <b>${c.nom}</b> <span class="itip-gris">${cur}/${mx} engagé(s)</span></span><span class="comm-btns">${cur<mx?`<button class="mini" data-merc="${c.id}">Engager (${prix} ₡)</button>`:""}${cur>0?`<button class="mini danger" data-mercr="${c.id}">Rompre</button>`:""}</span></div>`;
    }});
    if(!any) h+=`<p class="vide">Aucun Cercle à ≥50 de réputation. Gagnes-en via les quêtes.</p>`;
  }
  try{
    const { data:hist } = await sb.from("expeditions").select("cible,objectif,date_prevue,rapport")
      .eq("faction",fac).not("rapport","is",null).order("date_prevue",{ascending:false}).limit(1);
    if(hist && hist[0] && hist[0].rapport) h+=`<h4 class="gsec">Dernier compte rendu</h4>`+_expRapportHtml(hist[0]);
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#10"); }
  el.innerHTML=h;
  const br=el.querySelector("#exp-resoudre"); if(br) br.addEventListener("click", _expResoudre);
  const bs=el.querySelector("#exp-suppr"); if(bs) bs.addEventListener("click", _expSupprimer);
  el.querySelectorAll("[data-merc]").forEach(b=>b.addEventListener("click",()=>_mercEngager(b.dataset.merc)));
  el.querySelectorAll("[data-mercr]").forEach(b=>b.addEventListener("click",()=>_mercRompre(b.dataset.mercr)));
  const bc=el.querySelector("#exp-creer"); if(bc) bc.addEventListener("click", ()=>_expCreer(el));
  const _memo=()=>{ const g=id=>el.querySelector(id);
    if(g("#exp-cible")) _expForm.cible=g("#exp-cible").value;
    if(g("#exp-obj"))   _expForm.obj=g("#exp-obj").value;
    if(g("#exp-jours")) _expForm.jours=g("#exp-jours").value;
    if(g("#exp-desc"))  _expForm.desc=g("#exp-desc").value; };
  ["#exp-cible","#exp-obj","#exp-jours"].forEach(id=>{ const n=el.querySelector(id); if(n) n.addEventListener("change",_memo); });
  const nd=el.querySelector("#exp-desc"); if(nd) nd.addEventListener("input",_memo);
  const sj=el.querySelector("#exp-jours"), zq=el.querySelector("#exp-quand");
  if(sj && zq){ const majQ=()=>{ const d=new Date(Date.now()+(parseInt(sj.value,10)||1)*86400000);
      zq.textContent="Résolution le "+d.toLocaleString("fr-FR")+" — enrôlement ouvert jusque-là."; };
    sj.addEventListener("change", majQ); majQ(); }
  const sc=el.querySelector("#exp-cible");
  if(sc){ const maj=()=>{ const l=el.querySelector("#exp-obj-lbl"); if(l) l.style.display=(sc.value==="protocole")?"none":""; };
          sc.addEventListener("change", maj); maj(); }
}
async function _mercEngager(cercle){
  const { data:res, error } = await sb.rpc("mercenaires_engager",{ p_cercle:cercle });
  if(error || !res || !res.ok){ const e=res&&res.err;
    if(e==="max") journal("Maximum de mercenaires atteint pour ce Cercle.","alerte");
    else if(e==="caisse") journal(`Caisse insuffisante (${res.prix} ₡).`,"alerte");
    else if(e==="rep") journal("Réputation de Cercle insuffisante (50 min).","alerte");
    else if(e==="pas_stratege") journal("Réservé au Stratège.","alerte");
    else journal("Engagement impossible.","alerte"); return; }
  journal(`Mercenaires engagés (−${res.prix} ₡ de la caisse).`,"gain"); if(typeof majCentre==="function") majCentre();
}
async function _mercRompre(cercle){
  if(!confirm("Rompre le contrat avec ces mercenaires (sans remboursement) ?")) return;
  const { data:res, error } = await sb.rpc("mercenaires_rompre",{ p_cercle:cercle });
  if(error || !res || !res.ok){ journal("Impossible.","alerte"); return; }
  journal("Contrat rompu.","alerte"); if(typeof majCentre==="function") majCentre();
}
async function _expCreer(el){
  const cible=el.querySelector("#exp-cible").value;
  const obj=(cible==="protocole")?"assaut":el.querySelector("#exp-obj").value;
  const desc=(el.querySelector("#exp-desc").value||"").trim();
  const jours=parseInt(el.querySelector("#exp-jours").value,10)||1;
  const date=new Date(Date.now()+jours*86400000).toISOString();
  const { data:res, error } = await sb.rpc("creer_expedition",{ p_cible:cible, p_objectif:obj, p_description:desc, p_date:date });
  if(error||!res||!res.ok){ const e=res&&res.err;
    if(e==="existe") journal("Une expédition est déjà en cours.","alerte");
    else if(e==="pas_stratege") journal("Réservé au Stratège.","alerte");
    else journal("Création impossible.","alerte"); return; }
  _expForm={ cible:"", obj:"", jours:"1", desc:"" };
  journal("Expédition créée.","gain"); if(typeof majCentre==="function") majCentre();
}
async function _expParticiper(){
  let cout=15; try{ const { data } = await sb.rpc("a_fragment",{ p_faction:etat.faction, p_id:"frag_elan" }); if(data===true) cout=12; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#11"); }
  if((etat.energie||0) < cout){ journal(`Il te faut ≥${cout}% d'énergie pour participer.`,"alerte"); return; }
  const force=((typeof forceEffective==="function")?forceEffective():0)+((typeof agiliteEffective==="function")?agiliteEffective():0);
  const { data:res, error } = await sb.rpc("participer_expedition",{ p_force:force });
  if(error || !res || !res.ok){ const e=res&&res.err;
    if(e==="pas_encore") journal("La date de l'expédition n'est pas encore passée.","alerte");
    else if(e==="pas_enrole") journal("Tu n'es pas enrôlé.","alerte");
    else if(e==="deja_participe") journal("Tu participes déjà.","alerte");
    else journal("Participation impossible.","alerte"); return; }
  // ⚠ Code mort : la participation est automatique depuis la refonte des
  // expéditions (le serveur recrute les enrôlés présents et débite l'énergie).
  journal(`Tu rejoins l'assaut (−${cout}% énergie).`,"gain");
  if(typeof afficher==="function") afficher();
  if(typeof majCentre==="function") majCentre();
}
function _expRapportHtml(row){
  const r=row.rapport||{}; const noms={pillage:"Pillage",sabotage:"Sabotage",raid:"Raid éclair",assaut:"Assaut",protocole:"Assaut du Protocole"};
  const on=noms[r.objectif]||"Expédition";
  const quand=row.date_prevue?new Date(row.date_prevue).toLocaleString("fr-FR"):"—";
  if(r.raison==="aucun_participant") return `<p class="vide">${on} du ${quand} : <b>annulée</b>, aucun participant.</p>`;
  const verdict=r.succes?`<b style="color:var(--vert,#4caf50)">SUCCÈS</b>`:`<b style="color:var(--orange,#ff8a3d)">ÉCHEC</b>`;
  let d=`<p class="itip-gris" style="font-size:12px">${on} · ${quand} · ${verdict} <span class="itip-gris">(${r.p_att} vs ${r.p_def}, ${r.nb_att} participant(s))</span></p>`;
  if(r.objectif==="protocole"){
    if(r.succes){ d+=`<p class="itip-gris" style="font-size:12px">Butin : <b>${r.credits_par} ₡</b> par participant.${r.fragment_nom?` 🧩 Fragment récupéré : <b>${r.fragment_nom}</b> !`:""}</p>`; }
  } else if(r.succes){
    if(r.butin){
      const nbp = Math.max(1, r.nb_att||1);
      d+=`<p class="itip-gris" style="font-size:12px">Butin : <b>${r.butin} ₡</b> — ${r.part_coffre} au coffre, ${r.part_joueurs} partagés entre les <b>${r.nb_att} participant(s)</b>`
        + `${(r.nb_enroles!=null && r.nb_enroles>r.nb_att)?` (sur ${r.nb_enroles} enrôlés : les absents ne touchent rien)`:""} : <b>${Math.floor(r.part_joueurs/nbp)} ₡ chacun</b>.</p>`;
    }
    if(r.objets_touches||r.objets_detruits) d+=`<p class="itip-gris" style="font-size:12px">Défense adverse : ${r.objets_touches} objet(s) endommagé(s)${r.objets_detruits?`, <b>${r.objets_detruits} détruit(s)</b>`:""}.</p>`;
  }
  return d;
}
async function _expResoudre(){
  const { data:res, error } = await sb.rpc("resoudre_expedition");
  if(error || !res || !res.ok){ const e=res&&res.err;
    if(e==="auto_seulement") journal("La résolution est automatique à l'heure prévue.","alerte");
    else if(e==="pas_encore") journal("La date de l'expédition n'est pas encore passée.","alerte");
    else if(e==="protocole_a_venir") journal("Les attaques contre le Protocole arrivent bientôt.","alerte");
    else if(e==="objectif_a_venir") journal("Cet objectif n'est pas encore résolvable.","alerte");
    else journal("Résolution impossible.","alerte"); return; }
  const noms={pillage:"Pillage",sabotage:"Sabotage",raid:"Raid éclair",assaut:"Assaut"};
  const on=noms[res.objectif]||"Assaut";
  if(res.raison==="aucun_participant"){ journal("Personne n'a participé : l'expédition échoue.","alerte"); }
  else if(res.objectif==="protocole"){
    if(res.succes){ journal(`Assaut du Protocole RÉUSSI ! (${res.p_att} vs ${res.p_def}) — ${res.credits_par} ₡ par participant. Cristaux distribués à la synchro.`,"gain"); if(res.fragment) journal(`🧩 Fragment récupéré sur le Protocole : ${res.fragment_nom} !`,"gain"); }
    else journal(`Assaut du Protocole ÉCHOUÉ (${res.p_att} vs ${res.p_def}). Le Protocole a résisté.`,"alerte");
  }
  else if(res.succes){
    if(res.objectif==="sabotage") journal(`${on} RÉUSSI ! (${res.p_att} vs ${res.p_def}) — ${res.objets_touches} objet(s) endommagé(s)${res.objets_detruits?`, ${res.objets_detruits} détruit(s)`:""}.`,"gain");
    else journal(`${on} RÉUSSI ! (${res.p_att} vs ${res.p_def}) — ${res.butin} ₡ (${res.part_coffre} coffre, ${res.part_joueurs} partagés)${res.objets_touches?` · ${res.objets_touches} objet(s) sabotés`:""}.`,"gain");
  }
  else{ journal(`${on} ÉCHOUÉ (${res.p_att} vs ${res.p_def}). La défense a tenu.`,"alerte"); }
  if(typeof rechargerCredits==="function") await rechargerCredits();
  if(typeof syncEffetsCombat==="function") await syncEffetsCombat();
  if(typeof syncPrison==="function") await syncPrison();
  if(typeof afficher==="function") afficher();
  if(typeof majCentre==="function") majCentre();
}
async function syncEffetsCombat(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  try{ const { data } = await sb.rpc("consommer_effets");
    if(data && data.xp && typeof gagnerXp==="function"){
      gagnerXp(data.xp);
      journal(`Expérience de campagne : +${data.xp} XP.`,"gain");
    }
    if(data && data.energie){
      // data.energie est NÉGATIF (coût). L'appliquer en local ne servait à rien :
      // le serveur détient l'énergie et écrasait au premier appel suivant.
      if(data.energie < 0) await agirServeur({ cout: -data.energie, motif:"campagne" });
      journal(`Effort de campagne : ${data.energie} % d'énergie.`,"alerte");
      if(typeof sauvegarder==="function") sauvegarder();
    }
    if(data && (data.sante||data.moral)){
      if(!etat.jauges) etat.jauges={o2:90,sante:100,moral:80};
      // Les effets de combat modifient des jauges SERVEUR : on passe par agir(),
      // qui borne, enregistre et détecte la mort éventuelle.
      await agirServeur({ jauges:{ sante:(data.sante||0), moral:(data.moral||0) }, motif:"effets_combat" });
      if(typeof sauvegarder==="function") sauvegarder();
      if(typeof afficher==="function") afficher();
      const parts=[]; if(data.sante) parts.push(`${data.sante>0?"+":""}${data.sante} santé`); if(data.moral) parts.push(`${data.moral>0?"+":""}${data.moral} moral`);
      if(parts.length) journal("Séquelles de bataille : "+parts.join(", ")+".", (data.sante<0||data.moral<0)?"alerte":"gain");
    }
    if(data && data.cristaux && data.cristaux>0){
      // ⚠ Avant : ajouterAuSac local → cristaux FANTÔMES (invisibles du serveur).
      const r = await agirServeur({ ajouter:{ cristal:data.cristaux }, motif:"butin_protocole" });
      const ok = r ? ((r.ajoutes||{}).cristal || 0) : 0;
      if(ok>0){ journal(`Butin du Protocole : +${ok} Cristal de Nyx !`,"gain"); if(typeof afficher==="function") afficher(); }
      if(ok<data.cristaux) journal(`${data.cristaux-ok} Cristal de Nyx perdu (sac plein).`,"alerte");
    }
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#12"); }
  // Comptes rendus déposés par le serveur (expéditions résolues hors ligne).
  try{ const { data:evs } = await sb.rpc("consommer_evenements");
    if(Array.isArray(evs) && evs.length){
      evs.forEach(ev=>{ if(ev && ev.texte) journal(ev.texte, "alerte", ev.cat||"combat"); });
      if(typeof sauvegarder==="function") sauvegarder();
    }
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#13"); }
}
async function _expSupprimer(){
  if(!confirm("Annuler l'expédition en cours ?")) return;
  const { data:res, error } = await sb.rpc("supprimer_expedition");
  if(error||!res||!res.ok){ journal("Impossible.","alerte"); return; }
  journal("Expédition annulée.","alerte"); if(typeof majCentre==="function") majCentre();
}

async function _rendreBureauRegent(el, fac){
  el.innerHTML = `<p class="vide">Chargement…</p>`;
  let annonce=""; try{ const { data } = await sb.from("annonce_faction").select("texte").eq("faction",fac).maybeSingle(); if(data) annonce=data.texte||""; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#14"); }
  let msgs=[]; try{ await sb.rpc("regent_purge"); const { data } = await sb.from("regent_messages").select("*").order("cree_le",{ascending:false}).limit(50); msgs=data||[]; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#15"); }
  const facOpts=(typeof FACTIONS!=="undefined"?FACTIONS:[]).filter(f=>f.id!==fac).map(f=>`<option value="${f.id}">${f.nom}</option>`).join("");
  const facNom=id=>((typeof FACTIONS!=="undefined"?FACTIONS:[]).find(x=>x.id===id)||{}).nom||id;
  let h=`<h3>Bureau du Régent</h3>`;
  h+=`<h4 class="gsec">Annonce officielle (vue par tes membres)</h4>`;
  h+=`<div class="mur-outils" id="reg-ann-outils"></div><textarea id="reg-annonce" class="gouv-textarea" rows="3" placeholder="Message à ta faction…">${((_regForm.annonce!=null?_regForm.annonce:(annonce||""))).replace(/</g,"&lt;")}</textarea><div><button class="mini" id="reg-ann-pub">Publier l'annonce</button></div>`;
  h+=`<h4 class="gsec" style="margin-top:16px">Messagerie entre Régents</h4>`;
  h+=`<div class="reg-compose"><select id="reg-dest" class="gouv-textarea" style="padding:8px"><option value="">Tous les Régents</option>${facOpts}</select><textarea id="reg-msg" class="gouv-textarea" rows="2" placeholder="Ton message aux Régents…">${(_regForm.msg||"").replace(/</g,"&lt;")}</textarea><button class="mini" id="reg-envoyer">Envoyer</button></div>`;
  if(!msgs.length) h+=`<p class="vide">Aucun message pour l'instant.</p>`;
  else h+=msgs.map(m=>{ const dest=m.a_faction?("à "+facNom(m.a_faction)):"à tous"; return `<div class="poste-ligne"><span class="poste-txt"><b>${facNom(m.de_faction)}</b> <span class="itip-gris">${dest} · ${(typeof _dateHeure==="function")?_dateHeure(m.cree_le):""}</span><br>${(typeof _formatMur==="function")?_formatMur(m.texte):(m.texte||"").replace(/</g,"&lt;")}</span></div>`; }).join("");
  el.innerHTML=h;
  if(typeof _remplirBarreMur==="function"){ _remplirBarreMur("#reg-ann-outils"); if(typeof _brancherOutilsMur==="function") _brancherOutilsMur("#reg-annonce","#reg-ann-outils"); }
  _brouillon(el, "#reg-annonce", "annonce", _regForm, "input");
  _brouillon(el, "#reg-dest", "dest", _regForm, "change");
  _brouillon(el, "#reg-msg", "msg", _regForm, "input");
  el.querySelector("#reg-ann-pub").addEventListener("click", async()=>{
    _regForm.annonce=null;
    const t=(el.querySelector("#reg-annonce").value||"").trim();
    const { data:res, error } = await sb.rpc("publier_annonce",{ p_texte:t });
    if(error || !res || !res.ok){ journal("Publication impossible.","alerte"); return; }
    journal("Annonce publiée pour ta faction.","gain");
  });
  el.querySelector("#reg-envoyer").addEventListener("click", async()=>{
    const dest=el.querySelector("#reg-dest").value; const t=(el.querySelector("#reg-msg").value||"").trim(); if(!t) return;
    _regForm.msg="";
    const { data:res, error } = await sb.rpc("regent_envoyer",{ p_a_faction:dest, p_texte:t });
    if(error || !res || !res.ok){ journal("Envoi impossible.","alerte"); return; }
    journal("Message envoyé aux Régents.","gain"); if(typeof majCentre==="function") majCentre();
  });
}
/* Légende détaillée des objets de défense (v0.59). Les valeurs viennent de
   resoudre_expedition_auto (bouclier ×2,5, présence ≥ 3, riposte 5 %/pt, prison
   6 h) et de espionnage.js (_espF1/_espF2) : à tenir à jour si ces règles changent. */
function _legendeDefense(ouvert){
  return `<details class="leg-def"${ouvert?" open":""}><summary>ℹ️ Comprendre la défense : 🛡️ ⚔️ 👁️ ✦</summary><dl>
    <dt>🛡️ Défense</dt><dd>Chaque point ajoute <b>2,5</b> à la puissance de ta faction quand une expédition ennemie l'attaque. Plein effet avec <b>au moins 3 défenseurs présents</b> en ville, effet partiel en dessous, <b>aucun si personne</b> n'est là. +1 si ta faction détient le fragment du Rempart.</dd>
    <dt>⚔️ Riposte</dt><dd>Quand un <b>Assaut</b> ennemi échoue, chaque point donne <b>5 %</b> de chance (50 % au plus) d'envoyer chaque assaillant <b>6 h en prison</b>. +1 avec le fragment de la Riposte.</dd>
    <dt>👁️ Détection</dt><dd>Complique les mini-jeux de l'<b>Ombre</b> adverse qui espionne ta faction : 0 à 2 facile, 3 à 5 moyen, 6 et plus difficile. Le contre-espionnage ajoute +3.</dd>
    <dt>✦ Signature</dt><dd>Objet propre à ta faction : les autres factions ne peuvent pas le fabriquer.</dd>
    <dt>Cases</dt><dd><b>4 cases</b> de défense, un objet par type. Seuls les objets <b>placés</b> comptent ; ceux du coffre attendent. À la fabrication, l'objet va en défense s'il reste une case, sinon au coffre.</dd>
    <dt>Usure</dt><dd>Chaque objet expire au bout de sa durée. Un <b>Sabotage</b> ou un <b>Assaut</b> ennemi réussi ronge cette durée, jusqu'à détruire l'objet.</dd>
  </dl></details>`;
}
async function majBureau(el){
  if(!el) return;
  const fac = etat.faction;
  el.innerHTML = `<p class="vide">Chargement…</p>`;
  const roles = await _chargerMesRolesGouv();
  const estRegent = roles.includes("regent");
  let bureaux = estRegent ? ["regent","architecte","chef_guerre","espion"] : roles.filter(r=>["architecte","chef_guerre","espion"].includes(r));
  if(!bureaux.length){ el.innerHTML = `<p class="vide">Tu n'as pas de bureau (aucun rôle au gouvernement).</p>`; return; }
  /* Onglet commun aux quatre charges : la Concertation appartient au
     GOUVERNEMENT, pas à un rôle. Ajouté en fin de menu pour ne pas déplacer
     les repères des joueurs habitués. */
  bureaux = bureaux.concat(["concertation"]);
  if(!_bureauVue || !bureaux.includes(_bureauVue)) _bureauVue = bureaux[0];
  let h="";
  if(bureaux.length>1) h += `<div class="bur-menu">`+bureaux.map(b=>`<button class="bur-lien${_bureauVue===b?" actif":""}" data-bur="${b}">${_bureauNom(b)}</button>`).join("")+`</div>`;
  if(_bureauVue !== "concertation") h += _legendeDefense(false);   // v0.59 : même légende dans chaque bureau
  h += `<div id="bureau-corps"></div>`;
  el.innerHTML = h;
  el.querySelectorAll("[data-bur]").forEach(b=>b.addEventListener("click",()=>{ _bureauVue=b.dataset.bur; majBureau(el); }));
  const corps = el.querySelector("#bureau-corps");
  if(_bureauVue==="concertation") await _rendreConcertation(corps, fac);
  else if(_bureauVue==="architecte") await _rendreAtelier(corps, fac);
  else if(_bureauVue==="regent") await _rendreBureauRegent(corps, fac);
  else if(_bureauVue==="chef_guerre") await _rendreBureauStratege(corps, fac);
  else if(_bureauVue==="espion"){ if(typeof majBureauOmbre==="function") await majBureauOmbre(corps, fac); else corps.innerHTML=`<h3>Bureau de l'Ombre</h3><p class="itip-gris">à venir</p>`; }
}
function _joursRest(p){ return Math.max(0, Math.ceil((new Date(p)-Date.now())/86400000)); }
function _defTipEl(){ let t=document.querySelector("#def-tip"); if(!t){ t=document.createElement("div"); t.id="def-tip"; t.hidden=true; document.body.appendChild(t); } return t; }
function _defTip(e,o,d){ const t=_defTipEl(); t.innerHTML = d?`<b>${d.nom}</b><br>🛡️ ${d.def} · ⚔️ ${d.riposte} · 👁️ ${d.detection}<br>Expire dans ${_joursRest(o.peremption)} j`:o.item_id; t.hidden=false; _defTipPos(e); }
function _defTipTexte(e,txt){ const t=_defTipEl(); t.textContent=txt; t.hidden=false; _defTipPos(e); }
function _defTipPos(e){ const t=document.querySelector("#def-tip"); if(!t||t.hidden) return; t.style.left=(e.clientX+14)+"px"; t.style.top=(e.clientY+14)+"px"; }
function _defTipCacher(){ const t=document.querySelector("#def-tip"); if(t) t.hidden=true; }
function _actionDefense(o,d,enDefense){
  const m=_gouvModal();
  m.innerHTML=`<div class="membrane modale-boite"><h2>${d?d.nom:o.item_id}</h2>
    <p class="itip-gris">🛡️ ${d?d.def:0} · ⚔️ ${d?d.riposte:0} · 👁️ ${d?d.detection:0} · expire dans ${_joursRest(o.peremption)} j</p>
    <div class="actions">${enDefense?`<button class="mini" data-act="retirer">Retirer (→ coffre)</button>`:`<button class="mini" data-act="placer">Placer en défense</button>`}<button class="mini danger" data-act="detruire">Détruire</button><button class="mini" data-fermer="1">Fermer</button></div></div>`;
  m.hidden=false;
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
  m.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click",async()=>{
    const act=b.dataset.act;
    if(act==="detruire" && !confirm("Détruire définitivement cet objet ?")) return;
    const rpc = act==="retirer"?"retirer_defense":act==="placer"?"placer_defense":"detruire_reserve";
    const { data:res, error } = await sb.rpc(rpc,{ p_id:o.id });
    if(error || !res || !res.ok){ const e=res&&res.err;
      if(e==="defense_pleine") journal("Défense pleine (4 max).","alerte");
      else if(e==="doublon") journal("Tu as déjà ce type d'objet en défense.","alerte");
      else if(e==="coffre_plein") journal("Coffre plein — libère de la place.","alerte");
      else journal("Action impossible.","alerte"); return; }
    m.hidden=true; journal("Défense mise à jour.","gain"); if(typeof majCentre==="function") majCentre();
  }));
}
async function _rendreAtelier(el, fac){
  let objs=[];
  try{ const { data } = await sb.from("reserve").select("*").eq("faction",fac).order("cree_le",{ascending:false}); objs=data||[]; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#16"); }
  let defAll={}, defObj=[], defRec={};
  try{ const { data } = await sb.from("defense_objets").select("*"); (data||[]).forEach(d=>{ defAll[d.id]=d; }); defObj=(data||[]).filter(d=>!d.faction || d.faction===fac); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#17"); }
  try{ const { data } = await sb.from("defense_recettes").select("*"); (data||[]).forEach(r=>{ (defRec[r.objet_id]=defRec[r.objet_id]||[]).push(r); }); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#18"); }
  const nomItem=id=>(defAll[id]&&defAll[id].nom)||((typeof item==="function"&&item(id))?item(id).nom:id);
  const ic=id=>(typeof iconeItem==="function")?iconeItem(id):"▪";

  const enDef=objs.filter(o=>o.en_defense);
  const coffre=objs.filter(o=>!o.en_defense);
  const compos={}, coffreDef=[];
  coffre.forEach(o=>{ if(o.peremption) coffreDef.push(o); else compos[o.item_id]=(compos[o.item_id]||0)+1; });

  let h=`<h3>Atelier de l'Architecte</h3>`;
  h+=`<h4 class="gsec">Défense (${enDef.length}/4)</h4><div class="def-slots">`;
  for(let i=0;i<4;i++){ const o=enDef[i];
    if(o) h+=`<div class="def-slot rempli" data-defslot="${o.id}"><img src="images/items/${o.item_id}.png" class="def-img" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="def-emoji" style="display:none">🛡️</span><span class="def-j">${_joursRest(o.peremption)}j</span></div>`;
    else h+=`<div class="def-slot vide">·</div>`;
  }
  h+=`</div>`;
  h+=`<h4 class="gsec">Coffre de la faction (${coffre.length}/50)</h4><div class="coffre-cases">`;
  Object.keys(compos).forEach(id=>{ h+=`<div class="coffre-case" data-tip="${(nomItem(id)+' ×'+compos[id]).replace(/"/g,'&quot;')}">${ic(id)}<span class="cc-n">${compos[id]}</span></div>`; });
  coffreDef.forEach(o=>{ h+=`<div class="coffre-case defobj" data-coffredef="${o.id}"><img src="images/items/${o.item_id}.png" class="def-img" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="def-emoji" style="display:none">🛡️</span><span class="cc-j">${_joursRest(o.peremption)}j</span></div>`; });
  if(!coffre.length) h+=`<p class="vide">Coffre vide.</p>`;
  h+=`</div>`;
  h+=`<h4 class="gsec">Fabriquer</h4><p class="itip-gris" style="margin:0 0 6px">🛡️ Défense · ⚔️ Riposte · 👁️ Détection · ✦ Signature — le détail est dans « Comprendre la défense », en haut du bureau. L'objet va en défense s'il reste une case, sinon au coffre.</p>`;
  h+=defObj.map(d=>{ const rec=defRec[d.id]||[]; const ok=rec.every(r=>(compos[r.composant_id]||0)>=r.quantite);
    const recTxt=rec.map(r=>`${nomItem(r.composant_id)} <b class="${(compos[r.composant_id]||0)>=r.quantite?'or':''}">${compos[r.composant_id]||0}/${r.quantite}</b>`).join(" · ");
    return `<div class="gouv-role" style="align-items:flex-start"><span><b>${d.nom}</b>${d.faction?' <span class="itip-gris">✦</span>':''} <span class="itip-gris">🛡️${d.def} ⚔️${d.riposte} 👁️${d.detection} · ${d.peremption_jours} j</span><br><span class="itip-gris" style="font-size:12px">${recTxt}</span></span><button class="mini" data-fab="${d.id}"${ok?"":" disabled"}>Fabriquer</button></div>`;
  }).join("");

  el.innerHTML=h;
  el.querySelectorAll("[data-fab]").forEach(b=>b.addEventListener("click",()=>_fabriquerDefense(b.dataset.fab)));
  el.querySelectorAll("[data-defslot]").forEach(s=>{ const o=enDef.find(x=>String(x.id)===s.dataset.defslot); if(!o) return;
    s.addEventListener("mouseenter",e=>_defTip(e,o,defAll[o.item_id])); s.addEventListener("mousemove",_defTipPos); s.addEventListener("mouseleave",_defTipCacher);
    s.addEventListener("click",()=>{ _defTipCacher(); _actionDefense(o,defAll[o.item_id],true); }); });
  el.querySelectorAll("[data-coffredef]").forEach(s=>{ const o=coffreDef.find(x=>String(x.id)===s.dataset.coffredef); if(!o) return;
    s.addEventListener("mouseenter",e=>_defTip(e,o,defAll[o.item_id])); s.addEventListener("mousemove",_defTipPos); s.addEventListener("mouseleave",_defTipCacher);
    s.addEventListener("click",()=>{ _defTipCacher(); _actionDefense(o,defAll[o.item_id],false); }); });
  el.querySelectorAll(".coffre-case[data-tip]").forEach(s=>{ s.addEventListener("mouseenter",e=>_defTipTexte(e,s.dataset.tip)); s.addEventListener("mousemove",_defTipPos); s.addEventListener("mouseleave",_defTipCacher); });
}
async function _fabriquerDefense(id){
  const { data:res, error } = await sb.rpc("fabriquer_defense",{ p_objet:id });
  if(error || !res || !res.ok){
    const e=res&&res.err;
    if(e==="composants") journal("Composants insuffisants dans la réserve.","alerte");
    else if(e==="pas_architecte") journal("Réservé à l'Architecte.","alerte");
    else if(e==="pas_ta_faction") journal("Cet objet n'est pas disponible pour ta faction.","alerte");
    else journal("Fabrication impossible.","alerte");
    return;
  }
  journal("Objet de défense fabriqué et rangé dans la réserve.","gain");
  if(typeof majCentre==="function") majCentre();
}
/* Transmission de la charge de Régent. Deux confirmations plutôt qu'une :
   le pouvoir change de mains définitivement, sans élection, et l'ancien Régent
   ne peut pas revenir en arrière tout seul. */
function _regentTransmettre(){
  const m=_gouvModal();
  m.innerHTML=`<div class="membrane modale-boite"><h2>Transmettre la charge</h2>
    <p class="itip-gris" style="margin:0 0 8px">Entre le pseudo d'un membre de ta faction. <b>Tu cesseras d'être Régent immédiatement</b> et tu ne pourras pas revenir en arrière sans son accord.</p>
    <input type="text" id="tr-pseudo" placeholder="Pseudo" maxlength="24">
    <button class="valider" id="tr-valider">Transmettre</button></div>`;
  m.hidden=false;
  const inp=m.querySelector("#tr-pseudo"); if(inp) inp.focus();
  const go=async()=>{
    const nom=(inp.value||"").trim(); if(!nom) return;
    const id=(typeof _idDe==="function")?await _idDe(nom):null;
    if(!id){ journal("Pseudo introuvable.","alerte"); return; }
    const ok = (typeof confirmerJoli==="function")
      ? await confirmerJoli("Transmettre la charge",
          `${nom} deviendra Régent à ta place, tout de suite. Tu perds tes pouvoirs — nomination, Transmission, caisse — et seul le prochain scrutin, ou sa décision, pourra te les rendre.`,
          "Transmettre", true)
      : confirm(`Transmettre la charge de Régent à ${nom} ?`);
    if(!ok) return;
    const { data:res, error } = await sb.rpc("regent_transmettre",{ p_profil:id });
    if(error || !res || !res.ok){ const e=res&&res.err;
      if(e==="pas_meme_faction")  journal("Ce joueur n'est pas de ta faction.","alerte");
      else if(e==="pas_regent")   journal("Tu n'es pas Régent.","alerte");
      else if(e==="soi_meme")     journal("Tu es déjà Régent.","alerte");
      else if(e==="mort")         journal(`${res.nom} est mort — impossible de lui confier la charge.`,"alerte");
      else if(e==="en_pause")     journal(`${res.nom} est en pause — impossible de lui confier la charge.`,"alerte");
      else if(e==="introuvable")  journal("Pseudo introuvable.","alerte");
      else journal("Transmission impossible.","alerte");
      return; }
    m.hidden=true;
    journal(`Tu as transmis la charge de Régent à ${res.nom}.`,"alerte");
    if(typeof majCentre==="function") majCentre();
  };
  m.querySelector("#tr-valider").addEventListener("click", go);
  if(inp) inp.addEventListener("keydown", e=>{ if(e.key==="Enter") go(); });
  m.addEventListener("click", e=>{ if(e.target===m) m.hidden=true; });
}

function _regentNommer(role){
  const m=_gouvModal();
  const roleNom=(GOUV_ROLES.find(r=>r.id===role)||{}).nom||role;
  m.innerHTML=`<div class="membrane modale-boite"><h2>Nommer un ${roleNom}</h2>
    <p class="itip-gris" style="margin:0 0 8px">Entre le pseudo d'un membre de ta faction.</p>
    <input type="text" id="nom-pseudo" placeholder="Pseudo" maxlength="24">
    <button class="valider" id="nom-valider">Nommer</button></div>`;
  m.hidden=false;
  const inp=m.querySelector("#nom-pseudo"); if(inp) inp.focus();
  const go=async()=>{
    const nom=(inp.value||"").trim(); if(!nom) return;
    const id=(typeof _idDe==="function")?await _idDe(nom):null;
    if(!id){ journal("Pseudo introuvable.","alerte"); return; }
    const { data:res, error } = await sb.rpc("regent_nommer",{ p_role:role, p_profil:id });
    if(error || !res || !res.ok){ const e=res&&res.err;
      if(e==="pas_meme_faction") journal("Ce joueur n'est pas de ta faction.","alerte");
      else if(e==="pas_regent") journal("Tu n'es pas Régent.","alerte");
      else journal("Nomination impossible.","alerte"); return; }
    m.hidden=true; journal(`${nom} nommé ${roleNom}.`,"gain"); if(typeof majCentre==="function") majCentre();
  };
  m.querySelector("#nom-valider").addEventListener("click", go);
  if(inp) inp.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); });
}
async function _regentDemettre(role){
  if(!confirm("Démettre ce rôle ?")) return;
  const { data:res, error } = await sb.rpc("regent_nommer",{ p_role:role, p_profil:null });
  if(error || !res || !res.ok){ journal("Impossible.","alerte"); return; }
  journal("Rôle démis.","alerte"); if(typeof majCentre==="function") majCentre();
}
async function _demissionner(role){
  if(!confirm("Démissionner de ce rôle ?")) return;
  const { data:res, error } = await sb.rpc("demissionner",{ p_role:role });
  if(error || !res || !res.ok){ journal("Impossible.","alerte"); return; }
  journal("Tu as démissionné de ton rôle.","alerte"); if(typeof majCentre==="function") majCentre();
}

async function faireDon(){
  const inp = document.querySelector("#gouv-don-montant"); if(!inp) return;
  const m = parseInt(inp.value,10)||0;
  if(m < 1){ journal("Montant invalide.","alerte"); return; }
  if(typeof pousserCredits==="function") await pousserCredits();
  const { data:res, error } = await sb.rpc("caisse_don", { p_montant:m });
  if(error || !res || !res.ok){
    if(res && res.err==="plafond") journal(`Plafond de dons atteint. Reste aujourd'hui : ${res.reste} ₡.`,"alerte");
    else if(res && res.err==="fonds") journal("Crédits insuffisants.","alerte");
    else journal("Don impossible.","alerte");
    return;
  }
  if(typeof rechargerCredits==="function") await rechargerCredits();
  if(res.rep){ etat.reputation=Math.min(100,(etat.reputation||0)+res.rep); }
  journal(`Don de ${res.don} ₡ à la caisse${res.rep?` (+${res.rep} réputation)`:""} — reste ${res.reste_jour} ₡ aujourd'hui.`,"gain");
  apresAction();
  if(typeof majCentre==="function") majCentre();
}

/* ---------- Élection du Régent (5.2.b : candidatures & programmes) ---------- */
function _cycleActuel(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
function _phaseElection(){ const j=new Date().getDate(); if(j<3) return "depot"; if(j<5) return "vote"; return "resultat"; }
async function _chargerPhase(){ try{ const { data } = await sb.rpc("phase_election"); if(data) return data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#19"); } return _phaseElection(); }
async function _chargerCandidatures(fac){
  try{
    const { data } = await sb.from("candidatures").select("*").eq("faction",fac).eq("cycle",_cycleActuel());
    const rows=data||[]; const ids=[...new Set(rows.map(r=>r.profil_id))];
    const noms={}; if(ids.length){ const {data:pubs}=await sb.from("profils_publics").select("id,nom").in("id",ids); for(const p of (pubs||[])) noms[p.id]=p.nom; }
    return rows.map(r=>({ ...r, nom:noms[r.profil_id]||"(?)" }));
  }catch(e){ console.warn("[gouv] candidatures:", e.message); return []; }
}
async function _chargerVotes(fac){
  try{
    const { data } = await sb.from("votes").select("candidat_id,votant_id").eq("faction",fac).eq("cycle",_cycleActuel());
    const rows=data||[]; const decompte={}; let monVote=null;
    const s=await sessionActuelle(); const moiId=s?s.user.id:null;
    rows.forEach(v=>{ decompte[v.candidat_id]=(decompte[v.candidat_id]||0)+1; if(v.votant_id===moiId) monVote=v.candidat_id; });
    return { decompte, monVote, total:rows.length };
  }catch(e){ return { decompte:{}, monVote:null, total:0 }; }
}
async function majElections(el){
  if(!el) return;
  const fac = etat.faction;
  el.innerHTML = `<h3>Élections — ${_gouvFacNom(fac)}</h3><p class="vide">Chargement…</p>`;
  const phase = await _chargerPhase();
  let resultat = null;
  if(phase==="resultat"){ try{ const { data } = await sb.rpc("depouiller"); if(data && data.ok) resultat=data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#20"); } }
  const cands = await _chargerCandidatures(fac);
  const s = await sessionActuelle(); const moiId = s?s.user.id:null;
  const moiCand = cands.find(c=>c.profil_id===moiId);
  const vinfos = (phase==="vote"||phase==="resultat") ? await _chargerVotes(fac) : {decompte:{},monVote:null,total:0};

  let h = `<h3>Élections — ${_gouvFacNom(fac)}</h3>`;
  h += `<p class="itip-gris">📅 Cycle mensuel : <b>candidatures du 1 au 3</b>, <b>votes du 3 au 5</b>, <b>résultat le 5</b>. Voter rapporte <b>+2 réputation</b>.</p>`;
  const phaseTxt = phase==="depot" ? "🗳️ <b>Dépôt des candidatures</b> ouvert."
    : phase==="vote" ? "🗳️ <b>Votes en cours</b> — candidatures closes (tu peux te retirer)."
    : "📊 <b>Résultat de l'élection</b>.";
  h += `<p>${phaseTxt}</p>`;

  if(phase==="resultat"){
    if(resultat && resultat.gagnant){
      let nomG="?"; try{ const { data:pub } = await sb.from("profils_publics").select("nom").eq("id",resultat.gagnant).maybeSingle(); if(pub) nomG=pub.nom; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#21"); }
      h += `<div class="gouv-caisse"><span>Régent élu</span><b class="or">${nomG}${resultat.egalite?" (départage au hasard)":""}</b></div>`;
    } else {
      h += `<p class="vide">Aucun candidat ou aucune voix : pas de Régent ce mois-ci.</p>`;
    }
    if(cands.length) h += cands.map(c=>`<div class="gouv-role"><button class="comm-nom" data-profil="${c.nom}">${c.nom}</button><span class="itip-gris">${vinfos.decompte[c.profil_id]||0} voix</span></div>`).join("");
  } else {
    if(!cands.length) h += `<p class="vide">Aucun candidat pour l'instant.${phase==="depot"?" Présente-toi !":""}</p>`;
    else h += cands.map(c=>{
      const nb=vinfos.decompte[c.profil_id]||0;
      const voix = phase==="vote" ? ` <span class="itip-gris">· ${nb} voix</span>` : "";
      const aVote=!!vinfos.monVote, jaiVoteLui=vinfos.monVote===c.profil_id;
      let btnVote=""; if(phase==="vote"){ btnVote = aVote ? (jaiVoteLui?`<span class="itip-gris">✓ ton vote</span>`:"") : `<button class="mini" data-voter="${c.profil_id}" data-nom="${echapper(c.nom||"")}">Voter</button>`; }
      return `<div class="gouv-role"><button class="comm-nom" data-profil="${c.nom}">${c.nom}${c.profil_id===moiId?" (toi)":""}${voix}</button><span class="comm-btns">${btnVote}<button class="mini" data-prog="${c.profil_id}">Voir le programme</button>${(typeof estAdmin==="function"&&estAdmin())?`<button class="mini danger" data-admcand="${c.profil_id}" title="Supprimer (modération)">✕</button>`:""}</span></div>`;
    }).join("");
    if(phase==="vote" && vinfos.monVote) h += `<p class="itip-gris" style="margin-top:6px">Tu as voté. Ton choix est définitif.</p>`;
    else if(phase==="vote") h += `<p class="itip-gris" style="margin-top:6px">Une voix par personne, pour un candidat de ta faction. <b>Non modifiable</b> (+2 réputation).</p>`;
    let act="";
    if(phase==="depot"){ act = moiCand ? `<button class="mini" id="cand-modif">Modifier mon programme</button> <button class="mini danger" id="cand-retirer">Retirer ma candidature</button>` : `<button class="mini" id="cand-presenter">Me présenter</button>`; }
    else if(phase==="vote" && moiCand){ act = `<button class="mini danger" id="cand-retirer">Retirer ma candidature</button>`; }
    if(act) h += `<div style="margin-top:10px">${act}</div>`;
  }

  el.innerHTML = h;
  el.querySelectorAll("[data-profil]").forEach(x=>x.addEventListener("click",()=>{ if(typeof ouvrirPageProfil==="function") ouvrirPageProfil(x.dataset.profil); }));
  el.querySelectorAll("[data-prog]").forEach(x=>x.addEventListener("click",()=>{ const c=cands.find(k=>k.profil_id===x.dataset.prog); if(c) _voirProgramme(c.nom, c.programme); }));
  el.querySelectorAll("[data-voter]").forEach(x=>x.addEventListener("click",()=>_voter(x.dataset.voter, x.dataset.nom)));
  el.querySelectorAll("[data-admcand]").forEach(x=>x.addEventListener("click",async()=>{ if(!confirm("Supprimer cette candidature ?"))return; try{ await sb.rpc("admin_suppr_candidature",{p_profil:x.dataset.admcand,p_faction:fac,p_cycle:_cycleActuel()}); journal("Candidature supprimée (modération).","alerte"); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "gouvernement.js#22"); } if(typeof majCentre==="function") majCentre(); }));
  const bp=el.querySelector("#cand-presenter"); if(bp) bp.addEventListener("click",()=>_ouvrirCandidature(""));
  const bm=el.querySelector("#cand-modif"); if(bm) bm.addEventListener("click",()=>_ouvrirCandidature(moiCand?moiCand.programme:""));
  const br=el.querySelector("#cand-retirer"); if(br) br.addEventListener("click", _retirerCandidature);
}

function _gouvModal(){ let m=document.querySelector("#gouv-modal"); if(!m){ m=document.createElement("div"); m.id="gouv-modal"; m.className="modale"; m.hidden=true; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m) m.hidden=true; }); } return m; }
function _ouvrirCandidature(programme){
  const m=_gouvModal();
  m.innerHTML=`<div class="membrane modale-boite"><h2>Ton programme</h2>
    <p class="itip-gris" style="margin:0 0 8px">Texte libre. Tu peux insérer une image avec <b>[img]lien[/img]</b>. Visible par les membres de ta faction.</p>
    <textarea id="cand-prog" class="gouv-textarea" rows="8" maxlength="2000">${((_candForm.prog!=null?_candForm.prog:(programme||""))).replace(/</g,"&lt;")}</textarea>
    <button class="valider" id="cand-envoyer">Valider ma candidature</button></div>`;
  m.hidden=false;
  _brouillon(m, "#cand-prog", "prog", _candForm, "input");
  m.querySelector("#cand-envoyer").addEventListener("click", _soumettreCandidature);
}
async function _soumettreCandidature(){
  const t=(document.querySelector("#cand-prog").value||"").trim(); _candForm.prog=null;
  const { data:res, error } = await sb.rpc("candidater", { p_programme:t });
  if(error || !res || !res.ok){ if(res && res.err==="depot_ferme") journal("Le dépôt des candidatures est fermé (après le 3).","alerte"); else journal("Candidature impossible.","alerte"); return; }
  const m=document.querySelector("#gouv-modal"); if(m) m.hidden=true;
  journal("Candidature enregistrée. Bonne chance !","gain");
  if(typeof majCentre==="function") majCentre();
}
async function _retirerCandidature(){
  if(!confirm("Retirer ta candidature ?")) return;
  const { data:res, error } = await sb.rpc("retirer_candidature");
  if(error || !res || !res.ok){ journal("Retrait impossible.","alerte"); return; }
  journal("Candidature retirée.","alerte");
  if(typeof majCentre==="function") majCentre();
}
/* Boîte de confirmation maison, aux couleurs du jeu. La `confirm()` native
   est imposée par le navigateur : police système, pas de mise en forme, et
   sur mobile elle affiche le nom de domaine — pour un geste aussi engageant
   qu'un vote définitif, ça détonne. Renvoie une promesse booléenne, donc
   réutilisable ailleurs (candidature, démission…). */
function confirmerJoli(titre, texte, libelleOk, danger){
  return new Promise(resolve => {
    if(!document.querySelector("#cj-style")){
      const st=document.createElement("style"); st.id="cj-style";
      st.textContent = `
        #cj-fond{ position:fixed; inset:0; background:rgba(4,8,18,.72); z-index:9500;
          display:flex; align-items:center; justify-content:center; padding:18px;
          animation:cj-f .16s ease-out; }
        .cj-boite{ background:var(--surface,#101a30); border:1px solid var(--edge,#24344d);
          border-radius:14px 5px 14px 5px; box-shadow:0 18px 50px rgba(0,0,0,.6);
          max-width:400px; width:100%; padding:18px 20px 16px; animation:cj-b .18s ease-out; }
        .cj-boite h4{ margin:0 0 8px; font-size:14px; letter-spacing:.05em; text-transform:uppercase;
          color:var(--orange-hi,#ffb060); }
        .cj-boite p{ margin:0 0 16px; font-size:14px; line-height:1.5; color:var(--texte,#dfe8f2); }
        .cj-actions{ display:flex; gap:9px; justify-content:flex-end; flex-wrap:wrap; }
        .cj-actions button{ padding:8px 15px; border-radius:9px 3px 9px 3px; cursor:pointer;
          font-family:inherit; font-size:13px; background:transparent;
          border:1px solid var(--line,#24344d); color:var(--sourdine,#8b95a8); }
        .cj-actions .cj-ok{ border-color:var(--orange,#ff8a3d); color:var(--orange-hi,#ffb060); }
        .cj-actions .cj-ok.danger{ border-color:#ff5257; color:#ff7a7e; }
        .cj-actions button:hover{ color:#fff; }
        @keyframes cj-f{ from{opacity:0} to{opacity:1} }
        @keyframes cj-b{ from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
        @media (prefers-reduced-motion: reduce){ #cj-fond,.cj-boite{ animation:none; } }
      `;
      document.head.appendChild(st);
    }
    const fond=document.createElement("div"); fond.id="cj-fond";
    fond.innerHTML = `<div class="cj-boite" role="dialog" aria-modal="true">
        <h4>${echapper(titre)}</h4>
        <p>${echapper(texte)}</p>
        <div class="cj-actions">
          <button class="cj-non">Annuler</button>
          <button class="cj-ok${danger?" danger":""}">${echapper(libelleOk||"Confirmer")}</button>
        </div></div>`;
    document.body.appendChild(fond);

    const fin = v => { document.removeEventListener("keydown", clavier); fond.remove(); resolve(v); };
    const clavier = e => { if(e.key==="Escape") fin(false); if(e.key==="Enter") fin(true); };
    document.addEventListener("keydown", clavier);
    fond.querySelector(".cj-ok").addEventListener("click", ()=>fin(true));
    fond.querySelector(".cj-non").addEventListener("click", ()=>fin(false));
    fond.addEventListener("click", e=>{ if(e.target===fond) fin(false); });   // clic hors cadre = annuler
    fond.querySelector(".cj-ok").focus();
  });
}

async function _voter(candidatId, nom){
  if(!await confirmerJoli(
      "Confirmer ton vote",
      nom ? `Tu votes pour ${nom}. Un seul vote par cycle, et il est définitif.`
          : "Un seul vote par cycle, et il est définitif.",
      "Voter")) return;
  const { data:res, error } = await sb.rpc("voter", { p_candidat:candidatId });
  if(error || !res || !res.ok){
    const e=res&&res.err;
    if(e==="deja_vote") journal("Tu as déjà voté.","alerte");
    else if(e==="hors_vote") journal("Les votes ne sont pas ouverts (jour 3-4 du mois).","alerte");
    else if(e==="candidat") journal("Candidat invalide.","alerte");
    else journal("Vote impossible.","alerte");
    return;
  }
  if(res.rep){ etat.reputation=Math.min(100,(etat.reputation||0)+res.rep); }
  journal(`Vote enregistré (+${res.rep||0} réputation).`,"gain");
  if(typeof majCentre==="function") majCentre();
}
function _voirProgramme(nom, programme){
  const m=_gouvModal();
  const html=(typeof renduDescription==="function" && programme && programme.trim()) ? renduDescription(programme) : `<p class="vide">Programme vide.</p>`;
  m.innerHTML=`<div class="membrane modale-boite"><h2>Programme de ${nom}</h2><div style="white-space:pre-wrap;line-height:1.55;max-height:60vh;overflow:auto">${html}</div><button class="valider" data-fermer="1" style="margin-top:12px">Fermer</button></div>`;
  m.hidden=false;
  m.querySelector("[data-fermer]").addEventListener("click",()=>{ m.hidden=true; });
}
