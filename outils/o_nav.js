// v1.93t — les trois boutons de voyage, partout ; Triptolème ⇄ Ancolie ; carte d'Ancolie ; journal.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, att = ms => new Promise(x=>setTimeout(x,ms)), msgs = [];
  journal = (m) => msgs.push(m); sauverMaintenant = async () => {}; agirServeur = async () => ({ ok:true });
  ouvrirOrbite = () => {}; fermerOrbite = () => {}; ouvrirCarteBraise = () => {}; fermerCarteBraise = () => {}; ouvrirCarte = () => { r.carteOuverte = true; };
  etat.espace1 = true; etat.vaisseau = "fab_navette_legere"; etat.ancolie = true; etat.verrouMaar = false; etat.carburant = 40;
  etat.sac = Object.assign(etat.sac || {}, { fab_biocarburant:5 });
  const lire = () => ["#ouvrir-carte","#ouvrir-orbite","#ouvrir-ancolie"].map(s => { const b = document.querySelector(s);
    return b.hidden ? "—" : `${b.querySelector("span").textContent} [${b.querySelector(".cout").textContent}]${b.style.opacity ? " (grisé)" : ""}`; });
  const base = espaceLieu("base");
  // 1. Silène, en ville
  etat.secteur = "silene"; etat.surface = null; etat.pos = { ...VILLES[etat.faction] }; majBoutonOrbite(); r.silene = lire();
  // 2. Triptolème, au Perchoir / ailleurs
  etat.secteur = "ecart"; etat.posEspace = { x:base.x, y:base.y }; majBoutonOrbite(); r.perchoir = lire();
  etat.posEspace = { x:base.x + 900, y:base.y }; majBoutonOrbite(); r.horsPerchoir = lire();
  // 3. Ancolie, à la station / ailleurs
  etat.secteur = "ancolie"; etat.posEspace = null; etat.surface = { x:1063, y:905, abord:false }; majBoutonOrbite(); r.station = lire();
  etat.surface = { x:400, y:1200, abord:false }; majBoutonOrbite(); r.horsStation = lire();
  etat.verrouMaar = true; etat.surface = { x:1063, y:905 }; majBoutonOrbite(); r.verrou = lire()[1]; etat.verrouMaar = false;
  // 4. La Braise (au sol)
  etat.secteur = "braise"; etat.surface = { x:500, y:500 }; majBoutonOrbite(); r.braise = lire(); r.boutonBraise = !document.querySelector("#ouvrir-braise").hidden;
  msgs.length = 0; boutonAncolie(); r.braiseClic = msgs[0];
  // 5. Les nouvelles routes
  etat.secteur = "ancolie"; etat.surface = { x:1063, y:905, abord:false }; etat.carburant = 40;
  await partirEcartDepuisAncolie(); r.ancolieVersTripto = { secteur:etat.secteur, auPerchoir:surBase(), carburant:etat.carburant };
  etat.carburant = 40; await partirAncolieDepuisEcart(); r.triptoVersAncolie = { secteur:etat.secteur, surface:etat.surface, aLaStation:aLaStation() };
  etat.surface = { x:400, y:1200 }; msgs.length = 0; await partirEcartDepuisAncolie(); r.refusHorsStation = etat.secteur === "ancolie" && /rejoins-la/.test(msgs[0]);
  etat.surface = { x:1063, y:905 }; msgs.length = 0; boutonSilene(); await att(150); r.ancolieVersSilene = etat.secteur;
  // 6. La carte d'Ancolie : la station (blanche, recentrée) et rien d'autre (le lac gelé seulement s'il est connu)
  etat.secteur = "ancolie"; etat.surface = { x:1063, y:905 }; etat.seleniteConnue = true;
  let svg = document.querySelector("#carte-braise"); if(!svg){ svg = document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.id = "carte-braise"; document.body.appendChild(svg); }
  majCarteBraise(); const t = svg.innerHTML;
  r.carteAncolie = { station:/La station/.test(t), lac:/Le lac gelé/.test(t), cratere:/Le Cratère/.test(t), glaces:/Les Glaces/.test(t), chute:/point de chute/.test(t),
                     stationBlanche:/cx="1063" cy="905" r="110"[^>]*stroke="#ffffff"/.test(t), boutonRentrer:document.querySelector("#braise-decoller").style.display };
  r.quetesTrouventEncore = !!surfaceLieu("ancolie", "chute") && !!surfaceLieu("ancolie", "cratere");
  // 7. Le journal
  r.journal = _categoriser("Vortex a tenté de te faire les poches — tu l'as repéré à temps.");
  return r;
})();
