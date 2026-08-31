/* ===========================================================
   VAISSEAU — Vaisseau actif + soute (cargo). Un seul vaisseau équipé à la fois.
   - S'équipe/se déséquipe depuis le sac (comme un gros objet) ; l'onglet Vaisseau
     affiche l'image, les stats de vol et la soute.
   - On ne peut PAS déséquiper un vaisseau dont la soute contient des objets.
   - On ne range PAS un vaisseau dans une soute.
   - Stats de vol (conso carburant/énergie, PV) : inertes pour l'instant,
     branchées avec la carte spatiale (à venir). Le hacking pourra cibler le
     vaisseau (comme la maison ou le sac) — à venir aussi.
   =========================================================== */
const VAISSEAUX = {
  // carb = type de carburant · reservoir = litres max · conso = L par unité de vol (à venir) · pv = coque
  fab_navette_legere:  { nom:"Navette légère",  soute:5,  img:"images/vaisseaux/navette_legere.png",  carb:"fab_biocarburant",         reservoir:40,  conso:1, energie:1, pv:120 },
  fab_vaisseau_cargo:  { nom:"Vaisseau Cargo",  soute:20, img:"images/vaisseaux/vaisseau_cargo.png",  carb:"fab_biocarburant_raffine", reservoir:200, conso:6, energie:2, pv:260 },
  fab_vaisseau_maitre: { nom:"Vaisseau maître", soute:10, img:"images/vaisseaux/vaisseau_maitre.png", carb:"fab_biocarburant_raffine", reservoir:100, conso:3, energie:3, pv:340 }
};
// Litres apportés par une unité de carburant, lors d'un plein.
const CARBURANT_LITRES = { fab_biocarburant:20, fab_biocarburant_raffine:60 };
function estVaisseau(id){ return !!VAISSEAUX[id]; }
function vaisseauActif(){ return etat.vaisseau ? VAISSEAUX[etat.vaisseau] : null; }
function capaciteSoute(){ const v=vaisseauActif(); return v ? v.soute : 0; }
function itemsSoute(){ return Object.values(etat.soute||{}).reduce((a,b)=>a+b,0); }

/* ---------- Équiper / déséquiper ---------- */
function equiperVaisseau(id){
  if(!estVaisseau(id) || (etat.sac[id]||0)<=0) return;
  if(!etat.permisVaisseau){ journal("Il te faut un permis de vaisseau pour piloter (quête à venir).","alerte"); return; }
  if(id===etat.vaisseau) return;
  if(etat.vaisseau){                                   // remplacer : il faut d'abord ranger l'actuel (soute vide)
    if(itemsSoute()>0){ journal("Vide la soute de ton vaisseau actuel avant d'en équiper un autre.","alerte"); return; }
    if(placesLibres()<=0){ journal("Sac plein — impossible de ranger le vaisseau actuel.","alerte"); return; }
    const ancien=etat.vaisseau, tsA=etat.vaisseauDate;
    ajouterAuSac(ancien,1);
    if(typeof reporterDate==="function"){ etat.sacDate=etat.sacDate||{}; reporterDate(etat.sacDate,ancien,tsA||Date.now()); }
  }
  const ts=etat.sacDate&&etat.sacDate[id];
  retirerDuSac(id,1);
  etat.vaisseau=id; etat.vaisseauDate=ts||Date.now();
  etat.carburant = Math.min(etat.carburant||0, VAISSEAUX[id].reservoir);   // le réservoir peut être plus petit
  journal(`${VAISSEAUX[id].nom} équipé. Soute : ${VAISSEAUX[id].soute} places.`,"gain");
  apresAction(); majVaisseau();
}
function desequiperVaisseau(){
  if(!etat.vaisseau) return;
  if(itemsSoute()>0){ journal("Impossible : vide d'abord la soute.","alerte"); return; }
  if(placesLibres()<=0){ journal("Sac plein.","alerte"); return; }
  const id=etat.vaisseau, ts=etat.vaisseauDate;
  ajouterAuSac(id,1);
  if(typeof reporterDate==="function"){ etat.sacDate=etat.sacDate||{}; reporterDate(etat.sacDate,id,ts||Date.now()); }
  etat.vaisseau=null; etat.vaisseauDate=null;
  journal(`${VAISSEAUX[id].nom} rangé dans le sac.`);
  apresAction(); majVaisseau();
}

/* ---------- Soute (charger / décharger) ---------- */
function deposerSoute(id){
  if(!etat.vaisseau){ journal("Équipe un vaisseau d'abord.","alerte"); return; }
  if(estVaisseau(id)){ journal("On ne range pas un vaisseau dans une soute.","alerte"); return; }
  if(!etat.sac[id]) return;
  if(itemsSoute()>=capaciteSoute()){ journal("Soute pleine.","alerte"); return; }
  const ts=etat.sacDate&&etat.sacDate[id];
  retirerDuSac(id,1);
  etat.soute=etat.soute||{}; etat.soute[id]=(etat.soute[id]||0)+1;
  if(typeof reporterDate==="function"){ etat.souteDate=etat.souteDate||{}; reporterDate(etat.souteDate,id,ts||Date.now()); }
  apresAction(); majVaisseau();
}
function retirerSoute(id){
  if(!etat.soute||!etat.soute[id]) return;
  if(placesLibres()<=0){ journal("Sac plein.","alerte"); return; }
  const ts=etat.souteDate&&etat.souteDate[id];
  etat.soute[id]--; if(etat.soute[id]<=0){ delete etat.soute[id]; if(etat.souteDate) delete etat.souteDate[id]; }
  ajouterAuSac(id,1);
  if(typeof reporterDate==="function"){ etat.sacDate=etat.sacDate||{}; reporterDate(etat.sacDate,id,ts||Date.now()); }
  apresAction(); majVaisseau();
}

/* ---------- Ravitaillement ---------- */
function ravitailler(){
  const v=vaisseauActif(); if(!v) return;
  if((etat.carburant||0) >= v.reservoir){ journal("Réservoir plein.","alerte"); return; }
  if((etat.sac[v.carb]||0) <= 0){ journal(`Il te faut du ${item(v.carb).nom} dans ton sac.`,"alerte"); return; }
  const litres = CARBURANT_LITRES[v.carb]||0;
  retirerDuSac(v.carb,1);
  etat.carburant = Math.min(v.reservoir, (etat.carburant||0) + litres);
  journal(`Plein : +${litres} L de ${item(v.carb).nom}. Réservoir ${Math.round(etat.carburant)}/${v.reservoir} L.`,"gain");
  apresAction(); majVaisseau();
}

/* ---------- Rendu (onglet Vaisseau) ---------- */
let _vaisStyle=false;
function _vaisMonterStyle(){
  if(_vaisStyle) return;
  const st=document.createElement("style");
  st.textContent=`
    .vais-tete{ display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start; }
    .vais-vis{ flex:1 1 320px; max-width:520px; }
    .vais-vis img{ width:100%; height:auto; object-fit:contain; filter:drop-shadow(0 8px 20px rgba(0,0,0,.5)); }
    .vais-infos{ flex:1 1 220px; }
    .vais-stats{ display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; font-family:"Space Mono",monospace; font-size:12px; color:var(--sourdine); }
    .vais-stats > div{ display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:2px 0; }
    .vais-stats b{ color:var(--bleu); }
    .rangee2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    @media (max-width:640px){ .rangee2{ grid-template-columns:1fr; } }
  `;
  document.head.appendChild(st); _vaisStyle=true;
}
function majVaisseau(){
  const z=document.querySelector("#vaisseau-vue"); if(!z) return;
  _vaisMonterStyle();
  if(!etat.permisVaisseau){
    z.innerHTML=`<p class="vide">🔒 <b>Permis de vaisseau requis.</b> Il s'obtient via la quête d'accès à l'espace (à venir). Sans lui : ni achat, ni construction, ni pilotage de vaisseau.</p>`;
    return;
  }
  if(!etat.vaisseau){
    z.innerHTML=`<p class="vide">Aucun vaisseau équipé. Construis-en un (métier <b>Constructeur</b>), puis clique-le dans ton sac pour l'équiper. Sa soute te permettra de transporter davantage d'objets.</p>`;
    return;
  }
  const v=VAISSEAUX[etat.vaisseau]; const plein=itemsSoute()>0;
  const carb=etat.carburant||0;
  const _jm=(typeof JOUR_MS!=="undefined")?JOUR_MS:86400000;
  const jr=(typeof dureeVie==="function" && etat.vaisseauDate!=null) ? Math.max(0, dureeVie(etat.vaisseau) - (Date.now()-etat.vaisseauDate)/_jm) : null;
  z.innerHTML=`
    <div class="vais-tete">
      <div class="vais-vis"><img src="${v.img}" alt="${v.nom}"></div>
      <div class="vais-infos">
        <h3 style="margin:0 0 8px">${v.nom}</h3>
        <div class="vais-stats">
          <div><span>Soute</span><b>${itemsSoute()}/${v.soute}</b></div>
          <div><span>PV (coque)</span><b>${v.pv}</b></div>
          <div><span>Conso carburant</span><b>${v.conso} L/u</b></div>
          <div><span>Conso énergie</span><b>${v.energie}/u</b></div>
          <div><span>Durée de vie</span><b>${jr!=null?Math.ceil(jr)+" j":"—"}</b></div>
        </div>
        <div class="jauge" style="margin:12px 0 4px">
          <div class="jauge-tete"><span>Carburant · ${item(v.carb).nom}</span><span class="val">${Math.round(carb)} / ${v.reservoir} L</span></div>
          <div class="piste"><div class="remplissage" style="width:${v.reservoir?Math.round(carb/v.reservoir*100):0}%"></div></div>
        </div>
        <div class="actions" style="margin:0 0 6px; align-items:center; gap:10px">
          <button class="mini" id="vais-plein">Faire le plein (+${CARBURANT_LITRES[v.carb]||0} L)</button>
          <span class="qte">au sac : ${etat.sac[v.carb]||0}</span>
        </div>
        <p class="vide" style="margin:0 0 10px">Ce vaisseau consomme du <b>${item(v.carb).nom}</b>. Le plein est déjà fonctionnel ; la consommation en vol arrivera avec la carte spatiale. La coque s'use (voir durée de vie).</p>
        <button class="mini" id="vais-desequiper">${plein?"Vide la soute pour ranger":"Ranger dans le sac"}</button>
      </div>
    </div>
    <div class="rangee2" style="margin-top:14px">
      <div class="sous-carte" style="margin:0"><h3>Soute <span class="qte">${itemsSoute()}/${v.soute}</span></h3><div class="sac-grille" id="soute-grille"></div></div>
      <div class="sous-carte" style="margin:0"><h3>À charger (sac)</h3><div id="soute-depot"></div></div>
    </div>`;
  const bd=z.querySelector("#vais-desequiper"); if(bd){ bd.disabled=plein; bd.addEventListener("click",desequiperVaisseau); }
  const bp=z.querySelector("#vais-plein"); if(bp){ bp.disabled = (carb>=v.reservoir) || ((etat.sac[v.carb]||0)<=0); bp.addEventListener("click", ravitailler); }

  // Grille de la soute (clic = décharger vers le sac)
  const g=z.querySelector("#soute-grille");
  const stacks=TOUS_ITEMS.filter(a=>(etat.soute[a.id]||0)>0);
  const cible=Math.max(6, Math.ceil((stacks.length+1)/6)*6);
  for(let i=0;i<cible;i++){ const t=document.createElement("div");
    if(i<stacks.length){ const it=stacks[i]; t.className="tuile utilisable";
      t.innerHTML=`<span class="icone">${iconeItem(it.id)}</span><span class="compte">${etat.soute[it.id]}</span>`;
      if(typeof montrerItemTip==="function"){ t.addEventListener("mouseenter",()=>montrerItemTip(t,it.id)); t.addEventListener("mouseleave",cacherItemTip); }
      t.addEventListener("click",()=>{ if(typeof cacherItemTip==="function")cacherItemTip(); retirerSoute(it.id); });
    } else t.className="tuile vide";
    g.appendChild(t);
  }
  // Liste « à charger » depuis le sac (hors vaisseaux)
  const dl=z.querySelector("#soute-depot");
  const dispo=TOUS_ITEMS.filter(a=>(etat.sac[a.id]||0)>0 && !estVaisseau(a.id));
  if(!dispo.length){ dl.innerHTML=`<p class="vide">Rien à charger.</p>`; return; }
  for(const it of dispo){ const d=document.createElement("div"); d.className="item-ligne";
    d.innerHTML=`<span>${it.nom} <span class="qte">×${etat.sac[it.id]}</span></span>`;
    const b=document.createElement("button"); b.className="mini"; b.textContent="Charger"; b.disabled=itemsSoute()>=capaciteSoute();
    b.addEventListener("click",()=>deposerSoute(it.id)); d.appendChild(b); dl.appendChild(d);
  }
}
