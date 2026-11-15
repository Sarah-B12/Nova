// v2.94 (v296, K269) — la fiche corrigée par le serveur. Vérifie : une sauvegarde dont la réponse porte `corrige`
// remet dans la page les compétences, les points à placer, les aptitudes et les drapeaux gardés par le serveur ; le
// journal le dit une seule fois ; une réponse sans `corrige` ne touche à rien.
//   node outils/o_banc.js . perso
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const rpc0 = sb.rpc.bind(sb); let rep = null; const envoye = [];
  sb.rpc = (n, a) => { if(n === "sauver_profil"){ envoye.push(a.p_maj.donnees); return Promise.resolve({ data: rep, error: null }); } return rpc0(n, a); };
  const dits = () => etat.journal.filter(e => /gardé ta fiche/.test(e.t)).length;
  // 1. Sans correction : rien ne bouge
  etat.competences = { force:12, agilite:11, intelligence:10 }; etat.pointsCompetence = 0;
  rep = { ok:true, rev:(typeof _rev !== "undefined" ? _rev : 0) + 1, maj: Date.now() };
  await sauverMaintenant(); await new Promise(x => setTimeout(x, 30));
  r.sansCorrection = { competences: { ...etat.competences }, journal: dits(), envoye: envoye.length > 0 && !!envoye[envoye.length - 1].competences };
  // 2. Le joueur s'est donné 50 en Force et un permis : le serveur garde l'ancien
  etat.competences = { force:50, agilite:11, intelligence:10 }; etat.permisVaisseau = true;
  etat.aptitudes = { pa:9, pris:["sv1"], v:254 };
  rep = { ok:true, rev:(typeof _rev !== "undefined" ? _rev : 0) + 1, maj: Date.now(),
          corrige:{ competences:{ force:12, agilite:11, intelligence:10 }, pointsCompetence:0, aptitudes:{ pa:0, pris:["sv1"], v:254 }, permisVaisseau:false } };
  await sauverMaintenant(); await new Promise(x => setTimeout(x, 30));
  r.corrigee = { competences: { ...etat.competences }, points: etat.pointsCompetence, aptitudes: JSON.stringify(etat.aptitudes),
                 permis: etat.permisVaisseau, journal: dits() };
  // 3. Une seconde correction : le journal ne se répète pas
  etat.competences = { force:60, agilite:11, intelligence:10 };
  await sauverMaintenant(); await new Promise(x => setTimeout(x, 30));
  r.secondeFois = { force: etat.competences.force, journal: dits() };
  sb.rpc = rpc0;
  return r;
})()
