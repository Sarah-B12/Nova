/* ===========================================================
   INVENTAIRE — Sac à dos : capacité, ajout/retrait, réordonnancement par glisser-déposer.
   =========================================================== */
const SAC_MAX = 50;

/* ===========================================================
   PHASE 4 — Les stocks sont détenus par le SERVEUR.
   etat.sac / etat.coffre / etat.soute ne sont plus la vérité : ce sont des
   REFLETS locaux, réécrits à partir de la réponse du serveur après chaque
   action. Le client n'additionne plus rien lui-même.
   Tout passe par agirServeur() : énergie + retraits + ajouts en UN appel
   atomique (soit tout réussit, soit rien ne bouge).
   =========================================================== */

/* Les LOTS sont détenus par le serveur : un lot = (objet, lieu, minute
   d'acquisition). Le client ne tient plus aucune date — etat.sacDate,
   coffreDate et souteDate ne servent plus qu'à l'affichage historique et
   seront retirés. La péremption se calcule sur etat.lots. */
function _appliquerEtatStocks(e){
  if(!e) return;
  // Les lots viennent TOUJOURS du serveur : jamais de localStorage, jamais de donnees.
  etat.sac    = e.sac    || {};
  etat.coffre = e.coffre || {};
  etat.soute  = e.soute  || {};
  etat.lots   = e.lots   || [];     // [{item, lieu, qte, acquis}] — dates serveur
  etat.equipeServeur = e.equipe || {};                  // ce que le SERVEUR croit porté
  if(typeof e.force_combat === "number") etat.forceCombatServeur = e.force_combat;
  etat._lotsSynchro = true;         // à partir d'ici, la péremption peut agir
  // sacOrdre : on conserve l'ordre choisi par le joueur, on retire les piles
  // vides et on ajoute les nouvelles à la fin.
  etat.sacOrdre = (etat.sacOrdre||[]).filter(id => (etat.sac[id]||0) > 0);
  Object.keys(etat.sac).forEach(id => { if(!etat.sacOrdre.includes(id)) etat.sacOrdre.push(id); });
}

// Action atomique. Renvoie la réponse du serveur, ou null si refusée.
async function agirServeur(o){
  o = o || {};
  if(typeof sb === "undefined"){ journal("Serveur indisponible.","alerte"); return null; }
  try{
    const { data, error } = await sb.rpc("agir", {
      p_cout:    o.cout    || 0,
      p_retirer: o.retirer || {},
      p_ajouter: o.ajouter || {},
      p_motif:   o.motif   || null,
      p_tout_ou_rien: !!o.toutOuRien,
      p_jauges:  o.jauges || {}
    });
    if(error){ journal("Le serveur n'a pas répondu — réessaie.","alerte"); return null; }
    if(!data || !data.ok){
      const err = data && data.err;
      if(err === "energie")      journal("Pas assez d'énergie. Attends (+10 %/h) ou monte de niveau.","alerte");
      else if(err === "prison")  journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte");
      else if(err === "manque"){
        // Le serveur nomme l'objet fautif : on l'affiche, sinon on cherche à l'aveugle.
        const it = (typeof item === "function") ? item(data.item) : null;
        journal(`Il te manque : ${it ? it.nom : (data.item || "un objet")}.`,"alerte");
        console.warn("[agir] manque :", data.item, "| sac serveur :", (data.etat && data.etat.sac));
      }
      else if(err === "sac_plein") journal("Sac plein — fais de la place d'abord.","alerte");
      else if(err === "mort"){ if(typeof ouvrirCouloirMort === "function") ouvrirCouloirMort(); }
      else                       journal("Action refusée par le serveur.","alerte");
      return null;
    }
    _appliquerEtatStocks(data.etat);
    if(typeof data.energie === "number"){ etat.energie = data.energie; etat.energieMaj = Date.now(); }
    // Les jauges appartiennent au serveur : on applique ce qu'il renvoie.
    if(data.jauges){ etat.jauges = etat.jauges || {};
      etat.jauges.o2 = data.jauges.o2; etat.jauges.sante = data.jauges.sante; etat.jauges.moral = data.jauges.moral; }
    if(data.mort && typeof ouvrirCouloirMort === "function") ouvrirCouloirMort();
    // Le serveur vient de débiter quelque chose d'irréversible (énergie, objets).
    // L'effet côté client — carburant, croissance, chantier, points de métier —
    // doit être écrit TOUT DE SUITE : la sauvegarde normale attend 2,5 s, et un
    // rechargement dans cet intervalle perdait l'effet en gardant le coût.
    const irreversible = (o.cout > 0) || (o.retirer && Object.keys(o.retirer).length > 0);
    if(irreversible && typeof sauverSurServeur === "function"){
      try{ sauverSurServeur(); }catch(e){}
    }
    return data;
  }catch(e){ journal("Connexion au serveur perdue — réessaie.","alerte"); return null; }
}

// Déplace un objet entre sac / coffre / soute (le sac est toujours l'intermédiaire).
async function rangerServeur(id, n, vers, depuis){
  if(typeof sb === "undefined") return null;
  try{
    const { data, error } = await sb.rpc("ranger",
      { p_item:id, p_qte:n, p_vers:vers, p_depuis:depuis||"sac" });
    if(error || !data || !data.ok){
      const err = data && data.err;
      if(err === "coffre_plein")   journal("Rangement plein — agrandis ton logement.","alerte");
      else if(err === "soute_plein") journal("Soute pleine.","alerte");
      else if(err === "sac_plein")   journal("Sac plein.","alerte");
      else if(err === "manque")      journal("Tu n'as pas cet objet là où tu crois.","alerte");
      else journal("Déplacement refusé par le serveur.","alerte");
      return null;
    }
    _appliquerEtatStocks(data.etat);
    if(typeof sauverSurServeur === "function"){ try{ sauverSurServeur(); }catch(e){} }
    return data;
  }catch(e){ journal("Connexion au serveur perdue — réessaie.","alerte"); return null; }
}

// Garantit n unités DANS LE SAC, en les remontant du coffre ou de la soute si besoin.
// Remplace l'ancien consommerStock() qui piochait directement dans le coffre.
async function assurerDansSac(id, n){
  n = n || 1;
  if((etat.sac[id]||0) >= n) return true;
  for(const lieu of ["coffre","soute"]){
    const manque = n - (etat.sac[id]||0);
    const dispo  = (etat[lieu] && etat[lieu][id]) || 0;
    if(dispo > 0){
      const r = await rangerServeur(id, Math.min(manque, dispo), "sac", lieu);
      if(!r) return false;
      if((etat.sac[id]||0) >= n) return true;
    }
  }
  return (etat.sac[id]||0) >= n;
}

// Chargement initial des trois stocks (à la connexion).
async function chargerStocksServeur(){
  if(typeof sb === "undefined") return null;
  try{ const { data } = await sb.rpc("sac_lire"); _appliquerEtatStocks(data); return data; }
  catch(e){ return null; }
}
                                             // places dans le sac
function placesUtilisees(){ return Object.values(etat.sac).reduce((a,b)=>a+b,0); }
function placesLibres(){ return capaciteSac() - placesUtilisees(); }
// Ajoute n unités au sac dans la limite de la capacité. Renvoie le nombre réellement ajouté.
/* ⚠ VESTIGES Phase 3. Le stock appartient au serveur : écrire dans etat.sac
   crée des objets FANTÔMES (visibles à l'écran, inexistants pour le serveur),
   qui disparaissent au rechargement et provoquent des « il te manque… » plus
   tard. On les laisse pour ne rien casser, mais ils avertissent bruyamment.
   Utiliser agirServeur() / rangerServeur() à la place. */
function ajouterAuSac(id, n){
  console.warn("[obsolète] ajouterAuSac : utiliser agirServeur({ajouter:{...}}) — crée des objets fantômes.");
  const place = Math.max(0, Math.min(n, placesLibres()));
  if (place > 0) {
    if(!(etat.sac[id]>0)){ if(!etat.sacDate) etat.sacDate={}; etat.sacDate[id]=Date.now(); }  // nouvelle pile : date d'acquisition
    etat.sac[id] = (etat.sac[id]||0) + place; if(!etat.sacOrdre.includes(id)) etat.sacOrdre.push(id);
  }
  return place;
}
// Retire une unité et nettoie l'ordre si la pile est vide.
function retirerDuSac(id, n=1){
  console.warn("[obsolète] retirerDuSac : utiliser agirServeur({retirer:{...}}) — désynchronise le serveur.");
  if(!etat.sac[id]) return;
  etat.sac[id]-=n;
  if(etat.sac[id]<=0){ delete etat.sac[id]; etat.sacOrdre=etat.sacOrdre.filter(x=>x!==id); if(etat.sacDate) delete etat.sacDate[id]; }
}
// Réordonne le sac (glisser-déposer) : place dragId à l'emplacement de cibleId.
let dragId=null;
function reordonnerSac(dId, cibleId){
  let ordre = etat.sacOrdre.filter(id => (etat.sac[id]||0)>0);
  const from = ordre.indexOf(dId); if(from<0) return;
  ordre.splice(from,1);
  let to = cibleId ? ordre.indexOf(cibleId) : ordre.length;
  if(to<0) to = ordre.length;
  ordre.splice(to,0,dId);
  etat.sacOrdre = ordre; sauvegarder(); majSac();
}



/* Jours restants pour un objet dans un lieu : on regarde le lot le PLUS ANCIEN,
   puisque c'est lui qui périra d'abord (et que les retraits sont FIFO). */
function lotsDe(id, lieu){
  return (etat.lots||[]).filter(l => l.item===id && l.lieu===(lieu||"sac"));
}
function joursRestantsLot(id, lieu){
  const l = lotsDe(id, lieu).sort((a,b)=>a.acquis-b.acquis)[0];
  if(!l || typeof dureeVie!=="function") return null;
  const reste = (l.acquis + dureeVie(id)*JOUR_MS - Date.now()) / JOUR_MS;
  return Math.max(0, reste);
}


/* Liste des lots d'un lieu, du plus ancien au plus récent, pour l'affichage.
   Repli sur les totaux tant que la synchro serveur n'a pas eu lieu. */
function lotsAffichage(lieu){
  const l = (etat.lots||[]).filter(x => x && x.lieu===lieu && x.qte>0);
  if(l.length) return l.slice().sort((a,b)=>a.acquis-b.acquis);
  const tot = (lieu==="coffre" ? etat.coffre : lieu==="soute" ? etat.soute : etat.sac) || {};
  return Object.keys(tot).filter(id=>tot[id]>0).map(id=>({ item:id, lieu, qte:tot[id], acquis:null }));
}
/* Badge « Xj » d'un lot précis (et non du plus ancien de l'objet). */
function badgeLot(lot){
  if(!lot || lot.acquis==null || typeof dureeVie!=="function") return "";
  const jr = Math.max(0, dureeVie(lot.item) - (Date.now()-lot.acquis)/JOUR_MS);
  const cls = jr<1 ? "critique" : (jr < dureeVie(lot.item)/2 ? "faible" : "");
  return `<span class="usure ${cls}">${Math.ceil(jr)}j</span>`;
}


/* Jauges : lecture serveur (à la connexion et après une action hors agir()). */
async function chargerJaugesServeur(){
  if(typeof sb === "undefined") return null;
  try{
    const { data } = await sb.rpc("jauges_lire");
    if(data && data.ok){
      etat.jauges = etat.jauges || {};
      etat.jauges.o2 = data.o2; etat.jauges.sante = data.sante; etat.jauges.moral = data.moral;
    }
    return data;
  }catch(e){ return null; }
}
