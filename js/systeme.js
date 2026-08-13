/* ===========================================================
   SYSTEME — Systèmes de fond : énergie (régénération), journal d'événements, expérience et niveaux.
   =========================================================== */

/* ---------- Énergie ---------- */
// Coût en % par action (se déplacer en vaisseau coûtera peu ; miner beaucoup).
const ACTION_COUT = { miner:12, explorer:10, combattre:8, reposer:0 };
// Régénération : +10 %/heure. Recalculée en continu, y compris hors ligne.
function regenEnergie(){
  const now = Date.now();
  const heures = (now - etat.energieMaj) / 3600000;
  if (heures > 0) { etat.energie = Math.min(100, etat.energie + heures * (10 + aptRegenEnergie())); etat.energieMaj = now; }
}
// Dépense l'énergie d'une action ; refuse (et prévient) si insuffisant.
function depenserEnergie(cout){
  regenEnergie();
  if (etat.energie < cout) { journal("Pas assez d'énergie. Attends (+10 %/h) ou monte de niveau.", "alerte"); return false; }
  etat.energie -= cout; return true;
}
function journal(t, type=""){ const z=document.querySelector("#journal"); const l=document.createElement("div"); l.className="msg "+type; l.textContent=t; z.prepend(l); while(z.children.length>14) z.removeChild(z.lastChild); }

/* ---------- Niveaux ---------- */
function seuilXp(n){ return 20*n; }
function gagnerXp(n){
  etat.xp += n;
  while (etat.xp >= seuilXp(etat.niveau)) { etat.xp -= seuilXp(etat.niveau); etat.niveau++; etat.pointsCompetence += PTS_PAR_NIVEAU; etat.energie = 100; etat.energieMaj = Date.now(); journal(`Niveau ${etat.niveau} atteint ! +${PTS_PAR_NIVEAU} points, énergie pleine.`,"gain"); }
}

