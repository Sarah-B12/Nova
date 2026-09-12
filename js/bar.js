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
async function majBar(el){
  if(!el) el=document.querySelector("#centre-corps"); if(!el) return;
  _barStyle();
  const fid=(typeof villeActuelle==="function")?villeActuelle():null;
  if(!fid){ el.innerHTML=`<h3 style="margin:2px 0">Le bar</h3><p class="vide">Il n'y a pas de bar en pleine nature. Rejoins une ville.</p>`; return; }
  el.innerHTML=`<h3 style="margin:2px 0">${barNom(fid)}</h3><p class="vide">Chargement…</p>`;

  if(!_barCatalogue){
    try{ const { data } = await sb.from("bar_boissons").select("*").order("prix"); _barCatalogue=data||[]; }
    catch(e){ if(typeof _catchLog==="function") _catchLog(e, "bar.js#cat"); _barCatalogue=[]; }
  }
  await boissonCharger();

  const dispo=_barCatalogue.filter(b=>!b.faction || b.faction===fid);
  const reste=boissonResteMs();
  let h=`<h3 style="margin:2px 0">${barNom(fid)}</h3>`;
  h+=`<img class="bar-banniere" src="images/bar/${fid}.png" alt="" onerror="this.remove()">`;
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
  el.querySelectorAll("[data-boire]").forEach(b=>b.addEventListener("click",()=>boire(b.dataset.boire, b)));
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
