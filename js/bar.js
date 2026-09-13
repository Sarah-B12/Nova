/* ===========================================================
   BAR — sous-onglet du Centre (v0.77, brique 2).

   Le bar de chaque faction sert 3 boissons communes + 2 qui lui sont propres.
   Tout ce qui compte est décidé par le SERVEUR (RPC `boire`) : le prix, le
   tirage (50 % mauvais / 35 % bon / 15 % les deux) et la présence physique
   dans la ville. Ce fichier n'affiche que le résultat.

   ⚠ L'effet actif vit dans la table `boisson_active`, PAS dans `donnees` :
   le client réécrit `donnees` en entier à chaque sauvegarde et l'effacerait.
   `etat.boisson` n'en est qu'un reflet de session, rechargé par boissonCharger().

   Les clés de `mods` sont celles fixées par v077_bar_brique1.sql :
     force, agilite, intelligence     → bonus PLAT
     o2_cout, energie_cout, energie_depl → multiplicateur de COÛT (0.75 = −25 %)
     mine, recolte, credits, butin    → multiplicateur de GAIN
     boutique, patrouille             → multiplicateur où <1 est un avantage
   =========================================================== */

const BAR_NOMS = {
  ignis:        "La Cendre",
  cultivateurs: "Le Terreau",
  toundra:      "Le Dégel",
  nomades:      "L'Arrêt",
  rouage:       "La Purge"
};
function barNom(fac){ return BAR_NOMS[fac] || "Le Bar"; }

/* Libellé lisible d'un effet. Renvoie "" si la clé est inconnue (une boisson
   ajoutée en SQL sans passer ici s'affichera sans casser la page). */
function barEffetTexte(cle, v){
  const plat = { force:"Force", agilite:"Agilité", intelligence:"Intelligence" };
  if(plat[cle]) return `${v>0?"+":""}${v} ${plat[cle]}`;
  const pct = Math.round((v-1)*100);
  const signe = pct>0 ? `+${pct}` : `${pct}`;
  switch(cle){
    case "o2_cout":      return `${signe} % d'O₂ consommé`;
    case "energie_cout": return `${signe} % d'énergie par action`;
    case "energie_depl": return `${signe} % d'énergie en déplacement`;
    case "mine":         return `${signe} % au minage`;
    case "recolte":      return `${signe} % aux récoltes`;
    case "credits":      return `${signe} % de crédits gagnés`;
    case "butin":        return `${signe} % de butin`;
    case "boutique":     return `${signe} % sur les prix en boutique`;
    case "patrouille":   return `${signe} % de rencontres de patrouille`;
    case "sante_immediate": return `${v>0?"+":""}${v} santé`;
    case "moral_immediate": return `${v>0?"+":""}${v} moral`;
    case "energie_immediate": return `${v>0?"+":""}${v} énergie`;
    default: return "";
  }
}
function barEffetsTexte(mods){
  const p=[]; for(const k in (mods||{})){ const t=barEffetTexte(k, mods[k]); if(t) p.push(t); }
  return p.join(" · ");
}
/* Un effet est-il favorable ? (sert à la couleur) */
function barEffetBon(cle, v){
  if(["force","agilite","intelligence","sante_immediate","moral_immediate","energie_immediate"].includes(cle)) return v>0;
  if(["o2_cout","energie_cout","energie_depl","boutique","patrouille"].includes(cle)) return v<1;
  return v>1;
}

/* ---------- Effet actif ---------- */
async function boissonCharger(){
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO) return;
  try{
    const { data } = await sb.rpc("boisson_etat");
    etat.boisson = (data && data.ok && data.active) ? data : null;
    if(etat.boisson) etat.boisson._lu = Date.now();
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "bar.js#etat"); }
  if(typeof majBoissonFiche==="function") majBoissonFiche();
}
/* Multiplicateur/bonus courant d'une clé. Les fonctions apt* l'appellent.
   Renvoie 0 pour un bonus plat absent, 1 pour un multiplicateur absent. */
function boissonMod(cle, defaut){
  const b = etat && etat.boisson;
  const d = (defaut!=null) ? defaut : (["force","agilite","intelligence"].includes(cle) ? 0 : 1);
  if(!b || !b.mods) return d;
  // L'effet expire seul : au-delà de `fin`, on ne l'applique plus (le serveur
  // en fait autant de son côté ; ceci évite juste d'attendre un rechargement).
  if(b.fin && new Date(b.fin) <= new Date()){ etat.boisson=null; return d; }
  const v = b.mods[cle];
  return (typeof v === "number") ? v : d;
}
function boissonResteMs(){
  const b = etat && etat.boisson; if(!b || !b.fin) return 0;
  return Math.max(0, new Date(b.fin) - Date.now());
}
function _barDuree(ms){
  const h=Math.floor(ms/3600000), m=Math.floor(ms/60000)%60;
  return h>0 ? `${h} h ${String(m).padStart(2,"0")}` : `${m} min`;
}

/* ---------- Ligne sur SA PROPRE fiche (jamais sur celle des autres) ---------- */
function majBoissonFiche(){
  const z=document.querySelector("#fiche-boisson"); if(!z) return;
  const b = etat && etat.boisson;
  if(!b || boissonResteMs()<=0){ z.hidden=true; z.innerHTML=""; return; }
  z.hidden=false;
  const det = Object.entries(b.mods||{}).map(([k,v])=>{
    const t=barEffetTexte(k,v); if(!t) return "";
    return `<li class="${barEffetBon(k,v)?"bon":"mauvais"}">${t}</li>`;
  }).join("");
  z.innerHTML = `<span class="bo-ligne" tabindex="0">
      <span class="bo-pastille ${b.tirage==="bon"?"bon":(b.tirage==="mauvais"?"mauvais":"mixte")}"></span>
      <b>${echapper(b.nom)}</b> <span class="itip-gris">— ${_barDuree(boissonResteMs())}</span>
      <span class="bo-bulle"><b>${echapper(b.nom)}</b><ul>${det||"<li>Aucun effet.</li>"}</ul>
        <span class="itip-gris">Il reste ${_barDuree(boissonResteMs())}. Une seule boisson par 24 h.</span></span>
    </span>`;
}

/* ---------- Vue du bar ---------- */
function _barStyle(){
  if(document.querySelector("#bar-style")) return;
  const s=document.createElement("style"); s.id="bar-style";
  s.textContent=`
    .bar-banniere{ width:100%; max-height:170px; object-fit:cover; border-radius:var(--r-s); border:1px solid var(--line); margin:0 0 12px; display:block; }
    .bar-liste{ display:grid; gap:10px; }
    .bar-carte{ display:flex; gap:12px; align-items:center; background:rgba(16,41,78,.35); border:1px solid var(--line); border-radius:10px 4px 10px 4px; padding:10px 12px; }
    .bar-carte.exclu{ border-left:3px solid var(--orange); }
    .bar-carte.a-venir{ opacity:.55; }
    .cuve-rang{ display:flex; gap:8px; }
    .cuve-jeton{ width:26px; height:26px; border-radius:50%; border:1px solid var(--line); background:rgba(16,41,78,.6); }
    .cuve-jeton.tire{ background:rgba(139,212,80,.35); border-color:#8bd450; }
    .bar-img{ width:54px; height:54px; object-fit:contain; flex:0 0 54px; }
    .bar-img-vide{ width:54px; height:54px; flex:0 0 54px; border:1px dashed var(--line); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--sourdine); font-size:22px; }
    .bar-txt{ flex:1; min-width:0; }
    .bar-nom{ font-weight:700; }
    .bar-desc{ color:var(--sourdine); font-size:13px; font-style:italic; }
    .bar-prix{ font-family:"Space Mono",monospace; color:var(--orange-hi); white-space:nowrap; }
    .bo-ligne{ position:relative; display:inline-flex; align-items:center; gap:6px; cursor:help; font-size:13px; }
    .bo-pastille{ width:9px; height:9px; border-radius:50%; background:var(--sourdine); flex:0 0 9px; }
    .bo-pastille.bon{ background:#8bd450; } .bo-pastille.mauvais{ background:#ff6b6b; }
    .bo-pastille.mixte{ background:linear-gradient(90deg,#8bd450 50%,#ff6b6b 50%); }
    .bo-bulle{ display:none; position:absolute; left:0; top:calc(100% + 6px); z-index:40; min-width:230px;
      background:#0f1830; border:1px solid var(--line); border-radius:8px; padding:8px 10px; font-size:12px;
      box-shadow:0 8px 24px rgba(0,0,0,.55); }
    .bo-ligne:hover .bo-bulle, .bo-ligne:focus .bo-bulle{ display:block; }   /* focus = accessible au doigt */
    .bo-bulle ul{ margin:6px 0; padding-left:16px; }
    .bo-bulle li.bon{ color:#8bd450; } .bo-bulle li.mauvais{ color:#ff6b6b; }
  `;
  document.head.appendChild(s);
}

let _barCatalogue = null;
let _barVue = "boissons";          // "boissons" | "jeux"
let _barJeux = null;               // état renvoyé par bar_jeux_etat()

function _barOnglets(){
  return `<div class="sous-menu">
    <button class="sous-lien${_barVue==="boissons"?" actif":""}" data-barvue="boissons">Comptoir</button>
    <button class="sous-lien${_barVue==="jeux"?" actif":""}" data-barvue="jeux">Tables de jeu</button>
  </div>`;
}
function _barWireOnglets(el){
  el.querySelectorAll("[data-barvue]").forEach(b=>b.addEventListener("click",()=>{ _barVue=b.dataset.barvue; majBar(el); }));
}
async function majBar(el){
  if(!el) el=document.querySelector("#centre-corps"); if(!el) return;
  _barStyle();
  const fid=(typeof villeActuelle==="function")?villeActuelle():null;
  if(!fid){ el.innerHTML=`<h3 style="margin:2px 0">Le bar</h3><p class="vide">Il n'y a pas de bar en pleine nature. Rejoins une ville.</p>`; return; }
  if(_barVue==="jeux"){ await majBarJeux(el, fid); return; }
  el.innerHTML=`<h3 style="margin:2px 0">${barNom(fid)}</h3><p class="vide">Chargement…</p>`;

  /* ⚠ v0.78 — le catalogue passe par une RPC. La lecture directe de la table
     revenait VIDE (droit SELECT absent sur une table créée par script), et la
     page n'affichait aucune boisson sans dire pourquoi. */
  if(!_barCatalogue){
    try{
      const { data, error } = await sb.rpc("bar_catalogue");
      if(error) throw error;
      _barCatalogue = Array.isArray(data) ? data : [];
    }catch(e){
      if(typeof _catchLog==="function") _catchLog(e, "bar.js#cat");
      console.warn("[bar] catalogue illisible :", e && e.message);
      _barCatalogue = null;
      el.innerHTML=`<h3 style="margin:2px 0">${barNom(fid)}</h3><p class="vide">Le bar est fermé : le catalogue n'a pas pu être chargé. Réessaie dans un instant.</p>`;
      return;
    }
  }
  await boissonCharger();

  const dispo=(_barCatalogue||[]).filter(b=>!b.faction || b.faction===fid);
  if(!dispo.length){
    el.innerHTML=`<h3 style="margin:2px 0">${barNom(fid)}</h3><p class="vide">Aucune boisson au comptoir. Si cela persiste, le catalogue du serveur est vide.</p>`;
    return;
  }
  const reste=boissonResteMs();
  let h=`<h3 style="margin:2px 0">${barNom(fid)}</h3>`;
  h+=`<img class="bar-banniere" src="images/bar/${fid}.png" alt="" onerror="this.remove()">`;
  h+=_barOnglets();
  h+=`<p class="vide">Le tenancier ne demande pas ton nom. <b>Une seule boisson par 24 h</b>, et l'effet dure aussi longtemps. Ce qu'on te sert est tiré au sort : le plus souvent, ça se paie.</p>`;

  if(reste>0 && etat.boisson){
    h+=`<p class="vide" style="border-left:3px solid var(--orange);padding-left:10px">Tu es déjà sous l'effet de <b>${echapper(etat.boisson.nom)}</b> — ${barEffetsTexte(etat.boisson.mods)||"aucun effet"}. Encore ${_barDuree(reste)} avant de pouvoir reboire.</p>`;
  }

  h+=`<div class="bar-liste">`;
  for(const b of dispo){
    const exclu=!!b.faction;
    const trop=(etat.credits||0) < b.prix;
    h+=`<div class="bar-carte${exclu?" exclu":""}">
      <img class="bar-img" src="images/boissons/${b.id}.png" alt="" onerror="this.outerHTML='<span class=\\'bar-img-vide\\'>▨</span>'">
      <span class="bar-txt">
        <span class="bar-nom">${echapper(b.nom)}${exclu?` <span class="itip-gris">· maison</span>`:""}</span>
        <span class="bar-desc">${echapper(b.texte||"")}</span>
      </span>
      <span class="bar-prix">${b.prix} ₡</span>
      <button class="mini" data-boire="${b.id}" ${(reste>0||trop)?"disabled":""} title="${reste>0?"Une seule boisson par 24 h":(trop?"Crédits insuffisants":"Le tenancier sert sans commenter")}">Boire</button>
    </div>`;
  }
  h+=`</div>`;
  el.innerHTML=h;
  _barWireOnglets(el);
  el.querySelectorAll("[data-boire]").forEach(b=>b.addEventListener("click",()=>boire(b.dataset.boire, b)));
}

/* ===========================================================
   TABLES DE JEU
   ⚠ Le serveur tire ET paie (RPC jeu_des…). Le client n'annonce jamais un
   résultat : il ne fait qu'afficher ce que la base a décidé. Les limites
   (2 jeux différents par jour, chaque jeu 1×/24 h) sont vérifiées en SQL —
   celles d'ici ne servent qu'à griser les boutons.
   =========================================================== */
const BAR_JEUX = [
  { id:"des",        nom:"Les dés du fond", dispo:true,
    desc:"Deux dés usés. Tu paries au-dessus ou en dessous de 7 — ou pile sur 7, si tu te sens brave.",
    gains:"bas ou haut ×2,2 · sept ×5,5" },
  { id:"cuve",       nom:"La cuve", dispo:true,
    desc:"Six jetons de quart dans un bocal opaque, un seul est marqué. Le pot double à chaque tirage, et tu peux t'arrêter quand tu veux.",
    gains:"jusqu'à ×5,4 · le jeton marqué prend tout" },
  { id:"bonneteau",  nom:"Le bonneteau", dispo:true,
    desc:"Trois gobelets, une bille, des mains trop rapides. Personne n'a jamais prouvé qu'il trichait.",
    gains:"×2,7" },
  { id:"puissance4", nom:"Quatre alignés", dispo:false,
    desc:"Contre le tenancier, sur une grille rayée par vingt ans de verres.",
    gains:"×2 · nul remboursé" }
];
function _barBlocTexte(code){
  return { ok:"", jeu_24h:"Déjà joué — reviens dans 24 h.",
           deux_par_jour:"Deux jeux par jour, pas plus." }[code] || code;
}
async function majBarJeux(el, fid){
  el.innerHTML=`<h3 style="margin:2px 0">${barNom(fid)} — tables de jeu</h3>${_barOnglets()}<p class="vide">Chargement…</p>`;
  try{ const { data } = await sb.rpc("bar_jeux_etat"); _barJeux = (data && data.ok) ? data : null; }
  catch(e){ if(typeof _catchLog==="function") _catchLog(e, "bar.js#jeux"); _barJeux=null; }

  const st=_barJeux, jx=(st&&st.jeux)||{};
  let h=`<h3 style="margin:2px 0">${barNom(fid)} — tables de jeu</h3>${_barOnglets()}`;
  h+=`<p class="vide">On mise, on perd le plus souvent, on gagne parfois. <b>Deux jeux par jour</b>, et chaque table une seule fois toutes les 24 h.${st?` Mise de ${st.mise_min} à ${st.mise_max} ₡. Déjà joué aujourd'hui : ${st.joues_aujourdhui}/2.`:""}</p>`;
  h+=`<div class="bar-liste">`;
  for(const j of BAR_JEUX){
    const bloc=jx[j.id]||"ok";
    const ko = !j.dispo || bloc!=="ok";
    h+=`<div class="bar-carte${j.dispo?"":" a-venir"}">
      <span class="bar-img-vide">${j.dispo?"◈":"◌"}</span>
      <span class="bar-txt">
        <span class="bar-nom">${j.nom}${j.dispo?"":` <span class="itip-gris">· bientôt</span>`}</span>
        <span class="bar-desc">${j.desc}</span>
        <span class="itip-gris" style="font-size:12px">${j.gains}${(j.dispo&&bloc!=="ok")?` — ${_barBlocTexte(bloc)}`:""}</span>
      </span>
      <button class="mini" data-jeu="${j.id}" ${ko?"disabled":""}>${j.dispo?"S'asseoir":"—"}</button>
    </div>`;
  }
  h+=`</div><div id="bar-table" style="margin-top:14px"></div>`;
  el.innerHTML=h;
  _barWireOnglets(el);
  el.querySelectorAll("[data-jeu]").forEach(b=>b.addEventListener("click",()=>{
    const z=el.querySelector("#bar-table");
    if(b.dataset.jeu==="des")       _tableDes(z);
    if(b.dataset.jeu==="cuve")      _tableCuve(z);
    if(b.dataset.jeu==="bonneteau") _tableBonneteau(z);
  }));
}

/* ---------- Les dés du fond ---------- */
function _tableDes(z){
  if(!z) return;
  const max=(_barJeux&&_barJeux.mise_max)||200, min=(_barJeux&&_barJeux.mise_min)||50;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:10px">
      <b>Les dés du fond</b>
      <span class="bar-desc">Le tenancier pousse deux dés vers toi. « Au-dessus, en dessous, ou pile. À toi de voir. »</span>
      <div class="actions" style="flex-wrap:wrap;gap:8px;align-items:center">
        <label class="itip-gris">Mise <input id="des-mise" type="number" min="${min}" max="${max}" step="10" value="${min}" style="width:90px"></label>
        <select id="des-pari" class="gouv-textarea" style="padding:6px 8px;width:auto">
          <option value="bas">En dessous de 7 (2-6) — ×2,2</option>
          <option value="haut">Au-dessus de 7 (8-12) — ×2,2</option>
          <option value="sept">Pile 7 — ×5,5</option>
        </select>
        <button class="mini" id="des-lancer">Lancer</button>
      </div>
      <div id="des-res" class="itip-gris"></div>
    </div>`;
  z.querySelector("#des-lancer").addEventListener("click", async()=>{
    const b=z.querySelector("#des-lancer"); if(b.disabled) return; b.disabled=true;
    const mise=parseInt(z.querySelector("#des-mise").value,10)||0;
    const pari=z.querySelector("#des-pari").value;
    const res=z.querySelector("#des-res");
    res.textContent="Les dés roulent…";
    let d, error;
    try{ ({ data:d, error } = await sb.rpc("jeu_des", { p_pari:pari, p_mise:mise })); }
    catch(e){ if(typeof _catchLog==="function") _catchLog(e, "bar.js#des"); }
    if(error || !d || !d.ok){
      const e=d&&d.err;
      const msg = e==="mise" ? `Mise entre ${d.min} et ${d.max} ₡.`
                : e==="fonds" ? "Crédits insuffisants."
                : e==="jeu_24h" ? "Tu as déjà joué aux dés aujourd'hui."
                : e==="deux_par_jour" ? "Deux jeux par jour, pas plus."
                : e==="prison" ? "Tu es en prison."
                : `Partie refusée (${e||"erreur"}).`;
      res.textContent=msg; journal(msg,"alerte"); b.disabled=false; return;
    }
    if(typeof appliquerSoldeServeur==="function" && typeof d.solde==="number") appliquerSoldeServeur(d.solde);
    res.innerHTML = `Dés : <b>${d.d1}</b> et <b>${d.d2}</b> — total <b>${d.total}</b>. `
      + (d.gagne ? `<span style="color:#8bd450">Gagné : +${d.net} ₡.</span>` : `<span style="color:#ff6b6b">Perdu : −${d.mise} ₡.</span>`);
    journal(`Dés du fond (${d.total}) : ${d.gagne?`+${d.net}`:`−${d.mise}`} ₡.`, d.gagne?"gain":"alerte", "eco");
    if(typeof afficher==="function") afficher();
  });
}

async function boire(id, bouton){
  if(bouton){ if(bouton.disabled) return; bouton.disabled=true; }   // pas de double clic : c'est cher
  let res, error;
  try{ ({ data:res, error } = await sb.rpc("boire", { p_boisson:id })); }
  catch(e){ if(typeof _catchLog==="function") _catchLog(e, "bar.js#boire"); }
  if(error || !res || !res.ok){
    const e=res && res.err;
    if(e==="deja")              journal(`Tu as déjà bu — encore ${_barDuree((res.reste_s||0)*1000)} à tenir.`,"alerte");
    else if(e==="fonds")        journal(`Il te faut ${res.prix} ₡ pour cette boisson.`,"alerte");
    else if(e==="pas_sur_place")journal("Cette boisson ne se sert que dans son bar : il faut y être.","alerte");
    else if(e==="prison")       journal("Tu es en prison — le bar attendra.","alerte");
    else if(e==="mort")         journal("Impossible pour l'instant.","alerte");
    else                        journal(`Le tenancier refuse de servir (${e||"erreur"}).`,"alerte");
    if(bouton) bouton.disabled=false;
    return;
  }
  // Le serveur a débité : on aligne le solde local sans écraser l'écart en attente.
  if(typeof appliquerSoldeServeur==="function" && typeof res.solde==="number") appliquerSoldeServeur(res.solde);
  etat.boisson = { id:res.id, nom:res.nom, tirage:res.tirage, mods:res.mods, fin:res.fin, active:true };

  const txt=barEffetsTexte(res.mods);
  const ton = res.tirage==="bon" ? "gain" : (res.tirage==="mauvais" ? "alerte" : "");
  const intro = res.tirage==="bon" ? "Bonne pioche" : (res.tirage==="mauvais" ? "Mauvaise pioche" : "Les deux à la fois");
  journal(`${res.nom} (−${res.prix} ₡). ${intro} : ${txt||"aucun effet notable"}. 24 h.`, ton);

  if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();   // santé/moral/énergie immédiats
  if(typeof afficher==="function") afficher();
  majBoissonFiche();
  majBar();
}


/* ---------- La cuve (mise en jeu progressive) ----------
   ⚠ L'ordre des jetons est mélangé À L'OUVERTURE et gardé en base : ni le
   serveur ne peut décider en cours de route, ni le client le lire. Une partie
   interrompue (rechargement) se reprend via cuve_etat(). */
function _cuveCadre(z, st){
  const tours=st.tours||0;
  const pastilles = Array.from({length:6},(_,i)=>
    `<span class="cuve-jeton${i<tours?" tire":""}"></span>`).join("");
  const peutTirer = tours < 5;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:10px">
      <b>La cuve</b>
      <span class="bar-desc">« Six jetons, un seul est marqué. Tu tires, ou tu ramasses. »</span>
      <div class="cuve-rang">${pastilles}</div>
      <div class="itip-gris">Mise : <b>${st.mise} ₡</b> · ${tours} tirage${tours>1?"s":""} · ${st.restants} jeton${st.restants>1?"s":""} au fond</div>
      <div id="cuve-res" class="itip-gris">${tours>0?`Tu peux ramasser <b class="or">${st.gain_si_arret} ₡</b>.`:"Tire un premier jeton."}</div>
      <div class="actions" style="gap:8px;flex-wrap:wrap">
        <button class="mini" id="cuve-tirer" ${peutTirer?"":"disabled"}>${peutTirer?`Tirer un jeton (${st.risque_suivant} % de risque → ${st.prochain_gain} ₡)`:"Plus rien à tirer"}</button>
        <button class="mini" id="cuve-encaisser" ${tours>0?"":"disabled"}>Ramasser ${tours>0?st.gain_si_arret+" ₡":""}</button>
      </div>
    </div>`;
  const bt=z.querySelector("#cuve-tirer"), be=z.querySelector("#cuve-encaisser");
  if(bt) bt.addEventListener("click", async()=>{
    bt.disabled=true; if(be) be.disabled=true;
    let d,error; try{ ({data:d,error}=await sb.rpc("cuve_tirer")); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"bar.js#cuve"); }
    if(error||!d||!d.ok){ journal("Tirage impossible.","alerte"); _tableCuve(z); return; }
    if(d.marque){
      if(typeof rechargerCredits==="function") rechargerCredits();
      journal(`La cuve : jeton marqué au ${d.tours}ᵉ tirage — ${d.perdu} ₡ perdus, et 10 % d'énergie avec.`,"alerte","eco");
      z.innerHTML=`<div class="bar-carte" style="flex-direction:column;gap:8px">
        <b>La cuve</b><span style="color:#ff6b6b">Jeton marqué au ${d.tours}ᵉ tirage. Le tenancier ramasse tout : −${d.perdu} ₡, et tu sens la soirée dans tes jambes (−10 % d'énergie).</span></div>`;
      if(typeof chargerJaugesServeur==="function") await chargerJaugesServeur();
      if(typeof afficher==="function") afficher();
      return;
    }
    _cuveCadre(z, { mise:st.mise, tours:d.tours, restants:d.restants,
                    gain_si_arret:d.gain_si_arret, prochain_gain:d.prochain_gain, risque_suivant:d.risque_suivant });
  });
  if(be) be.addEventListener("click", async()=>{
    be.disabled=true; if(bt) bt.disabled=true;
    let d,error; try{ ({data:d,error}=await sb.rpc("cuve_encaisser")); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"bar.js#cuve2"); }
    if(error||!d||!d.ok){ journal("Impossible de ramasser.","alerte"); _tableCuve(z); return; }
    if(typeof appliquerSoldeServeur==="function" && typeof d.solde==="number") appliquerSoldeServeur(d.solde);
    journal(`La cuve : ramassé après ${d.tours} tirage${d.tours>1?"s":""} — ${d.net>=0?"+":""}${d.net} ₡.`, d.net>=0?"gain":"alerte","eco");
    z.innerHTML=`<div class="bar-carte" style="flex-direction:column;gap:8px"><b>La cuve</b>
      <span style="color:#8bd450">Tu ramasses ${d.gain} ₡ après ${d.tours} tirage${d.tours>1?"s":""} (net ${d.net>=0?"+":""}${d.net} ₡).</span></div>`;
    if(typeof afficher==="function") afficher();
  });
}
async function _tableCuve(z){
  if(!z) return;
  let e; try{ ({data:e}=await sb.rpc("cuve_etat")); }catch(err){ if(typeof _catchLog==="function") _catchLog(err,"bar.js#cuve0"); }
  if(e && e.ok && e.partie){ _cuveCadre(z, e); return; }   // partie interrompue : on reprend
  const max=(_barJeux&&_barJeux.mise_max)||200, min=(_barJeux&&_barJeux.mise_min)||50;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:10px">
      <b>La cuve</b>
      <span class="bar-desc">Six jetons de quart dans un bocal opaque, un seul est marqué. Chaque tirage augmente le pot — et le risque.</span>
      <span class="itip-gris">1 tirage ×1,1 · 2 ×1,35 · 3 ×1,8 · 4 ×2,7 · 5 ×5,4. Tomber sur le jeton marqué fait tout perdre, plus 10 % d'énergie.</span>
      <div class="actions" style="gap:8px;align-items:center">
        <label class="itip-gris">Mise <input id="cuve-mise" type="number" min="${min}" max="${max}" step="10" value="${min}" style="width:90px"></label>
        <button class="mini" id="cuve-go">S'installer</button>
      </div><div id="cuve-res" class="itip-gris"></div>
    </div>`;
  z.querySelector("#cuve-go").addEventListener("click", async()=>{
    const b=z.querySelector("#cuve-go"); if(b.disabled) return; b.disabled=true;
    const mise=parseInt(z.querySelector("#cuve-mise").value,10)||0;
    let d,error; try{ ({data:d,error}=await sb.rpc("cuve_ouvrir",{p_mise:mise})); }catch(err){ if(typeof _catchLog==="function") _catchLog(err,"bar.js#cuve1"); }
    if(error||!d||!d.ok){
      const er=d&&d.err;
      const msg = er==="mise" ? `Mise entre ${d.min} et ${d.max} ₡.` : er==="fonds" ? "Crédits insuffisants."
                : er==="jeu_24h" ? "Tu as déjà joué à la cuve aujourd'hui." : er==="deux_par_jour" ? "Deux jeux par jour, pas plus."
                : er==="partie_en_cours" ? "Une partie est déjà ouverte." : `Refusé (${er||"erreur"}).`;
      z.querySelector("#cuve-res").textContent=msg; journal(msg,"alerte"); b.disabled=false; return;
    }
    if(typeof appliquerSoldeServeur==="function" && typeof d.solde==="number") appliquerSoldeServeur(d.solde);
    if(typeof afficher==="function") afficher();
    _cuveCadre(z, { mise:d.mise, tours:0, restants:6, gain_si_arret:0, prochain_gain:d.prochain_gain, risque_suivant:17 });
  });
}

/* ---------- Le bonneteau ---------- */
function _tableBonneteau(z){
  if(!z) return;
  const max=(_barJeux&&_barJeux.mise_max)||200, min=(_barJeux&&_barJeux.mise_min)||50;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:10px">
      <b>Le bonneteau</b>
      <span class="bar-desc">Trois gobelets, une bille, des mains trop rapides. « Suis bien. »</span>
      <div class="actions" style="gap:8px;align-items:center">
        <label class="itip-gris">Mise <input id="bon-mise" type="number" min="${min}" max="${max}" step="10" value="${min}" style="width:90px"></label>
        <span class="itip-gris">Gain ×2,7</span>
      </div>
      <div class="actions" style="gap:10px">
        <button class="mini" data-gob="1">Gobelet 1</button>
        <button class="mini" data-gob="2">Gobelet 2</button>
        <button class="mini" data-gob="3">Gobelet 3</button>
      </div>
      <div id="bon-res" class="itip-gris"></div>
    </div>`;
  z.querySelectorAll("[data-gob]").forEach(b=>b.addEventListener("click", async()=>{
    const tous=[...z.querySelectorAll("[data-gob]")];
    if(tous.some(x=>x.disabled)) return; tous.forEach(x=>x.disabled=true);
    const res=z.querySelector("#bon-res"); res.textContent="Les gobelets tournent…";
    const mise=parseInt(z.querySelector("#bon-mise").value,10)||0;
    let d,error; try{ ({data:d,error}=await sb.rpc("jeu_bonneteau",{p_mise:mise,p_gobelet:parseInt(b.dataset.gob,10)})); }
    catch(e){ if(typeof _catchLog==="function") _catchLog(e,"bar.js#bon"); }
    if(error||!d||!d.ok){
      const er=d&&d.err;
      const msg = er==="mise" ? `Mise entre ${d.min} et ${d.max} ₡.` : er==="fonds" ? "Crédits insuffisants."
                : er==="jeu_24h" ? "Tu as déjà joué au bonneteau aujourd'hui." : er==="deux_par_jour" ? "Deux jeux par jour, pas plus."
                : `Refusé (${er||"erreur"}).`;
      res.textContent=msg; journal(msg,"alerte"); tous.forEach(x=>x.disabled=false); return;
    }
    if(typeof appliquerSoldeServeur==="function" && typeof d.solde==="number") appliquerSoldeServeur(d.solde);
    res.innerHTML = `La bille était sous le <b>gobelet ${d.bon}</b>. `
      + (d.gagne?`<span style="color:#8bd450">Gagné : +${d.net} ₡.</span>`:`<span style="color:#ff6b6b">Perdu : −${d.mise} ₡.</span>`);
    journal(`Bonneteau : ${d.gagne?`+${d.net}`:`−${d.mise}`} ₡.`, d.gagne?"gain":"alerte","eco");
    if(typeof afficher==="function") afficher();
  }));
}
