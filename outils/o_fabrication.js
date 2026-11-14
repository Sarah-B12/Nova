// v2.88 (v290, K261) — fabriquer() passe par `atelier_fabriquer` (le serveur lit la recette, tire les
// bonus, crédite l'XP) au lieu d'agir() avec ingrédients ET objet annoncés. Vérifie : l'appel et ses
// arguments, la sauvegarde AVANT (formation lue dans donnees), aucun agir ni xp_gagner, le sac et l'XP
// pris dans la réponse, les points de formation comptés ici (K261), série et récup dites d'après le
// serveur, un refus dit, le double clic ignoré.
//   node outils/o_banc.js . fabrication
(async function(){
  const r = {};
  const appels = [];
  const rpc0 = sb.rpc.bind(sb);
  let reponse = null;
  sb.rpc = (nom, args) => {
    appels.push(nom + (nom === "atelier_fabriquer" ? " " + JSON.stringify(args) : ""));
    if(nom === "atelier_fabriquer") return new Promise(res => setTimeout(() => res({ data: reponse, error: null }), 30));
    if(nom === "agir") return Promise.resolve({ data: { ok: true, ajoutes: args.p_ajouter, etat: { sac: {} } }, error: null });
    return rpc0(nom, args);
  };
  const jr = () => { const e = (etat.journal || [])[0]; return e ? e.t : ""; };
  await new Promise(res => setTimeout(res, 300));
  etat.formation = { cle: "biotech", points: 0, debutLe: Date.now(), fait: {} };
  structSel = 2;
  etat.sac = { filaine: 5 }; etat.coffre = {};
  villeActuelle = () => null;   // coffre hors de portée : rien à remonter

  // 1. Fil (seuil 0), le serveur répond série + récup, XP 0.
  reponse = { ok: true, produit: "fab_fil", serie: true, recup: "filaine", retire: { filaine: 3 }, xp: 0, xp_total: 250,
              etat: { sac: { filaine: 3, fab_fil: 2 }, coffre: {}, soute: {}, lots: [], equipe: {} } };
  appels.length = 0;
  await fabriquer(0);
  r.appels = appels.filter(a => /atelier_fabriquer|agir|xp_gagner|sauver_profil/.test(a));
  r.sauveAvant = appels.indexOf("sauver_profil") > -1 && appels.indexOf("sauver_profil") < appels.findIndex(a => a.startsWith("atelier_fabriquer"));
  r.sac = JSON.stringify(etat.sac);
  r.points = etat.formation.points;
  r.journal = jr();

  // 2. XP d'atelier : le total du serveur est adopté (pas de xp_gagner).
  etat.formation.points = 200;
  etat.sac = { fab_cockpit_blinde: 1, fab_moteur_a_distorsion: 1, fab_tourelle_de_vaisseau: 1, cristal: 2 };
  etat.permisVaisseau = true; etat.formation.cle = "constructeur";
  reponse = { ok: true, produit: "fab_vaisseau_maitre", serie: false, recup: null, xp: 101, xp_total: 99999,
              etat: { sac: { fab_vaisseau_maitre: 1 } } };
  appels.length = 0;
  await fabriquer(140);
  r.xpTotal = etat.xpTotal;
  r.xpGagner = appels.filter(a => a === "xp_gagner").length;
  r.journalMaitre = (etat.journal || []).map(e => e.t).find(t => /Fabriqué : Vaisseau/.test(t)) || "";

  // 3. Refus du serveur (verrouillée) : dit, rien ne bouge.
  const pts = etat.formation.points;
  etat.sac = { fab_cockpit_blinde: 1, fab_moteur_a_distorsion: 1, fab_tourelle_de_vaisseau: 1, cristal: 2 };
  reponse = { ok: false, err: "verrouillee" };
  await fabriquer(140);
  r.refus = jr(); r.pointsInchanges = etat.formation.points === pts;

  // 4. Double clic : un seul appel.
  reponse = { ok: true, produit: "fab_vaisseau_maitre", serie: false, recup: null, xp: 101, xp_total: 100100, etat: { sac: {} } };
  appels.length = 0;
  await Promise.all([fabriquer(140), fabriquer(140)]);
  r.doubleClic = appels.filter(a => a.startsWith("atelier_fabriquer")).length;
  sb.rpc = rpc0;
  return r;
})()
