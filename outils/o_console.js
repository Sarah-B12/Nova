// v2.18 — La console : sortir de prison, le Fléau (dev) (node outils/o_banc.js .. console).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  const appels = []; const rpc0 = sb.rpc.bind(sb);
  sb.rpc = (n, a) => {
    if(n === "admin_prison_liberer"){ appels.push(n + ":" + a.p_profil); return Promise.resolve({ data:{ ok:true, nom:"Joueur", libere:true }, error:null }); }
    if(n === "admin_fleau_jour"){ appels.push(n); return Promise.resolve({ data:{ ok:true, jour:"2026-11-02", force:312, bande:"aveuglant", imbattable:true }, error:null }); }
    if(n === "admin_fleau_effacer"){ appels.push(n); return Promise.resolve({ data:{ ok:true, efface:true }, error:null }); }
    if(n === "admin_fiche_joueur") return Promise.resolve({ data:{ ok:true, joueur:FICHE }, error:null });
    return rpc0(n, a);
  };
  const FICHE = { id:"00000000-0000-0000-0000-0000000000f0", nom:"Joueur", faction:"ignis", niveau:3, credits:10, energie:50, sante:90, moral:80, o2:100,
                  sac:3, sac_max:20, pos_x:1, pos_y:2, en_prison:true, en_pause:false, mort:false, cree_le:new Date().toISOString(), derniere_activite:new Date().toISOString() };
  confirm = () => true; alert = () => {};
  const lignes = []; const vj = journal; journal = (t, ...x) => { lignes.push(String(t)); return vj(t, ...x); };
  // 1. La fiche d'un joueur en prison : le bouton, et l'appel au serveur
  const z = document.querySelector("#dev-res") || Object.assign(document.body.appendChild(document.createElement("div")), { id:"dev-res" });
  let rendu = null; try{ rendu = _devAfficherFiche(FICHE); }catch(e){ rendu = "erreur : " + e.message; }
  const zone = (typeof rendu === "string" && rendu.startsWith("erreur")) ? null : document.querySelector("#f-prison");
  r.fiche = { bouton: !!zone, erreur: (typeof rendu === "string" && rendu.startsWith("erreur")) ? rendu : null };
  if(zone){ zone.click(); await att(80); r.fiche.appel = appels.find(a => a.startsWith("admin_prison_liberer")) || null; }
  // pas de bouton si le joueur n'est pas en prison
  document.querySelectorAll("#f-prison").forEach(b => b.remove());
  try{ _devAfficherFiche({ ...FICHE, en_prison:false }); }catch(e){}
  r.fiche.pasEnPrisonPasDeBouton = !document.querySelector("#f-prison");
  // 2. Mon perso : la libération passe par le serveur, avec mon identifiant
  sessionActuelle = async () => ({ user:{ id:"00000000-0000-0000-0000-0000000000d0" } });
  appels.length = 0; etat.prisonJusqua = Date.now() + 3600e3;
  await devLibererPrison(); await att(50);
  r.monPerso = { appel: appels[0] || null, liberePourLeJeu: etat.prisonJusqua === 0 };
  // 3. Le Fléau (dev)
  const et = document.createElement("span"); et.id = "dev-fleau-etat"; document.body.appendChild(et);
  await devFleauJour(); r.fleau = { etat: et.textContent };
  appels.length = 0; await devFleauEffacer(); await att(50);
  r.fleau.effacer = appels.includes("admin_fleau_effacer") && lignes.some(l => /combat du jour contre le Fléau effacé/.test(l));
  // 4. v2.19 — un ex-admin ne rouvre plus la console : le rôle est relu au serveur
  const from0 = sb.from.bind(sb); let roleServeur = null;
  sb.from = t => t === "profils" ? { select(){ return this; }, eq(){ return this; }, maybeSingle(){ return Promise.resolve({ data:{ role_admin:roleServeur }, error:null }); } } : from0(t);
  etat.roleAdmin = "admin"; lignes.length = 0;
  await ouvrirDev(); const m = document.querySelector("#dev-modale");
  r.retrait = { pasOuverte: !m || m.hidden, roleOublie: etat.roleAdmin === null, message: lignes.some(l => /accès à la console a été retiré/.test(l)) };
  roleServeur = "admin"; etat.roleAdmin = "admin"; await ouvrirDev();
  r.retrait.toujoursAdminOuvre = !document.querySelector("#dev-modale").hidden; fermerDev();
  sb.from = from0;
  sb.rpc = rpc0; journal = vj;
  return r;
})();
