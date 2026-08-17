/* ===========================================================
   EQUIPEMENT — 6 emplacements sur le corps (hologramme).
   tete (casque) · torse (plastron) · jambes (jambières) · arme (mains) ·
   drone (droite tête : combat/récupérateur) · implant (gauche tête).
   Un objet par emplacement. Équiper sort l'objet du sac ; déséquiper le rend.
   Les effets (ci-dessous) sont un BROUILLON à ajuster : ils se cumulent avec
   les aptitudes via forceEffective / coutO2 / resoudreCombat / le butin.
   =========================================================== */

// Emplacements : position sur le corps en % (centrés), pour se caler sur l'image.
const EQUIP_SLOTS = [
  { id:"implant", nom:"Implant",  cat:"implant", x:12, y:14 },
  { id:"tete",    nom:"Casque",   cat:"tete",    x:50, y:18 },
  { id:"drone",   nom:"Drone",    cat:"drone",   x:88, y:14 },
  { id:"arme",    nom:"Arme",     cat:"arme",    x:12, y:36 },
  { id:"arme2",   nom:"Arme",     cat:"arme",    x:88, y:36 },
  { id:"torse",   nom:"Plastron", cat:"torse",   x:50, y:40 },
  { id:"jambes",  nom:"Jambières",cat:"jambes",  x:50, y:62 }
];
// Armes à deux mains : occupent les deux emplacements (pas de double).
const ARME_DEUX_MAINS = new Set(["fab_fusil_a_ions","fab_canon_a_singularite"]);
function estDeuxMains(id){ return ARME_DEUX_MAINS.has(id); }
function autreArme(slotId){ return slotId==="arme" ? "arme2" : (slotId==="arme2" ? "arme" : null); }
function armeSlotBloque(slotId){ const a=autreArme(slotId); return !!(a && etat.equipement[a] && estDeuxMains(etat.equipement[a])); }

// À quel emplacement va un objet (ou null si non équipable).
function slotEquip(id){
  const it = item(id); if(!it) return null;
  const n = (it.nom||"").toLowerCase();
  if(n.includes("casque")) return "tete";
  if(n.includes("plastron")) return "torse";
  if(n.includes("jambi")) return "jambes";
  if(n.includes("implant")) return "implant";
  if(n.includes("drone de combat") || n.includes("drone récupérateur") || n.includes("drone recuperateur")) return "drone";
  if(/couteau|pistolet|lame|fusil|canon/.test(n)) return "arme";
  return null;
}

// Effets (BROUILLON) : force/agi/int = +compétence ; degats = multiplicateur de dégâts subis
// (0.9 = −10 %) ; o2 = +coût O₂ par action ; esquive = +% d'esquive ; double = +% de doubler une trouvaille.
const EQUIP_EFFETS = {
  fab_casque_leger:        { degats:0.94 },
  fab_casque_lourd:        { degats:0.88, o2:1 },
  fab_plastron_leger:      { degats:0.90 },
  fab_plastron_lourd:      { degats:0.80, o2:1 },
  fab_jambieres_legeres:   { esquive:8 },
  fab_jambieres_lourdes:   { degats:0.92, o2:1 },
  fab_couteau_de_survie:   { force:2, agi:2 },
  fab_pistolet_cinetique:  { force:4 },
  fab_lame_a_plasma:       { force:3, agi:3 },
  fab_pistolet_a_plasma:   { force:8 },
  fab_fusil_a_ions:        { force:11 },
  fab_lame_a_singularite:  { force:12, agi:8, o2:1 },
  fab_canon_a_singularite: { force:18, o2:2 },
  fab_drone_de_combat:     { force:8 },
  fab_drone_recuperateur:  { double:15 },
  fab_implant_de_force:    { force:10 },
  fab_implant_d_agilite:   { agi:10 },
  fab_implant_maitre:      { force:5, agi:5, int:5 }
};

/* ---------- Cumul des effets équipés ---------- */
function _equipEffets(){ return Object.values(etat.equipement||{}).filter(Boolean).map(id=>EQUIP_EFFETS[id]||{}); }
// Texte lisible des effets d'un objet (pour l'infobulle / le sélecteur).
function effetTexte(id){
  const e = EQUIP_EFFETS[id]; if(!e) return "";
  const p=[];
  if(e.force)   p.push(`+${e.force} Force`);
  if(e.agi)     p.push(`+${e.agi} Agilité`);
  if(e.int)     p.push(`+${e.int} Intelligence`);
  if(e.degats)  p.push(`dégâts subis −${Math.round((1-e.degats)*100)} %`);
  if(e.esquive) p.push(`+${e.esquive} % esquive`);
  if(e.double)  p.push(`+${e.double} % double trouvaille`);
  if(e.o2)      p.push(`+${e.o2} O₂/action`);
  return p.join(" · ");
}
function equipForce(){ return _equipEffets().reduce((s,e)=>s+(e.force||0),0); }
function equipAgi(){ return _equipEffets().reduce((s,e)=>s+(e.agi||0),0); }
function equipInt(){ return _equipEffets().reduce((s,e)=>s+(e.int||0),0); }
function equipO2(){ return _equipEffets().reduce((s,e)=>s+(e.o2||0),0); }
function equipDegatsMult(){ return _equipEffets().reduce((m,e)=>m*(e.degats||1),1); }
function equipEsquive(){ return _equipEffets().reduce((s,e)=>s+(e.esquive||0),0); }
function equipDouble(){ return _equipEffets().reduce((s,e)=>s+(e.double||0),0); }

/* ---------- Équiper / déséquiper ---------- */
function equiper(id, slot){
  const cat = slotEquip(id); if(!cat) return;
  slot = slot || cat;                                        // par défaut : emplacement = catégorie (case unique)
  const sdef = EQUIP_SLOTS.find(s=>s.id===slot); if(!sdef || sdef.cat!==cat) return;
  if((etat.sac[id]||0)<=0) return;
  if(cat==="arme"){
    if(estDeuxMains(id)){                                    // deux mains : occupe cette main, libère l'autre
      const autre = autreArme(slot); if(autre && etat.equipement[autre]) desequiper(autre, true);
    } else if(armeSlotBloque(slot)){                         // l'autre main tient déjà une arme à deux mains
      journal("Une arme à deux mains occupe déjà les deux mains.","alerte"); return;
    }
  }
  if(etat.equipement[slot]) desequiper(slot, true);          // libère l'emplacement d'abord
  retirerDuSac(id, 1);
  etat.equipement[slot] = id;
  journal(`${item(id).nom} équipé.`,"gain");
  apresAction(); majEquipement();
}
function desequiper(slot, silencieux){
  const id = etat.equipement[slot]; if(!id) return;
  if(placesLibres()>0){ ajouterAuSac(id,1); if(!silencieux) journal(`${item(id).nom} retiré (rangé dans le sac).`); }
  else { if(!silencieux) journal("Sac plein — impossible de déséquiper.","alerte"); return; }
  etat.equipement[slot] = null;
  if(!silencieux){ apresAction(); majEquipement(); }
}

/* ---------- Rendu : corps centré + sélecteur au clic ---------- */
function majEquipement(){
  const z = document.querySelector("#equip-vue"); if(!z) return;
  monterPickerEquip();
  let html = `<div class="equip-corps-wrap"><div class="equip-corps">`;
  for(const s of EQUIP_SLOTS){
    const id = etat.equipement[s.id];
    const bloque = (s.cat==="arme" && !id && armeSlotBloque(s.id));
    html += `<div class="equip-slot${id?" plein":""}${bloque?" bloque":""}" data-slot="${s.id}" style="left:${s.x}%;top:${s.y}%" title="${bloque?"Occupé par une arme à deux mains":s.nom+(id?" : "+item(id).nom+" — "+effetTexte(id):"")}">`
      + (id ? `<span class="icone">${iconeItem(id)}</span>` : `<span class="equip-lbl">${bloque?"2 mains":s.nom}</span>`)
      + `</div>`;
  }
  html += `</div></div>`;
  z.innerHTML = html;
  z.querySelectorAll(".equip-slot").forEach(el=>el.addEventListener("click",()=>ouvrirPicker(el.dataset.slot)));
}

let _pickerMonte = false;
function monterPickerEquip(){
  if(_pickerMonte) return;
  const m = document.createElement("div"); m.id="equip-picker"; m.hidden=true;
  document.body.appendChild(m);
  m.addEventListener("click", e=>{ if(e.target===m) m.hidden=true; });
  _pickerMonte = true;
}
function ouvrirPicker(slot){
  monterPickerEquip();
  const m = document.querySelector("#equip-picker"); const s = EQUIP_SLOTS.find(x=>x.id===slot);
  const equipe = etat.equipement[slot];
  // Seconde main bloquée par une arme à deux mains
  if(s.cat==="arme" && !equipe && armeSlotBloque(slot)){
    m.innerHTML = `<div class="picker-cadre"><div class="picker-tete"><b>${s.nom}</b><button class="mini" data-fermer="1">Fermer</button></div><p class="vide" style="margin:6px 0 0">Occupé : une <b>arme à deux mains</b> est équipée. Retire-la pour utiliser une seconde arme.</p></div>`;
    m.hidden=false; m.querySelector("[data-fermer]").addEventListener("click",()=>{m.hidden=true;}); return;
  }
  const dispo = TOUS_ITEMS.filter(a => (etat.sac[a.id]||0)>0 && slotEquip(a.id)===s.cat);
  let html = `<div class="picker-cadre"><div class="picker-tete"><b>${s.nom}</b><button class="mini" data-fermer="1">Fermer</button></div>`;
  if(equipe){
    html += `<div class="picker-ligne equipe"><span class="picker-ic">${iconeItem(equipe)}</span><span class="picker-nom"><b>${item(equipe).nom}</b> <span class="qte">équipé</span><span class="picker-effet">${effetTexte(equipe)}</span></span><button class="mini danger" data-retirer="1">Retirer</button></div>`;
  }
  if(dispo.length){
    for(const it of dispo) html += `<div class="picker-ligne" data-eq="${it.id}"><span class="picker-ic">${iconeItem(it.id)}</span><span class="picker-nom"><b>${it.nom}</b> <span class="qte">×${etat.sac[it.id]}</span>${estDeuxMains(it.id)?' <span class="qte">· 2 mains</span>':''}<span class="picker-effet">${effetTexte(it.id)}</span></span><button class="mini">Équiper</button></div>`;
  } else if(!equipe){
    html += `<p class="vide" style="margin:6px 0 0">Aucun objet pour cet emplacement dans ton sac. Fabrique-en à l'atelier.</p>`;
  } else {
    html += `<p class="vide" style="margin:6px 0 0">Rien d'autre à équiper ici.</p>`;
  }
  html += `</div>`;
  m.innerHTML = html; m.hidden = false;
  m.querySelector("[data-fermer]").addEventListener("click", ()=>{ m.hidden=true; });
  const br = m.querySelector("[data-retirer]"); if(br) br.addEventListener("click", ()=>{ desequiper(slot); m.hidden=true; });
  m.querySelectorAll("[data-eq]").forEach(el=>el.addEventListener("click", ()=>{ equiper(el.dataset.eq, slot); m.hidden=true; }));
}
