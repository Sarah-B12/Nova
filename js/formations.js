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
      [10,"Lingot de Voltane","4 Voltane"],
      [20,"Couteau de survie","2 Lingot de Cendrite"],
      [30,"Munitions cinétiques ×10","1 Lingot de Cendrite, 2 Cendrite"],
      [40,"Outil de minage","2 Lingot de Cendrite, 1 Fil (Biotech)"],
      [50,"Pistolet à plasma","1 Lingot de Voltane, 1 Composant (Ing.)"],
      [60,"Gantelet renforcé","2 Lingot de Cendrite, 1 Cuir (Enclos)"],
      [70,"Lame à plasma","1 Lingot de Voltane, 1 Lingot de Cendrite, 1 Cellule d'énergie (Constr.)"],
      [80,"Casque léger","2 Lingot de Cendrite, 1 Panneau (Ing.), 1 Fil (Biotech)"],
      [90,"Fusil à répétition","2 Lingot de Voltane, 1 Composant (Ing.), 1 Panneau (Ing.)"],
      [100,"Lingot de Silite","4 Silite"],
      [110,"Plastron léger","3 Lingot de Cendrite, 2 Cuir (Enclos), 1 Fil (Biotech)"],
      [120,"Munitions à plasma ×10","1 Lingot de Voltane, 1 Cellule d'énergie (Constr.)"],
      [130,"Carabine de précision","2 Lingot de Silite, 1 Composant (Ing.), 1 Panneau (Ing.)"],
      [140,"Jambières renforcées","2 Lingot de Silite, 2 Cuir (Enclos), 1 Panneau (Ing.)"],
      [150,"Implant de force","1 Lingot de Silite, 1 Composant (Ing.), 1 Cellule d'énergie (Constr.)"],
      [160,"Lance-flammes","2 Lingot de Voltane, 1 Biocarburant (Biotech), 1 Composant (Ing.)"],
      [170,"Plastron d'assaut","4 Lingot de Silite, 2 Panneau (Ing.), 1 Fil (Biotech)"],
      [180,"Fusil d'assaut lourd","3 Lingot de Silite, 2 Composant (Ing.), 2 Cellule d'énergie (Constr.)"],
      [190,"Implant de réflexes","1 Lingot de Silite, 2 Composant (Ing.), 1 Cellule d'énergie (Constr.)"],
      [200,"Lingot de Givrite","4 Givrite"],
      [210,"Casque de commandement","3 Lingot de Givrite, 2 Panneau (Ing.), 1 Composant (Ing.)"],
      [220,"Munitions perforantes ×10","1 Lingot de Givrite, 1 Composant (Ing.)"],
      [230,"Fusil à ions","2 Lingot de Givrite, 1 Cristal de Nyx, 2 Cellule d'énergie (Constr.)"],
      [240,"Plastron lourd","4 Lingot de Givrite, 3 Panneau (Ing.), 2 Cuir (Enclos)"],
      [250,"Gantelets de force","2 Lingot de Givrite, 1 Composant (Ing.), 1 Cellule d'énergie (Constr.)"],
      [260,"Canon à plasma","3 Lingot de Givrite, 2 Composant (Ing.), 3 Cellule d'énergie (Constr.), 1 Biocarburant (Biotech)"],
      [270,"Implant maître","1 Cristal de Nyx, 2 Composant (Ing.), 2 Cellule d'énergie (Constr.)"],
      [280,"Armure de siège","6 Lingot de Givrite, 4 Panneau (Ing.), 2 Cuir (Enclos), 2 Fil (Biotech)"],
      [290,"Lame à singularité","1 Cristal de Nyx, 1 Lingot de Givrite, 3 Cellule d'énergie (Constr.)"],
      [300,"Canon à singularité","2 Cristal de Nyx, 3 Composant (Ing.), 4 Cellule d'énergie (Constr.), 2 Panneau (Ing.)"]
    ]
  },
  ingenieur: {
    nom:"Ingénieur",
    desc:"Assemble panneaux, composants et machines. Fabrique l'Ordinateur de hacking et les drones. Ses pièces sont réclamées par tous les autres métiers.",
    recettes:[
      [0,"Panneau de Sylve","3 Sylve"],
      [10,"Composant simple","2 Voltane"],
      [20,"Circuit imprimé","2 Composant simple, 1 Voltane"],
      [30,"Câblage","2 Voltane, 1 Fil (Biotech)"],
      [40,"Panneau renforcé","2 Panneau de Sylve, 1 Lingot de Cendrite (Fab.)"],
      [50,"Drone d'éclaireur","2 Composant simple, 1 Panneau de Sylve, 1 Fil (Biotech)"],
      [60,"Ordinateur de hacking","3 Composant simple, 1 Circuit imprimé, 1 Fil (Biotech)"],
      [70,"Foreuse portable","2 Lingot de Cendrite (Fab.), 1 Composant simple"],
      [80,"Servomoteur","1 Lingot de Voltane (Fab.), 2 Composant simple, 1 Câblage"],
      [90,"Drone de récolte","2 Composant simple, 1 Servomoteur, 1 Panneau renforcé"],
      [100,"Composant avancé","2 Circuit imprimé, 1 Lingot de Voltane (Fab.)"],
      [110,"Panneau composite","2 Panneau renforcé, 1 Lingot de Silite (Fab.), 1 Fil (Biotech)"],
      [120,"Bras robotisé","2 Servomoteur, 2 Composant avancé, 1 Cellule d'énergie (Constr.)"],
      [130,"Drone de combat","2 Composant avancé, 1 Panneau composite, 1 Cellule d'énergie (Constr.)"],
      [140,"Générateur portatif","1 Lingot de Silite (Fab.), 2 Composant avancé, 1 Biocarburant (Biotech)"],
      [150,"Exosquelette léger","2 Panneau composite, 2 Servomoteur, 1 Cuir (Enclos)"],
      [160,"Tourelle automatique","2 Composant avancé, 1 Panneau composite, 2 Cellule d'énergie (Constr.)"],
      [170,"Module de téléporteur","2 Composant avancé, 1 Cristal de Nyx, 1 Cellule d'énergie (Constr.)"],
      [180,"Noyau de calcul","3 Composant avancé, 1 Circuit imprimé, 1 Cristal de Nyx"],
      [190,"Supraconducteur","2 Lingot de Givrite (Fab.), 2 Composant avancé, 1 Fil (Biotech)"],
      [200,"Panneau blindé","3 Panneau composite, 2 Lingot de Givrite (Fab.)"],
      [210,"Drone d'assaut","2 Composant avancé, 1 Supraconducteur, 2 Cellule d'énergie (Constr.)"],
      [220,"IA d'assistance","2 Noyau de calcul, 1 Cristal de Nyx, 1 Supraconducteur"],
      [230,"Exosquelette lourd","3 Panneau blindé, 2 Servomoteur, 1 Cellule d'énergie (Constr.)"],
      [240,"Bouclier déflecteur","2 Supraconducteur, 2 Composant avancé, 2 Cellule d'énergie (Constr.)"],
      [250,"Terminal de commandement","2 Noyau de calcul, 1 IA d'assistance, 2 Cellule d'énergie (Constr.)"],
      [260,"Réacteur à fusion","2 Supraconducteur, 1 Cristal de Nyx, 2 Cellule d'énergie (Constr.), 1 Biocarburant (Biotech)"],
      [270,"Noyau quantique","3 Noyau de calcul, 2 Cristal de Nyx, 1 Supraconducteur"],
      [280,"Matrice de singularité","2 Noyau quantique, 2 Cristal de Nyx, 3 Cellule d'énergie (Constr.)"]
    ]
  },
  biotech: {
    nom:"Biotech",
    desc:"Raffine la Filaine en Fil, produit soins, biocarburant et implants biologiques. Nourrit l'industrie en Fil et en Biocarburant.",
    recettes:[
      [0,"Fil (raffiné)","2 Filaine (Enclos)"],
      [10,"Biogel","3 Biofibre"],
      [20,"Ration nutritive","2 Protéines (Enclos), 1 Biofibre"],
      [30,"Kit de soin basique","2 Biogel, 1 Fil"],
      [40,"Recharge d'O₂","2 Biofibre, 1 Composant simple (Ing.)"],
      [50,"Stimulant","1 Biogel, 1 Protéines (Enclos), 1 Biofibre"],
      [60,"Antidote","2 Biogel, 1 Sylve (Bio-dôme)"],
      [70,"Boîte de soin","2 Kit de soin basique, 1 Composant simple (Ing.)"],
      [80,"Biocarburant","3 Biofibre, 1 Biogel"],
      [90,"Tank à oxygène","1 Lingot de Cendrite (Fab.), 2 Recharge d'O₂"],
      [100,"Bio-fil renforcé","3 Filaine (Enclos), 1 Biogel"],
      [110,"Sérum de régénération","2 Biogel, 1 Protéines (Enclos), 1 Composant avancé (Ing.)"],
      [120,"Kit de soin avancé","2 Boîte de soin, 1 Cellule d'énergie (Constr.)"],
      [130,"Booster de combat","2 Stimulant, 1 Composant avancé (Ing.)"],
      [140,"Combinaison pressurisée","1 Tank à oxygène, 2 Cuir (Enclos), 1 Panneau (Ing.)"],
      [150,"Biocarburant raffiné","2 Biocarburant, 1 Composant avancé (Ing.)"],
      [160,"Nano-injecteur","2 Sérum de régénération, 1 Composant avancé (Ing.), 1 Cellule d'énergie (Constr.)"],
      [170,"Ration de survie ×5","3 Protéines (Enclos), 1 Biocarburant, 1 Fil"],
      [180,"Implant biologique","1 Lingot de Silite (Fab.), 2 Sérum de régénération, 1 Cellule d'énergie (Constr.)"],
      [190,"Culture de spores","3 Biofibre, 1 Bio-fil renforcé, 1 Composant avancé (Ing.)"],
      [200,"Bio-acier","2 Lingot de Givrite (Fab.), 2 Biogel, 1 Composant avancé (Ing.)"],
      [210,"Sérum de résurrection","2 Nano-injecteur, 1 Cristal de Nyx"],
      [220,"Kit chirurgical","2 Kit de soin avancé, 1 Bio-acier, 1 Cellule d'énergie (Constr.)"],
      [230,"Combinaison de survie","1 Bio-acier, 2 Combinaison pressurisée, 1 Supraconducteur (Ing.)"],
      [240,"Booster de mutation","2 Booster de combat, 1 Culture de spores, 1 Cristal de Nyx"],
      [250,"Réacteur bio-organique","2 Biocarburant raffiné, 1 Bio-acier, 2 Cellule d'énergie (Constr.)"],
      [260,"Organe synthétique","2 Bio-acier, 2 Sérum de régénération, 1 Composant avancé (Ing.)"],
      [270,"Nano-essaim médical","2 Nano-injecteur, 1 Noyau de calcul (Ing.), 1 Cellule d'énergie (Constr.)"],
      [280,"Symbiote parfait","2 Organe synthétique, 2 Cristal de Nyx, 3 Cellule d'énergie (Constr.)"]
    ]
  },
  constructeur: {
    nom:"Constructeur de vaisseaux",
    desc:"Produit les Cellules d'énergie (utilisées par tous) puis coques, moteurs et châssis. C'est la voie qui mène jusqu'à l'espace.",
    recettes:[
      [0,"Cellule d'énergie","2 Voltane, 1 Composant simple (Ing.)"],
      [10,"Batterie compacte","2 Cellule d'énergie, 1 Lingot de Voltane (Fab.)"],
      [20,"Plaque de coque","2 Lingot de Cendrite (Fab.), 1 Panneau de Sylve (Ing.)"],
      [30,"Réservoir","2 Lingot de Cendrite (Fab.), 1 Biocarburant (Biotech)"],
      [40,"Propulseur d'appoint","2 Cellule d'énergie, 1 Composant simple (Ing.), 1 Réservoir"],
      [50,"Cellule d'énergie renforcée","3 Cellule d'énergie, 1 Lingot de Silite (Fab.)"],
      [60,"Train d'atterrissage","3 Plaque de coque, 2 Servomoteur (Ing.)"],
      [70,"Cockpit léger","2 Plaque de coque, 1 Panneau renforcé (Ing.), 1 Cellule d'énergie"],
      [80,"Moteur ionique","2 Cellule d'énergie renforcée, 1 Composant avancé (Ing.), 1 Biocarburant (Biotech)"],
      [90,"Navette légère (châssis)","4 Plaque de coque, 1 Cockpit léger, 1 Moteur ionique"],
      [100,"Bloc de propulsion","2 Moteur ionique, 1 Réservoir, 1 Composant avancé (Ing.)"],
      [110,"Coque blindée","3 Plaque de coque, 1 Panneau composite (Ing.), 1 Lingot de Silite (Fab.)"],
      [120,"Bouclier de vaisseau","2 Cellule d'énergie renforcée, 1 Supraconducteur (Ing.)"],
      [130,"Soute cargo","3 Coque blindée, 2 Panneau composite (Ing.)"],
      [140,"Système de survie","1 Tank à oxygène (Biotech), 2 Composant avancé (Ing.), 1 Cellule d'énergie renforcée"],
      [150,"Réacteur de saut","2 Moteur ionique, 1 Cristal de Nyx, 2 Biocarburant (Biotech)"],
      [160,"Cockpit blindé","2 Coque blindée, 1 Système de survie, 1 Panneau composite (Ing.)"],
      [170,"Tourelle de vaisseau","2 Cellule d'énergie renforcée, 1 Tourelle automatique (Ing.), 1 Coque blindée"],
      [180,"Cargo (châssis)","6 Coque blindée, 1 Bloc de propulsion, 1 Soute cargo, 1 Cockpit blindé"],
      [190,"Cellule à fusion","2 Cellule d'énergie renforcée, 1 Réacteur à fusion (Ing.)"],
      [200,"Coque composite lourde","3 Coque blindée, 2 Panneau blindé (Ing.), 1 Bio-acier (Biotech)"],
      [210,"Propulseur à fusion","2 Bloc de propulsion, 1 Cellule à fusion, 1 Supraconducteur (Ing.)"],
      [220,"Bouclier déflecteur de vaisseau","2 Bouclier de vaisseau, 1 Bouclier déflecteur (Ing.), 2 Cellule à fusion"],
      [230,"Réacteur à distorsion","2 Réacteur de saut, 1 Réacteur à fusion (Ing.), 1 Cristal de Nyx"],
      [240,"Frégate (châssis)","8 Coque composite lourde, 1 Propulseur à fusion, 2 Tourelle de vaisseau, 1 Cockpit blindé"],
      [250,"Noyau de vaisseau","2 Cellule à fusion, 1 Noyau de calcul (Ing.), 1 Cristal de Nyx"],
      [260,"Canon de vaisseau","2 Cellule à fusion, 1 Canon à ions (Fab.), 1 Supraconducteur (Ing.)"],
      [270,"Réacteur à singularité","2 Réacteur à distorsion, 2 Cristal de Nyx, 1 Matrice de singularité (Ing.)"],
      [280,"Vaisseau amiral","1 Frégate (châssis), 1 Réacteur à singularité, 2 Noyau de vaisseau, 4 Cristal de Nyx"]
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
