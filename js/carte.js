/* ===========================================================
   CARTE — Carte continue d'Maar : construction, mise à jour, voyage, ouverture/fermeture.
   =========================================================== */
/* ---------- Carte continue ---------- */
const DW = 1500;                       // largeur d'affichage (px) ; le reste défile
const DH = Math.round(DW * MONDE.h / MONDE.w);
const PAS = 63;                        // unités par 1 % d'énergie (Toundra->Nomades ≈ 15 %)
const PAS_O2 = 80;                      // unités par 1 O₂ (déplacement à découvert) — 160 avant v0.53 : le coût
                                        // était 3× moindre que celui en énergie, or l'énergie se régénère seule
                                        // (+10 %/h) alors que l'O₂ ne revient que par objets. Doublé pour que
                                        // les recharges servent vraiment.
// Cercle (ville ou lieu) contenant un point, ou null. Le Protocole n'est pas une zone d'abri.
function cercleContenant(p){
  for(const fid in VILLES){ const v=VILLES[fid]; if(dist(p.x,p.y,v.x,v.y) < v.r) return v; }
  for(const l of LIEUX){ if(dist(p.x,p.y,l.x,l.y) < l.r) return l; }
  return null;
}
function bordVers(c, vers){ const a=Math.atan2(vers.y-c.y, vers.x-c.x); return { x:c.x+Math.cos(a)*c.r, y:c.y+Math.sin(a)*c.r }; }
// Longueur du trajet À DÉCOUVERT (hors cercles) : gratuit dans un cercle, mesuré depuis la peau au départ/arrivée.
function distanceOuverte(a, b){
  const ca=cercleContenant(a), cb=cercleContenant(b);
  if(ca && ca===cb) return 0;                                   // même cercle : gratuit
  const ea = ca ? bordVers(ca, b) : a;                          // départ effectif (peau du cercle)
  const eb = cb ? bordVers(cb, a) : b;                          // arrivée effective
  const dx=b.x-a.x, dy=b.y-a.y, sx=eb.x-ea.x, sy=eb.y-ea.y;
  if(dx*sx + dy*sy <= 0) return 0;                              // cercles jointifs/recouvrants
  return Math.min(dist(ea.x,ea.y,eb.x,eb.y), dist(a.x,a.y,b.x,b.y));
}
const COUL_LIEU = { mine:"var(--orange)", chasse:"var(--coral)", quete:"var(--bleu)" };
const GLYPHE_LIEU = { mine:"◆", chasse:"◎", quete:"★" };

function construireCarte(){
  const svg=document.querySelector("#carte");
  svg.setAttribute("viewBox",`0 0 ${MONDE.w} ${MONDE.h}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  let html = `<image href="images/carte.jpg" x="0" y="0" width="${MONDE.w}" height="${MONDE.h}" preserveAspectRatio="none"/>`;
  // (anciens lieux ◎/★ statiques retirés)
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
    const p = _carteCoord(svg, e); if(!p) return;
    voyager(p.x, p.y);
  });

  /* Aperçu du coût AVANT de cliquer. Reprend exactement le calcul de voyager()
     — même projection hors du cercle du Protocole, même distanceOuverte, mêmes
     aptitudes — sinon l'estimation mentirait. Le survol ne débite rien.
     `pointermove` couvre souris ET stylet ; sur écran tactile il n'y a pas de
     survol, l'aperçu s'affiche alors au premier contact avant le clic. */
  svg.addEventListener("pointermove", e => {
    const p = _carteCoord(svg, e); if(!p) return;
    _apercuCout(p.x, p.y);
  });
  svg.addEventListener("pointerleave", () => _apercuCout(null));
}

function _carteCoord(svg, e){
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM(); if(!m) return null;
  return pt.matrixTransform(m.inverse());
}

/* Renvoie {coutE, coutO, dOpen} pour une destination — la vérité du calcul est
   ici, voyager() s'en sert aussi : deux formules séparées finiraient par
   diverger et l'aperçu deviendrait faux sans prévenir. */
function coutTrajet(x, y){
  if(!etat.pos || etat.pos.x===undefined) return null;
  x = Math.max(0, Math.min(MONDE.w, x));
  y = Math.max(0, Math.min(MONDE.h, y));
  const z = ZONE_PROTOCOLE, dp = dist(x, y, z.x, z.y);
  if(dp < z.r){ const a = Math.atan2(y - z.y, x - z.x); x = z.x + Math.cos(a)*z.r; y = z.y + Math.sin(a)*z.r; }
  const dFull = dist(etat.pos.x, etat.pos.y, x, y);
  if(dFull < 6) return null;
  const dOpen = distanceOuverte(etat.pos, {x, y});
  return {
    dOpen,
    coutE: dOpen>0 ? aptEnergieDeplacement(Math.max(1, Math.round(dOpen/PAS)))   : 0,
    coutO: dOpen>0 ? coutO2(Math.max(1, Math.round(dOpen/PAS_O2)))               : 0
  };
}

let _apercuDer = "";
function _apercuCout(x, y){
  const z = document.querySelector("#carte-apercu"); if(!z) return;
  if(x === null){ if(_apercuDer!==""){ _apercuDer=""; z.innerHTML=""; } return; }
  const c = coutTrajet(x, y);
  let h = "";
  if(!c) h = "";
  else if(c.dOpen <= 0) h = `<span class="ap-ok">Trajet gratuit</span>`;
  else {
    const manqueE = (etat.energie|0) < c.coutE;
    const manqueO = (etat.jauges && (etat.jauges.o2|0) < c.coutO);
    h = `<span class="${manqueE?"ap-ko":"ap-ok"}">−${c.coutE} énergie</span>`
      + `<span class="${manqueO?"ap-ko":"ap-ok"}">−${c.coutO} O₂</span>`
      + (manqueE||manqueO ? `<span class="ap-ko">insuffisant</span>` : "");
  }
  if(h !== _apercuDer){ _apercuDer = h; z.innerHTML = h; }   // évite de réécrire à chaque pixel
}
function majCarte(){
  if(!etat.pos || etat.pos.x===undefined) etat.pos=posDefaut();
  const ce=document.querySelector("#carte-energie"); if(ce){ const e=Math.floor(etat.energie); ce.textContent=e; document.querySelector("#cj-energie").classList.toggle("bas", e<20); }
  const co=document.querySelector("#carte-o2"); if(co){ const o=Math.floor(etat.jauges.o2); co.textContent=o; document.querySelector("#cj-o2").classList.toggle("bas", o<20); }
  const av=document.querySelector("#avatar");
  if(av){ const col=(FACTIONS.find(f=>f.id===etat.faction)||{}).couleur||"#ff9a44";
    av.innerHTML=`<circle cx="${etat.pos.x}" cy="${etat.pos.y}" r="15" fill="#0a1730" stroke="${col}" stroke-width="4"/><circle cx="${etat.pos.x}" cy="${etat.pos.y}" r="6" fill="${col}"/>`; }
  const ville=villeActuelle(); const lieu=lieuActuel(); let t;
  if(ville){ const fc=FACTIONS.find(f=>f.id===ville); t=`Tu es à <b style="color:${fc.couleur}">${fc.nom}</b>. <span style="color:var(--bleu)">Repos et comptoir disponibles.</span>`; }
  else if(surAnneauProtocole()){ t=`<b style="color:#b9a0f0">Anneau du Protocole.</b> <span style="color:var(--sourdine)">L'Ombre de ta faction peut hacker le Protocole ici. On ne peut pas entrer dans la zone.</span>`; }
  else { t=`Zone sauvage.`;
    if(lieu){ if(lieu.type==="mine") t+=` <span style="color:var(--orange)">Filon riche.</span>`; if(lieu.type==="chasse") t+=` <span style="color:var(--coral)">Terrain de chasse.</span>`; if(lieu.type==="quete") t+=` <span style="color:var(--bleu)">Étape de quête (bientôt).</span>`; }
    /* Mention retirée : le minage/la chasse ne se font plus n'importe où en
       zone sauvage, seulement sur un `lieu` (filon, terrain de chasse), déjà
       signalé juste au-dessus. */ }
  document.querySelector("#region-info").innerHTML = t + ` <span style="color:var(--sourdine)">[${Math.round(etat.pos.x)}, ${Math.round(etat.pos.y)}]</span>`;
  if(surAnneauProtocole()){ const ri=document.querySelector("#region-info"); if(ri){ const hb=document.createElement("button"); hb.className="mini"; hb.textContent="Hacker le Protocole"; hb.style.marginLeft="8px"; hb.addEventListener("click",()=>{ if(typeof hackerProtocoleDepuisCarte==="function") hackerProtocoleDepuisCarte(); }); ri.appendChild(hb); } }
  if(typeof majMarqueursQuete==="function") majMarqueursQuete();
  const cl=document.querySelector("#carte-lieu"); if(cl) cl.innerHTML = t;
  majHub();
}
async function voyager(x, y){
  if(!etat.pos || etat.pos.x===undefined) etat.pos=posDefaut();
  if(etat.enPause){ journal("Personnage en pause.","alerte"); return; }
  if(typeof enPrison==="function" && enPrison()){ journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte"); return; }
  // Reste dans les limites de la carte (pas de hors-image)
  x = Math.max(0, Math.min(MONDE.w, x));
  y = Math.max(0, Math.min(MONDE.h, y));
  // Protocole : impossible d'entrer dans le cercle -> on est projeté sur l'anneau (le trait)
  const z = ZONE_PROTOCOLE, dp = dist(x, y, z.x, z.y);
  if(dp < z.r){ const a = Math.atan2(y - z.y, x - z.x); x = z.x + Math.cos(a) * z.r; y = z.y + Math.sin(a) * z.r; }
  // ⚠ Le calcul est délégué à coutTrajet(), la MÊME fonction que l'aperçu au
  //    survol : dupliquer la formule ici la ferait diverger tôt ou tard, et
  //    l'aperçu se mettrait à annoncer un prix différent de celui débité.
  const c = coutTrajet(x, y);
  if(!c) return;                                   // trop court (< 6 u) ou position inconnue
  const dOpen = c.dOpen, coutE = c.coutE, coutO = c.coutO;
  if((coutE>0 || coutO>0) && !await agirServeur({ cout:coutE, jauges:{ o2:-coutO }, motif:"deplacement" })) return;
  // L'O₂ est une jauge serveur : elle part avec l'énergie, dans le même appel.
  etat.pos={ x:Math.round(x), y:Math.round(y) };
  // La position part au serveur : elle décide de la présence au combat.
  if(typeof sauvegarder==="function") sauvegarder();
  if(etat.pas) etat.pas.deplace=true;
  journal((dOpen<=0 ? `Déplacement dans la zone (gratuit).`
                    : `Déplacement (${Math.round(dOpen)} u à découvert). −${coutE} % énergie, −${coutO} O₂.`)
          + (surAnneauProtocole()?" Tu es sur l'anneau du Protocole.":""));
  apresAction();
  if(typeof queteArrivee==="function") queteArrivee();
  if(dOpen>0 && typeof tenterPatrouille==="function") tenterPatrouille();
}

/* ---------- Inscription ---------- */
function ouvrirCarte(){ document.querySelector("#modale-carte").classList.add("ouverte"); majCarte(); }
function fermerCarte(){ document.querySelector("#modale-carte").classList.remove("ouverte"); }
