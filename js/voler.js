/* ===========================================================
   VOLER / HACKER — PvP. Cibles SIMULÉES en attendant le backend
   (mêmes règles que le vrai multi : il n'y aura qu'à rebrancher les vraies cibles).
     • Voler  : objets. Plus risqué, moins payant. Échec → démasqué (TON NOM).
                Gros échec → prison. Réussite = Agilité. Prérequis : Discrétion.
     • Hacker : crédits (≤30%). Meilleur, anonyme (« un anonyme » chez la victime).
                Réussite = MINI-JEU (+ Intelligence). Prérequis : Ordinateur de hacking
                équipé + Intrusion. Risque de prison plus faible.
     • Coûte 15% d'énergie. Cible = un joueur AU HASARD présent dans la ville.
     • Intouchables : équipement porté (armes/armures) + vaisseau équipé.
     • Immunité des nouveaux (<20 j) ; une victime volable 1×/jour (simulé ici).
   =========================================================== */
const VOL_ENERGIE     = 15;
const VOL_CAP_CREDITS = 0.30;
const VOL_CAP_ABS     = 500;    // plafond absolu de crédits par hack (anti-jackpot)
const VOL_CAP_OBJETS  = 3;
const IMMUNITE_JOURS  = 20;
const ITEM_HACK_VOL   = "fab_ordinateur_de_hacking";
let _volTimer = null, _hackTimer = null, _hackWin = null, _hackLose = null, _hackCleanup = null;

function _vjm(){ return (typeof JOUR_MS!=="undefined")?JOUR_MS:86400000; }
function _vfmt(ms){ ms=Math.max(0,ms); const s=Math.ceil(ms/1000); if(s<60) return s+" s"; const m=Math.floor(s/60); return m+" min "+(s%60)+" s"; }
function _apris(id){ return !!(etat.aptitudes && Array.isArray(etat.aptitudes.pris) && etat.aptitudes.pris.includes(id)); }
function aDiscretion(){ return _apris("om1"); }
function aIntrusion(){ return _apris("om4"); }
function _ordiEquipe(){ return !!(etat.equipement && (etat.equipement.arme===ITEM_HACK_VOL || etat.equipement.arme2===ITEM_HACK_VOL)); }
function _enVille(){ return (typeof enZoneFaction==="function") && enZoneFaction(); }
function enPrison(){ return (etat.prisonJusqua||0) > Date.now(); }
function prisonRestant(){ return Math.max(0, (etat.prisonJusqua||0)-Date.now()); }
function emprisonnerJoueur(faction, ms){ etat.prisonJusqua=Date.now()+ms; etat.prisonFaction=faction; if(typeof sb!=="undefined"&&sb) sb.rpc("emprisonner",{p_faction:faction,p_secondes:Math.round(ms/1000)}).catch(()=>{}); if(typeof sauvegarder==="function") sauvegarder(); }
function _emprisonner(){ emprisonnerJoueur((typeof villeActuelle==="function"?villeActuelle():etat.faction)||etat.faction, _vjm()); }
function _melange(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------- Cible simulée ---------- */
function genererCible(){
  const noms=["Kael","Vira","Toz","Nyx","Brann","Sela","Orin","Dax","Lume","Ferro","Yara","Milo","Rhona","Sett","Ilma","Garo"];
  const nom=noms[Math.floor(Math.random()*noms.length)]+"-"+(10+Math.floor(Math.random()*89));
  const pool=(typeof PRIX_ITEM!=="undefined")?Object.keys(PRIX_ITEM).filter(id=>!/vaisseau|navette/.test(id)):[];
  const sac={}; const nItems=2+Math.floor(Math.random()*5);
  for(let i=0;i<nItems && pool.length;i++){ const id=pool[Math.floor(Math.random()*pool.length)]; sac[id]=(sac[id]||0)+1+Math.floor(Math.random()*3); }
  return { nom, ageJ:Math.floor(Math.random()*130), credits:250+Math.floor(Math.random()*4500), sac, dejaVole:Math.random()<0.15 };
}
function _cibleProtegee(c){
  if(c.ageJ < IMMUNITE_JOURS){ journal(`${c.nom} est un nouveau venu (protégé < ${IMMUNITE_JOURS} j). Tu renonces.`,"alerte"); return true; }
  if(c.dejaVole){ journal(`${c.nom} a déjà été délesté aujourd'hui — sur ses gardes. Tu renonces.`,"alerte"); return true; }
  return false;
}
function _piocherObjets(sac, cap, agi){
  const ids=Object.keys(sac).filter(id=>(sac[id]||0)>0); _melange(ids); const butin=[];
  for(const id of ids){ if(butin.length>=cap) break;
    const rv=(typeof risqueVol==="function")?risqueVol(id):0.4;
    if(Math.random() < Math.min(0.9, rv*(1+agi/300))){
      const n = (typeof _lotVolable==="function") ? _lotVolable(id, sac[id])
                                                  : Math.min(sac[id], 1+Math.floor(Math.random()*2));
      butin.push([id, n]);
    }
  }
  return butin;
}

/* ---------- Actions ---------- */
async function tenterVoler(){
  if(enPrison()){ journal("Tu es en prison.","alerte"); return; }
  if(!_enVille()){ journal("Va dans une ville pour cibler quelqu'un.","alerte"); return; }
  if(!aDiscretion()){ journal("Il te faut l'aptitude Discrétion pour voler.","alerte"); return; }
  const c=genererCible(); if(_cibleProtegee(c)) return;
  if(!await agirServeur({ cout:VOL_ENERGIE, motif:"vol" })) return;
  lancerMiniVol(
    async ()=>{ const butin=_piocherObjets(c.sac, VOL_CAP_OBJETS, agiliteEffective());
      if(!butin.length) journal(`Tu fouilles ${c.nom} mais repars les mains vides.`,"alerte");
      else {
        const gains={}; for(const [id,n] of butin){ gains[id]=(gains[id]||0)+n; }
        const r = await agirServeur({ ajouter:gains, motif:"vol" });
        const pris = r ? (r.ajoutes||{}) : {};
        const liste = Object.keys(pris).map(id=>`${pris[id]}× ${item(id)?item(id).nom:id}`).join(", ");
        if(liste) journal(`Vol réussi sur ${c.nom} : ${liste}.`+(r&&r.sac_plein?" (sac plein)":""),"gain");
        else journal(`Vol réussi sur ${c.nom}, mais ton sac est plein.`,"alerte");
      }
      apresAction(); majVoler(); },
    ()=>{ journal(`Échec ! ${c.nom} t'a repéré — ton nom apparaît dans son journal.`,"alerte");
      if(Math.random()<0.45){ _emprisonner(); journal("Pris la main dans le sac : direction la prison.","alerte"); }
      apresAction(); majVoler(); }
  );
}
async function tenterHacker(){
  if(enPrison()){ journal("Tu es en prison.","alerte"); return; }
  if(!_enVille()){ journal("Va dans une ville pour cibler quelqu'un.","alerte"); return; }
  if(!_ordiEquipe()){ journal("Équipe un Ordinateur de hacking pour hacker.","alerte"); return; }
  if(!aIntrusion()){ journal("Il te faut l'aptitude Intrusion pour hacker.","alerte"); return; }
  const c=genererCible(); if(_cibleProtegee(c)) return;
  if(!await agirServeur({ cout:VOL_ENERGIE, motif:"vol" })) return;
  lancerMiniHack(
    ()=>{ const pct=Math.min(VOL_CAP_CREDITS, 0.12 + intelligenceEffective()/1000); const gain=Math.min(VOL_CAP_ABS, Math.floor(c.credits*pct));
      etat.credits+=gain; journal(`Hack réussi : +${gain} ₡ siphonnés à ${c.nom}. (Son journal ne verra qu'« un anonyme ».)`,"gain"); apresAction(); majVoler(); },
    ()=>{ journal(`Hack échoué sur ${c.nom}. (Son journal : « un anonyme a tenté de me pirater ».)`,"alerte");
      if(Math.random()<0.20){ _emprisonner(); journal("Ta trace a été remontée : prison.","alerte"); } apresAction(); majVoler(); }
  );
}

/* ---------- Mini-jeux de hack (1 au hasard) ---------- */
function _hackModal(){ let m=document.querySelector("#hack-modale"); if(!m){ m=document.createElement("div"); m.id="hack-modale"; m.hidden=true; document.body.appendChild(m); } return m; }
function _hackClear(){ if(_hackTimer){ clearInterval(_hackTimer); _hackTimer=null; } }
function _hackFin(ok){ if(_hackCleanup){ try{_hackCleanup();}catch(e){ if(typeof _catchLog==="function") _catchLog(e, "voler.js#1"); } _hackCleanup=null; } _hackClear(); const m=_hackModal(); m.hidden=true; m.innerHTML=""; const cb=ok?_hackWin:_hackLose; _hackWin=_hackLose=null; if(cb) cb(); }
// Chaque entrée : { t:titre, c:consigne (lue avant de lancer), f:fonction du jeu }
const POOL_HACK = [
  { t:"🖥 Labyrinthe d'accès", c:"Incline le plateau (flèches du clavier ou pavé tactile) pour amener la bille dans la sortie orange.", f:_miniLabyrinthe },
  { t:"🖥 Traçage de route",   c:"Clique toujours le nœud le plus proche du dernier atteint. Une seule erreur = échec. 3 manches de plus en plus denses.", f:_miniCheminement },
  { t:"🖥 Routage de flux",    c:"Tourne les conduits (clic) pour relier l'entrée à la sortie. Le circuit alimenté passe en orange.", f:_miniRoutage }
];
const POOL_VOL = [
  { t:"🖥 Décodeur",           c:"Casse le code de 4 cœurs. Après chaque essai : ● bien placé · ○ présent (mauvaise position). 8 essais.", f:_miniMastermind },
  { t:"🖥 Grille laser",       c:"Guide l'intrus (souris ou doigt) du sas bleu à la sortie orange. Passe par la brèche qui glisse le long de chaque faisceau. Un contact te renvoie au départ.", f:_miniLaser },
  { t:"🖥 Bypass du pare-feu", c:"Détruis (clic) les sondes ⚠ avant le pare-feu. Laisse passer les paquets ✓ — ne les clique pas.", f:_miniBypass }
];
// Écran de consigne + bouton Jouer : le jeu (et le chrono) ne démarre qu'au clic.
function _miniDemarrer(j){
  const m=_hackModal();
  m.innerHTML=_hackCadre(j.t, `<p class="hk-sous">${j.c}</p><p class="itip-gris" style="text-align:center;margin:4px 0 0">Le compte à rebours démarre quand tu cliques.</p><div class="hk-go"><button class="mini" id="hk-jouer">▶ Jouer</button></div>`);
  m.hidden=false;
  const ab=m.querySelector("#hk-abandon"); if(ab) ab.addEventListener("click",()=>_hackFin(false));
  m.querySelector("#hk-jouer").addEventListener("click",()=> j.f(m));
}
function lancerMiniVol(onWin,onLose){ _hackStyle(); _hackWin=onWin; _hackLose=onLose; _miniDemarrer(POOL_VOL[Math.floor(Math.random()*POOL_VOL.length)]); }
function lancerMiniHack(onWin,onLose){ _hackStyle(); _hackWin=onWin; _hackLose=onLose; _miniDemarrer(POOL_HACK[Math.floor(Math.random()*POOL_HACK.length)]); }
function _hackCadre(titre, inner){
  return `<div class="picker-cadre hk-cadre"><div class="picker-tete"><b>${titre}</b><span class="hk-chrono" id="hk-chrono"></span></div>${inner}<button class="mini danger" id="hk-abandon" style="margin-top:12px">Abandonner</button></div>`;
}
function _hackChrono(m, temps){
  const ab=m.querySelector("#hk-abandon"); if(ab) ab.addEventListener("click",()=>_hackFin(false));
  const fin=Date.now()+temps, el=m.querySelector("#hk-chrono"); _hackClear();
  _hackTimer=setInterval(()=>{ const r=fin-Date.now(); if(el) el.textContent=_vfmt(r); if(r<=0) _hackFin(false); },200);
}
function _genCode(){ const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const seg=()=>Array.from({length:4},()=>ch[Math.floor(Math.random()*ch.length)]).join(""); return seg()+"-"+seg()+"-"+seg(); }
function _genTok(){ const ch="0123456789ABCDEF"; return Array.from({length:3},()=>ch[Math.floor(Math.random()*ch.length)]).join(""); }

function _miniCopie(m, temps){
  const code=_genCode(); m.hidden=false;
  m.innerHTML=_hackCadre("🖥 Recopie le code d'accès",
    `<p class="hk-sous">Retape exactement le code avant la fin du temps.</p><p class="hk-code">${code}</p>
     <div class="hk-rep"><input id="hk-copie" placeholder="Recopie ici…" autocomplete="off" spellcheck="false"><button class="mini" id="hk-copie-ok">Valider</button></div>`);
  const c=m.querySelector("#hk-copie"), b=m.querySelector("#hk-copie-ok");
  const go=()=>{ if((c.value||"").trim().toUpperCase()===code) _hackFin(true); else { c.classList.add("hk-err"); setTimeout(()=>c.classList.remove("hk-err"),300); } };
  b.addEventListener("click",go); c.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }); setTimeout(()=>c.focus(),50);
  _hackChrono(m, temps);
}
function _miniFils(m, temps){
  const couleurs=["#ff5257","#5aa8e6","#8bd450","#ffb060"]; const n=couleurs.length;
  const g=_melange(couleurs.slice()), d=_melange(couleurs.slice());
  const port=(c,s,i)=>`<button class="hk-port" data-c="${c}" data-s="${s}" style="--c:${c}"></button>`;
  m.hidden=false;
  m.innerHTML=_hackCadre("🖥 Relie les fils (entrée → sortie)",
    `<p class="hk-sous">Clique un fil à gauche puis la même couleur à droite. Relie-les tous.</p>
     <div class="hk-fils"><div class="hk-col">${g.map(c=>port(c,"g")).join("")}</div><div class="hk-col">${d.map(c=>port(c,"d")).join("")}</div></div>`);
  let sel=null, faits=0;
  m.querySelectorAll(".hk-port").forEach(p=>p.addEventListener("click",()=>{
    if(p.classList.contains("hk-done")) return;
    if(p.dataset.s==="g"){ m.querySelectorAll('.hk-port[data-s="g"]').forEach(x=>x.classList.remove("hk-sel")); sel=p; p.classList.add("hk-sel"); return; }
    if(!sel) return;
    if(sel.dataset.c===p.dataset.c){ sel.classList.add("hk-done"); p.classList.add("hk-done"); sel.classList.remove("hk-sel"); sel=null; if(++faits>=n) _hackFin(true); }
    else { p.classList.add("hk-err"); setTimeout(()=>p.classList.remove("hk-err"),300); }
  }));
  _hackChrono(m, temps);
}
/* labyrinthe à bascule : maze aléatoire (génération), incliner aux flèches ou au pavé */
const LAB_M = 13;   // taille logique (impair) — plus grand = plus difficile
function _genMaze(M){
  const g=Array.from({length:M},()=>Array(M).fill(1));
  const st=[[1,1]]; g[1][1]=0; const dirs=[[0,2],[0,-2],[2,0],[-2,0]];
  while(st.length){
    const [r,c]=st[st.length-1];
    const opts=dirs.map(([dr,dc])=>[r+dr,c+dc,dr,dc]).filter(([nr,nc])=>nr>0&&nr<M-1&&nc>0&&nc<M-1&&g[nr][nc]===1);
    if(!opts.length){ st.pop(); continue; }
    const [nr,nc,dr,dc]=opts[Math.floor(Math.random()*opts.length)];
    g[r+dr/2][c+dc/2]=0; g[nr][nc]=0; st.push([nr,nc]);
  }
  return g;
}
function _miniLabyrinthe(m){
  m.hidden=false;
  const M=LAB_M, BOX=300, CS=BOX/M, R=CS*0.30, g=_genMaze(M);
  const _loin=()=>{ const dist=Array.from({length:M},()=>Array(M).fill(-1)); dist[1][1]=0; const q=[[1,1]]; let far=[M-2,M-2], fd=0;
    while(q.length){ const [r,c]=q.shift();
      for(const [a,b] of [[0,1],[1,0],[-1,0],[0,-1]]){ const nr=r+a,nc=c+b;
        if(nr>0&&nr<M-1&&nc>0&&nc<M-1&&g[nr][nc]===0&&dist[nr][nc]<0){ dist[nr][nc]=dist[r][c]+1; if(dist[nr][nc]>fd){ fd=dist[nr][nc]; far=[nr,nc]; } q.push([nr,nc]); } } }
    return far; };
  const [erow,ecol]=_loin();
  let px=CS*1.5, py=CS*1.5, vx=0, vy=0;
  const ex=ecol*CS+CS/2, ey=erow*CS+CS/2;
  let walls="";
  for(let r=0;r<M;r++) for(let c=0;c<M;c++) if(g[r][c]===1) walls+=`<i class="lab-mur" style="left:${c*CS}px;top:${r*CS}px;width:${CS+0.6}px;height:${CS+0.6}px"></i>`;
  const inner=`<p class="hk-sous">Incline le plateau (flèches ou pavé) pour amener la bille dans la sortie orange.</p>
    <div class="lab-scene"><div class="lab-box" id="lab-box">${walls}
      <i class="lab-sortie" style="left:${ex-CS*0.45}px;top:${ey-CS*0.45}px;width:${CS*0.9}px;height:${CS*0.9}px"></i>
      <i class="lab-bille" id="lab-bille" style="width:${R*2}px;height:${R*2}px;left:${px-R}px;top:${py-R}px"></i></div></div>
    <div class="lab-pad"><button data-d="ArrowUp">▲</button><div><button data-d="ArrowLeft">◀</button><button data-d="ArrowDown">▼</button><button data-d="ArrowRight">▶</button></div></div>`;
  m.innerHTML=_hackCadre("🖥 Labyrinthe d'accès", inner);
  const box=m.querySelector("#lab-box"), bille=m.querySelector("#lab-bille");
  const keys={};
  const kd=e=>{ if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){ keys[e.key]=true; e.preventDefault(); } };
  const ku=e=>{ if(keys[e.key]!==undefined) keys[e.key]=false; };
  window.addEventListener("keydown",kd); window.addEventListener("keyup",ku);
  m.querySelectorAll(".lab-pad button").forEach(b=>{ const d=b.dataset.d;
    const on=e=>{ e.preventDefault(); keys[d]=true; }, off=()=>{ keys[d]=false; };
    b.addEventListener("pointerdown",on); b.addEventListener("pointerup",off); b.addEventListener("pointerleave",off); });
  function collide(x,y){
    for(const [qx,qy] of [[x-R,y-R],[x+R,y-R],[x-R,y+R],[x+R,y+R]]){
      const c=Math.floor(qx/CS), r=Math.floor(qy/CS);
      if(r<0||c<0||r>=M||c>=M||g[r][c]===1) return true;
    } return false;
  }
  let raf=null;
  function frame(){
    const ax=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0), ay=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);
    vx=(vx+ax*0.32)*0.90; vy=(vy+ay*0.32)*0.90;
    const sp=Math.hypot(vx,vy), MX=CS*0.42; if(sp>MX){ vx=vx/sp*MX; vy=vy/sp*MX; }
    let nx=px+vx; if(!collide(nx,py)) px=nx; else vx*=-0.25;
    let ny=py+vy; if(!collide(px,ny)) py=ny; else vy*=-0.25;
    bille.style.left=(px-R)+"px"; bille.style.top=(py-R)+"px";
    box.style.transform=`rotateX(${-ay*9}deg) rotateY(${ax*9}deg)`;
    if(Math.hypot(px-ex,py-ey)<CS*0.5){ _hackFin(true); return; }
    raf=requestAnimationFrame(frame);
  }
  _hackCleanup=()=>{ window.removeEventListener("keydown",kd); window.removeEventListener("keyup",ku); if(raf) cancelAnimationFrame(raf); };
  raf=requestAnimationFrame(frame);
  _hackChrono(m, 17000 + Math.round((typeof intelligenceEffective==="function"?intelligenceEffective():0)*30));
}
/* path finder : 3 manches, cliquer toujours le nœud le plus proche du dernier atteint */
function _miniCheminement(m){
  m.hidden=false;
  const W=330, H=280, MANCHES=3, NS="http://www.w3.org/2000/svg"; let manche=0;
  const inner=`<p class="hk-sous">Clique toujours le nœud le <b>plus proche</b> du dernier atteint. Une erreur = échec. 3 manches.</p>
    <svg class="pf-svg" id="pf-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"></svg>
    <p class="itip-gris" id="pf-lbl"></p>`;
  m.innerHTML=_hackCadre("🖥 Traçage de route", inner);
  const svg=m.querySelector("#pf-svg"), lbl=m.querySelector("#pf-lbl");
  let current=null, remaining=[], preline=null;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function place(n){ const arr=[], mg=22, mind=36; let t=0;
    while(arr.length<n && t<4000){ t++; const x=mg+Math.random()*(W-2*mg), y=mg+Math.random()*(H-2*mg);
      if(arr.every(d=>Math.hypot(d.x-x,d.y-y)>=mind)) arr.push({x,y}); } return arr; }
  function nearest(){ let b=null,bd=Infinity; for(const d of remaining){ const dd=dist(current,d); if(dd<bd){bd=dd;b=d;} } return b; }
  function majPre(){ if(preline&&current){ preline.setAttribute("x1",current.x); preline.setAttribute("y1",current.y); preline.setAttribute("x2",current.x); preline.setAttribute("y2",current.y); } }
  function rendre(){
    svg.innerHTML="";
    const dots=place(6+manche*3);
    current=dots[0]; remaining=dots.slice(1);
    lbl.textContent=`Manche ${manche+1}/${MANCHES} · ${dots.length} nœuds`;
    preline=document.createElementNS(NS,"line"); preline.setAttribute("class","pf-preline"); svg.appendChild(preline);
    dots.forEach((d,i)=>{ const c=document.createElementNS(NS,"circle");
      c.setAttribute("cx",d.x); c.setAttribute("cy",d.y); c.setAttribute("r",8);
      c.setAttribute("class", i===0?"pf-dot pf-start":"pf-dot"); d.el=c;
      c.addEventListener("click",()=>clic(d)); svg.appendChild(c); });
    majPre();
  }
  function clic(d){
    if(!remaining.includes(d)){ if(d!==current){ d.el.classList.add("pf-bad"); _hackFin(false); } return; }
    if(d!==nearest()){ d.el.classList.add("pf-bad"); _hackFin(false); return; }
    const ln=document.createElementNS(NS,"line");
    ln.setAttribute("x1",current.x); ln.setAttribute("y1",current.y); ln.setAttribute("x2",d.x); ln.setAttribute("y2",d.y);
    ln.setAttribute("class","pf-line"); svg.insertBefore(ln, svg.firstChild);
    d.el.classList.add("pf-visited"); remaining=remaining.filter(x=>x!==d); current=d;
    if(!remaining.length){ if(++manche>=MANCHES){ _hackFin(true); return; } rendre(); return; }
    majPre();
  }
  const mm=e=>{ if(!preline||!current) return; const r=svg.getBoundingClientRect();
    preline.setAttribute("x2",(e.clientX-r.left)*(W/r.width)); preline.setAttribute("y2",(e.clientY-r.top)*(H/r.height)); };
  svg.addEventListener("mousemove",mm);
  _hackCleanup=()=>{ svg.removeEventListener("mousemove",mm); };
  rendre();
  _hackChrono(m, 34000 + Math.round((typeof intelligenceEffective==="function"?intelligenceEffective():0)*30));
}
/* routage de flux : tourner les conduits pour relier l'entrée à la sortie (board aléatoire, toujours solvable) */
function _miniRoutage(m){
  m.hidden=false;
  const ROWS=5, COLS=5, CS=52, NS="http://www.w3.org/2000/svg";
  const cells=Array.from({length:ROWS},()=>Array(COLS).fill(0));
  let sr, dr, path=null;                          // chemin borné à 7-13 cases : non-trivial mais toujours faisable dans le temps
  for(let att=0; att<30; att++){
    const s=1+Math.floor(Math.random()*(ROWS-2)), d=1+Math.floor(Math.random()*(ROWS-2));
    const vis=Array.from({length:ROWS},()=>Array(COLS).fill(false)), p=[];
    (function dfs(r,c){ vis[r][c]=true; p.push([r,c]); if(r===d&&c===COLS-1) return true;
      for(const [a,b] of [[0,1],[1,0],[-1,0],[0,-1]].sort(()=>Math.random()-0.5)){ const nr=r+a,nc=c+b;
        if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!vis[nr][nc]&&dfs(nr,nc)) return true; } p.pop(); return false; })(s,0);
    if(!path || p.length<path.length){ path=p; sr=s; dr=d; }
    if(p.length>=7 && p.length<=13){ path=p; sr=s; dr=d; break; }
  }
  const bit=(r,c,tr,tc)=> tr<r?1 : tc>c?2 : tr>r?4 : 8;
  for(let i=0;i<path.length;i++){ const [r,c]=path[i]; let mk=0;
    mk |= i>0 ? bit(r,c,path[i-1][0],path[i-1][1]) : 8;
    mk |= i<path.length-1 ? bit(r,c,path[i+1][0],path[i+1][1]) : 2;
    cells[r][c]=mk; }
  const decoys=[3,6,12,9,5,10];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(!cells[r][c]) cells[r][c]=decoys[Math.floor(Math.random()*decoys.length)];
  const rotCW=x=>((x&7)<<1)|((x&8)>>3);
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ let k=Math.floor(Math.random()*4); while(k-->0) cells[r][c]=rotCW(cells[r][c]); }

  const inner=`<p class="hk-sous">Tourne les conduits (clic) pour relier l'entrée à la sortie avant la coupure. Le circuit alimenté passe en orange.</p>
    <svg class="rt-svg" id="rt-svg" viewBox="-16 -6 ${COLS*CS+32} ${ROWS*CS+12}"></svg>`;
  m.innerHTML=_hackCadre("🖥 Routage de flux", inner);
  const svg=m.querySelector("#rt-svg");
  function energ(){ const en=Array.from({length:ROWS},()=>Array(COLS).fill(false)), q=[];
    if(cells[sr][0]&8){ en[sr][0]=true; q.push([sr,0]); }
    const D=[[1,-1,0,4],[2,0,1,8],[4,1,0,1],[8,0,-1,2]];
    while(q.length){ const [r,c]=q.shift(), mm=cells[r][c];
      for(const [b,a,d,o] of D){ if(!(mm&b)) continue; const nr=r+a,nc=c+d;
        if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(!en[nr][nc]&&(cells[nr][nc]&o)){ en[nr][nc]=true; q.push([nr,nc]); } } }
    return en; }
  const gagne=en=> en[dr][COLS-1] && (cells[dr][COLS-1]&2);
  function draw(){
    const en=energ(); let h="";
    h+=`<path d="M -14 ${sr*CS+CS/2-6} L -3 ${sr*CS+CS/2} L -14 ${sr*CS+CS/2+6} Z" class="rt-port on"/>`;
    h+=`<path d="M ${COLS*CS+3} ${dr*CS+CS/2-6} L ${COLS*CS+14} ${dr*CS+CS/2} L ${COLS*CS+3} ${dr*CS+CS/2+6} Z" class="rt-port ${gagne(en)?'on':''}"/>`;
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const cx=c*CS+CS/2, cy=r*CS+CS/2, mm=cells[r][c], cls=en[r][c]?"rt-pipe on":"rt-pipe";
      const pts={1:[cx,r*CS],2:[(c+1)*CS,cy],4:[cx,(r+1)*CS],8:[c*CS,cy]};
      for(const b of [1,2,4,8]) if(mm&b) h+=`<line x1="${cx}" y1="${cy}" x2="${pts[b][0]}" y2="${pts[b][1]}" class="${cls}"/>`;
      h+=`<circle cx="${cx}" cy="${cy}" r="4" class="${en[r][c]?'rt-hub on':'rt-hub'}"/>`;
      h+=`<rect x="${c*CS}" y="${r*CS}" width="${CS}" height="${CS}" class="rt-cell" data-r="${r}" data-c="${c}"/>`;
    }
    svg.innerHTML=h;
    svg.querySelectorAll(".rt-cell").forEach(el=>el.addEventListener("click",()=>{
      const r=+el.dataset.r, c=+el.dataset.c; cells[r][c]=rotCW(cells[r][c]);
      if(gagne(energ())){ draw(); _hackFin(true); return; } draw();
    }));
  }
  draw();
  _hackChrono(m, 28000 + Math.round((typeof intelligenceEffective==="function"?intelligenceEffective():0)*30));
}
/* Mastermind — casser un code de cœurs (feedback bien placé / présent). Jeu de VOL. */
function _miniMastermind(m){
  m.hidden=false;
  const N=4, K=6, MAXG=8, COLS=["#ff8a3d","#5aa8e6","#8bd450","#c98bff","#ffd23d","#ff5257"];
  const code=Array.from({length:N},()=>Math.floor(Math.random()*K));
  let guess=[], history=[];
  const inner=`<p class="hk-sous">Casse le code de ${N} cœurs. Après chaque essai : ● bien placé · ○ présent (mauvaise position). ${MAXG} essais.</p>
    <div id="mm-board"></div><div id="mm-palette"></div>
    <div class="quete-rep" style="justify-content:center"><button class="mini" id="mm-valider" disabled>Valider</button><button class="mini" id="mm-clear">Effacer</button></div>`;
  m.innerHTML=_hackCadre("🖥 Décodeur", inner);
  const board=m.querySelector("#mm-board"), pal=m.querySelector("#mm-palette"), bV=m.querySelector("#mm-valider"), bC=m.querySelector("#mm-clear");
  pal.innerHTML=COLS.map((col,i)=>`<button class="mm-orbe" style="--c:${col}" data-col="${i}"></button>`).join("");
  pal.querySelectorAll("[data-col]").forEach(b=>b.addEventListener("click",()=>{ if(guess.length<N){ guess.push(+b.dataset.col); render(); } }));
  bC.addEventListener("click",()=>{ guess=[]; render(); });
  bV.addEventListener("click",valider);
  function feedback(g){ let black=0, white=0; const cc=code.slice(), gg=g.slice();
    for(let i=0;i<N;i++) if(gg[i]===cc[i]){ black++; cc[i]=-1; gg[i]=-2; }
    for(let i=0;i<N;i++){ if(gg[i]<0) continue; const j=cc.indexOf(gg[i]); if(j>=0){ white++; cc[j]=-1; } }
    return {black,white}; }
  function valider(){
    if(guess.length!==N) return;
    const fb=feedback(guess); history.push({g:guess.slice(),b:fb.black,w:fb.white});
    if(fb.black===N){ render(); _hackFin(true); return; }
    guess=[]; if(history.length>=MAXG){ render(); _hackFin(false); return; } render();
  }
  const orb=i=> i==null?`<i class="mm-slot"></i>`:`<i class="mm-slot plein" style="--c:${COLS[i]}"></i>`;
  function pegs(b,w){ let p=""; for(let i=0;i<b;i++) p+='<i class="mm-peg noir"></i>'; for(let i=0;i<w;i++) p+='<i class="mm-peg blanc"></i>'; for(let i=b+w;i<N;i++) p+='<i class="mm-peg vide"></i>'; return p; }
  function render(){
    let h=""; history.forEach(row=>{ h+=`<div class="mm-ligne">${row.g.map(orb).join("")}<span class="mm-fb">${pegs(row.b,row.w)}</span></div>`; });
    if(history.length<MAXG){ let s=""; for(let i=0;i<N;i++) s+=orb(i<guess.length?guess[i]:null); h+=`<div class="mm-ligne actif">${s}<span class="mm-fb"></span></div>`; }
    board.innerHTML=h; bV.disabled=guess.length!==N;
  }
  render();
  _hackChrono(m, 58000 + Math.round((typeof agiliteEffective==="function"?agiliteEffective():0)*30));
}
/* Faisceaux laser — guider l'intrus (souris/doigt) du sas à la sortie sans toucher les rayons. Jeu de VOL. */
function _miniLaser(m){
  m.hidden=false;
  const W=320, H=280, R=7, PAD=44, mid1=PAD, mid2=W-PAD;
  const cy0=H/2, agi=(typeof agiliteEffective==="function"?agiliteEffective():0);
  const nb=3, gapH=16, LEN=Math.hypot(W,H)+80, beams=[];
  for(let i=0;i<nb;i++){
    const ang=(Math.random()<0.5?1:-1)*(30+Math.random()*22)*Math.PI/180;   // ±30..52°
    const cx=mid1+(i+1)*(mid2-mid1)/(nb+1);                                  // barrieres reparties (chacune traverse toute la zone)
    beams.push({ ang, cx, cy:cy0, dx:Math.cos(ang), dy:Math.sin(ang),
      gapAmp:82+Math.random()*22, gapSp:(0.5+Math.random()*0.4)*(1-Math.min(0.4,agi/700)), gapPh:Math.random()*6.28, gapS:0 });
  }
  let px=PAD/2, py=H/2, tx=px, ty=py, dead=false, deadT=0;
  const inner=`<p class="hk-sous">Guide l'intrus (souris ou doigt) du sas bleu à la sortie orange. Passe par la <b>brèche</b> qui glisse le long de chaque faisceau. Un contact te renvoie au départ.</p>
    <div class="ls-area" id="ls-area"><div class="ls-start"></div><div class="ls-exit"></div>
      ${beams.map((b,i)=>`<div class="ls-beam" id="ls-b${i}"></div>`).join("")}
      <div class="ls-dot" id="ls-dot"></div></div>`;
  m.innerHTML=_hackCadre("🖥 Grille laser", inner);
  const area=m.querySelector("#ls-area"), dot=m.querySelector("#ls-dot"), bel=beams.map((b,i)=>m.querySelector("#ls-b"+i));
  beams.forEach((b,i)=>{ bel[i].style.width=LEN+"px"; bel[i].style.left=b.cx+"px"; bel[i].style.top=b.cy+"px"; bel[i].style.transform=`translate(-50%,-50%) rotate(${b.ang}rad)`; });
  const move=e=>{ const r=area.getBoundingClientRect();
    tx=Math.max(R,Math.min(W-R,(e.clientX-r.left)*(W/r.width))); ty=Math.max(R,Math.min(H-R,(e.clientY-r.top)*(H/r.height))); };
  area.addEventListener("pointermove",move);
  function hit(){ dead=true; deadT=performance.now(); px=PAD/2; py=H/2; tx=px; ty=py; dot.classList.add("mort"); dot.style.left=(px-R)+"px"; dot.style.top=(py-R)+"px"; }
  let raf=null, t0=performance.now();
  function frame(now){
    const t=(now-t0)/1000;
    for(let i=0;i<nb;i++){ const b=beams[i];
      b.gapS=b.gapAmp*Math.sin(t*b.gapSp*Math.PI+b.gapPh);
      const A=Math.max(0,Math.min(100,(LEN/2+b.gapS-gapH)/LEN*100)), B=Math.max(0,Math.min(100,(LEN/2+b.gapS+gapH)/LEN*100));
      const mk=`linear-gradient(90deg,#000 ${A}%,transparent ${A}%,transparent ${B}%,#000 ${B}%)`;
      bel[i].style.webkitMaskImage=mk; bel[i].style.maskImage=mk; }
    if(!dead){
      const dx=tx-px, dy=ty-py, d=Math.hypot(dx,dy), MX=4.2;
      if(d>MX){ px+=dx/d*MX; py+=dy/d*MX; } else { px=tx; py=ty; }
      dot.style.left=(px-R)+"px"; dot.style.top=(py-R)+"px";
      if(px>=mid2){ _hackFin(true); return; }
      if(px>mid1-R && px<mid2+R){
        for(const b of beams){
          const perp=Math.abs((px-b.cx)*b.dy-(py-b.cy)*b.dx);
          if(perp<R+3){ const s=(px-b.cx)*b.dx+(py-b.cy)*b.dy; if(Math.abs(s-b.gapS)>=gapH){ hit(); break; } }
        }
      }
    } else if(now-deadT>500){ dead=false; dot.classList.remove("mort"); }
    raf=requestAnimationFrame(frame);
  }
  _hackCleanup=()=>{ area.removeEventListener("pointermove",move); if(raf) cancelAnimationFrame(raf); };
  raf=requestAnimationFrame(frame);
  _hackChrono(m, 22000 + Math.round((typeof agiliteEffective==="function"?agiliteEffective():0)*35));
}
/* Bypass de pare-feu — détruire les sondes avant le pare-feu, laisser passer les paquets. Jeu de VOL. */
function _miniBypass(m){
  m.hidden=false;
  const W=340, H=180, GATE=W-56, TOTAL=16;
  const agi=(typeof agiliteEffective==="function"?agiliteEffective():0), base=0.9-Math.min(0.4,agi/600);
  let integrite=100, spawned=0, resolved=0, dead=false, packets=[], raf=null, lastSpawn=0;
  const inner=`<p class="hk-sous">Détruis (clic) les <b style="color:#ff5257">sondes ⚠</b> avant le pare-feu. Laisse passer les <b style="color:#5aa8e6">paquets ✓</b> — ne les clique pas.</p>
    <div class="bp-integ"><div class="bp-integ-bar" id="bp-bar"></div></div>
    <div class="bp-area" id="bp-area"><div class="bp-gate"></div><div class="bp-reste" id="bp-reste"></div></div>`;
  m.innerHTML=_hackCadre("🖥 Bypass du pare-feu", inner);
  const area=m.querySelector("#bp-area"), bar=m.querySelector("#bp-bar"), reste=m.querySelector("#bp-reste");
  function maj(){ bar.style.width=Math.max(0,integrite)+"%"; bar.style.background=integrite>50?"#8bd450":(integrite>25?"var(--orange,#ff8a3d)":"#ff5257"); reste.textContent=`${resolved}/${TOTAL}`; }
  function flash(){ area.classList.add("bp-hit"); setTimeout(()=>area.classList.remove("bp-hit"),160); }
  function check(){ if(integrite<=0){ dead=true; _hackFin(false); } else if(resolved>=TOTAL){ dead=true; _hackFin(true); } }
  function resolve(p, penalite){ if(dead||p.done) return; p.done=true; p.el.remove(); if(penalite){ integrite-=penalite; flash(); } resolved++; maj(); check(); }
  function spawnP(){
    const bad=Math.random()<0.5, el=document.createElement("div");
    el.className="bp-pkt "+(bad?"bad":"good"); el.textContent=bad?"⚠":"✓";
    const y=16+Math.random()*(H-32); el.style.top=y+"px"; el.style.left="-26px";
    const p={el,bad,x:-26,done:false, speed:base*(0.8+Math.random()*0.5)*(1+spawned/TOTAL*0.3)};
    el.addEventListener("pointerdown",e=>{ e.preventDefault(); resolve(p, p.bad?0:15); });
    area.appendChild(el); packets.push(p); spawned++;
  }
  function frame(now){
    if(dead) return;
    if(spawned<TOTAL && now-lastSpawn>700){ lastSpawn=now; spawnP(); }
    for(const p of packets){ if(p.done) continue; p.x+=p.speed*2.0; p.el.style.left=p.x+"px"; if(p.x>=GATE) resolve(p, p.bad?25:0); }
    packets=packets.filter(p=>!p.done);
    raf=requestAnimationFrame(frame);
  }
  maj(); _hackCleanup=()=>{ if(raf) cancelAnimationFrame(raf); };
  raf=requestAnimationFrame(frame);
  _hackChrono(m, 26000 + Math.round(agi*30));
}

/* ---------- Onglet Voler / Hacker ---------- */
function majVoler(){
  const z=document.querySelector("#voler-vue"); if(!z) return;
  _hackStyle();
  if(_volTimer){ clearInterval(_volTimer); _volTimer=null; }
  if(!_enVille()){ z.innerHTML=`<p class="vide">Le vol et le hacking visent les <b>joueurs présents dans une ville</b>. Rends-toi dans une ville de faction.</p>`; return; }
  if(enPrison()){
    z.innerHTML=`<div class="vol-prison">⛓️ <b>Tu es en prison.</b><br>Libération dans <b id="vol-ptemps">${_vfmt(prisonRestant())}</b>. Impossible de voler ou hacker d'ici là.<div style="margin-top:10px"><button class="mini" id="vol-evasion">Tenter une évasion (−10% énergie)</button></div><p class="itip-gris" style="margin-top:6px">Chance selon Agilité + Intelligence. Échec → tu restes en prison.</p></div>`;
    const _be=z.querySelector("#vol-evasion"); if(_be) _be.addEventListener("click", tenterEvasion);
    _volTimer=setInterval(()=>{ const el=z.querySelector("#vol-ptemps"); if(!el){ clearInterval(_volTimer); return; } if(enPrison()) el.textContent=_vfmt(prisonRestant()); else { clearInterval(_volTimer); majVoler(); } },500);
    return;
  }
  const dV=aDiscretion(), dH=_ordiEquipe()&&aIntrusion(), e=Math.floor(etat.energie);
  z.innerHTML=`
    <p class="vide">Cible un <b>joueur au hasard</b> présent dans cette ville. Coûte <b>${VOL_ENERGIE}%</b> d'énergie (tu as ${e}%). L'équipement porté et le vaisseau équipé sont intouchables ; les nouveaux venus (< ${IMMUNITE_JOURS} j) sont protégés.</p>
    <div class="vol-cartes">
      <div class="vol-carte">
        <h3>🕵️ Voler <span class="qte">· objets</span></h3>
        <p>Plus risqué, moins payant. Vole jusqu'à ${VOL_CAP_OBJETS} objets. Échec → <b>démasqué (ton nom)</b> ; gros échec → <b>prison</b>.</p>
        <p class="itip-gris">Réussite : mini-jeu (Agilité = plus de temps). Prérequis : Discrétion ${dV?"✅":"❌"}.</p>
        <button class="mini" id="vol-voler" ${dV&&e>=VOL_ENERGIE?"":"disabled"}>Voler</button>
      </div>
      <div class="vol-carte">
        <h3>🖥 Hacker <span class="qte">· crédits</span></h3>
        <p>Meilleur butin : jusqu'à ${Math.round(VOL_CAP_CREDITS*100)}% des crédits (max ${VOL_CAP_ABS} ₡), via un <b>mini-jeu</b>. Anonyme, risque de prison plus faible.</p>
        <p class="itip-gris">Réussite : mini-jeu + Intelligence. Prérequis : Ordinateur équipé ${_ordiEquipe()?"✅":"❌"} + Intrusion ${aIntrusion()?"✅":"❌"}.</p>
        <button class="mini" id="vol-hacker" ${dH&&e>=VOL_ENERGIE?"":"disabled"}>Hacker</button>
      </div>
    </div>`;
  const bv=z.querySelector("#vol-voler"); if(bv) bv.addEventListener("click",tenterVoler);
  const bh=z.querySelector("#vol-hacker"); if(bh) bh.addEventListener("click",tenterHacker);
}

/* ---------- Onglet Prison (Centre) ---------- */
function _factionNom(fid){ const f=(typeof FACTIONS!=="undefined")?FACTIONS.find(x=>x.id===fid):null; return f?f.nom:(fid||"cette faction"); }
function _avatarMini(){ return `<span class="prison-av"><svg viewBox="0 0 120 130"><path d="M18 128 Q18 88 60 88 Q102 88 102 128 Z"/><path d="M60 20 a32 32 0 0 1 32 32 v8 a32 32 0 0 1 -64 0 v-8 a32 32 0 0 1 32 -32 Z"/><rect x="38" y="46" width="44" height="13" rx="6"/></svg></span>`; }
function _allerProfil(){ document.querySelectorAll(".panneau").forEach(p=>p.classList.toggle("actif", p.dataset.panneau==="profil")); document.querySelectorAll("[data-onglet]").forEach(o=>o.classList.toggle("actif", o.dataset.onglet==="profil")); }
async function tenterEvasion(){
  if(!enPrison()) return;
  if((etat.energie||0) < 10){ journal("Il te faut au moins 10% d'énergie pour tenter une évasion.","alerte"); return; }
  // agir() refuse normalement d'agir en prison : l'évasion est la seule
  // exception, d'où enPrison:true.
  if(!await agirServeur({ cout:10, motif:"evasion", enPrison:true })) return;
  const agi=(typeof agiliteEffective==="function")?agiliteEffective():5;
  const intel=(typeof intelligenceEffective==="function")?intelligenceEffective():5;
  const p=Math.min(0.6, 0.12 + (agi+intel)*0.01);
  if(Math.random() < p){
    etat.prisonJusqua=0; etat.prisonFaction=null;
    if(typeof sb!=="undefined"&&sb) sb.rpc("liberer_moi").catch(()=>{});
    journal("Évasion réussie ! Tu disparais dans les couloirs. (−10% énergie)","gain");
  } else {
    journal("Évasion ratée — tu restes en prison. (−10% énergie)","alerte");
  }
  if(typeof sauvegarder==="function") sauvegarder();
  if(typeof afficher==="function") afficher();
  majVoler();
  if(typeof majCentre==="function") majCentre();
}
async function syncPrison(){
  if(typeof sb==="undefined" || !sb) return;
  try{ const { data } = await sb.rpc("mon_etat_prison");
    if(data && data.en_prison){ etat.prisonJusqua=new Date(data.jusqua).getTime(); etat.prisonFaction=data.faction; }
    else if(etat.prisonJusqua){ etat.prisonJusqua=0; etat.prisonFaction=null; }
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "voler.js#2"); }
}
async function majPrison(el){
  if(!el) el=document.querySelector("#centre-corps"); if(!el) return;
  _hackStyle();
  const fid=(typeof villeActuelle==="function")?villeActuelle():null;
  el.innerHTML=`<h3 style="margin:2px 0">Prison — ${_factionNom(fid)}</h3><p class="vide">Chargement…</p>`;
  let prisonniers=[];
  try{ const { data } = await sb.from("prison").select("*").eq("faction",fid).gt("jusqua",new Date().toISOString());
    const rows=data||[]; const ids=rows.map(r=>r.profil_id);
    const noms={}; if(ids.length){ const { data:pubs } = await sb.from("profils_publics").select("id,nom").in("id",ids); for(const p of (pubs||[])) noms[p.id]=p.nom; }
    prisonniers=rows.map(r=>({ id:r.profil_id, nom:noms[r.profil_id]||"(?)", reste:new Date(r.jusqua)-Date.now() }));
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "voler.js#3"); }
  const roles=(typeof _chargerMesRolesGouv==="function")?await _chargerMesRolesGouv():[];
  const estRegent = roles.includes("regent") && fid===etat.faction;
  const s=(typeof sessionActuelle==="function")?await sessionActuelle():null; const moiId=s?s.user.id:null;
  let html=`<h3 style="margin:2px 0">Prison — ${_factionNom(fid)}</h3>
    <p class="vide">Quiconque se fait prendre à voler, hacker ou espionner dans cette faction y est enfermé : ni déplacement, ni action. Le <b>Régent</b> de la faction peut gracier.</p>`;
  if(!prisonniers.length) html+=`<p class="vide">Personne en prison ici.</p>`;
  else{
    html+=`<div class="prison-liste">`;
    for(const pr of prisonniers){ const moi=pr.id===moiId;
      html+=`<div class="prison-ligne${moi?" moi":""}">${_avatarMini()}`
        + `<button class="prison-nom" data-nom="${pr.nom}">${pr.nom}${moi?" (toi)":""}</button>`
        + `<span class="qte">${_vfmt(Math.max(0,pr.reste))}</span>`
        + (estRegent?`<button class="mini" data-gracier="${pr.id}">Gracier</button>`:`<button class="mini" disabled title="Réservé au Régent">Gracier</button>`)
        + `</div>`;
    }
    html+=`</div>`;
  }
  if(enPrison()) html+=`<div style="margin-top:10px"><button class="mini" id="prison-evasion">Tenter une évasion (−10% énergie)</button> <span class="itip-gris">Chance selon Agilité + Intelligence. Échec → tu restes.</span></div>`;
  el.innerHTML=html;
  const pe=el.querySelector("#prison-evasion"); if(pe) pe.addEventListener("click", tenterEvasion);
  el.querySelectorAll("[data-gracier]").forEach(b=>b.addEventListener("click", async()=>{
    const { data:res, error } = await sb.rpc("gracier",{ p_profil:b.dataset.gracier });
    if(error || !res || !res.ok){ journal("Grâce impossible.","alerte"); return; }
    journal("Prisonnier gracié.","gain"); majPrison(el);
  }));
  el.querySelectorAll(".prison-nom").forEach(b=>b.addEventListener("click",()=>{ if(typeof ouvrirPageProfil==="function") ouvrirPageProfil(b.dataset.nom); }));
}

/* ---------- Style ---------- */
let _volStyleMonte=false;
function _hackStyle(){
  if(_volStyleMonte) return;
  const st=document.createElement("style");
  st.textContent=`
    .vol-cartes{ display:flex; gap:14px; flex-wrap:wrap; margin-top:10px; }
    .vol-carte{ flex:1 1 260px; border:1px solid var(--line); border-radius:var(--r-s); padding:12px 14px; background:rgba(16,40,37,.35); }
    .vol-carte h3{ margin:0 0 6px; } .vol-carte p{ margin:4px 0; font-size:13px; }
    .vol-prison{ border:1px solid rgba(255,82,87,.5); background:rgba(255,82,87,.10); color:#ff8f92; border-radius:var(--r-s); padding:14px; line-height:1.5; }
    #hack-modale{ position:fixed; inset:0; z-index:300; background:rgba(4,8,20,.78); display:grid; place-items:center; padding:20px; }
    #hack-modale[hidden]{ display:none; }
    .hk-cadre{ min-width:280px; max-width:440px; }
    .hk-chrono{ font-family:"Space Mono",monospace; color:var(--orange-hi,#ffb060); }
    .hk-sous{ color:var(--sourdine); font-size:13px; margin:6px 0 10px; }
    .hk-go{ display:flex; justify-content:center; margin:18px 0 6px; }
    .hk-go .mini{ padding:11px 34px; font-size:15px; border-color:var(--orange,#ff8a3d); color:var(--orange-hi,#ffb060); }
    .hk-go .mini:hover{ background:var(--orange,#ff8a3d); color:#0b1220; }
    .hk-code{ font-family:"Space Mono",monospace; font-size:24px; letter-spacing:.14em; color:var(--bleu); text-align:center; user-select:none; margin:10px 0; }
    .hk-rep{ display:flex; gap:8px; }
    .hk-rep input{ flex:1; background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:8px 10px; font-family:"Space Mono",monospace; letter-spacing:.1em; }
    .hk-err{ animation:hkshake .3s; border-color:#ff5257 !important; }
    @keyframes hkshake{ 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
    .hk-fils{ display:flex; justify-content:space-between; gap:70px; padding:4px 10px; }
    .hk-col{ display:flex; flex-direction:column; gap:14px; }
    .hk-port{ width:34px; height:34px; border-radius:50%; border:2px solid #0006; background:var(--c); cursor:pointer; }
    .hk-port.hk-sel{ box-shadow:0 0 0 3px #fff8; }
    .hk-port.hk-done{ opacity:.35; cursor:default; }
    .hk-grille{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .hk-cell{ font-family:"Space Mono",monospace; font-size:16px; padding:12px 0; background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--bleu); cursor:pointer; }
    .hk-cell:hover{ border-color:var(--bleu); }
    .prison-liste{ display:flex; flex-direction:column; gap:6px; margin-top:10px; }
    .prison-ligne{ display:flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:8px; padding:6px 10px; }
    .prison-ligne.moi{ border-color:rgba(255,82,87,.5); background:rgba(255,82,87,.08); }
    .prison-av{ width:32px; height:32px; border-radius:8px; overflow:hidden; background:#0a1730; display:grid; place-items:center; flex:0 0 auto; }
    .prison-av svg{ width:100%; height:100%; } .prison-av path{ fill:#2b4a72; } .prison-av rect{ fill:#5aa8e6; }
    .prison-nom{ flex:1; text-align:left; background:none; border:none; color:var(--bleu); cursor:pointer; font:inherit; text-decoration:underline; padding:0; }
    .hk-cadre{ max-height:92vh; overflow:auto; }
    .lab-scene{ perspective:700px; display:grid; place-items:center; margin:8px 0; }
    .lab-box{ position:relative; width:300px; height:300px; background:#0b1220; border:1px solid var(--line); transition:transform .07s; }
    .lab-mur{ position:absolute; background:linear-gradient(#2a4a78,#1c3358); }
    .lab-sortie{ position:absolute; border-radius:50%; background:radial-gradient(var(--orange-hi,#ffb060), rgba(255,138,61,.15)); box-shadow:0 0 12px var(--orange,#ff8a3d); }
    .lab-bille{ position:absolute; border-radius:50%; background:radial-gradient(circle at 35% 30%, #fff, #9bbdd8); box-shadow:0 0 8px #fff, 0 2px 4px #000a; z-index:2; }
    .lab-pad{ display:flex; flex-direction:column; align-items:center; gap:4px; margin-top:6px; }
    .lab-pad>div{ display:flex; gap:4px; }
    .lab-pad button{ width:44px; height:34px; background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--bleu); font-size:13px; cursor:pointer; touch-action:none; }
    .lab-pad button:active{ border-color:var(--orange,#ff8a3d); color:var(--orange-hi,#ffb060); }
    .pf-svg{ display:block; margin:8px auto; background:#0b1220; border:1px solid var(--line); border-radius:8px; background-image:linear-gradient(rgba(90,168,230,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(90,168,230,.08) 1px,transparent 1px); background-size:22px 22px; cursor:crosshair; max-width:100%; }
    .pf-dot{ fill:var(--bleu); stroke:#0b1220; stroke-width:3; cursor:pointer; transition:transform .15s; transform-box:fill-box; transform-origin:center; }
    .pf-dot:hover{ transform:scale(1.4); }
    .pf-start{ fill:var(--orange-hi,#ffb060); stroke:var(--orange,#ff8a3d); }
    .pf-visited{ fill:var(--orange-hi,#ffb060); }
    .pf-bad{ fill:#ff5257 !important; }
    .pf-line{ stroke:var(--orange,#ff8a3d); stroke-width:2.5; stroke-linecap:round; }
    .pf-preline{ stroke:rgba(255,138,61,.5); stroke-width:1.5; stroke-dasharray:4 5; pointer-events:none; }
    .rt-svg{ display:block; margin:8px auto; width:100%; max-width:300px; background:#0b1220; border:1px solid var(--line); border-radius:8px; }
    .rt-pipe{ stroke:#2a4a78; stroke-width:10; stroke-linecap:round; transition:stroke .12s; }
    .rt-pipe.on{ stroke:var(--orange,#ff8a3d); }
    .rt-hub{ fill:#2a4a78; } .rt-hub.on{ fill:var(--orange-hi,#ffb060); }
    .rt-cell{ fill:transparent; cursor:pointer; }
    .rt-cell:hover{ fill:rgba(90,168,230,.10); }
    .rt-port{ fill:#3a5a86; } .rt-port.on{ fill:var(--orange,#ff8a3d); }
    #mm-board{ display:flex; flex-direction:column; gap:6px; margin:8px 0; }
    .mm-ligne{ display:flex; align-items:center; gap:8px; padding:5px 10px; border:1px solid var(--line); border-radius:10px; background:rgba(16,40,37,.25); }
    .mm-ligne.actif{ border-color:var(--orange,#ff8a3d); }
    .mm-slot{ width:26px; height:26px; border-radius:50%; background:#0f1830; border:1px solid var(--line); box-shadow:inset 0 2px 5px #0007; }
    .mm-slot.plein{ background:radial-gradient(circle at 35% 30%, #ffffffaa, var(--c)); border-color:var(--c); box-shadow:0 0 8px var(--c); }
    .mm-fb{ margin-left:auto; display:grid; grid-template-columns:repeat(2,11px); gap:3px; }
    .mm-peg{ width:10px; height:10px; border-radius:50%; box-sizing:border-box; }
    .mm-peg.noir{ background:var(--orange-hi,#ffb060); box-shadow:0 0 5px var(--orange,#ff8a3d); }
    .mm-peg.blanc{ background:transparent; border:2px solid var(--bleu); }
    .mm-peg.vide{ background:#1a2740; }
    #mm-palette{ display:flex; gap:10px; justify-content:center; margin:10px 0; flex-wrap:wrap; }
    .mm-orbe{ width:34px; height:34px; border-radius:50%; border:2px solid #0006; background:radial-gradient(circle at 35% 30%, #ffffffcc, var(--c)); box-shadow:0 0 8px var(--c); cursor:pointer; padding:0; transition:transform .1s; }
    .mm-orbe:hover{ transform:scale(1.12); }
    .ls-area{ position:relative; width:320px; height:280px; margin:8px auto; max-width:100%; background:#0b1220; border:1px solid var(--line); border-radius:8px; overflow:hidden; background-image:linear-gradient(rgba(90,168,230,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(90,168,230,.06) 1px,transparent 1px); background-size:20px 20px; cursor:crosshair; touch-action:none; }
    .ls-start{ position:absolute; left:0; top:0; width:44px; height:100%; background:linear-gradient(90deg, rgba(90,168,230,.28), transparent); border-right:1px dashed rgba(90,168,230,.5); }
    .ls-exit{ position:absolute; right:0; top:0; width:44px; height:100%; background:linear-gradient(-90deg, rgba(255,138,61,.30), transparent); border-left:1px dashed rgba(255,138,61,.6); }
    .ls-beam{ position:absolute; height:4px; transform-origin:center; pointer-events:none; background:linear-gradient(90deg, rgba(255,82,87,0), #ff5257 22%, #ff9a9a 50%, #ff5257 78%, rgba(255,82,87,0)); box-shadow:0 0 6px #ff5257; }
    .ls-dot{ position:absolute; width:14px; height:14px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #fff, #5aa8e6); box-shadow:0 0 8px #5aa8e6; z-index:3; }
    .ls-dot.mort{ background:radial-gradient(circle at 35% 30%, #fff, #ff5257); box-shadow:0 0 14px #ff5257; }
    .bp-integ{ height:9px; background:#0f1830; border:1px solid var(--line); border-radius:6px; overflow:hidden; margin:6px 0 4px; }
    .bp-integ-bar{ height:100%; width:100%; background:#8bd450; transition:width .15s, background .15s; }
    .bp-area{ position:relative; width:340px; height:180px; margin:6px auto; max-width:100%; background:#0b1220; border:1px solid var(--line); border-radius:8px; overflow:hidden; background-image:linear-gradient(90deg,rgba(90,168,230,.06) 1px,transparent 1px); background-size:20px 100%; }
    .bp-gate{ position:absolute; top:0; bottom:0; left:284px; width:0; border-left:2px dashed var(--orange,#ff8a3d); box-shadow:0 0 12px var(--orange,#ff8a3d); }
    .bp-reste{ position:absolute; right:6px; top:4px; font-family:"Space Mono",monospace; font-size:11px; color:var(--sourdine); }
    .bp-pkt{ position:absolute; width:36px; height:36px; border-radius:9px; display:grid; place-items:center; font-size:19px; cursor:pointer; transform:translateY(-50%); touch-action:none; user-select:none; }
    .bp-pkt.good{ background:rgba(90,168,230,.22); border:1px solid #5aa8e6; color:#bfe0ff; box-shadow:0 0 8px rgba(90,168,230,.5); }
    .bp-pkt.bad{ background:rgba(255,82,87,.22); border:1px solid #ff5257; color:#ffb3b5; box-shadow:0 0 8px rgba(255,82,87,.6); }
    .bp-pkt.bad:hover{ transform:translateY(-50%) scale(1.15); }
    .bp-hit{ animation:bpHit .16s; }
    @keyframes bpHit{ 0%,100%{box-shadow:inset 0 0 0 rgba(255,82,87,0)} 50%{box-shadow:inset 0 0 34px rgba(255,82,87,.6)} }
  `;
  document.head.appendChild(st); _volStyleMonte=true;
}
