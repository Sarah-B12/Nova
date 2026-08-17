/* ===========================================================
   DRONES — Hangar à drones (structure à 2 emplacements).
   - Drone de récolte  : arrose ET récolte UN bio-dôme assigné (1×/jour).
   - Drone d'élevage   : nourrit (Ferragave) UN enclos assigné (1×/jour).
   Les drones sont des objets fabriqués (Ingénieur) qu'on installe dans le hangar
   depuis le sac, puis qu'on assigne à une parcelle bio-dôme/enclos.
   Modèle : parcelle { type:"hangar", drones:[slot0, slot1] }
            slot = null | { type:"recolte"|"elevage", cible:<index parcelle>, maj:<ts> }
   =========================================================== */
const DRONE_ITEMS = { recolte:"fab_drone_de_recolte", elevage:"fab_drone_d_elevage" };
function nomDrone(type){ return type==="recolte" ? "Drone de récolte" : "Drone d'élevage"; }
function cibleTypeDrone(type){ return type==="recolte" ? "biodome" : "enclos"; }

/* ---------- Installation / assignation ---------- */
function placerDrone(si, type){
  const iid = DRONE_ITEMS[type]; if((etat.sac[iid]||0)<=0) return;
  const p = etat.terrain.parcelles[structSel]; if(!p || p.type!=="hangar" || p.drones[si]) return;
  retirerDuSac(iid, 1);
  p.drones[si] = { type, cible:null, maj:0 };
  journal(`${nomDrone(type)} installé dans le hangar. Assigne-lui une parcelle.`,"gain");
  apresAction(); majStruct();
}
function assignerDrone(si, idx){
  const p = etat.terrain.parcelles[structSel]; const dr = p && p.drones[si]; if(!dr) return;
  const cible = etat.terrain.parcelles[idx];
  if(!cible || cible.type !== cibleTypeDrone(dr.type)) return;
  dr.cible = idx; dr.maj = 0;   // agira dès le prochain rafraîchissement
  journal(`${nomDrone(dr.type)} assigné à la parcelle ${idx+1}.`,"gain");
  apresAction(); majStruct();
}
function retirerDrone(si){
  const p = etat.terrain.parcelles[structSel]; const dr = p && p.drones[si]; if(!dr) return;
  const iid = DRONE_ITEMS[dr.type];
  if(placesLibres()>0){ ajouterAuSac(iid,1); journal(`${nomDrone(dr.type)} retiré (rangé dans le sac).`,"alerte"); }
  else journal(`${nomDrone(dr.type)} détruit (sac plein).`,"alerte");
  p.drones[si] = null;
  apresAction(); majStruct();
}

/* ---------- Rendu de la vue hangar (#struct-corps) ---------- */
function renderHangar(corps){
  const p = etat.terrain.parcelles[structSel];
  corps.innerHTML = `<p class="vide" style="margin:0 0 12px">Deux emplacements. Un <b>drone de récolte</b> arrose et récolte un bio-dôme ; un <b>drone d'élevage</b> nourrit un enclos avec ta Ferragave. Action automatique 1×/jour.</p>`;
  const wrap = document.createElement("div"); wrap.className = "drone-slots";
  p.drones.forEach((dr, si)=>{
    const slot = document.createElement("div"); slot.className = "drone-slot";
    if(!dr){
      const t = document.createElement("div"); t.className="drone-tete"; t.textContent = `Emplacement ${si+1} — libre`; slot.appendChild(t);
      const row = document.createElement("div"); row.className="actions"; let any=false;
      for(const type in DRONE_ITEMS){ const has = etat.sac[DRONE_ITEMS[type]]||0;
        if(has>0){ any=true; const b=document.createElement("button"); b.className="mini"; b.textContent=`Placer ${nomDrone(type)} (×${has})`; b.addEventListener("click",()=>placerDrone(si,type)); row.appendChild(b); } }
      if(!any){ const n=document.createElement("p"); n.className="vide"; n.style.margin="0"; n.textContent="Fabrique un Drone de récolte ou d'élevage (Ingénieur) pour l'installer ici."; slot.appendChild(n); }
      else slot.appendChild(row);
    } else {
      const cible = dr.cible!=null ? etat.terrain.parcelles[dr.cible] : null;
      const ok = cible && cible.type === cibleTypeDrone(dr.type);
      const t = document.createElement("div"); t.className="drone-tete";
      t.innerHTML = `<b>${nomDrone(dr.type)}</b> — ${ok ? `parcelle ${dr.cible+1} (${STRUCTURES[cible.type].nom})` : `<span style="color:var(--coral)">non assigné</span>`}`;
      slot.appendChild(t);
      const ct = cibleTypeDrone(dr.type);
      const dispo = etat.terrain.parcelles.map((pp,idx)=>({pp,idx})).filter(o=>o.pp && o.pp.type===ct);
      const row = document.createElement("div"); row.className="actions";
      dispo.forEach(o=>{ const b=document.createElement("button"); b.className="mini"+(dr.cible===o.idx?" actif":""); b.textContent=`Parcelle ${o.idx+1}`; b.addEventListener("click",()=>assignerDrone(si,o.idx)); row.appendChild(b); });
      if(dispo.length===0){ const n=document.createElement("span"); n.className="vide"; n.textContent=`Aucun ${ct==="biodome"?"bio-dôme":"enclos"} à assigner.`; row.appendChild(n); }
      const bdel=document.createElement("button"); bdel.className="mini danger"; bdel.textContent="Retirer"; bdel.addEventListener("click",()=>retirerDrone(si)); row.appendChild(bdel);
      slot.appendChild(row);
    }
    wrap.appendChild(slot);
  });
  corps.appendChild(wrap);
}

/* ---------- Automatisation (appelée dans afficher()) ---------- */
function majDrones(){
  if(!etat.terrain || !Array.isArray(etat.terrain.parcelles)) return;
  let agi = false;
  etat.terrain.parcelles.forEach(p=>{
    if(!p || p.type!=="hangar" || !Array.isArray(p.drones)) return;
    p.drones.forEach(dr=>{
      if(!dr || dr.cible==null || memeJour(dr.maj)) return;
      const cible = etat.terrain.parcelles[dr.cible];
      if(!cible) return;   // parcelle cible démolie
      if(dr.type==="recolte" && cible.type==="biodome"){ droneRecolte(cible); dr.maj=Date.now(); agi=true; }
      else if(dr.type==="elevage" && cible.type==="enclos"){ droneElevage(cible); dr.maj=Date.now(); agi=true; }
    });
  });
  if(agi && typeof sauvegarder==="function") sauvegarder();
}
function droneRecolte(p){
  // arrose ce qui pousse (et n'a pas déjà été arrosé aujourd'hui)
  p.cases.forEach(c=>{ if(c && c.croissance<PLANT_MAX && !memeJour(c.arrose)){ c.croissance=Math.min(PLANT_MAX, c.croissance + aptCroissance(plante(c.plante).croissance)); c.arrose=Date.now(); } });
  // récolte ce qui est mûr
  p.cases.forEach((c,i)=>{ if(c && c.croissance>=PLANT_MAX){ const r=aptBiodomeRecolte(); const nb=aptStructureLot(alea(r.min,r.max)); let pr=0; for(let k=0;k<nb;k++){ if(placesLibres()<=0)break; ajouterAuSac(c.plante,1); pr++; } if(pr>0) journal(`Drone de récolte : +${pr} ${plante(c.plante).nom}.`,"gain"); p.cases[i]=null; } });
}
function droneElevage(p){
  let fed=0;
  p.cases.forEach(c=>{ if(c){ const a=animal(c.animal); if(c.repas<a.repasAdulte && (etat.sac["ferragave"]||0)>0){ retirerDuSac("ferragave",1); c.repas++; fed++; } } });
  if(fed>0) journal(`Drone d'élevage : ${fed} repas de Ferragave distribué(s).`,"gain");
}
