// v2.62 — réputation de faction : paliers, bulle, enrôlement, secours, résurrection, remise à zéro
// node o_banc.js .. reputation
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  /* v3.02 (v304) : changements de carte, sauts de quête et secours passent par le serveur (carte_changer, carte_quete,
     secours_orbite) : on rejoue ici ce qu'il fait, avec les règles du jeu, pour comparer aux versions d'avant (qui
     n'appellent pas ces fonctions). L'arrivée reste posée par la page, comme avant. */
  { const rpc304 = sb.rpc;
    sb.rpc = (n, a) => {
      const rep = d => Promise.resolve({ data:d, error:null });
      if(n === "carte_changer"){
        const v = a.p_vers, de = etat.secteur || "silene";
        const type = (de === "ecart" && v === "ceres") || (de === "ceres" && v === "ecart") ? "gorge"
                   : (de === "silene" && v === "ancolie") || (de === "ancolie" && v === "silene") ? "ancolie" : "saut";
        const c = type === "gorge" ? coutSaut(true) : type === "ancolie" ? coutSautSurface(SURFACES.ancolie) : coutSaut();
        if(!c) return rep({ ok:false, err:"aucun" });
        if((etat.carburant || 0) < c.litres) return rep({ ok:false, err:"carburant", litres:c.litres, carburant:etat.carburant || 0 });
        return rep({ ok:true, type, litres:c.litres, cout_e:c.energie, carburant:Math.max(0, (etat.carburant || 0) - c.litres), reservoir:c.reservoir, de, secteur:v });
      }
      if(n === "carte_quete") return rep({ ok:true, secteur:a.p_carte });
      if(n === "secours_orbite"){
        const cloue = !!etat.vaisseau && vaisseauCloue(), sec = !!etat.vaisseau && !cloue && vaisseauSansRetour();
        if(etat.vaisseau && !cloue && !sec) return rep({ ok:false, err:"pas_de_secours" });
        const p25 = repPalier(typeof REP_PALIER_RAPATRIEMENT !== "undefined" ? REP_PALIER_RAPATRIEMENT : 25), cr = Math.max(0, etat.credits || 0);
        const frais = sec ? Math.floor(cr * (p25 ? SECOURS_SEC_PALIER : SECOURS_SEC)) : (!etat.vaisseau && p25) ? SECOURS_FRAIS_PALIER : SECOURS_FRAIS;
        const du = Math.min(frais, cr), d = { ok:true, cas: cloue ? "cloue" : sec ? "sec" : "sans", frais, du, solde:cr - du, palier:p25 };
        if(cloue) Object.assign(d, { vaisseau:etat.vaisseau, coque:Math.ceil(pvMax() * PV_REMORQUAGE), max:pvMax(), secteur: enCeres() ? "ceres" : "ecart" });
        else d.secteur = "silene";
        return rep(d);
      }
      return rpc304(n, a); }; }
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
      if(typeof initCredits === "function") initCredits(1000);   // v3.00 : aucun écart en attente (le remorquage passe par le serveur)
      prep();
      await secoursOrbite();
      out[rep < 25 ? "sans palier" : "palier 25"] = `${1000 - etat.credits} ₡`;
      out["journal " + (rep < 25 ? "sans" : "palier")] = journ[0];
    }
    r.secours[nom] = out;
  };
  r.secours = {};
  /* v3.00 (v302) : le remorquage d'un vaisseau cloué passe par coque_remorquage : on rejoue ce que fait le serveur. */
  const rpcS = sb.rpc;
  sb.rpc = (n, a) => { if(n !== "coque_remorquage") return rpcS(n, a);
    const du = Math.min(200, Math.max(0, etat.credits || 0));
    return Promise.resolve({ data:{ ok:true, vaisseau:etat.vaisseau, coque:Math.ceil(pvMax() * PV_REMORQUAGE), max:pvMax(), frais:200, du,
                                    solde:Math.max(0, (etat.credits || 0) - du) }, error:null }); };
  await cas("plus de vaisseau", () => { etat.vaisseau = null; vaisseauSansRetour = () => false; });
  await cas("à sec", () => { etat.vaisseau = vaisseau0 || "fab_vaisseau_cargo"; etat.vaisseauPv = {}; vaisseauSansRetour = () => true; });
  await cas("coque à zéro", () => { etat.vaisseau = vaisseau0 || "fab_vaisseau_cargo"; etat.vaisseauPv = { [etat.vaisseau]: 0 }; vaisseauSansRetour = () => false; });
  Object.assign(window, { enEspace: sauve.enEspace }); enEspace = sauve.enEspace; vaisseauSansRetour = sauve.vaisseauSansRetour; majApresDeplacement = sauve.majApresDeplacement;
  etat.vaisseau = vaisseau0; etat.vaisseauPv = JSON.parse(pv0); etat.secteur = "silene"; sb.rpc = rpcS;
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
