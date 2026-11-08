// v2.47 — retours des testeuses : (1) équiper un vaisseau depuis l'onglet Vaisseau ; (2) un duel = une
// ligne ; (3) la boutique mobile partout ; (4) le bandeau de la carte spatiale ; (6) l'avatar garde sa
// position ; (7) la liste des personnages par ordre alphabétique ; (9) les lignes des consoles → Système.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  const msgs = []; const vraiJ = journal;
  journal = (t, ton, cat) => msgs.push({ t:String(t), cat }); sauvegarder = () => {}; sauverMaintenant = async () => {};

  // (9) Les lignes des consoles.
  r.consoles = ["[DEV→admin] changement de faction DÉBLOQUÉ (pour TOUS les joueurs).", "[STAFF] Kyraa remis à 100 %.", "[ADMIN] regent de ignis → Kyraa."].map(_categoriser);   // systeme ×3
  r.factionNormale = _categoriser("Ta faction a changé de Régent.");   // faction (inchangé)

  // (7) La liste des personnages : ordre alphabétique.
  const vraiRpc = sb.rpc;
  sb.rpc = async (n) => n === "admin_liste_personnages" ? { data:{ ok:true, total:4, liste:[{nom:"Kyraa"},{nom:"asulf"},{nom:"Nanamy"},{nom:"Éloi"}] }, error:null } : { data:null, error:null };
  const zl = document.createElement("div"); zl.id = "dev-liste"; document.body.appendChild(zl);
  await _devListeCharger();
  r.listeAlpha = [...zl.querySelectorAll("[data-liste-nom]")].map(b => b.dataset.listeNom).join(",");   // asulf,Éloi,Kyraa,Nanamy
  zl.remove();

  // (2) Le duel : une seule ligne, avec l'XP ; plus de « Expérience de campagne » ni de « Duel contre ».
  r.serveurDispo = (typeof SERVEUR_DISPO !== "undefined") && !!SERVEUR_DISPO; const vraiAdopt = typeof adopterXpTotal === "function" ? adopterXpTotal : null; adopterXpTotal = () => {};
  sb.rpc = async (n) => ({
    arene_repondre: { data:{ ok:true, statut:"fini", gagne:true, adversaire:"Vortex", rep:1, duel_du_jour:1 }, error:null },
    consommer_effets: { data:{ xp:6, xp_total:1234 }, error:null },
    consommer_evenements: { data:[ { texte:"Duel contre Vortex : victoire. +6 XP.", cat:"combat" } ], error:null }
  })[n] || { data:null, error:null };
  msgs.length = 0; await _areneRepondre(1, true, null);
  r.duelRepondant = msgs.filter(m => m.cat === "combat").map(m => m.t);   // une seule ligne : « Victoire contre Vortex. +6 XP. +1 réputation. »
  // Le duel annoncé par le serveur à celui qui avait lancé le défi (hors ligne) : la ligne du serveur, sans doublon d'XP.
  sb.rpc = async (n) => ({
    consommer_effets: { data:{ xp:4, xp_total:1238 }, error:null },
    consommer_evenements: { data:[ { texte:"Duel contre Kyraa : défaite. +4 XP.", cat:"combat" } ], error:null }
  })[n] || { data:null, error:null };
  msgs.length = 0; await syncEffetsCombat();
  r.duelServeur = msgs.map(m => m.t);   // une seule : « Duel contre Kyraa : défaite. +4 XP. »
  // Une expédition (pas un duel) : la ligne d'XP reste.
  sb.rpc = async (n) => ({ consommer_effets: { data:{ xp:5, xp_total:1243 }, error:null }, consommer_evenements: { data:[ { texte:"Expédition contre Rouage : victoire.", cat:"combat" } ], error:null } })[n] || { data:null, error:null };
  msgs.length = 0; await syncEffetsCombat();
  r.expedition = msgs.map(m => m.t);   // « Expérience de campagne : +5 XP. » + le compte rendu
  if(vraiAdopt) adopterXpTotal = vraiAdopt;

  // (3) La boutique mobile partout (Carcasse, Gravier, Fléau, Braise, surface) ; pas sans l'aptitude.
  const lieux = { surCarcasse:false, surGravier:false, surFleau:false, surOrbiteBraise:false, enSurface:false };
  const vrais = {}; Object.keys(lieux).forEach(k => { vrais[k] = window[k]; });
  const vraiApt = aptBoutiquePartout;
  const essai = (k, apt) => { Object.keys(lieux).forEach(x => { window[x] = () => x === k; }); aptBoutiquePartout = () => apt; majHub();
    const b = document.querySelector('.hub-lien[data-hub="boutique"]'); return !!b && b.style.display !== "none"; };
  r.boutiqueMobile = Object.keys(lieux).map(k => `${k}:${essai(k, true)}/${essai(k, false)}`).join(" ");   // vrai/faux partout
  Object.keys(lieux).forEach(k => { window[k] = vrais[k]; }); aptBoutiquePartout = vraiApt; majHub();

  // (1) L'onglet Vaisseau : les vaisseaux du sac, avec « Équiper » ; le clic passe par equiperVaisseau.
  const vraiEq = equiperVaisseau; let equipe = null; equiperVaisseau = async id => { equipe = id; };
  const ids = Object.keys(VAISSEAUX).filter(id => id !== "navette_reserve").slice(0, 2);
  etat.permisVaisseau = true; etat.vaisseau = null; etat.soute = {}; ids.forEach(id => { etat.sac[id] = 1; });
  if(!document.querySelector("#vaisseau-vue")){ const v = document.createElement("div"); v.id = "vaisseau-vue"; document.body.appendChild(v); }
  majVaisseau(); const zv = document.querySelector("#vaisseau-vue");
  const boutons = [...zv.querySelectorAll("[data-vais-eq]")];
  r.vaisseauSansEquipe = { titre: /Vaisseaux dans ton sac/.test(zv.innerHTML), boutons: boutons.length, libelle: boutons[0] && boutons[0].textContent };
  boutons[0].click(); await att(20); r.clicEquipe = equipe === boutons[0].dataset.vaisEq;
  etat.vaisseau = ids[0]; etat.sac[ids[0]] = 0; etat.vaisseauDate = Date.now(); majVaisseau();
  const b2 = [...zv.querySelectorAll("[data-vais-eq]")];
  r.vaisseauEquipe = { titre: /Autres vaisseaux dans ton sac/.test(zv.innerHTML), boutons: b2.length, libelle: b2[0] && b2[0].textContent, pasLActuel: !b2.some(b => b.dataset.vaisEq === ids[0]) };
  etat.soute = { fer:1 }; majVaisseau();
  r.soutePleine = [...zv.querySelectorAll("[data-vais-eq]")].every(b => b.disabled) && /Vide d'abord la soute/.test(zv.innerHTML);
  equiperVaisseau = vraiEq; etat.soute = {}; etat.vaisseau = null; ids.forEach(id => { etat.sac[id] = 0; });

  // (4) et (6) : présents dans le code (la mise en page ne se mesure pas ici).
  // Les règles chargées par la page (jsdom lit les feuilles de style) : le bandeau a sa règle « tablette ».
  const regles = []; [...document.styleSheets].forEach(sh => { try{ [...sh.cssRules].forEach(x => regles.push(x.cssText)); }catch(e){} });
  const txt = regles.join("\n");
  r.bandeauTablette = /max-width: ?1366px/.test(txt) && /#orbite-info[^}]*height: ?5\.2em/.test(txt) && /overflow-y: ?auto/.test(txt);
  r.feuillesLues = document.styleSheets.length;
  r.avatarGardeSaPlace = /_vert = \{ m: m \? m\.scrollTop/.test(_renderAvModal.toString()) && /m\.scrollTop = _vert\.m/.test(_renderAvModal.toString());

  // K170 : la sélénite dure 35 jours (seule au-dessus du plafond de 30) ; les autres minerais, 30.
  r.selenite = { selenite: dureeVie("selenite"), fer: dureeVie(MINERAIS[0].id), plafond: USURE_MAX, horsPlafond: [...DUREE_VIE_HORS_PLAFOND].join(",") };   // 35, 30, 30, selenite

  sb.rpc = vraiRpc; journal = vraiJ;
  return r;
})();
