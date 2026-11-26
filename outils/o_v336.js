// v3.36 — le duel accepté ne s'écrit plus deux fois (node outils/o_banc.js . v336) : K332 (A). Le serveur écrit
// « ⚔️ Duel contre … » (arene_repondre) ; le pictogramme faisait rater la recherche du jeu.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  let lignes = []; journal = (t, type, cat) => lignes.push({ t:String(t), type });
  sauvegarder = () => {}; sauverMaintenant = async () => {}; afficher = () => {}; adopterXpTotal = () => {};
  const D = "⚔️ ";
  r.xpLue = _xpDuDuel(D + "Duel contre Vortex : victoire. +13 XP. +1 réputation.") === 13;
  // 1. Celui qui accepte : la synchro qui suit arene.js retire la ligne du serveur et rend l'XP.
  _duelLocal = { adv:"Kyraa", xp:0 };
  sb.rpc = async n => n === "consommer_effets" ? { data:{ xp:4, xp_total:100 }, error:null }
    : n === "consommer_evenements" ? { data:[ { texte:D + "Duel contre Kyraa : victoire. +4 XP.", cat:"combat" } ], error:null }
    : { data:null, error:null };
  await syncEffetsCombat();
  r.synchroUneLigne = lignes.length === 0 && _duelLocal.xp === 4;
  // 2. La veille passe la première (effets puis comptes rendus) : même résultat, sans compter l'XP deux fois.
  lignes = []; _duelLocal = { adv:"Kyraa", xp:0 };
  await _effetsAppliquer({ xp:21, xp_total:121 });
  await _evenementsAppliquer([ { texte:D + "Duel contre Kyraa : défaite. +4 XP.", cat:"combat" },
                               { texte:"{obj:pillage} contre {fac:rouage} : succès ! Aucun butin. +17 XP.", cat:"combat" } ]);
  r.veilleTaitLeDuel = lignes.length === 1 && !/Duel contre/.test(lignes[0].t) && lignes[0].type === "bataille";
  r.veilleXp = _duelLocal.xp === 21;
  // 3. Le compte rendu d'un duel lancé par soi (pas de _duelLocal) reste écrit, en violet.
  lignes = []; _duelLocal = null;
  await _evenementsAppliquer([ { texte:D + "Duel contre Vortex : victoire. +13 XP.", cat:"combat" } ]);
  r.duelLanceEcrit = lignes.length === 1 && lignes[0].type === "bataille";
  // 4. Un autre adversaire n'est pas tu.
  lignes = []; _duelLocal = { adv:"Kyraa", xp:0 };
  await _evenementsAppliquer([ { texte:D + "Duel contre Vortex : victoire. +13 XP.", cat:"combat" } ]);
  r.autreAdversaireEcrit = lignes.length === 1 && _duelLocal.xp === 0;
  _duelLocal = null;
  r.version = document.querySelector('link[href*="base.css"]').getAttribute("href");
  return r;
})()
