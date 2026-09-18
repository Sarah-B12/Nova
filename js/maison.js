/* ===========================================================
   MAISON — Logement du joueur : 5 paliers, posé sur le terrain (1 seul),
   construit par dépôt de matières + travail (1 matière déposée = 1 action).
   Rangement (storage) croissant. Progression stricte (palier N-1 requis).
   Les Nomades ont les mêmes paliers, sous des noms de tentes.
   =========================================================== */
/* ⚠ v0.72 — PALIERS REVUS. Avant : tout en matières brutes, une Villa à
   ~250 ₡ (moins cher qu'un drone), puis un Palace à ~7 900 ₡ d'un seul bond à
   cause des 3 Cristaux de Nyx. Aucun objet fabriqué n'intervenait : l'atelier
   et les quatre formations ne servaient à rien pour se loger.
   Désormais : trajectoire longue et régulière, et les paliers 3 à 5 réclament
   des INTERMÉDIAIRES DES QUATRE MÉTIERS — donc du commerce entre joueurs.
   `travail` (nombre d'actions à −3 % d'énergie) est désormais explicite : il ne
   se déduit plus du nombre de matières, sinon les recettes à base
   d'intermédiaires, moins nombreuses, auraient fait BAISSER l'effort.
   Coût marché indicatif : 86 / 207 / 971 / 3 014 / 15 000 ₡ (cumul ~19 300 ₡).
   ⚠ Aligner MAISON_PALIERS sur PRIX_ITEM si l'économie change. */
const MAISON_PALIERS = [
  { nom:"Cabane",        storage:5,  travail:8,   recette:{ sylve:6, biofibre:4, cendrite:4 } },
  { nom:"Petite maison", storage:10, travail:20,  recette:{ cendrite:10, sylve:8, fab_panneau_de_sylve:3, fab_fil:2 } },
  { nom:"Maison",        storage:18, travail:40,  recette:{ fab_lingot_de_cendrite:6, fab_panneau_de_sylve:6, fab_panneau_renforce:3, fab_plaque_de_coque:3, fab_fil:4, cuir:6 } },
  { nom:"Villa",         storage:28, travail:70,  recette:{ fab_panneau_composite:5, fab_plaque_de_coque:6, fab_cablage:4, fab_biofil_renforce:4, fab_servomoteur:2, fab_lingot_de_givrite:4 } },
  { nom:"Palace",        storage:40, travail:110, recette:{ fab_panneau_composite:8, fab_coque_blindee:4, fab_supraconducteur:2, fab_lingot_de_givrite:4, fab_combinaison_pressurisee:1, fab_noyau_de_calcul:1, fab_biofil_renforce:6, cristal:2 } }
];
const MAISON_NOMS_NOMADES = ["Tente", "Tente équipée", "Grande tente", "Chapiteau", "Tente de luxe"];
const MAISON_IMG_STD = ["cabane","petite_maison","maison","villa","palace"];
const MAISON_IMG_NOM = ["tente1","tente2","tente3","tente4","tente5"];
const TRAVAIL_ENERGIE = 3;   // énergie par action de travail

function estNomade(){ return etat.faction === "nomades"; }
function imgMaison(p){ if(p<1||p>5) return null; return `images/maisons/${(estNomade()?MAISON_IMG_NOM:MAISON_IMG_STD)[p-1]}.png`; }
function nomPalier(n){ if(n<1||n>5) return "—"; return estNomade() ? MAISON_NOMS_NOMADES[n-1] : MAISON_PALIERS[n-1].nom; }
function recetteMaison(n){ return (MAISON_PALIERS[n-1]||{}).recette || null; }
function storageMaison(n){ return (MAISON_PALIERS[n-1]||{}).storage || 0; }
function travailTotal(n){
  const p = MAISON_PALIERS[n-1]; if(!p) return 0;
  return p.travail || Object.values(p.recette).reduce((a,b)=>a+b,0);   // `travail` explicite depuis la v0.72
}
function itemsCoffre(){ return Object.values(etat.coffre).reduce((a,b)=>a+b,0); }
function capaciteMaison(){
  const p = etat.maison.palier||0; if(p<=0) return 0;
  const bonus = (typeof aptPris==="function" && aptPris("to3")) ? p*2 : 0;   // Réserves d'hiver
  return storageMaison(p) + bonus;
}
function deposeTotal(c){ return c ? Object.values(c.depose).reduce((a,b)=>a+b,0) : 0; }

/* ⚠ v0.92 — LE TRAVAIL OUVERT SE CALCULE ICI, ET NULLE PART AILLEURS.
   Il était écrit DEUX FOIS — dans `travaillerMaison()` et dans le rendu — à dix
   lignes d'écart. Corriger l'un sans l'autre donnait un bouton grisé sur une
   action pourtant permise, ou l'inverse.

   ⚠ Et la formule elle-même bloquait les trois derniers paliers. Elle bornait
   le travail par le NOMBRE D'UNITÉS déposées, or dès le palier 3 une recette
   contient moins d'unités qu'il n'y a d'actions à faire :
       Maison 40 actions / 28 unités · Villa 70 / 25 · Palace 110 / 28
   Tout déposer n'ouvrait que 28 actions sur 40 : chantier complet, plus aucun
   moyen d'avancer. Les deux premiers paliers (8/14 et 20/23) le masquaient.
   La bonne mesure est une PROPORTION : le travail ouvert suit la part de la
   recette livrée. Tout déposé = tout le travail, quel que soit le rapport. */
function travailOuvert(c){
  if(!c) return 0;
  const r = recetteMaison(c.cible) || {};
  const besoin = Object.values(r).reduce((a,b)=>a+b,0);
  if(besoin <= 0) return 0;
  return Math.floor(travailTotal(c.cible) * deposeTotal(c) / besoin);
}

/* ⚠ v0.92 — LA FIN DU CHANTIER N'ÉTAIT TESTÉE QU'EN TRAVAILLANT, juste après
   `c.travail++`. Un joueur qui finissait son travail AVANT d'avoir tout déposé
   n'avait plus aucun moyen de conclure : `travaillerMaison()` refuse à l'entrée
   quand `travail >= total`, donc la vérification n'était jamais atteinte.
   Déposer la dernière matière ne concluait rien. Un testeur s'est retrouvé à
   « 10/8 », tout livré, avec une maison qui ne se construirait jamais — le 10
   étant un reliquat de l'ancien bug « 9/8 » d'avant le plafond v0.91.
   ⚠ `>=` et non `==` : les états hérités dépassent le total.
   Appelée après CHAQUE dépôt et à l'entrée du travail. */
function finirChantierSiPret(){
  const c = etat.maison.chantier; if(!c) return false;
  const r = recetteMaison(c.cible) || {};
  const toutDepose = Object.keys(r).every(k => (c.depose[k]||0) >= r[k]);
  if(!toutDepose || c.travail < travailTotal(c.cible)) return false;
  etat.maison.palier = c.cible; etat.maison.chantier = null;
  journal(`${nomPalier(etat.maison.palier)} construite ! Rangement : ${capaciteMaison()} places.`,"gain");
  return true;
}

/* ---------- Placement & construction ---------- */
function placerMaison(i){
  if(refusPrison("bâtir un logement")) return;
  if(etat.maison.plot!=null){ journal("Tu as déjà un logement (un seul autorisé).","alerte"); return; }
  if(etat.terrain.parcelles[i]) return;
  etat.maison.plot = i;
  etat.maison.chantier = { cible:1, depose:{}, travail:0 };
  etat.terrain.parcelles[i] = { type:"maison" };
  journal(`Emplacement du logement posé. Construis ta ${nomPalier(1)} dans le sous-onglet Maison.`,"gain");
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant();
}
function agrandirMaison(){
  if(refusPrison("agrandir ton logement")) return;
  const m=etat.maison;
  if(typeof refusMaisonHS==="function" && refusMaisonHS()) return;
  if(m.chantier){ journal("Un chantier est déjà en cours.","alerte"); return; }
  if(m.palier>=5){ journal("Palier maximum atteint.","alerte"); return; }
  m.chantier = { cible:m.palier+1, depose:{}, travail:0 };
  journal(`Chantier lancé : ${nomPalier(m.chantier.cible)}.`,"gain"); apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant();
}
/* v0.72 — on dépose TOUT ce qu'on peut d'un coup (les paliers demandent
   jusqu'à 8 unités : un clic par unité était intenable), et le coffre compte
   quand on est chez soi, comme à l'atelier. */
async function deposerMat(matId, tout){
  const c=etat.maison.chantier; if(!c) return;
  if(typeof refusMaisonHS==="function" && refusMaisonHS()) return;
  const r=recetteMaison(c.cible); const besoin=r[matId]||0; const dej=c.depose[matId]||0;
  const reste = besoin - dej;
  if(reste<=0){ journal("Déjà assez de cette matière.","alerte"); return; }
  const auSac = etat.sac[matId]||0;
  const auCoffre = (typeof coffreAccessible==="function" && coffreAccessible()) ? (etat.coffre[matId]||0) : 0;
  let n = tout ? Math.min(reste, auSac + auCoffre) : Math.min(1, auSac + auCoffre);
  if(n<=0){ journal(`Tu n'as pas de ${item(matId).nom}${auCoffre?"":" dans ton sac"}.`,"alerte"); return; }
  // Ce qui manque au sac remonte d'abord du coffre.
  const manque = n - auSac;
  if(manque>0 && !await rangerServeur(matId, manque, "sac", "coffre")){
    journal(`Impossible de sortir ${manque}× ${item(matId).nom} du coffre.`,"alerte"); return;
  }
  if(!await agirServeur({ retirer:{ [matId]:n }, motif:"chantier", toutOuRien:true })) return;
  c.depose[matId]=dej+n;
  journal(`Chantier : ${n}× ${item(matId).nom} déposé${n>1?"s":""} (${c.depose[matId]}/${besoin}).`);
  finirChantierSiPret();   // v0.92 : la dernière matière peut suffire à conclure
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant();
}
async function travaillerMaison(){
  const c=etat.maison.chantier; if(!c) return;
  if(typeof refusMaisonHS==="function" && refusMaisonHS()) return;
  const total=travailTotal(c.cible);
  /* ⚠ v0.91 — « Travaux : 9/8 ». Le travail disponible se comptait sur le
     TOTAL DÉPOSÉ, qui dépasse le nombre d'actions requises dès qu'une recette
     demande plus de 8 unités. On pouvait donc travailler au-delà du compte,
     en payant l'énergie pour rien. Le travail est maintenant plafonné.

     ⚠⚠ v0.92 — ET CE PLAFOND BLOQUAIT LES TROIS DERNIERS PALIERS. Il s'écrivait
     `Math.min(total, deposeTotal(c)) - c.travail`, donc le travail disponible
     était borné par le NOMBRE D'UNITÉS déposées. Or à partir du palier 3, une
     recette contient MOINS d'unités qu'il n'y a d'actions à faire :
         Maison  40 actions / 28 unités · Villa 70 / 25 · Palace 110 / 28
     Tout déposer ne débloquait que 28 actions sur 40 : le chantier restait
     ouvert à jamais, matières livrées et aucun moyen d'avancer. Les deux
     premiers paliers (8/14 et 20/23) masquaient le défaut.

     LA BONNE MESURE EST UNE PROPORTION, pas un compte d'unités : le travail
     ouvert suit la PART de la recette déjà livrée. Tout déposé = tout le
     travail, quel que soit le rapport entre unités et actions. Les deux
     intentions tiennent ensemble — on ne travaille pas plus que ce qu'on a
     livré, et on peut toujours finir. */
  // v0.92 : un chantier déjà complet se conclut ici, sans exiger un clic de plus.
  if(finirChantierSiPret()){ apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant(); return; }
  if(c.travail>=total){ journal("Les travaux sont faits — il ne manque plus que des matières.","alerte"); return; }
  const dispo = travailOuvert(c) - c.travail;
  if(dispo<=0){ journal("Dépose d'abord des matières à travailler.","alerte"); return; }
  if(!await agirServeur({ cout:TRAVAIL_ENERGIE, motif:"chantier" })) return;
  c.travail++;
  if(!finirChantierSiPret()) journal(`Travaux : ${Math.min(c.travail,total)}/${total}.`);
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant();
}
async function demolirMaison(){
  if(refusPrison("démolir ton logement")) return;
  if(itemsCoffre()>0){ journal("Vide d'abord ton rangement avant de démolir.","alerte"); return; }
  if(!confirm("Démolir ton logement ? La parcelle sera libérée.")) return;
  const libere = etat.maison.plot;
  if(libere!=null) etat.terrain.parcelles[libere]=null;
  etat.maison={ palier:0, plot:null, chantier:null };
  journal("Logement démoli.","alerte"); apresAction();
  // v0.91 : même règle que demolir() — sauver, PUIS faire oublier les dégâts.
  if(typeof sauverMaintenant==="function") await sauverMaintenant();
  if(libere!=null && typeof integriteOublier==="function") await integriteOublier(libere);
}
async function deposerObjet(id){
  if(!etat.sac[id]) return;
  const ts = etat.sacDate && etat.sacDate[id];
  if(!await rangerServeur(id, 1, "coffre", "sac")) return;
  if(typeof reporterDate==="function"){ etat.coffreDate=etat.coffreDate||{}; reporterDate(etat.coffreDate,id,ts||Date.now()); }
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant();
}
async function retirerObjet(id){
  if(!etat.coffre[id]) return;
  const ts = etat.coffreDate && etat.coffreDate[id];
  if(!await rangerServeur(id, 1, "sac", "coffre")) return;
  if(typeof reporterDate==="function"){ etat.sacDate=etat.sacDate||{}; reporterDate(etat.sacDate,id,ts||Date.now()); }
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant();
}

/* ---------- Rendu de la vue Maison (#sous-maison) ---------- */
function majMaison(){
  const z=document.querySelector("#sous-maison"); if(!z) return;
  /* ⚠⚠ v0.92b — LE CHANTIER SE CONCLUT ICI AUSSI, ET C'EST INDISPENSABLE.
     La complétion n'était déclenchée que par `deposerMat()` et
     `travaillerMaison()`. Or le bouton « Travailler » est grisé dès que
     `dispoTravail <= 0` — c'est-à-dire EXACTEMENT quand le chantier est fini.
     Un joueur ayant tout déposé et tout travaillé se retrouvait devant un
     bouton mort, sans aucun moyen de valider : la seule porte de sortie était
     fermée par la condition qui signale qu'on peut sortir.
     Le cas frappait aussi tous ceux arrivés à ce stade AVANT le correctif.
     L'affichage est le seul point de passage garanti : on y vérifie, et le
     chantier s'achève tout seul à la première ouverture de l'écran.
     ⚠ Pas de récursion possible : `finirChantierSiPret()` met `chantier` à
     `null`, l'appel suivant sort immédiatement. */
  if(finirChantierSiPret() && typeof sauverMaintenant==="function") sauverMaintenant();
  const _RB = `<div class="actions" style="margin-bottom:12px"><button class="action" onclick="reposer()"><span>Se reposer (chez toi)</span><span class="cout">+25 santé/moral (≤80) · 1×/jour</span></button></div>`;
  const m=etat.maison;
  if(m.plot==null){
    z.innerHTML=_RB+`<h3>Logement</h3><p class="vide">Aucun logement. Va sur ton <b>Terrain de récolte</b> et bâtis un <b>Logement</b> sur une case libre pour choisir son emplacement (tu ne peux en avoir qu'un).</p>`;
    return;
  }
  let html="";
  const vimg = imgMaison(m.palier);
  if(vimg) html += `<div class="maison-vis"><img src="${vimg}" alt=""></div>`;
  if(m.chantier){
    const c=m.chantier, r=recetteMaison(c.cible), total=travailTotal(c.cible);
    html += `<h3>Chantier : ${nomPalier(c.cible)}</h3>`;
    html += `<p class="vide">Dépose les matières, puis fournis le travail — <b>${total} actions</b> à ${TRAVAIL_ENERGIE} % d'énergie (soit ${total*TRAVAIL_ENERGIE} % en tout). Le travail s'ouvre au fur et à mesure : livrer la moitié de la recette débloque la moitié des actions. ${(typeof coffreAccessible==="function" && coffreAccessible())?"Ton coffre compte (🏠).":"Hors de ta ville : seul le sac compte."}</p><div class="recette-liste">`;
    for(const mid in r){ const dej=c.depose[mid]||0, bes=r[mid], plein=dej>=bes;
      const auSac=etat.sac[mid]||0;
      const auCof=(typeof coffreAccessible==="function" && coffreAccessible()) ? (etat.coffre[mid]||0) : 0;
      const has=auSac+auCof;
      html += `<div class="recette-ligne ok"><span class="recette-seuil">${dej}/${bes}</span><span class="recette-corps"><b class="recette-nom">${item(mid).nom}</b><span class="recette-ing">disponible : ${auSac}${auCof?` +${auCof} 🏠`:""}</span></span><button class="mini" data-dep="${mid}" ${(plein||has<=0)?"disabled":""}>Déposer ${Math.min(bes-dej, has)>1?`×${Math.min(bes-dej, has)}`:""}</button></div>`;
    }
    html += `</div>`;
    const dispoTravail = travailOuvert(c) - c.travail;   // v0.92 : source unique, voir travailOuvert()
    const faits = Math.min(c.travail, total);            // ⚠ jamais « 10/8 » : les états hérités dépassent
    html += `<div class="form-progress" style="margin-top:10px"><div class="form-progress-tete"><span>Travaux</span><span>${faits}/${total}</span></div><div class="form-barre"><div class="form-remplissage" style="width:${Math.round(faits/(total||1)*100)}%"></div></div></div>`;
    /* ⚠ Le libellé dit POURQUOI le bouton est gris. « Travailler » grisé sans
       explication a fait croire à deux testeurs que le jeu était cassé : dans
       un cas il manquait des matières, dans l'autre il ne manquait rien du
       tout. C'est le piège n°3 du projet — un bouton désactivé ne porte pas
       d'infobulle, la raison doit être dans le libellé. */
    const _rienAFaire = dispoTravail <= 0;
    const _faute = _rienAFaire ? "dépose des matières" : (etat.energie < TRAVAIL_ENERGIE ? "énergie insuffisante" : null);
    html += `<div class="actions" style="margin-top:8px"><button class="action" id="maison-travailler" ${(_rienAFaire||etat.energie<TRAVAIL_ENERGIE)?"disabled":""}><span>Travailler</span><span class="cout">${_faute ? _faute : `−${TRAVAIL_ENERGIE} % én. · ${dispoTravail} à faire`}</span></button></div>`;
    html += `<div class="actions" style="margin-top:8px"><button class="mini danger" id="maison-demolir">Annuler / Démolir</button></div>`;
  } else {
    html += `<h3>${nomPalier(m.palier)} <span class="qte">${itemsCoffre()}/${capaciteMaison()} rangement</span></h3>`;
    html += `<div class="actions" style="margin-top:4px">`;
    if(m.palier<5) html += `<button class="action" id="maison-agrandir"><span>Agrandir → ${nomPalier(m.palier+1)}</span><span class="cout">nouveau chantier</span></button>`;
    else html += `<p class="vide" style="margin:0 0 8px">Palier maximum (${nomPalier(5)}).</p>`;
    html += `<button class="mini danger" id="maison-demolir">Démolir</button></div>`;
  }

  if(m.palier>0){
    html += `<div class="rangee2" style="margin-top:14px">
      <div class="sous-carte" style="margin:0"><h3>Rangement <span class="qte">${itemsCoffre()}/${capaciteMaison()}</span></h3><div class="sac-grille" id="coffre-grille"></div></div>
      <div class="sous-carte" style="margin:0"><h3>À déposer (sac)</h3><div id="depot-liste"></div></div>
    </div>`;
  }
  /* v0.91 — logement abîmé : bandeau AVANT tout le reste, bouton Réparer
     compris. Le chantier est gelé ; le RANGEMENT, lui, reste accessible. */
  z.innerHTML=((typeof blocArretMaison==="function") ? blocArretMaison() : "") + _RB + html;

  z.querySelectorAll("[data-dep]").forEach(b=>b.addEventListener("click",()=>deposerMat(b.dataset.dep, true)));   // v0.72 : tout ce qui manque, d'un coup
  const bt=z.querySelector("#maison-travailler"); if(bt) bt.addEventListener("click", travaillerMaison);
  const ba=z.querySelector("#maison-agrandir"); if(ba) ba.addEventListener("click", agrandirMaison);
  const bd=z.querySelector("#maison-demolir"); if(bd) bd.addEventListener("click", demolirMaison);
  const br=z.querySelector("#maison-reparer"); if(br) br.addEventListener("click", ()=>reparerStructure(etat.maison.plot));

  if(m.palier>0){
    const g=z.querySelector("#coffre-grille");
    // Une tuile par LOT, comme dans le sac : chaque acquisition garde son échéance.
    const stacks = (typeof lotsAffichage==="function") ? lotsAffichage("coffre") : [];
    const cible=Math.max(6, Math.ceil((stacks.length+1)/6)*6);
    for(let i=0;i<cible;i++){ const t=document.createElement("div");
      if(i<stacks.length){ const lot=stacks[i]; const iid=lot.item; t.className="tuile utilisable";
        t.dataset.item = iid;
        t.innerHTML=`<span class="icone">${iconeItem(iid)}</span><span class="compte">${lot.qte}</span>${(typeof badgeLot==="function")?badgeLot(lot):""}`;
        if(typeof montrerItemTip==="function"){ t.addEventListener("mouseenter",()=>montrerItemTip(t,iid)); t.addEventListener("mouseleave",cacherItemTip); }
        t.addEventListener("click",()=>{ if(typeof cacherItemTip==="function")cacherItemTip(); retirerObjet(iid); }); }
      else t.className="tuile vide";
      g.appendChild(t);
    }
    const dl=z.querySelector("#depot-liste");
    const dispo=TOUS_ITEMS.filter(a=>(etat.sac[a.id]||0)>0);
    if(!dispo.length) dl.innerHTML=`<p class="vide">Rien à déposer.</p>`;
    for(const it of dispo){ const d=document.createElement("div"); d.className="item-ligne";
      d.innerHTML=`<span>${it.nom} <span class="qte">×${etat.sac[it.id]}</span></span>`;
      const b=document.createElement("button"); b.className="mini"; b.textContent="Déposer"; b.disabled=itemsCoffre()>=capaciteMaison();
      b.addEventListener("click",()=>deposerObjet(it.id)); d.appendChild(b); dl.appendChild(d); }
  }
}
