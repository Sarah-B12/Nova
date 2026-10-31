/* ===========================================================
   v2.09 — LA VEILLE (serveur v233) : un seul appel par minute.
   Avant, chaque minute, une dizaine de requêtes : compterNotifs (4 comptages),
   compterPoste (purge + comptage), compterAnnonce, syncPrison, syncEffetsCombat
   (effets + journal serveur), chargerStocksServeur (le sac). La veille les fait
   toutes côté serveur, dans une transaction, le joueur verrouillé (journal et sac
   du même instant), et ne renvoie le sac que s'il a changé (empreinte).
   ⚠ RIEN N'EST PERDU EN CAS DE PANNE : si la veille échoue (réseau, serveur pas
     encore à jour), le serveur n'a rien consommé, et on refait la minute avec les
     appels d'avant (_veilleAncienne). Si la fonction n'existe pas (migration pas
     passée), on reste sur les appels d'avant pour toute la session.
   ⚠ Les relectures d'avant restent telles quelles pour tous leurs AUTRES usages
     (après une lecture de message, un duel, « Il te manque », la connexion…).
   ⚠ L'application suit l'ordre d'avant : prison, effets, journal, puis le sac.
   =========================================================== */
let _veilleHS = false;   // la fonction manque au serveur : appels d'avant pour la session
function _veilleManque(err){
  const t = String((err && (err.message || err.hint)) || "");
  return (err && err.code === "PGRST202") || /could not find the function|function .*veille.* does not exist/i.test(t);
}
async function veilleMinute(){
  if(!etat || !etat.inscrit || typeof sb === "undefined" || !sb) return;
  if(_veilleHS) return _veilleAncienne();
  const gen0 = (typeof _stocksGen === "number") ? _stocksGen : 0;
  let r = null;
  try{ r = await sb.rpc("veille", { p_faction: etat.faction || null, p_empreinte: _sacEmpreinte }); }
  catch(e){ r = { error:e }; }
  const d = r && r.data;
  if(!r || r.error || !d || !d.ok){
    if(r && r.error && _veilleManque(r.error)) _veilleHS = true;
    else if(typeof _catchLog === "function") _catchLog((r && r.error) || new Error("veille : réponse vide"), "veille.js");
    return _veilleAncienne();
  }
  if(typeof _prisonAppliquer === "function") _prisonAppliquer(d.prison);
  if(typeof _effetsAppliquer === "function") await _effetsAppliquer(d.effets);
  if(typeof _evenementsAppliquer === "function") await _evenementsAppliquer(d.evenements);
  if(d.sac){
    if(((typeof _stocksGen === "number") ? _stocksGen : 0) === gen0){
      _appliquerEtatStocks(d.sac, { lecture:true, veille:true });
      _sacEmpreinte = d.empreinte || null;
      etat._sacEchec = false;
    } else _sacEmpreinte = null;     // une action a changé le sac pendant l'appel : lecture périmée, on relira tout
  }
  if(typeof _notifsAppliquer === "function") _notifsAppliquer(d.notifs);
  if(typeof _posteAppliquer === "function") _posteAppliquer(d.poste);
  if(typeof _annonceAppliquer === "function") _annonceAppliquer(d.annonce);
  if(typeof afficher === "function") afficher();
}
/* La minute d'avant la v2.09, à l'identique (mêmes fonctions, mêmes conditions). */
async function _veilleAncienne(){
  const t = [];
  if(etat.inscrit && typeof compterNotifs === "function") t.push(compterNotifs());
  if(etat.inscrit && typeof compterPoste === "function")  t.push(compterPoste());
  if(etat.inscrit && typeof compterAnnonce === "function") t.push(compterAnnonce());
  if(_pretASynchro() && typeof syncPrison === "function") t.push(syncPrison());
  if(_pretASynchro() && typeof syncEffetsCombat === "function") t.push(syncEffetsCombat());
  if(_pretASynchro() && typeof chargerStocksServeur === "function") t.push(chargerStocksServeur());
  await Promise.all(t);
}
