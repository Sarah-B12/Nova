// Banc d'essai (facultatif) : cd outils && npm i jsdom@24 acorn acorn-walk && node banc.js .. lent|rapide|unitaire
// Banc d'essai : charge index.html dans jsdom avec un faux Supabase.
// Usage : node banc.js <racine> <scenario>
const fs = require("fs"), path = require("path");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const RAC = process.argv[2], SCEN = process.argv[3] || "lent";

const DELAIS = {
  lent:   { profil: 2500, sac: 100, jauges: 100 },   // réseau mobile : le profil arrive APRÈS la minuterie de 1,2 s
  rapide: { profil: 50,   sac: 100, jauges: 100 },
  unitaire: { profil: 50, sac: 50, jauges: 50 },
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
  if(SCEN === "unitaire"){ console.log(JSON.stringify(w.eval(fs.readFileSync(__dirname + "/unitaire.js", "utf8")), null, 1)); process.exit(0); }
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
