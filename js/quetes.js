/* ===========================================================
   QUETES — Moteur + onglet « Quêtes » + marqueurs + mini-jeux.
   Un onglet (entre La Boutique et Voler/Hacker). Une quête active, ordre imposé.
   Bannière de Sorn seulement en faction ; sur le terrain : scène locale + radio.
   L'épreuve n'est jouable que SUR le lieu (surSiteQuete). Après réussite : écran
   de transition (defi.reussite) + Continuer.

   Types de défi (defi.type) — un module = _html<Type> + _wire<Type> :
     enigme (illimité) · choix · livraison · paiement · attente · piratage · glyphes
     ordre · cadenas · sequence · memoire · combat (contrôle de niveau)
   MINI-JEUX RATABLES (DEFIS_UNTRY) : UN essai par jour. Sur échec (validation ratée),
   l'étape se verrouille jusqu'au lendemain (JOUR_MS). L'énigme reste illimitée ;
   livraison/paiement/attente ne sont pas « ratables » (on complète ou pas).
   =========================================================== */

/* ---------- État & accès ---------- */
function queteEtat(){ if(!etat.quetes || typeof etat.quetes!=="object") etat.quetes={ done:[], active:null };
  if(!Array.isArray(etat.quetes.done)) etat.quetes.done=[]; return etat.quetes; }
function queteData(id){ return (typeof QUETES!=="undefined") ? QUETES.find(q=>q.id===id) : null; }
function queteActive(){ const q=queteEtat(); return q.active || null; }
function etapeActive(){ const a=queteActive(); if(!a) return null; const q=queteData(a.id); return q ? q.etapes[a.etape] : null; }
function queteProchaine(){ if(typeof QUETES==="undefined") return null; return QUETES.find(q=>!queteEtat().done.includes(q.id)) || null; }
function _qnorm(s){ return String(s||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," "); }
function _par(txt){ if(!txt) return ""; const arr=Array.isArray(txt)?txt:[txt]; return arr.map(t=>`<p class="quete-dial">${t}</p>`).join(""); }
function surSiteQuete(){ const e=etapeActive(); if(!e || !e.cible || !etat.pos) return false;
  return Math.hypot(etat.pos.x-e.cible.x, etat.pos.y-e.cible.y) <= (e.cible.r||70); }
function _enFaction(){ return (typeof villeActuelle==="function") && villeActuelle()===etat.faction; }
function _jourMs(){ return (typeof JOUR_MS!=="undefined")?JOUR_MS:86400000; }
function _fmtDuree(ms){ ms=Math.max(0,ms); const s=Math.ceil(ms/1000); if(s<60) return s+" s"; const m=Math.floor(s/60); return m+" min "+(s%60)+" s"; }

// Mini-jeux ratables : un essai par jour.
const DEFIS_UNTRY = new Set(["piratage","glyphes","ordre","cadenas","sequence","memoire","combat"]);
function queteVerrou(){ const a=queteActive(); const e=etapeActive();
  if(!a || !e || !e.defi || !DEFIS_UNTRY.has(e.defi.type) || !a._echecLe) return 0;
  const r=_jourMs()-(Date.now()-a._echecLe); return r>0?r:0; }

let _queteTimer = null; let _queteTO = [];   // animation/compte à rebours + timeouts
function _clearQ(){ if(_queteTimer){ clearInterval(_queteTimer); _queteTimer=null; } _queteTO.forEach(clearTimeout); _queteTO=[]; }

/* ---------- Progression ---------- */
function accepterQuete(id){
  if(queteActive()){ journal("Termine ta quête en cours d'abord.","alerte"); return; }
  const q=queteData(id); if(!q || queteEtat().done.includes(id)) return;
  queteEtat().active={ id, etape:0, _sur:false, _resolu:false, _echecLe:0, _attenteLe:0, _memVue:false };
  journal(`Quête acceptée : ${q.nom}. Onglet Quêtes → suis l'objectif.`,"gain");
  sauvegarder(); rafraichirQuetes();
}
function abandonnerQuete(){
  if(!queteActive()) return;
  if(!confirm("Abandonner la quête en cours ? Tu pourras la reprendre depuis le début.")) return;
  queteEtat().active=null; journal("Quête abandonnée.","alerte");
  sauvegarder(); rafraichirQuetes();
}
async function avancerQuete(){
  const a=queteActive(); if(!a) return; const q=queteData(a.id);
  a.etape++; a._sur=false; a._resolu=false; a._echecLe=0; a._attenteLe=0; a._memVue=false;
  if(a.etape >= q.etapes.length){ await terminerQuete(); }
  else { const e=etapeActive(); journal("Étape suivante"+(e&&e.indice?` : « ${e.indice} »`:"")+".","gain"); sauvegarder(); }
  rafraichirQuetes();
}
async function terminerQuete(){
  const a=queteActive(); if(!a) return; const q=queteData(a.id); const r=q.recompense||{};
  if(r.credits) etat.credits += r.credits;
  if(r.objets && Object.keys(r.objets).length) await agirServeur({ ajouter:r.objets, motif:"quete_recompense" });
  if(r.pa && typeof gagnerPA==="function") gagnerPA(r.pa);
  if(r.xp && typeof gagnerXp==="function") gagnerXp(r.xp);
  if(r.flags) for(const k in r.flags){ etat[k]=r.flags[k]; }
  queteEtat().done.push(a.id); queteEtat().active=null;
  const parts=[]; if(r.credits) parts.push(`+${r.credits} ₡`); if(r.xp) parts.push(`+${r.xp} XP`); if(r.pa) parts.push(`+${r.pa} PA`);
  if(r.objets) for(const id in r.objets){ const it=(typeof item==="function")?item(id):null; parts.push(`+${r.objets[id]} ${it?it.nom:id}`); }
  if(r.flags && r.flags.permisVaisseau) parts.push("🚀 Permis de vaisseau obtenu !");
  journal(`Quête « ${q.nom} » accomplie ! ${parts.join(", ")}`.trim(),"gain");
  sauvegarder();
}

/* ---------- Réussite / échec partagés ---------- */
function reussirDefi(){ const a=queteActive(); if(!a) return; a._resolu=true; a._echecLe=0; a._attenteLe=0; sauvegarder(); rafraichirQuetes(); }
function echouerDefi(msg){ const a=queteActive(); if(!a) return; a._echecLe=Date.now(); a._memVue=false; journal(msg||"Échec — reviens tenter à nouveau plus tard.","alerte"); sauvegarder(); rafraichirQuetes(); }

/* ---------- Modules de défi : rendu ---------- */
function _defiHTML(d){
  if(!d) return "";
  switch(d.type){
    case "choix":     return _htmlChoix(d);
    case "combat":    return _htmlCombat(d);
    case "enigme":    return _htmlEnigme(d);
    case "livraison": return _htmlLivraison(d);
    case "paiement":  return _htmlPaiement(d);
    case "attente":   return _htmlAttente(d);
    case "piratage":  return _htmlPiratage(d);
    case "glyphes":   return _htmlGlyphes(d);
    case "ordre":     return _htmlOrdre(d);
    case "cadenas":   return _htmlCadenas(d);
    case "sequence":  return _htmlSequence(d);
    case "memoire":   return _htmlMemoire(d);
    default:          return `<p class="vide">Épreuve « ${d.type} » (à venir).</p>`;
  }
}
function _defiWire(z, d){
  if(!d || !z) return;
  switch(d.type){
    case "choix":     _wireChoix(z,d); break;
    case "combat":    _wireCombat(z,d); break;
    case "enigme":    _wireEnigme(z,d); break;
    case "livraison": _wireLivraison(z,d); break;
    case "paiement":  _wirePaiement(z,d); break;
    case "attente":   _wireAttente(z,d); break;
    case "piratage":  _wirePiratage(z,d); break;
    case "glyphes":   _wireGlyphes(z,d); break;
    case "ordre":     _wireOrdre(z,d); break;
    case "cadenas":   _wireCadenas(z,d); break;
    case "sequence":  _wireSequence(z,d); break;
    case "memoire":   _wireMemoire(z,d); break;
  }
}

/* énigme (illimité) */
function _htmlEnigme(d){
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">${d.question}</p>
    <div class="quete-rep"><input id="q-enig-champ" placeholder="Ta réponse…" autocomplete="off"><button class="mini" id="q-enig-btn">Valider</button></div>
    ${d.indice?`<button class="mini" id="q-enig-indice" style="margin-top:8px">Indice</button><p class="vide" id="q-enig-txt" hidden style="margin:6px 0 0">💡 ${d.indice}</p>`:""}
  </div>`;
}
function _wireEnigme(z,d){
  const b=z.querySelector("#q-enig-btn"), c=z.querySelector("#q-enig-champ");
  const go=()=>{ if((d.reponses||d.reponse||[]).map(_qnorm).includes(_qnorm(c.value))){ journal("Bonne réponse !","gain"); reussirDefi(); } else journal("Mauvaise réponse. Réessaie — ou demande un indice.","alerte"); };
  if(b&&c){ b.addEventListener("click",go); c.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }); }
  const ib=z.querySelector("#q-enig-indice"); if(ib) ib.addEventListener("click",()=>{ const t=z.querySelector("#q-enig-txt"); if(t) t.hidden=false; });
}

/* livraison (non ratable) */
function _htmlLivraison(d){
  const objs=d.objets||{};
  const lignes=Object.keys(objs).map(id=>{ const need=objs[id], have=etat.sac[id]||0, ok=have>=need;
    return `<div class="q-liv-ligne"><span class="picker-ic">${iconeItem(id)}</span><span class="picker-nom">${item(id)?item(id).nom:id}</span><span class="qte" style="color:${ok?'#8bd450':'#ff5257'}">${have}/${need}</span></div>`; }).join("");
  const ok=Object.keys(objs).every(id=>(etat.sac[id]||0)>=objs[id]);
  return `<div class="quete-etape">${_par(d.texte)}<p class="quete-indice">À livrer :</p>${lignes}
    <div class="quete-rep"><button class="mini" id="q-liv-btn" ${ok?"":"disabled"}>Livrer</button></div></div>`;
}
function _wireLivraison(z,d){
  const b=z.querySelector("#q-liv-btn"); if(!b) return;
  b.addEventListener("click", async ()=>{ const objs=d.objets||{};
    if(!Object.keys(objs).every(id=>(etat.sac[id]||0)>=objs[id])){ journal("Il te manque des objets.","alerte"); return; }
    // Un seul appel : tous les objets vérifiés côté serveur avant qu'un seul ne parte.
    if(!await agirServeur({ retirer:objs, motif:"quete_livraison" })) return;
    journal("Livraison effectuée.","gain"); reussirDefi(); });
}

/* paiement (non ratable) */
function _htmlPaiement(d){ const cout=d.cout||0, ok=etat.credits>=cout;
  return `<div class="quete-etape">${_par(d.texte)}
    <div class="quete-rep"><button class="mini" id="q-pay-btn" ${ok?"":"disabled"}>Payer ${cout} ₡</button></div>
    ${ok?"":`<p class="vide">Crédits insuffisants (${etat.credits}/${cout}).</p>`}</div>`;
}
function _wirePaiement(z,d){ const b=z.querySelector("#q-pay-btn"); if(!b) return;
  b.addEventListener("click",()=>{ const cout=d.cout||0; if(etat.credits<cout){ journal("Crédits insuffisants.","alerte"); return; } etat.credits-=cout; journal(`Payé ${cout} ₡.`,"gain"); reussirDefi(); }); }

/* choix (embranchement de Cercle) : options avec coût + deltas de réputation de Cercle. Définitif. */
function _coutQ_ok(cout){ if(!cout) return true;
  for(const k in cout){ const q=cout[k];
    if(k==="credits"){ if((etat.credits||0)<q) return false; }
    else if(k==="energie"){ if((etat.energie||0)<q) return false; }
    else if(k==="sante"){ if(((etat.jauges&&etat.jauges.sante)||0)<q) return false; }
    else { if((etat.sac[k]||0)<q) return false; }
  } return true;
}
async function _payerCoutQ(cout){ if(!cout) return true;
  const objets = {}; let energie = 0; const jauges = {};
  for(const k in cout){ const q=cout[k];
    if(k==="credits") etat.credits-=q;
    else if(k==="energie") energie += q;                 // débitée par le serveur
    else if(k==="sante") jauges.sante = (jauges.sante||0) - q;      // appliquée par le serveur
    else objets[k] = (objets[k]||0) + q;                 // objets : retirés côté serveur
  }
  if(energie > 0 || Object.keys(objets).length || Object.keys(jauges).length){
    return !!await agirServeur({ cout:energie, retirer:objets, jauges, motif:"quete_choix" });
  }
  return true;
}
function _coutTexteQ(cout){ if(!cout) return ""; const p=[];
  for(const k in cout){ const q=cout[k];
    if(k==="credits") p.push(`${q} ₡`);
    else if(k==="energie") p.push(`${q}% énergie`);
    else if(k==="sante") p.push(`${q} santé`);
    else p.push(`${q}× ${(typeof item==="function"&&item(k))?item(k).nom:k}`);
  } return p.join(", ");
}
function _cerclesTexteQ(cercles){ if(!cercles) return ""; const p=[];
  for(const k in cercles){ const c=(typeof CERCLES!=="undefined")?CERCLES.find(x=>x.id===k):null; const v=cercles[k]; p.push(`${v>0?"+":""}${v} ${c?c.nom:k}`); }
  return p.length?("→ "+p.join(", ")):"";
}
async function _appliquerCerclesQ(cercles){ if(!cercles) return;
  if(!etat.cercles) etat.cercles={};
  for(const k in cercles){ etat.cercles[k]=Math.max(0,Math.min(100,(etat.cercles[k]||0)+cercles[k])); }
  try{ const s=(typeof sessionActuelle==="function")?await sessionActuelle():null; if(s && typeof sb!=="undefined" && sb) await sb.from("profils").update({ cercles: etat.cercles }).eq("id", s.user.id); }catch(e){}
}
function _htmlChoix(d){
  const opts=(d.options||[]).map((o,i)=>{
    const ok=_coutQ_ok(o.cout); const ct=_coutTexteQ(o.cout); const ef=_cerclesTexteQ(o.cercles);
    return `<div style="border:1px solid var(--line);border-radius:8px;padding:8px 10px">
      <button class="mini" data-choix="${i}" ${ok?"":"disabled"}>${o.texte}</button>
      <div class="quete-indice" style="margin-top:4px">${ct?`Coût : <b>${ct}</b>. `:""}${ef}${ok?"":' <span style="color:#ff5257">— ressources manquantes</span>'}</div>
    </div>`;
  }).join("");
  return `<div class="quete-etape">${_par(d.texte)}<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">${opts}</div></div>`;
}
function _wireChoix(z,d){
  z.querySelectorAll("[data-choix]").forEach(b=>b.addEventListener("click", async ()=>{
    const o=(d.options||[])[parseInt(b.dataset.choix,10)]; if(!o) return;
    if(!_coutQ_ok(o.cout)){ journal("Ressources insuffisantes pour ce choix.","alerte"); return; }
    if(!await _payerCoutQ(o.cout)) return;
    await _appliquerCerclesQ(o.cercles);
    // Drapeaux posés par l'option choisie (ex. cap:"stations") — relisibles plus tard.
    if(o.flags) for(const k in o.flags){ etat[k]=o.flags[k]; }
    journal(o.journal || "Ton choix est scellé.","gain");
    if(typeof afficher==="function") afficher();
    reussirDefi();
  }));
}


/* ---------- combat (ratable : un essai par jour) ----------
   Contrôle de niveau : on compare la MEILLEURE compétence effective à d.puissance.
     ≥ puissance            → victoire nette
     ≥ puissance × 0,7      → victoire arrachée, coût en santé proportionnel à l'écart
     en dessous             → échec, l'étape se verrouille jusqu'au lendemain
   La compétence qui l'emporte choisit le récit ET le Cercle qui gagne des points. */
const COMBAT_CERCLES = { force:"racines", agilite:"langues", intelligence:"assembleurs" };
function _combatStats(){
  const f = (typeof forceEffective==="function") ? forceEffective() : (etat.competences.force||0);
  const a = (typeof agiliteEffective==="function") ? agiliteEffective() : (etat.competences.agilite||0);
  const i = (typeof intelligenceEffective==="function") ? intelligenceEffective() : (etat.competences.intelligence||0);
  const best = (f>=a && f>=i) ? "force" : (a>=i ? "agilite" : "intelligence");
  return { force:f, agilite:a, intelligence:i, best, val:Math.max(f,a,i) };
}
function _htmlCombat(d){
  const st=_combatStats(); const p=d.puissance||30;
  const noms={force:"Force",agilite:"Agilité",intelligence:"Intelligence"};
  const jauge=Math.max(0,Math.min(100,Math.round(st.val/p*100)));
  const teinte = st.val>=p ? "#8bd450" : (st.val>=p*0.7 ? "#ff8a3d" : "#ff5257");
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">${d.nom||"Adversaire"} — puissance estimée : <b>${p}</b></p>
    <p class="vide" style="margin:6px 0">Ton meilleur atout : <b>${noms[st.best]}</b> ${st.val}
      <span style="color:${teinte}"> (${jauge} %)</span></p>
    <div class="quete-rep"><button class="mini" id="q-cbt-btn">Engager le combat</button></div>
  </div>`;
}
function _wireCombat(z,d){
  const b=z.querySelector("#q-cbt-btn"); if(!b) return;
  b.addEventListener("click", async ()=>{
    const st=_combatStats(); const p=d.puissance||30;
    if(st.val < p*0.7){
      const perte=Math.round(8+Math.random()*10);
      await agirServeur({ jauges:{ sante:-perte }, motif:"quete_combat" });
      if(typeof afficher==="function") afficher();
      echouerDefi(`${d.nom||"L'adversaire"} te domine (−${perte} santé). Entraîne-toi et reviens demain.`);
      return;
    }
    let perte=0;
    if(st.val < p){
      perte=Math.round((p-st.val)/p*40)+5;
      await agirServeur({ jauges:{ sante:-perte }, motif:"quete_combat" });
    }
    const cercle=(d.cercles&&d.cercles[st.best])||COMBAT_CERCLES[st.best];
    if(cercle && typeof _appliquerCerclesQ==="function") await _appliquerCerclesQ({ [cercle]: (d.gain||2) });
    if(typeof gagnerXp==="function") gagnerXp(d.xp||8);
    journal(perte>0 ? `Victoire arrachée (−${perte} santé).` : "Victoire nette.", perte>0?"alerte":"gain");
    if(typeof afficher==="function") afficher();
    reussirDefi();
  });
}

/* attente (non ratable ; survit au rechargement via a._attenteLe) */
function _htmlAttente(d){
  const a=queteActive(); const t0=a._attenteLe||0; const dur=d.duree||30000;
  const reste=t0?Math.max(0,dur-(Date.now()-t0)):dur; const pret=t0&&reste<=0;
  return `<div class="quete-etape">${_par(d.texte)}
    ${!t0 ? `<div class="quete-rep"><button class="mini" id="q-att-start">Lancer</button></div>`
          : (pret ? `<div class="quete-rep"><button class="mini" id="q-att-fin">Récupérer le résultat</button></div>`
                  : `<p class="quete-indice">Scan en cours… <b id="q-att-reste">${_fmtDuree(reste)}</b> restant.</p>`)}</div>`;
}
function _wireAttente(z,d){
  const a=queteActive(); const dur=d.duree||30000;
  const bs=z.querySelector("#q-att-start"); if(bs) bs.addEventListener("click",()=>{ a._attenteLe=Date.now(); sauvegarder(); rafraichirQuetes(); });
  const bf=z.querySelector("#q-att-fin"); if(bf) bf.addEventListener("click",()=>{ journal("Scan terminé.","gain"); reussirDefi(); });
  const r=z.querySelector("#q-att-reste");
  if(r){ if(_queteTimer) clearInterval(_queteTimer);
    _queteTimer=setInterval(()=>{ const reste=Math.max(0,dur-(Date.now()-a._attenteLe)); r.textContent=_fmtDuree(reste);
      if(reste<=0){ clearInterval(_queteTimer); _queteTimer=null; rafraichirQuetes(); } },1000); }
}

/* piratage (ratable : barre + zone verte, manches qui rétrécissent) */
function _htmlPiratage(d){
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Clique STOP quand le curseur est dans la zone verte — ${d.manches||3} manches, un seul essai.</p>
    <div class="q-pir-piste"><div class="q-pir-zone" id="q-pir-zone"></div><div class="q-pir-curseur" id="q-pir-curseur"></div></div>
    <div class="quete-rep"><span id="q-pir-manche" class="itip-gris"></span><button class="mini" id="q-pir-stop">STOP</button></div></div>`;
}
function _wirePiratage(z,d){
  const manches=d.manches||3, vitesse=d.vitesse||1400;
  const zone=z.querySelector("#q-pir-zone"), cur=z.querySelector("#q-pir-curseur"), lbl=z.querySelector("#q-pir-manche");
  let round=0, pos=0, dir=1, gp=0, gw=0;
  function setup(){ gw=Math.max(9, 34-round*8); gp=Math.random()*(100-gw); zone.style.left=gp+"%"; zone.style.width=gw+"%"; lbl.textContent=`Manche ${round+1}/${manches}`; }
  setup();
  const stepPx=100/(vitesse/20);
  if(_queteTimer) clearInterval(_queteTimer);
  _queteTimer=setInterval(()=>{ pos+=dir*stepPx; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} cur.style.left=pos+"%"; },20);
  z.querySelector("#q-pir-stop").addEventListener("click",()=>{
    if(pos>=gp && pos<=gp+gw){ round++;
      if(round>=manches){ clearInterval(_queteTimer); _queteTimer=null; journal("Sécurité contournée !","gain"); reussirDefi(); }
      else setup();
    } else { clearInterval(_queteTimer); _queteTimer=null; echouerDefi("Raté — l'alarme se déclenche. Reviens tenter demain."); }
  });
}

/* glyphes (ratable : associer chaque glyphe à son sens via un picto — façon Chants of Sennaar) */
function _htmlGlyphes(d){
  const paires=d.paires||[]; const mots=[...paires.map(p=>p.sens), ...(d.distracteurs||[])];
  for(let i=mots.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [mots[i],mots[j]]=[mots[j],mots[i]]; }
  const opts = `<option value="">— ?</option>` + mots.map(m=>`<option value="${m}">${m}</option>`).join("");
  const cartes = paires.map((p,i)=>`<div class="q-gly-carte">
      ${p.pictimg?`<img class="q-gly-pic" src="${p.pictimg}" alt="" onerror="this.remove()">`:`<span class="q-gly-pic">${p.picto||"❔"}</span>`}
      <span class="q-gly-sym">${p.glyimg?`<img src="${p.glyimg}" alt="">`:(p.glyphe||"?")}</span>
      <select class="q-gly-sel" data-i="${i}">${opts}</select>
    </div>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}${d.consigne?`<p class="quete-indice">${d.consigne}</p>`:""}
    <div class="q-gly-grille">${cartes}</div>
    <div class="quete-rep"><button class="mini" id="q-gly-valider">Valider</button></div></div>`;
}
function _wireGlyphes(z,d){
  const paires=d.paires||[]; const b=z.querySelector("#q-gly-valider"); if(!b) return;
  b.addEventListener("click",()=>{
    const sels=[...z.querySelectorAll(".q-gly-sel")];
    if(sels.some(s=>!s.value)){ journal("Associe chaque glyphe avant de valider.","alerte"); return; }
    const ok=sels.every(s=> _qnorm(s.value)===_qnorm(paires[parseInt(s.dataset.i,10)].sens));
    if(ok){ journal("Glyphes déchiffrés !","gain"); reussirDefi(); }
    else echouerDefi("Traduction erronée — les glyphes se brouillent. Reviens demain.");
  });
}

/* ordre (ratable : remettre dans le bon ordre) */
function _htmlOrdre(d){
  const els=d.elements||[]; const idx=els.map((_,i)=>i);
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  const pool=idx.map(i=>`<button class="q-ordre-el mini" data-i="${i}">${els[i]}</button>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}${d.consigne?`<p class="quete-indice">${d.consigne}</p>`:""}
    <div class="q-ordre-pool">${pool}</div><div class="q-ordre-rep"></div>
    <div class="quete-rep"><button class="mini" id="q-ordre-valider" disabled>Valider</button><button class="mini" id="q-ordre-reset">Recommencer</button></div></div>`;
}
function _wireOrdre(z,d){
  const n=(d.elements||[]).length; let picks=[];
  const rep=z.querySelector(".q-ordre-rep"), val=z.querySelector("#q-ordre-valider");
  z.querySelectorAll(".q-ordre-el").forEach(b=>b.addEventListener("click",()=>{ if(b.disabled) return;
    picks.push(parseInt(b.dataset.i,10)); b.disabled=true;
    const chip=document.createElement("span"); chip.className="q-ordre-chip"; chip.textContent=picks.length+". "+b.textContent; rep.appendChild(chip);
    if(picks.length===n) val.disabled=false; }));
  z.querySelector("#q-ordre-reset").addEventListener("click",()=>{ picks=[]; rep.innerHTML=""; val.disabled=true; z.querySelectorAll(".q-ordre-el").forEach(b=>b.disabled=false); });
  val.addEventListener("click",()=>{ if(picks.every((v,i)=>v===i)){ journal("Séquence correcte !","gain"); reussirDefi(); } else echouerDefi("Mauvaise séquence — le nœud se verrouille. Reviens demain."); });
}

/* cadenas (ratable : Mastermind — code de symboles, N essais dans la journée) */
function _htmlCadenas(d){
  const L=d.longueur||4, syms=d.symboles||["●","■","▲","◆","★","⬢"], maxE=d.essais||8;
  const opts=syms.map(s=>`<option value="${s}">${s}</option>`).join("");
  const slots=Array.from({length:L},(_,i)=>`<select class="q-cad-slot" data-i="${i}"><option value="">?</option>${opts}</select>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Trouve le code de ${L} symboles. ${maxE} essais — après, le sas se bloque pour la journée.</p>
    <div class="q-cad-slots">${slots}</div>
    <div class="quete-rep"><button class="mini" id="q-cad-go">Tester</button><span class="itip-gris" id="q-cad-cpt"></span></div>
    <div class="q-cad-hist" id="q-cad-hist"></div></div>`;
}
function _wireCadenas(z,d){
  const L=d.longueur||4, syms=d.symboles||["●","■","▲","◆","★","⬢"], maxE=d.essais||8;
  const secret=Array.from({length:L},()=>syms[Math.floor(Math.random()*syms.length)]);
  let essai=0; const cpt=z.querySelector("#q-cad-cpt"), hist=z.querySelector("#q-cad-hist");
  const maj=()=>{ cpt.textContent=`Essai ${essai+1}/${maxE}`; }; maj();
  z.querySelector("#q-cad-go").addEventListener("click",()=>{
    const g=[...z.querySelectorAll(".q-cad-slot")].map(s=>s.value);
    if(g.some(v=>!v)){ journal("Choisis un symbole pour chaque case.","alerte"); return; }
    let bien=0; const sc=secret.slice(), gc=g.slice();
    for(let i=0;i<L;i++){ if(gc[i]===sc[i]){ bien++; sc[i]=null; gc[i]=null; } }
    let pres=0; for(let i=0;i<L;i++){ if(gc[i]){ const j=sc.indexOf(gc[i]); if(j>=0){ pres++; sc[j]=null; } } }
    const ligne=document.createElement("div"); ligne.className="q-cad-ligne";
    ligne.innerHTML=`<span class="q-cad-code">${g.join(" ")}</span><span class="itip-gris">✔ ${bien} bien placé(s) · ~ ${pres} présent(s)</span>`;
    hist.prepend(ligne);
    if(bien===L){ journal("Code trouvé !","gain"); reussirDefi(); return; }
    essai++; if(essai>=maxE){ echouerDefi("Trop d'essais — le sas se bloque. Reviens demain."); return; } maj();
  });
}

/* sequence (ratable : Simon — répéter la suite qui s'allonge) */
function _htmlSequence(d){
  const syms=d.symboles||["◤","◥","◣","◢"], L=d.longueur||5;
  const pads=syms.map((s,i)=>`<button class="q-seq-pad" data-i="${i}">${s}</button>`).join("");
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">Mémorise puis répète la séquence (jusqu'à ${L}). Une erreur = fichu pour aujourd'hui.</p>
    <div class="q-seq-etat" id="q-seq-etat">Prêt ?</div>
    <div class="q-seq-pads">${pads}</div>
    <div class="quete-rep"><button class="mini" id="q-seq-go">Commencer</button></div></div>`;
}
function _wireSequence(z,d){
  const n=(d.symboles||["◤","◥","◣","◢"]).length, L=d.longueur||5;
  const pads=[...z.querySelectorAll(".q-seq-pad")], etat=z.querySelector("#q-seq-etat");
  let seq=[], pos=0, jouable=false;
  function flash(i){ const p=pads[i]; if(!p) return; p.classList.add("actif"); const t=setTimeout(()=>p.classList.remove("actif"),380); _queteTO.push(t); }
  function jouerSeq(){ jouable=false; etat.textContent="Regarde…"; let k=0;
    (function next(){ if(k>=seq.length){ jouable=true; etat.textContent="À toi !"; return; } flash(seq[k]); k++; const t=setTimeout(next,620); _queteTO.push(t); })(); }
  function tour(){ seq.push(Math.floor(Math.random()*n)); pos=0; const t=setTimeout(jouerSeq,500); _queteTO.push(t); }
  pads.forEach((p,i)=>p.addEventListener("click",()=>{
    if(!jouable) return; flash(i);
    if(i!==seq[pos]){ jouable=false; echouerDefi("Séquence ratée — la console se verrouille. Reviens demain."); return; }
    pos++;
    if(pos>=seq.length){ if(seq.length>=L){ jouable=false; journal("Séquence maîtrisée !","gain"); reussirDefi(); } else { jouable=false; etat.textContent="Bien !"; tour(); } }
  }));
  z.querySelector("#q-seq-go").addEventListener("click",function(){ this.disabled=true; seq=[]; tour(); });
}

/* memoire (ratable : on montre une info quelques secondes, puis une question) */
function _htmlMemoire(d){
  const a=queteActive();
  if(!a._memVue){
    const info=Array.isArray(d.info)?d.info.map(x=>`<div>${x}</div>`).join(""):(d.info||"");
    return `<div class="quete-etape">${_par(d.texte)}
      <p class="quete-indice">Mémorise bien — l'info va disparaître.</p>
      <div class="q-mem-info">${info}</div>
      <div class="quete-rep"><span class="itip-gris">Disparition dans <b id="q-mem-cpt">${Math.ceil((d.duree||6000)/1000)}</b> s</span></div></div>`;
  }
  return `<div class="quete-etape">${_par(d.texte)}
    <p class="quete-indice">${d.question}</p>
    <div class="quete-rep"><input id="q-mem-champ" placeholder="Ta réponse…" autocomplete="off"><button class="mini" id="q-mem-btn">Valider</button></div></div>`;
}
function _wireMemoire(z,d){
  const a=queteActive();
  if(!a._memVue){
    const cpt=z.querySelector("#q-mem-cpt"); let s=Math.ceil((d.duree||6000)/1000);
    if(_queteTimer) clearInterval(_queteTimer);
    _queteTimer=setInterval(()=>{ s--; if(cpt) cpt.textContent=s; if(s<=0){ clearInterval(_queteTimer); _queteTimer=null; a._memVue=true; majQueteHub(); } },1000);
    return;
  }
  const b=z.querySelector("#q-mem-btn"), c=z.querySelector("#q-mem-champ");
  const go=()=>{ if((d.reponses||d.reponse||[]).map(_qnorm).includes(_qnorm(c.value))){ journal("Bonne mémoire !","gain"); reussirDefi(); } else echouerDefi("Raté — mauvaise mémorisation. Reviens demain."); };
  if(b&&c){ b.addEventListener("click",go); c.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }); }
}

/* ---------- Déplacements (entrée/sortie de zone) ---------- */
function queteArrivee(){
  const a=queteActive(); if(!a || a._resolu) return; const e=etapeActive(); if(!e || !e.cible || !etat.pos) return;
  const d=(x,y)=>Math.hypot(etat.pos.x-x, etat.pos.y-y);
  const sur=d(e.cible.x,e.cible.y) <= (e.cible.r||70);
  if(sur && !a._sur){ a._sur=true; journal((e.arrivee?"":"Tu es arrivé au bon endroit — ")+"ouvre l'onglet Quêtes.","gain");
    if(!e.defi){ avancerQuete(); return; } sauvegarder(); rafraichirQuetes();
  } else if(!sur && a._sur){ a._sur=false; sauvegarder(); rafraichirQuetes();
  } else if(!sur){ for(const l of (e.leurres||[])){ if(d(l.x,l.y)<=(l.r||70)){ journal("Rien ici — fausse piste. Relis l'indice (onglet Quêtes).","alerte"); break; } } }
}

/* ---------- Marqueurs de carte ---------- */
function majMarqueursQuete(){
  const svg=document.querySelector("#carte"); if(!svg) return;
  let g=svg.querySelector("#quete-marqueurs");
  if(!g){ g=document.createElementNS("http://www.w3.org/2000/svg","g"); g.id="quete-marqueurs"; svg.appendChild(g); }
  const e=etapeActive(); const a=queteActive();
  if(!e || !e.cible || (a && a._resolu)){ g.innerHTML=""; return; }
  const pts=[e.cible, ...(e.leurres||[])];
  g.innerHTML=pts.map(p=>`<g class="lieu"><circle cx="${p.x}" cy="${p.y}" r="${p.r||70}" fill="#5aa8e6" fill-opacity="0.10" stroke="#5aa8e6" stroke-opacity="0.75" stroke-dasharray="6 8"/><text x="${p.x}" y="${p.y+14}" text-anchor="middle" style="fill:#5aa8e6" font-size="40">★</text></g>`).join("");
}

/* ---------- Onglet « Quêtes » ---------- */
function majQueteHub(){
  const z=document.querySelector("#hub-quete"); if(!z) return;
  _queteStyle();
  _clearQ();
  const enFac=_enFaction();
  // Donneur : lu sur la quête active (défaut = Vieux Sorn). L'image se déduit du
  // champ donneurImg, sinon d'un nom de fichier dérivé du donneur.
  const _qa0=queteActive(); const _qd0=_qa0?queteData(_qa0.id):null;
  const _dNom=(_qd0&&_qd0.donneur)||"Vieux Sorn";
  const _dImg=(_qd0&&_qd0.donneurImg)||("images/quetes/"+_dNom.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")+".png");
  const _dLieu=(_qd0&&_qd0.donneurLieu)||"Comptoir";
  const banniere = enFac ? `<div class="quete-banniere"><img src="${_dImg}" alt="" onerror="this.remove()"><span>${_dNom} — ${_dLieu}</span></div>` : "";
  const a=queteActive();

  if(!a){
    if(!enFac){ z.innerHTML=`<p class="vide">Les quêtes se prennent au <b>comptoir de ta ville de faction</b>. Rejoins-la pour voir ce qu'on te réserve.</p>`; return; }
    const q=queteProchaine(); let html=banniere;
    if(q) html+=`<h3 style="margin:2px 0">${q.nom}</h3><p class="vide" style="margin:0 0 8px">Donneur : <b>${q.donneur}</b></p>${_par(q.intro)}<button class="mini" id="quete-accepter" style="margin-top:10px">Accepter la quête</button>`;
    else html+=`<p class="vide">Toutes les quêtes disponibles sont accomplies. Le Vieux Sorn n'a rien de plus pour l'instant.</p>`;
    z.innerHTML=html;
    const acc=z.querySelector("#quete-accepter"); if(acc) acc.addEventListener("click",()=>{ const nx=queteProchaine(); if(nx) accepterQuete(nx.id); });
    return;
  }

  const q=queteData(a.id); const e=etapeActive(); const n=q.etapes.length;
  const entete=banniere+`<h3 style="margin:2px 0">${q.nom}</h3><p class="vide" style="margin:0 0 10px">${q.donneur} · étape ${a.etape+1}/${n}</p>`;

  if(a._resolu){
    let html=entete;
    if(e.image) html+=`<img class="quete-img" src="${e.image}" alt="" onerror="this.remove()">`;
    html+=`<div class="quete-etape" style="border-left-color:var(--bleu)">${_par((e.defi&&e.defi.reussite)||["La voie s'ouvre."])}</div>`;
    const dernier=(a.etape>=q.etapes.length-1);
    html+=`<button class="mini" id="quete-continuer" style="margin-top:6px">${dernier?"Terminer la quête":"Continuer →"}</button>`;
    z.innerHTML=html;
    const bc=z.querySelector("#quete-continuer"); if(bc) bc.addEventListener("click",avancerQuete);
    return;
  }

  if(surSiteQuete()){
    const verrou=queteVerrou();
    let html=entete+`<div class="quete-etape" style="border-left-color:var(--bleu)">`;
    if(e.image) html+=`<img class="quete-img" src="${e.image}" alt="" onerror="this.remove()">`;
    html+=_par(e.arrivee)+`</div>`;
    if(verrou>0) html+=`<div class="quete-etape"><p class="quete-indice">🔒 Échec — le mécanisme s'est verrouillé.</p><p class="vide">Reviens tenter à nouveau dans <b id="q-verrou">${_fmtDuree(verrou)}</b> (le lendemain).</p></div>`;
    else html+=_defiHTML(e.defi);
    html+=`<button class="mini danger" id="quete-abandon" style="margin-top:6px">Abandonner</button>`;
    z.innerHTML=html;
    if(verrou>0){ _queteTimer=setInterval(()=>{ const r=queteVerrou(); const el=z.querySelector("#q-verrou"); if(el) el.textContent=_fmtDuree(r); if(r<=0){ clearInterval(_queteTimer); _queteTimer=null; rafraichirQuetes(); } },1000); }
    else _defiWire(z, e.defi);
    const ab=z.querySelector("#quete-abandon"); if(ab) ab.addEventListener("click",abandonnerQuete);
    return;
  }

  let html=entete+`<div class="quete-etape"><p style="margin:0 0 2px"><b>Objectif :</b></p>
    <p class="quete-indice">« ${e.indice||"—"} »</p>
    <p class="vide" style="margin:0">Ouvre la carte : des repères ★ sont apparus (certains sont de fausses pistes). Rends-toi au bon endroit — l'épreuve n'apparaît que sur place.</p></div>`;
  html+=`<button class="mini danger" id="quete-abandon" style="margin-top:6px">Abandonner</button>`;
  z.innerHTML=html;
  const ab=z.querySelector("#quete-abandon"); if(ab) ab.addEventListener("click",abandonnerQuete);
}

/* ---------- Style + rafraîchissement ---------- */
let _queteStyleMonte=false;
function _queteStyle(){
  if(_queteStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    .quete-banniere{ position:relative; width:100%; aspect-ratio:3/1; max-height:340px; border:1px solid var(--edge); border-radius:var(--r-s); overflow:hidden; margin-bottom:12px; background:linear-gradient(120deg, rgba(255,138,61,.18), rgba(90,168,230,.12)); }
    .quete-banniere img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
    .quete-banniere span{ position:absolute; left:0; right:0; bottom:0; padding:16px 16px 10px; background:linear-gradient(transparent, rgba(4,10,26,.82)); font-family:"Space Mono",monospace; letter-spacing:.12em; text-transform:uppercase; color:var(--orange-hi); font-size:13px; }
    .quete-etape{ border:1px solid var(--line); border-left:2px solid var(--orange); border-radius:var(--r-s); padding:10px 12px; margin:6px 0; background:rgba(16,40,37,.35); }
    .quete-dial{ margin:7px 0; line-height:1.5; }
    .quete-img{ width:100%; aspect-ratio:3/1; max-height:300px; object-fit:cover; border-radius:8px; margin:0 0 10px; display:block; }
    .quete-indice{ font-style:italic; color:var(--texte); margin:6px 0; }
    .quete-rep{ display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center; }
    .quete-rep input{ flex:1; min-width:160px; background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:8px 10px; font-family:inherit; }
    .q-liv-ligne{ display:flex; align-items:center; gap:8px; margin:4px 0; }
    .q-pir-piste{ position:relative; height:24px; background:#0f1830; border:1px solid var(--line); border-radius:6px; overflow:hidden; margin:8px 0; }
    .q-pir-zone{ position:absolute; top:0; bottom:0; background:rgba(139,212,80,.35); border-left:1px solid #8bd450; border-right:1px solid #8bd450; }
    .q-pir-curseur{ position:absolute; top:0; bottom:0; width:3px; background:var(--orange-hi,#ffb060); left:0; }
    .q-gly-grille{ display:flex; flex-wrap:wrap; gap:10px; margin:8px 0; }
    .q-gly-carte{ display:flex; flex-direction:column; align-items:center; gap:5px; border:1px solid var(--line); border-radius:8px; padding:8px 10px; background:rgba(16,41,78,.4); min-width:92px; }
    .q-gly-pic{ font-size:22px; line-height:1; } .q-gly-pic img{ width:32px; height:32px; object-fit:contain; }
    .q-gly-sym{ font-size:30px; color:var(--bleu); line-height:1; } .q-gly-sym img{ width:36px; height:36px; object-fit:contain; }
    .q-gly-sel{ background:#0f1830; border:1px solid var(--line); border-radius:6px; color:var(--texte); padding:4px 6px; font-family:inherit; font-size:12px; max-width:110px; }
    .q-cad-slots,.q-seq-pads{ display:flex; gap:8px; flex-wrap:wrap; margin:8px 0; }
    .q-cad-slot{ background:#0f1830; border:1px solid var(--line); border-radius:6px; color:var(--bleu); font-size:18px; padding:4px 6px; }
    .q-cad-hist{ display:flex; flex-direction:column; gap:4px; margin-top:8px; }
    .q-cad-ligne{ display:flex; justify-content:space-between; gap:10px; font-size:13px; }
    .q-cad-code{ font-size:18px; letter-spacing:.15em; color:var(--bleu); }
    .q-seq-pad{ font-size:26px; width:56px; height:56px; background:rgba(16,41,78,.5); border:1px solid var(--line); border-radius:10px; color:var(--texte); cursor:pointer; }
    .q-seq-pad.actif{ background:var(--orange,#ff8a3d); color:#04101a; box-shadow:0 0 16px var(--orange,#ff8a3d); }
    .q-seq-etat{ margin:4px 0; font-family:"Space Mono",monospace; font-size:12px; color:var(--sourdine,#7f93a8); }
    .q-mem-info{ background:rgba(90,168,230,.12); border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin:8px 0; font-family:"Space Mono",monospace; line-height:1.6; }
    .q-ordre-pool,.q-ordre-rep{ display:flex; flex-wrap:wrap; gap:6px; margin:6px 0; }
    .q-ordre-el:disabled{ opacity:.35; }
    .q-ordre-chip{ font-family:"Space Mono",monospace; font-size:12px; background:rgba(90,168,230,.15); border:1px solid var(--line); border-radius:6px; padding:3px 8px; }
  `;
  document.head.appendChild(st); _queteStyleMonte=true;
}
// Rafraîchit l'onglet Quêtes depuis afficher() SEULEMENT pour livraison/paiement
// (dépendent du sac/crédits ; pas de saisie ni d'animation à préserver).
function majQueteHubSiPertinent(){
  const a=queteActive(); if(!a || a._resolu) return;
  const e=etapeActive(); if(!e || !e.defi || !surSiteQuete()) return;
  if(e.defi.type==="livraison" || e.defi.type==="paiement") majQueteHub();
}
function rafraichirQuetes(){
  if(typeof majQueteHub==="function") majQueteHub();
  if(typeof afficher==="function") afficher();
}
