// v2.17 (K135) — Chaque essai d'un jeu de poste coûte de l'énergie (node outils/o_banc.js .. essais).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  const appels = []; let refuse = false;
  const lignes = []; const vj = journal; journal = (t, ...x) => { lignes.push(String(t)); return vj(t, ...x); };
  // Faux serveur : agir (l'énergie), les RPC des jeux, missions_lire (l'état courant)
  let M = null;
  const rpc0 = sb.rpc.bind(sb);
  sb.rpc = (n, a) => {
    if(n === "agir"){ appels.push("agir:" + a.p_cout + ":" + a.p_motif);
      return Promise.resolve({ data: refuse ? { ok:false, err:"energie", energie:3, requis:a.p_cout } : { ok:true, energie:50, jauges:etat.jauges, etat:null }, error:null }); }
    if(n === "missions_lire") return Promise.resolve({ data:{ ok:true, jour:"2026-11-01", missions:[M], gains:[] }, error:null });
    if(/^(casse_poste|balise_message|infiltration_breche|satellite_tir|satellite_coeur|sauver_profil)$/.test(n)){ appels.push(n); return Promise.resolve({ data:{ ok:true, sens:"?" }, error:null }); }
    return rpc0(n, a);
  };
  sauverMaintenant = async () => {};
  villeActuelle = () => "ignis"; _mSurBalise = () => true; _mABardane = () => true;
  const groupe = (poste) => ({ id:3, statut:"lance", ouvert:true, moi_fondateur:true, membres:[{ nom:"Moi", poste, statut:"actif", moi:true }] });
  const ouvrir = async (m) => { M = m; _missions = { ok:true, jour:"2026-11-01", missions:[m], gains:[] }; _queteSous = "missions"; _queteTouche = 0; majQueteHub(); await att(30); return document.querySelector("#hub-quete"); };
  const cout = _mEssaiCout();
  r.cout = cout;
  // 1. Le crocheteur : une porte « Tenter », puis les goupilles
  const casse = poste => ({ id:7, type:"casse", nom:"Le casse", revele:true, statut:"en_cours", mon_groupe:3, mon_poste:poste, mon_statut:"actif", postes:{ crocheteur:1, guetteur:1 },
    groupes:[groupe(poste)], vue:{ phase:"casse", cible:"ignis", mon_poste:poste, casse:{ faits:{} }, postes_tenus:{} } });
  let h = await ouvrir(casse("crocheteur"));
  r.goupilles = { porte: !!h.querySelector('[data-mi-essai="goupilles"]'), pasDeJeuAvant: !h.querySelector("#mi-gp-cur"),
                  texte: (h.querySelector('[data-mi-essai="goupilles"]') || {}).textContent };
  appels.length = 0; h.querySelector('[data-mi-essai="goupilles"]').click(); await att(80);
  h = document.querySelector("#hub-quete");
  r.goupilles.paye = appels.includes("agir:" + cout + ":mission_essai"); r.goupilles.jeuOuvert = !!h.querySelector("#mi-gp-cur");
  // une goupille ratée : l'essai se referme
  _goup.pos = 0.02; _goupAvancer = () => {};          // le curseur hors du vert
  h.querySelector("[data-gp-bloquer]").dispatchEvent(new Event("pointerdown")); await att(40);
  h = document.querySelector("#hub-quete");
  r.goupilles.rateeRefermee = !!h.querySelector('[data-mi-essai="goupilles"]') && !h.querySelector("#mi-gp-cur");
  // sans énergie : la porte reste fermée
  refuse = true; appels.length = 0; h.querySelector('[data-mi-essai="goupilles"]').click(); await att(80); refuse = false;
  h = document.querySelector("#hub-quete");
  r.goupilles.refusResteFerme = !h.querySelector("#mi-gp-cur") && lignes.some(l => /Pas assez d'énergie/.test(l));
  // 2. Le guetteur : la correction de Q29, et l'émission payée
  h = await ouvrir(casse("guetteur"));
  const go = h.querySelector("[data-br-go]");
  r.brouillage = { bouton: go && go.textContent, consigne: /5 s calé en tout, pendant une émission de 60 s/.test(h.textContent),
                   frequenceFixe: typeof _brou.partie.fc === "number" && _brou.partie.fc >= 1.2 && _brou.partie.fc <= 2.4 };
  appels.length = 0; go.click(); await att(80);
  r.brouillage.paye = appels.includes("agir:" + cout + ":mission_essai"); r.brouillage.lance = _brou.actif;
  const P = _brou.partie;
  const f = h.querySelector("#mi-br-f"); f.value = String(P.fc); f.dispatchEvent(new Event("input"));
  r.brouillage.verrou = P.fCalee && f.disabled;
  // les secondes se cumulent : 3 s calées, 2 s décalées, 3 s calées → réussi
  const dd = h.querySelector("#mi-br-d");
  const suivre = on => { dd.value = String(on ? _brouDecalage(P.s) : (_brouDecalage(P.s) + Math.PI) % (2 * Math.PI)); dd.dispatchEvent(new Event("input")); };
  for(const [on, ms] of [[1, 3000], [0, 2000], [1, 3000]]){ const fin = Date.now() + ms; while(Date.now() < fin && _brou.actif){ suivre(on); await att(40); } }
  r.brouillage.cumul = P.tenu.toFixed(1); r.brouillage.reussi = appels.includes("casse_poste");
  // 3. Le déchiffreur : chaque réponse est payée, AVANT l'appel au serveur
  const balise = { id:8, type:"balise", nom:"La balise", revele:true, statut:"en_cours", mon_groupe:3, mon_poste:"dechiffreur", mon_statut:"actif", postes:{ encordeur:1, eclaireur:1, dechiffreur:1 },
    groupes:[groupe("dechiffreur")], vue:{ phase:"descente", mon_poste:"dechiffreur", descente:{ tempete:Date.now() + 6e5, faits:{} }, message:{ mots:[["PUL"]], propositions:["CU","LA"] } } };
  h = await ouvrir(balise);
  r.message = { mention: new RegExp("Chaque réponse : " + cout + " % d'énergie").test(h.textContent) };
  appels.length = 0; h.querySelector("[data-msg]").click(); await att(80);
  r.message.ordre = appels.filter(a => /agir|balise_message/.test(a)).join(" puis ");
  refuse = true; appels.length = 0; h = document.querySelector("#hub-quete"); h.querySelector("[data-msg]").click(); await att(80); refuse = false;
  r.message.refusSansAppel = !appels.includes("balise_message");
  // 4. L'encordeur : une porte
  h = await ouvrir({ ...balise, mon_poste:"encordeur", groupes:[groupe("encordeur")], vue:{ ...balise.vue, mon_poste:"encordeur", message:null } });
  r.noeud = { porte: !!h.querySelector('[data-mi-essai="noeud"]'), pasDeCordeAvant: !h.querySelector("#mi-noeud-svg") };
  // 5. L'artilleur et le hacker : le coût sur le bouton, payé avant
  const sat = poste => ({ id:9, type:"satellite", nom:"Le satellite", revele:true, statut:"en_cours", mon_groupe:3, mon_poste:poste, mon_statut:"actif",
    postes:{ artilleur:2, ingenieur:1, hacker:1 }, groupes:[groupe(poste)],
    vue:{ phase: poste === "hacker" ? "coeur" : "escorte", mon_poste:poste, tir:{ cible:5, tirs:9, duree:20 }, coeur:{ vigilance:2 }, escorte:{ tirs:{} }, limite:"2026-11-03" } });
  h = await ouvrir(sat("artilleur"));
  const tg = h.querySelector("[data-tir-go]");
  r.tir = { bouton: tg && tg.textContent };
  appels.length = 0; tg.click(); await att(80); r.tir.paye = appels.includes("agir:" + cout + ":mission_essai"); r.tir.lance = _tir.actif; _tir.actif = false;
  h = await ouvrir(sat("hacker"));
  const bc = h.querySelector("[data-mi-coeur]"); r.coeur = { bouton: bc && bc.textContent };
  _espF1 = async () => true; appels.length = 0; bc.click(); await att(120);
  r.coeur.ordre = appels.filter(a => /agir|satellite_coeur/.test(a)).join(" puis ");
  journal = vj; sb.rpc = rpc0;
  return r;
})();
