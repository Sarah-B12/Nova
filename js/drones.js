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
// Jours restants avant qu'un drone installé ne lâche (null si date inconnue).
function joursRestantsDrone(dr){
  if(!dr || !dr.pose || typeof dureeVie!=="function") return null;
  return Math.max(0, dureeVie(DRONE_ITEMS[dr.type]) - (Date.now()-dr.pose)/JOUR_MS);
}
function cibleTypeDrone(type){ return type==="recolte" ? "biodome" : "enclos"; }

/* ---------- Installation / assignation ---------- */
/* v1.35 — pose, assignation et retrait passent par le serveur (drone_poser,
   drone_assigner, drone_retirer), qui renvoie le terrain à jour.
   Décision de l'autrice (29/09) : RETIRER est refusé si le sac est plein
   (avant : le drone était détruit). */
async function placerDrone(si, type){
  const iid = DRONE_ITEMS[type]; if((etat.sac[iid]||0)<=0) return;
  if(typeof verifierNiveau==="function" && !verifierNiveau(iid)) return;   // v1.33 : niveau requis
  const p = etat.terrain.parcelles[structSel]; if(!p || p.type!=="hangar" || p.drones[si]) return;
  if(!await terrainRpc("drone_poser", { p_plot:structSel, p_slot:si, p_type:type })) return;
  journal(`${nomDrone(type)} installé dans le hangar. Assigne-lui une parcelle.`,"gain");
  apresAction(); majStruct();
}
async function assignerDrone(si, idx){
  const p = etat.terrain.parcelles[structSel]; const dr = p && p.drones[si]; if(!dr) return;
  const cible = etat.terrain.parcelles[idx];
  if(!cible || cible.type !== cibleTypeDrone(dr.type)) return;
  if(!await terrainRpc("drone_assigner", { p_plot:structSel, p_slot:si, p_cible:idx })) return;
  journal(`${nomDrone(dr.type)} assigné à la parcelle ${idx+1}.`,"gain");
  apresAction(); majStruct();
}
async function retirerDrone(si){
  const p = etat.terrain.parcelles[structSel]; const dr = p && p.drones[si]; if(!dr) return;
  if(placesLibres() < 1){ journal(`Sac plein : fais une place avant de retirer le ${nomDrone(dr.type)}.`,"alerte"); return; }
  if(!await terrainRpc("drone_retirer", { p_plot:structSel, p_slot:si },
       { refus:{ sac_plein:`Sac plein : fais une place avant de retirer le ${nomDrone(dr.type)}.` } })) return;
  journal(`${nomDrone(dr.type)} retiré (rangé dans le sac).`,"alerte");
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
        if(has>0){ any=true; const b=document.createElement("button"); b.className="mini"; b.textContent=`Placer ${nomDrone(type)} (×${has})` + ((typeof niveauSuffisant==="function" && !niveauSuffisant(DRONE_ITEMS[type])) ? ` — niveau ${niveauRequis(DRONE_ITEMS[type])} requis` : "");   /* v1.33 */ b.addEventListener("click",()=>placerDrone(si,type)); row.appendChild(b); } }
      if(!any){ const n=document.createElement("p"); n.className="vide"; n.style.margin="0"; n.textContent="Fabrique un Drone de récolte ou d'élevage (Ingénieur) pour l'installer ici."; slot.appendChild(n); }
      else slot.appendChild(row);
    } else {
      const cible = dr.cible!=null ? etat.terrain.parcelles[dr.cible] : null;
      const ok = cible && cible.type === cibleTypeDrone(dr.type);
      const t = document.createElement("div"); t.className="drone-tete";
      const ic = (typeof iconeItem==="function") ? iconeItem(DRONE_ITEMS[dr.type]) : "";
      const jr = (typeof joursRestantsDrone==="function") ? joursRestantsDrone(dr) : null;
      const usure = (jr!=null) ? ` <span class="usure ${jr<1?"critique":""}">${Math.ceil(jr)}j</span>` : "";
      t.innerHTML = `<span class="drone-ic">${ic}</span><b>${nomDrone(dr.type)}</b>${usure} — ${ok ? `parcelle ${dr.cible+1} (${STRUCTURES[cible.type].nom})` : `<span style="color:var(--coral)">non assigné</span>`}`;
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
/* v1.35 — LE PASSAGE DES DRONES SE FAIT AU SERVEUR, EN UN SEUL APPEL
   (`terrain_drones`), au lieu d'un `drone_agir` par case. Les règles de la
   v0.94 y sont reprises à l'identique : récolte = arroser puis récolter ;
   élevage = nourrir (1 Ferragave par jeune) puis tondre ; coffre d'abord, sac
   seulement sur Silène ; une récolte sans place attend sur pied ; une raison
   de ne rien faire n'est dite qu'une fois par jour ; niveau requis (v1.33).
   Ici, on ne fait que :
   1. décider s'il y a un drone À FAIRE PASSER (sinon aucun appel — majDrones
      part à chaque afficher()) : mêmes conditions que le serveur (hangar et
      cible pas à l'arrêt, cible du bon type, pas déjà passé ni déjà
      excusé aujourd'hui) ;
   2. tirer les lots (récolte, tonte) pour chaque case des cibles — le
      serveur les borne ;
   3. mettre au journal les messages renvoyés.
   ⚠ `_dronesOccupe` : deux passages ne doivent pas se chevaucher.
   ⚠ `_terrainSynchro` : pas avant la première lecture du terrain serveur. */
let _dronesOccupe = false;
let _droneNiveauDit = false;   // v1.33 : message « niveau requis » déjà donné cette session
let _droneProchain = 0;        // pas de nouvel essai avant (refus de niveau, erreur)

function _dronesAFaire(){
  const parcelles = etat.terrain.parcelles;
  const hs = (i) => (typeof structureHS==="function") && structureHS(i);
  return parcelles.some((p, i) => p && p.type==="hangar" && Array.isArray(p.drones) && !hs(i)
    && p.drones.some(dr => {
      if(!dr || dr.cible==null || memeJour(dr.maj) || memeJour(dr.vu)) return false;
      const c = parcelles[dr.cible];
      return !!c && !hs(dr.cible) && c.type === cibleTypeDrone(dr.type);
    }));
}
function _dronesTirages(){
  const t = {};
  etat.terrain.parcelles.forEach((p, i) => {
    if(!p || !Array.isArray(p.cases)) return;
    p.cases.forEach((c, ci) => {
      if(!c) return;
      if(p.type==="biodome"){ const r = aptBiodomeRecolte(); t[`${i}:${ci}`] = aptStructureLot(alea(r.min, r.max)); }
      else if(p.type==="enclos") t[`${i}:${ci}`] = aptStructureLot(alea(2,3) + aptTonteBonus());
    });
  });
  return t;
}

async function majDrones(){
  if(_dronesOccupe) return;
  if(!etat || !etat.inscrit) return;
  /* ⚠ LA GARDE QUI MANQUAIT (v0.94) : tant que `sac_lire()` n'a pas répondu,
     les stocks sont vides. Et depuis la v1.35, tant que le terrain serveur
     n'est pas lu, on ne sait pas quels drones sont installés. */
  if(!etat._lotsSynchro || typeof _terrainSynchro==="undefined" || !_terrainSynchro) return;
  if(!etat.terrain || !Array.isArray(etat.terrain.parcelles)) return;
  if(Date.now() < _droneProchain || !_dronesAFaire()) return;
  if(typeof sb === "undefined" || !sb) return;
  _dronesOccupe = true;
  try{
    const { data, error } = await sb.rpc("terrain_drones", { p_tirages: _dronesTirages() });
    if(error || !data || !data.ok){
      console.warn("[drone] terrain_drones :", error ? error.message : data);
      _droneProchain = Date.now() + 5 * 60 * 1000;   // on ne martèle pas le serveur
      return;
    }
    if(data.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
    if(data.terrain && typeof appliquerTerrainServeur === "function") appliquerTerrainServeur(data.terrain);
    (data.messages || []).forEach(m => journal(m.texte, m.cat || "gain"));
    /* v1.33 — sous le niveau du drone, le serveur ne produit rien et ne marque
       pas le drone : on le dit UNE fois par session et on n'insiste pas. */
    if(data.niveau){
      if(!_droneNiveauDit){
        _droneNiveauDit = true;
        journal(`Tes drones ne travaillent pas : niveau ${data.niveau.requis} requis (tu es niveau ${data.niveau.niveau || etat.niveau}).`, "alerte");
      }
      _droneProchain = Date.now() + 10 * 60 * 1000;
    }
    if((data.messages || []).length && typeof afficher === "function") afficher();
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "drones.js#majDrones"); _droneProchain = Date.now() + 5 * 60 * 1000; }
  finally { _dronesOccupe = false; }
}
