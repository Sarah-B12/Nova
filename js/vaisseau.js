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
/* ===========================================================
   NAVETTE DE RÉSERVE — cadeau de fin de Q5 (v0.91)
   Celle du quai, vieille de trois cents ans. Elle permet de monter TOUT DE
   SUITE, sans attendre qu'un Constructeur en mette une au marché — mais elle
   tombe en poussière au bout de dix jours, ce qui laisse le métier vivant.
   ⚠ Ni fabricable (pas de préfixe `fab_`, aucune recette) ni vendable
   (aucune entrée dans PRIX_ITEM : le marché ne propose que ce qui a un prix).
   ⚠ Coque plus faible que la Navette légère : ce n'est pas un vaisseau neuf.
   =========================================================== */
const NAVETTE_CADEAU = "navette_reserve";
const NAVETTE_CADEAU_JOURS = 10;
VAISSEAUX[NAVETTE_CADEAU] = { nom:"Navette de réserve", soute:5, img:"images/vaisseaux/navette_legere.png",
                              carb:"fab_biocarburant", reservoir:40, conso:1, energie:1, pv:90, cadeau:true };
if(typeof TOUS_ITEMS !== "undefined" && !TOUS_ITEMS.some(i => i.id === NAVETTE_CADEAU)){
  TOUS_ITEMS.push({ id:NAVETTE_CADEAU, nom:"Navette de réserve", type:"fabrique", cat:"fabrique" });
  if(typeof IMG_ITEM !== "undefined") IMG_ITEM[NAVETTE_CADEAU] = "images/items/navette_legere.png";
}
/* Échéance ABSOLUE, posée à la fin de Q5 et jamais remise à zéro.
   ⚠ Sans elle, déséquiper puis rééquiper relancerait dix jours à chaque fois
   (`vaisseauDate` repart à maintenant, et le retour au sac crée un lot neuf) :
   le cadeau deviendrait un vaisseau gratuit et éternel. */
function navetteCadeauPosee(){
  if(!etat.navetteFin) etat.navetteFin = Date.now() + NAVETTE_CADEAU_JOURS*86400000;
  return etat.navetteFin;
}
function navetteCadeauJours(){
  if(!etat.navetteFin) return null;
  return Math.max(0, Math.ceil((etat.navetteFin - Date.now())/86400000));
}

// Litres apportés par une unité de carburant, lors d'un plein.
const CARBURANT_LITRES = { fab_biocarburant:20, fab_biocarburant_raffine:60 };
function estVaisseau(id){ return !!VAISSEAUX[id]; }

/* ===========================================================
   ÂGE RÉEL D'UN VAISSEAU (v0.91 — correction)
   ⚠ Contrairement à l'équipement (corrigé en v0.64), équiper un vaisseau ne le
   DÉPLACE pas vers un lieu serveur : il est RETIRÉ de l'inventaire, et recréé
   neuf au déséquipement. Il n'existe donc aucun lot dont lire la date, et le
   compteur d'usure repartait à zéro — deux fois :
     · déséquiper / rééquiper rendait n'importe quel vaisseau éternel ;
     · un vaisseau acheté vieux de 25 jours au marché repartait à 30 une fois porté.
   On garde donc l'âge nous-mêmes, dans `etat.vaisseauAge`, indexé par modèle.
   ⚠ Limite assumée : deux exemplaires du MÊME modèle d'âges différents sont
   confondus — on retient le plus ancien. Le cas est rare et joue contre le
   joueur, ce qui est le bon sens de l'erreur. L'entrée est effacée dès qu'il ne
   reste plus aucun exemplaire du modèle (vente, péremption) : un rachat repart
   donc bien à neuf. */
function ageVaisseau(id){
  if(!estVaisseau(id)) return null;
  const garde = etat.vaisseauAge && etat.vaisseauAge[id];
  let plusVieux = (typeof garde === "number") ? garde : null;
  // Lots serveur (sac, coffre, soute) : on prend la date la plus ancienne.
  (etat.lots||[]).forEach(l => {
    if(l && l.item===id && l.qte>0 && typeof l.acquis==="number"){
      if(plusVieux==null || l.acquis < plusVieux) plusVieux = l.acquis;
    }
  });
  return plusVieux;
}
function _noterAgeVaisseau(id, ts){
  if(!estVaisseau(id) || typeof ts !== "number") return;
  etat.vaisseauAge = etat.vaisseauAge || {};
  const a = etat.vaisseauAge[id];
  etat.vaisseauAge[id] = (typeof a==="number") ? Math.min(a, ts) : ts;
}
/* Un modèle dont il ne reste aucun exemplaire (vendu, périmé, posté) perd sa
   garde d'âge : sinon un rachat hériterait de l'âge de l'ancien. */
function purgerAgesVaisseaux(){
  if(!etat.vaisseauAge) return;
  for(const id in etat.vaisseauAge){
    if(etat.vaisseau === id) continue;
    const reste = (etat.lots||[]).some(l => l && l.item===id && l.qte>0);
    if(!reste) delete etat.vaisseauAge[id];
  }
}
function vaisseauActif(){ return etat.vaisseau ? VAISSEAUX[etat.vaisseau] : null; }
function capaciteSoute(){ const v=vaisseauActif(); return v ? v.soute : 0; }
function itemsSoute(){ return Object.values(etat.soute||{}).reduce((a,b)=>a+b,0); }

/* ---------- Équiper / déséquiper ---------- */
async function equiperVaisseau(id){
  if(!estVaisseau(id) || (etat.sac[id]||0)<=0) return;
  if(!etat.permisVaisseau){ journal("Il te faut un permis de vaisseau pour piloter (quête à venir).","alerte"); return; }
  if(id===etat.vaisseau) return;
  if(etat.vaisseau){                                   // remplacer : il faut d'abord ranger l'actuel (soute vide)
    if(itemsSoute()>0){ journal("Vide la soute de ton vaisseau actuel avant d'en équiper un autre.","alerte"); return; }
    if(placesLibres()<=0){ journal("Sac plein — impossible de ranger le vaisseau actuel.","alerte"); return; }
    const ancien=etat.vaisseau;
    const rA = await agirServeur({ ajouter:{ [ancien]:1 }, motif:"vaisseau_ranger" });
    if(!rA || !(rA.ajoutes||{})[ancien]){ journal("Sac plein — impossible de ranger le vaisseau actuel.","alerte"); return; }
  }
  // Le vaisseau quitte le sac et devient équipé : un seul appel, tout ou rien.
  if(!await agirServeur({ retirer:{ [id]:1 }, motif:"vaisseau_equiper" })) return;
  etat.vaisseau=id;
  /* ⚠ L'âge SUIT le vaisseau : on reprend la date du lot d'où il sort, pas
     l'instant présent. La Navette de réserve, elle, est antidatée pour retomber
     sur son échéance absolue. */
  etat.vaisseauDate = (id===NAVETTE_CADEAU && etat.navetteFin)
    ? (etat.navetteFin - dureeVie(id)*86400000)
    : (ageVaisseau(id) || Date.now());
  _noterAgeVaisseau(id, etat.vaisseauDate);
  etat.carburant = Math.min(etat.carburant||0, VAISSEAUX[id].reservoir);   // le réservoir peut être plus petit
  journal(`${VAISSEAUX[id].nom} équipé. Soute : ${VAISSEAUX[id].soute} places.`,"gain");
  apresAction(); majVaisseau();
}
async function desequiperVaisseau(){
  if(!etat.vaisseau) return;
  if(itemsSoute()>0){ journal("Impossible : vide d'abord la soute.","alerte"); return; }
  const id=etat.vaisseau;
  const r = await agirServeur({ ajouter:{ [id]:1 }, motif:"vaisseau_desequiper" });
  if(!r || !(r.ajoutes||{})[id]){ journal("Sac plein.","alerte"); return; }
  // ⚠ Le lot qui revient au sac porte la date du jour : la garde d'âge est la
  //   seule mémoire de l'usure réelle. On l'écrit AVANT d'oublier vaisseauDate.
  _noterAgeVaisseau(id, etat.vaisseauDate || Date.now());
  etat.vaisseau=null; etat.vaisseauDate=null;
  journal(`${VAISSEAUX[id].nom} rangé dans le sac.`);
  apresAction(); majVaisseau();
}

/* ---------- Soute (charger / décharger) ---------- */
async function deposerSoute(id){
  if(!etat.vaisseau){ journal("Équipe un vaisseau d'abord.","alerte"); return; }
  if(estVaisseau(id)){ journal("On ne range pas un vaisseau dans une soute.","alerte"); return; }
  if(!etat.sac[id]) return;
  // Mouvement serveur : le lot conserve sa date d'acquisition.
  if(!await rangerServeur(id, 1, "soute", "sac")) return;
  apresAction(); majVaisseau();
}
async function retirerSoute(id){
  if(!etat.soute||!etat.soute[id]) return;
  if(!await rangerServeur(id, 1, "sac", "soute")) return;
  apresAction(); majVaisseau();
}

/* ---------- Ravitaillement ---------- */
/* ===========================================================
   PV DE COQUE — v0.91
   ⚠ LES PV NE SONT PAS UNE VIE, C'EST UN ÉTAT DE NAVIGABILITÉ.
   La DURÉE DE VIE détruit déjà les vaisseaux. Si les PV les détruisaient
   aussi, on aurait deux mécaniques jumelles, une double peine, et le joueur ne
   saurait jamais laquelle l'a tué. Donc : à 0 PV le vaisseau est CLOUÉ, jamais
   détruit. La durée de vie reste la seule chose qui tue une coque.

   ⚠ Stockés par MODÈLE, comme `vaisseauAge`, et pour la même raison : équiper
   un vaisseau le RETIRE de l'inventaire et le déséquiper en recrée un neuf, il
   n'existe donc aucun lot serveur où accrocher son état.
   =========================================================== */
const PV_SEUIL_AVARIE    = 0.30;   // sous ce ratio : avarie
const PV_MALUS_CARBURANT = 1.5;    // conso majorée en avarie
const PV_REMORQUAGE      = 0.25;   // navigabilité rendue par le remorquage

function pvMax(id){ const v = VAISSEAUX[id || etat.vaisseau]; return v ? (v.pv || 100) : 0; }
function pvVaisseau(id){
  id = id || etat.vaisseau; if(!id) return 0;
  const v = (etat.vaisseauPv || {})[id];
  return (typeof v === "number") ? Math.max(0, Math.min(pvMax(id), v)) : pvMax(id);
}
function pvRatio(id){ const mx = pvMax(id); return mx ? pvVaisseau(id)/mx : 1; }
function vaisseauCloue(){ return !!etat.vaisseau && pvVaisseau() <= 0; }
function vaisseauAvarie(){ return !!etat.vaisseau && pvRatio() < PV_SEUIL_AVARIE; }
/* Majoration de carburant en avarie : la falaise doit se voir venir. */
function malusCarburant(){ return vaisseauAvarie() ? PV_MALUS_CARBURANT : 1; }

function _poserPv(id, n){
  if(!id) return;
  etat.vaisseauPv = etat.vaisseauPv || {};
  etat.vaisseauPv[id] = Math.max(0, Math.min(pvMax(id), Math.round(n)));
}
/* Abîme la coque équipée. Prévient au franchissement des deux seuils, et
   seulement là : un message à chaque éraflure deviendrait du bruit. */
function abimerVaisseau(n, raison){
  const id = etat.vaisseau; if(!id || !(n > 0)) return;
  const avant = pvVaisseau(id), ratioAvant = avant / pvMax(id);
  _poserPv(id, avant - n);
  const apres = pvVaisseau(id);
  const nom = VAISSEAUX[id].nom;
  if(apres <= 0){
    journal(`${nom} est CLOUÉ : coque hors service${raison?` (${raison})`:""}. Il faut la réparer avant de repartir.`,"alerte");
  } else if(ratioAvant >= PV_SEUIL_AVARIE && apres/pvMax(id) < PV_SEUIL_AVARIE){
    journal(`⚠ ${nom} est en avarie — coque à ${Math.round(100*apres/pvMax(id))} %. La consommation de carburant augmente de moitié tant que ce n'est pas réparé.`,"alerte");
  }
  if(typeof majVaisseau==="function") majVaisseau();
  if(typeof sauvegarder==="function") sauvegarder();
}
function reparerPv(n){
  const id = etat.vaisseau; if(!id) return 0;
  const avant = pvVaisseau(id);
  _poserPv(id, avant + n);
  return pvVaisseau(id) - avant;
}

/* PV rendus par un Kit de réparation. ⚠ Forfait et non pourcentage : trois kits
   pour une Navette (120 PV), neuf pour un Maître (340). Les gros vaisseaux
   coûtent plus cher à entretenir, ce qui est juste puisqu'ils rapportent plus. */
const KIT_PV = 40;
async function utiliserKitReparation(){
  if(!etat.vaisseau){ journal("Aucun vaisseau équipé à réparer.","alerte"); return; }
  if((etat.sac["kit_reparation"]||0) <= 0){ journal("Tu n'as pas de Kit de réparation dans ton sac.","alerte"); return; }
  if(pvVaisseau() >= pvMax()){ journal("La coque est déjà intacte.","alerte"); return; }
  if(!await agirServeur({ retirer:{ kit_reparation:1 }, motif:"reparer_coque" })) return;
  const gagne = reparerPv(KIT_PV);
  journal(`Coque rafistolée : +${gagne} PV (${pvVaisseau()}/${pvMax()}).`,"gain");
  apresAction(); majVaisseau();
  if(typeof sauvegarder==="function") sauvegarder();
}

/* Litres réellement disponibles : le réservoir PLUS tout ce qu'on transporte.
   ⚠ v0.91 — sert à décider si un vol est possible. Ignorer les unités en soute
   ferait refuser le départ à un joueur qui a dix unités dans sa cale, ce qu'il
   ne comprendrait pas ; et l'obligerait à un plein qui gaspille (remplir un
   réservoir à 38/40 avec une unité de 20 L en perd 18).
   ⚠ Légère SURESTIMATION assumée : une unité versée dans un réservoir presque
   plein perd le surplus. On préfère se tromper dans le sens permissif — un
   refus injustifié est bien plus agaçant qu'un départ risqué, qui a de toute
   façon le secours pour filet. */
function autonomieCarburant(){
  const v = vaisseauActif(); if(!v) return 0;
  const parUnite = CARBURANT_LITRES[v.carb] || 0;
  const unites = ((etat.sac && etat.sac[v.carb]) || 0) + ((etat.soute && etat.soute[v.carb]) || 0);
  return (etat.carburant || 0) + unites * parUnite;
}

async function ravitailler(){
  const v=vaisseauActif(); if(!v) return;
  if((etat.carburant||0) >= v.reservoir){ journal("Réservoir plein.","alerte"); return false; }
  /* v0.91 — la soute compte aussi. Du carburant rangé dans sa propre cale était
     inutilisable sans le remonter au sac à la main : un piège, pas une règle. */
  if((etat.sac[v.carb]||0) <= 0){
    if((etat.soute && etat.soute[v.carb]||0) > 0){
      // rangerServeur journalise déjà son propre refus : on ne double pas le message.
      if(typeof rangerServeur!=="function" || !await rangerServeur(v.carb, 1, "sac", "soute")) return false;
    } else { journal(`Il te faut du ${item(v.carb).nom} dans ton sac ou ta soute.`,"alerte"); return false; }
  }
  const litres = CARBURANT_LITRES[v.carb]||0;
  if(!await agirServeur({ retirer:{ [v.carb]:1 }, motif:"ravitailler" })) return false;
  etat.carburant = Math.min(v.reservoir, (etat.carburant||0) + litres);
  journal(`Plein : +${litres} L de ${item(v.carb).nom}. Réservoir ${Math.round(etat.carburant)}/${v.reservoir} L.`,"gain");
  apresAction(); majVaisseau();
  return true;   // v0.91 : volVers() enchaîne les pleins tant qu'il en faut
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
          <div><span>PV (coque)</span><b style="color:${pvRatio()<=0?"#ff5257":(vaisseauAvarie()?"#ff8a3d":"inherit")}">${pvVaisseau()}/${pvMax()} PV${vaisseauCloue()?" — CLOUÉ":(vaisseauAvarie()?" — avarie":"")}</b></div>
          <div><span>Conso carburant</span><b>${v.conso} L/u${malusCarburant()>1?` <span style="color:var(--coral,#ff5257)">×${PV_MALUS_CARBURANT}</span>`:""}</b></div>
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
  // Une tuile par LOT, comme dans le sac et le coffre.
  const stacks = (typeof lotsAffichage==="function") ? lotsAffichage("soute") : [];
  const cible=Math.max(6, Math.ceil((stacks.length+1)/6)*6);
  for(let i=0;i<cible;i++){ const t=document.createElement("div");
    if(i<stacks.length){ const lot=stacks[i]; const iid=lot.item; t.className="tuile utilisable";
      t.dataset.item = iid;
      t.innerHTML=`<span class="icone">${iconeItem(iid)}</span><span class="compte">${lot.qte}</span>${(typeof badgeLot==="function")?badgeLot(lot):""}`;
      if(typeof montrerItemTip==="function"){ t.addEventListener("mouseenter",()=>montrerItemTip(t,iid)); t.addEventListener("mouseleave",cacherItemTip); }
      t.addEventListener("click",()=>{ if(typeof cacherItemTip==="function")cacherItemTip(); retirerSoute(iid); });
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
