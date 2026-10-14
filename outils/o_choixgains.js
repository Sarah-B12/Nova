// v1.79 — Gains des choix de quête (node outils/o_banc.js . choixgains)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  sauverMaintenant = async () => {};
  let REP; const appels = [];
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push(n + " " + JSON.stringify(a)); return n === "quete_choix_gain" ? Promise.resolve({ data:REP, error:null }) : orig(n, a); };
  const j0 = (etat.journal || []).length;
  etat.competences.force = 10;
  REP = { ok:true, gains:{ comp:"force" }, credits:etat.credits, xp:etat.xpTotal || 0 };
  await _gainChoixQ("q5", 1);
  r.comp = etat.competences.force === 11;
  REP = { ok:true, gains:{ credits:120 }, credits:5120, xp:etat.xpTotal || 0 };
  await _gainChoixQ("q3", 2);
  r.credits = etat.credits === 5120;
  r.texte = _texteGainChoix({ items:{ fab_composant_simple:2 }, xp:40 });
  REP = { ok:false, err:"sac_plein" };
  await _gainChoixQ("q8", 1);
  r.attente = etat.choixAttente && etat.choixAttente.q8 === 1;
  REP = { ok:true, gains:{ items:{ fab_composant_simple:3 } }, credits:5120, xp:etat.xpTotal || 0 };
  await choixRejouer();
  r.rejoue = !etat.choixAttente.q8 && appels.filter(a => a.includes('"q8"')).length === 2;
  REP = { ok:true, deja:true }; const f = etat.competences.force;
  await _gainChoixQ("q5", 0); r.dejaMuet = etat.competences.force === f;
  // v1.79b : les choix déjà faits.
  const agi = etat.competences.agilite;
  sb.rpc = (n, a) => n === "quete_choix_retro" ? Promise.resolve({ data:{ ok:true, payes:[ { quete:"q3", gains:{ credits:120 } }, { quete:"q5", gains:{ comp:"agilite" } } ], attente:false, credits:6000, xp:etat.xpTotal || 0 }, error:null }) : orig(n, a);
  await choixRetro();
  r.retro = { agilite: etat.competences.agilite === agi + 1, credits: etat.credits === 6000,
              journal: (etat.journal || []).some(e => String(e.texte || e.t || e).includes("Tes choix passés te rapportent : +120 ₡ ; +1 Agilité")) };
  return r;
})();
