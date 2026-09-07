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

const ORBITE_FOND = "images/carte_espace_1.png";

const DESTINATIONS = [
  { id:"station",    nom:"Station MAAR-7",       x:1750, y:420,  r:110,
    forme:"station",   usage:"Quêtes et rencontres",
    desc:"Une station de rotation encore alimentée. Quelqu'un y répond." },
  { id:"asteroides", nom:"Champ d'astéroïdes",   x:620,  y:1080, r:130,
    forme:"asteroides", usage:"Minage",
    desc:"Roches lentes et riches. Le minerai y vaut ce qu'il coûte à remonter." },
  { id:"anneau",     nom:"Orbite de l'anneau",   x:1180, y:760,  r:120,
    forme:"anneau",    usage:"Observation",
    desc:"L'anneau du Protocole, vu d'en haut. Il ne réagit pas. Pas encore." }
];

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

function _destHtml(d){
  const c = { station:"#8bd450", asteroides:"#ff8a3d", anneau:"#b06cff" }[d.forme] || "#9fb3c8";
  let forme = "";
  if(d.forme==="station"){
    forme = `<rect x="${d.x-34}" y="${d.y-10}" width="68" height="20" rx="4" fill="${c}33" stroke="${c}" stroke-width="2"/>
             <circle cx="${d.x}" cy="${d.y}" r="14" fill="${c}55" stroke="${c}" stroke-width="2"/>`;
  } else if(d.forme==="asteroides"){
    forme = `<circle cx="${d.x-26}" cy="${d.y+12}" r="13" fill="${c}44" stroke="${c}" stroke-width="2"/>
             <circle cx="${d.x+8}"  cy="${d.y-14}" r="19" fill="${c}44" stroke="${c}" stroke-width="2"/>
             <circle cx="${d.x+30}" cy="${d.y+16}" r="10" fill="${c}44" stroke="${c}" stroke-width="2"/>`;
  } else {
    forme = `<ellipse cx="${d.x}" cy="${d.y}" rx="40" ry="14" fill="none" stroke="${c}" stroke-width="3"/>
             <ellipse cx="${d.x}" cy="${d.y}" rx="22" ry="8"  fill="none" stroke="${c}" stroke-width="2"/>`;
  }
  return `<g class="orb-dest" data-dest="${d.id}" style="cursor:pointer">
      <circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${c}11" stroke="${c}66" stroke-width="2" stroke-dasharray="6 6"/>
      ${forme}
      <text x="${d.x}" y="${d.y + d.r + 26}" text-anchor="middle" class="vlabel" style="fill:${c}">${d.nom}</text>
    </g>`;
}

function majOrbite(){
  const svg=document.querySelector("#carte-orbite"); if(!svg) return;
  svg.setAttribute("viewBox",`0 0 ${MONDE.w} ${MONDE.h}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  let html = `<image href="${ORBITE_FOND}" x="0" y="0" width="${MONDE.w}" height="${MONDE.h}" preserveAspectRatio="none"/>`;
  DESTINATIONS.forEach(d=>{ html += _destHtml(d); });
  svg.innerHTML = html;

  svg.querySelectorAll(".orb-dest").forEach(g=>{
    g.addEventListener("click", ()=>{
      const d = DESTINATIONS.find(x=>x.id===g.dataset.dest); if(!d) return;
      const z=document.querySelector("#orbite-info");
      if(z) z.innerHTML = `<b>${d.nom}</b> — ${d.usage}.<br><span class="itip-gris">${d.desc}</span><br>
        <span class="itip-gris">Destination pas encore accessible : contenu à venir.</span>`;
    });
  });

  const nav=document.querySelector("#orbite-vaisseau");
  if(nav){ const v=(typeof vaisseauActif==="function")?vaisseauActif():null;
    nav.textContent = v ? `À bord : ${v.nom}` : "Aucun vaisseau"; }
}

function ouvrirOrbite(){
  if(!orbiteDebloquee()){
    journal(etat.espace1 ? "Il te faut un vaisseau pour rejoindre l'orbite." : "Tu ne connais pas encore de route vers l'orbite.","alerte");
    return;
  }
  document.querySelector("#modale-orbite").classList.add("ouverte");
  majOrbite();
}
function fermerOrbite(){ document.querySelector("#modale-orbite").classList.remove("ouverte"); }
