// v2.35 — Q35 « Ça passe » (K158, K159) : chaque étape se dessine ; aucun type repris de Q34 ;
// goupilles (« Verrou », « Taper ») et réaction se gagnent et se perdent avec leurs textes ; le
// message automatique (K158) ne nomme rien ; Asulf traduit ; le transat est un objet de quête LIÉ
// remis en récompense ; la quête se prend au Nid ; écriture, secrets, répétitions.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const q = queteData("q35"); r.existe = !!q; r.suitQ34 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q34")) + 1;
  const vraiQA = queteActive, vraiMQH = majQueteHub;
  const a = { id:"q35", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); document.body.appendChild(z);

  // 1. Les étapes.
  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // goupilles,reaction,attente,choix,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); _seqFin();
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q35/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // e2_cercles_bleus ×2, e2_base ×3
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ34 = [...types("q35")].filter(t => types("q34").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // goupilles,reaction

  // 2. Les goupilles : cinq verrous ; gagnées dans le vert (« Le cinquième verrou lâche. ») ; deux fêlures = échec.
  const dG = q.etapes[0].defi; a.etape = 0;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dG); _defiWire(z, dG); z.querySelector("#qj-goup-go").click();
  let M = QUETES_JEUX.goupilles._partie; const m0 = msgs.length;
  r.goupBouton = /Taper/.test(z.textContent) && /Verrou/.test(z.textContent);
  for(let k = 0; k < dG.nb; k++){ M.etat.pos = 0.5; M.coup(); }
  r.goupGagnees = ok === 1 && ko === 0 && msgs.slice(m0).includes("Le cinquième verrou lâche.");
  ok = 0; ko = 0; dernierEchec = ""; z.innerHTML = _defiHTML(dG); _defiWire(z, dG); z.querySelector("#qj-goup-go").click();
  M = QUETES_JEUX.goupilles._partie; M.etat.pos = 0.02; M.coup(); M.etat.pos = 0.02; M.coup();
  r.goupPerdues = ko === 1 && /se bloque tout à fait/.test(dernierEchec); M.arreter && M.arreter(); _seqFin();

  // 3. La réaction : la solution gagne ; deux essais ratés = échec (son texte).
  const dR = q.etapes[1].defi; a.etape = 1; a._qj = null;
  majQueteHub = () => { z.innerHTML = _defiHTML(dR); _defiWire(z, dR); }; majQueteHub();
  { const R = a._qj.R, N = R.w * R.h; let sol = null;
    for(let i = 0; i < N && !sol; i++) for(let j = i + 1; j < N && !sol; j++) for(let k = j + 1; k < N && !sol; k++){ const l = _reacAllume(R, [i, j, k]); if(R.bornes.every(b => l.has(b))) sol = [i, j, k]; }
    ok = 0; for(const i of sol) z.querySelector(`[data-reac="${i}"]`).dispatchEvent(new MouseEvent("click", { bubbles:true }));
    z.querySelector("#qj-reac-go").click(); r.reacGagnee = ok === 1; }
  ok = 0; ko = 0; dernierEchec = ""; a._qj = null; majQueteHub();
  for(let e = 0; e < 2; e++){ const S2 = a._qj; S2.choix = [0]; majQueteHub(); if(S2.R.bornes.every(b => _reacAllume(S2.R, [0]).has(b))) break; z.querySelector("#qj-reac-go").click(); }
  r.reacPerdue = ko === 1 && /clignotent à moitié/.test(dernierEchec) && /8 h/.test(dernierEchec);
  majQueteHub = vraiMQH;
  r.messageAutomatique = /défilent bien trop vite/.test(dR.reussite.join(" ")) && /vers Maar/.test(dR.reussite.join(" "));

  // 4. Attente (30 min), choix (ordre du serveur v255), récompense : le transat, objet lié.
  r.attenteMs = q.etapes[2].defi.duree;                                                 // 1800000
  r.cercles = q.etapes[3].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");   // langues,veilleurs,racines
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 3
  r.recompense = q.recompense;
  r.transat = { objet: !!item("transat"), nom: item("transat") && item("transat").nom, lie: estObjetLie("transat"),
                icone: /transat\.png/.test(iconeItem("transat")) && /<svg/.test(iconeItem("transat")),
                rendu: queteData("q35").etapes[4].arrivee.join(" ").includes("Elle est pour Asulf") };
  r.boutureToujoursLiee = estObjetLie("bouture");

  // 5. Au Nid : prise après Q34 ; lendemain ; pas ailleurs.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id;                                // q35
  r.priseNid = _priseIci(q); majHub(); changerHub("quete");
  let hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /Aruns et Dagon — Le Nid/.test(hz) && /Ça passe/.test(hz) && /Accepter la quête/.test(hz);
  etat.quetes.finJour = { q34: jourDeJeu() }; majQueteHub(); hz = document.querySelector("#hub-quete").innerHTML;
  r.lendemain = /ronfle, très fort/.test(hz) && !/Accepter la quête/.test(hz);
  etat.quetes.finJour = {}; const C = espaceLieu("e2_cercles_bleus"); etat.posEspace = { x:C.x, y:C.y };
  r.priseCouronne = !_priseIci(q);

  // 6. Écriture : le joueur ne parle pas entre guillemets ; seul Asulf a des répliques (il parle notre langue).
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","libelle"].includes(k)) tour(v); }); };
  tour(q); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.repliques = (tout.match(/«[^»]*»/g) || []).length;                                   // Asulf seulement
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux","levée"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.nbSons = Object.keys(GLYPHES_ANCIEN).length;                                         // 38
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  const VOULU = new Set(["sonde qui mange"]);   // Asulf bafouille en traduisant
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !VOULU.has(t) && !/tentative dans/.test(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
