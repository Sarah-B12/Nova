// v3.08 — les messages du duel contre une sonde (« Ouvrir le feu ») rangés dans « Combats » (retour de l'autrice, 15/11).
// Rejoue la victoire (avec et sans gain, refus), la défaite et le duel laissé en plan, et relève l'onglet de chaque message.
//   node outils/o_banc.js . sondecat
(async function(){
  await new Promise(x => setTimeout(x, 400));
  const r = {}; const rpc0 = sb.rpc.bind(sb); let rep = {};
  sb.rpc = (n, a) => rep[n] ? Promise.resolve({ data: rep[n], error: null }) : rpc0(n, a);
  const dernier = () => { const e = etat.journal[0] || {}; return { texte: (e.t || "").slice(0, 40), onglet: e.cat }; };
  rep.sonde_victoire = { ok: true, gain: 127, rang: 1, solde: 1127 }; await _sondeGagne(); r.victoire = dernier();
  rep.sonde_victoire = { ok: true, gain: 0, rang: 4, solde: 1127 }; await _sondeGagne(); r.victoireSansGain = dernier();
  rep.sonde_victoire = { ok: false, err: "pas_de_duel" }; await _sondeGagne(); r.victoireRefusee = dernier();
  rep.sonde_defaite = { ok: true, degats: 30, anticipe: false, vaisseau: etat.vaisseau || "fab_navette_legere", avant: 100, coque: 70, max: 120 };
  await _sondePerdu(); r.defaite = dernier();
  if(typeof sondeReprendre === "function"){
    rep.sonde_etat = { ok: true, attente: false, perdu: { degats: 30, anticipe: false } }; await sondeReprendre();
    r.dueLaisseEnPlan = etat.journal.slice(0, 8).map(e => ({ texte: (e.t || "").slice(0, 40), onglet: e.cat })).find(e => /inach/.test(e.texte)) || null;
  }
  sb.rpc = rpc0;
  return r;
})()
