// v2.26 — La liste de tous les personnages (console) (node outils/o_banc.js .. liste).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  etat.roleAdmin = "admin";
  const from0 = sb.from.bind(sb);
  sb.from = t => t === "profils" ? { select(){ return this; }, eq(){ return this; }, maybeSingle(){ return Promise.resolve({ data:{ role_admin:"admin" }, error:null }); } } : from0(t);
  const rpc0 = sb.rpc.bind(sb); let demande = null;
  const maintenant = Date.now();
  sb.rpc = (n, a) => {
    if(n === "admin_liste_personnages"){ demande = a; return Promise.resolve({ data:{ ok:true, total:42, liste:[
      { id:"1", nom:"Vortex", faction:"ignis", niveau:7, en_ligne:true, ip:"1.2.3.4", nb_ip:2, partages:["Mort_Test"], derniere_activite:new Date(maintenant - 30e3).toISOString(), derniere_connexion:new Date(maintenant - 3600e3).toISOString(), cree_le:"2026-09-12T10:00:00Z" },
      { id:"2", nom:"Mort_Test", niveau:2, mort_le:"2026-11-01T10:00:00Z", derniere_activite:new Date(maintenant - 3 * 864e5).toISOString(), cree_le:"2026-10-01T10:00:00Z" },
      { id:"3", nom:"Pause_Test", niveau:4, pause_depuis:"2026-11-02T10:00:00Z", banni_jusqua:"2026-11-09T10:00:00Z", derniere_activite:new Date(maintenant - 864e5).toISOString(), cree_le:"2026-10-02T10:00:00Z" },
      { id:"4", nom:"Kyraa", role_admin:"dev", niveau:12, derniere_activite:new Date(maintenant - 7200e3).toISOString(), cree_le:"2026-08-01T10:00:00Z" } ] }, error:null }); }
    return rpc0(n, a);
  };
  await ouvrirDev(); await att(80);
  const m = document.querySelector("#dev-modale");
  r.onglet = [...m.querySelectorAll(".dev-onglet")].map(b => b.textContent).join(" · ");
  _devMontrerOnglet("liste"); await att(20);
  r.ongletVisible = !!m.querySelector("#dev-t-liste #dev-liste-go");
  m.querySelector("#dev-liste-q").value = "test"; m.querySelector("#dev-liste-go").click(); await att(80);
  r.demande = demande;
  const lignes = [...m.querySelectorAll("#dev-liste tbody tr")].map(tr => tr.textContent.replace(/\s+/g, " ").trim());
  r.lignes = lignes;
  r.entete = m.querySelector("#dev-liste .dev-note").textContent;
  r.ip = { colonne: /1\.2\.3\.4 \(\+1 autre\)/.test(lignes[0] || ""), partage: /partage avec Mort_Test/.test(lignes[0] || ""), sansIp: /—$/.test(lignes[1] || "") };
  let cherche = null; devChercherJoueur = async () => { cherche = document.querySelector("#dev-q").value; };
  m.querySelector('[data-liste-nom="Vortex"]').click(); await att(30);
  r.clic = { fiche: cherche, ongletJoueurs: m.querySelector('.dev-onglet.actif').dataset.dev };
  fermerDev(); sb.rpc = rpc0; sb.from = from0;
  return r;
})();
