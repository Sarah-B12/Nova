#!/usr/bin/env node
/* ===========================================================
   o_v344.js — v3.44 (v332, la vérification des missions, 28/11/2026).
   Chaque refus que le serveur peut renvoyer pour un geste de mission (après v332) a-t-il un texte dans le jeu ?
   Relevé fait dans les définitions du serveur (CSV du 28/11 + v332_missions.sql) ; à refaire si une fonction change.
   Usage : node outils/o_v344.js     (depuis le dossier du jeu)
   =========================================================== */
const fs = require("fs"), path = require("path");
const racine = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(racine, "js/missions.js"), "utf8");
const debut = src.indexOf("const MISSION_ERREURS = {"), fin = src.indexOf("let _missions = null;");
if(debut < 0 || fin < 0){ console.log("✗ MISSION_ERREURS introuvable dans js/missions.js"); process.exit(1); }
const bloc = src.slice(debut, fin).replace("const MISSION_ERREURS =", "var MISSION_ERREURS =").replace("const MISSION_ERREURS_FN =", "var MISSION_ERREURS_FN =");
eval(bloc);
// Refus traités à part par le jeu (texte construit par _missionAppel ou par l'écran du jeu).
const A_PART = { trop_peu:1, demain:1, postes:1, postes_vides:1, verrouille:1 };
const REFUS = {
 "mission_groupe_creer": [
  "deja",
  "faction",
  "intrusion",
  "mission",
  "mort",
  "niveau",
  "pause",
  "recrutement_clos",
  "secrete"
 ],
 "mission_rejoindre": [
  "deja",
  "faction",
  "ferme",
  "groupe",
  "intrusion",
  "mort",
  "niveau",
  "non_connecte",
  "parti",
  "pause",
  "plein",
  "profil",
  "recrutement_clos",
  "test",
  "type"
 ],
 "mission_inviter": [
  "ambigu",
    "cible_faction",
  "cible_intrusion",
  "cible_mort",
  "cible_niveau",
  "cible_pause",
  "cible_profil",
  "cible_type",
  "deja",
  "deja_invite",
  "inconnu",
  "parti",
  "pas_fondateur",
  "plein",
  "recrutement_clos",
  "soi_meme",
  "test"
 ],
 "mission_invitation_repondre": [
  "deja",
  "faction",
  "ferme",
  "groupe",
  "intrusion",
  "invitation",
  "mort",
  "niveau",
  "parti",
  "pause",
  "plein",
  "recrutement_clos",
  "test"
 ],
 "mission_lancer": [
  "parti",
  "pas_fondateur",
  "postes_vides",
  "recrutement_clos",
  "trop_peu"
 ],
 "mission_quitter": [
  "fini",
  "pas_membre"
 ],
 "mission_poste_choisir": [
  "fini",
  "mort",
  "non_connecte",
  "pas_membre",
  "pause",
  "poste",
  "poste_fige",
  "poste_pris",
  "prison"
 ],
 "mission_deposer": [
  "complet",
  "fini",
  "hors_liste",
  "manque",
  "mort",
  "non_connecte",
  "objet_lie",
  "pas_membre",
  "pas_parti",
  "pause",
  "prison",
  "quantite",
  "scelle"
 ],
 "mission_deposer_unites": [
  "complet",
  "hors_liste",
  "manque",
  "mort",
  "non_connecte",
  "pause",
  "prison",
  "quantite"
 ],
 "mission_gain_recuperer": [
  "gain",
  "mort",
  "non_connecte",
  "pause",
  "perdu",
  "prison",
  "sac_plein"
 ],
 "mission_essai": [
  "energie",
  "manque",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pause",
  "prison"
 ],
 "balise_descendre": [
  "demain",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "postes",
  "prison"
 ],
 "balise_noeud": [
  "deja_fait",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "poste",
  "prison"
 ],
 "balise_crevasse": [
  "deja_fait",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "perdu",
  "phase",
  "poste",
  "prison"
 ],
 "balise_message": [
  "deja_fait",
  "faux",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "poste",
  "prison"
 ],
 "balise_tourelle": [
  "deja_reussie",
  "demain",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "plus_de_tentative",
  "postes_pas_faits",
  "prison",
  "trop_tard"
 ],
 "bouture_faire_fuir": [
  "deja_reussie",
  "demain",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "plus_de_tentative",
  "prison",
  "trop_tard"
 ],
 "bouture_soigner": [
  "caillou",
  "deja_soigne",
  "energie",
  "manque",
  "mort",
  "non_connecte",
  "pas_de_soin",
  "pas_en_cours",
  "pas_relie",
  "pas_sur_place",
  "pause",
  "pieces",
  "prison",
  "trop"
 ],
 "infiltration_breche": [
  "minimum",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "poste",
  "prison"
 ],
 "infiltration_ranger": [
  "deja_fait",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "pieces",
  "poste",
  "prison"
 ],
 "infiltration_sentinelles": [
  "deja_reussie",
  "demain",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "plus_de_tentative",
  "prison",
  "trop_tard"
 ],
 "casse_cible": [
  "cible_figee",
  "cite",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_fondateur",
  "pause",
  "phase",
  "prison"
 ],
 "casse_ronde": [
  "deja_fait",
  "faux",
  "mort",
  "non_connecte",
  "pas_de_cible",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "prison"
 ],
 "casse_commencer": [
  "demain",
  "equipe",
  "minimum",
  "mort",
  "non_connecte",
  "pas_de_reperage",
  "pas_en_cours",
  "pas_fondateur",
  "pause",
  "phase",
  "postes",
  "prison"
 ],
 "casse_poste": [
  "deja_fait",
  "evente",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pause",
  "phase",
  "poste",
  "prison"
 ],
 "casse_vider": [
  "deja_reussie",
  "demain",
  "evente",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pause",
  "phase",
  "plus_de_tentative",
  "postes_pas_faits",
  "prison",
  "trop_tard"
 ],
 "satellite_signaler": [
  "deja_fait",
  "demain",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "postes",
  "prison"
 ],
 "satellite_tir": [
  "deja_fait",
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "poste",
  "prison"
 ],
 "satellite_escorte": [
  "deja_reussie",
  "demain",
  "minimum",
  "mort",
  "non_connecte",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "plus_de_tentative",
  "postes_pas_faits",
  "prison",
  "trop_tard"
 ],
 "satellite_sas": [
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "pieces",
  "poste",
  "prison",
  "verrouille"
 ],
 "satellite_coeur": [
  "mort",
  "non_connecte",
  "pas_de_partie",
  "pas_en_cours",
  "pas_sur_place",
  "pause",
  "phase",
  "poste",
  "prison"
 ],
 "caisse_ouvrir": [
  "energie",
  "loin",
  "manque",
  "mort",
  "non_connecte",
  "objet",
  "pause",
  "prison",
  "sac_plein"
 ]
};
let manques = 0, total = 0;
for(const [fn, liste] of Object.entries(REFUS)){
  for(const err of liste){
    total++;
    if(A_PART[err]) continue;
    if(!_mErreurTexte(fn, err)){ manques++; console.log(`  ✗ ${fn} : « ${err} » sans texte`); }
  }
}
// Les textes qui dépendent du geste.
const attendus = [["balise_crevasse","perdu",/noir/],["mission_gain_recuperer","perdu",/Trop tard/],["balise_tourelle","pas_sur_place",/balise/],
  ["casse_ronde","pas_sur_place",/casse/],["satellite_tir","pas_sur_place",/Bardane/],["bouture_soigner","pas_sur_place",/Mousseron/],
  ["infiltration_ranger","pas_sur_place",/entrepôt/]];
for(const [fn, err, re] of attendus){ total++; if(!re.test(_mErreurTexte(fn, err) || "")){ manques++; console.log(`  ✗ ${fn} : « ${err} » → ${_mErreurTexte(fn, err)}`); } }
console.log(manques ? `${manques} refus sans le bon texte (sur ${total}).` : `✓ ${total} refus : tous ont leur texte.`);
process.exit(manques ? 1 : 0);
