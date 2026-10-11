// v1.68 — Le satellite (node outils/o_banc.js . satellite)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  const appels = [];
  sauverMaintenant = async () => {}; confirmerJoli = async () => true;
  let ICI = false; enEcart = () => ICI; surLieuEspace = () => ICI;
  const base = { id:31, type:"satellite", nom:"Le satellite à la dérive", intro:"La sonde Bardane dérive…", secrete:false, revele:true,
    difficulte:"redoutable", niveau_min:35, taille_min:4, taille_max:4, postes:{ hacker:1, ingenieur:1, artilleur:2 }, statut:"en_cours",
    test:false, refus:null, mon_groupe:9, mon_statut:"actif", deja:true, mesure:"difficile", invitations:[], epreuve:{ tentatives:0 },
    coffre:{ vide:false, minimum:true, scelle:false, mes_depots:{}, sortes:[] },
    groupes:[{ id:9, ouvert:true, statut:"lance", fondateur:"Bob", moi_fondateur:false, membres:[{nom:"Bob",statut:"actif"},{nom:"Testeuse",statut:"actif",moi:true}] }] };
  let LECTURE, SAS = { ok:true, ouvert:false, bien:1, mal:2, restants:9 };
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => { appels.push(nom + " " + JSON.stringify(a||{}));
    if(nom === "missions_lire") return Promise.resolve({ data:LECTURE, error:null });
    if(nom === "satellite_sas") return Promise.resolve({ data:SAS, error:null });
    if(nom === "vaisseau_installer") return Promise.resolve({ data:{ ok:true, type:"module", expire_le:new Date(Date.now()+20*864e5).toISOString() }, error:null });
    if(nom.startsWith("satellite_")) return Promise.resolve({ data:{ ok:true, signales:4, reussi:true }, error:null });
    return orig(nom, a); };
  const corps = () => document.querySelector("#hub-quete-corps");
  const txt = () => corps().textContent.replace(/\s+/g, " ");
  const voir = async (vue) => { LECTURE = { ok:true, jour:"2027-01-05", gains:[], missions:[ Object.assign({}, base, { vue }) ] };
    _queteSous = "missions"; await missionsCharger(); majQueteHub(); await new Promise(x => setTimeout(x, 30)); };
  const pt = { artilleur:["Bob","Cyd"], hacker:["Eve"], ingenieur:["Testeuse"] };
  // 1. Rendez-vous.
  await voir({ phase:"rendezvous", limite:"2027-01-08", postes_tenus:pt, signales:["Bob"], moi_signale:false });
  r.loin = txt().includes("Rendez-vous à Bardane (carte de Triptolème)") && txt().includes("Signalés aujourd'hui : Bob (1 sur 4)");
  ICI = true; await voir({ phase:"rendezvous", limite:"2027-01-08", postes_tenus:pt, signales:["Bob"], moi_signale:false });
  corps().querySelector("[data-mi-signaler]").click(); await new Promise(x => setTimeout(x, 80));
  r.signaler = appels.some(a => a.startsWith("satellite_signaler"));
  // 2. Escorte : tir d'un artilleur.
  await voir({ phase:"escorte", postes_tenus:pt, mon_poste:"artilleur", escorte:{ jour:"2027-01-05", tirs:{} }, tir:{ cible:2, tirs:5, duree:30 } });
  r.tirTexte = txt().includes("Abats les sondes qui traversent l'écran : 2 à toucher. Tirs : 5. Temps : 30 s.");
  corps().querySelector("[data-tir-go]").click(); await new Promise(x => setTimeout(x, 30));
  const svg = corps().querySelector("#mi-tir-svg"); svg.getBoundingClientRect = () => ({ left:0, top:0, width:300, height:180 });
  for(let k = 0; k < 2; k++){ _tir.sondes = [{ x:150, y:90, v:0 }]; const e = new window.Event("pointerdown"); e.clientX = 150; e.clientY = 90; svg.dispatchEvent(e); }
  await new Promise(x => setTimeout(x, 80));
  r.tirAppel = appels.some(a => a.startsWith("satellite_tir"));
  await voir({ phase:"escorte", postes_tenus:pt, mon_poste:"hacker", escorte:{ jour:"2027-01-05", tirs:{ a:true, b:true } } });
  r.escorte = !!corps().querySelector("[data-mi-escorte]") && txt().includes("Les gardiennes chargent.");
  // 3. Sas.
  await voir({ phase:"sas", sas_limite:"2027-01-06", postes_tenus:pt, mon_poste:"ingenieur", sas:{ essais:10, duree:120, manche:0, historique:[{ essai:[1,2,3,4], bien:1, mal:2 }] } });
  r.sasTexte = txt().includes("Essais : 9.") && corps().querySelectorAll(".mi-sas-c").length === 6;
  [0,1,2,3].forEach(i => corps().querySelector(`[data-sas-c="${i}"]`).click());
  corps().querySelector("[data-sas-ok]").click(); await new Promise(x => setTimeout(x, 80));
  const as = appels.find(a => a.startsWith("satellite_sas"));
  r.sasAppel = as && JSON.parse(as.slice(14)).p_essai.join(",") === "0,1,2,3";
  // 4. Cœur.
  await voir({ phase:"coeur", sas_limite:"2027-01-06", postes_tenus:pt, mon_poste:"hacker", coeur:{ vigilance:2 } });
  r.coeur = corps().querySelector("[data-mi-coeur]").dataset.miVig === "2";
  // 5. Module.
  const pv0 = pvMax("fab_vaisseau_cargo");
  _modulesVaisseau = {}; etat.sac.module_arepo = 1;
  await installerModule();
  r.module = { pvAvant: pv0, pvApres: pvMax("fab_vaisseau_cargo"), actif: moduleActif(), perso: estObjetPersonnel("module_arepo") };
  return r;
})();
