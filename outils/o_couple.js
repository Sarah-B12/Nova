// v1.36 — mariage, client (node o_banc.js .. couple)
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const rpcOrig = sb.rpc.bind(sb);
  const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args || {})) });
    if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  window.confirm = () => true; confirmerJoli = async () => true;   // v1.36l : boîte maison
  _chargerRelations = async () => ({ amis:[{ id:"ami-1", nom:"Élane" }], envoyees:[], recues:[] });
  const libre = { ok:true, union:null, envoyee:null, recues:[], delai:null, choix_faction:null,
                  moi:{ faction:etat.faction, x:etat.pos.x, y:etat.pos.y, secteur:"silene" } };
  rep.union_derniers_textes = () => ({ data:{ ok:true, textes:[{ a:"A", b:"B", marie_le:"2026-09-01T10:00:00Z", texte:"Court." }] }, error:null });

  // 1. Célibataire : pas d'onglet Couple ; Unions propose la demande parmi les amis.
  rep.union_lire = () => ({ data: libre, error:null });
  await chargerUnion();
  const btC = document.querySelector('.onglet[data-onglet="couple"]');
  r.celibataire = { onglet: btC && btC.style.display };
  changerCentre("unions"); await dort(100);
  const el = document.querySelector("#centre-corps");
  r.unions = { form: !!el.querySelector("#u-cible"), textes: el.querySelector("#unions-textes").textContent.trim().slice(0, 20) };
  // v1.36j : les amis déjà mariés ne sont pas proposés.
  _chargerRelations = async () => ({ amis:[{ id:"ami-1", nom:"Élane" }, { id:"ami-2", nom:"Déjà-Pris" }], envoyees:[], recues:[] });
  rep.unions_maries = () => ({ data:["ami-2"], error:null });
  await majUnions(el);
  r.filtre = [...el.querySelectorAll("#u-cible option")].map(o => o.textContent);
  el.querySelector('input[name="u-ou"][value="je"]').checked = true;
  rep.union_demander = () => ({ data:{ ok:true, id:9 }, error:null });
  el.querySelector('[data-u="demander"]').click(); await dort(80);
  r.demande = (appels.find(a => a.nom === "union_demander") || {}).args;

  // 2. Demande reçue acceptée, et c'est moi qui déménage : faction + terrain relus.
  rep.union_lire = () => ({ data: Object.assign({}, libre, { recues:[{ id:5, de:"x", nom:"Élane", il_vient:false }] }), error:null });
  await chargerUnion(); await majUnions(el);
  appels.length = 0;
  rep.union_repondre = () => ({ data:{ ok:true, accepte:true, demenagement:{ faction:"toundra", x:300, y:300 } }, error:null });
  const marie = { id:1, conjoint:"x", nom:"Élane", hote:"x", je_suis_hote:false, marie_le:"2026-09-30T08:00:00Z", complicite:50,
    en_pause:false, jour:{ mes_actions:[3,12,17,5], mon_choix:null, mon_detail:{}, son_choix:null, son_detail:{}, toujours:[9,10,20,21] },
    reserve:{ place:10, utilise:2, objets:[{ item:"cuir", qte:2, a_moi:false }] },
    ceremonie:{ texte:"", par_moi:false, maj_le:null, fige:false, fige_le:"2026-10-14T08:00:00Z", edition:null }, divorce:null };
  rep.union_lire = () => ({ data: Object.assign({}, libre, { union: marie, moi:{ faction:"toundra", x:300, y:300, secteur:"silene" } }), error:null });
  el.querySelector('[data-u="accepter"]').click(); await dort(150);
  r.accepte = { appel: (appels.find(a => a.nom === "union_repondre") || {}).args, faction: etat.faction,
                terrainRelu: appels.some(a => a.nom === "terrain_lire"), onglet: btC.style.display };

  // 3. Onglet Couple : 4 actions + les toujours-disponibles ; une action.
  btC.click(); await dort(80);
  const cv = document.querySelector("#couple-vue");
  r.actions = { boutons: [...cv.querySelectorAll("[data-act]")].map(b => Number(b.dataset.act)),
                images: [...cv.querySelectorAll(".co-liste img")].map(i => i.getAttribute("src")).slice(0, 2),
                cartes: [...cv.querySelectorAll(".co-carte .co-qui")].map(e => e.textContent.trim()) };
  rep.union_agir = () => ({ data:{ ok:true, action:5, gain:1, detail:{ ratee:true }, tentative:false, complicite:51, moral:80 }, error:null });
  appels.length = 0;
  cv.querySelector('[data-act="5"]').click(); await dort(100);
  r.agir = { args:(appels.find(a => a.nom === "union_agir") || {}).args, auJournal: journ.some(t => t.includes("brûlé")) };

  // 4. Réserve : prendre (objet de l'autre) et déposer depuis le sac.
  etat.pos = { x: VILLES[etat.faction].x, y: VILLES[etat.faction].y }; etat.secteur = "silene";
  _coupleOnglet = "reserve"; await majCouple();
  etat.sac.sylve = 3;
  await majCouple();
  appels.length = 0;
  rep.reserve_retirer = () => ({ data:{ ok:true, retire:1, du_conjoint:1 }, error:null });
  r.tuiles = { pleines: cv.querySelectorAll("#reserve-grille .tuile.utilisable").length, vides: cv.querySelectorAll("#reserve-grille .tuile.vide").length,
               badge: (cv.querySelector("#reserve-grille .co-proprio") || {}).textContent };
  cv.querySelector('#reserve-grille .tuile.utilisable').click(); await dort(80);
  rep.reserve_deposer = () => ({ data:{ ok:true, depose:3 }, error:null });
  const tout = [...cv.querySelectorAll("#reserve-depot .item-ligne")].find(l => l.textContent.includes("Sylve"));
  if(tout) tout.querySelectorAll("button")[1].click(); await dort(80);
  r.reserve = appels.filter(a => a.nom.startsWith("reserve_")).map(a => [a.nom, a.args]);
  r.profilCouple = (document.querySelector("#stat-couple") || {}).textContent;

  // 5. Cérémonie : l'autre a enregistré entre-temps → conflit, rien d'écrasé ; 2e envoi avec sa version.
  _coupleOnglet = "ceremonie"; await majCouple();
  const ta = cv.querySelector("#u-texte"); ta.value = "Nos vœux."; ta.dispatchEvent(new Event("input"));
  let n = 0;
  rep.union_texte_sauver = (a) => { n++; return n === 1 ? { data:{ ok:false, err:"conflit", texte:"Sa version.", maj_le:"2026-09-30T09:00:00Z" }, error:null }
                                                 : { data:{ ok:true, maj_le:"2026-09-30T09:05:00Z" }, error:null }; };
  appels.length = 0;
  cv.querySelector("#u-sauver").click(); await dort(80);
  r.conflit = { montre: cv.querySelector("#u-conflit").textContent.includes("Sa version"), texteGarde: ta.value };
  cv.querySelector("#u-sauver").click(); await dort(80);
  const sv = appels.filter(a => a.nom === "union_texte_sauver");
  r.sauver = { n: sv.length, version2: sv[1] && sv[1].args.p_version, edition: appels.some(a => a.nom === "union_texte_editer") };

  // 6. Divorce : avertissement pour celui qui a déménagé.
  changerCentre("unions"); await dort(80);
  r.divorce = { avert: el.textContent.includes("terrain d'avant"), bouton: !!el.querySelector('[data-u="divorcer"]') };

  journal = jOrig;
  return r;
})();
