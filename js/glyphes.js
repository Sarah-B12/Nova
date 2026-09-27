/* ===========================================================
   GLYPHES — l'écriture de l'ancien (v1.28).
   ⚠ C'EST UNE ÉCRITURE PHONÉTIQUE, PAR MORCEAUX LARGES (décision de
     l'autrice, 27/09) : un glyphe = un morceau de son, TOUJOURS le même,
     d'une quête à l'autre. Q4 sert de pierre de Rosette (les pictogrammes
     rendent la traduction facile) ; Q9 étape 4 et les suivantes se lisent
     en partie et se DÉDUISENT pour le reste. Canon : LORE (l'ancien).
   ⚠ Ne JAMAIS réattribuer un glyphe existant à un autre son : les joueurs
     l'ont appris. Pour un son nouveau, prendre un glyphe libre (voir
     la liste « encore sans son » plus bas) et l'ajouter au LORE.
   Dessin (choix B) : dix formes de base, celles que les joueurs ont déjà
   vues (Λ Ξ Θ Ψ Δ Φ Σ Π Ω Χ), et des variantes RÉGULIÈRES — un point
   au-dessus, un trait vertical, une barre, la forme renversée ou en
   miroir. Dessinés en SVG : identiques sur tous les appareils.
   =========================================================== */
const _GLY_BASES = {
  L: "M4 28 L12 4 L20 28",                                             // Λ
  X: "M4 5 H20 M6 16 H18 M4 27 H20",                                   // Ξ
  T: "M12 5 C22 5 22 27 12 27 C2 27 2 5 12 5 Z M6 16 H18",             // Θ
  P: "M4 6 V12 Q4 19 12 19 Q20 19 20 12 V6 M12 4 V28",                 // Ψ
  D: "M12 4 L21 28 H3 Z",                                              // Δ
  F: "M12 9 C21 9 21 23 12 23 C3 23 3 9 12 9 Z M12 3 V29",             // Φ
  S: "M20 5 H4 L12 16 L4 27 H20",                                      // Σ
  I: "M4 5 H20 M7 5 V28 M17 5 V28",                                    // Π
  O: "M4 28 H9 Q3 22 3 14 Q3 4 12 4 Q21 4 21 14 Q21 22 15 28 H20",     // Ω
  C: "M4 4 L20 28 M20 4 L4 28"                                         // Χ
};
/* son → [base, variante]. Variantes : "" · point · trait (vertical) ·
   barre (horizontale) · renverse (haut/bas) · miroir (gauche/droite). */
const GLYPHES_ANCIEN = {
  // — Q4, la pierre de Rosette —
  PERI:["L",""],        MEDI:["L","point"],
  METRE:["X",""],       EM:["X","point"],        FER:["X","trait"],
  ALI:["T",""],         BARQUE:["T","point"],    TURE:["O","renverse"],
  POINT:["P",""],       RASSEMBLE:["P","point"], EVA:["P","renverse"],
  DE:["D",""],          AC:["D","point"],        LAI:["D","renverse"],
  PRO:["F",""],         GRAMME:["F","point"],    FIRM:["F","barre"],
  PART:["S",""],        CES:["S","point"],       ME:["S","miroir"],
  MENT:["I",""],        POSTE:["I","point"],     CU:["I","renverse"],
  ATION:["O",""],       CON:["O","point"],
  CAL:["C",""],         RESTREINT:["C","point"]
};
/* Formes ENCORE SANS SON (pour les prochains) : ["C","barre"] (Χ barré).
   À éviter : ["T","trait"] (Θ traversé, trop proche de Φ au doigt). */
function glypheSVG(son){
  const g = GLYPHES_ANCIEN[son]; if(!g) return `<span class="gly-inconnu">?</span>`;
  const [b, v] = g; const d = _GLY_BASES[b];
  const tr = v==="renverse" ? ` transform="translate(0 32) scale(1 -1)"` : (v==="miroir" ? ` transform="translate(24 0) scale(-1 1)"` : "");
  let plus = "";
  if(v==="point") plus = `<circle cx="12" cy="-2.5" r="2.1" fill="currentColor" stroke="none"/>`;
  if(v==="trait") plus = `<path d="M12 0 V32"/>`;
  if(v==="barre") plus = `<path d="M0 16 H24"/>`;
  return `<svg class="gly" viewBox="-2 -7 28 41" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"${tr}/>${plus}</svg>`;
}
/* Un mot = une suite de sons. Le lecteur d'écran lit « glyphes de l'ancien ». */
function glyphesMot(sons){
  return `<span class="gly-mot" role="img" aria-label="glyphes de l'ancien">${(sons||[]).map(glypheSVG).join("")}</span>`;
}
(function(){
  if(typeof document==="undefined") return;
  const s = document.createElement("style");
  s.textContent = `
    .gly-mot{ display:inline-flex; gap:2px; align-items:flex-end; flex-wrap:wrap; justify-content:center; }
    .gly{ width:22px; height:38px; color:var(--bleu,#7fb4ff); }
    .gly-inconnu{ display:inline-block; width:22px; text-align:center; }
    @media (max-width:420px){ .gly{ width:19px; height:33px; } }
  `;
  document.head.appendChild(s);
})();
