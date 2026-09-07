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
async function seDeconnecter(){ if(SERVEUR_DISPO) try{ await sb.auth.signOut(); }catch(e){} }
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
async function pousserCredits(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  const s = await sessionActuelle(); if(!s) return;
  if(_creditsServeur===null){ _creditsServeur = (etat.credits|0); return; }
  const delta = (etat.credits|0) - _creditsServeur;
  if(delta===0) return;
  const { data, error } = await sb.rpc("crediter", { delta });
  if(error){ console.warn("[serveur] crediter:", error.message); return; }
  if(typeof data==="number"){ _creditsServeur = data; etat.credits = data; }
}
async function rechargerCredits(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  const s = await sessionActuelle(); if(!s) return;
  const { data } = await sb.from("profils").select("credits").eq("id", s.user.id).maybeSingle();
  if(data && typeof data.credits==="number"){ etat.credits=data.credits; _creditsServeur=data.credits; if(typeof afficher==="function") afficher(); }
}
// Copie de l'état SANS les stocks : ils vivent dans la table `inventaire`.
function _etatSansStocks(){
  const c = Object.assign({}, etat);
  delete c.sac; delete c.coffre; delete c.soute;
  delete c.lots;                                  // liste des lots : donnée serveur, jamais persistée
  delete c.sacDate; delete c.coffreDate; delete c.souteDate;   // vestiges : les dates sont serveur
  return c;
}

async function sauverSurServeur(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  await pousserCredits();
  const s = await sessionActuelle();
  if(!s){ console.warn("[serveur] sauvegarde ignorée : pas de session active"); return; }
  const maj = {
    nom: etat.nom || null,
    faction: etat.faction || null,
    formation: _nomFormation(),
    mur_public: (etat.murOuvertA==='tous'),
    niveau: (etat.niveau|0),
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
  else console.log("[serveur] sauvegarde OK — credits=" + (etat.credits|0) + ", faction=" + maj.faction);
}

/* Sauvegarde serveur « débounce » : appelée par sauvegarder(), max 1 écriture toutes ~2,5 s. */
let _sauveTimer = null;
function planifierSauveServeur(){
  if(!SERVEUR_DISPO) return;
  clearTimeout(_sauveTimer);
  _sauveTimer = setTimeout(sauverSurServeur, 2500);
}
/* Filet : pousse la dernière version en quittant la page (meilleur effort). */
window.addEventListener("beforeunload", () => { if(SERVEUR_DISPO && etat && etat.inscrit) sauverSurServeur(); });
