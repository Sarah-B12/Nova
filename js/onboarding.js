/* ===========================================================
   ONBOARDING — encart pliable « Premiers pas » (checklist des 10 premières minutes).
   Les objectifs se cochent tout seuls et restent cochés (collants).
   Détection : formation / structure / récolte / fabrique / quête via l'état ;
   vendu & déplacé via 2 petits hooks (marche/menu-objet, carte).
   =========================================================== */
function pasDefs(){ return [
  { k:"formation", t:"Choisis une formation (au Centre)", hub:"centre" },
  { k:"structure", t:"Bâtis ta première structure (mine ou bio-dôme) sur le Terrain", hub:"terrain" },
  { k:"recolte",   t:"Récolte ou mine une ressource", hub:"terrain" },
  { k:"vendu",     t:"Vends ou brade quelque chose", hub:"marche" },
  { k:"fabrique",  t:"Fabrique ton premier objet", hub:"centre" },
  { k:"quete",     t:"Va voir le Vieux Sorn (lance la 1re quête)", hub:"quete" },
  { k:"deplace",   t:"Déplace-toi n'importe où sur la carte" }
]; }
function pasEval(){
  if(!etat.pas) etat.pas={};
  const s=etat.sac||{};
  if(etat.formation || etat.metier) etat.pas.formation=true;
  if(etat.terrain && Array.isArray(etat.terrain.parcelles) && etat.terrain.parcelles.some(p=>p)) etat.pas.structure=true;
  if(Object.keys(s).some(id=>s[id]>0 && !id.startsWith("fab_"))) etat.pas.recolte=true;
  if(Object.keys(s).some(id=>s[id]>0 && id.startsWith("fab_")))  etat.pas.fabrique=true;
  if(etat.quetes && (etat.quetes.active || (etat.quetes.done && etat.quetes.done.length))) etat.pas.quete=true;
  // vendu & deplace : posés par les actions.
}
/* v2.91 (v293, anti-triche) — la prime des Premiers pas est versée par le SERVEUR (`premiers_pas_payer`), une fois
   par compte ; avant, le jeu ajoutait 300 ₡ et `crediter` les acceptait. Montant copié au serveur (BACKEND_PLAN §6). */
const PREMIERS_PAS_CREDITS = 300;
let _pasPaiement = 0;   // horodatage du dernier essai : un appel à la fois, et pas plus d'un par minute en cas d'échec
async function premiersPasPayer(){
  if(etat.pasFini || Date.now() - _pasPaiement < 60000) return;
  _pasPaiement = Date.now();
  let d = null;
  try{
    const rep = await rpcAvecSolde("premiers_pas_payer", {}, "solde");
    if(rep && rep.error) throw new Error(rep.error.message);
    d = rep && rep.data;
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "onboarding.js#prime"); }
  if(!d || !d.ok) return;                                  // on réessaiera au prochain passage (dans une minute)
  etat.pasFini = true;
  journal(d.deja ? "Premiers pas accomplis ! Bonne route sur Silène."
                 : `Premiers pas accomplis ! +${(d.credits|0) || PREMIERS_PAS_CREDITS} ₡. Bonne route sur Silène.`, "gain");
  if(typeof sauvegarder === "function") sauvegarder();
  if(typeof afficher === "function") afficher();
}
let _pasStyleMonte=false;
function _pasCSS(){
  if(_pasStyleMonte) return; _pasStyleMonte=true;
  const st=document.createElement("style");
  st.textContent=`
    .pas-encart{ border:1px solid var(--orange,#ff8a3d); border-radius:var(--r-s,10px); background:linear-gradient(160deg, rgba(255,138,61,.10), rgba(90,168,230,.05)); padding:10px 12px; margin-bottom:12px; }
    .pas-tete{ display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; }
    .pas-tete b{ color:var(--orange-hi,#ffb060); }
    .pas-tete .mini{ padding:4px 9px; }
    .pas-liste{ display:flex; flex-direction:column; gap:6px; margin-top:9px; }
    .pas-item{ display:flex; align-items:center; gap:9px; font-size:14px; }
    .pas-item.fait .pas-txt{ color:var(--sourdine); text-decoration:line-through; }
    .pas-case{ width:16px; text-align:center; color:var(--sourdine); }
    .pas-item.fait .pas-case{ color:var(--vert,#8bd450); }
    .pas-txt{ flex:1; }`;
  document.head.appendChild(st);
}
function majPas(){
  const z=document.querySelector("#pas-encart"); if(!z) return;
  if(etat.pasFini){ z.hidden=true; return; }
  _pasCSS(); pasEval();
  const defs=pasDefs(), done=defs.filter(d=>etat.pas && etat.pas[d.k]).length, tot=defs.length;
  if(done>=tot){ z.hidden=true; premiersPasPayer(); return; }
  z.hidden=false;
  const plie=!!etat.pasPlie;
  const sig=done+"|"+(plie?1:0)+"|"+defs.map(d=>etat.pas&&etat.pas[d.k]?1:0).join("");
  if(z.dataset.sig===sig) return;                 // rien de neuf → pas de reconstruction
  z.dataset.sig=sig;
  let h=`<div class="pas-tete"><b>🧭 Premiers pas — ${done}/${tot}</b><span><button class="mini" id="pas-plier">${plie?"▸ Ouvrir":"▾ Réduire"}</button> <button class="mini" id="pas-masquer" title="Masquer">✕</button></span></div>`;
  if(!plie){
    h+=`<div class="pas-liste">`;
    for(const d of defs){ const f=!!(etat.pas && etat.pas[d.k]);
      h+=`<div class="pas-item${f?" fait":""}"><span class="pas-case">${f?"✓":"○"}</span><span class="pas-txt">${d.t}</span>${(!f&&d.hub)?`<button class="mini" data-hub="${d.hub}">Aller</button>`:""}</div>`; }
    h+=`</div>`;
  }
  z.innerHTML=h;
  const bp=z.querySelector("#pas-plier"); if(bp) bp.addEventListener("click",()=>{ etat.pasPlie=!etat.pasPlie; if(typeof sauvegarder==="function") sauvegarder(); majPas(); });
  const bm=z.querySelector("#pas-masquer"); if(bm) bm.addEventListener("click",async ()=>{ if(await confirmerJoli("Premiers pas", "Masquer les Premiers pas ? (ils disparaissent de toute façon une fois terminés)", "Masquer")){ etat.pasFini=true; if(typeof sauvegarder==="function") sauvegarder(); majPas(); } });
  z.querySelectorAll("[data-hub]").forEach(b=>b.addEventListener("click",()=>{ if(typeof changerHub==="function") changerHub(b.dataset.hub); }));
}
