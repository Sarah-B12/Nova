// v1.41 — petites histoires : étapes, refus, mini-jeux (node o_banc.js .. histoires)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const rpcOrig = sb.rpc.bind(sb);
  const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args || {})) });
    if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  const base = (union) => ({ data:{ ok:true, union, envoyee:null, recues:[], delai:null, choix_faction:null,
                                    moi:{ faction:etat.faction, x:etat.pos.x, y:etat.pos.y, secteur:"silene" } }, error:null });
  const H = (extra) => Object.assign({ n:1, etape:1, debut:"2026-10-11", fin:"2026-10-16", resultat:null, etape1_moi:false, etape1_fait:false,
                                       etape_jour:null, textes:{}, par:{}, paire:null, point:null }, extra || {});
  const U = (h) => ({ id:1, conjoint:"x", nom:"Élane", hote:"x", je_suis_hote:false, marie_le:"2026-09-30T08:00:00Z", complicite:50,
    en_pause:false, enfant_mode:"bebe", famille:[],
    enfant:{ id:1, stade:"enfant", age:3, restant:7, nommable:false, prenom:"Eden", gele:false, bien_etre:70, jours_zero:0, soir:null,
             lecons:{}, vocation:null, gestes:{ moi:null, autre:null }, histoire:h, aujourdhui:"2026-10-12" },
    jour:{ mes_actions:[3,12,17,5], mon_choix:null, mon_detail:{}, son_choix:null, son_detail:{}, toujours:[9,10,20,21] },
    reserve:{ place:10, utilise:0, objets:[] }, ceremonie:{ texte:"", fige:false, fige_le:"2026-10-14T08:00:00Z" }, divorce:null });
  let cur = U(H());
  rep.union_lire = () => base(cur);
  rep.histoire_agir = (a) => ({ data:{ ok:true, etape:a.p_etape, finie:a.p_etape === 3 }, error:null });
  let stocks = 0; chargerStocksServeur = async () => { stocks++; };
  await chargerUnion();
  document.querySelector('.onglet[data-onglet="couple"]').click(); await dort(60);
  _coupleOnglet = "famille"; await majCouple();
  const cv = document.querySelector("#couple-vue");
  const etapes = () => [...cv.querySelectorAll(".hi-etapes li")].map(li => li.className + " | " + li.textContent.replace(/\s+/g, " ").trim().slice(0, 90));

  // 1. Le jouet cassé, étape 1 : apporter (sans puis avec l'objet)
  etat.sac = Object.assign({}, etat.sac, { fab_composant_simple:0 }); await majCouple();
  r.h1 = { titre: cv.querySelector(".hi-carte h4").textContent.trim(), ouv: cv.querySelector(".hi-ouv").textContent, etapes: etapes(),
           donner: cv.querySelector('[data-hist="1"]').disabled, reste: cv.querySelector(".hi-carte .itip-gris").textContent.slice(0, 40) };
  etat.sac.fab_composant_simple = 2; await majCouple();
  appels.length = 0; cv.querySelector('[data-hist="1"]').click(); await dort(80);
  r.h1.apport = { args:(appels.find(a => a.nom === "histoire_agir") || {}).args, sacRelu: stocks };
  // étape 2 faite par moi à l'étape 1 → revient à l'autre
  cur = U(H({ etape:2, etape1_moi:true, etape1_fait:true, par:{ "1":"moi" } })); await chargerUnion(); await majCouple();
  r.h1.autre = cv.querySelector(".hi-etapes li.courante").textContent.includes("revient à Élane");
  // étape 2 (jeu Recoller) faite par l'autre côté : je joue et je gagne
  cur = U(H({ etape:2, etape1_moi:false, etape1_fait:true, par:{ "1":"x" } })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click(); await dort(30);
  r.recoller = { pieces: cv.querySelectorAll(".jr-piece").length, enCours: _histJeuEnCours };
  for(let k = 0; k < 20; k++){
    const p = [...cv.querySelectorAll(".jr-piece")].find(b => !/rotate\(0deg\)/.test(b.querySelector("svg").getAttribute("style")));
    if(!p) break; p.click(); await dort(5);
  }
  await dort(80);
  r.recoller.appel = (appels.find(a => a.nom === "histoire_agir") || {}).args;
  // étape 3 : écrire (trop court refusé côté client, puis bon)
  cur = U(H({ etape:3, etape1_fait:true, par:{ "1":"x", "2":"moi" } })); await chargerUnion(); await majCouple();
  appels.length = 0; journ.length = 0;
  cv.querySelector("#hi-texte").value = "x"; cv.querySelector('[data-hist="3"]').click(); await dort(40);
  r.ecrire = { court: !appels.length && journ.some(t => t.includes("2 et 40")) };
  cv.querySelector("#hi-texte").value = "  Boulon "; cv.querySelector('[data-hist="3"]').click(); await dort(80);
  r.ecrire.args = (appels.find(a => a.nom === "histoire_agir") || {}).args;
  r.ecrire.msg = journ.find(t => t.includes("réussie"));
  // réussite affichée
  cur = U(H({ etape:4, resultat:"reussie", textes:{ "3":"Boulon" } })); await chargerUnion(); await majCouple();
  r.reussite = cv.querySelector(".hi-fin").textContent;
  cur = U(H({ n:6, etape:4, resultat:"ratee", textes:{ "1":"Potion du dragon" } })); await chargerUnion(); await majCouple();
  r.echec = cv.querySelector(".hi-fin").textContent;
  cur = U(H({ n:6, etape:4, resultat:"reussie", textes:{ "1":"Potion du dragon" } })); await chargerUnion(); await majCouple();
  r.soupe = cv.querySelector(".hi-fin").textContent;

  // 3. La lumière au loin : aller (loin puis près)
  etat.secteur = "silene"; etat.pos = { x:500, y:500 };
  cur = U(H({ n:3, point:{ x:700, y:700 } })); await chargerUnion(); await majCouple();
  r.aller = { loin: cv.querySelector('[data-hist="1"]').disabled, txt: cv.querySelector(".hi-action .itip-gris").textContent };
  etat.pos = { x:720, y:690 }; await majCouple();
  appels.length = 0; cv.querySelector('[data-hist="1"]').click(); await dort(80);
  r.aller.args = (appels.find(a => a.nom === "histoire_agir") || {}).args;
  // 4. La carte au trésor : indices (mauvaise paire puis bonne)
  cur = U(H({ n:4, paire:["ignis","toundra"] })); await chargerUnion(); await majCouple();
  r.carte = { libelle: cv.querySelector(".hi-etapes li.avenir b").textContent };
  cv.querySelector("[data-hist-jeu]").click(); await dort(20);
  r.carte.dessin = cv.querySelector(".hi-dessin").textContent;
  cv.querySelector('[data-cite="nomades"]').click(); cv.querySelector('[data-cite="rouage"]').click(); cv.querySelector("#ji-ok").click(); await dort(20);
  r.carte.essais = cv.querySelector("#hi-jeu .itip-gris b").textContent;
  appels.length = 0;
  cv.querySelector('[data-cite="ignis"]').click(); cv.querySelector('[data-cite="toundra"]').click(); cv.querySelector("#ji-ok").click(); await dort(80);
  r.carte.appel = (appels.find(a => a.nom === "histoire_agir") || {}).args;
  // 2. La cabane : le soir (bouton désactivé le jour même)
  cur = U(H({ n:2, etape:3, etape1_fait:true, etape_jour:"2026-10-12" })); await chargerUnion(); await majCouple();
  r.soir = { memeJour: cv.querySelector('[data-hist="3"]').disabled };
  // 2. Le toit : un lâcher change le compteur
  cur = U(H({ n:2, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  cv.querySelector("[data-hist-jeu]").click(); await dort(200);
  const avant = cv.querySelector("#jt-cpt").textContent; cv.querySelector("#jt-lacher").click(); await dort(20);
  r.toit = { avant, apres: cv.querySelector("#jt-cpt").textContent };
  // le refresh ne redessine pas pendant un jeu
  r.toit.verrou = _histJeuEnCours;
  // 5. Le four : un petit régulateur joue (chauffe sous 62°, relâche au-dessus)
  cur = U(H({ n:5, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click(); await dort(50);
  const bch = () => cv.querySelector("#jf-ch");
  let ch = false;
  for(let k = 0; k < 400 && bch(); k++){
    const m = (cv.querySelector("#jf-txt").textContent.match(/(\d+)°/) || [])[1];
    const t = Number(m || 0);
    if(t < 62 && !ch){ bch().dispatchEvent(new Event("pointerdown")); ch = true; }
    else if(t >= 66 && ch){ bch().dispatchEvent(new Event("pointerup")); ch = false; }
    await dort(40);
  }
  await dort(100);
  r.four = { appel: (appels.find(a => a.nom === "histoire_agir") || {}).args, fin: (cv.querySelector("#hi-jeu") || {}).textContent };
  // 3. Le signal : 5 appuis brefs (raté si le motif n'est pas « tout court ») → essai décompté
  cur = U(H({ n:3, etape:3, etape1_fait:true, point:{ x:1, y:1 } })); await chargerUnion(); await majCouple();
  cv.querySelector("[data-hist-jeu]").click(); await dort(6500);
  const ba = cv.querySelector("#js-appui");
  for(let k = 0; k < 5; k++){ ba.dispatchEvent(new Event("pointerdown")); await dort(60); ba.dispatchEvent(new Event("pointerup")); await dort(30); }
  r.signal = { essais: (cv.querySelector("#js-ess") || {}).textContent, saisie: (cv.querySelector("#js-sais") || {}).textContent, zone: (cv.querySelector("#hi-jeu") || {}).textContent.slice(0, 80)};
  // v1.42 — lot 3 : le câblage (résolu), apprivoiser (joué au bon moment), les compresses (tenues)
  cur = U(H({ n:9, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click(); await dort(20);
  cv.querySelector('[data-fil="rouge"]').click(); await dort(5);
  const mauvaise = [...cv.querySelectorAll("[data-borne]")].find(b => b.dataset.borne !== "rouge"); mauvaise.click(); await dort(5);
  r.cablage = { erreurs: cv.querySelector("#hi-jeu .itip-gris b").textContent };
  for(const c of ["rouge","bleu","jaune","vert"]){ cv.querySelector(`[data-fil="${c}"]`).click(); await dort(5); cv.querySelector(`[data-borne="${c}"]`).click(); await dort(5); }
  await dort(80);
  r.cablage.appel = (appels.find(a => a.nom === "histoire_agir") || {}).args;
  cur = U(H({ n:8, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click(); await dort(20);
  let vu = 0;
  for(let k = 0; k < 600 && cv.querySelector("#ja-av"); k++){
    const cl = cv.querySelector("#ja-cu").className;
    if(k === 0){ /* attendre */ }
    if(cl.includes("regarde") && vu === 0){ cv.querySelector("#ja-av").click(); vu = 1; }   // une frayeur exprès
    else if(cl.includes(" dos")) cv.querySelector("#ja-av").click();
    await dort(150);
  }
  await dort(80);
  r.apprivoiser = { appel: (appels.find(a => a.nom === "histoire_agir") || {}).args, frayeurVue: vu };
  cur = U(H({ n:7, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click(); await dort(20);
  for(let k = 0; k < 400 && cv.querySelector(".jc-comp"); k++){
    const h = [0,1,2].map(i => parseFloat((cv.querySelector("#jc-" + i) || { style:{} }).style.height) || 0);
    const i = h.indexOf(Math.max(...h)); if(h[i] > 40) cv.querySelector(`.jc-comp[data-i="${i}"]`).dispatchEvent(new Event("pointerdown"));
    await dort(60);
  }
  await dort(80);
  r.compresses = { appel: (appels.find(a => a.nom === "histoire_agir") || {}).args };
  r.maquette = (cur = U(H({ n:9, etape:4, resultat:"reussie", textes:{ "3":"Comète" } })), await chargerUnion(), await majCouple(), cv.querySelector(".hi-fin").textContent);
  // v1.43 — lot 4 : check-list (ordre relevé pendant la lecture), écoute (on touche le côté allumé), balises (on compte)
  cur = U(H({ n:10, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click();
  const lus = [];
  for(let k = 0; k < 200 && !cv.querySelector("#jk-tab button"); k++){
    const t = ((cv.querySelector("#jk-lu") || {}).textContent || "").match(/« (.+) ! »/);
    if(t && lus[lus.length - 1] !== t[1]) lus.push(t[1]);
    await dort(50);
  }
  for(const c of lus){ const b = cv.querySelector(`[data-c="${c}"]`); if(b) b.click(); await dort(10); }
  await dort(80);
  r.checklist = { lus: lus.length, appel: (appels.find(a => a.nom === "histoire_agir") || {}).args };
  cur = U(H({ n:11, etape:2, etape1_fait:true })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click();
  for(let k = 0; k < 400 && cv.querySelector(".je-nuit"); k++){
    const on = cv.querySelector(".je-cote.on"); if(on) on.dispatchEvent(new Event("pointerdown"));
    await dort(60);
  }
  await dort(80);
  r.ecoute = { appel: (appels.find(a => a.nom === "histoire_agir") || {}).args };
  cur = U(H({ n:12, etape:2, etape1_fait:true, point:{ x:740, y:1100 } })); await chargerUnion(); await majCouple();
  appels.length = 0;
  cv.querySelector("[data-hist-jeu]").click();
  for(let t = 0; t < 3; t++){
    await dort(200); const n = cv.querySelectorAll(".jb-lampe").length;
    await dort(3000); const b = cv.querySelector(`#jb-rep [data-n="${n}"]`); if(b) b.click();
  }
  await dort(100);
  r.balises = { appel: (appels.find(a => a.nom === "histoire_agir") || {}).args };
  cur = U(H({ n:12, etape:3, etape1_fait:true, par:{ "1":"x", "2":"x" } })); await chargerUnion(); await majCouple();
  r.raconter = { champ: cv.querySelector("#hi-texte").tagName, max: cv.querySelector("#hi-texte").getAttribute("maxlength"),
                 bouton: cv.querySelector('[data-hist="3"]').textContent };
  appels.length = 0; cv.querySelector("#hi-texte").value = "Des gens qui attendent un vaisseau. Ils ont des fêtes, peut-être.";
  cv.querySelector('[data-hist="3"]').click(); await dort(80);
  r.raconter.args = (appels.find(a => a.nom === "histoire_agir") || {}).args;
  cur = U(H({ n:10, etape:4, resultat:"reussie", textes:{ "3":"Bouclette" } })); await chargerUnion(); await majCouple();
  r.vol = cv.querySelector(".hi-fin").textContent;
  journal = jOrig;
  return r;
})();
