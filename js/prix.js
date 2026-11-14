/* PRIX_ITEM — valeurs de marché {min, moy, max} par objet.
   Calculées : matières de base (rareté) × marge 1 + forfait travail 8.
   ⚠ v2.79 (K245, K247) — les cristaux COMPTENT désormais dans les objets qui les contiennent : Nyx 800,
   Sélénite 2 000 (prix moyens). Avant, la Sélénite y comptait pour 0 ₡ (un maître à 24 095 ₡ contenait
   pour 67 500 ₡ de cristaux). Règle complète, et recalcul : `node outils/o_economie.js . --prix`.
   v2.81 (K253) — l'IA d'assistance coûte 1 Noyau, 1 Nyx, 1 Supraconducteur (au lieu de 2 Noyaux, 1 Nyx,
   2 Sélénite, 1 Supraconducteur) : l'IA, les 4 drones, le cockpit blindé et le maître baissent.
   v2.82 (K254) — recettes des vaisseaux : Bloc de propulsion + 1 Nyx ; Cargo sans Moteur basique ; Cockpit blindé
   sans Sélénite ; Maître = 1 Cockpit blindé, 1 Moteur à distorsion, 1 Tourelle, 2 Nyx (3 Sél + 5 Nyx contenus).
   v2.83 (K255) — Biocarburant raffiné = 2 Biocarburant, 1 Cellule d'énergie (au lieu du Composant avancé) : 568 → 300 ₡
   le bidon de 60 L, soit 5 ₡ le litre comme le Biocarburant. Le comptoir (Perchoir, Nid : 1 400 ₡) ne change pas.
   v2.84 (K256) — Cockpit blindé : 1 Coque blindée au lieu de 2 ; les trois implants : 1 Sélénite au lieu de 2.
   v2.85 (K258) — Fabricant d'armes : Lame et Pistolet à plasma + 1 Nyx, Fusil à ions + 2 Nyx, Tourelle + 1 Sélénite
   (le Drone de combat et le Vaisseau maître, qui les contiennent, suivent).
   Commission de mise en vente = 10 % du min (5 % avec l'aptitude Marchand), prélevée À LA MISE EN VENTE. */
const PRIX_ITEM = {
  cendrite: { min:3, moy:4, max:7 }, // Cendrite
  voltane: { min:4, moy:6, max:11 }, // Voltane
  silite: { min:5, moy:7, max:13 }, // Silite
  givrite: { min:10, moy:14, max:25 }, // Givrite
  cristal: { min:400, moy:800, max:1280 }, // Cristal de Nyx
  /* v1.11 — Cristal de Sélénite : la matière la PLUS RARE du jeu, devant le
     Cristal de Nyx (v2.79, K247 : 400/800/1280 ; Sélénite 1000/2000/3200 — au lieu de 1000/2500/4000
     et 2200/5000/8000). Son gisement, à Triptolème, ne donnera
     rien la plupart du temps — comme Le Gravier, mais plus dur. Il verrouille
     TREIZE objets de fin de formation, dont le Supraconducteur, donc son prix
     tire toute la fin de l'arbre : le doubler par rapport au Nyx, c'est dire
     au marché que ces objets-là sont des pièces d'orfèvre. */
  selenite: { min:1000, moy:2000, max:3200 },
  /* ⚠ v0.91 — Kit de réparation. Il ne se VEND qu'au comptoir du Perchoir, à
     450 ₡ (v2.79 : 150 ₡, voir plus bas). Le marché encadrant les prix (min/max), un plafond à 330 ₡ rend
     l'aller-retour marchand DÉFINITIVEMENT non rentable : acheter en haut pour
     revendre au sol perd au moins 120 ₡ par kit.
     Il reste échangeable entre joueurs — celui qui redescend avec un kit
     inutilisé peut le céder à celui qui monte, moins cher que le comptoir. Et
     le bradage à 60 ₡ (la moitié du min) permet de faire de la place sans en
     faire une source de revenus. */
  /* v2.79 (K246) — le kit passe à 150 ₡ au comptoir (Perchoir ET Nid) : le marché reste en dessous
     (plafond 140). K250 — le Kit de réparation lourd (150 PV, vendu au Nid SEUL, 560 ₡) : même prix
     au PV ; marché sous le comptoir (plafond 520). */
  kit_reparation: { min:70, moy:100, max:140 }, // Kit de réparation
  kit_reparation_lourd: { min:263, moy:375, max:520 }, // Kit de réparation lourd
  sylve: { min:4, moy:5, max:9 }, // Sylve
  sporelle: { min:3, moy:4, max:7 }, // Sporelle
  nectine: { min:4, moy:5, max:9 }, // Nectine
  ferragave: { min:3, moy:4, max:7 }, // Ferragave
  filaine: { min:5, moy:7, max:13 }, // Filaine
  cuir: { min:8, moy:12, max:22 }, // Cuir
  biofibre: { min:7, moy:10, max:18 }, // Biofibre
  proteines: { min:8, moy:11, max:20 }, // Protéines
  fab_lingot_de_cendrite: { min:17, moy:24, max:43 }, // Lingot de Cendrite
  fab_couteau_de_survie: { min:39, moy:56, max:101 }, // Couteau de survie
  fab_munitions_cinetiques: { min:31, moy:44, max:79 }, // Munitions cinétiques ×10
  fab_lingot_de_givrite: { min:35, moy:50, max:90 }, // Lingot de Givrite
  fab_lingot_de_voltane: { min:22, moy:32, max:58 }, // Lingot de Voltane
  fab_composant_simple: { min:50, moy:72, max:130 }, // Composant simple
  fab_circuit_imprime: { min:106, moy:152, max:274 }, // Circuit imprimé
  fab_composant_avance: { min:252, moy:360, max:648 }, // Composant avancé
  fab_noyau_de_calcul: { min:1176, moy:1680, max:3024 }, // Noyau de calcul
  fab_fil: { min:20, moy:29, max:52 }, // Fil
  fab_panneau_de_sylve: { min:16, moy:23, max:41 }, // Panneau de Sylve
  fab_biogel: { min:16, moy:23, max:41 }, // Biogel
  fab_ration_chaude: { min:29, moy:42, max:76 }, // Ration chaude
  fab_recharge_d_oxygene: { min:74, moy:105, max:189 }, // Recharge d'oxygène
  fab_kit_de_soin: { min:97, moy:139, max:250 }, // Kit de soin
  fab_biocarburant: { min:70, moy:100, max:180 }, // Biocarburant
  fab_stimulant: { min:46, moy:65, max:117 }, // Stimulant
  fab_antidote: { min:41, moy:59, max:106 }, // Antidote
  fab_boite_de_soin: { min:230, moy:328, max:590 }, // Boîte de soin
  fab_biofil_renforce: { min:94, moy:134, max:241 }, // Biofil renforcé
  fab_biocarburant_raffine: { min:210, moy:300, max:540 }, // Biocarburant raffiné
  fab_implant_de_force: { min:2288, moy:3269, max:5884 }, // Implant de force
  fab_implant_d_agilite: { min:2293, moy:3275, max:5895 }, // Implant d'agilité
  fab_implant_maitre: { min:3454, moy:4934, max:8881 }, // Implant maitre
  fab_lingot_de_silite: { min:20, moy:29, max:52 }, // Lingot de Silite
  fab_plaque_de_coque: { min:62, moy:89, max:160 }, // Plaque de coque
  fab_reservoir: { min:116, moy:166, max:299 }, // Réservoir
  fab_cellule_d_energie: { min:64, moy:92, max:166 }, // Cellule d'énergie
  fab_propulseur_d_appoint: { min:175, moy:250, max:450 }, // Propulseur d'appoint
  fab_cockpit_leger: { min:397, moy:567, max:1021 }, // Cockpit léger
  fab_casque_leger: { min:67, moy:95, max:171 }, // Casque léger
  fab_plastron_leger: { min:100, moy:143, max:257 }, // Plastron léger
  fab_jambieres_legeres: { min:67, moy:95, max:171 }, // Jambières légères
  fab_munitions_a_plasma: { min:39, moy:55, max:99 }, // Munitions à plasma ×10
  fab_pistolet_a_plasma: { min:667, moy:953, max:1715 }, // Pistolet à plasma
  fab_munitions_a_ions: { min:96, moy:137, max:247 }, // Munitions à ions ×10
  fab_fusil_a_ions: { min:1582, moy:2260, max:4068 }, // Fusil à ions
  fab_casque_lourd: { min:1569, moy:2242, max:4036 }, // Casque lourd
  fab_jambieres_lourdes: { min:1663, moy:2376, max:4277 }, // Jambières lourdes
  fab_cablage: { min:48, moy:69, max:124 }, // Câblage
  fab_panneau_renforce: { min:55, moy:78, max:140 }, // Panneau renforcé
  fab_servomoteur: { min:171, moy:244, max:439 }, // Servomoteur
  fab_panneau_composite: { min:137, moy:196, max:353 }, // Panneau composite
  fab_ordinateur_de_hacking: { min:1454, moy:2077, max:3739 }, // Ordinateur de hacking
  fab_supraconducteur: { min:1831, moy:2616, max:4709 }, // Supraconducteur
  fab_ia_d_assistance: { min:3573, moy:5104, max:9187 }, // IA d'assistance
  fab_drone_de_recolte: { min:3832, moy:5474, max:9853 }, // Drone de récolte
  fab_drone_d_elevage: { min:4099, moy:5855, max:10539 }, // Drone d'élevage
  fab_drone_recuperateur: { min:4757, moy:6796, max:12233 }, // Drone récupérateur
  fab_drone_de_combat: { min:4920, moy:7029, max:12652 }, // Drone de combat
  fab_tank_a_oxygene: { min:193, moy:276, max:497 }, // Tank à oxygène
  fab_combinaison_pressurisee: { min:357, moy:510, max:918 }, // Combinaison pressurisée
  fab_moteur_basique: { min:183, moy:261, max:470 }, // Moteur basique
  fab_navette_legere: { min:1001, moy:1430, max:2574 }, // Navette légère
  fab_bloc_de_propulsion: { min:1320, moy:1885, max:3393 }, // Bloc de propulsion
  fab_soute_cargo: { min:247, moy:353, max:635 }, // Soute cargo
  fab_vaisseau_cargo: { min:2156, moy:3080, max:5544 }, // Vaisseau Cargo
  fab_coque_blindee: { min:1730, moy:2471, max:4448 }, // Coque blindée
  fab_cockpit_blinde: { min:5377, moy:7681, max:13826 }, // Cockpit blindé
  fab_moteur_a_distorsion: { min:853, moy:1219, max:2194 }, // Moteur à distorsion
  fab_pistolet_cinetique: { min:155, moy:221, max:398 }, // Pistolet cinétique
  fab_lame_a_plasma: { min:651, moy:930, max:1674 }, // Lame à plasma
  fab_tourelle_de_vaisseau: { min:3446, moy:4923, max:8861 }, // Tourelle de vaisseau
  fab_plastron_lourd: { min:1922, moy:2746, max:4943 }, // Plastron lourd
  fab_lame_a_singularite: { min:2275, moy:3250, max:5850 }, // Lame à singularité
  fab_canon_a_singularite: { min:5061, moy:7230, max:13014 }, // Canon à singularité
  fab_vaisseau_maitre: { min:10802, moy:15431, max:27776 }, // Vaisseau maitre
};
