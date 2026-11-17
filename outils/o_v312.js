// v3.12 (autrice, 17/11) — lien du forum en haut à gauche ; déconnexion à 45 min ; labyrinthe : 25 s et aide aux
// virages (K282) ; protection après un vol vide, textes (K283, le serveur : v311).
//   node outils/o_banc.js . v312
(async function(){
  await new Promise(x => setTimeout(x, 400));
  const r = {};
  const h = document.querySelector("header .marque");
  r.hautGauche = h ? { texte: (h.querySelector(".sous-titre") || {}).textContent, lien: (h.querySelector("a") || {}).href || null } : null;
  r.inactiviteMin = typeof INACTIF_MS === "number" ? INACTIF_MS / 60000 : null;
  r.avertissementMin = typeof INACTIF_AVERT_MS === "number" ? INACTIF_AVERT_MS / 60000 : null;
  r.refusProteges = (_VOL_REFUS.proteges() || "").replace(/^.*récemment/, "…récemment").slice(0, 160);
  // le chrono du labyrinthe
  _hackWin = () => {}; _hackLose = () => {};
  const m = _hackModal(); _miniLabyrinthe(m);
  await new Promise(x => setTimeout(x, 450));
  r.labChrono = (m.querySelector("#hk-chrono") || {}).textContent;
  r.labAttendu = Math.round((typeof LAB_TEMPS_MS === "number" ? LAB_TEMPS_MS : 17000) / 1000 + intelligenceEffective() * 0.03) + " s environ (Int " + intelligenceEffective() + ")";
  _hackFin(false);
  // l'aide aux virages : un couloir horizontal (rangée 1), une ouverture vers le bas en colonne 2 ;
  // la bille, à 0,35 case à droite de l'ouverture, pousse vers le bas
  if(typeof _labGlisser === "function"){
    const M = 7, CS = 30, R = CS * 0.30, g = Array.from({ length: M }, () => Array(M).fill(1));
    for(let c = 1; c <= 4; c++) g[1][c] = 0; g[2][2] = 0; g[3][2] = 0;
    const collide = (x, y) => { for(const [qx, qy] of [[x-R,y-R],[x+R,y-R],[x-R,y+R],[x+R,y+R]]){ const c = Math.floor(qx/CS), rr = Math.floor(qy/CS); if(rr<0||c<0||rr>=M||c>=M||g[rr][c]===1) return true; } return false; };
    const essai = (x0) => { let px = x0, py = 2 * CS - R - 0.5;   // la bille a déjà roulé jusqu'au mur du bas
      const avant = collide(px, py + 1.5);
      for(let f = 0; f < 20; f++) [px, py] = _labGlisser(g, M, CS, R, px, py, 0, 1, 1, collide);
      return { bloqueeAuDepart: avant, ecartFinal: Math.round((px - 2.5 * CS) / CS * 100) / 100, peutDescendre: !collide(px, py + 1.5) }; };
    r.aideDecalee035 = essai(2.85 * CS);       // en face de l'ouverture à 0,35 case près
    r.aideSansOuverture = essai(3.5 * CS);     // colonne 3 : pas d'ouverture, la bille ne bouge pas
  } else r.aide = "absente";
  return r;
})()
