// v2.98 (v300, K271) — les trajets sur Silène par le serveur. Vérifie :
//   · voyager appelle `deplacer` (aucun agir), prend la position, l'énergie et l'O₂ RENVOYÉS, et dit le prix renvoyé ;
//   · « non_retour » : on demande ; oui → second appel avec p_confirme ; non → rien ;
//   · « o2 » : la phrase d'avant, avec les chiffres du serveur, et l'appel de détresse s'ouvre ; « energie » : sa phrase ;
//   · secoursSol appelle `secours_sol` (aucun crédit débité par la page), prend la position et le solde renvoyés ;
//     un refus du serveur est dit ;
//   · la sauvegarde : une position renvoyée (`pos`) est adoptée — sauf si la page a bougé pendant l'appel ; un décollage
//     refusé (le serveur a gardé Silène) ramène sur Silène ; les colonnes pos_x / pos_y sont relues au chargement.
//   node outils/o_banc.js . deplacer
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {}, sauveRep = null;
  sb.rpc = (n, a) => {
    if(n === "deplacer" || n === "agir" || n === "secours_sol" || n === "crediter")
      appels.push(n + (n === "deplacer" ? `:${Math.round(a.p_x)},${Math.round(a.p_y)},${a.p_confirme}` : "") + (n === "agir" ? ":" + a.p_motif : "") + (n === "crediter" ? ":" + a.delta : ""));
    if(n === "deplacer"){ const v = typeof rep.deplacer === "function" ? rep.deplacer(a) : rep.deplacer; return Promise.resolve({ data: v, error: null }); }
    if(n === "secours_sol") return Promise.resolve({ data: rep.secours, error: null });
    if(n === "sauver_profil" && sauveRep) return Promise.resolve({ data: sauveRep(a), error: null });
    return rpc0(n, a);
  };
  const dernier = () => (etat.journal[0] || {}).t || "";
  let confirmer = true, demandes = 0; const cj0 = confirmerJoli;
  confirmerJoli = async () => { demandes++; return confirmer; };
  tenterPatrouille = () => {};   // pas de patrouille dans ce banc
  etat.secteur = "silene"; etat.enPause = false;

  // 1. un trajet : le serveur décide de la position et du prix
  etat.pos = { x: 1225, y: 325 }; etat.energie = 80; etat.jauges.o2 = 100;
  rep.deplacer = { ok: true, x: 1401, y: 326, d_ouverte: 75.4, cout_e: 2, cout_o: 3, energie: 77, jauges: { o2: 96, sante: 90, moral: 80 } };
  appels.length = 0; await voyager(1400, 325);
  r.trajet = { appels: appels.slice(), pos: etat.pos, energie: etat.energie, o2: etat.jauges.o2, journal: (etat.journal.find(e => /Déplacement/.test(e.t)) || {}).t };

  // 2. point de non-retour
  let n = 0;
  rep.deplacer = a => a.p_confirme ? { ok: true, x: 1600, y: 1000, d_ouverte: 400, cout_e: 6, cout_o: 5, energie: 70, jauges: { o2: 2, sante: 90, moral: 80 } }
                                   : { ok: false, err: "non_retour", reste: 2, retour: 2, cite: "rouage", cout_e: 6, cout_o: 5 };
  etat.pos = { x: 1600, y: 600 }; confirmer = false; demandes = 0; appels.length = 0;
  await voyager(1600, 1000);
  r.nonRetourNon = { demandes, appels: appels.slice(), pos: etat.pos };
  confirmer = true; demandes = 0; appels.length = 0;
  await voyager(1600, 1000);
  r.nonRetourOui = { demandes, appels: appels.slice(), pos: etat.pos, o2: etat.jauges.o2 };

  // 3. refus O₂, refus énergie
  _refusO2 = false; etat.pos = { x: 1600, y: 600 }; etat.jauges.o2 = 50; etat.sac = {};
  rep.deplacer = { ok: false, err: "o2", cout_o: 8, o2: 3 };
  await voyager(2000, 900);
  r.refusO2 = { journal: etat.journal.slice(0, 2).map(e => e.t), refusO2: _refusO2, o2: etat.jauges.o2, pos: etat.pos, bouton: !!document.querySelector("#carte-secours") || bloqueSansO2() };
  rep.deplacer = { ok: false, err: "energie", energie: 1, requis: 10 };
  await voyager(2000, 900);
  r.refusEnergie = dernier();

  // 4. appel de détresse
  etat.credits = 1000; if(typeof initCredits === "function") initCredits(1000);
  rep.secours = { ok: true, frais: 500, solde: 500, x: 1225, y: 325, energie: 77, jauges: { o2: 100, sante: 90, moral: 80 } };
  appels.length = 0; demandes = 0;
  await secoursSol();
  r.secours = { appels: appels.slice(), demandes, pos: etat.pos, credits: etat.credits, o2: etat.jauges.o2, refusO2: _refusO2, journal: dernier() };
  _refusO2 = true; etat.pos = { x: 1600, y: 600 }; etat.jauges.o2 = 3;
  rep.secours = { ok: false, err: "pas_bloque" };
  await secoursSol();
  r.secoursRefus = { journal: dernier(), pos: etat.pos, credits: etat.credits, refusO2: _refusO2 };

  // 5. la sauvegarde : position gardée par le serveur
  etat.pos = { x: 1920, y: 355 };
  sauveRep = a => ({ ok: true, rev: 99, maj: 9, pos: { x: 1400, y: 325, secteur: "silene" } });
  await sauverMaintenant();
  r.sauvePos = etat.pos;
  sauveRep = a => { etat.pos = { x: 1500, y: 500 }; return { ok: true, rev: 100, maj: 10, pos: { x: 1400, y: 325, secteur: "silene" } }; };
  await sauverMaintenant();
  r.sauvePendantTrajet = etat.pos;
  etat.pos = { x: 1400, y: 325 }; etat.secteur = "ecart";
  sauveRep = a => ({ ok: true, rev: 101, maj: 11, pos: { x: 1400, y: 325, secteur: "silene" } });
  await sauverMaintenant();
  r.decollageRefuse = etat.secteur;
  sauveRep = a => ({ ok: true, rev: 102, maj: 12 });
  await sauverMaintenant();
  r.sauveSansPos = { pos: etat.pos, secteur: etat.secteur };
  sauveRep = null;

  // 6. relecture des colonnes
  appliquerColonnesProfil({ credits: 500, faction: "ignis", pos_x: 1895, pos_y: 1050 });
  r.colonnes = etat.pos;
  appliquerColonnesProfil({ credits: 500, faction: "ignis" });
  r.colonnesSansPos = etat.pos;

  confirmerJoli = cj0; sb.rpc = rpc0;
  return r;
})()
