// v2.91 (v293, K264, K265) — terminer une quête passe par quete_terminer (le serveur paie objets, crédits, XP,
// une fois, dans l'ordre, au rythme du jeu). Vérifie : l'appel, aucun agir ni gagnerXp pour la récompense, le
// solde et l'XP pris dans la réponse, les PA et le drapeau donnés ici, « déjà touchée », un refus (sac plein,
// lendemain) qui laisse la quête en cours, la dispense d'un compte dev pour « Reviens demain », et la prime des
// Premiers pas versée par le serveur (premiers_pas_payer), et le bouton de la dispense dans la console (Mon perso).
//   node outils/o_banc.js . quetefin
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = null;
  sb.rpc = (n, a) => { appels.push(n + (n === "quete_terminer" ? ":" + a.p_quete : ""));
    if(n === "quete_terminer") return Promise.resolve({ data: rep, error: null });
    return rpc0(n, a); };
  const xp0 = gagnerXp; let xpLocal = 0; gagnerXp = (n) => { xpLocal += n; return xp0(n); };
  const prep = (id) => { etat.quetes = etat.quetes || {}; queteEtat().done = QUETES.slice(0, QUETES.findIndex(q => q.id === id)).map(q => q.id);
    queteEtat().active = { id, etape: (queteData(id).etapes || []).length - 1 }; };
  // 1. Q5 : navette, permis, PA
  prep("q5"); etat.permisVaisseau = false; const pa0 = aptEtat().pa; const paRecu = queteEtat().paRecu; queteEtat().paRecu = [];
  rep = { ok:true, quete:"q5", credits:800, xp:85, objets:{ navette_reserve:1 }, solde:9999, xp_total:5000,
          etat:{ sac:{ navette_reserve:1 }, coffre:{}, soute:{}, equipe:{}, lots:[] } };
  appels.length = 0; xpLocal = 0;
  const ok1 = await terminerQuete();
  r.q5 = { ok: ok1, appels: appels.filter(a => /quete_terminer|agir|xp_gagner/.test(a)), solde: etat.credits, xpTotal: etat.xpTotal,
           xpDonneIci: xpLocal, permis: etat.permisVaisseau, paPlus: aptEtat().pa - pa0, navetteAuSac: etat.sac.navette_reserve,
           finie: queteEtat().done.includes("q5"), journal: (etat.journal[0] || {}).t };
  // 2. Déjà touchée : la quête se termine, sans récompense annoncée
  prep("q6"); rep = { ok:true, deja:true };
  const c0 = etat.credits; await terminerQuete();
  r.deja = { finie: queteEtat().done.includes("q6"), creditsInchanges: etat.credits === c0, journal: (etat.journal[0] || {}).t };
  // 3. Refus : sac plein, puis lendemain → la quête reste en cours
  prep("q7"); rep = { ok:false, err:"sac_plein", requis:1, disponible:0 };
  const ok3 = await terminerQuete();
  r.sacPlein = { ok: ok3, enCours: (queteActive() || {}).id, journal: (etat.journal[0] || {}).t };
  rep = { ok:false, err:"lendemain", avant:"q6" };
  await terminerQuete();
  r.lendemain = { enCours: (queteActive() || {}).id, journal: (etat.journal[0] || {}).t };
  // 4. Dispense dev : « Reviens demain » ne bloque plus le compte dev
  queteEtat().finJour = { q7: jourDeJeu() }; const q8 = queteData("q8");
  const role = etat.roleAdmin; etat.queteDispense = false;
  etat.roleAdmin = "dev"; r.devSansDispense = queteAttendLendemain(q8);
  etat.queteDispense = true; r.devAvecDispense = queteAttendLendemain(q8);
  etat.roleAdmin = null; r.joueurAvecDrapeau = queteAttendLendemain(q8);   // le drapeau seul ne suffit pas
  etat.roleAdmin = role; etat.queteDispense = false; queteEtat().paRecu = paRecu;
  // 5. Premiers pas : la prime vient du serveur (premiers_pas_payer), pas de +300 ajoutés ici
  let repPP = { ok:false, err:"non_connecte" }; const ppAppels = [];
  const rpc1 = sb.rpc; sb.rpc = (n, a) => { if(n === "premiers_pas_payer"){ ppAppels.push(n); return Promise.resolve({ data: repPP, error: null }); } return rpc1(n, a); };
  const enc = document.querySelector("#pas-encart") || (() => { const d = document.createElement("div"); d.id = "pas-encart"; document.body.appendChild(d); return d; })();
  etat.pasFini = false; etat.pas = { formation:1, structure:1, recolte:1, vendu:1, fabrique:1, quete:1, deplace:1 };
  if(typeof _pasPaiement !== "undefined") _pasPaiement = 0;
  const cPP = etat.credits; majPas(); await new Promise(x => setTimeout(x, 50));
  r.ppEchec = { appels: ppAppels.length, pasFini: !!etat.pasFini, creditsInchanges: etat.credits === cPP };
  if(typeof _pasPaiement !== "undefined") _pasPaiement = 0;
  repPP = { ok:true, credits:300, solde: cPP + 300 }; majPas(); await new Promise(x => setTimeout(x, 50));
  r.ppOk = { appels: ppAppels.length, pasFini: !!etat.pasFini, credits: etat.credits - cPP, journal: (etat.journal[0] || {}).t };
  majPas(); r.ppPlusRien = ppAppels.length;   // déjà fini : aucun nouvel appel
  sb.rpc = rpc1;
  // 6. Console dev → Mon perso : le bouton de la dispense (K265)
  const att = ms => new Promise(x => setTimeout(x, ms)); let actif = false; const dApp = [];
  const rpc2 = sb.rpc; sb.rpc = async (n, a) => {
    if(n === "quetes_dispense_etat"){ dApp.push(n); return { data:{ ok:true, actif }, error:null }; }
    if(n === "admin_quetes_dispense"){ dApp.push(n + ":" + a.p_actif); actif = !!a.p_actif; return { data:{ ok:true, actif }, error:null }; }
    return rpc2(n, a); };
  const eA = estAdmin, eD = estDev; estAdmin = () => true; estDev = () => true;
  ouvrirDev(); await att(150);
  const m = document.querySelector("#dev-modale"); const bq = () => m.querySelector("#dev-qdisp");
  r.console = { dansMonPerso: !!m.querySelector("#dev-t-perso #dev-qdisp"), unSeul: document.querySelectorAll("#dev-qdisp").length };
  if(!bq()){ fermerDev(); estAdmin = eA; estDev = eD; sb.rpc = rpc2; return r; }   // version sans le bouton
  r.console.avant = bq().textContent;
  bq().click(); await att(150); r.console.apres = bq().textContent; r.console.drapeau = etat.queteDispense;
  bq().click(); await att(150); r.console.retour = bq().textContent; r.console.drapeauRetour = etat.queteDispense;
  fermerDev(); r.console.appels = dApp.join(",");
  estDev = () => false; ouvrirDev(); await att(150);
  // console d'un admin : l'onglet « Mon perso » (où est le bouton) n'est pas montré ; le serveur refuserait de toute façon.
  r.consoleAdmin = { ongletPersoCache: (() => { const o = m.querySelector('[data-dev="perso"]'); return !o || o.style.display === "none"; })() };
  fermerDev(); estAdmin = eA; estDev = eD; sb.rpc = rpc2;
  sb.rpc = rpc0; gagnerXp = xp0;
  return r;
})()
