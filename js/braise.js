/* ===========================================================
   SURFACES PLANÉTAIRES — La Braise (v0.98) et Le Suaire (v0.99). GDD « La Braise —
   sous-carte ». Secteurs `braise` / `suaire` (serveur : v098_braise.sql, déjà prêt).

   ⚠ POSITION AU SOL : `etat.surface = { x, y, abord }`, JAMAIS `etat.pos`.
     `etat.pos` reste la position sur Silène (pos_x/pos_y côté serveur, lus par
     ressusciter et dans_zone_faction). `etat.surface` part dans `donnees`, que
     le serveur lit pour l'air : `air_respirable` → vrai seulement si `abord`.
   ⚠ `etat.posEspace` ne bouge pas pendant le séjour : le joueur redécolle
     au-dessus de La Braise, là où il était en orbite.

   RÈGLES
   - Descendre : depuis l'orbite, SUR La Braise (onglet « La Braise »). Coût
     d'un saut (carburant + énergie) ; il faut l'autonomie d'un aller-retour.
   - Au sol, pas d'air : chaque déplacement coûte énergie + O₂, avec les MÊMES
     fonctions que Silène (aptitudes comprises). Tout est zone chaude
     (enZoneChaude, data.js) : l'aptitude d'Ignis joue.
   - L'O₂ se recharge À BORD. Rejoindre le vaisseau est un déplacement comme un
     autre : il coûte. Emporter des recharges vaut mieux que les allers-retours.
   - On ne redécolle qu'à bord.
   =========================================================== */
/* v0.99 — DEUX PLANÈTES, UN SEUL MODULE. La configuration vit dans SURFACES,
   indexée par le secteur (`etat.secteur`). Tout le reste est commun : descente,
   bord, décollage, déplacement, carte, onglet. La Braise ne change pas.
   ⚠ Ajouter une planète = une entrée ici + sa valeur dans sauver_profil /
     air_respirable (serveur, déjà prêts pour 'suaire') + enZone* (data.js). */
const SURFACES = {
  braise: {
    nom:"La Braise", orbite:"planete_chaude", img:"images/carte_braise.png", w:2400, h:1600,
    o2Mult:2,                                     // O₂ ×2 : pas d'air, chaleur, cendre
    vaisseau:{ x:1656, y:875, r:70 },
    lieux:[
      { id:"atterrissage", nom:"Aire d'atterrissage", x:1656, y:875,  r:70,  desc:"La seule plaine assez lisse pour se poser." },
      { id:"solfatares",   nom:"Les Solfatares",      x:2078, y:391,  r:110, desc:"Un grand cratère qui fume jaune. L'air y pique les yeux à travers le casque." },
      { id:"aiguilles",    nom:"Le Champ d'aiguilles",x:547,  y:420,  r:110, desc:"Des aiguilles d'obsidienne à perte de vue. On s'y perd." },
      { id:"cuvette",      nom:"La Cuvette",          x:422,  y:1359, r:100, desc:"Un cratère ancien, trop rond pour être tout à fait naturel." },
      { id:"failles",      nom:"Les Failles",         x:1297, y:1094, r:100, desc:"Un réseau de fissures où la lave affleure encore." }
    ],
    descente:"Une planète brûlée, orange sous sa croûte. Les équipages disent qu'elle n'a pas toujours été comme ça. En bas : <b>pas d'air</b>. L'O₂ ne se recharge qu'à bord de ton vaisseau — emporte des recharges.",
    arrivee:"Le vaisseau se pose dans un nuage de cendre. Dehors, tout est noir, rouge et silencieux. À bord, l'air tient ; dehors, il n'y en a pas.",
    depart:"Le vaisseau s'arrache à la cendre. En dessous, La Braise redevient une boule orange, lointaine.",
    couleur:"#f59e0b"
  },
  /* Le Suaire (officiel : Gypsophila). Lieux lus sur carte_suaire.png
     (1536×1024 → monde ×1.5625). Noms provisoires tant que Q12-Q13 ne sont pas
     écrites. Tout est zone FROIDE (enZoneFroide) : l'aptitude de la Toundra joue. */
  suaire: {
    nom:"Le Suaire", orbite:"planete_froide", img:"images/carte_suaire.png", w:2400, h:1600,
    o2Mult:2,                                     // O₂ ×2 : pas d'air, froid mordant
    vaisseau:{ x:1000, y:610, r:70 },
    lieux:[
      { id:"atterrissage", nom:"Aire d'atterrissage", x:1000, y:610,  r:70,  desc:"Un champ de neige damée par le vent. Le seul endroit plat." },
      { id:"crevasse",     nom:"La Grande Crevasse",  x:1280, y:760,  r:110, desc:"Une fracture qui traverse le glacier de part en part. Le fond ne se voit pas." },
      { id:"lac",          nom:"Le Lac bleu",         x:1560, y:1090, r:110, desc:"Une glace si claire qu'on voit dessous. Il y a quelque chose, dessous." },
      { id:"verriere",     nom:"La Verrière",         x:1800, y:520,  r:120, desc:"Un glacier suspendu, bleu, lisse comme une vitre." },
      { id:"dents",        nom:"Les Dents",           x:2150, y:320,  r:110, desc:"Des pics noirs qui percent la neige comme une mâchoire." },
      { id:"pics",         nom:"Les Pics blancs",     x:470,  y:1330, r:110, desc:"Une chaîne de sommets où le vent ne s'arrête jamais." }
    ],
    descente:"Une planète blanche, entièrement couverte de glace, comme d'un drap. En bas : <b>pas d'air</b>, et un froid qui mord à travers la combinaison. L'O₂ ne se recharge qu'à bord de ton vaisseau — emporte des recharges.",
    arrivee:"Le vaisseau se pose dans une gerbe de neige. Dehors, tout est blanc, bleu et silencieux. À bord, l'air tient ; dehors, il n'y en a pas.",
    depart:"Le vaisseau arrache ses patins à la glace. En dessous, Le Suaire redevient une bille blanche.",
    couleur:"#7dd3fc"
  }
};
/* Compatibilité : BRAISE désigne la configuration de La Braise. */
const BRAISE = SURFACES.braise;
const PAS_SURF_E  = (typeof PAS    !== "undefined") ? PAS    : 63;   // mêmes pas que Silène (carte.js)
const PAS_SURF_O2 = (typeof PAS_O2 !== "undefined") ? PAS_O2 : 80;   // divisé par cfg.o2Mult au sol
function surfaceCfg(secteur){ return SURFACES[secteur || (etat && etat.secteur)] || null; }
function enSurfaceIci(){ return !!surfaceCfg(); }
function posSurface(){
  if(etat.surface && typeof etat.surface.x === "number") return etat.surface;
  const c=surfaceCfg()||BRAISE;
  return { x:c.vaisseau.x, y:c.vaisseau.y, abord:true };
}
function surfaceLieu(secteur, id){ const c=surfaceCfg(secteur); return c ? (c.lieux.find(l => l.id === id) || null) : null; }
function lieuBraiseIci(){ const c=surfaceCfg(); if(!c) return null; const p=posSurface(); return c.lieux.find(l => Math.hypot(p.x-l.x, p.y-l.y) <= l.r) || null; }
function auVaisseauBraise(){ const c=surfaceCfg(); if(!c) return false; const p=posSurface(), v=c.vaisseau; return Math.hypot(p.x-v.x, p.y-v.y) <= v.r; }
/* En orbite, au-dessus d'une planète à surface : renvoie son secteur ('braise',
   'suaire') ou null. C'est de là qu'on descend. */
function surOrbitePlanete(){
  if(!((typeof enEcart==="function") && enEcart() && typeof surLieuEspace==="function" && typeof espaceLieu==="function")) return null;
  for(const k in SURFACES) if(surLieuEspace(espaceLieu(SURFACES[k].orbite))) return k;
  return null;
}
function surOrbiteBraise(){ return !!surOrbitePlanete(); }       // compatibilité (navigation.js)

/* Coût d'un déplacement au sol. MÊMES fonctions que coutTrajet (carte.js) :
   aptitudes, Endurance, zone chaude. Pas de cercle d'abri : tout est à découvert. */
function coutBraise(x, y, depuis){
  const c = surfaceCfg() || BRAISE, src = depuis || posSurface();
  x = Math.max(0, Math.min(c.w, x)); y = Math.max(0, Math.min(c.h, y));
  const d = Math.hypot(x - src.x, y - src.y);
  if(d < 6) return null;
  return {
    d,
    coutE: aptEnergieDeplacement(Math.max(1, Math.round(d/PAS_SURF_E))),
    coutO: aptO2Deplacement(coutO2(Math.max(1, Math.round(d/(PAS_SURF_O2/(c.o2Mult||1))))))
  };
}
/* O₂ pour rejoindre le vaisseau depuis un point (0 si on y est). */
function coutRetourVaisseau(depuis){
  const v=(surfaceCfg()||BRAISE).vaisseau, p=depuis||posSurface();
  if(Math.hypot(p.x-v.x, p.y-v.y) <= v.r) return 0;
  const c = coutBraise(v.x, v.y, p); return c ? c.coutO : 0;
}

/* ---------- Descente, bord, décollage ---------- */
async function descendreBraise(){
  const cle = surOrbitePlanete(), c = surfaceCfg(cle);
  if(!c){ journal("Il faut être en orbite au-dessus d'une planète pour descendre.","alerte"); return; }
  if(typeof vaisseauCloue==="function" && vaisseauCloue()){ journal("Coque hors service : ton vaisseau ne se posera nulle part.","alerte"); return; }
  const cs = coutSaut(); if(!cs){ journal("Aucun vaisseau équipé.","alerte"); return; }
  // Comme au décollage de Silène : pas de descente sans de quoi REMONTER.
  const auto = (typeof autonomieCarburant==="function") ? autonomieCarburant() : (etat.carburant||0);
  if(auto < 2*cs.litres){
    journal(`Descente refusée : il faut de quoi remonter. Se poser et redécoller coûte ${2*cs.litres} L, tu n'as que ${Math.round(auto)} L en tout.`,"alerte","voyage");
    return;
  }
  if(!await _payerSaut(`Descente sur ${c.nom}`)) return;
  etat.secteur = cle;
  etat.surface = { x:c.vaisseau.x, y:c.vaisseau.y, abord:true };
  journal(c.arrivee,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  if(typeof fermerOrbite==="function") fermerOrbite();
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  ouvrirCarteBraise();
}
async function monterABord(){
  if(!enSurfaceIci()) return;
  if(!auVaisseauBraise()){ journal("Ton vaisseau est à l'aire d'atterrissage. Rejoins-le d'abord.","alerte"); return; }
  etat.surface = { ...posSurface(), abord:true };
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  // L'O₂ est une jauge serveur : un appel sans coût la fait remonter (air_respirable = à bord).
  await agirServeur({ motif:"bord_braise" });
  journal("Le sas se referme derrière toi. Tu retires ton casque : l'air du bord, enfin.","gain","voyage");
  apresBraise();
}
async function decollerBraise(){
  const c = surfaceCfg(); if(!c) return;
  if(!(posSurface().abord)){ journal("Monte d'abord à bord de ton vaisseau.","alerte"); return; }
  if(!await _payerSaut(`Décollage — ${c.nom}`)) return;
  etat.secteur = "ecart";
  etat.surface = null;
  journal(c.depart,"gain","voyage");
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  fermerCarteBraise();
  if(typeof majApresDeplacement==="function") majApresDeplacement();
  if(typeof ouvrirOrbite==="function") ouvrirOrbite();
}

/* ---------- Déplacement au sol ---------- */
async function voyagerBraise(x, y){
  const cfg = surfaceCfg(); if(!cfg) return;
  if(etat.enPause){ journal("Personnage en pause.","alerte"); return; }
  // Clic près d'un repère ★ ou d'un lieu : on va à son centre (même confort que Silène).
  const rq = (typeof repereQueteSousCarte==="function") ? repereQueteSousCarte(etat.secteur, x, y) : null;
  if(rq){ x = rq.x; y = rq.y; }
  const c = coutBraise(x, y); if(!c) return;
  const o2 = etat.jauges ? (etat.jauges.o2|0) : 0;
  if(c.coutO >= o2){
    journal(`Pas assez d'O₂ pour ce trajet (−${c.coutO}, il t'en reste ${o2}). Respire une recharge, ou avance moins loin.`,"alerte");
    return;
  }
  // Point de non-retour : on AVERTIT (comme sur Silène), on n'interdit pas.
  const reste = o2 - c.coutO, retour = coutRetourVaisseau({ x, y });
  if(retour > 0 && retour >= reste){
    if(!confirm(`Après ce trajet il te restera ${Math.max(0,reste)} d'O₂, et il en faut ${retour} pour revenir au vaisseau.\n\nSans recharge dans ton sac, tu ne reviendras pas. Continuer ?`)) return;
  }
  if(!await agirServeur({ cout:c.coutE, jauges:{ o2:-c.coutO }, motif:"deplacement" })) return;
  // On quitte le bord APRÈS l'appel : le premier pas se fait avec un plein d'air.
  etat.surface = { x:Math.round(x), y:Math.round(y), abord:false };
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  const l = lieuBraiseIci();
  journal(`Déplacement — ${cfg.nom} (${Math.round(c.d)} u). −${c.coutE} % énergie, −${c.coutO} O₂.${l?` Tu es à ${l.nom}.`:""}`,"","voyage");
  if(typeof queteArrivee==="function") queteArrivee();
  apresBraise();
}

/* ---------- Affichage ---------- */
function apresBraise(){
  majCarteBraise();
  if(typeof majHub==="function") majHub();
  if(typeof afficher==="function") afficher();
}
function construireCarteBraise(){
  const svg = document.querySelector("#carte-braise"); if(!svg || svg.dataset.branche) return;
  svg.dataset.branche = "1";
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.addEventListener("click", e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if(!m) return;
    const p = pt.matrixTransform(m.inverse());
    const c = surfaceCfg() || BRAISE;
    if(p.x < 0 || p.y < 0 || p.x > c.w || p.y > c.h) return;   // hors de l'image (bandes vides)
    voyagerBraise(p.x, p.y);
  });
}
function majCarteBraise(){
  const svg = document.querySelector("#carte-braise"); if(!svg) return;
  construireCarteBraise();
  const cfg = surfaceCfg() || BRAISE;
  svg.setAttribute("viewBox", `0 0 ${cfg.w} ${cfg.h}`);
  const tt = document.querySelector("#surface-titre"); if(tt) tt.textContent = cfg.nom;
  let h = `<image href="${cfg.img}" x="0" y="0" width="${cfg.w}" height="${cfg.h}" preserveAspectRatio="none"/>`;
  for(const l of cfg.lieux){
    const vaiss = (l.id === "atterrissage");
    h += `<g style="pointer-events:none"><circle cx="${l.x}" cy="${l.y}" r="${l.r}" fill="${vaiss?"#ffffff14":"#00000033"}" stroke="${vaiss?"#f5e9d3":cfg.couleur}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="${vaiss?"":"8 10"}"/>
      <text x="${l.x}" y="${l.y + l.r + 34}" text-anchor="middle" class="vlabel" style="fill:#f5e9d3">${vaiss?"🚀 ":""}${l.nom}</text></g>`;
  }
  if(typeof marqueursQueteCarteHtml==="function") h += marqueursQueteCarteHtml(etat.secteur);
  const p = posSurface(), col = (FACTIONS.find(f=>f.id===etat.faction)||{}).couleur || "#ff9a44";
  h += `<circle cx="${p.x}" cy="${p.y}" r="15" fill="#0a1730" stroke="${col}" stroke-width="4"/><circle cx="${p.x}" cy="${p.y}" r="6" fill="${col}"/>`;
  svg.innerHTML = h;

  const e = document.querySelector("#braise-energie"); if(e) e.textContent = Math.floor(etat.energie||0);
  const o = document.querySelector("#braise-o2");      if(o) o.textContent = Math.floor((etat.jauges&&etat.jauges.o2)||0);
  const ici = lieuBraiseIci(), abord = !!posSurface().abord;
  const info = document.querySelector("#braise-info");
  if(info){
    const ret = coutRetourVaisseau();
    info.innerHTML = abord
      ? `<b>À bord de ton vaisseau.</b> <span class="itip-gris">Ici tu respires. Dehors, chaque pas coûte de l'O₂.</span>`
      : `${ici?`<b>${ici.nom}</b> — <span class="itip-gris">${ici.desc}</span>`:"<b>À découvert.</b>"} <span class="itip-gris">· retour au vaisseau : ${ret} O₂</span>`;
  }
  const bb = document.querySelector("#braise-bord"), bd = document.querySelector("#braise-decoller");
  if(bb){ const ok = !abord && auVaisseauBraise(); bb.disabled = !ok; bb.style.display = abord ? "none" : ""; }
  if(bd){ bd.disabled = !abord; const cs = (typeof coutSaut==="function") ? coutSaut() : null;
    bd.textContent = cs ? `Décoller — ${cs.litres} L, ${cs.energie} % énergie` : "Décoller"; }
}
function ouvrirCarteBraise(){
  if(!enSurfaceIci()){ journal("Tu n'es sur aucune planète.","alerte"); return; }
  document.querySelector("#modale-braise").classList.add("ouverte"); majCarteBraise();
}
function fermerCarteBraise(){ const m=document.querySelector("#modale-braise"); if(m) m.classList.remove("ouverte"); }

/* ---------- Onglet « La Braise », en orbite au-dessus de la planète ---------- */
function majDescente(){
  const z = document.querySelector("#hub-descente"); if(!z) return;
  const c = surfaceCfg(surOrbitePlanete()); if(!c){ z.innerHTML=""; return; }
  const cs = (typeof coutSaut==="function") ? coutSaut() : null;
  z.innerHTML = `<h3 style="margin:2px 0">${c.nom}</h3>
    <p class="vide">${c.descente}</p>
    <div class="actions"><button class="action" id="braise-descendre"><span>Descendre — ${c.nom}</span><span class="cout">${cs?`${cs.litres} L carburant · ${cs.energie} % énergie`:"vaisseau requis"}</span></button></div>`;
  const b = z.querySelector("#braise-descendre"); if(b) b.addEventListener("click", descendreBraise);
}

/* Branchement des boutons (les éléments existent : ce script est chargé en bas de page). */
(function(){
  const q = s => document.querySelector(s);
  if(q("#braise-fermer"))   q("#braise-fermer").addEventListener("click", fermerCarteBraise);
  if(q("#braise-bord"))     q("#braise-bord").addEventListener("click", monterABord);
  if(q("#braise-decoller")) q("#braise-decoller").addEventListener("click", decollerBraise);
  if(q("#ouvrir-braise"))   q("#ouvrir-braise").addEventListener("click", ouvrirCarteBraise);
})();
