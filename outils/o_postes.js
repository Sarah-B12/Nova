// v2.10 — Missions : postes figés au départ (K130), cité visée, étapes, coffre lisible
// (node outils/o_banc.js .. postes). On dessine _mMonGroupe dans chaque état et on lit le HTML.
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1200);
  const div = document.createElement("div"); document.body.appendChild(div);
  const txt = h => { div.innerHTML = h; return div.textContent.replace(/\s+/g, " "); };
  const fac = FACTIONS[0].id, facNom = FACTIONS[0].nom;
  const coffre = { minimum:false, scelle:false, mes_depots:{}, sortes:[
    { id:"cape", nom:"Capes d'ombre", recettes:[{ cuir:2, biofil_renforce:1 }], unites:0, min:2, max:6 },
    { id:"crochet", nom:"Crochets", recettes:[{ lingot_cendrite:1 }], unites:2, min:2, max:6 },
    { id:"brouilleur", nom:"Brouilleurs", recettes:[{ cablage:1 }], unites:6, min:2, max:6 } ] };
  const base = { id:7, type:"casse", revele:true, taille_min:2, taille_max:6, postes:{ crocheteur:1, guetteur:1 }, coffre };
  const g0 = (poste1, poste2, statut, fondateur) => ({ id:3, statut, ouvert:true, moi_fondateur:fondateur, membres:[
    { nom:"Autrice", poste:poste1, statut:"actif", moi:true }, { nom:"Testeuse", poste:poste2, statut:"actif" } ] });
  // 1. La cité visée avant le départ
  let h = _mMonGroupe({ ...base, cible:fac }, g0(null, null, "formation", true));
  div.innerHTML = h; const sel = div.querySelector("#mi-cible");
  r.citeMeneur = sel && sel.value === fac;
  r.citeMembre = txt(_mMonGroupe({ ...base, cible:fac }, g0(null, null, "formation", false))).includes("Cité visée : " + facNom);
  r.citePasEncore = /pas encore choisie par le meneur/.test(txt(_mMonGroupe({ ...base, cible:null }, g0(null, null, "formation", false))));
  // 2. Choisir son poste, et partir
  let t = txt(_mMonGroupe(base, g0(null, null, "formation", true)));
  r.formation = { descriptions: /Crocheteur — Le jour du casse, il ouvre la serrure/.test(t) && /Guetteur — Le jour du casse, il brouille les drones/.test(t),
                  pasLesAutres: !/Encordeur|Artificier|Hacker/.test(t), ombre: /Sans poste, tu n'as pas de jeu à toi/.test(t), figeAuDepart: /se figent au départ/.test(t),
                  partirBloque: (div.querySelector("[data-mi-lancer]") || {}).disabled === true, pourquoi: /Il manque : Crocheteur, Guetteur\./.test(t) };
  h = _mMonGroupe({ ...base, mon_poste:"crocheteur" }, g0("crocheteur", null, "formation", true)); t = txt(h);
  r.unPoste = { bloque: div.querySelector("[data-mi-lancer]").disabled, manque: /Il manque : Guetteur\./.test(t) };
  h = _mMonGroupe({ ...base, mon_poste:"crocheteur" }, g0("crocheteur", "guetteur", "formation", true)); t = txt(h);
  r.deuxPostes = { libre: !div.querySelector("[data-mi-lancer]").disabled, plusDeManque: !/Il manque/.test(t) };
  // 3. Après le départ
  h = _mMonGroupe({ ...base, mon_poste:"crocheteur", vue:null }, g0("crocheteur", "guetteur", "lance", true)); t = txt(h);
  r.parti = { pasDeMenu: !div.querySelector("#mi-poste"), fige: /Ton poste : Crocheteur \(fixé depuis le départ\)/.test(t), saDescription: /cinq goupilles/.test(t), pasCelleDuGuetteur: !/brouille les drones/.test(t) };
  const g3 = g0(null, "guetteur", "lance", false);
  h = _mMonGroupe({ ...base, mon_poste:null, vue:null }, g3); t = txt(h);
  const opts = [...div.querySelectorAll("#mi-poste option")].map(o => o.value).filter(Boolean);
  r.posteLibre = { menu: opts.join(","), mention: /Un poste est resté libre/.test(t) && /il ne change plus/.test(t) };
  h = _mMonGroupe({ ...base, mon_poste:null, vue:null }, { ...g3, membres:[...g3.membres, { nom:"X", poste:"crocheteur", statut:"actif" }] }); t = txt(h);
  r.ombre = !div.querySelector("#mi-poste") && /Sans poste, tu n'as pas de jeu à toi/.test(t);
  // 4. Le coffre en clair
  t = txt(_mCoffre(base));
  r.coffre = { manque: /Capes d'ombre.*0 sur 2\s*il en manque 2/.test(t), atteint: /Crochets.*2 ✓\s*jusqu'à 6/.test(t), complet: /Brouilleurs.*6 ✓\s*complet/.test(t),
               explication: /au-delà, chaque unité de plus rend l'épreuve plus facile/.test(t), plusDeBarre: !/\d+ \/ \d/.test(t) };
  // 5. Les étapes : une seule à la fois
  const etapes = h => { div.innerHTML = h; return [...div.querySelectorAll(".mi-etape b")].map(b => b.textContent); };
  const C = v => _mCasse({ ...base, vue:v }, g0("crocheteur", "guetteur", "lance", true));
  r.casse = { preparation: etapes(C({ phase:"preparation", cible:fac, meneur:true })),
              reperage: (() => { div.innerHTML = C({ phase:"preparation", cible:fac, meneur:true }); return /Le repérage/.test(div.textContent) && /Un seul d'entre vous suffit/.test(div.textContent); })(),
              casse: etapes(C({ phase:"casse", cible:fac, mon_poste:"crocheteur", casse:{ faits:{} } })),
              unFait: etapes(C({ phase:"casse", cible:fac, mon_poste:"crocheteur", casse:{ faits:{ crocheteur:true } } })),
              vitrines: etapes(C({ phase:"casse", cible:fac, casse:{ faits:{ crocheteur:true, guetteur:true } } })),
              seconde: etapes(C({ phase:"repousse", cible:fac, tentatives:1, reperage:{ jour:"2026-10-30", vendeurs:3, niveau:1 } })) };
  r.autres = {
    bouture: [etapes(_mBouture({ id:1, vue:{ phase:"drones", limite:"2026-11-02" } })), etapes(_mBouture({ id:1, vue:{ phase:"soins", jours:[] } }))],
    balise: [etapes(_mBalise({ id:2, coffre, vue:{ phase:"preparation", limite:"2026-11-02" } })), etapes(_mBalise({ id:2, vue:{ phase:"descente", descente:{ tempete:Date.now() + 6e5, faits:{} } } })),
             etapes(_mBalise({ id:2, vue:{ phase:"descente", descente:{ tempete:Date.now() + 6e5, faits:{ encordeur:1, eclaireur:1, dechiffreur:1 } } } }))],
    infiltration: ["releve","breche","rangement","sentinelles"].map(p => etapes(_mInfiltration({ id:3, coffre, vue:{ phase:p, limite:"2026-11-02" } }))),
    satellite: ["rendezvous","escorte","sas","coeur"].map(p => etapes(_mSatellite({ id:4, coffre, vue:{ phase:p, limite:"2026-11-02", escorte:{ tirs:{} } } })))
  };
  r.uneSeuleAChaqueFois = [r.casse.preparation, r.casse.casse, r.casse.unFait, r.casse.vitrines, r.casse.seconde, ...r.autres.bouture, ...r.autres.balise, ...r.autres.infiltration, ...r.autres.satellite].every(e => e.length === 1);
  // 6. Les messages d'erreur nouveaux
  r.erreurs = [MISSION_ERREURS.poste_fige, MISSION_ERREURS.postes_vides];
  return r;
})();
