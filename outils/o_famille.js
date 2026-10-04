// v1.37 — enfants, brique 1 : action 21 adaptée, Famille, prénom (node o_banc.js .. famille)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const rpcOrig = sb.rpc.bind(sb);
  const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args || {})) });
    if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  confirmerJoli = async () => true;
  const base = (union) => ({ data:{ ok:true, union, envoyee:null, recues:[], delai:null, choix_faction:null,
                                    moi:{ faction:etat.faction, x:etat.pos.x, y:etat.pos.y, secteur:"silene" } }, error:null });
  const U = (extra) => Object.assign({ id:1, conjoint:"x", nom:"Élane", hote:"x", je_suis_hote:false, marie_le:"2026-09-30T08:00:00Z",
    complicite:50, en_pause:false, enfant:null, enfant_mode:"bebe", famille:[],
    jour:{ mes_actions:[3,12,17,5], mon_choix:null, mon_detail:{}, son_choix:21, son_detail:{}, toujours:[9,10,20,21] },
    reserve:{ place:10, utilise:0, objets:[] }, ceremonie:{ texte:"", fige:false, fige_le:"2026-10-14T08:00:00Z" }, divorce:null }, extra || {});
  let cur = U();
  rep.union_lire = () => base(cur);
  await chargerUnion();
  const btC = document.querySelector('.onglet[data-onglet="couple"]'); btC.click(); await dort(60);
  const cv = document.querySelector("#couple-vue");
  _coupleOnglet = "actions"; await majCouple();
  const carte21 = () => { const b = cv.querySelector('[data-act="21"]'); return b ? b.querySelector(".co-nom").textContent : null; };
  r.mixte = { bouton: carte21(), sonPhrase: [...cv.querySelectorAll(".co-carte .co-phrase")].map(x => x.textContent)[0] };
  // même genre → adoption
  cur = U({ enfant_mode:"adoption" }); await chargerUnion(); await majCouple();
  r.adoption = { bouton: carte21(), sonPhrase: cv.querySelector(".co-carte .co-phrase").textContent };
  // tentative ratée : « Pas cette fois. » sur les deux cartes
  cur = U({ jour:{ mes_actions:[3,12,17,5], mon_choix:21, mon_detail:{ tentative:true, reussi:false }, son_choix:21,
                   son_detail:{ tentative:true, reussi:false }, toujours:[9,10,20,21] } });
  await chargerUnion(); await majCouple();
  r.ratee = [...cv.querySelectorAll(".co-carte .co-phrase")].map(x => x.textContent);
  // enfant attendu : plus de bouton 21, carte grisée
  cur = U({ enfant:{ id:1, stade:"attendu", age:-2, restant:2, nommable:false, prenom:null, gele:false } });
  await chargerUnion(); await majCouple();
  r.attendu = { bouton21: !!cv.querySelector('[data-act="21"]'), carte: (cv.querySelector(".co-enfant .co-nom") || {}).textContent };
  // Famille : onglets, attente
  _coupleOnglet = "famille"; await majCouple();
  r.onglets = [...cv.querySelectorAll("[data-co]")].map(b => b.textContent);
  r.familleAttente = cv.querySelector("#couple-corps").textContent.replace(/\s+/g, " ").trim();
  // aucun enfant : chance affichée (Complicité 50 → 18 %)
  cur = U(); await chargerUnion(); await majCouple();
  r.familleVide = cv.querySelector(".fa-carte .itip-gris").textContent;
  // petit, sans prénom : nommer (invalide puis valide)
  cur = U({ enfant:{ id:1, stade:"petit", age:0, restant:3, nommable:true, prenom:null, gele:false },
            famille:[{ prenom:"Noa", vocation:null, statut:"parti", parti_le:"2026-09-20T08:00:00Z" },
                     { prenom:"Kim", vocation:null, statut:"fugue", parti_le:"2026-09-25T08:00:00Z" }] });
  await chargerUnion(); await majCouple();
  r.petit = { titre: cv.querySelector(".fa-carte h3").textContent.replace(/\s+/g, " ").trim(), bouton: cv.querySelector("#fa-nommer").textContent,
              partis: [...cv.querySelectorAll(".fa-parti")].map(x => x.textContent.replace(/\s+/g, " ").trim()) };
  rep.enfant_nommer = (a) => ({ data:{ ok:true, prenom:a.p_prenom }, error:null });
  appels.length = 0; journ.length = 0;
  cv.querySelector("#fa-prenom").value = "A1"; cv.querySelector("#fa-nommer").click(); await dort(60);
  r.invalide = { appel: appels.some(a => a.nom === "enfant_nommer"), msg: journ[journ.length - 1] };
  cv.querySelector("#fa-prenom").value = "  Noé-Lou  ";
  cv.querySelector("#fa-prenom").dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true })); await dort(80);
  r.valide = { args: (appels.find(a => a.nom === "enfant_nommer") || {}).args, msg: journ.find(t => t.includes("Prénom choisi")) };
  // stade enfant : plus de champ ; gel affiché
  cur = U({ enfant:{ id:1, stade:"enfant", age:4, restant:6, nommable:false, prenom:"Noé-Lou", gele:true } });
  await chargerUnion(); await majCouple();
  r.enfant = { champ: !!cv.querySelector("#fa-prenom"), texte: cv.querySelector(".fa-carte").textContent.replace(/\s+/g, " ").trim() };
  // v1.38 — soins : petit avec bien-être, nourrir avec la Ferragave du sac
  etat.sac = Object.assign({}, etat.sac, { ferragave:2, fab_ration_chaude:0 });
  cur = U({ enfant:{ id:1, stade:"petit", age:1, restant:2, nommable:true, prenom:"Lou", gele:false, bien_etre:62, jours_zero:0, soir:1,
                     lecons:{}, vocation:null, gestes:{ moi:null, autre:{ geste:"calin", detail:null } } } });
  await chargerUnion(); await majCouple();
  r.soins = { boutons: [...cv.querySelectorAll("[data-geste]")].map(b => b.dataset.geste + (b.dataset.detail ? ":" + b.dataset.detail : "")),
              jauge: cv.querySelector(".fa-jauge .val").textContent, soir: cv.querySelector(".fa-carte").textContent.includes("Complicité +1"),
              autre: cv.querySelector(".co-jour .co-carte .co-phrase").textContent };
  rep.enfant_geste = (a) => ({ data:{ ok:true, geste:a.p_geste, detail:a.p_detail, gain:15, bien_etre:77 }, error:null });
  let stocks = 0; const csOrig = chargerStocksServeur; chargerStocksServeur = async () => { stocks++; };
  appels.length = 0;
  cv.querySelector('[data-geste="nourrir"]').click(); await dort(80);
  r.nourrir = { args:(appels.find(a => a.nom === "enfant_geste") || {}).args, sacRelu: stocks };
  chargerStocksServeur = csOrig;
  // enfant : leçons ; geste déjà fait → boutons désactivés
  cur = U({ enfant:{ id:1, stade:"enfant", age:5, restant:5, nommable:false, prenom:"Lou", gele:false, bien_etre:25, jours_zero:2, soir:-2,
                     lecons:{ bricoleur:3, cuistot:1 }, vocation:null, gestes:{ moi:{ geste:"apprendre", detail:"bricoleur" }, autre:null } } });
  await chargerUnion(); await majCouple();
  r.enfantSoins = { lecons: [...cv.querySelectorAll('[data-geste="apprendre"]')].map(b => b.textContent.trim()),
                    desactives: [...cv.querySelectorAll("[data-geste]")].every(b => b.disabled),
                    moi: [...cv.querySelectorAll(".co-jour .co-carte")][1].textContent.replace(/\s+/g, " ").trim(),
                    alertes: [...cv.querySelectorAll(".fa-carte .u-alerte")].map(x => x.textContent) };
  // ado : vocation ; lettre d'un enfant parti
  cur = U({ enfant:{ id:2, stade:"ado", age:12, restant:9, nommable:false, prenom:"Eden", gele:false, bien_etre:80, jours_zero:0, soir:1,
                     lecons:{ mecano:4 }, vocation:"mecano", gestes:{ moi:null, autre:null } },
            famille:[{ id:1, prenom:"Noa", vocation:"soigneur", statut:"parti", parti_le:"2026-06-20T08:00:00Z", lettre:{ modele:4, recue_le:"2026-10-01T08:00:00Z" } },
                     { id:3, prenom:"Kim", vocation:null, statut:"parti", parti_le:"2026-06-25T08:00:00Z", lettre:{ modele:2, recue_le:"2026-10-02T08:00:00Z" } }] });
  await chargerUnion(); await majCouple();
  r.ado = { boutons: [...cv.querySelectorAll("[data-geste]")].map(b => b.dataset.geste), vocation: [...cv.querySelectorAll(".fa-carte p")].map(p => p.textContent).find(t => t.startsWith("Vocation")) };
  r.lettres = [...cv.querySelectorAll(".fa-lettre p")].map(p => p.innerHTML);
  // v1.39 — aides : ado Bricoleur (dernière aide), Gardien (veille), Éclaireur (cachette, fouille)
  cur = U({ enfant:{ id:2, stade:"ado", age:12, restant:9, nommable:false, prenom:"Eden", gele:false, bien_etre:80, jours_zero:0, soir:1,
                     lecons:{}, vocation:"bricoleur", gestes:{ moi:null, autre:null },
                     aide:{ texte:"Eden a réparé une installation du terrain de Bela (parcelle 6) : 60 → 70 % d'intégrité.", le:"2026-10-13" } } });
  await chargerUnion(); await majCouple();
  r.bricoleur = { aide: (cv.querySelector(".fa-aide") || {}).textContent, desc: cv.querySelector(".fa-carte").textContent.includes("répare de 10 %") };
  cur = U({ enfant:{ id:2, stade:"ado", age:12, restant:9, nommable:false, prenom:"Eden", gele:false, bien_etre:80, jours_zero:0, soir:1,
                     lecons:{}, vocation:"gardien", gardien:true, gestes:{ moi:null, autre:null } } });
  await chargerUnion(); await majCouple();
  r.gardien = cv.querySelector(".fa-carte").textContent.includes("Veille en ce moment");
  etat.secteur = "silene"; etat.pos = { x:700, y:900 };
  const cach = { x:720, y:930, jusqua:"2026-11-04", fouillee:false, par_moi:null };
  cur = U({ enfant:{ id:3, stade:"ado", age:13, restant:8, nommable:false, prenom:"Lou", gele:false, bien_etre:90, jours_zero:0, soir:1,
                     lecons:{}, vocation:"eclaireur", gestes:{ moi:null, autre:null }, cachette:cach } });
  await chargerUnion(); await majCouple();
  const bf = cv.querySelector("#fa-fouiller");
  r.cachette = { texte: cv.querySelector(".fa-cachette").textContent.replace(/\s+/g, " ").trim(), actif: bf && !bf.disabled };
  rep.enfant_fouiller = () => ({ data:{ ok:true, gains:{ cendrite:1, composant:1 }, prenom:"Lou" }, error:null });
  appels.length = 0; journ.length = 0;
  bf.click(); await dort(80);
  r.fouille = { args:(appels.find(a => a.nom === "enfant_fouiller") || {}).args, msg: journ.find(t => t.startsWith("Cachette")) };
  etat.pos = { x:1500, y:900 }; await majCouple();
  r.loin = { actif: !cv.querySelector("#fa-fouiller").disabled, texte: cv.querySelector(".fa-cachette .itip-gris").textContent };
  // cachette restée ouverte après le départ : pas d'enfant, mais la cachette s'affiche ; l'action 21 revient
  cur = U({ enfant:{ stade:"aucun", cachette:cach } }); await chargerUnion();
  _coupleOnglet = "actions"; await majCouple();
  r.apresDepart = { bouton21: !!cv.querySelector('[data-act="21"]') };
  _coupleOnglet = "famille"; await majCouple();
  r.apresDepart.cachette = !!cv.querySelector(".fa-cachette"); r.apresDepart.vide = cv.textContent.includes("Pas d'enfant à la maison");
  // Mécano : coque récupérée (vaisseau équipé)
  etat.vaisseau = Object.keys(VAISSEAUX)[0]; etat.vaisseauPv = { [etat.vaisseau]: 50 };
  rep.enfant_coque_prendre = () => ({ data:{ ok:true, points:10, prenom:"Eden" }, error:null });
  _coqueTs = 0; journ.length = 0; await _coqueEnfant();
  r.coque = { pv: etat.vaisseauPv[etat.vaisseau], msg: journ[0] };
  // v1.40 — divorce : avertissement si des enfants existent
  cur = U({ famille:[{ id:1, prenom:"Noa", vocation:null, statut:"parti", parti_le:"2026-09-20T08:00:00Z" }] });
  await chargerUnion(); changerCentre("unions"); await dort(80);
  const elU = document.querySelector("#centre-corps");
  r.divorceAvert = elU.textContent.includes("vos enfants sera effacé");
  let msgDiv = ""; confirmerJoli = async (t, m) => { msgDiv = m; return false; };
  elU.querySelector('[data-u="divorcer"]').click(); await dort(50);
  r.divorceConfirme = msgDiv.includes("vos enfants sera effacé");
  cur = U(); await chargerUnion(); await majUnions(elU);
  r.divorceSansEnfant = !elU.textContent.includes("vos enfants");
  // tri du journal (événements serveur)
  r.tri = ["Faute de mieux, tout le monde a fini par l'appeler Lou.", "Une heureuse nouvelle ! Dans trois jours, la famille s'agrandira.",
           "Lou entre dans l'adolescence. La porte de sa chambre reste fermée plus souvent.", "Dena et toi avez demandé à adopter aujourd'hui.",
           "Lou a fait son sac et quitté la maison. Elle paraît soudain bien grande.",
           "La chambre de Lou est vide ce matin. Sur l'oreiller, un mot : « Vous ne verrez même pas la différence. »",
           "Une lettre de Lou est arrivée (Couple > Famille).",
           "Eden a réparé une installation du terrain de Bela (parcelle 6) : 60 → 70 % d'intégrité.",
           "Eden a cuisiné une ration maison avec 1 ferragave (coffre) : +5 de moral chacun.",
           "Eden a pris soin de vous deux : +5 de santé chacun.", "Eden traîne des pieds : bien-être sous 40, pas d'aide aujourd'hui.",
           "Eden a passé la journée sur vos vaisseaux : +5 PV de coque chacun (si un vaisseau est équipé).",
           "Cyra a fouillé la cachette repérée par Lou : 1× cendrite."].map(_categoriser);
  journal = jOrig;
  return r;
})();
