// v1.36l — boîtes de dialogue maison (confirmerJoli / alerterJoli) + Retirer une plante (serveur)
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const r = {};
  // 1. Confirmer : texte sur plusieurs lignes, deux boutons, OK → true
  let p = confirmerJoli("Point de non-retour", "Ligne 1.\n\nLigne 2.", "Continuer", true);
  let f = document.querySelector("#cj-fond");
  r.confirmer = { boutons: f.querySelectorAll("button").length, danger: !!f.querySelector(".cj-ok.danger"),
                  preLine: getComputedStyle(f.querySelector("p")).whiteSpace };
  f.querySelector(".cj-ok").click(); r.confirmer.ok = await p;
  // 2. Annuler → false
  p = confirmerJoli("T", "x", "OK"); document.querySelector("#cj-fond .cj-non").click(); r.annuler = await p;
  // 3. alerterJoli : un seul bouton
  p = alerterJoli("Session expirée", "Recharge.", "Recharger");
  r.alerter = { boutons: document.querySelectorAll("#cj-fond button").length };
  document.querySelector("#cj-fond .cj-ok").click(); r.alerter.fin = await p;
  // 4. Retirer une plante : passe par terrain_retirer
  const appels = []; const rpcOrig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push([n, a]); return n === "terrain_retirer"
    ? Promise.resolve({ data:{ ok:true, terrain:{ parcelles: etat.terrain.parcelles, maison: etat.maison, integrite:{} } }, error:null }) : rpcOrig(n, a); };
  confirmerJoli = async () => true;
  etat.pos = { x: VILLES[etat.faction].x, y: VILLES[etat.faction].y }; etat.secteur = "silene";
  structSel = 4; await retirerCase(0, "plante");
  r.retirer = appels.filter(x => x[0] === "terrain_retirer");
  return r;
})();
