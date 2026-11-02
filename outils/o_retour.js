// v2.18 — Le carburant du retour, d'où qu'on soit (node outils/o_banc.js .. retour).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  etat.espace1 = true; etat.permisVaisseau = true; etat.ceres = true; etat.vaisseau = "fab_vaisseau_cargo"; etat.vaisseauPv = {};
  etat.sac = {}; sauverMaintenant = async () => {};
  const c = coutSaut(), b = espaceLieu("base"), t = espaceLieu("trou_noir"), g = espaceLieu("e2_gorge"), nid = espaceLieu("e2_base");
  const vp = coutVol({ x:b.x, y:b.y }, { x:t.x, y:t.y }).litres;
  r.couts = { saut:c.litres, gorgeVersPerchoir:vp };
  const cas = (secteur, pos, carb, credits) => { etat.secteur = secteur; etat.posEspace = pos; etat.carburant = carb; etat.credits = credits; return vaisseauSansRetour(); };
  // 1. Triptolème (inchangé)
  r.triptoleme = { assez: cas("ecart", { x:b.x, y:b.y }, c.litres, 0), peuEtRiche: cas("ecart", { x:b.x, y:b.y }, c.litres - 1, 99999), peuEtPauvre: cas("ecart", { x:b.x, y:b.y }, c.litres - 1, 0) };
  // 2. Cérès, au Nid : il faut le trajet jusqu'à la Gorge + le saut + la bouche → Perchoir
  const vg = coutVol({ x:g.x, y:g.y }, { x:nid.x, y:nid.y }).litres, besoin = vg + c.litres + vp;
  r.ceres = { besoinDepuisNid: besoin,
    unSautEtDemi_pauvre: cas("ceres", { x:nid.x, y:nid.y }, c.litres + vp, 0),          // avant : « il peut rentrer » (faux)
    unSautEtDemi_riche: cas("ceres", { x:nid.x, y:nid.y }, c.litres + vp, 99999),         // il achètera au Nid
    assez: cas("ceres", { x:nid.x, y:nid.y }, besoin, 0) };
  // 3. Une surface (Ancolie) : décollage ×1,5, pas de carburant en vente
  etat.secteur = "ancolie"; etat.surface = { ...SURFACES.ancolie.abri };
  const cs = coutSautSurface(surfaceCfg());
  etat.carburant = cs.litres - 1; etat.credits = 99999;
  r.ancolie = { decollage: cs.litres, pasAssezMaisRiche: vaisseauSansRetour() };        // avant : « il achètera » (faux : rien à acheter ici)
  etat.carburant = cs.litres; r.ancolie.assez = vaisseauSansRetour();
  etat.surface = null;
  // 4. Entrer à Cérès : deux sauts ne suffisent plus, il faut aussi la bouche → Perchoir
  const lignes = []; const vj = journal; journal = (x, ...y) => { lignes.push(String(x)); return vj(x, ...y); };
  const rpc0 = sb.rpc.bind(sb); sb.rpc = (n, a) => n === "agir" ? Promise.resolve({ data:{ ok:true, energie:90, jauges:etat.jauges }, error:null }) : rpc0(n, a);
  etat.secteur = "ecart"; etat.posEspace = { x:t.x, y:t.y }; etat.carburant = 2 * c.litres; etat.energie = 100;
  await passerLaGorge();
  r.entree = { deuxSautsRefuse: etat.secteur === "ecart" && lignes.some(l => /rejoindre le Perchoir coûte/.test(l)) };
  etat.carburant = 2 * c.litres + vp; await passerLaGorge();
  r.entree.avecLeRetourPasse = etat.secteur === "ceres";
  // 5. Coincé à Cérès sans rien : évacuation chez soi (K100)
  etat.secteur = "ceres"; etat.posEspace = { x:nid.x, y:nid.y }; etat.carburant = 0; etat.credits = 0;
  const ok = await secoursOrbite();
  r.evacuation = { secours: ok, chezSoi: etat.secteur === "silene" };
  journal = vj; sb.rpc = rpc0;
  return r;
})();
