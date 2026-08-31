/* ===========================================================
   ACTIONS — Actions du joueur : repos, exploration, achats, usage, amélioration.
   Le combat n'est plus une « chasse » : il se déclenche via les patrouilles du
   Protocole pendant les déplacements (voir patrouille.js). resoudreCombat() est
   le moteur partagé, appelé par les choix de la fenêtre de patrouille.
   =========================================================== */
/* ---------- Actions ---------- */
function reposer(){
  if(etat.enPause){ journal("Personnage en pause.","alerte"); return; }
  if(typeof enPrison==="function" && enPrison()){ journal("Tu es en prison — impossible d'agir jusqu'à ta libération.","alerte"); return; }
  const ville = (typeof villeActuelle==="function") ? villeActuelle() : null;
  if(!ville){ journal("Repos possible seulement en ville (chez toi ou à l'auberge).","alerte"); return; }
  if(memeJour(etat.reposLe)){ journal("Tu t'es déjà reposé aujourd'hui.","alerte"); return; }
  const chezSoi = ville===etat.faction;
  const gain = chezSoi?25:20, cap = chezSoi?80:70;
  if(etat.jauges.sante>=cap && etat.jauges.moral>=cap){ journal(`Déjà en forme — le repos ne dépasse pas ${cap} (kit/ration pour aller plus haut).`,"alerte"); return; }
  etat.reposLe = Date.now();
  etat.jauges.sante = Math.max(etat.jauges.sante, Math.min(cap, etat.jauges.sante + gain));
  etat.jauges.moral = Math.max(etat.jauges.moral, Math.min(cap, etat.jauges.moral + gain));
  journal(chezSoi ? `Repos chez toi : +${gain} santé/moral (plafond ${cap}).` : `Repos à l'auberge : +${gain} santé/moral (plafond ${cap}).`,"gain");
  apresAction();
}
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
function resoudreCombat(opts){
  opts = opts || {};
  const F = forceEffective();
  // Dureté de la patrouille ; les aptitudes de combat (Instinct de combat, Combustion) l'abaissent.
  const cf = Math.max(0, alea(6,26) - aptCombatFcReduc());
  // Chance de vaincre : ~1 % à Force 0, plafond 95 % (jamais 100 %).
  let pWin = Math.min(0.95, Math.max(0.01, 0.01 + 0.0047*(F - cf)));
  if(opts.embuscade) pWin = Math.max(0.01, pWin - 0.15);
  if(Math.random() < pWin){
    const g = aptButinCombat(alea(14,30) + bonusCredits()); etat.credits += g; gagnerXp(10);
    const drop = (typeof butinPatrouille==="function") ? butinPatrouille() : null;   // récup tech du Protocole
    journal(`Patrouille du Protocole neutralisée : +${g} ₡${drop?`, +1 ${item(drop).nom}`:""}.`,"gain");
  } else {
    // Santé perdue : ~50 à Force 0, ~10 à Force 200 (+ patrouille costaude).
    let ps = Math.max(10, Math.min(55, Math.round(50 - 0.20*F + cf*0.3)));
    if(opts.embuscade) ps = Math.round(ps*1.3);
    // Esquive (Agilité + jambières) : impossible en embuscade.
    const esq = opts.embuscade ? 0 : Math.min(0.6, agiliteEffective()/400 + (typeof equipEsquive==="function"?equipEsquive()/100:0));
    const esquive = Math.random() < esq; if(esquive) ps = Math.round(ps*0.35);
    // Armure (équipement) puis aptitudes (Cuirasse, Trempe, Métabolisme) ; plancher 3.
    if(typeof equipDegatsMult==="function") ps = ps*equipDegatsMult();
    ps = Math.max(3, aptCombatDegats(Math.round(ps)));
    const pm = Math.max(2, Math.round(ps*0.5));
    etat.jauges.sante=borne(etat.jauges.sante-ps); etat.jauges.moral=borne(etat.jauges.moral-pm); gagnerXp(3);
    journal(`La patrouille a pris le dessus : −${ps} santé, −${pm} moral${esquive?" (esquive !)":""}${opts.embuscade?" (embuscade !)":""}.`,"alerte");
  }
  apresAction();
}
function acheter(art){
  const dehors = !enZoneFaction();
  if(dehors && !aptBoutiquePartout()){ journal("Boutique accessible en zone de faction.","alerte"); return; }
  const prix = dehors ? aptBoutiqueSurcout(art.prix) : art.prix;
  if(etat.credits<prix)return;
  if(placesLibres()<=0){journal("Sac plein.","alerte");return;}
  etat.credits-=prix; ajouterAuSac(art.id,1);
  journal(`${art.nom} acheté (−${prix} ₡)${dehors?" (boutique mobile)":""}. Rangé dans le sac.`); apresAction();
}
function utiliser(art){
  const id = (typeof art==="string") ? art : art.id;
  const eff = (typeof effetConso==="function") ? effetConso(id) : null;
  if(!eff || !etat.sac[id]) return;
  retirerDuSac(id,1);
  const parts=[];
  for(const g in eff){ const soin=aptSoin(eff[g]); etat.jauges[g]=borne((etat.jauges[g]||0)+soin); parts.push(`+${soin} ${labelJauge(g)}`); }
  journal(`${item(id)?item(id).nom:(art.nom||id)} utilisé : ${parts.join(", ")}.`,"gain");
  apresAction();
}
function ameliorer(cle){ if(etat.pointsCompetence<=0)return; if(etat.competences[cle]>=CAP_COMP){journal("Compétence au maximum (200).","alerte");return;} etat.pointsCompetence--; etat.competences[cle]++; journal(`${COMPETENCES.find(c=>c.id===cle).nom} améliorée (${etat.competences[cle]}).`); afficher(); sauvegarder(); }
function apresAction(){ verifierVital(); afficher(); sauvegarder(); }
function verifierVital(){ if(etat.jauges.o2<=0||etat.jauges.sante<=0){ const p=Math.floor(etat.credits*0.30); etat.credits-=p; etat.retours++; etat.jauges={o2:50,sante:20,moral:20}; if(typeof posDefaut==="function") etat.pos=posDefaut(); journal(`Évacuation d'urgence : retour à ta faction. −${p} ₡. Refais tes réserves (O₂, kit de soin) avant de repartir.`,"alerte"); } }
