// v3.32 — vérification « vol, hack et prison » (node outils/o_banc.js . v332) : le serveur refuse désormais le vol,
// le hack, la traque et l'évasion EN PAUSE (v328) ; le jeu doit le dire, sans rien dépenser ni lancer de mini-jeu.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const journ = []; journal = t => journ.push(String(t));
  const appels = []; let REP = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push({ nom, a });
    if(REP[nom]) return Promise.resolve({ data:REP[nom], error:null });
    return orig(nom, a); };
  sauverMaintenant = async () => {}; sauverSurServeur = () => {};
  let miniLance = false; lancerMiniVol = () => { miniLance = true; }; lancerMiniHack = () => { miniLance = true; };
  let traqueLancee = false; lancerMiniTraque = () => { traqueLancee = true; };

  // 1. Faire les poches en pause : le refus du serveur est dit, aucun mini-jeu.
  etat.prisonJusqua = 0;
  etat.aptitudes = etat.aptitudes || {}; etat.aptitudes.pris = ["om1"];
  _volIci = () => true;
  REP.vol_preparer = { ok:false, err:"pause", abandon:false };
  await tenterVoler();
  r.volPause = journ.includes("Tu es en pause : ni vol ni hack tant qu'elle dure.");
  r.volSansMiniJeu = !miniLance;

  // 2. Évasion en pause.
  etat.prisonJusqua = Date.now() + 3600e3; etat.energie = 80;
  REP.tenter_evasion = { ok:false, err:"pause" };
  await tenterEvasion();
  r.evasionPause = journ.includes("Tu es en pause : pas d'évasion tant qu'elle dure.");
  r.toujoursEnPrison = enPrison();
  etat.prisonJusqua = 0;

  // 3. Pister et traquer en pause.
  REP.traque_essai_debut = { ok:false, err:"pause" };
  REP.wanted_liste = { ok:true, chasseur:true, liste:[] };
  await _tqPister("x", "Kaël", null);
  r.pisterPause = journ.includes("Tu es en pause : pas de traque tant qu'elle dure.");
  r.pisterSansMiniJeu = !traqueLancee;
  REP.traquer = { ok:false, err:"pause" };
  await _tqTraquer("x", "Kaël");
  r.traquerPause = journ.filter(t => t === "Tu es en pause : pas de traque tant qu'elle dure.").length === 2;

  // 4. Version.
  r.version = (document.querySelector('link[href*="base.css"]') || {}).getAttribute
    ? document.querySelector('link[href*="base.css"]').getAttribute("href") : null;
  return r;
})()
