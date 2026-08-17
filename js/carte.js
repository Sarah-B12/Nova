/* ===========================================================
   CARTE — Carte continue d'Ori 55 : construction, mise à jour, voyage, ouverture/fermeture.
   =========================================================== */
/* ---------- Carte continue ---------- */
const DW = 1500;                       // largeur d'affichage (px) ; le reste défile
const DH = Math.round(DW * MONDE.h / MONDE.w);
const PAS = 130;                       // unités par 1 % d'énergie
const COUL_LIEU = { mine:"var(--orange)", chasse:"var(--coral)", quete:"var(--bleu)" };
const GLYPHE_LIEU = { mine:"◆", chasse:"◎", quete:"★" };

function construireCarte(){
  const svg=document.querySelector("#carte");
  svg.setAttribute("viewBox",`0 0 ${MONDE.w} ${MONDE.h}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  let html = `<image href="images/carte.jpg" x="0" y="0" width="${MONDE.w}" height="${MONDE.h}" preserveAspectRatio="none"/>`;
  // Lieux spéciaux
  for(const l of LIEUX){
    html += `<g class="lieu"><circle cx="${l.x}" cy="${l.y}" r="${l.r}" fill="none" stroke="${COUL_LIEU[l.type]}" stroke-opacity=".4" stroke-dasharray="6 8"/>
      <text x="${l.x}" y="${l.y+13}" text-anchor="middle" style="fill:${COUL_LIEU[l.type]}" font-size="38">${GLYPHE_LIEU[l.type]}</text></g>`;
  }
  // Villes de faction
  for(const fid in VILLES){ const v=VILLES[fid]; const f=FACTIONS.find(x=>x.id===fid);
    html += `<g class="ville"><circle cx="${v.x}" cy="${v.y}" r="${v.r}" fill="${f.couleur}22" stroke="${f.couleur}" stroke-width="2.5"/>
      <text x="${v.x}" y="${v.y+6}" text-anchor="middle" class="vlabel" style="fill:${f.couleur}">${f.nom}</text></g>`;
  }
  // Zone de l'antagoniste (bas-gauche, électrique) — non interactive ; entrée interdite en jeu
  html += `<g class="antagoniste" style="pointer-events:none"><circle cx="${ZONE_PROTOCOLE.x}" cy="${ZONE_PROTOCOLE.y}" r="${ZONE_PROTOCOLE.r}" fill="#8a5cf018" stroke="#8a5cf0" stroke-opacity=".6" stroke-dasharray="5 10"/>
    <text x="${ZONE_PROTOCOLE.x}" y="${ZONE_PROTOCOLE.y + ZONE_PROTOCOLE.r + 38}" text-anchor="middle" class="vlabel" style="fill:#b9a0f0">Le Protocole</text></g>`;
  html += `<g id="avatar"></g>`;
  svg.innerHTML = html;
  // Clic n'importe où = se déplacer vers ces coordonnées (matrice = précis à toute échelle).
  svg.addEventListener("click", e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if(!m) return;
    const p = pt.matrixTransform(m.inverse());
    voyager(p.x, p.y);
  });
}
function majCarte(){
  if(!etat.pos || etat.pos.x===undefined) etat.pos=posDefaut();
  const av=document.querySelector("#avatar");
  if(av){ const col=(FACTIONS.find(f=>f.id===etat.faction)||{}).couleur||"#ff9a44";
    av.innerHTML=`<circle cx="${etat.pos.x}" cy="${etat.pos.y}" r="15" fill="#0a1730" stroke="${col}" stroke-width="4"/><circle cx="${etat.pos.x}" cy="${etat.pos.y}" r="6" fill="${col}"/>`; }
  const ville=villeActuelle(); const lieu=lieuActuel(); let t;
  if(ville){ const fc=FACTIONS.find(f=>f.id===ville); t=`Tu es à <b style="color:${fc.couleur}">${fc.nom}</b>. <span style="color:var(--bleu)">Repos et comptoir disponibles.</span>`; }
  else if(surAnneauProtocole()){ t=`<b style="color:#b9a0f0">Anneau du Protocole.</b> <span style="color:var(--sourdine)">Hack / espionnage possible ici (à venir). On ne peut pas entrer dans la zone.</span>`; }
  else { t=`Zone sauvage.`;
    if(lieu){ if(lieu.type==="mine") t+=` <span style="color:var(--orange)">Filon riche.</span>`; if(lieu.type==="chasse") t+=` <span style="color:var(--coral)">Terrain de chasse.</span>`; if(lieu.type==="quete") t+=` <span style="color:var(--bleu)">Étape de quête (bientôt).</span>`; }
    t+=` <span style="color:var(--sourdine)">Minage, exploration et chasse ici.</span>`; }
  document.querySelector("#region-info").innerHTML = t + ` <span style="color:var(--sourdine)">[${Math.round(etat.pos.x)}, ${Math.round(etat.pos.y)}]</span>`;
  const cl=document.querySelector("#carte-lieu"); if(cl) cl.innerHTML = t;
  majHub();
}
function voyager(x, y){
  if(!etat.pos || etat.pos.x===undefined) etat.pos=posDefaut();
  if(etat.enPause){ journal("Personnage en pause.","alerte"); return; }
  // Reste dans les limites de la carte (pas de hors-image)
  x = Math.max(0, Math.min(MONDE.w, x));
  y = Math.max(0, Math.min(MONDE.h, y));
  // Protocole : impossible d'entrer dans le cercle -> on est projeté sur l'anneau (le trait)
  const z = ZONE_PROTOCOLE, dp = dist(x, y, z.x, z.y);
  if(dp < z.r){ const a = Math.atan2(y - z.y, x - z.x); x = z.x + Math.cos(a) * z.r; y = z.y + Math.sin(a) * z.r; }
  const d=dist(etat.pos.x,etat.pos.y,x,y);
  if(d<6) return;
  const cout=aptEnergieDeplacement(Math.max(1, Math.round(d/PAS)));
  if(!depenserEnergie(cout)) return;
  etat.pos={ x:Math.round(x), y:Math.round(y) };
  journal(`Déplacement (${Math.round(d)} u). −${cout} % énergie.`+(surAnneauProtocole()?" Tu es sur l'anneau du Protocole.":""));
  apresAction();
}

/* ---------- Inscription ---------- */
function ouvrirCarte(){ document.querySelector("#modale-carte").classList.add("ouverte"); majCarte(); }
function fermerCarte(){ document.querySelector("#modale-carte").classList.remove("ouverte"); }
