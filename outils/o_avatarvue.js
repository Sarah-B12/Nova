// v1.93l — la fenêtre d'avatar se cale sur la partie VISIBLE de l'écran (zoom).
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}; const ecoute = {};
  const vv = { offsetLeft:300, offsetTop:120, width:400, height:600,
               addEventListener:(t, f) => { ecoute[t] = f; }, removeEventListener:(t) => { delete ecoute[t]; } };
  Object.defineProperty(window, "visualViewport", { value:vv, configurable:true });
  sb.rpc = async (nom) => nom === "apparence_etat" ? { data:{ ok:true, gratuit:true, defini:false }, error:null } : { data:null, error:null };
  await ouvrirAvatar();
  const m = document.querySelector("#avatar-modale");
  r.ouverte = !m.hidden;
  r.calee = [m.style.left, m.style.top, m.style.width, m.style.height].join(" ");
  r.suit = !!ecoute.resize && !!ecoute.scroll;
  vv.offsetLeft = 50; ecoute.scroll(); r.apresDefilement = m.style.left;
  _fermerAvatar(); r.fermee = m.hidden; r.neSuitPlus = !ecoute.resize && !ecoute.scroll;
  return r;
})();
