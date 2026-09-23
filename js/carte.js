/* ===========================================================
   CARTE — Carte continue d'Maar : construction, mise à jour, voyage, ouverture/fermeture.
   =========================================================== */
/* ---------- Carte continue ---------- */
const PAS = 63;                        // unités par 1 % d'énergie (Toundra->Nomades ≈ 15 %)
const PAS_O2 = 80;                      // unités par 1 O₂ (déplacement à découvert) — 160 avant v0.53 : le coût
                                        // était 3× moindre que celui en énergie, or l'énergie se régénère seule
                                        // (+10 %/h) alors que l'O₂ ne revient que par objets. Doublé pour que
                                        // les recharges servent vraiment.
// Cercle (ville ou lieu) contenant un point, ou null. Le Protocole n'est pas une zone d'abri.
function cercleContenant(p){
  for(const fid in VILLES){ const v=VILLES[fid]; if(dist(p.x,p.y,v.x,v.y) < v.r) return v; }
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
  /* ⚠ v0.82 — CLIC HORS DE L'IMAGE. La carte fait 2400×1600 et
     preserveAspectRatio la centre SANS la déformer : dans une fenêtre plus
     large, il reste deux bandes vides à gauche et à droite, À L'INTÉRIEUR du
     SVG. L'écoute portait sur le SVG entier : cliquer dans le vide renvoyait
     des coordonnées valides (bornées au monde) et le voyage partait — d'où
     des déplacements vers le bord sans l'avoir voulu. On refuse désormais
     tout point hors des limites réelles du monde. */
  svg.addEventListener("click", e => {
    const p = _carteCoord(svg, e); if(!p) return;
    if(!_dansLaCarte(p)) return;
    voyager(p.x, p.y);
  });

  /* Aperçu du coût AVANT de cliquer. Reprend exactement le calcul de voyager()
     — même projection hors du cercle du Protocole, même distanceOuverte, mêmes
     aptitudes — sinon l'estimation mentirait. Le survol ne débite rien.
     `pointermove` couvre souris ET stylet ; sur écran tactile il n'y a pas de
     survol, l'aperçu s'affiche alors au premier contact avant le clic. */
  svg.addEventListener("pointermove", e => {
    const p = _carteCoord(svg, e); if(!p) return;
    if(!_dansLaCarte(p)){ _apercuCout(null); return; }
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
/* ⚠ v0.94b — `depuis` (optionnel) : calculer un trajet depuis un AUTRE point
   que la position actuelle, pour savoir si le retour sera encore possible une
   fois arrivé. Tout le reste est inchangé, et surtout : la formule reste ICI,
   en un seul endroit (voir l'avertissement dans allerA). */
function coutTrajet(x, y, depuis){
  const src = depuis || etat.pos;
  if(!src || src.x===undefined) return null;
  x = Math.max(0, Math.min(MONDE.w, x));
  y = Math.max(0, Math.min(MONDE.h, y));
  const z = ZONE_PROTOCOLE, dp = dist(x, y, z.x, z.y);
  if(dp < z.r){ const a = Math.atan2(y - z.y, x - z.x); x = z.x + Math.cos(a)*z.r; y = z.y + Math.sin(a)*z.r; }
  const dFull = dist(src.x, src.y, x, y);
  if(dFull < 6) return null;
  const dOpen = distanceOuverte(src, {x, y});
  return {
    dOpen,
    coutE: dOpen>0 ? aptEnergieDeplacement(Math.max(1, Math.round(dOpen/PAS)))   : 0,
    coutO: dOpen>0 ? aptO2Deplacement(coutO2(Math.max(1, Math.round(dOpen/PAS_O2)))) : 0
  };
}

/* ===========================================================
   O₂ : LE RETOUR, ET L'APPEL DE DÉTRESSE (v0.94b)
   ⚠⚠ LE BLOCAGE QU'ON CORRIGE. L'O₂ ne remonte QUE dans le rayon de TA ville
   (`dans_zone_faction` joint `villes` sur ta faction — une cité étrangère ne
   te rend rien) ou par une Recharge / un Tank. Aucune régénération dans le
   temps, contrairement à l'énergie. Et la garde de la v0.58 refuse tout trajet
   dont le coût atteint l'O₂ restant. À 1 %, un joueur ne pouvait donc plus ni
   bouger, ni rentrer, ni mourir : le seul état du jeu dont on ne sortait pas
   en jouant. Un testeur y a passé la soirée.
   Deux réponses : on PRÉVIENT avant de franchir le point de non-retour, et on
   SECOURT ceux qui l'ont franchi.
   ⚠ Une seule destination, ta ville, sur toutes les cartes — présentes et à
     venir. « La ville la plus proche » déposerait le joueur au sec devant une
     porte qui ne s'ouvre pas pour lui. */
const SECOURS_SOL = 500;
/* ⚠ 500 et pas 200 comme en orbite : une Recharge rend 25 d'O₂ pour ~105 ₡ au
   marché (340 ₡ en boutique), donc refaire 100 % coûte 420 ₡ au marché. En
   dessous de ce prix, l'appel de détresse remplacerait l'achat de recharges et
   la survie n'aurait plus de coût. Plafonné à ce que le joueur possède : il
   repart quoi qu'il arrive, règle d'or de l'orbite. */

// Destination du remorquage : TA cité. Une escorte te ramène chez toi.
function villeRetour(){ return (typeof posDefaut==="function") ? posDefaut() : null; }

/* ⚠ v0.94b — LA CITÉ LA PLUS PROCHE, PAS LA SIENNE. L'air se refait dans le
   rayon de N'IMPORTE QUELLE cité (`air_respirable` côté serveur) : viser sa
   propre cité annoncerait « retour impossible » à un joueur planté à côté
   d'une ville étrangère parfaitement respirable. Deux questions distinctes :
   où puis-je respirer (n'importe où), et où me ramène-t-on (chez moi). */
function citeLaPlusProche(depuis){
  if(typeof VILLES!=="object" || !depuis) return null;
  let best = null;
  for(const f of Object.keys(VILLES)){
    const v = VILLES[f];
    const d = dist(depuis.x, depuis.y, v.x, v.y);
    if(!best || d < best.d) best = { d, f, x:v.x, y:v.y };
  }
  return best;
}
function nomCite(f){
  const e = (typeof FACTIONS!=="undefined" && Array.isArray(FACTIONS)) ? FACTIONS.find(z=>z.id===f) : null;
  return (e && e.nom) ? e.nom : "une cité";
}

/* O₂ qu'il faudra pour rejoindre la cité respirable la plus proche depuis
   `depuis`. null si on ne sait pas, 0 si on y est déjà (trajet < 6 u). */
function coutRetourO2(depuis){
  const v = citeLaPlusProche(depuis); if(!v || !depuis) return null;
  const c = coutTrajet(v.x, v.y, depuis);
  return c ? c.coutO : 0;
}
// Une source d'O₂ dans le sac ? (la liste vient d'EFFET_CONSO, pas d'une copie)
function o2DansLeSac(){
  if(typeof EFFET_CONSO!=="object" || !etat.sac) return false;
  return Object.keys(etat.sac).some(id => (etat.sac[id]|0) > 0
      && EFFET_CONSO[id] && (EFFET_CONSO[id].o2|0) > 0);
}
/* ⚠ v0.94b — LE SECOURS NE S'OUVRE PAS QU'AUX PERDUS DÉFINITIFS. Première
   version : le bouton n'apparaissait qu'une fois le retour devenu impossible.
   C'était demander au joueur d'AGGRAVER sa situation — de s'éloigner encore —
   pour avoir le droit d'être secouru. Un seul refus d'O₂ suffit désormais.
   Les deux autres conditions tiennent l'abus fermé : hors d'une ville, et rien
   à respirer dans le sac. Se vider exprès pour 500 ₡ ne fait gagner que le
   trajet du retour, qui vaut moins que ça en Recharges. */
let _refusO2 = false;

// Retour devenu impossible : le cas grave, qui ouvre le secours sans attendre.
function retourImpossible(){
  const besoin = coutRetourO2(etat.pos);
  if(besoin==null) return false;
  return besoin > 0 && besoin >= (etat.jauges ? (etat.jauges.o2|0) : 0);
}
function bloqueSansO2(){
  if(typeof horsSilene==="function" && horsSilene()) return false;   // l'orbite et les planètes ont leurs propres règles (v0.98)
  if(typeof villeActuelle==="function" && villeActuelle()) return false;
  if(o2DansLeSac()) return false;                              // il lui reste de quoi respirer
  return _refusO2 || retourImpossible();
}

async function secoursSol(){
  if(!bloqueSansO2()){ journal("Tu n'es pas bloqué : tu peux encore rejoindre ta cité.","alerte"); return; }
  /* ⚠ Pas de dette (décision du 19/09) : on prend ce qu'il a, et l'affaire est
     close. Une dette supposerait un mécanisme entier — la retenir sur quoi, et
     jusqu'à quand — pour un joueur qui est, par définition, déjà à sec. */
  const frais = Math.min(SECOURS_SOL, Math.max(0, etat.credits||0));
  if(!confirm(`Appel de détresse : une escorte vient te chercher et te ramène chez toi.\n\nCoût : ${frais} ₡${frais<SECOURS_SOL?" — tout ce qu'il te reste":` (tarif : ${SECOURS_SOL} ₡)`}.\n\nContinuer ?`)) return;
  const v = villeRetour(); if(!v) return;
  /* ⚠ Les crédits se débitent en mémoire puis se poussent : c'est la file
     `pousserCredits()` qui les porte au serveur (voir `_creditsEnAttente`).
     Même geste exact que le secours orbital. */
  etat.credits = Math.max(0, (etat.credits||0) - frais);
  if(typeof pousserCredits==="function") pousserCredits();
  etat.pos = { x:v.x, y:v.y };
  /* ⚠ LA POSITION PART AVANT TOUT LE RESTE. `agir()` relit `pos_x/pos_y` EN
     BASE pour décider si tu respires (dans_zone_faction) : appelée avant que la
     position ne soit écrite, elle te croirait encore au milieu de nulle part et
     ne te rendrait pas ton O₂. Même piège qu'en v0.58 avec les patrouilles. */
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  // Coût nul : le seul but est que le serveur constate qu'on est en ville.
  if(typeof agirServeur==="function") await agirServeur({ cout:0, motif:"secours_sol" });
  _refusO2 = false;   // il est rentré : le bouton se referme
  journal(`Appel de détresse : une escorte te ramène à ta cité. −${frais} ₡. Refais tes réserves d'O₂ avant de repartir.`,"alerte","voyage");
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  if(typeof afficher==="function") afficher();
}

/* Le point est-il sur l'image, et non dans une bande vide du SVG ? */
function _dansLaCarte(p){ return p && p.x >= 0 && p.y >= 0 && p.x <= MONDE.w && p.y <= MONDE.h; }

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
    const manqueO = (etat.jauges && (etat.jauges.o2|0) <= c.coutO);   // même règle que voyager()
    // v0.94b : le point de non-retour, annoncé AVANT le clic.
    const retour = manqueO ? null : coutRetourO2({ x, y });
    const resteApres = (etat.jauges ? (etat.jauges.o2|0) : 0) - c.coutO;
    const sansRetour = (retour != null && retour > 0 && retour >= resteApres);
    h = `<span class="${manqueE?"ap-ko":"ap-ok"}">−${c.coutE} énergie</span>`
      + `<span class="${manqueO?"ap-ko":"ap-ok"}">−${c.coutO} O₂</span>`
      + (manqueE||manqueO ? `<span class="ap-ko">insuffisant</span>`
         : sansRetour ? `<span class="ap-ko">retour impossible</span>` : "");
  }
  if(h !== _apercuDer){ _apercuDer = h; z.innerHTML = h; }   // évite de réécrire à chaque pixel
}
/* ===========================================================
   DISTANCES (v0.82) — le coût des trajets, sans survol.
   Deux tableaux : depuis TA position (ce qui sert à décider), puis la grille
   entre cités (fixe). Les chiffres passent par coutTrajet(), donc ils tiennent
   compte des aptitudes ET de la boisson en cours : afficher un barème brut
   mentirait à un Nomade qui a investi dans Voyageur.
   ⚠ Valeurs pour un trajet DIRECT : contourner l'anneau du Protocole coûte
   davantage, et coutTrajet() le reflète depuis ta position. */
function _coutEntre(a, b){
  const memo = etat.pos;
  etat.pos = { x:a.x, y:a.y };
  const c = coutTrajet(b.x, b.y);
  etat.pos = memo;
  return c || { coutE:0, coutO:0 };
}
function _cellCout(c){
  return c.coutE<=0 ? `<span class="itip-gris">—</span>`
                    : `${c.coutE} %<span class="itip-gris"> · ${c.coutO} O₂</span>`;
}
function ouvrirDistances(){
  const z=document.querySelector("#modale-distances"); if(!z) return;
  const ids=Object.keys(VILLES);
  const nom=id=>((FACTIONS.find(f=>f.id===id)||{}).nom)||id;

  // (a) depuis la position actuelle
  let h=`<h4 class="gsec">Depuis ta position</h4><div class="dist-depuis">`;
  const depuis=ids.map(id=>({ id, c:coutTrajet(VILLES[id].x, VILLES[id].y) }))
                  .sort((a,b)=>((a.c&&a.c.coutE)||0)-((b.c&&b.c.coutE)||0));
  for(const d of depuis){
    const c=d.c||{coutE:0,coutO:0};
    const trop=(etat.energie|0) < c.coutE || (etat.jauges && (etat.jauges.o2|0) <= c.coutO);
    h+=`<div class="dist-ligne${trop?" ko":""}"><b>${nom(d.id)}</b><span>${c.coutE<=0?"tu y es":`${c.coutE} % · ${c.coutO} O₂`}</span></div>`;
  }
  h+=`</div>`;

  // (b) grille entre cités
  h+=`<h4 class="gsec" style="margin-top:16px">Entre les cités</h4>
      <div class="dist-grille-boite"><table class="dist-grille"><tr><th></th>${ids.slice(0,-1).map(i=>`<th>${nom(i)}</th>`).join("")}</tr>`;
  for(let r=1;r<ids.length;r++){
    h+=`<tr><th>${nom(ids[r])}</th>`;
    for(let c=0;c<ids.length-1;c++){
      h+= c<r ? `<td>${_cellCout(_coutEntre(VILLES[ids[c]], VILLES[ids[r]]))}</td>` : `<td class="vide-c"></td>`;
    }
    h+=`</tr>`;
  }
  h+=`</table></div>
      <p class="vide" style="margin:10px 0 0">Énergie et O₂ pour un trajet <b>direct</b>, <b>avec tes aptitudes et ta boisson en cours</b>. Contourner l'anneau du Protocole coûte davantage.</p>`;

  z.querySelector("#distances-corps").innerHTML=h;
  z.classList.add("ouverte"); z.setAttribute("aria-hidden","false");
}
function fermerDistances(){
  const z=document.querySelector("#modale-distances"); if(!z) return;
  z.classList.remove("ouverte"); z.setAttribute("aria-hidden","true");
}

function majCarte(){
  if(!etat.pos || etat.pos.x===undefined) etat.pos=posDefaut();
  const ce=document.querySelector("#carte-energie"); if(ce){ const e=Math.floor(etat.energie); ce.textContent=e; document.querySelector("#cj-energie").classList.toggle("bas", e<20); }
  const co=document.querySelector("#carte-o2"); if(co){ const o=Math.floor(etat.jauges.o2); co.textContent=o; document.querySelector("#cj-o2").classList.toggle("bas", o<20); }
  /* v0.94b — le bouton n'apparaît QUE si le joueur est réellement coincé, et
     il est créé ici plutôt que dans index.html pour rester avec sa condition :
     un bouton toujours présent serait un taxi à 500 ₡. */
  const barre = document.querySelector("#carte-distances");
  let bs = document.querySelector("#carte-secours");
  if(bloqueSansO2()){
    if(!bs && barre && barre.parentElement){
      bs = document.createElement("button");
      bs.id = "carte-secours"; bs.className = "mini danger";
      bs.textContent = "Appel de détresse";
      bs.addEventListener("click", secoursSol);
      barre.parentElement.insertBefore(bs, barre);
    }
  } else if(bs){ bs.remove(); }
  const av=document.querySelector("#avatar");
  if(av){ const col=(FACTIONS.find(f=>f.id===etat.faction)||{}).couleur||"#ff9a44";
    av.innerHTML=`<circle cx="${etat.pos.x}" cy="${etat.pos.y}" r="15" fill="#0a1730" stroke="${col}" stroke-width="4"/><circle cx="${etat.pos.x}" cy="${etat.pos.y}" r="6" fill="${col}"/>`; }
  const ville=villeActuelle(); let t;
  /* ⚠ « Repos et comptoir disponibles » retiré : ces deux services n'existent
     plus. Et « Tu es à Les Nomades » était bancal — les noms de faction
     portent leur article, on n'en met donc pas devant. */
  if(ville){ const fc=FACTIONS.find(f=>f.id===ville); t=`<b style="color:${fc.couleur}">${fc.nom}</b> <span style="color:var(--sourdine)">— ta zone de faction.</span>`; }
  else if(surAnneauProtocole()){ t=`<b style="color:#b9a0f0">Anneau du Protocole.</b> <span style="color:var(--sourdine)">L'Ombre de ta faction peut hacker le Protocole ici. On ne peut pas entrer dans la zone.</span>`; }
  else { t=`Zone sauvage.`;
    /* Mention retirée : le minage/la chasse ne se font plus n'importe où en
       zone sauvage, seulement sur un `lieu` (filon, terrain de chasse), déjà
       signalé juste au-dessus. */ }
  document.querySelector("#region-info").innerHTML = t + ` <span style="color:var(--sourdine)">· pos. ${Math.round(etat.pos.x)}, ${Math.round(etat.pos.y)}</span>`;
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
  // Clic sur (ou tout près d') un repère ★ de quête : on va à son centre (v0.61).
  const rq = (typeof repereQueteSous==="function") ? repereQueteSous(x, y) : null;
  if(rq){ x = rq.x; y = rq.y; }
  // Protocole : impossible d'entrer dans le cercle -> on est projeté sur l'anneau (le trait)
  const z = ZONE_PROTOCOLE, dp = dist(x, y, z.x, z.y);
  if(dp < z.r){ const a = Math.atan2(y - z.y, x - z.x); x = z.x + Math.cos(a) * z.r; y = z.y + Math.sin(a) * z.r; }
  // ⚠ Le calcul est délégué à coutTrajet(), la MÊME fonction que l'aperçu au
  //    survol : dupliquer la formule ici la ferait diverger tôt ou tard, et
  //    l'aperçu se mettrait à annoncer un prix différent de celui débité.
  const c = coutTrajet(x, y);
  if(!c) return;                                   // trop court (< 6 u) ou position inconnue
  const dOpen = c.dOpen, coutE = c.coutE, coutO = c.coutO;
  /* ⚠ v0.58 — l'aperçu annonçait « insuffisant » mais rien n'arrêtait le trajet :
     agir() amenait l'O₂ à 0 et le joueur MOURAIT en route, d'un seul clic. */
  if(coutO > 0 && etat.jauges && coutO >= (etat.jauges.o2|0)){
    /* v0.94b — le message disait de recharger sans dire OÙ : l'O₂ ne remonte
       que dans le rayon de TA cité, ou par une Recharge / un Tank. */
    journal(`Pas assez d'O₂ pour ce trajet (−${coutO}, il t'en reste ${etat.jauges.o2|0}) : tu suffoquerais en route. Avance par étapes, respire une Recharge, ou entre dans une cité, la tienne ou non — c'est là que l'air se refait.`,"alerte");
    _refusO2 = true;   // v0.94b : un refus suffit à ouvrir l'appel de détresse
    if(bloqueSansO2()) journal(`Si tu ne peux plus rejoindre aucune cité, lance un appel de détresse depuis la carte (${SECOURS_SOL} ₡, ou ce qu'il te reste).`,"alerte");
    if(typeof majCarte==="function") majCarte();   // fait apparaître le bouton tout de suite
    return;
  }
  /* ⚠ v0.94b — LE POINT DE NON-RETOUR. On AVERTIT, on n'interdit pas :
     interdire reproduirait le blocage un pas plus tôt, et le joueur peut avoir
     ses raisons (une Recharge dans le sac, un gisement à visiter). */
  const _reste  = (etat.jauges ? (etat.jauges.o2|0) : 0) - coutO;
  const _retour = coutRetourO2({ x, y });
  if(_retour != null && _retour > 0 && _retour >= _reste){
    const pv = citeLaPlusProche({ x, y });
    if(!confirm(`Après ce trajet il te restera ${Math.max(0,_reste)} d'O₂, et il en faut ${_retour} pour rejoindre ${pv?nomCite(pv.f):"une cité"}, la plus proche de là-bas.\n\nTu ne pourras plus respirer sans recharge. Continuer ?`)) return;
  }
  if((coutE>0 || coutO>0) && !await agirServeur({ cout:coutE, jauges:{ o2:-coutO }, motif:"deplacement" })) return;
  // L'O₂ est une jauge serveur : elle part avec l'énergie, dans le même appel.
  etat.pos={ x:Math.round(x), y:Math.round(y) };
  // La position part au serveur : elle décide de la présence au combat.
  if(typeof sauvegarder==="function") sauvegarder();
  /* ⚠ v0.58 — et elle part TOUT DE SUITE. La sauvegarde attend 2,5 s ; or agir()
     lit la position en base pour l'O₂ (air respirable en ville). Une patrouille
     juste à la sortie d'une ville voyait encore l'ancienne position : O₂ remis à 100. */
  /* v0.61 — mais la quête et le journal ne l'ATTENDENT plus : si le réseau
     traîne, le joueur restait sans « tu es arrivé ». Seule la patrouille, qui
     en a besoin pour l'O₂, patiente (4 s au plus). */
  const posEnvoyee = (typeof sauverSurServeur==="function")
    ? Promise.race([ sauverSurServeur().catch(e=>{ if(typeof _catchLog==="function") _catchLog(e, "carte.js#pos"); }),
                     new Promise(r=>setTimeout(r, 4000)) ])
    : null;
  if(etat.pas) etat.pas.deplace=true;
  // v0.91 : les déplacements ont leur propre catégorie de journal.
  journal((dOpen<=0 ? `Déplacement dans la zone (gratuit).`
                    : `Déplacement (${Math.round(dOpen)} u à découvert). −${coutE} % énergie, −${coutO} O₂.`)
          + (surAnneauProtocole()?" Tu es sur l'anneau du Protocole.":""), "", "voyage");
  apresAction();
  if(typeof queteArrivee==="function") queteArrivee();
  if(dOpen>0 && typeof tenterPatrouille==="function"){ if(posEnvoyee) await posEnvoyee; tenterPatrouille(); }
}

/* ---------- Inscription ---------- */
function ouvrirCarte(){ document.querySelector("#modale-carte").classList.add("ouverte"); majCarte(); }
function fermerCarte(){ document.querySelector("#modale-carte").classList.remove("ouverte"); }
