// v1.61 — Missions, brique 3 : le client du moteur (node outils/o_banc.js . missions)
// Faux serveur : missions_lire + RPC d'action. Vérifie le rendu du sous-onglet,
// H18 (onglet Quêtes partout pour une affaire en cours), le casse non révélé,
// le coffre, les gains, et le calendrier de la console dev.
(async function(){
  const r = { erreurs: [] };
  await new Promise(x => setTimeout(x, 1500));
  const appels = [];
  let LECTURE = { ok:true, jour:"2026-10-11", missions:[], gains:[] };
  const MOCK = {
    missions_lire: () => LECTURE,
    mission_groupe_creer: a => ({ ok:true, groupe:7 }),
    mission_gain_recuperer: a => ({ ok:true, item:"cuir", qte:1 }),
    mission_deposer: a => ({ ok:true, depose:2, demande:a.p_qte }),
    mission_rejoindre: a => ({ ok:false, err:"plein" }),
    admin_calendrier: () => ({ ok:true, jour:"2026-10-11", debris:[], poste:[], protocole:[], expeditions:[], forteresses:[],
      missions_actif:true, missions_ouvertes:["bouture"],
      missions:[ { id:3, type:"bouture", statut:"prevue", jour:"2026-10-15", recrutement_fin:null, test:false, recruteur:null, groupes:0 },
                 { id:4, type:"casse", statut:"recrutement", jour:"2026-10-11", recrutement_fin:"2026-10-16", test:true, recruteur:"Dev", groupes:1 } ] })
  };
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, args) => { appels.push(nom + (args ? " " + JSON.stringify(args) : "")); return MOCK[nom] ? Promise.resolve({ data: MOCK[nom](args || {}), error:null }) : orig(nom, args); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => (corps() ? corps().textContent.replace(/\s+/g, " ") : "");
  const voir = async (vue) => { _queteSous = vue; await missionsCharger(); majQueteHub(); await new Promise(x => setTimeout(x, 30)); };

  // 1. Rien : aucune affaire, message d'attente.
  await voir("missions");
  r.vide = txt().includes("Aucune mission pour l'instant");
  r.affaireVide = missionsAffaireEnCours();
  r.sousOnglets = [...document.querySelectorAll("#quete-sous [data-qsous]")].map(b => b.textContent + (b.classList.contains("actif") ? "*" : ""));

  // 2. Une mission en recrutement, deux groupes, je n'ai pas de groupe.
  LECTURE = { ok:true, jour:"2026-10-11", gains:[], missions:[ { id:1, type:"bouture", nom:"La bouture capricieuse", secrete:false, revele:true,
    difficulte:"facile", niveau_min:8, taille_min:2, taille_max:4, postes:{}, statut:"recrutement", test:false, recrutement_fin:"2026-10-16",
    refus:null, mon_groupe:null, deja:false, mesure:null, coffre:null, epreuve:null, invitations:[],
    groupes:[ { id:5, ouvert:true, statut:"formation", fondateur:"Ana", membres:[{nom:"Ana",statut:"actif"}] },
              { id:6, ouvert:false, statut:"formation", fondateur:"Bob", membres:[{nom:"Bob",statut:"actif"}] } ] } ] };
  await voir("missions");
  r.recrutement = { titre: txt().includes("La bouture capricieuse"), rang: txt().includes("Facile · niveau 8 · groupe de 2 à 4"),
    dernierJour: txt().includes("jusqu'au jeudi 15 octobre inclus"), fonder: !!corps().querySelector('[data-mi-creer="1"][data-mi-ouvert="0"]'),
    rejoindre: [...corps().querySelectorAll("[data-mi-rejoindre]")].map(b => b.dataset.miRejoindre) };
  r.affaireSansGroupe = missionsAffaireEnCours();
  corps().querySelector('[data-mi-creer="1"][data-mi-ouvert="1"]').click();
  await new Promise(x => setTimeout(x, 80));
  r.appelCreer = appels.find(a => a.startsWith("mission_groupe_creer"));

  // 3. Refus de niveau.
  LECTURE.missions[0].refus = "niveau";
  await voir("missions");
  r.refusNiveau = txt().includes("Il faut le niveau 8 pour cette mission.") && !corps().querySelector("[data-mi-creer]");

  // 4. Mon groupe parti, avec coffre et mesure (H12 : libellé seul).
  etat.sac = { cuir: 7, fab_biofil_renforce: 1, cendrite: 4, sylve: 2 };
  LECTURE.missions[0] = Object.assign({}, LECTURE.missions[0], { refus:null, mon_groupe:5, mon_statut:"actif", mon_poste:null, mesure:"equilibree",
    postes:{ crocheteur:1, guetteur:1 },
    groupes:[ { id:5, ouvert:true, statut:"lance", fondateur:"Ana", moi_fondateur:false, membres:[{nom:"Ana",statut:"actif"},{nom:"Testeuse",statut:"actif",moi:true,poste:"guetteur"},{nom:"Cyd",statut:"abandon"}] } ],
    coffre:{ vide:false, minimum:false, scelle:false, mes_depots:{ cuir:2 },
      sortes:[ { id:"cape", nom:"Capes", min:3, max:9, unites:1, recettes:[{ fab_biofil_renforce:1, cuir:2 }] },
               { id:"crochet", nom:"Crochets", min:1, max:2, unites:2, recettes:[{ fab_lingot_de_cendrite:1 }, { fab_lingot_de_silite:1 }] } ] },
    epreuve:{ tentatives:1, reussie:false, jour:"2026-10-11" } });
  await voir("missions");
  r.monGroupe = { mesure: txt().includes("L'épreuve sera équilibrée pour ce groupe."), aucunChiffre: !/force|rapport|%/.test(txt()),
    abandonne: txt().includes("Cyd (a abandonné)"), poste: (corps().querySelector("#mi-poste") || {}).tagName === "SELECT",
    coffre: txt().includes("Capes") && txt().includes("1 sur 3") && txt().includes("il en manque 2") && txt().includes("ou"),   // v2.10 : chiffres en clair
    choixDepot: [...corps().querySelectorAll("#mi-dep-item option")].map(o => o.value),
    tentative: txt().includes("1 tentative sur 2. La seconde s'ouvre le lendemain."),
    abandonner: !!corps().querySelector("[data-mi-abandon]") };
  r.affaireGroupe = missionsAffaireEnCours();
  corps().querySelector("#mi-dep-qte").value = "5";
  corps().querySelector("[data-mi-deposer]").click();
  await new Promise(x => setTimeout(x, 80));
  r.appelDeposer = appels.find(a => a.startsWith("mission_deposer"));

  // 5. Fondateur en formation, pas assez de membres : « Partir » grisé.
  LECTURE.missions[0].groupes[0] = { id:5, ouvert:false, statut:"formation", fondateur:"Testeuse", moi_fondateur:true, invites:["Eve"],
    membres:[{nom:"Testeuse",statut:"actif",moi:true}] };
  await voir("missions");
  r.fondateur = { inviter: !!corps().querySelector("#mi-inv-nom"), invites: txt().includes("Invités : Eve"),
    partirGrise: !!corps().querySelector("[data-mi-lancer]")?.disabled, quitter: !!corps().querySelector("[data-mi-quitter]") };

  // 6. Casse non révélé, simple invité : ni nom, ni rang ; le mot de C20.
  LECTURE = { ok:true, jour:"2026-10-11", gains:[], missions:[ { id:9, type:null, nom:null, secrete:true, revele:false, difficulte:null,
    statut:"recrutement", test:false, refus:"intrusion", mon_groupe:null, deja:false, groupes:[], invitations:[{ groupe:12, par:"Fox" }] } ] };
  await voir("missions");
  r.casse = { titre: txt().includes("Un mot glissé à voix basse"), mot: txt().includes("Fox t'a fait passer un mot, à voix basse : « J'ai besoin d'une ombre de plus. Tu en es ? »"),
    pasDeNom: !txt().includes("casse") && !txt().includes("Casse"), accepter: !!corps().querySelector('[data-mi-inv="12"][data-mi-rep="1"]') };
  r.affaireInvitation = missionsAffaireEnCours();

  // 7. Un gain en attente (H15) et H18 : l'onglet Quêtes visible même loin du comptoir.
  LECTURE = { ok:true, jour:"2026-10-11", missions:[], gains:[ { id:44, item:"cuir", qte:1, mission:"La balise sous la glace",
    expire_le:new Date(Date.now() + 50 * 3600e3).toISOString() } ] };
  await voir("missions");
  r.gain = { ligne: txt().includes("1 × Cuir") && txt().includes("La balise sous la glace") && txt().includes("2 j"), bouton: !!corps().querySelector('[data-mi-gain="44"]') };
  corps().querySelector('[data-mi-gain="44"]').click();
  await new Promise(x => setTimeout(x, 80));
  r.appelGain = appels.find(a => a.startsWith("mission_gain_recuperer"));
  majHub();
  r.lienQuetes = document.querySelector('.hub-lien[data-hub="quete"]').style.display !== "none";

  // 8. La quête principale se dessine toujours dans son sous-onglet.
  await voir("principale");
  r.principale = corps().innerHTML.length > 0 && !txt().includes("Aucune mission");

  // 9. Calendrier de la console dev.
  const d = document.createElement("div"); d.id = "dev-cal"; document.body.appendChild(d);
  await _devChargerCalendrier();
  r.calendrier = [...d.querySelectorAll("tr")].map(t => t.textContent.replace(/\s+/g, " ")).filter(t => t.includes("🎯"));
  return r;
})();
