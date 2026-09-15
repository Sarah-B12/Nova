/* ===========================================================
   LES ÉCRANS DES LIEUX DE NIELLE — Le Garage, Le Gisement (v0.91)

   ⚠ RÈGLE : tout lieu du secteur qui offre un SERVICE a son onglet. Le bandeau
   sous la carte est à hauteur fixe et ne peut porter aucun bouton — une ligne
   de trop y disparaît sans bruit. La carte informe et emmène ; les services
   vivent dans un écran qui a la place de respirer.

   LE GARAGE — La Carcasse

   Premier lieu de Nielle à avoir un ÉCRAN plutôt qu'un simple bouton sur la
   carte. Il réutilise la charpente de hubs des cités et du Perchoir : c'est
   `majHub()` (navigation.js) qui décide lesquels sont visibles selon l'endroit.

   ⚠ POURQUOI UN HUB ET PAS UN ÉCRAN SUR MESURE. `LORE_Corporation.md` §4bis
   prévoit DEUX quêtes par lieu dans l'arc Q6→Q15, et Q6 se passe précisément
   ici. Le jour où il faudra y ajouter un onglet Quêtes, il n'y aura qu'à
   basculer `quete:true` dans la liste de ce lieu — rien à refondre.

   ⚠ IL RÉPARE LES PV, JAMAIS LA DURÉE DE VIE. Sinon le Constructeur perdrait
   le marché des vaisseaux, que la Navette de réserve lui écorne déjà.
   =========================================================== */

const GARAGE_BANNIERE = "images/garage.png";   // ⚠ à produire (même format que l'auberge)

function majGarage(){
  const z = document.querySelector("#garage-vue"); if(!z) return;

  if(typeof surCarcasse !== "function" || !surCarcasse()){
    z.innerHTML = `<p class="vide">Il faut être à La Carcasse.</p>`;
    return;
  }

  let h = `<div class="garage-vis"><img src="${GARAGE_BANNIERE}" alt="" onerror="this.parentNode.style.display='none'"></div>`;

  /* Le lieu se raconte ici, pas sur la carte : le bandeau de la carte doit
     tenir en deux lignes, un écran de lieu peut respirer. */
  h += `<p class="vide" style="margin:0 0 12px">Un vieux cargo éventré, arrimé à lui-même par des câbles.
    Quelqu'un vit dedans et découpe dans la carcasse ce qui manque aux autres.
    Il ne demande pas d'où tu viens et ne dit pas d'où il vient.
    <br><span class="itip-gris">Il refait les plaques, pas les moteurs : une coque usée par les années, il n'y peut rien.</span></p>`;

  if(!etat.vaisseau){
    h += `<p class="vide">Tu n'as aucun vaisseau équipé à lui montrer.</p>`;
    z.innerHTML = h; return;
  }

  const manque = pvMax() - pvVaisseau();
  const cout   = (typeof coutReparateur === "function") ? coutReparateur() : 0;
  const etatTxt = vaisseauCloue() ? "CLOUÉ" : (vaisseauAvarie() ? "en avarie" : "en état");

  h += `<div class="garage-etat">
      <div><span>Coque</span><b style="color:${vaisseauCloue()?"#ff5257":(vaisseauAvarie()?"#ff8a3d":"inherit")}">${pvVaisseau()}/${pvMax()} PV — ${etatTxt}</b></div>
      <div><span>Vaisseau</span><b>${VAISSEAUX[etat.vaisseau].nom}</b></div>
    </div>`;

  if(manque <= 0){
    h += `<p class="vide" style="margin-top:12px">« Rien à faire sur celle-là. Reviens quand tu l'auras abîmée. »</p>`;
  } else {
    const peut = (etat.credits||0) >= cout;
    h += `<p class="vide" style="margin-top:12px">Remise à neuf complète : <b class="or">${cout} ₡</b>
      <span class="itip-gris">(${manque} PV à ${REPARATEUR_PRIX_PV} ₡)</span>
      ${peut ? "" : `<br><span style="color:var(--coral,#ff5257)">Il te manque ${cout - (etat.credits||0)} ₡.</span>`}</p>
      <div class="actions"><button class="mini" id="garage-reparer" ${peut?"":"disabled"}>Faire réparer</button></div>`;
  }

  z.innerHTML = h;
  const b = z.querySelector("#garage-reparer");
  if(b) b.addEventListener("click", async ()=>{ await reparerChezReparateur(); majGarage(); });
}


/* ===========================================================
   LE GISEMENT — Le Gravier
   ⚠ Un seul minerai, et un QUOTA QUOTIDIEN : voir orbite.js pour le détail des
   raisons (le Cristal de Nyx est la matière la plus rare du jeu).
   ⚠ Chaque tentative raye la coque. C'est la source de dégâts régulière et
   prévisible, celle qu'on planifie.
   =========================================================== */
function majGisement(){
  const z = document.querySelector("#gisement-vue"); if(!z) return;

  if(typeof surGravier !== "function" || !surGravier()){
    z.innerHTML = `<p class="vide">Il faut être au Gravier.</p>`;
    return;
  }

  let h = `<p class="vide" style="margin:0 0 12px">Des roches lentes, grosses comme des collines, qui tournent les unes autour des autres depuis toujours.
    Quelque part là-dedans il y a ce qui ne pousse nulle part ailleurs — et il faut entrer dans le tas pour le trouver.
    <br><span class="itip-gris">On en ressort toujours avec la coque rayée.</span></p>`;

  if(!etat.vaisseau){
    h += `<p class="vide">Sans vaisseau, tu ne manœuvres pas là-dedans.</p>`;
    z.innerHTML = h; return;
  }

  const reste = gravierRestants();
  h += `<div class="garage-etat">
      <div><span>Tentatives</span><b>${reste}/${GRAVIER_ESSAIS} aujourd'hui</b></div>
      <div><span>Coque</span><b style="color:${vaisseauCloue()?"#ff5257":(vaisseauAvarie()?"#ff8a3d":"inherit")}">${pvVaisseau()}/${pvMax()} PV</b></div>
      <div><span>Chaque tentative</span><b>−${GRAVIER_ENERGIE} % d'énergie · 1 à 3 PV</b></div>
    </div>`;

  if(reste <= 0){
    h += `<p class="vide" style="margin-top:12px">Le gisement est épuisé pour aujourd'hui. Il se recharge demain.</p>`;
  } else if(vaisseauCloue()){
    h += `<p class="vide" style="margin-top:12px" >Coque hors service : impossible de manœuvrer dans les cailloux.</p>`;
  } else {
    const ko = (etat.energie|0) < GRAVIER_ENERGIE || placesLibres() <= 0;
    h += `<div class="actions" style="margin-top:12px"><button class="mini" id="gis-miner" ${ko?"disabled":""}>Fouiller les cailloux</button>
      ${placesLibres()<=0?`<span class="itip-gris" style="margin-left:8px">Sac plein.</span>`:""}</div>`;
  }

  z.innerHTML = h;
  const b = z.querySelector("#gis-miner");
  if(b) b.addEventListener("click", async ()=>{ await minerGravier(); majGisement(); });
}
