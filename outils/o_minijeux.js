// v2.96 (v298, K270) — les mini-jeux de l'Ombre encadrés par le serveur. Vérifie : le piratage du Protocole ouvre la
// partie (jeu_engager) AVANT le mini-jeu, puis appelle hacker_protocole ; une partie refusée ne lance pas le mini-jeu ;
// l'espion raté n'est emprisonné que si le serveur le dit (`prison`), et le jeu n'appelle plus `emprisonner`.
//   node outils/o_banc.js . minijeux
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const att = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; const rpc0 = sb.rpc.bind(sb); const rep = {};
  sb.rpc = (n, a) => { appels.push(n);
    if(n in rep) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    return rpc0(n, a); };
  // 1. Piratage du Protocole : la partie s'ouvre d'abord
  surAnneauProtocole = () => true; let joue = 0;
  _lancerHackProto = async () => { joue++; appels.push("(mini-jeu)"); return true; };
  rep.hack_protocole_dispo = { ombre:true, restant:1, limite:1 };
  rep.jeu_engager = { ok:true };
  rep.hacker_protocole = { ok:true, reussi:true, info:"menace", valeur:"Aucune offensive détectée aujourd'hui", restant:0 };
  appels.length = 0; await hackerProtocoleDepuisCarte(); await att(30);
  r.hack = { ordre: appels.filter(x => /jeu_engager|mini-jeu|hacker_protocole/.test(x)), joue };
  rep.jeu_engager = { ok:false, err:"pas_ombre" }; joue = 0;
  appels.length = 0; await hackerProtocoleDepuisCarte(); await att(30);
  r.hackRefuse = { joue, appels: appels.filter(x => /hacker_protocole/.test(x)).length, journal: (etat.journal[0] || {}).t };
  // 2. Espion raté : la prison vient du serveur
  etat.prisonJusqua = 0; appels.length = 0;
  _prisonEspion("ignis", { faction:"ignis", secondes:3600 });
  r.prisonServeur = { enPrison: etat.prisonJusqua > Date.now() + 3500e3, faction: etat.prisonFaction, journal: (etat.journal[0] || {}).t,
                      emprisonner: appels.filter(x => x === "emprisonner").length };
  etat.prisonJusqua = 0;
  _prisonEspion("ignis", null);
  r.pasDePrison = { enPrison: etat.prisonJusqua > Date.now(), journal: (etat.journal[0] || {}).t };
  sb.rpc = rpc0; etat.prisonJusqua = 0;
  return r;
})()
