/* PRIX_ITEM — valeurs de marché {min, moy, max} par objet.
   Calculées : matières de base (rareté) × marge 1 + forfait travail 8.
   Commission de mise en vente = 10 % du min (5 % avec l'aptitude Marchand), prélevée À LA MISE EN VENTE. */
const PRIX_ITEM = {
  cendrite: { min:3, moy:4, max:7 }, // Cendrite
  voltane: { min:4, moy:6, max:11 }, // Voltane
  silite: { min:5, moy:7, max:13 }, // Silite
  givrite: { min:10, moy:14, max:25 }, // Givrite
  cristal: { min:31, moy:45, max:81 }, // Cristal de Nyx
  sylve: { min:4, moy:5, max:9 }, // Sylve
  sporelle: { min:3, moy:4, max:7 }, // Sporelle
  nectine: { min:4, moy:5, max:9 }, // Nectine
  ferragave: { min:3, moy:4, max:7 }, // Ferragave
  filaine: { min:5, moy:7, max:13 }, // Filaine
  cuir: { min:8, moy:12, max:22 }, // Cuir
  biofibre: { min:7, moy:10, max:18 }, // Biofibre
  proteines: { min:8, moy:11, max:20 }, // Protéines
  o2: { min:28, moy:40, max:72 }, // Recharge O₂
  kit: { min:56, moy:80, max:144 }, // Kit médical
  ration: { min:42, moy:60, max:108 }, // Ration chaude
  fab_lingot_de_cendrite: { min:17, moy:24, max:43 }, // Lingot de Cendrite
  fab_couteau_de_survie: { min:39, moy:56, max:101 }, // Couteau de survie
  fab_munitions_cinetiques: { min:31, moy:44, max:79 }, // Munitions cinétiques ×10
  fab_lingot_de_givrite: { min:35, moy:50, max:90 }, // Lingot de Givrite
  fab_lingot_de_voltane: { min:22, moy:32, max:58 }, // Lingot de Voltane
  fab_composant_simple: { min:50, moy:72, max:130 }, // Composant simple
  fab_circuit_imprime: { min:106, moy:152, max:274 }, // Circuit imprimé
  fab_composant_avance: { min:252, moy:360, max:648 }, // Composant avancé
  fab_noyau_de_calcul: { min:648, moy:925, max:1665 }, // Noyau de calcul
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
  fab_biocarburant_raffine: { min:398, moy:568, max:1022 }, // Biocarburant raffiné
  fab_implant_de_force: { min:360, moy:514, max:925 }, // Implant de force
  fab_implant_d_agilite: { min:364, moy:520, max:936 }, // Implant d'agilité
  fab_implant_maitre: { min:468, moy:669, max:1204 }, // Implant maitre
  fab_lingot_de_silite: { min:20, moy:29, max:52 }, // Lingot de Silite
  fab_plaque_de_coque: { min:62, moy:89, max:160 }, // Plaque de coque
  fab_reservoir: { min:116, moy:166, max:299 }, // Réservoir
  fab_cellule_d_energie: { min:64, moy:92, max:166 }, // Cellule d'énergie
  fab_propulseur_d_appoint: { min:175, moy:250, max:450 }, // Propulseur d'appoint
  fab_cockpit_leger: { min:363, moy:519, max:934 }, // Cockpit léger
  fab_casque_leger: { min:67, moy:95, max:171 }, // Casque léger
  fab_plastron_leger: { min:100, moy:143, max:257 }, // Plastron léger
  fab_jambieres_legeres: { min:67, moy:95, max:171 }, // Jambières légères
  fab_munitions_a_plasma: { min:39, moy:55, max:99 }, // Munitions à plasma ×10
  fab_pistolet_a_plasma: { min:107, moy:153, max:275 }, // Pistolet à plasma
  fab_munitions_a_ions: { min:96, moy:137, max:247 }, // Munitions à ions ×10
  fab_fusil_a_ions: { min:462, moy:660, max:1188 }, // Fusil à ions
  fab_casque_lourd: { min:169, moy:242, max:436 }, // Casque lourd
  fab_jambieres_lourdes: { min:263, moy:376, max:677 }, // Jambières lourdes
  fab_cablage: { min:48, moy:69, max:124 }, // Câblage
  fab_panneau_renforce: { min:55, moy:78, max:140 }, // Panneau renforcé
  fab_servomoteur: { min:171, moy:244, max:439 }, // Servomoteur
  fab_panneau_composite: { min:137, moy:196, max:353 }, // Panneau composite
  fab_ordinateur_de_hacking: { min:925, moy:1322, max:2380 }, // Ordinateur de hacking
  fab_supraconducteur: { min:431, moy:616, max:1109 }, // Supraconducteur
  fab_ia_d_assistance: { min:1763, moy:2519, max:4534 }, // IA d'assistance
  fab_drone_de_recolte: { min:2022, moy:2889, max:5200 }, // Drone de récolte
  fab_drone_d_elevage: { min:2289, moy:3270, max:5886 }, // Drone d'élevage
  fab_drone_recuperateur: { min:2948, moy:4211, max:7580 }, // Drone récupérateur
  fab_drone_de_combat: { min:2551, moy:3644, max:6559 }, // Drone de combat
  fab_tank_a_oxygene: { min:193, moy:276, max:497 }, // Tank à oxygène
  fab_combinaison_pressurisee: { min:357, moy:510, max:918 }, // Combinaison pressurisée
  fab_moteur_basique: { min:183, moy:261, max:470 }, // Moteur basique
  fab_navette_legere: { min:967, moy:1382, max:2488 }, // Navette légère
  fab_bloc_de_propulsion: { min:760, moy:1085, max:1953 }, // Bloc de propulsion
  fab_soute_cargo: { min:247, moy:353, max:635 }, // Soute cargo
  fab_vaisseau_cargo: { min:1745, moy:2493, max:4487 }, // Vaisseau Cargo
  fab_coque_blindee: { min:330, moy:471, max:848 }, // Coque blindée
  fab_cockpit_blinde: { min:2463, moy:3519, max:6334 }, // Cockpit blindé
  fab_moteur_a_distorsion: { min:325, moy:464, max:835 }, // Moteur à distorsion
  fab_pistolet_cinetique: { min:155, moy:221, max:398 }, // Pistolet cinétique
  fab_lame_a_plasma: { min:91, moy:130, max:234 }, // Lame à plasma
  fab_tourelle_de_vaisseau: { min:926, moy:1323, max:2381 }, // Tourelle de vaisseau
  fab_plastron_lourd: { min:522, moy:746, max:1343 }, // Plastron lourd
  fab_lame_a_singularite: { min:347, moy:495, max:891 }, // Lame à singularité
  fab_canon_a_singularite: { min:676, moy:965, max:1737 }, // Canon à singularité
  fab_vaisseau_maitre: { min:4803, moy:6862, max:12352 }, // Vaisseau maitre
};
