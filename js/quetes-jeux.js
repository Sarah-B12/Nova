/* ===========================================================
   v1.85 — ÉPREUVES DE QUÊTE SUPPLÉMENTAIRES (lot 1 : Q16 → Q20).
   Branchées par `_defiHTML` / `_defiWire` (quetes.js) via QUETES_JEUX.
   Toutes jouées CÔTÉ CLIENT, comme les autres épreuves de quête : les versions
   des missions (missions.js) sont validées par le serveur, pas celles-ci.
   Styles : ceux des missions (.mi-ro-*, .mi-cv-*), injectés par missions.js.

   · ronde      (Q16) observer des antennes qui tournent, prédire 3 pas plus tard
   · noeud      (Q17) suivre un câble du doigt, trois tracés de plus en plus fins
   · crevasse   (Q17) coursives dans le noir, une lampe, un nombre de pas compté
   · impossible (Q20) reprendre les commandes : on ne peut pas gagner (K15)
   · saut       (Q20) la Gorge : le saut détourné, le joueur arrive en Ancolie
   =========================================================== */
const QUETES_JEUX = {};

function _qjEtat(cle, init){
  const a = (typeof queteActive === "function") ? queteActive() : null; if(!a) return init();
  if(!a._qj || a._qj.cle !== cle){ a._qj = Object.assign({ cle }, init()); }
  return a._qj;
}
function _qjCle(d){ const a = queteActive(); return a ? `${a.id}:${a.etape}:${d.type}` : d.type; }

/* ---------- La ronde (Q16) ---------- */
function _rondeBoucle(){
  // Le tour d'un rectangle tiré au hasard dans la grille 6 × 6.
  const w = 2 + Math.floor(Math.random() * 3), h = 2 + Math.floor(Math.random() * 3);
  const x0 = Math.floor(Math.random() * (6 - w)), y0 = Math.floor(Math.random() * (6 - h));
  const pts = [];
  for(let x = x0; x <= x0 + w; x++) pts.push([x, y0]);
  for(let y = y0 + 1; y <= y0 + h; y++) pts.push([x0 + w, y]);
  for(let x = x0 + w - 1; x >= x0; x--) pts.push([x, y0 + h]);
  for(let y = y0 + h - 1; y > y0; y--) pts.push([x0, y]);
  const dec = Math.floor(Math.random() * pts.length), sens = Math.random() < .5;
  let b = pts.map(([x, y]) => y * 6 + x);
  b = b.slice(dec).concat(b.slice(0, dec)); if(sens) b.reverse();
  return b;
}
/* v1.86e — retour de l'autrice : la ronde se figeait sur « Pas 1 sur 9 » et ne
   répondait plus aux clics. Chaque pas redessinait tout l'onglet (majQueteHub),
   et ce redessin commence par _clearQ() : il tuait le minuteur au premier pas.
   Désormais : on ne touche qu'à la grille pendant l'observation, et le redessin
   de l'onglet est suspendu (_seqAnim, comme pour le Simon). Consigne réécrite,
   et la couleur demandée est montrée à chaque réponse. */
const RONDE_NOMS = ["orange","bleue","verte","rouge"];
function _rondeCase(R, i){
  let p = "";
  if(R.phase === "pret" || R.phase === "observer")
    R.boucles.forEach((b, j) => { if(b[R.t % b.length] === i) p = `<span style="background:${RONDE_COUL[j]}"></span>`; });
  if(R.phase === "repondre"){
    R.rep.forEach((c, j) => { if(c === i) p = `<span style="background:${RONDE_COUL[j]}"></span>`; });
    if(!p) R.boucles.forEach((b, j) => { if(j >= R.rep.length && b[R.t % b.length] === i)
      p = `<span style="background:transparent;border:2px dashed ${RONDE_COUL[j]};box-sizing:border-box"></span>`; });
  }
  return p;
}
QUETES_JEUX.ronde = {
  html(d){
    const R = _qjEtat(_qjCle(d), () => ({ boucles:Array.from({ length:d.nb || 3 }, _rondeBoucle), t:0, phase:"pret", rep:[] }));
    const nb = R.boucles.length, k = R.rep.length, obs = d.observe || 8, av = d.avance || 3;
    let h = `<div class="quete-etape">${_par(d.texte)}`;
    if(R.phase === "pret") h += `<p class="quete-indice">${d.consigne || ""}</p>
      <p class="vide" style="margin:2px 0">Chaque point de couleur fait le tour d'un rectangle, <b>une case par pas</b>, toujours dans le même sens. Tu vas le regarder avancer pendant ${obs - 1} pas. Ensuite, pour chaque couleur, touche la case où il sera <b>${av} pas plus tard</b>.</p>`;
    if(R.phase === "observer") h += `<p class="vide" id="qj-ronde-pas" style="margin:2px 0">Pas ${R.t} sur ${obs - 1}…</p>`;
    if(R.phase === "repondre") h += `<p class="vide" style="margin:2px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${RONDE_COUL[k]};vertical-align:-1px"></span>
      ${d.nom || "Repère"} <b>${RONDE_NOMS[k]}</b> (${k + 1} sur ${nb}) : son dernier emplacement est en pointillés. Touche la case où elle sera <b>${av} pas plus tard</b>.</p>`;
    h += `<div class="mi-ro-grille" id="qj-ronde">`;
    for(let i = 0; i < 36; i++) h += `<div class="mi-ro-case" data-qr="${i}" style="${R.phase === "repondre" ? "cursor:pointer" : ""}">${_rondeCase(R, i)}</div>`;
    h += `</div>`;
    if(R.phase === "pret") h += `<div class="quete-rep"><button class="mini" id="qj-ronde-go">Observer</button></div>`;
    return h + `</div>`;
  },
  wire(z, d){
    const R = _qjEtat(_qjCle(d), () => ({})), obs = d.observe || 8, av = d.avance || 3;
    const go = z.querySelector("#qj-ronde-go");
    if(go) go.addEventListener("click", () => {
      R.phase = "observer"; R.t = 0;
      _seqAnim = Date.now();                       // pas de redessin de l'onglet pendant l'observation
      majQueteHubForce();
      const tick = setInterval(() => {
        const g = document.querySelector("#qj-ronde");
        if(!g){ clearInterval(tick); _seqFin(); R.phase = "pret"; R.t = 0; return; }   // onglet quitté : on recommencera
        R.t++;
        if(R.t >= obs){ clearInterval(tick); R.t = obs - 1; R.phase = "repondre"; _seqFin(); majQueteHub(); return; }
        g.querySelectorAll("[data-qr]").forEach(c => { c.innerHTML = _rondeCase(R, +c.dataset.qr); });
        const lp = document.querySelector("#qj-ronde-pas"); if(lp) lp.textContent = `Pas ${R.t} sur ${obs - 1}…`;
      }, d.vitesse || 650);
    });
    if(R.phase === "repondre") z.querySelectorAll("[data-qr]").forEach(c => c.addEventListener("click", () => {
      R.rep.push(+c.dataset.qr);
      if(R.rep.length < R.boucles.length){ majQueteHub(); return; }
      const bon = R.boucles.every((b, j) => b[(R.t + av) % b.length] === R.rep[j]);
      const a = queteActive(); if(a) a._qj = null;
      if(bon){ journal("Repérage juste.", "gain"); reussirDefi(); }
      else echouerDefi(d.echec || `Raté : ${d.nom ? d.nom.toLowerCase() : "un repère"} n'était pas où tu l'attendais. Nouvelle tentative dans ${VERROU_DEFI_H} h.`);
    }));
  }
};
/* Le redessin « forcé » ignore la suspension (_seqAnim) : utilisé une seule fois,
   pour passer de « Observer » à la grille en mouvement. */
function majQueteHubForce(){ const s = _seqAnim; _seqAnim = 0; majQueteHub(); _seqAnim = s; }

/* ---------- Le nœud (Q17) ---------- */
QUETES_JEUX.noeud = {
  html(d){
    const N = _qjEtat(_qjCle(d), () => ({ k:0, prog:0, pts:null }));
    if(!N.pts) N.pts = _noeudTracer(N.k);
    const pts = N.pts, tol = NOEUD_TOL[N.k];
    const dd = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
    return `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">${(d.consigne || "Suis le tracé du doigt ou de la souris, sans lever ni sortir.")} <b>${N.k + 1} sur 3.</b></p>
      <svg id="qj-noeud" viewBox="0 0 300 300" style="width:100%;max-width:300px;touch-action:none;background:rgba(125,211,252,.06);border:1px solid var(--line);border-radius:8px">
        <path d="${dd}" stroke="#7dd3fc33" stroke-width="${tol}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${dd}" stroke="#cfe8f7" stroke-width="3" fill="none"/>
        <path id="qj-noeud-fait" d="M0 0" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="9" fill="#f59e0b"/><circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="9" fill="none" stroke="#f59e0b" stroke-width="3"/>
      </svg></div>`;
  },
  wire(z, d){
    const N = _qjEtat(_qjCle(d), () => ({})), svg = z.querySelector("#qj-noeud"); if(!svg) return;
    let actif = false;
    const pt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * 300 / r.width, (e.clientY - r.top) * 300 / r.height]; };
    const rater = () => { actif = false; N.prog = 0; N.pts = _noeudTracer(N.k); journal(d.glisse || "Le câble a glissé : recommence ce tronçon.", "alerte"); majQueteHub(); };
    svg.addEventListener("pointerdown", e => {
      const [x, y] = pt(e), p0 = N.pts[0];
      if(Math.hypot(x - p0[0], y - p0[1]) > NOEUD_TOL[N.k]) return;
      actif = true; N.prog = 0; try{ svg.setPointerCapture(e.pointerId); }catch(_){}
    });
    svg.addEventListener("pointermove", e => {
      if(!actif) return;
      const [x, y] = pt(e), pts = N.pts, tol = NOEUD_TOL[N.k] / 2;
      let best = -1, bd = 1e9;
      for(let i = N.prog; i < Math.min(pts.length, N.prog + 12); i++){ const q = Math.hypot(x - pts[i][0], y - pts[i][1]); if(q < bd){ bd = q; best = i; } }
      if(bd > tol){ rater(); return; }
      if(best > N.prog){ N.prog = best; const f = svg.querySelector("#qj-noeud-fait");
        if(f) f.setAttribute("d", "M" + pts.slice(0, best + 1).map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L")); }
      if(N.prog >= pts.length - 2){
        actif = false;
        if(N.k < 2){ N.k++; N.pts = null; N.prog = 0; majQueteHub(); }
        else { const a = queteActive(); if(a) a._qj = null; journal(d.fini || "Le câble tient.", "gain"); reussirDefi(); }
      }
    });
    svg.addEventListener("pointerup", () => { if(actif && N.prog < N.pts.length - 2) rater(); });
  }
};

/* ---------- La crevasse (Q17) : un labyrinthe dans le noir ---------- */
function _crevGenerer(n){
  const cases = Array(n * n).fill(0), vu = Array(n * n).fill(false);
  const pile = [0]; vu[0] = true;
  const DIR = [[1, -n, 4], [2, 1, 8], [4, n, 1], [8, -1, 2]];   // bit, pas, bit opposé
  while(pile.length){
    const i = pile[pile.length - 1], r = Math.floor(i / n), c = i % n;
    const v = DIR.filter(([b, p]) => { const j = i + p; if(j < 0 || j >= n * n) return false;
      if(p === 1 && c === n - 1) return false; if(p === -1 && c === 0) return false; return !vu[j]; });
    if(!v.length){ pile.pop(); continue; }
    const [b, p, bo] = v[Math.floor(Math.random() * v.length)];
    cases[i] |= b; cases[i + p] |= bo; vu[i + p] = true; pile.push(i + p);
  }
  return cases;
}
function _crevDistance(cases, n, de, a){
  const dist = Array(n * n).fill(-1); dist[de] = 0; const f = [de];
  while(f.length){ const i = f.shift(); for(const [b, p] of [[1, -n], [2, 1], [4, n], [8, -1]]) if(cases[i] & b){ const j = i + p; if(dist[j] < 0){ dist[j] = dist[i] + 1; f.push(j); } } }
  return dist[a];
}
QUETES_JEUX.crevasse = {
  _etat(d){
    return _qjEtat(_qjCle(d), () => {
      const n = d.n || 9, cases = _crevGenerer(n), cs = Math.floor(Math.random() * n), ce = Math.floor(Math.random() * n);
      const court = _crevDistance(cases, n, cs, (n - 1) * n + ce);
      return { n, cases, cs, ce, pos:cs, pas:0, max:Math.ceil(court * (d.marge || 1.6)) };
    });
  },
  html(d){
    const g = this._etat(d), n = g.n, r0 = Math.floor(g.pos / n), c0 = g.pos % n, R = d.rayon || 1;
    let h = `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">${d.consigne || "Trouve la sortie, en bas."} <b>Pas restants : ${g.max - g.pas}.</b></p>
      <div class="mi-cv-grille" style="grid-template-columns:repeat(${n},1fr)">`;
    for(let i = 0; i < n * n; i++){
      const r = Math.floor(i / n), c = i % n, vis = Math.max(Math.abs(r - r0), Math.abs(c - c0)) <= R, mk = g.cases[i];
      const st = vis ? `border-top:2px solid ${mk & 1 ? "transparent" : "#cfe8f7"};border-right:2px solid ${mk & 2 ? "transparent" : "#cfe8f7"};border-bottom:2px solid ${mk & 4 ? "transparent" : "#cfe8f7"};border-left:2px solid ${mk & 8 ? "transparent" : "#cfe8f7"}` : "";
      h += `<div class="mi-cv${vis ? " vu" : ""}${i === g.pos ? " moi" : ""}${vis && r === n - 1 && c === g.ce ? " sortie" : ""}" style="${st}"></div>`;
    }
    h += `</div><div class="mi-btns mi-cv-fleches">${[["N","↑"],["O","←"],["S","↓"],["E","→"]].map(([k, t]) => `<button class="mini" data-qcv="${k}">${t}</button>`).join("")}</div></div>`;
    return h;
  },
  wire(z, d){
    const g = this._etat(d), n = g.n;
    z.querySelectorAll("[data-qcv]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.qcv, bit = { N:1, E:2, S:4, O:8 }[k];
      if(!(g.cases[g.pos] & bit)) return;                        // un mur : pas compté
      g.pos += { N:-n, E:1, S:n, O:-1 }[k]; g.pas++;
      if(g.pos === (n - 1) * n + g.ce){ const a = queteActive(); if(a) a._qj = null; journal(d.fini || "Tu es sorti.", "gain"); reussirDefi(); return; }
      if(g.pas >= g.max){ const a = queteActive(); if(a) a._qj = null; echouerDefi(d.echec || `Ta lampe faiblit : tu rebrousses chemin. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
      majQueteHub();
    }));
  }
};

/* ---------- L'épreuve impossible (Q20, K15) ----------
   Une ligne de code défile ; il faut la retaper avant qu'elle ne parte. Elle
   change pendant qu'on tape, et accélère : on ne peut pas gagner. Au bout de
   `essais` échecs, un bouton laisse filer : l'histoire avance, rien n'est perdu. */
const _IMP_SIGNES = "0123456789ABCDEF:/-_.#";
function _impLigne(n){ let s = ""; for(let i = 0; i < n; i++) s += _IMP_SIGNES[Math.floor(Math.random() * _IMP_SIGNES.length)]; return "NAV::" + s; }
QUETES_JEUX.impossible = {
  html(d){
    const I = _qjEtat(_qjCle(d), () => ({ tour:0, ligne:_impLigne(18), fin:0, perdu:false }));
    const com = (d.commentaires || [])[Math.min(I.tour, (d.commentaires || []).length - 1)] || "";
    const lacher = I.tour >= (d.essais || 2);
    return `<div class="quete-etape">${_par(d.texte)}
      <p class="quete-indice">${d.consigne || "Retape la ligne avant qu'elle ne sorte de l'écran."}</p>
      <div style="font-family:'Space Mono',monospace;font-size:15px;letter-spacing:.06em;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:#060b14;color:#7bc47f;overflow:hidden;white-space:nowrap" id="qj-imp-ligne">${I.ligne}</div>
      <div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;margin:6px 0"><div id="qj-imp-barre" style="height:6px;width:100%;background:#ff5257;border-radius:3px"></div></div>
      ${lacher ? "" : `<div class="quete-rep"><input id="qj-imp-champ" autocomplete="off" spellcheck="false" style="font-family:'Space Mono',monospace" placeholder="NAV::…"><button class="mini" id="qj-imp-go">${I.tour ? "Recommencer" : "Reprendre les commandes"}</button></div>`}
      ${com ? `<p class="quete-dial" style="margin-top:8px">${com}</p>` : ""}
      ${lacher ? `<div class="quete-rep"><button class="mini" id="qj-imp-lacher">${d.bouton || "Lâcher les commandes"}</button></div>` : ""}</div>`;
  },
  wire(z, d){
    const I = _qjEtat(_qjCle(d), () => ({})), go = z.querySelector("#qj-imp-go"), ch = z.querySelector("#qj-imp-champ");
    const lacher = z.querySelector("#qj-imp-lacher");
    if(lacher) lacher.addEventListener("click", () => { const a = queteActive(); if(a) a._qj = null; reussirDefi(); });
    if(!go || !ch) return;
    const perdre = () => { if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; } _seqFin(); I.tour++; I.ligne = _impLigne(18 + I.tour * 8); sauvegarder(); majQueteHub(); };
    go.addEventListener("click", () => {
      if(_queteTimer) return;
      _seqAnim = Date.now();   // v1.86e : un redessin de l'onglet tuerait le minuteur
      ch.disabled = false; ch.value = ""; ch.focus();
      const duree = Math.max(1800, 6000 - I.tour * 2500), debut = Date.now(), lg = z.querySelector("#qj-imp-ligne"), barre = z.querySelector("#qj-imp-barre");
      _queteTimer = setInterval(() => {
        const r = 1 - (Date.now() - debut) / duree;
        if(barre) barre.style.width = Math.max(0, r * 100) + "%";
        if(lg) lg.style.textIndent = ((1 - r) * 60) + "%";
        if(r <= 0) perdre();
      }, 50);
      ch.addEventListener("input", () => {
        // La ligne se réécrit juste devant ce que tu tapes : elle ne se laisse pas rattraper.
        const k = ch.value.length; if(k >= I.ligne.length) return;
        const j = Math.min(I.ligne.length - 1, k + 1 + Math.floor(Math.random() * 3));
        I.ligne = I.ligne.slice(0, j) + _IMP_SIGNES[Math.floor(Math.random() * _IMP_SIGNES.length)] + I.ligne.slice(j + 1);
        if(lg) lg.textContent = I.ligne;
        if(ch.value === I.ligne){ perdre(); }   // même juste, la ligne a déjà changé de place
      });
    });
  }
};

/* ---------- Le saut (Q20) : une scène, puis le détournement ----------
   Au clic, le vaisseau entre dans la Gorge ; 42-U1F le détourne (K9) : le joueur
   se retrouve au sol d'Ancolie, au point de chute (`d.lieu`), hors du vaisseau. */
QUETES_JEUX.saut = {
  html(d){ return `<div class="quete-etape">${_par(d.texte)}<div class="quete-rep"><button class="mini" id="qj-saut">${d.bouton || "Sauter"}</button></div></div>`; },
  wire(z, d){
    const b = z.querySelector("#qj-saut"); if(!b) return;
    b.addEventListener("click", async () => {
      b.disabled = true;
      const c = (typeof surfaceCfg === "function") ? surfaceCfg(d.carte || "ancolie") : null;
      const l = c && c.lieux.find(x => x.id === (d.lieu || "chute"));
      if(!c || !l){ journal("La Gorge ne mène nulle part pour l'instant.", "alerte"); b.disabled = false; return; }
      etat.secteur = d.carte || "ancolie";
      etat.surface = { x:l.x, y:l.y, abord:false };
      etat.ancolie = true;
      if(typeof fermerOrbite === "function") fermerOrbite();
      if(typeof sauverMaintenant === "function") await sauverMaintenant();
      if(typeof majApresDeplacement === "function") majApresDeplacement();
      reussirDefi();
    });
  }
};
