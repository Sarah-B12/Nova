// v1.94 — Messagerie pleine : le bon onglet du journal, les bons mots, le destinataire prévenu.
(async () => {
  const r = {}; const msgs = [];
  const jOrig = journal; journal = (m, t, c) => { msgs.push((c || "?") + "|" + m); };
  // 1. Le destinataire : paliers, une fois chacun
  _boiteAlertee = null;
  for(const n of [10, 25, 26, 30, 30, 29, 12, 27]) _alerteBoite(n);
  r.destinataire = msgs.splice(0);
  // 2. L'expéditeur : restant 1 puis 0
  const rpcOrig = sb.rpc; let restant = 1;
  sb.rpc = async (n, a) => n === "message_envoyer" ? { data:{ ok:true, nom:"Kyraa", restant }, error:null } : rpcOrig.call(sb, n, a);
  const idOrig = _idDe; _idDe = async () => "id-kyraa";
  const sessOrig = sessionActuelle; sessionActuelle = async () => ({ user:{ id:"moi" } });
  const z = document.createElement("div"); z.innerHTML = '<input id="msg-dest" value="Kyraa"><input id="msg-obj" value="o"><textarea id="msg-texte">bonjour</textarea>'; document.body.appendChild(z);
  // SERVEUR_DISPO est une constante (vraie dans le banc)
  await envoyerMessage(); restant = 0;
  z.innerHTML = '<input id="msg-dest" value="Kyraa"><input id="msg-obj" value="o"><textarea id="msg-texte">bonjour</textarea>';
  await envoyerMessage();
  r.expediteur = msgs.filter(m => /messagerie/.test(m));
  r.aucunePoste = !msgs.some(m => m.startsWith("poste|")) && !msgs.some(m => /place/.test(m));
  journal = jOrig; sb.rpc = rpcOrig; _idDe = idOrig; sessionActuelle = sessOrig;
  return r;
})()
