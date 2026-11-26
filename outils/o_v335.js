// v3.35 — la couleur des batailles dans le journal (node outils/o_banc.js . v335) : K331, violet clair (#b48cff).
// Les textes ci-dessous sont ceux que le serveur écrit vraiment (resoudre_expedition_auto et protocole_attaque_resoudre
// en v330, supprimer_expedition, arene_defier, arene_repondre), pictogramme des duels compris.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const lignes = []; const vraiJournal = journal;
  journal = (t, type, cat) => lignes.push({ t:String(t), type, cat });
  sauvegarder = () => {}; sauverMaintenant = async () => {}; afficher = () => {};
  const D = "⚔️ ";
  const bataille = [
    "{obj:pillage} contre {fac:rouage} : succès ! Ta part du butin : 120 ₡. +17 XP.",
    "{obj:sabotage} contre {fac:rouage} : échec. L'expédition est repoussée. +9 XP.",
    "Notre {obj:raid} contre {fac:rouage} a RÉUSSI (3 participant(s)). Butin : 900 ₡, dont 180 ₡ pour la caisse.",
    "Notre {obj:assaut} contre {fac:rouage} a ÉCHOUÉ (2 participant(s)) : leur défense a tenu.",
    "{fac:rouage} a mené un {obj:pillage} contre notre faction — la défense a cédé. Caisse pillée : -300 ₡. Tu défendais : +6 XP.",
    "{fac:rouage} a tenté un {obj:raid} contre notre faction — attaque repoussée !",
    "Expédition contre {fac:rouage} annulée : aucun enrôlé n'était en état de combattre.",
    "Expédition contre le Protocole annulée : aucun enrôlé n'était en état de combattre.",
    "Le Stratège a annulé l'expédition : tes 20 % d'énergie te sont rendus.",
    "Assaut victorieux contre le Protocole ! Butin : 400 ₡. +12 XP.",
    "Assaut repoussé par le Protocole. Les pertes sont lourdes. +20 XP.",
    "Notre assaut contre le Protocole a RÉUSSI (4 participant(s)).",
    "Notre assaut contre le Protocole a ÉCHOUÉ (4 participant(s)).",
    "LE PROTOCOLE A FRAPPÉ notre faction — la défense a cédé. 2 objet(s) de défense détruit(s).",
    "Attaque du Protocole REPOUSSÉE ! Notre défense a tenu. Tu défendais : +4 XP.",
    D + "Duel contre Vortex : victoire. +13 XP. +1 réputation.",
    D + "Duel contre Kyraa : défaite. +4 XP.",
    D + "Vortex te défie à l'arène du Perchoir. Tu as 2 jours pour répondre.",
    D + "Kyraa a décliné ton défi à l'arène."
  ];
  const autres = [   // [texte, catégorie serveur, ton attendu]
    ["Pendant ton absence, le Protocole a démonté 2 installation(s) de ton terrain. Rien n'a été emporté — répare-les sur place.", "combat", "alerte"],
    ["Pendant ton absence, {fac:rouage} a mené un {obj:pillage} contre notre faction : 1 installation(s) de ton terrain ont perdu 15 % d'intégrité. Rien n'a été emporté — répare-les sur place.", "combat", "alerte"],
    ["+1 réputation de faction : cinq expéditions menées avec ta faction.", "gain", "gain"],   // v3.37 (K333) : en bleu, était jaune
    ["Ta vente est partie : +200 ₡.", "economie", "gain"]
  ];
  await _evenementsAppliquer(bataille.map(t => ({ texte:t, cat:"combat" })).concat(autres.map(a => ({ texte:a[0], cat:a[1] }))));
  r.nb = lignes.length === bataille.length + autres.length;
  r.batailleViolet = lignes.slice(0, bataille.length).every(l => l.type === "bataille");
  r.batailleRatees = lignes.slice(0, bataille.length).filter(l => l.type !== "bataille").map(l => l.t);
  r.autresInchanges = autres.every((a, i) => lignes[bataille.length + i].type === a[2]);
  r.ongletsCombat = lignes.slice(0, bataille.length).every(l => l.cat === "combat");
  r.libellesRendus = !lignes.some(l => /\{(fac|obj):/.test(l.t));
  // Le duel accepté (arene.js) s'écrit aussi en violet : vérifié à part dans le texte de arene.js (o_v335 ne lit pas les fichiers).
  // Le rendu : la classe existe, la couleur est violette (ligne et losange).
  journal = vraiJournal;
  journal("{essai} bataille", "bataille", "combat");
  const el = [...document.querySelectorAll("#journal .msg.bataille")].pop();
  r.classeRendue = !!el;
  if(el){ const cs = getComputedStyle(el); r.couleur = cs.color; }
  r.version = document.querySelector('link[href*="base.css"]').getAttribute("href");
  return r;
})()
