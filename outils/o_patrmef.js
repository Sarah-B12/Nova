// v1.83 — Les patrouilles se méfient (node outils/o_banc.js . patrmef)
// v2.89 (v291, K262) — le compteur du jour est tenu par le SERVEUR (patrouille_neutralisee) : le jeu en garde le
// reflet (etat.patrJour) pour la méfiance. Doublure du serveur : n monte à chaque appel, butin si n ≤ 5 au combat.
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  let n = 0; const journ = []; const j0 = journal; journal = (t) => journ.push(t);
  const rpc0 = sb.rpc.bind(sb);
  sb.rpc = (nom, args) => nom === "patrouille_neutralisee"
    ? Promise.resolve({ data: { ok:true, n: ++n, butin: args.p_mode === "combat" && n <= 5, credits: 80, solde: 5000, objets: {} }, error: null })
    : rpc0(nom, args);
  etat.patrJour = null;
  r.debut = { durete: patrouilleMefianceDurete(), hack: patrouilleMefianceHack() };
  const butins = [];
  for(let k = 0; k < 5; k++) butins.push((await patrouilleNeutraliseeServeur("combat")).butin);
  r.apres5 = { butins, durete: patrouilleMefianceDurete(), hack: patrouilleMefianceHack(), message: journ.filter(t => /se méfier/.test(t)).length };
  r.sixieme = (await patrouilleNeutraliseeServeur("combat")).butin;
  for(let k = 0; k < 3; k++) await patrouilleNeutraliseeServeur("piratage");
  r.apres9 = { durete: patrouilleMefianceDurete(), hack: +patrouilleMefianceHack().toFixed(2) };
  for(let k = 0; k < 20; k++) await patrouilleNeutraliseeServeur("combat");
  r.plafond = { durete: patrouilleMefianceDurete(), hack: +patrouilleMefianceHack().toFixed(2), messages: journ.filter(t => /se méfier/.test(t)).length };
  etat.patrJour.jour = "2000-01-01";
  r.lendemain = { n: _patrJour().n, durete: patrouilleMefianceDurete() };
  sb.rpc = rpc0; journal = j0;
  return r;
})();
