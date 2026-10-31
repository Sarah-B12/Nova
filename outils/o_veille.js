// v2.09 — La veille (node outils/o_banc.js .. veille). Le serveur est imité ; on compare
// l'ANCIENNE minute (dix appels) et la VEILLE (un appel) sur les mêmes données.
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  etat.faction = etat.faction || "ignis"; etat.annonceFactionVue = null; etat.prisonJusqua = 0;
  // ---------- les mêmes données serveur, sous deux formes ----------
  const SAC = { sac:{ cendrite:2, sporelle:1 }, capacite:50, utilise:3, coffre:{}, coffre_capacite:50, coffre_utilise:0,
                soute:{}, soute_capacite:20, soute_utilise:0, equipe:{}, equipe_capacite:6, equipe_utilise:0, force_combat:10,
                lots:[{ item:"cendrite", lieu:"sac", qte:2, acquis:Date.now()-86400000 }, { item:"sporelle", lieu:"sac", qte:1, acquis:Date.now()-3600000 }] };
  const EFFETS = { xp:5, sante:-10, moral:-5, energie:-8, cristaux:2, xp_total:105 };
  const EVS = [{ texte:"Voleur t'a fait les poches : 1× cendrite.", cat:"alerte", quand:new Date().toISOString() }];
  const ANNONCE = { cree_le:new Date().toISOString(), texte:"Réunion ce soir" };
  const PRISON = { en_prison:false };
  const N = { messages:2, amis:1, defis:1, boite:3, poste:2 };
  let appels = [], effetsDispo, evsDispo, veilleRep = null, veilleErr = null, pendant = null;
  const fauxFrom = table => {
    const f = { _eq:{}, select(){ return f; }, eq(k, v){ f._eq[k] = v; return f; }, or(){ return f; }, order(){ return f; }, limit(){ return f; },
      maybeSingle(){ return f; }, then(ok, ko){
        appels.push("from:" + table);
        let res = { data:null, error:null, count:0 };
        if(table === "messages") res.count = ("lu" in f._eq) ? N.messages : N.boite;
        if(table === "amis") res.count = N.amis;
        if(table === "arene_defis") res.count = N.defis;
        if(table === "poste") res.count = N.poste;
        if(table === "annonce_faction") res.data = ANNONCE;
        return Promise.resolve(res).then(ok, ko); } };
    return f;
  };
  const rpc0 = sb.rpc.bind(sb), from0 = sb.from.bind(sb);
  sb.from = t => ["messages","amis","arene_defis","poste","annonce_faction"].includes(t) ? fauxFrom(t) : from0(t);
  sb.rpc = (n, a) => {
    appels.push("rpc:" + n);
    let d = undefined, error = null;
    if(n === "veille"){ appels.push("empreinte:" + a.p_empreinte);
      if(pendant) pendant();
      if(veilleErr) return Promise.resolve({ data:null, error:veilleErr });
      d = veilleRep(); }
    else if(n === "consommer_effets"){ d = effetsDispo; effetsDispo = { xp:0, sante:0, moral:0, energie:0, cristaux:0, xp_total:105 }; }
    else if(n === "consommer_evenements"){ d = evsDispo; evsDispo = []; }
    else if(n === "mon_etat_prison") d = PRISON;
    else if(n === "sac_lire") d = SAC;
    else if(n === "poste_purge") d = null;
    else if(n === "agir"){ d = { ok:true, ajoutes:(a.p_ajouter||{}), etat:null, energie:etat.energie, jauges:etat.jauges }; }
    else if(n === "sauver_profil") d = { ok:true };
    else return rpc0(n, a);
    return Promise.resolve({ data:d, error });
  };
  const lignes = []; const vrai = journal; journal = (t, ...x) => { lignes.push(String(t)); return vrai(t, ...x); };
  const photo = () => ({ badges:[_notifMsg, _notifAmis, _notifDefis], poste:_postePrec,
    gouv:(document.querySelector('#hub-centre [data-centre="gouvernement"]')||{}).innerHTML || "",
    sac:JSON.stringify(etat.sac), prison:etat.prisonJusqua || 0,
    journal:lignes.filter(l => /poches|Séquelles|Expérience|Cristal|courrier|envoi/.test(l)).sort().join(" | ") });   // l'ancienne minute lançait ses appels en parallèle : l'ordre d'arrivée y était au hasard
  const remettre = () => { effetsDispo = { ...EFFETS }; evsDispo = EVS.map(x => ({ ...x })); _postePrec = -1; _notifMsg = _notifAmis = _notifDefis = 0;
    etat.sac = {}; lignes.length = 0; appels = []; _sacEmpreinte = null; _veilleHS = false; veilleErr = null; pendant = null; };
  // ---------- 1. l'ancienne minute ----------
  remettre(); await _veilleAncienne(); await att(200);
  r.ancienne = { requetes: appels.filter(a => !a.startsWith("empreinte") && a !== "rpc:agir" && a !== "rpc:sauver_profil").length, ...photo() };
  // ---------- 2. la veille, mêmes données ----------
  remettre();
  veilleRep = () => ({ ok:true, prison:PRISON, effets:effetsDispo, evenements:evsDispo, sac:SAC, empreinte:"e1",
                       notifs:{ messages:N.messages, amis:N.amis, defis:N.defis, boite:N.boite }, poste:N.poste, annonce:ANNONCE });
  await veilleMinute(); await att(200);
  r.veille = { requetes: appels.filter(a => !a.startsWith("empreinte") && a !== "rpc:agir" && a !== "rpc:sauver_profil").length, ...photo() };
  r.identiques = ["badges","poste","gouv","sac","prison","journal"].filter(k => JSON.stringify(r.ancienne[k]) !== JSON.stringify(r.veille[k]));
  r.identiques = r.identiques.length ? "DIFFÉRENCES : " + r.identiques.join(", ") : "oui, en tout point";
  r.agirMemesEffets = "les effets passent par agir() dans les deux cas";
  // ---------- 3. empreinte : renvoyée, puis effacée par une action ----------
  appels = []; const sacAvant = JSON.stringify(etat.sac);
  veilleRep = () => ({ ok:true, prison:PRISON, effets:{ xp:0 }, evenements:[], sac:null, empreinte:"e1", notifs:N, poste:N.poste, annonce:ANNONCE });
  await veilleMinute();
  r.empreinte = { envoyee: appels.includes("empreinte:e1"), sacGarde: JSON.stringify(etat.sac) === sacAvant };
  _appliquerEtatStocks({ ...SAC, sac:{ cendrite:1 } });            // une action renvoie un sac
  appels = []; await veilleMinute();
  r.empreinte.effaceeParUneAction = appels.includes("empreinte:null");
  // ---------- 4. une action PENDANT la veille : la lecture est périmée, on ne l'applique pas ----------
  _sacEmpreinte = null; appels = [];
  veilleRep = () => ({ ok:true, prison:PRISON, effets:{ xp:0 }, evenements:[], sac:{ ...SAC, sac:{ vieux:9 } }, empreinte:"e9", notifs:N, poste:N.poste, annonce:ANNONCE });
  pendant = () => _appliquerEtatStocks({ ...SAC, sac:{ neuf:1 } });
  await veilleMinute(); pendant = null;
  r.perimee = { garde: JSON.stringify(etat.sac) === JSON.stringify({ neuf:1 }), empreinte: _sacEmpreinte };
  // ---------- 5. pannes : on retombe sur l'ancienne minute ----------
  remettre(); veilleErr = { message:"Failed to fetch" };
  await veilleMinute(); await att(200);
  r.panneReseau = { ancienne: appels.includes("rpc:sac_lire") && appels.includes("rpc:consommer_evenements") && appels.includes("from:messages"),
                    veilleGardee: !_veilleHS, journal: lignes.some(l => /poches/.test(l)) };
  remettre(); veilleErr = { code:"PGRST202", message:"Could not find the function public.veille(p_empreinte, p_faction) in the schema cache" };
  await veilleMinute(); await att(200); const premier = appels.length;
  appels = []; veilleErr = null; await veilleMinute(); await att(200);
  r.migrationAbsente = { ancienne: premier > 5, plusDeVeilleEnsuite: !appels.includes("rpc:veille") && appels.includes("rpc:sac_lire") };
  // ---------- 6. l'ordre : le journal avant le sac ----------
  remettre(); const ordre = [];
  const ap = _appliquerEtatStocks; _appliquerEtatStocks = (e, o) => { if(o && o.veille) ordre.push("sac de la veille"); return ap(e, o); };
  const ev = _evenementsAppliquer; _evenementsAppliquer = async x => { ordre.push("journal"); return ev(x); };
  veilleRep = () => ({ ok:true, prison:PRISON, effets:effetsDispo, evenements:evsDispo, sac:SAC, empreinte:"e1", notifs:N, poste:N.poste, annonce:ANNONCE });
  await veilleMinute(); _appliquerEtatStocks = ap; _evenementsAppliquer = ev;
  r.ordre = ordre.join(" puis ");
  // ---------- 7. le rythme ----------
  r.relectures = _RYTHME.map(x => `${x.nom}:${x.periode / 1000}s${x.auRetour ? "+retour" : ""}`);
  journal = vrai; sb.rpc = rpc0; sb.from = from0;
  return r;
})();
