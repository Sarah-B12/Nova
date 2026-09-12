/* ===========================================================
   APTITUDES-EFFETS — Effets passifs des aptitudes (LOT 1 : boucle d'action).
   Fonctions pures : elles lisent les nœuds pris (aptPris) et renvoient une
   valeur modifiée. Tout l'équilibrage des aptitudes vit ICI, à un seul endroit ;
   les fichiers de jeu ne portent que des hooks d'une ligne.

   Lot 2 (à venir) : structures & atelier — Filon profond, Réparateur, Chantier,
   Recyclage, Surrégime, Verger, Cultures vivaces, et les 4 nœuds Artisan.
   Effets dormants (non branchés) : zones chaudes/froides (Ignis, Toundra ; −15 % énergie/O₂ prévu, cohérence Endurance),
   PvP (Intrusion), marché des joueurs (Marchand), équipement (Cœur de forge),
   Protocole (Fléau du Protocole).
   =========================================================== */

function _apt(id){ return typeof aptPris === "function" && aptPris(id); }

/* ---------- Sac ---------- */
function capaciteSac(){ return SAC_MAX + (_apt("pr4") ? 15 : 0); }              // Sac renforcé +15

/* ---------- Énergie ---------- */
/* Sang de magma (ig1) / Isolation (to1) : −15 % en zone chaude / froide. */
function aptZoneThermique(){
  const chaud = _apt("ig1") && typeof enZoneChaude==="function" && enZoneChaude();
  const froid = _apt("to1") && typeof enZoneFroide==="function" && enZoneFroide();
  return (chaud || froid) ? 0.85 : 1;
}
/* ⚠ v0.59 — Endurance (sv4) n'était appliquée qu'à l'AFFICHAGE : les actions
   débitaient COUT_TERRAIN brut. agirServeur() l'applique désormais aux motifs
   d'action (voir MOTIFS_ACTION, inventaire.js). */
/* v0.79 — chaque effet de boisson passe par ces mêmes fonctions : un seul
   point de branchement par effet, comme pour les aptitudes. `_boi` vaut 1
   (neutre) tant qu'aucune boisson n'est active. */
function _boi(cle){ return (typeof boissonMod==="function") ? boissonMod(cle, 1) : 1; }
function aptEnergieAction(cout){ return Math.max(1, Math.round(cout * (_apt("sv4") ? 0.85 : 1) * aptZoneThermique() * _boi("energie_cout"))); }                                  // Endurance −15 %
function aptEnergieExplore(cout){ return Math.max(1, Math.round(cout * (_apt("sv4") ? 0.85 : 1) * (_apt("om2") ? 0.9 : 1))); }        // Endurance + Repérage
function aptEnergieDeplacement(cout){ let m = 1; if(_apt("om3")) m *= 0.8; if(_apt("no4")) m *= 0.8;
  if(_apt("om2")) m *= 0.9; if(_apt("sv4")) m *= 0.85; m *= aptZoneThermique(); m *= _boi("energie_depl");
  return Math.max(1, Math.round(cout * m)); }   // Pas léger · Voyageur · Repérage · Endurance · zones (multiplicatif)
/* O₂ d'un déplacement à découvert : Repérage (om2) −10 %, zones thermiques −15 %. */
function aptO2Deplacement(c){ return Math.max(1, Math.round(c * (_apt("om2") ? 0.9 : 1) * aptZoneThermique() * _boi("o2_cout"))); }
function aptRegenEnergie(){ return (_apt("sv2") ? 2 : 0) + (_apt("cu4") ? 1 : 0); }                                                   // Récupération + Organisme (+%/h)

/* ---------- Oxygène ---------- */
function aptO2Bonus(){ return _apt("sv1") ? 1 : 0; }                            // Poumons d'acier −1 (appliqué dans coutO2)
function aptO2Explore(cout){ return Math.max(1, Math.round(cout * (_apt("om2") ? 0.9 : 1))); }   // Repérage −10 % O₂ à l'exploration

/* ---------- Régénération passive (O₂ / santé / moral) ; l'énergie passe par regenEnergie ---------- */
function regenPassif(){
  const now = Date.now();
  if(!etat.regenMaj){ etat.regenMaj = now; return; }
  const h = (now - etat.regenMaj) / 3600000;
  if(h <= 0) return;
  etat.regenMaj = now;
  // ⚠ Les jauges appartiennent au serveur. On calcule le gain ici (les aptitudes
  // sont une donnée client) mais on le fait APPLIQUER par agir(), sinon il serait
  // écrasé au premier appel serveur — le piège des crédits, puis de l'énergie.
  let go2 = 0, gs = 0, gm = 0;
  if(_apt("cu3")) go2 = Math.max(0, Math.min(100, etat.jauges.o2 + h*2) - etat.jauges.o2);   // Photosynthèse +2 O₂/h
  if(_apt("cu4")){                                                               // Organisme : +1 santé/moral/h, plafond 60
    gs = Math.max(0, Math.min(60, etat.jauges.sante + h) - etat.jauges.sante);
    gm = Math.max(0, Math.min(60, etat.jauges.moral + h) - etat.jauges.moral);
  }
  if((go2 + gs + gm) >= 1 && typeof agirServeur === "function"){
    // Seuil de 1 point : on n'envoie pas une requête pour 0,03 point d'O₂.
    agirServeur({ jauges:{ o2:Math.round(go2), sante:Math.round(gs), moral:Math.round(gm) }, motif:"regen_aptitude" });
  } else {
    etat.regenMaj = now - (h * 3600000);   // on garde le reliquat pour le prochain passage
  }
}

/* ---------- Crédits ---------- */
function aptCredits(g){ return Math.round(g * (_apt("no3") ? 1.15 : 1) * _boi("credits")); }                                        // Négociant +15 %
function aptButinExplore(g){ return Math.round(g * (_apt("no3") ? 1.15 : 1) * (_apt("om2") ? 1.25 : 1)); }        // + Repérage +25 %
function aptButinCombat(g){ let m = (_apt("no3") ? 1.15 : 1); if(_apt("tr3")) m *= 1.25; if(_apt("ig4")) m *= 1.10;
  if(_apt("tr4")) m *= 1.25;                                                        // Fléau du Protocole (les patrouilles SONT le Protocole)
  if(_apt("om2")) m *= 1.25;                                                        // Repérage
  if(_apt("ig2") && typeof enZoneChaude==="function" && enZoneChaude()) m *= 1.25;  // Fournaise
  m *= _boi("butin");
  return Math.round(g * m); }
function aptCombatBonusProtocole(){ return _apt("tr4") ? 0.10 : 0; }               // Fléau : +10 points de victoire en patrouille

/* ---------- Combat ---------- */
/* ⚠ v0.71 — « Instinct de combat » (tr1) et « Combustion » (ig3) ne retiraient
   que 2 à la dureté de la patrouille. Or la chance de victoire vaut
   0,22 + 0,0042×(Force − dureté) : 2 points de dureté ne valent que
   +0,84 POINT de victoire. Une aptitude payée un PA ne se voyait donc pas —
   23,7 % de victoire sans elle, 24,5 % avec. Elles agissent maintenant
   directement sur la chance de victoire (voir aptCombatBonusVictoire). */
function aptCombatFcReduc(){ return 0; }
/* Bonus de victoire en patrouille, en points de pourcentage. */
function aptCombatBonusVictoire(){
  return (_apt("tr1") ? 0.08 : 0)      // Instinct de combat : +8 points
       + (_apt("ig3") ? 0.06 : 0);     // Combustion        : +6 points
}
function aptCombatDegats(d){ let m = 1; if(_apt("tr2")) m *= 0.7; if(_apt("to2")) m *= 0.9; if(_apt("sv3")) m *= 0.75; return Math.max(1, Math.round(d * m)); } // Cuirasse + Trempe + Métabolisme
// (Discrétion agit désormais sur le taux de patrouille dans patrouille.js — voir chancePatrouille().)

/* ---------- Minerai / rareté ---------- */
function aptBonusRare(base){ return base + (_apt("pr3") ? 8 : 0); }                                               // Œil du mineur

/* ---------- Minage en zone thermique (v0.59) ---------- */
function aptMineLot(n){ const m=(_apt("ig2") && typeof enZoneChaude==="function" && enZoneChaude()) ? 1.25 : 1;
  return Math.max(1, Math.round(n * m * _boi("mine"))); }                                                          // Fournaise +25 % · boisson
function aptGivriteForcee(){ return _apt("to1") && typeof enZoneFroide==="function" && enZoneFroide() && Math.random() < 0.15; }    // Isolation : +Givrite
function aptVeineCristal(){ return _apt("to4") && typeof enZoneFroide==="function" && enZoneFroide() && Math.random() < 0.05; }     // Veine de cristal

/* ---------- Soin (consommables) ---------- */
function aptSoin(soin){ return Math.round(soin * (_apt("cu1") ? 1.3 : 1)); }                                      // Autarcie +30 %

/* ---------- Maison ---------- */
function aptMaisonParNiveau(){ return 5 + (_apt("to3") ? 1 : 0); }                                                // Réserves d'hiver +1/niveau

/* ---------- Boutique mobile ---------- */
function aptBoutiquePartout(){ return _apt("no1"); }
function aptBoutiqueSurcout(prix){ return Math.round(prix * 1.1); }                                               // +10 % hors zone

/* ===========================================================
   LOT 2 — Structures & atelier.
   =========================================================== */

/* ---------- Structures (terrain) ---------- */
function aptMineReserve(base){ let m = 1; if(_apt("pr1")) m *= 1.5; if(_apt("ro1")) m *= 1.3; return Math.round(base * m); } // Filon profond +50 % · Réparateur +30 %
function aptCoutStructure(prix){ return Math.round(prix * (_apt("ro2") ? 0.75 : 1)); }                             // Chantier −25 %
function aptRecyclageTaux(){ return _apt("ro3") ? 0.5 : 0; }                                                       // Recyclage : 50 % remboursé
function aptStructureLot(n){ return Math.round(n * (_apt("ro4") ? 1.5 : 1)); }                                     // Surrégime +50 % (mine, bio-dôme, enclos)
function aptBiodomeRecolte(){ const b=_apt("cu2") ? { min:7, max:11 } : { min:5, max:9 }; const m=_boi("recolte");
  return { min:Math.max(1,Math.round(b.min*m)), max:Math.max(1,Math.round(b.max*m)) }; }                            // Verger · boisson
function aptCroissance(base){ return Math.round(base * (_apt("pr2") ? 1.25 : 1)); }                                 // Cultures vivaces : +25 % croissance
function aptTonteBonus(){ const m=_boi("recolte"); return (_apt("pr2") ? 1 : 0) + (m>1 ? Math.round((m-1)*4) : (m<1 ? -1 : 0)); }                                                            // Cultures vivaces : +1 produit à la tonte

/* ---------- Atelier (fabrication) ---------- */
function aptFabSkip(){ return _apt("ar1"); }             // Récup d'atelier : 20 % de ne pas consommer l'ingrédient le moins coûteux
function aptFabSerie(){ return _apt("ar2"); }            // Production en série : 10 % de sortir 2 objets
function aptFabPoints(){ return _apt("ar3") ? 1 : 0; }   // Apprentissage : +1 point de formation
function aptFabMaitre(){ return _apt("ar4"); }           // Maître-artisan : −1 matière première sur le plus gros lot
