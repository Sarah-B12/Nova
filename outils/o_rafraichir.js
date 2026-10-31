// v2.12 — L'onglet Quêtes n'est plus redessiné en pleine partie (node outils/o_banc.js .. rafraichir).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  const hub = document.querySelector("#hub-quete");
  let dessins = 0; const vraiClear = _clearQ; _clearQ = (...a) => { dessins++; return vraiClear(...a); };   // un vrai redessin passe par _clearQ
  majQueteHub(); await att(20);
  const n0 = dessins;
  // 1. Rafraîchissement sans changement : rien
  _queteTouche = 0; majQueteHub(true); r.rienChange = dessins === n0;
  // 2. Le joueur vient de toucher l'onglet, et quelque chose a changé ailleurs : on attend
  const corps = hub.querySelector("#hub-quete-corps") || hub;
  corps.dispatchEvent(new Event("pointerdown", { bubbles:true }));
  r.toucheEnregistre = Date.now() - _queteTouche < 1000;
  const sect = etat.secteur; etat.secteur = sect === "ecart" ? "silene" : "ecart";
  majQueteHub(true); r.enPleinePartie = dessins === n0;
  // 3. Plus de 90 s sans toucher, et quelque chose a changé : on redessine
  _queteTouche = Date.now() - 91000; majQueteHub(true); r.apres90sChange = dessins === n0 + 1;
  etat.secteur = sect; majQueteHub(); const n1 = dessins;
  // 4. Une demande explicite (après une action de quête) : toujours
  _queteTouche = Date.now(); majQueteHub(); r.demandeToujours = dessins === n1 + 1;
  // 5. Le redessin général (afficher → majHub → changerHub(…, true)) passe par le rafraîchissement
  document.querySelectorAll(".hub-lien").forEach(b => b.classList.toggle("actif", b.dataset.hub === "quete"));
  const n2 = dessins; _queteTouche = Date.now();
  if(typeof majHub === "function") majHub();
  r.majHubEnPartie = dessins === n2;
  // 6. La relecture des missions (2 min) : rafraîchissement aussi
  r.missionsRelecture = /majQueteHub\(true\)/.test(missionsRedessiner.toString());
  // 7. La veille : pas de redessin général si le sac n'a pas changé ; un si le sac a changé
  let aff = 0; const vraiAff = afficher; afficher = () => { aff++; };
  const rpc0 = sb.rpc.bind(sb); let sacRep = null;
  sb.rpc = (n, a) => n === "veille" ? Promise.resolve({ data:{ ok:true, prison:{ en_prison:false }, effets:{ xp:0 }, evenements:[], sac:sacRep, empreinte:"e", notifs:{}, poste:0, annonce:null }, error:null }) : rpc0(n, a);
  await veilleMinute(); r.veilleSansSac = aff;
  sacRep = { sac:{ cendrite:1 }, coffre:{}, soute:{}, equipe:{}, lots:[] }; await veilleMinute(); r.veilleAvecSac = aff;
  sb.rpc = rpc0; afficher = vraiAff; _clearQ = vraiClear;
  // 8. Les boutons de carte : la règle d'empilement existe
  const regle = [...document.styleSheets].flatMap(s => { try{ return [...s.cssRules]; }catch(e){ return []; } })
    .find(x => x.selectorText === ".cartes-paire .action" && /flex-direction:\s*column/.test(x.cssText || ""));
  r.boutonsEmpiles = !!regle;
  return r;
})();
