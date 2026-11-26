// v2.94 (v296, K269) — la fiche du personnage contrôlée par le serveur : produit les barèmes copiés au serveur.
//  • `chaines` → `_perso_aptitudes()` : chaque chaîne d'aptitudes (tronc et factions), ses nœuds DANS L'ORDRE ; coût d'un
//    nœud = aptCout(rang) (1, sauf le 4ᵉ : APT_CAP_COUT).
//  • `pa` → `_quete_pa()` : les PA de chaque quête (recompense.pa).
//  • `drapeaux` → `_perso_drapeaux()` : la quête qui donne chaque drapeau que le serveur lit (permisVaisseau, espace1,
//    ancolie, nidOuvert ; v3.02 : ceres ; v3.33 (v329, K327) : habilitation, lue par les réserves de la station,
//    et seleniteConnue, lue par le gisement de Sélénite).
//  • `coutsQuetes` → `_quete_couts()` (v297) : les étapes « paiement » des quêtes (qN:étape → crédits).
//  • `regles` : compétences de départ, PTS_PAR_NIVEAU, CAP_COMP, APT_CAP_COUT (écrits en dur dans _perso_controler).
// Changer l'arbre, un PA de quête ou un drapeau = changer aussi le serveur (BACKEND_PLAN §6) : relancer, recopier.
//   node outils/o_banc.js . persosrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const chaines = [];
  for(const c of APT_TRONC) chaines.push({ id:c.id, f:null, n:c.noeuds.map(n => n.id) });
  for(const f of Object.keys(APT_FACTIONS)) chaines.push({ id:f, f, n:APT_FACTIONS[f].noeuds.map(n => n.id) });
  const couts = chaines.map(c => c.n.map((id, i) => aptCout(i)).join("")).join(" ");
  const pa = {}; for(const q of QUETES){ const r = q.recompense || {}; if(r.pa) pa[q.id] = r.pa; }
  const drapeaux = {};
  for(const k of ["permisVaisseau","espace1","ancolie","nidOuvert","ceres","habilitation","seleniteConnue"]){   // v3.02 (v304) : + ceres ; v3.33 (v329) : + habilitation, seleniteConnue
    const q = QUETES.find(q => q.recompense && q.recompense.flags && k in q.recompense.flags);
    drapeaux[k] = q ? q.id : null;
  }
  // v2.95 (v297, K268) : les étapes payantes des quêtes (défi « paiement ») → `_quete_couts()` ; et les options de choix
  // qui coûteraient des crédits (aucune aujourd'hui : si on en ajoute, les faire passer par quete_paiement).
  const coutsQ = {}; let optionsCredits = 0;
  for(const q of QUETES) (q.etapes || []).forEach((e, i) => {
    const d = e && e.defi; if(d && d.type === "paiement") coutsQ[q.id + ":" + i] = d.cout || 0;
    for(const o of ((d && d.options) || e.options || [])) if(o && o.cout && o.cout.credits) optionsCredits++;
  });
  const base = nouvelEtat().competences;
  return { nbChaines: chaines.length, nbNoeuds: chaines.reduce((s, c) => s + c.n.length, 0), couts,
           paTotal: Object.values(pa).reduce((s, v) => s + v, 0),
           regles: { base, PTS_PAR_NIVEAU, CAP_COMP, APT_CAP_COUT, APT_RESPEC },
           optionsCredits, chaines: JSON.stringify(chaines), pa: JSON.stringify(pa), drapeaux: JSON.stringify(drapeaux),
           coutsQuetes: JSON.stringify(coutsQ) };
})()
