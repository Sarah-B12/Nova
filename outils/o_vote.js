// v1.46b — vote : annulation dite, résultat en fenêtre (node o_banc.js .. vote)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1200));
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  const fen = []; const cOrig = confirmerJoli;
  let reponse = false;
  confirmerJoli = async (t, m, l, d, seul) => { fen.push({ t, m, seul:!!seul }); return seul ? true : reponse; };
  const rpcOrig = sb.rpc.bind(sb); let rep = null;
  sb.rpc = (nom, a) => nom === "voter" ? Promise.resolve(rep) : rpcOrig(nom, a);
  reponse = false; await _voter("x", "Vortex");
  r.annule = { journal: journ.slice(), fenetres: fen.length };
  reponse = true; journ.length = 0; fen.length = 0;
  rep = { data:{ ok:false, err:"hors_vote" }, error:null }; await _voter("x", "Vortex");
  r.refus = { journal: journ[0], fenetre: fen[1] };
  journ.length = 0; fen.length = 0;
  rep = { data:{ ok:true, rep:2 }, error:null }; await _voter("x", "Vortex");
  r.ok = { journal: journ[0], fenetre: fen[1] };
  journ.length = 0; fen.length = 0;
  rep = { data:null, error:{ message:"réseau" } }; await _voter("x", "Vortex");
  r.reseau = fen[1] && fen[1].m;
  journal = jOrig; confirmerJoli = cOrig;
  return r;
})();
