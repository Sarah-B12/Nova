/* ===========================================================
   FORMATIONS — Le Centre : sous-onglets, formations et recettes, paliers de progression.
   =========================================================== */
// ============ LE CENTRE : sous-onglets + Formations ============
// Chaque recette = [seuil de points, nom de l'objet, matières nécessaires (texte)].
// Le seuil sert aussi de « nombre de points » : l'objet devient fabricable quand on l'atteint.
// Les intermédiaires entre parenthèses indiquent le métier qui les fabrique (interdépendance).
const FORMATIONS = {
  fabricant: {
    nom:"Fabricant d'armes",
    desc:"Forge les lingots à partir des minerais, puis armes, munitions et armures. Fournit les lingots à tous les autres métiers.",
    recettes:[
      [0,"Lingot de Cendrite","4 Cendrite"],
      [10,"Couteau de survie","2 Lingot de Cendrite"],
      [20,"Munitions cinétiques ×10","1 Lingot de Cendrite, 2 Voltane"],
      [30,"Pistolet cinétique","3 Lingot de Cendrite, 1 Composant simple, 1 Câblage"],
      [40,"Casque léger","2 Lingot de Cendrite, 1 Fil, 1 Biofibre"],
      [50,"Plastron léger","3 Lingot de Cendrite, 2 Cuir, 1 Fil, 1 Biofibre"],
      [60,"Jambières légères","2 Lingot de Cendrite, 1 Fil, 1 Biofibre"],
      [70,"Munitions à plasma ×10","1 Lingot de Silite, 3 Voltane"],
      [80,"Lame à plasma","1 Lingot de Cendrite, 1 Lingot de Silite, 1 Câblage"],
      [90,"Pistolet à plasma","1 Lingot de Cendrite, 1 Lingot de Silite, 1 Cellule d'énergie"],
      [100,"Lingot de Givrite","3 Givrite"],
      [110,"Munitions à ions ×10","2 Lingot de Givrite, 1 Lingot de Silite"],
      [120,"Fusil à ions","4 Lingot de Givrite, 1 Composant avancé, 1 Cellule d'énergie"],
      [130,"Tourelle de vaisseau","1 Fusil à ions, 3 Munitions à ions, 1 Servomoteur"],
      [140,"Casque lourd","2 Lingot de Givrite, 1 Biofil renforcé"],
      [150,"Plastron lourd","3 Lingot de Givrite, 1 Combinaison pressurisée, 1 Panneau renforcé"],
      [160,"Jambières lourdes","2 Lingot de Givrite, 2 Biofil renforcé"],
      [170,"Lame à singularité","1 Cristal de Nyx, 1 Lingot de Givrite, 2 Panneau composite"],
      [180,"Canon à singularité","3 Cristal de Nyx, 2 Lingot de Givrite, 3 Panneau composite, 1 Biofil renforcé"]
    ]
  },
  ingenieur: {
    nom:"Ingénieur",
    desc:"Assemble panneaux, composants et machines. Fabrique l'Ordinateur de hacking et les drones. Ses pièces sont réclamées par tous les autres métiers.",
    recettes:[
      [0,"Lingot de Voltane","4 Voltane"],
      [10,"Composant simple","2 Lingot de Voltane"],
      [20,"Circuit imprimé","2 Composant simple"],
      [30,"Câblage","1 Lingot de Voltane, 1 Fil"],
      [40,"Panneau renforcé","2 Panneau de Sylve, 1 Lingot de Cendrite"],
      [50,"Servomoteur","2 Composant simple, 1 Cellule d'énergie"],
      [60,"Composant avancé","2 Circuit imprimé, 2 Lingot de Cendrite"],
      [70,"Panneau composite","2 Panneau renforcé, 1 Lingot de Voltane"],
      [80,"Noyau de calcul","2 Composant avancé, 1 Circuit imprimé, 1 Cristal de Nyx"],
      [90,"Ordinateur de hacking","1 Noyau de calcul, 1 Composant avancé, 1 Fil"],
      [100,"Supraconducteur","2 Lingot de Voltane, 1 Lingot de Givrite, 1 Composant avancé, 1 Biofil renforcé"],
      [110,"IA d'assistance","2 Noyau de calcul, 1 Cristal de Nyx, 1 Supraconducteur"],
      [120,"Drone de récolte","1 Servomoteur, 1 IA d'assistance, 1 Composant simple, 2 Biogel"],
      [130,"Drone d'élevage","1 Servomoteur, 1 IA d'assistance, 1 Composant avancé, 1 Kit de soin"],
      [140,"Drone récupérateur","1 Servomoteur, 1 IA d'assistance, 4 Composant avancé"],
      [150,"Drone de combat","1 Servomoteur, 1 IA d'assistance, 2 Composant avancé, 1 Pistolet à plasma"]
    ]
  },
  biotech: {
    nom:"Biotech",
    desc:"Raffine la Filaine en Fil, produit soins, biocarburant et implants biologiques. Nourrit l'industrie en Fil et en Biocarburant.",
    recettes:[
      [0,"Fil","3 Filaine"],
      [10,"Panneau de Sylve","3 Sylve"],
      [20,"Biogel","3 Nectine"],
      [30,"Ration chaude","2 Protéines, 3 Sporelle"],
      [40,"Recharge d'oxygène","5 Sylve, 1 Composant simple"],
      [50,"Kit de soin","2 Biogel, 1 Couteau de survie, 1 Fil"],
      [60,"Biocarburant","4 Biogel"],
      [70,"Stimulant","2 Biogel, 1 Protéines"],
      [80,"Antidote","2 Biogel, 1 Sylve"],
      [90,"Boîte de soin","2 Kit de soin, 1 Ration chaude"],
      [100,"Tank à oxygène","2 Recharge d'oxygène, 2 Lingot de Silite"],
      [110,"Biofil renforcé","4 Fil, 1 Biofibre"],
      [120,"Combinaison pressurisée","1 Tank à oxygène, 1 Biofil renforcé, 1 Cellule d'énergie"],
      [130,"Biocarburant raffiné","2 Biocarburant, 1 Composant avancé"],
      [140,"Implant de force","3 Biofil renforcé, 1 Cristal de Nyx, 1 Antidote"],
      [150,"Implant d'agilité","3 Biofil renforcé, 1 Cristal de Nyx, 1 Stimulant"],
      [160,"Implant maitre","3 Biofil renforcé, 3 Cristal de Nyx, 1 Antidote, 1 Stimulant"]
    ]
  },
  constructeur: {
    nom:"Constructeur de vaisseaux",
    desc:"Produit les Cellules d'énergie (utilisées par tous) puis coques, moteurs et châssis. C'est la voie qui mène jusqu'à l'espace.",
    recettes:[
      [0,"Lingot de Silite","3 Silite"],
      [10,"Plaque de coque","2 Lingot de Silite, 1 Panneau de Sylve"],
      [20,"Réservoir","2 Lingot de Silite, 1 Biocarburant"],
      [30,"Cellule d'énergie","2 Voltane, 1 Composant simple"],
      [40,"Propulseur d'appoint","2 Cellule d'énergie, 2 Lingot de Silite"],
      [50,"Cockpit léger","3 Plaque de coque, 1 Cellule d'énergie, 1 Circuit imprimé"],
      [60,"Moteur basique","2 Cellule d'énergie, 1 Câblage"],
      [70,"Navette légère","2 Plaque de coque, 1 Cockpit léger, 1 Moteur basique, 1 Propulseur d'appoint, 1 Réservoir"],
      [80,"Bloc de propulsion","2 Moteur basique, 1 Réservoir, 1 Composant avancé, 1 Lingot de Silite"],
      [90,"Soute cargo","3 Plaque de coque, 1 Panneau renforcé"],
      [100,"Vaisseau Cargo","3 Plaque de coque, 1 Cockpit léger, 1 Moteur basique, 1 Bloc de propulsion, 1 Soute cargo"],
      [110,"Coque blindée","3 Plaque de coque, 1 Panneau composite"],
      [120,"Cockpit blindé","2 Coque blindée, 1 Lingot de Givrite, 1 IA d'assistance"],
      [130,"Moteur à distorsion","1 Moteur basique, 3 Lingot de Givrite, 1 Cristal de Nyx"],
      [140,"Vaisseau maitre","1 Cockpit blindé, 3 Coque blindée, 1 Moteur à distorsion, 1 Tourelle de vaisseau, 3 Cristal de Nyx"]
    ]
  }
};
const PALIERS = [[0,"Apprenti"],[100,"Confirmé"],[200,"Maître"]];
function palierDe(points){ let p="Apprenti"; for(const [s,nom] of PALIERS){ if(points>=s) p=nom; } return p; }

let centreVue = "formations";   // sous-onglet actif du Centre
let formationApercu = null;     // clé de la formation prévisualisée (avant de commencer)

function changerCentre(c){
  centreVue = c;
  document.querySelectorAll("#hub-centre .lien-carte").forEach(b => b.classList.toggle("actif", b.dataset.centre===c));
  majCentre();
}
function majCentre(){
  const el = document.querySelector("#centre-corps"); if(!el) return;
  el.innerHTML = "";
  if(centreVue==="formations"){ el.appendChild(vueFormations()); return; }
  const titres = { gouvernement:"Gouvernement", votes:"Votes", guerres:"Guerres de faction" };
  const notes = {
    gouvernement:"Régent, Maréchal et Intendant élus par la faction, avec leurs pouvoirs… à venir.",
    votes:"Lancer et trancher les décisions de la faction… à venir.",
    guerres:"Déclarer et mener les guerres entre factions, monter des coalitions contre le Protocole… à venir."
  };
  el.innerHTML = `<h3>${titres[centreVue]||"Le Centre"}</h3><p class="vide">${notes[centreVue]||""}</p>`;
}
function listeRecettes(fo, points){
  const box = document.createElement("div"); box.className="recette-liste";
  fo.recettes.forEach(([seuil, nom, ing])=>{
    const l = document.createElement("div"); l.className = "recette-ligne" + (points>=seuil ? " ok" : "");
    l.innerHTML = `<span class="recette-seuil">${seuil}</span><span class="recette-corps"><b class="recette-nom">${nom}</b><span class="recette-ing">${ing}</span></span>`;
    box.appendChild(l);
  });
  return box;
}
function vueFormations(){
  const wrap = document.createElement("div");
  const f = etat.formation;
  if(f){
    // Formation en cours
    const fo = FORMATIONS[f.cle]; const dernier = fo.recettes[fo.recettes.length-1][0];
    wrap.innerHTML = `<h3>${fo.nom} <span class="qte">${palierDe(f.points)}</span></h3>
      <div class="form-progress"><div class="form-progress-tete"><span><b class="or">${f.points}</b> pts</span><span>max ${dernier} pts</span></div>
        <div class="form-barre"><div class="form-remplissage" style="width:${Math.min(100, Math.round(f.points/dernier*100))}%"></div></div></div>
      <p class="vide" style="margin:8px 0 4px">Voici tous les objets de la formation, avec leur nombre de points et les matières nécessaires. Bâtis un <b>Atelier</b> sur ton terrain de récolte pour les fabriquer et gagner ces points.</p>`;
    wrap.appendChild(listeRecettes(fo, f.points));
    const act = document.createElement("div"); act.className="actions"; act.style.marginTop="12px";
    const b = document.createElement("button"); b.className="mini danger"; b.textContent="Abandonner la formation";
    b.addEventListener("click", abandonnerFormation); act.appendChild(b); wrap.appendChild(act);
    return wrap;
  }
  if(formationApercu){
    // Aperçu d'une formation avant de la commencer
    const fo = FORMATIONS[formationApercu];
    const tete = document.createElement("div");
    const retour = document.createElement("button"); retour.className="mini"; retour.textContent="← Retour";
    retour.addEventListener("click", ()=>{ formationApercu=null; majCentre(); });
    tete.appendChild(retour);
    wrap.appendChild(tete);
    const h = document.createElement("div");
    h.innerHTML = `<h3 style="margin-top:10px">${fo.nom}</h3><p class="vide" style="margin:0 0 6px">${fo.desc}</p>`;
    wrap.appendChild(h);
    wrap.appendChild(listeRecettes(fo, 0));
    const act = document.createElement("div"); act.className="actions"; act.style.marginTop="12px";
    const b = document.createElement("button"); b.className="action";
    b.innerHTML = `<span>Commencer cette formation</span><span class="cout">${fo.recettes.length} recettes</span>`;
    b.addEventListener("click", ()=>commencerFormation(formationApercu)); act.appendChild(b); wrap.appendChild(act);
    return wrap;
  }
  // Choix parmi les 4 formations
  const intro = document.createElement("div");
  intro.innerHTML = `<h3>Choisir une formation</h3><p class="vide" style="margin:0 0 12px">Apprends un métier de fabrication. Clique une formation pour voir son arbre complet, puis commence-la.</p>`;
  wrap.appendChild(intro);
  for(const cle in FORMATIONS){
    const fo = FORMATIONS[cle]; const dernier = fo.recettes[fo.recettes.length-1][0];
    const c = document.createElement("button"); c.className="formation-carte";
    c.innerHTML = `<div class="formation-nom">${fo.nom}</div><div class="formation-desc">${fo.desc}</div><div class="formation-meta">${fo.recettes.length} recettes · de 0 à ${dernier} pts</div>`;
    c.addEventListener("click", ()=>{ formationApercu=cle; majCentre(); });
    wrap.appendChild(c);
  }
  return wrap;
}
function commencerFormation(cle){
  const fo = FORMATIONS[cle];
  etat.formation = { cle, points:0, debutLe:Date.now(), fait:{} };
  formationApercu = null;
  journal(`Formation commencée : ${fo.nom}.`,"gain");
  apresAction(); majCentre();
}
function abandonnerFormation(){
  if(!etat.formation) return;
  if(!confirm("Abandonner ta formation ? Tu oublieras TOUT ce que tu as fait depuis son début (points remis à zéro). Tu pourras ensuite en choisir une autre depuis le début.")) return;
  etat.formation = null; formationApercu = null;
  journal("Formation abandonnée — progression oubliée.","alerte");
  apresAction(); majCentre();
}

/* ===========================================================
   ATELIER — Fabrication des objets de la formation.
   Les recettes des FORMATIONS produisent des « intermédiaires »
   (Lingots, Panneaux, Composants, Fil, Cellules d'énergie…) qui
   deviennent de vrais objets du sac : empilables, stockables dans
   la maison, et réutilisables comme ingrédients de recettes plus
   avancées. On enregistre donc chaque sortie de recette comme item.
   =========================================================== */

const CAP_RECETTE = 10;   // points max qu'une même recette peut rapporter (= 1 palier ; on progresse en variant)

// Points gagnés par fabrication selon la difficulté de l'objet.
// De base 1 point ; les armes, vaisseaux, armures et pièces maîtresses en rapportent plus.
function ptsFab(nom){
  const n = normNom(nom); const has = (...ws) => ws.some(w => n.includes(w));
  if(has("fusil","pistolet","carabine","canon","lame","couteau","lance-flammes","munitions",
         "vaisseau","chassis","fregate","cargo","navette","reacteur","moteur ionique","propulseur","bloc de propulsion",
         "implant")) return 3;                                   // armes, vaisseaux, pièces maîtresses
  if(has("plastron","casque","armure","bouclier","gantelet","jambieres","exosquelette","combinaison",
         "drone","tourelle","nano","kit chirurgical","serum de resurrection","noyau","supraconducteur","matrice")) return 2; // armures, drones, tech avancée
  return 1;                                                      // intermédiaires de base
}

const PROD_PAR_NOM = {};  // clé normalisée -> { id, nom, cle, seuil }
const RAW_PAR_NOM  = {};  // clé normalisée -> id d'une matière première
const ALIAS        = {};  // clé normalisée d'une référence générique -> id concret

// Normalise un nom pour la comparaison : enlève une annotation entre parenthèses
// « (Biotech) », « (raffiné) », « (châssis) », les accents, la casse et les espaces.
function normNom(s){
  return String(s)
    .replace(/\([^)]*\)/g, "")
    .replace(/\s*[×x]\s*\d+/g, "")            // enlève « ×10 » etc. (batch) pour aligner les références
    .replace(/[\u2019\u2018]/g, "'")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}
function slugFab(nom){
  const base = "fab_" + normNom(nom).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return base || "fab_item";
}
function iconeFabrique(nom){
  const n = normNom(nom); const has = (...ws) => ws.some(w => n.includes(w));
  let c = "#9fb0c4", d = `<circle cx="12" cy="12" r="7"/><path d="M12 8v8M8 12h8"/>`;
  if(has("lingot")){ c="#d9a066"; d=`<path d="M6 11h12l1 4H5z"/><path d="M4 15h16l-2 4H6z"/>`; }
  else if(has("cellule","batterie","reacteur","generateur","propulseur","propulsion","moteur","bloc de","noyau de vaisseau","noyau quantique","supraconducteur")){ c="#ffc061"; d=`<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M12 7v4h2l-2 5"/>`; }
  else if(has("fusil","pistolet","carabine","canon","lame","couteau","lance-flammes","munitions","tourelle")){ c="#ff7a7a"; d=`<path d="M3 9h13l4 2-2 3h-4l-2-2H3z"/><path d="M9 14l-2 4"/>`; }
  else if(has("panneau","coque","plaque","plastron","casque","jambieres","gantelet","armure","bouclier","exosquelette","cockpit","chassis","navette","fregate","cargo","train","soute","reservoir")){ c="#9fb4cc"; d=`<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>`; }
  else if(has("kit","soin","serum","biogel","antidote","stimulant","ration","recharge","nano","organe","symbiote","booster","culture","tank","combinaison","implant","biocarburant","spore")){ c="#7fe0a0"; d=`<rect x="6" y="4" width="12" height="16" rx="3"/><path d="M12 9v6M9 12h6"/>`; }
  else if(has("fil","biofibre")){ c="#cbe06f"; d=`<path d="M5 7c5-3 9 3 14 0M5 12c5-3 9 3 14 0M5 17c5-3 9 3 14 0"/>`; }
  else if(has("composant","circuit","cablage","noyau","servomoteur","bras","terminal","ia ","matrice","module","drone")){ c="#6fe0ff"; d=`<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>`; }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}

// Matières premières (minerais / organiques / animales / plantes) connues par leur nom.
[...MATIERES, ...PLANTES].forEach(m => { RAW_PAR_NOM[normNom(m.nom)] = m.id; });

// Enregistre chaque sortie de recette comme objet du jeu (une seule fois).
(function construireProduits(){
  const vus = {};
  for(const cle in FORMATIONS){
    FORMATIONS[cle].recettes.forEach(([seuil, nom]) => {
      const k = normNom(nom);
      if(PROD_PAR_NOM[k]) return;
      // Sortie = matière première déjà existante (ex. Protéines) → on la réutilise, pas de nouvel objet.
      if(RAW_PAR_NOM[k]){ PROD_PAR_NOM[k] = { id: RAW_PAR_NOM[k], nom, cle, seuil, brut:true }; return; }
      let id = slugFab(nom); while(vus[id]) id += "_"; vus[id] = 1;
      PROD_PAR_NOM[k] = { id, nom, cle, seuil };
      TOUS_ITEMS.push({ id, nom, type:"fabrique", cat:"fabrique" });
      SVG[id] = iconeFabrique(nom);
    });
  }
})();

// Références génériques du GDD qui ne portent pas le nom exact du produit.
if(PROD_PAR_NOM["panneau de sylve"]) ALIAS["panneau"]   = PROD_PAR_NOM["panneau de sylve"].id;
if(PROD_PAR_NOM["composant simple"]) ALIAS["composant"] = PROD_PAR_NOM["composant simple"].id;

// Renvoie l'id d'objet correspondant à un nom d'ingrédient, ou null si introuvable
// (typiquement un intermédiaire d'un autre métier pas encore modélisé/disponible).
function resoudreItem(nomBrut){
  const k = normNom(nomBrut);
  if(ALIAS[k])        return ALIAS[k];
  if(RAW_PAR_NOM[k])  return RAW_PAR_NOM[k];
  if(PROD_PAR_NOM[k]) return PROD_PAR_NOM[k].id;
  return null;
}
// « 4 Cendrite, 1 Fil (Biotech) » -> [{qte:4,id:"cendrite",...}, {qte:1,id:"fab_fil_raffine",...}]
function parseIngredients(txt){
  return String(txt).split(",").map(tok => {
    tok = tok.trim();
    const m = tok.match(/^(\d+)\s+(.*)$/);
    const qte = m ? parseInt(m[1], 10) : 1;
    const nomI = (m ? m[2] : tok).trim();
    return { qte, id: resoudreItem(nomI), nom: nomI, txt: tok };
  });
}

/* ---------- Fabrication ---------- */
function fabriquer(seuil){
  const f = etat.formation; if(!f) return;
  f.fait = f.fait || {};
  const fo = FORMATIONS[f.cle];
  const rec = fo.recettes.find(r => r[0] === seuil); if(!rec) return;
  const [, nom, ingTxt] = rec;
  if(f.points < seuil){ journal("Recette encore verrouillée.", "alerte"); return; }
  const ings = parseIngredients(ingTxt);
  if(ings.some(g => g.id === null)){ journal("Cette recette exige un intermédiaire d'un autre métier, pas encore disponible.", "alerte"); return; }

  // Maître-artisan : −1 sur la plus grosse matière première (min 1)
  const qtes = ings.map(g => g.qte);
  if(aptFabMaitre()){
    let bi = -1;
    ings.forEach((g,i)=>{ if(g.id && item(g.id).type==="matiere" && qtes[i]>1 && (bi<0 || qtes[i]>qtes[bi])) bi=i; });
    if(bi>=0) qtes[bi] -= 1;
  }
  for(let i=0;i<ings.length;i++){ if((etat.sac[ings[i].id]||0) < qtes[i]){ journal(`Il manque ${qtes[i]}× ${item(ings[i].id).nom}.`, "alerte"); return; } }

  const pid = PROD_PAR_NOM[normNom(nom)].id;
  for(let i=0;i<ings.length;i++) retirerDuSac(ings[i].id, qtes[i]);      // consomme (libère de la place)
  const pris = ajouterAuSac(pid, 1);
  if(pris < 1){                                        // sécurité : sac saturé, on rend les ingrédients
    for(let i=0;i<ings.length;i++) ajouterAuSac(ings[i].id, qtes[i]);
    journal("Sac plein — impossible de ranger l'objet fabriqué.", "alerte"); return;
  }
  // Production en série : 10 % de sortir un 2ᵉ objet
  let bonus2 = false;
  if(aptFabSerie() && Math.random()<0.10){ if(ajouterAuSac(pid,1)>=1) bonus2 = true; }
  // Récup d'atelier : 20 % de rendre 1 unité (l'ingrédient le plus abondant)
  let rendu = null;
  if(aptFabSkip() && Math.random()<0.20){ let bi=0; for(let i=1;i<qtes.length;i++) if(qtes[i]>qtes[bi]) bi=i; if(qtes[bi]>0 && ajouterAuSac(ings[bi].id,1)>=1) rendu=item(ings[bi].id).nom; }

  const gagne = Math.min(ptsFab(nom) + aptFabPoints(), CAP_RECETTE - (f.fait[seuil]||0));
  if(gagne > 0){ f.fait[seuil] = (f.fait[seuil]||0) + gagne; f.points += gagne; }
  journal(`Fabriqué : ${nom}${bonus2?" ×2 (série)":""}.` + (rendu?` Récup : +1 ${rendu}.`:"") + (gagne > 0 ? ` +${gagne} pt${gagne>1?"s":""} de formation.` : " (recette épuisée, +0 pt)"), "gain");
  apresAction(); majStruct();
}

/* ---------- Interface de l'atelier (rendue dans la modale de structure) ---------- */
function renderAtelier(corps){
  corps.innerHTML = "";
  const f = etat.formation;
  if(!f){
    corps.innerHTML = `<p class="vide" style="margin:0">Aucune formation en cours. Va au <b>Centre → Formations</b> pour en choisir une, puis reviens fabriquer ici.</p>`;
    return;
  }
  f.fait = f.fait || {};
  const fo = FORMATIONS[f.cle];
  const dernier = fo.recettes[fo.recettes.length - 1][0];

  const tete = document.createElement("div");
  tete.innerHTML =
    `<p style="margin:0 0 4px"><b>${fo.nom}</b> <span class="qte">${palierDe(f.points)}</span></p>
     <div class="form-progress"><div class="form-progress-tete"><span><b class="or">${f.points}</b> pts</span><span>max ${dernier}</span></div>
       <div class="form-barre"><div class="form-remplissage" style="width:${Math.min(100, Math.round(f.points / dernier * 100))}%"></div></div></div>
     <p class="vide" style="margin:6px 0 10px">Fabriquer range l'objet dans ton sac et rapporte des points de formation : +1 pt en général, davantage pour les objets difficiles (armes, vaisseaux…). Chaque recette est plafonnée à ${CAP_RECETTE} pts — on progresse en variant.</p>`;
  corps.appendChild(tete);

  const liste = document.createElement("div"); liste.className = "recette-liste atelier-liste";
  let prochaine = null;
  fo.recettes.forEach(([seuil, nom, ingTxt]) => {
    if(f.points < seuil){ if(prochaine === null) prochaine = [seuil, nom]; return; }   // masque les verrouillées
    const ings = parseIngredients(ingTxt);
    const inconnu = ings.some(g => g.id === null);
    const manque  = ings.some(g => g.id === null || (etat.sac[g.id]||0) < g.qte);
    const epuise  = (f.fait[seuil]||0) >= CAP_RECETTE;

    const ingHtml = ings.map(g => {
      const nomAff = g.id ? item(g.id).nom : g.nom;
      const poss   = g.id ? (etat.sac[g.id]||0) : 0;
      const ok     = g.id && poss >= g.qte;
      return `<span class="ing-tag ${ok ? "ok" : "ko"}">${nomAff} ×${g.qte} <small>(${g.id ? poss : "?"})</small></span>`;
    }).join(" ");

    const l = document.createElement("div"); l.className = "recette-ligne ok";
    l.innerHTML =
      `<span class="recette-seuil">${seuil}</span>
       <span class="recette-corps"><b class="recette-nom">${nom}</b> <small class="recette-gain">+${ptsFab(nom)} pt${ptsFab(nom)>1?"s":""}</small><span class="recette-ing">${ingHtml}</span>
       ${inconnu ? '<span class="recette-note">intermédiaire d\'un autre métier requis</span>' : (epuise ? '<span class="recette-note">recette épuisée (+0 pt)</span>' : "")}</span>`;
    const b = document.createElement("button"); b.className = "mini"; b.textContent = "Fabriquer";
    b.disabled = manque;
    b.addEventListener("click", () => fabriquer(seuil));
    l.appendChild(b);
    liste.appendChild(l);
  });
  if(liste.children.length === 0) liste.innerHTML = `<p class="vide">Aucune recette débloquée pour l'instant.</p>`;
  corps.appendChild(liste);

  if(prochaine){
    const [s, nm] = prochaine;
    const p = document.createElement("p"); p.className = "vide"; p.style.marginTop = "10px";
    p.innerHTML = `Prochaine recette : <b>${nm}</b> — encore <b class="or">${s - f.points}</b> pt(s) de formation.`;
    corps.appendChild(p);
  }
}
