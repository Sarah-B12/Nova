/* ===========================================================
   TRAQUE — plaintes, primes, Wanted, chasseurs de primes.
   Cadrage complet : PASSATION « 🧭 CADRAGE TERMINÉ » (27/09).
   v1.23 — brique 1 : les PLAINTES (onglet Prison → Plaintes) et la PRIME
   (bureau du Régent). Tout est décidé par le serveur (v123_plaintes.sql,
   BACKEND_PLAN §39) ; ce fichier affiche et transmet.
   Les chiffres ci-dessous ne servent qu'aux TEXTES : le serveur les
   applique de son côté (barème dupliqué, BACKEND_PLAN §6).
   =========================================================== */
const PLAINTE_DELAI_H  = 48;     // la victime a 48 h pour porter plainte
const PRIME_DELAI_H    = 24;     // le Régent a 24 h pour statuer
const PRIME_MIN        = 100;
const PRIME_MAX        = 2000;

let _tqStyleMonte = false;
function _tqStyle(){
  if(_tqStyleMonte) return; _tqStyleMonte = true;
  const s = document.createElement("style");
  s.textContent = `
    .tq-menu{ display:flex; gap:6px; margin:0 0 12px; flex-wrap:wrap; }
    .tq-lien{ padding:5px 12px; min-height:40px; border-radius:8px 3px 8px 3px; background:rgba(16,40,37,.7); color:var(--sourdine); border:1px solid var(--line); cursor:pointer; }
    .tq-lien.actif{ color:var(--orange-hi,#ffb060); border-color:var(--orange,#ff8a3d); }
    .tq-carte{ border:1px solid var(--line); border-radius:10px 4px 10px 4px; padding:10px 12px; margin:0 0 8px; background:rgba(16,40,37,.45); }
    .tq-carte p{ margin:4px 0; }
    .tq-etat{ font-size:.85em; padding:2px 8px; border-radius:6px; border:1px solid var(--line); white-space:nowrap; }
    .tq-etat.prime{ color:var(--orange-hi,#ffb060); border-color:var(--orange,#ff8a3d); }
    .tq-etat.classee{ color:var(--sourdine); }
    .tq-prime{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px; }
    .tq-prime input{ width:7.5em; min-height:40px; padding:4px 8px; background:rgba(0,0,0,.25); color:inherit; border:1px solid var(--line); border-radius:6px; font:inherit; }
  `;
  document.head.appendChild(s);
}
function _tqReste(iso){
  const ms = new Date(iso) - Date.now(); if(!(ms > 0)) return "expiré";
  const h = Math.floor(ms/3600e3), m = Math.floor((ms%3600e3)/60e3);
  return h >= 1 ? `${h} h ${String(m).padStart(2,"0")}` : `${m} min`;
}
function _tqQuand(iso){ return (typeof _dateHeure==="function") ? _dateHeure(iso) : new Date(iso).toLocaleString(); }
/* Ce qui a été pris : objets (identifiants → noms) ou crédits. */
function _tqButin(x){
  if(x.mode === "hack") return `${x.credits||0} ₡ siphonnés`;
  const b = x.butin || {};
  const l = Object.keys(b).map(id=>`${b[id]}× ${(typeof item==="function" && item(id)) ? item(id).nom : id}`).join(", ");
  return (l || "des objets") + (x.valeur ? ` <span class="itip-gris">(valeur de brade ${x.valeur} ₡)</span>` : "");
}
const _TQ_STATUT = {
  en_attente: ["⏳ en attente du Régent", ""],
  prime:      ["🎯 prime posée", "prime"],
  classee:    ["classée sans suite", "classee"],
  soldee:     ["✔ voleur capturé", "prime"],
  rendue:     ["prime rendue (compte supprimé)", "classee"]
};
async function _tqRpc(appel, repere){
  try{
    let { data, error } = await appel();
    if(!error && data && data.err==="non_connecte" && typeof reprendreSession==="function" && await reprendreSession())
      ({ data, error } = await appel());
    if(error){ console.warn("[traque] "+repere+" :", error.message); return null; }
    return data;
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "traque.js#"+repere); return null; }
}

/* ---------- Onglet Prison → Plaintes (la victime) ---------- */
async function majPlaintes(el){
  if(!el) return; _tqStyle();
  el.innerHTML = `<h3 style="margin:2px 0">Plaintes</h3><p class="vide">Chargement…</p>`;
  const d = await _tqRpc(()=>sb.rpc("plaintes_mes_vols"), "mes_vols");
  if(!d || !d.ok){ el.innerHTML = `<h3 style="margin:2px 0">Plaintes</h3><p class="vide">Le serveur n'a pas répondu — réessaie.</p>`; return; }
  let h = `<h3 style="margin:2px 0">Plaintes</h3>
    <p class="vide">Quand on t'a volé <b>et que tu as vu qui</b>, tu as <b>${PLAINTE_DELAI_H} h</b> pour porter plainte. Elle part au <b>Régent de ta faction</b>, qui a ${PRIME_DELAI_H} h pour mettre (ou non) une prime sur la tête du voleur. Un vol anonyme, ou une simple tentative, ne donne pas lieu à plainte.</p>`;
  if(!d.regent) h += `<p class="vide" style="color:var(--coral)">Ta faction n'a pas de Régent en ce moment : personne ne peut instruire une plainte.</p>`;
  const l = d.liste || [];
  if(!l.length) h += `<p class="vide">Aucun vol à signaler, aucune plainte en cours.</p>`;
  for(const x of l){
    const qui = echapper(x.voleur || "?");
    if(x.vol){
      h += `<div class="tq-carte"><p><b>${qui}</b> t'a ${x.mode==="hack"?"piraté":"volé"} le ${_tqQuand(x.vol_le)} : ${_tqButin(x)}.</p>
        <p class="itip-gris">Plainte possible encore ${_tqReste(x.limite)}.</p>
        <button class="mini" data-plainte="${x.vol}" ${d.regent?"":"disabled"}>Porter plainte</button></div>`;
    } else {
      const [lib, cls] = _TQ_STATUT[x.statut] || [x.statut, ""];
      const suite = x.statut==="en_attente" ? ` <span class="itip-gris">· le Régent a encore ${_tqReste(x.limite)}</span>`
                  : (x.statut==="prime" ? ` <b class="or">${x.montant} ₡</b>` : "");
      h += `<div class="tq-carte"><p>Plainte contre <b>${qui}</b> <span class="tq-etat ${cls}">${lib}</span>${suite}</p>
        <p class="itip-gris">Vol du ${_tqQuand(x.vol_le)} : ${_tqButin(x)} · déposée le ${_tqQuand(x.depose_le)}</p></div>`;
    }
  }
  el.innerHTML = h;
  el.querySelectorAll("[data-plainte]").forEach(b=>b.addEventListener("click", async()=>{
    b.disabled = true;
    const r = await _tqRpc(()=>sb.rpc("plainte_deposer", { p_vol: Number(b.dataset.plainte) }), "deposer");
    const err = r && r.err;
    if(r && r.ok) journal("Plainte déposée : elle attend le Régent de ta faction.","gain");
    else journal({ pas_de_regent:"Ta faction n'a pas de Régent pour l'instruire.",
                   delai:`Trop tard : plus de ${PLAINTE_DELAI_H} h ont passé.`,
                   deja:"Tu as déjà porté plainte pour ce vol.",
                   pas_plaignable:"Ce vol ne donne pas lieu à plainte." }[err] || "Le serveur n'a pas enregistré la plainte — réessaie.","alerte");
    majPlaintes(el);
  }));
}

/* ---------- Bureau du Régent → Plaintes à instruire ---------- */
async function rendrePlaintesRegent(el){
  if(!el) return; _tqStyle();
  el.innerHTML = `<h4 class="gsec">Plaintes à instruire</h4><p class="vide">Chargement…</p>`;
  const d = await _tqRpc(()=>sb.rpc("regent_plaintes"), "regent");
  if(!d || !d.ok){ el.innerHTML = ""; return; }
  const l = d.liste || [];
  let h = `<h4 class="gsec">Plaintes à instruire</h4>
    <p class="itip-gris">Tu as <b>${PRIME_DELAI_H} h</b> par plainte. Une prime (${PRIME_MIN} à ${PRIME_MAX} ₡) est <b>retirée du coffre tout de suite</b> et ne peut plus être changée ; les primes d'un même voleur s'additionnent sur Wanted. Sans décision, la plainte est classée.</p>`;
  if(!l.length) h += `<p class="vide">Aucune plainte ces sept derniers jours.</p>`;
  for(const x of l){
    const [lib, cls] = _TQ_STATUT[x.statut] || [x.statut, ""];
    h += `<div class="tq-carte"><p><b>${echapper(x.plaignant||"?")}</b> accuse <b>${echapper(x.accuse||"?")}</b>
        <span class="tq-etat ${cls}">${lib}</span>${x.statut==="prime"?` <b class="or">${x.montant} ₡</b>`:""}</p>
      <p>${x.mode==="hack"?"Piratage":"Vol"} du ${_tqQuand(x.vol_le)} : ${_tqButin(x)}.</p>`;
    if(x.statut==="en_attente"){
      const max = Math.min(PRIME_MAX, d.solde|0);
      h += `<p class="itip-gris">Déposée le ${_tqQuand(x.depose_le)} · il te reste ${_tqReste(x.limite)}.</p>`
        + (max >= PRIME_MIN
          ? `<div class="tq-prime"><input type="number" inputmode="numeric" min="${PRIME_MIN}" max="${max}" step="10" value="${PRIME_MIN}" data-montant="${x.id}" aria-label="Montant de la prime"> ₡
               <button class="mini" data-prime="${x.id}">Mettre à prix</button></div>`
          : `<p class="vide" style="color:var(--coral)">Le coffre (${d.solde|0} ₡) ne permet pas une prime de ${PRIME_MIN} ₡.</p>`);
    }
    h += `</div>`;
  }
  el.innerHTML = h;
  el.querySelectorAll("[data-prime]").forEach(b=>b.addEventListener("click", async()=>{
    const inp = el.querySelector(`[data-montant="${b.dataset.prime}"]`);
    const m = Math.round(Number(inp && inp.value));
    if(!(m >= PRIME_MIN && m <= PRIME_MAX)){ journal(`La prime va de ${PRIME_MIN} à ${PRIME_MAX} ₡.`,"alerte"); return; }
    if(!await confirmerJoli("Mettre à prix", `Mettre ${m} ₡ de la caisse sur cette tête ? C'est définitif.`, "Mettre à prix", true)) return;
    b.disabled = true;
    const r = await _tqRpc(()=>sb.rpc("regent_prime", { p_plainte: Number(b.dataset.prime), p_montant: m }), "prime");
    const err = r && r.err;
    if(r && r.ok) journal(`Prime de ${m} ₡ posée. Coffre : ${r.solde} ₡.`,"gain");
    else journal({ caisse:`Le coffre n'a que ${r&&r.solde} ₡.`, montant:`La prime va de ${PRIME_MIN} à ${PRIME_MAX} ₡.`,
                   deja:"Cette plainte est déjà tranchée (ou classée).", accuse_parti:"Le compte de l'accusé n'existe plus.",
                   pas_regent:"Tu n'es plus Régent." }[err] || "Le serveur n'a pas enregistré la prime — réessaie.","alerte");
    if(typeof majCentre==="function" && document.querySelector("#bureau-caisse")) majCentre(); else rendrePlaintesRegent(el);
  }));
}

/* ===========================================================
   v1.24 — LA CHASSE (briques 2 à 5) — serveur : v124_traque.sql, §40.
   Wanted (onglet Prison) → Pister (mini-jeu « Les registres du Relais »,
   10 % d'énergie, 3 essais par cible et par jour) → piste = point EXACT
   → « Se rendre à… » sur la carte → Traquer (10 %), depuis la carte.
   =========================================================== */
const TRAQUE_ENERGIE = 10;
const TRAQUE_ESSAIS  = 3;
const _TQ_SECTEURS = { silene:"Silène", ecart:"Triptolème", braise:"La Braise", suaire:"Le Suaire" };
function _tqSecteurNom(s){
  if(typeof SURFACES!=="undefined" && SURFACES[s] && SURFACES[s].nom) return SURFACES[s].nom;
  return _TQ_SECTEURS[s] || s;
}
let _tqWanted = null, _tqWantedLe = 0;          // dernière liste reçue (pistes comprises)
async function _tqRafraichir(force){
  if(!force && _tqWanted && Date.now() - _tqWantedLe < 30000) return _tqWanted;
  const d = await _tqRpc(()=>sb.rpc("wanted_liste"), "wanted");
  if(d && d.ok){ _tqWanted = d; _tqWantedLe = Date.now(); }
  return _tqWanted;
}
function _tqPortrait(av){
  const L = (typeof _avCouches==="function" && av) ? _avCouches(av) : [];
  return `<span class="tq-portrait">${L.length ? L.map(c=>_avImg(c,"tq-couche")).join("") : `<span class="tq-sans">?</span>`}</span>`;
}
function _tqStyle2(){
  if(document.querySelector("#tq-style2")) return;
  const s = document.createElement("style"); s.id = "tq-style2";
  s.textContent = `
    .tq-wanted{ display:flex; gap:12px; align-items:flex-start; }
    .tq-lien-profil{ cursor:pointer; }
    /* v1.36u — le portrait est dans un <span> lien depuis la v1.36b : sans
       display:block, ce span restait « en ligne » et le portrait (un span de
       64 × 86) perdait sa taille → têtes invisibles. */
    span.tq-lien-profil{ display:block; flex:0 0 auto; }
    .tq-portrait{ display:block; }
    .tq-lien-profil:hover b, b.tq-lien-profil:hover{ text-decoration:underline; }
    .tq-portrait{ position:relative; flex:0 0 auto; width:64px; height:86px; border-radius:8px; overflow:hidden; background:rgba(0,0,0,.35); border:1px solid var(--orange,#ff8a3d); }
    .tq-couche{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .tq-sans{ display:flex; height:100%; align-items:center; justify-content:center; color:var(--sourdine); font-size:1.6em; }
    .tq-total{ font-size:1.25em; color:var(--orange-hi,#ffb060); font-weight:bold; }
    .tq-actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
    /* v1.33e : le style de .tq-outils vit dans carte.css (un seul endroit). */
    .tq-coord{ font-family:ui-monospace,Consolas,monospace; color:var(--sourdine); }
    .tq-traquer{ border-color:var(--orange,#ff8a3d) !important; color:var(--orange-hi,#ffb060) !important; }
    #tq-modale{ position:fixed; inset:0; z-index:60; background:rgba(0,0,0,.72); display:flex; align-items:center; justify-content:center; padding:10px; }
    #tq-modale[hidden]{ display:none; }
    .tq-jeu{ width:min(560px,100%); background:var(--fond,#0c1d1b); border:1px solid var(--line); border-radius:12px 4px 12px 4px; padding:12px; }
    .tq-jeu h3{ margin:0 0 6px; }
    .tq-sig{ font-family:ui-monospace,Consolas,monospace; font-size:1.3em; letter-spacing:.08em; color:var(--orange-hi,#ffb060); }
    .tq-flux{ position:relative; height:300px; overflow:hidden; margin:8px 0; border:1px solid var(--line); border-radius:6px; background:rgba(0,0,0,.35); touch-action:manipulation; user-select:none; -webkit-user-select:none; }
    .tq-ligne{ position:absolute; left:0; right:0; height:40px; line-height:40px; padding:0 10px; white-space:nowrap; overflow:hidden; font-family:ui-monospace,Consolas,monospace; font-size:14px; border-bottom:1px solid rgba(255,255,255,.05); cursor:pointer; }
    .tq-ligne:hover{ background:rgba(255,255,255,.04); }
    .tq-ligne.touche{ background:rgba(90,200,140,.25); }
    .tq-ligne.faux{ background:rgba(240,90,80,.35); }
    .tq-bas{ display:flex; justify-content:space-between; align-items:center; gap:8px; }
  `;
  document.head.appendChild(s);
}

/* ---------- Onglet Prison → Wanted ---------- */
async function majWanted(el){
  if(!el) return; _tqStyle(); _tqStyle2();
  el.innerHTML = `<h3 style="margin:2px 0">Wanted</h3><p class="vide">Chargement…</p>`;
  const d = await _tqRafraichir(true);
  if(!d){ el.innerHTML = `<h3 style="margin:2px 0">Wanted</h3><p class="vide">Le serveur n'a pas répondu — réessaie.</p>`; return; }
  let h = `<h3 style="margin:2px 0">Wanted</h3>
    <p class="vide">Les têtes mises à prix par les Régents. Un chasseur de primes <b>piste</b> sa cible (mini-jeu, ${TRAQUE_ENERGIE} % d'énergie, ${TRAQUE_ESSAIS} essais par jour et par cible), obtient <b>le point exact</b> où elle se trouvait, s'y rend, puis la <b>traque</b> depuis la carte (${TRAQUE_ENERGIE} %). Si elle a bougé, la piste est froide.</p>`;
  if(!d.chasseur) h += `<p class="vide" style="color:var(--coral)">Il te faut l'aptitude <b>Traque</b> pour chasser.</p>`;
  const l = d.liste || [];
  if(!l.length) h += `<p class="vide">Aucune tête à prix en ce moment.</p>`;
  for(const x of l){
    const fac = (typeof FACTIONS!=="undefined" && FACTIONS.find(f=>f.id===x.faction)) || null;
    const etatBadge = x.etat==="mort" ? `<span class="tq-etat classee">mort</span>` : (x.etat==="prison" ? `<span class="tq-etat classee">en prison</span>` : "");
    let act = "";
    if(x.moi) act = `<p class="itip-gris">C'est toi.</p>`;
    else if(d.chasseur && !x.etat){
      act = `<div class="tq-actions"><button class="mini" data-pister="${x.id}" data-nom="${echapper(x.nom||"")}" ${x.essais>0?"":"disabled"}>Pister (${Math.max(0,x.essais)}/${TRAQUE_ESSAIS} · −${TRAQUE_ENERGIE} %)</button></div>`;
      if(x.piste) act += `<p>Piste : <b>${_tqSecteurNom(x.piste.secteur)} — ${x.piste.x} · ${x.piste.y}</b> <span class="itip-gris">(relevée le ${_tqQuand(x.piste.le)})</span><br>
          <span class="itip-gris">Rends-toi exactement à ce point (« Se rendre à… » sur la carte), puis <b>Traquer</b> depuis la carte.</span></p>`;
      if(x.retraque) act += `<p class="itip-gris">Nouvelle traque possible dans ${_tqReste(x.retraque)}.</p>`;
    }
    /* v1.36b — retour testeur : portrait et nom mènent à la page perso. */
    const lien = x.nom ? ` data-tq-profil="${echapper(x.nom)}" role="button" tabindex="0" title="Voir la page de ${echapper(x.nom)}"` : "";
    h += `<div class="tq-carte tq-wanted"><span class="tq-lien-profil"${lien}>${_tqPortrait(x.avatar)}</span><div style="flex:1; min-width:0">
        <p><b class="tq-lien-profil"${lien}>${echapper(x.nom||"?")}</b> ${etatBadge}<br><span class="itip-gris">${fac?fac.nom:""}</span></p>
        <p><span class="tq-total">${x.total} ₡</span> <span class="itip-gris">· ${x.plaintes} plainte${x.plaintes>1?"s":""}</span></p>
        ${act}</div></div>`;
  }
  el.innerHTML = h;
  el.querySelectorAll("[data-pister]").forEach(b=>b.addEventListener("click", ()=>_tqPister(b.dataset.pister, b.dataset.nom, ()=>majWanted(el))));
  el.querySelectorAll("[data-tq-profil]").forEach(b=>{
    const ouvrir = ()=>{ if(typeof ouvrirPageProfil==="function") ouvrirPageProfil(b.dataset.tqProfil); };
    b.addEventListener("click", ouvrir);
    b.addEventListener("keydown", e=>{ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); ouvrir(); } });
  });
}

/* ---------- Pister : essai serveur → mini-jeu → piste ---------- */
async function _tqPister(cible, nom, apres){
  const d = await _tqRpc(()=>sb.rpc("traque_essai_debut", { p_cible: cible }), "essai_debut");
  if(!d || !d.ok){
    journal({ aptitude:"Il te faut l'aptitude Traque.", essais:"Plus d'essai sur cette cible aujourd'hui.",
              energie:"Pas assez d'énergie.", en_prison:"Ta cible est déjà en prison.", indisponible:"Ta cible est hors d'atteinte (morte ou absente).",
              pas_recherche:"Plus aucune prime sur cette tête.", soi_meme:"Tu ne peux pas te traquer toi-même.",
              prison:"Tu es en prison.", mort:"Tu es mort." }[d && d.err] || "Le serveur n'a pas répondu — rien n'a été dépensé.","alerte","traque");
    if(apres) apres(); return;
  }
  if(typeof d.energie==="number"){ etat.energie = d.energie; etat.energieMaj = Date.now(); }
  if(typeof afficher==="function") afficher();
  const fin = async (gagne)=>{
    const r = await _tqRpc(()=>sb.rpc("traque_essai_fin", { p_id: d.id, p_reussi: !!gagne }), "essai_fin");
    if(r && r.ok && r.gagne && r.piste)
      journal(`Trace trouvée : ${nom} était à ${_tqSecteurNom(r.piste.secteur)}, au point ${r.piste.x} · ${r.piste.y}. Rends-toi exactement là, puis Traquer depuis la carte.`,"gain","traque");
    else if(r && r.ok && r.gagne) journal(`Trace trouvée, mais le signal de ${nom} est brouillé : impossible de le situer.`,"alerte","traque");
    else journal(`Tu perds la trace de ${nom}. Essais restants aujourd'hui : ${d.essais}.`,"alerte","traque");
    await _tqRafraichir(true);
    if(apres) apres();
  };
  lancerMiniTraque(nom, ()=>fin(true), ()=>fin(false));
}

/* ---------- Mini-jeu : Les registres du Relais ---------- */
/* Des lignes de journal montent. Toucher TOUTES celles qui portent la
   signature, et elles seules : un leurre touché ou une signature qui
   s'échappe, c'est perdu. Les leurres ne diffèrent que d'UN caractère,
   choisi parmi des formes proches (0/O/Q, 1/I/L/7, 5/S…).
   ⚠ Durée plancher : le serveur refuse une victoire en moins de 15 s ; la
   k-ième signature n'apparaît donc pas avant k × 3,2 s. */
const TQ_JEU = { cibles:6, hauteur:300, ligne:40, vitesse0:55, vitesse1:115, spawn0:950, spawn1:520, pCible:0.28, pLeurre:0.5, ecartCible:3200, echauffe:2500 };
const _TQ_PROCHES = { "0":"OQD", O:"0QD", Q:"O0", D:"0O", "1":"IL7", I:"1L", L:"1I", "7":"1T", T:"7", "5":"S", S:"5", "8":"B3", B:"8", "3":"8", "2":"Z", Z:"2", "6":"G", G:"6", "9":"g" };
const _TQ_ALPHA = "0OQD1IL7T5S8B32Z6G9AKXRNMVW";
function _tqAlea(s){ return s[Math.floor(Math.random()*s.length)]; }
function _tqSignature(){ let s=""; for(let i=0;i<4;i++) s += _tqAlea(_TQ_ALPHA); return s.slice(0,2)+"-"+s.slice(2); }
function _tqLeurre(sig){
  const pos = [0,1,3,4].filter(i=>_TQ_PROCHES[sig[i]]);
  const i = pos.length ? _tqAlea(pos) : _tqAlea([0,1,3,4]);
  const choix = _TQ_PROCHES[sig[i]] || _TQ_ALPHA.replace(sig[i],"");
  return sig.slice(0,i) + _tqAlea(choix) + sig.slice(i+1);
}
function lancerMiniTraque(nom, win, lose){
  _tqStyle2();
  let m = document.querySelector("#tq-modale");
  if(!m){ m = document.createElement("div"); m.id = "tq-modale"; m.hidden = true; document.body.appendChild(m); }
  const sig = _tqSignature();
  m.innerHTML = `<div class="tq-jeu" role="dialog" aria-label="Les registres du Relais">
    <h3>Les registres du Relais</h3>
    <p class="vide">Les journaux de passage de ${echapper(nom||"ta cible")} défilent. Touche <b>chaque</b> ligne qui porte sa signature — et <b>aucune autre</b>. Une seule qui t'échappe, un seul faux pas : la trace est perdue.</p>
    <p>Signature : <span class="tq-sig">${sig}</span></p>
    <div class="tq-flux" id="tq-flux"></div>
    <div class="tq-bas"><span id="tq-prog">0 / ${TQ_JEU.cibles}</span><span><button class="mini" id="tq-go">Commencer</button> <button class="mini" id="tq-abandon">Abandonner</button></span></div></div>`;
  m.hidden = false;
  const flux = m.querySelector("#tq-flux"), prog = m.querySelector("#tq-prog");
  let lignes = [], touches = 0, emises = 0, fini = false, timer = null, t0 = 0, dernierSpawn = 0, dernierTick = 0;
  const heure = ()=>{ const d=new Date(Date.now()-Math.random()*6*3600e3); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
  const ACTIONS = ["passage sas nord","achat comptoir","relais 4 → relais 9","badge atelier","transit orbital","consigne casier 12","ping balise","sortie cité","paiement auberge","dock 3"];
  const terminer = (ok)=>{ if(fini) return; fini = true; clearInterval(timer); setTimeout(()=>{ m.hidden = true; m.innerHTML = ""; ok ? win() : lose(); }, ok ? 400 : 900); };
  const creer = (t)=>{
    const avance = t - t0;
    const peutCible = avance >= TQ_JEU.echauffe && avance >= emises * TQ_JEU.ecartCible && emises < TQ_JEU.cibles;
    const r = Math.random();
    const type = (peutCible && r < TQ_JEU.pCible) ? "cible" : (r < TQ_JEU.pCible + TQ_JEU.pLeurre ? "leurre" : "bruit");
    const s = type==="cible" ? sig : (type==="leurre" ? _tqLeurre(sig) : _tqSignature());
    if(type==="cible") emises++;
    const d = document.createElement("div"); d.className = "tq-ligne";
    d.textContent = `${heure()}  R${1+Math.floor(Math.random()*9)}  ${s}  ${_tqAlea(ACTIONS)}`;
    d.style.top = TQ_JEU.hauteur + "px";
    const L = { el:d, y:TQ_JEU.hauteur, cible: type==="cible" && s===sig, vu:false };
    d.addEventListener("pointerdown", (e)=>{ e.preventDefault(); if(fini || L.vu) return;
      if(L.cible){ L.vu = true; d.classList.add("touche"); touches++; prog.textContent = `${touches} / ${TQ_JEU.cibles}`; if(touches >= TQ_JEU.cibles) terminer(true); }
      else { d.classList.add("faux"); terminer(false); } });
    flux.appendChild(d); lignes.push(L);
  };
  const tick = ()=>{
    const t = Date.now(), dt = Math.min(100, t - (dernierTick || t)) / 1000; dernierTick = t;
    const f = Math.min(1, (t - t0) / 30000);
    const v = TQ_JEU.vitesse0 + (TQ_JEU.vitesse1 - TQ_JEU.vitesse0) * f;
    const spawn = TQ_JEU.spawn0 + (TQ_JEU.spawn1 - TQ_JEU.spawn0) * f;
    if(t - dernierSpawn >= spawn){ dernierSpawn = t; creer(t); }
    for(const L of lignes){ L.y -= v * dt; L.el.style.top = L.y.toFixed(1) + "px";
      if(L.y < -TQ_JEU.ligne && !L.sorti){ L.sorti = true; L.el.remove(); if(L.cible && !L.vu){ terminer(false); return; } } }
    lignes = lignes.filter(L=>!L.sorti);
  };
  m.querySelector("#tq-go").addEventListener("click", (e)=>{ e.currentTarget.disabled = true; t0 = Date.now(); dernierSpawn = 0; timer = setInterval(tick, 30); });
  m.querySelector("#tq-abandon").addEventListener("click", ()=>terminer(false));
}

/* ---------- Sur les cartes : coordonnées, « Se rendre à… », Traquer ---------- */
/* v1.34i — « Aller » en deux temps, sur les trois cartes : 1er clic = la
   visée orange se pose sur les coordonnées tapées (on voit le coût), le
   bouton devient « Y aller » ; 2e clic, x et y inchangés et la visée
   toujours au même endroit = on part vers ce point EXACT. Changer x ou y (ou
   voir la visée effacée / déplacée) le remet à « Aller ».
   viser(x,y) pose la visée · vise() la lit · partir(x,y) efface et part. */
const _TQ_CARTES = [
  { secteurs:["silene"], modale:"#modale-carte", svg:"#carte",
    ici:()=>etat.pos,
    viser:(x,y)=>{ if(typeof _poserVisee==="function") _poserVisee(x,y); },
    vise:()=>(typeof _visee!=="undefined" ? _visee : null),
    partir:(x,y)=>{ if(typeof _effacerVisee==="function") _effacerVisee(); if(typeof voyager==="function") voyager(x,y); } },
  { secteurs:["ecart"], modale:"#modale-orbite", svg:"#carte-orbite",
    ici:()=>(typeof posEspace==="function" ? posEspace() : null),
    viser:(x,y)=>{ if(typeof _viseeEsp!=="undefined" && _viseeEsp) _viseeEsp.poser(x,y); },
    vise:()=>(typeof _viseeEsp!=="undefined" && _viseeEsp ? _viseeEsp.vise() : null),
    partir:(x,y)=>{ if(typeof _viseeEsp!=="undefined" && _viseeEsp) _viseeEsp.allerA(x,y); else if(typeof volVersPoint==="function") volVersPoint({x,y}); } },
  { secteurs:["braise","suaire"], modale:"#modale-braise", svg:"#carte-braise",
    ici:()=>(typeof posSurface==="function" ? posSurface() : null),
    viser:(x,y)=>{ if(typeof _viseeSol!=="undefined" && _viseeSol) _viseeSol.poser(x,y); },
    vise:()=>(typeof _viseeSol!=="undefined" && _viseeSol ? _viseeSol.vise() : null),
    partir:(x,y)=>{ if(typeof _viseeSol!=="undefined" && _viseeSol) _viseeSol.allerA(x,y); else if(typeof voyagerBraise==="function") voyagerBraise(x,y); } }
];
function _tqCoordSvg(svg, e){
  if(!svg.createSVGPoint || !svg.getScreenCTM) return null;
  const m = svg.getScreenCTM(); if(!m) return null;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(m.inverse()); return { x:Math.round(p.x), y:Math.round(p.y) };
}
function _tqBornes(svg){
  const vb = (svg.getAttribute("viewBox")||"").split(/\s+/).map(Number);
  return vb.length===4 && vb[2]>0 ? { w:vb[2], h:vb[3] } : null;
}
function _tqBrancher(c){
  const mod = document.querySelector(c.modale); if(!mod) return null;
  let bar = mod.querySelector(".tq-outils");
  if(bar) return bar;
  const cadre = mod.querySelector(".cadre-carte") || mod;
  bar = document.createElement("div"); bar.className = "tq-outils";
  bar.innerHTML = `<span class="tq-coord">Tu es à <b data-tq="ici">—</b> · pointeur <b data-tq="survol">—</b></span>
    <span>Se rendre à <input type="number" inputmode="numeric" data-tq="x" placeholder="x" aria-label="Coordonnée x">
    <input type="number" inputmode="numeric" data-tq="y" placeholder="y" aria-label="Coordonnée y">
    <button class="mini" data-tq="aller">Aller</button></span>
    <button class="mini tq-traquer" data-tq="traquer" hidden></button>`;
  const zone = cadre.querySelector(".zone-carte");
  if(zone && zone.nextSibling) cadre.insertBefore(bar, zone.nextSibling); else cadre.appendChild(bar);
  const svg = mod.querySelector(c.svg);
  if(svg){
    const montrer = (e)=>{ const p = _tqCoordSvg(svg, e); const z = bar.querySelector('[data-tq="survol"]'); if(p && z) z.textContent = `${p.x} · ${p.y}`; };
    svg.addEventListener("mousemove", montrer);
    svg.addEventListener("pointerdown", montrer);
  }
  /* v1.34i — « Aller » puis « Y aller » (voir _TQ_CARTES). `arme` = le point
     visé par CE bouton ; il tombe dès que x/y changent ou que la visée n'est
     plus là (clic ailleurs sur la carte, « Partir », carte refermée). */
  const btA = bar.querySelector('[data-tq="aller"]'), inX = bar.querySelector('[data-tq="x"]'), inY = bar.querySelector('[data-tq="y"]');
  let arme = null;
  const majAller = ()=>{
    if(arme){ const v = c.vise(); if(!v || Math.round(v.x)!==arme.x || Math.round(v.y)!==arme.y) arme = null; }
    const t = arme ? "Y aller" : "Aller";
    if(btA.textContent !== t) btA.textContent = t;
    btA.title = arme ? `Partir vers ${arme.x} · ${arme.y}` : "Placer la visée sur ces coordonnées";
  };
  bar._tqMajAller = majAller;
  const desarmer = ()=>{ arme = null; majAller(); };
  inX.addEventListener("input", desarmer); inY.addEventListener("input", desarmer);
  btA.addEventListener("click", ()=>{
    const x = Math.round(Number(inX.value)), y = Math.round(Number(inY.value));
    const b = svg ? _tqBornes(svg) : null;
    if(!Number.isFinite(x) || !Number.isFinite(y) || inX.value==="" || inY.value===""){ journal("Tape deux coordonnées.","alerte"); desarmer(); return; }
    if(b && (x < 0 || y < 0 || x > b.w || y > b.h)){ journal(`Hors de la carte : x de 0 à ${b.w}, y de 0 à ${b.h}.`,"alerte"); desarmer(); return; }
    majAller();
    if(arme && arme.x===x && arme.y===y){ arme = null; majAller(); c.partir(x, y); return; }
    c.viser(x, y); arme = { x, y }; majAller();
  });
  bar.querySelector('[data-tq="traquer"]').addEventListener("click", (e)=>_tqTraquer(e.currentTarget.dataset.cible, e.currentTarget.dataset.nom));
  return bar;
}
let _tqOuvertAvant = {};
function _tqTick(){
  for(const c of _TQ_CARTES){
    const mod = document.querySelector(c.modale);
    const ouverte = !!(mod && mod.classList.contains("ouverte"));
    if(!ouverte){ _tqOuvertAvant[c.modale] = false; continue; }
    /* v1.33f — La barre n'existe que pour qui a l'aptitude Traque (choix de
       l'autrice) : sans elle, aucune coordonnée, aucun « Se rendre à ». */
    const aTraque = (typeof aptPris === "function") && aptPris("traque");
    if(!aTraque){ const b0 = mod.querySelector(".tq-outils"); if(b0) b0.hidden = true; continue; }
    if(!_tqOuvertAvant[c.modale]){ _tqOuvertAvant[c.modale] = true; _tqRafraichir(false); }   // pistes à jour à chaque ouverture (≤ 1 appel / 30 s)
    const bar = _tqBrancher(c); if(!bar) continue;
    bar.hidden = false;
    if(bar._tqMajAller) bar._tqMajAller();   // v1.34i : « Y aller » retombe si la visée a bougé
    const sect = etat.secteur || "silene";
    const p = c.secteurs.includes(sect) ? c.ici() : null;
    const z = bar.querySelector('[data-tq="ici"]');
    if(z) z.textContent = p ? `${Math.round(p.x)} · ${Math.round(p.y)}` : "—";
    const bt = bar.querySelector('[data-tq="traquer"]');
    const d = _tqWanted; let cible = null;
    if(p && d && d.chasseur) cible = (d.liste||[]).find(x=>x.piste && !x.etat && x.piste.secteur===sect && x.piste.x===Math.round(p.x) && x.piste.y===Math.round(p.y));
    if(cible){ bt.hidden = false; bt.dataset.cible = cible.id; bt.dataset.nom = cible.nom || "";
      bt.textContent = `Traquer ${cible.nom} (−${TRAQUE_ENERGIE} %)`; bt.disabled = !!(cible.retraque && new Date(cible.retraque) > Date.now()); }
    else bt.hidden = true;
  }
}
if(typeof window!=="undefined") setInterval(_tqTick, 700);

async function _tqTraquer(cible, nom){
  const bts = document.querySelectorAll('.tq-outils [data-tq="traquer"]'); bts.forEach(b=>b.disabled = true);
  if(typeof sauverMaintenant==="function"){ try{ await sauverMaintenant(); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"traque.js#sauver"); } }
  const score = Math.round((typeof agiliteEffective==="function" ? agiliteEffective() : 0) + (typeof intelligenceEffective==="function" ? intelligenceEffective() : 0));
  const r = await _tqRpc(()=>sb.rpc("traquer", { p_cible: cible, p_score: score }), "traquer");
  if(r && typeof r.energie==="number"){ etat.energie = r.energie; etat.energieMaj = Date.now(); }
  if(r && r.ok && r.reussi){
    if(typeof r.solde==="number" && typeof appliquerSoldeServeur==="function") appliquerSoldeServeur(r.solde);
    journal(`Capture ! ${r.nom||nom} part pour ${r.heures} h derrière les barreaux (prison : ${typeof _factionNom==="function" ? _factionNom(r.prison_faction) : (r.prison_faction||"")}). Prime${r.plaintes>1?"s":""} encaissée${r.plaintes>1?"s":""} : +${r.prime} ₡.`,"gain","traque");
    if(r.rep > 0){ if(typeof r.reputation==="number") etat.reputation = r.reputation;   // v1.30
      journal(`+${r.rep} réputation de faction : ta faction recherchait ce voleur.`,"gain","traque"); }
  } else if(r && r.ok){
    journal(`${nom} t'a filé entre les doigts (${Math.round((r.chance||0)*100)} % de chances). Nouvelle traque possible dans 24 h, avec une nouvelle trace.`,"alerte","traque");
  } else {
    journal({ froide:`La piste est froide : ${nom} n'est plus à ce point. Il te faut une nouvelle trace. Rien n'a été dépensé.`,
              pas_sur_place:"Tu n'es pas exactement sur le point de la piste.", delai:"Tu as déjà traqué cette cible il y a moins de 24 h.",
              pas_de_piste:"Tu n'as pas (ou plus) de piste sur cette cible.", energie:"Pas assez d'énergie.",
              en_prison:"Ta cible est déjà en prison.", indisponible:"Ta cible est hors d'atteinte.", pas_recherche:"Plus aucune prime sur cette tête.",
              aptitude:"Il te faut l'aptitude Traque." }[r && r.err] || "Le serveur n'a pas répondu.","alerte","traque");
  }
  await _tqRafraichir(true);
  if(typeof afficher==="function") afficher();
  _tqTick();
}
