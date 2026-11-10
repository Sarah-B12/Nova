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
                  partirBloque: (div.querySelector("[data-mi-lancer]") || {}).disabled === true, pourquoi: /Il manque 1 crocheteur, 1 guetteur\./.test(t) };   // v2.67 : le nombre manquant de chaque poste
  h = _mMonGroupe({ ...base, mon_poste:"crocheteur" }, g0("crocheteur", null, "formation", true)); t = txt(h);
  r.unPoste = { bloque: div.querySelector("[data-mi-lancer]").disabled, manque: /Il manque 1 guetteur\./.test(t) };
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
  // 6. v2.11 — la brèche dit quand le coffre se scelle ; une mission finie qui attend un gain le dit
  div.innerHTML = _mInfiltration({ id:3, coffre, vue:{ phase:"breche", limite:"2026-11-02" } });
  // v2.65 (K221) : le texte de la brèche, réécrit.
  r.brecheCoffre = /vous pouvez encore compléter le coffre/.test(div.textContent) && /il est fermé pour de bon/.test(div.textContent);
  _missions = { ...(_missions || {}), gains:[{ id:1, item:"cape", qte:1, mission:"Le satellite" }] };
  div.innerHTML = _mCarte({ id:9, type:"satellite", nom:"Le satellite", revele:true, deja:true, mon_groupe:6, mon_statut:"actif", groupes:[{ id:6, statut:"reussi", membres:[] }] });
  r.finieAvecGain = /la mission disparaîtra ensuite/.test(div.textContent);
  _missions = { ...(_missions || {}), gains:[] };   // v2.24 (K142) : sans gain, elle reste jusqu'au lendemain
  div.innerHTML = _mCarte({ id:9, type:"satellite", nom:"Le satellite", revele:true, deja:true, mon_groupe:6, mon_statut:"actif", groupes:[{ id:6, statut:"rate", membres:[] }] });
  r.finieSansGain = /restera ici jusqu'à demain/.test(div.textContent) && !/Récupère/.test(div.textContent);
  // 7. v2.13 — le dépôt : la quantité ne dépasse pas ce qu'on a
  etat.sac = { ...(etat.sac || {}), lingot_cendrite:4, cuir:9 };
  const cof2 = { ...coffre, sortes:[{ id:"crochet", nom:"Crochets", recettes:[{ lingot_cendrite:1 }], unites:0, min:2, max:6 }, { id:"cape", nom:"Capes", recettes:[{ cuir:2, biofil_renforce:1 }], unites:0, min:2, max:6 }] };
  div.innerHTML = _mCoffre({ ...base, coffre:cof2 }); _mBrancher(div);
  const dsel = div.querySelector("#mi-dep-item"), dqte = div.querySelector("#mi-dep-qte");
  dsel.value = "lingot_cendrite"; dsel.dispatchEvent(new Event("change"));
  dqte.value = "21"; dqte.dispatchEvent(new Event("input"));
  r.depot = { borne: dqte.value, max: dqte.max };
  dsel.value = "cuir"; dsel.dispatchEvent(new Event("change")); dqte.value = "21"; dqte.dispatchEvent(new Event("input"));
  r.depot.cuir = dqte.value;
  const rpc0 = sb.rpc.bind(sb); let envoye = null; const lus = []; const vj = journal; journal = (t, ...x) => { lus.push(String(t)); return vj(t, ...x); };
  sb.rpc = (n, a) => { if(n === "mission_deposer"){ envoye = a.p_qte; return Promise.resolve({ data:{ ok:true, depose:2, demande:a.p_qte, limite:"sac" }, error:null }); } return rpc0(n, a); };
  dsel.value = "lingot_cendrite"; dqte.value = "4"; div.querySelector("[data-mi-deposer]").click(); await att(150);
  r.depot.envoye = envoye; r.depot.message = lus.find(t => /^Déposé/.test(t)) || null;
  sb.rpc = rpc0; journal = vj;
  // 8. v2.14 — le fil de la mission
  const hier = new Date(Date.now() - 864e5).toISOString(), maint = new Date().toISOString();
  const mf = { ...base, cible:fac, fil:[{ t:"Ton groupe est parti pour la mission « Le casse ».", q:hier }, { t:"Autrice a choisi la cible : le marché de {fac:" + fac + "}.", q:maint }] };
  div.innerHTML = _mFil(mf);
  const lis = [...div.querySelectorAll(".mi-fil li")].map(li => li.textContent.replace(/\s+/g, " ").trim());
  r.fil = { lignes: lis.length, recentEnHaut: /a choisi la cible/.test(lis[0] || ""), libelle: (lis[0] || "").includes(facNom) && !(lis[0] || "").includes("{fac:"),
            hier: /^hier \d\d:\d\d/.test(lis[1] || ""), replie: !div.querySelector("details").open, vide: _mFil({ ...base, fil:[] }) === "" };
  _mBrancher(div); const det = div.querySelector("details"); det.open = true; det.dispatchEvent(new Event("toggle"));
  div.innerHTML = _mFil(mf); r.fil.resteOuvert = div.querySelector("details").open;
  _mFilOuvert = {};
  // 9. v2.15 — le repérage, une photo datée
  const rq = new Date(); rq.setHours(8, 32, 0, 0);
  div.innerHTML = C({ phase:"preparation", cible:fac, reperage:{ par:"Vortex", jour:"2026-10-31", quand:rq.toISOString(), vendeurs:0, niveau:1 } });
  let tr = div.textContent.replace(/\s+/g, " ");
  r.reperage = { date: /Au repérage de Vortex \(\d+\/\d+, 08:32\)/.test(tr), zero: /personne d'autre ne vendait en vitrine, sous un œil\./.test(tr),
                 explique: /le butin se prendra dans celle du jour du casse/.test(tr), plusAuPresent: !/0 vendeur/.test(tr) };
  div.innerHTML = C({ phase:"preparation", cible:fac, reperage:{ par:"X", jour:"2026-10-30", vendeurs:3, niveau:2 } });
  tr = div.textContent.replace(/\s+/g, " ");
  r.reperage.ancienSansHeure = /Au repérage de X \(30\/10\) : 3 vendeurs en vitrine, bien gardé\./.test(tr);
  // 10. v2.21 — la seconde tentative : le bon moment, et qui doit agir
  const aujIso = new Date().toISOString().slice(0, 10); _missions = { ...(_missions || {}), jour:aujIso };   // le jour du jeu, comme missions_lire le donne
  const jourAvant = (() => { const d = new Date(aujIso + "T12:00:00"); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  const gK = { ...g0("crocheteur", "guetteur", "lance", false), fondateur:"Kyraa" };
  const rep = jour => { div.innerHTML = _mCasse({ ...base, vue:{ phase:"repousse", cible:fac, tentatives:1, epreuve_jour:jour, meneur:false, reperage:{ par:"Vortex", jour:"2026-10-30", vendeurs:2, niveau:1 } } }, gK); return div.textContent.replace(/\s+/g, " "); };
  const tLendemain = rep(jourAvant), tMemeJour = rep(aujIso);
  r.retenter = { lendemain: /peut se retenter, dès aujourd'hui, et jusqu'au/.test(tLendemain), memeJour: /peut se retenter, pas avant demain/.test(tMemeJour),
                 meneurNomme: /Seul le meneur, Kyraa, peut relancer le casse\./.test(tLendemain) };
  // 11. v2.23b — en attendant l'autre poste : ce qui reste, et à qui
  const pt = { crocheteur:"Kyraa", guetteur:"Vortex" };
  div.innerHTML = C({ phase:"casse", cible:fac, mon_poste:"guetteur", postes_tenus:pt, casse:{ faits:{ guetteur:true } } });
  let tc = div.textContent.replace(/\s+/g, " ");
  r.attente = { guetteur: /Les drones sont brouillés\. Il reste la serrure — le crocheteur \(Kyraa\)\. Ensuite, chacun pourra vider les vitrines\./.test(tc) };
  div.innerHTML = C({ phase:"casse", cible:fac, mon_poste:null, postes_tenus:pt, casse:{ faits:{} } });
  tc = div.textContent.replace(/\s+/g, " ");
  r.attente.ombre = /Il reste la serrure — le crocheteur \(Kyraa\) et le brouillage — le guetteur \(Vortex\)\./.test(tc);
  div.innerHTML = C({ phase:"casse", cible:fac, mon_poste:"guetteur", postes_tenus:pt, casse:{ faits:{ guetteur:true, crocheteur:true } } });
  r.attente.vider = !!div.querySelector("[data-mi-vider]");
  // 12. Les messages d'erreur nouveaux
  r.erreurs = [MISSION_ERREURS.poste_fige, MISSION_ERREURS.postes_vides];
  return r;
})();
