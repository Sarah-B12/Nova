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
  return etat.aptitudes;
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
}
function respecApt(){
  const e = aptEtat();
  if(e.pris.length === 0){ journal("Aucune aptitude à réattribuer.","alerte"); return; }
  if(etat.credits < APT_RESPEC){ journal(`Réattribution : ${APT_RESPEC} ₡ nécessaires.`,"alerte"); return; }
  if(!confirm(`Réattribuer toutes tes aptitudes pour ${APT_RESPEC} ₡ ? Tes points seront rendus, à replacer.`)) return;
  const rendu = e.pris.reduce((a,id)=>a+aptCoutParId(id), 0);
  etat.credits -= APT_RESPEC; e.pa += rendu; e.pris = [];
  journal(`Aptitudes réattribuées : −${APT_RESPEC} ₡, +${rendu} PA à replacer.`,"gain");
  sauvegarder(); afficher();
}
// Appelée à la fin d'une quête (à venir) — et par le bouton debug.
function gagnerPA(n=1){ aptEtat().pa += n; sauvegarder(); majAptitudes(); }
// Remboursement de la seule branche de faction (au changement de faction — à câbler plus tard).
function aptRembourserFaction(){
  const e = aptEtat(); const br = aptBranche(); if(!br) return;
  const ids = br.noeuds.map(n=>n.id);
  const rendu = e.pris.filter(id=>ids.includes(id)).reduce((a,id)=>a+aptCoutParId(id), 0);
  e.pris = e.pris.filter(id=>!ids.includes(id)); e.pa += rendu;
}

/* ---------- Écran (injection unique + mises à jour) ---------- */
let _aptMonte = false;
function monterAptitudes(){
  if(_aptMonte) return;
  const panneau = document.querySelector('[data-panneau="aptitudes"]'); if(!panneau) return;
  panneau.innerHTML =
    `<h2>Aptitudes <span class="pts" id="apt-pa"></span></h2>
     <p class="vide" style="margin:0 0 12px">1 point d'Aptitude par quête accomplie. Chaîne stricte : chaque nœud exige le précédent. Réattribution : ${APT_RESPEC.toLocaleString("fr-FR")} ₡.</p>
     <div class="apt-sous-menu">
       <button class="apt-sous-lien actif" data-apt="communes">Aptitudes communes</button>
       <button class="apt-sous-lien" data-apt="speciales">Aptitudes spéciales</button>
     </div>
     <div class="apt-vue" id="apt-vue-communes"></div>
     <div class="apt-vue" id="apt-vue-speciales" hidden></div>
     <div class="apt-boutons">
       <button class="mini" id="apt-respec">Réattribuer (${APT_RESPEC.toLocaleString("fr-FR")} ₡)</button>
       <button class="mini" id="apt-debug">+1 PA (debug)</button>
     </div>`;
  panneau.querySelector("#apt-respec").addEventListener("click", respecApt);
  panneau.querySelector("#apt-debug").addEventListener("click", ()=>gagnerPA(1));
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
function aptColonne(chaine){
  const col = document.createElement("div"); col.className = "apt-voie";
  col.innerHTML = `<div class="apt-voie-tete">${chaine.nom}</div>`;
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

  const rb = panneau.querySelector("#apt-respec"); if(rb) rb.disabled = e.pris.length === 0 || etat.credits < APT_RESPEC;
}
// Note : pas d'appel au chargement — `etat` n'existe qu'après bootstrap.js.
// Le premier rendu (et tous les suivants) passe par afficher() dans rendu.js.
