/* ===========================================================
   APTITUDES-EFFETS — Effets passifs des aptitudes (LOT 1 : boucle d'action).
   Fonctions pures : elles lisent les nœuds pris (aptPris) et renvoient une
   valeur modifiée. Tout l'équilibrage des aptitudes vit ICI, à un seul endroit ;
   les fichiers de jeu ne portent que des hooks d'une ligne.

   Lot 2 (à venir) : structures & atelier — Filon profond, Réparateur, Chantier,
   Recyclage, Surrégime, Verger, Cultures vivaces, et les 4 nœuds Artisan.
   Effets dormants (non branchés) : zones chaudes/froides (Ignis, Toundra),
   PvP (Intrusion), marché des joueurs (Marchand), équipement (Cœur de forge),
   Protocole (Fléau du Protocole).
   =========================================================== */

function _apt(id){ return typeof aptPris === "function" && aptPris(id); }

/* ---------- Sac ---------- */
function capaciteSac(){ return SAC_MAX + (_apt("pr4") ? 15 : 0); }              // Sac renforcé +15

/* ---------- Énergie ---------- */
function aptEnergieAction(cout){ return Math.max(1, Math.round(cout * (_apt("sv4") ? 0.85 : 1))); }                                  // Endurance −15 %
function aptEnergieExplore(cout){ return Math.max(1, Math.round(cout * (_apt("sv4") ? 0.85 : 1) * (_apt("om2") ? 0.9 : 1))); }        // Endurance + Repérage
function aptEnergieDeplacement(cout){ let m = 1; if(_apt("om3")) m *= 0.8; if(_apt("no4")) m *= 0.8; return Math.max(1, Math.round(cout * m)); } // Pas léger + Voyageur (multiplicatif)
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
  if(_apt("cu3")) etat.jauges.o2 = Math.min(100, etat.jauges.o2 + h * 2);        // Photosynthèse +2 O₂/h
  if(_apt("cu4")){                                                               // Organisme : +1 santé/moral/h, plafond 60
    etat.jauges.sante = Math.max(etat.jauges.sante, Math.min(60, etat.jauges.sante + h));
    etat.jauges.moral = Math.max(etat.jauges.moral, Math.min(60, etat.jauges.moral + h));
  }
}

/* ---------- Crédits ---------- */
function aptCredits(g){ return Math.round(g * (_apt("no3") ? 1.15 : 1)); }                                        // Négociant +15 %
function aptButinExplore(g){ return Math.round(g * (_apt("no3") ? 1.15 : 1) * (_apt("om2") ? 1.25 : 1)); }        // + Repérage +25 %
function aptButinCombat(g){ let m = (_apt("no3") ? 1.15 : 1); if(_apt("tr3")) m *= 1.25; if(_apt("ig4")) m *= 1.10; return Math.round(g * m); } // Négociant + Pillage + Cœur de forge

/* ---------- Combat ---------- */
function aptCombatFcReduc(){ return (_apt("tr1") ? 2 : 0) + (_apt("ig3") ? 2 : 0); }                              // Instinct + Combustion (↑ chance)
function aptCombatDegats(d){ let m = 1; if(_apt("tr2")) m *= 0.7; if(_apt("to2")) m *= 0.9; if(_apt("sv3")) m *= 0.75; return Math.max(1, Math.round(d * m)); } // Cuirasse + Trempe + Métabolisme
function aptSeuilCreature(){ return _apt("om1") ? 0.90 : 0.80; }                                                  // Discrétion : moins de rencontres

/* ---------- Minerai / rareté ---------- */
function aptBonusRare(base){ return base + (_apt("pr3") ? 8 : 0); }                                               // Œil du mineur

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
function aptBiodomeRecolte(){ return _apt("cu2") ? { min:7, max:11 } : { min:5, max:9 }; }                          // Verger
function aptCroissance(base){ return Math.round(base * (_apt("pr2") ? 1.25 : 1)); }                                 // Cultures vivaces : +25 % croissance
function aptTonteBonus(){ return _apt("pr2") ? 1 : 0; }                                                            // Cultures vivaces : +1 produit à la tonte

/* ---------- Atelier (fabrication) ---------- */
function aptFabSkip(){ return _apt("ar1"); }             // Récup d'atelier : 20 % de ne pas consommer l'ingrédient le moins coûteux
function aptFabSerie(){ return _apt("ar2"); }            // Production en série : 10 % de sortir 2 objets
function aptFabPoints(){ return _apt("ar3") ? 1 : 0; }   // Apprentissage : +1 point de formation
function aptFabMaitre(){ return _apt("ar4"); }           // Maître-artisan : −1 matière première sur le plus gros lot
