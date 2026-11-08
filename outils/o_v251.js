// v2.51 — la trouvaille doublée (K179), la prison d'espionnage (K180), le hack (K181), la grille du tir (K182).
// node o_banc.js .. v251
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  // 1. La chance affichée (le serveur tire : _chance_trouvaille, v269)
  const avec = (int, drone) => { etat.competences.intelligence = int; etat.equipement = etat.equipement || {};
    etat.equipement.drone = drone ? "fab_drone_recuperateur" : null; return Math.round(chanceDouble() * 1000) / 10; };
  r.chance = [avec(10,false), avec(100,false), avec(200,false), avec(200,true), avec(400,true)];   // [0,5 ; 5 ; 10 ; 15 ; 15] (le drone ne compte que s'il est équipé et au niveau)
  r.plafond = TROUVAILLE_MAX;                                                                        // 0,15
  r.drone = EQUIP_EFFETS.fab_drone_recuperateur.double;                                              // 5
  r.fiche = COMPETENCES.find(c => c.id === "intelligence").desc;                                     // sans « négociation »
  // 2. Le journal annonce le surplus renvoyé par le serveur
  const lignes = []; journal = t => lignes.push(t);
  _journalDouble({ double:{ silite:3, voltane:1 } }); _journalDouble({ double:{} }); _journalDouble({});
  r.journal = lignes;                                                                                // une seule ligne : « Trouvaille doublée ! +3 …, +1 …. »
  // 3. La prison d'espionnage (K180)
  const pc = f => [10,17,50,100,150,200].map(a => Math.round(f(a) * 1000) / 10);
  r.risque = pc(espionRisquePrison);                                                                 // [30, 10, 8,6, 6,4, 4,2, 2]
  r.duree  = pc(espionDureePrison);                                                                  // [70, 49, 36,7, 31,1, 25,6, 20]
  r.decroit = [0,20,40,60,80,100,120,140,160,180,200].every((a, i, t) => i === 0 || espionRisquePrison(a) <= espionRisquePrison(t[i-1]));   // true
  // 4. Le hack (K181) : textes du jeu (le serveur applique : vol_conclure, v270)
  r.hack = [VOL_PART_BASE, VOL_PART_PAR_INT, VOL_CAP_CREDITS, VOL_CAP_ABS];                        // [0,06 ; 0,0002 ; 0,1 ; 2000]
  r.hackAu200 = Math.round((VOL_PART_BASE + 200 * VOL_PART_PAR_INT) * 1000) / 10;                     // 10 (%)
  // 5. La grille du tir de sondage (K182) : une case de moins tous les 50 points
  r.grille = [10, 49, 50, 99, 100, 149, 150, 200, 400].map(i => { etat.competences.intelligence = i; return _tirTaille(); });   // [7,7,6,6,5,5,4,4,4]
  etat.competences.intelligence = 160; lancerTirSonde(() => {}, () => {}, { durci:true });
  r.durci = [_tirN, _tirAst.size, !_tirAst.has(_tirCoeur.x + "," + _tirCoeur.y)];                   // [6, 6, true]
  etat.competences.intelligence = 160; lancerTirSonde(() => {}, () => {}, {});
  r.simple = [_tirN, _tirAst.size, document.querySelector("#tir-modale").textContent.includes("4 × 4")];   // [4, 4, true]
  _tirFermer();
  return r;
})();
