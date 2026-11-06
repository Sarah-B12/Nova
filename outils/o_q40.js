// v2.40 — Q40 « La fête du passage » (K165) : le transat rendu à La Toundra (RPC transat_rendre,
// la bouture inchangée) ; labyrinthe ; mémoire (ANNULÉE, son échec) ; le choix ; les deux dernières
// étapes le dimanche (`cible.dimanche`, texte « La fête est dimanche ») ; écriture ; répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q40"); r.existe = !!q; r.suitQ39 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q39")) + 1;
  const vraiQA = queteActive, vraiFug = fugueuseLa, vraiAv = avancerQuete;
  const a = { id:"q40", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);
  fugueuseLa = () => true;

  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // scene,labyrinthe,memoire,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._lab = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         if(!_cibleResolue(e.cible)) r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q40/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.cartes = q.etapes.map(e => _cibleResolue(e.cible).carte).join(",");                 // silene,ancolie,ancolie,ceres,ceres
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ39 = [...types("q40")].filter(t => types("q39").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // memoire

  // 1. Le transat rendu : la scène appelle transat_rendre, puis avance ; la bouture appelle toujours bouture_rendre.
  const appels = []; const vraiRpc = sb.rpc, vraiSauve = typeof sauverSurServeur === "function" ? sauverSurServeur : null, vraiStocks = typeof chargerStocksServeur === "function" ? chargerStocksServeur : null;
  let avance = 0; avancerQuete = () => { avance++; };
  sb.rpc = async (n) => { appels.push(n); return { data:{ ok:true, rendues:1 }, error:null }; };
  sauverSurServeur = async () => {}; chargerStocksServeur = async () => {};
  const scene = async d => { z.innerHTML = _defiHTML(d); _defiWire(z, d); z.querySelector("#q-scene").click(); await new Promise(x => setTimeout(x, 30)); };
  const m0 = msgs.length; a.etape = 0; await scene(q.etapes[0].defi);
  r.transatRendu = appels[0] === "transat_rendre" && avance === 1 && msgs.slice(m0).includes("Tu as rendu le transat à Asulf.");
  const dB = queteData("q15").etapes.find(e => e.defi && e.defi.rendre === "bouture"); 
  if(dB){ await scene(dB.defi); r.boutureInchangee = appels[1] === "bouture_rendre" && msgs.includes("Tu as rendu la bouture à Adaya."); } else r.boutureInchangee = "pas d'étape bouture trouvée";
  sb.rpc = async () => ({ data:{ ok:false, err:"hors_quete" }, error:null }); avance = 0; await scene(q.etapes[0].defi);
  r.refusSansAvancer = avance === 0 && msgs.some(m => /progression n'est pas encore enregistrée/.test(m));
  sb.rpc = vraiRpc; if(vraiSauve) sauverSurServeur = vraiSauve; if(vraiStocks) chargerStocksServeur = vraiStocks; avancerQuete = vraiAv;

  // 2. La mémoire : « annulée » (et ses variantes) gagne ; une autre réponse perd, avec son texte.
  const dM = q.etapes[2].defi; a.etape = 2;
  r.memoireInfo = dM.info.some(l => l === "MAAR — CORRESPONDANCE : ANNULÉE — DOSSIER CLASSÉ — MOTIF : [masqué]");
  // la mémoire montre d'abord l'écran, puis la question (`a._memVue`) : on passe directement à la question
  const repondre = t => { a._memVue = true; z.innerHTML = _defiHTML(dM); _defiWire(z, dM); z.querySelector("#q-mem-champ").value = t; z.querySelector("#q-mem-btn").click(); };
  r.memoireQuestion = (() => { a._memVue = true; return /Alors \? La correspondance/.test(_defiHTML(dM)); })();
  ok = 0; ko = 0; repondre("Annulée"); const g1 = ok;
  ok = 0; repondre("annulee"); const g2 = ok;
  ok = 0; ko = 0; dernierEchec = ""; repondre("reportée");
  r.memoire = { accent: g1 === 1, sansAccent: g2 === 1, perdue: ko === 1 && /très mollement/.test(dernierEchec) };

  // 3. Le choix (ordre du serveur v260), la récompense.
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // racines,veilleurs,langues
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3
  r.recompense = q.recompense;

  // 4. Le dimanche : la fête (étapes 4 et 5) au Nid, pas en semaine ; les étapes 1 → 3 tous les jours.
  const N = espaceLieu("e2_base"); etat.secteur = "ceres"; etat.ceres = true; etat.posEspace = { x:N.x, y:N.y };
  a.etape = 3; fugueuseLa = () => false;
  r.semaine = { atteinte: !surSiteQuete(), etoile: _ptsQuete(etapeActive()).length === 0, texte: /La fête est dimanche/.test(_objectifCarteTexte()) };   // vrai ×3
  fugueuseLa = () => true;
  r.dimanche = { atteinte: surSiteQuete(), etoile: _ptsQuete(etapeActive()).length === 1 };                                                               // vrai ×2
  fugueuseLa = () => false; a.etape = 1; r.archivesEnSemaine = _ptsQuete(etapeActive()).length === 1;                                                    // vrai

  // 5. La prise au Nid.
  queteActive = vraiQA; fugueuseLa = vraiFug;
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.radioGorge = true; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNid = _priseIci(q);     // q40, vrai
  majHub(); changerHub("quete"); r.banniere = /La fête du passage/.test(document.querySelector("#hub-quete").innerHTML);

  // 6. Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","rendre","reponses","info"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques|répètes)[^.«]*«)/i.test(tout);   // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée","cill"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.dagonRit = tout.split(/(?<=[.!?])\s+/).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
