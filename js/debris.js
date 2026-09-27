/* ===========================================================
   DÉBRIS — Chutes de débris (« scavenger »), v1.31. Serveur : v131_debris.sql
   (BACKEND_PLAN §44). TOUT est tiré par le serveur : date, carte, points,
   nombre de fouilles, butin. Le client ne connaît JAMAIS la position d'un
   point : il envoie la sienne (debris_sonder) et reçoit un palier (0 glacial …
   5 brûlant, = CHASSE_PALIERS de quetes.js), une tendance et « sur le point ».
   Habillage : la VISIÈRE relève la signature thermique des débris, tombés en
   brûlant (on ne dit rien de leur origine — LORE, pour nous seulement).
   ⚠ Barèmes DUPLIQUÉS avec le serveur (BACKEND_PLAN §6) :
     paliers 1100/800/500/300/150, zone morte 10 u, rayon 80 u, fouille 6 %.
   ⚠ Patrouilles : ×1,5 de fréquence, dureté +20, 15 XP — SEULEMENT sur la
     carte des débris pendant l'événement (debrisPatrouilleIci).
   =========================================================== */
// Rayon « sur le point » : 80 u — décidé par le SERVEUR seul (debris_fouiller), jamais ici.
const DEBRIS_COUT         = 6;     // % d'énergie par fouille (serveur : agir(6, …))
const DEBRIS_PATR_FREQ    = 1.5;   // patrouilles sur la carte des débris
const DEBRIS_PATR_DURETE  = 20;    // + à la dureté (6-26 → 26-46)
const DEBRIS_PATR_XP      = 15;    // au lieu de XP_PATROUILLE (10)
const DEBRIS_NOMS = { silene:"Silène", braise:"La Braise", suaire:"Le Suaire" };
/* Mots des paliers : ceux de la bouture (CHASSE_PALIERS, quetes.js) — UN seul barème. */
function _debrisMot(i){ return (typeof CHASSE_PALIERS !== "undefined" && CHASSE_PALIERS[i]) ? CHASSE_PALIERS[i][1] : ""; }

/* État connu du client (jamais le point) :
   { actif, carte, fin, fini, faites, palier, tendance, surPoint } */
let _debris = { actif:false };
let _debrisSondeEnCours = false;

function _debrisCarteIci(){
  if(typeof etat === "undefined" || !etat) return null;
  if(etat.secteur === "braise" || etat.secteur === "suaire") return etat.secteur;
  if(etat.secteur === "ecart") return "espace";
  return "silene";
}
function _debrisPosIci(){
  const c = _debrisCarteIci();
  if(c === "braise" || c === "suaire") return (typeof posSurface === "function") ? posSurface() : null;
  if(c === "silene") return etat.pos || null;
  return null;
}
/* Sur la carte des débris, pendant l'événement (même fouilles finies :
   les patrouilles, elles, sont toujours là). */
function debrisIci(){ return !!(_debris.actif && _debris.carte && _debrisCarteIci() === _debris.carte); }
function debrisPatrouilleIci(){ return debrisIci(); }
function debrisNomCarte(id){ return DEBRIS_NOMS[id] || (id ? id.charAt(0).toUpperCase() + id.slice(1) : ""); }
function _debrisFin(d){ if(!d) return ""; const p = String(d).split("-"); return p.length === 3 ? `${p[2]}/${p[1]}` : d; }

/* ---------- Chargement ---------- */
async function debrisCharger(){
  if(typeof sb === "undefined" || !sb) return;
  try{
    const { data, error } = await sb.rpc("debris_etat");
    if(error || !data) return;
    const avant = _debris;
    _debris = data.actif
      ? { actif:true, carte:data.carte, fin:data.fin, fini:!!data.fini, faites:data.faites|0,
          // on garde la dernière lecture de la visière si c'est le même événement
          palier: avant.carte === data.carte ? avant.palier : undefined,
          tendance: avant.carte === data.carte ? avant.tendance : null,
          surPoint: avant.carte === data.carte ? !!avant.surPoint : false }
      : { actif:false };
    majDebris();
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "debris.js#charger"); }
}
setInterval(debrisCharger, 600000);
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) debrisCharger(); });

/* ---------- La visière (chaud / froid) ---------- */
async function debrisSonder(bavard){
  if(!debrisIci() || _debris.fini || _debrisSondeEnCours) return;
  const p = _debrisPosIci(); if(!p) return;
  _debrisSondeEnCours = true;
  try{
    const { data, error } = await sb.rpc("debris_sonder", { p_x:Math.round(p.x), p_y:Math.round(p.y) });
    if(error || !data) return;
    if(!data.ok){ if(data.err === "aucun"){ _debris = { actif:false }; majDebris(); } return; }   // trop_vite : on garde l'affichage
    if(!data.ici) return;
    if(data.fini){ _debris.fini = true; majDebris(); return; }
    _debris.palier = data.palier; _debris.tendance = data.tendance; _debris.surPoint = !!data.sur_point;
    if(bavard){
      const mot = _debrisMot(data.palier);
      const sens = data.tendance === "chaud" ? " Plus chaud." : data.tendance === "froid" ? " Plus froid." : data.tendance === "egal" ? " Pareil." : "";
      if(data.sur_point) journal("La visière vire au blanc : des débris sont là, sous tes pieds. Tu peux fouiller.", "gain", "voyage");
      else journal(`Visière : signature thermique — ${mot}.${sens}`, data.tendance === "chaud" ? "gain" : "", "voyage");
    }
    majDebris();
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "debris.js#sonder"); }
  finally{ _debrisSondeEnCours = false; }
}
/* Appelée par voyager() (carte.js) et voyagerBraise() (braise.js). */
function debrisApresDeplacement(){ if(debrisIci() && !_debris.fini) debrisSonder(true); }

/* ---------- La fouille ---------- */
async function debrisFouiller(){
  if(!debrisIci() || _debris.fini) return;
  if(etat.enPause){ journal("Personnage en pause.", "alerte"); return; }
  const p = _debrisPosIci(); if(!p) return;
  const b = document.querySelector(".debris-fouiller"); if(b) b.disabled = true;
  try{
    const { data, error } = await sb.rpc("debris_fouiller", { p_x:Math.round(p.x), p_y:Math.round(p.y) });
    if(error || !data){ journal("Le serveur n'a pas répondu — réessaie.", "alerte"); return; }
    if(!data.ok){
      const err = data.err;
      if(err === "sac")          journal("Fais de la place dans ton sac avant de fouiller : il faut 2 places libres.", "alerte");
      else if(err === "energie") journal(`Pas assez d'énergie pour fouiller (${DEBRIS_COUT} %).`, "alerte");
      else if(err === "loin")  { journal("Il n'y a rien ici. Suis la visière.", "alerte"); _debris.surPoint = false; }
      else if(err === "fini")  { _debris.fini = true; }
      else if(err === "aucun") { _debris = { actif:false }; }
      else if(err === "prison")  journal("Tu es en prison — impossible d'agir jusqu'à ta libération.", "alerte");
      else if(err === "mort"){ if(typeof ouvrirCouloirMort === "function") ouvrirCouloirMort(); }
      else journal(`Fouille refusée par le serveur (${err || "réponse vide"}).`, "alerte");
      majDebris(); return;
    }
    // Même application que agirServeur (inventaire.js) : le serveur fait foi.
    if(typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
    if(typeof data.energie === "number"){ etat.energie = data.energie; etat.energieMaj = Date.now(); }
    if(data.jauges){ etat.jauges = etat.jauges || {};
      etat.jauges.o2 = data.jauges.o2; etat.jauges.sante = data.jauges.sante; etat.jauges.moral = data.jauges.moral; }
    const liste = []; for(const id in (data.ajoutes || {})) for(let k = 0; k < data.ajoutes[id]; k++) liste.push(id);
    const txt = (typeof _butinTexte === "function") ? _butinTexte(liste)
              : liste.map(id => "+1 " + ((typeof item === "function" && item(id)) ? item(id).nom : id)).join(", ");
    const rangMax = Math.max(0, ...Object.values(data.rangs || {}).map(Number));
    const eclat = rangMax >= 4 ? " Une pièce exceptionnelle !" : rangMax >= 3 ? " Une pièce rare !" : "";
    journal(`Tu dégages les débris encore tièdes : ${txt}. −${DEBRIS_COUT} % énergie.${eclat}`, "gain", "voyage");
    _debris.faites = (_debris.faites | 0) + 1;
    _debris.palier = undefined; _debris.tendance = null; _debris.surPoint = false;
    if(data.fini){ _debris.fini = true; journal("Il n'y a plus rien pour toi ici. Tu peux rentrer.", "", "voyage"); }
    else journal("La visière capte une autre signature, plus loin.", "", "voyage");
    if(data.mort && typeof ouvrirCouloirMort === "function") ouvrirCouloirMort();
    if(typeof afficher === "function") afficher();
    majDebris();
    if(!_debris.fini) setTimeout(()=>debrisSonder(false), 2100);   // le serveur accepte 1 sonde / 2 s
  }catch(e){ journal("Connexion au serveur perdue — réessaie.", "alerte"); if(typeof _catchLog === "function") _catchLog(e, "debris.js#fouiller"); }
  finally{ const b2 = document.querySelector(".debris-fouiller"); if(b2) b2.disabled = false; }
}

/* ---------- Panneau (sous la carte de Silène et sous la carte au sol) ---------- */
let _debrisStyle = false;
function _debrisMonterStyle(){
  if(_debrisStyle) return; _debrisStyle = true;
  const st = document.createElement("style");
  st.textContent = `
    .debris-panneau{ margin:8px auto 0; max-width:520px; padding:10px 12px; border:1px solid var(--line,#243a52);
      border-left:2px solid var(--orange,#ff8a3d); border-radius:10px 4px 10px 4px; background:rgba(16,41,78,.35); font-size:14px; }
    .debris-panneau[hidden]{ display:none; }
    .debris-tete{ font-family:"Space Mono",monospace; letter-spacing:.08em; text-transform:uppercase; font-size:12px; color:var(--orange,#ff8a3d); margin-bottom:6px; }
    .debris-thermo{ height:10px; border-radius:5px; background:rgba(255,255,255,.08); overflow:hidden; }
    .debris-thermo i{ display:block; height:100%; background:linear-gradient(90deg,#5aa8e6,#e6c24f,#ff8a3d); }
    .debris-ligne{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:6px; }
    .debris-fouiller{ min-height:40px; }`;
  document.head.appendChild(st);
}
function _debrisPanneauHtml(){
  const nom = debrisNomCarte(_debris.carte), fin = _debrisFin(_debris.fin);
  const tete = `<div class="debris-tete">Chute de débris — ${nom} · jusqu'au ${fin} au soir</div>`;
  if(!debrisIci()) return tete + `<p style="margin:0">Des débris sont tombés sur <b>${nom}</b>. Vas-y avant qu'il ne reste plus rien.</p>`;
  if(_debris.fini) return tete + `<p style="margin:0">Il n'y a plus rien pour toi. Tu peux rentrer.</p>`;
  if(_debris.palier === undefined || _debris.palier === null)
    return tete + `<p style="margin:0">Déplace-toi : la visière relèvera la signature thermique des débris.</p>`;
  const i = Math.max(0, Math.min(5, _debris.palier|0));
  const sens = _debris.tendance === "chaud" ? " · ↑ plus chaud" : _debris.tendance === "froid" ? " · ↓ plus froid" : _debris.tendance === "egal" ? " · = pareil" : "";
  const btn = _debris.surPoint ? `<button class="mini debris-fouiller">Fouiller — ${DEBRIS_COUT} % énergie</button>` : "";
  return tete + `<div class="debris-thermo"><i style="width:${Math.round((i+1)/6*100)}%"></i></div>
    <div class="debris-ligne"><span>Signature thermique : <b>${_debrisMot(i)}</b>${sens}</span>${btn}</div>`;
}
function majDebris(){
  _debrisMonterStyle();
  const html = _debris.actif ? _debrisPanneauHtml() : "";
  for(const id of ["debris-silene", "debris-surface"]){
    const el = document.querySelector("#" + id); if(!el) continue;
    // Sous chaque carte, on ne montre le panneau que là où l'on est.
    const ici = (id === "debris-silene") ? (_debrisCarteIci() === "silene") : (_debrisCarteIci() === "braise" || _debrisCarteIci() === "suaire");
    el.hidden = !html || !ici; el.innerHTML = el.hidden ? "" : html;
    const fb = el.querySelector(".debris-fouiller"); if(fb) fb.addEventListener("click", debrisFouiller);
  }
  // Première lecture en arrivant sur la carte (sans message au journal).
  if(debrisIci() && !_debris.fini && (_debris.palier === undefined || _debris.palier === null)) debrisSonder(false);
}
