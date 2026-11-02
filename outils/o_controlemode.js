// v2.20 — Le mode contrôle, côté navigateur (node outils/o_banc.js .. controlemode ;
//          et l'onglet de contrôle : BANC_QUERY="?controle=1" node outils/o_banc.js .. controlemode).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  r.onglet = NOVA_CONTROLE ? "contrôle" : "ordinaire";
  r.cle = CLE;
  if(!NOVA_CONTROLE){
    // 1. La console : « Prendre la main »
    const FICHE = { id:"00000000-0000-0000-0000-0000000000f0", nom:"Joueur", faction:"ignis", niveau:3, credits:10, energie:50, sante:90, moral:80, o2:100,
                    sac:3, sac_max:20, en_prison:false, en_pause:false, mort:false, cree_le:new Date().toISOString(), derniere_activite:new Date().toISOString() };
    if(!document.querySelector("#dev-res")) document.body.appendChild(Object.assign(document.createElement("div"), { id:"dev-res" }));
    _devAfficherFiche(FICHE);
    r.bouton = !!document.querySelector("#f-controle");
    confirm = () => true; let alerte = null; alert = m => { alerte = m; };
    sessionActuelle = async () => ({ access_token:"JETON-ADMIN", user:{ id:"00000000-0000-0000-0000-0000000000d0" } });
    let fermee = false; const faux = { location:{ href:"" }, close(){ fermee = true; } };
    window.open = () => faux;
    let requete = null, reponse = { ok:true, jeton:"hash-123", cid:7, nom:"Joueur" };
    window.fetch = async (url, o) => { requete = { url, o }; return { status:200, json: async () => reponse }; };
    document.querySelector("#f-controle").click(); await att(80);
    r.prendre = { url: requete && requete.url.endsWith("/functions/v1/controle"), jetonAdmin: requete && requete.o.headers.Authorization === "Bearer JETON-ADMIN",
                  corps: requete && requete.o.body, jetonPose: !!localStorage.getItem("nova-controle-jeton"), onglet: faux.location.href };
    localStorage.removeItem("nova-controle-jeton");
    reponse = { ok:false, err:"en_ligne" }; fermee = false; alerte = null;
    await controlePrendre(FICHE); await att(40);
    r.refus = { ongletFerme: fermee, message: alerte, rienDePose: !localStorage.getItem("nova-controle-jeton") };
  } else {
    // 2. L'onglet de contrôle : sa connexion à part, pas de présence
    // (la connexion à part — sessionStorage, clé « nova-controle-auth » — se vérifie avec la VRAIE
    //  bibliothèque Supabase : le banc la remplace par une imitation qui ignore les réglages)
    r.pasDePage = /n'a plus de session de contrôle/.test(document.body.textContent);   // ouvert sans jeton ni session
    // On rejoue une vraie ouverture : jeton posé, connexion et liaison simulées
    localStorage.setItem("nova-controle-jeton", JSON.stringify({ jeton:"hash-123", cid:7, nom:"Joueur", t:Date.now() }));
    const appels = []; let session = null;
    sb.auth.verifyOtp = async o => { appels.push("verifyOtp:" + o.type + ":" + o.token_hash); session = { user:{ id:"cible" } }; return { data:{ session }, error:null }; };
    sb.rpc = async (n, a) => { appels.push(n + ":" + JSON.stringify(a)); return { data:{ ok:true }, error:null }; };
    sb.auth.signOut = async o => { appels.push("signOut:" + JSON.stringify(o)); return { error:null }; };
    sessionActuelle = async () => session;
    document.body.innerHTML = "";
    const ok = await controleOuvrir();
    r.ouvrir = { ok, appels:appels.slice(), jetonEfface: !localStorage.getItem("nova-controle-jeton"), bandeau: !!document.querySelector("#controle-bandeau"),
                 texte: (document.querySelector("#controle-bandeau") || {}).textContent, titre: document.title };
    // la présence ne bat pas
    etat.inscrit = true; let presence = false; const from0 = sb.from; sb.from = t => { presence = true; return from0.call(sb, t); };
    _presenceDer = 0; await battementPresence(); sb.from = from0; r.pasDePresence = !presence;
    // rendre la main
    appels.length = 0; sauverMaintenant = async () => { appels.push("sauver"); }; let fermeture = false; window.close = () => { fermeture = true; };
    localStorage.setItem(CLE, "{}");
    await controleRendre(); await att(20);
    r.rendre = { appels:appels.slice(), sauvegardeLocaleEffacee: !localStorage.getItem(CLE), message: /Tu as rendu la main sur Joueur/.test(document.body.textContent), ongletFerme: fermeture };
    // la déconnexion ordinaire ne ferme que cette session
    appels.length = 0; await seDeconnecter(); r.deconnexion = appels.slice();
  }
  return r;
})();
