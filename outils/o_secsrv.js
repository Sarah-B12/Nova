// v3.02 (v304, K271) — le secours en orbite fait par le serveur (secours_orbite). Produit :
//   · `cfg` : ce que le serveur doit connaître — SECOURS_FRAIS, SECOURS_FRAIS_PALIER, SECOURS_SEC, SECOURS_SEC_PALIER,
//     le palier de réputation, les orbites de La Braise et du Suaire (carte_changer), la majoration hors comptoir
//     — copié dans `_cartes_cfg()` ;
//   · `cas` : 600 situations tirées au hasard (graine fixe) — secteur (Triptolème, Cérès, La Braise, Le Suaire, Ancolie),
//     position, vaisseau ou non, coque, réservoir, bidons au sac et en soute, crédits, Nid ouvert, boisson, réputation,
//     aptitudes, Intelligence — avec le diagnostic du JEU (cloué, sans vaisseau, à sec, ou rien) et ses frais
//     (secoursOrbite / vaisseauSansRetour). Le banc SQL refait chaque cas avec `_secours_cas` et compare : aucun écart permis.
//   node outils/o_banc.js . secsrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const L = id => { const l = espaceLieu(id); return l ? { x: l.x, y: l.y, r: espaceRayon(l) } : null; };
  const CFG = { frais: SECOURS_FRAIS, frais_palier: SECOURS_FRAIS_PALIER, sec: SECOURS_SEC, sec_palier: SECOURS_SEC_PALIER,
                palier: (typeof REP_PALIER_RAPATRIEMENT !== "undefined" ? REP_PALIER_RAPATRIEMENT : 25),
                orbites: { braise: L(SURFACES.braise.orbite), suaire: L(SURFACES.suaire.orbite) }, dehors: aptBoutiqueSurcout(1000) / 1000,
                prix_perchoir: Object.fromEntries(BASE_BOUTIQUE.filter(a => CARBURANT_LITRES[a.id]).map(a => [a.id, a.prix])) };
  let g = 20261115;
  const alea = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  const choix = t => t[Math.floor(alea() * t.length)];
  const APTS = ["no4", "sv4", "om3"];
  const BOISSONS = [null, null, null, { boutique: 0.8 }, { boutique: 0.7 }, { boutique: 1.15 }, { intelligence: 20, energie_depl: 0.8 }];
  const s0 = JSON.stringify({ sec: etat.secteur, pe: etat.posEspace, su: etat.surface, v: etat.vaisseau, pv: etat.vaisseauPv, ap: etat.aptitudes,
                              comp: etat.competences, b: etat.boisson, sac: etat.sac, so: etat.soute, cr: etat.credits, ca: etat.carburant,
                              nid: etat.nidOuvert, rep: etat.reputation, j: etat.jauges });
  const mod0 = Object.assign({}, _modulesVaisseau);
  const cas = [];
  for(let i = 0; i < 600; i++){
    const sect = choix(["ecart", "ecart", "ceres", "ceres", "braise", "suaire", "ancolie"]);
    const vid = alea() < 0.12 ? null : choix(Object.keys(VAISSEAUX));
    const vv = vid ? VAISSEAUX[vid] : null;
    const pmax = vid ? pvMax(vid) : 0;
    const pv = vid ? choix([pmax, pmax, Math.floor(pmax * 0.29), 0, 1 + Math.floor((pmax - 1) * alea())]) : 0;
    const regul = alea() < 0.2;
    _modulesVaisseau = {}; if(regul) _modulesVaisseau.regulateur = new Date(Date.now() + 86400e3).toISOString();
    const pris = APTS.filter(() => alea() < 0.25), mods = choix(BOISSONS);
    const intel = 10 + Math.floor(alea() * 200);
    const carbu = vv ? choix([0, 0, Math.floor(alea() * vv.reservoir), vv.reservoir, Math.floor(alea() * 20)]) : 0;
    const carb = vv ? vv.carb : "fab_biocarburant";
    const sac = alea() < 0.25 ? Math.floor(alea() * 3) : 0, soute = alea() < 0.15 ? Math.floor(alea() * 3) : 0;
    const credits = choix([0, 50, 100, 351, 352, 353, 704, 1000, Math.floor(alea() * 4000), Math.floor(alea() * 400)]);
    const nid = alea() < 0.4, rep = choix([0, 10, 24, 25, 60]);
    let pe = null, surf = null;
    if(sect === "ecart" || sect === "ceres"){
      const b = L(sect === "ecart" ? "base" : "e2_base"), w = sect === "ecart" ? ESPACE_MONDE : ESPACE2_MONDE;
      const t = alea();
      pe = t < 0.3 ? { x: b.x, y: b.y } : t < 0.4 ? { x: b.x + Math.round(b.r * 0.9), y: b.y } : t < 0.5 ? { x: b.x + Math.round(b.r * 1.1), y: b.y }
         : { x: Math.round(alea() * w.w), y: Math.round(alea() * w.h) };
    } else {
      const c = SURFACES[sect]; surf = { x: c.vaisseau.x, y: c.vaisseau.y, abord: alea() < 0.5 };
      const o = sect === "ancolie" ? null : L(SURFACES[sect].orbite); if(o) pe = { x: o.x, y: o.y };
    }
    etat.secteur = sect; etat.posEspace = pe ? { ...pe } : null; etat.surface = surf ? { ...surf } : null;
    etat.vaisseau = vid; etat.vaisseauPv = vid ? { [vid]: pv } : {};
    aptEtat().pris = pris.slice(); etat.competences.intelligence = intel;
    etat.boisson = mods ? { id: "essai", mods: { ...mods }, fin: new Date(Date.now() + 3600e3).toISOString() } : null;
    etat.sac = sac ? { [carb]: sac } : {}; etat.soute = soute ? { [carb]: soute } : {};
    etat.credits = credits; etat.carburant = carbu; etat.nidOuvert = nid; etat.reputation = rep; etat.jauges.moral = 60;
    const cloue = !!vid && vaisseauCloue();
    const aSec = !!vid && !cloue && vaisseauSansRetour();
    const besoin = vid && !cloue ? _litresRetour() : null, auto = vid ? autonomieCarburant() : null;
    const leCas = !vid ? "sans" : cloue ? "cloue" : aSec ? "sec" : null;
    const p25 = repPalier(CFG.palier);
    const frais = !leCas ? null : leCas === "sec" ? Math.floor(Math.max(0, credits) * (p25 ? SECOURS_SEC_PALIER : SECOURS_SEC))
                : (leCas === "sans" && p25) ? SECOURS_FRAIS_PALIER : SECOURS_FRAIS;
    cas.push({ i, sect, vid, pv, regul, pris, mods, intel, carbu, carb, sac, soute, credits, nid, rep, pe, surf,
               cas: leCas, frais, p25, besoin, auto });
  }
  const s = JSON.parse(s0);
  etat.secteur = s.sec; etat.posEspace = s.pe; etat.surface = s.su; etat.vaisseau = s.v; etat.vaisseauPv = s.pv; etat.aptitudes = s.ap;
  etat.competences = s.comp; etat.boisson = s.b; etat.sac = s.sac; etat.soute = s.so; etat.credits = s.cr; etat.carburant = s.ca;
  etat.nidOuvert = s.nid; etat.reputation = s.rep; etat.jauges = s.j; _modulesVaisseau = mod0;
  const nb = k => cas.filter(c => c.cas === k).length;
  return { n: cas.length, cloue: nb("cloue"), sans: nb("sans"), sec: nb("sec"), rien: nb(null), cfg: JSON.stringify(CFG), cas };
})()
