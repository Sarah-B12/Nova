// v2.62 — réputation de faction : paliers, bulle, enrôlement, secours, résurrection, remise à zéro
// node o_banc.js .. reputation
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const journ = []; const jOrig = journal; journal = (t) => journ.push(t);
  // 1. La bulle du blason (prochain palier).
  r.bulle = {};
  for(const v of [0, 30, 70, 96]){
    const d = document.createElement("div"); d.innerHTML = _badgesReput(v, {}, etat.faction);
    r.bulle[v] = (d.querySelector(".rep-palier") || {}).textContent || null;
  }
  r.bulleAutres = (() => { const d = document.createElement("div"); d.innerHTML = _badgesReput(50, {}, etat.faction); return d.querySelectorAll(".rep-palier").length; })();
  // 2. L'écran d'expédition (textes calculés).
  r.enrolement = {};
  for(const v of [10, 70, 96]){
    etat.reputation = v;
    const allege = repPalier(REP_PALIER_ENROLEMENT);
    r.enrolement[v] = { cout: allege ? 12 : 15, malus: repPalier(REP_PALIER_MALUS) ? 5 : 10 };
  }
  // 3. La résurrection (texte de l'écran).
  _mortInfo = { ok:true, mort:true, cout_credits:100, reste_ms: 86400000, depuis_ms: 0 };
  if(typeof majEcranMort === "function"){ try{ majEcranMort(); }catch(e){} }
  r.mort = (document.querySelector("#mort-prix") || {}).textContent || null;
  _mortInfo = { ok:true, mort:false }; if(typeof majEcranMort === "function"){ try{ majEcranMort(); }catch(e){} }
  // 4. Le secours en orbite : sans vaisseau, à sec, coque à zéro ; sans et avec le palier 25.
  const sauve = { enEspace, vaisseauSansRetour, sauverMaintenant: window.sauverMaintenant, majApresDeplacement, fermerOrbite: window.fermerOrbite };
  enEspace = () => true; window.sauverMaintenant = async () => {}; majApresDeplacement = () => {}; window.fermerOrbite = () => {};
  const vaisseau0 = etat.vaisseau, pv0 = JSON.stringify(etat.vaisseauPv || {});
  const cas = async (nom, prep) => {
    const out = {};
    for(const rep of [10, 30]){
      etat.reputation = rep; etat.credits = 1000; etat.secteur = "ecart"; journ.length = 0;
      prep();
      await secoursOrbite();
      out[rep < 25 ? "sans palier" : "palier 25"] = `${1000 - etat.credits} ₡`;
      out["journal " + (rep < 25 ? "sans" : "palier")] = journ[0];
    }
    r.secours[nom] = out;
  };
  r.secours = {};
  await cas("plus de vaisseau", () => { etat.vaisseau = null; vaisseauSansRetour = () => false; });
  await cas("à sec", () => { etat.vaisseau = vaisseau0 || "fab_vaisseau_cargo"; etat.vaisseauPv = {}; vaisseauSansRetour = () => true; });
  await cas("coque à zéro", () => { etat.vaisseau = vaisseau0 || "fab_vaisseau_cargo"; etat.vaisseauPv = { [etat.vaisseau]: 0 }; vaisseauSansRetour = () => false; });
  Object.assign(window, { enEspace: sauve.enEspace }); enEspace = sauve.enEspace; vaisseauSansRetour = sauve.vaisseauSansRetour; majApresDeplacement = sauve.majApresDeplacement;
  etat.vaisseau = vaisseau0; etat.vaisseauPv = JSON.parse(pv0); etat.secteur = "silene";
  // 5. Changer de faction : le texte et la remise à zéro.
  const rpcOrig = sb.rpc.bind(sb); let conf = null;
  confirmerJoli = async (t, m) => { conf = m; return true; };
  sb.rpc = (nom, a) => nom === "changer_faction" ? Promise.resolve({ data:{ ok:true, faction:a.p_faction, x:300, y:300, reputation:0, conjoint:false }, error:null }) : rpcOrig(nom, a);
  _facEtat = { bloque:false, verrou:false };
  etat.reputation = 42; const autre = FACTIONS.find(f => f.id !== etat.faction);
  await changerFaction(autre.id);
  r.faction = { confirmation: /réputation de faction repart de zéro/.test(conf || ""), reputation: etat.reputation, faction: etat.faction === autre.id };
  // 6. Le conjoint qui suit (union_lire → moi).
  etat.reputation = 33; _appliquerMoiUnion({ faction: etat.faction, reputation: 0 });
  r.conjoint = etat.reputation;
  sb.rpc = rpcOrig; journal = jOrig;
  return r;
})();
