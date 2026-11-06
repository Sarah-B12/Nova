// v2.33 — Q33 « L'encoche » (K156) : chaque étape se dessine et se branche ; aucun type repris
// de Q32 ; le brouillage (ici « passage ») et la ronde se gagnent et se perdent ; le nœud se
// joue ; le choix « compétence » (Racines / Éclats / Veilleurs) ; la quête se prend AU NID, le
// lendemain de Q32 (Dagon fait semblant de ronfler) ; aucun son nouveau ; règles d'écriture,
// secrets, répétitions. Tout ce qui est noté « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x => setTimeout(x, ms));
  const q = queteData("q33"); r.existe = !!q; r.suitQ32 = QUETES.indexOf(q) === QUETES.indexOf(queteData("q32")) + 1;
  const vraiQA = queteActive, vraiMQH = majQueteHub;
  const a = { id:"q33", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  sauverMaintenant = async () => {}; const msgs = []; journal = (m) => msgs.push(String(m));
  let ok = 0, ko = 0, dernierEchec = ""; const vraiR = reussirDefi, vraiE = echouerDefi;
  reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  const z = document.createElement("div"); z.setAttribute("data-qj-zone", ""); document.body.appendChild(z);

  // 1. Les étapes : rendu, cibles (La Couronne, puis le Nid), images ; pas de type de Q32.
  r.types = q.etapes.map(e => e.defi.type).join(",");                                   // brouillage,choix,ronde,noeud,scene
  q.etapes.forEach((e, i) => { a.etape = i; a._qj = null;
    try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi); _seqFin();
         if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${i} : épreuve inconnue ${e.defi.type}`);
         const c = _cibleResolue(e.cible); if(!c || c.carte !== "ceres") r.erreurs.push(`${i} : cible`);
         if(e.image !== `images/quetes/q33/${i+1}.png`) r.erreurs.push(`${i} : image ${e.image}`);
    }catch(err){ r.erreurs.push(`${i} : ${err.message}`); } });
  r.lieux = q.etapes.map(e => e.cible.lieu).join(",");                                  // e2_cercles_bleus ×4, e2_base
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));
  r.repetitionAvecQ32 = [...types("q33")].filter(t => types("q32").has(t));             // []
  r.ratables = q.etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).map(e => e.defi.type).join(",");   // brouillage,ronde

  // 2. Le brouillage : « passage » à la place de « appel » ; gagné en suivant l'onde, perdu sinon.
  const dB = q.etapes[0].defi; a.etape = 0;
  z.innerHTML = _defiHTML(dB); r.brouLibelle = /60 s de passage/.test(z.innerHTML) && /passage : 60 s/.test(z.innerHTML) && !/appel/i.test(z.textContent) && /Chercher le Nid à la radio/.test(z.innerHTML);
  r.q29Inchangee = (() => { const h = _defiHTML(queteData("q29").etapes[1].defi); return /60 s d'appel/.test(h) && /appel : 60 s/.test(h); })();
  async function brouiller(suivre, duree){
    ok = 0; ko = 0; dernierEchec = ""; const d = Object.assign({}, dB, { duree, tenir:1 });
    z.innerHTML = _defiHTML(d); _defiWire(z, d); z.querySelector("#qj-br-go").click();
    const P = QUETES_JEUX.brouillage._partie;
    if(suivre) P.regler(P.fc + 0.05, null);
    for(let k = 0; k < 300 && !ok && !ko; k++){ await att(30); if(suivre) P.regler(null, P.cible.d); }
    _seqFin(); return { ok, ko, msg:dernierEchec };
  }
  const bG = await brouiller(true, 20), bP = await brouiller(false, 1);
  r.brouillage = { gagne: bG.ok === 1, perdu: bP.ko === 1 && /chuintement/.test(bP.msg) && /8 h/.test(bP.msg) };

  // 3. Le choix « compétence » : trois Cercles, dans l'ordre du serveur (v253).
  r.cercles = q.etapes[1].defi.options.map(o => Object.keys(o.cercles)[0]).join(",");  // racines,eclats,veilleurs
  r.etapeChoix = q.etapes.findIndex(e => e.defi.type === "choix");                      // 1

  // 4. La ronde : la bonne case gagne, une mauvaise perd (son texte, 8 h).
  const dR = q.etapes[2].defi; a.etape = 2;
  majQueteHub = () => { if(_seqEnCours()) return; _clearQ(); z.innerHTML = _defiHTML(dR); _defiWire(z, dR); };
  async function ronde(juste){
    ok = 0; ko = 0; a._qj = null; majQueteHub(); z.querySelector("#qj-ronde-go").click();
    await att(dR.observe * 650 + 400); const R = a._qj;
    R.boucles.forEach((b, j) => { const bonne = b[(R.t + dR.avance) % b.length];
      const c = (juste || j > 0) ? bonne : (bonne + 1) % 36; z.querySelector(`[data-qr="${c}"]`).click(); });
    return { ok, ko, msg:dernierEchec };
  }
  const rG = await ronde(true), rP = await ronde(false);
  r.ronde = { gagne: rG.ok === 1, perdu: rP.ko === 1 && /pointe passe/.test(rP.msg) && /8 h/.test(rP.msg), nom: dR.nom };
  majQueteHub = vraiMQH;

  // 5. Le nœud : se dessine (trois tracés) ; non ratable.
  const dN = q.etapes[3].defi; a.etape = 3; a._qj = null; z.innerHTML = _defiHTML(dN); _defiWire(z, dN);
  r.noeud = { dessine: !!z.querySelector("svg, canvas"), ratable: DEFIS_UNTRY.has("noeud") };   // vrai, faux
  r.recompense = q.recompense;

  // 6. Au Nid : la quête se prend après Q32 ; le lendemain, Dagon ronfle ; ailleurs, la radio.
  queteActive = vraiQA; const N = espaceLieu("e2_base");
  etat.quetes = { done: QUETES.slice(0, QUETES.indexOf(q)).map(x => x.id), active:null, verrous:{}, finJour:{} };
  etat.nidOuvert = true; etat.ceres = true; etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y };
  r.prochaine = queteProchaine() && queteProchaine().id;                                // q33
  r.priseNid = _priseIci(q); majHub();
  const vis = h => [...document.querySelectorAll(".hub-lien")].some(b => b.dataset.hub === h && b.style.display !== "none");
  r.onglets = { quete: vis("quete"), boutique: vis("boutique") };                       // vrai, vrai
  changerHub("quete"); let hz = document.querySelector("#hub-quete").innerHTML;
  r.banniere = /Aruns et Dagon — Le Nid/.test(hz) && /L'encoche/.test(hz) && /Accepter la quête/.test(hz);
  etat.quetes.finJour = { q32: jourDeJeu() }; majQueteHub(); hz = document.querySelector("#hub-quete").innerHTML;
  r.lendemain = /ronfle, très fort/.test(hz) && !/Accepter la quête/.test(hz);
  etat.quetes.finJour = {};
  const C = espaceLieu("e2_cercles_bleus"); etat.posEspace = { x:C.x, y:C.y };
  r.priseCouronne = !_priseIci(q);                                                       // vrai : seulement au Nid
  a.etape = 0; queteActive = () => a; r.surSiteCouronne = surSiteQuete(); queteActive = vraiQA;   // vrai

  // 7. Écriture : K68, K53, secrets, langue (lot 1), aucun son nouveau, répétitions.
  const textes = []; const tour = o => { if(typeof o === "string") textes.push(o); else if(Array.isArray(o)) o.forEach(tour); else if(o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if(!["image","donneurImg","donneurRepli","lieuPrise","id","type","cible","nom","motDuree"].includes(k)) tour(v); }); };
  tour(q); textes.push(LENDEMAIN_VOIX["Aruns et Dagon"]); const tout = textes.join(" \n ");
  r.unTemps = (tout.match(/Un temps/g) || []).length;                                    // 1
  r.joueurCite = /(tu (lui )?(dis|réponds|demandes|expliques)[^.«]*«)/i.test(tout);      // faux
  r.guillemets = tout.match(/«[^»]*»/g) || [];                                           // []
  r.motsInterdits = ["bestiole","œil","paupière","quarantaine","Campbell","creux"].filter(m => tout.toLowerCase().includes(m.toLowerCase()));   // []
  r.sonsDecodes = ["RE","TOUR","DE","LAI"].every(s => GLYPHES_ANCIEN[s]);               // vrai : rien de nouveau
  r.nbSons = Object.keys(GLYPHES_ANCIEN).length;                                         // 38 (comme v2.32)
  const mots = tout.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-zàâçéèêëîïôûùüÿœæ' -]/g, " ").split(/\s+/).filter(Boolean);
  const vu = {}; for(let i = 0; i + 2 < mots.length; i++){ const t = mots.slice(i, i+3).join(" "); vu[t] = (vu[t]||0) + 1; }
  const VIDES = new Set(["de","la","le","les","des","du","un","une","et","à","au","en","il","elle","tu","te","que","qui","ne","pas","se","sa","son","ses","sur","dans","d'","l'","qu'","s'","n'","ce","ça","pour","par","lui","plus","t'","y"]);
  const STANDARD = new Set(["nouvelle tentative dans","tentative dans h"]);
  r.repetitions = Object.entries(vu).filter(([t, n]) => n > 1 && !STANDARD.has(t) && t.split(" ").filter(m => !VIDES.has(m)).length >= 2).map(([t, n]) => `${t} ×${n}`);
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  reussirDefi = vraiR; echouerDefi = vraiE;
  return r;
})();
