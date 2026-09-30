// v1.36f — prisonnier conduit dans la cité de sa prison ; message de capture rangé dans Vols/hacks
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const r = {};
  etat.secteur = "silene"; etat.pos = { x: 200, y: 400 };            // pleine nature
  sb.rpc = (n) => Promise.resolve(n === "mon_etat_prison"
    ? { data:{ en_prison:true, jusqua:new Date(Date.now()+86400000).toISOString(), faction:"toundra" }, error:null }
    : { data:null, error:null });
  const journ = []; const jOrig = journal; journal = (t, ty, c) => { journ.push([t, c]); };
  await syncPrison();
  r.apres = { secteur: etat.secteur, pos: etat.pos, ville: villeActuelle(), msg: journ[0] };
  journ.length = 0; await syncPrison();
  r.deuxieme = journ.length;                                        // déjà dans la bonne cité : rien
  journal = jOrig;
  r.categorie = _categoriser("Un chasseur de primes t'a retrouvé. Tu étais recherché pour vol — plainte du 29/09, prime de 800 ₡ (La Toundra). −5 réputation de faction.");
  return r;
})();
