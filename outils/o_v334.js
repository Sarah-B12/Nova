// v3.34 — le journal des combats (node outils/o_banc.js . v334) : plus de ligne « Expérience de campagne » (K329 : chaque
// compte rendu du serveur dit son XP) ; la rubrique « Dernières batailles » de l'onglet Gouvernement (K330).
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const journ = []; journal = t => journ.push(String(t));
  sauverMaintenant = async () => {}; sauvegarder = () => {}; afficher = () => {};
  // 1. L'XP versée (46 : trois duels) n'écrit plus de ligne à part ; le total est adopté.
  let total = null; adopterXpTotal = t => { total = t; };
  await _effetsAppliquer({ xp:46, xp_total:1046, energie:0, sante:0, moral:0 });
  r.plusDeCampagne = !journ.some(t => /campagne/i.test(t)) && total === 1046;
  // 2. La rubrique : les trois sortes de bataille, vues de sa faction.
  const data = { ok:true, faction:"nomades", batailles:[
    { type:"menee", quand:"2026-11-25T21:04:46Z", adversaire:"rouage", objectif:"pillage", annulee:false, gagne:true,
      p_att:61, p_def:26, nb_att:1, butin:2402, part_coffre:480, objets_touches:0, objets_detruits:0, absents_touches:0 },
    { type:"subie", quand:"2026-11-27T01:06:20Z", adversaire:"cultivateurs", objectif:"assaut", annulee:false, gagne:true,
      nb_def:2, caisse_pillee:0, objets_touches:0, objets_detruits:0, absents_touches:0, pieces:0 },
    { type:"protocole", quand:"2026-11-24T00:06:00Z", adversaire:"protocole", puissance:"très forte", gagne:true, nb_def:2,
      fragment_perdu:null, objets_touches:0, objets_detruits:0, absents_touches:0, pieces:0 },
    { type:"menee", quand:"2026-11-20T10:00:00Z", adversaire:"protocole", objectif:"assaut", annulee:true, gagne:false } ] };
  const h = _bataillesHtml(data);
  const div = document.createElement("div"); div.innerHTML = h; const txt = div.textContent;
  r.titre = txt.includes("Dernières batailles");
  r.menee = /Notre pillage contre .+ : succès \(61 contre 26, 1 participant\(s\) · butin 2\s?402 ₡ \(dont 480 ₡ pour la caisse\)\)/.test(txt);
  r.subie = /a mené un assaut contre nous : défense tenue \(2 défenseur\(s\) présent\(s\)\)/.test(txt);
  r.subieSansForce = !/contre 2[0-9]\b/.test(txt.split("a mené un assaut")[1].split("·")[0]);
  r.protocole = txt.includes("Attaque du Protocole (très forte) : repoussée");
  r.annulee = txt.includes("Notre assaut contre le Protocole : annulée, aucun participant.");
  r.vide = /Aucune bataille terminée/.test(_bataillesHtml({ ok:true, batailles:[] }));
  r.indispo = /Indisponible/.test(_bataillesHtml(null));
  r.pasDEmoji = !/[\u{1F300}-\u{1FAFF}]/u.test(h);
  r.version = document.querySelector('link[href*="base.css"]').getAttribute("href");
  return r;
})()
