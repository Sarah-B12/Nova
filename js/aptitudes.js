/* ===========================================================
   APTITUDES — Écran de l'arbre + économie de points (PA).
   L'écran s'INJECTE lui-même dans l'onglet Profil, juste sous le bloc
   Compétences : aucune structure HTML à ajouter dans index.html.
   Les EFFETS des nœuds ne sont pas encore branchés (étape suivante) ;
   ici on gère l'affichage, l'achat en chaîne stricte, le respec et les PA.
   =========================================================== */

/* ---------- État (auto-initialisé, compatible anciennes sauvegardes) ---------- */
function aptEtat(){
  if(!etat.aptitudes || typeof etat.aptitudes !== "object") etat.aptitudes = { pa:0, pris:[] };
  if(typeof etat.aptitudes.pa !== "number") etat.aptitudes.pa = 0;
  if(!Array.isArray(etat.aptitudes.pris)) etat.aptitudes.pris = [];
  _aptMigrer(etat.aptitudes);
  return etat.aptitudes;
}
/* v1.25 — MIGRATION UNIQUE de l'arbre remanié (inversions Survie, Combativité,
   Rouage ; Fléau du Protocole supprimé). Les choix sont enregistrés par
   IDENTIFIANT et la chaîne est stricte : après une inversion, un joueur peut
   tenir un nœud sans celui qui le précède désormais. Règle : tr4 disparaît
   (2 PA rendus) ; dans chaque chaîne, tout nœud pris APRÈS un trou est rendu
   (au coût de sa nouvelle position). Marqueur `v` dans l'objet aptitudes
   lui-même : une sauvegarde plus ancienne rechargée repasse ici. */
const APT_VERSION = 125;
function _aptMigrer(e){
  if((e.v|0) >= APT_VERSION || typeof APT_TRONC==="undefined") return;
  let rendu = 0;
  if(e.pris.includes("tr4")){ e.pris = e.pris.filter(x=>x!=="tr4"); rendu += 2; }
  for(const c of aptToutesChaines()){
    let trou = false;
    c.noeuds.forEach((n, i)=>{
      const a = e.pris.includes(n.id);
      if(trou && a){ e.pris = e.pris.filter(x=>x!==n.id); rendu += aptCout(i); }
      else if(!a) trou = true;
    });
  }
  e.v = APT_VERSION;
  if(rendu > 0){
    e.pa += rendu;
    setTimeout(()=>{ if(typeof journal==="function") journal(`L'arbre d'Aptitudes a été remanié : ${rendu} point${rendu>1?"s":""} d'Aptitude t'${rendu>1?"ont":"a"} été rendu${rendu>1?"s":""}, à replacer.`,"gain");
                     if(typeof sauvegarder==="function") sauvegarder(); }, 0);
  }
}
function aptPris(id){ return aptEtat().pris.includes(id); }

// Toutes les chaînes (tronc + toutes factions) — sert au calcul du coût pour le respec.
function aptToutesChaines(){ return [...APT_TRONC, ...Object.values(APT_FACTIONS)]; }
function aptCoutParId(id){
  for(const c of aptToutesChaines()){ const i=c.noeuds.findIndex(n=>n.id===id); if(i>=0) return aptCout(i); }
  return 1;
}
// Branche de faction visible = uniquement la sienne (les autres sont masquées).
function aptBranche(){ return etat.faction ? APT_FACTIONS[etat.faction] : null; }

/* ---------- Achat / respec / gain ---------- */
function acheterApt(chaine, idx){
  const n = chaine.noeuds[idx]; const e = aptEtat();
  if(aptPris(n.id)) return;
  if(idx > 0 && !aptPris(chaine.noeuds[idx-1].id)){ journal("Il faut d'abord le nœud précédent.","alerte"); return; }
  const cout = aptCout(idx);
  if(e.pa < cout){ journal("Pas assez de points d'Aptitude.","alerte"); return; }
  e.pa -= cout; e.pris.push(n.id);
  journal(`Aptitude acquise : ${n.nom}.`,"gain");
  sauvegarder(); majAptitudes();
  // Beaucoup d'écrans dépendent des aptitudes (vol/hack, capacité du sac,
  // coûts du terrain) : sans redessin, ils restaient sur l'état d'avant.
  if(typeof afficher==="function") afficher();
  if(typeof majVoler==="function") majVoler();
}
/* v0.94 — LA PREMIÈRE RÉATTRIBUTION EST OFFERTE. La chaîne est stricte et les
   PA sont rares : un débutant qui se trompe de branche reste coincé jusqu'à
   50 000 ₡, ce qui est une frustration, pas une difficulté. Une fois, gratuit ;
   ensuite, plein tarif.
   ⚠ `respecOffert` vit dans `donnees` (via `etat`), pas côté serveur : la
   réattribution est déjà entièrement client, crédits compris. À déplacer le
   jour où les crédits d'aptitude passeront au serveur. */
function respecGratuit(){ return !etat.respecOffert; }
function respecCout(){ return respecGratuit() ? 0 : APT_RESPEC; }
async function respecApt(){
  const e = aptEtat();
  if(e.pris.length === 0){ journal("Aucune aptitude à réattribuer.","alerte"); return; }
  const cout = respecCout();
  if(etat.credits < cout){ journal(`Réattribution : ${cout} ₡ nécessaires.`,"alerte"); return; }
  const question = (cout === 0)
    ? `Réattribuer toutes tes aptitudes ? C'est OFFERT — une seule fois. Les suivantes coûteront ${APT_RESPEC.toLocaleString("fr-FR")} ₡.`
    : `Réattribuer toutes tes aptitudes pour ${cout} ₡ ? Tes points seront rendus, à replacer.`;
  if(!await confirmerJoli("Réattribuer les aptitudes", question, "Réattribuer")) return;
  const rendu = e.pris.reduce((a,id)=>a+aptCoutParId(id), 0);
  etat.credits -= cout; e.pa += rendu; e.pris = [];
  // ⚠ Le drapeau se pose APRÈS le confirm : une annulation ne doit pas
  // consommer la gratuité.
  etat.respecOffert = true;
  journal((cout === 0)
    ? `Aptitudes réattribuées — réattribution offerte, +${rendu} PA à replacer.`
    : `Aptitudes réattribuées : −${cout} ₡, +${rendu} PA à replacer.`, "gain");
  sauvegarder(); afficher();
}
// Appelée à la fin d'une quête (à venir) — et par le bouton debug.
function gagnerPA(n=1){ aptEtat().pa += n; sauvegarder(); majAptitudes(); }
/* v1.26 — DONS DE PA (console dev → admin_donner_pa). Le serveur ne peut pas
   écrire dans donnees : il dépose le don dans `dons_pa`, le client le retire
   (consommer_dons_pa, qui l'efface) et l'ajoute lui-même. Relevé au
   démarrage puis toutes les 2 minutes. */
async function aptConsommerDons(){
  if(typeof sb==="undefined" || !sb) return;
  try{
    const { data, error } = await sb.rpc("consommer_dons_pa");
    if(error || !(data > 0)) return;
    aptEtat().pa += data;
    journal(`Tu reçois ${data} point${data>1?"s":""} d'Aptitude.`, "gain");
    sauvegarder(); if(typeof majAptitudes==="function") majAptitudes();
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "aptitudes.js#dons"); }
}
if(typeof window!=="undefined"){ setTimeout(aptConsommerDons, 15000); setInterval(aptConsommerDons, 120000); }
/* Remboursement de la seule branche de FACTION — le tronc n'est jamais touché.
   ⚠ v0.92 — CÂBLÉE (parametres.js, changement de faction). Elle était écrite
   depuis des mois et appelée nulle part : les aptitudes d'une faction quittée
   restaient prises, leurs PA perdus, et le joueur se retrouvait avec des nœuds
   d'une branche à laquelle il n'appartenait plus.
   ⚠ APPELER AVANT d'écrire `etat.faction` : `aptBranche()` lit la faction
   COURANTE. Après, elle rendrait la branche de la NOUVELLE faction — donc
   rembourserait des points jamais dépensés.
   Renvoie le total rendu, pour pouvoir l'annoncer au joueur. */
function aptRembourserFaction(){
  const e = aptEtat(); const br = aptBranche(); if(!br) return 0;
  const ids = br.noeuds.map(n=>n.id);
  const rendu = e.pris.filter(id=>ids.includes(id)).reduce((a,id)=>a+aptCoutParId(id), 0);
  e.pris = e.pris.filter(id=>!ids.includes(id)); e.pa += rendu;
  return rendu;
}

/* ---------- Écran (injection unique + mises à jour) ---------- */
let _aptMonte = false;
function monterAptitudes(){
  if(_aptMonte) return;
  const panneau = document.querySelector('[data-panneau="aptitudes"]'); if(!panneau) return;
  panneau.innerHTML =
    `<h2>Aptitudes <span class="pts" id="apt-pa"></span></h2>
     <p class="vide" style="margin:0 0 12px">Les points d'Aptitude se gagnent en accomplissant des quêtes ; certaines en donnent plus que d'autres. Chaîne stricte : chaque nœud exige le précédent. Réattribution : ${respecGratuit() ? "<b>la première est offerte</b>, puis " : ""}${APT_RESPEC.toLocaleString("fr-FR")} ₡.</p>
     <div class="apt-sous-menu">
       <button class="apt-sous-lien actif" data-apt="communes">Aptitudes communes</button>
       <button class="apt-sous-lien" data-apt="speciales">Aptitudes spéciales</button>
     </div>
     <div class="apt-vue" id="apt-vue-communes"></div>
     <div class="apt-vue" id="apt-vue-speciales" hidden></div>
     <div class="apt-boutons">
       <button class="mini" id="apt-respec">Réattribuer (${respecGratuit() ? "offert" : APT_RESPEC.toLocaleString("fr-FR")+" ₡"})</button>
     </div>`;
  panneau.querySelector("#apt-respec").addEventListener("click", respecApt);
  panneau.querySelectorAll(".apt-sous-lien").forEach(b => b.addEventListener("click", ()=>{
    panneau.querySelectorAll(".apt-sous-lien").forEach(x=>x.classList.toggle("actif", x===b));
    panneau.querySelector("#apt-vue-communes").hidden = b.dataset.apt !== "communes";
    panneau.querySelector("#apt-vue-speciales").hidden = b.dataset.apt !== "speciales";
  }));
  _aptMonte = true;
}
function aptCarte(chaine, idx){
  const n = chaine.noeuds[idx]; const cout = aptCout(idx); const e = aptEtat();
  const acquis = aptPris(n.id);
  const prereqOk = idx === 0 || aptPris(chaine.noeuds[idx-1].id);
  let cls, bas;
  if(acquis){ cls = "acquis"; bas = `<span class="apt-tag">✓ acquis</span>`; }
  else if(!prereqOk){ cls = "verrou"; bas = `<span class="apt-tag">🔒 ${chaine.noeuds[idx-1].nom}</span>`; }
  else { cls = "dispo"; bas = `<button class="mini apt-buy" ${e.pa>=cout?"":"disabled"}>Acheter · ${cout} PA</button>`; }
  const div = document.createElement("div"); div.className = "apt-noeud " + cls;
  div.innerHTML =
    `<div class="apt-n-tete"><b>${n.nom}</b>${acquis?"":`<span class="apt-cout">${cout} PA</span>`}</div>
     <div class="apt-n-effet">${n.effet}</div>
     ${n.deblocage?`<div class="apt-n-type">déblocage</div>`:""}
     <div class="apt-n-bas">${bas}</div>`;
  const b = div.querySelector(".apt-buy"); if(b) b.addEventListener("click", ()=>acheterApt(chaine, idx));
  return div;
}
const ICONE_VOIE = { sv:"🫁", pr:"⛏️", ar:"🔧", tr:"🎯", om:"🌑", ig:"🔥", cu:"🌿", to:"❄️", ro:"⚙️", no:"🐫" };
function aptColonne(chaine){
  const col = document.createElement("div"); col.className = "apt-voie";
  const cle = ((chaine.noeuds[0] && chaine.noeuds[0].id) || "").slice(0,2);
  const ico = ICONE_VOIE[cle] || "◆";
  col.innerHTML = `<div class="apt-voie-tete"><span class="apt-voie-ico">${ico}</span><span class="apt-voie-nom">${chaine.nom}</span></div>`;
  chaine.noeuds.forEach((n,i)=>col.appendChild(aptCarte(chaine, i)));
  return col;
}
function majAptitudes(){
  monterAptitudes();
  const panneau = document.querySelector('[data-panneau="aptitudes"]'); if(!panneau) return;
  const e = aptEtat();
  const pa = panneau.querySelector("#apt-pa"); if(pa) pa.textContent = `${e.pa} PA`;

  // Aptitudes communes = tronc (5 voies)
  const com = panneau.querySelector("#apt-vue-communes"); com.innerHTML = "";
  const grille = document.createElement("div"); grille.className = "apt-grille";
  APT_TRONC.forEach(v => grille.appendChild(aptColonne(v)));
  com.appendChild(grille);

  // Aptitudes spéciales = uniquement ta branche de faction (les autres sont masquées)
  const spe = panneau.querySelector("#apt-vue-speciales"); spe.innerHTML = "";
  const br = aptBranche();
  if(br){
    const info = document.createElement("p"); info.className = "vide"; info.style.margin = "0 0 10px";
    info.textContent = `Réservées à ta faction (${br.nom}). Les autres factions n'y ont pas accès — l'info se partage en jeu.`;
    spe.appendChild(info);
    spe.appendChild(aptColonne(br));   // une seule chaîne, en colonne (largeur bornée par le CSS)
  } else {
    spe.innerHTML = `<p class="vide">Rejoins une faction pour débloquer tes aptitudes spéciales.</p>`;
  }

  const rb = panneau.querySelector("#apt-respec"); if(rb) rb.disabled = e.pris.length === 0 || etat.credits < respecCout();
}
// Note : pas d'appel au chargement — `etat` n'existe qu'après bootstrap.js.
// Le premier rendu (et tous les suivants) passe par afficher() dans rendu.js.
