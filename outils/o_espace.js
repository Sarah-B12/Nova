// v3.01 (v303, K271) — le carburant et les vols dans l'espace par le serveur. Vérifie :
//   · un saut : `saut_payer` avec le bon type (saut, gorge, ancolie), aucun agir ; réservoir et énergie RENVOYÉS ;
//   · un vol : `espace_voler` (aucun agir, aucun plein fait par la page) ; les pleins faits par le serveur dits comme
//     avant ; position et réservoir renvoyés ; refus « retour » avec la phrase d'avant ;
//   · le plein manuel : `carburant_plein` ; « plein » et « manque » dits ;
//   · la sauvegarde : réservoir et position dans l'espace renvoyés adoptés — sauf si un appel a eu lieu pendant ce temps.
//   node outils/o_banc.js . espace
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {}, sauveRep = null;
  sb.rpc = (n, a) => {
    if(/^saut_payer$|^espace_voler$|^carburant_plein$|^agir$/.test(n))
      appels.push(n + (n === "saut_payer" ? ":" + a.p_type : "") + (n === "espace_voler" ? `:${a.p_x},${a.p_y}` : "") + (n === "agir" ? ":" + a.p_motif : ""));
    if(rep[n]) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    if(n === "sauver_profil" && sauveRep) return Promise.resolve({ data: sauveRep(a), error: null });
    if(n === "agir") return Promise.resolve({ data: { ok: true, energie: 70 }, error: null });
    return rpc0(n, a);
  };
  const dernier = () => (etat.journal[0] || {}).t || "";
  etat.vaisseau = "fab_navette_legere"; etat.vaisseauPv = {}; etat.carburant = 40; etat.energie = 100; etat.secteur = "ecart";
  const b = espaceLieu("base"); etat.posEspace = { x: b.x, y: b.y };

  // 1. les sauts
  rep.saut_payer = a => ({ ok: true, type: a.p_type, litres: a.p_type === "ancolie" ? 9 : 18, cout_e: a.p_type === "gorge" ? 6 : 10, carburant: 22, reservoir: 40, energie: 90 });
  appels.length = 0;
  const s1 = await _payerSaut("Rentrée"); const j1 = dernier();
  const s2 = await _payerSaut("La Gorge", coutSaut(true));
  const s3 = await _payerSaut("Départ pour Ancolie", coutSautSurface(SURFACES.ancolie));
  r.sauts = { ok: [s1, s2, s3], appels: appels.slice(), carburant: etat.carburant, energie: etat.energie, journal: j1 };
  etat.carburant = 40;
  rep.saut_payer = { ok: false, err: "carburant", litres: 18, carburant: 4, carb: "fab_biocarburant" };
  r.sautRefus = { ok: await _payerSaut("Rentrée"), journal: dernier() };

  // 2. un vol : le serveur verse un bidon puis vole
  etat.carburant = 2; etat.sac.fab_biocarburant = 2; etat.posEspace = { x: b.x, y: b.y };
  rep.espace_voler = { ok: true, x: 1285, y: 728, d: 600, cout_e: 5, litres: 3, carburant: 19, reservoir: 40,
                       pleins: [{ ajoute: 20, carburant: 22 }], energie: 95 };
  appels.length = 0; await volVers({ x: 1285, y: 728, nom: null, libelle: "ce point du secteur", id: null });
  r.vol = { appels: appels.slice(), pos: etat.posEspace, carburant: etat.carburant, journal: etat.journal.slice(0, 4).map(e => e.t).filter(t => /Plein|Cap sur/.test(t)) };
  rep.espace_voler = { ok: false, err: "retour", besoin: 18, autonomie: 5, litres: 9, retour: 9, carb: "fab_biocarburant" };
  etat.carburant = 40; etat.sac.fab_biocarburant = 0; appels.length = 0;
  await volVers({ x: 1400, y: 900, nom: null, libelle: "ce point du secteur", id: null });
  r.volRefus = { appels: appels.slice(), journal: dernier(), pos: etat.posEspace };

  // 3. le plein manuel
  etat.carburant = 30; etat.sac.fab_biocarburant = 1;
  rep.carburant_plein = { ok: true, ajoute: 10, carburant: 40, reservoir: 40, carb: "fab_biocarburant", lieu: "sac" };
  appels.length = 0; await ravitailler();
  r.plein = { appels: appels.slice(), carburant: etat.carburant, journal: dernier() };
  rep.carburant_plein = { ok: false, err: "manque", carb: "fab_biocarburant" }; etat.carburant = 10;
  await ravitailler(); r.pleinRefus = dernier();

  // 4. la sauvegarde
  etat.carburant = 40; etat.posEspace = { x: 2113, y: 1393 };
  sauveRep = a => ({ ok: true, rev: 400, maj: 9, carburant: 12, pos: { x: etat.pos.x, y: etat.pos.y, secteur: "ecart", posEspace: { x: 900, y: 800 } } });
  await sauverMaintenant();
  r.sauve = { carburant: etat.carburant, pos: etat.posEspace };
  sauveRep = a => { _carbSeq++; etat.posEspace = { x: 1000, y: 1000 }; return { ok: true, rev: 401, maj: 10, carburant: 3, pos: { x: etat.pos.x, y: etat.pos.y, secteur: "ecart", posEspace: { x: 900, y: 800 } } }; };
  await sauverMaintenant();
  r.sauvePendantAppel = { carburant: etat.carburant, pos: etat.posEspace };
  sauveRep = null;

  sb.rpc = rpc0;
  return r;
})()
