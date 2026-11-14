/* ===========================================================
   v1.87 — LE GISEMENT DE SÉLÉNITE (K48), au lac gelé d'Ancolie (zone froide).
   Trouvé en Q23 (drapeau `seleniteConnue`) ; s'ouvre dans l'onglet « Le Gisement »
   quand on est sur le lieu `selenite` (braise.js).

   ⚠ CE N'EST PAS LE GRAVIER. Pas d'essais au hasard : UNE aiguille par joueur,
   qui POUSSE dans la glace.
   - Elle mûrit en SELENITE_POUSSE_J jours de jeu. On ne voit où elle en est
     qu'en venant sur place.
   - Mûre, on la dégage à petits coups (les goupilles, quetes-jeux.js). Réussi :
     1 cristal, ou 2 une fois sur quatre (SELENITE_DOUBLE). L'aiguille repart de zéro.
   - Une fêlure (coup raté) : elle se fend mais ne meurt pas, elle repart de la
     MOITIÉ (deux jours de pousse perdus).
   - Mûre et oubliée plus de SELENITE_GRACE_J jours : le gel la fend de même.
   ≈ 2 cristaux par semaine pour un joueur régulier (le Gravier : ~10 Nyx).
   Le cristal entre au sac par `agir` (motif « selenite »), comme le Nyx du Gravier :
   même niveau de confiance (état dans `donnees`), cf. BACKEND_PLAN.
   ⚠ Les durées sont des FRACTIONS de JOUR_MS : c'est le seul interrupteur pour
   tester vite (piège n°16 : jamais deux échelles de temps pour une même échéance).
   =========================================================== */
const SELENITE_POUSSE_J = 4;      // jours pour mûrir
/* v2.54 (K188) — Cœur de givre (to5, dernier nœud de la Toundra) : 3 jours au lieu de 4. Tout passe par _selPousseJ()
   (l'aiguille vit dans la sauvegarde : rien au serveur). Prendre l'aptitude en cours de pousse avance l'aiguille d'autant. */
function _selPousseJ(){ return SELENITE_POUSSE_J - ((typeof _apt === "function" && _apt("to5")) ? 1 : 0); }
const SELENITE_GRACE_J  = 2;      // jours de grâce, mûre, avant que le gel la fende
const SELENITE_REPRISE  = 0.5;    // après une fêlure : elle repart de la moitié
const SELENITE_DOUBLE   = 0.25;   // chance d'en tirer deux — v2.89 : RÉFÉRENCE, tirée par le serveur (selenite_conclure)
const SELENITE_ENERGIE  = 6;      // % d'énergie pour la dégager (Endurance comprise)
const SELENITE_COUPS    = 5;      // coups (goupilles) pour la dégager

function _selJour(){ return (typeof JOUR_MS !== "undefined") ? JOUR_MS : 86400000; }
function seleniteConnue(){ return !!(etat && etat.seleniteConnue); }
function surSelenite(){
  if(!seleniteConnue() || !(etat && etat.secteur === "ancolie") || typeof lieuBraiseIci !== "function") return false;
  const l = lieuBraiseIci(); return !!(l && l.id === "selenite");
}
function coutSelenite(){ return (typeof aptEndurance === "function" ? aptEndurance : (x => x))(SELENITE_ENERGIE); }

/* L'état de l'aiguille, gel compris (appliqué à la lecture : rien ne tourne en fond). */
function seleniteEtat(){
  if(!etat.selenite || typeof etat.selenite.debut !== "number") etat.selenite = { debut:Date.now(), gels:0 };
  const S = etat.selenite, J = _selJour(), pousse = _selPousseJ() * J, grace = SELENITE_GRACE_J * J;
  // Chaque fois qu'elle a passé sa grâce, le gel l'a fendue : elle est repartie de la moitié.
  let n = 0;
  while(Date.now() >= S.debut + pousse + grace && n < 50){
    const gelLe = S.debut + pousse + grace;
    S.debut = gelLe - pousse * SELENITE_REPRISE;
    S.gels = (S.gels || 0) + 1; S.gelLe = gelLe; n++;
  }
  if(n && typeof sauvegarder === "function") sauvegarder();
  return S;
}
function selenitePousse(){ const S = seleniteEtat(); return Math.max(0, Math.min(1, (Date.now() - S.debut) / (_selPousseJ() * _selJour()))); }
function seleniteMure(){ return selenitePousse() >= 1; }

function _selDescription(p){
  if(p >= 1) return "Elle est mûre. Elle a cessé de grandir et retient la lumière comme une lampe éteinte qui se souvient. Le vent passe : elle brille.";
  if(p >= 0.75) return "Elle est presque là. La glace s'écarte à sa base, couche après couche. Encore un peu.";
  if(p >= 0.5) return "Elle a la longueur de ton avant-bras, mais elle est encore trouble, laiteuse jusqu'au cœur.";
  if(p >= 0.25) return "Une aiguille fine comme un cheveu, de la longueur d'une main. Elle ploie au moindre souffle.";
  return "À peine sortie. Un trait pâle dans la glace bleue, qu'on devine plus qu'on ne le voit.";
}

/* v1.90 — UNE IMAGE PAR STADE (demande de l'autrice) : quatre stades de pousse, un
   par jour (0-25 %, 25-50 %, 50-75 %, 75-100 %), puis l'aiguille MÛRE qui brille.
   images/lieux/selenite_1.png … selenite_4.png, selenite_mure.png ; une image absente
   retombe sur images/lieux/selenite.png, puis disparaît. */
function _selImage(p){
  const stade = p >= 1 ? "mure" : String(Math.min(4, Math.floor(p * 4) + 1));
  return `images/lieux/selenite_${stade}.png`;
}
function majSelenite(z){
  if(!z) return;
  if(!surSelenite()){ z.innerHTML = `<p class="vide">Tu n'es plus au lac gelé.</p>`; if(typeof majHub === "function") majHub(); return; }
  const S = seleniteEtat(), p = selenitePousse(), mure = p >= 1, J = _selJour();
  let h = `<h3 style="margin:2px 0">Le lac gelé</h3>
    <div class="lieu-banniere"><img src="${_selImage(p)}" alt="" onerror="if(!this.dataset.r){this.dataset.r='1';this.src='images/lieux/selenite.png';}else{this.parentElement.remove();}"></div>
    <p class="vide" style="margin:0 0 10px">Au bord du lac, dans la glace bleue, ton aiguille de Sélénite. Elle pousse. Ça se voit à peine, et ça se voit quand même.</p>`;
  if(S.gelLe && S.gelLe > (S.gelVu || 0)){
    h += `<div class="quete-avert">Le gel est passé par là. Ton aiguille était mûre, et personne n'est venu : elle s'est fendue au milieu. Le bout mort est tombé dans la neige. Le reste repousse.</div>`;
    S.gelVu = S.gelLe; if(typeof sauvegarder === "function") sauvegarder();
  }
  h += `<p class="quete-dial">${_selDescription(p)}</p>
    <div class="garage-etat">
      <div><span>Pousse</span><b>${Math.floor(p * 100)} %</b></div>
      ${mure ? `<div><span>Avant le gel</span><b>${typeof _fmtDuree === "function" ? _fmtDuree(S.debut + (_selPousseJ() + SELENITE_GRACE_J) * J - Date.now()) : "bientôt"}</b></div>` : ""}
      <div><span>La dégager</span><b>−${coutSelenite()} % d'énergie · ${SELENITE_COUPS} coups</b></div>
    </div>`;
  if(!mure){
    h += `<p class="vide" style="margin-top:12px">Trop jeune. Si tu la touches maintenant, elle casse. Reviens quand elle brillera.</p>`;
    z.innerHTML = h; return;
  }
  const ko = (etat.energie|0) < coutSelenite() || (typeof placesLibres === "function" && placesLibres() <= 0);
  h += `<div id="sel-jeu"><p class="vide" style="margin:10px 0 4px">Dégage-la à petits coups, sans forcer. Un coup de travers et elle se fend : elle repartira de la moitié.</p>
    <div class="actions"><button class="mini" id="sel-degager" ${ko ? "disabled" : ""}>Dégager l'aiguille</button>
    ${(typeof placesLibres === "function" && placesLibres() <= 0) ? `<span class="itip-gris" style="margin-left:8px">Sac plein.</span>` : ""}</div></div>`;
  z.innerHTML = h;
  const b = z.querySelector("#sel-degager"); if(b) b.addEventListener("click", () => seleniteDegager(z));
}

/* v2.89 (v291, anti-triche) — L'AIGUILLE VIT AU SERVEUR (table `selenite_aiguille`, reprise de la sauvegarde
   à la première lecture). `selenite_lire` la renvoie, gel appliqué ; `selenite_engager` vérifie le lieu, mûre,
   la place, et débite l'énergie (Endurance) ; `selenite_conclure(p_reussi)` donne 1 cristal (2 une fois sur
   quatre, tiré là-bas) ou fend l'aiguille. Le jeu ne dit que l'issue du mini-jeu des coups (comme le vol).
   etat.selenite n'est plus qu'un reflet (pour l'affichage, et gelVu). */
function _selAppliquer(a){
  if(!a || typeof a.debut !== "number") return;
  const S = etat.selenite || {};
  etat.selenite = { debut:a.debut, gels:a.gels|0, gelLe:(typeof a.gel_le === "number" ? a.gel_le : S.gelLe), gelVu:S.gelVu };
}
const SELENITE_REFUS = {
  inconnue:"Tu ne sais pas où chercher.", lieu:"Tu n'es plus au lac gelé.", pas_mure:"Trop jeune. Si tu la touches maintenant, elle casse.",
  sac_plein:"Sac plein.", energie:"Pas assez d'énergie. Attends (+10 %/h) ou monte de niveau.",
  prison:"Tu es en prison — impossible d'agir jusqu'à ta libération.", pas_engage:"Il faut d'abord commencer à la dégager."
};
async function majSeleniteServeur(z){
  if(!z) return;
  try{
    const { data, error } = await sb.rpc("selenite_lire");
    if(error) throw new Error(error.message);
    if(data && data.ok) _selAppliquer(data.aiguille);
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "selenite.js#lire"); }
  majSelenite(z);
}
let _selEnCours = false;
async function seleniteDegager(z){
  if(!surSelenite() || !seleniteMure() || _selEnCours) return;
  const b = z.querySelector("#sel-degager"); if(b) b.disabled = true;
  // L'énergie part AVANT les coups : quitter en route ne la rend pas.
  _selEnCours = true;
  let d = null;
  try{
    if(typeof sauverMaintenant === "function") await sauverMaintenant();   // le serveur lit la position sauvée
    const rep = await sb.rpc("selenite_engager");
    if(rep && rep.error) throw new Error(rep.error.message);
    d = rep && rep.data;
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "selenite.js#engager"); }
  finally{ _selEnCours = false; }
  if(!d || !d.ok){
    if(d && d.err === "mort"){ if(typeof ouvrirCouloirMort === "function") ouvrirCouloirMort(); return; }
    if(d && d.aiguille) _selAppliquer(d.aiguille);
    journal((d && SELENITE_REFUS[d.err]) || "Le serveur n'a pas répondu — réessaie.", "alerte");
    if(b) b.disabled = false; majSelenite(z); return;
  }
  if(typeof d.energie === "number"){ etat.energie = d.energie; etat.energieMaj = Date.now(); }
  const zone = z.querySelector("#sel-jeu"); if(!zone) return;
  if(typeof goupillesMoteur !== "function"){ journal("Rien ne se passe.", "alerte"); return; }
  const conclure = async (reussi) => {
    try{
      const rep = await sb.rpc("selenite_conclure", { p_reussi: reussi });
      if(rep && rep.error) throw new Error(rep.error.message);
      return rep && rep.data;
    }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "selenite.js#conclure"); return null; }
  };
  goupillesMoteur(zone, {
    nb:SELENITE_COUPS, libelle:"Coup", bouton:"Frapper", aide:"Frappe quand le curseur passe dans le vert.",
    gagne: async () => {
      const r = await conclure(true);
      if(!r || !r.ok){ journal("Le serveur n'a pas répondu : l'aiguille reste en place. Réessaie.", "alerte"); setTimeout(() => majSeleniteServeur(z), 50); return true; }
      _selAppliquer(r.aiguille);
      if(r.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(r.etat);
      const recu = r.recu|0, n = r.tire|0;
      if(!r.reussi) journal("Un coup de travers. L'aiguille se fend net : la moitié du haut tombe, mate et morte. Le reste repoussera.", "alerte", "minage");
      else if(recu) journal(n === 2 && recu === 2
        ? "L'aiguille vient d'un bloc, et une seconde avec elle, collée à sa base. +2 Cristal de Sélénite. Une nouvelle pointe perce déjà la glace."
        : "L'aiguille vient d'un bloc, entière, froide dans ta main. +1 Cristal de Sélénite. Une nouvelle pointe perce déjà la glace.", "gain", "minage");
      else journal("Ton sac est plein : l'aiguille t'échappe des doigts et se brise sur la glace.", "alerte", "minage");
      if(r.reussi && typeof gagnerXp === "function") gagnerXp(5);
      if(typeof sauvegarder === "function") sauvegarder();
      majSelenite(z); if(typeof afficher === "function") afficher();
      return true;
    },
    rate: () => {
      etat.selenite = Object.assign({}, etat.selenite, { debut:Date.now() - _selPousseJ() * _selJour() * SELENITE_REPRISE });   // affichage tout de suite…
      conclure(false).then(r => { if(r && r.ok) _selAppliquer(r.aiguille); if(typeof sauvegarder === "function") sauvegarder(); majSelenite(z); });   // …le serveur fait foi
      journal("Un coup de travers. L'aiguille se fend net : la moitié du haut tombe, mate et morte. Le reste repoussera.", "alerte", "minage");
      return false;
    }
  });
}
