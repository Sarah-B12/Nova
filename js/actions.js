/* ===========================================================
   ACTIONS — Actions du joueur : miner, explorer, combattre, acheter, utiliser, améliorer.
   =========================================================== */
/* ---------- Actions ---------- */
function miner(){
  if(enZoneFaction()){ journal("Impossible en zone de faction — va en zone sauvage.","alerte"); return; }
  if(!depenserEnergie(aptEnergieAction(ACTION_COUT.miner)))return;
  const g=aptCredits(alea(8,16)+bonusCredits()); etat.credits+=g;
  const l=lieuActuel(); const spot = !!(l && l.type==="mine");
  const nb = alea(1,3) + (spot?2:0);
  const mid = tirerMatiere(aptBonusRare(spot?14:0));
  const pris = ajouterAuSac(mid, nb);
  etat.jauges.o2=borne(etat.jauges.o2-coutO2(6)); etat.jauges.moral=borne(etat.jauges.moral-3); gagnerXp(6);
  const nm=item(mid).nom;
  journal(`Minerai extrait : +${g} ₡${pris?`, +${pris} ${nm}`:""}${spot?" (filon riche)":""}.`+(pris<nb?" (sac plein)":""),"gain"); apresAction();
}
function reposer(){
  if(!enZoneFaction()){ journal("Repos possible seulement en zone de faction.","alerte"); return; }
  if(memeJour(etat.reposLe)){ journal("Tu t'es déjà reposé aujourd'hui.","alerte"); return; }
  if(etat.jauges.sante>=70 && etat.jauges.moral>=70){ journal("Déjà en forme — le repos ne dépasse pas 70 (achète un kit/ration pour aller plus haut).","alerte"); return; }
  etat.reposLe = Date.now();
  etat.jauges.sante = Math.max(etat.jauges.sante, Math.min(70, etat.jauges.sante + 20));
  etat.jauges.moral = Math.max(etat.jauges.moral, Math.min(70, etat.jauges.moral + 20));
  journal("Repos à l'abri : +20 santé/moral (plafond 70).","gain"); apresAction();
}
function explorer(){
  if(enZoneFaction()){ journal("Exploration impossible en zone de faction.","alerte"); return; }
  if(!depenserEnergie(aptEnergieExplore(ACTION_COUT.explorer)))return;
  etat.jauges.o2=borne(etat.jauges.o2-aptO2Explore(coutO2(8))); gagnerXp(5);
  const d=Math.random(); const seuilCreature=aptSeuilCreature();
  if(d<0.55){ const g=aptButinExplore(alea(10,25)+bonusCredits()); etat.credits+=g; journal(`Cache trouvée : +${g} ₡.`,"gain"); apresAction(); }
  else if(d<seuilCreature){ const g=aptButinExplore(alea(4,10)+bonusCredits()); etat.credits+=g; const mid=tirerMatiere(); const v=alea(1,2); const pris=ajouterAuSac(mid,v); const nm=item(mid).nom; journal(`Ferraille récupérée : +${g} ₡${pris?`, +${pris} ${nm}`:""}.`+(pris<v?" (sac plein)":""),"gain"); apresAction(); }
  else { journal("Une créature surgit d'une épave…","alerte"); resoudreCombat(false); }
}
function resoudreCombat(bonus){
  const fc=Math.max(1, alea(6,14) - aptCombatFcReduc()); const chance=etat.competences.force/(etat.competences.force+fc);
  if(Math.random()<chance){ const g=aptButinCombat(alea(12,28)+bonusCredits()+(bonus?alea(6,14):0)); etat.credits+=g; gagnerXp(bonus?12:9); journal(`Créature abattue : +${g} ₡${bonus?" (terrain de chasse)":""}.`,"gain"); }
  else { let ps=Math.max(4,fc-Math.floor(etat.competences.force/2)); let pm=Math.max(2,Math.floor(ps/2)); ps=aptCombatDegats(ps); pm=aptCombatDegats(pm); etat.jauges.sante=borne(etat.jauges.sante-ps); etat.jauges.moral=borne(etat.jauges.moral-pm); gagnerXp(4); journal(`La créature a pris le dessus : −${ps} santé, −${pm} moral.`,"alerte"); }
  apresAction();
}
function combattre(){ if(enZoneFaction()){ journal("La chasse se fait en zone sauvage.","alerte"); return; } if(!depenserEnergie(aptEnergieAction(ACTION_COUT.combattre)))return; etat.jauges.o2=borne(etat.jauges.o2-coutO2(4)); const l=lieuActuel(); resoudreCombat(!!(l && l.type==="chasse")); }
function acheter(art){
  const dehors = !enZoneFaction();
  if(dehors && !aptBoutiquePartout()){ journal("Boutique accessible en zone de faction.","alerte"); return; }
  const prix = dehors ? aptBoutiqueSurcout(art.prix) : art.prix;
  if(etat.credits<prix)return;
  if(placesLibres()<=0){journal("Sac plein.","alerte");return;}
  etat.credits-=prix; ajouterAuSac(art.id,1);
  journal(`${art.nom} acheté (−${prix} ₡)${dehors?" (boutique mobile)":""}. Rangé dans le sac.`); apresAction();
}
function utiliser(art){ if(!etat.sac[art.id])return; retirerDuSac(art.id,1); const soin=aptSoin(art.soin); etat.jauges[art.jauge]=borne(etat.jauges[art.jauge]+soin); journal(`${art.nom} utilisé : +${soin} ${art.jauge}.`,"gain"); apresAction(); }
function ameliorer(cle){ if(etat.pointsCompetence<=0)return; if(etat.competences[cle]>=CAP_COMP){journal("Compétence au maximum (200).","alerte");return;} etat.pointsCompetence--; etat.competences[cle]++; journal(`${COMPETENCES.find(c=>c.id===cle).nom} améliorée (${etat.competences[cle]}).`); afficher(); sauvegarder(); }
function apresAction(){ verifierVital(); afficher(); sauvegarder(); }
function verifierVital(){ if(etat.jauges.o2<=0||etat.jauges.sante<=0){ const p=Math.floor(etat.credits/2); etat.credits-=p; etat.retours++; etat.jauges={o2:60,sante:60,moral:50}; journal(`Évacuation d'urgence. Retour à la base. −${p} ₡.`,"alerte"); } }

