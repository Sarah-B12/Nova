// v2.38 — Q38 « Le passage » (K162) : la Fugueuse le dimanche (jour de jeu, Paris) — dessinée,
// atteignable et repérée seulement ce jour-là ; le texte « Elle repasse dimanche » ; Q38 se prend
// n'importe quel jour ; piratage (sa fin, son échec) et cadenas (son échec) ; la balise (AUCUNE) ;
// la correction de la testeuse en Q37 ; écriture, Dagon ne rit pas, répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x => setTimeout(x, ms));
  const q = queteData("q38"); r.existe = !!q; r.suitQ37 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q37")) + 1;
  const vraiQA = queteActive, vraiFug = fugueuseLa;
  const a = { id:"q38", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  // 1. Le dimanche, heure de Paris (6 novembre 2026 = vendredi).
  const P = s => Date.parse(s);
  r.dimanche = { dim8_midi: vraiFug(P("2026-11-08T11:00:00Z")), lun9: vraiFug(P("2026-11-09T11:00:00Z")),
    sam7_23h30_UTC_dimParis: vraiFug(P("2026-11-07T23:30:00Z")), dim8_23h30_UTC_lunParis: vraiFug(P("2026-11-08T23:30:00Z")),
    ven6: vraiFug(P("2026-11-06T12:00:00Z")) };                                          // vrai, faux, vrai, faux, faux

  // 2. Les étapes (un dimanche).
  fugueuseLa = () => true;
  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // piratage,cadenas,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._cadSecret = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q38/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // e2_comete ×3, e2_base
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ37 = [...types("q38")].filter(t => types("q37").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // piratage,cadenas

  // 3. Le piratage (rattraper la comète) : « Tes patins touchent la glace. » ; deux ratés → son échec.
  const dP = Object.assign({}, q.etapes[0].defi, { vitesse:4000 }); a.etape = 0;
  async function pirater(juste){
    ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dP); _defiWire(z, dP); const m0 = msgs.length;
    const zone = z.querySelector("#q-pir-zone"), cur = z.querySelector("#q-pir-curseur"), stop = z.querySelector("#q-pir-stop");
    for(let k = 0; k < 8000 && !ok && !ko; k++){
      await att(5); const p = parseFloat(cur.style.left) || 0, g = parseFloat(zone.style.left), w = parseFloat(zone.style.width);
      const dedans = p >= g + 0.5 && p <= g + w - 0.5;
      if(juste ? dedans : (!dedans && (p < g - 3 || p > g + w + 3))) stop.click();
    }
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
    return { ok, ko, msg:dernierEchec, fin: msgs.slice(m0).includes("Tes patins touchent la glace.") };
  }
  const pG = await pirater(true), pP = await pirater(false);
  r.piratage = { gagne: pG.ok === 1 && pG.fin, perdu: pP.ko === 1 && /« Je l'avais dit »/.test(pP.msg) };

  // 4. Le cadenas : le bon code gagne ; 8 mauvais essais → son échec ; Q27 garde le sien.
  const dK = q.etapes[1].defi; a.etape = 1;
  const essayer = code => { z.querySelectorAll(".q-cad-slot").forEach((s, i) => { s.value = code[i]; }); z.querySelector("#q-cad-go").click(); };
  ok = 0; a._cadSecret = null; z.innerHTML = _defiHTML(dK); _defiWire(z, dK); essayer(a._cadSecret); r.cadenasGagne = ok === 1;
  ko = 0; dernierEchec = ""; a._cadSecret = null; z.innerHTML = _defiHTML(dK); _defiWire(z, dK);
  const faux = a._cadSecret.map(s => dK.symboles.find(x => x !== s));
  for(let k = 0; k < dK.essais && !ko; k++){ z.innerHTML = _defiHTML(dK); _defiWire(z, dK); essayer(faux); }
  r.cadenasPerdu = ko === 1 && /givre fin recouvre les signes/.test(dernierEchec);
  r.cadenasSignes = dK.symboles.join(" ");
  r.balise = /BALISE HORAIRE — CULTURES/.test(dK.reussite.join(" ")) && /PROCHAINE CORRESPONDANCE : AUCUNE/.test(dK.reussite.join(" "));

  // 5. Le choix (ordre du serveur v258), la récompense.
  r.cercles = q.etapes[2].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // racines,veilleurs,langues
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 2
  r.recompense = q.recompense;

  // 6. Sur la carte : la comète dessinée et atteignable le dimanche seulement ; ★ et texte de la quête.
  queteActive = () => a; a.etape = 0; a._sur = false;
  etat.secteur = "ceres"; etat.ceres = true; const C = espaceLieu("e2_comete"); etat.posEspace = { x:C.x, y:C.y };
  fugueuseLa = () => true;
  r.dim = { carte: carteEspace("ceres").lieux().some(l => l.id === "e2_comete"), atteinte: surSiteQuete(), etoile: _ptsQuete(etapeActive()).length,
            texte: !/repasse dimanche/.test(_objectifCarteTexte()) };                                   // vrai, vrai, 1, vrai
  fugueuseLa = () => false;
  r.semaine = { carte: !carteEspace("ceres").lieux().some(l => l.id === "e2_comete"), atteinte: !surSiteQuete(), etoile: _ptsQuete(etapeActive()).length === 0,
                texte: /Elle n'est pas là\. Elle repasse dimanche/.test(_objectifCarteTexte()), autresLieux: carteEspace("ceres").lieux().length === ESPACE2_LIEUX.length - 1,
                triptoleme: carteEspace("ecart").lieux().length === ESPACE_LIEUX.length };          // tout vrai
  a.etape = 3; r.semaineNidOk = surSiteQuete() === false && _ptsQuete(etapeActive()).length === 1;  // l'étape au Nid ne dépend pas du dimanche
  r.carteCeres = /carte de Cérès/.test((() => { const s = etat.posEspace; etat.posEspace = { x:0, y:0 }; const t = _objectifCarteTexte(); etat.posEspace = s; return t; })());

  // 7. La prise au Nid, n'importe quel jour (ici : en semaine).
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.radioGorge = true; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id; r.priseNidEnSemaine = _priseIci(q);   // q38, vrai
  majHub(); changerHub("quete"); r.banniere = /Le passage/.test(document.querySelector("#hub-quete").innerHTML) && /Accepter la quête/.test(document.querySelector("#hub-quete").innerHTML);
  fugueuseLa = vraiFug;

  // 8. La correction de la testeuse (Q37).
  r.q37Testeuse = queteData("q37").etapes[4].arrivee.join(" ").includes("Ses tresses s'allument follement, puis s'éteignent brusquement") && queteData("q37").etapes[4].arrivee.join(" ").includes("faussement désinvolte alors que son regard brille");

  // 9. Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","symboles"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.dagonRit = tout.split(/(?<=[.!?])\s+/).filter(p => /Dagon(,| )[^.]{0,40}\b(rit|éclate|riant)\b/.test(p));   // []
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
