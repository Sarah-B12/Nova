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
async function placerDrone(si, type){
  const iid = DRONE_ITEMS[type]; if((etat.sac[iid]||0)<=0) return;
  const p = etat.terrain.parcelles[structSel]; if(!p || p.type!=="hangar" || p.drones[si]) return;
  if(!await agirServeur({ retirer:{ [iid]:1 }, motif:"drone_poser" })) return;
  p.drones[si] = { type, cible:null, maj:0, pose:Date.now() };   // pose = date d'usure
  journal(`${nomDrone(type)} installé dans le hangar. Assigne-lui une parcelle.`,"gain");
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant(); majStruct();
}
function assignerDrone(si, idx){
  const p = etat.terrain.parcelles[structSel]; const dr = p && p.drones[si]; if(!dr) return;
  const cible = etat.terrain.parcelles[idx];
  if(!cible || cible.type !== cibleTypeDrone(dr.type)) return;
  dr.cible = idx; dr.maj = 0;   // agira dès le prochain rafraîchissement
  journal(`${nomDrone(dr.type)} assigné à la parcelle ${idx+1}.`,"gain");
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant(); majStruct();
}
async function retirerDrone(si){
  const p = etat.terrain.parcelles[structSel]; const dr = p && p.drones[si]; if(!dr) return;
  const iid = DRONE_ITEMS[dr.type];
  const rr = await agirServeur({ ajouter:{ [iid]:1 }, motif:"drone_retirer" });
  if(rr && (rr.ajoutes||{})[iid]) journal(`${nomDrone(dr.type)} retiré (rangé dans le sac).`,"alerte");
  else journal(`${nomDrone(dr.type)} détruit (sac plein).`,"alerte");
  p.drones[si] = null;
  apresAction(); if(typeof sauverMaintenant==="function") sauverMaintenant(); majStruct();
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
/* ⚠⚠ v0.94 — LE DRONE D'ÉLEVAGE NE S'ACTIVAIT JAMAIS. Trois causes, et
   aucune ne levait la moindre erreur :

   1. IL NE TONDAIT PAS. Il ne savait que nourrir. Une fois les bêtes adultes,
      il répondait « aucun jeune à nourrir » et s'arrêtait là — pour toujours,
      puisqu'un adulte ne redevient pas jeune. Vu du joueur : un automate
      installé, assigné, et définitivement muet.
   2. IL NE VOYAIT QUE LE SAC. `agir()` code 'sac' en dur (BACKEND_PLAN §7) ;
      la Ferragave rangée au coffre — c'est-à-dire l'usage normal — lui était
      invisible.
   3. IL TOURNAIT TROP TÔT. `afficher()` est appelée ~1,2 s avant que
      `syncApresConnexion()` n'ait lu les stocks : le sac était vide, le drone
      concluait « pas de Ferragave », posait `dr.vu`, et se taisait pour la
      JOURNÉE — y compris quand il aurait vraiment eu quelque chose à dire.

   Le drone passe donc par `drone_agir()` : coffre d'abord, sac ensuite, et le
   sac SEULEMENT sur Silène (hors de Silène, le sac est en orbite avec le
   joueur). Conséquence voulue : hors Silène + coffre plein = pas de tonte,
   et rien n'est débité.

   ⚠ `_dronesOccupe` : `majDrones()` part à chaque `afficher()`. Elle est
     asynchrone, deux passes se chevaucheraient et nourriraient deux fois. */
let _dronesOccupe = false;

function _droneSurSilene(){ return !(typeof horsSilene==="function" && horsSilene()); }   // v0.98 : La Braise aussi
// Ce que le drone peut PRENDRE : le coffre, plus le sac si le joueur est sur Silène.
function _droneDispo(id){
  return ((etat.coffre && etat.coffre[id]) || 0)
       + (_droneSurSilene() ? ((etat.sac && etat.sac[id]) || 0) : 0);
}
// Ce que le drone peut POSER, même règle. Le serveur revérifie : ceci n'est
// qu'un garde-fou d'affichage, pour ne pas tenter un appel voué à l'échec.
function _dronePlaces(){
  const coffre = Math.max(0, ((typeof capaciteMaison==="function") ? capaciteMaison() : 0)
                            - ((typeof itemsCoffre==="function") ? itemsCoffre() : 0));
  const sac = _droneSurSilene() ? Math.max(0, (typeof placesLibres==="function") ? placesLibres() : 0) : 0;
  return coffre + sac;
}
/* Appel unique vers le serveur. Renvoie la réponse, ou null si refusée.
   ⚠ Pas de `.catch` sur `sb.rpc` : l'objet renvoyé n'a que `then` (v0.94). */
async function droneStock(retirer, ajouter, motif){
  if(typeof sb === "undefined" || !sb) return null;
  try{
    const { data, error } = await sb.rpc("drone_agir",
      { p_retirer: retirer || {}, p_ajouter: ajouter || {}, p_motif: motif || null });
    if(error){ console.warn("[drone] drone_agir :", error.message, "| motif :", motif); return null; }
    if(!data || !data.ok){ console.warn("[drone] refus :", data, "| motif :", motif); return null; }
    if(typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
    return data;
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "drones.js#droneStock"); return null; }
}
// « au coffre » / « dans ton sac » / « au coffre et dans ton sac » — le joueur
// doit savoir OÙ chercher ce que le drone a ramené.
function _droneOu(r){
  if(!r) return "";
  if(r.au_coffre && r.au_sac) return " (au coffre et dans ton sac)";
  if(r.au_sac)   return " (dans ton sac)";
  if(r.au_coffre) return " (au coffre)";
  return "";
}

async function majDrones(){
  if(_dronesOccupe) return;
  if(!etat || !etat.inscrit) return;
  /* ⚠ LA GARDE QUI MANQUAIT. Tant que `sac_lire()` n'a pas répondu, `etat.sac`
     et `etat.coffre` sont vides : le drone croirait n'avoir aucune Ferragave. */
  if(!etat._lotsSynchro) return;
  if(!etat.terrain || !Array.isArray(etat.terrain.parcelles)) return;
  _dronesOccupe = true;
  let agi = false;
  try{
    const parcelles = etat.terrain.parcelles;
    for(let i=0;i<parcelles.length;i++){
      const p = parcelles[i];
      if(!p || p.type!=="hangar" || !Array.isArray(p.drones)) continue;
      // v0.91 : hangar à l'arrêt = les drones ne sortent pas.
      if(typeof structureHS==="function" && structureHS(i)) continue;
      for(const dr of p.drones){
        if(!dr || dr.cible==null || memeJour(dr.maj)) continue;
        const cible = parcelles[dr.cible];
        if(!cible) continue;   // parcelle cible démolie
        // …ni sur une parcelle à l'arrêt : rien n'y pousse, rien n'y mange.
        if(typeof structureHS==="function" && structureHS(dr.cible)) continue;
        let fait = null;
        // v0.94 : le coffre est sa réserve ET son dépôt. Logement à l'arrêt,
        // plus de coffre : le drone s'arrête et le DIT.
        if(typeof maisonHS==="function" && maisonHS()){
          fait = { agi:false, raison:"ton logement est à l'arrêt : plus d'accès au coffre. Répare-le." };
        }
        else if(dr.type==="recolte" && cible.type==="biodome")      fait = await droneRecolte(cible);
        else if(dr.type==="elevage" && cible.type==="enclos")       fait = await droneElevage(cible);
        else continue;
        if(fait && fait.agi){ dr.maj = Date.now(); agi = true; }
        else if(fait && fait.raison && !memeJour(dr.vu)){
          dr.vu = Date.now(); agi = true;   // on enregistre pour ne pas répéter demain matin
          journal(`${nomDrone(dr.type)} : ${fait.raison}`, "alerte");
        }
      }
    }
  } finally { _dronesOccupe = false; }
  if(agi && typeof sauvegarder==="function") sauvegarder();
}

/* Renvoie { agi, raison } : `agi` vrai si quelque chose a été fait, sinon
   `raison` explique au joueur pourquoi rien n'a bougé. */
async function droneRecolte(p){
  let agi = false, plusDePlace = false;
  // arrose ce qui pousse (et n'a pas déjà été arrosé aujourd'hui)
  p.cases.forEach(c=>{ if(c && c.croissance<PLANT_MAX && !memeJour(c.arrose)){ c.croissance=Math.min(PLANT_MAX, c.croissance + aptCroissance(plante(c.plante).croissance)); c.arrose=Date.now(); agi=true; } });
  // récolte ce qui est mûr
  for(let i=0;i<p.cases.length;i++){
    const c = p.cases[i];
    if(!c || c.croissance < PLANT_MAX) continue;
    const r = aptBiodomeRecolte(); const nb = aptStructureLot(alea(r.min, r.max));
    /* ⚠ v0.59 — place insuffisante : la case était vidée quand même, la récolte
       perdue. La plante attend désormais sur pied ; un seul avertissement. */
    if(_dronePlaces() < nb){
      plusDePlace = true;
      if(!c._attente){ c._attente=true; journal(`Drone de récolte : plus de place (coffre${_droneSurSilene()?" et sac":""}), ${plante(c.plante).nom} laissée sur pied (${nb} places nécessaires).`,"alerte"); }
      continue;
    }
    const res = await droneStock(null, { [c.plante]:nb }, "drone_recolte");
    if(!res){ plusDePlace = true; break; }   // refus serveur : inutile d'insister
    const pr = (res.ajoutes||{})[c.plante] || 0;
    if(pr>0){ journal(`Drone de récolte : +${pr} ${plante(c.plante).nom}${_droneOu(res)}.`,"gain"); p.cases[i]=null; agi=true; }
  }
  if(agi) return { agi:true };
  if(plusDePlace) return { agi:false, raison:_droneSurSilene()
      ? "plus de place au coffre ni dans ton sac : la récolte attend sur pied."
      : "coffre plein, et tu n'es pas sur Silène : la récolte attend sur pied." };
  const vide = !p.cases.some(c=>c);
  return { agi:false, raison: vide ? "le bio-dôme est vide, rien à arroser ni à récolter."
                                   : "rien à faire aujourd'hui (tout est déjà arrosé, et rien n'est mûr)." };
}

/* NOURRIR puis TONDRE — c'est la seconde moitié qui manquait. Un enclos
   d'adultes ne produisait plus rien tant que le joueur ne tondait pas à la
   main, et le drone se déclarait sans travail. */
async function droneElevage(p){
  const jeunes = [], adultes = [];
  p.cases.forEach((c, ci)=>{
    if(!c) return; const a = animal(c.animal); if(!a) return;
    if((c.repas||0) < a.repasAdulte) jeunes.push(ci);
    else if(!memeJour(c.tonte) && (c.tontes||0) < TONTES_MAX) adultes.push(ci);
  });
  let agi = false, manqueFerra = false, plusDePlace = false;

  // 1. Nourrir : 1 Ferragave par jeune, dans la limite de ce qui est en réserve.
  if(jeunes.length){
    const n = Math.min(jeunes.length, _droneDispo("ferragave"));
    if(n > 0){
      const res = await droneStock({ ferragave:n }, null, "drone_nourrir");
      if(res){
        for(let i=0;i<n;i++){ const c = p.cases[jeunes[i]]; if(c) c.repas = (c.repas||0) + 1; }
        journal(`Drone d'élevage : ${n} repas de Ferragave distribué(s).`,"gain");
        agi = true;
      }
    } else manqueFerra = true;
  }

  // 2. Tondre les adultes, une fois par jour, comme à la main.
  for(const ci of adultes){
    const c = p.cases[ci]; if(!c) continue;
    const a = animal(c.animal); if(!a) continue;
    const nb = aptStructureLot(alea(2,3) + aptTonteBonus());
    if(_dronePlaces() < nb){ plusDePlace = true; break; }
    const res = await droneStock(null, { [a.produit]:nb }, "drone_tonte");
    if(!res){ plusDePlace = true; break; }
    const pr = (res.ajoutes||{})[a.produit] || 0;
    c.tontes = (c.tontes||0) + 1; c.tonte = Date.now(); agi = true;
    let msg = `Drone d'élevage : tonte, +${pr} ${item(a.produit).nom}${_droneOu(res)} — ${c.tontes}/${TONTES_MAX}.`;
    if(c.tontes >= TONTES_MAX){ p.cases[ci] = null; msg += ` Le ${a.nom} a pris sa retraite.`; }
    journal(msg, "gain");
  }

  if(agi) return { agi:true };
  if(plusDePlace) return { agi:false, raison:_droneSurSilene()
      ? "plus de place au coffre ni dans ton sac : la tonte attend."
      : "coffre plein, et tu n'es pas sur Silène : impossible de tondre." };
  if(manqueFerra) return { agi:false, raison:_droneSurSilene()
      ? "pas de Ferragave, ni au coffre ni dans ton sac."
      : "pas de Ferragave au coffre (tu n'es pas sur Silène : ton sac ne compte pas)." };
  if(jeunes.length===0 && adultes.length===0)
    return { agi:false, raison:"rien à faire aujourd'hui (aucun jeune à nourrir, et les adultes sont déjà tondus)." };
  return { agi:false, raison:"rien n'a pu être fait aujourd'hui." };
}
