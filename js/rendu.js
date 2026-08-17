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
    if(memeJour(etat.reposLe)) return "Tu t'es déjà reposé aujourd'hui — reviens demain.";
    if(etat.jauges.sante>=70 && etat.jauges.moral>=70) return "Inutile : le repos plafonne à 70 % (achète un kit/ration pour monter plus haut).";
    return "";
  }
  // miner / explorer / combattre : zone sauvage + énergie
  if(enFaction) return "Impossible en ville : va en zone sauvage (clique la carte pour t'y déplacer).";
  const cout = (a==="explorer") ? aptEnergieExplore(ACTION_COUT.explorer) : aptEnergieAction(ACTION_COUT[a]||0);
  if(etat.energie < cout) return `Pas assez d'énergie : il en faut ${cout} %, tu as ${Math.floor(etat.energie)} %. Elle remonte avec le temps (+10 %/h) et à chaque niveau.`;
  return "";
}
function afficher(){
  document.querySelector("#nom-affiche").textContent = etat.nom || "Opérateur";
  const foAct = etat.formation && FORMATIONS[etat.formation.cle];
  document.querySelector("#stat-metier").textContent = foAct ? (foAct.nom + " · " + palierDe(etat.formation.points||0)) : (etat.metier || "Aucun (en formation)");
  document.querySelector("#stat-niveau").textContent = etat.niveau;
  document.querySelector("#stat-age").textContent = ageJours() + " j";
  document.querySelector("#stat-credits").textContent = etat.credits;
  document.querySelector("#stat-xp").textContent = `${etat.xp}/${seuilXp(etat.niveau)}`;

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

  const pts = etat.pointsCompetence;
  document.querySelector("#pts-libres").textContent = pts>0 ? `${pts} pts` : "";
  for (const c of COMPETENCES) {
    document.querySelector(`#comp-${c.id}`).textContent = etat.competences[c.id];
    document.querySelector(`#plus-${c.id}`).disabled = pts<=0 || etat.competences[c.id] >= CAP_COMP;
  }
  if(!etat.pos) etat.pos = posDefaut();
  const enFaction = !!enZoneFaction();

  const boutiqueOk = enFaction || aptBoutiquePartout();
  for (const a of CONSOMMABLES) { const b=document.querySelector(`#achat-${a.id}`); if(!b) continue; const prix=enFaction?a.prix:aptBoutiqueSurcout(a.prix); const ok=boutiqueOk && etat.credits>=prix; b.disabled=!ok; b.querySelector(".cout").classList.toggle("ok",ok); }
  const noteC = document.querySelector("#comptoir-note"); if(noteC) noteC.textContent = enFaction ? "" : (aptBoutiquePartout() ? "Boutique mobile : +10 % hors zone de faction." : "Accessible seulement en zone de faction.");

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
  if(typeof majEquipement==="function") majEquipement();
  document.querySelector("#desc-vue").innerHTML = renduDescription(etat.description);
  document.querySelector("#mur-visibilite").value = etat.murOuvertA;
  if(typeof majAptitudes==="function") majAptitudes();
}
function majJauge(cle, v){ const bloc=document.querySelector(`#jauge-${cle}`); const val=Math.round(v); bloc.querySelector(".val").textContent=val; bloc.querySelector(".remplissage").style.width=val+"%"; bloc.classList.toggle("critique", val<=25); }

/* ---------- Sac (grille de 50 places) ---------- */
function majSac(){
  document.querySelector("#sac-cap").textContent = `${placesUtilisees()}/${capaciteSac()} places`;
  const z=document.querySelector("#sac"); z.innerHTML="";
  const stacks = etat.sacOrdre.filter(id => (etat.sac[id]||0)>0);
  const cible = Math.max(12, Math.ceil((stacks.length+2)/6)*6);   // remplit une grille propre
  for (let i=0;i<cible;i++){
    const cell=document.createElement("div"); cell.className="sac-case";
    const t=document.createElement("div");
    if (i < stacks.length){
      const id=stacks[i]; const it=item(id);
      t.className = "tuile" + (it.type==="conso" ? " utilisable" : "");
      t.draggable = true; t.dataset.id = id;
      const jr = (typeof joursRestants==="function") ? joursRestants(id) : null;
      const perissable = (typeof dureeVie==="function") && dureeVie(id) < 30;
      t.title = (it.type==="conso" ? `${it.nom} — cliquer pour utiliser (+${it.soin})` : it.nom) + (jr!=null ? ` · ${Math.ceil(jr)} j restant(s)` : "");
      const badgeUsure = (perissable && jr!=null) ? `<span class="usure ${jr<1?"critique":jr<dureeVie(id)/2?"faible":""}">${Math.ceil(jr)}j</span>` : "";
      t.innerHTML = `<span class="icone">${iconeItem(id)}</span><span class="compte">${etat.sac[id]}</span>${badgeUsure}`;
      t.addEventListener("dragstart", ()=>{ dragId=id; t.classList.add("drag"); });
      t.addEventListener("dragend",   ()=>{ dragId=null; t.classList.remove("drag"); });
      t.addEventListener("dragover",  e=>e.preventDefault());
      t.addEventListener("drop",      e=>{ e.preventDefault(); if(dragId && dragId!==id) reordonnerSac(dragId, id); });
      if (it.type==="conso" && !etat.enPause) t.addEventListener("click", ()=>utiliser(it));
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
function majMur(){
  const z=document.querySelector("#mur-liste"); z.innerHTML="";
  if(!etat.mur.length){ z.innerHTML=`<p class="vide">Aucun message. En multijoueur, d'autres joueurs pourront écrire ici.</p>`; return; }
  for(const msg of etat.mur){ const d=document.createElement("div"); d.className="mur-msg"; d.innerHTML=`<span class="mur-auteur">${echapper(msg.auteur)}</span>${echapper(msg.texte)}`; z.appendChild(d); }
}
function publierMur(){ const c=document.querySelector("#mur-champ"); const t=c.value.trim(); if(!t)return; etat.mur.unshift({auteur:etat.nom||"Toi",texte:t}); if(etat.mur.length>50)etat.mur.pop(); c.value=""; sauvegarder(); majMur(); }

function construireBoutique(){ const z=document.querySelector("#boutique"); for(const art of CONSOMMABLES){ const b=document.createElement("button"); b.className="achat"; b.id=`achat-${art.id}`; b.innerHTML=`<span>${art.nom}</span><span class="cout">${art.prix} ₡</span>`; b.addEventListener("click",()=>acheter(art)); z.appendChild(b); } }
function construireCompetences(){
  const z=document.querySelector("#competences");
  for(const c of COMPETENCES){
    const l=document.createElement("div"); l.className="comp-ligne";
    l.innerHTML=`<span class="comp-nom" tabindex="0">${c.nom}<span class="tip" role="tooltip">${c.desc}</span></span><span class="comp-val" id="comp-${c.id}">0</span><button class="comp-plus" id="plus-${c.id}" title="Dépenser un point">+</button>`;
    z.appendChild(l);
    l.querySelector(`#plus-${c.id}`).addEventListener("click", ()=>ameliorer(c.id));
  }
}
