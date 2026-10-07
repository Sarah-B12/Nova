// v1.47 — console dev : monter un perso à un niveau (node o_banc.js .. niveau)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1200));
  const z = document.createElement("div"); z.id = "dev-res"; document.body.appendChild(z);
  const p = { id:"x-1", nom:"Xunbel", niveau:7, faction:"nomades", en_pause:false };
  _devAfficherFiche(p);
  r.bloc = !!z.querySelector("#f-niv"); r.defaut = z.querySelector("#f-niv").value;
  const appels = []; const rpcOrig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push({ nom, a }); if(nom === "admin_fixer_niveau") return Promise.resolve(a.p_niveau === 5
      ? { data:{ ok:false, err:"pas_plus_haut", nom:"Xunbel" }, error:null } : { data:{ ok:true, nom:"Xunbel", niveau:a.p_niveau, xp:3800 }, error:null });
    if(nom === "admin_fiche_joueur") return Promise.resolve({ data:{ ok:true, profils:[p] }, error:null }); return rpcOrig(nom, a); };
  window.confirm = () => true; const alertes = []; window.alert = (m) => alertes.push(m);
  const journ = []; const jOrig = journal; journal = (t) => journ.push(t);
  z.querySelector("#f-niv").value = "20"; z.querySelector("#f-niv-btn").click(); await new Promise(x => setTimeout(x, 80));
  r.ok = { appel:(appels.find(a => a.nom === "admin_fixer_niveau") || {}).a, journal: journ[0] };
  z.querySelector("#f-niv").value = "5"; z.querySelector("#f-niv-btn").click(); await new Promise(x => setTimeout(x, 80));
  r.refus = alertes[0];
  z.querySelector("#f-niv").value = "99"; z.querySelector("#f-niv-btn").click(); await new Promise(x => setTimeout(x, 20));
  r.borne = alertes[1];
  journal = jOrig;
  return r;
})();
