// v1.93c — la console ADMIN a son onglet « Tranquillité » (le dev aussi) ; le bouton bascule.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, att = ms => new Promise(x=>setTimeout(x,ms));
  let actif = false; const appels = [];
  sb.rpc = async (nom, a) => { appels.push(nom);
    if(nom === "tranquillite_etat") return { data:{ ok:true, actif }, error:null };
    if(nom === "admin_tranquillite"){ actif = !!a.p_actif; return { data:{ ok:true, actif }, error:null }; }
    return { data:null, error:null }; };
  journal = () => {}; chargerJaugesServeur = async () => {};
  const vu = (m, id) => { const b = m.querySelector(`[data-dev="${id}"]`); return !!b && b.style.display !== "none"; };
  // 1. Console ADMIN
  estAdmin = () => true; estDev = () => false;
  ouvrirDev(); await att(100);
  const m = document.querySelector("#dev-modale");
  r.admin = { titre:m.querySelector(".dev-tete b").textContent, ongletTranq:vu(m, "tranquillite"), ongletPerso:vu(m, "perso"),
              boutonDansOnglet:!!m.querySelector("#dev-t-tranquillite #dev-tranq") };
  _devMontrerOnglet("tranquillite");
  r.admin.sectionVisible = !m.querySelector('#dev-t-tranquillite').hidden && !m.querySelector('#dev-t-tranquillite [data-sec="tranq"]').hidden;
  const b = m.querySelector("#dev-tranq"); r.admin.avant = b.textContent;
  b.click(); await att(100); r.admin.apres = m.querySelector("#dev-tranq").textContent;
  m.querySelector("#dev-tranq").click(); await att(100); r.admin.retour = m.querySelector("#dev-tranq").textContent;
  fermerDev();
  // 2. Console DEV : l'onglet est là aussi, et plus dans « Mon perso ».
  estDev = () => true; _tranqActif = null;
  ouvrirDev(); await att(100);
  r.dev = { titre:m.querySelector(".dev-tete b").textContent, ongletTranq:vu(m, "tranquillite"), ongletPerso:vu(m, "perso"),
            boutonDansOnglet:!!m.querySelector("#dev-t-tranquillite #dev-tranq"), plusDansPerso:!m.querySelector("#dev-t-perso #dev-tranq"),
            nbBoutons:document.querySelectorAll("#dev-tranq").length };
  r.appels = appels.join(",");
  return r;
})();
