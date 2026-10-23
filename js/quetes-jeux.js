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
   · brouillage (Q29) caler son onde sur celle de l'appel et la tenir (v1.93, porté de H64)
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
    /* v1.88c — le circuit du point en cours est rappelé en pâle (sans le sens) : il reste
       à se souvenir de son SENS et à compter. Retour de l'autrice : trop dur à trois. */
    const k = R.rep.length, cir = R.boucles[k];
    if(cir && cir.includes(i) && !(R.boucles[k][R.t % R.boucles[k].length] === i)) p = `<span style="background:${RONDE_COUL[k]};opacity:.22"></span>`;
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
      <div class="vide" style="margin:2px 0;line-height:1.5"><b>Comment ça marche.</b><br>
        1. Chaque point de couleur tourne en rond sur son petit circuit (le bord d'un rectangle), <b>une case à chaque pas</b>, toujours dans le même sens.<br>
        2. Clique sur « Observer » : ${nb > 1 ? `les ${nb} points` : "le point"} vont avancer pendant ${obs - 1} pas. Retiens le circuit de chacun, et surtout <b>dans quel sens il tourne</b>.<br>
        3. Puis tout s'arrête. Pour chaque point, à tour de rôle, touche la case où il sera <b>${av} pas plus tard</b> : pars de sa dernière case (en pointillés) et compte ${av} cases le long de son circuit, dans son sens.</div>`;
    if(R.phase === "observer") h += `<p class="vide" id="qj-ronde-pas" style="margin:2px 0">Pas ${R.t} sur ${obs - 1}…</p>`;
    if(R.phase === "repondre") h += `<p class="vide" style="margin:2px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${RONDE_COUL[k]};vertical-align:-1px"></span>
      ${d.nom || "Repère"} <b>${RONDE_NOMS[k]}</b> (${k + 1} sur ${nb}) : sa dernière case est en pointillés, son circuit en pâle. Compte ${av} cases le long du circuit, <b>dans le sens où elle tournait</b>, et touche la case d'arrivée.</p>`;
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
      _qjRedessiner(z, d);
      const tick = setInterval(() => {
        const g = document.querySelector("#qj-ronde");
        if(!g){ clearInterval(tick); _seqFin(); R.phase = "pret"; R.t = 0; return; }   // onglet quitté : on recommencera
        R.t++;
        if(R.t >= obs){ clearInterval(tick); R.t = obs - 1; R.phase = "repondre"; _seqFin(); _qjRedessiner(z, d); return; }
        g.querySelectorAll("[data-qr]").forEach(c => { c.innerHTML = _rondeCase(R, +c.dataset.qr); });
        const lp = document.querySelector("#qj-ronde-pas"); if(lp) lp.textContent = `Pas ${R.t} sur ${obs - 1}…`;
      }, d.vitesse || 650);
    });
    if(R.phase === "repondre") z.querySelectorAll("[data-qr]").forEach(c => c.addEventListener("click", () => {
      R.rep.push(+c.dataset.qr);
      if(R.rep.length < R.boucles.length){ _qjRedessiner(z, d); return; }
      const bon = R.boucles.every((b, j) => b[(R.t + av) % b.length] === R.rep[j]);
      const a = queteActive(); if(a) a._qj = null;
      if(bon){ journal("Repérage juste.", "gain"); reussirDefi(); }
      else echouerDefi(d.echec || `Raté : ${d.nom ? d.nom.toLowerCase() : "un repère"} n'était pas où tu l'attendais. Nouvelle tentative dans ${VERROU_DEFI_H} h.`);
    }));
  }
};
/* v1.88 — majQueteHubForce() retirée : plus utilisée depuis v1.87c (_qjRedessiner). */

/* v1.87c — REDESSINER L'ÉPREUVE SEULE. Avant, chaque clic (un pas dans la crevasse,
   un module posé, une impulsion choisie…) appelait majQueteHub() : tout l'onglet
   était reconstruit, la bannière et l'image de l'étape rechargées, et la page
   remontait puis redescendait. Ici on ne remplace que la zone de l'épreuve
   ([data-qj-zone], posée par _defiHTML). Si la zone n'existe plus (onglet quitté,
   étape changée), on retombe sur le redessin complet. */
function _qjRedessiner(z, d){
  const J = (typeof QUETES_JEUX !== "undefined") && QUETES_JEUX[d.type];
  const zone = (z && z.hasAttribute && z.hasAttribute("data-qj-zone")) ? z : (z && z.querySelector && z.querySelector("[data-qj-zone]"));
  if(!J || !zone || !document.body.contains(zone)){ majQueteHub(); return; }
  zone.innerHTML = J.html(d); J.wire(zone, d);
}

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
    const rater = () => { actif = false; N.prog = 0; N.pts = _noeudTracer(N.k); journal(d.glisse || "Le câble a glissé : recommence ce tronçon.", "alerte"); _qjRedessiner(z, d); };
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
        if(N.k < 2){ N.k++; N.pts = null; N.prog = 0; _qjRedessiner(z, d); }
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
      _qjRedessiner(z, d);
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
      <div style="font-family:'Space Mono',monospace;font-size:15px;letter-spacing:.06em;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:#060b14;color:#7bc47f;overflow:hidden;white-space:nowrap;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;opacity:.55" id="qj-imp-ligne">${"░".repeat(I.ligne.length)}</div>
      <div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;margin:6px 0"><div id="qj-imp-barre" style="height:6px;width:100%;background:#ff5257;border-radius:3px"></div></div>
      ${lacher ? "" : `<div class="quete-rep"><input id="qj-imp-champ" autocomplete="off" spellcheck="false" disabled style="font-family:'Space Mono',monospace" placeholder="La ligne s'affichera au départ…"><button class="mini" id="qj-imp-go">${I.tour ? "Recommencer" : "Reprendre les commandes"}</button></div>`}
      ${com ? `<p class="quete-dial" style="margin-top:8px">${com}</p>` : ""}
      ${lacher ? `<div class="quete-rep"><button class="mini" id="qj-imp-lacher">${d.bouton || "Lâcher les commandes"}</button></div>` : ""}</div>`;
  },
  wire(z, d){
    const I = _qjEtat(_qjCle(d), () => ({})), go = z.querySelector("#qj-imp-go"), ch = z.querySelector("#qj-imp-champ");
    const lacher = z.querySelector("#qj-imp-lacher");
    if(lacher) lacher.addEventListener("click", () => { const a = queteActive(); if(a) a._qj = null; reussirDefi(); });
    if(!go || !ch) return;
    /* v1.87h — retour de l'autrice : on pouvait copier la ligne et la coller, ce qui
       gâchait la scène. La ligne n'est plus sélectionnable, et le champ refuse le
       collage et le glisser-déposer (42-U1F le remarque). Il faut taper. */
    const lgn = z.querySelector("#qj-imp-ligne");
    if(lgn){ ["copy","cut","contextmenu","selectstart","dragstart"].forEach(t => lgn.addEventListener(t, e => e.preventDefault())); }
    const refuse = e => { e.preventDefault(); if(!I.colleVu){ I.colleVu = true; sauvegarder(); } journal(d.colle || "Le champ refuse ce que tu essaies d'y coller.", "alerte"); };
    ch.addEventListener("paste", refuse); ch.addEventListener("drop", refuse);
    const perdre = () => { if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; } _seqFin(); I.tour++; I.ligne = _impLigne(18 + I.tour * 8); sauvegarder(); _qjRedessiner(z, d); };
    go.addEventListener("click", () => {
      if(_queteTimer) return;
      _seqAnim = Date.now();   // v1.86e : un redessin de l'onglet tuerait le minuteur
      const duree = Math.max(1800, 6000 - I.tour * 2500), debut = Date.now(), lg = z.querySelector("#qj-imp-ligne"), barre = z.querySelector("#qj-imp-barre");
      /* v1.87i — la ligne reste masquée (░) et le champ fermé tant qu'on n'a pas cliqué :
         avant, on la voyait d'avance et on croyait pouvoir la taper avant le départ. */
      if(lg){ lg.textContent = I.ligne; lg.style.opacity = "1"; }
      ch.disabled = false; ch.placeholder = "NAV::…"; ch.value = ""; ch.focus();
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

/* ===========================================================
   v1.87 — LOT 2 (Q21 → Q25) : quatre épreuves de plus, reprises des missions et
   jouées côté client. Mêmes règles que les précédentes : `_qjEtat` garde la
   partie dans la quête active ; un échec passe par echouerDefi (verrou 8 h).
   · tir       (Q21) éclater ce qui passe dans le conduit, coups comptés
   · reaction  (Q22) relancer les bornes d'un relais : la réaction en chaîne
   · goupilles (Q23) dégager à petits coups ; aussi le gisement de Sélénite
   · rangement (Q24) remettre les modules d'un automate dans son caisson
   =========================================================== */

/* ---------- Le tir (Q21) ---------- */
QUETES_JEUX.tir = {
  html(d){
    const T = _qjEtat(_qjCle(d), () => ({ phase:"pret" }));
    const cible = d.cible || 10, tirs = d.tirs || 16, duree = d.duree || 30;
    return `<div class="quete-etape">${_par(d.texte)}
      <p class="quete-indice">${d.consigne || "Touche ce qui passe avant que ça ne sorte de l'écran."} <b>${cible} à toucher, ${tirs} coups, ${duree} s.</b></p>
      <svg id="qj-tir" viewBox="0 0 300 180" style="width:100%;max-width:360px;background:#060b14;border:1px solid var(--line);border-radius:8px;touch-action:none;display:block"></svg>
      <p class="vide" id="qj-tir-etat">Touchés : 0 / ${cible} · Coups : ${tirs} · ${duree} s</p>
      ${T.phase === "pret" ? `<div class="quete-rep"><button class="mini" id="qj-tir-go">${d.bouton || "Commencer"}</button></div>` : ""}</div>`;
  },
  wire(z, d){
    const go = z.querySelector("#qj-tir-go"), svg = z.querySelector("#qj-tir"); if(!go || !svg) return;
    const cible = d.cible || 10, duree = d.duree || 30, coul = d.couleur || "#8fb8ff";
    go.addEventListener("click", () => {
      go.disabled = true;
      const t0 = performance.now();
      const P = { actif:true, touches:0, tirs:d.tirs || 16, fin:t0 + duree * 1000, objets:[], der:t0, pause:0 };
      _seqAnim = Date.now();                       // aucun redessin de l'onglet pendant la partie
      const finir = (gagne) => {
        if(!P.actif) return; P.actif = false; _seqFin();
        const a = queteActive(); if(a) a._qj = null;
        if(gagne){ journal(d.fini || "C'est dégagé.", "gain"); reussirDefi(); }
        else echouerDefi(d.echec || `Raté. Nouvelle tentative dans ${VERROU_DEFI_H} h.`);
      };
      const pas = t => {
        if(!P.actif) return;
        if(!document.body.contains(svg)){ P.actif = false; _seqFin(); const a = queteActive(); if(a) a._qj = null; return; }   // onglet quitté : on recommencera
        const dt = (t - P.der) / 1000; P.der = t;
        P.pause -= dt;
        if(P.pause <= 0){ P.pause = 0.55 + Math.random() * 0.55; P.objets.push({ x:-14, y:20 + Math.random() * 140, v:65 + Math.random() * 70, r:9 + Math.random() * 5 }); }
        P.objets.forEach(o => o.x += o.v * dt); P.objets = P.objets.filter(o => o.x < 318);
        svg.innerHTML = P.objets.map(o => `<circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${o.r.toFixed(1)}" fill="${coul}33" stroke="${coul}" stroke-width="2"/><circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="2.5" fill="${coul}"/>`).join("");
        const reste = Math.max(0, (P.fin - t) / 1000);
        const e = z.querySelector("#qj-tir-etat"); if(e) e.textContent = `Touchés : ${P.touches} / ${cible} · Coups : ${P.tirs} · ${Math.ceil(reste)} s`;
        if(reste <= 0) return finir(false);
        requestAnimationFrame(pas);
      };
      svg.addEventListener("pointerdown", ev => {
        if(!P.actif || P.tirs <= 0) return;
        const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * 300 / (r.width || 300), y = (ev.clientY - r.top) * 180 / (r.height || 180);
        P.tirs--;
        const k = P.objets.findIndex(o => Math.hypot(o.x - x, o.y - y) <= o.r + 4);
        if(k >= 0){ P.objets.splice(k, 1); P.touches++; }
        if(P.touches >= cible) finir(true);
        else if(P.tirs <= 0) finir(false);
      });
      QUETES_JEUX.tir._partie = P;                  // pour le banc d'essai
      requestAnimationFrame(pas);
    });
  }
};

/* ---------- Les goupilles (Q23, et le gisement de Sélénite) ----------
   Un curseur va et vient ; on « bloque » quand il passe dans le vert. La zone
   rétrécit et le curseur accélère à chaque goupille. Le moteur est partagé :
   `goupillesMoteur(zone, opts)` sert aussi au gisement (selenite.js). */
function _goupZoneQ(k, nb){ const w = 0.30 - k * (0.18 / Math.max(1, nb - 1)); return [0.5 - w / 2, 0.5 + w / 2]; }
/* ⚠ v1.89f — retour de l'autrice (Q23 ét. 2) : « un décalage entre le clic et l'image ».
   Trois causes, trois remèdes :
   1. Le coup était lu au CLIC, c.-à-d. au RELÂCHEMENT (~100 ms après l'appui, plus au
      doigt) : aux dernières goupilles, le curseur ne reste qu'~90 ms dans le vert. Le
      coup part désormais à l'APPUI (`pointerdown` ; Entrée et Espace au clavier).
   2. La position testée était celle de la dernière image : on la ramène à l'instant
      exact de l'appui (`avancer(performance.now())`).
   3. Le curseur fait 4 px de large : on accepte s'il TOUCHE le vert (tolérance GOUP_TOL).
   Vaut pour Q23 et pour le gisement de Sélénite (même moteur). */
const GOUP_TOL = 0.012;
function goupillesMoteur(zone, o){
  const nb = o.nb || 5;
  const G = { k:0, pos:0, sens:1, actif:true, raf:null };
  let der = performance.now();
  const vitesse = () => (o.vitesse || 0.55) + G.k * (o.accel || 0.16);
  const avancer = t => {
    const dt = Math.min(0.1, Math.max(0, (t - der) / 1000)); der = t;
    G.pos += G.sens * dt * vitesse();
    if(G.pos >= 1){ G.pos = 2 - G.pos; G.sens = -1; } if(G.pos <= 0){ G.pos = -G.pos; G.sens = 1; }
    G.pos = Math.max(0, Math.min(1, G.pos));
  };
  const dessiner = () => {
    const [a, b] = _goupZoneQ(G.k, nb);
    zone.innerHTML = `<p style="margin:6px 0"><b>${o.libelle || "Goupille"} ${G.k + 1} sur ${nb}.</b> ${o.aide || "Bloque quand le curseur passe dans le vert."}</p>
      <div class="mi-gp"><div class="mi-gp-zone" style="left:${a * 100}%;width:${(b - a) * 100}%"></div><div class="mi-gp-cur" data-gp-cur style="left:${G.pos * 100}%"></div></div>
      <div class="mi-btns"><button class="mini" data-gp-coup style="touch-action:manipulation">${o.bouton || "Bloquer"}</button></div>`;
    const bt = zone.querySelector("[data-gp-coup]");
    bt.addEventListener("pointerdown", e => { e.preventDefault(); coup(); });
    bt.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); coup(); } });
  };
  const arreter = () => { G.actif = false; if(G.raf) cancelAnimationFrame(G.raf); };
  const coup = () => {
    if(!G.actif) return;
    avancer(performance.now());          // la position à l'instant de l'appui, pas à la dernière image
    const [a, b] = _goupZoneQ(G.k, nb);
    if(G.pos >= a - GOUP_TOL && G.pos <= b + GOUP_TOL){
      G.k++;
      if(G.k >= nb){ arreter(); o.gagne && o.gagne(); return; }
      dessiner();
    } else {
      const encore = o.rate ? o.rate(G.k) : false;   // vrai = on recommence à zéro ; faux = c'est fini
      if(encore){ G.k = 0; dessiner(); } else arreter();
    }
  };
  const pas = t => {
    if(!G.actif) return;
    if(!document.body.contains(zone)){ G.actif = false; o.quitte && o.quitte(); return; }
    avancer(t);
    const c = zone.querySelector("[data-gp-cur]"); if(c) c.style.left = (G.pos * 100) + "%";
    G.raf = requestAnimationFrame(pas);
  };
  dessiner(); G.raf = requestAnimationFrame(pas);
  return { etat:G, coup, arreter };
}
QUETES_JEUX.goupilles = {
  html(d){
    return `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">${d.consigne || ""} ${d.felures ? `<b>${d.felures} fêlure${d.felures > 1 ? "s" : ""} et c'est fini pour aujourd'hui.</b>` : ""}</p>
      <div id="qj-goup"><div class="quete-rep"><button class="mini" id="qj-goup-go">${d.bouton || "Commencer"}</button></div></div></div>`;
  },
  wire(z, d){
    const go = z.querySelector("#qj-goup-go"), zone = z.querySelector("#qj-goup"); if(!go || !zone) return;
    go.addEventListener("click", () => {
      let felures = 0, fin = false;
      _seqAnim = Date.now();
      const m = goupillesMoteur(zone, {
        nb:d.nb || 6, libelle:d.libelle || "Coup", aide:d.aide, bouton:d.boutonCoup || "Frapper",
        gagne:() => { fin = true; _seqFin(); journal(d.fini || "C'est dégagé.", "gain"); reussirDefi(); },
        rate:() => {
          felures++;
          if(felures >= (d.felures || 2)){ fin = true; _seqFin(); echouerDefi(d.echec || `Raté. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return false; }
          journal(d.fele || "Une fêlure. Reprends depuis le début, plus doucement.", "alerte"); return true;
        },
        quitte:() => { if(!fin) _seqFin(); }
      });
      QUETES_JEUX.goupilles._partie = m;           // pour le banc d'essai
    });
  }
};

/* ---------- La réaction en chaîne (Q22) ----------
   Des bornes (carrés) sur une grille de points reliés par des pistes. Une
   impulsion allume tout ce qui lui est relié jusqu'à `portee` pistes de
   distance. Il faut allumer toutes les bornes avec `n` impulsions. Niveau tiré
   puis vérifié par force brute : au moins une solution à n, aucune à n − 1. */
function _reacVoisins(R){ const v = Array.from({ length:R.w * R.h }, () => []); R.pistes.forEach(([a, b]) => { v[a].push(b); v[b].push(a); }); return v; }
function _reacPortee(R, vois, s){
  const d = new Map([[s, 0]]), f = [s];
  while(f.length){ const i = f.shift(); if(d.get(i) >= R.portee) continue; for(const j of vois[i]) if(!d.has(j)){ d.set(j, d.get(i) + 1); f.push(j); } }
  return [...d.keys()];
}
function _reacAllume(R, impulsions){ const vois = _reacVoisins(R), s = new Set(); impulsions.forEach(i => _reacPortee(R, vois, i).forEach(x => s.add(x))); return s; }
function _reacSolutions(R, n, max){
  const N = R.w * R.h, vois = _reacVoisins(R), por = Array.from({ length:N }, (_, i) => new Set(_reacPortee(R, vois, i)));
  let compte = 0;
  const rec = (deb, choisis) => {
    if(compte >= max) return;
    if(choisis.length === n){ if(R.bornes.every(b => choisis.some(c => por[c].has(b)))) compte++; return; }
    for(let i = deb; i < N; i++){ choisis.push(i); rec(i + 1, choisis); choisis.pop(); if(compte >= max) return; }
  };
  rec(0, []); return compte;
}
function reacGenerer(w, h, n, nb, portee, maxSol){
  for(let essai = 0; essai < 400; essai++){
    // Arbre couvrant au hasard sur la grille, plus quelques pistes de traverse.
    const N = w * h, pistes = [], vu = new Set([Math.floor(Math.random() * N)]), front = [...vu];
    while(vu.size < N){
      const i = front[Math.floor(Math.random() * front.length)], x = i % w, y = Math.floor(i / w);
      const cand = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a, b]) => a >= 0 && b >= 0 && a < w && b < h && !vu.has(b * w + a));
      if(!cand.length){ front.splice(front.indexOf(i), 1); continue; }
      const [a, b] = cand[Math.floor(Math.random() * cand.length)], j = b * w + a; pistes.push([i, j]); vu.add(j); front.push(j);
    }
    for(let k = 0; k < Math.round(N / 10); k++){ const i = Math.floor(Math.random() * N), x = i % w, y = Math.floor(i / w);
      if(x + 1 < w && !pistes.some(([p, q]) => (p === i && q === i + 1) || (q === i && p === i + 1))) pistes.push([i, i + 1]); }
    const R = { w, h, pistes, portee, n, bornes:[] };
    // Les bornes : au bout de la portée de n impulsions tirées au hasard, aussi loin que possible.
    const vois = _reacVoisins(R), graines = []; while(graines.length < n){ const g = Math.floor(Math.random() * N); if(!graines.includes(g)) graines.push(g); }
    const bornes = new Set();
    graines.forEach(g => { const d = new Map([[g, 0]]), f = [g];
      while(f.length){ const i = f.shift(); if(d.get(i) >= portee) continue; for(const j of vois[i]) if(!d.has(j)){ d.set(j, d.get(i) + 1); f.push(j); } }
      const loin = [...d.entries()].filter(([, v]) => v >= portee - 1).map(([k]) => k).sort(() => Math.random() - .5);
      loin.slice(0, Math.ceil(nb / n)).forEach(b => bornes.add(b)); });
    R.bornes = [...bornes];
    if(R.bornes.length < nb - 1) continue;
    /* Réglage (banc o_lot2) : 7 × 5, 8 bornes, portée 2, 3 impulsions, au plus 20
       solutions sur ~6 500 combinaisons → un niveau sur trois passe ; jamais faisable à 2. */
    const sol = _reacSolutions(R, n, (maxSol || 20) + 1);
    if(sol < 1 || sol > (maxSol || 20)) continue;  // trop de solutions = trop facile
    if(n > 1 && _reacSolutions(R, n - 1, 1) > 0) continue;   // faisable avec moins : pas assez dur
    return R;
  }
  return null;
}
QUETES_JEUX.reaction = {
  _etat(d){ return _qjEtat(_qjCle(d), () => ({ R:reacGenerer(d.colonnes || 7, d.lignes || 5, d.impulsions || 3, d.bornes || 8, d.portee || 2, d.solutionsMax || 20), choix:[], essais:0, dernier:null })); },
  html(d){
    const S = this._etat(d), R = S.R;
    if(!R) return `<div class="quete-etape"><p class="vide">Le boîtier ne répond pas. Reviens plus tard.</p></div>`;
    const pas = 52, X = i => 30 + (i % R.w) * pas, Y = i => 30 + Math.floor(i / R.w) * pas;
    const allume = S.dernier ? new Set(S.dernier) : null;
    let svg = R.pistes.map(([a, b]) => `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="#c98a3a" stroke-width="4" stroke-linecap="round"/>`).join("");
    for(let i = 0; i < R.w * R.h; i++){
      const borne = R.bornes.includes(i), imp = S.choix.includes(i), lu = allume && allume.has(i);
      svg += `<g data-reac="${i}" style="cursor:pointer"><circle cx="${X(i)}" cy="${Y(i)}" r="18" fill="transparent"/>`
        + (borne ? `<rect x="${X(i) - 10}" y="${Y(i) - 10}" width="20" height="20" fill="${lu ? "#7bc47f" : "#cfd6df"}" stroke="#0b1220" stroke-width="2"/>` : `<circle cx="${X(i)}" cy="${Y(i)}" r="5" fill="${lu ? "#7bc47f" : "#8a8f96"}"/>`)
        + (imp ? `<circle cx="${X(i)}" cy="${Y(i)}" r="13" fill="none" stroke="#ffb060" stroke-width="4"/>` : "") + `</g>`;
    }
    const reste = (d.essais || 2) - S.essais;
    return `<div class="quete-etape">${_par(d.texte)}
      <p class="quete-indice">${d.consigne || ""} <b>Impulsions : ${R.n - S.choix.length} / ${R.n}.</b> ${reste} essai${reste > 1 ? "s" : ""} avant que le cuivre ne chauffe trop.</p>
      <svg viewBox="0 0 ${60 + (R.w - 1) * pas} ${60 + (R.h - 1) * pas}" style="width:100%;max-width:380px;background:rgba(40,20,10,.35);border:1px solid var(--line);border-radius:8px;display:block">${svg}</svg>
      <p class="vide" style="margin:4px 0">${d.aide || `Une impulsion allume ce qui lui est relié par les pistes, jusqu'à ${R.portee} de distance. Les carrés sont les bornes : il faut toutes les allumer.`}${allume ? " <b>Vert : ce qu'a allumé ton dernier essai.</b>" : ""}</p>
      <div class="quete-rep"><button class="mini" id="qj-reac-go" ${S.choix.length ? "" : "disabled"}>${d.bouton || "Lancer"}</button></div></div>`;
  },
  wire(z, d){
    const S = this._etat(d), R = S.R; if(!R) return;
    z.querySelectorAll("[data-reac]").forEach(g => g.addEventListener("click", () => {
      const i = +g.dataset.reac, k = S.choix.indexOf(i);
      if(k >= 0) S.choix.splice(k, 1); else if(S.choix.length < R.n) S.choix.push(i);
      _qjRedessiner(z, d);
    }));
    const go = z.querySelector("#qj-reac-go");
    if(go) go.addEventListener("click", () => {
      if(go.disabled) return; go.disabled = true;
      const lu = _reacAllume(R, S.choix);
      if(R.bornes.every(b => lu.has(b))){ const a = queteActive(); if(a) a._qj = null; journal(d.fini || "Toutes les bornes sont allumées.", "gain"); reussirDefi(); return; }
      S.essais++; S.dernier = [...lu];
      if(S.essais >= (d.essais || 2)){ const a = queteActive(); if(a) a._qj = null; echouerDefi(d.echec || `Raté. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
      journal(`${R.bornes.filter(b => lu.has(b)).length} borne(s) sur ${R.bornes.length} allumée(s). Il en manque.`, "alerte");
      S.choix = []; sauvegarder(); _qjRedessiner(z, d);
    });
  }
};

/* ---------- Le rangement (Q24) ----------
   Les modules d'un automate : une grille découpée au hasard en pièces, que le
   joueur doit tout remettre dans le caisson. Comme la découpe remplit la grille,
   « tout est posé » = « rien ne ballotte ». Pas ratable : c'est un casse-tête. */
function _rgCellules(piece, r){
  let c = piece.map(([x, y]) => [x, y]);
  for(let k = 0; k < (r || 0); k++) c = c.map(([x, y]) => [-y, x]);
  const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1]));
  return c.map(([x, y]) => [x - mx, y - my]);
}
function rangementGenerer(w, h, tmin, tmax){
  for(let essai = 0; essai < 200; essai++){
    const prop = Array(w * h).fill(-1), pieces = []; let ok = true;
    for(let i = 0; i < w * h && ok; i++){
      if(prop[i] >= 0) continue;
      const k = pieces.length, cible = tmin + Math.floor(Math.random() * (tmax - tmin + 1)), cel = [i]; prop[i] = k;
      while(cel.length < cible){
        const front = []; cel.forEach(c => { const x = c % w, y = Math.floor(c / w);
          [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([a, b]) => { if(a >= 0 && b >= 0 && a < w && b < h && prop[b * w + a] < 0) front.push(b * w + a); }); });
        if(!front.length) break;
        const n = front[Math.floor(Math.random() * front.length)]; prop[n] = k; cel.push(n);
      }
      if(cel.length < 2){ ok = false; break; }   // un module d'une case : on recommence
      pieces.push(cel.map(c => [c % w, Math.floor(c / w)]));
    }
    if(!ok || pieces.length < 6) continue;
    // Présentées tournées au hasard, dans le désordre.
    const p2 = pieces.map(p => _rgCellules(p, Math.floor(Math.random() * 4))).sort(() => Math.random() - .5);
    return { w, h, pieces:p2, pose:[], sel:0, rot:0 };
  }
  return null;
}
/* La case d'ancrage d'un module : sa première case en lisant de gauche à droite et de
   haut en bas. On pose un module en touchant la case où ira SA case d'ancrage : ainsi la
   case touchée est toujours une case qu'il occupera (un coin de cadre vide pouvait
   tomber sur un module voisin, et le clic le retirait au lieu de poser). */
function _rgAncre(cel){ return cel.slice().sort((u, v) => u[1] - v[1] || u[0] - v[0])[0]; }
function _rgOccupation(R){ const occ = {}; R.pose.forEach((p, k) => _rgCellules(R.pieces[p.p], p.r).forEach(([x, y]) => { occ[(p.y + y) * R.w + (p.x + x)] = k; })); return occ; }
QUETES_JEUX.rangement = {
  _etat(d){ return _qjEtat(_qjCle(d), () => ({ R:rangementGenerer(d.colonnes || 6, d.lignes || 5, d.min || 3, d.max || 6) })); },
  html(d){
    const R = this._etat(d).R; if(!R) return `<div class="quete-etape"><p class="vide">Le caisson est coincé. Reviens plus tard.</p></div>`;
    const occ = _rgOccupation(R), poses = new Set(R.pose.map(p => p.p)), coul = k => `hsl(${(k * 53 + 20) % 360} 45% 52%)`;
    const pct = Math.round(Object.keys(occ).length / (R.w * R.h) * 100);
    let h = `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">${d.consigne || ""}</p>
      <div class="mi-rg-grille" style="grid-template-columns:repeat(${R.w},1fr)">`;
    for(let i = 0; i < R.w * R.h; i++){ const k = occ[i]; h += `<div class="mi-rg-case" data-qrg-case="${i}"${k != null ? ` style="background:${coul(R.pose[k].p)}"` : ""}></div>`; }
    h += `</div><p class="vide" style="margin:4px 0">Rempli : ${pct} %. Choisis un module, tourne-le, puis touche la case où poser sa case marquée d'un point ; touche un module posé pour le reprendre.</p><div class="mi-rg-pieces">`;
    R.pieces.forEach((pc, k) => {
      if(poses.has(k)) return;
      const c = _rgCellules(pc, k === R.sel ? R.rot : 0), w = Math.max(...c.map(p => p[0])) + 1, hh = Math.max(...c.map(p => p[1])) + 1, an = _rgAncre(c);
      h += `<button class="mi-rg-piece${k === R.sel ? " actif" : ""}" data-qrg-piece="${k}" style="grid-template-columns:repeat(${w},12px);grid-template-rows:repeat(${hh},12px)">`
         + c.map(([x, y]) => `<span style="grid-column:${x + 1};grid-row:${y + 1};background:${coul(k)}${x === an[0] && y === an[1] ? ";box-shadow:inset 0 0 0 3px #0b1220" : ""}"></span>`).join("") + `</button>`;
    });
    return h + `</div><div class="mi-btns"><button class="mini" id="qj-rg-tourner">Tourner</button></div></div>`;
  },
  wire(z, d){
    const R = this._etat(d).R; if(!R) return;
    z.querySelectorAll("[data-qrg-piece]").forEach(b => b.addEventListener("click", () => { R.sel = +b.dataset.qrgPiece; R.rot = 0; _qjRedessiner(z, d); }));
    const bt = z.querySelector("#qj-rg-tourner"); if(bt) bt.addEventListener("click", () => { R.rot = (R.rot + 1) % 4; _qjRedessiner(z, d); });
    z.querySelectorAll("[data-qrg-case]").forEach(c => c.addEventListener("click", () => {
      const i = +c.dataset.qrgCase, occ = _rgOccupation(R);
      if(occ[i] != null){ R.pose.splice(occ[i], 1); _qjRedessiner(z, d); return; }
      if(R.pose.some(p => p.p === R.sel)) return;
      const cel = _rgCellules(R.pieces[R.sel], R.rot), an = _rgAncre(cel), x = i % R.w - an[0], y = Math.floor(i / R.w) - an[1];
      if(cel.some(([a, b]) => x + a < 0 || y + b < 0 || x + a >= R.w || y + b >= R.h || occ[(y + b) * R.w + (x + a)] != null)){ journal(d.bute || "Ça ne rentre pas là.", "alerte"); return; }
      R.pose.push({ p:R.sel, r:R.rot, x, y });
      if(R.pose.length === R.pieces.length){ const a = queteActive(); if(a) a._qj = null; journal(d.fini || "Tout est rangé.", "gain"); reussirDefi(); return; }
      const libre = R.pieces.findIndex((_, k) => !R.pose.some(p => p.p === k)); if(libre >= 0){ R.sel = libre; R.rot = 0; }
      sauvegarder(); _qjRedessiner(z, d);
    }));
  }
};

/* ---------- Le brouillage (Q29) — porté des missions (H64, missions.js) ----------
   v1.93 — Caler son onde sur celle de l'appel, avant la fin de l'appel (`duree` s).
   v1.93k — RETOUR DE JEU (l'autrice : « impossible, il faut bouger les deux à la fois ») :
   · la FRÉQUENCE de l'appel est FIXE (tirée au début, 1,2 → 2,4) ; dès que le joueur l'a
     trouvée (± 0,12), son curseur se cale dessus et se verrouille : on la règle UNE fois ;
   · seul le DÉCALAGE dérive (0,35 rad/s, comme les missions) : on le suit (± 0,45 rad) ;
   · les secondes calées se CUMULENT (elles ne retombent plus à zéro) : `tenir` s au total.
   Le brouillage des missions (missions.js) n'est pas touché. Ratable (DEFIS_UNTRY) :
   l'appel fini, verrou de 8 h. Redessin de l'onglet suspendu pendant la partie (_seqAnim). */
function _brouOnde(fr, ph){ let p = ""; for(let x = 0; x <= 300; x += 6){ const y = 50 + 35 * Math.sin(x / 300 * Math.PI * 2 * fr + ph); p += (x ? " L" : "M") + x + " " + y.toFixed(1); } return p; }
function _brouDecalage(s){ return (s * 0.35) % (2 * Math.PI); }
function _brouPhaseOk(d, cd){ return Math.abs(((d - cd) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) < 0.45; }
QUETES_JEUX.brouillage = {
  html(d){
    const T = d.tenir || 6, D = d.duree || 60;
    return `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">${d.consigne || ""} <b>${D} s d'appel, ${T} s calé en tout.</b></p>
      <div id="qj-brou">
        <svg id="qj-br-svg" viewBox="0 0 300 100" style="width:100%;max-width:340px;background:rgba(90,168,230,.06);border:1px solid var(--line);border-radius:8px">
          <path id="qj-br-appel" stroke="#ff5257" stroke-width="3" fill="none"/><path id="qj-br-moi" stroke="#7bc47f" stroke-width="3" fill="none"/></svg>
        <div class="mi-ligne"><span>Fréquence</span><input type="range" id="qj-br-f" min="0.5" max="3" step="0.01" value="0.6" disabled></div>
        <p class="vide" id="qj-br-fetat" style="margin:2px 0 6px">Fréquence : à caler.</p>
        <div class="mi-ligne"><span>Décalage</span><input type="range" id="qj-br-d" min="0" max="6.28" step="0.01" value="0" disabled></div>
        <p class="vide" id="qj-br-etat">Calé : 0,0 s / ${T} s · appel : ${D} s</p>
        <div class="quete-rep"><button class="mini" id="qj-br-go">${d.bouton || "Commencer l'émission"}</button></div>
      </div></div>`;
  },
  wire(z, d){
    const go = z.querySelector("#qj-br-go"); if(!go) return;
    const T = d.tenir || 6, D = d.duree || 60;
    const f = z.querySelector("#qj-br-f"), dd = z.querySelector("#qj-br-d"), svg = z.querySelector("#qj-br-svg");
    const appel = z.querySelector("#qj-br-appel"), moi = z.querySelector("#qj-br-moi");
    const et = z.querySelector("#qj-br-etat"), fet = z.querySelector("#qj-br-fetat");
    const fc = Math.round((1.2 + Math.random() * 1.2) * 100) / 100;      // la fréquence de l'appel : FIXE
    const P = { f:+f.value, d:0, tenu:0, s:0, fini:false, fc, fCalee:false, cible:{ f:fc, d:0 } };
    QUETES_JEUX.brouillage._partie = P;            // pour le banc d'essai
    const caler = () => {                           // trouvée une fois = verrouillée
      if(P.fCalee || Math.abs(P.f - P.fc) >= 0.12) return;
      P.fCalee = true; P.f = P.fc; f.value = String(P.fc); f.disabled = true;
      fet.textContent = "Fréquence calée ✓ — elle ne bougera plus. Suis le décalage.";
    };
    f.addEventListener("input", () => { P.f = +f.value; caler(); });
    dd.addEventListener("input", () => { P.d = +dd.value; });
    P.regler = (fr, dc) => { if(fr != null && !P.fCalee){ P.f = fr; f.value = String(fr); caler(); } if(dc != null){ P.d = dc; dd.value = String(dc); } };   // banc
    const dessiner = () => { appel.setAttribute("d", _brouOnde(P.fc, P.cible.d)); moi.setAttribute("d", _brouOnde(P.f, P.d)); };
    dessiner();
    go.addEventListener("click", () => {
      go.disabled = true; f.disabled = false; dd.disabled = false;
      const t0 = Date.now(); let der = t0;
      const pas = () => {
        if(P.fini) return;
        if(!document.body.contains(svg)){ P.fini = true; _seqFin(); return; }   // l'onglet a changé : la partie s'arrête
        const t = Date.now(), dt = (t - der) / 1000; der = t; P.s = (t - t0) / 1000;
        _seqAnim = t;
        P.cible = { f:P.fc, d:_brouDecalage(P.s) };
        if(P.fCalee && _brouPhaseOk(P.d, P.cible.d)) P.tenu += dt;     // v1.93k : cumulé, jamais remis à zéro
        dessiner();
        et.textContent = `Calé : ${P.tenu.toFixed(1).replace(".", ",")} s / ${T} s · appel : ${Math.max(0, D - P.s).toFixed(0)} s`;
        if(P.tenu >= T){ P.fini = true; _seqFin(); journal(d.fini || "C'est passé.", "gain"); reussirDefi(); return; }
        if(P.s >= D){ P.fini = true; _seqFin(); echouerDefi(d.echec || `L'appel est fini. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
        const id = setTimeout(pas, 40); if(typeof _queteTO !== "undefined") _queteTO.push(id);
      };
      pas();
    });
  }
};
