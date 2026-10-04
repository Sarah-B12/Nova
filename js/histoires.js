/* ===========================================================
   v1.41 — LES PETITES HISTOIRES DE FAMILLE (enfants, brique 4).
   Cadrage : PASSATION partie D, E5 ; lots 1 et 2 validés le 04/10.
   Serveur (v165) : enfant_histoires, histoire_agir(p_etape, p_val, p_x, p_y),
   `union.enfant.histoire` = {n, etape, debut, fin, resultat, etape1_moi,
   etape1_fait, etape_jour, textes, par, paire, point}.
   Ce fichier : les TEXTES, l'affichage dans Couple > Famille et les cinq
   mini-jeux (Recoller, Le toit, Le signal, Les indices, Le four), pensés
   pour la souris ET le doigt. Le serveur vérifie tout sauf l'issue d'un
   mini-jeu (déclarée par le client, comme les quêtes).
   =========================================================== */

/* [X] = prénom de l'enfant ; [nom] = le texte écrit à l'étape 1. */
const HISTOIRES = {
  1: { titre:"Le jouet cassé", domaine:"bricoleur",
       ouverture:"[X] arrive en larmes : son petit robot de ferraille a perdu un bras, une roue et le sourire.",
       etapes:["De quoi lui refaire un bras.", "Le bras, la roue, la tête : chaque pièce a un sens.", "Un robot réparé mérite un nom."],
       jeu:"recoller",
       reussite:"Le robot remarche. De travers, mais il remarche. [X] ne le lâche plus.",
       echec:"Le robot est resté dans un coin. [X] a fini par ne plus en parler." },
  2: { titre:"La cabane", domaine:"bricoleur",
       ouverture:"[X] veut une cabane. Pas une maison : une cabane. Avec un toit qui fuit, c'est important.",
       etapes:["Des planches, et des bonnes.", "Le toit, maintenant. Une planche après l'autre.", "Une première nuit dans la cabane. Quelqu'un doit rester pour la lampe."],
       jeu:"toit",
       reussite:"La cabane tient debout. Le toit fuit, comme prévu. [X] y a dormi toute la nuit, fier comme tout.",
       echec:"Les planches attendent toujours au fond du terrain." },
  3: { titre:"La lumière au loin", domaine:"eclaireur",
       ouverture:"Chaque soir, [X] colle son nez à la vitre : là-bas, au loin, une petite lumière clignote.",
       etapes:["Aller voir de près. Une lanterne de chantier oubliée, la pile presque morte.", "Lui rendre sa lumière.", "[X] veut apprendre à lui répondre."],
       jeu:"signal",
       reussite:"La lanterne brille de nouveau, sur le rebord de la fenêtre. [X] dit qu'elle est à lui, maintenant.",
       echec:"Une nuit, la lumière s'est éteinte. Personne n'est allé voir pourquoi." },
  4: { titre:"La carte au trésor", domaine:"eclaireur",
       ouverture:"[X] a dessiné une carte au trésor. Une croix, trois flèches et beaucoup d'assurance.",
       etapes:["Déchiffrer le dessin : entre quels endroits est la croix ?", "Creuser sous la croix.", "Il n'y avait rien. Il faut qu'il y ait quelque chose."],
       jeu:"indices",
       reussite:"Sous la croix, un lingot. [X] jure qu'il était déjà là. Vous ne direz rien.",
       echec:"La carte est restée punaisée au mur. La croix attend toujours." },
  5: { titre:"Le gâteau", domaine:"cuistot",
       ouverture:"[X] n'a jamais goûté de gâteau. Paraît que ça existe, quelque part.",
       etapes:["De quoi faire une pâte qui tienne.", "Le four de la maison a son caractère : ni trop, ni trop peu.", "Ce qu'on écrit sur le gâteau."],
       jeu:"four",
       reussite:"Le gâteau penche, la crème a coulé. [X] a soufflé fort, deux fois. Meilleur anniversaire de tout Maar.",
       echec:"Pas de gâteau cette fois. [X] a dit que ce n'était pas grave." },
  6: { titre:"La soupe du soir", domaine:"cuistot",
       ouverture:"[X] refuse la soupe. Toutes les soupes. Par principe.",
       etapes:["Lui trouver un nom qui donne envie.", "Il faut quand même quelque chose dedans.", "La servir à l'heure du dîner."],
       reussite:"« [nom] » : [X] a tout fini, et en a redemandé.",
       echec:"La soupe a refroidi. [X] a mangé du pain." },
  // v1.42 — lot 3 (validé le 04/10)
  7: { titre:"La fièvre", domaine:"soigneur",
       ouverture:"[X] a de la fièvre. Les joues rouges, les yeux qui brillent, et pas envie de jouer.",
       etapes:["De quoi soigner.", "Le front, le cou, les poignets : qu'aucune compresse ne chauffe.", "Veiller jusqu'à ce que la fièvre tombe."],
       jeu:"compresses",
       reussite:"Au matin, la fièvre est tombée. [X] réclame une tartine. C'est bon signe.",
       echec:"La fièvre est passée toute seule, au bout de quelques jours. [X] se souvient surtout qu'on n'était pas là." },
  8: { titre:"La bête blessée", domaine:"soigneur",
       ouverture:"[X] a trouvé un petit cuprin blessé à la patte, derrière la maison. Il faut le soigner. Évidemment.",
       etapes:["Pour l'attelle.", "S'approcher sans l'effrayer : seulement quand il ne regarde pas.", "Le relâcher là où [X] l'a trouvé."],
       jeu:"apprivoiser",
       reussite:"Le cuprin est reparti en boitant un peu. [X] lui a fait promettre de revenir.",
       echec:"Le cuprin s'est enfui pendant la nuit, attelle comprise. [X] scrute encore le bout du terrain." },
  9: { titre:"La maquette", domaine:"mecano",
       ouverture:"[X] construit une maquette de vaisseau avec tout ce qui traîne. Elle ne volera pas. [X] voudrait qu'elle vole.",
       etapes:["Pour la coque.", "Chaque fil à sa borne.", "Le nom de la maquette."],
       jeu:"cablage",
       reussite:"« [nom] » ne vole pas. Mais elle a fait un très beau saut du haut de l'escalier.",
       echec:"La maquette prend la poussière sur une étagère, une aile en moins." },
  // v1.43 — lot 4 (validé le 04/10, étapes 3 de 10 et 12 corrigées par l'autrice)
  10: { titre:"Le premier vol", domaine:"mecano",
       ouverture:"[X] n'a jamais quitté le sol. Ce soir, ça change.",
       etapes:["Le plein, d'abord.", "[X] lit la check-list à voix haute. Dans l'ordre, s'il vous plaît.", "Inventer le nom d'une planète."],
       jeu:"checklist",
       reussite:"« [nom] », a décidé [X] en montrant une étoile au hasard. Puis plus un mot jusqu'à l'atterrissage.",
       echec:"Le vaisseau est resté au sol. [X] fait encore « vroum » en courant dans la cour." },
  11: { titre:"Le bruit dans la nuit", domaine:"gardien",
       ouverture:"Chaque nuit, [X] entend un bruit sous la fenêtre. Personne d'autre ne l'entend.",
       etapes:["Monter la garde sous la fenêtre.", "Écouter, dans le noir. D'où vient le bruit ?", "Huiler le volet qui grince. C'était lui."],
       jeu:"ecoute",
       reussite:"Le volet ne grince plus. [X] dort, et monte la garde en rêve.",
       echec:"[X] dort la lumière allumée, maintenant." },
  12: { titre:"L'anneau", domaine:"gardien",
       ouverture:"[X] demande pourquoi le trait violet, à l'horizon, ne s'éteint jamais. Et a décidé d'aller voir.",
       etapes:["Rattraper [X] avant le rempart.", "Compter les lampes de la crête, comme [X] le fait chaque soir.", "Raconter ce qu'il y a derrière le mur."],
       jeu:"balises",
       reussite:"[X] compte les lampes chaque soir, maintenant, depuis la fenêtre. De loin. C'est mieux de loin.",
       echec:"[X] n'en parle plus. Mais regarde encore le trait violet, le soir." }
};
// Même ordre que _histoire_def (serveur) : le type de chaque étape.
const HISTOIRES_ETAPES = {
  1:[{t:"apporter",item:"fab_composant_simple",qte:1},{t:"jeu"},{t:"ecrire"}],
  2:[{t:"apporter",item:"fab_panneau_de_sylve",qte:2},{t:"jeu"},{t:"soir"}],
  3:[{t:"aller"},{t:"apporter",item:"fab_cellule_d_energie",qte:1},{t:"jeu"}],
  4:[{t:"jeu"},{t:"aller"},{t:"apporter",item:"fab_lingot_de_voltane",qte:1}],
  5:[{t:"apporter",item:"proteines",qte:2},{t:"jeu"},{t:"ecrire"}],
  6:[{t:"ecrire"},{t:"apporter",item:"ferragave",qte:1},{t:"soir"}],
  7:[{t:"apporter",item:"fab_kit_de_soin",qte:1},{t:"jeu"},{t:"soir"}],
  8:[{t:"apporter",item:"fab_fil",qte:1},{t:"jeu"},{t:"aller"}],
  9:[{t:"apporter",item:"fab_lingot_de_silite",qte:1},{t:"jeu"},{t:"ecrire"}],
  10:[{t:"apporter",item:"fab_biocarburant",qte:1},{t:"jeu"},{t:"ecrire"}],
  11:[{t:"soir"},{t:"jeu"},{t:"apporter",item:"fab_biogel",qte:1}],
  12:[{t:"aller"},{t:"jeu"},{t:"ecrire",max:200}]
};
const NOMS_JEUX = { recoller:"Recoller", toit:"Le toit", signal:"Le signal", indices:"Les indices", four:"Le four",
  compresses:"Les compresses", apprivoiser:"Apprivoiser", cablage:"Le câblage",
  checklist:"La check-list", ecoute:"L'écoute", balises:"Les balises" };
// « La carte au trésor » : les cités dans les mots d'un enfant.
const INDICES_CITES = { ignis:"la montagne qui fume", cultivateurs:"les arbres plus hauts que la maison",
  nomades:"les tentes qui ne restent jamais au même endroit", toundra:"la glace qui craque la nuit", rouage:"les tas de ferraille rouillée" };
const HIST_REFUS = { pas_histoire:"L'histoire est finie (ou son délai est passé).", etape:"Cette étape a déjà été faite.",
  autre:"Cette étape revient à ta moitié.", texte:"Texte trop court ou trop long.", pas_le_soir:"Seulement le soir, entre 20 h et minuit (heure de Paris).",
  autre_jour:"Pas le même jour que l'étape précédente : reviens un autre soir.", ailleurs:"Il faut être sur la carte de Silène.",
  loin:"Ce n'est pas ici : rapproche-toi du point.", gele:"Tout est figé : l'un de vous est en pause ou au Couloir." };

let _histJeuEnCours = false;      // la relecture de 45 s (couple.js) ne redessine pas pendant un mini-jeu
function _hX(t, e, h){ const tx = h.textes || {}; return String(t || "").replace(/\[X\]/g, e.prenom || "?").replace(/\[nom\]/g, tx["1"] || tx["2"] || tx["3"] || "?"); }
function _heureParis(){ try{ return Number(new Intl.DateTimeFormat("fr-FR", { timeZone:"Europe/Paris", hour:"numeric", hourCycle:"h23" }).format(new Date())); }catch(err){ return new Date().getHours(); } }
function _joursEntre(a, b){ return Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 86400000); }

/* ---------- Affichage dans Famille ---------- */
function _blocHistoire(e, u){
  const h = e.histoire, H = HISTOIRES[h.n]; if(!H) return "";
  let s = `<div class="hi-carte"><h4>Histoire : ${H.titre} <span class="qte">${VOCATIONS[H.domaine] || ""}</span></h4>
    <p class="hi-ouv"><i>${echapper(_hX(H.ouverture, e, h))}</i></p>`;
  if(h.resultat === "reussie") return s + `<p class="hi-fin ok">${echapper(_hX(H.reussite, e, h))}</p><p class="itip-gris">Réussie : Complicité +10, bien-être +20, une leçon.</p></div>`;
  if(h.resultat === "ratee")   return s + `<p class="hi-fin ko">${echapper(_hX(H.echec, e, h))}</p></div>`;
  const reste = Math.max(0, _joursEntre(e.aujourdhui || h.debut, h.fin) + 1);
  s += `<p class="itip-gris">Encore ${_jours(reste)} (dernier jour : ${_uDate(h.fin)}). Étape 1 : l'un de vous ; étape 2 : forcément l'autre ; étape 3 : l'un ou l'autre.</p><ol class="hi-etapes">`;
  const E = HISTOIRES_ETAPES[h.n] || [];
  E.forEach((st, i) => {
    const n = i + 1, fait = n < h.etape, cour = n === h.etape;
    const qui = h.par && h.par[String(n)] ? (h.par[String(n)] === u.conjoint ? echapper(u.nom || "ta moitié") : "toi") : "";
    let ligne = `<b>${_libEtape(st, h)}</b> — ${echapper(_hX(H.etapes[i], e, h))}`;
    if(fait) ligne += ` <span class="co-fait">✓ ${qui}</span>`;
    if(fait && st.t === "ecrire" && h.textes && h.textes[String(n)]) ligne += ` <span class="hi-texte">« ${echapper(h.textes[String(n)])} »</span>`;
    s += `<li class="${fait ? "fait" : cour ? "courante" : "avenir"}">${ligne}${cour ? _actionEtape(st, n, e, u, h) : ""}</li>`;
  });
  return s + `</ol><div id="hi-jeu"></div></div>`;
}
function _libEtape(st, h){
  if(st.t === "apporter") return `Apporter ${st.qte}× ${echapper(_uNom(st.item))}`;
  if(st.t === "aller") return h.point ? `Se rendre en (${h.point.x}, ${h.point.y})` : "Se rendre sous la croix";
  if(st.t === "jeu") return `Jeu : ${NOMS_JEUX[HISTOIRES[h.n].jeu] || "?"}`;
  if(st.t === "ecrire") return "Écrire";
  if(st.t === "soir") return "Le soir";
  return "?";
}
function _actionEtape(st, n, e, u, h){
  if(e.gele) return `<div class="itip-gris">Tout est figé : l'un de vous est en pause ou au Couloir.</div>`;
  if(n === 2 && h.etape1_moi) return `<div class="itip-gris">Cette étape revient à ${echapper(u.nom || "ta moitié")}.</div>`;
  let a = `<div class="hi-action">`;
  if(st.t === "apporter"){
    const j = (etat.sac && etat.sac[st.item]) || 0;
    a += `<button class="mini" data-hist="${n}"${j >= st.qte ? "" : " disabled"}>Donner (tu en as ${j})</button>`;
  } else if(st.t === "aller"){
    const p = _posSilene(), pt = h.point;
    const d = (p && pt) ? Math.round(Math.hypot(p.x - pt.x, p.y - pt.y)) : null;
    a += `<button class="mini" data-hist="${n}"${d != null && d <= 80 ? "" : " disabled"}>J'y suis</button>
      <span class="itip-gris">${!p ? "Tu n'es pas sur la carte de Silène." : d <= 80 ? "Tu y es." : `Tu es à ${d} u.`}</span>`;
  } else if(st.t === "jeu"){
    a += `<button class="mini" data-hist-jeu="${n}">Jouer</button>`;
  } else if(st.t === "ecrire"){
    const mx = st.max || 40;
    a += mx > 40 ? `<textarea id="hi-texte" maxlength="${mx}" rows="3" placeholder="2 à ${mx} caractères"></textarea><button class="mini" data-hist="${n}">Raconter</button>`
                 : `<input type="text" id="hi-texte" maxlength="${mx}" placeholder="2 à ${mx} caractères"><button class="mini" data-hist="${n}">Écrire</button>`;
  } else if(st.t === "soir"){
    const ok = _heureParis() >= 20 && !(h.etape_jour && h.etape_jour >= e.aujourdhui);
    a += `<button class="mini" data-hist="${n}"${ok ? "" : " disabled"}>C'est le soir</button>
      <span class="itip-gris">Entre 20 h et minuit (heure de Paris), un autre jour que l'étape précédente.</span>`;
  }
  return a + `</div>`;
}
function _brancherHistoire(c, e, u){
  const h = e && e.histoire; if(!h || h.resultat) return;
  c.querySelectorAll("[data-hist]").forEach(b => b.addEventListener("click", () => {
    const n = Number(b.dataset.hist), st = (HISTOIRES_ETAPES[h.n] || [])[n - 1] || {};
    const args = { p_etape:n };
    if(st.t === "ecrire"){ const t = (c.querySelector("#hi-texte") || {}).value || ""; if(t.trim().length < 2 || t.trim().length > (st.max || 40)){ _jc(`Entre 2 et ${st.max || 40} caractères.`, "alerte"); return; } args.p_val = t.trim(); }
    if(st.t === "aller"){ const p = _posSilene(); if(!p){ _jc(HIST_REFUS.ailleurs, "alerte"); return; } args.p_x = Math.round(p.x); args.p_y = Math.round(p.y); }
    _histFaire(args, st, b);
  }));
  const bj = c.querySelector("[data-hist-jeu]");
  if(bj) bj.addEventListener("click", () => {
    const n = Number(bj.dataset.histJeu), z = c.querySelector("#hi-jeu"); if(!z) return;
    bj.disabled = true;
    _lancerJeu(HISTOIRES[h.n].jeu, z, h, ok => {
      if(ok) _histFaire({ p_etape:n }, { t:"jeu" }, null);
      else { bj.disabled = false; z.insertAdjacentHTML("beforeend", `<p class="hi-rate">Raté. Tu peux recommencer.</p>`); }
    });
  });
}
async function _histFaire(args, st, b){
  if(b) b.disabled = true;
  let d = null; try{ ({ data:d } = await sb.rpc("histoire_agir", args)); }catch(err){}
  if(b) b.disabled = false;
  if(!d){ _jc("Le serveur n'a pas répondu — réessaie.", "alerte"); return; }
  if(!d.ok){
    if(d.err === "manque") _jc(`Il te faut ${d.qte}× ${_uNom(d.item)} dans ton sac.`, "alerte");
    else _jc(HIST_REFUS[d.err] || UNION_REFUS[d.err] || `Refusé (${d.err}).`, "alerte");
    return;
  }
  _jc(d.finie ? "Histoire réussie !" : `Étape ${d.etape} de l'histoire faite.`, "gain");
  if(st && st.t === "apporter" && typeof chargerStocksServeur === "function") await chargerStocksServeur();
  _histJeuEnCours = false;
  await chargerUnion(); majCouple(); if(typeof afficher === "function") afficher();
}

/* ===========================================================
   LES MINI-JEUX — chacun dessine dans `z` et appelle fin(true|false).
   =========================================================== */
function _lancerJeu(nom, z, h, fin){
  _histJeuEnCours = true;
  const F = ok => { _histJeuEnCours = false; fin(ok); };
  if(nom === "recoller") return _jeuRecoller(z, F);
  if(nom === "toit") return _jeuToit(z, F);
  if(nom === "signal") return _jeuSignal(z, F);
  if(nom === "indices") return _jeuIndices(z, h.paire || [], F);
  if(nom === "four") return _jeuFour(z, F);
  if(nom === "compresses") return _jeuCompresses(z, F);
  if(nom === "apprivoiser") return _jeuApprivoiser(z, F);
  if(nom === "cablage") return _jeuCablage(z, F);
  if(nom === "checklist") return _jeuChecklist(z, F);
  if(nom === "ecoute") return _jeuEcoute(z, F);
  if(nom === "balises") return _jeuBalises(z, F);
  F(false);
}

/* Recoller : 4 pièces à remettre droites (un quart de tour par clic), 12 coups. */
function _jeuRecoller(z, fin){
  const noms = ["Tête", "Bras", "Corps", "Roue"], r = noms.map(() => 1 + Math.floor(Math.random() * 3));
  let coups = 12;
  const dessin = () => {
    z.innerHTML = `<p class="itip-gris">Touche une pièce pour la tourner d'un quart de tour. Toutes la pointe en haut. Coups restants : <b>${coups}</b>.</p>
      <div class="jr-grille">${noms.map((n, i) => `<button class="jr-piece" data-i="${i}" aria-label="${n}">
        <svg viewBox="0 0 40 40" style="transform:rotate(${r[i] * 90}deg)"><path d="M20 4 L28 15 H12 Z"/><rect x="11" y="16" width="18" height="18" rx="3"/></svg><span>${n}</span></button>`).join("")}</div>`;
    z.querySelectorAll(".jr-piece").forEach(b => b.addEventListener("click", () => {
      const i = Number(b.dataset.i); r[i] = (r[i] + 1) % 4; coups--;
      if(r.every(x => x === 0)){ z.innerHTML = `<p class="hi-reussi">Toutes les pièces tiennent.</p>`; fin(true); return; }
      if(coups <= 0){ z.innerHTML = ""; fin(false); return; }
      dessin();
    }));
  };
  dessin();
}

/* Le toit : une planche se balance ; la lâcher au-dessus de la pile. 5 posées, 3 chutes. */
function _jeuToit(z, fin){
  let pos = 0, dir = 1, poses = 0, chutes = 0, vit = 0.9, fini = false, raf = 0;
  z.innerHTML = `<p class="itip-gris">Lâche la planche quand elle est au-dessus de la pile. <span id="jt-cpt"></span></p>
    <div class="jt-zone" id="jt-zone"><div class="jt-planche" id="jt-pl"></div><div class="jt-pile" id="jt-pile"></div></div>
    <button class="mini" id="jt-lacher">Lâcher</button>`;
  const pl = z.querySelector("#jt-pl"), pile = z.querySelector("#jt-pile"), cpt = z.querySelector("#jt-cpt");
  const maj = () => { cpt.textContent = `Posées : ${poses}/5 · chutes : ${chutes}/3`; };
  const tour = () => {
    if(fini || !document.body.contains(pl)){ fini = true; _histJeuEnCours = false; return; }
    pos += dir * vit; if(pos >= 70){ pos = 70; dir = -1; } if(pos <= 0){ pos = 0; dir = 1; }
    pl.style.left = pos + "%"; raf = requestAnimationFrame(tour);
  };
  const lacher = () => {
    if(fini) return;
    const ecart = Math.abs(pos + 15 - 50);
    if(ecart <= 9){ poses++; pile.insertAdjacentHTML("afterbegin", `<div class="jt-pose" style="margin-left:${(pos + 15 - 50) * 0.8}%"></div>`); vit += 0.25; }
    else chutes++;
    maj();
    if(poses >= 5){ fini = true; cancelAnimationFrame(raf); z.insertAdjacentHTML("beforeend", `<p class="hi-reussi">Le toit tient. Il fuira, c'est promis.</p>`); fin(true); }
    else if(chutes >= 3){ fini = true; cancelAnimationFrame(raf); z.innerHTML = ""; fin(false); }
  };
  z.querySelector("#jt-lacher").addEventListener("click", lacher);
  z.querySelector("#jt-zone").addEventListener("click", lacher);
  maj(); raf = requestAnimationFrame(tour);
}

/* Le signal : 5 éclats courts ou longs, à reproduire (appui bref / appui long). 2 essais. */
function _jeuSignal(z, fin){
  const motif = Array.from({ length:5 }, () => Math.random() < 0.5 ? "c" : "l");
  let essais = 2, saisie = [], t0 = 0, enDemo = false;
  z.innerHTML = `<p class="itip-gris">Regarde la lanterne : éclats courts ou longs. Puis réponds : appui bref = court, appui long = long. Essais : <b id="js-ess">2</b>.</p>
    <div class="js-lanterne" id="js-lant"></div><div class="js-saisie" id="js-sais"></div>
    <button class="mini" id="js-revoir">Revoir</button> <button class="mini js-appui" id="js-appui">Appuyer</button>`;
  const lant = z.querySelector("#js-lant"), sais = z.querySelector("#js-sais"), bA = z.querySelector("#js-appui");
  const dort = ms => new Promise(x => setTimeout(x, ms));
  const demo = async () => {
    enDemo = true; bA.disabled = true; saisie = []; sais.textContent = "";
    await dort(400);
    for(const s of motif){ lant.classList.add("on"); await dort(s === "c" ? 250 : 750); lant.classList.remove("on"); await dort(350); }
    enDemo = false; bA.disabled = false;
  };
  const debut = ev => { if(enDemo) return; ev.preventDefault(); t0 = Date.now(); lant.classList.add("on"); };
  const finAppui = ev => {
    if(enDemo || !t0) return; ev.preventDefault(); lant.classList.remove("on");
    saisie.push(Date.now() - t0 < 400 ? "c" : "l"); t0 = 0;
    sais.textContent = saisie.map(s => s === "c" ? "·" : "—").join(" ");
    if(saisie.length < 5) return;
    if(saisie.join("") === motif.join("")){ bA.disabled = true; z.insertAdjacentHTML("beforeend", `<p class="hi-reussi">La lanterne a répondu.</p>`); fin(true); return; }
    essais--; z.querySelector("#js-ess").textContent = essais;
    if(essais <= 0){ z.innerHTML = ""; fin(false); return; }
    demo();
  };
  bA.addEventListener("pointerdown", debut); bA.addEventListener("pointerup", finAppui); bA.addEventListener("pointerleave", finAppui);
  bA.addEventListener("contextmenu", ev => ev.preventDefault());
  z.querySelector("#js-revoir").addEventListener("click", () => { if(!enDemo) demo(); });
  demo();
}

/* Les indices : le dessin décrit deux cités avec des mots d'enfant ; choisir les deux. 3 essais. */
function _jeuIndices(z, paire, fin){
  let essais = 3; const choix = new Set();
  const nomFac = id => ((typeof FACTIONS !== "undefined" && FACTIONS.find(f => f.id === id)) || { nom:id }).nom;
  const ids = Object.keys(INDICES_CITES);
  const dessin = () => {
    z.innerHTML = `<p class="hi-dessin">« La croix, elle est entre <b>${INDICES_CITES[paire[0]] || "?"}</b> et <b>${INDICES_CITES[paire[1]] || "?"}</b>. »</p>
      <p class="itip-gris">Choisis les deux cités. Essais : <b>${essais}</b>.</p>
      <div class="ji-cites">${ids.map(id => `<button class="mini${choix.has(id) ? " actif" : ""}" data-cite="${id}">${echapper(nomFac(id))}</button>`).join("")}</div>
      <button class="mini" id="ji-ok"${choix.size === 2 ? "" : " disabled"}>Vérifier</button>`;
    z.querySelectorAll("[data-cite]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.cite; if(choix.has(id)) choix.delete(id); else if(choix.size < 2) choix.add(id); dessin();
    }));
    z.querySelector("#ji-ok").addEventListener("click", () => {
      if(paire.length === 2 && choix.has(paire[0]) && choix.has(paire[1])){ z.innerHTML = `<p class="hi-reussi">C'est là. La croix apparaît sur la carte.</p>`; fin(true); return; }
      essais--; choix.clear();
      if(essais <= 0){ z.innerHTML = ""; fin(false); return; }
      dessin();
    });
  };
  dessin();
}

/* Le four : maintenir la chaleur dans la zone verte 10 s en tout (appuyer = chauffer). 2 essais. */
function _jeuFour(z, fin){
  let essais = 2;
  const partie = () => {
    let temp = 20, dans = 0, tout = 0, chauffe = false, der = performance.now(), fini = false, raf = 0;
    z.innerHTML = `<p class="itip-gris">Garde l'aiguille dans le vert pendant 10 secondes en tout. Appuie pour chauffer, relâche pour laisser refroidir. Au-delà de 95 : brûlé. Essais : <b>${essais}</b>.</p>
      <div class="jf-jauge"><div class="jf-vert"></div><div class="jf-aig" id="jf-aig"></div></div>
      <div class="itip-gris" id="jf-txt"></div><button class="mini js-appui" id="jf-ch">Chauffer</button>`;
    const aig = z.querySelector("#jf-aig"), txt = z.querySelector("#jf-txt"), b = z.querySelector("#jf-ch");
    const on = ev => { ev.preventDefault(); chauffe = true; }, off = ev => { ev.preventDefault(); chauffe = false; };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off);
    b.addEventListener("contextmenu", ev => ev.preventDefault());
    const rate = () => { fini = true; cancelAnimationFrame(raf); essais--; if(essais <= 0){ z.innerHTML = ""; fin(false); } else partie(); };
    const tour = t => {
      if(fini || !document.body.contains(aig)){ fini = true; _histJeuEnCours = false; return; }
      const dt = Math.min(0.1, (t - der) / 1000); der = t; tout += dt;
      temp += chauffe ? 32 * dt : -20 * dt; temp = Math.max(0, temp);
      if(temp >= 55 && temp <= 75) dans += dt;
      aig.style.left = Math.min(100, temp) + "%";
      txt.textContent = `Dans le vert : ${dans.toFixed(1)} / 10 s · ${Math.round(temp)}°`;
      if(temp >= 95){ txt.textContent = "Brûlé !"; rate(); return; }
      if(dans >= 10){ fini = true; z.innerHTML = `<p class="hi-reussi">Doré, gonflé, presque droit.</p>`; fin(true); return; }
      if(tout >= 30){ txt.textContent = "Trop long : la pâte est retombée."; rate(); return; }
      raf = requestAnimationFrame(tour);
    };
    raf = requestAnimationFrame(tour);
  };
  partie();
}

/* v1.42 — Les compresses : trois compresses chauffent chacune à son rythme ;
   toucher pour rafraîchir ; tenir 15 s sans qu'aucune ne brûle. 2 essais. */
function _jeuCompresses(z, fin){
  let essais = 2;
  const partie = () => {
    const noms = ["Front", "Cou", "Poignets"], ch = [0, 0, 0], vit = noms.map(() => 16 + Math.random() * 12);
    let tout = 0, der = performance.now(), fini = false, raf = 0;
    z.innerHTML = `<p class="itip-gris">Touche une compresse pour la rafraîchir. Tiens 15 secondes sans qu'aucune n'arrive au rouge. Essais : <b>${essais}</b>.</p>
      <div class="jc-grille">${noms.map((n, i) => `<button class="jc-comp" data-i="${i}"><span class="jc-fond" id="jc-${i}"></span><span class="jc-nom">${n}</span></button>`).join("")}</div>
      <div class="itip-gris" id="jc-txt"></div>`;
    z.querySelectorAll(".jc-comp").forEach(b => b.addEventListener("pointerdown", ev => { ev.preventDefault(); ch[Number(b.dataset.i)] = 0; }));
    const txt = z.querySelector("#jc-txt");
    const tour = t => {
      if(fini || !document.body.contains(txt)){ fini = true; _histJeuEnCours = false; return; }
      const dt = Math.min(0.1, (t - der) / 1000); der = t; tout += dt;
      for(let i = 0; i < 3; i++){
        ch[i] += vit[i] * (1 + tout / 15) * dt;
        const el = z.querySelector("#jc-" + i); if(el) el.style.height = Math.min(100, ch[i]) + "%";
        if(ch[i] >= 100){ fini = true; essais--; if(essais <= 0){ z.innerHTML = ""; fin(false); } else partie(); return; }
      }
      txt.textContent = `${Math.min(15, tout).toFixed(1)} / 15 s`;
      if(tout >= 15){ fini = true; z.innerHTML = `<p class="hi-reussi">La fièvre recule. Doucement.</p>`; fin(true); return; }
      raf = requestAnimationFrame(tour);
    };
    raf = requestAnimationFrame(tour);
  };
  partie();
}

/* v1.42 — Apprivoiser : avancer seulement quand le cuprin ne regarde pas
   (un frisson prévient). 8 pas ; vu en train de bouger = un pas en arrière ;
   3 frayeurs = raté. */
function _jeuApprivoiser(z, fin){
  let pas = 0, peurs = 0, etatC = "dos", fini = false, minut = 0;
  z.innerHTML = `<p class="itip-gris">Avance quand le cuprin te tourne le dos. Quand il frissonne, il va se retourner. <span id="ja-cpt"></span></p>
    <div class="ja-piste"><span class="ja-toi" id="ja-toi"></span><span class="ja-cuprin dos" id="ja-cu">cuprin</span></div>
    <button class="mini" id="ja-av">Avancer</button>`;
  const cu = z.querySelector("#ja-cu"), toi = z.querySelector("#ja-toi"), cpt = z.querySelector("#ja-cpt");
  const maj = () => { cpt.textContent = `Pas : ${pas}/8 · frayeurs : ${peurs}/3`; toi.style.left = (pas * 10) + "%"; cu.className = "ja-cuprin " + etatC; };
  const cycle = () => {
    if(fini || !document.body.contains(cu)){ fini = true; _histJeuEnCours = false; return; }
    if(etatC === "dos"){ etatC = "frisson"; minut = setTimeout(cycle, 550); }
    else if(etatC === "frisson"){ etatC = "regarde"; minut = setTimeout(cycle, 900 + Math.random() * 900); }
    else { etatC = "dos"; minut = setTimeout(cycle, 1000 + Math.random() * 1600); }
    maj();
  };
  z.querySelector("#ja-av").addEventListener("click", () => {
    if(fini) return;
    if(etatC === "regarde"){ peurs++; pas = Math.max(0, pas - 1); }
    else pas++;
    maj();
    if(pas >= 8){ fini = true; clearTimeout(minut); z.innerHTML = `<p class="hi-reussi">Il se laisse prendre. Il tremble un peu. Toi aussi.</p>`; fin(true); }
    else if(peurs >= 3){ fini = true; clearTimeout(minut); z.innerHTML = ""; fin(false); }
  });
  maj(); minut = setTimeout(cycle, 1200);
}

/* v1.42 — Le câblage : relier 4 fils à leurs bornes (toucher un fil, puis
   une borne). Bornes mélangées ; 2 erreurs permises. */
function _jeuCablage(z, fin){
  const C = [["rouge","#e05a5a"],["bleu","#5a8ee0"],["jaune","#e0c25a"],["vert","#6ed278"]];
  const bornes = C.map(c => c[0]).sort(() => Math.random() - 0.5);
  const relie = new Set(); let choisi = null, erreurs = 0;
  const dessin = () => {
    z.innerHTML = `<p class="itip-gris">Touche un fil, puis la borne de la même couleur. Erreurs : <b>${erreurs}</b>/2.</p>
      <div class="jw-cables"><div class="jw-col">${C.map(([n, h]) => `<button class="jw-fil${relie.has(n) ? " ok" : ""}${choisi === n ? " actif" : ""}" data-fil="${n}" style="border-color:${h}"${relie.has(n) ? " disabled" : ""}><span style="background:${h}"></span>${n}</button>`).join("")}</div>
      <div class="jw-col">${bornes.map(n => { const h = C.find(c => c[0] === n)[1]; return `<button class="jw-borne${relie.has(n) ? " ok" : ""}" data-borne="${n}"${relie.has(n) ? ` style="border-color:${h}" disabled` : ""}>${relie.has(n) ? "✓" : "○"}<span class="jw-coul" style="background:${h}"></span></button>`; }).join("")}</div></div>`;
    z.querySelectorAll("[data-fil]").forEach(b => b.addEventListener("click", () => { choisi = b.dataset.fil; dessin(); }));
    z.querySelectorAll("[data-borne]").forEach(b => b.addEventListener("click", () => {
      if(!choisi) return;
      if(b.dataset.borne === choisi){ relie.add(choisi); choisi = null; }
      else { erreurs++; choisi = null; if(erreurs > 2){ z.innerHTML = ""; fin(false); return; } }
      if(relie.size === 4){ z.innerHTML = `<p class="hi-reussi">Ça grésille, ça clignote. Ça marche.</p>`; fin(true); return; }
      dessin();
    }));
  };
  dessin();
}

/* v1.43 — La check-list : 6 commandes lues une à une, puis à basculer dans
   le même ordre. 2 essais. */
function _jeuChecklist(z, fin){
  const POOL = ["Pompe", "Allumage", "Gyroscope", "Volets", "Radio", "Train", "Réservoir", "Moteurs", "Ceintures", "Phares"];
  let essais = 2;
  const partie = async () => {
    const liste = POOL.slice().sort(() => Math.random() - 0.5).slice(0, 6);
    const dort = ms => new Promise(x => setTimeout(x, ms));
    z.innerHTML = `<p class="itip-gris">Écoute la check-list, puis bascule les commandes dans le même ordre. Essais : <b>${essais}</b>.</p><div class="jk-lu" id="jk-lu"></div><div class="jk-tab" id="jk-tab"></div>`;
    const lu = z.querySelector("#jk-lu"), tab = z.querySelector("#jk-tab");
    for(const c of liste){ if(!document.body.contains(lu)){ _histJeuEnCours = false; return; } lu.textContent = `« ${c} ! »`; await dort(900); lu.textContent = ""; await dort(200); }
    lu.textContent = "À toi.";
    let i = 0;
    tab.innerHTML = liste.slice().sort(() => Math.random() - 0.5).map(c => `<button class="jk-int" data-c="${c}">${c}</button>`).join("");
    tab.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => {
      if(b.dataset.c === liste[i]){ b.classList.add("ok"); b.disabled = true; i++;
        if(i === 6){ z.innerHTML = `<p class="hi-reussi">Tous les voyants sont verts. Décollage.</p>`; fin(true); } }
      else { essais--; if(essais <= 0){ z.innerHTML = ""; fin(false); } else partie(); }
    }));
  };
  partie();
}

/* v1.43 — L'écoute : un frémissement d'un côté (haut, bas, gauche, droite) ;
   toucher le bon côté à temps. 8 tours, 6 bons pour réussir. */
function _jeuEcoute(z, fin){
  const C = ["haut", "droite", "bas", "gauche"];
  let tour = 0, bons = 0, attendu = null, ouvert = false, minut = 0, fini = false;
  z.innerHTML = `<p class="itip-gris">Dans le noir, un bruit vient d'un côté : touche ce côté avant qu'il ne s'efface. <span id="je-cpt"></span></p>
    <div class="je-nuit">${C.map(c => `<button class="je-cote je-${c}" data-c="${c}" aria-label="${c}"></button>`).join("")}<span class="je-centre"></span></div>`;
  const cpt = z.querySelector("#je-cpt");
  const maj = () => { cpt.textContent = `Tour ${Math.min(tour, 8)}/8 · entendus : ${bons}`; };
  const fermer = () => { ouvert = false; z.querySelectorAll(".je-cote").forEach(b => b.classList.remove("on")); };
  const suivant = () => {
    if(fini || !document.body.contains(cpt)){ fini = true; _histJeuEnCours = false; return; }
    if(tour >= 8){ fini = true; if(bons >= 6){ z.innerHTML = `<p class="hi-reussi">Ce n'était que le volet. Mais il fallait l'entendre.</p>`; fin(true); } else { z.innerHTML = ""; fin(false); } return; }
    tour++; maj();
    minut = setTimeout(() => {
      attendu = C[Math.floor(Math.random() * 4)]; ouvert = true;
      const b = z.querySelector(".je-" + attendu); if(b) b.classList.add("on");
      minut = setTimeout(() => { fermer(); suivant(); }, 1200);
    }, 600 + Math.random() * 700);
  };
  z.querySelectorAll(".je-cote").forEach(b => b.addEventListener("pointerdown", ev => {
    ev.preventDefault(); if(!ouvert) return;
    if(b.dataset.c === attendu) bons++;
    clearTimeout(minut); fermer(); maj(); suivant();
  }));
  maj(); suivant();
}

/* v1.43 — Les balises : la crête, la nuit, ses lampes fixes (jamais
   clignotantes, LORE §6) ; un nuage la cache au bout de 3 s ; combien ?
   3 tours, 2 bons pour réussir. */
function _jeuBalises(z, fin){
  let tourN = 0, bons = 0;
  const tour = () => {
    if(tourN >= 3){ if(bons >= 2){ z.innerHTML = `<p class="hi-reussi">Le compte est bon.</p>`; fin(true); } else { z.innerHTML = ""; fin(false); } return; }
    tourN++;
    const n = 9 + Math.floor(Math.random() * 8);
    const choix = [n, n - 1, n + 1, n + 2].sort(() => Math.random() - 0.5);
    z.innerHTML = `<p class="itip-gris">Compte les lampes avant que le nuage ne passe. Tour ${tourN}/3 · justes : ${bons}.</p>
      <div class="jb-crete" id="jb-crete">${Array.from({ length:n }, () => `<span class="jb-lampe"></span>`).join("")}</div>
      <div class="jb-rep" id="jb-rep" hidden>${choix.map(c => `<button class="mini" data-n="${c}">${c}</button>`).join("")}</div>`;
    setTimeout(() => {
      const cr = z.querySelector("#jb-crete"), rep = z.querySelector("#jb-rep");
      if(!cr){ _histJeuEnCours = false; return; }
      cr.classList.add("nuage"); rep.hidden = false;
      rep.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => { if(Number(b.dataset.n) === n) bons++; tour(); }));
    }, 3000);
  };
  tour();
}
