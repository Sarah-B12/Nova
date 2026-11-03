// v2.28 — Les alertes : envois entre personnages liés par l'adresse (node outils/o_banc.js .. alertes).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  etat.roleAdmin = "admin";
  const from0 = sb.from.bind(sb);
  sb.from = t => t === "profils" ? { select(){ return this; }, eq(){ return this; }, maybeSingle(){ return Promise.resolve({ data:{ role_admin:"admin" }, error:null }); } } : from0(t);
  const rpc0 = sb.rpc.bind(sb); let demande = null, vide = false;
  sb.rpc = (n, a) => {
    if(n === "admin_alertes"){ demande = a; return Promise.resolve({ data:{ ok:true, alertes: vide ? [] : [
      { id:2, quand:"2026-11-03T10:00:00Z", type:"poste", de:"Joueur_A", a:"Joueur_B", ip:"1.2.3.4", meme_ip:true, lien_premier:"2026-11-01T09:00:00Z", detail:{ envoi:"credits", montant:500 } },
      { id:1, quand:"2026-11-02T10:00:00Z", type:"poste", de:"Joueur_A", a:"Joueur_B", ip:"7.7.7.7", meme_ip:false, lien_premier:"2026-11-01T09:00:00Z", detail:{ envoi:"cadeau", item:"cendrite", quantite:3 } } ] }, error:null }); }
    return rpc0(n, a);
  };
  await ouvrirDev(); await att(80);
  const m = document.querySelector("#dev-modale");
  r.onglet = [...m.querySelectorAll(".dev-onglet")].some(b => b.textContent === "Alertes");
  _devMontrerOnglet("alertes"); await att(20);
  r.avertissement = /un indice/i.test(m.querySelector("#dev-t-alertes").textContent);
  m.querySelector("#dev-alertes-jours").value = "90"; m.querySelector("#dev-alertes-go").click(); await att(80);
  r.demande = demande;
  r.lignes = [...m.querySelectorAll("#dev-alertes tbody tr")].map(tr => tr.textContent.replace(/\s+/g, " ").trim());
  vide = true; m.querySelector("#dev-alertes-go").click(); await att(60);
  r.vide = m.querySelector("#dev-alertes").textContent.trim();
  fermerDev(); sb.rpc = rpc0; sb.from = from0;
  return r;
})();
