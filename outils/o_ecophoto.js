// v3.10 (v310, K281) — la photo de l'économie : le bouton de la console (lit l'état, puis l'inverse) et ses refus.
//   node outils/o_banc.js . ecophoto
(async function(){
  await new Promise(x => setTimeout(x, 400));
  const r = {}, rpc0 = sb.rpc.bind(sb), appels = []; let actif = true, refus = false;
  sb.rpc = (n, a) => {
    if(n !== "admin_eco_photo") return rpc0(n, a);
    appels.push(a && a.p_actif);
    if(refus) return Promise.resolve({ data: { ok:false, err:"non_autorise" }, error: null });
    if(a && a.p_actif != null) actif = a.p_actif;
    return Promise.resolve({ data: { ok:true, actif, jours: 12, depuis: "2026-11-15" }, error: null });
  };
  const al0 = window.alert; let alerte = null; window.alert = m => { alerte = m; };
  r.existe = typeof devEcoPhoto === "function";
  if(r.existe){
    await devEcoPhoto(); r.eteindre = { appels: appels.splice(0), journal: (etat.journal[0] || {}).t };
    await devEcoPhoto(); r.rallumer = { appels: appels.splice(0), journal: (etat.journal[0] || {}).t };
    refus = true; await devEcoPhoto(); r.refus = { appels: appels.splice(0), alerte };
  }
  // le bouton est rangé dans l'onglet Événements de la console
  etat.roleAdmin = "dev"; window._devRelireRole = async () => {};
  try{ await ouvrirDev(); }catch(e){ r.erreurConsole = String(e); }
  const b = document.querySelector("#dev-ecophoto");
  r.bouton = b ? b.textContent : null;
  { const ch = []; let e = b && b.parentElement; while(e && ch.length < 6){ ch.push((e.tagName||"") + (e.id ? "#" + e.id : "") + (e.dataset && e.dataset.onglet ? "[" + e.dataset.onglet + "]" : "")); e = e.parentElement; }
    r.parents = ch; const sec = b && b.closest("section"); r.titreSection = sec ? sec.textContent.slice(0, 60) : null; }
  window.alert = al0; sb.rpc = rpc0;
  return r;
})()
