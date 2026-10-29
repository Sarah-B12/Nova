/* ===========================================================
   LE FLÉAU — v2.06 (étape 3 du cadrage de Cérès ; K81 → K88, K120 → K124)

   Une machine d'AREPO, des piques noires autour d'un point rouge (`e2_oeil_piques`).
   On vient l'attaquer exprès, UNE FOIS PAR JOUR DE JEU, depuis son onglet.

   ⚠ LE SERVEUR TRANCHE TOUT (v231) : la force du jour, les coups, les dégâts, le
     score, les crédits. Ce fichier affiche et transmet, comme l'Arène :
       fleau_etat()            → le signe du jour, le combat d'aujourd'hui
       fleau_engager(coût)     → −10 % d'énergie (Endurance, zone, boissons)
       fleau_tour(b, c, m, ch) → un tour ; `ch` = charger le canon (maître, 1 cellule)
       fleau_rompre()          → abandon = défaite (K113)
       fleau_classement()      → somme des 10 meilleurs combats du mois (K121)
       fleau_objets_lire()     → les objets du podium encore actifs (K88)
   ⚠ AUCUNE FORCE N'ARRIVE ICI (K120) : un signe en trois bandes avant, la part
     de la coque du Fléau qui reste (en %) pendant. Ne jamais ajouter le chiffre.
   ⚠ Le combat se joue dans l'onglet ; un rechargement le reprend (fleau_etat).
     Dix minutes sans tour : défaite (serveur).
   ⚠ La coque du joueur : le serveur la lit dans `donnees` à l'engagement (on
     sauvegarde juste avant), puis la tient ; le client recopie ce qu'il renvoie.
   =========================================================== */

const FLEAU_ENERGIE  = 10;                       // % d'énergie pour engager (borné [5 ; 13] au serveur)
const FLEAU_CELLULE  = "fab_cellule_d_energie";  // la munition du canon de bord (K83)
const FLEAU_LENTILLE = 2 / 3;                    // K123 : patrouilles et sondes, un tiers de moins
const FLEAU_SYSTEMES = [
  { id:"bouclier", nom:"Bouclier" },
  { id:"canon",    nom:"Canon" },
  { id:"moteurs",  nom:"Moteurs" }
];
/* Le signe du jour (K120). Les jours imbattables sont tous « aveuglants ». */
const FLEAU_SIGNES = {
  sourd:     "Au milieu des piques, le point rouge est sourd aujourd'hui, comme une braise sous la cendre.",
  vif:       "Au milieu des piques, le point rouge est vif aujourd'hui. Il bat.",
  aveuglant: "Au milieu des piques, le point rouge est aveuglant aujourd'hui. Tu dois plisser les yeux pour le regarder."
};
/* Ce qu'il annonce. Chaque coup se pare mieux d'une façon (K82) : le texte le
   laisse deviner, le compte rendu du tour le confirme. */
const FLEAU_COUPS = {
  piques:   { nom:"Les piques", txt:"Les piques pivotent vers toi, toutes ensemble. Elles partent lentement, mais elles partent toutes." },
  rayon:    { nom:"Le rayon",   txt:"Le point rouge se resserre en un trait de lumière, droit sur ta coque." },
  decharge: { nom:"La décharge", txt:"Des arcs courent d'une pique à l'autre et se rassemblent au milieu, en une boule qui grossit." }
};
/* Le système qui pare chaque coup, pour le compte rendu (le serveur fait le calcul). */
const _FLEAU_PARE = { piques:"moteurs", rayon:"bouclier", decharge:"canon" };

let _fleauObjets = {};           // { pique|lentille|pupille : "ISO d'expiration" }
let _fleauSous = "combat", _fleauEtat = null, _fleauOccupe = false;
let _fleauRep = { bouclier:1, canon:2, moteurs:1 }, _fleauCharger = false, _fleauDernier = null;

function surFleau(){ return (typeof enCeres === "function") && enCeres() && (typeof surLieuEspace === "function") && surLieuEspace(espaceLieu("e2_oeil_piques")); }
function coutFleau(){ return (typeof aptEnergieAction === "function") ? aptEnergieAction(FLEAU_ENERGIE) : FLEAU_ENERGIE; }
function fleauObjetActif(type){ const e = _fleauObjets[type]; return !!e && new Date(e).getTime() > Date.now(); }
function fleauLentille(){ return fleauObjetActif("lentille") ? FLEAU_LENTILLE : 1; }
async function fleauObjetsCharger(){
  if(typeof sb === "undefined") return;
  try{ const { data } = await sb.rpc("fleau_objets_lire"); if(data && data.ok) _fleauObjets = data.objets || {}; }
  catch(e){ if(typeof _catchLog === "function") _catchLog(e, "fleau.js#objets"); }
}

/* ---------- Mise en forme (une fois) ---------- */
let _fleauStyle = false;
function _fleauMonterStyle(){
  if(_fleauStyle) return; _fleauStyle = true;
  const st = document.createElement("style");
  st.textContent = `
    .fl-signe{ margin:0 0 12px; line-height:1.6; }
    .fl-signe b{ color:#ff5257; }
    .fl-barres{ display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; margin:0 0 12px; }
    @media (max-width:560px){ .fl-barres{ grid-template-columns:1fr; } }
    .fl-barres .remplissage.fl-rouge{ background:linear-gradient(90deg,#8c1d22,#ff5257); }
    .fl-coup{ border-left:3px solid #ff5257; padding:6px 0 6px 12px; margin:0 0 14px; }
    .fl-coup b{ display:block; color:#ff8a8d; margin-bottom:2px; }
    .fl-coup .fl-emb{ display:block; color:var(--orange,#ff8a3d); font-size:13px; margin-top:4px; }
    .fl-rep{ display:grid; grid-template-columns:auto auto 1fr; gap:8px 12px; align-items:center; max-width:360px; margin:0 0 10px; }
    .fl-rep .fl-n{ min-width:22px; text-align:center; font-weight:700; font-size:18px; color:var(--bleu,#5aa8e6); }
    .fl-rep .fl-pts{ display:flex; gap:4px; }
    .fl-rep .fl-pts i{ width:10px; height:10px; border-radius:50%; background:var(--bleu,#5aa8e6); display:inline-block; }
    .fl-rep button.mini{ min-width:34px; }
    .fl-puiss{ margin:0 0 10px; }
    .fl-puiss b{ color:var(--bleu,#5aa8e6); }
    .fl-charge{ display:flex; gap:8px; align-items:flex-start; margin:0 0 12px; cursor:pointer; }
    .fl-charge input{ margin-top:3px; }
    .fl-cr{ margin:12px 0 0; font-size:13.5px; line-height:1.55; }
    .fl-fin{ border:1px solid var(--line,#243a52); border-radius:10px; padding:12px 14px; margin:0 0 12px; }
    .fl-fin.gagne{ border-color:rgba(139,212,80,.6); }
    .fl-objets{ margin:14px 0 0; }
  `;
  document.head.appendChild(st);
}

/* ---------- Onglet ---------- */
function _fleauBrancherSous(){
  const s = document.querySelector("#fleau-sous"); if(!s || s.dataset.branche) return;
  s.dataset.branche = "1";
  s.querySelectorAll("[data-fsous]").forEach(b => b.addEventListener("click", () => { _fleauSous = b.dataset.fsous; _fleauMontrerSous(); }));
}
function _fleauMontrerSous(){
  document.querySelectorAll("#fleau-sous [data-fsous]").forEach(b => b.classList.toggle("actif", b.dataset.fsous === _fleauSous));
  const v = document.querySelector("#fleau-vue"), c = document.querySelector("#fleau-class");
  if(v) v.hidden = _fleauSous !== "combat";
  if(c) c.hidden = _fleauSous !== "classement";
  if(_fleauSous === "classement") majFleauClassement(); else _fleauRendre();
}
/* ⚠ `rafraichir` (majHub à chaque afficher()) : on ne recharge rien et on ne
   redessine pas un combat en cours, sinon la répartition en train d'être réglée
   repartirait à zéro (même piège que le bonneteau, v1.88e). */
async function majFleau(rafraichir){
  _fleauMonterStyle(); _fleauBrancherSous();
  const z = document.querySelector("#fleau-vue"); if(!z) return;
  if(rafraichir && _fleauEtat) return;
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO){ z.innerHTML = `<p class="vide">Le Fléau a besoin du serveur.</p>`; return; }
  z.innerHTML = `<p class="vide">Chargement…</p>`;
  let d = null;
  try{ const r = await sb.rpc("fleau_etat"); d = r && r.data; }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "fleau.js#etat"); }
  fleauObjetsCharger().then(() => { if(_fleauSous === "combat" && !(_fleauEtat && _fleauEtat.combat && _fleauEtat.combat.statut === "en_cours")) _fleauRendre(); });
  if(!d || !d.ok){ z.innerHTML = `<p class="vide">Le Fléau ne répond pas. Réessaie dans un instant.</p>`; _fleauEtat = null; return; }
  _fleauEtat = d;
  _fleauMontrerSous();
}

function _fleauBarre(titre, val, max, txt, rouge){
  const pct = max ? Math.max(0, Math.min(100, Math.round(100 * val / max))) : 0;
  return `<div class="jauge"><div class="jauge-tete"><span>${titre}</span><span class="val">${txt}</span></div>
    <div class="piste"><div class="remplissage${rouge ? " fl-rouge" : ""}" style="width:${pct}%"></div></div></div>`;
}
function _fleauObjetsHtml(){
  const L = [["pique", "Une pique du Fléau", "aucun voleur ne réussit contre toi"],
             ["lentille", "Un éclat de sa lentille", "patrouilles et sondes te repèrent moins souvent"],
             ["pupille", "La pupille du Fléau", "santé et moral à 100 chaque nuit"]]
    .filter(o => fleauObjetActif(o[0]))
    .map(o => { const j = Math.max(1, Math.ceil((new Date(_fleauObjets[o[0]]).getTime() - Date.now()) / 86400000));
                return `<p class="itip-gris" style="margin:2px 0"><b>${o[1]}</b> : ${o[2]}, encore ${j} jour${j > 1 ? "s" : ""}.</p>`; });
  return L.length ? `<div class="fl-objets"><h4 class="gsec">Ce que tu lui as pris</h4>${L.join("")}</div>` : "";
}

function _fleauRendre(){
  const z = document.querySelector("#fleau-vue"); if(!z || !_fleauEtat) return;
  const c = _fleauEtat.combat, bande = _fleauEtat.bande;
  const signe = `<p class="fl-signe">${FLEAU_SIGNES[bande] || ""}</p>`;
  if(c && c.statut === "en_cours"){ z.innerHTML = _fleauCombatHtml(c); _fleauBrancherCombat(z, c); return; }
  if(c){   // déjà combattu aujourd'hui
    z.innerHTML = signe + _fleauFinHtml(c, _fleauDernier) + `<p class="vide">Une attaque par jour. Le Fléau sera là demain.</p>` + _fleauObjetsHtml();
    return;
  }
  const v = (typeof vaisseauActif === "function") ? vaisseauActif() : null;
  const cout = coutFleau(), nrj = Math.floor(etat.energie || 0);
  let refus = "";
  if(!v) refus = "Il te faut un vaisseau équipé.";
  else if(typeof vaisseauCloue === "function" && vaisseauCloue()) refus = "Ta coque est hors service.";
  else if(nrj < cout) refus = `Pas assez d'énergie (${cout} % requis).`;
  const maitre = (typeof canonVaisseau === "function") && canonVaisseau() > 0;
  z.innerHTML = signe
    + `<p class="vide" style="margin:0 0 10px">Une attaque par jour. À chaque passe, il annonce son coup ; tu répartis <b>4 points de puissance</b> entre le bouclier, le canon et les moteurs. Chaque coup se pare mieux d'une façon. Ton canon tire d'abord ; s'il tient, il frappe. Passé la moitié de sa coque, il s'emballe : il annonce deux coups et n'en lâche qu'un. Douze passes au plus.</p>`
    + (maitre ? `<p class="vide" style="margin:0 0 10px">Ton canon de bord peut être <b>chargé</b> à chaque passe : un point de puissance de plus, une cellule d'énergie de moins (${etat.sac[FLEAU_CELLULE] || 0} au sac).</p>` : "")
    + `<p class="vide" style="margin:0 0 12px">Une victoire rapporte des crédits, plus les jours où il est fort. Le classement du mois compte tes <b>10 meilleurs combats</b>, et la coque qui te reste ; une navette ou un cargo comptent davantage qu'un Vaisseau maître.</p>`
    + `<div class="actions"><button class="mini" id="fl-attaquer" ${refus ? "disabled" : ""}>Attaquer le Fléau · ${cout} % d'énergie</button></div>`
    + (refus ? `<p class="itip-gris" style="margin:6px 0 0">${refus}</p>` : "")
    + _fleauObjetsHtml();
  const b = z.querySelector("#fl-attaquer"); if(b) b.addEventListener("click", fleauAttaquer);
}

/* K126 — quand il s'emballe, il annonce DEUX coups (le serveur les donne dans
   l'ordre alphabétique : rien ne dit lequel partira). */
function _fleauAnnonceHtml(c){
  const L = (c.annonces || []).map(a => FLEAU_COUPS[a]).filter(Boolean);
  if(L.length > 1) return `<div class="fl-coup"><b>${L[0].nom} ou ${L[1].nom.charAt(0).toLowerCase() + L[1].nom.slice(1)} ?</b>`
    + `Il s'emballe et change de rythme : il prépare deux coups à la fois, et n'en lâchera qu'un. Partage ta défense, ou parie.`
    + `<span class="fl-emb">${L.map(x => x.txt).join(" ")}</span></div>`;
  const x = L[0] || { nom:"?", txt:"" };
  return `<div class="fl-coup"><b>${x.nom}</b>${x.txt}${c.emballe ? `<span class="fl-emb">Il s'emballe : ses coups viennent plus vite et plus fort.</span>` : ""}</div>`;
}
function _fleauCombatHtml(c){
  const pts = (c.puissance || 4) + (_fleauCharger ? 1 : 0);
  const somme = _fleauRep.bouclier + _fleauRep.canon + _fleauRep.moteurs;
  const nCel = (etat.sac && etat.sac[FLEAU_CELLULE]) || 0;
  const lignes = FLEAU_SYSTEMES.map(s => `
      <span>${s.nom}</span>
      <span><button class="mini" data-fl-moins="${s.id}" ${_fleauRep[s.id] <= 0 ? "disabled" : ""} aria-label="${s.nom} : un point de moins">−</button>
            <span class="fl-n">${_fleauRep[s.id]}</span>
            <button class="mini" data-fl-plus="${s.id}" ${somme >= pts ? "disabled" : ""} aria-label="${s.nom} : un point de plus">+</button></span>
      <span class="fl-pts">${"<i></i>".repeat(_fleauRep[s.id])}</span>`).join("");
  return `
    <div class="fl-barres">
      ${_fleauBarre("Ta coque", c.coque, c.coque_max, `${c.coque} / ${c.coque_max} PV`, false)}
      ${_fleauBarre("Le Fléau", c.fleau_pct, 100, `${c.fleau_pct} %`, true)}
    </div>
    <p class="itip-gris" style="margin:0 0 8px">Passe ${c.tour + 1} sur ${c.tours || 12}${c.cellules ? ` · ${c.cellules} cellule${c.cellules > 1 ? "s" : ""} brûlée${c.cellules > 1 ? "s" : ""}` : ""}</p>
    ${_fleauAnnonceHtml(c)}
    <p class="fl-puiss">Puissance : <b>${somme}</b> sur ${pts}</p>
    <div class="fl-rep">${lignes}</div>
    ${c.canon ? `<label class="fl-charge"><input type="checkbox" id="fl-charger" ${_fleauCharger ? "checked" : ""} ${nCel <= 0 ? "disabled" : ""}>
      <span>Charger le canon de bord : un point de puissance de plus, <b>une cellule d'énergie</b> (${nCel} au sac).</span></label>` : ""}
    <div class="actions" style="gap:10px">
      <button class="mini" id="fl-tenir">Tenir la passe</button>
      <button class="mini danger" id="fl-rompre">Rompre le combat</button>
    </div>
    ${_fleauDernier ? `<p class="fl-cr">${_fleauDernier}</p>` : ""}`;
}
function _fleauBrancherCombat(z, c){
  const pts = () => (c.puissance || 4) + (_fleauCharger ? 1 : 0);
  z.querySelectorAll("[data-fl-plus]").forEach(b => b.addEventListener("click", () => {
    const s = _fleauRep.bouclier + _fleauRep.canon + _fleauRep.moteurs;
    if(s < pts()){ _fleauRep[b.dataset.flPlus]++; _fleauRendre(); }
  }));
  z.querySelectorAll("[data-fl-moins]").forEach(b => b.addEventListener("click", () => {
    if(_fleauRep[b.dataset.flMoins] > 0){ _fleauRep[b.dataset.flMoins]--; _fleauRendre(); }
  }));
  const ch = z.querySelector("#fl-charger");
  if(ch) ch.addEventListener("change", () => {
    _fleauCharger = ch.checked;
    // Décharger le canon retire un point : on le prend sur le canon, puis ailleurs.
    let s = _fleauRep.bouclier + _fleauRep.canon + _fleauRep.moteurs;
    for(const k of ["canon","moteurs","bouclier"]) while(s > pts() && _fleauRep[k] > 0){ _fleauRep[k]--; s--; }
    _fleauRendre();
  });
  const t = z.querySelector("#fl-tenir"); if(t) t.addEventListener("click", () => fleauTenir(t));
  const r = z.querySelector("#fl-rompre"); if(r) r.addEventListener("click", fleauRompre);
}

/* ---------- Le compte rendu d'une passe ---------- */
function _fleauCompteRendu(d, rep){
  const coup = d.coup, pare = _FLEAU_PARE[coup], n = rep[pare] || 0;
  const touche = d.touche > 0 ? `Ton canon le touche.` : `Ton canon se tait.`;
  const lequel = (d.deux && FLEAU_COUPS[coup]) ? `C'est ${FLEAU_COUPS[coup].nom.charAt(0).toLowerCase() + FLEAU_COUPS[coup].nom.slice(1)} qui part. ` : "";
  const parade = {
    piques:   n >= 2 ? "Tes moteurs te sortent de la course de la plupart des piques." : n === 1 ? "Tes moteurs t'écartent d'une partie des piques." : "Les piques te trouvent là où tu étais.",
    rayon:    n >= 2 ? "Ton bouclier prend l'essentiel du trait." : n === 1 ? "Ton bouclier en prend une partie." : "Rien ne se met entre le trait et ta coque.",
    decharge: n >= 2 ? "Tes tirs crèvent la boule avant qu'elle éclate." : n === 1 ? "Tes tirs l'entament avant qu'elle éclate." : "La boule éclate entière contre ta coque."
  }[coup] || "";
  if(d.fin === "gagne") return `${touche} Le point rouge s'éteint.`;
  return `${touche} ${lequel}${parade} −${d.degats} PV.`;
}
function _fleauFinHtml(c, cr){
  const g = c.statut === "gagne";
  const txt = g
    ? `Le point rouge s'éteint. Les piques retombent, inertes, puis se redressent une à une : il sera là demain.<br>Score du jour : <b>${c.score}</b>${c.gain ? ` · +${c.gain} ₡ de pièces récupérées dans ses éclats` : ""}.`
    : `Le Fléau tient. Score du jour : <b>${c.score}</b> (défaite : la part de sa coque que tu as entamée).`;
  return `<div class="fl-fin${g ? " gagne" : ""}">${cr ? `<p style="margin:0 0 6px">${cr}</p>` : ""}<p style="margin:0">${txt}</p></div>`;
}

/* ---------- Les gestes ---------- */
const FLEAU_ERREURS = {
  deja: "Tu l'as déjà attaqué aujourd'hui.", prison:"On n'attaque rien depuis une cellule.",
  indisponible:"Tu n'es pas en état de combattre.", lieu:"Rejoins d'abord le Fléau, sur la carte de Cérès.",
  vaisseau:"Il te faut un vaisseau équipé.", cloue:"Ta coque est hors service.", energie:"Pas assez d'énergie.",
  puissance:"Répartition refusée : trop de points.", canon:"Seul le canon de bord du Vaisseau maître se charge.",
  cellule:"Plus de cellule d'énergie au sac : le canon ne se charge pas.", pas_de_combat:"Aucun combat en cours."
};
async function fleauAttaquer(){
  if(_fleauOccupe) return; _fleauOccupe = true;
  try{
    if(typeof sauverMaintenant === "function") await sauverMaintenant();   // le serveur lit le vaisseau, la coque et la position dans donnees
    const { data:d } = await sb.rpc("fleau_engager", { p_cout: coutFleau() });
    if(!d || !d.ok){ journal(FLEAU_ERREURS[d && d.err] || "Le Fléau ne répond pas.", "alerte", "combat"); _fleauOccupe = false; return; }
    if(typeof d.energie === "number"){ etat.energie = d.energie; etat.energieMaj = Date.now(); }
    if(d.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(d.etat);
    _fleauEtat = { ok:true, bande:d.bande, combat:d.combat };
    _fleauRep = { bouclier:1, canon:2, moteurs:1 }; _fleauCharger = false; _fleauDernier = null;
    journal("Tu fonces vers le Fléau. Le point rouge se tourne vers toi.", "alerte", "combat");
    if(typeof afficher === "function") afficher();
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "fleau.js#engager"); journal("Le Fléau ne répond pas.", "alerte", "combat"); }
  _fleauOccupe = false;
  _fleauRendre();
}
async function fleauTenir(bouton){
  if(_fleauOccupe) return; _fleauOccupe = true; if(bouton) bouton.disabled = true;
  const rep = { ..._fleauRep }, charger = _fleauCharger;
  const deux = !!(_fleauEtat && _fleauEtat.combat && (_fleauEtat.combat.annonces || []).length > 1);
  try{
    const r = await rpcAvecSolde("fleau_tour", { p_bouclier:rep.bouclier, p_canon:rep.canon, p_moteurs:rep.moteurs, p_charger:charger });
    const d = r && r.data;
    if(!d || !d.ok){ journal(FLEAU_ERREURS[d && d.err] || "La passe n'a pas pu se jouer.", "alerte", "combat");
      if(d && d.err === "pas_de_combat"){ _fleauEtat = null; _fleauOccupe = false; return majFleau(); } }
    else {
      if(d.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(d.etat);   // la cellule brûlée
      _fleauAppliquerCoque(d.combat);
      _fleauEtat.combat = d.combat;
      if(d.fin === "vaisseau") _fleauDernier = "Tu as changé de vaisseau en plein combat : c'est rompre.";
      else _fleauDernier = d.coup ? _fleauCompteRendu({ ...d, deux }, rep) : null;
      if(d.fin){
        const c = d.combat;
        if(d.fin === "tours") _fleauDernier += ` ${c.tours || 12} passes, et il tient encore : le point rouge se voile, il ne se laisse plus approcher aujourd'hui.`;
        journal(c.statut === "gagne"
          ? `⚔️ Victoire contre le Fléau. Score du jour : ${c.score}.${c.gain ? ` +${c.gain} ₡.` : ""}`
          : `⚔️ Le Fléau tient. Score du jour : ${c.score}.`, c.statut === "gagne" ? "gain" : "alerte", "combat");
        if(c.coque <= 0 && typeof secoursOrbite === "function") await secoursOrbite();   // remorqué au Nid (K93)
      }
    }
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "fleau.js#tour"); journal("Le Fléau ne répond pas — réessaie.", "alerte", "combat"); }
  _fleauOccupe = false;
  if(typeof afficher === "function") afficher();
  _fleauRendre();
}
/* La coque suit le serveur. ⚠ Pas d'abimerVaisseau() ici : à 0 PV, il lancerait le
   secours AVANT la fin du combat ; on le lance nous-mêmes, une fois le combat clos. */
function _fleauAppliquerCoque(c){
  if(!c || !etat.vaisseau || etat.vaisseau !== c.vaisseau || typeof _poserPv !== "function") return;
  const avant = pvVaisseau();
  _poserPv(etat.vaisseau, c.coque);
  const mx = pvMax();
  if(avant / mx >= PV_SEUIL_AVARIE && c.coque > 0 && c.coque / mx < PV_SEUIL_AVARIE)
    journal(`⚠ ${VAISSEAUX[etat.vaisseau].nom} est en avarie — coque à ${Math.round(100 * c.coque / mx)} %. La consommation de carburant augmente de moitié tant que ce n'est pas réparé.`, "alerte");
  if(c.coque <= 0) journal(`${VAISSEAUX[etat.vaisseau].nom} est CLOUÉ : coque hors service (le Fléau).`, "alerte");
  if(typeof majVaisseau === "function") majVaisseau();
  if(typeof sauvegarder === "function") sauvegarder();
}
async function fleauRompre(){
  if(_fleauOccupe) return;
  if(typeof confirmerJoli === "function" && !await confirmerJoli("Rompre le combat",
      "Rompre, c'est perdre : le combat compte comme une défaite, et tu ne pourras pas revenir aujourd'hui.", "Rompre", true)) return;
  _fleauOccupe = true;
  try{
    const { data:d } = await sb.rpc("fleau_rompre");
    if(d && d.ok){ _fleauEtat.combat = d.combat; _fleauDernier = "Tu romps le combat et tu t'éloignes des piques.";
      journal(`⚔️ Tu romps le combat contre le Fléau. Score du jour : ${d.combat.score}.`, "alerte", "combat"); }
    else journal(FLEAU_ERREURS[d && d.err] || "Le Fléau ne répond pas.", "alerte", "combat");
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "fleau.js#rompre"); }
  _fleauOccupe = false;
  _fleauRendre();
}

/* ---------- Classement (K121, K124) ---------- */
const FLEAU_OBJETS_NOMS = { pique:"une pique", lentille:"un éclat de lentille", pupille:"la pupille" };
async function majFleauClassement(){
  const z = document.querySelector("#fleau-class"); if(!z) return;
  z.innerHTML = `<p class="vide">Chargement…</p>`;
  let d = null;
  try{ ({ data:d } = await sb.rpc("fleau_classement")); }catch(e){ d = null; }
  if(!d || !d.ok){ z.innerHTML = `<p class="vide">Le classement ne répond pas.</p>`; return; }
  const mois = new Date(String(d.mois).slice(0, 10) + "T12:00:00").toLocaleDateString("fr-FR", { month:"long", year:"numeric" });
  const med = r => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `${r}.`;
  const nb = x => Number(x).toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 });
  let h = `<p class="itip-gris" style="margin:0 0 10px">Classement de <b>${mois}</b> : la somme de tes <b>10 meilleurs combats</b> du mois. Une victoire compte d'autant plus que le point rouge était vif et que ta coque a tenu ; une défaite, selon la part de sa coque que tu as entamée. Navette ×1,6, cargo ×1,3. Le 1ᵉʳ du mois, le podium rapporte ce qu'on a pris au Fléau, pour 8 jours : une pique (1ʳᵉ place), un éclat de lentille (2ᵉ), la pupille (3ᵉ).</p>`;
  h += `<div class="ar-class">`;
  h += (d.top || []).length
    ? `<ol class="ar-top">${d.top.map(x => `<li class="${x.moi ? "moi" : ""}"><span class="ar-r">${med(x.rang)}</span><span class="ar-n">${echapper(x.nom)}</span><b>${nb(x.n)}</b></li>`).join("")}</ol>`
    : `<p class="vide">Personne encore ce mois-ci.</p>`;
  if(d.moi && d.moi.rang > 10) h += `<p class="ar-moi">Toi : ${d.moi.rang}ᵉ, ${nb(d.moi.n)}.</p>`;
  h += `<p class="itip-gris" style="margin:6px 0 0">Tes combats ce mois-ci : ${d.mes_combats || 0}${(d.mes_combats || 0) > 10 ? " (les 10 meilleurs comptent)" : ""}.</p>`;
  if((d.precedent || []).length) h += `<p class="itip-gris ar-prec">Le mois dernier : ${d.precedent.map(x => `${med(x.rang)} ${echapper(x.nom)} (${nb(x.n)}, ${FLEAU_OBJETS_NOMS[x.objet] || x.objet})`).join(" · ")}</p>`;
  h += `</div>`;
  z.innerHTML = h;
}
