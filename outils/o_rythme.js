// v2.07 — Le rythme : rien quand l'onglet est caché (node outils/o_banc.js .. rythme).
// On compte les appels au serveur (rpc et from) lancés par l'horloge du rythme.
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  let cache = false;
  Object.defineProperty(document, "hidden", { configurable:true, get: () => cache });
  const appels = [];
  const rpc0 = sb.rpc.bind(sb), from0 = sb.from.bind(sb);
  sb.rpc = (n, a) => { appels.push("rpc:" + n); return rpc0(n, a); };
  sb.from = t => { appels.push("from:" + t); return from0(t); };
  const compter = () => { const c = {}; appels.forEach(a => c[a] = (c[a] || 0) + 1); return c; };
  r.relectures = _RYTHME.map(x => `${x.nom}:${x.periode / 1000}s${x.auRetour ? "+retour" : ""}`);
  // 1. Onglet caché, tout est en retard : rien ne part.
  _RYTHME.forEach(x => x.der = 0);
  cache = true; appels.length = 0; _rythmeTic(false); document.dispatchEvent(new Event("visibilitychange")); await att(300);
  r.cacheRien = appels.filter(a => a !== "rpc:sauver_profil");   // sauver_profil = la sauvegarde de sortie (voulue)
  r.sauvegardeDeSortie = appels.includes("rpc:sauver_profil");
  // 2. Retour au premier plan : tout ce qui est en retard part, une fois.
  cache = false; appels.length = 0; document.dispatchEvent(new Event("visibilitychange")); await att(400);
  r.retour = compter();
  r.sacUneFois = (r.retour["rpc:sac_lire"] || 0) === 1;
  // 3. Juste après : rien n'est dû.
  appels.length = 0; _rythmeTic(false); await att(200);
  r.ticSuivant = appels.length;
  // 4. Cacher puis revenir tout de suite : seulement ce qui se relit à chaque retour.
  cache = true; document.dispatchEvent(new Event("visibilitychange")); await att(50);
  cache = false; appels.length = 0; document.dispatchEvent(new Event("visibilitychange")); await att(300);
  r.retourRapide = Object.keys(compter()).sort();
  // 5. Une minute plus tard (visible) : les relectures d'une minute, pas celles de 2 ou 10 minutes.
  _RYTHME.forEach(x => x.der = Date.now() - 61000);
  appels.length = 0; _rythmeTic(false); await att(300);
  r.uneMinute = Object.keys(compter()).sort();
  // 6. Une erreur dans une relecture n'arrête pas les autres.
  const sauve = _RYTHME[0].fn; _RYTHME[0].fn = () => { throw new Error("banc"); };
  _RYTHME.forEach(x => x.der = 0); appels.length = 0; _rythmeTic(false); await att(300);
  r.erreurIsolee = appels.length > 0; _RYTHME[0].fn = sauve;
  // 7. v2.07 — « Il te manque » : le journal puis le sac sont relus aussitôt, une seule fois.
  const rpc1 = sb.rpc;
  sb.rpc = (n, a) => n === "agir" ? (appels.push("rpc:agir"), Promise.resolve({ data:{ ok:false, err:"manque", item:"cendrite", possede:0, requis:1 }, error:null })) : rpc1(n, a);
  appels.length = 0;
  await agirServeur({ retirer:{ cendrite:1 }, motif:"banc" }); await att(300);
  await agirServeur({ retirer:{ cendrite:1 }, motif:"banc" }); await att(300);
  const ordre = appels.filter(a => /consommer_evenements|sac_lire/.test(a));
  r.manque = { ordre, journalAvantSac: ordre[0] === "rpc:consommer_evenements", uneSeuleFois: ordre.filter(a => a === "rpc:sac_lire").length === 1 };
  // 8. v2.08 — la même chose quand le serveur annule l'action en cours (exception « manque », v232).
  const vrai = journal; const lus = []; journal = (t, ...a) => { lus.push(String(t)); return vrai(t, ...a); };
  sb.rpc = (n, a) => n === "agir" ? (appels.push("rpc:agir"), Promise.resolve({ data:null, error:{ message:"manque", details:"cendrite", code:"P0001" } })) : rpc1(n, a);
  _agirManqueDer = 0; appels.length = 0;
  const res = await agirServeur({ retirer:{ cendrite:1 }, motif:"banc" }); await att(300);
  journal = vrai;
  r.exception = { nul: res === null, texte: lus.some(t => /^Il te manque : /.test(t)), pasServeurMuet: !lus.some(t => /n'a pas répondu/.test(t)),
                  relu: appels.includes("rpc:sac_lire") && appels.includes("rpc:consommer_evenements") };
  sb.rpc = rpc0; sb.from = from0;
  return r;
})();
