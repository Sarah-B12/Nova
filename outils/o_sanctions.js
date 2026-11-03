// v2.22 — Bannir, lever, supprimer, annuler (K139, K140) (node outils/o_banc.js .. sanctions).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  const appels = []; let etatSanctions = { ok:true, banni:null, suppression:null };
  const rpc0 = sb.rpc.bind(sb);
  sb.rpc = (n, a) => n === "admin_sanctions" ? Promise.resolve({ data:etatSanctions, error:null }) : rpc0(n, a);
  staffAction = async (action, cible, extra) => { appels.push(action + ":" + JSON.stringify(extra || {})); return { ok:true, prevue_le:new Date(Date.now() + 3 * 864e5).toISOString() }; };
  const FICHE = { id:"00000000-0000-0000-0000-0000000000f0", nom:"Test1", faction:"ignis", niveau:3, credits:10, energie:50, sante:90, moral:80, o2:100,
                  sac:3, sac_max:20, en_prison:false, en_pause:false, mort:false, cree_le:new Date().toISOString(), derniere_activite:new Date().toISOString() };
  if(!document.querySelector("#dev-res")) document.body.appendChild(Object.assign(document.createElement("div"), { id:"dev-res" }));
  let reponses = []; prompt = () => reponses.shift(); confirm = () => true; let alerte = null; alert = m => { alerte = m; };
  const ouvrir = async () => { _devAfficherFiche(FICHE); await att(60); return document.querySelector("#f-sanctions"); };
  // 1. Un joueur ordinaire : Bannir… et Supprimer le compte…
  let z = await ouvrir();
  r.boutons = { bannir: !!z.querySelector("#f-bannir"), supprimer: !!z.querySelector("#f-supprimer"), pasDeLever: !z.querySelector("#f-lever") };
  // 2. Bannir : 120 jours → refusé sans appel ; sans motif → refusé sans appel ; 7 jours + motif → appel
  reponses = ["120"]; z.querySelector("#f-bannir").click(); await att(30);
  r.bannir = { tropDeJours: appels.length === 0 && /Entre 1 et 90/.test(alerte || "") };
  z = await ouvrir(); reponses = ["7", "  "]; alerte = null; z.querySelector("#f-bannir").click(); await att(30);
  r.bannir.sansMotif = appels.length === 0 && /motif est obligatoire/.test(alerte || "");
  z = await ouvrir(); reponses = ["7", "Insultes dans le chat."]; z.querySelector("#f-bannir").click(); await att(60);
  r.bannir.appel = appels.pop() || null;
  // 3. Banni : l'état et « Lever le bannissement »
  etatSanctions = { ok:true, banni:{ jusqua:new Date(Date.now() + 7 * 864e5).toISOString(), motif:"Insultes dans le chat." }, suppression:null };
  z = await ouvrir();
  r.banni = { etat: /Banni jusqu'au .* — Insultes dans le chat\./.test(z.textContent), lever: !!z.querySelector("#f-lever"), pasDeBannir: !z.querySelector("#f-bannir") };
  z.querySelector("#f-lever").click(); await att(40); r.banni.appel = appels.pop() || null;
  // 4. Supprimer : le mauvais nom → rien ; le bon nom → appel
  etatSanctions = { ok:true, banni:null, suppression:null };
  z = await ouvrir(); reponses = ["test1"]; alerte = null; z.querySelector("#f-supprimer").click(); await att(30);
  r.supprimer = { mauvaisNom: appels.length === 0 && /ne correspond pas/.test(alerte || "") };
  z = await ouvrir(); reponses = ["Test1"]; z.querySelector("#f-supprimer").click(); await att(40);
  r.supprimer.appel = appels.pop() || null;
  // 5. Suppression en cours : l'état et « Annuler la suppression »
  etatSanctions = { ok:true, banni:null, suppression:{ prevue_le:new Date(Date.now() + 3 * 864e5).toISOString() } };
  z = await ouvrir();
  r.enCours = { etat: /Suppression prévue le/.test(z.textContent), annuler: !!z.querySelector("#f-annuler-supp") };
  z.querySelector("#f-annuler-supp").click(); await att(40); r.enCours.appel = appels.pop() || null;
  // 6. Le joueur suspendu : la veille le lui dit, puis le déconnecte
  let vu = null, deco = false;
  alerterJoli = async (t, m) => { vu = t + " — " + m; }; seDeconnecter = async () => { deco = true; }; sauverMaintenant = async () => {};
  sb.rpc = (n, a) => n === "veille" ? Promise.resolve({ data:{ ok:true, banni:{ jusqua:"2026-11-09T11:30:00Z", motif:"Insultes dans le chat." } }, error:null }) : rpc0(n, a);
  await veilleMinute(); await att(60);
  r.suspendu = { message: vu, deconnecte: deco };
  // 7. La connexion refusée
  r.connexion = _authMsg({ message:"User is banned" });
  sb.rpc = rpc0;
  return r;
})();
