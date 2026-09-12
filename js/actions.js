/* ===========================================================
   ACTIONS — Actions du joueur : repos, exploration, achats, usage, amélioration.
   Le combat n'est plus une « chasse » : il se déclenche via les patrouilles du
   Protocole pendant les déplacements (voir patrouille.js). resoudreCombat() est
   le moteur partagé, appelé par les choix de la fenêtre de patrouille.
   =========================================================== */
/* ---------- Actions ---------- */
async function reposer(){
  if(etat.enPause){ journal("Personnage en pause.","alerte"); return; }
  if(typeof enPrison==="function" && enPrison()){ journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte"); return; }
  const ville = (typeof villeActuelle==="function") ? villeActuelle() : null;
  if(!ville){ journal("Repos possible seulement en ville (chez toi ou à l'auberge).","alerte"); return; }
  if(memeJour(etat.reposLe)){ journal("Tu t'es déjà reposé aujourd'hui — la remise à zéro est à minuit.","alerte"); return; }
  const chezSoi = ville===etat.faction;
  const gain = chezSoi?25:20, cap = chezSoi?80:70;
  if(etat.jauges.sante>=cap && etat.jauges.moral>=cap){ journal(`Déjà en forme — le repos ne dépasse pas ${cap} (kit/ration pour aller plus haut).`,"alerte"); return; }
  // Les jauges sont serveur : on calcule le gain UTILE (plafonné) et on l'envoie.
  const gs = Math.max(0, Math.min(cap, etat.jauges.sante + gain) - etat.jauges.sante);
  const gm = Math.max(0, Math.min(cap, etat.jauges.moral + gain) - etat.jauges.moral);
  if(!await agirServeur({ jauges:{ sante:gs, moral:gm }, motif:"repos" })) return;
  etat.reposLe = Date.now();
  journal(chezSoi ? `Repos chez toi : +${gain} santé/moral (plafond ${cap}).` : `Repos à l'auberge : +${gain} santé/moral (plafond ${cap}).`,"gain");
  apresAction();
}
/* ⚠ CODE MORT : l'action « Explorer » a été retirée du jeu (GDD §21) et aucun
   bouton ne l'appelle. Elle utilise encore l'ancien modèle (depenserEnergie,
   ajouterAuSac) et créerait des fantômes si on la rebranchait telle quelle. */
function explorer(){
  if(enZoneFaction()){ journal("Exploration impossible en zone de faction.","alerte"); return; }
  if(!depenserEnergie(aptEnergieExplore(ACTION_COUT.explorer)))return;
  gagnerXp(5);
  const d=Math.random();
  if(d<0.55){ const g=aptButinExplore(alea(10,25)+bonusCredits()); etat.credits+=g; journal(`Cache trouvée : +${g} ₡.`,"gain"); apresAction(); }
  else { const g=aptButinExplore(alea(4,10)+bonusCredits()); etat.credits+=g; const mid=tirerMatiere(); let v=alea(1,2); const dbl=Math.random()<chanceDouble(); if(dbl) v*=2; const pris=ajouterAuSac(mid,v); const nm=item(mid).nom; journal(`Ferraille récupérée : +${g} ₡${pris?`, +${pris} ${nm}`:""}${dbl&&pris>0?" (récup ×2)":""}.`+(pris<v?" (sac plein)":""),"gain"); apresAction(); }
}
/* ---------- Combat (moteur partagé — patrouilles du Protocole) ----------
   opts.embuscade : la patrouille frappe la première → chance de victoire réduite,
   pas d'esquive, dégâts majorés. */
async function resoudreCombat(opts){
  opts = opts || {};
  const F = forceEffective();
  // Dureté de la patrouille ; les aptitudes de combat (Instinct de combat, Combustion) l'abaissent.
  const cf = Math.max(0, alea(6,26) - aptCombatFcReduc());
  /* ⚠ ÉQUILIBRAGE v0.53. Avant : 0,01 + 0,0047×(F−cf), plancher 1 %.
     Un nouveau joueur (Force 10) contre une patrouille moyenne (cf 16) avait
     1 % de victoire — pas « difficile », nul — et perdait 53 santé, donc
     mourait en DEUX défaites. Avec 15 % de rencontre par déplacement, il
     mourait en explorant. Base relevée à 22 %, plancher à 5 %. */
  const bonusApt = (typeof aptCombatBonusVictoire==="function" ? aptCombatBonusVictoire() : 0)      // Instinct (tr1) + Combustion (ig3)
                 + (typeof aptCombatBonusProtocole==="function" ? aptCombatBonusProtocole() : 0);   // Fléau du Protocole (tr4)
  let pWin = Math.min(0.95, Math.max(0.05, 0.22 + 0.0042*(F - cf) + bonusApt));
  if(opts.embuscade) pWin = Math.max(0.01, pWin - 0.15);
  if(Math.random() < pWin){
    const g = aptButinCombat(alea(14,30) + bonusCredits()); etat.credits += g; gagnerXp(10);
    const drop = (typeof butinPatrouille==="function") ? await butinPatrouille() : null;   // récup tech du Protocole
    journal(`Patrouille du Protocole neutralisée : +${g} ₡${drop?`, +1 ${item(drop).nom}`:""}.`,"gain");
  } else {
    /* Santé perdue : ~16 à Force 0, ~5 à Force 200 (+ patrouille costaude).
       Avant : 50 − 0,20×F + cf×0,3, borné 10-55. Divisé par ~3 : un nouveau
       joueur encaisse maintenant SIX défaites avant la mort au lieu de deux,
       ce qui laisse le temps d'aller acheter un kit de soin. */
    let ps = Math.max(3, Math.min(24, Math.round(16 - 0.055*F + cf*0.22)));
    if(opts.embuscade) ps = Math.round(ps*1.3);
    // Esquive (Agilité + jambières) : impossible en embuscade.
    const esq = opts.embuscade ? 0 : Math.min(0.6, agiliteEffective()/400 + (typeof equipEsquive==="function"?equipEsquive()/100:0));
    const esquive = Math.random() < esq; if(esquive) ps = Math.round(ps*0.35);
    // Armure (équipement) puis aptitudes (Cuirasse, Trempe, Métabolisme) ; plancher 3.
    if(typeof equipDegatsMult==="function") ps = ps*equipDegatsMult();
    ps = Math.max(3, aptCombatDegats(Math.round(ps)));
    const pm = Math.max(2, Math.round(ps*0.5));
    await agirServeur({ jauges:{ sante:-ps, moral:-pm }, motif:"combat_perdu" }); gagnerXp(3);
    journal(`La patrouille a pris le dessus : −${ps} santé, −${pm} moral${esquive?" (esquive !)":""}${opts.embuscade?" (embuscade !)":""}.`,"alerte");
  }
  if(typeof consommerMunitions==="function") await consommerMunitions();   // v0.59 : 1 balle par arme à feu, gagné ou perdu
  apresAction();
}
/* acheter() supprimée (v0.58) : ancienne boutique mobile, jamais appelée. Voir boutique.js. */
async function utiliser(art){
  const id = (typeof art==="string") ? art : art.id;
  const eff = (typeof effetConso==="function") ? effetConso(id) : null;
  if(!eff || !etat.sac[id]) return;
  /* ⚠ Les jauges appartiennent au SERVEUR (colonnes o2/sante/moral). L'objet
     était retiré côté serveur mais le soin appliqué en LOCAL, sans être passé
     dans p_jauges : agirServeur écrase ensuite etat.jauges avec les valeurs
     renvoyées, donc le gain s'affichait puis disparaissait à l'action
     suivante. Le joueur perdait son kit pour rien. On envoie désormais les
     deltas DANS le même appel, atomique avec le retrait. */
  const avant = Object.assign({}, etat.jauges);
  const deltas = {};
  for(const g in eff) deltas[g] = aptSoin(eff[g]);

  const res = await agirServeur({ retirer:{ [id]:1 }, jauges:deltas, motif:"consommer" });
  if(!res) return;

  // Gain RÉEL : le serveur plafonne à 100, annoncer le nominal serait mentir.
  const parts=[];
  for(const g in deltas){
    const gagne = Math.round((etat.jauges[g] ?? 0) - (avant[g] ?? 0));
    parts.push(`+${gagne} ${labelJauge(g)}`);
  }
  const perdu = parts.every(p=>p.startsWith("+0"));
  journal(`${item(id)?item(id).nom:(art.nom||id)} utilisé : ${parts.join(", ")}${perdu?" — jauges déjà au maximum":""}.`, perdu?"alerte":"gain");
  apresAction();
}
function ameliorer(cle){ if(etat.pointsCompetence<=0)return; if(etat.competences[cle]>=CAP_COMP){journal("Compétence au maximum (200).","alerte");return;} etat.pointsCompetence--; etat.competences[cle]++; journal(`${COMPETENCES.find(c=>c.id===cle).nom} améliorée (${etat.competences[cle]}).`); afficher(); sauvegarder(); }
function apresAction(){ verifierVital(); afficher(); sauvegarder(); }
/* ⚠ L'évacuation d'urgence est REMPLACÉE par le couloir de la mort : le serveur
   pose profils.mort_le dès qu'une jauge atteint 0 (agir()), et la résurrection
   applique elle-même le retour à la faction et la perte de 30 %. Laisser cette
   version cliente en place produisait une DOUBLE sanction et remettait les
   jauges localement alors que le serveur considère le personnage mort. */
function verifierVital(){ return; }
function _verifierVital_ancien(){ if(etat.jauges.o2<=0||etat.jauges.sante<=0){ const p=Math.floor(etat.credits*0.30); etat.credits-=p; etat.retours++; etat.jauges={o2:50,sante:20,moral:20}; if(typeof posDefaut==="function") etat.pos=posDefaut(); journal(`Évacuation d'urgence : retour à ta faction. −${p} ₡. Refais tes réserves (O₂, kit de soin) avant de repartir.`,"alerte"); } }
