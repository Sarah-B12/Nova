/* ===========================================================
   INTÉGRITÉ DES STRUCTURES — briques 1 à 3 (v0.91)

   Chaque parcelle bâtie a une intégrité de 0 à 100 %. Le Protocole l'abîme
   quand il frappe une faction dont le joueur est ABSENT de Silène (brique 4).
   À 0 % la structure est à l'arrêt — jamais détruite, son contenu est conservé.

   ⚠ POURQUOI UNE TABLE SERVEUR, ET PAS `etat.terrain`.
   Le terrain vit dans `etat.terrain.parcelles`, donc dans `profils.donnees` —
   et `sauver_profil` réécrit `donnees` EN ENTIER (`_etatSansStocks`). Le cron
   écrirait l'intégrité pendant l'absence du joueur, et la première sauvegarde
   à son retour l'effacerait sans erreur. Même raison que `boisson_active`
   (BACKEND_PLAN §4sexdecies) : une donnée écrite par le serveur ne peut pas
   vivre dans `donnees`.

   ⚠ ET PAS DANS `etat` NON PLUS. `INTEGRITE` est une variable de module, pas
   une clé de l'état : rien à ajouter à CLES_SERVEUR, rien à hydrater, aucun
   risque de persistance locale. Elle est relue à chaque connexion.

   Absence de ligne = 100 %. On ne stocke que ce qui est abîmé.
   =========================================================== */

let INTEGRITE = {};        // { "3": 75, "7": 0 } — clé = index de parcelle

function integriteDe(plot){
  const v = INTEGRITE[String(plot)];
  return (typeof v === "number") ? v : 100;
}
/* Une structure à 0 % ne produit plus rien. */
function structureHS(plot){ return integriteDe(plot) <= 0; }
function maisonHS(){ return !!(etat && etat.maison && etat.maison.plot!=null && structureHS(etat.maison.plot)); }

function _appliquerIntegrite(m){
  INTEGRITE = (m && typeof m === "object" && !Array.isArray(m)) ? m : {};
}

async function chargerIntegrite(){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  try{
    const { data, error } = await sb.rpc("integrite_lire");
    if(error){ console.warn("[integrite] lecture :", error.message); return; }
    _appliquerIntegrite(data);
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "integrite.js#charger"); }
}

/* Parcelle libérée (démolition) : le serveur oublie ses dégâts, sinon la
   structure reconstruite à cet endroit hériterait de l'intégrité de l'ancienne.
   ⚠ À appeler APRÈS la sauvegarde : la RPC vérifie dans `donnees` que la
   parcelle est bien vide, sinon ce serait une réparation gratuite. */
async function integriteOublier(plot){
  if(!SERVEUR_DISPO || !etat || !etat.inscrit) return;
  try{
    const { data, error } = await sb.rpc("integrite_reset", { p_plot: plot });
    if(error){ console.warn("[integrite] reset :", error.message); return; }
    if(data && data.ok) delete INTEGRITE[String(plot)];
  }catch(e){ if(typeof _catchLog==="function") _catchLog(e, "integrite.js#oublier"); }
}

/* ===========================================================
   RÉPARATION — remet la structure à 100 % en UNE action.
   ⚠ Pas de réparation par paliers de 25 % : le joueur qui rentre d'orbite
   aurait cliqué quatre fois par structure pour rien. L'énergie est donc
   forfaitaire (5 %), et seules les MATIÈRES suivent l'ampleur des dégâts.
   ⚠ Cette table est DUPLIQUÉE côté serveur dans `reparer_structure()` —
   c'est lui qui débite. Les deux se modifient ensemble, comme `prix_brade`
   et `equip_bonus` (BACKEND_PLAN §4sexdecies).
   =========================================================== */
const REPARATION = {
  mine:    { cendrite:2 },
  biodome: { sylve:1,    biofibre:1 },
  enclos:  { biofibre:1, cuir:1 },
  atelier: { cendrite:1, voltane:1 },
  hangar:  { voltane:1,  silite:1 },
  maison:  { cendrite:1, sylve:1 }      // × palier du logement
};
const REPARATION_ENERGIE = 5;           // par réparation, quelle que soit l'ampleur

function coutReparation(plot){
  const p = etat.terrain.parcelles[plot]; if(!p) return null;
  const base = REPARATION[p.type];       if(!base) return null;
  const manque = 100 - integriteDe(plot); if(manque <= 0) return null;
  const tranches = Math.ceil(manque/25);
  const mult = (p.type==="maison") ? Math.max(1, etat.maison.palier||1) : 1;
  const matieres = {};
  for(const k in base) matieres[k] = base[k]*tranches*mult;
  return { matieres, energie:REPARATION_ENERGIE, manque };
}
function texteCoutReparation(plot){
  const c = coutReparation(plot); if(!c) return "";
  const l = Object.keys(c.matieres).map(k=>`${c.matieres[k]} ${item(k).nom}`).join(" + ");
  return `${l} · −${c.energie} % énergie`;
}
function _manqueReparation(plot){
  const c = coutReparation(plot); if(!c) return [];
  return Object.keys(c.matieres).filter(k => nbStock(k) < c.matieres[k])
               .map(k => `${c.matieres[k]-nbStock(k)} ${item(k).nom}`);
}

async function reparerStructure(plot){
  if(plot==null) return;
  if(typeof _refusTerrain==="function" && _refusTerrain()) return;
  const c = coutReparation(plot);
  if(!c){ journal("Cette structure est déjà intacte.","alerte"); return; }
  const manque = _manqueReparation(plot);
  if(manque.length){ journal(`Il te manque : ${manque.join(", ")}.`,"alerte"); return; }
  /* Les matières peuvent dormir dans le coffre : on les remonte au sac, comme
     le chantier de la maison le fait. `agir()` ne pioche que dans le sac. */
  for(const k in c.matieres){
    if(!await assurerDansSac(k, c.matieres[k])){
      journal(`Impossible de sortir ${c.matieres[k]}× ${item(k).nom} de ton rangement.`,"alerte");
      return;
    }
  }
  const { data, error } = await sb.rpc("reparer_structure", { p_plot: plot });
  if(error){ journal("Le serveur n'a pas répondu — réessaie.","alerte"); return; }
  if(!data || !data.ok){
    const err = data && data.err;
    if(err==="energie")      journal("Pas assez d'énergie pour réparer.","alerte");
    else if(err==="manque")  journal(`Il te manque : ${(data.item && typeof item==="function") ? item(data.item).nom : "une matière"}.`,"alerte");
    else if(err==="intacte") journal("Cette structure est déjà intacte.","alerte");
    else journal(`Réparation refusée par le serveur (${err||"réponse vide"}).`,"alerte");
    return;
  }
  delete INTEGRITE[String(plot)];
  // Le serveur a débité : on adopte SON état de stocks et SON énergie.
  if(typeof _appliquerEtatStocks==="function" && data.etat) _appliquerEtatStocks(data.etat);
  if(typeof data.energie === "number"){ etat.energie = data.energie; etat.energieMaj = Date.now(); }
  const p = etat.terrain.parcelles[plot];
  const nom = (p && p.type==="maison") ? "Logement" : ((p && STRUCTURES[p.type]) ? STRUCTURES[p.type].nom : "Structure");
  journal(`${nom} réparé — intégrité 100 %.`,"gain");
  if(typeof majStruct==="function")  majStruct();
  if(typeof majMaison==="function")  majMaison();
  if(typeof majRecolte==="function") majRecolte();
  if(typeof apresAction==="function") apresAction();
}

/* ===========================================================
   AFFICHAGE
   =========================================================== */
/* Pastille d'intégrité sur la tuile du terrain, avec bulle au survol.
   ⚠ Pas de barre de vie : sur une tuile de 60 px elle était illisible, et une
   jauge pleine sur 24 parcelles aurait fait du bruit pour rien. Un point de
   couleur, et le détail seulement quand on le cherche. Sur mobile (pas de
   survol), l'information reste accessible en ouvrant la structure. */
function _niveauIntegrite(v){ return v >= 75 ? "n1" : (v >= 25 ? "n2" : "n3"); }
function _nomStructure(plot){
  const p = etat.terrain.parcelles[plot]; if(!p) return "Structure";
  if(p.type==="maison") return "Logement";
  return (typeof STRUCTURES!=="undefined" && STRUCTURES[p.type]) ? STRUCTURES[p.type].nom : "Structure";
}
function marqueIntegrite(plot){
  const v = integriteDe(plot);
  if(v >= 100) return "";
  const niv = _niveauIntegrite(v);
  const etatTxt = v <= 0
    ? "À l'arrêt — ne produit plus rien."
    : (v <= 25 ? "Très abîmée — un coup de plus et elle s'arrête." : "Abîmée — fonctionne encore.");
  const badge = v <= 0 ? `<span class="badge-hs">à l'arrêt</span>` : "";
  return `${badge}<span class="ip-sig ${niv}"><i></i><span class="ip-bulle">
      <b>${_nomStructure(plot)}</b><br>Intégrité <b>${v} %</b><br>
      <span class="ip-etat">${etatTxt}</span><br>
      Réparation : ${texteCoutReparation(plot)}</span></span>`;
}
/* En-tête de la fenêtre de structure : la mention ET le bouton de réparation.
   ⚠ Le bouton est ici pour TOUS les niveaux de dégâts, pas seulement à 0 % —
   sinon une structure à 75 % n'avait aucun moyen d'être réparée. */
function noteIntegrite(plot){
  const v = integriteDe(plot);
  if(v >= 100) return "";
  const manque = _manqueReparation(plot);
  const dispo = manque.length ? ` title="Il te manque ${manque.join(", ")}"` : ` title="Réparation : ${texteCoutReparation(plot)}"`;
  return `<span class="integrite-note ${_niveauIntegrite(v)}">Intégrité ${v} %</span>`
       + `<button class="mini" id="struct-reparer"${dispo} ${manque.length?"disabled":""} style="margin-left:6px">Réparer</button>`;
}

function _phraseContenu(p){
  if(!p) return "rien n'a été emporté";
  if(p.type==="biodome") return "tes plantes sont toujours en terre";
  if(p.type==="enclos")  return "tes bêtes vont bien";
  if(p.type==="hangar")  return "tes drones sont toujours là";
  if(p.type==="mine")    return "la réserve est intacte";
  return "rien n'a été emporté";
}

/* Écran unique des structures à l'arrêt (mine, atelier, hangar, bio-dôme,
   enclos). Il remplace tout le contenu de la fenêtre : aucune action de
   production ne peut passer à côté. « Démolir » reste dans le pied de la
   modale — c'est le choix laissé au joueur si son terrain est plein. */
function panneauArret(plot){
  const p = etat.terrain.parcelles[plot];
  const box = document.createElement("div");
  const manque = _manqueReparation(plot);
  box.innerHTML = `<p class="vide" style="margin:0 0 10px">
      <b style="color:var(--coral,#ff5257)">Structure à l'arrêt.</b>
      Le Protocole l'a démontée pendant que tu étais hors de Silène. Elle ne produit plus rien,
      mais <b>rien n'est perdu</b> : ${_phraseContenu(p)}.
      <br><small>⚠ Ce qui est stocké continue de vieillir : laisser une structure à l'arrêt ne protège pas des péremptions.</small>
    </p>
    <p class="vide" style="margin:0 0 8px">Réparation : <b class="or">${texteCoutReparation(plot)}</b>${manque.length?` <span style="color:var(--coral,#ff5257)">— il te manque ${manque.join(", ")}</span>`:""}
      <br><small>Ou démolis-la (bouton ci-dessous) pour libérer la parcelle.</small></p>`;
  const row = document.createElement("div"); row.className = "actions";
  const b = document.createElement("button");
  b.className = "mini"; b.textContent = "Réparer";
  b.disabled = manque.length > 0;
  b.addEventListener("click", ()=>reparerStructure(plot));
  row.appendChild(b); box.appendChild(row);
  return box;
}

/* Bandeau du sous-onglet Maison (le logement n'a pas de fenêtre de structure). */
function blocArretMaison(){
  const plot = (etat && etat.maison) ? etat.maison.plot : null;
  if(plot==null) return "";
  const v = integriteDe(plot);
  if(v >= 100) return "";
  const manque = _manqueReparation(plot);
  const bouton = `<button class="mini" id="maison-reparer" style="margin-left:8px" ${manque.length?"disabled":""}>Réparer</button>`;
  if(v > 0){
    return `<p class="vide" style="margin:0 0 10px">Logement abîmé — <b>intégrité ${v} %</b>.
      Réparation : <b class="or">${texteCoutReparation(plot)}</b>${manque.length?` <span style="color:var(--coral,#ff5257)">— il te manque ${manque.join(", ")}</span>`:""}${bouton}</p>`;
  }
  return `<p class="vide" style="margin:0 0 12px">
      <b style="color:var(--coral,#ff5257)">Logement à l'arrêt.</b>
      Le Protocole l'a démonté pendant ton absence. Ton <b>rangement reste accessible</b> et son contenu est intact,
      mais tu ne peux plus y dormir (repos au confort de l'auberge) ni avancer de chantier.
      <br>Réparation : <b class="or">${texteCoutReparation(plot)}</b>${manque.length?` <span style="color:var(--coral,#ff5257)">— il te manque ${manque.join(", ")}</span>`:""}${bouton}</p>`;
}
function refusMaisonHS(){
  if(!maisonHS()) return false;
  journal("Logement à l'arrêt : répare-le avant de reprendre les travaux.","alerte");
  return true;
}

/* ===========================================================
   Outils de test (console dev)
   =========================================================== */
function _parcellesBaties(){
  const out = [];
  const arr = (etat && etat.terrain && etat.terrain.parcelles) || [];
  for(let i=0;i<arr.length;i++) if(arr[i]) out.push(i);
  return out;
}
async function devAbimerStructure(){
  const l = _parcellesBaties();
  if(!l.length){ journal("Aucune structure à abîmer.","alerte"); return; }
  const plot = l[Math.floor(Math.random()*l.length)];
  const { data, error } = await sb.rpc("admin_abimer", { p_plot: plot, p_points: 25 });
  if(error || !data || !data.ok){ journal("Échec : "+((data&&data.err)||(error&&error.message)||"?"),"alerte"); return; }
  INTEGRITE[String(plot)] = data.integrite;
  const p = etat.terrain.parcelles[plot];
  const nom = (p.type==="maison") ? "Logement" : (STRUCTURES[p.type] ? STRUCTURES[p.type].nom : p.type);
  journal(`[dev] ${nom} (parcelle ${plot+1}) : intégrité ${data.integrite} %.`,"alerte");
  if(typeof majRecolte==="function") majRecolte();
  if(typeof majMaison==="function")  majMaison();
  if(typeof majStruct==="function")  majStruct();
}
async function devReparerTout(){
  const { data, error } = await sb.rpc("admin_integrite_reset");
  if(error || !data || !data.ok){ journal("Échec : "+((data&&data.err)||(error&&error.message)||"?"),"alerte"); return; }
  INTEGRITE = {};
  journal("[dev] Toutes les structures sont remises à 100 %.","gain");
  if(typeof majRecolte==="function") majRecolte();
  if(typeof majMaison==="function")  majMaison();
  if(typeof majStruct==="function")  majStruct();
}
