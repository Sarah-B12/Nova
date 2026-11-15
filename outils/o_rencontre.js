// v3.03 (v305, K273) — les rencontres de sondes par le serveur, côté jeu. Vérifie :
//   · un vol : la fenêtre s'ouvre seulement si espace_voler dit `sonde` (plus de tirage du jeu), et pas de secours dessous ;
//   · dériver, brouiller : sonde_deriver / sonde_brouiller ; réussite dite ; échec : coque du serveur adoptée, anticipation
//     et avarie annoncées ; « matériel » rouvre la fenêtre ; rencontre déjà réglée : dite, sans dégâts ;
//   · se laisser scanner : rencontre déjà réglée ; ouvrir le feu : rencontre réglée, puis défaite → sonde_defaite ;
//   · au chargement (sondeReprendre) : duel laissé en plan → perdu, dit, coque adoptée ; rencontre en attente → fenêtre ;
//   · un vol ou un changement de carte refusé « sonde » rouvre la fenêtre ;
//   · aucune issue n'appelle plus coque_abimer.
//   node outils/o_banc.js . rencontre
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {};
  sb.rpc = (n, a) => {
    if(/^sonde_|^espace_voler$|^coque_abimer$|^carte_changer$|^secours_orbite$/.test(n)) appels.push(n);
    if(rep[n]) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    return rpc0(n, a);
  };
  const journ = []; const jOrig = journal; journal = (t, ...x) => { journ.push(String(t)); return jOrig(t, ...x); };
  const ouverte = () => { const m = document.querySelector("#sonde-modale"); return !!m && !m.hidden; };
  const V = "fab_navette_legere";
  const raz = () => { etat.secteur = "ecart"; etat.vaisseau = V; etat.vaisseauPv = { [V]: 100 }; etat.carburant = 40; etat.energie = 100;
    const b = espaceLieu("base"); etat.posEspace = { x: b.x, y: b.y }; fermerSonde(); appels.length = 0; journ.length = 0; };

  // 1. un vol
  raz(); rep.espace_voler = { ok: true, x: 900, y: 800, d: 230, cout_e: 2, litres: 1, carburant: 39, reservoir: 40, pleins: [], sonde: true, energie: 98 };
  await volVers({ x: 900, y: 800, nom: null, libelle: "ce point", id: null });
  r.volSonde = { fenetre: ouverte(), appels: appels.slice() };
  raz(); rep.espace_voler = Object.assign({}, rep.espace_voler, { sonde: false });
  const vr = Math.random; Math.random = () => 0;   // l'ancien tirage aurait intercepté
  await volVers({ x: 900, y: 800, nom: null, libelle: "ce point", id: null }); Math.random = vr;
  r.volSansSonde = { fenetre: ouverte(), appels: appels.slice() };

  // 2. dériver
  raz(); rep.sonde_deriver = { ok: true, reussi: true }; await sondeDeriver();
  r.deriveOk = { appels: appels.slice(), coque: etat.vaisseauPv[V], texte: journ.find(t => /débris/.test(t)) || "" };
  raz(); rep.sonde_deriver = { ok: true, reussi: false, degats: 75, anticipe: true, vaisseau: V, avant: 100, coque: 25, max: 120 }; await sondeDeriver();
  r.deriveRate = { appels: appels.slice(), coque: etat.vaisseauPv[V], anticipe: journ.some(t => /anticipé/.test(t)), avarie: journ.some(t => /avarie/.test(t)),
                   texte: journ.some(t => /Trop tard/.test(t)) };
  raz(); rep.sonde_deriver = { ok: false, err: "pas_de_sonde" }; await sondeDeriver();
  r.deriveReglee = { coque: etat.vaisseauPv[V], texte: journ.some(t => /décroché/.test(t)), fenetre: ouverte() };

  // 3. brouiller
  raz(); etat.equipement = Object.assign({}, etat.equipement, { arme: ITEM_HACK });
  rep.sonde_brouiller = { ok: false, err: "materiel" }; await sondeBrouiller();
  r.brouilleMateriel = { fenetre: ouverte(), texte: journ.some(t => /Ordinateur de hacking/.test(t)) };
  raz(); rep.sonde_brouiller = { ok: true, reussi: false, degats: 20, anticipe: false, vaisseau: V, avant: 100, coque: 80, max: 120 }; await sondeBrouiller();
  r.brouilleRate = { appels: appels.slice(), coque: etat.vaisseauPv[V], texte: journ.some(t => /brouillage ne prend pas/.test(t)) };

  // 4. scanner, puis ouvrir le feu
  raz(); rep.sonde_prelever = { ok: false, err: "pas_de_sonde" }; await sondeScanner();
  r.scanReglee = journ.some(t => /décroché/.test(t));
  raz(); rep.sonde_engager = { ok: false, err: "pas_de_sonde" }; await sondeCombat();
  r.feuReglee = { texte: journ.some(t => /décroché/.test(t)), fenetre: ouverte() };
  raz(); const lt = lancerTirSonde; lancerTirSonde = (win, lose) => lose();
  rep.sonde_engager = { ok: true, energie: 95 }; rep.sonde_defaite = { ok: true, degats: 30, anticipe: false, vaisseau: V, avant: 100, coque: 70, max: 120 };
  await sondeCombat(); await new Promise(x => setTimeout(x, 50)); lancerTirSonde = lt;
  r.feuPerdu = { appels: appels.slice(), coque: etat.vaisseauPv[V], texte: journ.some(t => /riposte/.test(t)) };

  // 5. au chargement
  raz(); rep.sonde_etat = { ok: true, attente: true, perdu: { degats: 33, anticipe: false, vaisseau: V, avant: 100, coque: 67, max: 120 } };
  const rv = await sondeReprendre();
  r.reprise = { rouverte: rv, fenetre: ouverte(), coque: etat.vaisseauPv[V], texte: journ.some(t => /inachevé/.test(t)) };
  raz(); rep.sonde_etat = { ok: true, attente: false }; r.repriseRien = { rouverte: await sondeReprendre(), fenetre: ouverte() };

  // 6. un vol refusé « sonde »
  raz(); rep.espace_voler = { ok: false, err: "sonde" }; await volVers({ x: 1000, y: 800, nom: null, libelle: "ce point", id: null });
  r.volRefuse = { fenetre: ouverte(), pos: etat.posEspace };
  fermerSonde();

  journal = jOrig; sb.rpc = rpc0;
  return r;
})()
