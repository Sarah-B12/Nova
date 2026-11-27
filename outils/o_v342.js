// v3.42 — la patrouille piratée sans « rien à prendre » ; les forces (« 64 vs 136 ») ne s'affichent plus dans les rapports
// d'expédition (node outils/o_banc.js . v342).
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const lignes = []; journal = (t, type) => lignes.push(String(t));
  sauvegarder = () => {}; afficher = () => {}; apresAction = () => {};
  // 1. Patrouille piratée (réussite forcée)
  ordiHackEquipe = () => true; chanceHack = () => 1; patrouilleMefianceHack = () => 0;
  patrouilleNeutraliseeServeur = async () => {}; registreSignaler = () => {}; gagnerXp = () => {};
  const alea = Math.random; Math.random = () => 0;
  await patrouilleHacker(); Math.random = alea;
  r.piratage = lignes.find(t => /^Patrouille piratée/.test(t)) || null;
  r.sansRienAPrendre = !!r.piratage && !/rien à prendre/.test(r.piratage) && /Aucun dégât\. \+\d+ XP\.$/.test(r.piratage);
  // 2. Rapport d'expédition du bureau
  const rap = _expRapportHtml({ cible:"rouage", date_prevue:new Date().toISOString(),
    rapport:{ objectif:"pillage", succes:true, p_att:64, p_def:136, nb_att:3, butin:300, part_coffre:60, part_joueurs:240 } });
  r.rapportSansForces = !/64|136/.test(rap) && /3 participant\(s\)/.test(rap);
  const rapP = _expRapportHtml({ cible:"protocole", date_prevue:new Date().toISOString(),
    rapport:{ objectif:"protocole", succes:false, p_att:64, p_def:136, nb_att:2 } });
  r.rapportProtocoleSansForces = !/64|136/.test(rapP) && /2 participant\(s\)/.test(rapP);
  // 3. Dernières batailles
  const bat = _bataillesHtml({ ok:true, batailles:[ { type:"menee", adversaire:"rouage", objectif:"pillage", quand:new Date().toISOString(), gagne:true, p_att:64, p_def:136, nb_att:3, butin:300, part_coffre:60 },
                                                   { type:"menee", adversaire:"protocole", objectif:"protocole", quand:new Date().toISOString(), gagne:false, p_att:64, p_def:136, nb_att:2 } ] });
  r.bataillesSansForces = !/64|136/.test(bat) && /3 participant\(s\)/.test(bat) && /2 participant\(s\)/.test(bat);
  return r;
})()
