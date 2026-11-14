// v2.87 (v289, K260) — l'achat en boutique passe par `boutique_acheter` (un seul appel serveur :
// objet + débit), plus par agir() + crediter(). Vérifie : l'appel et ses arguments, la sauvegarde
// AVANT (le serveur lit la position sauvée), le solde et le sac appliqués depuis la réponse, aucun
// débit local, les refus dits au joueur, le double clic ignoré, et l'affichage du prix arrondi
// comme le serveur (boutique mobile + boisson 0,7 : 116, pas 115).
//   node outils/o_banc.js . boutiqueachat
(async function(){
  const r = {};
  const appels = [];
  const rpc0 = sb.rpc.bind(sb);
  let reponse = null;
  sb.rpc = (nom, args) => {
    appels.push(nom + (nom === "boutique_acheter" ? " " + JSON.stringify(args) : ""));
    if(nom === "boutique_acheter") return new Promise(res => setTimeout(() => res({ data: reponse, error: null }), 30));
    if(nom === "agir") return Promise.resolve({ data: { ok: true, ajoutes: args.p_ajouter, etat: { sac: {} } }, error: null });
    return rpc0(nom, args);
  };
  const jr = () => (etat.journal || [])[0];
  const texte = e => e ? (e.t || e.texte || e.txt || JSON.stringify(e)) : "";
  await new Promise(res => setTimeout(res, 300));
  _surNidBoutique = () => false; _surBaseBoutique = () => false;
  villeActuelle = () => "ignis";
  etat.credits = 1000;
  document.body.insertAdjacentHTML("beforeend", `<div id="boutique-vue"></div>`);
  boutiqueTab = "conso"; renderBoutique();
  const champ = document.querySelector("#bq-fab_kit_de_soin"); if(champ) champ.value = "2";

  // 1. Achat réussi : le serveur répond 2 kits, 320 ₡, solde 680.
  reponse = { ok: true, item: "fab_kit_de_soin", recu: 2, demande: 2, prix: 160, total: 320, solde: 680, comptoir: "cite",
              etat: { sac: { cendrite: 12, sylve: 3, fab_kit_de_soin: 2 }, coffre: {}, soute: {}, lots: [], equipe: {} } };
  appels.length = 0;
  await acheterBoutique("fab_kit_de_soin");
  r.appels = appels.filter(a => /boutique_acheter|agir|sauver_profil/.test(a));   // (crediter : seulement l'écart déjà en attente, poussé AVANT par rpcAvecSolde)
  r.sauveAvant = appels.indexOf("sauver_profil") > -1 && appels.indexOf("sauver_profil") < appels.findIndex(a => a.startsWith("boutique_acheter"));
  r.credits = etat.credits;
  r.kitsAuSac = etat.sac.fab_kit_de_soin;
  r.journal = texte(jr());

  // 2. Refus du serveur : hors_ville → message, rien ne bouge.
  reponse = { ok: false, err: "hors_ville" };
  const avant = etat.credits;
  await acheterBoutique("fab_kit_de_soin");
  r.refus = texte(jr()); r.creditsApresRefus = etat.credits === avant;

  // 3. Double clic : un seul appel.
  reponse = { ok: true, item: "fab_kit_de_soin", recu: 1, demande: 1, prix: 160, total: 160, solde: 520, comptoir: "cite", etat: { sac: { fab_kit_de_soin: 3 } } };
  if(champ) champ.value = "1";
  appels.length = 0;
  await Promise.all([acheterBoutique("fab_kit_de_soin"), acheterBoutique("fab_kit_de_soin")]);
  r.doubleClic = appels.filter(a => a.startsWith("boutique_acheter")).length;

  // 4. Prix affiché : boutique mobile (+10 %) et boisson 0,7 → 165 × 0,7 = 115,5 → 116 (comme le serveur).
  villeActuelle = () => null; aptBoutiquePartout = () => true;
  etat.boisson = { mods: { boutique: 0.7 }, fin: new Date(Date.now() + 3600e3).toISOString() };
  r.prixMobileBoisson = _prixBoutique({ id: "kit_reparation", prix: 150 });
  r.prixMobileKitSoin = _prixBoutique({ id: "fab_kit_de_soin", prix: 160 });   // 176 × 0,7 = 123,2 → 123
  etat.boisson = null;
  // 5. Taxe de la Poste affichée = celle du serveur (5 % de 139, arrondi au-dessus → 7).
  r.taxePosteKit = _taxeObjet("fab_kit_de_soin", 1);
  sb.rpc = rpc0;
  return r;
})()
