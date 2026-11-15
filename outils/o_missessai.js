// v2.97 (v299, K270) — l'essai d'un jeu de poste de mission payé au serveur. Vérifie : _mEssaiPayer appelle
// mission_essai avec l'identifiant de la mission (aucun agir), applique l'énergie renvoyée ; un refus (énergie) rend
// faux et le dit ; le bouton « Tenter » porte l'identifiant de la mission ; le refus « pas_de_partie » a sa phrase.
//   node outils/o_banc.js . missessai
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = null;
  sb.rpc = (n, a) => { appels.push(n + (a && a.p_mission != null ? ":" + a.p_mission : "") + (n === "agir" ? ":" + a.p_motif : ""));
    if(n === "mission_essai") return Promise.resolve({ data: rep, error: null }); return rpc0(n, a); };
  rep = { ok:true, cout:9, energie:61 };
  appels.length = 0; const ok = await _mEssaiPayer(7);
  r.essai = { ok, appels: appels.filter(x => /mission_essai|agir/.test(x)), energie: etat.energie };
  rep = { ok:false, err:"energie", energie:3, requis:9 };
  const ko = await _mEssaiPayer(7);
  r.refus = { ok: ko, journal: (etat.journal[0] || {}).t };
  const html = _mEssaiPorte("noeud", 7, "");
  r.porte = /data-mi-mid="7"/.test(html);
  r.phrase = MISSION_ERREURS.pas_de_partie || null;
  sb.rpc = rpc0;
  return r;
})()
