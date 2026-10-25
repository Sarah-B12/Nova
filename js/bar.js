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
function barNom(fac){ return barStation() ? "La buvette du personnel" : (BAR_NOMS[fac] || "Le Bar"); }

/* ===========================================================
   v1.88 — K55 : LE BAR DE LA STATION D'ANCOLIE. Retiré de Silène en v0.91 « pour une
   carte ultérieure » : c'est elle. Ouvert après Q20 (drapeau `ancolie`), dans la zone
   de la station. Les automates ne servent que le personnel répertorié (K16) : c'est
   42-U1F qui a mis « son tournevis » parmi les ayants droit — chaque verre est
   IMPUTÉ À SON MATRICULE, et il râle. Seules les boissons COMMUNES (faction null)
   y sont servies ; le serveur (boire, v205) vérifie la même chose. Les tables de jeu
   sont les mêmes qu'ailleurs, tenues par un automate.
   =========================================================== */
function barStation(){ return (typeof aLaStation === "function") && aLaStation() && !!(etat && etat.ancolie === true); }
function _barQui(){ return barStation() ? "L'automate" : "Le tenancier"; }
let _barEl = null;   // le conteneur courant (le Centre en ville, l'onglet Bar à la station)
const BAR_ASULF = [
  "Dans la radio, un soupir : « Tu bois sur mon matricule, là. Tu sais combien de rations ça me coûte, un verre ? Moi non plus. Mais ça me coûte. »",
  "« Encore ? » La voix d'Asulf, enrhumée. « Je vais finir avec une note de buvette plus longue que mon dossier. »",
  "« Santé. » Un temps de radio. « Enfin, la tienne. La mienne, elle est imputée. »",
  "« Note bien que j'ai rien dit. » Il renifle. « Je note, moi. Tout. Dans ma tête. »"
];
/* v1.93 — K61 : après Q30, Asulf vit à La Toundra. Les verres sont toujours imputés à son
   matricule (l'habilitation de Q29 est sous ce matricule) : la note le suit jusque dans la neige. */
const BAR_ASULF_TOUNDRA = [
  "Ta radio grésille, depuis La Toundra. Asulf claque des dents. « On vient de me transmettre ta note. Ici. Dans la neige. Ils retrouvent toujours tout le monde, pour les notes. »",
  "« Encore un verre sur mon matricule ? » Un bruit de vent dans la radio. « Bois-en un pour moi. Ici, tout gèle, même la sporelle. C'est génial. »",
  "« Je suis évacué, tu sais. » Un reniflement glacé. « Évacué, mais facturé. C'est ça, la liberté ? »",
  "« Santé. » Il souffle sur ses doigts, ça s'entend. « Pose-moi un transat de côté, si t'en vois un. Non, pour rien. Pour rien. »"
];
function _barAsulfLigne(){ const L = (etat && etat.asulfToundra) ? BAR_ASULF_TOUNDRA : BAR_ASULF; return L[Math.floor(Math.random()*L.length)]; }

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
/* ⚠ v1.88b — retour de l'autrice : la ligne s'affichait en vrac (nom, durée, liste à
   puces, tout à plat). Les styles `.bo-*` ne sont posés que par _barStyle(), appelée
   jusqu'ici par la seule vue du bar : sans passer par le bar dans la session, la fiche
   n'avait aucun style. On les pose ici aussi. Et au doigt (téléphone), le survol
   n'existe pas : un toucher ouvre ou ferme la bulle, un toucher ailleurs la ferme. */
function majBoissonFiche(){
  const z=document.querySelector("#fiche-boisson"); if(!z) return;
  _barStyle();
  const b = etat && etat.boisson;
  if(!b || boissonResteMs()<=0){ z.hidden=true; z.innerHTML=""; return; }
  z.hidden=false;
  const etaitOuverte = !!z.querySelector(".bo-ligne.ouvert");   // la fiche se redessine souvent : on garde la bulle ouverte
  const det = Object.entries(b.mods||{}).map(([k,v])=>{
    const t=barEffetTexte(k,v); if(!t) return "";
    return `<li class="${barEffetBon(k,v)?"bon":"mauvais"}">${t}</li>`;
  }).join("");
  z.innerHTML = `<span class="bo-ligne" tabindex="0" role="button" aria-label="Effets de la boisson">
      <span class="bo-pastille ${b.tirage==="bon"?"bon":(b.tirage==="mauvais"?"mauvais":"mixte")}"></span>
      <b>${echapper(b.nom)}</b>
      <span class="bo-bulle"><b>${echapper(b.nom)}</b><ul>${det||"<li>Aucun effet.</li>"}</ul>
        <span class="itip-gris">Il reste ${_barDuree(boissonResteMs())}. Une seule boisson par 24 h.</span></span>
    </span>`;
  const l = z.querySelector(".bo-ligne");
  if(l && etaitOuverte) l.classList.add("ouvert");
  if(l) l.addEventListener("click", e => { e.stopPropagation(); l.classList.toggle("ouvert"); });
  if(!majBoissonFiche._fermeur){
    majBoissonFiche._fermeur = true;
    document.addEventListener("click", () => document.querySelectorAll(".bo-ligne.ouvert").forEach(x => x.classList.remove("ouvert")));
  }
}

/* ---------- Vue du bar ---------- */
function _barStyleJeux(){   // v1.88d : dés, cuve, bonneteau
  if(document.querySelector("#bar-style-jeux")) return;
  const st=document.createElement("style"); st.id="bar-style-jeux";
  st.textContent=`
    .des-piste{ display:flex; gap:14px; justify-content:center; font-size:46px; line-height:1; color:var(--texte); }
    .des-de{ display:inline-block; }
    .des-de.roule{ animation:desRoule .18s linear infinite; }
    @keyframes desRoule{ 0%{ transform:rotate(-14deg) translateY(-3px); } 50%{ transform:rotate(12deg) translateY(2px); } 100%{ transform:rotate(-14deg) translateY(-3px); } }
    .cuve-rang.secoue{ animation:cuveSecoue .55s ease-in-out; }
    @keyframes cuveSecoue{ 0%,100%{ transform:none; } 20%{ transform:translateX(-5px) rotate(-2deg); } 40%{ transform:translateX(5px) rotate(2deg); } 60%{ transform:translateX(-4px); } 80%{ transform:translateX(3px); } }
    .bon-table{ position:relative; height:132px; width:100%; max-width:380px; margin:4px auto; border-radius:14px; background:radial-gradient(ellipse at 50% 85%, rgba(255,176,96,.10), rgba(0,0,0,0) 70%); }
    .bon-gob{ position:absolute; bottom:12px; width:64px; height:96px; }
    .bon-cloche{ position:absolute; bottom:0; left:4px; width:56px; height:64px; border-radius:26px 26px 6px 6px; background:linear-gradient(160deg,#c48a4c,#7a4a22 70%,#5a3518); box-shadow:inset 0 -6px 0 rgba(0,0,0,.25), 0 6px 10px rgba(0,0,0,.35); transition:transform .32s ease; z-index:2; }
    .bon-bille{ position:absolute; bottom:3px; left:23px; width:18px; height:18px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#fff,#ffd28a 40%,#c7782a); opacity:0; z-index:1; }
    .bon-gob.a-bille .bon-bille{ opacity:1; }
    .bon-gob.leve .bon-cloche{ transform:translateY(-42px); }
    .bon-gob.devant{ transform:translateY(5px) scale(1.03); z-index:3; }   /* v1.90 : indices de profondeur plus discrets */
    .bon-gob.derriere{ transform:translateY(-5px) scale(.97); z-index:1; }
    .bon-table.choix .bon-gob{ cursor:pointer; }
    .bon-table.choix .bon-gob:hover .bon-cloche{ filter:brightness(1.18); }
    .bon-gob.designe .bon-cloche{ box-shadow:0 0 0 3px var(--orange,#ff8a3d), 0 6px 10px rgba(0,0,0,.35); }
    @media (prefers-reduced-motion: reduce){ .des-de.roule, .cuve-rang.secoue{ animation:none; } }
  `;
  document.head.appendChild(st);
}
function _barStyle(){
  _barStyleJeux();
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
    /* v1.93x — retour de l'autrice (capture) : les icônes des vivres (photos 1024 px) débordaient de la
       case et couvraient l'onglet. Une image ou un dessin posé dans la case en prend la taille, pas plus. */
    .bar-img-vide{ overflow:hidden; }
    .bar-img-vide > img, .bar-img-vide > svg{ width:100%; height:100%; max-width:100%; max-height:100%; object-fit:contain; display:block; }
    .bar-img-vide.bar-vivre{ border:none; }
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
    .bo-ligne:hover .bo-bulle, .bo-ligne.ouvert .bo-bulle{ display:block; }   /* v1.88b : .ouvert = au doigt (toucher) */
    .bo-bulle{ max-width:min(280px, 82vw); white-space:normal; }
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
    <button class="sous-lien${_barVue==="classements"?" actif":""}" data-barvue="classements">Classements</button>
    ${(barStation() && etat.habilitation) ? `<button class="sous-lien${_barVue==="reserves"?" actif":""}" data-barvue="reserves">Réserves</button>` : ""}
  </div>`;
}
function _barWireOnglets(el){
  el.querySelectorAll("[data-barvue]").forEach(b=>b.addEventListener("click",()=>{ _barVue=b.dataset.barvue; majBar(el); }));
}
async function majBar(el){
  if(!el) el=_barEl || document.querySelector("#centre-corps"); if(!el) return;
  _barEl = el;
  _barStyle();
  const station = barStation();
  const fid=station ? null : ((typeof villeActuelle==="function")?villeActuelle():null);
  if(!fid && !station){ el.innerHTML=`<h3 style="margin:2px 0">Le bar</h3><p class="vide">Il n'y a pas de bar ici.</p>`; return; }
  if(_barVue==="reserves" && !(station && etat.habilitation)) _barVue = "boissons";   // v1.93 : hors de la station, pas de réserves
  if(_barVue==="jeux"){ await majBarJeux(el, fid); return; }
  if(_barVue==="classements"){ await majBarClassements(el, fid); return; }   // v1.93z (K74)
  if(_barVue==="reserves"){ await majReserves(el); return; }
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

  /* v1.90b — K57 : à la station, les 3 communes + la CARTE DU JOUR (2 boissons de
     faction, les mêmes pour tous, qui changent chaque jour — bar_menu_station, v212). */
  let carte = [];
  if(station){ try{ const { data } = await sb.rpc("bar_menu_station"); carte = Array.isArray(data) ? data : []; }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"bar.js#carte"); } }
  const dispo=(_barCatalogue||[]).filter(b=>station ? (!b.faction || carte.includes(b.id)) : (!b.faction || b.faction===fid));
  if(!dispo.length){
    el.innerHTML=`<h3 style="margin:2px 0">${barNom(fid)}</h3><p class="vide">Aucune boisson au comptoir. Si cela persiste, le catalogue du serveur est vide.</p>`;
    return;
  }
  const reste=boissonResteMs();
  let h=`<h3 style="margin:2px 0">${barNom(fid)}</h3>`;
  h+=`<img class="bar-banniere" src="images/bar/bar.png" alt="" onerror="this.remove()">`;   // v1.48 : UN seul bar (prochaine carte), une seule image
  h+=_barOnglets();
  h+= station
    ? `<p class="vide">Dans un coin de la grande salle, un comptoir d'AREPO, propre comme au premier jour. Un automate le tient : il ne te regarde pas, mais il sert, parce qu'${etat.habilitation ? "tu es habilité sous le matricule d'Asulf" : "Asulf t'a inscrit parmi les ayants droit"}. Chaque verre est imputé à son matricule. Trois bouteilles ne bougent jamais ; deux autres changent chaque jour, et Asulf jure qu'il ne sait pas d'où elles arrivent. <b>Une seule boisson par 24 h</b>, et l'effet dure aussi longtemps. Ce qu'on te sert est tiré au sort : le plus souvent, ça se paie.</p>`
    : `<p class="vide">Le tenancier ne demande pas ton nom. <b>Une seule boisson par 24 h</b>, et l'effet dure aussi longtemps. Ce qu'on te sert est tiré au sort : le plus souvent, ça se paie.</p>`;

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
        <span class="bar-nom">${echapper(b.nom)}${station && b.faction ? ` <span class="itip-gris">· carte du jour</span>` : (exclu?` <span class="itip-gris">· maison</span>`:"")}</span>
        <span class="bar-desc">${echapper(b.texte||"")}</span>
      </span>
      <span class="bar-prix">${b.prix} ₡</span>
      <button class="mini" data-boire="${b.id}" ${(reste>0||trop)?"disabled":""} title="${reste>0?"Une seule boisson par 24 h":(trop?"Crédits insuffisants":`${_barQui()} sert sans commenter`)}">Boire</button>
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
    gains:"bas ou haut ×2 · sept ×4 · mise jusqu'à 500 ₡" },   // v1.93y (K73, SQL v219) : était ×2,2 / ×5,5
  { id:"cuve",       nom:"La cuve", dispo:true,
    desc:"Six jetons de quart dans un bocal opaque, un seul est marqué. Le pot double à chaque tirage, et tu peux t'arrêter quand tu veux.",
    gains:"jusqu'à ×5,4 · le jeton marqué prend tout" },
  { id:"bonneteau",  nom:"Le bonneteau", dispo:true,
    desc:"Trois gobelets, une bille, des mains trop rapides. Personne n'a jamais prouvé qu'il trichait.",
    gains:"×2 (si tu suis bien)" },
  { id:"puissance4", nom:"Quatre alignés", dispo:false,
    desc:"Contre la maison, sur une grille rayée par vingt ans de verres.",
    gains:"×2 · nul remboursé" }
];
function _barBlocTexte(code){
  return { ok:"", jeu_24h:"Déjà joué — reviens dans 24 h.",
           deux_par_jour:"Deux jeux par jour, pas plus." }[code] || code;
}
/* v1.90 — retour de l'autrice : après une partie, le bouton « S'asseoir » restait actif
   (la liste n'était lue qu'en ouvrant l'onglet) ; on rouvrait la table, et c'est au
   moment de miser que le serveur disait « déjà joué ». On relit l'état des tables après
   chaque partie et on met les boutons et les mentions à jour, sans toucher à la table. */
async function _barRafraichirTables(){
  const el = _barEl || document.querySelector("#bar-vue"); if(!el) return;
  try{ const { data } = await sb.rpc("bar_jeux_etat"); if(data && data.ok) _barJeux = data; }catch(e){ return; }
  const jx = (_barJeux && _barJeux.jeux) || {};
  el.querySelectorAll("[data-jeu]").forEach(b => {
    const j = BAR_JEUX.find(x => x.id === b.dataset.jeu); if(!j) return;
    const bloc = jx[j.id] || "ok", ko = !j.dispo || bloc !== "ok";
    b.disabled = ko;
    const g = b.closest(".bar-carte") && b.closest(".bar-carte").querySelector(".bar-txt .itip-gris");
    if(g) g.textContent = j.gains + ((j.dispo && bloc !== "ok") ? ` — ${_barBlocTexte(bloc)}` : "");
  });
  const p = el.querySelector(".bar-liste") && el.querySelector(".bar-liste").previousElementSibling;
  if(p && _barJeux && /Déjà joué aujourd'hui/.test(p.textContent)) p.innerHTML = p.innerHTML.replace(/Déjà joué aujourd'hui : \d+\/2/, `Déjà joué aujourd'hui : ${_barJeux.joues_aujourdhui}/2`);
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

/* ===========================================================
   v1.93z — CLASSEMENTS DES TABLES (K74, SQL v220) — sur le modèle de l'Arène (v1.84) :
   mois en cours (heure de Paris), top 10 + ta place, podium du mois précédent ;
   le 1ᵉʳ du mois, 500 / 300 / 150 ₡ par classement (nova-missions). Deux classements :
   le « plus beau coup » a été écarté (avec les plafonds de mise, trop d'égalités).
   Tous les bars comptent, la buvette de la station aussi. Le serveur classe tout
   (bar_classements) ; le client ne fait qu'afficher.
   =========================================================== */
const BAR_CLASSEMENTS = [
  { id:"gains",   titre:"Gains du mois",   aide:"Ce que les tables t'ont rapporté ce mois-ci, pertes déduites. Seuls les totaux positifs sont classés.", unite:" ₡" },
  { id:"gagnees", titre:"Parties gagnées", aide:"Les parties où tu es reparti avec plus que ta mise.", unite:"" }
];
async function majBarClassements(el, fid){
  const titre = `<h3 style="margin:2px 0">${barNom(fid)} — classements</h3>${_barOnglets()}`;
  el.innerHTML = titre + `<p class="vide">Chargement…</p>`;
  _barWireOnglets(el);
  let d = null;
  try{ ({ data:d } = await sb.rpc("bar_classements")); }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "bar.js#classements"); d = null; }
  if(_barVue !== "classements") return;   // on a changé d'onglet pendant la lecture
  if(!d || !d.ok){ el.innerHTML = titre + `<p class="vide">Les classements ne répondent pas.</p>`; _barWireOnglets(el); return; }
  const mois = new Date(String(d.mois).slice(0, 10) + "T12:00:00").toLocaleDateString("fr-FR", { month:"long", year:"numeric" });
  const med = r => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `${r}.`;
  const nb = (n, u) => `${Number(n || 0).toLocaleString("fr-FR")}${u}`;
  const tot = Number(d.total || 0);
  let h = titre + `<p class="itip-gris" style="margin:0 0 10px">Classements de <b>${mois}</b>, tous les bars de Silène et la buvette de la station. Le 1ᵉʳ du mois, le podium de chaque classement est payé — 500, 300 et 150 ₡ — puis tout repart de zéro. À égalité, le premier à atteindre son total passe devant.</p>`;
  h += `<p class="itip-gris" style="margin:0 0 12px">Ton bilan aux tables ce mois-ci : <b style="color:${tot > 0 ? "#8bd450" : (tot < 0 ? "#ff6b6b" : "inherit")}">${tot > 0 ? "+" : (tot < 0 ? "−" : "")}${nb(Math.abs(tot), " ₡")}</b>.</p>`;
  for(const C of BAR_CLASSEMENTS){
    const k = (d.classements || {})[C.id] || {};
    h += `<div class="ar-class"><h4 class="gsec">${C.titre}</h4><p class="itip-gris" style="margin:0 0 6px">${C.aide}</p>`;
    h += (k.top || []).length
      ? `<ol class="ar-top">${k.top.map(x => `<li class="${x.moi ? "moi" : ""}"><span class="ar-r">${med(x.rang)}</span><span class="ar-n">${echapper(x.nom)}</span><b>${nb(x.n, C.unite)}</b></li>`).join("")}</ol>`
      : `<p class="vide">Personne encore ce mois-ci.</p>`;
    if(k.moi && k.moi.rang > 10) h += `<p class="ar-moi">Toi : ${k.moi.rang}ᵉ, ${nb(k.moi.n, C.unite)}.</p>`;
    if((k.precedent || []).length) h += `<p class="itip-gris ar-prec">Le mois dernier : ${k.precedent.map(x => `${med(x.rang)} ${echapper(x.nom)} (${nb(x.n, C.unite)})`).join(" · ")}</p>`;
    h += `</div>`;
  }
  el.innerHTML = h;
  _barWireOnglets(el);
}

/* ---------- Les dés du fond ---------- */
const DES_PARIS = { bas:"en dessous de 7", haut:"au-dessus de 7", sept:"pile 7" };
const DES_FACES = ["⚀","⚁","⚂","⚃","⚄","⚅"];
/* v1.88d — un peu de mouvement : les faces défilent ~1 s, ralentissent, puis tombent. */
function _desRouler(z, d1, d2){
  return new Promise(fin => {
    const des = z.querySelectorAll(".des-de"); if(des.length < 2){ fin(); return; }
    des.forEach(x => x.classList.add("roule"));
    let k = 0, delai = 55;
    const pas = () => {
      if(!document.body.contains(z)){ fin(); return; }
      des[0].textContent = DES_FACES[Math.floor(Math.random()*6)];
      des[1].textContent = DES_FACES[Math.floor(Math.random()*6)];
      k++; delai *= 1.09;
      if(k < 16) setTimeout(pas, delai);
      else { des[0].textContent = DES_FACES[d1-1]; des[1].textContent = DES_FACES[d2-1]; des.forEach(x => x.classList.remove("roule")); fin(); }
    };
    pas();
  });
}
function _tableDes(z){
  if(!z) return;
  // v1.93y (K73) : les dés ont leur propre plafond (500 ₡), renvoyé par bar_jeux_etat (SQL v219).
  const max=(_barJeux&&(_barJeux.mise_max_des||Math.min(500,_barJeux.mise_max||200)))||200, min=(_barJeux&&_barJeux.mise_min)||50;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:10px">
      <b>Les dés du fond</b>
      <span class="bar-desc">${barStation() ? "L'automate pousse deux dés vers toi, sans un mot. Sur son flanc : TABLE DE DÉTENTE — PERSONNEL." : "Le tenancier pousse deux dés vers toi. « Au-dessus, en dessous, ou pile. À toi de voir. »"}</span>
      <div class="actions" style="flex-wrap:wrap;gap:8px;align-items:center">
        <label class="itip-gris">Mise <input id="des-mise" type="number" min="${min}" max="${max}" step="10" value="${min}" style="width:90px"></label>
        <select id="des-pari" class="gouv-textarea" style="padding:6px 8px;width:auto">
          <option value="bas">En dessous de 7 (2-6) — ×2</option>
          <option value="haut">Au-dessus de 7 (8-12) — ×2</option>
          <option value="sept">Pile 7 — ×4</option>
        </select>
        <button class="mini" id="des-lancer">Lancer</button>
      </div>
      <div class="des-piste" id="des-piste"><span class="des-de">⚀</span><span class="des-de">⚀</span></div>
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
    // v1.88d — les dés roulent un instant avant de tomber (le résultat est déjà tiré par le serveur).
    await _desRouler(z, d.d1, d.d2);
    res.innerHTML = `Dés : <b>${d.d1}</b> et <b>${d.d2}</b> — total <b>${d.total}</b>. `
      + (d.gagne ? `<span style="color:#8bd450">Gagné : +${d.net} ₡.</span>` : `<span style="color:#ff6b6b">Perdu : −${d.mise} ₡.</span>`);
    // v1.88d — retour de l'autrice : la ligne dit le pari, les dés, et l'issue.
    _barRafraichirTables();   // v1.90
    journal(`Dés du fond : pari « ${DES_PARIS[d.pari]||d.pari} » ; les dés tombent sur ${d.d1} et ${d.d2} (${d.total}). ${d.gagne?`Gagné : +${d.net} ₡.`:`Perdu : −${d.mise} ₡.`}`, d.gagne?"gain":"alerte", "eco");
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
    else                        journal(`${_barQui()} refuse de servir (${e||"erreur"}).`,"alerte");
    if(bouton) bouton.disabled=false;
    return;
  }
  // Le serveur a débité : on aligne le solde local sans écraser l'écart en attente.
  if(typeof appliquerSoldeServeur==="function" && typeof res.solde==="number") appliquerSoldeServeur(res.solde);
  etat.boisson = { id:res.id, nom:res.nom, tirage:res.tirage, mods:res.mods, fin:res.fin, active:true };

  const txt=barEffetsTexte(res.mods);
  const ton = res.tirage==="bon" ? "gain" : (res.tirage==="mauvais" ? "alerte" : "");
  const intro = res.tirage==="bon" ? "Bonne pioche" : (res.tirage==="mauvais" ? "Mauvaise pioche" : "Les deux à la fois");
  /* v1.88c — retour de l'autrice : trois lignes pour un seul verre (la boisson, la
     réplique d'Asulf, puis l'événement du serveur). UNE ligne, dans « Économie » ;
     le serveur n'écrit plus d'événement (v206). */
  const asulf = barStation() ? ` Imputé au matricule 42-U1F. ${_barAsulfLigne()}` : "";   // v1.93 : K61
  journal(`${res.nom} (−${res.prix} ₡). ${intro} : ${txt||"aucun effet notable"}. 24 h.${asulf}`, ton, "eco");

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
    const rang=z.querySelector(".cuve-rang"); if(rang){ rang.classList.add("secoue"); await new Promise(r=>setTimeout(r,550)); }   // v1.88d
    let d,error; try{ ({data:d,error}=await sb.rpc("cuve_tirer")); }catch(e){ if(typeof _catchLog==="function") _catchLog(e,"bar.js#cuve"); }
    if(error||!d||!d.ok){ journal("Tirage impossible.","alerte"); _tableCuve(z); return; }
    if(d.marque){
      if(typeof rechargerCredits==="function") rechargerCredits();
      _barRafraichirTables();   // v1.90
      journal(`La cuve (mise ${st.mise} ₡) : le jeton marqué sort au ${d.tours}ᵉ tirage. Perdu : −${d.perdu} ₡, et 10 % d'énergie avec.`,"alerte","eco");
      z.innerHTML=`<div class="bar-carte" style="flex-direction:column;gap:8px">
        <b>La cuve</b><span style="color:#ff6b6b">Jeton marqué au ${d.tours}ᵉ tirage. ${_barQui()} ramasse tout : −${d.perdu} ₡, et tu sens la soirée dans tes jambes (−10 % d'énergie).</span></div>`;
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
    _barRafraichirTables();   // v1.90
    journal(`La cuve (mise ${st.mise} ₡) : tu ramasses après ${d.tours} tirage${d.tours>1?"s":""} et empoches ${d.gain} ₡. ${d.net>=0?`Gagné : +${d.net} ₡.`:`Perdu : ${d.net} ₡.`}`, d.net>=0?"gain":"alerte","eco");
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
    _barRafraichirTables();   // v1.90 : la partie compte dès la mise
    if(typeof appliquerSoldeServeur==="function" && typeof d.solde==="number") appliquerSoldeServeur(d.solde);
    if(typeof afficher==="function") afficher();
    _cuveCadre(z, { mise:d.mise, tours:0, restants:6, gain_si_arret:0, prochain_gain:d.prochain_gain, risque_suivant:17 });
  });
}

/* ---------- Le bonneteau ---------- */
/* v1.88d — demande de l'autrice : « faire vraiment un jeu de bonneteau ». Le serveur
   (bonneteau_ouvrir, v207) tire la place de la bille et 11 à 13 échanges ; le client
   les MONTRE, de plus en plus vite ; on désigne un gobelet (bonneteau_choisir), le
   serveur rejoue les échanges et paie ×2. Une partie reprise après un rechargement se
   joue de mémoire (les échanges ne sont pas renvoyés). */
const BON_NOMS = { 1:"de gauche", 2:"du milieu", 3:"de droite" };
const BON_X = { 1:18, 2:50, 3:82 };   // centre de chaque place, en % de la table
const _bonDort = ms => new Promise(r => setTimeout(r, ms));
function _bonErreur(d){
  const er=d&&d.err;
  return er==="mise" ? `Mise entre ${d.min} et ${d.max} ₡.` : er==="fonds" ? "Crédits insuffisants."
       : er==="jeu_24h" ? "Tu as déjà joué au bonneteau aujourd'hui." : er==="deux_par_jour" ? "Deux jeux par jour, pas plus."
       : er==="partie_en_cours" ? "Une partie est déjà ouverte." : er==="prison" ? "Tu es en prison."
       : `Refusé (${er||"erreur"}).`;
}
async function _tableBonneteau(z){
  if(!z) return;
  let e; try{ ({data:e}=await sb.rpc("bonneteau_etat")); }catch(err){ if(typeof _catchLog==="function") _catchLog(err,"bar.js#bon0"); }
  if(e && e.ok && e.partie){ _bonPlateau(z, { mise:e.mise, reprise:true }); return; }
  const max=(_barJeux&&_barJeux.mise_max)||200, min=(_barJeux&&_barJeux.mise_min)||50;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:10px">
      <b>Le bonneteau</b>
      <span class="bar-desc">${barStation() ? "L'automate pose trois gobelets de service et une bille de roulement. Ses pinces vont très vite." : "Trois gobelets, une bille, des mains trop rapides. « Suis bien. »"}</span>
      <span class="itip-gris">On te montre la bille sous un gobelet. Puis les gobelets s'échangent une douzaine de fois, de plus en plus vite. Suis-la des yeux et désigne son gobelet. Gain ×2. Une fois lancée, la partie ne s'annule pas.</span>
      <div class="actions" style="gap:8px;align-items:center">
        <label class="itip-gris">Mise <input id="bon-mise" type="number" min="${min}" max="${max}" step="10" value="${min}" style="width:90px"></label>
        <button class="mini" id="bon-go">Miser et regarder</button>
      </div>
      <div id="bon-res" class="itip-gris"></div>
    </div>`;
  z.querySelector("#bon-go").addEventListener("click", async()=>{
    const b=z.querySelector("#bon-go"); if(b.disabled) return; b.disabled=true;
    const mise=parseInt(z.querySelector("#bon-mise").value,10)||0;
    let d,error; try{ ({data:d,error}=await sb.rpc("bonneteau_ouvrir",{p_mise:mise})); }catch(err){ if(typeof _catchLog==="function") _catchLog(err,"bar.js#bon1"); }
    if(error||!d||!d.ok){ const msg=_bonErreur(d); z.querySelector("#bon-res").textContent=msg; journal(msg,"alerte"); b.disabled=false; return; }
    if(typeof appliquerSoldeServeur==="function" && typeof d.solde==="number") appliquerSoldeServeur(d.solde);
    if(typeof afficher==="function") afficher();
    _barRafraichirTables();   // v1.90 : la partie compte dès la mise
    _bonPlateau(z, d);
  });
}
async function _bonPlateau(z, d){
  const reprise = !!d.reprise;
  z.innerHTML=`<div class="bar-carte" style="flex-direction:column;align-items:stretch;gap:8px">
      <b>Le bonneteau</b>
      <div class="itip-gris">Mise : <b>${d.mise} ₡</b> · gain ×2</div>
      <div class="bon-table" id="bon-table">${[1,2,3].map(p=>`<div class="bon-gob" data-gob="${p}" style="left:calc(${BON_X[p]}% - 32px)"><span class="bon-bille"></span><span class="bon-cloche"></span></div>`).join("")}</div>
      <div id="bon-res" class="itip-gris" style="text-align:center">${reprise?"Tu as quitté la table des yeux. Les gobelets ne bougent plus : choisis de mémoire.":"Regarde bien…"}</div>
    </div>`;
  const table=z.querySelector("#bon-table"), res=z.querySelector("#bon-res");
  const gobs={}; table.querySelectorAll(".bon-gob").forEach(g=>{ gobs[g.dataset.gob]=g; });
  const place={1:gobs[1],2:gobs[2],3:gobs[3]};        // quelle cloche est à quelle place
  const enJeu=()=>document.body.contains(table);
  if(!reprise){
    gobs[d.depart].classList.add("a-bille");
    await _bonDort(350); if(!enJeu()) return;
    /* v1.90 — retour de l'autrice : « beaucoup trop facile ». Bille montrée moins
       longtemps (900 ms), échanges plus rapides (380 → 150 ms, 14 à 17 côté serveur),
       sans pause entre deux, et des FEINTES : deux gobelets s'élancent l'un vers
       l'autre puis reviennent — elles ne changent rien à la place de la bille. */
    gobs[d.depart].classList.add("leve"); await _bonDort(900); if(!enJeu()) return;
    gobs[d.depart].classList.remove("leve"); await _bonDort(380);
    const n=d.melanges.length;
    const feinte = async (dur) => {
      const a = 1 + Math.floor(Math.random()*3), b = 1 + ((a + Math.floor(Math.random()*2)) % 3), ga=place[a], gb=place[b];
      const mi = (BON_X[a] + BON_X[b]) / 2, va = (mi + BON_X[a]) / 2, vb = (mi + BON_X[b]) / 2;
      [ga,gb].forEach(g=>{ g.style.transition=`left ${dur}ms ease-in-out, transform ${dur}ms ease-in-out`; });
      ga.classList.add("devant"); gb.classList.add("derriere");
      ga.style.left=`calc(${va}% - 32px)`; gb.style.left=`calc(${vb}% - 32px)`;
      await _bonDort(dur);
      ga.style.left=`calc(${BON_X[a]}% - 32px)`; gb.style.left=`calc(${BON_X[b]}% - 32px)`;
      await _bonDort(dur);
      ga.classList.remove("devant"); gb.classList.remove("derriere");
    };
    for(let i=0;i<n;i++){
      if(!enJeu()) return;
      const dur=Math.round(380 - (380-150)*(i/(Math.max(1,n-1))));   // de plus en plus vite
      if(i > 1 && Math.random() < 0.3){ await feinte(Math.round(dur*0.7)); if(!enJeu()) return; }
      const [a,b]=d.melanges[i], ga=place[a], gb=place[b];
      [ga,gb].forEach(g=>{ g.style.transition=`left ${dur}ms ease-in-out, transform ${dur}ms ease-in-out`; });
      ga.classList.add("devant"); gb.classList.add("derriere");
      ga.style.left=`calc(${BON_X[b]}% - 32px)`; gb.style.left=`calc(${BON_X[a]}% - 32px)`;
      place[a]=gb; place[b]=ga;
      await _bonDort(dur);
      ga.classList.remove("devant"); gb.classList.remove("derriere");
    }
    res.textContent="Où est la bille ?";
  }
  table.classList.add("choix");
  Object.entries(place).forEach(([pos,g])=>g.addEventListener("click", async()=>{
    if(table.classList.contains("fini")) return; table.classList.add("fini"); table.classList.remove("choix");
    const choix=+pos;
    let r,error; try{ ({data:r,error}=await sb.rpc("bonneteau_choisir",{p_gobelet:choix})); }catch(err){ if(typeof _catchLog==="function") _catchLog(err,"bar.js#bon2"); }
    if(error||!r||!r.ok){ res.textContent="La main du croupier s'est figée. Réessaie."; table.classList.remove("fini"); table.classList.add("choix"); return; }
    if(typeof appliquerSoldeServeur==="function" && typeof r.solde==="number") appliquerSoldeServeur(r.solde);
    // La bille va sous le bon gobelet (ce que le serveur a rejoué), puis on soulève tout.
    Object.values(gobs).forEach(x=>x.classList.remove("a-bille")); place[r.bon].classList.add("a-bille");
    g.classList.add("designe");
    Object.values(place).forEach(x=>x.classList.add("leve"));
    res.innerHTML = r.gagne ? `<span style="color:#8bd450">La bille est là. Gagné : +${r.net} ₡.</span>`
                            : `<span style="color:#ff6b6b">Raté : elle était sous le gobelet ${BON_NOMS[r.bon]}. Perdu : −${r.mise} ₡.</span>`;
    _barRafraichirTables();   // v1.90
    journal(r.gagne ? `Bonneteau (mise ${r.mise} ₡) : tu désignes le gobelet ${BON_NOMS[choix]}, et la bille y est. Gagné : +${r.net} ₡.`
                    : `Bonneteau (mise ${r.mise} ₡) : tu désignes le gobelet ${BON_NOMS[choix]} ; la bille était sous celui ${BON_NOMS[r.bon]}. Perdu : −${r.mise} ₡.`,
            r.gagne?"gain":"alerte","eco");
    if(typeof afficher==="function") afficher();
  }));
}


/* ===========================================================
   v1.93 — K62 : LES RÉSERVES DE LA STATION (onglet du bar, à la station, habilité).
   Le SERVEUR décide de tout (reserves_lire / reserves_acheter, v214) : habilitation,
   présence à la station, stock du jour (3 de chaque, par joueur), prix, place au sac.
   Le client ne fait qu'afficher et griser. Manger : reserves_manger (énergie, santé,
   moral), appelé depuis utiliser() (actions.js).
   =========================================================== */
const RESERVES_ERREURS = {
  non_habilite:"Les automates ne te reconnaissent pas : il faut l'habilitation de la station.",
  pas_sur_place:"Les réserves sont à la station d'Ancolie. Il faut y être.",
  stock:"Plus rien de ça aujourd'hui : trois par jour, c'est le règlement. Reviens demain.",
  credits:"Crédits insuffisants.", item:"Les réserves n'ont pas ça.",
  sac_plein:"Sac plein : fais de la place d'abord.", manque:"Tu n'en as plus.", prison:"Impossible depuis la prison."
};
async function majReserves(el){
  if(!el) el = _barEl; if(!el) return;
  let h = `<h3 style="margin:2px 0">Les réserves de la station</h3>` + _barOnglets();
  el.innerHTML = h + `<p class="vide">Chargement…</p>`; _barWireOnglets(el);
  let st = null;
  try{ if(typeof sauverMaintenant === "function") await sauverMaintenant(); const { data } = await sb.rpc("reserves_lire"); st = data; }
  catch(e){ if(typeof _catchLog === "function") _catchLog(e, "bar.js#reserves"); }
  if(!st || !st.ok){
    el.innerHTML = h + `<p class="vide">${(st && RESERVES_ERREURS[st.err]) || "Les réserves ne répondent pas. Réessaie dans un instant."}</p>`; _barWireOnglets(el); return;
  }
  h += `<p class="vide">Derrière une porte de service, des étagères d'AREPO rangées au carré : les vivres du personnel, sous vide depuis trois siècles. Un automate te tend ce que tu demandes et note, sans te regarder : HABILITATION 42-U1F/1. <b>Trois de chaque par jour</b>, pas un de plus : c'est le règlement. Ça rend de l'énergie, et ça coûte du moral.</p><div class="bar-liste">`;
  for(const id of Object.keys(VIVRES_STATION)){
    const v = VIVRES_STATION[id], it = item(id), reste = (st.stock && typeof st.stock[id] === "number") ? st.stock[id] : v.stock;
    const eff = (typeof effetConso === "function") ? effetConso(id) : null;
    const effTxt = eff ? Object.entries(eff).map(([g, n]) => `${n > 0 ? "+" : "−"}${Math.abs(n)} ${labelJauge(g)}`).join(", ") : "";
    const trop = (etat.credits || 0) < v.prix;
    h += `<div class="bar-carte">
      <span class="bar-img-vide${iconeItem(id) ? " bar-vivre" : ""}">${iconeItem(id) || "▨"}</span>
      <span class="bar-txt"><span class="bar-nom">${echapper(it ? it.nom : id)} <span class="itip-gris">· reste ${reste}/${v.stock} aujourd'hui</span></span>
        <span class="bar-desc">${effTxt}</span></span>
      <span class="bar-prix">${v.prix.toLocaleString("fr-FR")} ₡</span>
      <button class="mini" data-reserve="${id}" ${(reste <= 0 || trop) ? "disabled" : ""} title="${reste <= 0 ? "Plus de stock aujourd'hui" : (trop ? "Crédits insuffisants" : "L'automate sert sans commenter")}">Prendre</button>
    </div>`;
  }
  h += `</div>`;
  el.innerHTML = h; _barWireOnglets(el);
  el.querySelectorAll("[data-reserve]").forEach(b => b.addEventListener("click", () => acheterReserve(b.dataset.reserve, b)));
}
async function acheterReserve(id, bouton){
  if(bouton) bouton.disabled = true;
  let data = null;
  try{ if(typeof sauverMaintenant === "function") await sauverMaintenant(); ({ data } = await sb.rpc("reserves_acheter", { p_item:id })); }
  catch(e){ if(typeof _catchLog === "function") _catchLog(e, "bar.js#reserves-achat"); }
  if(!data || !data.ok){ journal((data && RESERVES_ERREURS[data.err]) || "Les réserves ne répondent pas. Réessaie dans un instant.", "alerte"); majReserves(); return; }
  if(typeof data.credits === "number") etat.credits = data.credits;
  if(data.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
  const it = item(id);
  journal(`L'automate te tend : ${it ? it.nom : id} (−${VIVRES_STATION[id].prix.toLocaleString("fr-FR")} ₡). Imputé à l'habilitation 42-U1F/1.`, "eco");
  if(typeof sauvegarder === "function") sauvegarder();
  if(typeof afficher === "function") afficher();
  majReserves();
}
async function mangerVivre(id){
  if(!(etat.sac && etat.sac[id] > 0)) return;
  let data = null;
  try{ ({ data } = await sb.rpc("reserves_manger", { p_item:id })); }
  catch(e){ if(typeof _catchLog === "function") _catchLog(e, "bar.js#reserves-manger"); }
  if(!data || !data.ok){ journal((data && RESERVES_ERREURS[data.err]) || "Le serveur n'a pas répondu — réessaie.", "alerte"); return; }
  const avant = { energie:Math.round(etat.energie || 0), sante:Math.round((etat.jauges && etat.jauges.sante) || 0), moral:Math.round((etat.jauges && etat.jauges.moral) || 0) };
  if(data.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
  if(typeof data.energie === "number"){ etat.energie = data.energie; etat.energieMaj = Date.now(); }
  if(data.jauges){ etat.jauges = etat.jauges || {}; ["o2","sante","moral"].forEach(g => { if(typeof data.jauges[g] === "number") etat.jauges[g] = data.jauges[g]; }); }
  const apres = { energie:Math.round(etat.energie || 0), sante:Math.round(etat.jauges.sante || 0), moral:Math.round(etat.jauges.moral || 0) };
  const parts = Object.keys(apres).filter(g => apres[g] !== avant[g]).map(g => `${apres[g] > avant[g] ? "+" : "−"}${Math.abs(apres[g] - avant[g])} ${labelJauge(g)}`);
  const it = item(id);
  journal(`${it ? it.nom : id} : ${parts.length ? parts.join(", ") : "rien n'a bougé"}. ${id === "barre_proteinee" ? "Elle a le goût de l'emballage." : "Froide, comme promis."}`, "gain");
  if(typeof apresAction === "function") apresAction(); else { if(typeof afficher === "function") afficher(); if(typeof sauvegarder === "function") sauvegarder(); }
}
