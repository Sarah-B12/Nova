// v2.01 — la prison comme un parloir (K114) : en prison, pas d'action de couple, pas de geste
// envers l'enfant, pas de colis ; le message dit ce qui reste ouvert. Le serveur refuse aussi (v227).
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, msgs = []; journal = (m) => msgs.push(String(m));
  r.message = /discussion/.test(PARLOIR_TXT) && /gestes/.test(PARLOIR_TXT);                        // vrai
  r.refusServeurGarde = typeof UNION_REFUS.prison === "string";                                     // vrai : « Impossible depuis la prison. »
  etat.prisonJusqua = Date.now() + 3600e3; let appel = false; const vr = sb.rpc; sb.rpc = (n, a) => { if(n === "poste_recuperer") appel = true; return vr.call(sb, n, a); };
  await posteRecuperer(1); r.colisRefuse = !appel; sb.rpc = vr; etat.prisonJusqua = 0;
  return r;
})();
