// v2.74 (K237 → K239) — Quatre alignés, la table à l'écran ; node o_banc.js .. quatre
(async function(){
  const r = {}; const att = ms => new Promise(x => setTimeout(x, ms)); await att(1500);
  const journaux = []; const jOrig = journal; journal = (t) => journaux.push(String(t));
  const vRpc = sb.rpc; const appels = [];
  const G = new Array(42).fill(0);
  let fin = null;
  sb.rpc = async (nom, args) => {
    appels.push([nom, args]);
    if(nom === "quatre_etat") return { data:{ ok:true, partie:false }, error:null };
    if(nom === "quatre_ouvrir"){ G[3] = 2; return { data:{ ok:true, mise:args.p_mise, niveau:args.p_niveau, mult:3, grille:G.slice(), coup_maison:3, solde:900 }, error:null }; }
    if(nom === "quatre_jouer"){
      const col = args.p_col; let y = 0; while(G[y*7+col]) y++; G[y*7+col] = 1;
      if(fin === "gagne"){ return { data:{ ok:true, grille:G.slice(), coup_maison:null, fini:"gagne", mise:100, gain:300, net:200, solde:1100 }, error:null }; }
      let y2 = 0; while(G[y2*7+3]) y2++; G[y2*7+3] = 2;
      return { data:{ ok:true, grille:G.slice(), coup_maison:3, fini:null }, error:null };
    }
    if(nom === "bar_jeux_etat") return { data:{ ok:true, jeux:{ des:"ok", cuve:"ok", bonneteau:"ok", puissance4:"ok" }, mise_max:1000, mise_min:50, joues_aujourdhui:0 }, error:null };
    if(nom === "quatre_abandonner") return { data:{ ok:true, perdu:100 }, error:null };
    return { data:null, error:null };
  };
  const z = document.createElement("div"); document.body.appendChild(z);
  await _tableQuatre(z); await att(30);
  r.choix = [...z.querySelectorAll("[data-q4-niv]")].map(b => b.textContent);
  z.querySelector('[data-q4-niv="vieux"]').click();
  r.descVieux = z.querySelector("#q4-niv-desc").textContent;
  z.querySelector("#q4-mise").value = "100"; z.querySelector("#q4-go").click(); await att(60);
  r.ouvrir = (appels.find(a => a[0] === "quatre_ouvrir") || [])[1];
  r.grille = { cases: z.querySelectorAll(".q4-case").length, maison: z.querySelectorAll(".q4-case.maison").length, dernierEnBas: !!z.querySelector('[data-q4-col="3"] .q4-case.maison.dernier'),
               message: z.querySelector("#q4-res").textContent, entete: (z.querySelector(".itip-gris") || {}).textContent };
  z.querySelector('[data-q4-col="0"]').click(); await att(60);
  r.apresUnCoup = { moi: z.querySelectorAll(".q4-case.moi").length, maison: z.querySelectorAll(".q4-case.maison").length, message: z.querySelector("#q4-res").textContent };
  // trois coups de plus en colonne 0 → 4 alignés verticaux ; le serveur (simulé) dit « gagne ».
  z.querySelector('[data-q4-col="0"]').click(); await att(60);
  z.querySelector('[data-q4-col="0"]').click(); await att(60);
  fin = "gagne"; z.querySelector('[data-q4-col="0"]').click(); await att(60);
  r.victoire = { message: z.querySelector("#q4-res").textContent, ligne: z.querySelectorAll(".q4-case.ligne").length,
                 colonnesFermees: [...z.querySelectorAll("[data-q4-col]")].every(b => b.disabled), journal: journaux.find(t => /Quatre alignés/.test(t)) };
  z.remove();
  // La carte du bar.
  const j = BAR_JEUX.find(x => x.id === "puissance4"); r.carte = { dispo: j.dispo, gains: j.gains };
  sb.rpc = vRpc; journal = jOrig;
  return r;
})();
