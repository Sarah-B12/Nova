/* ===========================================================
   RENDU — Rendu de l'interface : affichage principal, jauges, sac, maison/terrain, mur, et construction dynamique (boutique, compétences).
   =========================================================== */
/* ---------- Affichage ---------- */
// Renvoie la raison (texte) pour laquelle une action est indisponible, ou "" si elle est possible.
function raisonAction(a){
  if(etat.enPause) return "Personnage en pause — réactive-le dans l'onglet Paramètres.";
  const enFaction = !!enZoneFaction();
  if(a==="reposer"){
    if(!enFaction) return "Le repos se fait en zone de faction : rejoins une ville sur la carte.";
    if(memeJour(etat.reposLe)) return "Tu t'es déjà reposé aujourd'hui — la remise à zéro est à minuit.";
    if(etat.jauges.sante>=70 && etat.jauges.moral>=70) return "Inutile : le repos plafonne à 70 % (achète un kit/ration pour monter plus haut).";
    return "";
  }
  // explorer : zone sauvage + énergie
  if(enFaction) return "Impossible en ville : va en zone sauvage (clique la carte pour t'y déplacer).";
  const cout = (a==="explorer") ? aptEnergieExplore(ACTION_COUT.explorer) : aptEnergieAction(ACTION_COUT[a]||0);
  if(etat.energie < cout) return `Pas assez d'énergie : il en faut ${cout} %, tu as ${Math.floor(etat.energie)} %. Elle remonte avec le temps (+10 %/h) et à chaque niveau.`;
  return "";
}
function afficher(){
  if(typeof cacherItemTip==="function") cacherItemTip();
  if(typeof verifPauseAuto==="function") verifPauseAuto();
  document.querySelector("#nom-affiche").textContent = etat.nom || "Opérateur";
  const foAct = etat.formation && FORMATIONS[etat.formation.cle];
  document.querySelector("#stat-metier").textContent = foAct ? (foAct.nom + " · " + palierDe(etat.formation.points||0)) : (etat.metier || "Aucun (en formation)");
  document.querySelector("#stat-niveau").textContent = etat.niveau;
  document.querySelector("#stat-age").textContent = ageJours() + " j";
  document.querySelector("#stat-credits").textContent = etat.credits;
  document.querySelector("#stat-xp").textContent = `${etat.xp}/${seuilXp(etat.niveau)}`;

  // ⚠ L'O₂ plein en zone de faction est désormais appliqué PAR LE SERVEUR
  // (agir() et jauges_lire() connaissent la position). Le client ne l'écrit plus.
  majJauge("o2", etat.jauges.o2); majJauge("sante", etat.jauges.sante); majJauge("moral", etat.jauges.moral);

  regenEnergie();
  regenPassif();
  if(typeof majDrones==="function") majDrones();
  if(typeof majUsure==="function") majUsure();
  const e = Math.floor(etat.energie);
  const je = document.querySelector("#jauge-energie");
  je.querySelector(".val").textContent = e + "%";
  je.querySelector(".remplissage").style.width = e + "%";

  const f = FACTIONS.find(x => x.id === etat.faction);
  document.querySelector("#faction-nom").textContent = f ? f.nom : "Sans faction";
  document.querySelector("#portrait").style.setProperty("--tint", f ? f.couleur : "var(--orange)");
  const _enPr = (typeof enPrison==="function") && enPrison();
  const _port=document.querySelector("#portrait"); if(_port) _port.classList.toggle("enprison", _enPr);
  if(typeof majAvatar==="function") majAvatar();
  const _pb=document.querySelector("#prison-banniere");
  if(_pb){ if(_enPr){ _pb.hidden=false; _pb.innerHTML=`⛓️ <b>En prison</b> — ${(typeof _factionNom==="function")?_factionNom(etat.prisonFaction):etat.prisonFaction}. Libération dans <b>${(typeof _vfmt==="function")?_vfmt((etat.prisonJusqua||0)-Date.now()):"…"}</b>. Aucune action possible.`; } else _pb.hidden=true; }

  const pts = etat.pointsCompetence;
  document.querySelector("#pts-libres").textContent = pts>0 ? `${pts} pts` : "";
  const penal = (typeof penaliteMoral==="function") && penaliteMoral() < 1;
  const eff = { force:(typeof forceEffective==="function"?forceEffective():null), agilite:(typeof agiliteEffective==="function"?agiliteEffective():null), intelligence:(typeof intelligenceEffective==="function"?intelligenceEffective():null) };
  for (const c of COMPETENCES) {
    const raw = etat.competences[c.id]; const el = document.querySelector(`#comp-${c.id}`);
    if(penal && eff[c.id]!=null) el.innerHTML = `<span class="comp-brut">${raw}</span><span class="comp-penal">${eff[c.id]}</span>`;
    else el.textContent = raw;
    document.querySelector(`#plus-${c.id}`).disabled = pts<=0 || raw >= CAP_COMP;
  }
  majBonusCompetences();
  const av=document.querySelector("#comp-avert"); if(av) av.hidden = !penal;
  if(!etat.pos) etat.pos = posDefaut();
  const enFaction = !!enZoneFaction();


  // Pause + énergie + ZONE : ce qui est possible dépend d'où tu es.
  document.querySelector("#banniere-pause").hidden = !etat.enPause;
  document.querySelectorAll("button.action[data-action]").forEach(b => {
    const r = raisonAction(b.dataset.action);          // "" si l'action est possible, sinon la raison
    b.classList.toggle("bloque", !!r);                 // on garde le bouton cliquable pour le survol/l'explication
    let tip = b.querySelector(".tip");
    if(!tip){ tip = document.createElement("span"); tip.className = "tip"; b.appendChild(tip); }
    tip.textContent = r;
  });

  majCarte(); majSac(); majTerrain(); majMur();
  if(typeof majBoutonOrbite==="function") majBoutonOrbite();
  if(typeof majEquipement==="function") majEquipement();
  if(typeof majVaisseau==="function") majVaisseau();
  if(typeof majQueteHubSiPertinent==="function") majQueteHubSiPertinent();
  if(typeof majPas==="function") majPas();
  if(typeof majJournal==="function") majJournal();
  const _rz=document.querySelector("#reputations"); if(_rz && typeof _badgesReput==="function") _rz.innerHTML=_badgesReput(etat.reputation||0, etat.cercles||{}, etat.faction);
  if(typeof renderMarche==="function"){ const hm=document.querySelector("#hub-marche"); if(hm && !hm.hidden) renderMarche(); }
  document.querySelector("#desc-vue").innerHTML = renduDescription(etat.description);
  document.querySelector("#mur-visibilite").value = etat.murOuvertA;
  if(typeof majAptitudes==="function") majAptitudes();
  if(typeof majBoissonFiche==="function") majBoissonFiche();   // v0.77
}
/* Rafraîchissement LÉGER : uniquement les jauges qui bougent avec le temps.
   afficher() reconstruit une douzaine de panneaux (sac, terrain, mur, quêtes…),
   ce qui efface les formulaires en cours de saisie — inutile pour animer une barre. */
function majJaugesSeules(){
  if(!etat || !etat.inscrit) return;
  if(typeof regenEnergie==="function") regenEnergie();
  if(typeof regenPassif==="function") regenPassif();
  const je=document.querySelector("#jauge-energie");
  if(je){ const e=Math.floor(etat.energie);
    je.querySelector(".val").textContent=e+"%";
    je.querySelector(".remplissage").style.width=e+"%"; }
  if(etat.jauges){ majJauge("o2",etat.jauges.o2); majJauge("sante",etat.jauges.sante); majJauge("moral",etat.jauges.moral); }
}
function _majJaugeEl(bloc, v){ if(!bloc) return; const val=Math.round(v); bloc.querySelector(".val").textContent=val; bloc.querySelector(".remplissage").style.width=val+"%"; bloc.classList.toggle("critique", val<=25); }
function majJauge(cle, v){ _majJaugeEl(document.querySelector(`#jauge-${cle}`), v); if(cle==="o2") _majJaugeEl(document.querySelector("#jauge-o2-haut"), v); }   // #jauge-o2 retiré de la fiche en v0.75 : _majJaugeEl ignore un élément absent   // O₂ aussi en tête (v0.59)

/* ---------- Sac (grille de 50 places) ---------- */
/* --- Infobulle d'objet au survol : effets, valeur de marché, durée de vie --- */
function infoItemHTML(id){
  const it = item(id); if(!it) return "";
  let h = `<div class="itip-nom">${it.nom}</div>`;
  const catLbl = { minerai:"Minerai", organique:"Matière organique", animal:"Matière animale", plante:"Plante", fabrique:"Objet fabriqué" };
  h += `<div class="itip-cat">${catLbl[it.cat] || ({graine:"Graine",bebe:"Bébé animal"}[it.type]) || (it.type==="conso" ? "Consommable" : "Objet")}</div>`;
  if(typeof effetTexte==="function"){ const e=effetTexte(id); if(e) h += `<div class="itip-effet">${e}</div>`; }
  const ec=(typeof effetConso==="function")?effetConso(id):null; if(ec){ const parts=Object.keys(ec).map(g=>`+${ec[g]} ${labelJauge(g)}`); h += `<div class="itip-effet">${parts.join(", ")} — cliquer pour utiliser</div>`; }
  if(typeof PRIX_ITEM!=="undefined" && PRIX_ITEM[id]){ const p=PRIX_ITEM[id]; h += `<div class="itip-ligne">Valeur : <b>${p.min}–${p.max} ₡</b> <span class="itip-gris">(moy ${p.moy})</span></div>`; }
  if(typeof dureeVie==="function"){ let s=`Durée de vie : ${dureeVie(id)} j`; if(typeof joursRestants==="function"){ const jr=joursRestants(id); if(jr!=null) s+=` · ${Math.ceil(jr)} j restant`; } h += `<div class="itip-ligne itip-gris">${s}</div>`; }
  return h;
}
let _itip=null;
function itemTip(){ if(!_itip){ _itip=document.createElement("div"); _itip.id="item-tip"; _itip.hidden=true; document.body.appendChild(_itip);
    // Filet : referme une infobulle orpheline quand la souris quitte tout porteur.
    // ⚠ Les tuiles du sac portent data-id (dataset.id), pas data-item : chercher
    // uniquement [data-item] refermait l'infobulle à chaque mouvement DANS la tuile
    // (d'où le clignotement). On accepte les deux attributs.
    document.addEventListener("mouseover", e=>{
      if(!_itip || _itip.hidden) return;
      const cible = e.target && e.target.closest && e.target.closest("[data-item],[data-id]");
      if(!cible) _itip.hidden = true;
    });
    window.addEventListener("scroll", ()=>{ if(_itip) _itip.hidden=true; }, true);
  } return _itip; }
function montrerItemTip(el, id){ const html=infoItemHTML(id); if(!html) return; const t=itemTip(); t.innerHTML=html; t.hidden=false;
  const r=el.getBoundingClientRect(), tw=t.offsetWidth, th=t.offsetHeight;
  let x=r.left+r.width/2-tw/2, y=r.top-th-8; if(y<8) y=r.bottom+8;
  t.style.left=Math.max(8, Math.min(x, innerWidth-tw-8))+"px"; t.style.top=y+"px"; }
function cacherItemTip(){ if(_itip) _itip.hidden=true; }
function brancherTips(root){ if(!root || typeof montrerItemTip!=="function") return; root.querySelectorAll("[data-item]").forEach(el=>{ el.addEventListener("mouseenter",()=>montrerItemTip(el, el.dataset.item)); el.addEventListener("mouseleave", cacherItemTip); }); }

function majSac(){
  document.querySelector("#sac-cap").textContent = `${placesUtilisees()}/${capaciteSac()} places`;
  const z=document.querySelector("#sac"); z.innerHTML="";
  // Une tuile par LOT : deux acquisitions du même objet à des dates différentes
  // s'affichent séparément, chacune avec sa propre échéance. L'ordre choisi par
  // le joueur (sacOrdre) prime ; à l'intérieur d'un objet, du plus ancien au plus
  // récent — c'est aussi l'ordre dans lequel le serveur les consomme (FIFO).
  const lots = (etat.lots||[]).filter(l => l && l.lieu==="sac" && l.qte>0);
  const rang = id => { const i = (etat.sacOrdre||[]).indexOf(id); return i<0 ? 9999 : i; };
  const stacks = lots.length
    ? lots.slice().sort((a,b)=> (rang(a.item)-rang(b.item)) || (a.acquis-b.acquis))
    : (etat.sacOrdre||[]).filter(id => (etat.sac[id]||0)>0)
        .map(id => ({ item:id, lieu:"sac", qte:etat.sac[id], acquis:null }));   // repli avant la synchro
  if(stacks.length===0){ z.innerHTML=`<p class="vide" style="grid-column:1/-1">Ton sac est vide. Va miner ou récolter sur ton Terrain.</p>`; return; }
  const cible = Math.max(12, Math.ceil((stacks.length+2)/6)*6);   // remplit une grille propre
  for (let i=0;i<cible;i++){
    const cell=document.createElement("div"); cell.className="sac-case";
    const t=document.createElement("div");
    if (i < stacks.length){
      const lot=stacks[i]; const id=lot.item; const it=item(id);
      if(!it){ t.className="tuile vide"; cell.appendChild(t); z.appendChild(cell); continue; }   // objet inconnu (ancienne sauvegarde)
      t.className = "tuile utilisable";
      t.draggable = true; t.dataset.id = id; t.dataset.item = id;
      // Échéance propre à CE lot, pas au plus ancien de l'objet.
      const jr = (lot.acquis!=null && typeof dureeVie==="function")
        ? Math.max(0, dureeVie(id) - (Date.now()-lot.acquis)/JOUR_MS)
        : ((typeof joursRestants==="function") ? joursRestants(id) : null);
      // Tout objet finit par disparaître, y compris ceux à 30 jours : on affiche
      // donc le badge pour TOUS. Le masquer au-delà de 30 j ne prévenait que pour
      // une partie de l'inventaire, ce qui trompait plus que ça n'informait.
      const badgeUsure = (jr!=null)
        ? `<span class="usure ${jr<1?"critique":jr<dureeVie(id)/2?"faible":""}">${Math.ceil(jr)}j</span>`
        : "";
      t.innerHTML = `<span class="icone">${iconeItem(id)}</span><span class="compte">${lot.qte}</span>${badgeUsure}`;
      t.addEventListener("dragstart", ()=>{ dragId=id; t.classList.add("drag"); });
      t.addEventListener("dragend",   ()=>{ dragId=null; t.classList.remove("drag"); });
      t.addEventListener("dragover",  e=>e.preventDefault());
      t.addEventListener("drop",      e=>{ e.preventDefault(); if(dragId && dragId!==id) reordonnerSac(dragId, id); });
      t.addEventListener("mouseenter", ()=>montrerItemTip(t, id));
      t.addEventListener("mouseleave", cacherItemTip);
      if(!etat.enPause) t.addEventListener("click", ()=>{ cacherItemTip(); if(typeof ouvrirMenuObjet==="function") ouvrirMenuObjet(id); });
      cell.appendChild(t);
      const nom=document.createElement("span"); nom.className="sac-nom"; nom.textContent=it.nom; cell.appendChild(nom);
    } else {
      t.className = "tuile vide";
      t.addEventListener("dragover", e=>e.preventDefault());
      t.addEventListener("drop",     e=>{ e.preventDefault(); if(dragId) reordonnerSac(dragId, null); });
      cell.appendChild(t);
      const nom=document.createElement("span"); nom.className="sac-nom"; nom.innerHTML="&nbsp;"; cell.appendChild(nom);
    }
    z.appendChild(cell);
  }
}

/* ---------- Maison & matières ---------- */
function majTerrain(){
  /* La consultation reste libre, seules les ACTIONS sont refusées (voir
     _refusTerrain dans terrain.js). Sans ce bandeau, un joueur hors de sa
     ville cliquerait sans comprendre pourquoi rien ne se passe. */
  const z = document.querySelector("#terrain-loin");
  if(z){
    const loin = (typeof surMonTerrain === "function") && !surMonTerrain();
    z.innerHTML = loin
      ? `<p class="terrain-loin">Tu es hors de ta ville : tu peux regarder ton terrain, mais pas y travailler. Rejoins ${typeof _nomMaFaction==="function"?_nomMaFaction():"ta faction"} sur la carte.</p>`
      : "";
  }
  if(typeof majMaison==="function") majMaison();
  majRecolte();
}

/* ---------- Description & mur ---------- */
function renduDescription(txt){
  if(!txt) return `<p class="vide">Aucune description. Clique sur « Éditer » pour te présenter.</p>`;
  let html="", last=0, m; const re=/\[img\](.*?)\[\/img\]/gi;
  while((m=re.exec(txt))!==null){ html+=echapper(txt.slice(last,m.index)).replace(/\n/g,"<br>"); const url=m[1].trim(); html += /^https?:\/\//i.test(url) ? `<img class="desc-img" alt="" src="${echapper(url)}">` : echapper(m[0]); last=re.lastIndex; }
  html+=echapper(txt.slice(last)).replace(/\n/g,"<br>"); return html;
}
async function majMur(){
  const z=document.querySelector("#mur-liste"); if(!z) return;
  const pan=document.querySelector('[data-panneau="profil"]');
  if(!pan || !pan.classList.contains("actif")) return;                 // ne charge que quand le panneau Profil est visible
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){ z.innerHTML=`<p class="vide">Mur indisponible (hors ligne).</p>`; return; }
  let id=(typeof _monId!=="undefined")?_monId:null;
  if(!id && typeof sessionActuelle==="function"){ const s=await sessionActuelle(); id=s?s.user.id:null; }
  if(!id){ z.innerHTML=`<p class="vide">Connecte-toi pour voir ton mur.</p>`; return; }
  if(typeof _ppChargerMur==="function") _ppChargerMur(id, "#mur-liste");
}
async function publierMur(){
  const c=document.querySelector("#mur-champ"); const t=(c.value||"").trim(); if(!t) return;
  if(t.length>500){ journal("Message trop long (500 caractères maximum).","alerte"); return; }
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  const s=await sessionActuelle(); if(!s) return;
  const { error } = await sb.from("mur").insert({ profil_id:s.user.id, auteur_id:s.user.id, texte:t });
  if(error){ console.warn("[mur]", error.message); return; }
  c.value=""; if(typeof _ppChargerMur==="function") _ppChargerMur(s.user.id, "#mur-liste");
}

/* construireBoutique() supprimée (v0.58) : visait un #boutique disparu. La boutique vit dans boutique.js. */
/* Détail des bonus de compétence : un « +3 » à côté du nom, dont l'infobulle
   dit d'où il vient. Les sources sont lues à leur origine (EQUIP_EFFETS pour
   chaque pièce équipée) — on ne recopie aucun chiffre, sinon l'affichage
   divergerait du calcul réel dès qu'un objet change.
   ⚠ La pénalité de moral est MULTIPLICATIVE (×0,30 à moral 0) et s'applique
   après les bonus : elle a donc sa propre ligne, en négatif. */
function _sourcesBonus(comp){
  const cle = comp==="force" ? "force" : (comp==="agilite" ? "agi" : "int");
  const src = [];
  const eq = (typeof etat!=="undefined" && etat.equipement) ? etat.equipement : {};
  for(const emplacement in eq){
    const id = eq[emplacement]; if(!id) continue;
    if(typeof armeChargee==="function" && !armeChargee(id)) continue;   // arme à feu vide : aucun bonus
    const e = (typeof EQUIP_EFFETS!=="undefined") ? EQUIP_EFFETS[id] : null;
    const v = e && e[cle]; if(!v) continue;
    const nom = (typeof item==="function" && item(id)) ? item(id).nom : id;
    src.push({ v, nom });
  }
  return src;
}
function majBonusCompetences(){
  if(typeof COMPETENCES==="undefined") return;
  const penal = (typeof penaliteMoral==="function") ? penaliteMoral() : 1;
  for(const c of COMPETENCES){
    const el = document.querySelector(`#bonus-${c.id}`); if(!el) continue;
    const src = _sourcesBonus(c.id);
    const total = src.reduce((s,x)=>s+x.v, 0);
    if(!total && penal >= 1){ el.innerHTML = ""; continue; }
    const lignes = src.map(x=>`+${x.v} — ${echapper(x.nom)}`);
    if(penal < 1) lignes.push(`×${penal.toString().replace(".",",")} — moral au plus bas`);
    const signe = total > 0 ? `+${total}` : (total < 0 ? String(total) : "");
    el.innerHTML = `<span class="comp-b${penal<1?" mauvais":""}" tabindex="0">${signe||"⚠"}`
      + `<span class="tip" role="tooltip">${lignes.join("<br>")}</span></span>`;
  }
}

function construireCompetences(){
  const z=document.querySelector("#competences");
  for(const c of COMPETENCES){
    const l=document.createElement("div"); l.className="comp-ligne";
    l.innerHTML=`<span class="comp-nom" tabindex="0">${c.nom}<span class="tip" role="tooltip">${c.desc}</span></span><span class="comp-bonus" id="bonus-${c.id}"></span><span class="comp-val" id="comp-${c.id}">0</span><button class="comp-plus" id="plus-${c.id}" title="Dépenser un point">+</button>`;
    z.appendChild(l);
    l.querySelector(`#plus-${c.id}`).addEventListener("click", ()=>ameliorer(c.id));
  }
}
