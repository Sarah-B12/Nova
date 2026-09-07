/* ===========================================================
   ESPIONNAGE — Bureau de l'Ombre (hack de faction) + mini-jeu F1.
   Espionner une faction (2×/j/faction) : cible une info (caisse, cible d'expédition,
   nb d'enrôlés, annonce). Difficulté ↑ selon la Détection de la cible.
   Échec → risque de prison (atténué par l'Agilité). Rapports stockés 3 j.
   =========================================================== */
(function(){ if(document.querySelector("#esp-style")) return;
  const st=document.createElement("style"); st.id="esp-style";
  st.textContent=`
    #esp-f1 .modale-boite{ text-align:center; }
    .f1-grille{ display:grid; gap:6px; margin:12px auto; max-width:320px; }
    .f1-case{ aspect-ratio:1; border:1px solid var(--line); border-radius:8px; background:#0f1830; cursor:pointer; transition:background .08s; }
    .f1-case.on{ background:var(--orange,#ff8a3d); box-shadow:0 0 10px var(--orange,#ff8a3d); }
    .f1-case.ok{ background:var(--vert,#8bd450); }
    .f1-case.ko{ background:#ff5257; }
    .f1-msg{ min-height:22px; margin-top:4px; }
    .p1-nodes{ display:flex; gap:8px; justify-content:center; margin:12px 0; flex-wrap:wrap; }
    .p1-node{ width:38px; height:38px; border-radius:50%; border:1px solid var(--line); background:#0f1830; cursor:pointer; }
    .p1-node.on{ background:var(--orange,#ff8a3d); box-shadow:0 0 10px var(--orange,#ff8a3d); }
    .p2-piste{ position:relative; height:46px; background:#0f1830; border:1px solid var(--line); border-radius:8px; margin:12px 0; overflow:hidden; }
    .p2-zone{ position:absolute; top:0; bottom:0; left:68%; width:20%; background:rgba(255,82,87,.18); border-left:2px solid #ff5257; border-right:2px solid #ff5257; }
    .p2-bloc{ position:absolute; top:9px; width:22px; height:28px; margin-left:-11px; background:var(--orange,#ff8a3d); border:none; border-radius:5px; cursor:pointer; box-shadow:0 0 6px rgba(255,138,61,.6); }
    .p3-palette{ display:flex; gap:6px; justify-content:center; margin:10px 0; flex-wrap:wrap; }
    .p3-sym{ width:40px; height:40px; border:1px solid var(--line); border-radius:8px; background:#0f1830; font-size:20px; cursor:pointer; }
    .p3-sym.sel{ border-color:var(--orange,#ff8a3d); }
    .p3-slots{ display:flex; gap:6px; justify-content:center; margin:8px 0; }
    .p3-slot{ width:40px; height:40px; border:1px dashed var(--line); border-radius:8px; display:grid; place-items:center; font-size:20px; background:rgba(15,24,48,.5); }
    .p3-essais{ margin:8px 0; }
    .p3-essai{ display:flex; gap:6px; justify-content:center; align-items:center; margin:4px 0; }
    .p3-mini{ width:30px; height:30px; border-radius:6px; display:grid; place-items:center; font-size:15px; background:#0f1830; border:1px solid var(--line); }
    .p3-ind{ font-size:12px; color:var(--sourdine); margin-left:6px; }
    .f2-bar{ position:relative; height:28px; background:#0f1830; border:1px solid var(--line); border-radius:8px; margin:8px auto; cursor:pointer; overflow:hidden; max-width:340px; }
    .f2-zone{ position:absolute; top:0; bottom:0; background:rgba(139,212,80,.22); border-left:2px solid var(--vert,#8bd450); border-right:2px solid var(--vert,#8bd450); }
    .f2-curseur{ position:absolute; top:3px; bottom:3px; width:6px; margin-left:-3px; background:var(--orange,#ff8a3d); border-radius:3px; box-shadow:0 0 8px var(--orange,#ff8a3d); }
    .f2-bar.ok{ border-color:var(--vert,#8bd450); }
    .f2-bar.ko{ border-color:#ff5257; }
  `;
  document.head.appendChild(st);
})();

function _espInfoNom(i){ return {caisse:"Caisse","expedition_cible":"Cible d'expédition",enroles:"Nb d'enrôlés",annonce:"Annonce du Régent"}[i]||i; }

async function majBureauOmbre(el, fac){
  if(!el) return;
  el.innerHTML=`<p class="vide">Chargement…</p>`;
  const roles=(typeof _chargerMesRolesGouv==="function")?await _chargerMesRolesGouv():[];
  const estOmbre=roles.includes("espion");
  let rapports=[];
  try{ await sb.rpc("espionnage_purge"); const { data } = await sb.from("espionnage").select("*").order("cree_le",{ascending:false}).limit(30); rapports=data||[]; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "espionnage.js#1"); }
  let hacks=[]; try{ await sb.rpc("hack_protocole_purge"); const { data } = await sb.from("hack_protocole").select("*").order("cree_le",{ascending:false}).limit(20); hacks=data||[]; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "espionnage.js#2"); }
  let h=`<h3>Bureau de l'Ombre</h3>`;
  if(estOmbre){
    const cibles=(typeof FACTIONS!=="undefined"?FACTIONS:[]).filter(f=>f.id!==fac).map(f=>`<option value="${f.id}">${f.nom}</option>`).join("");
    h+=`<h4 class="gsec">Espionner une faction</h4>`;
    h+=`<div class="reg-compose"><select id="esp-cible" class="gouv-textarea" style="padding:8px">${cibles}</select><select id="esp-info" class="gouv-textarea" style="padding:8px"><option value="caisse">Caisse</option><option value="expedition_cible">Cible d'expédition</option><option value="enroles">Nb d'enrôlés</option><option value="annonce">Annonce du Régent</option></select><button class="mini" id="esp-sonder">Sonder la cible</button><div id="esp-statut" class="itip-gris"></div><button class="mini" id="esp-hack" disabled>Lancer le hack</button></div>`;
    h+=`<p class="itip-gris" style="font-size:12px">2 tentatives/jour par faction. La difficulté monte avec la <b>Détection (👁️)</b> de la cible. Un échec peut t'envoyer en <b>prison</b> (risque réduit par ton <b>Agilité</b>).</p>`;
    h+=`<h4 class="gsec" style="margin-top:16px">Hacker le Protocole</h4>`;
    h+=`<p class="itip-gris" style="font-size:12px">Le hack se fait <b>au pied du mur du Protocole</b> (sur son anneau, via la carte) — pas depuis le bureau. 1 tentative/jour/faction (succès ou échec). Réussite → une info aléatoire (défense du jour, offensive à venir, cible, puissance) ; échec → risque de patrouille. Partagez vos infos entre factions !</p>`;
  } else h+=`<p class="itip-gris">L'espionnage est réservé à l'Ombre. Tu peux consulter les rapports ci-dessous.</p>`;
  h+=`<h4 class="gsec" style="margin-top:16px">Rapports d'espionnage (3 jours)</h4>`;
  if(!rapports.length) h+=`<p class="vide">Aucun rapport pour l'instant.</p>`;
  else h+=rapports.map(r=>{ const cn=(typeof _expCibleNom==="function")?_expCibleNom(r.cible):r.cible; const dt=(typeof _dateHeure==="function")?_dateHeure(r.cree_le):"";
    return `<div class="poste-ligne"><span class="poste-txt"><span class="itip-gris">${dt}</span> · <b>${cn}</b> · ${r.reussi?'<span class="or">réussi</span>':'<span style="color:#ff5257">échec</span>'} · ${_espInfoNom(r.info)}${r.reussi&&r.resultat?` · <b>${(r.resultat||"").replace(/</g,"&lt;")}</b>`:""}</span></div>`; }).join("");
  h+=`<h4 class="gsec" style="margin-top:16px">Renseignements Protocole (3 jours)</h4>`;
  if(!hacks.length) h+=`<p class="vide">Aucun renseignement.</p>`;
  else h+=hacks.map(r=>{ const dt=(typeof _dateHeure==="function")?_dateHeure(r.cree_le):""; return `<div class="poste-ligne"><span class="poste-txt"><span class="itip-gris">${dt}</span> · ${r.reussi?`<span class="or">${_hpInfoNom(r.info)}</span> — <b>${(r.valeur||"").replace(/</g,"&lt;")}</b>`:'<span style="color:#ff5257">hack raté</span>'}</span></div>`; }).join("");
  el.innerHTML=h;

  if(estOmbre){
    let _det=0, _restant=0, _contre=false;
    el.querySelector("#esp-sonder").addEventListener("click", async()=>{
      const cible=el.querySelector("#esp-cible").value;
      const { data:res, error } = await sb.rpc("espionnage_cible",{ p_cible:cible });
      const st=el.querySelector("#esp-statut"); const hb=el.querySelector("#esp-hack");
      if(error || !res || !res.ok){ st.textContent="Sondage impossible."; hb.disabled=true; return; }
      _det=res.detection; _restant=res.restant; _contre=!!res.contre;
      st.innerHTML=`Détection de la cible : <b>${_det}</b> 👁️ · tentatives restantes aujourd'hui : <b>${_restant}</b>${_contre?' · <b style="color:#ff5257">Contre-espionnage actif — hack plus difficile !</b>':''}`;
      hb.disabled = _restant<=0;
    });
    el.querySelector("#esp-hack").addEventListener("click", async()=>{
      const cible=el.querySelector("#esp-cible").value, info=el.querySelector("#esp-info").value;
      if(_restant<=0){ journal("Plus de tentatives aujourd'hui contre cette faction.","alerte"); return; }
      const jeu=Math.random()<0.5?_espF1:_espF2;
      const reussi=await jeu(_det + (_contre?3:0));
      const { data:res, error } = await sb.rpc("espionner",{ p_cible:cible, p_info:info, p_reussi:reussi });
      if(error || !res || !res.ok){ if(res&&res.err==="limite") journal("Limite atteinte.","alerte"); else journal("Espionnage impossible.","alerte"); return; }
      if(res.reussi){ if(typeof gagnerXp==="function") gagnerXp(5); journal(`Espionnage réussi — ${_espInfoNom(info)} de ${(typeof _expCibleNom==="function")?_expCibleNom(cible):cible} : ${res.resultat}`,"gain"); }
      else{ journal("Espionnage raté.","alerte"); _prisonEspion(cible); }
      if(typeof majCentre==="function") majCentre();
    });
  }
}
async function hackerProtocoleDepuisCarte(){
  if(typeof surAnneauProtocole==="function" && !surAnneauProtocole()){ journal("Approche-toi du mur du Protocole pour le hacker.","alerte"); return; }
  if(typeof enPrison==="function" && enPrison()){ journal("Impossible : tu es en prison.","alerte"); return; }
  let d; try{ const r=await sb.rpc("hack_protocole_dispo"); d=r.data; }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "espionnage.js#3"); }
  if(!d || !d.ombre){ journal("Seule l'Ombre de ta faction peut hacker le Protocole.","alerte"); return; }
  if(d.restant<=0){ journal("Ta faction a déjà tenté de hacker le Protocole aujourd'hui.","alerte"); return; }
  const reussi=await _lancerHackProto();
  const { data:res, error } = await sb.rpc("hacker_protocole",{ p_reussi:reussi });
  if(error || !res || !res.ok){ if(res&&res.err==="limite") journal("Déjà tenté aujourd'hui.","alerte"); else journal("Hack impossible.","alerte"); return; }
  if(res.reussi && typeof gagnerXp==="function") gagnerXp(8);
  if(res.reussi) journal(`Hack réussi — ${_hpInfoNom(res.info)} : ${res.valeur}`,"gain");
  else{ journal("Hack du Protocole raté ! Une patrouille rôde…","alerte"); if(Math.random()<0.7 && typeof ouvrirPatrouille==="function") ouvrirPatrouille(); }
}
function _hpInfoNom(i){ return {defense:"Défense du jour",menace:"Offensive",cible:"Cible probable",puissance:"Puissance"}[i]||i; }
function _lancerHackProto(){ const j=[_hackP1,_hackP2,_hackP3]; return j[Math.floor(Math.random()*j.length)](); }
function _hackP1(){
  return new Promise(resolve=>{
    const n=9, scrambles=8, temps=25000;
    const toggle=(s,i)=>{ [i-1,i,i+1].forEach(j=>{ if(j>=0&&j<n) s[j]=!s[j]; }); };
    let state; do{ state=Array(n).fill(true); for(let k=0;k<scrambles;k++) toggle(state,Math.floor(Math.random()*n)); }while(state.every(x=>x));
    const m=document.createElement("div"); m.className="modale"; m.id="hp-p1"; m.hidden=false;
    m.innerHTML=`<div class="membrane modale-boite"><h2>Cascade de nœuds</h2><p class="itip-gris">Allume TOUS les nœuds. Cliquer un nœud inverse lui et ses deux voisins.</p><div class="p1-nodes"></div><div class="f1-msg" id="p1-msg"></div></div>`;
    document.body.appendChild(m);
    const cont=m.querySelector(".p1-nodes"); const msg=m.querySelector("#p1-msg"); const btns=[];
    let fini=false; const t0=Date.now();
    const render=()=>state.forEach((on,i)=>btns[i].classList.toggle("on",on));
    for(let i=0;i<n;i++){ const b=document.createElement("button"); b.className="p1-node"; cont.appendChild(b); btns.push(b);
      b.onclick=()=>{ if(fini) return; toggle(state,i); render(); if(state.every(x=>x)) fin(true); }; }
    render();
    const timer=setInterval(()=>{ if(fini){clearInterval(timer);return;} const r=temps-(Date.now()-t0); if(r<=0){clearInterval(timer); fin(false); return;} msg.textContent=Math.ceil(r/1000)+" s"; },250);
    function fin(ok){ fini=true; btns.forEach(b=>b.onclick=null); msg.innerHTML= ok?'<b class="or">Nœuds synchronisés !</b>':'<b style="color:#ff5257">Trace détectée.</b>'; setTimeout(()=>{ m.remove(); resolve(ok); },900); }
  });
}
function _hackP2(){
  return new Promise(resolve=>{
    const total=6, maxMiss=1, zoneA=68, zoneB=88, vit=0.9, gapMs=850;
    let intercept=0, miss=0, spawned=0, fini=false;
    const m=document.createElement("div"); m.className="modale"; m.id="hp-p2"; m.hidden=false;
    m.innerHTML=`<div class="membrane modale-boite"><h2>Interception de flux</h2><p class="itip-gris">Clique chaque programme quand il entre dans la <b style="color:#ff5257">zone rouge</b>. Ne laisse pas passer (1 échappé toléré).</p><div class="p2-piste"><div class="p2-zone"></div></div><div class="f1-msg" id="p2-msg">Interceptés : 0/${total}</div></div>`;
    document.body.appendChild(m);
    const piste=m.querySelector(".p2-piste"); const msg=m.querySelector("#p2-msg"); const blocs=[];
    const spawner=setInterval(()=>{ if(fini) return; if(spawned>=total){ clearInterval(spawner); return; } spawned++;
      const el=document.createElement("button"); el.className="p2-bloc"; el.style.left="0%"; piste.appendChild(el);
      const b={el,x:0,alive:true};
      el.onclick=()=>{ if(!b.alive||fini) return; if(b.x>=zoneA && b.x<=zoneB){ b.alive=false; el.remove(); intercept++; msg.textContent=`Interceptés : ${intercept}/${total}`; } };
      blocs.push(b);
    }, gapMs);
    function boucle(){ if(fini) return;
      blocs.forEach(b=>{ if(!b.alive) return; b.x+=vit; b.el.style.left=b.x+"%"; if(b.x>100){ b.alive=false; b.el.remove(); miss++; if(miss>maxMiss){ fin(false); return; } } });
      if(!fini && spawned>=total && blocs.every(b=>!b.alive)){ fin(intercept>=total-maxMiss); return; }
      if(!fini) requestAnimationFrame(boucle);
    }
    requestAnimationFrame(boucle);
    function fin(ok){ if(fini) return; fini=true; clearInterval(spawner); msg.innerHTML= ok?'<b class="or">Flux intercepté !</b>':'<b style="color:#ff5257">Programme passé — alerte déclenchée.</b>'; setTimeout(()=>{ m.remove(); resolve(ok); }, 900); }
  });
}
function _hackP3(){
  return new Promise(resolve=>{
    const SYM=["◆","▲","●","■","★","✦"];
    const LON=4, MAXE=6;
    const code=[]; for(let i=0;i<LON;i++) code.push(Math.floor(Math.random()*SYM.length));
    let saisie=[]; let essais=0; let fini=false;
    const m=document.createElement("div"); m.className="modale"; m.id="hp-p3"; m.hidden=false;
    m.innerHTML=`<div class="membrane modale-boite"><h2>Reconstruction de signal</h2><p class="itip-gris">Retrouve le code de ${LON} symboles en ${MAXE} essais. Après chaque essai : ● bien placé, ○ présent ailleurs.</p><div class="p3-slots" id="p3-slots"></div><div class="p3-palette" id="p3-pal"></div><button class="mini" id="p3-valider" disabled>Valider l'essai</button><div class="p3-essais" id="p3-essais"></div><div class="f1-msg" id="p3-msg">Essai 1/${MAXE}</div></div>`;
    document.body.appendChild(m);
    const slotsEl=m.querySelector("#p3-slots"), palEl=m.querySelector("#p3-pal"), essaisEl=m.querySelector("#p3-essais"), msg=m.querySelector("#p3-msg"), btn=m.querySelector("#p3-valider");
    function majSlots(){ slotsEl.innerHTML=""; for(let i=0;i<LON;i++){ const d=document.createElement("div"); d.className="p3-slot"; d.textContent = saisie[i]!=null?SYM[saisie[i]]:""; d.onclick=()=>{ if(fini) return; saisie.splice(i,1); majSlots(); btn.disabled=saisie.length!==LON; }; slotsEl.appendChild(d); } }
    SYM.forEach((s,idx)=>{ const b=document.createElement("button"); b.className="p3-sym"; b.textContent=s; b.onclick=()=>{ if(fini||saisie.length>=LON) return; saisie.push(idx); majSlots(); btn.disabled=saisie.length!==LON; }; palEl.appendChild(b); });
    majSlots();
    btn.addEventListener("click",()=>{
      if(fini||saisie.length!==LON) return;
      essais++;
      let bien=0, ailleurs=0; const cCode=[...code], cEss=[...saisie];
      for(let i=0;i<LON;i++){ if(cEss[i]===cCode[i]){ bien++; cCode[i]=cEss[i]=-1; } }
      for(let i=0;i<LON;i++){ if(cEss[i]===-1) continue; const j=cCode.indexOf(cEss[i]); if(j>=0){ ailleurs++; cCode[j]=-1; } }
      const row=document.createElement("div"); row.className="p3-essai";
      row.innerHTML=saisie.map(s=>`<div class="p3-mini">${SYM[s]}</div>`).join("")+`<span class="p3-ind">${"●".repeat(bien)}${"○".repeat(ailleurs)||(bien?"":"—")}</span>`;
      essaisEl.appendChild(row);
      if(bien===LON){ fin(true); return; }
      if(essais>=MAXE){ fin(false); return; }
      saisie=[]; majSlots(); btn.disabled=true; msg.textContent=`Essai ${essais+1}/${MAXE}`;
    });
    function fin(ok){ fini=true; btn.disabled=true; msg.innerHTML= ok?'<b class="or">Signal reconstruit !</b>':`<b style="color:#ff5257">Signal perdu.</b> Code : ${code.map(i=>SYM[i]).join(" ")}`; setTimeout(()=>{ m.remove(); resolve(ok); }, ok?900:1600); }
  });
}

function _prisonEspion(cible){
  const agi=(typeof agiliteEffective==="function")?agiliteEffective():5;
  const pPrison=Math.max(0.1, 0.6 - agi*0.03);
  if(Math.random() < pPrison){
    const facteur=Math.max(0.4, 1 - agi*0.03);
    const ms=Math.round(((typeof _vjm==="function")?_vjm():86400000)*facteur);
    if(typeof emprisonnerJoueur==="function") emprisonnerJoueur(cible, ms);
    else { etat.prisonJusqua=Date.now()+ms; etat.prisonFaction=cible; if(typeof sauvegarder==="function") sauvegarder(); }
    const cn=(typeof _expCibleNom==="function")?_expCibleNom(cible):cible;
    journal("Repéré ! Tu es jeté dans la prison de "+cn+".","alerte");
    if(typeof afficher==="function") afficher();
  } else {
    journal("Repéré, mais tu files avant qu'on t'attrape.","alerte");
  }
}

/* ---------- Mini-jeu F1 : Traversée de pare-feu (mémoire de chemin) ---------- */
function _espF1(det){
  return new Promise(resolve=>{
    const n = det<=2?4 : det<=5?5 : 6;
    const len = det<=2?4 : det<=5?6 : 8;
    const flash = det<=2?650 : det<=5?500 : 380;
    const libres=[...Array(n*n).keys()]; const path=[];
    for(let i=0;i<len;i++){ const idx=Math.floor(Math.random()*libres.length); path.push(libres.splice(idx,1)[0]); }
    const m=document.createElement("div"); m.className="modale"; m.id="esp-f1"; m.hidden=false;
    m.innerHTML=`<div class="membrane modale-boite"><h2>Traversée de pare-feu</h2><p class="itip-gris">Mémorise le chemin qui s'illumine, puis reproduis-le dans l'ordre.</p><div class="f1-grille" style="grid-template-columns:repeat(${n},1fr)"></div><div class="f1-msg">Observe…</div></div>`;
    document.body.appendChild(m);
    const grille=m.querySelector(".f1-grille"); const msg=m.querySelector(".f1-msg"); const btns=[];
    for(let i=0;i<n*n;i++){ const b=document.createElement("button"); b.className="f1-case"; b.disabled=true; grille.appendChild(b); btns.push(b); }
    let k=0;
    const flashNext=()=>{
      if(k>0) btns[path[k-1]].classList.remove("on");
      if(k>=path.length){ setTimeout(saisie, 250); return; }
      btns[path[k]].classList.add("on"); k++; setTimeout(flashNext, flash);
    };
    setTimeout(flashNext, 500);
    function saisie(){
      msg.textContent="À toi : reproduis le chemin.";
      let pos=0;
      btns.forEach((b,i)=>{ b.disabled=false; b.onclick=()=>{
        if(i===path[pos]){ b.classList.add("ok"); pos++; if(pos>=path.length) fin(true); }
        else { b.classList.add("ko"); fin(false); }
      }; });
    }
    function fin(ok){
      btns.forEach(b=>{ b.disabled=true; b.onclick=null; });
      msg.innerHTML = ok ? '<b class="or">Intrusion réussie !</b>' : '<b style="color:#ff5257">Pare-feu déclenché.</b>';
      setTimeout(()=>{ m.remove(); resolve(ok); }, 900);
    }
  });
}

/* ---------- Mini-jeu F2 : Synchronisation de fréquence (timing) ---------- */
function _espF2(det){
  return new Promise(resolve=>{
    const nb = det<=2?2 : det<=5?3 : 4;
    const zoneW = det<=2?22 : det<=5?16 : 12;
    const vit = det<=2?0.55 : det<=5?0.85 : 1.15;
    const temps = det<=2?9000 : det<=5?8000 : 7000;
    const bars=[]; let barsHtml="";
    for(let i=0;i<nb;i++){
      const zoneStart=10+Math.random()*(80-zoneW), pos=Math.random()*100, dir=Math.random()<0.5?1:-1;
      bars.push({ pos, dir, zoneStart, locked:false, failed:false });
      barsHtml+=`<div class="f2-bar" data-bar="${i}"><div class="f2-zone" style="left:${zoneStart}%;width:${zoneW}%"></div><div class="f2-curseur" style="left:${pos}%"></div></div>`;
    }
    const m=document.createElement("div"); m.className="modale"; m.id="esp-f2"; m.hidden=false;
    m.innerHTML=`<div class="membrane modale-boite"><h2>Synchronisation de fréquence</h2><p class="itip-gris">Clique chaque barre quand le curseur est dans la zone verte. Toutes avant la fin du temps.</p>${barsHtml}<div class="f1-msg" id="f2-msg"></div></div>`;
    document.body.appendChild(m);
    const els=[...m.querySelectorAll(".f2-bar")]; const curseurs=els.map(e=>e.querySelector(".f2-curseur"));
    let fini=false; const t0=Date.now(); const msg=m.querySelector("#f2-msg");
    els.forEach((e,i)=>e.addEventListener("click",()=>{
      if(fini||bars[i].locked||bars[i].failed) return;
      const b=bars[i];
      if(b.pos>=b.zoneStart && b.pos<=b.zoneStart+zoneW){ b.locked=true; e.classList.add("ok"); if(bars.every(x=>x.locked)) fin(true); }
      else { b.failed=true; e.classList.add("ko"); fin(false); }
    }));
    function boucle(){
      if(fini) return;
      const reste=temps-(Date.now()-t0);
      if(reste<=0){ fin(false); return; }
      msg.textContent=(reste/1000).toFixed(1)+" s";
      bars.forEach((b,i)=>{ if(b.locked) return; b.pos+=b.dir*vit; if(b.pos<=0){b.pos=0;b.dir=1;} if(b.pos>=100){b.pos=100;b.dir=-1;} curseurs[i].style.left=b.pos+"%"; });
      requestAnimationFrame(boucle);
    }
    requestAnimationFrame(boucle);
    function fin(ok){ fini=true; msg.innerHTML= ok?'<b class="or">Fréquences synchronisées !</b>':'<b style="color:#ff5257">Signal perdu.</b>'; setTimeout(()=>{ m.remove(); resolve(ok); }, 900); }
  });
}
