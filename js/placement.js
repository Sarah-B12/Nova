/* ===========================================================
   MODE PLACEMENT (v0.83) — outil de développement.

   Sert à poser les objets stellaires à l'œil, sans aller-retour : on fait
   glisser, on clique « Copier », on colle le bloc obtenu dans
   js/espace-data.js à la place de ESPACE_LIEUX. Seuls x, y et t changent ;
   le reste (nom, texte, type) est recopié tel quel.

   Réservé au staff : le bouton n'apparaît que si estDev() répond vrai. Rien
   n'est enregistré en base — c'est un outil d'édition de FICHIER, pas une
   fonctionnalité de jeu.

   Raccourcis pendant le placement :
     glisser        déplacer l'objet
     touche G       afficher ou masquer la grille (200 u)
     touche Échap   quitter le mode
   =========================================================== */

let _placementActif = false;
let _placementSel = null;
let _placementGrille = false;

function placementDispo(){
  return (typeof estDev === "function") ? !!estDev() : false;
}

function _placStyle(){
  if(document.querySelector("#plac-style")) return;
  const s=document.createElement("style"); s.id="plac-style";
  s.textContent=`
    .plac-barre{ display:flex; gap:8px; align-items:center; flex-wrap:wrap;
      background:rgba(16,41,78,.85); border:1px solid var(--orange); border-radius:8px;
      padding:6px 10px; margin:0 0 8px; font-size:13px; }
    .plac-barre b{ color:var(--orange-hi); }
    .plac-sel{ font-family:"Space Mono",monospace; color:var(--bleu); }
    .plac-obj{ cursor:grab; }
    .plac-obj.sel{ outline:2px dashed var(--orange); outline-offset:2px; }
    #plac-sortie{ width:100%; min-height:140px; font-family:"Space Mono",monospace;
      font-size:11px; background:#0b1220; color:var(--texte); border:1px solid var(--line);
      border-radius:6px; padding:8px; margin-top:8px; }
  `;
  document.head.appendChild(s);
}

/* Coordonnées monde d'un événement souris/doigt sur le SVG. */
function _placCoord(svg, e){
  const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
  const m=svg.getScreenCTM(); if(!m) return null;
  const p=pt.matrixTransform(m.inverse());
  return { x:Math.round(p.x), y:Math.round(p.y) };
}

function placementBasculer(){
  if(!placementDispo()){ journal("Réservé au staff.","alerte"); return; }
  _placementActif = !_placementActif;
  _placementSel = null;
  majOrbite();
}

/* Barre d'outils, insérée au-dessus de la carte. */
function placementBarreHtml(){
  if(!_placementActif) return "";
  return `<div class="plac-barre">
      <b>MODE PLACEMENT</b>
      <span class="plac-sel" id="plac-nom">— aucun objet sélectionné —</span>
      <span class="itip-gris">glisser = déplacer · G = grille · Échap = quitter</span>
      <button class="mini" id="plac-copier">Copier le bloc</button>
      <button class="mini" id="plac-quitter">Quitter</button>
    </div><textarea id="plac-sortie" readonly placeholder="Clique « Copier le bloc » : le contenu à coller dans js/espace-data.js apparaîtra ici."></textarea>`;
}

/* Régénère ESPACE_LIEUX au format du fichier, positions à jour. */
function placementExport(){
  const q = s => (s===null || s===undefined) ? "null" : JSON.stringify(s);
  const lignes = ESPACE_LIEUX.map(l=>{
    /* ⚠ v0.91 — TOUT champ absent d'ici est PERDU au premier « Copier le bloc ».
       `officiel` (noms AREPO) et `halo` manquaient : un seul export aurait
       effacé dix-neuf noms et le liseré de la base, sans le moindre message.
       Règle : tout nouveau champ d'ESPACE_LIEUX s'ajoute AUSSI ici. */
    let t = `  { id:${q(l.id)}, nom:${q(l.nom)}, img:${q(l.img)}, x:${l.x}, y:${l.y}, t:${l.t}, type:${q(l.type)}`;
    if(l.libelle)  t += `, libelle:${q(l.libelle)}`;
    if(l.officiel !== undefined) t += `, officiel:${q(l.officiel)}`;
    if(l.halo)   t += `, halo:${q(l.halo)}`;
    if(l.r)      t += `, r:${l.r}`;
    if(l.verrou) t += `, verrou:${q(l.verrou)}`;
    t += `,\n    usage:${q(l.usage||"")},${l.ici?` ici:${q(l.ici)},`:""} desc:${q(l.desc||"")} }`;   // v1.01 : ici (décor visitable)
    return t;
  });
  return "const ESPACE_LIEUX = [\n" + lignes.join(",\n") + "\n];";
}

/* Branche le glisser-déposer sur le SVG de l'orbite. Appelé par majOrbite(). */
function placementBrancher(svg){
  if(!_placementActif || !svg) return;
  _placStyle();

  const maj = ()=>{
    const z=document.querySelector("#plac-nom");
    if(z) z.textContent = _placementSel
      ? `${_placementSel.id} — x:${_placementSel.x} y:${_placementSel.y} t:${_placementSel.t}`
      : "— aucun objet sélectionné —";
  };
  maj();

  let glisse=null, dx=0, dy=0;
  svg.querySelectorAll("[data-plac]").forEach(g=>{
    g.classList.add("plac-obj");
    g.addEventListener("pointerdown", e=>{
      const l=espaceLieu(g.dataset.plac); if(!l) return;
      const p=_placCoord(svg,e); if(!p) return;
      _placementSel=l; glisse=l; dx=p.x-l.x; dy=p.y-l.y;
      svg.setPointerCapture(e.pointerId);
      e.preventDefault(); maj(); majOrbite();
    });
  });

  svg.addEventListener("pointermove", e=>{
    if(!glisse) return;
    const p=_placCoord(svg,e); if(!p) return;
    glisse.x=Math.max(0, Math.min(ESPACE_MONDE.w, p.x-dx));
    glisse.y=Math.max(0, Math.min(ESPACE_MONDE.h, p.y-dy));
    majOrbite(); maj();
  });
  svg.addEventListener("pointerup", ()=>{ glisse=null; });

  /* ⚠ v0.84 — MOLETTE RETIRÉE. Les images sont déjà aux dimensions voulues :
     `t` vaut la taille native × 1,5625 (le fond fait 1536 px pour 2400 unités
     monde). Redimensionner ici n'avait aucun intérêt et bloquait le
     défilement de la page. Pour changer une taille, éditer `t` à la main. */

  const bc=document.querySelector("#plac-copier");
  if(bc) bc.addEventListener("click", ()=>{
    const txt=placementExport();
    const z=document.querySelector("#plac-sortie"); if(z){ z.value=txt; z.select(); }
    try{ navigator.clipboard.writeText(txt); journal("Bloc copié — colle-le dans js/espace-data.js.","gain"); }
    catch(e){ journal("Sélectionne le texte ci-dessous et copie-le.","alerte"); }
  });
  const bq=document.querySelector("#plac-quitter");
  if(bq) bq.addEventListener("click", placementBasculer);
}

document.addEventListener("keydown", e=>{
  if(!_placementActif) return;
  if(e.key==="Escape"){ placementBasculer(); }
  if(e.key==="g" || e.key==="G"){ _placementGrille=!_placementGrille; majOrbite(); }
});

/* Grille de repérage, tous les 200 u. */
function placementGrilleHtml(){
  if(!_placementActif || !_placementGrille) return "";
  let h="";
  for(let x=0; x<=ESPACE_MONDE.w; x+=200)
    h+=`<line x1="${x}" y1="0" x2="${x}" y2="${ESPACE_MONDE.h}" stroke="#5aa8e6" stroke-opacity=".25" stroke-width="1"/>`;
  for(let y=0; y<=ESPACE_MONDE.h; y+=200)
    h+=`<line x1="0" y1="${y}" x2="${ESPACE_MONDE.w}" y2="${y}" stroke="#5aa8e6" stroke-opacity=".25" stroke-width="1"/>`;
  return h;
}
