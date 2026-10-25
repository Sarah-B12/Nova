/* ===========================================================
   PLACEMENT — CARTE 2, AU-DELÀ DE LA GORGE (v1.95) — outil de développement.

   Le pendant de js/placement.js (Triptolème, v0.83), pour une carte qui
   n'existe pas encore dans le jeu : il s'ouvre dans sa propre fenêtre, par
   dessus tout, et ne touche à rien d'autre (ni l'orbite, ni la position du
   joueur, ni le serveur). On glisse, on clique « Copier le bloc », on colle
   le tableau obtenu dans js/espace2-data.js à la place de ESPACE2_LIEUX.

   Réservé au staff : estDev(). Le bouton est dans la console dev seulement
   (Mon perso → Outils). Rien n'est enregistré en base.

   Différence avec l'outil de Triptolème : la TAILLE se règle aussi (boutons
   ou touches + / −), parce que ces images ne sont pas encore calibrées sur le
   fond. Pas de molette : elle ferait défiler la page.

   Raccourcis (fenêtre ouverte) :
     glisser            déplacer l'objet (et le sélectionner)
     flèches            déplacer de 1 u (Maj : 10 u)
     + / −              taille ± 5 %
     N                  taille native (largeur de l'image × 1,5625)
     G                  grille (200 u)
     Échap              fermer
   =========================================================== */

let _p2Ouvert = false;
let _p2Sel = null;
let _p2Grille = false;
const _p2Natif = {};   // id → largeur native en unités monde (lue sur l'image)

function _p2Style(){
  if(document.querySelector("#p2-style")) return;
  const s = document.createElement("style"); s.id = "p2-style";
  s.textContent = `
    #p2-fenetre{ position:fixed; inset:0; z-index:9000; background:rgba(4,8,16,.96);
      display:flex; flex-direction:column; padding:8px; gap:6px; box-sizing:border-box; }
    #p2-fenetre .p2-barre{ display:flex; gap:8px; align-items:center; flex-wrap:wrap;
      background:rgba(16,41,78,.85); border:1px solid var(--orange,#ff8a3d); border-radius:8px;
      padding:6px 10px; font-size:13px; color:var(--texte,#e6edf7); }
    #p2-fenetre .p2-barre b{ color:var(--orange-hi,#ffb070); }
    #p2-sel{ font-family:"Space Mono",monospace; color:var(--bleu,#7cc4ff); min-width:24em; }
    #p2-carte{ flex:1; min-height:0; width:100%; touch-action:none; user-select:none; }
    #p2-carte .p2-obj{ cursor:grab; }
    #p2-carte .p2-obj.sel rect{ stroke:#ff8a3d; stroke-width:4; stroke-dasharray:14 8; stroke-opacity:1; }
    #p2-sortie{ width:100%; height:120px; font-family:"Space Mono",monospace; font-size:11px;
      background:#0b1220; color:var(--texte,#e6edf7); border:1px solid var(--line,#2a3a55);
      border-radius:6px; padding:6px; box-sizing:border-box; }
  `;
  document.head.appendChild(s);
}

function placement2Ouvrir(){
  if(typeof estDev !== "function" || !estDev()){ journal("Réservé au staff.","alerte"); return; }
  if(typeof ESPACE2_LIEUX === "undefined"){ journal("Carte 2 : js/espace2-data.js n'est pas chargé.","alerte"); return; }
  _p2Style();
  let f = document.querySelector("#p2-fenetre");
  if(!f){ f = document.createElement("div"); f.id = "p2-fenetre"; document.body.appendChild(f); }
  _p2Ouvert = true; _p2Sel = null;
  f.hidden = false;
  f.innerHTML = `<div class="p2-barre">
      <b>PLACEMENT — CARTE 2</b>
      <span id="p2-sel">— aucun objet sélectionné —</span>
      <button class="mini" id="p2-moins" title="Taille − 5 % (touche −)">−</button>
      <button class="mini" id="p2-plus" title="Taille + 5 % (touche +)">+</button>
      <button class="mini" id="p2-natif" title="Taille native de l'image (touche N)">Natif</button>
      <button class="mini" id="p2-grille" title="Grille 200 u (touche G)">Grille</button>
      <button class="mini" id="p2-copier">Copier le bloc</button>
      <button class="mini" id="p2-quitter">Fermer</button>
      <span class="itip-gris">glisser · flèches (Maj ×10) · + / − · N · G · Échap</span>
    </div>
    <svg id="p2-carte" viewBox="0 0 ${ESPACE2_MONDE.w} ${ESPACE2_MONDE.h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"></svg>
    <textarea id="p2-sortie" readonly placeholder="Clique « Copier le bloc » : le tableau à coller dans js/espace2-data.js apparaîtra ici."></textarea>`;
  // Tailles natives, lues une fois sur les images elles-mêmes.
  for(const l of ESPACE2_LIEUX){
    if(_p2Natif[l.id]) continue;
    const im = new Image();
    im.onload = () => { _p2Natif[l.id] = Math.round(im.naturalWidth * ESPACE2_MONDE.w / 1536); _p2Infos(); };
    im.src = ESPACE2_IMG + l.img;
  }
  _p2Dessiner();
  _p2Brancher();
}

function placement2Fermer(){
  _p2Ouvert = false; _p2Sel = null;
  const f = document.querySelector("#p2-fenetre"); if(f){ f.hidden = true; f.innerHTML = ""; }
}

function _p2Dessiner(){
  const svg = document.querySelector("#p2-carte"); if(!svg) return;
  const W = ESPACE2_MONDE.w, H = ESPACE2_MONDE.h;
  let h = `<image href="${ESPACE2_FOND}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
  if(_p2Grille){
    for(let x = 0; x <= W; x += 200) h += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#5aa8e6" stroke-opacity=".3" stroke-width="2"/><text x="${x + 6}" y="28" fill="#5aa8e6" fill-opacity=".7" font-size="22">${x}</text>`;
    for(let y = 0; y <= H; y += 200) h += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#5aa8e6" stroke-opacity=".3" stroke-width="2"/><text x="6" y="${y - 6}" fill="#5aa8e6" fill-opacity=".7" font-size="22">${y}</text>`;
  }
  for(const l of ESPACE2_LIEUX){
    const d = l.t / 2;
    // Boîte carrée de côté t : l'image y tient en largeur ou en hauteur, centrée sur (x, y).
    h += `<g class="p2-obj${_p2Sel === l ? " sel" : ""}" data-p2="${l.id}">
      <image href="${ESPACE2_IMG}${l.img}" x="${l.x - d}" y="${l.y - d}" width="${l.t}" height="${l.t}" preserveAspectRatio="xMidYMid meet"/>
      <rect x="${l.x - d}" y="${l.y - d}" width="${l.t}" height="${l.t}" fill="transparent" stroke="#5aa8e6" stroke-opacity=".35" stroke-width="2"/>
      <text x="${l.x}" y="${l.y + d + 26}" text-anchor="middle" fill="#cfe3ff" font-size="22" font-family="Space Mono, monospace">${l.id.replace(/^e2_/, "")}</text>
    </g>`;
  }
  svg.innerHTML = h;
  _p2Infos();
}

function _p2Infos(){
  const z = document.querySelector("#p2-sel"); if(!z) return;
  const l = _p2Sel;
  z.textContent = l
    ? `${l.id} — x:${l.x} y:${l.y} t:${l.t}${_p2Natif[l.id] ? ` (natif ${_p2Natif[l.id]})` : ""}`
    : "— aucun objet sélectionné —";
}

function _p2Coord(svg, e){
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM(); if(!m) return null;
  const p = pt.matrixTransform(m.inverse());
  return { x:Math.round(p.x), y:Math.round(p.y) };
}

function _p2Borner(l){
  l.x = Math.max(0, Math.min(ESPACE2_MONDE.w, Math.round(l.x)));
  l.y = Math.max(0, Math.min(ESPACE2_MONDE.h, Math.round(l.y)));
  l.t = Math.max(20, Math.min(1600, Math.round(l.t)));
}

function _p2Taille(facteur){
  if(!_p2Sel) return;
  _p2Sel.t = _p2Sel.t * facteur; _p2Borner(_p2Sel); _p2Dessiner();
}
function _p2TailleNative(){
  if(!_p2Sel || !_p2Natif[_p2Sel.id]) return;
  _p2Sel.t = _p2Natif[_p2Sel.id]; _p2Borner(_p2Sel); _p2Dessiner();
}

/* Régénère ESPACE2_LIEUX en recopiant TOUS les champs (id, img, x, y, t
   d'abord, puis le reste dans l'ordre où il apparaît) : un champ ajouté plus
   tard au fichier (nom, type, textes…) ne se perd jamais à l'export — la
   leçon de la v0.91 sur l'outil de Triptolème. */
function placement2Export(){
  const q = v => (v === null || v === undefined) ? "null" : JSON.stringify(v);
  const tete = ["id", "img", "x", "y", "t"];
  const lignes = ESPACE2_LIEUX.map(l => {
    const champs = tete.filter(k => k in l).concat(Object.keys(l).filter(k => !tete.includes(k)));
    return "  { " + champs.map(k => `${k}:${q(l[k])}`).join(", ") + " }";
  });
  return "const ESPACE2_LIEUX = [\n" + lignes.join(",\n") + "\n];";
}

function _p2Brancher(){
  const svg = document.querySelector("#p2-carte"); if(!svg) return;
  let glisse = null, dx = 0, dy = 0;
  svg.addEventListener("pointerdown", e => {
    const g = e.target.closest && e.target.closest("[data-p2]");
    if(!g){ _p2Sel = null; _p2Dessiner(); return; }
    const l = ESPACE2_LIEUX.find(o => o.id === g.dataset.p2); if(!l) return;
    const p = _p2Coord(svg, e); if(!p) return;
    _p2Sel = l; glisse = l; dx = p.x - l.x; dy = p.y - l.y;
    try{ svg.setPointerCapture(e.pointerId); }catch(_){}
    e.preventDefault(); _p2Dessiner();
  });
  svg.addEventListener("pointermove", e => {
    if(!glisse) return;
    const p = _p2Coord(svg, e); if(!p) return;
    glisse.x = p.x - dx; glisse.y = p.y - dy; _p2Borner(glisse);
    _p2Dessiner();
  });
  const lacher = () => { glisse = null; };
  svg.addEventListener("pointerup", lacher);
  svg.addEventListener("pointercancel", lacher);

  const on = (sel, fn) => { const b = document.querySelector(sel); if(b) b.addEventListener("click", fn); };
  on("#p2-moins", () => _p2Taille(0.95));
  on("#p2-plus", () => _p2Taille(1.05));
  on("#p2-natif", _p2TailleNative);
  on("#p2-grille", () => { _p2Grille = !_p2Grille; _p2Dessiner(); });
  on("#p2-quitter", placement2Fermer);
  on("#p2-copier", () => {
    const txt = placement2Export();
    const z = document.querySelector("#p2-sortie"); if(z){ z.value = txt; z.select(); }
    try{ navigator.clipboard.writeText(txt); journal("Bloc copié — colle-le dans js/espace2-data.js.","gain"); }
    catch(e){ journal("Sélectionne le texte en bas de la fenêtre et copie-le.","alerte"); }
  });
}

document.addEventListener("keydown", e => {
  if(!_p2Ouvert) return;
  if(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pas = e.shiftKey ? 10 : 1;
  let fait = true;
  if(e.key === "Escape") placement2Fermer();
  else if(e.key === "g" || e.key === "G"){ _p2Grille = !_p2Grille; _p2Dessiner(); }
  else if(e.key === "n" || e.key === "N") _p2TailleNative();
  else if(e.key === "+" || e.key === "=") _p2Taille(1.05);   // « + » demande Maj sur un clavier AZERTY : pas de pas fin
  else if(e.key === "-" || e.key === "_") _p2Taille(0.95);
  else if(_p2Sel && e.key.startsWith("Arrow")){
    if(e.key === "ArrowLeft")  _p2Sel.x -= pas;
    if(e.key === "ArrowRight") _p2Sel.x += pas;
    if(e.key === "ArrowUp")    _p2Sel.y -= pas;
    if(e.key === "ArrowDown")  _p2Sel.y += pas;
    _p2Borner(_p2Sel); _p2Dessiner();
  }
  else fait = false;
  if(fait) e.preventDefault();
});
