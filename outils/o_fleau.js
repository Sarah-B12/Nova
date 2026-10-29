// v2.06 — Le Fléau (node outils/o_banc.js .. fleau) : K81 → K88, K120 → K126.
// Le serveur est imité ici (un faux fleau_* qui suit les mêmes règles de surface) :
// on vérifie l'écran, les appels envoyés, la coque recopiée, les textes.
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  const msgs = []; const vraiJournal = journal; journal = (t, ...a) => { msgs.push(String(t)); return vraiJournal(t, ...a); };
  const appels = [];
  // ---------- faux serveur ----------
  let S = { bande:"vif", combat:null, tour:0 }, objets = {}, sortie = [];
  const vue = () => S.combat && { ...S.combat };
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => {
    if(!/^fleau_|^agir$/.test(n)) return orig(n, a);
    appels.push([n, a]);
    let d;
    if(n === "fleau_etat") d = { ok:true, jour:"2026-10-29", bande:S.bande, combat:vue() };
    else if(n === "fleau_objets_lire") d = { ok:true, objets };
    else if(n === "fleau_engager"){
      if(S.combat) d = { ok:false, err:"deja" };
      else { S.combat = { vaisseau:etat.vaisseau, coque:pvVaisseau(), coque_max:pvMax(), fleau_pct:100, emballe:false, tour:0, tours:12,
                          annonces:["rayon"], cellules:0, statut:"en_cours", score:null, gain:0, puissance:4, canon:canonVaisseau() };
             d = { ok:true, bande:S.bande, combat:vue(), energie:70 }; }
    }
    else if(n === "fleau_tour"){
      const c = S.combat, s = sortie.shift() || { deg:20, fl:-15 };
      if(a.p_bouclier + a.p_canon + a.p_moteurs > 4 + (a.p_charger ? 1 : 0)) d = { ok:false, err:"puissance" };
      else {
        if(a.p_charger){ c.cellules++; etat.sac.fab_cellule_d_energie = Math.max(0, (etat.sac.fab_cellule_d_energie || 0) - 1); }
        const coup = c.annonces[c.annonces.length - 1];
        c.tour++; c.fleau_pct = Math.max(0, c.fleau_pct + s.fl); c.coque = Math.max(0, c.coque - (c.fleau_pct > 0 ? s.deg : 0));
        c.emballe = c.fleau_pct < 50; c.annonces = s.ann || (c.emballe ? ["piques","rayon"] : ["decharge"]);
        let fin = null;
        if(c.fleau_pct <= 0){ fin = "gagne"; c.statut = "gagne"; c.score = 187.4; c.gain = 650; }
        else if(c.coque <= 0){ fin = "cloue"; c.statut = "perdu"; c.score = 61.2; }
        d = { ok:true, coup, degats: c.fleau_pct > 0 ? s.deg : 0, touche:10 * a.p_canon, fin, combat:vue(), solde:etat.credits + (c.gain || 0) };
      }
    }
    else if(n === "fleau_rompre"){ S.combat.statut = "perdu"; S.combat.score = 12.5; d = { ok:true, combat:vue() }; }
    else if(n === "fleau_classement") d = { ok:true, mois:"2026-10-01", mes_combats:12,
      top:[{ rang:1, nom:"Fox", n:1890.5, moi:false }, { rang:2, nom:"Testeuse", n:1750, moi:true }],
      moi:{ rang:2, n:1750 }, precedent:[{ rang:1, nom:"Eve", n:1999.9, objet:"pique" }, { rang:2, nom:"Bob", n:1500, objet:"lentille" }] };
    else if(n === "agir"){ const ret = (a && a.p_retirer) || {}; Object.keys(ret).forEach(k => etat.sac[k] = Math.max(0, (etat.sac[k]||0) - ret[k]));
      d = { ok:true, energie:etat.energie, jauges:etat.jauges, etat:null }; }
    return Promise.resolve({ data:d, error:null });
  };
  sauverMaintenant = async () => { appels.push(["sauver"]); };
  if(typeof _appliquerEtatStocks === "function"){ const v = _appliquerEtatStocks; _appliquerEtatStocks = e => e ? v(e) : null; }

  // ---------- la carte : le Fléau est un lieu à onglet ----------
  const F = espaceLieu("e2_oeil_piques"), N = espaceLieu("e2_base");
  r.lieu = { type:F.type, onglet:ongletLieuEspace(F), usage:F.usage };
  etat.espace1 = true; etat.permisVaisseau = true; etat.vaisseau = "fab_vaisseau_maitre"; etat.vaisseauPv = {}; etat.ceres = true;
  etat.sac.fab_cellule_d_energie = 3; etat.energie = 80;
  etat.secteur = "ceres"; etat.posEspace = { x:N.x, y:N.y }; majHub();
  const onglets = () => [...document.querySelectorAll(".hub-lien")].filter(b => b.style.display !== "none").map(b => b.dataset.hub);
  r.ongletsNid = onglets();
  etat.posEspace = { x:F.x + 40, y:F.y }; majHub(); await att(60);
  r.ongletsFleau = onglets();
  r.ouvertDeLuiMeme = !document.querySelector("#hub-fleau").hidden;

  // ---------- avant le combat : le signe, le bouton ----------
  const z = () => document.querySelector("#fleau-vue"), txt = () => z().textContent.replace(/\s+/g, " ");
  await majFleau(); await att(30);
  r.signeVif = /point rouge est vif/.test(txt());
  r.aucunChiffre = !/force/i.test(txt());
  r.bouton = z().querySelector("#fl-attaquer") && z().querySelector("#fl-attaquer").textContent;
  r.boutonActif = !z().querySelector("#fl-attaquer").disabled;
  r.texteCanon = /charg/.test(txt()) && /3 au sac/.test(txt());
  S.bande = "aveuglant"; await majFleau(); r.signeAveuglant = /aveuglant/.test(txt());
  S.bande = "sourd"; await majFleau(); r.signeSourd = /sourd/.test(txt());
  etat.energie = 4; await majFleau(); r.refusEnergie = z().querySelector("#fl-attaquer").disabled && /Pas assez d'énergie/.test(txt()); etat.energie = 80;
  const vv = etat.vaisseau; etat.vaisseau = null; await majFleau(); r.refusVaisseau = z().querySelector("#fl-attaquer").disabled; etat.vaisseau = vv;
  await majFleau();

  // ---------- engager ----------
  appels.length = 0;
  z().querySelector("#fl-attaquer").click(); await att(60);
  r.engage = { sauveAvant: appels[0] && appels[0][0] === "sauver", cout: (appels.find(x => x[0] === "fleau_engager") || [])[1], energie: etat.energie };
  r.combat = { barres: z().querySelectorAll(".fl-barres .jauge").length, coup: /Le rayon/.test(txt()), passe: /Passe 1 sur 12/.test(txt()), puissance: /Puissance : 4 sur 4/.test(txt()) };
  // + bloqué à 4 ; le canon chargé donne un point de plus
  r.plusBloque = [...z().querySelectorAll("[data-fl-plus]")].every(b => b.disabled);
  const ch = z().querySelector("#fl-charger"); ch.checked = true; ch.dispatchEvent(new Event("change")); await att(10);
  r.charge = { cinq: /Puissance : 4 sur 5/.test(txt()), plusLibre: [...z().querySelectorAll("[data-fl-plus]")].some(b => !b.disabled) };
  z().querySelector('[data-fl-plus="canon"]').click(); await att(10);
  r.repartition = { ..._fleauRep };
  const ch2 = z().querySelector("#fl-charger"); ch2.checked = false; ch2.dispatchEvent(new Event("change")); await att(10);
  r.dechargeRetire = _fleauRep.canon === 2 && (_fleauRep.bouclier + _fleauRep.canon + _fleauRep.moteurs) === 4;
  // rafraîchir (majHub) ne redessine pas un combat en cours
  _fleauRep.bouclier = 3; _fleauRep.canon = 1; _fleauRep.moteurs = 0; _fleauRendre();
  const avant = z().innerHTML; await majFleau(true); r.rafraichirGarde = z().innerHTML === avant;
  // une passe chargée : la bonne requête, la coque recopiée, le compte rendu
  const ch3 = z().querySelector("#fl-charger"); ch3.checked = true; ch3.dispatchEvent(new Event("change")); await att(10);
  z().querySelector('[data-fl-plus="canon"]').click(); await att(10);
  appels.length = 0; sortie = [{ deg:40, fl:-30 }];
  z().querySelector("#fl-tenir").click(); await att(80);
  const t1 = (appels.find(x => x[0] === "fleau_tour") || [])[1];
  r.passe1 = { envoi:t1, coque: pvVaisseau(), cellulesSac: etat.sac.fab_cellule_d_energie,
               compteRendu: /Ton bouclier prend l'essentiel du trait\. −40 PV/.test(txt()) && /Ton canon le touche/.test(txt()) };
  // il s'emballe : deux coups annoncés
  sortie = [{ deg:30, fl:-30 }];
  z().querySelector("#fl-tenir").click(); await att(80);
  r.deuxCoups = { titre: /Les piques ou le rayon \?/.test(txt()), consigne: /n'en lâchera qu'un/.test(txt()) };
  sortie = [{ deg:25, fl:-10 }];
  z().querySelector("#fl-tenir").click(); await att(80);
  r.lequelPart = /C'est le rayon qui part/.test(txt());
  // victoire
  msgs.length = 0; sortie = [{ deg:0, fl:-60 }];
  z().querySelector("#fl-tenir").click(); await att(80);
  r.victoire = { journal: msgs.some(m => /Victoire contre le Fléau\. Score du jour : 187\.4\. \+650 ₡\./.test(m)), bloc: !!z().querySelector(".fl-fin.gagne"),
                 demain: /Une attaque par jour/.test(txt()), pasDeBouton: !z().querySelector("#fl-attaquer") };

  // ---------- cloué : remorqué au Nid ----------
  S.combat = null; etat.vaisseauPv = {}; etat.posEspace = { x:F.x, y:F.y }; await majFleau();
  z().querySelector("#fl-attaquer").click(); await att(60);
  msgs.length = 0; sortie = [{ deg:400, fl:-5 }];
  z().querySelector("#fl-tenir").click(); await att(120);
  r.cloue = { auNid: surNid(), pv: pvVaisseau() > 0, texte: msgs.some(m => /CLOUÉ/.test(m)) && msgs.some(m => /jusqu'au Nid/.test(m)), defaite: msgs.some(m => /Le Fléau tient/.test(m)) };

  // ---------- rompre ----------
  S.combat = null; etat.vaisseauPv = {}; etat.posEspace = { x:F.x, y:F.y }; majHub(); await majFleau();
  z().querySelector("#fl-attaquer").click(); await att(60);
  confirmerJoli = async () => true;
  z().querySelector("#fl-rompre").click(); await att(80);
  r.rompre = /Tu romps le combat/.test(txt()) && /défaite/.test(txt());

  // ---------- classement ----------
  document.querySelector('[data-fsous="classement"]').click(); await att(60);
  const zc = document.querySelector("#fleau-class"), tc = zc.textContent.replace(/\s+/g, " ");
  r.classement = { visible: !zc.hidden && z().hidden, mois: tc.includes("octobre 2026"), dix: /10 meilleurs combats/.test(tc),
                   top: zc.querySelectorAll(".ar-top li").length === 2 && !!zc.querySelector(".ar-top li.moi"),
                   decimale: tc.includes("1 890,5"), mesCombats: /Tes combats ce mois-ci : 12 \(les 10 meilleurs comptent\)/.test(tc),
                   precedent: /Le mois dernier : 🥇 Eve \(1 999,9, une pique\)/.test(tc.replace(/\u202f/g, " ")) };
  document.querySelector('[data-fsous="combat"]').click(); await att(30);

  // ---------- objets du podium ----------
  const demain = new Date(Date.now() + 3 * 86400000).toISOString();
  objets = { lentille: demain, pique: demain }; await fleauObjetsCharger();
  r.objets = { lentille: fleauObjetActif("lentille"), pupille: fleauObjetActif("pupille"), facteur: +fleauLentille().toFixed(3) };
  _registrePalier = _registrePalier || "inconnu";
  const avecL = chancePatrouille(); objets = {}; await fleauObjetsCharger(); const sansL = chancePatrouille();
  r.patrouilleLentille = +(avecL / sansL).toFixed(3);
  // la sonde : SONDE_TAUX × ⅔
  const vr = Math.random; let ouvert = 0; const vraiOS = ouvrirSonde; ouvrirSonde = () => ouvert++;
  objets = { lentille: demain }; await fleauObjetsCharger();
  Math.random = () => 0.12; tenterSonde(); const avecLs = ouvert;        // 0,12 ≥ 0,10 : pas d'interception
  objets = {}; await fleauObjetsCharger(); tenterSonde(); const sansLs = ouvert - avecLs;   // 0,12 < 0,15 : interception
  Math.random = vr; ouvrirSonde = vraiOS;
  r.sondeLentille = { avec: avecLs, sans: sansLs };
  await majFleau();
  objets = { pique: demain }; await fleauObjetsCharger(); _fleauRendre();
  r.objetsAffiches = /Une pique du Fléau : aucun voleur ne réussit contre toi, encore 3 jours/.test(txt());

  // ---------- le canon contre les sondes : une cellule (K83) ----------
  etat.vaisseau = "fab_vaisseau_maitre"; etat.sac.fab_cellule_d_energie = 2; _apt = () => false;
  lancerTirSonde(() => {}, () => {}); let m = document.querySelector("#tir-modale");
  r.sonde = { base: _tirSalves(), caseCochee: !!m.querySelector("#sd-canon") && m.querySelector("#sd-canon").checked };
  appels.length = 0; m.querySelector("#sd-jouer").click(); await att(60);
  r.sonde.apres = _tirRestant; r.sonde.cellule = appels.some(x => x[0] === "agir" && x[1].p_retirer && x[1].p_retirer.fab_cellule_d_energie === 1); r.sonde.sac = etat.sac.fab_cellule_d_energie;
  _tirFermer();
  lancerTirSonde(() => {}, () => {}); m = document.querySelector("#tir-modale");
  m.querySelector("#sd-canon").checked = false; appels.length = 0; m.querySelector("#sd-jouer").click(); await att(40);
  r.sonde.decoche = { salves: _tirRestant, aucunAppel: !appels.some(x => x[0] === "agir") }; _tirFermer();
  etat.sac.fab_cellule_d_energie = 0; lancerTirSonde(() => {}, () => {}); m = document.querySelector("#tir-modale");
  r.sonde.sansCellule = { grisee: m.querySelector("#sd-canon").disabled, muet: /ton canon reste muet/.test(m.textContent) }; _tirFermer();
  etat.vaisseau = "fab_vaisseau_cargo"; lancerTirSonde(() => {}, () => {}); m = document.querySelector("#tir-modale");
  r.sonde.cargo = { pasDeCase: !m.querySelector("#sd-canon"), salves: _tirSalves() }; _tirFermer();
  etat.vaisseau = "fab_vaisseau_maitre";
  let vv2 = document.querySelector("#vaisseau-vue"); if(!vv2){ vv2 = document.createElement("div"); vv2.id = "vaisseau-vue"; document.body.appendChild(vv2); }
  majVaisseau(); r.garage = /une cellule d'énergie par tir/.test(vv2.textContent);

  // ---------- la pique, côté voleur ----------
  const vs = sb.rpc; sb.rpc = (n, a) => n === "vol_conclure" ? Promise.resolve({ data:{ ok:true, reussi:false, pique:true, signe:false, prison:false, mode:"vol", cible:"Eve" }, error:null }) : vs(n, a);
  msgs.length = 0; await _volConclure("vol", { id:1, cible:"Eve" }, true);
  r.voleur = { pique: msgs.some(m => /pris dans une pique noire plantée devant chez Eve/.test(m)), pasRepere: !msgs.some(m => /t'a repéré/.test(m)), sansNom: msgs.some(m => /Son journal ne dira pas qui/.test(m)) };
  sb.rpc = vs;
  // aucun mot interdit dans les textes du Fléau
  const tout = [FLEAU_SIGNES, FLEAU_COUPS, FLEAU_ERREURS].map(o => JSON.stringify(o)).join(" ") + document.querySelector("#hub-fleau").textContent;
  r.motsInterdits = ["quarantaine","bestiole","œil fermé","AREPO","force du jour"].filter(w => tout.toLowerCase().includes(w.toLowerCase()));
  journal = vraiJournal;
  return r;
})();
