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

/* Conditions d'accès */
function orbiteDebloquee(){ return etat.espace1===true && !!etat.vaisseau; }

/* Le bouton n'apparaît que si tout est réuni */
function majBoutonOrbite(){
  const b=document.querySelector("#ouvrir-orbite"); if(!b) return;
  const ok = orbiteDebloquee();
  b.hidden = !ok;
  // button.action impose display:flex, qui l'emporterait sur l'attribut hidden.
  b.style.display = ok ? "" : "none";
}

/* ⚠ v0.83 — les destinations dessinées « à la main » (rectangles, cercles)
   sont remplacées par les IMAGES de js/espace-data.js. Le décor n'est pas
   cliquable, le leurre l'est mais ne mène à rien. */
function _espaceHtml(l){
  const clic = (l.type !== "decor");
  const r = espaceRayon(l);
  const demi = l.t/2;
  let h = `<g class="orb-lieu${clic?" cliquable":""}${(_placementSel&&_placementSel.id===l.id)?" sel":""}"`
        + (clic ? ` data-lieu="${l.id}" style="cursor:pointer"` : ` style="pointer-events:none"`)
        + (_placementActif ? ` data-plac="${l.id}"` : ``) + `>`;
  if(_placementActif){
    h += `<circle cx="${l.x}" cy="${l.y}" r="${r}" fill="none" stroke="#ff8a3d" stroke-opacity=".5" stroke-dasharray="6 6"/>`;
  }
  h += `<image href="images/espace/${l.img}" x="${l.x-demi}" y="${l.y-demi*(l.t?1:1)}" width="${l.t}" height="${l.t}" preserveAspectRatio="xMidYMid meet"/>`;
  if(l.nom) h += `<text x="${l.x}" y="${l.y + demi + 26}" text-anchor="middle" class="vlabel">${l.nom}</text>`;
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
  // Décor d'abord : les lieux passent au-dessus.
  ESPACE_LIEUX.filter(l=>l.type==="decor").forEach(l=>{ html += _espaceHtml(l); });
  ESPACE_LIEUX.filter(l=>l.type!=="decor").forEach(l=>{ html += _espaceHtml(l); });
  svg.innerHTML = html;

  svg.querySelectorAll("[data-lieu]").forEach(g=>{
    g.addEventListener("click", ()=>{
      if(_placementActif) return;                 // en placement, le clic sert à glisser
      const l = espaceLieu(g.dataset.lieu); if(!l) return;
      const z=document.querySelector("#orbite-info"); if(!z) return;
      if(l.verrou){
        z.innerHTML = `<b>${l.nom}</b> — <span style="color:#ff6b6b">verrouillé</span>.<br><span class="itip-gris">${l.desc}</span>`;
        return;
      }
      z.innerHTML = `<b>${l.nom}</b>${l.usage?` — ${l.usage}`:""}.<br><span class="itip-gris">${l.desc}</span><br>
        <span class="itip-gris">Déplacement spatial à venir : le carburant n'est pas encore consommé.</span>`;
    });
  });

  if(typeof placementBrancher==="function") placementBrancher(svg);

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
