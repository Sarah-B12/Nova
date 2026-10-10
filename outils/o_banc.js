// Banc d'essai (facultatif) : cd outils && npm i jsdom@24 acorn acorn-walk && node o_banc.js .. lent|rapide|unitaire|mvt
// Banc d'essai : charge index.html dans jsdom avec un faux Supabase.
// Usage : node o_banc.js <racine> <scenario>
// v1.30b — tous les fichiers d'outils commencent par « o_ » ; un scénario
// <nom> est le fichier o_<nom>.js (le banc le trouve tout seul).
const fs = require("fs"), path = require("path");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const RAC = process.argv[2], SCEN = process.argv[3] || "lent";

const DELAIS = {
  lent:   { profil: 2500, sac: 100, jauges: 100 },   // réseau mobile : le profil arrive APRÈS la minuterie de 1,2 s
  rapide: { profil: 50,   sac: 100, jauges: 100 },
  mvt: { profil: 50, sac: 50, jauges: 50 },
  unitaire: { profil: 50, sac: 50, jauges: 50 },
  sync: { profil: 50, sac: 50, jauges: 50 },   // v1.17 : bugs de synchro (o_sync.js)
  retours: { profil: 50, sac: 50, jauges: 50 }, // v1.19 : retours testeurs (o_retours.js)
  sondes: { profil: 50, sac: 50, jauges: 50 },  // v1.20 : gain des sondes (o_sondes.js)
  volrisque: { profil: 50, sac: 50, jauges: 50 }, // v1.22 : extrait le barème de vol (o_volrisque.js)
  vol: { profil: 50, sac: 50, jauges: 50 },       // v1.22 : vrai vol entre joueurs (o_vol.js)
  plaintes: { profil: 50, sac: 50, jauges: 50 },  // v1.23 : plaintes et primes (o_plaintes.js)
  traque: { profil: 50, sac: 50, jauges: 50 },    // v1.24 : la chasse (o_traque.js)
  aptitudes: { profil: 50, sac: 50, jauges: 50 }, // v1.25 : arbre remanié (o_aptitudes.js)
  glyphes: { profil: 50, sac: 50, jauges: 50 },   // v1.28 : écriture de l'ancien (o_glyphes.js)
  ordre: { profil: 50, sac: 50, jauges: 50 },     // v1.29 : ordre avec glyphes (o_ordre.js)
  debris: { profil: 50, sac: 50, jauges: 50 },    // v1.31 : chutes de débris (o_debris.js)
  niveaux: { profil: 50, sac: 50, jauges: 50 },   // v1.33 : niveau requis (o_niveaux.js)
  terrain: { profil: 50, sac: 50, jauges: 50 },   // v1.35 : terrain côté serveur (o_terrain.js)
  couple: { profil: 50, sac: 50, jauges: 50 },    // v1.36 : mariage (o_couple.js)
  seq: { profil: 50, sac: 50, jauges: 50 },
  banq: { profil: 50, sac: 50, jauges: 50 },
  q7: { profil: 50, sac: 50, jauges: 50 },
  prison: { profil: 50, sac: 50, jauges: 50 },
  dialogues: { profil: 50, sac: 50, jauges: 50 },
  calques: { profil: 50, sac: 50, jauges: 50 },
  loup: { profil: 50, sac: 50, jauges: 50 },
  profil: { profil: 50, sac: 50, jauges: 50 },    // v1.36p : page profil (o_profil.js)
  journalcat: { profil: 50, sac: 50, jauges: 50 },
  fichebete: { profil: 50, sac: 50, jauges: 50 }, // v1.36v : bête sur la fiche (o_fichebete.js)
  cfsaisie: { profil: 50, sac: 50, jauges: 50 },  // v1.36z : saisie des Confidences (o_cfsaisie.js)
  avertcombat: { profil: 50, sac: 50, jauges: 50 },// v1.36aa : avertissement combat (o_avertcombat.js)
  famille: { profil: 50, sac: 50, jauges: 50 },
  histoires: { profil: 50, sac: 50, jauges: 50 },
  avatar: { profil: 50, sac: 50, jauges: 50 },
  registre: { profil: 50, sac: 50, jauges: 50 },
  registre2: { profil: 50, sac: 50, jauges: 50 },
  vote: { profil: 50, sac: 50, jauges: 50 },
  niveau: { profil: 50, sac: 50, jauges: 50 },
  v149: { profil: 50, sac: 50, jauges: 50 },
  v150: { profil: 50, sac: 50, jauges: 50 },
  mur: { profil: 50, sac: 50, jauges: 50 },
  v154: { profil: 50, sac: 50, jauges: 50 },
  v155: { profil: 50, sac: 50, jauges: 50 },
  v158: { profil: 50, sac: 50, jauges: 50 },     // v1.58 : leçons en activités, étapes cachées, objet tiré (o_v158.js)     // v1.55 : bannière de Famille (o_v155.js)     // v1.54 : corrections de quêtes et de lieux (o_v154.js)      // v1.53 : mur repliable (o_mur.js)     // v1.50 : transmissions épinglées (o_v150.js)     // v1.49 : Poste en transit, nouveaux arrivants (o_v149.js)   // v1.47 : console dev, monter un niveau (o_niveau.js)     // v1.46b : retour du vote (o_vote.js) // v1.46 : briques 4-7 côté client (o_registre2.js) // v1.45 : Registre du Protocole (o_registre.js)   // v1.44 : coiffures en deux morceaux (o_avatar.js) // v1.41 : petites histoires et mini-jeux (o_histoires.js)   // v1.37 : enfants, brique 1 (o_famille.js)
  intel: { profil: 50, sac: 50, jauges: 50 },     // v1.36ab : bonus de l'Intelligence (o_intel.js)// v1.36u : tri des messages serveur (o_journalcat.js)      // v1.36o : pas de loup, flèches seules (o_loup.js)   // v1.36n : repères des calques (o_calques.js) // v1.36l : boîtes maison (o_dialogues.js)    // v1.36f : conduite en prison (o_prison.js)        // v1.36e : Q7 plus difficile (o_q7.js)      // v1.36d : bannière du donneur (o_banq.js)       // v1.36c : séquence Q3/Q5 (o_seq.js)
}[SCEN];

const donnees = {
  inscrit: true, nom: "Testeuse", pos: { x: 1225, y: 325 }, creeLe: Date.now() - 86400000 * 5, _rev: 7, _maj: 1,
  energie: 80, energieMaj: Date.now(), sacOrdre: ["cendrite"], avatar: null,
  maison: { palier: 1, plot: 0, chantier: null },
  terrain: { parcelles: [{ type: "maison" }, { type: "mine", stock: 200, max: 500 }, { type: "atelier", nomDonne: "Forge" },
                         { type: "hangar", drones: [null, null] }, { type: "biodome", cases: [null, null, null, null] }, null] },
  quetes: { done: ["q1"], active: null, verrous: {} },
  prisonJusqua: Date.now() + 3600e3, prisonFaction: "toundra",           // prison de la VEILLE, levée depuis
  _pauseResteMin: 999999, _aRoleGouv: true,                               // transitoires de la veille
  _pauseCumulApplique: 1234                                               // registre : doit survivre
};
const profil = { id: "u1", nom: "Testeuse", faction: "ignis", credits: 4321, xp: 250, reputation: 3, cercles: {}, role_admin: null,
                 avatar: { genre: "f" }, donnees };

const STUB = `
(function(){
  const D = ${JSON.stringify(DELAIS)};
  const PROFIL = ${JSON.stringify(profil)};
  window.__appels = [];
  const retard = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
  const RPC = {
    sac_lire:      () => retard(D.sac, { data: { sac: { cendrite: 12, sylve: 3 }, coffre: { voltane: 2 }, soute: {}, lots: [], equipe: {} }, error: null }),
    jauges_lire:   () => retard(D.jauges, { data: { ok: true, o2: 41, sante: 52, moral: 63, energie: 77 }, error: null }),
    pause_etat:    () => retard(30, { data: { ok: true, en_pause: false, jour_reel_ms: 86400000, cumul_ms: 1234, reste_min_ms: 0, reste_max_ms: 0 }, error: null }),
    mon_etat_prison: () => retard(30, { data: { en_prison: false }, error: null }),
    mort_etat:     () => retard(30, { data: { ok: true, mort: false }, error: null }),
    sauver_profil: () => retard(30, { data: { ok: true, rev: 8, maj: 2 }, error: null }),
    crediter:      () => retard(30, { data: 4321, error: null }),
    // v1.35 : le terrain vient du serveur (même contenu que la fixture donnees)
    terrain_lire:  () => retard(40, { data: { ok: true, proprio: "u1", abandons: 0,
      parcelles: Array.from({ length: 24 }, (_, i) => PROFIL.donnees.terrain.parcelles[i] || null),
      maison: PROFIL.donnees.maison, integrite: {} }, error: null }),
  };
  function lazy(fn){ let p = null; return { then(a, b){ p = p || fn(); return p.then(a, b); } }; }  // thenable PARESSEUX, comme supabase-js
  function builder(table){
    let unique = false;
    const b = new Proxy({}, { get(_, k){
      if(k === "then") return (a, r) => {
        window.__appels.push("from:" + table);
        let data = unique ? null : [];
        if(table === "profils" && unique) return retard(D.profil, { data: PROFIL, error: null }).then(a, r);
        return retard(20, { data, error: null }).then(a, r);
      };
      if(k === "catch" || k === "finally") return undefined;
      return (...args) => { if(k === "maybeSingle" || k === "single") unique = true; return b; };
    }});
    return b;
  }
  window.supabase = { createClient(){ return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: { user: { id: "u1" } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }),
      signOut: () => Promise.resolve({}), refreshSession: () => Promise.resolve({ data: { session: {} } })
    },
    from: builder,
    rpc: (nom, args) => lazy(() => { window.__appels.push("rpc:" + nom); return RPC[nom] ? RPC[nom](args) : retard(20, { data: null, error: null }); }),
    channel: () => ({ on(){ return this; }, subscribe(){ return this; } }), removeChannel(){}
  }; } };
})();`;

class Chargeur extends ResourceLoader {
  fetch(url, opt){
    if(/supabase-[\d.]+\.js/.test(url)) return Promise.resolve(Buffer.from(STUB));
    if(/\.(png|jpg|webp|gif)$/i.test(url)) return Promise.resolve(Buffer.from(""));
    if(url.startsWith("http://localhost/")){
      const f = path.join(RAC, decodeURIComponent(url.slice("http://localhost/".length).split("?")[0]));
      return Promise.resolve(fs.existsSync(f) ? fs.readFileSync(f) : Buffer.from(""));
    }
    return Promise.resolve(Buffer.from(""));
  }
}
const erreurs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => erreurs.push("jsdom: " + (e.detail && e.detail.stack ? String(e.detail.stack).split("\n").slice(0,3).join(" | ") : e.message)));
vc.on("error", (...a) => erreurs.push("console.error: " + a.map(String).join(" ").slice(0, 200)));

const html = fs.readFileSync(path.join(RAC, "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "http://localhost/index.html", runScripts: "dangerously", resources: new Chargeur(), virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w){
    // état de la VEILLE dans localStorage : sac périmé, jauges de la veille
    w.localStorage.setItem("nova-epic-save", JSON.stringify({ ...donnees, jauges: { o2: 5, sante: 5, moral: 5 }, sac: {} }));
    w.addEventListener("error", e => erreurs.push("window.error: " + (e.message || e.error)));
    w.addEventListener("unhandledrejection", e => erreurs.push("rejet: " + (e.reason && e.reason.stack ? String(e.reason.stack).split("\n").slice(0,2).join(" | ") : e.reason)));
    w.HTMLCanvasElement.prototype.getContext = () => null;
    w.scrollTo = () => {};
  }
});
setTimeout(() => {
  const w = dom.window;
  if(fs.existsSync(__dirname + "/o_" + SCEN + ".js")){ Promise.resolve(w.eval(fs.readFileSync(__dirname + "/o_" + SCEN + ".js", "utf8"))).then(r => { console.log(JSON.stringify(r, null, 1)); process.exit(0); }); return; }
  const e = w.eval("etat");
  const res = {
    scenario: SCEN,
    sac: e.sac, coffre: e.coffre, lotsSynchro: e._lotsSynchro, jauges: e.jauges, energie: e.energie,
    credits: e.credits, faction: e.faction, niveau: e.niveau,
    prison: [e.prisonJusqua, e.prisonFaction], pauseResteMin: e._pauseResteMin, aRoleGouv: e._aRoleGouv, cumul: e._pauseCumulApplique,
    parcelles: e.terrain.parcelles.slice(0, 6), quetes: e.quetes,
    sacLu: w.__appels.filter(x => x === "rpc:sac_lire").length,
    effetsLus: w.__appels.filter(x => x === "rpc:consommer_effets").length,
    prisonLue: w.__appels.filter(x => x === "rpc:mon_etat_prison").length,
    persisteLocal: (() => { const s = JSON.parse(w.localStorage.getItem("nova-epic-save") || "{}");
      return ["prisonJusqua","prisonFaction","_pauseResteMin","_aRoleGouv","_jourReelMs","_pauseCumulApplique","sac","jauges"].filter(k => k in s); })(),
    erreurs
  };
  console.log(JSON.stringify(res, null, 1));
  process.exit(0);
}, 5000);
