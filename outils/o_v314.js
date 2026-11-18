// v3.14 (K286) — les e-mails du compte : confirmation de l'inscription, mot de passe oublié, changement d'adresse.
//   node outils/o_banc.js . v314
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(400);
  const journ = []; journal = (t, type) => { journ.push({ t, type }); };
  const alertes = []; alerterJoli = (t, x) => { alertes.push({ t, x }); return Promise.resolve(true); };
  const appels = []; const A = (nom, args) => { appels.push({ nom, args }); };
  const vu = s => { const e = document.querySelector(s); return !!e && !e.hidden; };
  const txt = s => (document.querySelector(s) || {}).textContent || "";
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => n === "faction_moins_peuplee" ? Promise.resolve({ data: "ignis", error: null }) : orig(n, a);

  // 1. Les liens selon le mode
  ouvrirEntree(); _authMode = "connexion"; ouvrirAuth();
  r.connexion = { oubli: vu("#auth-oubli"), renvoi: vu("#auth-renvoi") };
  basculerAuth("inscription");
  r.inscription = { oubli: vu("#auth-oubli"), renvoi: vu("#auth-renvoi") };

  // 2. Inscription avec confirmation : pas de session → on attend l'e-mail, rien n'est sauvegardé
  const set = (s, v) => { const e = document.querySelector(s); if(e) e.value = v; };
  set("#auth-pseudo", "Nouvelle"); set("#auth-email", "nouvelle@exemple.fr"); set("#auth-mdp", "secret12"); set("#auth-mdp2", "secret12");
  let nbSauve = window.__appels.filter(x => x === "rpc:sauver_profil").length;
  sb.auth.signUp = (o) => { A("signUp", o); return Promise.resolve({ data: { user: { id: "u9", identities: [{ id: "x" }], email_confirmed_at: null }, session: null }, error: null }); };
  sb.auth.signInWithPassword = (o) => { A("signIn", o); return Promise.resolve({ data: {}, error: { message: "Email not confirmed", code: "email_not_confirmed" } }); };
  await inscrire();
  r.inscriptionAttente = { mode: _authMode, info: txt("#auth-info"), renvoi: vu("#auth-renvoi"),
    redirection: (appels.find(a => a.nom === "signUp") || {}).args.options.emailRedirectTo,
    pseudoEnvoye: (appels.find(a => a.nom === "signUp") || {}).args.options.data.nom,
    tentativeConnexion: appels.some(a => a.nom === "signIn"),
    sauvegardes: window.__appels.filter(x => x === "rpc:sauver_profil").length - nbSauve };

  // 3. Adresse déjà inscrite : compte sans identité
  basculerAuth("inscription"); set("#auth-pseudo", "Nouvelle"); set("#auth-email", "deja@exemple.fr"); set("#auth-mdp", "secret12"); set("#auth-mdp2", "secret12");
  sb.auth.signUp = () => Promise.resolve({ data: { user: { id: "u8", identities: [] }, session: null }, error: null });
  await inscrire();
  r.dejaInscrite = txt("#auth-erreur");

  // 4. Connexion d'un compte pas encore confirmé
  basculerAuth("connexion"); set("#auth-email", "nouvelle@exemple.fr"); set("#auth-mdp", "secret12");
  await connecter();
  r.connexionNonConfirmee = { erreur: txt("#auth-erreur"), renvoi: vu("#auth-renvoi") };

  // 5. Renvoyer l'e-mail de confirmation
  sb.auth.resend = (o) => { A("resend", o); return Promise.resolve({ data: {}, error: null }); };
  await renvoyerEmailConfirmation();
  const rs = appels.find(a => a.nom === "resend") || {};
  r.renvoi = { type: rs.args && rs.args.type, email: rs.args && rs.args.email, info: txt("#auth-info") };

  // 6. Mot de passe oublié : champ vide, puis rempli ; puis la limite d'envoi
  sb.auth.resetPasswordForEmail = (e, o) => { A("reset", { e, o }); return Promise.resolve({ data: {}, error: null }); };
  set("#auth-email", ""); await motDePasseOublie();
  r.oubliVide = txt("#auth-erreur");
  set("#auth-email", "nouvelle@exemple.fr"); await motDePasseOublie();
  const rp = appels.find(a => a.nom === "reset") || {};
  r.oubli = { email: rp.args && rp.args.e, redirection: rp.args && rp.args.o.redirectTo, info: txt("#auth-info"), erreurCachee: !vu("#auth-erreur") };
  sb.auth.resetPasswordForEmail = () => Promise.resolve({ data: {}, error: { message: "For security purposes, you can only request this after 51 seconds.", status: 429 } });
  await motDePasseOublie();
  r.oubliTropVite = txt("#auth-erreur");
  r.limiteEmail = _authMsg({ message: "email rate limit exceeded", status: 429 });

  // 7. La fin de l'inscription à la première entrée
  const avantFrom = window.__appels.filter(x => x === "from:profils").length;
  const f1 = await _terminerInscription({ id: "u9", nom: "Nouvelle", faction: null, avatar: null });
  r.finInscription = { faction: f1 && f1.id, etatFaction: etat.faction, nom: etat.nom, inscrit: etat.inscrit,
    ecritureFaction: window.__appels.filter(x => x === "from:profils").length - avantFrom };
  const avantFrom2 = window.__appels.filter(x => x === "from:profils").length;
  const f2 = await _terminerInscription({ id: "u9", nom: "Nouvelle", faction: "toundra", avatar: null });
  r.finInscriptionFactionGardee = { faction: f2 && f2.id, etatFaction: etat.faction,
    ecritureFaction: window.__appels.filter(x => x === "from:profils").length - avantFrom2 };
  fermerAuth(); fermerEntree();

  // 8. Le nouveau mot de passe (lien « mot de passe oublié »)
  sb.auth.updateUser = (a, o) => { A("updateUser", { a, o }); return Promise.resolve({ data: {}, error: null }); };
  ouvrirNouveauMdp();
  r.fenetreMdp = vu("#modale-nouveau-mdp");
  set("#nmdp-1", "court"); set("#nmdp-2", "court"); await enregistrerNouveauMdp();
  r.mdpCourt = txt("#nmdp-erreur");
  set("#nmdp-1", "nouveau123"); set("#nmdp-2", "nouveau124"); await enregistrerNouveauMdp();
  r.mdpDifferents = txt("#nmdp-erreur");
  set("#nmdp-1", "nouveau123"); set("#nmdp-2", "nouveau123"); await enregistrerNouveauMdp();
  const um = appels.filter(a => a.nom === "updateUser").pop() || {};
  r.mdpEnregistre = { envoye: um.args && um.args.a, fenetreFermee: !vu("#modale-nouveau-mdp"), journal: (journ[journ.length - 1] || {}).t };

  // 9. Ce que dit le lien d'un e-mail
  NOVA_LIEN.erreur = "otp_expired"; _annoncerLien(); NOVA_LIEN.erreur = null;
  NOVA_LIEN.message = "Confirmation link accepted. Please proceed to confirm link sent to the other email"; _annoncerLien(); NOVA_LIEN.message = null;
  NOVA_LIEN.type = "email_change"; _annoncerLien(); NOVA_LIEN.type = null;
  r.liens = alertes.map(a => a.t);

  // 10. Les Paramètres : l'adresse lue au serveur, puis le changement
  sb.auth.getUser = () => Promise.resolve({ data: { user: { email: "testeuse@exemple.fr", new_email: null } }, error: null });
  sb.auth.signInWithPassword = (o) => { A("signIn2", o); return Promise.resolve({ data: {}, error: o.password === "bon" ? null : { message: "Invalid login credentials" } }); };
  let pv = document.querySelector("#parametres-vue");
  if(!pv){ pv = document.createElement("div"); pv.id = "parametres-vue"; document.body.appendChild(pv); }
  majParametres(); await dort(50);
  r.parametres = { texte: (pv.textContent.match(/Adresse e-mail[^.]*\./) || [""])[0], ancienChamp: !!pv.querySelector("#param-email-btn") };
  pv.querySelector("#param-email").click(); await dort(20);
  pv.querySelector("#param-email-neuf").value = "nouvelle@exemple.fr"; pv.querySelector("#param-email-mdp").value = "mauvais";
  await changerEmail(); await dort(50);
  r.emailMauvaisMdp = (journ[journ.length - 1] || {}).t;
  sb.auth.getUser = () => Promise.resolve({ data: { user: { email: "testeuse@exemple.fr", new_email: "nouvelle@exemple.fr" } }, error: null });
  pv.querySelector("#param-email").click(); await dort(20);
  if(!pv.querySelector("#param-email-neuf")){ pv.querySelector("#param-email").click(); await dort(20); }
  pv.querySelector("#param-email-neuf").value = "nouvelle@exemple.fr"; pv.querySelector("#param-email-mdp").value = "bon";
  await changerEmail(); await dort(80);
  const ue = appels.filter(a => a.nom === "updateUser").pop() || {};
  r.emailChange = { envoye: ue.args && ue.args.a, redirection: ue.args && ue.args.o && ue.args.o.emailRedirectTo,
    journal: (journ[journ.length - 1] || {}).t, attente: /En attente de confirmation : nouvelle@exemple\.fr/.test(pv.textContent) };
  return r;
})()
