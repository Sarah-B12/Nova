// v1.23 — plaintes et primes : affichage et appels (node banc.js .. plaintes)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; let rep = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return rep[n] ? Promise.resolve({ data: rep[n](a), error: null }) : orig(n, a); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  window.confirm = () => true;
  const h48 = new Date(Date.now()+30*3600e3).toISOString(), h24 = new Date(Date.now()+5*3600e3).toISOString(), avant = new Date(Date.now()-3600e3).toISOString();
  rep.plaintes_mes_vols = () => ({ ok:true, regent:true, liste:[
    { vol:7, voleur:"Kaël<b>", mode:"vol", butin:{ cendrite:3 }, credits:0, valeur:15, vol_le:avant, limite:h48 },
    { plainte:3, voleur:"Nyx", mode:"hack", butin:{}, credits:120, valeur:120, vol_le:avant, statut:"prime", montant:800, depose_le:avant, limite:h24 } ] });
  rep.plainte_deposer = () => ({ ok:true, plainte:9 });
  const el = document.createElement("div"); document.body.appendChild(el);
  _prisonOnglet = "plaintes"; await majPrison(el); await dort(30);
  r.menu = [...el.querySelectorAll("[data-ponglet]")].map(b=>b.textContent+(b.classList.contains("actif")?"*":""));
  r.cartes = [...el.querySelectorAll(".tq-carte")].map(c=>c.textContent.replace(/\s+/g," ").trim());
  r.echappe = !el.innerHTML.includes("Kaël<b>");
  el.querySelector("[data-plainte]").click(); await dort(30);
  r.depot = { args: (appels.find(a=>a.n==="plainte_deposer")||{}).a, msg: journ.slice(-1)[0] };
  // pas de Régent : bouton grisé
  rep.plaintes_mes_vols = () => ({ ok:true, regent:false, liste:[{ vol:7, voleur:"Kaël", mode:"vol", butin:{}, vol_le:avant, limite:h48 }] });
  await majPlaintes(el.querySelector("#prison-corps")); await dort(20);
  r.sansRegent = { grise: el.querySelector("[data-plainte]").disabled, alerte: /pas de Régent/.test(el.textContent) };
  // onglet Prison intact
  _prisonOnglet = "prison"; await majPrison(el); await dort(50);
  r.prisonTitre = (el.querySelector("#prison-corps h3")||{}).textContent;

  // Bureau : plainte à instruire
  rep.regent_plaintes = () => ({ ok:true, solde:1500, liste:[
    { id:4, plaignant:"Bob", accuse:"Kaël", mode:"vol", butin:{ sylve:2 }, valeur:16, vol_le:avant, depose_le:avant, limite:h24, statut:"en_attente" },
    { id:2, plaignant:"Bob", accuse:"Nyx", mode:"hack", credits:120, vol_le:avant, depose_le:avant, limite:h24, statut:"classee" } ] });
  rep.regent_prime = (a) => ({ ok:true, solde:1500-a.p_montant });
  const zb = document.createElement("div"); document.body.appendChild(zb);
  await rendrePlaintesRegent(zb); await dort(20);
  const inp = zb.querySelector("[data-montant]");
  r.bureau = { cartes: zb.querySelectorAll(".tq-carte").length, max: inp.max, champs: zb.querySelectorAll("[data-prime]").length };
  inp.value = "50"; zb.querySelector("[data-prime]").click(); await dort(20);
  r.tropBas = { appel: appels.some(a=>a.n==="regent_prime"), msg: journ.slice(-1)[0] };
  zb.querySelector("[data-montant]").value = "750"; zb.querySelector("[data-prime]").click(); await dort(30);
  r.prime = { args: (appels.find(a=>a.n==="regent_prime")||{}).a, msg: journ.slice(-1)[0] };
  // coffre trop pauvre
  rep.regent_plaintes = () => ({ ok:true, solde:60, liste:[{ id:4, plaignant:"Bob", accuse:"Kaël", mode:"vol", butin:{}, vol_le:avant, depose_le:avant, limite:h24, statut:"en_attente" }] });
  await rendrePlaintesRegent(zb); await dort(20);
  r.coffreVide = { champ: !!zb.querySelector("[data-montant]"), texte: /ne permet pas/.test(zb.textContent) };
  journal = jOrig;
  return r;
})()
