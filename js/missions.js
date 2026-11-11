/* ===========================================================
   MISSIONS — quêtes de groupe (v1.61, brique 3 : client du moteur).
   Serveur : v182 (socle) + v183 (coffre, épreuve, récompenses) — BACKEND_PLAN
   §79-80. Cadrage : PASSATION G et H (H1-H18).
   Le serveur fait foi : ce module ne fait que LIRE `missions_lire()` et
   appeler les RPC. Rien n'est écrit dans `donnees` (les groupes, le coffre et
   les gains sont des tables serveur).
   Sous-onglet « Missions » du lieu Quêtes (quetes.js : majQueteHub).
   H18 : le lien Quêtes s'affiche PARTOUT dès qu'on a une affaire de mission en
   cours (groupe, invitation, gain) — `missionsAffaireEnCours()`, lue par majHub.
   H12 : seul le LIBELLÉ de la mesure est montré, jamais une force.
   =========================================================== */
const MISSION_RANGS  = { facile:"Facile", rude:"Rude", redoutable:"Redoutable", extreme:"Extrême" };   // G5, H13
const MISSION_MESURE = { facile:"plutôt facile", equilibree:"équilibrée", difficile:"difficile" };     // G6, H12
const MISSION_POSTES = { encordeur:"Encordeur", eclaireur:"Éclaireur", dechiffreur:"Déchiffreur",
                         artificier:"Artificier", porteur:"Porteur", crocheteur:"Crocheteur", guetteur:"Guetteur",
                         hacker:"Hacker", ingenieur:"Ingénieur", artilleur:"Artilleur" };
/* v2.10 — ce que fait chaque poste (retour de l'autrice : « que les joueurs comprennent ce qu'ils font »).
   Montré au choix du poste (ceux de la mission seulement), puis le seul sien une fois parti. */
const MISSION_POSTES_DESC = {
  encordeur:  "Pendant la descente, il tient la corde : trois nœuds à suivre du doigt, sans lever ni sortir du tracé.",
  eclaireur:  "Pendant la descente, il trouve le passage dans le noir, en un nombre de pas compté.",
  dechiffreur:"Pendant la descente, il lit le signal de la balise, écrit dans l'ancien, et trouve le son qui manque.",
  artificier: "À l'entrepôt, il ouvre la brèche : il place ses charges pour faire sauter tous les piliers de la paroi.",
  porteur:    "Une fois la brèche ouverte, chaque porteur range une caisse, avec le moins de vide possible.",
  crocheteur: "Le jour du casse, il ouvre la serrure : cinq goupilles à bloquer quand le curseur passe dans le vert.",
  guetteur:   "Le jour du casse, il brouille les drones : il cale son onde sur la leur, cinq secondes en tout.",
  artilleur:  "Quand l'escorte attaque, chaque artilleur abat les sondes qui traversent l'écran.",
  ingenieur:  "L'escorte repoussée, il ouvre le sas : une combinaison de quatre voyants à trouver.",
  hacker:     "Le sas ouvert, il pirate le cœur de Bardane : un chemin lumineux à mémoriser puis à refaire."
};
/* v2.17 (K135) — CHAQUE ESSAI D'UN JEU DE POSTE COÛTE DE L'ÉNERGIE : 10 %, réduits par l'Endurance,
   la zone et les boissons comme tout geste (aptEnergieAction), débités par le serveur (agir, motif
   « mission_essai »). Pas de limite de temps : on recommence autant qu'on veut, chaque fois en payant.
   Deux façons de payer, selon le jeu :
   · une PORTE « Tenter » (nœud, crevasse, goupilles, sas) : le jeu s'affiche une fois l'essai payé, et
     se referme à la fin de l'essai (réussi ou raté) ;
   · au geste qui ENGAGE (le message, la paroi, le rangement, le brouillage, le tir, le cœur) : le coût
     est écrit sur le bouton. */
const MISSION_ESSAI = 10;
let _mEssais = {};                                   // jeu → true : un essai payé, en cours
function _mEssaiCout(){ return (typeof aptEnergieAction === "function") ? aptEnergieAction(MISSION_ESSAI) : MISSION_ESSAI; }
async function _mEssaiPayer(){
  if(typeof agirServeur !== "function") return true;
  const r = await agirServeur({ cout:_mEssaiCout(), motif:"mission_essai" });
  return !!r;                                        // refus (énergie…) : agirServeur l'a déjà dit au journal
}
function _mEssaiFin(jeu){ delete _mEssais[jeu]; }
function _mEssaiPorte(jeu, mid, html){
  if(_mEssais[jeu]) return html;
  return `<div class="mi-essai"><button class="mini" data-mi-essai="${jeu}">Tenter · ${_mEssaiCout()} % d'énergie</button>
    <p class="vide" style="margin:4px 0 0">Chaque essai coûte de l'énergie. Prends tout le temps qu'il te faut.</p></div>`;
}
const MISSION_OMBRE = "Sans poste, tu n'as pas de jeu à toi : tu comptes dans l'épreuve finale avec tout le groupe.";
/* v2.10 — l'étape en cours, une seule à la fois (affichée en tête de la mission). */
/* v2.21 — « pas avant demain » était FIGÉ : le lendemain, il contredisait « Seconde tentative : du lundi
   2 au mardi 3 » (retour d'une testeuse). Le moment est calculé à partir du jour de l'échec. */
function _mQuandRetenter(v){
  const auj = String(_missions && _missions.jour).slice(0, 10), j = String(v && v.epreuve_jour || "").slice(0, 10);
  if(!j || j >= auj) return "pas avant demain";
  return `dès aujourd'hui, et jusqu'au ${_mJourTxt(v.epreuve_jour, 2)}`;
}
/* v2.69 (K233) — chaque étape : un petit récit (ce qui se passe, pourquoi), puis une ligne pratique (quoi faire). */
function _mEtape(titre, texte, pratique){ return `<div class="mi-etape"><b>${titre}</b>${texte}${pratique ? `<span class="mi-pratique">${pratique}</span>` : ""}</div>`; }
const MISSION_ERREURS = {
  non_connecte:"Connexion perdue.", deja:"Tu as déjà pris part à cette mission.", plein:"Ce groupe est complet.",
  ferme:"Ce groupe est fermé : on n'y entre que sur invitation.", parti:"Ce groupe est déjà parti.",
  recrutement_clos:"Le recrutement est terminé.", groupe:"Ce groupe n'existe plus.", mission:"Cette mission n'est plus là.",
  pas_fondateur:"Seul le meneur du groupe peut faire cela.", inconnu:"Aucun joueur ne porte ce nom.",
  ambigu:"Plusieurs joueurs portent ce nom.", soi_meme:"Tu ne peux pas t'inviter toi-même.",
  deja_invite:"Ce joueur est déjà invité.", test:"Ce compte ne fait pas partie de ce test.",
  cible_niveau:"Ce joueur n'a pas le niveau requis.", cible_pause:"Ce joueur est en pause.",
  cible_mort:"Ce joueur ne peut pas venir.", cible_faction:"Ce joueur n'a pas de faction.",
  cible_intrusion:"Ce joueur ne remplit pas les conditions.",
  niveau:"Tu n'as pas le niveau requis.", pause:"Impossible pendant une pause.", mort:"Impossible pour l'instant.",
  faction:"Il faut appartenir à une faction.", intrusion:"Tu ne remplis pas les conditions.",
  poste:"Ce poste n'existe pas dans cette mission.", poste_pris:"Ce poste est déjà pris.",
  pas_membre:"Tu n'es pas dans ce groupe.", fini:"Cette mission est terminée pour ton groupe.",
  pas_parti:"Le coffre s'ouvre au départ du groupe.", scelle:"Le coffre est scellé : l'épreuve a commencé.",
  hors_liste:"Cette mission ne demande pas cet objet.", complet:"Le coffre n'en a plus besoin.",
  manque:"Tu n'as pas cet objet dans ton sac.", objet_lie:"Cet objet ne quitte pas ton sac.", quantite:"Quantité invalide.",
  sac_plein:"Ton sac est plein : fais de la place pour le récupérer.", perdu:"Trop tard : l'objet est perdu.",
  recupere:"Déjà récupéré.", gain:"Cet objet n'est plus là.", secrete:"Impossible.",
  // v1.63 — la bouture
  pas_en_cours:"Ta mission n'est pas en cours.", pas_sur_place:"Il faut être sur Mousseron.",
  phase:"Ce n'est plus le moment.", trop_tard:"Trop tard : le délai est passé.",
  pas_de_soin:"Pas de soin à donner aujourd'hui.", deja_soigne:"Tu as déjà soigné la bouture aujourd'hui.",
  pas_relie:"Les racines n'atteignent pas l'eau.", trop:"Trop de bouts de racine.",
  caillou:"On ne pose pas de racine sur un caillou.", pieces:"Tracé invalide.",
  energie:"Pas assez d'énergie.", prison:"Impossible depuis la prison.", objet_personnel:"Cet objet est personnel : il ne se vend pas et ne se donne pas.",
  // v1.64 — la balise
  postes:"Tous les postes de la mission ne sont pas tenus.", minimum:"Le minimum de matériel n'est pas réuni.",
  // v2.10 — les postes se figent au départ (K130)
  poste_fige:"Ton poste est fixé depuis le départ du groupe.", postes_vides:"Chaque poste doit avoir quelqu'un avant de partir.",
  deja_fait:"Ton poste est déjà fait pour cette descente.", perdu:"Tu t'es perdu dans le noir : un autre passage s'ouvre.",
  faux:"Ce n'est pas ça : la balise répète un autre message.", postes_pas_faits:"Les trois postes ne sont pas encore faits.",
  demain:"La seconde descente se fera demain.", mur:"Un mur de glace.",
  // v1.65 — l'infiltration
  tient:"La paroi tient. Une autre paroi, une autre chance.", charges:"Place au moins une charge.",
  // v1.67 — le casse
  cible_figee:"Le repérage est fait : la cible ne change plus.", cite:"Cité inconnue.", pas_de_cible:"Choisissez d'abord la cité visée.",
  pas_de_reperage:"Il faut d'abord faire le repérage.", equipe:"Toute l'équipe doit être dans la cité visée.", evente:"Le casse est éventé.",
  loin:"Une caisse d'AREPO s'ouvre chez soi : rentre dans ta cité de faction.", objet:"Objet inconnu."
};

let _missions = null;           // dernier missions_lire() : { ok, jour, missions[], gains[] }
let _missionsEnVol = false;
let _missionsAffaire = false;   // dernière valeur connue de missionsAffaireEnCours()

/* ---------- Lecture ---------- */
async function missionsCharger(){
  if(_missionsEnVol || typeof sb === "undefined") return _missions;
  _missionsEnVol = true;
  try{
    const { data, error } = await sb.rpc("missions_lire");
    if(!error && data && data.ok){
      /* v2.65 (K223) — qui a déposé quoi dans chaque coffre commun (mission_coffre_qui, v278). */
      await Promise.all((data.missions || []).filter(m => m.coffre && !m.coffre.vide).map(async m => {
        try{ const q = await sb.rpc("mission_coffre_qui", { p_mission:m.id });
             if(!q.error && q.data && q.data.ok) m.coffre_qui = q.data.qui; }catch(e){}
      }));
      _missions = data;
    }
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "missions.js#lire"); }
  finally{ _missionsEnVol = false; }
  // H18 : l'onglet Quêtes apparaît / disparaît selon les affaires en cours.
  const aff = missionsAffaireEnCours();
  if(aff !== _missionsAffaire){ _missionsAffaire = aff; if(typeof majHub === "function") majHub(); }
  return _missions;
}

/* Redessine l'onglet Missions s'il est affiché — sauf si le joueur est en train
   de taper (nom à inviter, quantité à déposer) : on ne lui vole pas sa saisie. */
function missionsRedessiner(){
  const h = document.querySelector("#hub-quete"); if(!h || h.hidden) return;
  if(!h.querySelector('[data-qsous="missions"].actif')) return;
  const a = document.activeElement;
  if(a && h.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return;
  if(typeof majQueteHub === "function") majQueteHub(true);   // v2.12 : pas en pleine partie, pas si rien n'a changé
}

function _missionGroupe(m){ return m && m.mon_groupe ? (m.groupes || []).find(g => g.id === m.mon_groupe) : null; }

/* H18 : groupe en formation ou parti, invitation, gain à récupérer. */
function missionsAffaireEnCours(){
  if(!_missions || !_missions.ok) return false;
  if((_missions.gains || []).length) return true;
  return (_missions.missions || []).some(m => {
    if((m.invitations || []).length && m.statut === "recrutement") return true;
    const g = _missionGroupe(m);
    return !!(g && m.mon_statut === "actif" && (g.statut === "formation" || g.statut === "lance"));
  });
}

/* ---------- Appels ---------- */
async function _missionAppel(nom, args, okTexte){
  try{
    const { data, error } = await sb.rpc(nom, args || {});
    if(error){ journal("Échec : " + error.message, "alerte", "quete"); return null; }
    if(!data || data.ok === false){
      const err = data && data.err;
      let t = MISSION_ERREURS[err] || ("Impossible (" + (err || "?") + ").");
      if(err === "trop_peu") t = `Pas encore assez de membres : il en faut ${data.min} (vous êtes ${data.nb}).`;
      if(err === "demain") t = "La seconde tentative s'ouvre demain.";
      if(err === "postes") t = _mPostesManquants(args);
      if(err === "postes_vides" && data.manques) t = `Il manque encore ${_mManquesTexte(data.manques)} avant de partir.`;   // v2.67 (K227)   // v2.66 : la phrase de la balise s'affichait pour toutes les missions
      journal(t, "alerte", "quete");
      return data;
    }
    if(data.etat && typeof _appliquerEtatStocks === "function"){ _appliquerEtatStocks(data.etat); if(typeof afficher === "function") afficher(); }
    if(okTexte){ const tx = typeof okTexte === "function" ? okTexte(data) : okTexte; if(tx) journal(tx, "gain", "quete"); }   // v2.68 : rien si le texte est vide
    return data;
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "missions.js#" + nom); return null; }
  finally{ await missionsCharger(); if(typeof majQueteHub === "function") majQueteHub(); }
}

/* v2.66 — « Il faut un encordeur, un éclaireur et un déchiffreur » s'affichait aussi au satellite
   (retour d'une testeuse) : le refus `postes` du serveur est commun à toutes les missions. On dit
   désormais quels postes de CETTE mission ne sont tenus par personne. */
function _mMissionDeArgs(a){
  const L = (_missions && _missions.missions) || [];
  if(a && a.p_mission) return L.find(m => m.id === +a.p_mission) || null;
  if(a && a.p_groupe) return L.find(m => (m.groupes || []).some(g => g.id === +a.p_groupe)) || null;
  return null;
}
/* v2.67 (K226 → K228) — le minimum et le maximum de chaque poste (mission_types.postes_min, v279). */
function _mPosteMin(m, p){ return (m.postes_min && m.postes_min[p] != null) ? +m.postes_min[p] : 1; }
function _mPosteMax(m, p){ return (m.postes && m.postes[p] != null) ? +m.postes[p] : 1; }
function _mPostesCompte(g){ const c = {}; (g && g.membres || []).filter(y => y.statut === "actif" && y.poste).forEach(y => c[y.poste] = (c[y.poste] || 0) + 1); return c; }
function _mManques(m, g){   // {poste: nombre manquant}
  const c = _mPostesCompte(g), r = {};
  Object.keys(m.postes || {}).forEach(p => { const n = _mPosteMin(m, p) - (c[p] || 0); if(n > 0) r[p] = n; });
  return r;
}
function _mManquesTexte(manques){
  return Object.entries(manques).map(([p, n]) => { const nom = (MISSION_POSTES[p] || p).toLowerCase(); return `${n} ${nom}${n > 1 ? "s" : ""}`; }).join(", ");
}
function _mPostesFiche(m){   // « Artilleur 2 · Ingénieur 1 · Hacker 1 » ; « Porteur 2 à 4 »
  return Object.keys(m.postes || {}).map(p => { const a = _mPosteMin(m, p), b = _mPosteMax(m, p);
    return `${MISSION_POSTES[p] || p} ${a === b ? a : `${a} à ${b}`}`; }).join(" · ");
}
function _mPostesManquants(a){
  const m = _mMissionDeArgs(a), g = m && _missionGroupe(m);
  if(!m || !g) return MISSION_ERREURS.postes;
  const manques = _mManques(m, g);
  if(!Object.keys(manques).length) return MISSION_ERREURS.postes;
  const un = Object.keys(manques).length === 1 && Object.values(manques)[0] === 1;
  return `Il manque ${_mManquesTexte(manques)}. Un membre du groupe doit ${un ? "prendre ce poste" : "prendre ces postes"} (« Ton poste », dans la mission).`;
}

/* ---------- Mise en forme ---------- */
function _mNomItem(id){ const it = (typeof item === "function") ? item(id) : null; return (it && it.nom) || id; }
function _mRecettes(recs){
  return (recs || []).map(r => Object.entries(r).map(([k, q]) => `${q} ${echapper(_mNomItem(k))}`).join(" + ")).join(" <i>ou</i> ");
}
function _mJourTxt(iso, decalage){
  if(!iso) return "";
  const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); d.setDate(d.getDate() + (decalage || 0));
  return d.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
}
/* `recrutement_fin` = premier jour où le recrutement est CLOS : le dernier jour est la veille. */
function _mDernierJour(fin){
  if(!fin) return "";
  const d = new Date(fin + "T12:00:00"); d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
}
function _mRestant(iso){
  const ms = new Date(iso).getTime() - Date.now(); if(!(ms > 0)) return "bientôt";
  const h = Math.floor(ms / 3600e3); if(h >= 24) return `${Math.floor(h / 24)} j ${h % 24} h`;
  return `${h} h ${Math.floor((ms % 3600e3) / 60e3)} min`;
}

/* v2.14 (v237, K132) — LE FIL DE LA MISSION : tout ce que le groupe a fait, le plus récent en
   haut (20 lignes au plus, envoyées par missions_lire). Le journal personnel ne garde que
   l'essentiel. Replié par défaut ; il se souvient d'être ouvert. */
let _mFilOuvert = {};
function _mFilQuand(iso){
  const d = new Date(iso); if(isNaN(d)) return "";
  const j = x => x.toLocaleDateString("fr-FR"), auj = new Date(), hier = new Date(Date.now() - 864e5);
  const h = d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
  return j(d) === j(auj) ? h : j(d) === j(hier) ? `hier ${h}` : `${d.toLocaleDateString("fr-FR", { day:"numeric", month:"short" })} ${h}`;
}
function _mFil(m){
  const L = (m.fil || []).slice().reverse();
  if(!L.length) return "";
  const txt = t => { let x = echapper(t || ""); if(typeof rendreLibelles === "function") x = rendreLibelles(x); return x; };
  return `<details class="mi-fil" data-mi-fil="${m.id}"${_mFilOuvert[m.id] ? " open" : ""}><summary>Le fil de la mission <span class="vide">(${L.length}${L.length >= 20 ? ", les plus récents" : ""})</span></summary>
    <ol>${L.map(x => `<li><span class="mi-fil-q">${_mFilQuand(x.q)}</span> ${txt(x.t)}</li>`).join("")}</ol></details>`;
}
function _mTitre(m){
  if(m.secrete && !m.revele) return m.mon_groupe ? "Un pli sans signature" : "Un mot glissé à voix basse";
  return echapper(m.nom || "Mission");
}

/* ---------- Rendu du sous-onglet ---------- */
function majMissions(z){
  if(!z) return;
  if(!_missions){
    z.innerHTML = `<p class="vide">Chargement des missions…</p>`;
    missionsCharger().then(() => { if(_missions && typeof majQueteHub === "function") majQueteHub(); });
    return;
  }
  let h = "";
  // Gains en attente (H15).
  for(const g of (_missions.gains || [])){
    h += `<div class="quete-etape mi-gain"><p style="margin:0 0 6px"><b>À récupérer :</b> ${g.qte} × ${echapper(_mNomItem(g.item))}
      <span class="vide">— mission « ${echapper(g.mission || "?")} » · encore ${_mRestant(g.expire_le)}</span></p>
      <button class="mini" data-mi-gain="${g.id}">Récupérer</button></div>`;
  }
  const liste = _missions.missions || [];
  if(!liste.length && !(_missions.gains || []).length){
    z.innerHTML = `<p class="vide">Aucune mission pour l'instant. Quand une mission surgit, ton journal te prévient.</p>`;
    return;
  }
  for(const m of liste) h += _mCarte(m);
  z.innerHTML = h;
  _mBrancher(z);
}

function _mCarte(m){
  const g = _missionGroupe(m);
  const enGroupe = !!(g && m.mon_statut === "actif" && (g.statut === "formation" || g.statut === "lance"));
  let h = `<div class="mi-carte">`;
  // v1.74 — bannière de la mission (images/missions/<type>.png ; le casse non
  // révélé montre le pli). Absente → rien (pas de cadre vide).
  const ban = (m.secrete && !m.revele) ? "casse_pli" : m.type;
  h += `<div class="lieu-banniere mi-banniere"><img src="images/missions/${ban}.png" alt="" onerror="this.parentElement.remove()"></div>`;
  h += `<h3 style="margin:2px 0">${_mTitre(m)}${m.test ? ` <span class="mi-test">TEST</span>` : ""}</h3>`;
  if(m.difficulte){
    h += `<p class="vide" style="margin:0 0 8px">${MISSION_RANGS[m.difficulte] || m.difficulte} · niveau ${m.niveau_min} · groupe de ${m.taille_min}${m.taille_max > m.taille_min ? " à " + m.taille_max : ""}`;
    // v1.73b : plus de date de recrutement une fois MON groupe parti (il n'en a plus besoin).
    if(m.statut === "recrutement" && !(g && g.statut === "lance")) h += ` · recrutement jusqu'au ${_mDernierJour(m.recrutement_fin)} inclus`;
    h += `</p>`;
    // v2.67 (K226) : combien de chaque poste, dès la fiche.
    if(Object.keys(m.postes || {}).length) h += `<p class="vide" style="margin:-4px 0 8px">Postes : ${_mPostesFiche(m)}. On ne part pas tant que chaque poste n'a pas son nombre ; les membres en plus partent sans poste.</p>`;
  }
  if(m.intro) h += `<p class="quete-indice" style="margin:0 0 10px">${echapper(m.intro)}</p>`;   // v1.63
  // Casse : les mots de C20, tant qu'il n'est pas révélé.
  if(m.secrete && !m.revele){
    if(m.mon_groupe) h += `<div class="quete-etape"><p class="quete-indice">« Un marché de Silène dort mal. Il lui faut des ombres pour le réveiller. Trouve tes complices : tu as cinq jours. »</p></div>`;
  }
  // Invitations reçues.
  for(const inv of (m.invitations || [])){
    h += `<div class="quete-etape"><p style="margin:0 0 6px">${m.secrete
          ? `${echapper(inv.par || "?")} t'a fait passer un mot, à voix basse : « J'ai besoin d'une ombre de plus. Tu en es ? »`
          : `<b>${echapper(inv.par || "?")}</b> t'invite dans son groupe.`}</p>
      <button class="mini" data-mi-inv="${inv.groupe}" data-mi-rep="1">Accepter</button>
      <button class="mini danger" data-mi-inv="${inv.groupe}" data-mi-rep="0">Refuser</button></div>`;
  }
  if(enGroupe) h += _mMonGroupe(m, g) + _mFil(m);
  else if(m.deja && g){
    const issue = { reussi:"réussie", rate:"ratée", lance:"en cours" }[g.statut] || "terminée";
    h += `<p class="vide">Tu as pris part à cette mission (${m.mon_statut === "abandon" ? "abandonnée" : issue}). Tu attendras la prochaine.</p>`;
    // v2.11 (v235) : une mission finie ne reste affichée que si quelque chose t'y attend.
    if(g.statut === "reussi" || g.statut === "rate"){
      // v2.24 (K142) : la mission reste une journée ; un gain en attente la garde jusqu'à ce qu'il soit pris.
      const gain = ((_missions && _missions.gains) || []).some(x => x.mission === m.nom);
      h += gain ? `<p class="vide">Récupère ce qui t'attend, en haut de la liste : la mission disparaîtra ensuite.</p>`
                : `<p class="vide">Elle restera ici jusqu'à demain, le temps de relire son fil.</p>`;
    }
    h += _mFil(m);
  } else if(!m.secrete && m.statut === "recrutement"){
    if(m.refus) h += `<p class="vide">${m.refus === "niveau" ? `Il faut le niveau ${m.niveau_min} pour cette mission.` : (MISSION_ERREURS[m.refus] || "Tu ne peux pas y prendre part.")}</p>`;
    else h += `<div class="mi-btns"><button class="mini" data-mi-creer="${m.id}" data-mi-ouvert="1">Fonder un groupe ouvert</button>
               <button class="mini" data-mi-creer="${m.id}" data-mi-ouvert="0">Fonder un groupe fermé</button></div>`;
    const autres = (m.groupes || []).filter(x => x.id !== m.mon_groupe);
    if(autres.length){
      h += `<h4 class="gsec">Groupes</h4>`;
      for(const x of autres){
        const nb = (x.membres || []).filter(y => y.statut === "actif").length;
        const invite = (m.invitations || []).some(i => i.groupe === x.id);   // v1.90 : « Accepter » suffit, pas de doublon
        const peut = !m.refus && !m.mon_groupe && !invite && x.statut === "formation" && x.ouvert && nb < m.taille_max;
        h += `<div class="mi-ligne"><span>${echapper(x.fondateur || "?")} · ${nb}/${m.taille_max} · ${x.statut === "formation" ? (x.ouvert ? "ouvert" : "fermé") : "parti"}</span>
              ${peut ? `<button class="mini" data-mi-rejoindre="${x.id}">Rejoindre</button>` : ""}</div>`;
      }
    } else h += `<p class="vide">Aucun groupe pour l'instant.</p>`;
  } else if(m.statut !== "recrutement" && !m.mon_groupe){
    h += `<p class="vide">Le recrutement est terminé.</p>`;
  }
  return h + `</div>`;
}

function _mMonGroupe(m, g){
  const actifs = (g.membres || []).filter(y => y.statut === "actif");
  let h = `<h4 class="gsec">Ton groupe — ${g.statut === "formation" ? (g.ouvert ? "en formation, ouvert" : "en formation, fermé") : "parti"}</h4>`;
  h += `<div class="mi-membres">${(g.membres || []).map(y => `<span class="mi-membre${y.statut !== "actif" ? " mi-abandon" : ""}">${echapper(y.nom)}${y.poste ? ` · ${MISSION_POSTES[y.poste] || y.poste}` : ""}${y.statut !== "actif" ? " (a abandonné)" : ""}</span>`).join("")}</div>`;
  if(m.mesure) h += `<p style="margin:8px 0">L'épreuve sera <b>${MISSION_MESURE[m.mesure] || m.mesure}</b> pour ce groupe.</p>`;
  // Postes (G11, C16).
  const postes = Object.keys(m.postes || {});
  /* v2.10 (K130) — les postes se choisissent avant le départ, puis se figent. Après le départ,
     un poste resté libre peut encore être pris ; un membre qui abandonne libère le sien. */
  const tenus = new Set(actifs.map(y => y.poste).filter(Boolean));
  if(postes.length){
    const cpt = _mPostesCompte(g);   // v2.67 : tant qu'il reste de la place (deux artilleurs au satellite)
    const libres = postes.filter(p => (cpt[p] || 0) < _mPosteMax(m, p) || p === m.mon_poste);
    if(g.statut === "formation"){
      h += `<div class="mi-ligne"><span>Ton poste :</span><select id="mi-poste" data-mi-mission="${m.id}"><option value="">— aucun —</option>${postes.map(p => `<option value="${p}"${m.mon_poste === p ? " selected" : ""}>${MISSION_POSTES[p] || p}</option>`).join("")}</select></div>`;
      h += `<div class="mi-postes">${postes.map(p => `<p><b>${MISSION_POSTES[p] || p}</b> — ${MISSION_POSTES_DESC[p] || ""}</p>`).join("")}<p class="vide">${MISSION_OMBRE} Les postes se figent au départ du groupe. Chaque essai d'un jeu de poste coûte ${_mEssaiCout()} % d'énergie.</p></div>`;
    } else if(m.mon_poste){
      h += `<p style="margin:6px 0">Ton poste : <b>${MISSION_POSTES[m.mon_poste] || m.mon_poste}</b></p>`;   // v2.68 : « (fixé depuis le départ) » retiré
      if(MISSION_POSTES_DESC[m.mon_poste]) h += `<p class="vide" style="margin:0 0 6px">${MISSION_POSTES_DESC[m.mon_poste]}</p>`;
    } else if(libres.length){
      h += `<div class="mi-ligne"><span>Un poste est resté libre :</span><select id="mi-poste" data-mi-mission="${m.id}"><option value="">— aucun —</option>${libres.map(p => `<option value="${p}">${MISSION_POSTES[p] || p}</option>`).join("")}</select></div>`;
      h += `<div class="mi-postes">${libres.map(p => `<p><b>${MISSION_POSTES[p] || p}</b> — ${MISSION_POSTES_DESC[p] || ""}</p>`).join("")}<p class="vide">Une fois pris, il ne change plus.</p></div>`;
    } else h += `<p class="vide" style="margin:6px 0">${MISSION_OMBRE}</p>`;
  }
  if(g.statut === "formation" && m.type === "casse" && m.revele){   // v1.67 (H58) ; v2.10 : la cité choisie reste affichée
    if(g.moi_fondateur) h += _mCasseCibleHtml(m, m.cible);
    else h += `<p style="margin:6px 0">Cité visée : <b>${m.cible ? echapper(_mFacNom(m.cible)) : "pas encore choisie par le meneur"}</b></p>`;
  }
  if(g.statut === "formation" && g.moi_fondateur){
    h += `<div class="mi-ligne"><input id="mi-inv-nom" placeholder="Nom du joueur à inviter" maxlength="40">
          <button class="mini" data-mi-inviter="${g.id}">Inviter</button></div>`;
    if((g.invites || []).length) h += `<p class="vide" style="margin:2px 0">Invités : ${g.invites.map(echapper).join(", ")}</p>`;
    const manques = _mManques(m, g);                                 // v2.67 (K227) : le minimum de chaque poste
    const ok = actifs.length >= m.taille_min && !Object.keys(manques).length;
    const pourquoi = actifs.length < m.taille_min ? `Il faut au moins ${m.taille_min} membres.`
                   : Object.keys(manques).length ? `Il manque ${_mManquesTexte(manques)}.` : "";
    h += `<div class="mi-btns"><button class="mini" data-mi-lancer="${g.id}"${ok ? "" : " disabled"}>Partir</button>
          ${pourquoi ? `<span class="vide">${pourquoi}</span>` : ""}</div>`;
  } else if(g.statut === "formation"){
    h += `<p class="vide">Le meneur donnera le départ. À la fin du recrutement, le groupe part de lui-même s'il est assez nombreux.</p>`;
  }
  if(g.statut === "lance" && m.vue && m.type === "bouture") h += _mBouture(m);   // v1.63
  else if(g.statut === "lance" && m.vue && m.type === "balise") h += _mBalise(m);   // v1.64
  else if(g.statut === "lance" && m.vue && m.type === "infiltration") h += _mInfiltration(m);   // v1.65
  else if(g.statut === "lance" && m.vue && m.type === "casse") h += _mCasse(m, g);   // v1.67
  else if(g.statut === "lance" && m.vue && m.type === "satellite") h += _mSatellite(m);   // v1.68
  else if(g.statut === "lance") h += _mCoffre(m) + _mEpreuve(m);
  h += `<div class="mi-btns" style="margin-top:8px">${g.statut === "formation"
        ? `<button class="mini danger" data-mi-quitter="${m.id}">Quitter le groupe</button>`
        : `<button class="mini danger" data-mi-abandon="${m.id}">Abandonner la mission</button>`}</div>`;
  return h;
}

function _mCoffre(m){
  const c = m.coffre; if(!c || c.vide) return "";
  let h = `<h4 class="gsec">Coffre commun${c.scelle ? " — scellé" : ""}</h4><table class="mi-coffre"><tbody>`;
  const objets = new Set();
  for(const s of (c.sortes || [])){
    (s.recettes || []).forEach(r => Object.keys(r).forEach(k => objets.add(k)));
    const ok = s.unites >= s.min;
    // v2.10 — en clair (retour de l'autrice : « 0 / 2–6 » ne se comprenait pas).
    const n = ok ? `${s.unites} ✓${s.unites < s.max ? `<br><span class="vide">jusqu'à ${s.max}</span>` : `<br><span class="vide">complet</span>`}`
                 : `${s.unites} sur ${s.min}<br><span class="vide">il en manque ${s.min - s.unites}</span>`;
    h += `<tr><td><b>${echapper(s.nom || s.id)}</b><br><span class="vide">${_mRecettes(s.recettes)}</span></td>
          <td class="mi-n${ok ? "" : " mi-manque"}">${n}</td></tr>`;
  }
  h += `</tbody></table>`;
  h += `<p class="vide" style="margin:4px 0">${c.minimum ? "Le minimum est réuni." : "Le minimum n'est pas encore réuni."} Il faut au moins le minimum de chaque sorte ; au-delà, chaque unité de plus rend l'épreuve plus facile, jusqu'au maximum. Tout est consommé à la fin ; en cas de réussite, chacun est remboursé de ce qu'il a déposé.</p>`;
  const mes = Object.entries(c.mes_depots || {});
  if(mes.length) h += `<p class="vide" style="margin:2px 0">Tes dépôts : ${mes.map(([k, q]) => `${q} × ${echapper(_mNomItem(k))}`).join(", ")}</p>`;
  /* v2.65 (K223) — qui a déposé quoi (tout le groupe). */
  const qui = m.coffre_qui || [];
  if(qui.length) h += `<p style="margin:8px 0 2px"><b>Qui a déposé quoi</b></p><table class="mi-coffre mi-qui"><tbody>${qui.map(x =>
    `<tr><td><b>${echapper(x.nom || "?")}</b></td><td>${Object.entries(x.objets || {}).map(([k, q]) => `${q} × ${echapper(_mNomItem(k))}`).join(", ")}</td></tr>`).join("")}</tbody></table>`;
  if(!c.scelle){
    const sac = (typeof etat !== "undefined" && etat.sac) || {};
    // v1.64 : une unité entière d'une sorte (tous les ingrédients d'une recette d'un coup).
    const unites = [];
    for(const s of (c.sortes || [])) (s.recettes || []).forEach((r, ri) => {
      const n = Math.min(...Object.entries(r).map(([k, q]) => Math.floor((sac[k] || 0) / q)));
      if(n > 0 && Object.keys(r).length > 1 && s.unites < s.max) unites.push({ s, ri, n });
    });
    if(unites.length) h += `<div class="mi-btns">${unites.map(u => `<button class="mini" data-mi-unite="${m.id}" data-mi-sorte="${u.s.id}" data-mi-rec="${u.ri}" data-mi-n="${Math.min(u.n, u.s.max - u.s.unites)}">Déposer ${Math.min(u.n, u.s.max - u.s.unites)} × ${echapper(u.s.nom)}</button>`).join("")}</div>`;
    const dispo = [...objets].filter(k => (sac[k] || 0) > 0);
    h += dispo.length
      ? `<div class="mi-ligne"><select id="mi-dep-item">${dispo.map(k => `<option value="${k}">${echapper(_mNomItem(k))} (${sac[k]})</option>`).join("")}</select>
         <input id="mi-dep-qte" type="number" min="1" max="${sac[dispo[0]]}" value="1" style="width:5em"><button class="mini" data-mi-deposer="${m.id}">Déposer</button></div>
         <p class="vide" style="margin:2px 0">Ce qui est déposé est engagé : on ne le reprend pas.</p>`
      : `<p class="vide">Rien dans ton sac ne sert à ce coffre.</p>`;
  }
  return h;
}

function _mEpreuve(m){
  const e = m.epreuve; if(!e || !e.tentatives) return "";
  if(e.reussie) return `<p class="vide">Épreuve réussie.</p>`;
  return `<p class="vide">Épreuve : ${e.tentatives} tentative${e.tentatives > 1 ? "s" : ""} sur 2.${e.tentatives === 1 ? " La seconde s'ouvre le lendemain." : ""}</p>`;
}

/* ===========================================================
   v1.63 — LA BOUTURE CAPRICIEUSE (B1-B7, H24-H35). Le serveur tire la grille
   du jour (commune au groupe) et vérifie le tracé ; ce module ne fait que
   l'afficher et le dessiner. « Sur Mousseron » : même règle que la carte
   (surLieuEspace), revérifiée par le serveur.
   =========================================================== */
function _mSurMousseron(){
  return (typeof enEcart === "function" && enEcart()) && typeof surLieuEspace === "function"
      && typeof espaceLieu === "function" && surLieuEspace(espaceLieu("pp_vert"));
}
function _mBouture(m){
  const v = m.vue || {}; const ici = _mSurMousseron();
  let h = `<h4 class="gsec">La bouture</h4>`;
  if(v.phase === "drones") h += _mEtape("Étape 1 sur 2 — Les drones", "Sur Mousseron, au milieu des mousses géantes, la bouture a germé. Autour d'elle, de vieux drones d'AREPO tournent sans fin : leurs carcasses sont rouillées, mais leurs lames tournent encore, et personne ne s'en approche tant qu'ils sont là.", "Un seul d'entre vous suffit : qu'il aille sur Mousseron et fasse fuir les drones.");   // v2.69 (K233)
  if(v.phase === "soins") h += _mEtape("Étape 2 sur 2 — Les soins", "Les drones partis, la bouture est à vous. Mais elle est fragile : ses racines cherchent l'eau sans la trouver, et sans aide, elle fanera.", "Quatre jours de suite, sur Mousseron, reliez-la à l'eau : on pose et on tourne des bouts de racine jusqu'à ce que l'eau passe.");
  if(v.phase === "drones"){
    if(v.tentatives >= 1){
      h += `<p>Les drones ont tenu bon. Seconde tentative : du ${_mJourTxt(v.epreuve_jour, 1)} au ${_mJourTxt(v.epreuve_jour, 2)}.</p>`;
    }
    if(!ici){
      if(!v.tentatives) h += `<p>Rends-toi sur Mousseron (carte de Triptolème) : un seul membre suffit pour affronter les drones. Première tentative au plus tard le ${_mJourTxt(v.limite)}.</p>`;
      return h;
    }
    h += `<p class="quete-indice">Les drones t'ont repéré. Leurs carcasses sont rouillées, mais leurs lames tournent encore.</p>`;
    if(v.tentatives >= 1 && String(v.epreuve_jour).slice(0,10) === String(_missions && _missions.jour).slice(0,10))
      h += `<p class="vide">Vous pourrez retenter demain.</p>`;
    else h += `<div class="mi-btns"><button class="mini" data-mi-fuir="${m.id}">Faire fuir les drones</button></div>`;
    return h;
  }
  if(v.phase !== "soins") return h;
  // v1.77 (H84) : la règle des soins, écrite noir sur blanc.
  h += `<p class="quete-indice" style="margin:4px 0 8px">Chaque jour, au moins l'un de vous doit la soigner, sinon elle fane. Et pour avoir ta part, tu dois l'avoir soignée au moins une fois.</p>`;
  // Les quatre jours (H26).
  h += `<div class="mi-jours">${(v.jours || []).map(j => `<div class="mi-jour${(j.soigneurs||[]).length ? " ok" : ""}${v.jour_soin === j.n ? " auj" : ""}">
          <b>Jour ${j.n}</b><span>${(j.soigneurs||[]).length ? j.soigneurs.map(echapper).join(", ") : "—"}</span></div>`).join("")}</div>`;
  if(!v.jour_soin){ h += `<p class="vide">La bouture est à vous : les soins commencent demain.</p>`; return h; }
  if(v.moi_soigne){ h += `<p class="vide">Tu as soigné la bouture aujourd'hui.</p>`; return h; }
  const jour = (v.jours || []).find(j => j.n === v.jour_soin);
  if(jour && (jour.soigneurs || []).length) h += `<p class="vide">Quelqu'un est passé aujourd'hui : la bouture a bu. Tu peux la soigner aussi, pour compter parmi ses soigneurs.</p>`;
  if(!ici){ h += `<p>Rends-toi sur Mousseron pour la soigner.</p>`; return h; }
  h += `<p style="margin:6px 0"><b>Jour ${v.jour_soin} sur 4 — la bouture a soif. Relie-la à l'eau.</b></p>`;
  h += `<div id="mi-racines" data-mi-mission="${m.id}">${_mRacinesHtml(m)}</div>`;
  return h;
}

/* ---------- « Les racines » : grille 5 × 5 (B5) ----------
   Ouvertures : N=1 E=2 S=4 O=8 ; Droit = N+S, Coude = N+E, En T = N+E+O ;
   chaque toucher sur un bout le tourne d'un quart de tour (sens horaire). */
const RACINES_BASE = { I:5, L:3, T:11 };
const RACINES_NOMS = { I:"Droit", L:"Coude", T:"En T" };
let _racines = { cle:null, pieces:{}, outil:"I" };   // pieces : { case: {t, r} }
function _rMasque(t, r){ let m = RACINES_BASE[t] || 0; for(let k = 0; k < (r||0); k++) m = ((m << 1) | (m >> 3)) & 15; return m; }
function _rAtteint(gr, pieces){
  const M = Array(25).fill(0); for(const c in pieces) M[+c] = _rMasque(pieces[c].t, pieces[c].r);
  const vus = new Set(); let ok = false;
  if(!(M[gr.cs] & 1)) return { ok:false, vus };
  const file = [gr.cs]; vus.add(gr.cs);
  while(file.length){
    const cur = file.shift(), r = Math.floor(cur / 5), c = cur % 5;
    for(const d of [1, 2, 4, 8]){
      if(!(M[cur] & d)) continue;
      const nr = r + (d === 1 ? -1 : d === 4 ? 1 : 0), nc = c + (d === 2 ? 1 : d === 8 ? -1 : 0);
      if(nr < 0 || nr > 4 || nc < 0 || nc > 4){ if(d === 4 && r === 4 && c === gr.ce) ok = true; continue; }
      const opp = d === 1 ? 4 : d === 4 ? 1 : d === 2 ? 8 : 2, n = nr * 5 + nc;
      if((M[n] & opp) && !vus.has(n)){ vus.add(n); file.push(n); }
    }
  }
  return { ok, vus };
}
function _rSvg(masque, actif){
  const col = actif ? "#5ab0e6" : "#7bc47f";
  const seg = { 1:"M20 20 L20 0", 2:"M20 20 L40 20", 4:"M20 20 L20 40", 8:"M20 20 L0 20" };
  let p = ""; for(const d of [1, 2, 4, 8]) if(masque & d) p += `<path d="${seg[d]}"/>`;
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="${col}" stroke-width="7" stroke-linecap="round" fill="none">${p}</g><circle cx="20" cy="20" r="4.5" fill="${col}"/></svg>`;
}
function _mRacinesHtml(m){
  const gr = m.vue.grille; const cle = m.id + ":" + m.vue.jour_soin;
  if(_racines.cle !== cle) _racines = { cle, pieces:{}, outil:"I" };
  const cail = new Set(gr.cailloux || []); const n = Object.keys(_racines.pieces).length;
  const etatR = _rAtteint(gr, _racines.pieces);
  let h = `<div class="mi-r-outils">${["I","L","T"].map(t => `<button class="mini${_racines.outil === t ? " actif" : ""}" data-r-outil="${t}">${RACINES_NOMS[t]}</button>`).join("")}
           <button class="mini${_racines.outil === "X" ? " actif" : ""}" data-r-outil="X">Effacer</button>
           <span class="mi-r-compte${n > gr.limite ? " trop" : ""}">Racines : ${n} / ${gr.limite}</span></div>`;
  h += `<div class="mi-r-bord">${[0,1,2,3,4].map(c => `<span>${c === gr.cs ? "Bouture" : ""}</span>`).join("")}</div>`;
  h += `<div class="mi-r-grille">`;
  for(let i = 0; i < 25; i++){
    if(cail.has(i)){ h += `<div class="mi-r-case caillou" title="Caillou"></div>`; continue; }
    const p = _racines.pieces[i];
    h += `<div class="mi-r-case${p ? " pleine" : ""}" data-r-case="${i}">${p ? _rSvg(_rMasque(p.t, p.r), etatR.vus.has(i)) : ""}</div>`;
  }
  h += `</div><div class="mi-r-bord eau">${[0,1,2,3,4].map(c => `<span>${c === gr.ce ? "Eau" : ""}</span>`).join("")}</div>`;
  h += `<p class="vide" style="margin:6px 0">${etatR.ok ? "Les racines atteignent l'eau." : "Les racines n'atteignent pas encore l'eau."} Touche un bout pour le tourner. Un soin coûte 2 % d'énergie.</p>`;
  h += `<div class="mi-btns"><button class="mini" data-r-boire="${m.id}"${etatR.ok && n <= gr.limite ? "" : " disabled"}>Faire boire</button></div>`;
  return h;
}
function _mRacinesMaj(z){
  const zone = z.querySelector("#mi-racines"); if(!zone || !_missions) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m || !m.vue || !m.vue.grille) return;
  zone.innerHTML = _mRacinesHtml(m);
  _mRacinesBrancher(z);
}
function _mRacinesBrancher(z){
  const zone = z.querySelector("#mi-racines"); if(!zone) return;
  zone.querySelectorAll("[data-r-outil]").forEach(b => b.addEventListener("click", () => { _racines.outil = b.dataset.rOutil; _mRacinesMaj(z); }));
  zone.querySelectorAll("[data-r-case]").forEach(c => c.addEventListener("click", () => {
    const i = +c.dataset.rCase, p = _racines.pieces[i];
    if(_racines.outil === "X"){ delete _racines.pieces[i]; }
    else if(p && p.t === _racines.outil) p.r = (p.r + 1) % 4;
    else _racines.pieces[i] = { t:_racines.outil, r:0 };
    _mRacinesMaj(z);
  }));
  const b = zone.querySelector("[data-r-boire]");
  if(b) b.addEventListener("click", async () => {
    if(b.disabled) return; b.disabled = true;
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    const pieces = Object.entries(_racines.pieces).map(([c, p]) => ({ c:+c, t:p.t, r:p.r }));
    const d = await _missionAppel("bouture_soigner", { p_mission:+b.dataset.rBoire, p_pieces:pieces }, "La bouture a bu. Elle tiendra jusqu'à demain.");
    if(d && d.ok){
      if(typeof d.energie === "number"){ etat.energie = d.energie; etat.energieMaj = Date.now(); }
      _racines = { cle:null, pieces:{}, outil:"I" };
    }
  });
}

/* ===========================================================
   v1.64 — LA BALISE SOUS LA GLACE (D1-D6, H37-H47). Le point est tiré par
   le serveur et marqué sur la carte du Suaire pour le seul groupe. Les trois
   postes se jouent À LA BALISE, dans n'importe quel ordre, avant la tempête.
   « Le nœud » : vérifié par le client seul (H45). « La crevasse » et « Le
   message » : tirés et vérifiés par le serveur (H43, H44).
   =========================================================== */
const BALISE_RAYON = 80;
function _mBaliseMienne(){
  return ((_missions && _missions.missions) || []).find(m => m.type === "balise" && m.vue && m.vue.balise) || null;
}
function _mSurBalise(v){
  if(!v || !v.balise || !(typeof etat !== "undefined" && etat.secteur === "suaire") || typeof posSurface !== "function") return false;
  const p = posSurface(); return Math.hypot(p.x - v.balise.x, p.y - v.balise.y) <= BALISE_RAYON;
}
/* Carte du Suaire (braise.js) : le point, pour les seuls membres (H37). */
function missionsMarqueursCarte(secteur){
  if(secteur === "braise") return _mInfilMarqueurs();   // v1.65
  if(secteur !== "suaire") return "";
  const m = _mBaliseMienne(); if(!m) return "";
  const b = m.vue.balise;
  return `<g style="pointer-events:none"><circle cx="${b.x}" cy="${b.y}" r="${BALISE_RAYON}" fill="#7dd3fc22" stroke="#7dd3fc" stroke-width="3" stroke-dasharray="6 8"/>
    <circle cx="${b.x}" cy="${b.y}" r="9" fill="#7dd3fc"><animate attributeName="r" values="7;12;7" dur="2s" repeatCount="indefinite"/></circle>
    <text x="${b.x}" y="${b.y + BALISE_RAYON + 34}" text-anchor="middle" class="vlabel" style="fill:#f5e9d3">La balise</text></g>`;
}
function missionsLieuIci(){
  const mi = _mInfilMienne(); if(mi && mi.vue.entree && _mALEntree(mi.vue)) return `<b>L'entrepôt d'AREPO</b> — <span class="itip-gris">Une porte de cendre et de métal, à demi enfouie.</span>`;   // v1.65
  const m = _mBaliseMienne(); if(!m || !_mSurBalise(m.vue)) return "";
  return `<b>La balise</b> — <span class="itip-gris">Un signal monte de sous la glace.</span>`;
}
function _mTempeteDans(iso){
  const ms = new Date(iso).getTime() - Date.now(); if(!(ms > 0)) return "imminente";
  const mn = Math.floor(ms / 60000); return `dans ${Math.floor(mn / 60)} h ${String(mn % 60).padStart(2, "0")} min`;
}
function _mBalise(m){
  const v = m.vue || {}; const ici = _mSurBalise(v);
  const d = v.descente; const faits = (d && d.faits) || {};
  let h = `<h4 class="gsec">La descente</h4>`;
  const postes = ["encordeur","eclaireur","dechiffreur"];
  h += `<p class="vide" style="margin:2px 0">${postes.map(p => `${MISSION_POSTES[p]} : ${echapper((v.postes_tenus || {})[p] || "—")}${faits[p] ? " ✓" : ""}`).join(" · ")}</p>`;
  if(v.phase === "preparation") h += _mEtape("Étape 1 sur 3 — La préparation", "Sous la glace du Suaire, la balise appelle toujours, dans l'écriture de l'ancien. Pour l'atteindre, il faut descendre dans le froid avec des cordes, des piolets, des lampes et de quoi tenir chaud — et là-haut, une tempête finit toujours par se lever.", "Remplissez ensemble le coffre commun. Quand le minimum est réuni, l'un de vous, à la balise, lance la descente pour tout le groupe. Mieux vous êtes équipés, plus la tempête tardera.");   // v2.69 (K233) ; v2.65 (K219)
  if(v.phase === "remontee") h += _mEtape("Seconde tentative", "La glace vous a repoussés. Le matériel est resté au bord du puits, et la balise appelle toujours.", `Une seconde descente peut se tenter, ${_mQuandRetenter(v)}.`);
  if(v.phase === "descente" && d && !postes.every(p => faits[p])) h += _mEtape("Étape 2 sur 3 — La descente", "Vous êtes dans la glace. Au-dessus, le ciel du Suaire s'assombrit : la tempête approche, et quand elle tombera, il faudra remonter. Chacun a son rôle : tenir la corde, trouver le passage, lire ce que dit la balise.", "À la balise, l'encordeur, l'éclaireur et le déchiffreur jouent chacun leur poste avant la tempête.");
  if(v.phase === "descente" && d && postes.every(p => faits[p])) h += _mEtape("Étape 3 sur 3 — La tourelle", "La corde a tenu, le passage est trouvé, le message est lu. Mais la balise n'est pas seule : une tourelle d'AREPO veille sur elle, et elle vient de vous voir.", "Affrontez la tourelle, tous ensemble, avant la tempête.");
  if(v.phase === "preparation" || v.phase === "remontee"){
    h += _mCoffre(m);
    if(v.phase === "remontee") h += `<p>Seconde descente : du ${_mJourTxt(v.epreuve_jour, 1)} au ${_mJourTxt(v.epreuve_jour, 2)}.</p>`;
    if(!ici){
      h += `<p>Rends-toi à la balise (point marqué sur la carte du Suaire). Quand le minimum de matériel est réuni, un membre sur place lance la descente${v.phase === "preparation" ? ` — au plus tard le ${_mJourTxt(v.limite)}` : ""}.</p>`;
      return h;
    }
    const minutes = v.tempete_min || 720;   // calculée par le serveur (préparation, Isolation) ; v2.65 (K219) : 12 h de base
    const demain = v.phase === "remontee" && String(v.epreuve_jour).slice(0, 10) === String(_missions && _missions.jour).slice(0, 10);
    h += demain ? `<p class="vide">La seconde descente se fera demain.</p>`
                : `<div class="mi-btns"><button class="mini" data-mi-descendre="${m.id}" data-mi-minutes="${minutes}"${m.coffre && m.coffre.minimum ? "" : " disabled"}>Lancer la descente</button></div>`;
    return h;
  }
  if(v.phase !== "descente" || !d) return h;
  h += `<p><b>La tempête : ${_mTempeteDans(d.tempete)}.</b></p>`;
  const tous = postes.every(p => faits[p]);
  if(!ici){ h += `<p>Rends-toi à la balise (point marqué sur la carte du Suaire) pour jouer ton poste.</p>`; return h; }
  if(tous){
    h += `<p class="quete-indice">Une tourelle d'AREPO pivote vers vous dans un grincement de givre.</p>
          <div class="mi-btns"><button class="mini" data-mi-tourelle="${m.id}">Affronter la tourelle</button></div>`;
    return h;
  }
  const mp = v.mon_poste;
  if(!mp || !postes.includes(mp)){ h += `<p class="vide">Tu n'as pas de poste : ta force comptera contre la tourelle.</p>`; return h; }
  if(faits[mp]){ h += `<p class="vide">Ton poste est fait. Les autres jouent le leur : reste près de la balise.</p>`; return h; }
  if(mp === "encordeur") h += `<div id="mi-noeud" data-mi-mission="${m.id}">${_mEssaiPorte("noeud", m.id, _mEssais.noeud ? _mNoeudHtml() : "")}</div>`;   // v2.17
  if(mp === "eclaireur" && v.crevasse) h += `<div id="mi-crevasse" data-mi-mission="${m.id}">${_mEssaiPorte("crevasse", m.id, _mEssais.crevasse ? _mCrevasseHtml(m) : "")}</div>`;
  if(mp === "dechiffreur" && v.message) h += `<div id="mi-message" data-mi-mission="${m.id}">${_mMessageHtml(v.message)}</div>`;
  return h;
}

/* ---------- « Le nœud » (H45) : 3 tracés, couloir 32 / 24 / 16 px ---------- */
const NOEUD_TOL = [32, 24, 16], NOEUD_FORMES = [[1, 2], [2, 3], [3, 4]];
let _noeud = { k:0, pts:null, prog:0, actif:false };
function _noeudTracer(k){
  const [a, b] = NOEUD_FORMES[k]; const ph = Math.random() * Math.PI;
  const pts = []; const N = 160 + 60 * k;
  for(let i = 0; i <= N; i++){ const t = i / N * Math.PI * (1 + k * 0.5);
    pts.push([150 + 115 * Math.sin(a * t + ph), 150 + 115 * Math.sin(b * t)]); }
  return pts;
}
function _mNoeudHtml(){
  if(!_noeud.pts) _noeud.pts = _noeudTracer(_noeud.k);
  const pts = _noeud.pts, tol = NOEUD_TOL[_noeud.k];
  const d = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  const fait = pts.slice(0, _noeud.prog + 1);
  const df = fait.length > 1 ? "M" + fait.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") : "";
  return `<p style="margin:6px 0"><b>Nœud ${_noeud.k + 1} sur 3 — suis la corde du doigt, sans lever ni sortir.</b></p>
    <svg id="mi-noeud-svg" viewBox="0 0 300 300" style="width:100%;max-width:300px;touch-action:none;background:rgba(125,211,252,.06);border:1px solid var(--line);border-radius:8px">
      <path d="${d}" stroke="#7dd3fc33" stroke-width="${tol}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" stroke="#cfe8f7" stroke-width="3" fill="none"/>
      <path id="mi-noeud-fait" d="${df || "M0 0"}" stroke="#7bc47f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="9" fill="#7bc47f"/><circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="9" fill="none" stroke="#7bc47f" stroke-width="3"/>
    </svg>`;
}
function _mNoeudMaj(z){ const zone = z.querySelector("#mi-noeud"); if(!zone) return; zone.innerHTML = _mNoeudHtml(); _mNoeudBrancher(z); }
function _mNoeudBrancher(z){
  const svg = z.querySelector("#mi-noeud-svg"); if(!svg) return;
  const pt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * 300 / r.width, (e.clientY - r.top) * 300 / r.height]; };
  const rater = () => { _noeud = { k:_noeud.k, pts:_noeudTracer(_noeud.k), prog:0, actif:false }; journal("La corde a glissé : recommence ce nœud.", "alerte", "quete");
    _mEssaiFin("noeud"); if(typeof majQueteHub === "function") majQueteHub(); };   // v2.17 : l'essai est fini
  svg.addEventListener("pointerdown", e => {
    const [x, y] = pt(e), p0 = _noeud.pts[0];
    if(Math.hypot(x - p0[0], y - p0[1]) > NOEUD_TOL[_noeud.k]) return;
    _noeud.actif = true; _noeud.prog = 0; svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", e => {
    if(!_noeud.actif) return;
    const [x, y] = pt(e), pts = _noeud.pts, tol = NOEUD_TOL[_noeud.k] / 2;
    let best = -1, bd = 1e9;
    for(let i = _noeud.prog; i < Math.min(pts.length, _noeud.prog + 12); i++){
      const dd = Math.hypot(x - pts[i][0], y - pts[i][1]); if(dd < bd){ bd = dd; best = i; } }
    if(bd > tol){ rater(); return; }
    if(best > _noeud.prog){
      _noeud.prog = best;   // on ne redessine QUE le tracé fait : redessiner le SVG perdrait le doigt
      const f = svg.querySelector("#mi-noeud-fait");
      if(f) f.setAttribute("d", "M" + pts.slice(0, best + 1).map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"));
    }
    if(_noeud.prog >= pts.length - 2){
      _noeud.actif = false;
      if(_noeud.k < 2){ _noeud = { k:_noeud.k + 1, pts:null, prog:0, actif:false }; _mNoeudMaj(z); }
      else { _noeud = { k:0, pts:null, prog:0, actif:false }; _mEssaiFin("noeud");   // v2.17
        const id = +z.querySelector("#mi-noeud").dataset.miMission;
        (async () => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
          _missionAppel("balise_noeud", { p_mission:id }, "Corde assurée."); })(); }
    }
  });
  svg.addEventListener("pointerup", () => { if(_noeud.actif && _noeud.prog < _noeud.pts.length - 2) rater(); });
}

/* ---------- « La crevasse » (H44) : 11 × 11, lampe de rayon 1 à 3 ---------- */
let _crev = { cle:null, pos:0, pas:"" };
function _mCrevasseHtml(m){
  const g = m.vue.crevasse; const cle = m.id + ":" + JSON.stringify(g.cases).length + ":" + g.cs + ":" + g.ce;
  if(_crev.cle !== cle) _crev = { cle, pos:g.cs, pas:"" };
  const n = g.n, r0 = Math.floor(_crev.pos / n), c0 = _crev.pos % n, R = g.rayon || 1;
  /* v2.65 (K220) — « 30 s » : une testeuse croyait à un chrono. Ce sont des PAS, sans limite de temps. */
  let h = `<p style="margin:6px 0"><b>Trouve le passage dans le noir. Il te reste ${g.pas - _crev.pas.length} pas</b> — des pas, pas des secondes : prends tout ton temps.</p>
    <div class="mi-cv-grille" style="grid-template-columns:repeat(${n},1fr)">`;
  for(let i = 0; i < n * n; i++){
    const r = Math.floor(i / n), c = i % n, vis = Math.max(Math.abs(r - r0), Math.abs(c - c0)) <= R;
    const mk = g.cases[i];
    const st = vis ? `border-top:2px solid ${mk & 1 ? "transparent" : "#cfe8f7"};border-right:2px solid ${mk & 2 ? "transparent" : "#cfe8f7"};border-bottom:2px solid ${mk & 4 ? "transparent" : "#cfe8f7"};border-left:2px solid ${mk & 8 ? "transparent" : "#cfe8f7"}` : "";
    h += `<div class="mi-cv${vis ? " vu" : ""}${i === _crev.pos ? " moi" : ""}${vis && r === n - 1 && c === g.ce ? " sortie" : ""}" style="${st}"></div>`;
  }
  h += `</div><div class="mi-btns mi-cv-fleches">${[["N","↑"],["O","←"],["S","↓"],["E","→"]].map(([d, t]) => `<button class="mini" data-cv="${d}">${t}</button>`).join("")}</div>`;
  return h;
}
function _mCrevasseMaj(z){ const zone = z.querySelector("#mi-crevasse"); if(!zone || !_missions) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m || !m.vue || !m.vue.crevasse) return;
  zone.innerHTML = _mCrevasseHtml(m); _mCrevasseBrancher(z); }
function _mCrevassePas(z, d){
  const zone = z.querySelector("#mi-crevasse"); if(!zone) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m) return;
  const g = m.vue.crevasse, n = g.n, bit = { N:1, E:2, S:4, O:8 }[d];
  if(!(g.cases[_crev.pos] & bit)) return;                         // un mur : pas compté
  _crev.pos += { N:-n, E:1, S:n, O:-1 }[d]; _crev.pas += d;
  const fini = _crev.pos === (n - 1) * n + g.ce, epuise = _crev.pas.length >= g.pas;
  _mCrevasseMaj(z);
  if(fini || epuise){
    const pas = _crev.pas; _crev = { cle:null, pos:0, pas:"" }; _mEssaiFin("crevasse");   // v2.17
    (async () => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
      _missionAppel("balise_crevasse", { p_mission:m.id, p_pas:pas }, "Le passage est trouvé."); })();
  }
}
function _mCrevasseBrancher(z){
  const zone = z.querySelector("#mi-crevasse"); if(!zone) return;
  zone.querySelectorAll("[data-cv]").forEach(b => b.addEventListener("click", () => _mCrevassePas(z, b.dataset.cv)));
}

/* ---------- « Le message » (H43) : un son à deviner, 4 propositions ---------- */
function _mMessageHtml(msg){
  const mot = w => `<span class="gly-mot">${w.map(s => (s && typeof s === "object") ? `<span class="mi-msg-inconnu">${glypheFormeSVG(s.forme)}</span>` : glypheSVG(s)).join("")}</span>`;
  return `<p style="margin:6px 0"><b>Le signal, en écriture de l'ancien. Quel son manque ?</b> <span class="vide">Chaque réponse : ${_mEssaiCout()} % d'énergie.</span></p>
    <div class="mi-msg">${(msg.mots || []).map(mot).join(`<span class="mi-msg-sep"></span>`)}</div>
    <div class="mi-btns">${(msg.propositions || []).map(p => `<button class="mini" data-msg="${echapper(p)}">${echapper(p)}</button>`).join("")}</div>`;
}

function _mBaliseBrancher(z){
  _mNoeudBrancher(z); _mCrevasseBrancher(z);
  const zm = z.querySelector("#mi-message");
  if(zm) zm.querySelectorAll("[data-msg]").forEach(b => b.addEventListener("click", async () => {
    zm.querySelectorAll("[data-msg]").forEach(x => x.disabled = true);
    if(!await _mEssaiPayer()){ zm.querySelectorAll("[data-msg]").forEach(x => x.disabled = false); return; }   // v2.17
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("balise_message", { p_mission:+zm.dataset.miMission, p_son:b.dataset.msg }, d => `Message lu : « ${d.sens} ».`);
  }));
}

/* ===========================================================
   v1.65 — L'INFILTRATION (I1-I4, H49-H55). Le relevé se fait en marchant
   sur La Braise (missionsApresPas, appelé par braise.js) ; la brèche, le
   rangement et les sentinelles se jouent À L'ENTRÉE. Paroi et rangement sont
   tirés et vérifiés par le serveur.
   =========================================================== */
const ENTREE_RAYON = 80;
function _mInfilMienne(){
  return ((_missions && _missions.missions) || []).find(m => m.type === "infiltration" && m.vue && m.vue.zone) || null;
}
function _mALEntree(v){
  if(!v || !v.entree || !(typeof etat !== "undefined" && etat.secteur === "braise") || typeof posSurface !== "function") return false;
  const p = posSurface(); return Math.hypot(p.x - v.entree.x, p.y - v.entree.y) <= ENTREE_RAYON;
}
function _mInfilMarqueurs(){
  const m = _mInfilMienne(); if(!m) return "";
  const v = m.vue;
  if(v.entree) return `<g style="pointer-events:none"><circle cx="${v.entree.x}" cy="${v.entree.y}" r="${ENTREE_RAYON}" fill="#f59e0b22" stroke="#f59e0b" stroke-width="3"/>
      <rect x="${v.entree.x - 9}" y="${v.entree.y - 9}" width="18" height="18" fill="#f59e0b"/>
      <text x="${v.entree.x}" y="${v.entree.y + ENTREE_RAYON + 34}" text-anchor="middle" class="vlabel" style="fill:#f5e9d3">L'entrepôt d'AREPO</text></g>`;
  const z = v.zone;
  return `<g style="pointer-events:none"><circle cx="${z.x}" cy="${z.y}" r="${z.r}" fill="#f59e0b14" stroke="#f59e0b" stroke-width="3" stroke-dasharray="14 12"/>
    <text x="${z.x}" y="${z.y + 12}" text-anchor="middle" class="vlabel" style="fill:#f5e9d3">L'entrepôt (quelque part par ici)</text></g>`;
}
/* H49 : à chaque pas dans la zone, le serveur dit si l'entrée est à moins de 60. */
async function missionsApresPas(){
  const m = _mInfilMienne(); if(!m || m.vue.phase !== "releve" || etat.secteur !== "braise" || typeof posSurface !== "function") return;
  const p = posSurface(), z = m.vue.zone; if(Math.hypot(p.x - z.x, p.y - z.y) > z.r + 60) return;
  try{
    const { data } = await sb.rpc("infiltration_relever", { p_mission:m.id });
    if(data && data.ok && data.trouvee && !data.deja){
      await missionsCharger();
      if(typeof majCarteBraise === "function") majCarteBraise();
      missionsRedessiner();
    }
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "missions.js#relever"); }
}
function _mInfiltration(m){
  const v = m.vue || {}; const ici = _mALEntree(v);
  let h = `<h4 class="gsec">L'entrepôt</h4>`;
  const porteurs = (v.porteurs || []).map(p => `${echapper(p.nom)}${p.score != null ? ` ✓ (${Math.round(p.score * 100)} %)` : ""}`).join(", ") || "—";
  h += `<p class="vide" style="margin:2px 0">Artificier : ${echapper(v.artificier || "—")}${v.breche_par ? " ✓" : ""} · Porteurs : ${porteurs}</p>`;
  /* v2.65 (K221, K225) — les étapes, plus claires (retour d'une testeuse : « pourquoi le coffre reste ouvert ? »). */
  const ET_INF = { releve:["Étape 1 sur 4 — Le repérage et le coffre", "Quelque part sous la cendre de La Braise, l'entrepôt d'AREPO dort enseveli. Personne ne sait exactement où : il faudra fouiller la zone, de près, pour en trouver l'entrée.", "L'un de vous cherche l'entrée dans la zone marquée sur la carte de La Braise : elle apparaît quand on passe tout près. Pendant ce temps, tout le monde remplit le coffre commun, à commencer par les charges de l'artificier."],   // v2.69 (K233)
                   breche:["Étape 2 sur 4 — La brèche", "L'entrée est là, sous la cendre : une paroi d'AREPO, épaisse, scellée depuis trois siècles. Il faudra la faire sauter.", "À l'entrée, l'artificier fait sauter la paroi avec les charges du coffre. Jusque-là, vous pouvez encore compléter le coffre ; dès que la paroi saute, il est fermé pour de bon."],
                   rangement:["Étape 3 sur 4 — Le chargement", "La paroi a cédé. Derrière, des rayonnages entiers, intacts sous la poussière. Il n'y a pas de place pour tout : chaque recoin laissé vide, c'est une pièce abandonnée à l'entrepôt, et plus vous rangez serré, plus les caisses que chacun rapportera seront pleines.", "Chaque porteur, à l'entrée, range une caisse."],
                   sentinelles:["Étape 4 sur 4 — La sortie", "Le bruit de la brèche a réveillé l'entrepôt. Ses vieilles sentinelles, couvertes de cendre, se dressent entre vous et la sortie.", "Affrontez-les tous ensemble pour repartir avec les caisses."] }[v.phase];
  if(ET_INF) h += _mEtape(ET_INF[0], ET_INF[1], ET_INF[2]);
  if(v.tentatives === 1) h += `<p>Les sentinelles vous ont repoussés. Seconde tentative : du ${_mJourTxt(v.epreuve_jour, 1)} au ${_mJourTxt(v.epreuve_jour, 2)}.</p>`;
  if(v.phase === "releve"){
    h += _mCoffre(m);
    h += `<p>Cherche l'entrée dans la zone marquée sur la carte de La Braise : elle apparaîtra quand l'un de vous passera tout près. La chaleur coûte cher — Sang de magma aide. Première tentative contre les sentinelles au plus tard le ${_mJourTxt(v.limite)}.</p>`;
    return h;
  }
  if(v.phase === "breche") h += _mCoffre(m);
  if(!ici){ h += `<p>Rends-toi à l'entrepôt (marqué sur la carte de La Braise).${v.phase === "breche" ? ` Première tentative contre les sentinelles au plus tard le ${_mJourTxt(v.limite)}.` : ""}</p>`; return h; }
  if(v.phase === "breche"){
    if(v.mon_poste !== "artificier"){ h += `<p class="vide">${echapper(v.artificier || "L'artificier")} pose les charges contre la paroi. Reste en retrait.</p>`; return h; }   // v2.69 (K233)
    if(!v.paroi){ h += `<p class="vide">Paroi indisponible.</p>`; return h; }
    h += `<div id="mi-paroi" data-mi-mission="${m.id}">${_mParoiHtml(m)}</div>`;
    return h;
  }
  if(v.phase === "rangement"){
    if(v.mon_poste !== "porteur"){ h += `<p class="vide">Les porteurs chargent les caisses. Garde l'entrée.</p>`; return h; }
    if(!v.rangement){ h += `<p class="vide">Ta caisse est pleine et fermée. Les autres porteurs finissent la leur.</p>`; return h; }
    h += `<div id="mi-rangement" data-mi-mission="${m.id}">${_mRangementHtml(m)}</div>`;
    return h;
  }
  if(v.phase === "sentinelles"){
    const demain = v.tentatives === 1 && String(v.epreuve_jour).slice(0, 10) === String(_missions && _missions.jour).slice(0, 10);
    h += `<p class="quete-indice">Des automates d'AREPO, couverts de cendre, vous barrent la sortie.</p>`;
    h += demain ? `<p class="vide">Vous pourrez retenter demain.</p>` : `<div class="mi-btns"><button class="mini" data-mi-sentinelles="${m.id}">Affronter les sentinelles</button></div>`;
  }
  return h;
}

/* ---------- « La réaction en chaîne » (H51, H55) ---------- */
let _paroi = { cle:null, charges:[] };
function _mParoiHtml(m){
  const P = m.vue.paroi, max = m.vue.charges || 0; const cle = m.id + ":" + JSON.stringify(P.fissures).length + ":" + P.piliers.join(",");
  if(_paroi.cle !== cle) _paroi = { cle, charges:[] };
  const W = P.w, H = P.h, pas = 52, X = i => 30 + (i % W) * pas, Y = i => 30 + Math.floor(i / W) * pas;
  let svg = "";
  for(const [a, b] of P.fissures) svg += `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>`;
  for(let i = 0; i < W * H; i++){
    const pil = P.piliers.includes(i), ch = _paroi.charges.includes(i);
    svg += `<g data-p-noeud="${i}" style="cursor:pointer"><circle cx="${X(i)}" cy="${Y(i)}" r="16" fill="transparent"/>`
         + (pil ? `<rect x="${X(i) - 9}" y="${Y(i) - 9}" width="18" height="18" fill="#cfd6df" stroke="#0b1220" stroke-width="2"/>` : `<circle cx="${X(i)}" cy="${Y(i)}" r="5" fill="#8a8f96"/>`)
         + (ch ? `<circle cx="${X(i)}" cy="${Y(i)}" r="12" fill="none" stroke="#ff5257" stroke-width="4"/>` : "") + `</g>`;
  }
  return `<p style="margin:6px 0"><b>La paroi — place tes charges pour faire sauter tous les piliers. Charges : ${max - _paroi.charges.length} / ${max}.</b></p>
    <svg viewBox="0 0 ${60 + (W - 1) * pas} ${60 + (H - 1) * pas}" style="width:100%;max-width:380px;background:rgba(40,20,10,.35);border:1px solid var(--line);border-radius:8px">${svg}</svg>
    <p class="vide" style="margin:4px 0">Une charge fait sauter les points reliés à elle par les fissures, jusqu'à 3 de distance. Les carrés sont les piliers.</p>
    <div class="mi-btns"><button class="mini" data-p-feu="${m.id}"${_paroi.charges.length ? "" : " disabled"}>Faire sauter</button></div>`;
}
function _mParoiMaj(z){ const zone = z.querySelector("#mi-paroi"); if(!zone || !_missions) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m || !m.vue || !m.vue.paroi) return;
  zone.innerHTML = _mParoiHtml(m); _mParoiBrancher(z); }
function _mParoiBrancher(z){
  const zone = z.querySelector("#mi-paroi"); if(!zone) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m) return;
  zone.querySelectorAll("[data-p-noeud]").forEach(g => g.addEventListener("click", () => {
    const i = +g.dataset.pNoeud, k = _paroi.charges.indexOf(i);
    if(k >= 0) _paroi.charges.splice(k, 1);
    else if(_paroi.charges.length < (m.vue.charges || 0)) _paroi.charges.push(i);
    _mParoiMaj(z);
  }));
  const b = zone.querySelector("[data-p-feu]");
  if(b) b.addEventListener("click", async () => {
    if(b.disabled) return; b.disabled = true;
    if(!await _mEssaiPayer()){ b.disabled = false; return; }   // v2.17
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    const charges = _paroi.charges.slice(); _paroi = { cle:null, charges:[] };
    _missionAppel("infiltration_breche", { p_mission:m.id, p_charges:charges }, "La paroi s'effondre : la brèche est ouverte.");
  });
}

/* ---------- Le rangement (H52, H55) : caisse 6 × 5 ----------
   v2.65 (K222, retour d'une testeuse : « pas fluide sur tablette ») :
   · la pièce se pose CENTRÉE sur la case touchée (avant : par le coin en haut à
     gauche de son contour, souvent hors de la pièce) ;
   · un APERÇU (vert : ça tient ; rouge : non) — au doigt, un premier toucher le
     montre, un second au même endroit pose la pièce ; à la souris, il suit le
     curseur ;
   · l'aperçu ne redessine rien (des classes seulement) ; cases plus grandes. */
let _rang = { cle:null, pose:[], sel:0, rot:0, ap:null, doigt:false };
function _rAncre(cel){   // la case de la pièce la plus proche de son centre
  const cx = cel.reduce((a, c) => a + c[0], 0) / cel.length, cy = cel.reduce((a, c) => a + c[1], 0) / cel.length;
  return cel.reduce((b, c) => Math.hypot(c[0] - cx, c[1] - cy) < Math.hypot(b[0] - cx, b[1] - cy) ? c : b, cel[0]);
}
function _rPlacement(R, i){
  const cel = _rCellules(R.pieces[_rang.sel], _rang.rot), [ax, ay] = _rAncre(cel);
  const x = i % R.w - ax, y = Math.floor(i / R.w) - ay, occ = _rOccupation(R);
  const cases = cel.map(([a, b]) => [x + a, y + b]);
  const dedans = ([cx, cy]) => cx >= 0 && cy >= 0 && cx < R.w && cy < R.h;
  const ok = !_rang.pose.some(p => p.p === _rang.sel) && cases.every(c => dedans(c) && occ[c[1] * R.w + c[0]] == null);
  return { x, y, ok, idx: cases.filter(dedans).map(([cx, cy]) => cy * R.w + cx) };
}
function _rApercu(zone, R, i){
  zone.querySelectorAll(".mi-rg-ap, .mi-rg-ko").forEach(c => c.classList.remove("mi-rg-ap", "mi-rg-ko"));
  _rang.ap = i;
  if(i == null || _rOccupation(R)[i] != null) return;
  const pl = _rPlacement(R, i);
  pl.idx.forEach(k => { const c = zone.querySelector(`[data-rg-case="${k}"]`); if(c) c.classList.add(pl.ok ? "mi-rg-ap" : "mi-rg-ko"); });
}
function _rCellules(piece, r){
  let c = piece.map(([x, y]) => [x, y]);
  for(let k = 0; k < (r || 0); k++) c = c.map(([x, y]) => [-y, x]);
  const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1]));
  return c.map(([x, y]) => [x - mx, y - my]);
}
function _rOccupation(R){
  const occ = {};
  _rang.pose.forEach((p, k) => _rCellules(R.pieces[p.p], p.r).forEach(([x, y]) => { occ[(p.y + y) * R.w + (p.x + x)] = k; }));
  return occ;
}
function _mRangementHtml(m){
  const R = m.vue.rangement; const cle = m.id + ":" + JSON.stringify(R.pieces);
  if(_rang.cle !== cle) _rang = { cle, pose:[], sel:0, rot:0, ap:null, doigt:false };
  const occ = _rOccupation(R), poses = new Set(_rang.pose.map(p => p.p));
  const pct = Math.round(Object.keys(occ).length / (R.w * R.h) * 100);
  const coul = k => `hsl(${(k * 47) % 360} 55% 50%)`;
  let h = `<p style="margin:6px 0"><b>Range la caisse : le moins de vide possible. Une fois validé, c'est définitif.</b></p>
    <div class="mi-rg-grille" style="grid-template-columns:repeat(${R.w},1fr)">`;
  for(let i = 0; i < R.w * R.h; i++){ const k = occ[i]; h += `<div class="mi-rg-case" data-rg-case="${i}"${k != null ? ` style="background:${coul(_rang.pose[k].p)}"` : ""}></div>`; }
  h += `</div><p class="vide" style="margin:4px 0">Rempli : ${pct} %. Choisis une pièce, tourne-la, puis touche une case : la pièce se pose centrée dessus. Au doigt, un premier toucher montre où elle irait, un second la pose. Touche une pièce posée pour la retirer.</p><div class="mi-rg-pieces">`;
  R.pieces.forEach((pc, k) => {
    if(poses.has(k)) return;
    const c = _rCellules(pc, k === _rang.sel ? _rang.rot : 0), w = Math.max(...c.map(p => p[0])) + 1, hh = Math.max(...c.map(p => p[1])) + 1;
    h += `<button class="mi-rg-piece${k === _rang.sel ? " actif" : ""}" data-rg-piece="${k}" style="grid-template-columns:repeat(${w},16px);grid-template-rows:repeat(${hh},16px)">`
       + c.map(([x, y]) => `<span style="grid-column:${x + 1};grid-row:${y + 1};background:${coul(k)}"></span>`).join("") + `</button>`;
  });
  h += `</div><div class="mi-btns"><button class="mini" data-rg-tourner="1">Tourner</button>
        <button class="mini" data-rg-valider="${m.id}"${_rang.pose.length ? "" : " disabled"}>Valider le rangement</button></div>`;
  return h;
}
function _mRangementMaj(z){ const zone = z.querySelector("#mi-rangement"); if(!zone || !_missions) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m || !m.vue || !m.vue.rangement) return;
  zone.innerHTML = _mRangementHtml(m); _mRangementBrancher(z); }
function _mRangementBrancher(z){
  const zone = z.querySelector("#mi-rangement"); if(!zone) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m) return;
  const R = m.vue.rangement;
  zone.querySelectorAll("[data-rg-piece]").forEach(b => b.addEventListener("click", () => { _rang.sel = +b.dataset.rgPiece; _rang.rot = 0; _rang.ap = null; _mRangementMaj(z); }));
  const bt = zone.querySelector("[data-rg-tourner]"); if(bt) bt.addEventListener("click", () => {
    _rang.rot = (_rang.rot + 1) % 4; const ap = _rang.ap; _mRangementMaj(z);
    if(ap != null){ const zz = z.querySelector("#mi-rangement"); if(zz) _rApercu(zz, R, ap); }   // l'aperçu suit la rotation
  });
  const grille = zone.querySelector(".mi-rg-grille");
  if(grille) grille.addEventListener("pointerleave", e => { if(e.pointerType === "mouse") _rApercu(zone, R, null); });
  zone.querySelectorAll("[data-rg-case]").forEach(c => {
    const i = +c.dataset.rgCase;
    c.addEventListener("pointerdown", e => { _rang.doigt = e.pointerType !== "mouse"; });
    c.addEventListener("pointerenter", e => { if(e.pointerType === "mouse") _rApercu(zone, R, i); });
    c.addEventListener("click", () => {
      const occ = _rOccupation(R);
      if(occ[i] != null){ _rang.pose.splice(occ[i], 1); _rang.ap = null; _mRangementMaj(z); return; }
      if(_rang.pose.some(p => p.p === _rang.sel)) return;
      if(_rang.doigt && _rang.ap !== i){ _rApercu(zone, R, i); return; }   // au doigt : d'abord voir
      const pl = _rPlacement(R, i);
      if(!pl.ok){ _rApercu(zone, R, i); return; }
      _rang.pose.push({ p:_rang.sel, r:_rang.rot, x:pl.x, y:pl.y });
      const libre = R.pieces.findIndex((_, k) => !_rang.pose.some(p => p.p === k)); if(libre >= 0){ _rang.sel = libre; _rang.rot = 0; }
      _rang.ap = null; _mRangementMaj(z);
    });
  });
  const bv = zone.querySelector("[data-rg-valider]");
  if(bv) bv.addEventListener("click", async () => {
    const pct = Math.round(Object.keys(_rOccupation(R)).length / (R.w * R.h) * 100);
    const ok = (typeof confirmerJoli === "function")
      ? await confirmerJoli("Valider le rangement", `Valider ce rangement (${pct} % rempli) ? Tu ne pourras plus le changer.`, "Valider")
      : confirm("Valider ?");
    if(!ok) return;
    bv.disabled = true;
    if(!await _mEssaiPayer()){ bv.disabled = false; return; }   // v2.17
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    const pose = _rang.pose.slice(); _rang = { cle:null, pose:[], sel:0, rot:0 };
    _missionAppel("infiltration_ranger", { p_mission:m.id, p_pose:pose }, d => `Ta part est rangée (${Math.round(d.score * 100)} %).`);
  });
}
function _mInfilBrancher(z){ _mParoiBrancher(z); _mRangementBrancher(z); }

/* ---------- La caisse scellée (H54) ---------- */
async function ouvrirCaisseArepo(id){
  try{
    const { data, error } = await sb.rpc("caisse_ouvrir", { p_item:id });
    if(error){ journal("Échec : " + error.message, "alerte"); return; }
    if(!data || !data.ok){ journal(MISSION_ERREURS[data && data.err] || "La caisse ne s'ouvre pas.", "alerte"); return; }
    if(data.etat && typeof _appliquerEtatStocks === "function") _appliquerEtatStocks(data.etat);
    const liste = Object.entries(data.objets || {}).map(([k, n]) => `${n > 1 ? n + " × " : ""}${_mNomItem(k)}`).join(", ");
    journal(`La caisse cède : ${liste}.`, "gain", "quete");
    if(typeof afficher === "function") afficher();
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "missions.js#caisse"); }
}

/* ===========================================================
   v1.67 — LE CASSE (C1-C21, H58-H65). Le recruteur (meneur) vise une cité ;
   un membre y fait « La ronde » (repérage, tiré et vérifié par le serveur) ;
   au plus tôt le lendemain, toute l'équipe dans la cité, le meneur commence ;
   crocheteur « Les goupilles », guetteur « Le brouillage » (client seul) ;
   puis « Vider les vitrines ». Le serveur revérifie la présence à chaque pas.
   =========================================================== */
const CASSE_NIVEAUX = ["Sans gardien","Sous un œil","Bien gardé","Sous haute surveillance"];
/* v2.15 (v238, K133) — LE REPÉRAGE EST UNE PHOTO DATÉE. Il a compté les vendeurs (hors membres
   du groupe) et la surveillance À CET INSTANT ; le butin se tire dans la vitrine du JOUR DU
   CASSE, et la surveillance est celle de ce jour-là (casse_vider). Retour de l'autrice :
   « 0 vendeur » restait affiché alors que d'autres avaient mis en vente depuis. */
function _mReperageHtml(rp){
  const d = rp.quand ? new Date(rp.quand) : null;
  const quand = d && !isNaN(d) ? `${d.toLocaleDateString("fr-FR", { day:"numeric", month:"numeric" })}, ${d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}`
              : String(rp.jour || "").slice(0, 10).split("-").reverse().slice(0, 2).join("/");
  const niv = (CASSE_NIVEAUX[rp.niveau] || "").replace(/^./, c => c.toLowerCase());
  const vend = rp.vendeurs > 0 ? `${rp.vendeurs} vendeur${rp.vendeurs > 1 ? "s" : ""} en vitrine` : "personne d'autre ne vendait en vitrine";
  return `<p style="margin:2px 0 6px">Au repérage${rp.par ? ` de ${echapper(rp.par)}` : ""} (${quand}) : ${vend}, ${niv}.</p>
    <p class="vide" style="margin:0 0 8px">Une vitrine vit sa vie : le butin se prendra dans celle du jour du casse, et la surveillance sera celle de ce jour-là.</p>`;
}
function _mFacNom(f){ const x = (typeof FACTIONS !== "undefined" ? FACTIONS : []).find(y => y.id === f); return x ? x.nom : f; }
function _mDansCite(f){ return typeof villeActuelle === "function" && villeActuelle() === f; }
function _mCasseCibleHtml(m, actuelle){
  const opts = (typeof FACTIONS !== "undefined" ? FACTIONS : []).map(f => `<option value="${f.id}"${f.id === actuelle ? " selected" : ""}>${echapper(f.nom)}</option>`).join("");
  return `<div class="mi-ligne"><span>Cité visée :</span><select id="mi-cible"><option value="">—</option>${opts}</select>
          <button class="mini" data-mi-viser="${m.id}">Viser cette cité</button></div>`;
}
function _mCasse(m, g){
  const v = m.vue || {};
  let h = `<h4 class="gsec">Le casse</h4>`;
  const pt = v.postes_tenus || {};
  h += `<p class="vide" style="margin:2px 0">Crocheteur : ${echapper(pt.crocheteur || "—")}${v.casse && v.casse.faits && v.casse.faits.crocheteur ? " ✓" : ""} · Guetteur : ${echapper(pt.guetteur || "—")}${v.casse && v.casse.faits && v.casse.faits.guetteur ? " ✓" : ""}</p>`;
  const f0 = (v.casse && v.casse.faits) || {};
  if(v.phase === "preparation") h += _mEtape("Étape 1 sur 3 — La préparation", "Un marché, ses vitrines, et toute une nuit devant vous. Mais un casse se prépare : choisir la cité, savoir combien de vendeurs exposent et comment veillent les drones, et ne rien oublier.", "Le meneur choisit la cité visée. Ensuite, dans l'ordre que vous voulez : remplissez le coffre commun (capes, crochets, brouilleurs) et faites le repérage sur place. Le casse se tente au plus tôt le lendemain du repérage, quand toute l'équipe est dans la cité.");   // v2.69 (K233)
  if(v.phase === "repousse") h += _mEtape("Seconde tentative", "La nuit a mal tourné, et le marché est sur ses gardes. Le matériel du coffre, lui, est resté.", `Le casse peut se retenter, ${_mQuandRetenter(v)}. C'est le meneur qui le relance.`);
  if(v.phase === "casse" && !(f0.crocheteur && f0.guetteur)) h += _mEtape("Étape 2 sur 3 — Le casse", "La nuit est tombée, le marché dort. Toute l'équipe est entrée, et personne ne ressort avant la fin : une serrure à forcer, des drones à aveugler.", "Le crocheteur ouvre la serrure, le guetteur brouille les drones ; les autres veillent.");
  if(v.phase === "casse" && f0.crocheteur && f0.guetteur) h += _mEtape("Étape 3 sur 3 — Les vitrines", "La serrure a cédé, les drones tournent à vide. Les vitrines sont là, à portée de main — mais le jour finira par se lever.", "Videz les vitrines, vite et sans bruit.");
  if(v.cible) h += `<p style="margin:4px 0">Cible : <b>le marché de ${echapper(_mFacNom(v.cible))}</b>.</p>`;
  if(v.cible && v.reperage) h += _mReperageHtml(v.reperage);   // v2.15 (K133) : une photo datée
  if(v.tentatives === 1 && v.phase === "repousse") h += `<p>Seconde tentative : du ${_mJourTxt(v.epreuve_jour, 1)} au ${_mJourTxt(v.epreuve_jour, 2)}.</p>`;
  if(v.phase === "preparation" || v.phase === "repousse"){
    if(v.meneur && !v.reperage) h += _mCasseCibleHtml(m, v.cible);
    h += _mCoffre(m);
    if(!v.reperage){
      if(!v.cible) return h;
      h += `<h4 class="gsec">Le repérage</h4><p class="vide" style="margin:2px 0 6px">Un seul d'entre vous suffit, dans la cité visée. Il en rapporte le nombre de vendeurs en vitrine et le niveau de surveillance.</p>`;   // v2.10
      if(!_mDansCite(v.cible)){ h += `<p>Rends-toi dans la cité visée pour le faire.</p>`; return h; }
      if(v.ronde) h += `<div id="mi-ronde" data-mi-mission="${m.id}">${_mRondeHtml(m)}</div>`;
      return h;
    }
    const auj = String(_missions && _missions.jour).slice(0, 10);
    const tot = String(v.reperage.jour).slice(0, 10) >= auj || (v.phase === "repousse" && String(v.epreuve_jour).slice(0, 10) >= auj);
    if(tot){ h += `<p class="vide">Le casse peut se tenter dès demain.</p>`; return h; }
    if(v.phase === "preparation") h += `<p class="vide">Premier casse au plus tard le ${_mJourTxt(v.limite)}.</p>`;
    if(v.meneur){
      if(v.absent) h += `<p class="vide">Toute l'équipe doit être dans la cité visée (il manque ${echapper(v.absent)}).</p>`;
      h += `<div class="mi-btns"><button class="mini" data-mi-commencer="${m.id}"${v.absent ? " disabled" : ""}>Commencer le casse</button></div>`;
    } else {   // v2.21 : on nomme le meneur (une testeuse cherchait le bouton : il n'est que chez lui)
      const qui = g && g.fondateur ? `Seul le meneur, ${echapper(g.fondateur)},` : "Seul le meneur";
      h += `<p class="vide">${qui} peut ${v.phase === "repousse" ? "relancer" : "commencer"} le casse. Il le fera quand toute l'équipe sera dans la cité${v.absent ? ` (il manque ${echapper(v.absent)})` : ""}.</p>`;
    }
    return h;
  }
  if(v.phase !== "casse") return h;
  const f = (v.casse && v.casse.faits) || {};
  if(f.crocheteur && f.guetteur){
    h += `<p class="quete-indice">Les vitrines sont là. Il faut faire vite, et sans bruit.</p>
          <div class="mi-btns"><button class="mini" data-mi-vider="${m.id}">Vider les vitrines</button></div>`;
    return h;
  }
  if(v.mon_poste === "crocheteur" && !f.crocheteur) h += `<div id="mi-goupilles" data-mi-mission="${m.id}">${_mEssaiPorte("goupilles", m.id, _mEssais.goupilles ? _mGoupillesHtml() : "")}</div>`;   // v2.17
  else if(v.mon_poste === "guetteur" && !f.guetteur) h += `<div id="mi-brouillage" data-mi-mission="${m.id}">${_mBrouillageHtml()}</div>`;
  else {
    /* v2.23b — retour d'une testeuse (guetteuse, brouillage réussi : « je n'ai pas le bouton pour la suite ») :
       « Vider les vitrines » n'apparaît qu'une fois la serrure ET le brouillage réussis. On dit ce qui reste, et à qui. */
    const pt = v.postes_tenus || {}, qui = p => pt[p] ? ` (${echapper(pt[p])})` : "";
    const reste = [!f.crocheteur ? `la serrure — le crocheteur${qui("crocheteur")}` : null,
                   !f.guetteur ? `le brouillage — le guetteur${qui("guetteur")}` : null].filter(Boolean);
    const fait = [f.crocheteur ? "La serrure est ouverte." : null, f.guetteur ? "Les drones sont brouillés." : null].filter(Boolean).join(" ");
    h += `<p class="vide">${fait ? fait + " " : ""}Il reste ${reste.join(" et ")}. Ensuite, chacun pourra vider les vitrines. Personne ne quitte la cité.</p>`;
  }
  return h;
}

/* ---------- « La ronde » (H64) : observer, puis prédire 3 pas plus tard ---------- */
const RONDE_COUL = ["#f59e0b","#5ab0e6","#7bc47f","#ff5257"];
let _ronde = { cle:null, t:0, phase:"pret", rep:[], timer:null };
function _mRondeHtml(m){
  const R = m.vue.ronde, cle = m.id + ":" + JSON.stringify(R.boucles);
  if(_ronde.cle !== cle){ if(_ronde.timer) clearInterval(_ronde.timer); _ronde = { cle, t:0, phase:"pret", rep:[], timer:null }; }
  const nb = R.boucles.length, k = _ronde.rep.length;
  let h = `<p style="margin:6px 0"><b>Regarde passer les drones, puis dis où chacun sera 3 pas plus tard.</b></p>`;
  if(_ronde.phase === "repondre") h += `<p class="vide" style="margin:2px 0">Drone ${k + 1} sur ${nb} : touche la case où il sera.</p>`;
  h += `<div class="mi-ro-grille">`;
  for(let i = 0; i < 36; i++){
    let pastille = "";
    if(_ronde.phase === "observer") R.boucles.forEach((b, d) => { if(b[_ronde.t % b.length] === i) pastille = `<span style="background:${RONDE_COUL[d]}"></span>`; });
    if(_ronde.phase === "repondre") _ronde.rep.forEach((c, d) => { if(c === i) pastille = `<span style="background:${RONDE_COUL[d]};opacity:.6"></span>`; });
    h += `<div class="mi-ro-case" data-ro-case="${i}">${pastille}</div>`;
  }
  h += `</div>`;
  if(_ronde.phase === "pret") h += `<div class="mi-btns"><button class="mini" data-ro-go="1">Observer</button></div>`;
  if(_ronde.phase === "observer") h += `<p class="vide">Pas ${_ronde.t} sur ${R.observe}…</p>`;
  return h;
}
function _mRondeMaj(z){ const zone = z.querySelector("#mi-ronde"); if(!zone || !_missions) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m || !m.vue || !m.vue.ronde) return;
  zone.innerHTML = _mRondeHtml(m); _mRondeBrancher(z); }
function _mRondeBrancher(z){
  const zone = z.querySelector("#mi-ronde"); if(!zone) return;
  const m = (_missions.missions || []).find(x => x.id === +zone.dataset.miMission); if(!m) return;
  const R = m.vue.ronde;
  const go = zone.querySelector("[data-ro-go]");
  if(go) go.addEventListener("click", () => {
    _ronde.phase = "observer"; _ronde.t = 0; _mRondeMaj(z);
    _ronde.timer = setInterval(() => {
      _ronde.t++;
      if(_ronde.t >= R.observe){ clearInterval(_ronde.timer); _ronde.timer = null; _ronde.phase = "repondre"; }
      _mRondeMaj(z);
    }, 450);
  });
  if(_ronde.phase === "repondre") zone.querySelectorAll("[data-ro-case]").forEach(c => c.addEventListener("click", () => {
    _ronde.rep.push(+c.dataset.roCase);
    if(_ronde.rep.length >= R.boucles.length){
      const rep = _ronde.rep.slice(); _ronde = { cle:null, t:0, phase:"pret", rep:[], timer:null };
      (async () => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
        const d = await _missionAppel("casse_ronde", { p_mission:m.id, p_reponses:rep }, "Repérage fait.");
        if(d && d.err === "faux") journal("Tu as perdu un drone de vue : recommence la ronde.", "alerte", "quete"); })();
    } else _mRondeMaj(z);
  }));
}

/* ---------- « Les goupilles » (H64) : 5 goupilles, zone de 30 % à 15 % ---------- */
let _goup = { k:0, pos:0, sens:1, raf:null, actif:false };
function _goupZone(k){ const w = 0.30 - k * 0.0375; return [0.5 - w / 2, 0.5 + w / 2]; }
function _goupAvancer(t){   // v1.89f : avance le curseur jusqu'à l'instant t (image ou appui)
  const dt = Math.min(0.1, Math.max(0, (t - (_goup.der || t)) / 1000)); _goup.der = t;
  _goup.pos += _goup.sens * dt * (0.55 + _goup.k * 0.18);
  if(_goup.pos >= 1){ _goup.pos = 2 - _goup.pos; _goup.sens = -1; } if(_goup.pos <= 0){ _goup.pos = -_goup.pos; _goup.sens = 1; }
  _goup.pos = Math.max(0, Math.min(1, _goup.pos));
}
function _mGoupillesHtml(){
  const [a, b] = _goupZone(_goup.k);
  return `<p style="margin:6px 0"><b>Touche quand le curseur passe dans le vert. Goupille ${_goup.k + 1} sur 5.</b></p>
    <div class="mi-gp"><div class="mi-gp-zone" style="left:${a * 100}%;width:${(b - a) * 100}%"></div><div class="mi-gp-cur" id="mi-gp-cur" style="left:${_goup.pos * 100}%"></div></div>
    <div class="mi-btns"><button class="mini" data-gp-bloquer="1">Bloquer</button></div>`;
}
function _mGoupillesBrancher(z){
  const zone = z.querySelector("#mi-goupilles"); if(!zone || !_mEssais.goupilles) return;   // v2.17 : rien ne tourne avant l'essai payé
  const id = +zone.dataset.miMission;
  if(!_goup.actif){
    _goup.actif = true;
    _goup.der = performance.now();
    const pas = t => {
      const zz = document.querySelector("#mi-goupilles"); if(!zz){ _goup.actif = false; return; }
      _goupAvancer(t);
      const c = zz.querySelector("#mi-gp-cur"); if(c) c.style.left = (_goup.pos * 100) + "%";
      _goup.raf = requestAnimationFrame(pas);
    };
    _goup.raf = requestAnimationFrame(pas);
  }
  /* v1.89f — même correctif que les goupilles des quêtes (quetes-jeux.js) : le coup part
     à l'APPUI (pas au relâchement), à la position de cet instant, avec la largeur du
     curseur en tolérance. */
  const b = zone.querySelector("[data-gp-bloquer]");
  if(b){ b.style.touchAction = "manipulation";
    b.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); b.dispatchEvent(new Event("pointerdown")); } }); }
  if(b) b.addEventListener("pointerdown", (ev) => {
    if(ev && ev.preventDefault) ev.preventDefault();
    _goupAvancer(performance.now());
    const [a, c] = _goupZone(_goup.k);
    const tol = (typeof GOUP_TOL === "number") ? GOUP_TOL : 0.012;
    if(_goup.pos >= a - tol && _goup.pos <= c + tol){
      _goup.k++;
      if(_goup.k >= 5){
        cancelAnimationFrame(_goup.raf); _goup = { k:0, pos:0, sens:1, raf:null, actif:false }; _mEssaiFin("goupilles");   // v2.17
        (async () => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
          _missionAppel("casse_poste", { p_mission:id }, "Serrure crochetée."); })();
        return;
      }
    } else { _goup.k = 0; journal("La serrure s'est refermée : recommence.", "alerte", "quete");
      cancelAnimationFrame(_goup.raf); _goup.actif = false; _mEssaiFin("goupilles");   // v2.17 : l'essai est fini
      if(typeof majQueteHub === "function") majQueteHub(); return; }
    zone.innerHTML = _mGoupillesHtml(); _mGoupillesBrancher(z);
  });
}

/* ---------- « Le brouillage » (H64) : caler son onde et la tenir 5 s ----------
   v2.17 — RETOUR D'UNE TESTEUSE (« je tiens 2,5 s max, c'est trop difficile ») : la même correction
   que le brouillage de Q29 (v1.93k, retour de l'autrice « il faut bouger les deux à la fois ») :
   · la FRÉQUENCE des drones est FIXE (tirée à l'émission, 1,2 → 2,4) ; trouvée (± 0,12), le curseur
     s'y cale et se verrouille : on la règle une fois ;
   · seul le DÉCALAGE dérive (0,35 rad/s) : on le suit (± 0,45 rad) ;
   · les secondes calées se CUMULENT : 5 s en tout, pendant une émission de 60 s.
   Avant : fréquence ET décalage dérivaient, et le compteur retombait à zéro au moindre écart — on
   ne tenait pas plus de 2,6 s sans bouger les deux curseurs à la fois.
   K135 : chaque émission coûte un essai (10 % d'énergie). */
const BROU_TENIR = 5, BROU_DUREE = 60;
let _brou = { actif:false };
function _mBrouillageHtml(){
  return `<p style="margin:6px 0"><b>Cale ton onde sur celle des drones : ${BROU_TENIR} s calé en tout, pendant une émission de ${BROU_DUREE} s.</b></p>
    <svg id="mi-br-svg" viewBox="0 0 300 100" style="width:100%;max-width:340px;background:rgba(90,168,230,.06);border:1px solid var(--line);border-radius:8px">
      <path id="mi-br-drones" stroke="#ff5257" stroke-width="3" fill="none"/><path id="mi-br-moi" stroke="#7bc47f" stroke-width="3" fill="none"/></svg>
    <div class="mi-ligne"><span>Fréquence</span><input type="range" id="mi-br-f" min="0.5" max="3" step="0.01" value="0.6" disabled></div>
    <p class="vide" id="mi-br-fetat" style="margin:2px 0 6px">Fréquence : à caler.</p>
    <div class="mi-ligne"><span>Décalage</span><input type="range" id="mi-br-d" min="0" max="6.28" step="0.01" value="0" disabled></div>
    <p class="vide" id="mi-br-tenu">Calé : 0,0 s / ${BROU_TENIR} s · émission : ${BROU_DUREE} s</p>
    <div class="mi-btns"><button class="mini" data-br-go="1">Commencer l'émission · ${_mEssaiCout()} % d'énergie</button></div>`;
}
function _mBrouillageBrancher(z){
  const zone = z.querySelector("#mi-brouillage"); if(!zone) return;
  const id = +zone.dataset.miMission;
  const f = zone.querySelector("#mi-br-f"), d = zone.querySelector("#mi-br-d"), go = zone.querySelector("[data-br-go]");
  const svg = zone.querySelector("#mi-br-svg"), dr = zone.querySelector("#mi-br-drones"), moi = zone.querySelector("#mi-br-moi");
  const et = zone.querySelector("#mi-br-tenu"), fet = zone.querySelector("#mi-br-fetat");
  if(!go || !f || !d) return;
  const P = { f:+f.value, d:0, tenu:0, s:0, fc:Math.round((1.2 + Math.random() * 1.2) * 100) / 100, fCalee:false };
  _brou = { actif:false, partie:P };                                       // (le banc d'essai lit _brou.partie)
  const caler = () => {
    if(P.fCalee || Math.abs(P.f - P.fc) >= 0.12) return;
    P.fCalee = true; P.f = P.fc; f.value = String(P.fc); f.disabled = true;
    fet.textContent = "Fréquence calée ✓ — elle ne bougera plus. Suis le décalage.";
  };
  f.addEventListener("input", () => { P.f = +f.value; caler(); });
  d.addEventListener("input", () => { P.d = +d.value; });
  const dessiner = () => { dr.setAttribute("d", _brouOnde(P.fc, _brouDecalage(P.s))); moi.setAttribute("d", _brouOnde(P.f, P.d)); };
  dessiner();
  go.addEventListener("click", async () => {
    go.disabled = true;
    if(!await _mEssaiPayer()){ go.disabled = false; return; }
    f.disabled = false; d.disabled = false; _brou.actif = true;
    const t0 = Date.now(); let der = t0;
    const pas = () => {
      if(!_brou.actif) return;
      if(!document.body.contains(svg)){ _brou.actif = false; return; }      // l'onglet a changé : l'émission s'arrête
      const t = Date.now(), dt = (t - der) / 1000; der = t; P.s = (t - t0) / 1000;
      if(P.fCalee && _brouPhaseOk(P.d, _brouDecalage(P.s))) P.tenu += dt;
      dessiner();
      et.textContent = `Calé : ${P.tenu.toFixed(1).replace(".", ",")} s / ${BROU_TENIR} s · émission : ${Math.max(0, BROU_DUREE - P.s).toFixed(0)} s`;
      if(P.tenu >= BROU_TENIR){
        _brou.actif = false;
        (async () => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
          _missionAppel("casse_poste", { p_mission:id }, "Les drones sont brouillés."); })();
        return;
      }
      if(P.s >= BROU_DUREE){
        _brou.actif = false; journal("L'émission est finie et les drones ne sont pas brouillés : recommence.", "alerte", "quete");
        if(typeof majQueteHub === "function") majQueteHub();
        return;
      }
      setTimeout(pas, 40);
    };
    pas();
  });
}
function _mCasseBrancher(z){ _mRondeBrancher(z); _mGoupillesBrancher(z); _mBrouillageBrancher(z); }

/* ===========================================================
   v1.68 — LE SATELLITE À LA DÉRIVE (S1-S5, H67-H73). Bardane (Triptolème) :
   chacun s'y signale ; les quatre le même jour → l'escorte ; les deux tirs
   (client seul), puis l'épreuve ; ensuite le sas (mastermind : le serveur garde
   le code et répond essai par essai) et le cœur (« Traversée de pare-feu »
   existante, espionnage.js `_espF1`, client seul). Réglages : la vue (H70).
   =========================================================== */
function _mABardane(){
  return (typeof enEcart === "function" && enEcart()) && typeof surLieuEspace === "function"
      && typeof espaceLieu === "function" && surLieuEspace(espaceLieu("satellite1"));
}
const SAS_COUL = ["#ff5257","#a970ff","#facc15","#7bc47f","#5ab0e6","#e5e7eb"];   // v2.68 : l'orange (#f59e0b) se confondait avec le jaune → violet
function _mSatellite(m){
  const v = m.vue || {}; const ici = _mABardane(); const auj = String(_missions && _missions.jour).slice(0, 10);
  let h = `<h4 class="gsec">Bardane</h4>`;
  const pt = v.postes_tenus || {};
  const ET_SAT = { rendezvous:["Étape 1 sur 4 — Le rendez-vous", "La sonde Bardane dérive dans Triptolème depuis trois siècles, éteinte, avec dans son ventre des modules d'AREPO intacts. Ses vieilles gardiennes tournent encore autour d'elle : seul, on ne l'approche pas. À quatre, peut-être.", "Chacun rejoint Bardane avec son vaisseau et s'y signale. Quand les quatre sont là le même jour, l'escorte se réveille. Remplissez le coffre commun avant."],   // v2.69 (K233)
                   rendezvous2:["Seconde tentative", "L'escorte vous a dispersés, mais Bardane dérive toujours, et le matériel du coffre est resté.", `Un nouveau rendez-vous des quatre est possible, ${_mQuandRetenter(v)}.`],
                   escorte:["Étape 2 sur 4 — L'escorte", "Vos quatre signaux ont réveillé ce qui veille sur Bardane. Des sondes gardiennes se détachent de la coque et foncent sur vous ; derrière elles, des gardiennes plus lourdes attendent leur tour.", "Les deux artilleurs abattent les sondes ; puis tout le groupe repousse les gardiennes."],
                   sas:["Étape 3 sur 4 — Le sas", "L'escorte dispersée, Bardane est à vous… presque. Sa seule porte est un sas scellé, gardé par quatre voyants : la bonne combinaison l'ouvre, une mauvaise le verrouille, et tout est à recommencer.", "L'ingénieur trouve la combinaison ; les autres restent à ses côtés."],
                   coeur:["Étape 4 sur 4 — Le cœur", "Derrière le sas, un couloir mort, puis le cœur de Bardane : le cerveau de la sonde, qui veille encore sur ses baies. Tant qu'il veille, rien ne s'ouvre.", "Le hacker pirate le cœur. S'il cède, chacun repart avec un module d'AREPO."] }[v.phase];
  if(ET_SAT) h += _mEtape(ET_SAT[0], ET_SAT[1], ET_SAT[2]);
  h += `<p class="vide" style="margin:2px 0">Artilleurs : ${(pt.artilleur || []).map(echapper).join(", ") || "—"} · Hacker : ${(pt.hacker || []).map(echapper).join(", ") || "—"} · Ingénieur : ${(pt.ingenieur || []).map(echapper).join(", ") || "—"}</p>`;
  if(v.phase === "rendezvous" || v.phase === "rendezvous2"){
    h += _mCoffre(m);
    if(v.phase === "rendezvous2") h += `<p>Seconde tentative : du ${_mJourTxt(v.epreuve_jour, 1)} au ${_mJourTxt(v.epreuve_jour, 2)}.</p>`;
    if((v.signales || []).length) h += `<p class="vide">Signalés aujourd'hui : ${v.signales.map(echapper).join(", ")} (${v.signales.length} sur 4).</p>`;
    if(!ici){ h += `<p>Rendez-vous à Bardane (carte de Triptolème), chacun avec son vaisseau : quand les quatre s'y seront signalés le même jour, l'escorte attaquera.${v.phase === "rendezvous" ? ` Premier rendez-vous au plus tard le ${_mJourTxt(v.limite)}.` : ""}</p>`; return h; }
    if(v.phase === "rendezvous2" && String(v.epreuve_jour).slice(0, 10) >= auj){ h += `<p class="vide">Le prochain rendez-vous se fera demain.</p>`; return h; }
    h += v.moi_signale ? `<p class="vide">Tu t'es signalé. On attend les autres.</p>`
                       : `<div class="mi-btns"><button class="mini" data-mi-signaler="${m.id}">Se signaler</button></div>`;
    return h;
  }
  if(v.phase === "escorte"){
    const tirs = Object.keys((v.escorte && v.escorte.tirs) || {}).length;
    if(!ici){ h += `<p>L'escorte attaque à Bardane : rejoins-la avant minuit.</p>`; return h; }
    if(tirs >= 2){ h += `<p class="quete-indice">Les gardiennes chargent.</p><div class="mi-btns"><button class="mini" data-mi-escorte="${m.id}">Repousser l'escorte</button></div>`; return h; }
    if(v.mon_poste === "artilleur" && v.tir) h += `<div id="mi-tir" data-mi-mission="${m.id}">${_mTirHtml(v.tir)}</div>`;
    else h += `<p class="vide">Les artilleurs tiennent les canons : ${tirs} sur 2 ont abattu leur part des sondes.</p>`;
    return h;
  }
  if(v.phase === "sas" || v.phase === "coeur"){
    h += `<p class="vide">Bardane ne restera pas à portée longtemps : le sas et le cœur doivent céder au plus tard le ${_mJourTxt(v.sas_limite)}.</p>`;   // v2.69 (K233)
    if(!ici){ h += `<p>Rends-toi à Bardane (carte de Triptolème).</p>`; return h; }
    if(v.phase === "sas"){
      if(v.mon_poste === "ingenieur" && v.sas) h += `<div id="mi-sas" data-mi-mission="${m.id}">${_mEssaiPorte("sas", m.id, _mEssais.sas ? _mSasHtml(v.sas) : "")}</div>`;   // v2.17
      else h += `<p class="vide">${(pt.ingenieur || []).map(echapper).join(", ") || "L'ingénieur"} cherche la combinaison du sas. Reste à ses côtés.</p>`;
      return h;
    }
    if(v.mon_poste === "hacker" && v.coeur) h += `<div class="mi-btns"><button class="mini" data-mi-coeur="${m.id}" data-mi-vig="${v.coeur.vigilance}">Pirater le cœur · ${_mEssaiCout()} % d'énergie</button></div>`;
    else h += `<p class="vide">${(pt.hacker || []).map(echapper).join(", ") || "Le hacker"} s'attaque au cœur de Bardane. Reste à ses côtés.</p>`;
  }
  return h;
}

/* ---------- Le tir (H70) : abattre 10 sondes ---------- */
let _tir = { actif:false, touches:0, tirs:0, fin:0, sondes:[], raf:null };
function _mTirHtml(t){
  return `<p style="margin:6px 0"><b>Abats les sondes qui traversent l'écran : ${t.cible} à toucher. Tirs : ${t.tirs}. Temps : ${t.duree} s.</b></p>
    <svg id="mi-tir-svg" viewBox="0 0 300 180" style="width:100%;max-width:360px;background:#060b14;border:1px solid var(--line);border-radius:8px;touch-action:none"></svg>
    <p class="vide" id="mi-tir-etat">Touchées : 0 / ${t.cible} · Tirs : ${t.tirs} · ${t.duree} s</p>
    <div class="mi-btns"><button class="mini" data-tir-go="1">Ouvrir le feu · ${_mEssaiCout()} % d'énergie</button></div>`;
}
function _mSatBrancher(z){
  const zt = z.querySelector("#mi-tir");
  if(zt){
    const m = (_missions.missions || []).find(x => x.id === +zt.dataset.miMission); const T = m && m.vue && m.vue.tir;
    const go = zt.querySelector("[data-tir-go]"); const svg = zt.querySelector("#mi-tir-svg");
    if(go && T) go.addEventListener("click", async () => {
      go.disabled = true;
      if(!await _mEssaiPayer()){ go.disabled = false; return; }   // v2.17
      _tir = { actif:true, touches:0, tirs:T.tirs, fin:performance.now() + T.duree * 1000, sondes:[], raf:null, der:performance.now(), pause:0 };
      const rater = msg => { _tir.actif = false; journal(msg, "alerte", "quete"); zt.innerHTML = _mTirHtml(T); _mSatBrancher(z); };
      const pas = t => {
        if(!_tir.actif || !document.body.contains(svg)) return;
        const dt = (t - _tir.der) / 1000; _tir.der = t;
        _tir.pause -= dt; if(_tir.pause <= 0){ _tir.pause = 0.6 + Math.random() * 0.6; _tir.sondes.push({ x:-12, y:20 + Math.random() * 140, v:70 + Math.random() * 60 }); }
        _tir.sondes.forEach(s => s.x += s.v * dt); _tir.sondes = _tir.sondes.filter(s => s.x < 315);
        svg.innerHTML = _tir.sondes.map((s, i) => `<g data-sonde="${i}"><circle cx="${s.x}" cy="${s.y}" r="11" fill="#ff525733" stroke="#ff5257" stroke-width="2"/><circle cx="${s.x}" cy="${s.y}" r="3" fill="#ff5257"/></g>`).join("");
        const reste = Math.max(0, (_tir.fin - t) / 1000);
        const e = zt.querySelector("#mi-tir-etat"); if(e) e.textContent = `Touchées : ${_tir.touches} / ${T.cible} · Tirs : ${_tir.tirs} · ${Math.ceil(reste)} s`;
        if(reste <= 0) return rater("Les sondes sont passées : recommence.");
        _tir.raf = requestAnimationFrame(pas);
      };
      svg.addEventListener("pointerdown", e => {
        if(!_tir.actif || _tir.tirs <= 0) return;
        const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * 300 / r.width, y = (e.clientY - r.top) * 180 / r.height;
        _tir.tirs--;
        const k = _tir.sondes.findIndex(s => Math.hypot(s.x - x, s.y - y) <= 14);
        if(k >= 0){ _tir.sondes.splice(k, 1); _tir.touches++; }
        if(_tir.touches >= T.cible){
          _tir.actif = false;
          (async () => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
            _missionAppel("satellite_tir", { p_mission:m.id }, "Ta part des sondes est abattue."); })();
        } else if(_tir.tirs <= 0) rater("Les sondes sont passées : recommence.");
      });
      _tir.raf = requestAnimationFrame(pas);
    });
  }
  _mSasBrancher(z);
}

/* ---------- Le sas (H70) : mastermind, le serveur répond ---------- */
let _sas = { essai:[], manche:null, fin:0, timer:null };
function _mSasHtml(S){
  if(_sas.manche !== S.manche){ _sas = { essai:[], manche:S.manche, fin:Date.now() + S.duree * 1000, timer:null }; }
  const restants = S.essais - (S.historique || []).length;
  let h = `<p style="margin:6px 0"><b>Trouve la combinaison : 4 voyants, 6 couleurs. Essais : ${restants}.</b> <span class="vide" id="mi-sas-temps"></span></p>`;
  h += (S.historique || []).map(x => `<div class="mi-sas-ligne">${(x.essai || []).map(c => `<span class="mi-sas-v" style="background:${SAS_COUL[c]}"></span>`).join("")}
         <span class="vide">● ${x.bien} · ○ ${x.mal}</span></div>`).join("");
  h += `<div class="mi-sas-ligne">${[0,1,2,3].map(k => `<span class="mi-sas-v vide-v" ${_sas.essai[k] != null ? `style="background:${SAS_COUL[_sas.essai[k]]}"` : ""}></span>`).join("")}</div>`;
  h += `<div class="mi-btns">${SAS_COUL.map((c, i) => `<button class="mi-sas-c" data-sas-c="${i}" style="background:${c}"></button>`).join("")}
        <button class="mini" data-sas-eff="1">Effacer</button><button class="mini" data-sas-ok="1"${_sas.essai.length === 4 ? "" : " disabled"}>Essayer</button></div>
        <p class="vide" style="margin:2px 0">● bien placés · ○ de la bonne couleur, mal placés.</p>`;
  return h;
}
function _mSasBrancher(z){
  const zs = z.querySelector("#mi-sas"); if(!zs || !_mEssais.sas) return;   // v2.17 : pas de manche (ni de minuteur) avant l'essai payé
  const m = (_missions.missions || []).find(x => x.id === +zs.dataset.miMission); if(!m || !m.vue || !m.vue.sas) return;
  const maj = () => { zs.innerHTML = _mSasHtml(m.vue.sas); _mSasBrancher(z); };
  zs.querySelectorAll("[data-sas-c]").forEach(b => b.addEventListener("click", () => { if(_sas.essai.length < 4){ _sas.essai.push(+b.dataset.sasC); maj(); } }));
  const be = zs.querySelector("[data-sas-eff]"); if(be) be.addEventListener("click", () => { _sas.essai.pop(); maj(); });
  const bo = zs.querySelector("[data-sas-ok]");
  if(bo) bo.addEventListener("click", async () => {
    bo.disabled = true; const essai = _sas.essai.slice(); _sas.essai = [];
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    const d = await _missionAppel("satellite_sas", { p_mission:m.id, p_essai:essai, p_abandon:false }, x => x.ouvert ? "Le sas s'ouvre." : null);   // v2.68 : chaque essai n'encombre plus le journal (il reste à l'écran)
    if(d && d.err === "verrouille") journal("Le sas se verrouille : un autre code.", "alerte", "quete");
    if(!d || d.ouvert || d.err === "verrouille" || d.verrouille){ _mEssaiFin("sas"); _sas.manche = null; if(typeof majQueteHub === "function") majQueteHub(); }   // v2.17 : la manche est finie
  });
  // Temps de la manche (H70) : écoulé → le sas se verrouille, nouvelle manche.
  if(_sas.timer) clearInterval(_sas.timer);
  _sas.timer = setInterval(async () => {
    const zz = document.querySelector("#mi-sas-temps"); if(!zz){ clearInterval(_sas.timer); return; }
    const reste = Math.ceil((_sas.fin - Date.now()) / 1000);
    zz.textContent = `· ${Math.max(0, reste)} s`;
    if(reste <= 0){
      clearInterval(_sas.timer); _sas.manche = null; _mEssaiFin("sas");   // v2.17 : la manche est finie
      await _missionAppel("satellite_sas", { p_mission:m.id, p_essai:[], p_abandon:true });
      journal("Le sas se verrouille : un autre code.", "alerte", "quete");
    }
  }, 1000);
}

/* ---------- Branchements ---------- */
function _mBrancher(z){
  // v2.14 — le fil : il reste ouvert d'un redessin à l'autre.
  z.querySelectorAll("[data-mi-fil]").forEach(d => d.addEventListener("toggle", () => { _mFilOuvert[d.dataset.miFil] = d.open; }));
  const q = (sel, fn) => z.querySelectorAll(sel).forEach(b => b.addEventListener("click", () => { if(b.disabled) return; b.disabled = true; fn(b); }));
  q("[data-mi-gain]", b => _missionAppel("mission_gain_recuperer", { p_gain:+b.dataset.miGain },
      d => `Récupéré : ${d.qte} × ${_mNomItem(d.item)}.`));
  q("[data-mi-inv]", b => _missionAppel("mission_invitation_repondre", { p_groupe:+b.dataset.miInv, p_accepte:b.dataset.miRep === "1" },
      d => d.refuse ? "Invitation déclinée." : "Tu as rejoint le groupe."));
  q("[data-mi-creer]", b => _missionAppel("mission_groupe_creer", { p_mission:+b.dataset.miCreer, p_ouvert:b.dataset.miOuvert === "1" },
      "Groupe fondé."));
  q("[data-mi-rejoindre]", b => _missionAppel("mission_rejoindre", { p_groupe:+b.dataset.miRejoindre }, "Tu as rejoint le groupe."));
  q("[data-mi-inviter]", b => {
    const nom = ((z.querySelector("#mi-inv-nom") || {}).value || "").trim();
    if(!nom){ b.disabled = false; return; }
    _missionAppel("mission_inviter", { p_groupe:+b.dataset.miInviter, p_nom:nom }, `Invitation envoyée à ${nom}.`);
  });
  q("[data-mi-lancer]", b => _missionAppel("mission_lancer", { p_groupe:+b.dataset.miLancer }, "Ton groupe est parti."));
  q("[data-mi-quitter]", b => _missionAppel("mission_quitter", { p_mission:+b.dataset.miQuitter }, "Tu as quitté le groupe."));
  q("[data-mi-abandon]", async b => {
    const ok = (typeof confirmerJoli === "function")
      ? await confirmerJoli("Abandonner la mission", "Tu ne toucheras aucune récompense, ton matériel déposé reste au coffre, et tu ne pourras pas reprendre cette mission. Si le groupe tombe sous le nombre requis, la mission est ratée pour tous.", "Abandonner", true)
      : confirm("Abandonner la mission ?");
    if(!ok){ b.disabled = false; return; }
    _missionAppel("mission_quitter", { p_mission:+b.dataset.miAbandon }, "Tu as abandonné la mission.");
  });
  /* v2.13 — la quantité ne dépasse pas ce qu'on a (retour de l'autrice : « on peut rajouter plus que
     ce qu'on a »). Le serveur ne déposait déjà que ce qu'on avait (v236 : et seulement ce qui sort
     vraiment du sac). */
  { const sel = z.querySelector("#mi-dep-item"), qte = z.querySelector("#mi-dep-qte");
    if(sel && qte){
      const borner = () => { const mx = Math.max(1, ((typeof etat !== "undefined" && etat.sac) || {})[sel.value] || 1);
                             qte.max = mx; if(Number(qte.value) > mx) qte.value = mx; if(!(Number(qte.value) >= 1)) qte.value = 1; };
      sel.addEventListener("change", borner); qte.addEventListener("change", borner); qte.addEventListener("input", borner); borner();
    } }
  q("[data-mi-deposer]", b => {
    const it = (z.querySelector("#mi-dep-item") || {}).value;
    const mx = ((typeof etat !== "undefined" && etat.sac) || {})[it] || 0;
    const n = Math.min(mx, Math.round(Number((z.querySelector("#mi-dep-qte") || {}).value)));
    if(!it || !(n >= 1)){ b.disabled = false; return; }
    _missionAppel("mission_deposer", { p_mission:+b.dataset.miDeposer, p_item:it, p_qte:n },
      d => d.depose < d.demande
        ? `Déposé : ${d.depose} × ${_mNomItem(it)} (${d.limite === "sac" ? "tu n'en avais pas plus" : "le coffre n'en prenait pas plus"}).`
        : `Déposé : ${d.depose} × ${_mNomItem(it)}.`);
  });
  // v1.63 — la bouture : faire fuir les drones, puis « Les racines ».
  q("[data-mi-fuir]", async b => {
    if(typeof sauverMaintenant === "function") await sauverMaintenant();   // la position doit être à jour côté serveur
    _missionAppel("bouture_faire_fuir", { p_mission:+b.dataset.miFuir },
      d => d.reussi ? "Les drones ont fui." : (d.definitif ? "Les drones gardent la bouture." : "Les drones ont tenu bon."));
  });
  _mRacinesBrancher(z);
  // v1.64 — la balise : unités, descente, postes, tourelle.
  q("[data-mi-unite]", b => _missionAppel("mission_deposer_unites",
      { p_mission:+b.dataset.miUnite, p_sorte:b.dataset.miSorte, p_recette:+b.dataset.miRec, p_n:+b.dataset.miN },
      d => `Déposé : ${d.unites} unité${d.unites > 1 ? "s" : ""}.`));
  q("[data-mi-descendre]", async b => {
    const v = ((_missions.missions || []).find(x => x.id === +b.dataset.miDescendre) || {}).vue || {};
    const mn = +b.dataset.miMinutes || 600;
    const ok = (typeof confirmerJoli === "function")
      ? await confirmerJoli("Lancer la descente", `Lancer la descente ? Le coffre sera scellé et la tempête tombera dans ${Math.floor(mn / 60)} h ${String(mn % 60).padStart(2, "0")} min. Chacun devra jouer son poste à la balise avant elle.`, "Lancer la descente")
      : confirm("Lancer la descente ?");
    if(!ok){ b.disabled = false; return; }
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("balise_descendre", { p_mission:+b.dataset.miDescendre }, "La descente commence.");
  });
  q("[data-mi-tourelle]", async b => {
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("balise_tourelle", { p_mission:+b.dataset.miTourelle },
      d => d.reussi ? "La tourelle s'est tue." : (d.definitif ? "La tourelle tient bon." : "La tourelle vous a repoussés."));
  });
  _mBaliseBrancher(z);
  // v1.65 — l'infiltration
  q("[data-mi-sentinelles]", async b => {
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("infiltration_sentinelles", { p_mission:+b.dataset.miSentinelles },
      d => d.reussi ? "Les sentinelles se sont tues." : (d.definitif ? "Les sentinelles tiennent bon." : "Les sentinelles vous ont repoussés."));
  });
  _mInfilBrancher(z);
  // v1.67 — le casse
  q("[data-mi-viser]", b => {
    const sel = z.querySelector("#mi-cible"); if(!sel || !sel.value){ b.disabled = false; return; }
    _missionAppel("casse_cible", { p_mission:+b.dataset.miViser, p_faction:sel.value }, "Cible choisie.");
  });
  q("[data-mi-commencer]", async b => {
    const ok = (typeof confirmerJoli === "function")
      ? await confirmerJoli("Commencer le casse", "Commencer le casse ? Le coffre sera scellé. Personne ne doit quitter la cité avant la fin, et tout doit être joué avant minuit.", "Commencer")
      : confirm("Commencer le casse ?");
    if(!ok){ b.disabled = false; return; }
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("casse_commencer", { p_mission:+b.dataset.miCommencer }, "Le casse commence.");
  });
  q("[data-mi-vider]", async b => {
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("casse_vider", { p_mission:+b.dataset.miVider },
      d => d.reussi ? `Le casse a réussi : ${d.offres} offre${d.offres > 1 ? "s" : ""} emportée${d.offres > 1 ? "s" : ""}.` : (d.definitif ? "Le brouillage a lâché une seconde fois, et les drones vous ont repérés." : "Le brouillage a lâché pendant que vous vidiez les vitrines : les drones vous ont repérés."));   // v2.21
  });
  _mCasseBrancher(z);
  // v1.68 — le satellite
  q("[data-mi-signaler]", async b => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("satellite_signaler", { p_mission:+b.dataset.miSignaler }, "Tu t'es signalé à Bardane."); });
  q("[data-mi-escorte]", async b => { if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("satellite_escorte", { p_mission:+b.dataset.miEscorte },
      d => d.reussi ? "L'escorte est repoussée." : (d.definitif ? "L'escorte tient bon." : "L'escorte vous a dispersés.")); });
  q("[data-mi-coeur]", async b => {
    if(typeof _espF1 !== "function"){ b.disabled = false; return; }
    if(!await _mEssaiPayer()){ b.disabled = false; return; }   // v2.17
    const ok = await _espF1(+b.dataset.miVig);
    if(!ok){ b.disabled = false; return; }
    if(typeof sauverMaintenant === "function") await sauverMaintenant();
    _missionAppel("satellite_coeur", { p_mission:+b.dataset.miCoeur }, "Le cœur de Bardane s'ouvre.");
  });
  _mSatBrancher(z);
  // v2.17 (K135) — la porte d'un essai : payer, puis ouvrir le jeu.
  q("[data-mi-essai]", async b => {
    const jeu = b.dataset.miEssai;
    if(await _mEssaiPayer()) _mEssais[jeu] = true;
    b.disabled = false;
    if(typeof majQueteHub === "function") majQueteHub();
  });
  const sp = z.querySelector("#mi-poste");
  if(sp) sp.addEventListener("change", () => _missionAppel("mission_poste_choisir", { p_mission:+sp.dataset.miMission, p_poste:sp.value || null }));
}

/* ---------- Style ---------- */
(function(){
  const st = document.createElement("style");
  st.textContent = `
    .mi-carte{ border:1px solid var(--line); border-radius:var(--r-s,8px); padding:10px 12px; margin:0 0 12px; background:rgba(16,40,37,.25); }
    .mi-test{ font-family:"Space Mono",monospace; font-size:11px; letter-spacing:.1em; color:var(--orange-hi,#ffb060); border:1px solid currentColor; border-radius:4px; padding:1px 5px; vertical-align:middle; }
    .mi-ligne{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:6px 0; }
    .mi-ligne input, .mi-ligne select{ background:#0f1830; border:1px solid var(--line); border-radius:8px; color:var(--texte); padding:6px 8px; font-family:inherit; }
    .mi-ligne input#mi-inv-nom{ flex:1; min-width:150px; }
    .mi-btns{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:6px 0; }
    .mi-membres{ display:flex; flex-wrap:wrap; gap:6px; }
    .mi-membre{ font-family:"Space Mono",monospace; font-size:12px; background:rgba(90,168,230,.12); border:1px solid var(--line); border-radius:6px; padding:3px 8px; }
    .mi-abandon{ opacity:.5; }
    .mi-coffre{ width:100%; border-collapse:collapse; margin:4px 0; }
    .mi-fil{ margin:10px 0 4px; }
    .mi-fil summary{ cursor:pointer; font-weight:600; }
    .mi-fil ol{ list-style:none; margin:6px 0 0; padding:0; max-height:220px; overflow-y:auto; font-size:13.5px; line-height:1.45; }
    .mi-fil li{ padding:3px 0; border-bottom:1px solid rgba(255,255,255,.06); }
    .mi-fil-q{ font-family:"Space Mono",monospace; font-size:11px; color:var(--sourdine,#8a97ab); margin-right:4px; }
    .mi-etape{ border-left:3px solid var(--bleu,#5aa8e6); background:rgba(90,168,230,.08); padding:6px 10px; margin:6px 0 10px; line-height:1.5; }
    .mi-etape b{ display:block; margin-bottom:2px; }
    .mi-postes{ margin:2px 0 8px; font-size:13.5px; line-height:1.45; }
    .mi-postes p{ margin:2px 0; }
    .mi-coffre td{ border-bottom:1px solid var(--line); padding:5px 4px; vertical-align:top; }
    .mi-coffre td.mi-n{ text-align:right; white-space:nowrap; font-family:"Space Mono",monospace; }
    .mi-coffre td.mi-manque{ color:var(--orange-hi,#ffb060); }
    .mi-gain{ border-left-color:var(--bleu); }
    .mi-jours{ display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin:6px 0 10px; }
    .mi-jour{ border:1px solid var(--line); border-radius:8px; padding:5px 6px; font-size:12px; display:flex; flex-direction:column; gap:2px; opacity:.75; }
    .mi-jour.ok{ border-color:#7bc47f; opacity:1; }
    .mi-jour.auj{ outline:2px solid var(--bleu); opacity:1; }
    .mi-r-outils{ display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin:4px 0 8px; }
    .mi-r-outils .actif{ outline:2px solid var(--bleu); }
    .mi-r-compte{ font-family:"Space Mono",monospace; font-size:12px; margin-left:auto; }
    .mi-r-compte.trop{ color:var(--orange-hi,#ffb060); }
    .mi-r-grille{ display:grid; grid-template-columns:repeat(5, 1fr); gap:3px; max-width:300px; }
    .mi-r-case{ aspect-ratio:1; background:rgba(40,70,40,.35); border:1px solid var(--line); border-radius:6px; cursor:pointer; }
    .mi-r-case svg{ width:100%; height:100%; display:block; }
    .mi-r-case.caillou{ background:radial-gradient(circle at 45% 40%, #8a8f96 0 38%, rgba(40,70,40,.35) 40%); cursor:default; }
    .mi-r-bord{ display:grid; grid-template-columns:repeat(5, 1fr); gap:3px; max-width:300px; font-family:"Space Mono",monospace; font-size:11px; text-align:center; color:#7bc47f; min-height:16px; }
    .mi-r-bord.eau{ color:#5ab0e6; }
    .mi-cv-grille{ display:grid; gap:0; max-width:330px; background:#060b14; border:1px solid var(--line); border-radius:6px; padding:2px; }
    .mi-cv{ aspect-ratio:1; box-sizing:border-box; }
    .mi-cv.vu{ background:rgba(125,211,252,.10); }
    .mi-cv.moi{ background:radial-gradient(circle, #ffe6a8 0 30%, rgba(125,211,252,.18) 32%); }
    .mi-cv.sortie{ box-shadow:inset 0 -4px 0 #7bc47f; }
    .mi-cv-fleches button{ min-width:44px; font-size:18px; }
    .mi-msg{ display:flex; flex-wrap:wrap; gap:6px 4px; align-items:flex-end; margin:6px 0 10px; }
    .mi-msg-sep{ width:14px; }
    .mi-msg-inconnu .gly{ color:var(--orange-hi,#ffb060); }
    .mi-pratique{ display:block; margin-top:6px; font-size:.95em; opacity:.85; }   /* v2.69 (K233) : la ligne pratique d'une étape */
    .mi-rg-grille{ display:grid; gap:3px; max-width:360px; margin:4px 0; touch-action:manipulation; user-select:none; -webkit-user-select:none; }
    .mi-rg-case{ aspect-ratio:1; background:rgba(245,158,11,.08); border:1px solid var(--line); border-radius:3px; cursor:pointer; touch-action:manipulation; }
    .mi-rg-case.mi-rg-ap{ background:rgba(123,196,127,.55); border-color:#7bc47f; }   /* v2.65 (K222) : aperçu, ça tient */
    .mi-rg-case.mi-rg-ko{ background:rgba(255,82,87,.40); border-color:#ff5257; }     /* aperçu, ça ne tient pas */
    .mi-rg-pieces{ display:flex; flex-wrap:wrap; gap:8px; margin:6px 0; }
    .mi-rg-piece{ display:grid; gap:1px; padding:5px; background:transparent; border:1px solid var(--line); border-radius:6px; cursor:pointer; }
    .mi-rg-piece.actif{ outline:2px solid var(--bleu); }
    .mi-rg-piece{ touch-action:manipulation; }
    .mi-rg-piece span{ display:block; width:16px; height:16px; border-radius:2px; }
    .mi-ro-grille{ display:grid; grid-template-columns:repeat(6,1fr); gap:3px; max-width:300px; margin:4px 0; }
    .mi-ro-case{ aspect-ratio:1; background:rgba(207,214,223,.08); border:1px solid var(--line); border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .mi-ro-case span{ width:60%; height:60%; border-radius:50%; display:block; }
    .mi-gp{ position:relative; height:26px; max-width:320px; background:rgba(207,214,223,.08); border:1px solid var(--line); border-radius:13px; margin:6px 0; overflow:hidden; }
    .mi-gp-zone{ position:absolute; top:0; bottom:0; background:rgba(123,196,127,.45); }
    .mi-sas-ligne{ display:flex; gap:6px; align-items:center; margin:3px 0; }
    .mi-sas-v{ width:22px; height:22px; border-radius:50%; display:inline-block; border:1px solid var(--line); }
    .mi-sas-v.vide-v{ background:transparent; }
    .mi-sas-c{ width:30px; height:30px; border-radius:50%; border:2px solid var(--line); cursor:pointer; }
    .mi-gp-cur{ position:absolute; top:2px; bottom:2px; width:4px; margin-left:-2px; background:#f5e9d3; border-radius:2px; }
  `;
  document.head.appendChild(st);
})();
