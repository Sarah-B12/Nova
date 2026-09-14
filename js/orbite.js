/* ===========================================================
   ORBITE — 2ᵉ carte : « Orbite basse ».
   Débloquée par le drapeau etat.espace1 (récompense de Q5) ET la possession
   d'un vaisseau (etat.vaisseau). Tant que ce n'est pas le cas, le bouton
   est ABSENT (pas grisé) : c'est une surprise.

   Même repère que Silène (MONDE.w × MONDE.h) : l'image de fond est étirée,
   les coordonnées restent en unités monde, comme pour carte.jpg.

   ⚠ Les destinations ci-dessous sont des PLACEHOLDERS dessinés en SVG.
   Quand les images d'objets stellaires seront prêtes, remplacer le champ
   `forme` par `img:"images/orbite/station.png"` et adapter _destHtml().
   =========================================================== */

/* Le fond et les dimensions vivent dans js/espace-data.js (ESPACE_FOND, ESPACE_MONDE). */

/* DESTINATIONS supprimé en v0.83 : remplacé par ESPACE_LIEUX (js/espace-data.js). */

/* ===========================================================
   VOYAGE ENTRE LES DEUX SECTEURS (v0.86)

   On ne passe pas d'une carte à l'autre en cliquant : il faut EMBARQUER.
   `etat.secteur` vaut "silene" (par défaut) ou "ecart". Le départ pose le
   joueur sur la Base de l'Écart, le retour le repose dans SA cité.

   ⚠ Le serveur, lui, ne connaît que pos_x / pos_y : pour lui, un joueur parti
   en orbite est encore là où il a décollé (donc en ville : air respirable,
   présent en expédition). À traiter côté SQL avant l'ouverture — voir
   PASSATION. En attendant, le retour repose bien le joueur dans sa cité, donc
   la position reste cohérente au sol. */
const ECART_NOM = "L'Écart";

/* Coût du saut Silène ⇄ L'Écart. C'est une SORTIE D'ATMOSPHÈRE, pas un vol
   d'orbite : distance fixe, donc coût fixe en unités de vol. Le carburant
   dépend du vaisseau (conso × unités), l'énergie du pilote.
      Navette légère  : 18 L sur 40  → 2 allers-retours par plein
      Vaisseau maître : 54 L sur 100 → 1 aller-retour (+ un peu)
      Cargo           : 108 L sur 200 → 1 aller-retour (il est lourd) */
const SAUT_UNITES  = 18;
const SAUT_ENERGIE = 12;

function coutSaut(){
  const v = (typeof vaisseauActif==="function") ? vaisseauActif() : null;
  if(!v) return null;
  return { litres: SAUT_UNITES * (v.conso||1),
           energie: SAUT_ENERGIE + (v.energie||0) * 2,
           carb: v.carb, reservoir: v.reservoir, nom: v.nom };
}
function _texteSaut(c){
  return `${c.litres} L de ${(typeof item==="function" && item(c.carb)) ? item(c.carb).nom : "carburant"} et ${c.energie} % d'énergie`;
}

function enEcart(){ return etat.secteur === "ecart"; }

/* Sur la Base de l'Écart : c'est elle qui ouvre les services (auberge,
   comptoir, poste, gouvernement, quêtes). Ailleurs dans le secteur, on est
   « en vol » et les hubs se ferment, comme en pleine nature sur Silène. */
function surBase(){
  if(!enEcart()) return false;
  const b = espaceLieu("base"); if(!b) return false;
  const p = etat.posEspace; if(!p) return false;
  return Math.hypot(p.x - b.x, p.y - b.y) <= espaceRayon(b);
}

function _villeDeMaFaction(){
  const v = VILLES[etat.faction];
  return v ? { x:v.x, y:v.y } : (typeof posDefaut==="function" ? posDefaut() : { x:0, y:0 });
}

/* Vérifie PUIS débite. Comme pour les trajets au sol, on refuse avant de
   toucher à quoi que ce soit : jamais de panne en cours de route. */
async function _payerSaut(quoi){
  const c = coutSaut();
  if(!c){ journal("Aucun vaisseau équipé.","alerte"); return false; }
  const cuve = etat.carburant || 0;
  if(cuve < c.litres){
    journal(`${quoi} impossible : il faut ${c.litres} L, tu en as ${Math.round(cuve)}. Fais le plein (${item(c.carb)?item(c.carb).nom:"carburant"}).`,"alerte");
    return false;
  }
  // L'énergie est vérifiée et débitée par le serveur (agir), comme au sol.
  const r = await agirServeur({ cout:c.energie, motif:"saut_orbital" });
  if(!r) return false;
  etat.carburant = Math.max(0, cuve - c.litres);
  journal(`${quoi} : −${c.litres} L (reste ${Math.round(etat.carburant)}/${c.reservoir} L), −${c.energie} % d'énergie.`);
  return true;
}

async function partirVersEcart(){
  if(!orbiteDebloquee()){
    journal(etat.espace1 ? "Il te faut un vaisseau ÉQUIPÉ pour quitter Silène." : "Tu ne connais pas encore de route vers l'orbite.","alerte");
    return;
  }
  if(enEcart()){ ouvrirOrbite(); return; }
  if(typeof villeActuelle==="function" && !villeActuelle()){
    journal("On ne décolle pas depuis la nature : rejoins une ville d'abord.","alerte"); return;
  }
  if(!await _payerSaut("Décollage")) return;
  const base = espaceLieu("base");
  etat.secteur   = "ecart";
  etat.posEspace = base ? { x:base.x, y:base.y } : { x:ESPACE_MONDE.w/2, y:ESPACE_MONDE.h/2 };
  journal(`Décollage. Tu te poses sur la ${base?base.nom:"base"} — secteur ${ECART_NOM}.`,"gain");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  if(typeof afficher==="function") afficher();
  ouvrirOrbite();
}

async function revenirVersSilene(){
  if(!enEcart()) return;
  if(!await _payerSaut("Rentrée")) return;
  const p = _villeDeMaFaction();
  etat.secteur = "silene";
  etat.pos = { x:p.x, y:p.y };                 // retour DANS sa cité, jamais en pleine nature
  journal("Retour sur Silène. Tu te poses chez toi.","gain");
  fermerOrbite();
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  if(typeof afficher==="function") afficher();
}

/* Conditions d'accès */
function orbiteDebloquee(){ return etat.espace1===true && !!etat.vaisseau; }

/* Le bouton n'apparaît que si tout est réuni */
function majBoutonOrbite(){
  const b=document.querySelector("#ouvrir-orbite"); if(!b) return;
  const ok = orbiteDebloquee();
  b.hidden = !ok;
  // button.action impose display:flex, qui l'emporterait sur l'attribut hidden.
  b.style.display = ok ? "" : "none";
  if(ok){
    b.querySelector("span").textContent = enEcart() ? `Carte de ${ECART_NOM}` : `Partir pour ${ECART_NOM}`;
    const cs=coutSaut();
    const c=b.querySelector(".cout");
    if(c) c.textContent = enEcart() ? "tu y es"
      : (cs ? `${cs.litres} L carburant · ${cs.energie} % énergie` : "en vaisseau");
  }
  // La carte de Silène n'a pas de sens depuis l'orbite.
  const bc=document.querySelector("#ouvrir-carte");
  if(bc){ const loin = enEcart();
    bc.disabled = loin;
    bc.style.opacity = loin ? ".45" : "";
    const c2=bc.querySelector(".cout"); if(c2) c2.textContent = loin ? "tu es en orbite" : "se déplacer"; }
}

/* ⚠ v0.83 — les destinations dessinées « à la main » (rectangles, cercles)
   sont remplacées par les IMAGES de js/espace-data.js. Le décor n'est pas
   cliquable, le leurre l'est mais ne mène à rien. */
function _espaceHtml(l){
  /* ⚠ v0.85 — en PLACEMENT, tout doit s'attraper, décor compris : `decor` porte
     pointer-events:none pour le jeu, ce qui le rendait aussi indéplaçable dans
     l'outil (astéroïdes, satellites, petites planètes). */
  /* ⚠ v0.91 — SPOIL DE CURSEUR. Seuls les lieux visitables portaient
     `cursor:pointer` : il suffisait de balayer la carte à la souris pour savoir
     lesquels mènent quelque part, sans rien avoir découvert. Tout répond
     désormais au survol de la même façon ; c'est le CLIC qui distingue, et
     cliquer est un acte, pas un balayage. */
  const clic = true;
  const r = espaceRayon(l);
  const demi = l.t/2;
  let h = `<g class="orb-lieu${clic?" cliquable":""}${(_placementSel&&_placementSel.id===l.id)?" sel":""}"`
        + (clic ? ` data-lieu="${l.id}" style="cursor:pointer"` : ` style="pointer-events:none"`)
        + (_placementActif ? ` data-plac="${l.id}"` : ``) + `>`;
  if(_placementActif){
    h += `<circle cx="${l.x}" cy="${l.y}" r="${r}" fill="none" stroke="#ff8a3d" stroke-opacity=".5" stroke-dasharray="6 6"/>`;
  }
  if(l.halo){
    /* Deux cercles : un voile large et un anneau net. Le voile suffit à faire
       ressortir une image sombre sans la masquer. */
    const rh = l.t*0.52;
    h += `<circle cx="${l.x}" cy="${l.y}" r="${rh*1.25}" fill="${l.halo}" opacity=".10"/>`
       + `<circle cx="${l.x}" cy="${l.y}" r="${rh}" fill="none" stroke="${l.halo}" stroke-width="3" opacity=".75"/>`
       + `<circle cx="${l.x}" cy="${l.y}" r="${rh}" fill="none" stroke="${l.halo}" stroke-width="10" opacity=".18"/>`;
  }
  h += `<image href="images/espace/${l.img}" x="${l.x-demi}" y="${l.y-demi}" width="${l.t}" height="${l.t}" preserveAspectRatio="xMidYMid meet"/>`;
  /* ⚠ v0.84 — ZONE DE SAISIE. Une image de 109 u est minuscule à l'écran : on
     n'arrivait ni à la sélectionner ni à la déplacer. Ce carré invisible, d'au
     moins 160 u, se superpose à l'objet et reçoit les clics. En jeu, il sert
     aussi de cible pour les petits lieux, au doigt comme à la souris. */
  const zone = Math.max(l.t, 160), zd = zone/2;
  /* Le liseré bleu ne sert QU'À L'OUTIL : en jeu, la zone reste invisible. */
  h += `<rect x="${l.x-zd}" y="${l.y-zd}" width="${zone}" height="${zone}" fill="transparent"${_placementActif?' stroke="#5aa8e6" stroke-opacity=".25"':''}/>`;
  /* ⚠ v0.85 — AUCUNE étiquette sur la carte, même en placement : les images se
     suffisent, et les textes se chevauchaient. Le nom de l'objet sélectionné
     s'affiche dans la barre du mode placement ; en jeu, il apparaît au clic
     dans le bandeau sous la carte. */
  return h + `</g>`;
}

function majOrbite(){
  const svg=document.querySelector("#carte-orbite"); if(!svg) return;
  svg.setAttribute("viewBox",`0 0 ${ESPACE_MONDE.w} ${ESPACE_MONDE.h}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");

  const barre=document.querySelector("#orbite-barre-plac");
  if(barre) barre.innerHTML = (typeof placementBarreHtml==="function") ? placementBarreHtml() : "";

  let html = `<image href="${ESPACE_FOND}" x="0" y="0" width="${ESPACE_MONDE.w}" height="${ESPACE_MONDE.h}" preserveAspectRatio="none"/>`;
  if(typeof placementGrilleHtml==="function") html += placementGrilleHtml();
  if(_placementActif){
    /* ⚠ v0.85 — en placement, TOUT est attrapable : on dessine du plus grand au
       plus petit, pour qu'une grosse zone de saisie ne recouvre jamais un petit
       objet (une planète de 406 u cachait l'astéroïde voisin). */
    ESPACE_LIEUX.slice().sort((a,b)=>b.t-a.t).forEach(l=>{ html += _espaceHtml(l); });
  } else {
    // En jeu : décor d'abord, les lieux passent au-dessus.
    ESPACE_LIEUX.filter(l=>l.type==="decor").forEach(l=>{ html += _espaceHtml(l); });
    ESPACE_LIEUX.filter(l=>l.type!=="decor").forEach(l=>{ html += _espaceHtml(l); });
  }
  /* v0.88 — marqueur du joueur, comme sur Silène (carte.js) : sans lui, on ne
     sait pas où l'on est dans le secteur. Dessiné EN DERNIER, donc au-dessus. */
  if(etat.posEspace && !_placementActif){
    const col = (FACTIONS.find(f=>f.id===etat.faction)||{}).couleur || "#ff9a44";   // même source que carte.js
    const px = etat.posEspace.x, py = etat.posEspace.y;
    html += `<circle cx="${px}" cy="${py}" r="34" fill="none" stroke="${col}" stroke-opacity=".35" stroke-width="2"/>`
          + `<circle cx="${px}" cy="${py}" r="17" fill="#0a1730" stroke="${col}" stroke-width="4"/>`
          + `<circle cx="${px}" cy="${py}" r="7" fill="${col}"/>`;
  }
  svg.innerHTML = html;

  svg.querySelectorAll("[data-lieu]").forEach(g=>{
    g.addEventListener("click", ()=>{
      if(_placementActif) return;                 // en placement, le clic sert à glisser
      const l = espaceLieu(g.dataset.lieu); if(!l) return;
      const z=document.querySelector("#orbite-info"); if(!z) return;
      // v0.91 : le décor répond, mais ne mène nulle part. Il n'est plus muet.
      if(l.type === "decor"){
        z.innerHTML = `<b>${l.nom||"Objet stellaire"}</b><br><span class="itip-gris">${l.desc||"Rien qui mérite le carburant d'un détour."}</span>`;
        return;
      }
      if(l.verrou){
        z.innerHTML = `<b>${l.nom}</b> — <span style="color:#ff6b6b">verrouillé</span>.<br><span class="itip-gris">${l.desc}</span>`;
        return;
      }
      z.innerHTML = `<b>${l.nom}</b>${l.usage?` — ${l.usage}`:""}.<br><span class="itip-gris">${l.desc}</span><br>
        <span class="itip-gris">Déplacement spatial à venir : le carburant n'est pas encore consommé.</span>`;
    });
  });

  if(typeof placementBrancher==="function") placementBrancher(svg);

  const br=document.querySelector("#orbite-retour");
  if(br){ br.hidden = !enEcart(); br.style.display = enEcart() ? "" : "none";
    const cs=coutSaut();
    if(enEcart() && cs){ br.textContent = `Redescendre sur Silène — ${cs.litres} L carburant, ${cs.energie} % énergie`;
      br.title = `Il te reste ${Math.round(etat.carburant||0)}/${cs.reservoir} L.`; } }

  const nav=document.querySelector("#orbite-vaisseau");
  if(nav){ const v=(typeof vaisseauActif==="function")?vaisseauActif():null;
    nav.textContent = v ? `À bord : ${v.nom}` : "Aucun vaisseau"; }
}

/* p_forcer : réservé au mode placement (outil de dev), qui doit pouvoir
   ouvrir la carte sans posséder ni vaisseau ni route. */
function ouvrirOrbite(p_forcer){
  if(!p_forcer && !orbiteDebloquee()){
    journal(etat.espace1 ? "Il te faut un vaisseau pour rejoindre l'orbite." : "Tu ne connais pas encore de route vers l'orbite.","alerte");
    return;
  }
  document.querySelector("#modale-orbite").classList.add("ouverte");
  majOrbite();
}
function fermerOrbite(){ document.querySelector("#modale-orbite").classList.remove("ouverte"); }
