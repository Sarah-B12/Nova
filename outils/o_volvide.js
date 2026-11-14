// v2.86 — un vol ou un hack RÉUSSI mais sans butin s'écrit en couleur normale, et dit « réussi » (testeuse Vortex, 11/11).
//   node outils/o_banc.js . volvide
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const orig = sb.rpc.bind(sb); let rep = {};
  sb.rpc = (n, a) => rep[n] ? Promise.resolve({ data: rep[n](a), error: null }) : orig(n, a);
  lancerMiniVol  = (win) => win(); lancerMiniHack = (win) => win();
  const journ = []; journal = (t, type, cat) => { journ.push({ t, type, cat }); };
  etat.aptitudes = { pa:0, pris:["om1","om2","om3","om4"], v:125 }; etat.prisonJusqua = 0; etat.energie = 80;
  _enVille = () => true; _ordiEquipe = () => true;
  const fin = { etat:{ sac:{}, coffre:{}, soute:{}, lots:[] }, energie:65, solde:1000 };
  rep.vol_preparer = () => ({ ok:true, id:7, cible:"Test2", energie:65 });
  for(const [cas, mode, extra] of [["vol_vide","vol",{}], ["vol_sac_plein","vol",{ sac_plein:true }], ["hack_vide","hack",{}]]){
    rep.vol_conclure = () => Object.assign({ ok:true, mode, reussi:true, vide:true, signe:false, cible:"Test2", butin:{}, gain:0, sac_plein:false }, fin, extra);
    journ.length = 0;
    if(mode === "vol") await tenterVoler(); else await tenterHacker();
    await dort(30);
    const l = journ.find(x => x.cat === "vol");
    r[cas] = l ? { texte:l.t, couleur:l.type || "normale" } : null;
  }
  return r;
})()
