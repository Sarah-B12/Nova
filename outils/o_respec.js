// v2.95 (v297, K268) — la réattribution des aptitudes et l'étape payante des quêtes passent par le serveur. Vérifie :
// la réattribution appelle aptitudes_reattribution (aucun crediter), rend les PA, sauvegarde tout de suite ; un refus
// (crédits) ne touche à rien ; l'étape payante appelle quete_paiement avec la clé « quête:étape », prend le solde du
// serveur et passe l'étape ; un refus la laisse.
//   node outils/o_banc.js . respec
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const att = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; const rpc0 = sb.rpc.bind(sb); const rep = {};
  sb.rpc = (n, a) => { appels.push(n + (a && a.p_cle ? ":" + a.p_cle : ""));
    if(n in rep) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    return rpc0(n, a); };
  confirmerJoli = async () => true;
  // 1. Réattribution offerte
  etat.aptitudes = { pa:0, pris:["sv1","sv3"], v:254 }; etat.respecOffert = false; appliquerSoldeServeur(500);
  rep.aptitudes_reattribution = { ok:true, cout:0, offerte:true, solde:500 };
  appels.length = 0; await respecApt(); await att(50);
  r.offerte = { appels: appels.filter(x => /reattribution|crediter|sauver_profil/.test(x)), aptitudes: JSON.stringify(etat.aptitudes),
                credits: etat.credits, offertePrise: !!etat.respecOffert, journal: (etat.journal.find(e => /réattribuées/.test(e.t)) || {}).t };
  // 2. Refus (crédits)
  etat.aptitudes = { pa:0, pris:["pr1"], v:254 }; appliquerSoldeServeur(60000);
  rep.aptitudes_reattribution = { ok:false, err:"credits", cout:50000, solde:100 };
  appels.length = 0; await respecApt(); await att(30);
  r.refus = { aptitudes: JSON.stringify(etat.aptitudes), journal: (etat.journal[0] || {}).t };
  // 3. Étape payante (Q2, étape 3)
  etat.quetes = etat.quetes || {}; queteEtat().active = { id:"q2", etape:2 }; appliquerSoldeServeur(100);
  const z = document.createElement("div"); z.innerHTML = '<button id="q-pay-btn">Payer</button>'; document.body.appendChild(z);
  rep.quete_paiement = { ok:true, cout:80, solde:20 };
  appels.length = 0; _wirePaiement(z, { cout:80 }); z.querySelector("#q-pay-btn").click(); await att(50);
  r.paiement = { appels: appels.filter(x => /quete_paiement|crediter/.test(x)), credits: etat.credits,
                 passee: !!(queteActive() || {})._resolu || (queteActive() || {}).etape !== 2, journal: (etat.journal.find(e => /Payé/.test(e.t)) || {}).t };
  queteEtat().active = { id:"q2", etape:2 }; appliquerSoldeServeur(100);
  const z2 = document.createElement("div"); z2.innerHTML = '<button id="q-pay-btn">Payer</button>'; document.body.appendChild(z2);
  rep.quete_paiement = { ok:false, err:"credits", cout:80, solde:50 };
  _wirePaiement(z2, { cout:80 }); z2.querySelector("#q-pay-btn").click(); await att(50);
  r.paiementRefuse = { passee: !!(queteActive() || {})._resolu, journal: (etat.journal[0] || {}).t, bouton: z2.querySelector("#q-pay-btn").disabled };
  sb.rpc = rpc0;
  return r;
})()
