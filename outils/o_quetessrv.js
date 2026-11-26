// v2.91 (v293, K264, K265) — SOURCE des barèmes de quête du serveur (sql/v293_quetes.sql, BACKEND_PLAN §193) :
//  • `_quete_recompenses()` : par quête, dans l'ordre de QUETES — n (rang 1..45), c (crédits, avant Négociant),
//    x (XP), o (objets) ; l (1 si « Reviens demain » s'applique : _queteLendemain, la quête d'avant devant être
//    payée un jour de jeu PRÉCÉDENT). Les PA et les drapeaux restent au jeu jusqu'au morceau 8 (K261, K265).
//  • `_quete_cercles()` : par étape « q7:3 » (rang de l'étape à partir de 0, comme a.etape), les gains de Cercle
//    permis — chaque option d'un choix (ou d'une bête), ou, pour un combat, chacun des Cercles possibles × le gain.
//   node outils/o_banc.js . quetessrv
// ⚠ Changer une récompense, l'ordre des quêtes, la règle du lendemain ou un gain de Cercle dans js/quetes-data.js,
// c'est changer le serveur (barème dupliqué, §6) : relancer, comparer `recompenses` / `cercles` avec la base.
//  • `premiersPas` : la prime des Premiers pas (js/onboarding.js) = le montant écrit dans `premiers_pas_payer()`.
//  • v3.33 (v329, K328) — `epreuves` → `_quete_epreuves()` : les épreuves que le serveur juge lui-même avant de payer une
//    quête : `combats` (« q11:3 » → puissance : chaque étape de combat, gardiens compris), `affut` (quête → jours d'affût
//    demandés) et `bete` (les quêtes où l'on adopte la bête). Changer une puissance, un combat ou l'affût = changer le serveur.
(function(){
  const R = {}, C = {}; let nOpts = 0;
  const E = { combats: {}, affut: {}, bete: [] };   // v3.33 (K328)
  QUETES.forEach((q, i) => {
    const r = q.recompense || {}, o = { n: i + 1 };
    if(r.credits) o.c = r.credits;
    if(r.xp) o.x = r.xp;
    if(r.objets && Object.keys(r.objets).length) o.o = r.objets;
    if(_queteLendemain(q)) o.l = 1;
    R[q.id] = o;
    (q.etapes || []).forEach((e, k) => {
      const d = e && e.defi; if(!d) return;
      const cle = q.id + ":" + k, liste = [];
      for(const opt of (d.options || [])) if(opt && opt.cercles && Object.keys(opt.cercles).length){ liste.push(opt.cercles); nOpts++; }
      if(d.type === "combat"){
        const m = d.cercles || COMBAT_CERCLES, gain = d.gain || 2;
        for(const c of [...new Set(Object.values(m).filter(Boolean))]) liste.push({ [c]: gain });
      }
      if(liste.length) C[cle] = liste;
      if(d.type === "combat") E.combats[cle] = d.puissance || 30;          // même repli que _htmlCombat
      if(d.type === "affut") E.affut[q.id] = d.jours || 5;          // même repli que _htmlAffut
      if((d.options || []).some(o => o && o.bete) && !E.bete.includes(q.id)) E.bete.push(q.id);
    });
  });
  const ordre = QUETES.map(q => q.id);
  return { quetes: ordre.length, avecObjets: ordre.filter(id => R[id].o).length, lendemain: ordre.filter(id => R[id].l).length,
           etapesCercle: Object.keys(C).length, optionsCercle: nOpts,
           creditsTotal: ordre.reduce((s, id) => s + (R[id].c || 0), 0), xpTotal: ordre.reduce((s, id) => s + (R[id].x || 0), 0),
           premiersPas: (typeof PREMIERS_PAS_CREDITS === "number") ? PREMIERS_PAS_CREDITS : null,   // = le 300 de premiers_pas_payer
           recompenses: JSON.stringify(R), cercles: JSON.stringify(C), epreuves: JSON.stringify(E) };
})()
