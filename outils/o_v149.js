// v1.49 — Poste « En transit » et nouveaux arrivants du Régent (node o_banc.js .. v149)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  const moi = "m-1"; _posteMonId = moi;
  _chargerPoste = async () => [
    { id:1, statut:"attente", de_id:moi, a_id:"x", a_nom:"Lou", type:"objet", item_id:"fab_fil", qte:2, cree_le:new Date().toISOString() },
    { id:2, statut:"attente", de_id:"y", a_id:moi, de_nom:"Kim", type:"objet", item_id:"cuir", qte:1, cree_le:new Date().toISOString() } ];
  const z = document.querySelector("#poste-vue");
  posteVue = "boite"; await majPoste(); await new Promise(x => setTimeout(x, 50));
  r.onglets = [...z.querySelectorAll("[data-pv]")].map(b => b.textContent);
  r.boiteSansEnvoyes = !z.textContent.includes("Envoyés (en attente");
  posteVue = "transit"; await majPoste(); await new Promise(x => setTimeout(x, 50));
  r.transit = z.textContent.replace(/\s+/g, " ").slice(0, 200);
  const d = document.createElement("div"); document.body.appendChild(d);
  const rpcOrig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => n === "regent_nouveaux" ? Promise.resolve({ data:{ ok:true, liste:[{ nom:"Bela", niveau:2, arrive_le:new Date(Date.now()-86400000*1.2).toISOString() }] }, error:null }) : rpcOrig(n, a);
  await _rendreNouveaux(d);
  r.nouveaux = d.textContent.replace(/\s+/g, " ").trim();
  return r;
})();
