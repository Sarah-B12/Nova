// v2.99 (v301, K271) — les pas au sol des surfaces par le serveur. Vérifie :
//   · voyagerBraise appelle `deplacer_sol` (aucun agir), prend la position, l'énergie et l'O₂ RENVOYÉS (on quitte le
//     bord), dit le prix renvoyé ; « station » : la phrase de l'abri d'Ancolie ;
//   · « non_retour » : on demande ; oui → second appel avec p_confirme ; non → rien ; « o2 » : la phrase d'avant ;
//   · la sauvegarde : une position au sol renvoyée (`pos.surface`) est adoptée — sauf si un pas l'a remplacée pendant
//     l'appel ; monter à bord passe toujours par la sauvegarde (puis agir « bord_braise »).
//   node outils/o_banc.js . deplsol
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {}, sauveRep = null;
  sb.rpc = (n, a) => {
    if(n === "deplacer_sol" || n === "agir" || n === "deplacer")
      appels.push(n + (n === "deplacer_sol" ? `:${Math.round(a.p_x)},${Math.round(a.p_y)},${a.p_confirme}` : "") + (n === "agir" ? ":" + a.p_motif : ""));
    if(n === "deplacer_sol"){ const v = typeof rep.sol === "function" ? rep.sol(a) : rep.sol; return Promise.resolve({ data: v, error: null }); }
    if(n === "agir") return Promise.resolve({ data: { ok: true, energie: 70, jauges: { o2: 100, sante: 90, moral: 80 } }, error: null });
    if(n === "sauver_profil" && sauveRep) return Promise.resolve({ data: sauveRep(a), error: null });
    return rpc0(n, a);
  };
  const dernier = () => (etat.journal[0] || {}).t || "";
  let confirmer = true, demandes = 0; const cj0 = confirmerJoli;
  confirmerJoli = async () => { demandes++; return confirmer; };
  tenterPatrouille = () => {};
  etat.enPause = false;

  // 1. un pas sur La Braise
  etat.secteur = "braise"; etat.surface = { x: 1656, y: 875, abord: true }; etat.energie = 80; etat.jauges.o2 = 100;
  rep.sol = { ok: true, x: 1901, y: 876, d: 244, cout_e: 4, cout_o: 6, station: false, energie: 76, jauges: { o2: 94, sante: 90, moral: 80 } };
  appels.length = 0; await voyagerBraise(1900, 875);
  r.pas = { appels: appels.slice(), surface: etat.surface, energie: etat.energie, o2: etat.jauges.o2, journal: (etat.journal.find(e => /Déplacement — La Braise/.test(e.t)) || {}).t };

  // 2. sous l'abri d'Ancolie
  etat.secteur = "ancolie"; etat.surface = { x: 1500, y: 880, abord: false };
  rep.sol = { ok: true, x: 1100, y: 880, d: 400, cout_e: 6, cout_o: 10, station: true, energie: 70, jauges: { o2: 100, sante: 90, moral: 80 } };
  appels.length = 0; await voyagerBraise(1100, 880);
  r.station = { appels: appels.slice(), o2: etat.jauges.o2, journal: etat.journal.slice(0, 3).map(e => e.t).filter(t => /auvent|Déplacement/.test(t)) };

  // 3. non-retour, O₂
  etat.secteur = "braise"; etat.surface = { x: 1900, y: 875, abord: false };
  rep.sol = a => a.p_confirme ? { ok: true, x: 2000, y: 875, d: 100, cout_e: 2, cout_o: 3, station: false, energie: 70, jauges: { o2: 9, sante: 90, moral: 80 } }
                              : { ok: false, err: "non_retour", reste: 9, retour: 9, abri: false, cout_e: 2, cout_o: 3 };
  confirmer = false; demandes = 0; appels.length = 0; await voyagerBraise(2000, 875);
  r.nonRetourNon = { demandes, appels: appels.slice(), surface: etat.surface, texte: null };
  confirmer = true; demandes = 0; appels.length = 0; await voyagerBraise(2000, 875);
  r.nonRetourOui = { demandes, appels: appels.slice(), surface: etat.surface };
  rep.sol = { ok: false, err: "o2", cout_o: 15, o2: 10 };
  await voyagerBraise(2300, 875);
  r.refusO2 = { journal: dernier(), o2: etat.jauges.o2, surface: etat.surface };

  // 4. sauvegarde
  etat.secteur = "braise"; etat.pos = { x: 1895, y: 1050 }; etat.surface = { x: 1656, y: 875, abord: true };
  sauveRep = a => ({ ok: true, rev: 199, maj: 9, pos: { x: 1895, y: 1050, secteur: "braise", surface: { x: 1900, y: 875, abord: false } } });
  await sauverMaintenant();
  r.sauveSol = etat.surface;
  sauveRep = a => { etat.surface = { x: 1700, y: 900, abord: false }; return { ok: true, rev: 200, maj: 10, pos: { x: 1895, y: 1050, secteur: "braise", surface: { x: 1900, y: 875, abord: false } } }; };
  await sauverMaintenant();
  r.sauvePendantPas = etat.surface;
  sauveRep = null;

  // 5. monter à bord : toujours par la sauvegarde, puis l'air
  etat.surface = { x: 1680, y: 880, abord: false }; appels.length = 0;
  await monterABord();
  r.bord = { surface: etat.surface, appels: appels.slice() };

  confirmerJoli = cj0; sb.rpc = rpc0;
  return r;
})()
