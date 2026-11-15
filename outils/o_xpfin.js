// v2.93 (v295, K267) — l'XP par le serveur. Vérifie : la mine adopte le total renvoyé par terrain_miner (aucun
// xp_gagner) ; la sonde adopte celui de sonde_victoire et ne donne rien si le duel n'est pas enregistré ; gagnerXp
// (patrouilles, combats de quête, vol…) n'ajoute plus rien d'avance, appelle xp_gagner puis adopte son total, et la
// montée de niveau part APRÈS ; le plafond du jour est dit une seule fois.
//   node outils/o_banc.js . xpfin
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const att = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; const rpc0 = sb.rpc.bind(sb); const rep = {};
  sb.rpc = (n, a) => { appels.push(n);
    if(n in rep) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    return rpc0(n, a); };
  r.serveurDispo = (typeof SERVEUR_DISPO !== "undefined") && SERVEUR_DISPO;
  // 1. La mine
  etat.xpTotal = 100; majNiveauDepuisXp();
  surMonTerrain = () => true;
  etat.terrain = etat.terrain || {}; etat.terrain.parcelles = etat.terrain.parcelles || [];
  etat.terrain.parcelles[0] = { type:"mine", stock:100, max:500 };
  rep.terrain_miner = () => ({ ok:true, ajoutes:{ cendrite:3 }, stock:97, max:500, xp_gain:3, xp_total:103,
                               etat:{ sac:{ cendrite:3 }, coffre:{}, soute:{}, equipe:{}, lots:[] }, terrain:null });
  appels.length = 0; await recolterMine(0); await att(30);
  r.mine = { appels: appels.filter(x => /terrain_miner|xp_gagner/.test(x)), xpTotal: etat.xpTotal };
  // 2. La sonde
  rep.sonde_victoire = { ok:true, gain:150, rang:1, solde:etat.credits + 150, xp_gain:10, xp_total:113 };
  appels.length = 0; await _sondeGagne(); await att(30);
  r.sonde = { appels: appels.filter(x => /sonde_victoire|xp_gagner/.test(x)), xpTotal: etat.xpTotal, journal: (etat.journal.find(e => /sonde se disloque/.test(e.t)) || {}).t };
  rep.sonde_victoire = { ok:false, err:"pas_de_duel" };
  appels.length = 0; await _sondeGagne(); await att(30);
  r.sondeRefus = { appels: appels.filter(x => /xp_gagner/.test(x)).length, xpTotal: etat.xpTotal, journal: (etat.journal.find(e => /sonde se disloque/.test(e.t)) || {}).t };
  // 3. gagnerXp : rien d'avance, xp_gagner puis la montée de niveau
  etat.xpTotal = 115; majNiveauDepuisXp(); const n0 = etat.niveau; etat.niveauCredite = n0;
  let libere; const attente = new Promise(x => libere = x);
  rep.xp_gagner = () => ({ ok:true, xp:125 });
  sb.rpc = (n, a) => { appels.push(n);
    if(n === "xp_gagner") return attente.then(() => ({ data:{ ok:true, xp: 115 + a.p_n }, error:null }));
    if(n === "niveau_monter") return Promise.resolve({ data:{ ok:true, niveau:6, energie:100 }, error:null });
    return rpc0(n, a); };
  appels.length = 0; gagnerXp(10);
  r.avantReponse = { xpTotal: etat.xpTotal, appels: appels.slice() };
  libere(); await att(30);
  r.apresReponse = { xpTotal: etat.xpTotal, niveauAvant: n0, niveau: etat.niveau, appels: appels.filter(x => /xp_gagner|niveau_monter/.test(x)) };
  // 4. Le plafond du jour, dit une fois
  sb.rpc = (n, a) => { appels.push(n); if(n === "xp_gagner") return Promise.resolve({ data:{ ok:true, xp: etat.xpTotal, accorde:0 }, error:null }); return rpc0(n, a); };
  etat.xpPlafondDit = null; gagnerXp(8); await att(20); gagnerXp(8); await att(20);
  r.plafond = etat.journal.filter(e => /plafond d'expérience/.test(e.t)).length;
  sb.rpc = rpc0;
  return r;
})()
