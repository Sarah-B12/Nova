// v3.11 (autrice, 15/11) — (1) les vols et hacks réussis sans butin s'écrivent en bleu (« gain ») comme les autres réussites ;
// (2) plus de chaînes en haut à droite du portrait en prison (les barreaux restent).
//   node outils/o_banc.js . v311
(async function(){
  await new Promise(x => setTimeout(x, 400));
  const r = {}, rpc0 = sb.rpc.bind(sb); let rep = null;
  sb.rpc = (n, a) => n === "vol_conclure" ? Promise.resolve({ data: rep, error: null }) : rpc0(n, a);
  const issue = async (mode, d) => { rep = Object.assign({ ok:true, cible:"Cible" }, d); etat.journal = [];
    try{ await _volConclure(mode, { id: 1, cible: "Cible" }, true); }catch(e){ return "erreur " + e; }
    const e = etat.journal.find(x => /réussi/.test(x.t || "")) || {}; return { couleur: e.type || "(gris)", onglet: e.cat, texte: (e.t || "").slice(0, 45) }; };
  r.volPochesVides = await issue("vol", { reussi:true, vide:true });
  r.volSacPlein    = await issue("vol", { reussi:true, vide:true, sac_plein:true });
  r.hackCompteVide = await issue("hack", { reussi:true, vide:true });
  r.volAvecButin   = await issue("vol", { reussi:true, butin:{ ration: 1 } });
  sb.rpc = rpc0;
  // le portrait en prison : barreaux (::after) oui, chaînes (::before) non — fiche et page de profil
  const st = document.createElement("style"); document.head.appendChild(st);
  const regles = [...document.styleSheets].flatMap(s => { try{ return [...s.cssRules]; }catch(e){ return []; } }).map(x => x.cssText || "");
  const pp = (document.querySelector("style#pp-style") || {}).textContent || "";
  const src = regles.join("\n") + "\n" + pp + "\n" + (typeof window.__ppCss === "string" ? window.__ppCss : "");
  r.portraitBarreaux = /\.portrait\.enprison::after/.test(src);
  r.portraitChaines  = /\.portrait\.enprison::before/.test(src);
  return r;
})()
