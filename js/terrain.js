/* ===========================================================
   TERRAIN — Terrain : structures (mine, bio-dôme, enclos), parcelles, plantation, élevage et leur modale.
   =========================================================== */
// --- Terrain : structures de récolte qui produisent au fil du temps. ---
const STRUCTURES = {
  mine:    { nom:"Mine",     prix:150, desc:"minerais" },
  biodome: { nom:"Bio-dôme", prix:200, desc:"Sylve, Biofibre" },
  enclos:  { nom:"Enclos",   prix:250, desc:"Filaine, Cuir, Protéines" },
  atelier: { nom:"Atelier",  prix:300, desc:"fabriquer les objets de ta formation" }
};
const MINE_MAX = 500;      // réserve d'une mine à sa construction
const MINE_LOT = 6;        // minerais extraits par action « Miner »
// ⚠ JOUR_MS = 1 « jour » de jeu pour arroser/nourrir/tondre (1×/jour).
//    Réglé court pour les tests — mettre 24*3600*1000 en production.
const JOUR_MS = 20*1000;
function memeJour(ts){ return ts && (Date.now()-ts) < JOUR_MS; }   // action déjà faite « aujourd'hui »
const IMG = { mine:"images/mine.png", biodome:"images/biodome.png", enclos:"images/enclos.png", atelier:"images/atelier.png" };
const N_PLOTS = 24;                                                 // parcelles (6 × 4), même terrain pour tous
const PLANT_MAX = 100;         // % de croissance pour récolter une plante
const REPAS_ADULTE = 4;        // repas (plantes) pour qu'un animal devienne adulte
const TONTES_MAX = 7;          // au bout de 7 tontes l'animal prend sa retraite
const N_CASES = 4;             // emplacements dans un bio-dôme / enclos
let structSel = null, structCaseSel = null;   // structure ouverte en modale + case sélectionnée
let plotSel = null;

function normCases(c){ const a=Array(N_CASES).fill(null); if(Array.isArray(c)) for(let i=0;i<N_CASES;i++) a[i]=c[i]||null; return a; }
function normaliserParcelles(t){
  const arr = Array(N_PLOTS).fill(null);
  const src = (t && Array.isArray(t.parcelles)) ? t.parcelles : (t && Array.isArray(t.structures)) ? t.structures : [];
  for(let i=0;i<N_PLOTS;i++){
    const s = src[i]; if(!s){ arr[i]=null; continue; }
    if(s.type==="mine")         arr[i]={ type:"mine", stock:(typeof s.stock==="number")?s.stock:MINE_MAX, max:(typeof s.max==="number")?s.max:MINE_MAX };
    else if(s.type==="biodome") arr[i]={ type:"biodome", cases:normCases(s.cases) };
    else if(s.type==="enclos")  arr[i]={ type:"enclos",  cases:normCases(s.cases) };
    else if(s.type==="atelier") arr[i]={ type:"atelier" };
    else if(s.type==="maison")  arr[i]={ type:"maison" };
    else arr[i]=null;
  }
  return arr;
}
function batirParcelle(type){
  if(plotSel==null || etat.terrain.parcelles[plotSel]) return;
  const s=STRUCTURES[type];
  const prix=aptCoutStructure(s.prix);
  if(etat.credits<prix){ journal(`Il faut ${prix} ₡.`,"alerte"); return; }
  etat.credits-=prix;
  let p;
  if(type==="mine"){ const rmax=aptMineReserve(MINE_MAX); p={ type:"mine", stock:rmax, max:rmax }; }
  else if(type==="biodome") p={ type:"biodome", cases:Array(N_CASES).fill(null) };
  else if(type==="enclos")  p={ type:"enclos",  cases:Array(N_CASES).fill(null) };
  else if(type==="atelier") p={ type:"atelier" };
  else return;
  etat.terrain.parcelles[plotSel]=p;
  journal(`${s.nom} bâti (−${prix} ₡).`,"gain"); apresAction();
}
function demolir(i){
  if(!confirm("Démolir cette structure ? La parcelle sera libérée.")) return;
  const p=etat.terrain.parcelles[i]; const taux=aptRecyclageTaux();
  const remb=(p && STRUCTURES[p.type] && taux>0) ? Math.round(STRUCTURES[p.type].prix*taux) : 0;
  etat.terrain.parcelles[i]=null; plotSel=null; fermerStruct();
  if(remb>0){ etat.credits+=remb; journal(`Structure démolie. Recyclage : +${remb} ₡.`,"gain"); }
  else journal("Structure démolie.","alerte");
  apresAction();
}

// --- MINE : réserve finie 500 → 0, puis à démolir ---
function recolterMine(i){
  const p=etat.terrain.parcelles[i]; const stock=p.stock||0; const rmax=p.max||MINE_MAX;
  const lot=aptStructureLot(MINE_LOT);
  const n=Math.min(lot, stock, placesLibres());
  if(n<=0){ journal(stock<=0?"Mine épuisée — démolis-la puis reconstruis-en une.":"Sac plein.","alerte"); return; }
  let pr=0; for(let k=0;k<n;k++){ ajouterAuSac(tirerMatiere(aptBonusRare(0)),1); pr++; }
  p.stock=Math.max(0,stock-pr);
  journal(`Mine : +${pr} minerai(s). Réserve : ${p.stock}/${rmax}.`,"gain"); apresAction(); majStruct();
}

// --- BIO-DÔME : 4 cases · planter → arroser 1×/jour → récolter (5-9) ---
function poserPlante(ci, plId){ const p=etat.terrain.parcelles[structSel]; if(!p||p.cases[ci]) return; p.cases[ci]={ plante:plId, croissance:0, arrose:0 }; journal(`${plante(plId).nom} planté.`,"gain"); apresAction(); majStruct(); }
function arroserCase(ci){
  const p=etat.terrain.parcelles[structSel]; const c=p&&p.cases[ci]; if(!c) return;
  if(c.croissance>=PLANT_MAX){ journal("Déjà mûr — récolte-le.","alerte"); return; }
  if(memeJour(c.arrose)){ journal("Déjà arrosé aujourd'hui — reviens demain.","alerte"); return; }
  c.croissance=Math.min(PLANT_MAX, c.croissance + aptCroissance(plante(c.plante).croissance)); c.arrose=Date.now();
  journal(`Arrosé — croissance ${c.croissance}%.`,"gain"); apresAction(); majStruct();
}
function recolterCase(ci){
  const p=etat.terrain.parcelles[structSel]; const c=p&&p.cases[ci]; if(!c) return;
  if(c.croissance<PLANT_MAX){ journal("Pas encore mûr.","alerte"); return; }
  const r=aptBiodomeRecolte(); const nb=aptStructureLot(alea(r.min,r.max)); let pr=0; for(let k=0;k<nb;k++){ if(placesLibres()<=0)break; ajouterAuSac(c.plante,1); pr++; }
  const nom=plante(c.plante).nom; p.cases[ci]=null;
  journal(`Récolte : +${pr} ${nom}.`+(pr<nb?" (sac plein)":""),"gain"); apresAction(); majStruct();
}

// --- ENCLOS : 4 cases · élever → nourrir (plante du sac) → tondre 1×/jour ×7 → retraite ---
function poserAnimal(ci, anId){ const p=etat.terrain.parcelles[structSel]; if(!p||p.cases[ci]) return; p.cases[ci]={ animal:anId, repas:0, tontes:0, tonte:0 }; journal(`Jeune ${animal(anId).nom} placé.`,"gain"); apresAction(); majStruct(); }
function plantesDuSac(){ return etat.sacOrdre.filter(id=>{ const it=item(id); return it&&it.cat==="plante"&&(etat.sac[id]||0)>0; }); }
function nourrirCase(ci){
  const p=etat.terrain.parcelles[structSel]; const c=p&&p.cases[ci]; if(!c) return;
  const a=animal(c.animal);
  if(c.repas>=a.repasAdulte){ journal("Déjà adulte.","alerte"); return; }
  const dispo=plantesDuSac();
  if(dispo.length===0){ journal("Il faut une plante cultivée au bio-dôme dans ton sac.","alerte"); return; }
  retirerDuSac(dispo[0],1); c.repas++;
  journal(`Nourri (1 ${item(dispo[0]).nom}) — ${c.repas}/${a.repasAdulte}.`,"gain"); apresAction(); majStruct();
}
function tondreCase(ci){
  const p=etat.terrain.parcelles[structSel]; const c=p&&p.cases[ci]; if(!c) return;
  const a=animal(c.animal);
  if(c.repas<a.repasAdulte){ journal("Trop jeune — nourris-le encore.","alerte"); return; }
  if(memeJour(c.tonte)){ journal("Déjà tondu aujourd'hui — reviens demain.","alerte"); return; }
  const nb=aptStructureLot(alea(2,3)+aptTonteBonus()); let pr=0; for(let k=0;k<nb;k++){ if(placesLibres()<=0)break; ajouterAuSac(a.produit,1); pr++; }
  c.tontes++; c.tonte=Date.now();
  let msg=`Tonte : +${pr} ${item(a.produit).nom} — ${c.tontes}/${TONTES_MAX}.`;
  if(c.tontes>=TONTES_MAX){ p.cases[ci]=null; msg+=` Le ${a.nom} a pris sa retraite.`; }
  journal(msg,"gain"); apresAction(); majStruct();
}

// --- Modale d'une structure (mine / bio-dôme / enclos) ---
function ouvrirStruct(i){ structSel=i; structCaseSel=null; const m=document.querySelector("#modale-struct"); if(m) m.classList.add("ouverte"); majStruct(); }
function fermerStruct(){ const m=document.querySelector("#modale-struct"); if(m) m.classList.remove("ouverte"); structSel=null; structCaseSel=null; afficher(); }
function majStruct(){
  const m=document.querySelector("#modale-struct"); if(!m) return;
  const p = structSel!=null ? etat.terrain.parcelles[structSel] : null;
  if(!p){ m.classList.remove("ouverte"); return; }
  const foT = (p.type==="atelier" && etat.formation) ? " — "+FORMATIONS[etat.formation.cle].nom : (p.type==="mine"?` — ${p.stock||0}/${p.max||MINE_MAX}`:"");
  document.querySelector("#struct-titre").textContent = STRUCTURES[p.type].nom + foT;
  const corps=document.querySelector("#struct-corps"); corps.innerHTML="";
  if(p.type==="atelier"){ renderAtelier(corps); return; }
  if(p.type==="mine"){
    const stock=p.stock||0;
    const row=document.createElement("div"); row.className="actions";
    const b=document.createElement("button"); b.className="mini"; b.textContent="Miner"; b.disabled=stock<=0||placesLibres()<=0; b.addEventListener("click",()=>recolterMine(structSel)); row.appendChild(b);
    corps.innerHTML=`<p class="vide" style="margin:0 0 10px">Réserve : <b class="or">${stock}</b>/${p.max||MINE_MAX} minerais. Chaque extraction sort jusqu'à ${aptStructureLot(MINE_LOT)} minerais, selon leur rareté.${stock<=0?' <span style="color:var(--coral)">Mine épuisée — à démolir.</span>':''}</p>`;
    corps.appendChild(row); return;
  }
  const grille=document.createElement("div"); grille.className="struct-grille";
  p.cases.forEach((c,ci)=>{
    const cell=document.createElement("div");
    cell.className="plot struct-case"+(c?" occupe":"")+(structCaseSel===ci?" sel":"");
    if(c){
      const id = p.type==="biodome" ? c.plante : c.animal;
      const nom = p.type==="biodome" ? plante(id).nom : animal(id).nom;
      let badge;
      if(p.type==="biodome") badge = c.croissance>=PLANT_MAX ? "mûr ✓" : `${c.croissance}%`;
      else { const a=animal(id); badge = c.repas<a.repasAdulte ? `jeune ${c.repas}/${a.repasAdulte}` : `${c.tontes}/${TONTES_MAX} tontes`; }
      const icon = (p.type==="biodome" && ["sporelle","nectine","ferragave"].includes(id) && c.croissance<PLANT_MAX)
        ? `<img class="ic-img" src="images/plantes/${id}_jeune.png" alt="">` : iconeItem(id);
      cell.innerHTML = `<div class="struct-ic">${icon}</div><span class="struct-nom">${nom}</span><span class="struct-badge">${badge}</span>`;
    } else cell.innerHTML = `<span class="vide-plot">+</span>`;
    cell.addEventListener("click", ()=>{ structCaseSel=ci; majStruct(); });
    grille.appendChild(cell);
  });
  corps.appendChild(grille);
  const act=document.createElement("div"); act.style.marginTop="12px"; corps.appendChild(act);
  renderStructActions(p, act);
}
function renderStructActions(p, el){
  el.innerHTML="";
  if(structCaseSel==null){ el.innerHTML=`<p class="vide">Clique un emplacement pour le gérer.</p>`; return; }
  const ci=structCaseSel; const c=p.cases[ci];
  const row=document.createElement("div"); row.className="actions";
  const btn=(label,fn,dis)=>{ const b=document.createElement("button"); b.className="mini"; b.textContent=label; b.disabled=!!dis; b.addEventListener("click",fn); row.appendChild(b); };
  if(p.type==="biodome"){
    if(!c){
      el.innerHTML=`<p style="margin:0 0 8px">Emplacement ${ci+1} — planter :</p>`;
      PLANTES.forEach(pl=>{ const b=document.createElement("button"); b.className="achat"; b.innerHTML=`<span>${pl.nom} <small>(+${pl.croissance}% / jour)</small></span>`; b.addEventListener("click",()=>poserPlante(ci,pl.id)); row.appendChild(b); });
      el.appendChild(row); return;
    }
    el.innerHTML=`<p style="margin:0 0 8px"><b>${plante(c.plante).nom}</b> — croissance ${c.croissance}%</p>`;
    if(c.croissance>=PLANT_MAX) btn("Récolter (5-9)",()=>recolterCase(ci));
    else btn(memeJour(c.arrose)?"Arrosé aujourd'hui":"Arroser (+"+plante(c.plante).croissance+"%)",()=>arroserCase(ci), memeJour(c.arrose));
    btn("Retirer",()=>{ if(confirm("Retirer cette plante ?")){ p.cases[ci]=null; structCaseSel=null; majStruct(); } });
  } else {
    if(!c){
      el.innerHTML=`<p style="margin:0 0 8px">Emplacement ${ci+1} — élever :</p>`;
      ANIMAUX.forEach(a=>{ const b=document.createElement("button"); b.className="achat"; b.innerHTML=`<span>${a.nom} <small>(→ ${item(a.produit).nom})</small></span>`; b.addEventListener("click",()=>poserAnimal(ci,a.id)); row.appendChild(b); });
      el.appendChild(row); return;
    }
    const a=animal(c.animal); const adulte=c.repas>=a.repasAdulte;
    el.innerHTML=`<p style="margin:0 0 8px"><b>${a.nom}</b> — ${adulte?`adulte · ${c.tontes}/${TONTES_MAX} tontes`:`jeune ${c.repas}/${a.repasAdulte} repas`}</p>`;
    if(!adulte) btn("Nourrir (1 plante)",()=>nourrirCase(ci), plantesDuSac().length===0);
    else btn(memeJour(c.tonte)?"Tondu aujourd'hui":"Tondre",()=>tondreCase(ci), memeJour(c.tonte));
    btn("Retirer",()=>{ if(confirm("Retirer cet animal ?")){ p.cases[ci]=null; structCaseSel=null; majStruct(); } });
  }
  el.appendChild(row);
}

function majRecolte(){
  const g=document.querySelector("#terrain-grille"); if(!g) return;
  g.innerHTML="";
  etat.terrain.parcelles.forEach((p,i)=>{
    const cell=document.createElement("div");
    cell.className="plot"+(p?" occupe":"")+(plotSel===i?" sel":"");
    if(p && p.type==="maison"){
      const img = (typeof imgMaison==="function") ? imgMaison(etat.maison.palier) : null;
      const lbl = etat.maison.chantier ? "Chantier" : nomPalier(etat.maison.palier);
      if(img){ cell.innerHTML = `<img src="${img}" alt="${lbl}"><span class="badge-plot">${lbl}</span>`; }
      else { cell.classList.add("plot-maison"); cell.innerHTML = `<span class="maison-glyphe">⌂</span><span class="badge-plot">${lbl}</span>`; }
      cell.addEventListener("click", ()=>{ plotSel=i; majRecolte(); const sl=document.querySelector('.sous-lien[data-sous="maison"]'); if(sl) sl.click(); });
    } else {
      cell.innerHTML = p ? `<img src="${IMG[p.type]}" alt="${STRUCTURES[p.type].nom}">` : `<span class="vide-plot">+</span>`;
      cell.addEventListener("click", ()=>{ plotSel=i; majRecolte(); if(p) ouvrirStruct(i); });
    }
    g.appendChild(cell);
  });
  const pa=document.querySelector("#plot-actions"); if(!pa) return; pa.innerHTML="";
  const p = plotSel!=null ? etat.terrain.parcelles[plotSel] : null;
  if(plotSel==null){ pa.innerHTML=`<p class="vide">Clique une case vide pour bâtir, ou une structure pour l'ouvrir.</p>`; return; }
  if(!p){
    const row=document.createElement("div"); row.className="actions";
    pa.innerHTML=`<p style="margin:0 0 8px">Parcelle ${plotSel+1} — construire :</p>`;
    if(etat.maison.plot==null){ const b=document.createElement("button"); b.className="achat"; b.innerHTML=`<span>Logement <small>(construction par étapes)</small></span><span class="cout">choisir l'emplacement</span>`; b.addEventListener("click",()=>placerMaison(plotSel)); row.appendChild(b); }
    for(const t in STRUCTURES){ const s=STRUCTURES[t]; const b=document.createElement("button"); b.className="achat"; b.innerHTML=`<span>${s.nom} <small>(${s.desc})</small></span><span class="cout">${s.prix} ₡</span>`; b.disabled=etat.credits<s.prix; b.addEventListener("click",()=>batirParcelle(t)); row.appendChild(b); }
    pa.appendChild(row); return;
  }
  if(p.type==="maison"){ pa.innerHTML=`<p class="vide"><b>${etat.maison.chantier?"Chantier de logement":nomPalier(etat.maison.palier)}</b> — gère-le dans le sous-onglet <b>Maison</b>.</p>`; return; }
  pa.innerHTML=`<p class="vide"><b>${STRUCTURES[p.type].nom}</b> — clique la structure pour l'ouvrir.</p>`;
}

