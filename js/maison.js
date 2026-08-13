/* ===========================================================
   MAISON — Logement du joueur : 5 paliers, posé sur le terrain (1 seul),
   construit par dépôt de matières + travail (1 matière déposée = 1 action).
   Rangement (storage) croissant. Progression stricte (palier N-1 requis).
   Les Nomades ont les mêmes paliers, sous des noms de tentes.
   =========================================================== */
const MAISON_PALIERS = [
  { nom:"Cabane",        storage:5,  recette:{ sylve:5, biofibre:3 } },
  { nom:"Petite maison", storage:10, recette:{ cendrite:8, sylve:5, biofibre:3 } },
  { nom:"Maison",        storage:18, recette:{ cendrite:12, voltane:6, filaine:5, biofibre:4 } },
  { nom:"Villa",         storage:28, recette:{ cendrite:15, voltane:10, silite:6, cuir:5, filaine:4 } },
  { nom:"Palace",        storage:40, recette:{ cendrite:20, voltane:12, silite:10, givrite:5, cristal:3, cuir:6 } }
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
function travailTotal(n){ const r=recetteMaison(n); return r ? Object.values(r).reduce((a,b)=>a+b,0) : 0; }
function itemsCoffre(){ return Object.values(etat.coffre).reduce((a,b)=>a+b,0); }
function capaciteMaison(){
  const p = etat.maison.palier||0; if(p<=0) return 0;
  const bonus = (typeof aptPris==="function" && aptPris("to3")) ? p*2 : 0;   // Réserves d'hiver
  return storageMaison(p) + bonus;
}
function deposeTotal(c){ return c ? Object.values(c.depose).reduce((a,b)=>a+b,0) : 0; }

/* ---------- Placement & construction ---------- */
function placerMaison(i){
  if(etat.maison.plot!=null){ journal("Tu as déjà un logement (un seul autorisé).","alerte"); return; }
  if(etat.terrain.parcelles[i]) return;
  etat.maison.plot = i;
  etat.maison.chantier = { cible:1, depose:{}, travail:0 };
  etat.terrain.parcelles[i] = { type:"maison" };
  journal(`Emplacement du logement posé. Construis ta ${nomPalier(1)} dans le sous-onglet Maison.`,"gain");
  apresAction();
}
function agrandirMaison(){
  const m=etat.maison;
  if(m.chantier){ journal("Un chantier est déjà en cours.","alerte"); return; }
  if(m.palier>=5){ journal("Palier maximum atteint.","alerte"); return; }
  m.chantier = { cible:m.palier+1, depose:{}, travail:0 };
  journal(`Chantier lancé : ${nomPalier(m.chantier.cible)}.`,"gain"); apresAction();
}
function deposerMat(matId){
  const c=etat.maison.chantier; if(!c) return;
  const r=recetteMaison(c.cible); const besoin=r[matId]||0; const dej=c.depose[matId]||0;
  if(dej>=besoin){ journal("Déjà assez de cette matière.","alerte"); return; }
  if((etat.sac[matId]||0)<=0){ journal("Tu n'as pas cette matière dans ton sac.","alerte"); return; }
  retirerDuSac(matId,1); c.depose[matId]=dej+1; apresAction();
}
function travaillerMaison(){
  const c=etat.maison.chantier; if(!c) return;
  const dispo = deposeTotal(c) - c.travail;
  if(dispo<=0){ journal("Dépose d'abord des matières à travailler.","alerte"); return; }
  if(!depenserEnergie(TRAVAIL_ENERGIE)) return;
  c.travail++;
  const total=travailTotal(c.cible); const r=recetteMaison(c.cible);
  const toutDepose = Object.keys(r).every(k=>(c.depose[k]||0)>=r[k]);
  if(toutDepose && c.travail>=total){
    etat.maison.palier=c.cible; etat.maison.chantier=null;
    journal(`${nomPalier(etat.maison.palier)} construite ! Rangement : ${capaciteMaison()} places.`,"gain");
  } else journal(`Travaux : ${c.travail}/${total}.`);
  apresAction();
}
function demolirMaison(){
  if(itemsCoffre()>0){ journal("Vide d'abord ton rangement avant de démolir.","alerte"); return; }
  if(!confirm("Démolir ton logement ? La parcelle sera libérée.")) return;
  if(etat.maison.plot!=null) etat.terrain.parcelles[etat.maison.plot]=null;
  etat.maison={ palier:0, plot:null, chantier:null };
  journal("Logement démoli.","alerte"); apresAction();
}
function deposerObjet(id){ if(!etat.sac[id])return; if(itemsCoffre()>=capaciteMaison()){journal("Rangement plein — agrandis ton logement.","alerte");return;} retirerDuSac(id,1); etat.coffre[id]=(etat.coffre[id]||0)+1; apresAction(); }
function retirerObjet(id){ if(!etat.coffre[id])return; if(placesLibres()<=0){journal("Sac plein.","alerte");return;} etat.coffre[id]--; if(etat.coffre[id]<=0) delete etat.coffre[id]; ajouterAuSac(id,1); apresAction(); }

/* ---------- Rendu de la vue Maison (#sous-maison) ---------- */
function majMaison(){
  const z=document.querySelector("#sous-maison"); if(!z) return;
  const m=etat.maison;
  if(m.plot==null){
    z.innerHTML=`<h3>Logement</h3><p class="vide">Aucun logement. Va sur ton <b>Terrain de récolte</b> et bâtis un <b>Logement</b> sur une case libre pour choisir son emplacement (tu ne peux en avoir qu'un).</p>`;
    return;
  }
  let html="";
  const vimg = imgMaison(m.palier);
  if(vimg) html += `<div class="maison-vis"><img src="${vimg}" alt=""></div>`;
  if(m.chantier){
    const c=m.chantier, r=recetteMaison(c.cible), total=travailTotal(c.cible);
    html += `<h3>Chantier : ${nomPalier(c.cible)}</h3>`;
    html += `<p class="vide">Dépose les matières, puis fournis le travail (1 matière déposée = 1 action, ${TRAVAIL_ENERGIE} % d'énergie chacune).</p><div class="recette-liste">`;
    for(const mid in r){ const dej=c.depose[mid]||0, bes=r[mid], has=etat.sac[mid]||0, plein=dej>=bes;
      html += `<div class="recette-ligne ok"><span class="recette-seuil">${dej}/${bes}</span><span class="recette-corps"><b class="recette-nom">${item(mid).nom}</b><span class="recette-ing">dans le sac : ${has}</span></span><button class="mini" data-dep="${mid}" ${(plein||has<=0)?"disabled":""}>Déposer</button></div>`;
    }
    html += `</div>`;
    const dispoTravail = deposeTotal(c) - c.travail;
    html += `<div class="form-progress" style="margin-top:10px"><div class="form-progress-tete"><span>Travaux</span><span>${c.travail}/${total}</span></div><div class="form-barre"><div class="form-remplissage" style="width:${Math.round(c.travail/(total||1)*100)}%"></div></div></div>`;
    html += `<div class="actions" style="margin-top:8px"><button class="action" id="maison-travailler" ${(dispoTravail<=0||etat.energie<TRAVAIL_ENERGIE)?"disabled":""}><span>Travailler</span><span class="cout">−${TRAVAIL_ENERGIE} % én. · ${Math.max(0,dispoTravail)} à faire</span></button></div>`;
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
  z.innerHTML=html;

  z.querySelectorAll("[data-dep]").forEach(b=>b.addEventListener("click",()=>deposerMat(b.dataset.dep)));
  const bt=z.querySelector("#maison-travailler"); if(bt) bt.addEventListener("click", travaillerMaison);
  const ba=z.querySelector("#maison-agrandir"); if(ba) ba.addEventListener("click", agrandirMaison);
  const bd=z.querySelector("#maison-demolir"); if(bd) bd.addEventListener("click", demolirMaison);

  if(m.palier>0){
    const g=z.querySelector("#coffre-grille");
    const stacks=TOUS_ITEMS.filter(a=>(etat.coffre[a.id]||0)>0);
    const cible=Math.max(6, Math.ceil((stacks.length+1)/6)*6);
    for(let i=0;i<cible;i++){ const t=document.createElement("div");
      if(i<stacks.length){ const it=stacks[i]; t.className="tuile utilisable"; t.title=`${it.nom} — cliquer pour retirer 1`;
        t.innerHTML=`<span class="icone">${iconeItem(it.id)}</span><span class="compte">${etat.coffre[it.id]}</span>`;
        t.addEventListener("click",()=>retirerObjet(it.id)); }
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
