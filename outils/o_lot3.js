// v1.93 — LOT 3 (Q26 → Q30) : la fin de l'arc.
// Chaque étape se dessine et se branche ; pas de type répété avec la quête d'avant ;
// l'ordre est chaîné (règle d'équité) et se gagne / se perd ; la séquence (la cadence
// deux fois) se gagne et se perd avec son propre message ; un seul « Un temps » ;
// la récompense suit le barème (K35, K39).
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] }, att = ms => new Promise(x=>setTimeout(x,ms));
  const a = { id:"q26", etape:0 }; queteActive = () => a; sauvegarder = () => {}; rafraichirQuetes = () => {};
  const _vraiHub = majQueteHub; majQueteHub = () => {}; sauverMaintenant = async () => {};
  let ok = 0, ko = 0, dernierEchec = ""; reussirDefi = () => { ok++; }; echouerDefi = (m) => { ko++; dernierEchec = m || ""; };
  journal = () => {};
  const z = document.createElement("div"); document.body.appendChild(z);
  const IDS = ["q26","q27","q28","q29","q30"];

  // 1. Toutes les étapes se dessinent et se branchent ; cibles et images.
  r.etapes = {};
  for(const id of IDS){
    const q = queteData(id); r.etapes[id] = q.etapes.map(e => e.defi.type).join(",");
    q.etapes.forEach((e, i) => { a.id = id; a.etape = i; a._qj = null;
      try{ z.innerHTML = _defiHTML(e.defi); _defiWire(z, e.defi);
           if(/à venir/.test(z.innerHTML)) r.erreurs.push(`${id}/${i} : épreuve inconnue ${e.defi.type}`);
           if(!_cibleResolue(e.cible)) r.erreurs.push(`${id}/${i} : cible introuvable`);
           const im = (e.image && typeof e.image === "object") ? (e.image.src || e.image.valeurs[e.image.defaut]) : e.image;   // v1.93j, v1.93s
           const attendue = (e.defi.type === "combat" && e.image && e.image.src) ? `images/quetes/${id}/gardien.png` : null;
           if(attendue ? im !== attendue : !/^images\/quetes\/q\d+\/\d+\.png$/.test(im)) r.erreurs.push(`${id}/${i} : image ${im}`);
      }catch(err){ r.erreurs.push(`${id}/${i} : ${err.message}`); } });
    if(_queteTimer){ clearInterval(_queteTimer); _queteTimer = null; }
    _seqFin();
  }
  // Jamais le même type dans deux quêtes consécutives (hors choix, attente).
  const types = id => new Set(queteData(id).etapes.map(e => e.defi.type).filter(t => !["choix","attente","scene","combat"].includes(t)));   // une scène n'est pas une épreuve ; v1.93s : le gardien (combat) est un barrage de niveau
  r.repetitions = []; ["q25", ...IDS].reduce((p, c) => { for(const t of types(c)) if(types(p).has(t)) r.repetitions.push(`${p}/${c}:${t}`); return c; });
  // Au moins une épreuve ratable par quête (une qui se perd).
  r.ratables = IDS.map(id => `${id}:${queteData(id).etapes.filter(e => DEFIS_UNTRY.has(e.defi.type)).length}`).join(" ");

  // 2. Q26, l'ordre : chaque bloc reprend ce sur quoi le précédent s'arrête.
  const dO = queteData("q26").etapes[0].defi, els = dO.elements;
  const mots = t => t.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿœ0-9° -]/g, " ").split(/\s+/).filter(w => w.length > 3);
  r.ordreChaine = els.slice(1).map((e, i) => { const deb = mots(e).slice(0, 2); const fin = mots(els[i]).slice(-8); return deb.some(w => fin.includes(w)); });
  a.id = "q26"; a.etape = 0;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
  for(let i = 0; i < els.length; i++) z.querySelector(`.q-ordre-el[data-i="${i}"]`).click();
  z.querySelector("#q-ordre-valider").click(); r.ordreGagne = ok === 1 && ko === 0;
  ok = 0; ko = 0; z.innerHTML = _defiHTML(dO); _defiWire(z, dO);
  [1,0,2,3,4,5].forEach(i => z.querySelector(`.q-ordre-el[data-i="${i}"]`).click());
  z.querySelector("#q-ordre-valider").click(); r.ordrePerdu = ko === 1 && /8 h/.test(dernierEchec);

  // 3. Q26, la séquence : la cadence de l'appel, deux fois (10). Tempo accéléré pour le banc.
  const dS = Object.assign({}, queteData("q26").etapes[2].defi, { allume:5, pas:15 });
  r.seq = { longueur:dS.longueur, cadence:(dS.cadence || []).join("") };
  async function jouerSeq(fautif){
    ok = 0; ko = 0; dernierEchec = ""; a.etape = 2;
    z.innerHTML = _defiHTML(dS); _defiWire(z, dS);
    const pads = [...z.querySelectorAll(".q-seq-pad")], e = z.querySelector("#q-seq-etat");
    z.querySelector("#q-seq-go").click();
    for(let vague = 1; vague <= dS.longueur && !ok && !ko; vague++){
      for(let t = 0; t < 400 && e.textContent !== "À toi !"; t++) await att(10);
      for(let k = 0; k < vague; k++){
        let i = dS.cadence[k % dS.cadence.length];
        if(fautif && vague === 7 && k === 6) i = (i + 1) % pads.length;
        pads[i].click(); if(ko) break;
      }
    }
    _seqFin();
  }
  await jouerSeq(false); r.seq.gagnee = ok === 1 && ko === 0;
  await jouerSeq(true);  r.seq.perdue = ko === 1 && ok === 0; r.seq.messagePropre = /radio|Asulf/.test(dernierEchec) && /8 h/.test(dernierEchec);

  // 4. Écriture (K53) : au plus un « Un temps » ; le joueur ne parle pas (aucune réplique
  //    qui commence par « Tu dis » ou « tu réponds : « ») ; récompense.
  const textes = id => JSON.stringify(queteData(id));
  r.unTemps = IDS.map(id => `${id}:${(textes(id).match(/Un temps/g) || []).length}`).join(" ");
  r.joueurParle = IDS.filter(id => /[Tt]u (dis|réponds|demandes) ?: ?«/.test(textes(id)));
  r.recompenses = IDS.map(id => { const x = queteData(id).recompense; return `${id}:${x.credits}₡/${x.xp}xp/${x.pa || 0}pa`; }).join(" ");
  // La chaise longue d'Adaya (graine K59) est bien posée.
  r.chaiseLongue = /chaise longue/.test(textes("q26"));
  // Prise au comptoir (pas de lieuPrise) : comme Q16.
  r.priseComptoir = !queteData("q26").lieuPrise;


  // 5. Q27 : les sons des glyphes existent tous (aucun son nouveau, LORE §11 bis).
  const dG = queteData("q27").etapes.find(e => e.defi.type === "glyphes").defi;   // v1.93s : gardien inséré
  r.glyphesConnus = dG.paires.every(p => p.sons.every(x => GLYPHES_ANCIEN[x]));
  r.cadenas = (({ longueur, symboles, essais }) => `${longueur}/${symboles.length}/${essais}`)(queteData("q27").etapes[0].defi);

  // 6. Q28 : l'énigme accepte le quai, refuse le reste.
  const dE = queteData("q28").etapes[1].defi; a.id = "q28"; a.etape = 1;
  const essaiEnigme = (rep) => { ok = 0; z.innerHTML = _defiHTML(dE); _defiWire(z, dE); z.querySelector("#q-enig-champ").value = rep; z.querySelector("#q-enig-btn").click(); return ok === 1; };
  r.enigme = { quai:essaiEnigme("Quai MAAR-12"), ancolie:essaiEnigme("celui d'Ancolie"), faux:essaiEnigme("MAAR-3") };

  // 7. Q29 : le brouillage (v1.93k) — fréquence FIXE réglée une fois puis verrouillée,
  //    décalage à suivre, secondes CUMULÉES.
  const dB = queteData("q29").etapes[1].defi; a.id = "q29"; a.etape = 1;
  async function brouiller(mode, duree, tenir){
    ok = 0; ko = 0; dernierEchec = ""; const d = Object.assign({}, dB, { duree, tenir });
    z.innerHTML = _defiHTML(d); _defiWire(z, d); z.querySelector("#qj-br-go").click();
    const P = QUETES_JEUX.brouillage._partie; const fc0 = P.fc;
    if(mode !== "rien") P.regler(P.fc + 0.05, null);              // à 0,05 près : se cale et se verrouille
    const info = { verrou:P.fCalee && z.querySelector("#qj-br-f").disabled && P.f === P.fc };
    for(let k = 0; k < 400 && !ok && !ko; k++){
      await att(30);
      if(mode === "suivre") P.regler(null, P.cible.d);
      if(mode === "alterner") P.regler(null, (Math.floor(k / 5) % 2) ? P.cible.d : (P.cible.d + Math.PI) % (2 * Math.PI));   // calé une fois sur deux
      if(mode === "frequenceSeule") P.regler(null, (P.cible.d + Math.PI) % (2 * Math.PI));
    }
    info.fixe = P.cible.f === fc0; info.tenu = Math.round(P.tenu * 10) / 10;
    _seqFin(); return Object.assign(info, { ok, ko, msg:dernierEchec });
  }
  const bG = await brouiller("suivre", 20, 1), bA = await brouiller("alterner", 20, 1.5),
        bF = await brouiller("frequenceSeule", 1.5, 1), bP = await brouiller("rien", 1, 1);
  r.brouillage = { gagne:bG.ok === 1, verrouille:bG.verrou, frequenceFixe:bG.fixe,
                   cumule:bA.ok === 1, frequenceNeSuffitPas:bF.ko === 1,
                   perdu:bP.ko === 1 && /8 h/.test(bP.msg), ratable:DEFIS_UNTRY.has("brouillage") };

  // 8. Q30 : la crevasse sous l'anneau ; récompenses et drapeaux de fin d'arc.
  const dC = queteData("q30").etapes.find(e => e.defi.type === "crevasse").defi; r.crevasse = `${dC.n}/${dC.marge}`;
  r.flags = { q28:queteData("q28").recompense.flags, q29:queteData("q29").recompense.flags, q30:queteData("q30").recompense.flags };
  r.paSeulQ30 = IDS.filter(id => queteData(id).recompense.pa).join(",");
  r.prises = IDS.map(id => `${id}:${queteData(id).lieuPrise || "comptoir"}`).join(" ");

  // 9. Les réserves (K62) : l'onglet n'existe qu'à la station, habilité ; achat ; manger.
  const appels = []; const vraiRpc = sb.rpc;
  let stock = { barre_proteinee:3, ration_reglementaire:3 };
  sb.rpc = async (nom, args) => { appels.push(nom);
    if(nom === "reserves_lire") return { data:{ ok:true, stock }, error:null };
    if(nom === "reserves_acheter"){ stock[args.p_item]--; return { data:{ ok:true, credits:3500, etat:{ sac:{ [args.p_item]:1 } }, reste:stock[args.p_item] }, error:null }; }
    if(nom === "reserves_manger") return { data:{ ok:true, energie:70, jauges:{ o2:80, sante:95, moral:1 }, etat:{ sac:{} } }, error:null };
    if(nom === "bar_catalogue") return { data:[], error:null };
    return { data:null, error:null }; };
  const el = document.createElement("div"); document.body.appendChild(el);
  etat.secteur = "ancolie"; etat.ancolie = true; etat.surface = { x:1031, y:900, abord:false }; etat.credits = 5000;
  etat.habilitation = false; _barVue = "boissons"; await majBar(el);
  r.reserves = { ongletSansHabilitation:!!el.querySelector('[data-barvue="reserves"]') };
  etat.habilitation = true; _barVue = "reserves"; await majBar(el);
  r.reserves.onglet = !!el.querySelector('[data-barvue="reserves"]');
  r.reserves.boutons = el.querySelectorAll("[data-reserve]").length;
  r.reserves.prix = [...el.querySelectorAll(".bar-prix")].map(x => x.textContent.replace(/\s/g, " ")).join(" | ");
  el.querySelector('[data-reserve="barre_proteinee"]').click(); await att(50);
  r.reserves.achat = etat.credits === 3500 && /reste 2\/3/.test(el.innerHTML);
  etat.surface = { x:1500, y:900, abord:false }; _barVue = "reserves"; await majBar(el);
  r.reserves.horsStation = !el.querySelector("[data-reserve]") && /pas de bar/.test(el.textContent);   // hors de la station : ni bar, ni réserves
  etat.sac = etat.sac || {}; etat.sac.barre_proteinee = 1; etat.energie = 50; appels.length = 0;
  await utiliser("barre_proteinee");
  r.reserves.manger = { serveur:appels.includes("reserves_manger"), pasAgir:!appels.includes("agir"), energie:etat.energie };
  r.reserves.personnels = estObjetPersonnel("barre_proteinee") && estObjetPersonnel("ration_reglementaire");
  r.reserves.consommable = !!effetConso("ration_reglementaire");
  sb.rpc = vraiRpc;

  // 10. Après Q30 : les répliques du bar viennent de La Toundra (K61) ; l'indicatif au Garage.
  etat.asulfToundra = true; r.barToundra = BAR_ASULF_TOUNDRA.includes(_barAsulfLigne());
  const vv = document.querySelector("#vaisseau-vue") || (() => { const x = document.createElement("div"); x.id = "vaisseau-vue"; document.body.appendChild(x); return x; })();
  etat.permisVaisseau = true; etat.vaisseau = Object.keys(VAISSEAUX)[0]; etat.immatricule = "MAAR-12/42";
  try{ majVaisseau(); r.indicatif = /MAAR-12\/42/.test(vv.innerHTML); }catch(e){ r.indicatif = "erreur : " + e.message; }


  // 11. v1.93l — Q28 se prend le LENDEMAIN de Q27 ; le cadenas de Q27 ; la bête en Q23 ét. 3.
  const qe = queteEtat(); const sauveQ = JSON.stringify(qe);
  qe.active = null; qe.done = QUETES.map(q => q.id).filter(id => id < "q28" && id.length === 3 || /^q\d$/.test(id));
  qe.done = QUETES.slice(0, QUETES.findIndex(q => q.id === "q28")).map(q => q.id);
  const q28 = queteData("q28"); r.lendemain = {};
  qe.finJour = { q27:jourDeJeu() };
  r.lendemain.aujourdhui = queteAttendLendemain(q28);
  const qa0 = queteActive; queteActive = () => queteEtat().active; sauvegarder = () => {}; sauverMaintenant = async () => {};
  accepterQuete("q28"); r.lendemain.refuse = !qe.active;
  qe.finJour = { q27:"2000-01-01" }; accepterQuete("q28"); r.lendemain.accepteeLeLendemain = !!qe.active && qe.active.id === "q28"; qe.active = null;
  qe.finJour = { q27:jourDeJeu() };
  let hub = document.querySelector("#hub-quete"); if(!hub){ hub = document.createElement("div"); hub.id = "hub-quete"; document.body.appendChild(hub); }
  etat.secteur = "ancolie"; etat.ancolie = true; etat.surface = { x:1031, y:880, abord:false }; _seqFin();
  _vraiHub(); r.lendemain.hub = /Disponible <b>demain<\/b>/.test(hub.innerHTML) && !hub.querySelector("#quete-accepter");
  qe.finJour = { q27:"2000-01-01" }; _vraiHub(); r.lendemain.hubLeLendemain = !!hub.querySelector("#quete-accepter");
  queteActive = qa0;
  qe.finJour = { q27:"2000-01-01" }; r.lendemain.hier = !queteAttendLendemain(q28);
  qe.finJour = {}; r.lendemain.ancienne = !queteAttendLendemain(q28);
  r.lendemain.autres = !queteAttendLendemain(queteData("q29"));
  // v1.93q : la règle vaut dès Q6, pas avant ; les répliques suivent le donneur.
  qe.finJour = { q2:jourDeJeu(), q5:jourDeJeu(), q15:jourDeJeu(), q20:jourDeJeu() };
  r.lendemain.q3libre = !queteAttendLendemain(queteData("q3"));
  r.lendemain.q6attend = queteAttendLendemain(queteData("q6")) && /Aujourd'hui, je découpe/.test(texteLendemain(queteData("q6")));
  r.lendemain.q16attend = queteAttendLendemain(queteData("q16")) && /Mes genoux/.test(texteLendemain(queteData("q16")));
  r.lendemain.q21attend = queteAttendLendemain(queteData("q21")) && /barre protéinée/.test(texteLendemain(queteData("q21")));
  r.lendemain.q28texte = /Demain, j'ai dit/.test(texteLendemain(queteData("q28")));
  qe.finJour = {};
  Object.assign(qe, JSON.parse(sauveQ));
  const dK = queteData("q27").etapes[0].defi; r.cadenasQ27 = `${dK.longueur}/${dK.symboles.length}/${dK.essais}/≥${dK.distincts}`;
  // v1.93m : 200 tirages, jamais moins de 3 pictogrammes différents ; un ancien code « ▲▲▲▲ » est retiré.
  const qa1 = queteActive; const aq = { id:"q27", etape:0 }; queteActive = () => aq; let minDiff = 9;
  for(let k = 0; k < 200; k++){ aq._cadSecret = null; z.innerHTML = _defiHTML(dK); _defiWire(z, dK); minDiff = Math.min(minDiff, new Set(aq._cadSecret).size); }
  aq._cadSecret = ["▲","▲","▲","▲"]; aq._cadEssais = 3; z.innerHTML = _defiHTML(dK); _defiWire(z, dK);
  r.cadenasTirage = { minDifferents:minDiff, ancienRetire:new Set(aq._cadSecret).size >= 3 && aq._cadEssais === 0 };
  queteActive = qa1;
  etat.bete = { espece:"iris", nom:"Bip" }; r.beteQ23 = _varie(queteData("q23").etapes[2].image); etat.bete = null;
  return r;
})();
