// v3.02 (v304, K271) — les changements de carte et les secours par le serveur. Vérifie :
//   · chaque changement de carte appelle `carte_changer` avec la bonne destination (et plus `saut_payer`) ; l'arrivée
//     RENVOYÉE est appliquée (secteur, position sur Silène, dans l'espace, au sol) ; un refus ne change rien et le dit ;
//   · en remontant de La Braise, on reste au-dessus de la planète (correctif de v303) ;
//   · les sauts de quête appellent `carte_quete` ; un refus laisse le bouton actif et ne change rien ;
//   · le secours appelle `secours_orbite` (plus `coque_remorquage`, aucun débit fait par la page) : crédits, coque,
//     secteur et position du serveur ; s'il ne voit pas de secours, rien ne bouge ;
//   · la sauvegarde : un secteur gardé par le serveur est adopté — sauf si la page a changé de carte pendant l'appel.
//   node outils/o_banc.js . cartes
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 400));
  const appels = []; const rpc0 = sb.rpc.bind(sb); let rep = {}, sauveRep = null;
  sb.rpc = (n, a) => {
    if(/^saut_payer$|^carte_changer$|^carte_quete$|^secours_orbite$|^coque_remorquage$|^agir$/.test(n))
      appels.push(n + (n === "carte_changer" ? ":" + a.p_vers : "") + (n === "carte_quete" ? ":" + a.p_carte : "") + (n === "saut_payer" ? ":" + a.p_type : "")
                  + (n === "agir" ? ":" + a.p_motif : ""));
    if(rep[n]) return Promise.resolve({ data: typeof rep[n] === "function" ? rep[n](a) : rep[n], error: null });
    if(n === "sauver_profil" && sauveRep) return Promise.resolve({ data: sauveRep(a), error: null });
    if(n === "agir") return Promise.resolve({ data: { ok: true, energie: 70 }, error: null });
    return rpc0(n, a);
  };
  const dernier = () => (etat.journal[0] || {}).t || "";
  const ign = VILLES.ignis, b = espaceLieu("base"), orb = espaceLieu(SURFACES.braise.orbite), gor = espaceLieu("trou_noir"), g2 = espaceLieu("e2_gorge");
  const raz = (sect, extra) => { etat.secteur = sect; etat.faction = "ignis"; etat.pos = { x: ign.x, y: ign.y }; etat.vaisseau = "fab_navette_legere"; etat.vaisseauPv = {};
    etat.carburant = 40; etat.energie = 100; etat.espace1 = true; etat.ancolie = true; etat.surface = null; etat.posEspace = null; Object.assign(etat, extra || {});
    if(typeof _creditsServeur !== "undefined") _creditsServeur = etat.credits|0; };   // rien à pousser : les crédits posés ici sont ceux du serveur
  const saut = (vers, plus) => a => Object.assign({ ok: true, type: "saut", litres: 18, cout_e: 10, carburant: 22, reservoir: 40, energie: 90, de: etat.secteur, secteur: a.p_vers,
                                                    pos: { x: etat.pos.x, y: etat.pos.y } }, plus || {});
  const q = () => ({ secteur: etat.secteur, pos: etat.pos, posEspace: etat.posEspace, surface: etat.surface, carburant: etat.carburant });

  // 1. décoller d'Ignis
  raz("silene"); rep.carte_changer = saut("ecart", { posEspace: { x: b.x, y: b.y } }); appels.length = 0;
  await partirVersEcart(); r.decollage = { appels: appels.slice(), ...q(), journal: etat.journal.slice(0, 3).map(e => e.t).find(t => /Décollage/.test(t)) || "" };
  // 2. refus du serveur : pas au bon endroit
  raz("silene"); rep.carte_changer = { ok: false, err: "lieu", de: "silene", vers: "ecart" }; appels.length = 0;
  await partirVersEcart(); r.decollageRefus = { appels: appels.slice(), ...q(), journal: dernier() };
  // 3. rentrer depuis le Perchoir
  raz("ecart", { posEspace: { x: b.x, y: b.y }, pos: { x: 100, y: 100 } }); rep.carte_changer = saut("silene", { pos: { x: ign.x, y: ign.y } }); appels.length = 0;
  await revenirVersSilene(); r.rentree = { appels: appels.slice(), ...q() };
  // 4. descendre sur La Braise, puis remonter (au-dessus de la planète)
  const cb = SURFACES.braise;
  raz("ecart", { posEspace: { x: orb.x + 20, y: orb.y } }); rep.carte_changer = saut("braise", { surface: { x: cb.vaisseau.x, y: cb.vaisseau.y, abord: true } }); appels.length = 0;
  await descendreBraise(); r.descente = { appels: appels.slice(), ...q() };
  rep.carte_changer = saut("ecart", { posEspace: { x: orb.x + 20, y: orb.y } }); appels.length = 0;
  await decollerBraise(); r.remontee = { appels: appels.slice(), ...q() };
  // 5. Ignis → Ancolie (l'air de la station), puis Ancolie → Silène
  const ca = SURFACES.ancolie;
  raz("silene"); rep.carte_changer = saut("ancolie", { type: "ancolie", litres: 9, cout_e: 5, surface: { x: ca.vaisseau.x, y: ca.vaisseau.y, abord: true } }); appels.length = 0;
  await partirVersAncolie(); r.ancolie = { appels: appels.slice(), ...q() };
  rep.carte_changer = saut("silene", { type: "ancolie", litres: 9, cout_e: 5 }); appels.length = 0;
  await rentrerDepuisAncolie(); r.ancolieRetour = { appels: appels.slice(), ...q() };
  // 6. la Gorge, aller et retour
  raz("ecart", { posEspace: { x: gor.x, y: gor.y }, ceres: true, carburant: 40, sac: Object.assign(etat.sac, { fab_biocarburant: 3 }) });
  rep.carte_changer = saut("ceres", { type: "gorge", cout_e: 6, posEspace: { x: g2.x, y: g2.y } }); appels.length = 0;
  await passerLaGorge(); r.gorge = { appels: appels.slice(), ...q() };
  rep.carte_changer = saut("ecart", { type: "gorge", cout_e: 6, posEspace: { x: gor.x, y: gor.y } }); appels.length = 0; etat.carburant = 40;
  await repasserLaGorge(); r.gorgeRetour = { appels: appels.slice(), ...q() };
  etat.sac.fab_biocarburant = 0;

  // 7. les sauts de quête
  const z = document.createElement("div"); document.body.appendChild(z);
  const defi = { type: "saut", carte: "ceres", lieu: "e2_gorge", bouton: "Entrer", texte: ["…"] };
  const sautQuete = async () => { z.innerHTML = QUETES_JEUX.saut.html(defi); QUETES_JEUX.saut.wire(z, defi); const bt = z.querySelector("#qj-saut"); bt.click();
    await new Promise(x => setTimeout(x, 300)); return bt.disabled; };
  raz("ecart", { posEspace: { x: gor.x, y: gor.y }, ceres: false }); rep.carte_quete = { ok: false, err: "lieu" }; appels.length = 0;
  const btRefus = await sautQuete(); r.queteRefus = { appels: appels.slice(), bouton_grise: btRefus, ...q(), ceres: etat.ceres, journal: dernier() };
  rep.carte_quete = { ok: true, secteur: "ceres", posEspace: { x: g2.x, y: g2.y } }; appels.length = 0;
  await sautQuete(); r.quete = { appels: appels.slice(), ...q(), ceres: etat.ceres };
  z.remove();

  // 8. le secours
  raz("ecart", { posEspace: { x: 2000, y: 1400 }, vaisseauPv: { fab_navette_legere: 0 }, credits: 1000 });
  rep.secours_orbite = { ok: true, cas: "cloue", frais: 200, du: 200, solde: 800, palier: false, secteur: "ecart", posEspace: { x: b.x, y: b.y },
                         vaisseau: "fab_navette_legere", coque: 30, max: 120 }; appels.length = 0;
  const s1 = await secoursOrbite(); r.secoursCloue = { ok: s1, appels: appels.slice(), ...q(), credits: etat.credits, coque: etat.vaisseauPv.fab_navette_legere,
    journal: etat.journal.slice(0, 3).map(e => e.t).find(t => /détresse/.test(t)) || "" };
  raz("ecart", { posEspace: { x: 2000, y: 1400 }, carburant: 0, credits: 100 });
  rep.secours_orbite = { ok: true, cas: "sec", frais: 20, du: 20, solde: 80, palier: false, secteur: "silene", pos: { x: ign.x, y: ign.y } }; appels.length = 0;
  const s2 = await secoursOrbite(); r.secoursSec = { ok: s2, appels: appels.slice(), ...q(), credits: etat.credits,
    journal: etat.journal.slice(0, 3).map(e => e.t).find(t => /sec/.test(t)) || "" };
  raz("ecart", { posEspace: { x: 2000, y: 1400 }, carburant: 0, credits: 100 });
  rep.secours_orbite = { ok: false, err: "pas_de_secours" }; appels.length = 0;
  const s3 = await secoursOrbite(); r.secoursNon = { ok: s3, appels: appels.slice(), ...q(), credits: etat.credits };

  // 9. la sauvegarde : le serveur a gardé un autre secteur (la geôle du Perchoir)
  raz("silene");
  sauveRep = a => ({ ok: true, rev: 500, maj: 9, pos: { x: ign.x, y: ign.y, secteur: "ecart", posEspace: { x: b.x, y: b.y } } });
  await sauverMaintenant(); r.sauve = q();
  raz("silene");
  sauveRep = a => { etat.secteur = "ancolie"; return { ok: true, rev: 501, maj: 10, pos: { x: ign.x, y: ign.y, secteur: "ecart", posEspace: { x: b.x, y: b.y } } }; };
  await sauverMaintenant(); r.sauvePendantSaut = q();
  sauveRep = null;

  sb.rpc = rpc0;
  return r;
})()
