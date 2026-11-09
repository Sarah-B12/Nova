// v2.63 — l'état des quêtes survit-il au rechargement ? (finJour, gardiens)
// node o_banc.js .. quetesrecharge
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const auj = jourDeJeu();
  // 1. La quête suivante attend-elle le lendemain, APRÈS un rechargement ?
  let s = JSON.parse(JSON.stringify(etat));
  s.quetes = { done:["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q14","q15","q16","q17","q18","q19","q20"],
               active:null, verrous:{}, finJour:{ q20:auj }, gardiens:true };
  etat = hydraterEtat(s);
  r.lendemain = { finJourGarde: !!(etat.quetes.finJour && etat.quetes.finJour.q20), q21Attend: queteAttendLendemain(queteData("q21")) };
  // 2. Un joueur arrêté devant le gardien de Q16 (étape 2) : recharger le fait-il avancer ?
  s = JSON.parse(JSON.stringify(etat));
  s.quetes = { done:[], active:{ id:"q16", etape:2 }, verrous:{}, gardiens:true };
  etat = hydraterEtat(s); queteEtat();
  const apres1 = etat.quetes.active.etape;
  s = JSON.parse(JSON.stringify(etat)); etat = hydraterEtat(s); queteEtat();
  r.gardien = { etapeAvant: 2, apresUnRechargement: apres1, apresDeux: etat.quetes.active.etape };
  return r;
})();
