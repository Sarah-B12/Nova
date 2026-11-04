// v2.30 — La visière des débris mesure toujours l'endroit où l'on s'arrête (node outils/o_banc.js .. visiere).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  etat.secteur = "silene";
  _debris = { actif:true, carte:"silene", fin:new Date(Date.now() + 864e5).toISOString(), faites:0 };
  // Un faux serveur fidèle : point fixe en (1000, 800), une mesure par 2 s, palier selon la distance
  const P = { x:1000, y:800 }; let derniere = 0; const recus = [];
  const palier = d => d <= 80 ? 5 : d < 200 ? 4 : d < 400 ? 3 : d < 700 ? 2 : d < 1100 ? 1 : 0;
  const rpc0 = sb.rpc.bind(sb);
  sb.rpc = async (n, a) => {
    if(n !== "debris_sonder") return rpc0(n, a);
    await new Promise(x => setTimeout(x, 150));                         // le réseau
    if(Date.now() - derniere < 2000){ recus.push("refus " + a.p_x); return { data:{ ok:false, err:"trop_vite" }, error:null }; }
    derniere = Date.now(); const d = Math.hypot(a.p_x - P.x, a.p_y - P.y); recus.push("mesure " + a.p_x + " → palier " + palier(d));
    return { data:{ ok:true, ici:true, fini:false, palier:palier(d), tendance:null, sur_point:d <= 80 }, error:null };
  };
  const panneau = () => { const z = document.querySelector("#debris-silene"); return z ? z.textContent.replace(/\s+/g, " ").trim() : ""; };
  if(!document.querySelector("#debris-silene")){ const z = document.createElement("div"); z.id = "debris-silene"; document.body.appendChild(z); }
  // 1. Je suis en A (loin), mesuré
  etat.pos = { x:2000, y:800 }; debrisApresDeplacement(); await att(400);
  r.A = { palier:_debris.palier, panneau:panneau() };
  // 2. Je file vers B (tout près), moins de 2 s après : le serveur refuse — la jauge ne doit PAS garder A
  etat.pos = { x:1050, y:820 }; debrisApresDeplacement(); await att(50);
  r.enRoute = panneau();
  await att(400);
  r.apresRefus = { palier:_debris.palier, enAttente:!!_debris.enAttente, panneau:panneau() };
  await att(2600);                                                      // la mesure est refaite dès que possible
  r.B = { palier:_debris.palier, enAttente:!!_debris.enAttente, panneau:panneau() };
  // 3. Je repars en A puis reviens en B très vite : la jauge finit sur B
  etat.pos = { x:2000, y:800 }; debrisApresDeplacement(); await att(100);
  etat.pos = { x:1050, y:820 }; debrisApresDeplacement(); await att(5200);
  r.allerRetour = { palier:_debris.palier, enAttente:!!_debris.enAttente };
  r.echanges = recus;
  sb.rpc = rpc0;
  return r;
})();
