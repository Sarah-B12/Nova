// v3.25 — Fournaise +15 % au minage, réputation des ventes plafonnée (texte), ni chute ni patrouille en Ancolie
// (node outils/o_banc.js . v325)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1000);
  // 1. Fournaise
  r.texteIg2 = APT_FACTIONS.ignis.noeuds.find(a => a.id === "ig2").effet;
  const boi0 = _boi; _boi = () => 1;
  etat.aptitudes = { pa:0, pris:["ig1","ig2"], v:125 };
  etat.secteur = "silene"; etat.pos = { x:1225, y:325 };
  r.mineChaud = [3,4,5,6,9].map(n => aptMineLot(n));
  etat.pos = { x:300, y:300 };
  r.mineHorsZone = [3,6].map(n => aptMineLot(n));
  etat.aptitudes = { pa:0, pris:[], v:125 }; etat.pos = { x:1225, y:325 };
  r.mineSansIg2 = [3,6].map(n => aptMineLot(n));
  etat.aptitudes = { pa:0, pris:["ig1","ig2"], v:125 };
  r.patrouilleChaud = aptButinCombat(100);
  _boi = boi0;
  // 2. Le marché : le texte de la taxe
  changerHub("marche"); await dort(50);
  if(typeof renderMarche === "function") renderMarche();
  try{ ouvrirVente(); }catch(e){ r.erreurVente = String(e); }
  await dort(80);
  const t = document.body.textContent.replace(/\s+/g, " ");
  r.marcheTexte = { plafond: t.includes("2 par jour au plus"), prixMoyen: t.includes("prix moyen de l'objet") };
  // 3. Les débris : une chute sur Silène ne touche pas Ancolie
  _debris = Object.assign({}, _debris, { actif:true, carte:"silene" });
  etat.secteur = "silene"; r.debrisSilene = debrisPatrouilleIci();
  etat.secteur = "ancolie"; r.debrisAncolie = debrisPatrouilleIci(); r.posAncolie = _debrisPosIci();
  _debris = Object.assign({}, _debris, { actif:true, carte:"braise" });
  etat.secteur = "braise"; r.debrisBraise = debrisPatrouilleIci();
  return r;
})();
