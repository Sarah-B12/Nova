// v1.93z (K74, SQL v220) — Classements des tables de jeu (node outils/o_banc.js . barclass)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const orig = sb.rpc.bind(sb);
  let rep = { ok:true, mois:"2026-11-01", total:-600, classements:{
    gains:{ top:[{ rang:1, nom:"Galm", n:1500, moi:false }, { rang:2, nom:"Testeuse", n:300, moi:true }], moi:{ rang:2, n:300 }, precedent:[{ rang:1, nom:"Adaya", n:2400 }] },
    gagnees:{ top:[], moi:null, precedent:[] } } };
  sb.rpc = (n, a) => n === "bar_classements" ? Promise.resolve({ data:rep, error:null }) : orig(n, a);
  const el = document.createElement("div"); document.body.appendChild(el);
  _barVue = "classements";
  await majBarClassements(el, "ignis");
  const t = () => el.textContent.replace(/\s+/g, " ");
  r.onglet = !!el.querySelector('[data-barvue="classements"].actif') && !!el.querySelector('[data-barvue="jeux"]');
  r.mois = t().includes("novembre 2026");
  r.top = el.querySelectorAll(".ar-top li").length === 2 && !!el.querySelector(".ar-top li.moi");
  r.unite = t().includes("1 500 ₡") || t().includes("1 500 ₡");
  r.bilanNegatif = /bilan aux tables ce mois-ci : −600/.test(t());
  r.vide = t().includes("Personne encore ce mois-ci.");
  r.precedent = /Le mois dernier : 🥇 Adaya \(2.400 ₡\)/.test(t());
  r.deuxClassements = el.querySelectorAll(".ar-class").length === 2 && !/beau coup/i.test(t());
  // Toi au-delà du top 10
  rep.classements.gagnees = { top:[{ rang:1, nom:"Sorn", n:20, moi:false }], moi:{ rang:14, n:3 }, precedent:[] };
  await majBarClassements(el, "ignis");
  r.toi = t().includes("Toi : 14ᵉ, 3.");
  // Serveur muet
  rep = null;
  await majBarClassements(el, "ignis");
  r.panne = t().includes("Les classements ne répondent pas.") && !!el.querySelector('[data-barvue="jeux"]');
  r.attendu = Object.values(r).every(v => v === true);
  return r;
})();
