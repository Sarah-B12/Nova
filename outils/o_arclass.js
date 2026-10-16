// v1.84 — Classements de l'Arène (node outils/o_banc.js . arclass)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => n === "arene_classements" ? Promise.resolve({ data:{ ok:true, mois:"2026-11-01", classements:{
    victoires:{ top:[{ rang:1, nom:"Fox", n:12, moi:false }, { rang:2, nom:"Testeuse", n:9, moi:true }], moi:{ rang:2, n:9 }, precedent:[{ rang:1, nom:"Eve", n:20 }] },
    combats:{ top:[{ rang:1, nom:"Bob", n:30, moi:false }], moi:{ rang:14, n:3 }, precedent:[] },
    plus_fort:{ top:[], moi:null, precedent:[] } } }, error:null }) : orig(n, a);
  const hub = document.querySelector("#hub-arene"); if(hub) hub.hidden = false;
  _areneSous = "combats"; _areneBrancherSous();
  document.querySelector('[data-asous="classements"]').click();
  await new Promise(x => setTimeout(x, 80));
  const z = document.querySelector("#arene-class"), t = z.textContent.replace(/\s+/g, " ");
  r.vues = { combatsCache: document.querySelector("#arene-vue").hidden, classVisible: !z.hidden };
  r.mois = t.includes("novembre 2026");
  r.top = z.querySelectorAll(".ar-top li").length === 3 && !!z.querySelector(".ar-top li.moi");
  r.toi = t.includes("Toi : 14ᵉ, 3.");
  r.vide = t.includes("Personne encore ce mois-ci.");
  r.precedent = t.includes("Le mois dernier : 🥇 Eve (20)");
  document.querySelector('[data-asous="combats"]').click();
  r.retour = !document.querySelector("#arene-vue").hidden && document.querySelector("#arene-class").hidden;
  return r;
})();
