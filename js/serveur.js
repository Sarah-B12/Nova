/* ===========================================================
   _catchLog — trace les erreurs qu'on choisit d'ignorer.

   Trois bugs de la Phase 4 ont été masqués des heures durant par des
   `catch(e){ if(typeof _catchLog==="function") _catchLog(e, "serveur.js#1"); }` vides : la conversion de date qui faisait échouer TOUTE
   péremption, les gains de Cercle refusés par le trigger de sécurité, et les
   cadeaux dev qui n'atteignaient pas le serveur. Le comportement ne change
   pas — on continue de poursuivre —, mais plus rien ne disparaît en silence.

   Pour tout voir dans la console : filtre sur « [ignoré] ».
   =========================================================== */
function _catchLog(e, ou){
  try{ console.warn("[ignoré]", ou || "?", "→", (e && (e.message || e.error_description)) || e); }catch(_){ if(typeof _catchLog==="function") _catchLog(_, "serveur.js#2"); }
}

/* ===========================================================
   SERVEUR — Connexion Supabase (Phase 1 : comptes + sauvegarde serveur).
   La clé « anon » est PUBLIQUE (prévue pour le navigateur) — c'est la RLS qui protège.
   Repli automatique en mode local si la librairie/le serveur est indisponible.
   =========================================================== */
const SB_URL = "https://htwrtainoqmjaxolpmif.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0d3J0YWlub3FtamF4b2xwbWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTc0ODksImV4cCI6MjEwMzY5MzQ4OX0.tDnZVbFMAU7GajR8x56wL4UtTtEjlxRP65CyV_GFgCs";

const sb = (typeof supabase !== "undefined" && supabase.createClient)
  ? supabase.createClient(SB_URL, SB_KEY)
  : null;
const SERVEUR_DISPO = !!sb;
function estAdmin(){ return etat && (etat.roleAdmin==='dev' || etat.roleAdmin==='admin'); }
function estDev(){ return etat && etat.roleAdmin==='dev'; }
if(!SERVEUR_DISPO) console.warn("[serveur] Librairie Supabase absente — mode local.");

/* ---------- Auth ---------- */
async function sInscrire(email, mdp, pseudo){
  return await sb.auth.signUp({ email, password: mdp, options: { data: { nom: pseudo } } });
}
async function seConnecter(email, mdp){
  return await sb.auth.signInWithPassword({ email, password: mdp });
}
async function seDeconnecter(){ if(SERVEUR_DISPO) try{ await sb.auth.signOut(); }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "serveur.js#3"); } }
async function sessionActuelle(){ if(!SERVEUR_DISPO) return null; const { data } = await sb.auth.getSession(); return data ? data.session : null; }

/* Nom lisible de la formation (l'état stocke un objet {cle, points, ...}). */
function _nomFormation(){
  const f = etat && etat.formation; if(!f) return null;
  const cle = (typeof f==="object") ? f.cle : f; if(!cle) return null;
  return (typeof FORMATIONS!=="undefined" && FORMATIONS[cle]) ? FORMATIONS[cle].nom : cle;
}

/* ---------- Chargement / sauvegarde ---------- */
async function chargerDepuisServeur(){
  const s = await sessionActuelle(); if(!s) return null;
  const { data, error } = await sb.from("profils").select("*").eq("id", s.user.id).maybeSingle();
  if(error){ console.warn("[serveur] chargement:", error.message); return null; }
  return data;   // ligne { id, nom, faction, ..., donnees } OU null si aucun profil
}
let _creditsServeur = null;
function initCredits(v){ _creditsServeur = (typeof v==="number") ? v : null; }
function marquerCredits(v){ if(typeof v==="number") _creditsServeur = v; }
/* Applique au serveur l'écart de crédits accumulé côté client (delta), et récupère
   la valeur autoritative (qui inclut d'éventuelles ventes encaissées entre-temps). */
/* ⚠ FILE D'ATTENTE DES CRÉDITS (v0.58). Trois défauts corrigés :
   1. Deux pousserCredits() simultanés (sauvegarde immédiate + minuterie de
      2,5 s + intervalle de 60 s + beforeunload) calculaient le MÊME écart
      contre le même _creditsServeur : le serveur l'appliquait DEUX fois.
   2. `etat.credits = data` au retour effaçait ce qui avait bougé en local
      PENDANT l'appel (un achat, un gain) : perdu pour toujours.
   3. Un solde renvoyé par une RPC (marché, apparence) jetait l'écart local
      pas encore poussé.
   Tout passe par une file (un appel à la fois) et l'écart en attente est
   TOUJOURS reposé par-dessus la valeur serveur. */
let _creditsFile = Promise.resolve();
function _enFileCredits(fn){
  const p = _creditsFile.then(fn, fn);
  _creditsFile = p.catch(()=>{});
  return p;
}
// Écart local pas encore connu du serveur.
function _creditsEnAttente(){ return (_creditsServeur===null) ? 0 : ((etat.credits|0) - _creditsServeur); }
/* Quand le serveur renvoie un solde : remplace `etat.credits = v; marquerCredits(v)`,
   qui jetait l'écart en attente. */
function appliquerSoldeServeur(v){
  if(typeof v!=="number") return;
  const attente = _creditsEnAttente();
  _creditsServeur = v; etat.credits = v + attente;
}
/* RPC qui touche aux crédits ET renvoie le solde (clé `cle`, « solde » par défaut) :
   exécutée DANS la file, pour qu'aucun pousserCredits() ne s'intercale entre
   l'appel et l'application du solde (sinon l'écart en attente partirait deux fois). */
function rpcAvecSolde(nom, args, cle){
  return _enFileCredits(async ()=>{
    await _pousserCreditsUneFois();
    const r = await sb.rpc(nom, args || {});
    const d = r && r.data;
    if(d && d.ok && typeof d[cle||"solde"]==="number") appliquerSoldeServeur(d[cle||"solde"]);
    return r;
  });
}
async function _pousserCreditsUneFois(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  const s = await sessionActuelle(); if(!s) return;
  if(_creditsServeur===null){ _creditsServeur = (etat.credits|0); return; }
  const envoye = (etat.credits|0);
  const delta = envoye - _creditsServeur;
  if(delta===0) return;
  const avant = _creditsServeur;
  const { data, error } = await sb.rpc("crediter", { delta });
  if(error){ console.warn("[serveur] crediter:", error.message); return; }
  if(typeof data==="number"){
    const pendant = (etat.credits|0) - envoye;     // bougé en local pendant l'appel
    _creditsServeur = data; etat.credits = data + pendant;
    if(delta > 0 && data < avant + delta) console.warn("[serveur] crediter : gain refusé ou partiel (plafond ?)", { delta, avant, data });
  }
}
function pousserCredits(){ return _enFileCredits(_pousserCreditsUneFois); }
function rechargerCredits(){
  return _enFileCredits(async ()=>{
    if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
    await _pousserCreditsUneFois();                // d'abord ce qui attend, sinon on l'effacerait
    const s = await sessionActuelle(); if(!s) return;
    const { data, error } = await sb.from("profils").select("credits").eq("id", s.user.id).maybeSingle();
    if(error){ console.warn("[serveur] rechargerCredits:", error.message); return; }
    if(data && typeof data.credits==="number"){ appliquerSoldeServeur(data.credits); if(typeof afficher==="function") afficher(); }
  });
}
/* RÈGLE D'OR — une donnée qui appartient au SERVEUR ne doit avoir AUCUNE copie
   persistante côté client, ni dans `profils.donnees`, ni dans localStorage.
   Cette liste est la source unique : `_etatSansStocks()` (push serveur) ET
   `sauvegarder()` (localStorage, etat.js) s'en servent tous les deux.
   ⚠ Ne jamais ajouter une clé ici sans vérifier qu'elle est bien réécrite par
   une réponse serveur (sinon elle serait perdue au rechargement). */
const CLES_SERVEUR = [
  "sac", "coffre", "soute",          // stocks : table `inventaire`
  "lots",                            // lots datés : renvoyés par sac_lire()
  "sacDate", "coffreDate", "souteDate",  // vestiges : les dates sont serveur
  "_lotsSynchro",                    // garde-fou de majUsure : DOIT repartir à faux au démarrage
  "equipeServeur", "forceCombatServeur", // reflets de sac_lire() : recalculés à chaque appel
  "faction",                         /* ⚠ colonne profils.faction, écrite par changer_faction() UNIQUEMENT.
                                        Le client a cessé de la pousser (course avec la RPC) mais continuait
                                        à la lire dans `donnees` : un joueur transféré voyait son ANCIENNE
                                        faction sur sa fiche, la bonne dans Population. Une donnée qu'on
                                        n'écrit plus ne doit plus être persistée non plus. */
  "avatar",                          // colonne profils.avatar, écrite par changer_apparence()
  "apparenceLe",                     // vestige : le verrou est calculé par apparence_etat()
  "jauges"                           // colonnes o2/sante/moral : lues par jauges_lire(), écrites par agir()
];

// Copie de l'état SANS les données serveur : elles vivent dans `inventaire`.
function _etatSansStocks(){
  const c = Object.assign({}, etat);
  for(const k of CLES_SERVEUR) delete c[k];
  return c;
}

/* Attribution initiale de la faction, juste après l'inscription.
   Le trigger l'autorise UNIQUEMENT tant que profils.faction vaut NULL ; ensuite
   il faut passer par changer_faction(). On pose aussi faction_le à NULL
   volontairement : le premier changement ne doit pas être bloqué 30 jours. */
async function _premiereFaction(fid){
  if(!SERVEUR_DISPO || !fid) return;
  const s = await sessionActuelle(); if(!s) return;
  const { error } = await sb.from("profils").update({ faction: fid }).eq("id", s.user.id).is("faction", null);
  if(error) console.warn("[serveur] attribution faction ÉCHEC:", error.message);
}

async function sauverSurServeur(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  await pousserCredits();
  const s = await sessionActuelle();
  if(!s){ console.warn("[serveur] sauvegarde ignorée : pas de session active"); return; }
  const maj = {
    nom: etat.nom || null,
    // ⚠ `faction` N'EST PLUS POUSSÉE : la colonne appartient au serveur
    // (RPC changer_faction) et le trigger profils_protection la refuse dès
    // qu'elle a une valeur. La repousser ferait échouer TOUTE la sauvegarde.
    // Seule exception laissée par le trigger : old.faction IS NULL, c'est-à-dire
    // l'attribution initiale — traitée par _premiereFaction() ci-dessous.
    formation: _nomFormation(),
    mur_public: (etat.murOuvertA==='tous'),
    /* ⚠ `niveau` N'EST PLUS POUSSÉ ici. niveau_monter() ne recharge l'énergie
       que si le niveau déclaré dépasse celui en base ; or cette sauvegarde
       écrivait la colonne de son côté, et quand elle arrivait la première la
       RPC voyait « pas de montée » et ne rechargeait rien. Course supprimée :
       niveau_monter() est désormais le seul à écrire profils.niveau. */
    // ⚠ PHASE 4 : energie / energie_maj NE SONT PLUS POUSSÉES ici.
    // Le serveur en est désormais propriétaire (RPC agir()). Les repousser
    // depuis le client écraserait la dépense serveur — même piège que les crédits.
    pos_x: (etat.pos && typeof etat.pos.x==="number") ? Math.round(etat.pos.x) : null,
    pos_y: (etat.pos && typeof etat.pos.y==="number") ? Math.round(etat.pos.y) : null,
    derniere_activite: new Date().toISOString(),
    // ⚠ PHASE 4 : les stocks appartiennent à la table `inventaire`. En garder une
    // copie dans donnees créait des FANTÔMES : au rechargement, le client
    // réhydratait l'ancien sac avant que la synchro serveur n'arrive, puis le
    // re-sauvegardait. On les retire de la sauvegarde (le serveur fait foi).
    donnees: _etatSansStocks()
  };
  const { error } = await sb.from("profils").update(maj).eq("id", s.user.id);
  if(error) console.warn("[serveur] sauvegarde ÉCHEC:", error.message);
  else { console.log("[serveur] sauvegarde OK — credits=" + (etat.credits|0) + ", faction=" + (etat.faction||"—"));
         _presenceDer = Date.now(); }   // elle écrit derniere_activite : inutile de doubler
}

/* Sauvegarde serveur « débounce » : appelée par sauvegarder(), max 1 écriture toutes ~2,5 s. */
let _sauveTimer = null;
function planifierSauveServeur(){
  if(!SERVEUR_DISPO) return;
  clearTimeout(_sauveTimer);
  _sauveTimer = setTimeout(sauverSurServeur, 2500);
}
/* ===========================================================
   PRÉSENCE — battement de cœur.
   `derniere_activite` n'était écrite que par sauverSurServeur(), donc
   uniquement quand le joueur AGISSAIT. Or le point vert s'éteint après
   2 minutes : quelqu'un qui lit une annonce, rédige un message ou regarde sa
   carte passait « hors ligne » l'onglet grand ouvert.
   ⚠ On n'écrit QUE `derniere_activite` — surtout pas via sauverSurServeur(),
   qui repousserait tout l'état et coûterait cent fois plus cher.
   ⚠ Rien n'est envoyé si l'onglet est masqué : un onglet oublié en arrière-plan
   ne doit pas faire croire que le joueur est là.
   =========================================================== */
const PRESENCE_MS = 60000;   // < 120 000, le seuil de _presenceEnLigne()
let _presenceDer = 0;
async function battementPresence(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  if(typeof document !== "undefined" && document.hidden) return;
  if(Date.now() - _presenceDer < PRESENCE_MS - 5000) return;   // une sauvegarde vient peut-être de le faire
  const s = await sessionActuelle(); if(!s) return;
  try{
    const { error } = await sb.from("profils")
      .update({ derniere_activite: new Date().toISOString() })
      .eq("id", s.user.id);
    if(error){ console.warn("[presence]", error.message); return; }
    _presenceDer = Date.now();
  }catch(e){ console.warn("[presence]", (e && e.message) || e); }
}
setInterval(battementPresence, PRESENCE_MS);
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) battementPresence(); });

/* Filet : pousse la dernière version en quittant la page (meilleur effort). */
window.addEventListener("beforeunload", () => { if(SERVEUR_DISPO && etat && etat.inscrit) sauverSurServeur(); });
