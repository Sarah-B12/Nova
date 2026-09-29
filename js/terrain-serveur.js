/* ===========================================================
   TERRAIN CÔTÉ SERVEUR — v1.35 (brique 7 du chantier, BACKEND_PLAN §50-55)

   Le terrain (parcelles, cases, drones) et la maison (palier, chantier)
   vivent dans les tables `terrains`, `terrain_parcelles`, `terrain_cases`.
   Le client ne les écrit plus : chaque action appelle SA RPC, qui renvoie
   l'état à jour (`terrain`), et le client l'adopte tel quel.

   ⚠ `terrain` et `maison` sont dans CLES_SERVEUR (serveur.js) : jamais
     persistés, ni dans `donnees` ni dans localStorage. Ils se relisent ici
     (`chargerTerrain`, appelée par `chargerIntegrite` au démarrage, au retour
     sur l'onglet et à l'ouverture du terrain).
   ⚠ L'ABANDON (plante 2 j, animal 3 j), l'USURE des drones et le décalage de
     pause sont appliqués par le serveur ; ses messages arrivent par les
     événements (syncEffetsCombat).
   ⚠ Les TIRAGES (lot de mine, récolte, tonte) restent calculés ici ; le
     serveur les borne.
   =========================================================== */

let _terrainSynchro = false;   // vrai dès la première lecture serveur (garde des drones)

function appliquerTerrainServeur(t){
  if(!t || typeof t !== "object" || typeof etat === "undefined" || !etat) return;
  if(Array.isArray(t.parcelles)) etat.terrain = { parcelles: normaliserParcelles(t) };
  if(t.maison && typeof t.maison === "object"){
    etat.maison = { palier: t.maison.palier || 0, plot: (t.maison.plot == null ? null : t.maison.plot),
                    chantier: (t.maison.chantier && typeof t.maison.chantier === "object")
                      ? { cible: t.maison.chantier.cible, depose: t.maison.chantier.depose || {}, travail: t.maison.chantier.travail || 0 }
                      : null };
  }
  if(t.integrite && typeof _appliquerIntegrite === "function") _appliquerIntegrite(t.integrite);
  _terrainSynchro = true;
}

async function chargerTerrain(){
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO || !etat || !etat.inscrit) return;
  try{
    const { data, error } = await sb.rpc("terrain_lire");
    if(error){ console.warn("[terrain] lecture :", error.message); return; }
    if(data && data.ok) appliquerTerrainServeur(data);
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "terrain-serveur.js#charger"); }
}

/* Messages des refus propres au terrain. Les refus d'`agir` (énergie, prison,
   manque, sac plein, mort, session) sont traités comme dans agirServeur(). */
const TERRAIN_REFUS = {
  acces:        "Ce terrain n'est pas le tien.",
  loin:         "Ton terrain est sur Silène : rentre chez toi pour t'en occuper.",
  occupee:      "Cette place est déjà occupée.",
  hs:           "Structure à l'arrêt : répare-la (ou démolis-la) avant de t'en servir.",
  epuisee:      "Mine épuisée — démolis-la puis reconstruis-en une.",
  mur:          "Déjà mûr — récolte-le.",
  pas_mur:      "Pas encore mûr.",
  adulte:       "Déjà adulte.",
  jeune:        "Trop jeune — nourris-le encore.",
  drones:       "Retire d'abord les drones du hangar avant de le démolir.",
  pas_de_maison:"Tu n'as pas de logement.",
  pas_de_chantier:"Aucun chantier en cours.",
  chantier:     "Un chantier est déjà en cours.",
  max:          "Palier maximum atteint.",
  hors_recette: "Cette matière n'entre pas dans la recette.",
  assez:        "Déjà assez de cette matière.",
  travaux_faits:"Les travaux sont faits — il ne manque plus que des matières.",
  deposer:      "Dépose d'abord des matières à travailler.",
  coffre:       "Vide d'abord ton rangement avant de démolir.",
  deja:         "Déjà fait aujourd'hui — la remise à zéro est à minuit."
};

function _terrainRefus(data, propres){
  const err = data && data.err;
  if(err === "energie")        journal("Pas assez d'énergie. Attends (+10 %/h) ou monte de niveau.","alerte");
  else if(err === "prison")    journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte");
  else if(err === "sac_plein") journal("Sac plein — fais de la place d'abord.","alerte");
  else if(err === "manque"){
    const it = (typeof item === "function") ? item(data.item) : null;
    journal(`Il te manque : ${it ? it.nom : (data.item || "un objet")}.`,"alerte");
  }
  else if(err === "credits")   journal(`Il faut ${data.prix} ₡.`,"alerte");
  else if(err === "niveau")    journal(`Niveau ${data.requis} requis.`,"alerte");
  else if(err === "mort"){ if(typeof ouvrirCouloirMort === "function") ouvrirCouloirMort(); }
  else if(err === "non_connecte"){ if(typeof alerteSessionPerdue === "function") alerteSessionPerdue(); else journal("Session expirée — recharge la page.","alerte"); }
  else if((propres && propres[err]) || TERRAIN_REFUS[err]) journal((propres && propres[err]) || TERRAIN_REFUS[err],"alerte");
  else { journal(`Action refusée par le serveur (${err || "réponse vide"}).`,"alerte"); console.warn("[terrain] refus :", data); }
}

/* Appel d'une RPC de terrain. `o.solde` : la RPC touche aux crédits (passe par
   la file des crédits, rpcAvecSolde). `o.refus` : messages propres à l'action.
   Renvoie la réponse (ok) ou null. */
async function terrainRpc(nom, args, o){
  o = o || {};
  if(typeof sb === "undefined"){ journal("Serveur indisponible.","alerte"); return null; }
  try{
    const appel = () => (o.solde && typeof rpcAvecSolde === "function") ? rpcAvecSolde(nom, args) : sb.rpc(nom, args || {});
    let { data, error } = await appel();
    // Session perdue : les RPC de terrain refusent AVANT tout effet, on rejoue une fois.
    if(!error && data && data.err === "non_connecte" && typeof reprendreSession === "function" && await reprendreSession()){
      ({ data, error } = await appel());
    }
    if(error){ journal("Le serveur n'a pas répondu — réessaie.","alerte"); console.warn("[terrain]", nom, error.message); return null; }
    if(!data || !data.ok){ _terrainRefus(data, o.refus); return null; }
    if(data.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
    if(typeof data.energie === "number"){ etat.energie = data.energie; etat.energieMaj = Date.now(); }
    if(data.jauges){ etat.jauges = etat.jauges || {};
      etat.jauges.o2 = data.jauges.o2; etat.jauges.sante = data.jauges.sante; etat.jauges.moral = data.jauges.moral; }
    if(typeof data.solde === "number" && !o.solde && typeof appliquerSoldeServeur === "function") appliquerSoldeServeur(data.solde);
    if(data.terrain) appliquerTerrainServeur(data.terrain);
    return data;
  }catch(e){ journal("Connexion au serveur perdue — réessaie.","alerte"); return null; }
}
