// v3.16 (K289) — la discussion de groupe des missions : onglets, pastille, lecture, envoi.
//   node outils/o_banc.js . v316
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(400);
  const journ = []; journal = (t, type) => { journ.push({ t, type }); };
  const appels = [];
  let messages = [{ id: 1, nom: "Bero", moi: false, texte: "On part ce soir ?\nJe prends l'ingénieur.", cree_le: new Date().toISOString() }];
  let nonLus = { "7": 3 };
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => {
    if(n === "missions_lire") return Promise.resolve({ data: _faux, error: null });
    if(n === "mission_chat_nouveaux"){ appels.push(n); return Promise.resolve({ data: { ok: true, groupes: nonLus }, error: null }); }
    if(n === "mission_chat_lire"){ appels.push(n + ":" + a.p_groupe); nonLus = { "7": 0 }; return Promise.resolve({ data: { ok: true, liste: messages, ecrire: true }, error: null }); }
    if(n === "mission_chat_ecrire"){ appels.push(n + ":" + a.p_texte);
      if(a.p_texte === "flood") return Promise.resolve({ data: { ok: false, err: "trop_vite" }, error: null });
      messages = messages.concat([{ id: 2, nom: "Testeuse", moi: true, texte: a.p_texte, cree_le: new Date().toISOString() }]);
      return Promise.resolve({ data: { ok: true, id: 2 }, error: null }); }
    return orig(n, a);
  };
  const membre = (nom, st) => ({ nom, statut: st || "actif", poste: null });
  const mission = (id, gid, gstatut, monStatut) => ({ id, type: "bouture", nom: "La bouture capricieuse", statut: "recrutement",
    difficulte: "facile", niveau_min: 8, taille_min: 2, taille_max: 4, postes: {}, mon_groupe: gid, mon_statut: monStatut, deja: true,
    groupes: gid ? [{ id: gid, statut: gstatut, ouvert: true, fondateur: "Bero", moi_fondateur: false, membres: [membre("Bero"), membre("Testeuse")] }] : [],
    invitations: [], fil: [] });
  var _faux = { ok: true, jour: "2026-11-19", gains: [], missions: [mission(1, 7, "formation", "actif"), mission(2, null, null, null)] };
  await missionsCharger();
  r.nonLusCharges = _missions.chat;
  const z = document.createElement("div"); document.body.appendChild(z);
  majQueteHub = () => majMissions(z);
  majMissions(z);
  const cartes = () => [...z.querySelectorAll(".mi-carte")];
  r.onglets = cartes().map(c => [...c.querySelectorAll("[data-mi-onglet]")].map(b => b.textContent.trim()));
  r.pastille = (z.querySelector(".mi-pastille") || {}).textContent || null;
  // Ouvrir la discussion
  z.querySelector('[data-mi-onglet="discussion"]').click(); await dort(50);
  const c1 = cartes()[0];
  r.discussion = { messages: c1.querySelectorAll(".conc-msg").length, texte: (c1.querySelector(".conc-txt") || {}).textContent,
    saisie: !!c1.querySelector("[data-mi-chat-txt]"), carteMasquee: !c1.querySelector(".mi-membres"),
    pastilleApres: !!z.querySelector(".mi-pastille"), lu: appels.includes("mission_chat_lire:7"), nonLusLocal: _missions.chat["7"] };
  // Brouillon gardé au redessin, puis envoi
  const ta = c1.querySelector("[data-mi-chat-txt]"); ta.value = "J'arrive"; ta.dispatchEvent(new Event("input"));
  majMissions(z); await dort(30);
  r.brouillonGarde = cartes()[0].querySelector("[data-mi-chat-txt]").value;
  cartes()[0].querySelector("[data-mi-chat-envoi]").click(); await dort(80);
  r.envoi = { appel: appels.includes("mission_chat_ecrire:J'arrive"), messages: cartes()[0].querySelectorAll(".conc-msg").length,
    moi: cartes()[0].querySelectorAll(".conc-msg.moi").length, saisieVide: cartes()[0].querySelector("[data-mi-chat-txt]").value === "" };
  // Ctrl+Entrée et anti-rafale
  const ta2 = cartes()[0].querySelector("[data-mi-chat-txt]"); ta2.value = "flood";
  ta2.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true })); await dort(50);
  r.antiRafale = (journ[journ.length - 1] || {}).t;
  // Retour à l'onglet Mission
  cartes()[0].querySelector('[data-mi-onglet="mission"]').click(); await dort(30);
  r.retourMission = !!cartes()[0].querySelector(".mi-membres") && !cartes()[0].querySelector("[data-mi-chat]");
  // Mission finie : lisible, sans saisie
  _faux.missions[0].groupes[0].statut = "reussi"; await missionsCharger(); _mOnglet[1] = "discussion"; majMissions(z); await dort(50);
  r.finie = { onglet: !!cartes()[0].querySelector('[data-mi-onglet="discussion"]'), saisie: !!cartes()[0].querySelector("[data-mi-chat-txt]"),
    note: /La mission est finie/.test(cartes()[0].textContent) };
  // Membre qui a abandonné : pas d'onglet
  _faux.missions[0].groupes[0].statut = "lance"; _faux.missions[0].mon_statut = "abandon"; await missionsCharger(); majMissions(z);
  r.abandon = !!cartes()[0].querySelector("[data-mi-onglet]");
  r.styleConc = [...document.querySelectorAll("style")].some(s => s.textContent.includes(".conc-msg"));
  r.minuteur = typeof _mChatTimer;
  return r;
})()
