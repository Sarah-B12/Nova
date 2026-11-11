// v2.34 — Q34 « La Lanterne » (K157) : chaque étape se dessine et se branche ; aucun type repris
// de Q33 ; la traversée (écrans thermiques, consigne et fin propres) et les calques (échec propre)
// se gagnent et se perdent ; Q22 / Q19 / Q25 gardent leurs textes ; la quête se prend au Nid,
// après Q33 ; personne à bord (Aruns consigné, Dagon à la radio) ; écriture, secrets, répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q34"); r.existe = !!q; r.suitQ33 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q33")) + 1;
  const vraiQA = queteActive;
  const a = { id:"q34", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  // 1. Les étapes.
  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // traversee,calques,attente,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._trav = null; a._calq = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q34/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // e2_etoile_bleue ×4, e2_base
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ33 = [...types("q34")].filter(t => types("q33").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // calques (v2.76 : la traversée est rejouable, K241)

  // 2. La traversée : sa consigne (écrans thermiques), sa fin (« Tu es assez près. ») et son échec.
  const dT = q.etapes[0].defi, C = dT.colonnes, L = dT.lignes; a.etape = 0;
  a._trav = null; z.innerHTML = _defiHTML(dT); _defiWire(z, dT);
  r.travConsigne = /écrans thermiques/.test(z.textContent) && !/poser le pied|plaques de protection/.test(z.textContent);
  const autre = queteData("q22").etapes.find(e => e.defi.type === "traversee").defi;
  { a.id = "q22"; a._trav = null; const zz = document.createElement("div"); zz.innerHTML = _defiHTML(autre); r.q22Consigne = /plaques de protection/.test(zz.textContent) && /poser le pied/.test(zz.textContent); a.id = "q34"; }
  // gagner : tout le sûr déjà vu sauf une case du bord du haut
  let g, haut = -1;
  for(let k = 0; k < 200 && haut < 0; k++){ g = _travGenerer(C, L, dT.lave);
    for(let i = 0; i < C; i++) if(!g.lave[i] && _travVoisins(i, C, L).some(n => n >= C && !g.lave[n])){ haut = i; break; } }
  const surs = [...Array(C * L).keys()].filter(i => !g.lave[i] && i !== haut && i >= C);
  ok = 0; a._trav = { lave:g.lave, vus:surs, marques:[], plaques:3 }; z.innerHTML = _defiHTML(dT); _defiWire(z, dT);
  const m0 = msgs.length; z.querySelector(`#q-trav-grille [data-i="${haut}"]`).click();
  r.travGagne = ok === 1 && msgs.slice(m0).includes("Tu es assez près.");
  // perdre : dernier écran, une erreur évitable
  let perdu = false;
  for(let k = 0; k < 400 && !perdu; k++){ const h = _travGenerer(C, L, dT.lave), t = { lave:h.lave, vus:[h.depart], marques:[], plaques:1 };
    const acc = i => !t.vus.includes(i) && _travVoisins(i, C, L).some(n => t.vus.includes(n) && !t.lave[n]);
    for(let pas = 0; pas < 40 && !perdu; pas++){       // on avance au hasard sur le sûr, jusqu'à une erreur évitable
      const cand = [...Array(C * L).keys()].filter(acc), lave = cand.find(i => t.lave[i]), sures = cand.filter(i => !t.lave[i] && i >= C);
      if(lave !== undefined && _travCaseSureExiste(C, L, t.lave, t.vus)){
        ko = 0; dernierEchec = ""; a._trav = t; z.innerHTML = _defiHTML(dT); _defiWire(z, dT);
        z.querySelector(`#q-trav-grille [data-i="${lave}"]`).click(); perdu = true; break; }
      if(!sures.length) break; t.vus.push(sures[Math.floor(Math.random() * sures.length)]); } }
  // v2.76 (K241) : plus de verrou — la dernière protection perdue, une NOUVELLE grille tout de suite, le message au journal.
  r.travPerdu = ko === 0 && a._trav && a._trav.vus.length === 1 && a._trav.plaques === dT.plaques
             && msgs.some(m => /écran thermique cède/.test(m) && /tout est à refaire/.test(m));

  // 3. Les calques : les trois noms ; la bonne position gagne ; la dernière vérification ratée = son échec.
  const dC = q.etapes[1].defi; a.etape = 1;
  const calq = (juste) => { a._calq = null; ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _htmlCalques(dC); _wireCalques(z, dC); const c = a._calq;
    const bouton = !!z.querySelector("[data-qc-inv]");
    if(juste){ c.oB = c.solB; c.oC = c.solC; if(bouton) c.inv = true; } else { c.oB = (c.solB + 3) % 7; c.essais = CALQ_ESSAIS - 1; }
    z.querySelector("#q-calq-ok").click(); return { bouton }; };
  r.calqNoms = ["Les pulsations de La Lanterne","La fenêtre de la pièce","Ta rotation"].every(n => (z.innerHTML = _htmlCalques(dC), z.textContent.includes(n)));
  const cg = calq(true); r.calqGagne = ok === 1; r.calqRetournable = cg.bouton;
  calq(false); r.calqPerdu = ko === 1 && /fenêtre de la pièce reste noire/.test(dernierEchec) && /8 h/.test(dernierEchec);

  // 4. L'attente, le choix (ordre du serveur v254), la récompense.
  r.attenteMs = q.etapes[2].defi.duree;                                                 // 3600000
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // veilleurs,eclats,langues
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3
  r.recompense = q.recompense;

  // 5. Au Nid : la quête se prend après Q33 ; le lendemain : Dagon ronfle ; ailleurs, non.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id;                                // q34
  r.priseNid = _priseIci(q); majHub(); changerHub("quete");
  let hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /Aruns et Dagon — Le Nid/.test(hz) && /La Lanterne/.test(hz) && /Accepter la quête/.test(hz);
  etat.quetes.finJour = { q33: jourDeJeu() }; majQueteHub(); hz = document.querySelector("#hub-quete").innerHTML;
  r.lendemain = /ronfle, très fort/.test(hz) && !/Accepter la quête/.test(hz);
  etat.quetes.finJour = {}; const S = espaceLieu("e2_etoile_bleue"); etat.posEspace = { x:S.x, y:S.y };
  r.priseLanterne = !_priseIci(q);                                                       // vrai

  // 6. Écriture.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","icone","noms"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.guillemets = tout.match(/«[^»]*»/g) || [];                                           // []
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.sonsConnus = ["RE","LAI","TOUR"].every(s => GLYPHES_ANCIEN[s]); r.nbSons = Object.keys(GLYPHES_ANCIEN).length;   // vrai, 38
  r.personneABord = !/Aruns (monte|entre|sort) (à bord|de la soute)/.test(tout);
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
