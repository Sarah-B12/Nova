/* ===========================================================
   QUETES — Moteur + onglet « Quêtes » + marqueurs + mini-jeux.
   Un onglet (entre La Boutique et Voler/Hacker). Une quête active, ordre imposé.
   Bannière de Sorn seulement en faction ; sur le terrain : scène locale + radio.
   L'épreuve n'est jouable que SUR le lieu (surSiteQuete). Après réussite : écran
   de transition (defi.reussite) + Continuer.

   Types de défi (defi.type) — un module = _html<Type> + _wire<Type> :
     enigme (illimité) · choix · livraison · paiement · attente · piratage · glyphes
     ordre · cadenas · sequence · memoire · combat (contrôle de niveau)
   MINI-JEUX RATABLES (DEFIS_UNTRY) : UN essai par jour. Sur échec (validation ratée),
   l'étape se verrouille jusqu'au prochain minuit parisien. L'énigme reste illimitée ;
   livraison/paiement/attente ne sont pas « ratables » (on complète ou pas).
   =========================================================== */

/* ---------- État & accès ---------- */
function queteEtat(){ if(!etat.quetes || typeof etat.quetes!=="object") etat.quetes={ done:[], active:null };
  if(!Array.isArray(etat.quetes.done)) etat.quetes.done=[];
  /* v1.03 — REPRISE DES PARTIES EXISTANTES : sans cette ligne, un joueur d'avant
     la v1.03 n'a pas de `paRecu`, et une quête remise à zéro lui repaierait ses
     PA. Les quêtes déjà faites ont forcément touché les leurs. */
  if(!Array.isArray(etat.quetes.paRecu)) etat.quetes.paRecu = etat.quetes.done.slice();
  return etat.quetes; }
/* v1.03 — LES PA NE SE TOUCHENT QU'UNE FOIS. Le staff peut rendre une quête
   rejouable (admin_reset_quete) ; sa récompense repart, mais pas les points
   d'aptitude, qui achètent des aptitudes définitives. `paRecu` liste les quêtes
   qui ont déjà payé leurs PA. ⚠ admin_reset_quete NE LA TOUCHE JAMAIS — c'est
   ce qui rend le garde-fou solide même après une remise à zéro serveur.
   (Les points de Cercle sont protégés à part, par `cercles_gains` côté base.) */
function _paDejaRecu(id){ const q=queteEtat(); return Array.isArray(q.paRecu) && q.paRecu.includes(id); }
function _marquerPaRecu(id){ const q=queteEtat(); if(!Array.isArray(q.paRecu)) q.paRecu=[]; if(!q.paRecu.includes(id)) q.paRecu.push(id); }
function queteData(id){ return (typeof QUETES!=="undefined") ? QUETES.find(q=>q.id===id) : null; }
function queteActive(){ const q=queteEtat(); return q.active || null; }
function etapeActive(){ const a=queteActive(); if(!a) return null; const q=queteData(a.id); return q ? q.etapes[a.etape] : null; }
function queteProchaine(){ if(typeof QUETES==="undefined") return null; return QUETES.find(q=>!queteEtat().done.includes(q.id)) || null; }
/* ⚠ Normalisation des réponses. Elle ne gérait ni les apostrophes ni la
   ponctuation : « l’embarquement » (apostrophe typographique, insérée
   automatiquement par iOS et par la correction automatique) était REFUSÉ alors
   que « l'embarquement » passait. Idem pour un point final. Un joueur pouvait
   avoir la bonne réponse et se croire à côté de la plaque. */
function _qnorm(s){
  return String(s||"")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")   // accents
    .replace(/[\u2018\u2019\u02bc\u00b4`]/g,"'")       // apostrophes typographiques -> droite
    .replace(/[.,;:!?…]+$/,"")                          // ponctuation finale
    .replace(/\s+/g," ")
    .trim();
}
function _par(txt){ if(!txt) return ""; const arr=Array.isArray(txt)?txt:[txt]; return arr.map(t=>`<p class="quete-dial">${t}</p>`).join(""); }
/* v1.00 — VARIANTES SELON UN DRAPEAU. `arrivee`, `image` et `defi.reussite`
   peuvent être une valeur simple (comme avant) OU :
     { selon:"q3Souche", defaut:"relevee", valeurs:{ tranchee:…, relevee:…, pillee:… } }
   Le drapeau est lu dans `etat` (posé par `flags` d'une option de choix).
   Drapeau absent ou inconnu → la valeur `defaut`. Q15 étape 1 (LORE : la souche). */
function _varie(v){
  if(!v || typeof v!=="object" || Array.isArray(v) || !v.selon || !v.valeurs) return v;
  const k = (typeof etat!=="undefined" && etat) ? etat[v.selon] : undefined;
  return (k!=null && Object.prototype.hasOwnProperty.call(v.valeurs, k)) ? v.valeurs[k] : v.valeurs[v.defaut];
}
/* ===========================================================
   v0.97 — CIBLES MULTI-CARTES. Une cible (ou un leurre) peut viser :
     · Silène (défaut) ........ { x, y, r }            (= { carte:"silene", … })
     · l'orbite, par un lieu .. { lieu:"epave" }       (coordonnées et rayon du lieu)
     · l'orbite, par un point . { carte:"espace", x, y, r }
     · 📌 une sous-carte ...... { carte:"braise"|"suaire", x, y, r } — n'existent
       pas encore : _carteJoueur() ne les renvoie jamais, donc une telle cible
       est inatteignable tant que la sous-carte n'est pas construite.
   Q1→Q5 n'ont aucun champ `carte` : elles restent sur Silène, sans changement.
   =========================================================== */
function _cibleResolue(c){
  if(!c) return null;
  // v0.98/v0.99 — un lieu d'une surface : { carte:"braise"|"suaire", lieu:"…" } (braise.js).
  if(c.lieu && (c.carte==="braise" || c.carte==="suaire")){
    const l = (typeof surfaceLieu==="function") ? surfaceLieu(c.carte, c.lieu) : null; if(!l) return null;
    return { carte:c.carte, x:l.x, y:l.y, r:c.r||l.r, lieu:c.lieu };
  }
  if(c.lieu){
    const l = (typeof espaceLieu==="function") ? espaceLieu(c.lieu) : null; if(!l) return null;
    return { carte:"espace", x:l.x, y:l.y, r:c.r || ((typeof espaceRayon==="function") ? espaceRayon(l) : 80), lieu:c.lieu };
  }
  return { carte:c.carte||"silene", x:c.x, y:c.y, r:c.r||70 };
}
function _carteJoueur(){
  if(etat.secteur==="braise" || etat.secteur==="suaire") return etat.secteur;   // v0.98 : sous-cartes
  return (typeof enEcart==="function" && enEcart()) ? "espace" : "silene";
}
function _posJoueur(carte){
  if(carte==="espace") return (typeof posEspace==="function") ? posEspace() : null;
  if(carte==="braise" || carte==="suaire") return (typeof posSurface==="function") ? posSurface() : null;
  return etat.pos || null;
}
function _dansCible(c){
  const r=_cibleResolue(c); if(!r || r.carte!==_carteJoueur()) return false;
  const p=_posJoueur(r.carte); if(!p) return false;
  return Math.hypot(p.x-r.x, p.y-r.y) <= r.r;
}
function carteEtapeActive(){ const e=etapeActive(); const r=e && _cibleResolue(e.cible); return r ? r.carte : null; }
function surSiteQuete(){ const e=etapeActive(); if(!e || !e.cible) return false; return _dansCible(e.cible); }
function _enFaction(){ return (typeof villeActuelle==="function") && villeActuelle()===etat.faction; }
function _jourMs(){ return (typeof JOUR_MS!=="undefined")?JOUR_MS:86400000; }
/* Un verrou de quête peut durer des heures : « 400 min » ne parle à personne.
   On passe en h/min au-delà de l'heure, en min/s en dessous. */
function _fmtDuree(ms){
  ms = Math.max(0, ms);
  const s = Math.ceil(ms/1000);
  if(s < 60) return s + " s";
  const m = Math.floor(s/60);
  if(m < 60) return m + " min " + (s%60) + " s";
  const h = Math.floor(m/60);
  if(h < 24) return h + " h " + String(m%60).padStart(2,"0");
  return Math.floor(h/24) + " j " + (h%24) + " h";
}

// Mini-jeux ratables : un essai par jour.
const DEFIS_UNTRY = new Set(["piratage","glyphes","ordre","cadenas","sequence","memoire","combat","traversee","triangulation","calques","loup"]);
/* ⚠ Le verrou ne dure plus 24 h glissantes mais jusqu'au PROCHAIN MINUIT
   PARISIEN (voir jourDeJeu / prochainResetJeu dans terrain.js). Un échec à
   23 h ne bloque donc plus toute la journée du lendemain. Repli sur l'ancien
   calcul si terrain.js n'est pas chargé, ou en mode test accéléré. */
/* ⚠ v0.91 — EXPLOIT CORRIGÉ. Le verrou vivait dans `active._echecLe`, or
   `abandonnerQuete()` remet `active` à null : abandonner puis ré-accepter la
   quête effaçait la pénalité. Il vit désormais dans `quetes.verrous`, hors de
   la quête active, indexé par « quête:étape » — l'abandon n'y touche pas.
   Les clés périmées sont nettoyées à la lecture pour ne pas gonfler `donnees`. */
function _verrous(){ const q=queteEtat(); if(!q.verrous || typeof q.verrous!=="object") q.verrous={}; return q.verrous; }
function _cleVerrou(a){ return a ? `${a.id}:${a.etape}` : null; }
/* ⚠ v0.92 — DÉLAI FIXE DE 8 HEURES, et plus « jusqu'au prochain minuit ».
   La v0.91 était passée au minuit parisien pour éviter qu'un échec à 23 h
   bloque tout le lendemain. Le cas SYMÉTRIQUE n'avait pas été vu : un échec à
   00:16 coûtait alors 23 h 44. C'est arrivé à une testeuse, sur un défi de
   séquence qu'elle avait sans doute raté à cause du gel du Simon (piège n°20) —
   punie près d'un jour pour un bug.
   Une même faute doit coûter la même chose quelle que soit l'heure. 8 h reste
   fidèle à l'intention (une tentative, puis on attend), sans jamais devenir
   absurde ni disparaître.
   ⚠ Exprimé en FRACTION de `_jourMs()` et non en 8×3600000 : `JOUR_MS` est le
   seul interrupteur pour tester vite, un délai en dur le contournerait — c'est
   exactement le piège n°16 (deux échelles de temps pour une même échéance). */
const VERROU_DEFI_H = 8;
function _verrouDefiMs(){ return Math.round(_jourMs() * VERROU_DEFI_H / 24); }

function _purgerVerrous(){
  const v=_verrous(); const d=_verrouDefiMs();
  const perime = t => (Date.now() - t) >= d;
  for(const k in v){ if(!v[k] || perime(v[k])) delete v[k]; }
}
function queteVerrou(){ const a=queteActive(); const e=etapeActive();
  if(!a || !e || !e.defi || !DEFIS_UNTRY.has(e.defi.type)) return 0;
  _purgerVerrous();
  // `a._echecLe` reste lu en secours : parties commencées avant la v0.91.
  const t = _verrous()[_cleVerrou(a)] || a._echecLe || 0;
  if(!t) return 0;
  const r = _verrouDefiMs() - (Date.now() - t);
  return r > 0 ? r : 0; }

let _queteTimer = null; let _queteTO = [];   // animation/compte à rebours + timeouts
function _clearQ(){ if(_queteTimer){ clearInterval(_queteTimer); _queteTimer=null; } _queteTO.forEach(clearTimeout); _queteTO=[]; }

/* ⚠ v0.92 — `_clearQ()` n'est appelée QU'À UN ENDROIT : la première ligne de
   `majQueteHub()`. Autrement dit, chaque redessin de l'onglet Quêtes annulait
   les minuteurs du Simon EN COURS. Or une séquence de 5 dure
   500 + 620 × 5 ≈ 3,6 s, et `chargerStocksServeur()` redessine toutes les 60 s :
   une partie sur quatre se figeait sur « Regarde… », pavés morts (`jouable`
   restait à `false`), et le joueur concluait que le mécanisme s'était
   verrouillé. Il n'y avait pourtant aucun verrou — `echouerDefi()` n'est
   appelée que depuis un clic sur un mauvais pavé.
   On suspend donc le redessin tant qu'une séquence est en cours.
   ⚠ La borne de 60 s est une soupape : si le drapeau fuyait (onglet quitté en
   pleine partie), le panneau se débloque tout seul au lieu de rester gelé. */
let _seqAnim = 0;
function _seqEnCours(){ return _seqAnim > 0 && (Date.now() - _seqAnim) < 60000; }
function _seqFin(){ _seqAnim = 0; }

/* ---------- Progression ---------- */
function accepterQuete(id){
  if(queteActive()){ journal("Termine ta quête en cours d'abord.","alerte"); return; }
  const q=queteData(id); if(!q || queteEtat().done.includes(id)) return;
  queteEtat().active={ id, etape:0, _sur:false, _resolu:false, _echecLe:0, _attenteLe:0, _memVue:false };
  journal(`Quête acceptée : ${q.nom}. Onglet Quêtes → suis l'objectif.`,"gain");
  sauvegarder(); rafraichirQuetes();
}
function abandonnerQuete(){
  if(!queteActive()) return;
  // v0.91 : le message ne promet plus une remise à zéro complète — les verrous restent.
  if(!confirm("Abandonner la quête en cours ? Tu pourras la reprendre depuis le début, mais un échec récent reste bloqué jusqu'à minuit.")) return;
  queteEtat().active=null; journal("Quête abandonnée.","alerte");
  sauvegarder(); rafraichirQuetes();
}
async function avancerQuete(){
  const a=queteActive(); if(!a) return; const q=queteData(a.id);
  a.etape++; a._sur=false; a._resolu=false; a._echecLe=0; a._attenteLe=0; a._memVue=false; a._cadSecret=null; a._cadEssais=0; a._cadHist=[]; a._trav=null;
  a._chasse=null; a._affut=null; a._calq=null; a._loup=null; a._bete=null; a._beteCercle=null;   // v1.00
  /* v1.02 — l'état des mini-jeux générés était remis à zéro à l'ÉCHEC mais pas en
     passant à l'étape suivante : une 2ᵉ triangulation / tuyauterie / labyrinthe dans
     la même quête aurait repris la source ou la grille de la précédente. */
  a._tuy=null; a._tri=null; a._lab=null;
  if(typeof sauverMaintenant==="function") sauverMaintenant();   // v0.65 : une étape franchie ne doit pas tenir à 2,5 s de minuterie
  if(a.etape >= q.etapes.length){
    /* v0.97 — une récompense LIÉE (la bouture) ne se perd pas faute de place :
       si le sac est plein, on revient à la dernière étape, résolue, et le joueur
       relance la remise une fois la place faite. */
    if(await terminerQuete() === false){
      a.etape = q.etapes.length - 1; a._resolu = true; a._sur = true;
      sauvegarder(); rafraichirQuetes();
    }
  }
  else { const e=etapeActive(); journal("Étape suivante"+(e&&e.indice?` : « ${e.indice} »`:"")+".","gain"); sauvegarder(); }
  rafraichirQuetes();

  /* ⚠ On vient de remettre a._sur à false, or queteArrivee() n'est appelée que
     depuis voyager() — donc seulement APRÈS un déplacement. Si l'étape suivante
     est au même endroit que la précédente (Q4 2→3 et 3→4, Q5 3→4 : moins de
     80 u d'écart, soit le rayon de la cible), le joueur se retrouvait devant un
     panneau lui demandant d'aller là où il se tient déjà, et devait s'éloigner
     puis revenir pour débloquer. On réévalue donc la présence tout de suite.
     Le garde-fou évite une récursion si deux étapes SANS défi se suivaient au
     même point : queteArrivee() rappellerait avancerQuete() en boucle. */
  if(!_avanceEnChaine){
    _avanceEnChaine = true;
    try{ queteArrivee(); } finally { _avanceEnChaine = false; }
  }
}
let _avanceEnChaine = false;
async function terminerQuete(){
  const a=queteActive(); if(!a) return; const q=queteData(a.id); const r=q.recompense||{};
  /* v0.97 — objets liés : remis en TOUT-OU-RIEN, et AVANT tout autre gain (sinon
     un échec après les crédits les ferait verser deux fois à la relance). */
  const lies = r.objets ? Object.keys(r.objets).filter(id => typeof estObjetLie==="function" && estObjetLie(id)) : [];
  if(lies.length){
    const ok = await agirServeur({ ajouter:r.objets, motif:"quete_recompense", toutOuRien:true });
    if(!ok){
      const it = (typeof item==="function") ? item(lies[0]) : null;
      journal(`Fais de la place dans ton sac pour recevoir : ${it ? it.nom : lies[0]}. Puis valide à nouveau la dernière étape.`,"alerte");
      return false;
    }
  }
  const gainQ = r.credits ? ((typeof aptCredits==="function") ? aptCredits(r.credits) : r.credits) : 0;   // Négociant (no3)
  if(gainQ) etat.credits += gainQ;
  if(!lies.length && r.objets && Object.keys(r.objets).length) await agirServeur({ ajouter:r.objets, motif:"quete_recompense" });
  /* v0.91 — la Navette de réserve démarre son compte à rebours À LA REMISE,
     pas à l'équipement : dix jours, qu'on s'en serve ou non. */
  if(r.objets && r.objets[typeof NAVETTE_CADEAU!=="undefined" ? NAVETTE_CADEAU : "navette_reserve"]
     && typeof navetteCadeauPosee==="function") navetteCadeauPosee();
  const paDonne = (r.pa && !_paDejaRecu(a.id)) ? r.pa : 0;   // v1.03 : jamais deux fois
  if(paDonne && typeof gagnerPA==="function"){ gagnerPA(paDonne); _marquerPaRecu(a.id); }
  if(r.xp && typeof gagnerXp==="function") gagnerXp(r.xp);
  if(r.flags) for(const k in r.flags){ etat[k]=r.flags[k]; }
  queteEtat().done.push(a.id); queteEtat().active=null;
  if(typeof sauverMaintenant==="function") sauverMaintenant();   // v0.65 : une quête terminée part TOUT DE SUITE au serveur
  const parts=[]; if(gainQ) parts.push(`+${gainQ} ₡`); if(r.xp) parts.push(`+${r.xp} XP`); if(paDonne) parts.push(`+${paDonne} PA`);
  if(r.objets) for(const id in r.objets){ const it=(typeof item==="function")?item(id):null; parts.push(`+${r.objets[id]} ${it?it.nom:id}`); }
  if(r.flags && r.flags.permisVaisseau) parts.push("🚀 Permis de vaisseau obtenu !");
  journal(`Quête « ${q.nom} » accomplie ! ${parts.join(", ")}`.trim(),"gain");
  sauvegarder();
  return true;
}

/* ---------- Réussite / échec partagés ---------- */
function reussirDefi(){ const a=queteActive(); if(!a) return; a._resolu=true; a._echecLe=0; a._attenteLe=0;
  delete _verrous()[_cleVerrou(a)];
  sauvegarder(); rafraichirQuetes(); }
function echouerDefi(msg){ const a=queteActive(); if(!a) return;
  a._echecLe=Date.now();
  _verrous()[_cleVerrou(a)] = Date.now();   // v0.91 : le verrou survit à l'abandon
  a._memVue=false; a._cadSecret=null; a._cadEssais=0; a._cadHist=[]; a._trav=null; a._tuy=null; a._tri=null; a._lab=null;
  a._calq=null; a._loup=null;   // v1.00 : une partie ratée repart de zéro
  journal(msg||"Échec — reviens tenter à nouveau plus tard.","alerte"); sauvegarder(); rafraichirQuetes(); }

/* ---------- Modules de défi : rendu ---------- */
function _defiHTML(d){
  if(!d) return "";
  switch(d.type){
    case "choix":     return _htmlChoix(d);
    case "combat":    return _htmlCombat(d);
    case "enigme":    return _htmlEnigme(d);
    case "livraison": return _htmlLivraison(d);
    case "paiement":  return _htmlPaiement(d);
    case "attente":   return _htmlAttente(d);
    case "piratage":  return _htmlPiratage(d);
    case "glyphes":   return _htmlGlyphes(d);
    case "ordre":     return _htmlOrdre(d);
    case "cadenas":   return _htmlCadenas(d);
    case "sequence":  return _htmlSequence(d);
    case "memoire":   return _htmlMemoire(d);
    case "traversee": return _htmlTraversee(d);
    case "tuyauterie": return _htmlTuyauterie(d);
    case "triangulation": return _htmlTriangulation(d);
    case "labyrinthe": return _htmlLabyrinthe(d);
    case "scene":     return _htmlScene(d);
    case "chasse":    return _htmlChasse(d);
    case "affut":     return _htmlAffut(d);
    case "calques":   return _htmlCalques(d);
    case "loup":      return _htmlLoup(d);
    default:          return `<p class="vide">Épreuve « ${d.type} » (à venir).</p>`;
  }
}
function _defiWire(z, d){
  if(!d || !z) return;
  switch(d.type){
    case "choix":     _wireChoix(z,d); break;
    case "combat":    _wireCombat(z,d); break;
    case "enigme":    _wireEnigme(z,d); break;
    case "livraison": _wireLivraison(z,d); break;
    case "paiement":  _wirePaiement(z,d); break;
    case "attente":   _wireAttente(z,d); break;
    case "piratage":  _wirePiratage(z,d); break;
    case "glyphes":   _wireGlyphes(z,d); break;
    case "ordre":     _wireOrdre(z,d); break;
    case "cadenas":   _wireCadenas(z,d); break;
    case "sequence":  _wireSequence(z,d); break;
    case "memoire":   _wireMemoire(z,d); break;
    case "traversee": _wireTraversee(z,d); break;
    case "tuyauterie": _wireTuyauterie(z,d); break;
    case "triangulation": _wireTriangulation(z,d); break;
    case "labyrinthe": _wireLabyrinthe(z,d); break;
    case "scene":     _wireScene(z,d); break;
    case "chasse":    _wireChasse(z,d); break;
    case "affut":     _wireAffut(z,d); break;
    case "calques":   _wireCalques(z,d); break;
    case "loup":      _wireLoup(z,d); break;
  }
}

/* v1.00 — SCÈNE : une étape SANS épreuve dont on doit pouvoir LIRE l'arrivée.
   ⚠ Une étape sans `defi` est franchie d'office par queteArrivee() : son texte
   ne s'affichait jamais. `scene` montre l'arrivée puis un bouton. Pas ratable,
   pas d'écran de réussite (on passe directement à l'étape suivante — ou on
   termine la quête si c'est la dernière). `bouton` facultatif. */
function _htmlScene(d){
  return `<div class="quete-rep"><button class="mini" id="q-scene">${d.bouton||"Continuer →"}</button></div>`;
}
function _wireScene(z, d){
  const b=z.querySelector("#q-scene"); if(!b) return;
  b.addEventListener("click", async ()=>{
    if(b.disabled) return; b.disabled=true;   // ⚠ double clic = étape sautée
    /* v1.00b — `rendre:"bouture"` : l'objet lié est rendu (Q15, à Adaya). Seul
       le serveur peut le retirer (bouture_rendre ; le trigger des objets liés
       refuse tout le reste). La sauvegarde part AVANT : la RPC vérifie l'étape. */
    if(d.rendre==="bouture"){
      try{ if(typeof sauverSurServeur==="function") await sauverSurServeur(); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"quetes.js#rendre"); }
      let data=null, error=null;
      try{ ({ data, error } = await sb.rpc("bouture_rendre")); }catch(e){ error=e; }
      if(error || !data || !data.ok){
        journal((data && data.err==="hors_quete") ? "Ta progression n'est pas encore enregistrée. Réessaie dans un instant." : "Le serveur ne répond pas. Réessaie dans un instant.","alerte");
        b.disabled=false; return;
      }
      if(typeof chargerStocksServeur==="function") await chargerStocksServeur();
      journal("Tu as rendu la bouture à Adaya.","gain");
    }
    avancerQuete();
  });
}

/* ---------- v1.00 — CHASSE « chaud / froid » (Q15, non ratable) ----------
   Aucun bouton en route : après CHAQUE déplacement (queteArrivee → _chasseSignal),
   la bouture dit si l'on s'est rapproché (plus chaud) ou éloigné (plus froid) de
   la cible, et un palier donne la chaleur absolue. La cible n'a pas de repère
   (étape `cache:true`). Sur place : un bouton, et c'est gagné. Le prix est le
   trajet lui-même (O₂, énergie, patrouilles) — R4. */
const CHASSE_PALIERS = [ [1100,"glacial"], [800,"froid"], [500,"frais"], [300,"tiède"], [150,"chaud"], [0,"brûlant"] ];
const CHASSE_ZONE_MORTE = 10;   // u : en dessous, « même rythme »
function _chassePalier(d){ for(let i=0;i<CHASSE_PALIERS.length;i++) if(d>=CHASSE_PALIERS[i][0]) return i; return CHASSE_PALIERS.length-1; }
function _chasseDist(){
  const e=etapeActive(); const c=_cibleResolue(e && e.cible); if(!c || c.carte!==_carteJoueur()) return null;
  const p=_posJoueur(c.carte); return p ? Math.hypot(p.x-c.x, p.y-c.y) : null;
}
function _chasseSignal(){
  const a=queteActive(), e=etapeActive(); if(!a || a._resolu || !e || !e.defi || e.defi.type!=="chasse") return;
  const d=_chasseDist(); if(d==null) return;
  const prev = a._chasse ? a._chasse.d : null;
  const sens = prev==null ? null : (d < prev-CHASSE_ZONE_MORTE ? "chaud" : d > prev+CHASSE_ZONE_MORTE ? "froid" : "egal");
  a._chasse = { d:Math.round(d), sens };
  const mot = CHASSE_PALIERS[_chassePalier(d)][1];
  const msg = sens==="chaud" ? "Dans ton sac, la bouture bat plus vite. Plus chaud"
            : sens==="froid" ? "Dans ton sac, la bouture ralentit. Plus froid"
            : sens==="egal"  ? "La bouture bat au même rythme"
            :                  "La bouture s'est mise à battre";
  journal(`${msg} — ${mot}.`, sens==="chaud" ? "gain" : "", "voyage");
  sauvegarder(); rafraichirQuetes();
}
/* Panneau de route (hors cible) : la bouture qui bat + une jauge à 6 paliers
   (jamais la distance exacte : ce serait une triangulation). */
function _chasseRouteHtml(){
  const a=queteActive(); const c=a && a._chasse; const d = c ? c.d : _chasseDist();
  if(d==null) return `<p class="vide">Ici, la bouture ne te dit rien. Retourne sur Silène.</p>`;
  const i=_chassePalier(d), n=CHASSE_PALIERS.length;
  const periode=(0.35 + (n-1-i)*0.5).toFixed(2);   // brûlant 0,35 s … glacial 2,85 s
  const sens = !c||!c.sens ? "" : c.sens==="chaud" ? " · ↑ plus chaud" : c.sens==="froid" ? " · ↓ plus froid" : " · = pareil";
  const img = (typeof imgBouture==="function") ? imgBouture() : "";
  return `<div class="quete-chasse"><span class="q-bouture-bat" style="animation-duration:${periode}s"><img src="${img}" alt="" onerror="this.remove()"></span>
    <div style="flex:1"><div class="q-thermo"><i style="width:${Math.round((i+1)/n*100)}%"></i></div>
    <p style="margin:6px 0 0"><b>${CHASSE_PALIERS[i][1]}</b>${sens}</p></div></div>`;
}
function _htmlChasse(d){
  return `<div class="quete-etape">${_par(d.texte)}<div class="quete-rep"><button class="mini" id="q-chasse">${d.bouton||"Chercher ici"}</button></div></div>`;
}
function _wireChasse(z, d){
  const b=z.querySelector("#q-chasse"); if(!b) return;
  b.addEventListener("click", ()=>{ if(b.disabled) return; b.disabled=true; reussirDefi(); });
}

/* ---------- v1.00 — AFFÛT (Q15, non ratable) ----------
   Revenir sur place N jours de jeu DIFFÉRENTS (minuit, heure de Paris). Un par
   jour ; manquer un jour ne fait rien perdre. `nuits` : une phrase par jour tenu.
   ⚠ v1.02 — LES JOURS SONT DATÉS PAR LE SERVEUR (table `quete_affut`, RPC
   `affut_etat` / `affut_tenir`, v102_credits_affut.sql). Avant, le compteur et
   la date vivaient dans `donnees` et suivaient l'horloge de l'appareil : changer
   l'heure du téléphone validait les 5 jours en une minute.
   `a._affut = { n, dernier:"AAAA-MM-JJ" }` n'est plus qu'un REFLET du serveur,
   relu une fois par étape et par session (`_affutLu`).
   ⚠ Le mode test accéléré (JOUR_MS) ne s'applique plus ici : jour_jeu() serveur. */
let _affutLu = null;
function _affutDeja(f){ return !!(f && f.dernier) && (typeof jourDeJeu==="function") && f.dernier === jourDeJeu(); }
function _affutLire(a){
  const cle=_cleVerrou(a); if(_affutLu===cle || typeof sb==="undefined" || !sb) return;
  _affutLu=cle;
  (async ()=>{
    let data=null; try{ ({ data } = await sb.rpc("affut_etat", { p_quete:a.id })); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"quetes.js#affut"); }
    if(!data || !data.ok){ _affutLu=null; return; }
    const b=queteActive(); if(!b || _cleVerrou(b)!==cle) return;
    b._affut={ n:data.n|0, dernier:data.dernier||null }; sauvegarder(); rafraichirQuetes();
  })();
}
function _htmlAffut(d){
  const a=queteActive(); const f=(a && a._affut) || { n:0, dernier:null }; const N=d.jours||5; const deja=_affutDeja(f);
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Jours d'affût : <b>${f.n}/${N}</b>. ${deja ? "Tu as tenu l'affût aujourd'hui : reviens un autre jour (après minuit, heure de Paris)." : "Un jour d'affût par jour. Tu peux partir et revenir : manquer un jour ne te fait rien perdre."}</p>
    <div class="quete-rep"><button class="mini" id="q-affut" ${deja?"disabled":""}>${d.bouton||"Tenir l'affût aujourd'hui"}</button></div></div>`;
}
function _wireAffut(z, d){
  { const a=queteActive(); if(a) _affutLire(a); }
  const b=z.querySelector("#q-affut"); if(!b) return;
  b.addEventListener("click", async ()=>{
    if(b.disabled) return; b.disabled=true;
    const a=queteActive(); if(!a) return; const N=d.jours||5;
    // La RPC vérifie l'étape dans `donnees` : on sauve d'abord (comme bete_adopter).
    try{ if(typeof sauverSurServeur==="function") await sauverSurServeur(); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"quetes.js#affut"); }
    let data=null, error=null;
    try{ ({ data, error } = await sb.rpc("affut_tenir", { p_quete:a.id })); }catch(e){ error=e; }
    if(error || !data || !data.ok){
      journal((data && data.err==="hors_quete") ? "Ta progression n'est pas encore enregistrée. Réessaie dans un instant." : "Le serveur ne répond pas. Réessaie dans un instant.","alerte");
      b.disabled=false; return;
    }
    a._affut={ n:data.n|0, dernier:data.dernier||null };
    if(data.deja){ journal("Tu as déjà tenu l'affût aujourd'hui. Reviens après minuit (heure de Paris).","alerte"); sauvegarder(); rafraichirQuetes(); return; }
    const ph = Array.isArray(d.nuits) ? d.nuits[a._affut.n-1] : null;
    if(ph) journal(ph, "", "voyage");
    if(a._affut.n >= N){ reussirDefi(); return; }
    journal(`Affût : ${a._affut.n}/${N}. Reviens un autre jour.`, "gain");
    sauvegarder(); rafraichirQuetes();
  });
}

/* ---------- v1.00 — CALQUES (Q15, ratable) ----------
   La révélation de Q15 : la silène TRANSMET. Trois bandes de pulsations :
     A — l'appel relevé au quai (référence, fixe, propre) ;
     B — la lueur de la silène (mobile) ;
     C — les marques des bêtes : la vague RENVOYÉE, donc À L'ENVERS (mobile, ⇄).
   Le motif est la CADENCE DU PÉRIMÈTRE (hauteurs = CADENCE_PERIMETRE + 1).
   Gagné si B et C (retournée) portent le motif exactement sous celui de A.
   Difficulté (cadrage) : bruit ; faux alignements à 3-4 sur 5 ; C à l'envers ;
   précision à la case, sans aimantation ; 3 vérifications ; l'échec ne dit
   PAS combien de pulsations coïncident. Unicité de la solution vérifiée à la
   génération. Puzzle tiré une fois, gardé dans `a._calq` (effacé à l'échec). */
const CALQ_N = 40, CALQ_ESSAIS = 3;
function _calqMotif(){ return CADENCE_PERIMETRE.map(v=>v+1); }
function _calqCorrespond(bande, o, pA, M){   // la bande, décalée de o colonnes, porte-t-elle M sous pA ?
  for(let j=0;j<M.length;j++){ const i=pA+j-o; if(i<0 || i>=bande.length || bande[i]!==M[j]) return false; }
  return true;
}
function _calqSolutions(bande, pA, M){ const s=[]; for(let o=-CALQ_N;o<=CALQ_N;o++) if(_calqCorrespond(bande,o,pA,M)) s.push(o); return s; }
function _calqGenerer(){
  const M=_calqMotif(), L=M.length, N=CALQ_N, pA=17, rnd=n=>Math.floor(Math.random()*n);
  const bruit=(dens)=>Array.from({length:N},()=>Math.random()<dens ? 1+rnd(4) : 0);
  const poser=(arr,pos,mot)=>{ for(let j=0;j<mot.length;j++) arr[pos+j]=mot[j]; };
  const abime=(k)=>{ const m=M.slice(); const idx=new Set(); while(idx.size<k) idx.add(rnd(L)); idx.forEach(i=>{ m[i] = m[i]===4 ? 0 : (Math.random()<.5 ? 0 : m[i]+1); }); return m; };  // 0 = pulsation manquante
  const placer=(arr, mots)=>{ // positions sans chevauchement (écart ≥ 1)
    const libres=[]; for(let p=1;p<=N-L-1;p++) libres.push(p);
    const pris=[]; for(const mot of mots){ let ok=false;
      for(let essai=0; essai<60 && !ok; essai++){ const p=libres[rnd(libres.length)]; if(pris.every(q=>Math.abs(q-p)>L)){ pris.push(p); poser(arr,p,mot); ok=true; } }
      if(!ok) return null; }
    return pris; };
  for(let tour=0; tour<500; tour++){
    const B=bruit(.33), Cv=bruit(.33);   // Cv = C dans le BON sens (après ⇄)
    const pb=placer(B, [M, abime(1), abime(1), abime(2)]); if(!pb) continue;
    // Tentation : dans C affichée non retournée, un faux motif à l'endroit (4 sur 5).
    const pc=placer(Cv, [M, abime(1), abime(2), abime(1).slice().reverse()]); if(!pc) continue;
    const C0=Cv.slice().reverse();       // ce que le joueur voit au départ
    const sB=_calqSolutions(B,pA,M), sCv=_calqSolutions(Cv,pA,M), sC0=_calqSolutions(C0,pA,M);
    if(sB.length!==1 || sCv.length!==1 || sC0.length!==0) continue;
    return { A:(()=>{ const a=Array(N).fill(0); poser(a,pA,M); return a; })(), B, C:C0, pA,
             oB:0, oC:0, inv:false, essais:0, solB:sB[0], solC:sCv[0] };
  }
  return null;
}
function _calqEtat(){ const a=queteActive(); if(!a) return null; if(!a._calq){ a._calq=_calqGenerer(); sauvegarder(); } return a._calq; }
function _calqBandeVue(c, quoi){   // tableau de N valeurs tel qu'affiché (décalage, retournement)
  const src = quoi==="A" ? c.A : quoi==="B" ? c.B : (c.inv ? c.C.slice().reverse() : c.C);
  const o = quoi==="A" ? 0 : quoi==="B" ? c.oB : c.oC;
  return Array.from({length:CALQ_N},(_,col)=>{ const i=col-o; return (i>=0 && i<src.length) ? src[i] : null; });
}
function _calqLigneHtml(c, quoi){
  return _calqBandeVue(c,quoi).map(v=>`<span class="qc-c${v===null?" qc-hors":""}"><i style="height:${v?v*25:0}%"></i></span>`).join("");
}
function _htmlCalques(d){
  const c=_calqEtat(); if(!c) return `<p class="vide">Le signal est trop brouillé. Reviens plus tard.</p>`;
  const reste=CALQ_ESSAIS-c.essais;
  const ligne=(quoi, nom, mobile)=>`<div class="qc-bloc"><div class="qc-tete"><span>${nom}</span>${mobile?`<span class="qc-cmd">
      ${quoi==="C"?`<button class="mini" data-qc-inv>⇄</button>`:""}<button class="mini" data-qc="${quoi}" data-d="-1">◀</button><button class="mini" data-qc="${quoi}" data-d="1">▶</button></span>`:""}</div>
    <div class="qc-ligne qc-${quoi}" data-qc-ligne="${quoi}">${_calqLigneHtml(c,quoi)}</div></div>`;
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Fais glisser les deux bandes du bas (au doigt, ou ◀ ▶ case par case) jusqu'à ce que les trois signaux se superposent exactement. ${CALQ_ESSAIS} vérifications au plus — après, tu dois attendre ${VERROU_DEFI_H} h.</p>
    <div class="qc-zone">${ligne("A","Appel du quai",false)}${ligne("B","Lueur de la silène",true)}${ligne("C","Marques des bêtes",true)}</div>
    <div class="quete-rep" style="margin-top:10px"><button class="mini" id="q-calq-ok">Superposer (${reste} restante${reste>1?"s":""})</button></div></div>`;
}
function _wireCalques(z, d){
  const c=_calqEtat(); if(!c) return;
  const redessiner=(quoi)=>{ const el=z.querySelector(`[data-qc-ligne="${quoi}"]`); if(el) el.innerHTML=_calqLigneHtml(c,quoi); };
  const borne=o=>Math.max(-CALQ_N+5, Math.min(CALQ_N-5, o));
  const decaler=(quoi, delta)=>{ if(quoi==="B") c.oB=borne(c.oB+delta); else c.oC=borne(c.oC+delta); redessiner(quoi); };
  z.querySelectorAll("[data-qc]").forEach(b=>b.addEventListener("click", ()=>{ decaler(b.dataset.qc, parseInt(b.dataset.d,10)); sauvegarder(); }));
  const inv=z.querySelector("[data-qc-inv]"); if(inv) inv.addEventListener("click", ()=>{ c.inv=!c.inv; redessiner("C"); sauvegarder(); });
  // Glisser au doigt : une case par largeur de case, sans aimantation.
  ["B","C"].forEach(quoi=>{
    const el=z.querySelector(`[data-qc-ligne="${quoi}"]`); if(!el) return; let x0=null, o0=0;
    el.addEventListener("pointerdown", ev=>{ x0=ev.clientX; o0=(quoi==="B"?c.oB:c.oC); if(el.setPointerCapture) try{ el.setPointerCapture(ev.pointerId); }catch(_){} });
    el.addEventListener("pointermove", ev=>{ if(x0===null) return; const w=(el.getBoundingClientRect().width||CALQ_N*8)/CALQ_N;
      const o=borne(o0+Math.round((ev.clientX-x0)/w)); if(quoi==="B"){ if(o!==c.oB){ c.oB=o; redessiner("B"); } } else if(o!==c.oC){ c.oC=o; redessiner("C"); } });
    const fin=()=>{ if(x0!==null){ x0=null; sauvegarder(); } };
    el.addEventListener("pointerup", fin); el.addEventListener("pointercancel", fin);
  });
  const ok=z.querySelector("#q-calq-ok");
  ok.addEventListener("click", ()=>{
    if(ok.disabled) return; ok.disabled=true;
    const M=_calqMotif();
    const bonB=_calqCorrespond(c.B, c.oB, c.pA, M);
    const bonC=c.inv && _calqCorrespond(c.C.slice().reverse(), c.oC, c.pA, M);
    if(bonB && bonC){ journal("Les trois signaux n'en font plus qu'un.","gain"); reussirDefi(); return; }
    c.essais++; sauvegarder();
    if(c.essais>=CALQ_ESSAIS){ echouerDefi(`Ça ne coïncide pas. Le signal se brouille, la vague est passée. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
    journal(`Ça ne coïncide pas. (${CALQ_ESSAIS-c.essais} vérification${CALQ_ESSAIS-c.essais>1?"s":""} restante${CALQ_ESSAIS-c.essais>1?"s":""})`,"alerte");
    rafraichirQuetes();
  });
}

/* ---------- v1.00 — PAS DE LOUP (Q15, ratable) ----------
   Casse-tête au tour par tour, AUCUN réflexe. Grille (d.niveau) : massifs de
   silène (obstacles, ils cachent), cinq bêtes au regard cyclique. Un coup =
   une case (N/E/S/O) ou attendre ; puis la vague passe : les regards tournent.
   Si, la vague retombée, tu es dans un regard, elles fuient → échec. Les
   regards de la PROCHAINE vague sont affichés : c'est de la prévoyance, pas du
   hasard. Toucher une case vue demande confirmation (pas d'échec par erreur de
   doigt). Niveau choisi par recherche : plus court chemin 24 coups dont 3
   attentes (outil hors projet, vérifié par BFS dans le test). */
const LOUP_DIR = { N:[0,-1], E:[1,0], S:[0,1], O:[-1,0] };
function _loupVus(nv, t){
  const s=new Set(), obs=new Set(nv.obs);
  for(const b of nv.betes){ const dd=LOUP_DIR[b.cyc[t % b.cyc.length]]; let x=b.x+dd[0], y=b.y+dd[1];
    while(x>=0 && y>=0 && x<nv.w && y<nv.h && !obs.has(x+","+y) && !nv.betes.some(o=>o.x===x && o.y===y)){ s.add(x+","+y); x+=dd[0]; y+=dd[1]; } }
  return s;
}
function _loupBloque(nv, x, y){ return x<0 || y<0 || x>=nv.w || y>=nv.h || nv.obs.includes(x+","+y) || nv.betes.some(b=>b.x===x && b.y===y); }
function _loupEtat(nv){ const a=queteActive(); if(!a) return null; if(!a._loup){ a._loup={ x:nv.dep.x, y:nv.dep.y, t:0, coups:0 }; sauvegarder(); } return a._loup; }
function _htmlLoup(d){
  const nv=d.niveau, L=_loupEtat(nv); if(!nv || !L) return "";
  const prochain=_loupVus(nv, L.t+1), fleche={N:"▲",E:"▶",S:"▼",O:"◀"};
  let g="";
  for(let y=0;y<nv.h;y++) for(let x=0;x<nv.w;x++){
    const k=x+","+y, bete=nv.betes.find(b=>b.x===x && b.y===y);
    const moi=(L.x===x && L.y===y), cib=(nv.cib.x===x && nv.cib.y===y);
    const voisin=(Math.abs(L.x-x)+Math.abs(L.y-y)===1) && !_loupBloque(nv,x,y);
    const cls=["ql-c", nv.obs.includes(k)?"ql-obs":"", bete?"ql-bete":"", prochain.has(k)?"ql-vu":"", cib?"ql-cib":"", moi?"ql-moi":"", voisin?"ql-pas":""].join(" ");
    const txt = bete ? `✦<small>${fleche[bete.cyc[(L.t+1)%bete.cyc.length]]}</small>` : moi ? "●" : cib ? "◎" : "";
    g+=`<button class="${cls}" data-ql="${x},${y}" ${voisin?"":"tabindex=-1"}>${txt}</button>`;
  }
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Touche une case voisine pour avancer, ou attends. Après chaque coup, la vague passe et les regards tournent. <b>Les cases orangées sont celles que les bêtes verront à la prochaine vague</b> (✦ : une bête, la flèche : où elle regardera). Atteins le ◎ sans être vu. Vague n° ${L.t+1}.</p>
    <div class="ql-grille" style="grid-template-columns:repeat(${nv.w},1fr)">${g}</div>
    <div class="quete-rep" style="margin-top:10px"><button class="mini" id="q-loup-att">Attendre une vague</button></div></div>`;
}
function _wireLoup(z, d){
  const nv=d.niveau, L=_loupEtat(nv); if(!nv || !L) return;
  let occupe=false;
  const jouer=(nx, ny)=>{
    if(occupe) return; occupe=true;
    const vus=_loupVus(nv, L.t+1);
    if(vus.has(nx+","+ny) && !confirm("Elles te verront, à cette vague. Y aller quand même ?")){ occupe=false; return; }
    L.x=nx; L.y=ny; L.t++; L.coups++; sauvegarder();
    if(vus.has(nx+","+ny)){ echouerDefi(`La vague retombe, et cinq regards se posent sur toi. Un froissement, et il n'y a plus rien. Elles reviendront — toi aussi, dans ${VERROU_DEFI_H} h.`); return; }
    if(nx===nv.cib.x && ny===nv.cib.y){ journal("Tu es au milieu d'elles. Aucune ne bouge.","gain"); reussirDefi(); return; }
    rafraichirQuetes();
  };
  z.querySelectorAll(".ql-pas").forEach(b=>b.addEventListener("click", ()=>{ const [x,y]=b.dataset.ql.split(",").map(Number); jouer(x,y); }));
  const att=z.querySelector("#q-loup-att"); if(att) att.addEventListener("click", ()=>jouer(L.x, L.y));
}

/* énigme (illimité)
   Pas de bouton « Indice » permanent : on cherche d'abord. Mais après
   ENIG_SEUIL mauvaises réponses, l'indice apparaît de lui-même — un joueur
   qui a la bonne idée sans trouver le mot exact ne doit pas rester coincé.
   ⚠ Le compteur est volontairement NON persistant : il repart à zéro si on
   quitte l'onglet, ce qui laisse une seconde chance à qui revient reposé.
   ⚠ `d.indice` est l'indice de l'ÉNIGME. À ne pas confondre avec `e.indice`,
   l'indice d'OBJECTIF (~ligne 532), qui dit où aller sur la carte. */
const ENIG_SEUIL = 3;
let _enigEchecs = 0;
function _htmlEnigme(d){
  _enigEchecs = 0;
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">${d.question}</p>
    <div class="quete-rep"><input id="q-enig-champ" placeholder="Ta réponse…" autocomplete="off"><button class="mini" id="q-enig-btn">Valider</button></div>
    ${d.indice?`<p class="vide" id="q-enig-txt" hidden style="margin:8px 0 0">💡 ${d.indice}</p>`:""}
  </div>`;
}
function _wireEnigme(z,d){
  const b=z.querySelector("#q-enig-btn"), c=z.querySelector("#q-enig-champ");
  const go=()=>{
    if((d.reponses||d.reponse||[]).map(_qnorm).includes(_qnorm(c.value))){
      journal("Bonne réponse !","gain"); reussirDefi(); return;
    }
    _enigEchecs++;
    const tx = z.querySelector("#q-enig-txt");
    if(d.indice && tx && tx.hidden && _enigEchecs >= ENIG_SEUIL){
      tx.hidden = false;
      journal("Mauvaise réponse. Un indice vient d'apparaître sous la question.","alerte");
    } else {
      journal("Mauvaise réponse. Réessaie.","alerte");
    }
  };
  if(b&&c){ b.addEventListener("click",go); c.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }); }
}

/* livraison (non ratable) */
function _htmlLivraison(d){
  const objs=d.objets||{};
  const lignes=Object.keys(objs).map(id=>{ const need=objs[id], have=etat.sac[id]||0, ok=have>=need;
    return `<div class="q-liv-ligne"><span class="picker-ic">${iconeItem(id)}</span><span class="picker-nom">${item(id)?item(id).nom:id}</span><span class="qte" style="color:${ok?'#8bd450':'#ff5257'}">${have}/${need}</span></div>`; }).join("");
  const ok=Object.keys(objs).every(id=>(etat.sac[id]||0)>=objs[id]);
  return `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">À livrer :</p>${lignes}
    <div class="quete-rep"><button class="mini" id="q-liv-btn" ${ok?"":"disabled"}>Livrer</button></div></div>`;
}
function _wireLivraison(z,d){
  const b=z.querySelector("#q-liv-btn"); if(!b) return;
  b.addEventListener("click", async ()=>{ const objs=d.objets||{};
    if(b.disabled) return; b.disabled=true;     // ⚠ double clic = livraison payée deux fois
    if(!Object.keys(objs).every(id=>(etat.sac[id]||0)>=objs[id])){ journal("Il te manque des objets.","alerte"); b.disabled=false; return; }
    // Un seul appel : tous les objets vérifiés côté serveur avant qu'un seul ne parte.
    if(!await agirServeur({ retirer:objs, motif:"quete_livraison" })){ b.disabled=false; return; }
    journal("Livraison effectuée.","gain"); reussirDefi(); });
}

/* paiement (non ratable) */
function _htmlPaiement(d){ const cout=d.cout||0, ok=etat.credits>=cout;
  return `<div class="quete-etape">${_par(d.texte)}
    <div class="quete-rep"><button class="mini" id="q-pay-btn" ${ok?"":"disabled"}>Payer ${cout} ₡</button></div>
    ${ok?"":`<p class="vide">Crédits insuffisants (${etat.credits}/${cout}).</p>`}</div>`;
}
function _wirePaiement(z,d){ const b=z.querySelector("#q-pay-btn"); if(!b) return;
  b.addEventListener("click",()=>{ if(b.disabled) return; b.disabled=true; const cout=d.cout||0; if(etat.credits<cout){ b.disabled=false; journal("Crédits insuffisants.","alerte"); return; } etat.credits-=cout; journal(`Payé ${cout} ₡.`,"gain"); reussirDefi(); }); }

/* choix (embranchement de Cercle) : options avec coût + deltas de réputation de Cercle. Définitif. */
function _coutQ_ok(cout){ if(!cout) return true;
  for(const k in cout){ const q=cout[k];
    if(k==="credits"){ if((etat.credits||0)<q) return false; }
    else if(k==="energie"){ if((etat.energie||0)<q) return false; }
    else if(k==="sante"){ if(((etat.jauges&&etat.jauges.sante)||0)<q) return false; }
    else { if((etat.sac[k]||0)<q) return false; }
  } return true;
}
async function _payerCoutQ(cout){ if(!cout) return true;
  const objets = {}; let energie = 0; const jauges = {};
  for(const k in cout){ const q=cout[k];
    if(k==="credits") continue;                        // débités APRÈS le serveur, plus bas
    else if(k==="energie") energie += q;                 // débitée par le serveur
    else if(k==="sante") jauges.sante = (jauges.sante||0) - q;      // appliquée par le serveur
    else objets[k] = (objets[k]||0) + q;                 // objets : retirés côté serveur
  }
  if(energie > 0 || Object.keys(objets).length || Object.keys(jauges).length){
    if(!await agirServeur({ cout:energie, retirer:objets, jauges, motif:"quete_choix" })) return false;
  }
  if(cout.credits) etat.credits -= cout.credits;
  return true;
}
function _coutTexteQ(cout){ if(!cout) return ""; const p=[];
  for(const k in cout){ const q=cout[k];
    if(k==="credits") p.push(`${q} ₡`);
    else if(k==="energie") p.push(`${q}% énergie`);
    else if(k==="sante") p.push(`${q} santé`);
    else p.push(`${q}× ${(typeof item==="function"&&item(k))?item(k).nom:k}`);
  } return p.join(", ");
}
function _cerclesTexteQ(cercles){ if(!cercles) return ""; const p=[];
  for(const k in cercles){ const c=(typeof CERCLES!=="undefined")?CERCLES.find(x=>x.id===k):null; const v=cercles[k]; p.push(`${v>0?"+":""}${v} ${c?c.nom:k}`); }
  return p.length?("→ "+p.join(", ")):"";
}
/* ⚠ v1.01 — FAILLE FERMÉE : cercles_ajouter acceptait n'importe quel montant.
   Chaque gain est désormais rattaché à l'ÉTAPE de quête en cours (« q7:4 »),
   payée une seule fois, plafonnée à +10 (v101_sonde_cercles.sql). La clé est
   lue AVANT reussirDefi() : c'est l'étape où le gain a été mérité. */
function _cleCercle(){ const a=queteActive(); return a ? `${a.id}:${a.etape}` : null; }
async function _appliquerCerclesQ(cercles){ if(!cercles) return;
  const cle=_cleCercle(); if(!cle) return;
  if(!etat.cercles) etat.cercles={};
  const avant = { ...etat.cercles };   // v1.01 : refus serveur → on revient en arrière
  for(const k in cercles){ etat.cercles[k]=Math.max(0,Math.min(100,(etat.cercles[k]||0)+cercles[k])); }
  // ⚠ profils.cercles est une COLONNE PROTÉGÉE : l'écriture directe est refusée
  // par le trigger de sécurité (et l'erreur était avalée ici, donc les gains de
  // Cercle échouaient en silence). On passe par la RPC dédiée.
  /* v1.02 — ÉCHEC RÉSEAU : le gain n'est plus perdu. Avant, l'erreur laissait la
     hausse affichée en local sans que le serveur l'ait reçue, et l'étape passait :
     le gain disparaissait au rechargement. On le garde dans `etat.cerclesAttente`
     (persisté dans `donnees`) et cerclesRejouer() le renvoie à la connexion.
     Sans risque de doublon : le serveur ne paie une clé d'étape qu'une fois. */
  const r = await _envoyerCercles(cle, cercles);
  if(r === "ok") return;
  if(r === "refuse"){ etat.cercles = avant; return; }
  if(!etat.cerclesAttente || typeof etat.cerclesAttente!=="object") etat.cerclesAttente={};
  etat.cerclesAttente[cle] = cercles; sauvegarder();
}
/* "ok" (payé, ou déjà payé) · "refuse" (le serveur dit non : inutile d'insister) · "echec" (réseau). */
async function _envoyerCercles(cle, cercles){
  if(typeof sb === "undefined" || !sb) return "echec";
  let data=null, error=null;
  try{ ({ data, error } = await sb.rpc("cercles_ajouter", { p_deltas: cercles, p_cle: cle })); }catch(e){ error=e; }
  if(error || !data) return "echec";
  if(data.ok){ if(data.cercles) etat.cercles = data.cercles; return "ok"; }
  console.warn("[cercles] refusé :", data.err); return "refuse";
}
/* À la connexion (bootstrap) : renvoie les gains restés en attente. */
async function cerclesRejouer(){
  const f=etat.cerclesAttente; if(!f || typeof f!=="object") return;
  for(const cle of Object.keys(f)){
    const r = await _envoyerCercles(cle, f[cle]);
    if(r === "echec") return;          // toujours hors ligne : on réessaiera à la prochaine connexion
    delete f[cle];
  }
  if(!Object.keys(f).length) delete etat.cerclesAttente;
  sauvegarder(); if(typeof afficher==="function") afficher();
}
function _htmlChoix(d){
  { const a=queteActive(); if(a && a._bete && _choixBete(d)) return _htmlNommer(d, d.options[a._bete.i]); }   // v1.00 : Q15
  const opts=(d.options||[]).map((o,i)=>{
    /* ⚠ v0.66 — le gain de Cercle (« +5 Assembleurs ») n'est PLUS annoncé :
       le joueur choisissait le camp le plus rentable au lieu de choisir ce
       qu'il pensait juste. La conséquence se découvre après coup, dans le
       journal. (_cerclesTexteQ sert encore ailleurs.) */
    const ok=_coutQ_ok(o.cout); const ct=_coutTexteQ(o.cout);
    const bi = (o.bete && typeof beteInfo==="function") ? beteInfo(o.bete) : null;   // v1.00 : l'image de la bête
    return `<div style="border:1px solid var(--line);border-radius:8px;padding:8px 10px">
      ${bi ? `<img src="${bi.img}" alt="" onerror="this.remove()" style="width:110px;height:110px;object-fit:contain;display:block;margin:0 auto 6px">` : ""}
      <button class="mini" data-choix="${i}" ${ok?"":"disabled"}>${o.texte}</button>
      <div class="quete-indice" style="margin-top:4px">${ct?`Coût : <b>${ct}</b>. `:""}${ok?"":'<span style="color:#ff5257">— ressources manquantes</span>'}</div>
    </div>`;
  }).join("");
  return `<div class="quete-etape">${_par(d.texte)}<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${opts}</div></div>`;
}
function _wireChoix(z,d){
  { const a=queteActive(); if(a && a._bete && _choixBete(d)){ _wireNommer(z, d, d.options[a._bete.i]); return; } }   // v1.00
  z.querySelectorAll("[data-choix]").forEach(b=>b.addEventListener("click", async ()=>{
    const o=(d.options||[])[parseInt(b.dataset.choix,10)]; if(!o) return;
    // ⚠ Double clic = coût payé et Cercle crédité deux fois : on gèle TOUS les choix.
    const tous=[...z.querySelectorAll("[data-choix]")]; if(tous.some(x=>x.dataset.pris)) return;
    tous.forEach(x=>{ x.dataset.pris="1"; x.disabled=true; });
    const liberer=()=>tous.forEach(x=>{ delete x.dataset.pris; x.disabled=false; });
    /* v1.00 — Q15 : choisir une bête ne scelle rien encore. On passe au nom ;
       l'adoption (serveur), puis le Cercle, viennent APRÈS le nom. */
    if(o.bete){ const a=queteActive(); if(!a) return; a._bete={ i:parseInt(b.dataset.choix,10) }; sauvegarder(); rafraichirQuetes(); return; }
    if(!_coutQ_ok(o.cout)){ journal("Ressources insuffisantes pour ce choix.","alerte"); liberer(); return; }
    if(!await _payerCoutQ(o.cout)){ liberer(); return; }
    await _appliquerCerclesQ(o.cercles);
    const ef=_cerclesTexteQ(o.cercles);   // annoncé seulement une fois le choix fait
    if(ef) journal(`Ton choix te rapproche de : ${ef}.`,"gain","quete");   // v1.13 : onglet Quêtes
    // Drapeaux posés par l'option choisie (ex. cap:"stations") — relisibles plus tard.
    if(o.flags) for(const k in o.flags){ etat[k]=o.flags[k]; }
    journal(o.journal || "Ton choix est scellé.","gain");
    if(typeof afficher==="function") afficher();
    reussirDefi();
  }));
}


/* ---------- v1.00 — NOMMER LA BÊTE (Q15, étape 6) ----------
   Après le choix : un nom, POUR LA VIE (règle : BETE_NOM_RE, data.js ; même
   règle serveur). Ordre, pour ne jamais créditer deux fois le Cercle :
   1. sauvegarde serveur (bete_adopter vérifie qu'on est à l'étape 6 de Q15) ;
   2. adoption (serveur, une seule par joueur) ;
   3. Cercle (+10), puis `_beteCercle` sauvegardé ;  4. étape réussie.
   Si le serveur répond « déjà adoptée » (rechargement au mauvais moment), on
   reprend sa réponse comme vérité et on ne recrédite pas un Cercle déjà versé. */
function _choixBete(d){ return !!(d && Array.isArray(d.options) && d.options.some(o=>o.bete)); }
function _htmlNommer(d, o){
  const bi = (o && typeof beteInfo==="function") ? beteInfo(o.bete) : null; if(!bi) return "";
  return `<div class="quete-etape">
    <img src="${bi.img}" alt="" onerror="this.remove()" style="width:150px;height:150px;object-fit:contain;display:block;margin:0 auto 8px">
    <p class="quete-dial">${d.nommer || "Elle reste près de toi. Il lui faut un nom."}</p>
    <p class="quete-indice">⚠ Ce nom est <b>pour la vie</b> : tu ne pourras jamais le changer. 2 à 20 lettres ; espaces, tirets et apostrophes seulement entre deux lettres.</p>
    <div class="quete-rep" style="gap:8px;flex-wrap:wrap"><input id="q-bete-nom" maxlength="20" autocomplete="off" placeholder="Son nom" style="min-height:40px;flex:1;min-width:160px">
      <button class="mini" id="q-bete-ok" disabled>Donner ce nom</button></div>
    <p id="q-bete-msg" class="itip-gris" style="margin-top:6px"></p>
    <button class="mini" id="q-bete-retour" style="margin-top:6px">← Revenir au choix</button></div>`;
}
function _wireNommer(z, d, o){
  const c=z.querySelector("#q-bete-nom"), ok=z.querySelector("#q-bete-ok"), msg=z.querySelector("#q-bete-msg"), ret=z.querySelector("#q-bete-retour");
  if(!c || !ok) return;
  const verifier=()=>{ const v=beteNomValide(c.value); ok.disabled=!v; msg.textContent = (c.value.trim() && !v) ? "Ce nom n'est pas accepté." : ""; };
  c.addEventListener("input", verifier);
  if(ret) ret.addEventListener("click", ()=>{ const a=queteActive(); if(!a || a._beteCercle) return; a._bete=null; sauvegarder(); rafraichirQuetes(); });
  ok.addEventListener("click", async ()=>{
    if(ok.disabled) return; const nom=beteNomNormal(c.value); if(!beteNomValide(nom)) return;
    if(!confirm(`« ${nom} ». C'est pour la vie : tu ne pourras jamais le changer. Sûr ?`)) return;
    ok.disabled=true; c.disabled=true; if(ret) ret.disabled=true;
    const a=queteActive(); if(!a) return;
    const reprendre=(t)=>{ msg.textContent=t; ok.disabled=false; c.disabled=false; if(ret) ret.disabled=false; };
    try{ if(typeof sauverSurServeur==="function") await sauverSurServeur(); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"quetes.js#nommer"); }
    let data=null, error=null;
    try{ ({ data, error } = await sb.rpc("bete_adopter", { p_espece:o.bete, p_nom:nom })); }catch(e){ error=e; }
    if(error || !data){ reprendre("Le serveur ne répond pas. Réessaie dans un instant."); return; }
    let opt=o;
    if(!data.ok){
      if(data.err==="deja"){ opt = d.options.find(x=>x.bete===data.espece) || o; }
      else if(data.err==="hors_quete"){ reprendre("Ta progression n'est pas encore enregistrée. Réessaie dans un instant."); return; }
      else if(data.err==="nom_invalide"){ reprendre("Ce nom n'est pas accepté."); return; }
      else { reprendre("Refusé ("+data.err+")."); return; }
    }
    etat.bete = { espece:data.espece, nom:data.nom };
    if(!a._beteCercle){
      await _appliquerCerclesQ(opt.cercles);
      a._beteCercle=true; sauvegarder();
      const ef=_cerclesTexteQ(opt.cercles); if(ef) journal(`Ton choix te rapproche de : ${ef}.`,"gain","quete");   // v1.13
    }
    journal(opt.journal || `${data.nom} te suit désormais.`, "gain");
    reussirDefi();
  });
}

/* ---------- combat (ratable : un essai par jour) ----------
   Contrôle de niveau : on compare la MEILLEURE compétence effective à d.puissance.
     ≥ puissance            → victoire nette
     ≥ puissance × 0,7      → victoire arrachée, coût en santé proportionnel à l'écart
     en dessous             → échec, l'étape se verrouille 8 h (VERROU_DEFI_H)
   La compétence qui l'emporte choisit le récit ET le Cercle qui gagne des points. */
const COMBAT_CERCLES = { force:"racines", agilite:"langues", intelligence:"assembleurs" };
/* v1.14 — ÉGALITÉ DE COMPÉTENCES : à qui va la réputation ?
   Avant, `best` retombait sur la Force dès qu'il y avait égalité — donc sur les
   Racines, qui étaient discrètement avantagées chez les joueurs équilibrés.
   Règle voulue (23/09) : parmi les compétences À ÉGALITÉ, on crédite le Cercle
   où l'on a DÉJÀ le plus de réputation ; si ces Cercles sont eux aussi à
   égalité, tirage au sort. Les fortes deviennent plus fortes, sans que le hasard
   décide à la place du joueur. */
function _cercleCombat(st, cerclesMap){
  const m = cerclesMap || COMBAT_CERCLES;
  const max = Math.max(st.force, st.agilite, st.intelligence);
  const exaequo = ["force","agilite","intelligence"].filter(k => st[k] === max);
  const cercles = [...new Set(exaequo.map(k => m[k]).filter(Boolean))];
  if(!cercles.length) return null;
  if(cercles.length === 1) return cercles[0];
  const rep = c => (etat.cercles && etat.cercles[c]) || 0;
  const mieux = Math.max(...cercles.map(rep));
  const tetes = cercles.filter(c => rep(c) === mieux);
  return tetes[Math.floor(Math.random() * tetes.length)];   // égalité de réputation : au hasard
}
function _combatStats(){
  const f = (typeof forceEffective==="function") ? forceEffective() : (etat.competences.force||0);
  const a = (typeof agiliteEffective==="function") ? agiliteEffective() : (etat.competences.agilite||0);
  const i = (typeof intelligenceEffective==="function") ? intelligenceEffective() : (etat.competences.intelligence||0);
  const best = (f>=a && f>=i) ? "force" : (a>=i ? "agilite" : "intelligence");
  return { force:f, agilite:a, intelligence:i, best, val:Math.max(f,a,i) };
}
function _htmlCombat(d){
  const st=_combatStats(); const p=d.puissance||30;
  const noms={force:"Force",agilite:"Agilité",intelligence:"Intelligence"};
  const jauge=Math.max(0,Math.min(100,Math.round(st.val/p*100)));
  const teinte = st.val>=p ? "#8bd450" : (st.val>=p*0.7 ? "#ff8a3d" : "#ff5257");
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">${d.nom||"Adversaire"} — puissance estimée : <b>${p}</b></p>
    <p class="vide" style="margin:6px 0">Ton meilleur atout : <b>${noms[st.best]}</b> ${st.val}
      <span style="color:${teinte}"> (${jauge} %)</span></p>
    <div class="quete-rep"><button class="mini" id="q-cbt-btn">Engager le combat</button></div>
  </div>`;
}
function _wireCombat(z,d){
  const b=z.querySelector("#q-cbt-btn"); if(!b) return;
  b.addEventListener("click", async ()=>{
    if(b.disabled) return; b.disabled=true;     // ⚠ double clic = deux combats, Cercle crédité deux fois
    const st=_combatStats(); const p=d.puissance||30;
    if(typeof consommerMunitions==="function") await consommerMunitions();   // la force est lue AVANT
    if(st.val < p*0.7){
      const perte=Math.round(8+Math.random()*10);
      await agirServeur({ jauges:{ sante:-perte }, motif:"quete_combat" });
      if(typeof afficher==="function") afficher();
      echouerDefi(`${d.nom||"L'adversaire"} te domine (−${perte} santé). Entraîne-toi — le mécanisme se rouvre dans ${VERROU_DEFI_H} h.`);
      return;
    }
    let perte=0;
    if(st.val < p){
      perte=Math.round((p-st.val)/p*40)+5;
      await agirServeur({ jauges:{ sante:-perte }, motif:"quete_combat" });
    }
    /* ⚠ v1.13 — LE GAIN DU COMBAT EST MAINTENANT ANNONCÉ. Il l'était pour les
       choix, pas ici : un testeur a vu son blason bouger sans comprendre
       pourquoi (+2 Langues après Q4). Le Cercle dépend de la compétence qui a
       emporté le combat — Force → Racines, Agilité → Langues, Intelligence →
       Assembleurs — donc on le dit, sinon c'est illisible. */
    const cercle=_cercleCombat(st, d.cercles);   // v1.14 : départage en cas d'égalité
    if(cercle && typeof _appliquerCerclesQ==="function"){
      const gain = d.gain||2;
      await _appliquerCerclesQ({ [cercle]: gain });
      const ef = _cerclesTexteQ({ [cercle]: gain });
      const _libCompet = { racines:"la Force", langues:"l'Agilité", assembleurs:"l'Intelligence" };
      const par = _libCompet[cercle] || "ta meilleure compétence";
      if(ef) journal(`Emporté par ${par} : ${ef}.`,"gain","quete");
    }
    if(typeof gagnerXp==="function") gagnerXp(d.xp||8);
    journal(perte>0 ? `Victoire arrachée (−${perte} santé).` : "Victoire nette.", perte>0?"alerte":"gain");
    if(typeof afficher==="function") afficher();
    reussirDefi();
  });
}

/* attente (non ratable ; survit au rechargement via a._attenteLe) */
function _htmlAttente(d){
  const a=queteActive(); const t0=a._attenteLe||0; const dur=d.duree||30000;
  const reste=t0?Math.max(0,dur-(Date.now()-t0)):dur; const pret=t0&&reste<=0;
  return `<div class="quete-etape">${_par(d.texte)}
    ${!t0 ? `<div class="quete-rep"><button class="mini" id="q-att-start">Lancer</button></div>`
          : (pret ? `<div class="quete-rep"><button class="mini" id="q-att-fin">Récupérer le résultat</button></div>`
                  : `<p class="quete-indice">Scan en cours… <b id="q-att-reste">${_fmtDuree(reste)}</b> restant.</p>`)}</div>`;
}
function _wireAttente(z,d){
  const a=queteActive(); const dur=d.duree||30000;
  const bs=z.querySelector("#q-att-start"); if(bs) bs.addEventListener("click",()=>{ a._attenteLe=Date.now(); sauvegarder(); rafraichirQuetes(); });
  const bf=z.querySelector("#q-att-fin"); if(bf) bf.addEventListener("click",()=>{ journal("Scan terminé.","gain"); reussirDefi(); });
  const r=z.querySelector("#q-att-reste");
  if(r){ if(_queteTimer) clearInterval(_queteTimer);
    _queteTimer=setInterval(()=>{ const reste=Math.max(0,dur-(Date.now()-a._attenteLe)); r.textContent=_fmtDuree(reste);
      if(reste<=0){ clearInterval(_queteTimer); _queteTimer=null; rafraichirQuetes(); } },1000); }
}

/* piratage (ratable : barre + zone verte, manches qui rétrécissent) */
/* ⚠ v0.74 — PIRATAGE REJOUABLE ET LISIBLE. Trois défauts se cumulaient :
   · le curseur balayait la piste en 1 400 ms (71 %/s) ; à la 3ᵉ manche la zone
     ne faisait plus que 18 %, soit une fenêtre de 252 ms. Or entre le moment
     où l'œil voit le curseur dans le vert et celui où le clic est traité, il
     s'écoule 150 à 250 ms : le curseur avait déjà parcouru 10 à 18 %. Il
     fallait donc ANTICIPER, ce que rien n'indiquait — d'où l'impression
     d'avoir cliqué au bon endroit et d'échouer quand même ;
   · la moindre erreur bloquait l'étape pour la JOURNÉE entière ;
   · aucun retour ne distinguait « raté de peu » de « complètement à côté ».
   Correctifs : vitesse 2 200 ms, une erreur tolérée, et l'écart est annoncé. */
const PIR_VIES = 2;   // nombre de tentatives avant le verrou journalier
function _htmlPiratage(d){
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Clique STOP quand le curseur est dans la zone verte — ${d.manches||3} manches d'affilée. Il te faut un peu d'avance : le curseur continue pendant que tu cliques.</p>
    <div class="q-pir-piste"><div class="q-pir-zone" id="q-pir-zone"></div><div class="q-pir-curseur" id="q-pir-curseur"></div></div>
    <div class="quete-rep"><span id="q-pir-manche" class="itip-gris"></span><button class="mini" id="q-pir-stop">STOP</button></div>
    <p class="vide" id="q-pir-msg" style="margin:6px 0 0"></p></div>`;
}
function _wirePiratage(z,d){
  const manches=d.manches||3, vitesse=d.vitesse||2200;
  const zone=z.querySelector("#q-pir-zone"), cur=z.querySelector("#q-pir-curseur"),
        lbl=z.querySelector("#q-pir-manche"), msg=z.querySelector("#q-pir-msg");
  let round=0, pos=0, dir=1, gp=0, gw=0, vies=PIR_VIES;
  function setup(){
    gw=Math.max(12, 34-round*7); gp=Math.random()*(100-gw);
    zone.style.left=gp+"%"; zone.style.width=gw+"%";
    lbl.textContent=`Manche ${round+1}/${manches}${vies<PIR_VIES?" · dernière chance":""}`;
  }
  setup();
  const stepPx=100/(vitesse/20);
  if(_queteTimer) clearInterval(_queteTimer);
  _queteTimer=setInterval(()=>{ pos+=dir*stepPx; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} cur.style.left=pos+"%"; },20);
  z.querySelector("#q-pir-stop").addEventListener("click",()=>{
    if(!_queteTimer) return;                       // épreuve déjà terminée
    if(pos>=gp && pos<=gp+gw){
      round++;
      if(round>=manches){ clearInterval(_queteTimer); _queteTimer=null; journal("Sécurité contournée !","gain"); reussirDefi(); return; }
      msg.textContent="Verrou ouvert. Suivant.";
      setup(); return;
    }
    // Manqué : on dit de combien, et dans quel sens.
    const ecart = (pos < gp) ? (gp - pos) : (pos - gp - gw);
    const sens  = (pos < gp) ? "trop tôt" : "trop tard";
    vies--;
    if(vies > 0){
      round = 0;                                   // on reprend la séquence du début
      msg.textContent = `Manqué de ${Math.round(ecart)} % — ${sens}. Il te reste une tentative : reprends depuis la première manche.`;
      journal(`Piratage manqué de peu (${sens}) — une tentative restante.`,"alerte");
      setup(); return;
    }
    clearInterval(_queteTimer); _queteTimer=null;
    echouerDefi(`Raté de ${Math.round(ecart)} % (${sens}) — l'alarme se déclenche. Nouvelle tentative dans ${VERROU_DEFI_H} h.`);
  });
}

/* glyphes (ratable : associer chaque glyphe à son sens via un picto — façon Chants of Sennaar) */
function _htmlGlyphes(d){
  const paires=d.paires||[]; const mots=[...paires.map(p=>p.sens), ...(d.distracteurs||[])];
  for(let i=mots.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [mots[i],mots[j]]=[mots[j],mots[i]]; }
  const opts = `<option value="">— ?</option>` + mots.map(m=>`<option value="${m}">${m}</option>`).join("");
  const cartes = paires.map((p,i)=>`<div class="q-gly-carte">
      ${p.pictimg?`<img class="q-gly-pic" src="${p.pictimg}" alt="" onerror="this.remove()">`:`<span class="q-gly-pic">${p.picto||"❔"}</span>`}
      <span class="q-gly-sym">${p.glyimg?`<img src="${p.glyimg}" alt="">`:(p.glyphe||"?")}</span>
      <select class="q-gly-sel" data-i="${i}">${opts}</select>
    </div>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}${d.consigne?`<p class="quete-indice">${d.consigne}</p>`:""}
    <div class="q-gly-grille">${cartes}</div>
    <div class="quete-rep"><button class="mini" id="q-gly-valider">Valider</button></div></div>`;
}
function _wireGlyphes(z,d){
  const paires=d.paires||[]; const b=z.querySelector("#q-gly-valider"); if(!b) return;
  b.addEventListener("click",()=>{
    const sels=[...z.querySelectorAll(".q-gly-sel")];
    if(sels.some(s=>!s.value)){ journal("Associe chaque glyphe avant de valider.","alerte"); return; }
    const ok=sels.every(s=> _qnorm(s.value)===_qnorm(paires[parseInt(s.dataset.i,10)].sens));
    if(ok){ journal("Glyphes déchiffrés !","gain"); reussirDefi(); }
    else echouerDefi(`Traduction erronée — les glyphes se brouillent. Nouvelle tentative dans ${VERROU_DEFI_H} h.`);
  });
}

/* ordre (ratable : remettre dans le bon ordre) */
function _htmlOrdre(d){
  const els=d.elements||[]; const idx=els.map((_,i)=>i);
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  const pool=idx.map(i=>`<button class="q-ordre-el mini" data-i="${i}">${els[i]}</button>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}${d.consigne?`<p class="quete-indice">${d.consigne}</p>`:""}
    <div class="q-ordre-pool">${pool}</div><div class="q-ordre-rep"></div>
    <div class="quete-rep"><button class="mini" id="q-ordre-valider" disabled>Valider</button><button class="mini" id="q-ordre-reset">Recommencer</button></div></div>`;
}
function _wireOrdre(z,d){
  const n=(d.elements||[]).length; let picks=[];
  const rep=z.querySelector(".q-ordre-rep"), val=z.querySelector("#q-ordre-valider");
  z.querySelectorAll(".q-ordre-el").forEach(b=>b.addEventListener("click",()=>{ if(b.disabled) return;
    picks.push(parseInt(b.dataset.i,10)); b.disabled=true;
    const chip=document.createElement("span"); chip.className="q-ordre-chip"; chip.textContent=picks.length+". "+b.textContent; rep.appendChild(chip);
    if(picks.length===n) val.disabled=false; }));
  z.querySelector("#q-ordre-reset").addEventListener("click",()=>{ picks=[]; rep.innerHTML=""; val.disabled=true; z.querySelectorAll(".q-ordre-el").forEach(b=>b.disabled=false); });
  val.addEventListener("click",()=>{ if(picks.every((v,i)=>v===i)){ journal("Séquence correcte !","gain"); reussirDefi(); } else echouerDefi(`Mauvaise séquence — le nœud se verrouille. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); });
}

/* cadenas (ratable : Mastermind — code de symboles, N essais dans la journée) */
function _htmlCadenas(d){
  const L=d.longueur||4, syms=d.symboles||["●","■","▲","◆","★","⬢"], maxE=d.essais||8;
  const opts=syms.map(s=>`<option value="${s}">${s}</option>`).join("");
  const slots=Array.from({length:L},(_,i)=>`<select class="q-cad-slot" data-i="${i}"><option value="">?</option>${opts}</select>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Trouve le code de ${L} symboles. ${maxE} essais — après, le sas se bloque ${VERROU_DEFI_H} h.</p>
    <div class="q-cad-slots">${slots}</div>
    <div class="quete-rep"><button class="mini" id="q-cad-go">Tester</button><span class="itip-gris" id="q-cad-cpt"></span></div>
    <div class="q-cad-hist" id="q-cad-hist"></div></div>`;
}
function _wireCadenas(z,d){
  const L=d.longueur||4, syms=d.symboles||["●","■","▲","◆","★","⬢"], maxE=d.essais||8;
  const a=queteActive(); if(!a) return;
  /* ⚠ v0.58 — le code secret et le compteur étaient recréés à CHAQUE rendu :
     changer d'onglet ou recharger donnait un nouveau code et 8 essais neufs
     (verrou journalier contournable), et un rafraîchissement accidentel
     effaçait la progression. Tout vit désormais dans la quête active. */
  if(!Array.isArray(a._cadSecret) || a._cadSecret.length!==L){
    a._cadSecret = Array.from({length:L},()=>syms[Math.floor(Math.random()*syms.length)]);
    a._cadEssais = 0; a._cadHist = []; sauvegarder();
  }
  const secret=a._cadSecret; if(!Array.isArray(a._cadHist)) a._cadHist=[];
  const cpt=z.querySelector("#q-cad-cpt"), hist=z.querySelector("#q-cad-hist");
  const ligneHist=(h)=>{ const l=document.createElement("div"); l.className="q-cad-ligne";
    l.innerHTML=`<span class="q-cad-code">${h.g.join(" ")}</span><span class="itip-gris">✔ ${h.bien} bien placé(s) · ~ ${h.pres} présent(s)</span>`; hist.prepend(l); };
  a._cadHist.forEach(ligneHist);
  const maj=()=>{ cpt.textContent=`Essai ${(a._cadEssais||0)+1}/${maxE}`; }; maj();
  z.querySelector("#q-cad-go").addEventListener("click",()=>{
    const g=[...z.querySelectorAll(".q-cad-slot")].map(s=>s.value);
    if(g.some(v=>!v)){ journal("Choisis un symbole pour chaque case.","alerte"); return; }
    let bien=0; const sc=secret.slice(), gc=g.slice();
    for(let i=0;i<L;i++){ if(gc[i]===sc[i]){ bien++; sc[i]=null; gc[i]=null; } }
    let pres=0; for(let i=0;i<L;i++){ if(gc[i]){ const j=sc.indexOf(gc[i]); if(j>=0){ pres++; sc[j]=null; } } }
    const h={ g, bien, pres }; a._cadHist.push(h); ligneHist(h);
    if(bien===L){ journal("Code trouvé !","gain"); reussirDefi(); return; }
    a._cadEssais=(a._cadEssais||0)+1; sauvegarder();
    if(a._cadEssais>=maxE){ echouerDefi(`Trop d'essais — le sas se bloque. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; } maj();
  });
}

/* ===========================================================
   TRAVERSÉE (v0.97, ratable) — une croûte de lave refroidie, en grille.
   On part d'une case sûre en bas ; on sonde une case VOISINE (8 directions)
   d'une case déjà franchie. Une case sûre affiche le nombre de cases brûlantes
   qui la touchent (démineur simplifié). Une case brûlante coûte une plaque de
   protection ; plus de plaque = échec (verrou du jour, comme les autres).
   But : atteindre la ligne du HAUT.
   TACTILE : grandes cases (≥ 40 px), pas de clic droit ni d'appui long — un
   bouton bascule entre « Sonder » et « Marquer » (drapeau sur une case suspecte).
   L'état vit dans la quête active (a._trav) : recharger ne rebat pas la grille.
   Paramètres : d.colonnes (6), d.lignes (7), d.lave (nombre de cases, 10),
   d.plaques (3). Une grille est TOUJOURS traversable : génération vérifiée.
   =========================================================== */
function _travVoisins(i, C, L){
  const x=i%C, y=Math.floor(i/C), v=[];
  for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
    if(!dx && !dy) continue; const nx=x+dx, ny=y+dy;
    if(nx>=0 && nx<C && ny>=0 && ny<L) v.push(ny*C+nx);
  }
  return v;
}
function _travGenerer(C, L, nLave, rnd){
  rnd = rnd || Math.random;
  const depart = (L-1)*C + Math.floor(C/2);
  const interdits = new Set([depart, ..._travVoisins(depart, C, L)]);
  for(let essai=0; essai<500; essai++){
    const lave = new Array(C*L).fill(false);
    const libres = [...Array(C*L).keys()].filter(i=>!interdits.has(i));
    for(let k=0; k<nLave && libres.length; k++){ const j=Math.floor(rnd()*libres.length); lave[libres.splice(j,1)[0]] = true; }
    // Chemin sûr du départ jusqu'à la ligne du haut ?
    const vu = new Set([depart]), file=[depart]; let ok=false;
    while(file.length){ const c=file.shift(); if(c < C){ ok=true; break; }
      for(const n of _travVoisins(c,C,L)) if(!lave[n] && !vu.has(n)){ vu.add(n); file.push(n); } }
    if(ok) return { lave, depart };
  }
  return { lave:new Array(C*L).fill(false), depart };   // filet : jamais atteint en pratique
}
function _travCompte(i, lave, C, L){ return _travVoisins(i,C,L).filter(n=>lave[n]).length; }
function _htmlTraversee(d){
  const C=d.colonnes||6, P=d.plaques||3;
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Atteins le bord du haut. Un chiffre = le nombre de cases brûlantes qui touchent cette case. ${P} plaques de protection — après, tu rebrousses chemin pour ${VERROU_DEFI_H} h.</p>
    <div class="quete-rep" style="gap:8px;flex-wrap:wrap">
      <button class="mini" id="q-trav-mode">Mode : 👣 Sonder</button>
      <span class="itip-gris" id="q-trav-pl"></span>
    </div>
    <div id="q-trav-grille" style="display:grid;grid-template-columns:repeat(${C},1fr);gap:4px;max-width:420px;margin:10px auto 0;touch-action:manipulation"></div>
  </div>`;
}
function _wireTraversee(z, d){
  const C=d.colonnes||6, L=d.lignes||7, P=d.plaques||3, N=d.lave||10;
  const a=queteActive(); if(!a) return;
  if(!a._trav || !Array.isArray(a._trav.lave) || a._trav.lave.length!==C*L){
    const g=_travGenerer(C, L, N);
    a._trav = { lave:g.lave, vus:[g.depart], marques:[], plaques:P };
    sauvegarder();
  }
  const t=a._trav, grille=z.querySelector("#q-trav-grille"), btnMode=z.querySelector("#q-trav-mode"), pl=z.querySelector("#q-trav-pl");
  let marquer=false;
  btnMode.addEventListener("click", ()=>{ marquer=!marquer; btnMode.textContent = marquer ? "Mode : 🚩 Marquer" : "Mode : 👣 Sonder"; });
  const accessible = i => !t.vus.includes(i) && _travVoisins(i,C,L).some(n=>t.vus.includes(n) && !t.lave[n]);
  const dessiner = ()=>{
    pl.textContent = "🛡 ".repeat(Math.max(0,t.plaques)).trim() + ` (${t.plaques})`;
    grille.innerHTML = [...Array(C*L).keys()].map(i=>{
      const vu=t.vus.includes(i), lave=t.lave[i], marque=t.marques.includes(i), acc=accessible(i), haut=i<C;
      let fond="#1b1411", txt="", bord="#3a2a22";
      if(vu && lave){ fond="#c2410c"; txt="🔥"; }
      else if(vu){ const n=_travCompte(i,t.lave,C,L); fond="#3b3a36"; txt = n ? String(n) : "·"; bord="#6b6457"; }
      else if(marque){ txt="🚩"; }
      else if(acc){ bord="#f59e0b"; }
      if(haut && !vu) bord = acc ? "#f59e0b" : "#7c5a2a";
      return `<button data-i="${i}" style="aspect-ratio:1;min-height:40px;border-radius:6px;border:2px solid ${bord};background:${fond};color:#f5e9d3;font-size:18px;font-weight:700;padding:0;cursor:pointer" ${vu?"disabled":""}>${txt}</button>`;
    }).join("");
  };
  grille.addEventListener("click", e=>{
    const b=e.target.closest("[data-i]"); if(!b) return; const i=+b.dataset.i;
    if(t.vus.includes(i)) return;
    if(marquer){ const k=t.marques.indexOf(i); if(k>=0) t.marques.splice(k,1); else t.marques.push(i); sauvegarder(); dessiner(); return; }
    if(t.marques.includes(i)){ journal("Case marquée — repasse en mode Sonder et enlève le drapeau d'abord.","alerte"); return; }
    if(!accessible(i)){ journal("Trop loin : avance de proche en proche, depuis une case déjà franchie.","alerte"); return; }
    t.vus.push(i);
    if(t.lave[i]){
      t.plaques--; sauvegarder();
      if(t.plaques<=0){ dessiner(); echouerDefi(`La croûte cède sous toi, et ta dernière plaque avec. Tu rebrousses chemin — nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
      journal("La croûte cède — une plaque de protection fond sous tes bottes.","alerte");
    } else if(i < C){ sauvegarder(); journal("Tu atteins l'autre bord !","gain"); reussirDefi(); return; }
    sauvegarder(); dessiner();
  });
  dessiner();
}

/* ===========================================================
   TUYAUTERIE (v0.97, NON ratable) — mener le liquide de refroidissement de
   l'entrée (bord gauche) à la machine (bord droit). On TAPE un tronçon pour le
   faire pivoter d'un quart de tour. Les tronçons irrigués s'allument : on voit
   jusqu'où le liquide arrive. Pas de limite de coups : c'est une réflexion, pas
   une épreuve de chance — donc pas dans DEFIS_UNTRY.
   Connexions en masque de bits : N=1, E=2, S=4, O=8. Pivot horaire :
   m' = ((m<<1) | (m>>3)) & 15. Un chemin solution est toujours généré d'abord.
   Paramètres : d.colonnes (5), d.lignes (5). État : a._tuy.
   =========================================================== */
const _TUY_DIR = [ {b:1,dx:0,dy:-1,op:4}, {b:2,dx:1,dy:0,op:8}, {b:4,dx:0,dy:1,op:1}, {b:8,dx:-1,dy:0,op:2} ];
function _tuyPivot(m){ return ((m<<1)|(m>>3)) & 15; }
function _tuyGenerer(C, L, rnd){
  rnd = rnd || Math.random;
  const sr=Math.floor(rnd()*L), kr=Math.floor(rnd()*L);
  // chemin auto-évitant de (0,sr) à (C-1,kr), par parcours en profondeur mélangé
  const vu=new Set(), chemin=[];
  const dfs=(x,y)=>{ const i=y*C+x; vu.add(i); chemin.push(i);
    if(x===C-1 && y===kr) return true;
    const dirs=_TUY_DIR.slice().sort(()=>rnd()-0.5);
    for(const d of dirs){ const nx=x+d.dx, ny=y+d.dy, n=ny*C+nx;
      if(nx>=0&&nx<C&&ny>=0&&ny<L&&!vu.has(n) && dfs(nx,ny)) return true; }
    chemin.pop(); return false; };
  dfs(0, sr);
  const masques=new Array(C*L).fill(0);
  for(let k=0;k<chemin.length;k++){
    const i=chemin[k], x=i%C, y=Math.floor(i/C);
    const lien=(j)=>{ const jx=j%C, jy=Math.floor(j/C); return _TUY_DIR.find(d=>d.dx===jx-x && d.dy===jy-y).b; };
    let m = 0;
    m |= (k===0) ? 8 : lien(chemin[k-1]);                       // entrée par la gauche
    m |= (k===chemin.length-1) ? 2 : lien(chemin[k+1]);         // sortie par la droite
    masques[i]=m;
  }
  const formes=[5,3,7,10,6];                                    // droit, coude, T…
  for(let i=0;i<C*L;i++) if(!masques[i]) masques[i]=formes[Math.floor(rnd()*formes.length)];
  // on brouille les rotations (au moins un tronçon du chemin désaligné)
  for(let i=0;i<C*L;i++){ const r=Math.floor(rnd()*4); for(let k=0;k<r;k++) masques[i]=_tuyPivot(masques[i]); }
  if(_tuyIrrigues(masques,C,L,sr,kr).gagne){ const i=chemin[0]; masques[i]=_tuyPivot(masques[i]); }
  return { masques, sr, kr };
}
function _tuyIrrigues(m, C, L, sr, kr){
  const dep=sr*C; const eau=new Set(); let gagne=false;
  if(!(m[dep]&8)) return { eau, gagne };
  const f=[dep]; eau.add(dep);
  while(f.length){ const i=f.shift(), x=i%C, y=Math.floor(i/C);
    if(x===C-1 && (m[i]&2) && (kr==null || y===kr)) gagne=true;
    for(const d of _TUY_DIR){ if(!(m[i]&d.b)) continue; const nx=x+d.dx, ny=y+d.dy;
      if(nx<0||nx>=C||ny<0||ny>=L) continue; const n=ny*C+nx;
      if((m[n]&d.op) && !eau.has(n)){ eau.add(n); f.push(n); } } }
  return { eau, gagne };
}
function _tuySvg(m, irrigue){
  const col = irrigue ? "#fb923c" : "#6b6457", seg=[];
  if(m&1) seg.push("M50 50 L50 0"); if(m&2) seg.push("M50 50 L100 50"); if(m&4) seg.push("M50 50 L50 100"); if(m&8) seg.push("M50 50 L0 50");
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block;pointer-events:none"><path d="${seg.join(" ")}" stroke="${col}" stroke-width="22" stroke-linecap="round" fill="none"/><circle cx="50" cy="50" r="12" fill="${col}"/></svg>`;
}
function _htmlTuyauterie(d){
  const C=d.colonnes||5;
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Tape un tronçon pour le faire pivoter. Mène le liquide de l'entrée ▶ (à gauche) jusqu'à la machine ◀ (à droite).</p>
    <div id="q-tuy" style="display:grid;grid-template-columns:22px repeat(${C},1fr) 22px;gap:3px;max-width:420px;margin:10px auto 0;touch-action:manipulation;align-items:center"></div>
  </div>`;
}
function _wireTuyauterie(z, d){
  const C=d.colonnes||5, L=d.lignes||5;
  const a=queteActive(); if(!a) return;
  if(!a._tuy || !Array.isArray(a._tuy.masques) || a._tuy.masques.length!==C*L){ a._tuy=_tuyGenerer(C,L); sauvegarder(); }
  const t=a._tuy, g=z.querySelector("#q-tuy");
  const dessiner=()=>{
    const r=_tuyIrrigues(t.masques,C,L,t.sr,t.kr); let h="";
    for(let y=0;y<L;y++){
      h += `<span style="text-align:center;color:#fb923c;font-size:18px">${y===t.sr?"▶":""}</span>`;
      for(let x=0;x<C;x++){ const i=y*C+x;
        h += `<button data-i="${i}" style="aspect-ratio:1;min-height:40px;padding:4px;border-radius:6px;border:1px solid #3a2a22;background:#1b1411;cursor:pointer">${_tuySvg(t.masques[i], r.eau.has(i))}</button>`; }
      h += `<span style="text-align:center;color:${r.gagne&&y===t.kr?"#fb923c":"#8b8378"};font-size:18px">${y===t.kr?"◀":""}</span>`;
    }
    g.innerHTML=h; return r.gagne;
  };
  g.addEventListener("click", e=>{
    const b=e.target.closest("[data-i]"); if(!b) return; const i=+b.dataset.i;
    t.masques[i]=_tuyPivot(t.masques[i]); sauvegarder();
    if(dessiner()){ journal("Le liquide circule jusqu'à la machine !","gain"); reussirDefi(); }
  });
  dessiner();
}

/* ===========================================================
   TRIANGULATION (v0.98, ratable) — elle se joue SUR LA CARTE. Une source est
   cachée dans la zone de l'étape. Le joueur se déplace (ça coûte), appuie sur
   « Relever le signal » : la force (0-100) baisse avec la distance. Chaque relevé
   s'affiche sur la carte, avec sa valeur. Quand il pense tenir l'endroit, il
   « Fouille ici » : réussi à moins de d.precision (70 u). d.fouilles (3)
   fouilles ratées = échec (verrou du jour). Il faut d.minReleves (3) relevés
   avant la première fouille.
   ⚠ La zone de l'étape doit être LARGE (cible r ≈ 300) : on s'y promène.
   ⚠ Force = 100 − distance/5 : un point de moins ≈ 5 u plus loin. Linéaire
     exprès — un joueur qui réfléchit peut vraiment trianguler.
   État : a._tri = { src:{x,y}, releves:[{x,y,f}], ratees }.
   =========================================================== */
function _triForce(p, src){ return Math.max(0, 100 - Math.round(Math.hypot(p.x-src.x, p.y-src.y)/5)); }
function _triEtat(d){
  const a=queteActive(); if(!a) return null; const e=etapeActive(); if(!e) return null;
  if(!a._tri || !a._tri.src){
    const c=_cibleResolue(e.cible); if(!c) return null;
    const ang=Math.random()*Math.PI*2, rr=Math.sqrt(Math.random())*c.r*0.6;
    a._tri = { src:{ x:Math.round(c.x+Math.cos(ang)*rr), y:Math.round(c.y+Math.sin(ang)*rr) }, releves:[], ratees:0 };
    sauvegarder();
  }
  return a._tri;
}
function _htmlTriangulation(d){
  const F=d.fouilles||3, M=d.minReleves||3;
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Déplace-toi sur la carte et relève le signal en plusieurs points : plus il est fort, plus tu es près. Au moins ${M} relevés avant de fouiller. ${F} fouilles ratées — après, tu dois attendre ${VERROU_DEFI_H} h.</p>
    <div class="quete-rep" style="gap:8px;flex-wrap:wrap">
      <button class="mini" id="q-tri-rel">📡 Relever le signal ici</button>
      <button class="mini" id="q-tri-fou">⛏ Fouiller ici</button>
    </div>
    <div id="q-tri-liste" class="itip-gris" style="margin-top:8px"></div>
  </div>`;
}
function _wireTriangulation(z, d){
  const F=d.fouilles||3, M=d.minReleves||3, PREC=d.precision||70;
  const t=_triEtat(d); if(!t) return;
  const e=etapeActive(), carte=(_cibleResolue(e.cible)||{}).carte||"silene";
  const liste=z.querySelector("#q-tri-liste");
  const dessiner=()=>{
    liste.innerHTML = t.releves.length
      ? t.releves.map((r,i)=>`Relevé ${i+1} : <b>${r.f}</b> <span style="opacity:.7">(${r.x}, ${r.y})</span>`).join("<br>") + `<br>Fouilles ratées : ${t.ratees}/${F}`
      : "Aucun relevé pour l'instant.";
    if(typeof majCarteBraise==="function" && (carte==="braise" || carte==="suaire")) majCarteBraise();
    if(typeof majOrbite==="function" && carte==="espace") majOrbite();
  };
  z.querySelector("#q-tri-rel").addEventListener("click", ()=>{
    const p=_posJoueur(carte); if(!p) return;
    if(t.releves.some(r=>Math.hypot(r.x-p.x, r.y-p.y) < 30)){ journal("Tu as déjà relevé le signal ici : déplace-toi d'abord.","alerte"); return; }
    const f=_triForce(p, t.src); t.releves.push({ x:Math.round(p.x), y:Math.round(p.y), f }); sauvegarder();
    journal(`Signal relevé : force ${f}.`, f>=80?"gain":"");
    dessiner();
  });
  z.querySelector("#q-tri-fou").addEventListener("click", ()=>{
    if(t.releves.length < M){ journal(`Relève encore le signal (${t.releves.length}/${M}) avant de fouiller au hasard.`,"alerte"); return; }
    const p=_posJoueur(carte); if(!p) return;
    if(Math.hypot(p.x-t.src.x, p.y-t.src.y) <= PREC){ journal("Sous la croûte, ta pioche sonne sur du métal.","gain"); reussirDefi(); return; }
    t.ratees++; sauvegarder();
    if(t.ratees >= F){ echouerDefi(`Rien, encore rien — et ton temps d'air file. Tu remballes : nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
    journal(`Rien ici. Encore ${F-t.ratees} fouille(s) avant de devoir renoncer pour aujourd'hui.`,"alerte");
    dessiner();
  });
  dessiner();
}
/* Relevés dessinés sur la carte (appelé par marqueursQueteCarteHtml). */
function _triRelevesHtml(carte){
  const a=queteActive(), e=etapeActive();
  if(!a || !e || !e.defi || e.defi.type!=="triangulation" || !a._tri || a._resolu) return "";
  const c=_cibleResolue(e.cible); if(!c || c.carte!==carte) return "";
  return a._tri.releves.map(r=>`<g style="pointer-events:none"><circle cx="${r.x}" cy="${r.y}" r="18" fill="#0a1730" stroke="#34d399" stroke-width="4"/><text x="${r.x}" y="${r.y-28}" text-anchor="middle" style="fill:#34d399;font-weight:700" font-size="36">${r.f}</text></g>`).join("");
}

/* ===========================================================
   LABYRINTHE (v0.98, NON ratable) — le Champ d'aiguilles, dans le brouillard.
   Un labyrinthe parfait (un seul chemin entre deux cases) ; on part en bas à
   gauche, la sortie est en haut à droite. On ne voit que les cases DÉJÀ vues :
   celles où l'on est passé et leurs voisines immédiates. On TAPE une case
   voisine ouverte pour y aller (on peut revenir sur ses pas). Pas de limite :
   c'est de l'orientation, pas de la chance.
   Murs en masque de bits (ouvertures) : N=1, E=2, S=4, O=8 (_TUY_DIR).
   Paramètres : d.colonnes (6), d.lignes (7). État : a._lab.
   =========================================================== */
function _labGenerer(C, L, rnd){
  rnd = rnd || Math.random;
  const ouv=new Array(C*L).fill(0), vu=new Set(), pile=[(L-1)*C];
  vu.add(pile[0]);
  while(pile.length){
    const i=pile[pile.length-1], x=i%C, y=Math.floor(i/C);
    const libres=_TUY_DIR.filter(d=>{ const nx=x+d.dx, ny=y+d.dy; return nx>=0&&nx<C&&ny>=0&&ny<L && !vu.has(ny*C+nx); });
    if(!libres.length){ pile.pop(); continue; }
    const d=libres[Math.floor(rnd()*libres.length)], n=(y+d.dy)*C+(x+d.dx);
    ouv[i]|=d.b; ouv[n]|=d.op; vu.add(n); pile.push(n);
  }
  return { ouv, pos:(L-1)*C, sortie:C-1, vus:[(L-1)*C] };
}
function _htmlLabyrinthe(d){
  const C=d.colonnes||6;
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Tape une case voisine, sans mur entre les deux, pour avancer. Tu ne vois que ce que tu as déjà approché. La sortie ◆ est quelque part en haut à droite.</p>
    <div id="q-lab" style="display:grid;grid-template-columns:repeat(${C},1fr);gap:0;max-width:420px;margin:10px auto 0;touch-action:manipulation;border:3px solid #6b6457"></div>
  </div>`;
}
function _wireLabyrinthe(z, d){
  const C=d.colonnes||6, L=d.lignes||7;
  const a=queteActive(); if(!a) return;
  if(!a._lab || !Array.isArray(a._lab.ouv) || a._lab.ouv.length!==C*L){ a._lab=_labGenerer(C,L); sauvegarder(); }
  const t=a._lab, g=z.querySelector("#q-lab");
  const voisinsOuverts = i => { const x=i%C, y=Math.floor(i/C);
    return _TUY_DIR.filter(dd=>t.ouv[i]&dd.b).map(dd=>(y+dd.dy)*C+(x+dd.dx)); };
  const dessiner=()=>{
    const visibles=new Set(t.vus); t.vus.forEach(i=>voisinsOuverts(i).forEach(n=>visibles.add(n)));
    const proches=new Set(voisinsOuverts(t.pos));
    g.innerHTML=[...Array(C*L).keys()].map(i=>{
      const vis=visibles.has(i), m=t.ouv[i], ici=(i===t.pos), sortie=(i===t.sortie);
      const mur=(b)=> vis ? ((m&b)?"1px solid #2a211c":"4px solid #a8a29e") : "1px solid #120d0a";
      const fond = !vis ? "#0c0907" : (ici ? "#7c2d12" : (t.vus.includes(i) ? "#2b2420" : "#1b1411"));
      const txt = ici ? "🧑‍🚀" : (sortie && vis ? "◆" : (vis && !t.vus.includes(i) ? "·" : ""));
      return `<button data-i="${i}" style="aspect-ratio:1;min-height:40px;padding:0;background:${fond};color:#fbbf24;font-size:18px;border-top:${mur(1)};border-right:${mur(2)};border-bottom:${mur(4)};border-left:${mur(8)};cursor:${proches.has(i)?"pointer":"default"}">${txt}</button>`;
    }).join("");
  };
  g.addEventListener("click", e=>{
    const b=e.target.closest("[data-i]"); if(!b) return; const i=+b.dataset.i;
    if(!voisinsOuverts(t.pos).includes(i)){ if(i!==t.pos) journal("Une aiguille te barre le passage — ou c'est trop loin. Avance case par case.","alerte"); return; }
    t.pos=i; if(!t.vus.includes(i)) t.vus.push(i); sauvegarder();
    if(i===t.sortie){ dessiner(); journal("Les aiguilles s'écartent : tu es sorti du champ.","gain"); reussirDefi(); return; }
    dessiner();
  });
  dessiner();
}

/* sequence (ratable : Simon — répéter la suite qui s'allonge) */
function _htmlSequence(d){
  const syms=d.symboles||["◤","◥","◣","◢"], L=d.longueur||5;
  const pads=syms.map((s,i)=>`<button class="q-seq-pad" data-i="${i}">${s}</button>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Mémorise puis répète la séquence (jusqu'à ${L}). Une erreur et la console se verrouille ${VERROU_DEFI_H} h.</p>
    <div class="q-seq-etat" id="q-seq-etat">Prêt ?</div>
    <div class="q-seq-pads">${pads}</div>
    <div class="quete-rep"><button class="mini" id="q-seq-go">Commencer</button></div></div>`;
}
function _wireSequence(z,d){
  const n=(d.symboles||["◤","◥","◣","◢"]).length, L=d.longueur||5;
  const pads=[...z.querySelectorAll(".q-seq-pad")], etat=z.querySelector("#q-seq-etat");
  let seq=[], pos=0, jouable=false;
  function flash(i){ const p=pads[i]; if(!p) return; p.classList.add("actif"); const t=setTimeout(()=>p.classList.remove("actif"),380); _queteTO.push(t); }
  function jouerSeq(){ jouable=false; etat.textContent="Regarde…"; let k=0;
    (function next(){ if(k>=seq.length){ jouable=true; etat.textContent="À toi !"; return; } flash(seq[k]); k++; const t=setTimeout(next,620); _queteTO.push(t); })(); }
  function tour(){ _seqAnim = Date.now();   // v0.92 : la partie est en cours, le panneau ne doit plus se redessiner
    seq.push(Array.isArray(d.cadence) ? d.cadence[seq.length % d.cadence.length] : Math.floor(Math.random()*n)); /* cadence fixe si fournie (Q3/Q5) */ pos=0; const t=setTimeout(jouerSeq,500); _queteTO.push(t); }
  pads.forEach((p,i)=>p.addEventListener("click",()=>{
    if(!jouable) return; flash(i);
    _seqAnim = Date.now();   // chaque clic repousse la soupape des 60 s
    /* ⚠ `_seqFin()` AVANT `echouerDefi()` et `reussirDefi()` : toutes deux
       appellent `rafraichirQuetes()`, donc `majQueteHub()`. Le drapeau encore
       levé, le panneau refuserait de se redessiner et le joueur resterait
       devant l'écran du défi qu'il vient de terminer. */
    if(i!==seq[pos]){ jouable=false; _seqFin(); echouerDefi(`Séquence ratée — la console se verrouille. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); return; }
    pos++;
    if(pos>=seq.length){ if(seq.length>=L){ jouable=false; _seqFin(); journal("Séquence maîtrisée !","gain"); reussirDefi(); } else { jouable=false; etat.textContent="Bien !"; tour(); } }
  }));
  z.querySelector("#q-seq-go").addEventListener("click",function(){ this.disabled=true; seq=[]; tour(); });
}

/* memoire (ratable : on montre une info quelques secondes, puis une question) */
function _htmlMemoire(d){
  const a=queteActive();
  if(!a._memVue){
    const info=Array.isArray(d.info)?d.info.map(x=>`<div>${x}</div>`).join(""):(d.info||"");
    return `<div class="quete-etape">${_par(d.texte)}
      <p class="quete-indice">Mémorise bien — l'info va disparaître.</p>
      <div class="q-mem-info">${info}</div>
      <div class="quete-rep"><span class="itip-gris">Disparition dans <b id="q-mem-cpt">${Math.ceil((d.duree||6000)/1000)}</b> s</span></div></div>`;
  }
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">${d.question}</p>
    <div class="quete-rep"><input id="q-mem-champ" placeholder="Ta réponse…" autocomplete="off"><button class="mini" id="q-mem-btn">Valider</button></div></div>`;
}
function _wireMemoire(z,d){
  const a=queteActive();
  if(!a._memVue){
    const cpt=z.querySelector("#q-mem-cpt"); let s=Math.ceil((d.duree||6000)/1000);
    if(_queteTimer) clearInterval(_queteTimer);
    _queteTimer=setInterval(()=>{ s--; if(cpt) cpt.textContent=s; if(s<=0){ clearInterval(_queteTimer); _queteTimer=null; a._memVue=true; majQueteHub(); } },1000);
    return;
  }
  const b=z.querySelector("#q-mem-btn"), c=z.querySelector("#q-mem-champ");
  const go=()=>{ if((d.reponses||d.reponse||[]).map(_qnorm).includes(_qnorm(c.value))){ journal("Bonne mémoire !","gain"); reussirDefi(); } else echouerDefi(`Raté — mauvaise mémorisation. Nouvelle tentative dans ${VERROU_DEFI_H} h.`); };
  if(b&&c){ b.addEventListener("click",go); c.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }); }
}

/* v1.00 — `cache:true` sur une étape : AUCUN repère ★ (ni cible ni leurre) sur
   aucune carte. Q15 étape 2 : la cachette des bêtes se trouve à la bouture. */
function _ptsQuete(e){ return (!e || e.cache) ? [] : [e.cible, ...(e.leurres||[])]; }

/* ---------- Déplacements (entrée/sortie de zone) ---------- */
function queteArrivee(){
  const a=queteActive(); if(!a || a._resolu) return; const e=etapeActive(); if(!e || !e.cible) return;
  const sur=_dansCible(e.cible);   // v0.97 : Silène OU orbite
  if(sur && !a._sur){ a._sur=true; journal(_varie(e.arrivee) ? "Ouvre l'onglet Quêtes." : "Tu es arrivé au bon endroit — ouvre l'onglet Quêtes.","gain");   // v1.02 : majuscule
    if(!e.defi){ avancerQuete(); return; } sauvegarder(); rafraichirQuetes();
  } else if(!sur){
    if(a._sur){ a._sur=false; sauvegarder(); rafraichirQuetes(); }
    _chasseSignal();   // v1.00 : chaud/froid après chaque déplacement (Q15)
    for(const l of (e.leurres||[])){ if(_dansCible(l)){ journal("Rien ici — fausse piste. Relis l'indice (onglet Quêtes).","alerte"); break; } }
  }
}

/* v0.61 — Repère ★ sous un clic. Le cercle fait 80 u de rayon, soit une
   douzaine de pixels sur un téléphone : un doigt le rate facilement, et le
   joueur croyait que « les zones ne marchent pas ». Un clic dans le cercle ou
   à moins de 50 u de son bord mène au CENTRE du repère. */
/* ⚠ v0.92 — UNE ÉTOILE NE VOLE PLUS LES CLICS D'UNE VILLE.
   Le rayon de capture d'un repère vaut `p.r + 50`, soit 120 px par défaut, et
   une ville fait 100 px. Une étoile posée à moins de ~220 px du centre d'une
   ville avalait donc les clics faits EN PLEIN MILIEU de cette ville : voyager()
   déplaçait le joueur au centre de l'étoile, hors des murs. Résultat côté
   joueur : énergie débitée, « zone sauvage », et aucune explication.
   Deux testeurs l'ont signalé le même jour, sur Ignis et sur la Toundra.

   RÈGLE : un clic tombé DANS une ville va à cette ville, point. Le repère ne
   reprend la main que si le joueur clique hors de toute ville.
   ⚠ Sauf si le repère est lui-même dans CETTE ville : la capture est alors
   sans effet de bord, et l'interdire pourrait rendre une étape injouable si
   une cible de quête se trouve à l'intérieur d'une cité. */
function _villeSous(x, y){
  if(typeof VILLES === "undefined") return null;
  for(const fid in VILLES){ const v=VILLES[fid]; if(Math.hypot(x-v.x, y-v.y) <= v.r) return v; }
  return null;
}
function repereQueteSous(x, y){
  const a=queteActive(); const e=etapeActive(); if(!a || a._resolu || !e || !e.cible) return null;
  const ville = _villeSous(x, y);
  let best=null, bd=Infinity;
  for(const p0 of _ptsQuete(e)){
    const p=_cibleResolue(p0); if(!p || p.carte!=="silene") continue;   // v0.97 : carte de Silène seulement
    if(ville && Math.hypot(p.x-ville.x, p.y-ville.y) > ville.r) continue;   // l'étoile est dehors : elle ne prend pas ce clic
    const d=Math.hypot(x-p.x, y-p.y);
    if(d <= (p.r||70)+50 && d < bd){ bd=d; best=p; }
  }
  return best;
}

/* ---------- Marqueurs de carte ---------- */
function majMarqueursQuete(){
  const svg=document.querySelector("#carte"); if(!svg) return;
  let g=svg.querySelector("#quete-marqueurs");
  if(!g){ g=document.createElementNS("http://www.w3.org/2000/svg","g"); g.id="quete-marqueurs"; svg.appendChild(g); }
  const e=etapeActive(); const a=queteActive();
  if(!e || !e.cible || (a && a._resolu)){ g.innerHTML=""; return; }
  const pts=_ptsQuete(e).map(_cibleResolue).filter(p=>p && p.carte==="silene");   // v0.97
  g.innerHTML=pts.map(p=>`<g class="lieu"><circle cx="${p.x}" cy="${p.y}" r="${p.r||70}" fill="#5aa8e6" fill-opacity="0.10" stroke="#5aa8e6" stroke-opacity="0.75" stroke-dasharray="6 8"/><text x="${p.x}" y="${p.y+14}" text-anchor="middle" style="fill:#5aa8e6" font-size="40">★</text></g>`).join("");
}

/* v0.97 — Repères ★ de la carte d'ORBITE : même dessin que sur Silène, en HTML
   SVG renvoyé à majOrbite() (orbite.js), qui l'insère avant le marqueur du joueur.
   ⚠ pointer-events:none — un clic sur un lieu doit continuer d'ouvrir sa fiche. */
function marqueursQueteEspaceHtml(){
  const e=etapeActive(); const a=queteActive();
  if(!e || !e.cible || (a && a._resolu)) return "";
  const pts=_ptsQuete(e).map(_cibleResolue).filter(p=>p && p.carte==="espace");
  return pts.map(p=>`<g style="pointer-events:none"><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="#5aa8e6" fill-opacity="0.10" stroke="#5aa8e6" stroke-opacity="0.75" stroke-width="3" stroke-dasharray="10 12"/><text x="${p.x}" y="${p.y-p.r-10}" text-anchor="middle" style="fill:#5aa8e6" font-size="48">★</text></g>`).join("")
       + _triRelevesHtml("espace");   // v0.98 : relevés de triangulation en orbite (Q10)
}

/* v0.98 — Repères ★ d'une SOUS-CARTE (La Braise…) : même dessin, pointer-events:none. */
function marqueursQueteCarteHtml(carte){
  const e=etapeActive(); const a=queteActive();
  if(!e || !e.cible || (a && a._resolu)) return "";
  const pts=_ptsQuete(e).map(_cibleResolue).filter(p=>p && p.carte===carte);
  return pts.map(p=>`<g style="pointer-events:none"><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="#5aa8e6" fill-opacity="0.10" stroke="#5aa8e6" stroke-opacity="0.75" stroke-width="3" stroke-dasharray="6 8"/><text x="${p.x}" y="${p.y+14}" text-anchor="middle" style="fill:#5aa8e6" font-size="40">★</text></g>`).join("")
       + _triRelevesHtml(carte);   // v0.98 : relevés de triangulation
}
/* Clic près d'un repère d'une sous-carte : on va à son centre (comme repereQueteSous sur Silène). */
function repereQueteSousCarte(carte, x, y){
  const a=queteActive(); const e=etapeActive(); if(!a || a._resolu || !e || !e.cible) return null;
  let best=null, bd=Infinity;
  for(const p0 of _ptsQuete(e)){
    const p=_cibleResolue(p0); if(!p || p.carte!==carte) continue;
    const d=Math.hypot(x-p.x, y-p.y); if(d <= p.r+50 && d < bd){ bd=d; best=p; }
  }
  return best;
}

/* v0.97 — OÙ SE PREND UNE QUÊTE. Par défaut au comptoir de sa cité de faction ;
   `lieuPrise:"carcasse"` : chez Galm, à La Carcasse (Q6→). */
function _priseIci(q){
  if(q && q.lieuPrise==="carcasse") return (typeof surCarcasse==="function") && surCarcasse();
  return _enFaction();
}

/* ---------- Onglet « Quêtes » ---------- */
function majQueteHub(){
  const z=document.querySelector("#hub-quete"); if(!z) return;
  /* ⚠ v0.92 — NE PAS REDESSINER PENDANT UN SIMON : le redessin appelle
     `_clearQ()`, qui tuerait les minuteurs de la partie en cours, et
     reconstruirait le DOM en perdant la séquence mémorisée. Voir `_seqEnCours`. */
  if(_seqEnCours()) return;
  _queteStyle();
  _clearQ();
  const enFac=_enFaction();
  // Donneur : lu sur la quête active (défaut = Vieux Sorn). L'image se déduit du
  // champ donneurImg, sinon d'un nom de fichier dérivé du donneur.
  /* ⚠ v0.67 — la bannière ne lisait QUE la quête active : avant d'accepter, on
     voyait encore le donneur de la quête précédente (Sorn au lieu d'Adaya), et
     il fallait recharger pour que ça change. On prend la quête active si elle
     existe, sinon celle qu'on est en train de PROPOSER. */
  const _qa0=queteActive(); const _qd0=_qa0 ? queteData(_qa0.id) : queteProchaine();
  const _dNom=(_qd0&&_qd0.donneur)||"Vieux Sorn";
  const _dImg=(_qd0&&_qd0.donneurImg)||("images/quetes/"+_dNom.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")+".png");
  /* Le lieu affiché est celui où l'on PREND la quête : le comptoir de sa
     propre cité. Un donneur peut ensuite emmener le joueur ailleurs, mais la
     bannière ne doit pas annoncer un lieu où le joueur n'est pas. */
  const _dLieu=(_qd0&&_qd0.donneurLieu)||"Comptoir";
  const _ici = _priseIci(_qd0);   // v0.97
  const banniere = _ici ? `<div class="quete-banniere"><img src="${_dImg}" alt="" onerror="this.remove()"><span>${_dNom} — ${_dLieu}</span></div>` : "";
  const a=queteActive();

  if(!a){
    if(!_ici){
      const qp=queteProchaine();
      /* v1.00 — Q15 se reprend EN BAS, au comptoir de Sorn : à La Carcasse (où l'on
         est à la fin de Q14), Galm renvoie vers lui plutôt qu'un message générique. */
      const _galm = qp && !qp.lieuPrise && (typeof surCarcasse==="function") && surCarcasse();
      z.innerHTML = (qp && qp.lieuPrise==="carcasse")
        ? `<p class="vide">Personne n'a de travail pour toi ici. Là-haut, dans le secteur Triptolème, on dit qu'à <b>La Carcasse</b> une ferrailleuse cherche toujours des bras.</p>`
        : _galm
        ? `<p class="vide">Galm ne lève pas le nez de son établi. « J'ai plus rien pour toi. Le vieux t'attend en bas, à son comptoir. Il a dit que tu saurais pourquoi. »</p>`
        : `<p class="vide">Les quêtes se prennent au <b>comptoir de ta ville de faction</b>. Rejoins-la pour voir ce qu'on te réserve.</p>`;
      return;
    }
    const q=queteProchaine(); let html=banniere;
    if(q) html+=`<h3 style="margin:2px 0">${q.nom}</h3><p class="vide" style="margin:0 0 8px">Donneur : <b>${q.donneur}</b></p>${_par(q.intro)}<button class="mini" id="quete-accepter" style="margin-top:10px">Accepter la quête</button>`;
    else html+=`<p class="vide">Toutes les quêtes disponibles sont accomplies. Le Vieux Sorn n'a rien de plus pour l'instant.</p>`;
    z.innerHTML=html;
    const acc=z.querySelector("#quete-accepter"); if(acc) acc.addEventListener("click",()=>{ const nx=queteProchaine(); if(nx) accepterQuete(nx.id); });
    return;
  }

  const q=queteData(a.id); const e=etapeActive(); const n=q.etapes.length;
  const entete=banniere+`<h3 style="margin:2px 0">${q.nom}</h3><p class="vide" style="margin:0 0 10px">${q.donneur} · étape ${a.etape+1}/${n}</p>`;

  if(a._resolu){
    let html=entete;
    const _img=_varie(e.image);
    if(_img) html+=`<img class="quete-img" src="${_img}" alt="" onerror="this.remove()">`;
    html+=`<div class="quete-etape" style="border-left-color:var(--bleu)">${_par((e.defi&&_varie(e.defi.reussite))||["La voie s'ouvre."])}</div>`;
    const dernier=(a.etape>=q.etapes.length-1);
    html+=`<button class="mini" id="quete-continuer" style="margin-top:6px">${dernier?"Terminer la quête":"Continuer →"}</button>`;
    z.innerHTML=html;
    const bc=z.querySelector("#quete-continuer"); if(bc) bc.addEventListener("click",()=>{ if(bc.disabled) return; bc.disabled=true; avancerQuete(); });   // ⚠ double clic = étape sautée
    return;
  }

  if(surSiteQuete()){
    const verrou=queteVerrou();
    let html=entete+`<div class="quete-etape" style="border-left-color:var(--bleu)">`;
    const _img=_varie(e.image);
    if(_img) html+=`<img class="quete-img" src="${_img}" alt="" onerror="this.remove()">`;
    html+=_par(_varie(e.arrivee))+`</div>`;
    if(verrou>0) html+=`<div class="quete-etape"><p class="quete-indice">🔒 Échec — le mécanisme s'est verrouillé.</p><p class="vide">Reviens tenter à nouveau dans <b id="q-verrou">${_fmtDuree(verrou)}</b> (délai de ${VERROU_DEFI_H} h).</p></div>`;
    else html+=_defiHTML(e.defi);
    html+=`<button class="mini danger" id="quete-abandon" style="margin-top:6px">Abandonner</button>`;
    z.innerHTML=html;
    if(verrou>0){ _queteTimer=setInterval(()=>{ const r=queteVerrou(); const el=z.querySelector("#q-verrou"); if(el) el.textContent=_fmtDuree(r); if(r<=0){ clearInterval(_queteTimer); _queteTimer=null; rafraichirQuetes(); } },1000); }
    else _defiWire(z, e.defi);
    const ab=z.querySelector("#quete-abandon"); if(ab) ab.addEventListener("click",abandonnerQuete);
    return;
  }

  let html=entete+`<div class="quete-etape"><p style="margin:0 0 2px"><b>Objectif :</b></p>
    <p class="quete-indice">« ${e.indice||"—"} »</p>
    <p class="vide" style="margin:0">${e.cache
      ? "Aucun repère sur la carte. Déplace-toi : après chaque trajet, la bouture te dit si tu t'es rapproché."
      : (({espace:"Ouvre la carte de Triptolème", braise:"Ouvre la carte de La Braise", suaire:"Ouvre la carte du Suaire"})[carteEtapeActive()] || "Ouvre la carte") + " : des repères ★ sont apparus (certains sont de fausses pistes). Rends-toi au bon endroit — l'épreuve n'apparaît que sur place."}</p>
    ${(e.defi && e.defi.type==="chasse") ? _chasseRouteHtml() : ""}</div>`;
  html+=`<button class="mini danger" id="quete-abandon" style="margin-top:6px">Abandonner</button>`;
  z.innerHTML=html;
  const ab=z.querySelector("#quete-abandon"); if(ab) ab.addEventListener("click",abandonnerQuete);
}

/* ---------- Style + rafraîchissement ---------- */
let _queteStyleMonte=false;
function _queteStyle(){
  if(_queteStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    .quete-banniere{ position:relative; width:100%; aspect-ratio:3/1; max-height:340px; border:1px solid var(--edge); border-radius:var(--r-s); overflow:hidden; margin-bottom:12px; background:linear-gradient(120deg, rgba(255,138,61,.18), rgba(90,168,230,.12)); }
    .quete-banniere img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
    .quete-banniere span{ position:absolute; left:0; right:0; bottom:0; padding:16px 16px 10px; background:linear-gradient(transparent, rgba(4,10,26,.82)); font-family:"Space Mono",monospace; letter-spacing:.12em; text-transform:uppercase; color:var(--orange-hi); font-size:13px; }
    .quete-etape{ border:1px solid var(--line); border-left:2px solid var(--orange); border-radius:var(--r-s); padding:10px 12px; margin:6px 0; background:rgba(16,40,37,.35); }
    .quete-dial{ margin:7px 0; line-height:1.5; }
    .quete-chasse{ display:flex; align-items:center; gap:14px; margin-top:10px; }
    .q-bouture-bat{ display:block; flex:0 0 64px; width:64px; height:64px; border-radius:50%; background:radial-gradient(circle, rgba(232,240,200,.55) 0 18%, rgba(232,240,200,.12) 45%, transparent 70%); animation:qBat 1.5s ease-in-out infinite; }
    .q-bouture-bat img{ width:100%; height:100%; object-fit:contain; display:block; }
    @keyframes qBat{ 0%,100%{ transform:scale(1); filter:brightness(.75); } 50%{ transform:scale(1.13); filter:brightness(1.35) drop-shadow(0 0 10px rgba(232,240,200,.8)); } }
    .q-thermo{ height:10px; border-radius:5px; background:rgba(255,255,255,.08); overflow:hidden; }
    .qc-zone{ touch-action:pan-y; }
    .qc-bloc{ margin:8px 0; }
    .qc-tete{ display:flex; justify-content:space-between; align-items:center; font-size:12px; opacity:.85; margin-bottom:3px; }
    .qc-cmd button{ min-width:40px; min-height:40px; margin-left:4px; }
    .qc-ligne{ display:grid; grid-template-columns:repeat(${CALQ_N},1fr); height:46px; border:1px solid var(--line); border-radius:4px; background:rgba(0,0,0,.25); touch-action:none; cursor:grab; user-select:none; }
    .qc-c{ position:relative; border-right:1px solid rgba(255,255,255,.04); }
    .qc-c i{ position:absolute; left:15%; right:15%; bottom:0; border-radius:2px 2px 0 0; }
    .qc-hors{ background:rgba(0,0,0,.35); }
    .qc-A .qc-c i{ background:#b9a0f0; }
    .qc-B .qc-c i{ background:#e8f0c8; opacity:.85; }
    .qc-C .qc-c i{ background:#5ad0e6; opacity:.6; }
    .ql-grille{ display:grid; gap:3px; max-width:420px; margin:8px auto 0; }
    .ql-c{ aspect-ratio:1; min-height:40px; border:1px solid var(--line); border-radius:4px; background:rgba(16,40,37,.45); color:var(--txt,#fff); font-size:16px; padding:0; position:relative; }
    .ql-c small{ position:absolute; right:3px; bottom:1px; font-size:10px; }
    .ql-obs{ background:rgba(232,240,200,.22); border-color:rgba(232,240,200,.4); }
    .ql-bete{ background:rgba(90,208,230,.2); color:#5ad0e6; }
    .ql-vu{ background:rgba(255,138,61,.28); }
    .ql-cib{ color:#e6c24f; }
    .ql-moi{ outline:2px solid #fff; color:#fff; }
    .ql-pas{ cursor:pointer; box-shadow:inset 0 0 0 2px rgba(90,168,230,.8); }
    .q-thermo i{ display:block; height:100%; background:linear-gradient(90deg,#5aa8e6,#e6c24f,#ff8a3d); }
    .quete-img{ width:100%; aspect-ratio:3/1; max-height:300px; object-fit:cover; border-radius:8px; margin:0 0 10px; display:block; }
    .quete-indice{ font-style:italic; color:var(--texte); margin:6px 0; }
    .quete-rep{ display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center; }
    .quete-rep input{ flex:1; min-width:160px; background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:8px 10px; font-family:inherit; }
    .q-liv-ligne{ display:flex; align-items:center; gap:8px; margin:4px 0; }
    .q-pir-piste{ position:relative; height:24px; background:#0f1830; border:1px solid var(--line); border-radius:6px; overflow:hidden; margin:8px 0; }
    .q-pir-zone{ position:absolute; top:0; bottom:0; background:rgba(139,212,80,.35); border-left:1px solid #8bd450; border-right:1px solid #8bd450; }
    .q-pir-curseur{ position:absolute; top:0; bottom:0; width:3px; background:var(--orange-hi,#ffb060); left:0; }
    .q-gly-grille{ display:flex; flex-wrap:wrap; gap:10px; margin:8px 0; }
    .q-gly-carte{ display:flex; flex-direction:column; align-items:center; gap:5px; border:1px solid var(--line); border-radius:8px; padding:8px 10px; background:rgba(16,41,78,.4); min-width:92px; }
    /* ⚠ v0.73 — sans font-family explicite, iOS et Android substituent une
       police EMOJI COULEUR à certains symboles (⛨ ⛔ ⏱ ⚕ devenaient des
       pastilles rouges et bleues, hors du style du jeu). La pile ci-dessous
       impose des polices de SYMBOLES monochromes ; variation-selector-15
       (text) via font-variant-emoji finit le travail sur Safari récent. */
    .q-gly-pic, .q-cad-slot, .q-cad-code{
      font-family:"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2",
                  "DejaVu Sans","Arial Unicode MS",sans-serif;
      font-variant-emoji:text; }
    .q-gly-pic{ font-size:26px; line-height:1; color:var(--texte); } .q-gly-pic img{ width:32px; height:32px; object-fit:contain; }
    .q-gly-sym{ font-size:30px; color:var(--bleu); line-height:1; } .q-gly-sym img{ width:36px; height:36px; object-fit:contain; }
    .q-gly-sel{ background:#0f1830; border:1px solid var(--line); border-radius:6px; color:var(--texte); padding:4px 6px; font-family:inherit; font-size:12px; max-width:110px; }
    .q-cad-slots,.q-seq-pads{ display:flex; gap:8px; flex-wrap:wrap; margin:8px 0; }
    .q-cad-slot{ background:#0f1830; border:1px solid var(--line); border-radius:6px; color:var(--bleu); font-size:18px; padding:4px 6px; }
    .q-cad-hist{ display:flex; flex-direction:column; gap:4px; margin-top:8px; }
    .q-cad-ligne{ display:flex; justify-content:space-between; gap:10px; font-size:13px; }
    .q-cad-code{ font-size:18px; letter-spacing:.15em; color:var(--bleu); }
    .q-seq-pad{ font-size:26px; width:56px; height:56px; background:rgba(16,41,78,.5); border:1px solid var(--line); border-radius:10px; color:var(--texte); cursor:pointer; }
    .q-seq-pad.actif{ background:var(--orange,#ff8a3d); color:#04101a; box-shadow:0 0 16px var(--orange,#ff8a3d); }
    .q-seq-etat{ margin:4px 0; font-family:"Space Mono",monospace; font-size:12px; color:var(--sourdine,#7f93a8); }
    .q-mem-info{ background:rgba(90,168,230,.12); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin:8px 0; font-family:"Space Mono",monospace; line-height:1.6; }
    .q-ordre-pool,.q-ordre-rep{ display:flex; flex-wrap:wrap; gap:6px; margin:6px 0; }
    .q-ordre-el:disabled{ opacity:.35; }
    .q-ordre-chip{ font-family:"Space Mono",monospace; font-size:12px; background:rgba(90,168,230,.15); border:1px solid var(--line); border-radius:6px; padding:3px 8px; }
  `;
  document.head.appendChild(st); _queteStyleMonte=true;
}
// Rafraîchit l'onglet Quêtes depuis afficher() SEULEMENT pour livraison/paiement
// (dépendent du sac/crédits ; pas de saisie ni d'animation à préserver).
function majQueteHubSiPertinent(){
  const a=queteActive(); if(!a || a._resolu) return;
  const e=etapeActive(); if(!e || !e.defi || !surSiteQuete()) return;
  if(e.defi.type==="livraison" || e.defi.type==="paiement") majQueteHub();
}
function rafraichirQuetes(){
  if(typeof majQueteHub==="function") majQueteHub();
  if(typeof afficher==="function") afficher();
}
