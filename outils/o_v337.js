// v3.37 — les couleurs du journal (node outils/o_banc.js . v337) : K333 (A) et K334 (A).
// Un texte réel par sorte de message du serveur (relevé des 117 instructions du 27/11), avec la couleur attendue :
// annonce = jaune brillant (un événement apparaît), message = vert (quelqu'un s'adresse à toi), bataille = violet,
// alerte = rouge, gain = bleu.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const lignes = []; const vraiJournal = journal;
  journal = (t, type, cat) => lignes.push({ t:String(t), type, cat });
  sauvegarder = () => {}; sauverMaintenant = async () => {}; afficher = () => {};
  const cas = [
    // événements
    ["Des débris ont été vus tomber sur {carte:silene}. Tu devrais y aller chercher des objets intéressants. Tu as trois jours avant qu'il ne reste plus rien.", "voyage", "annonce"],
    ["Une mission a surgi : « La bouture capricieuse ». Lieu Quêtes, onglet Missions : cinq jours pour former un groupe.", "quete", "annonce"],
    ["[TEST] Une mission a surgi : « Le casse ». Lieu Quêtes, onglet Missions : cinq jours pour former un groupe.", "quete", "annonce"],
    ["Un pli sans signature, glissé dans ton sac pendant que tu dormais : « Un marché de Silène dort mal. »", "quete", "annonce"],
    // quelqu'un s'adresse à toi
    ["✉️ Message de Kyraa : « Salut »", "social", "message"],
    ["💬 Kyraa a écrit sur ton mur.", "social", "message"],
    ["Asulf t'a envoyé 1× fab_casque_leger à La Poste.", "poste", "message"],
    ["Asulf t'a laissé un cadeau à La Poste. Contenu inconnu.", "poste", "message"],
    ["Vortex t'invite dans son groupe pour la mission « La bouture capricieuse ». Lieu Quêtes, onglet Missions.", "quete", "message"],
    ["Vortex t'a fait passer un mot, à voix basse : « J'ai besoin d'une ombre de plus. Tu en es ? »", "quete", "message"],
    ["Vortex te demande en mariage et viendrait vivre chez toi. Réponds depuis les Unions, au Centre.", "gain", "message"],
    ["Une lettre de Lio est arrivée.", "gain", "message"],
    // pertes (rouge)
    ["Ta pique du Fléau s'est effritée.", "gain", "alerte"],
    ["Ton éclat de lentille s'est terni.", "gain", "alerte"],
    ["La pupille du Fléau s'est éteinte.", "gain", "alerte"],
    ["Ton régulateur d'AREPO s'est usé.", "voyage", "alerte"],
    ["Ton module d'AREPO s'est usé.", "voyage", "alerte"],
    ["Un module de ton vaisseau s'est usé.", "voyage", "alerte"],
    ["Ta Mousse-amie a fané : la parcelle est libre.", "agri", "alerte"],
    ["2 mercenaire(s) ont quitté la faction : la réputation du gouvernement chez les Langues-violacées ne suffit plus (voir la Chronique).", "faction", "alerte"],
    ["1 mercenaire(s) non payé(s) ont quitté la faction : la caisse n'avait pas de quoi payer la solde.", "faction", "alerte"],
    ["Lio est confié à une famille de la cité.", "couple", "alerte"],
    ["Évacuation d'urgence : tu reprends conscience chez toi. −17 ₡ de frais médicaux.", "alerte", "alerte"],
    ["Pendant ton absence, le Protocole a démonté 2 installation(s) de ton terrain. Rien n'a été emporté — répare-les sur place.", "combat", "alerte"],
    ["Tu es en prison chez {fac:rouage} jusqu'au 28/11 à 10:00.", "combat", "alerte"],
    // batailles
    ["{fac:nomades} a mené un {obj:pillage} contre notre faction — la défense a cédé. Caisse pillée : -2402 ₡.", "combat", "bataille"],
    ["⚔️ Vortex te défie à l'arène du Perchoir. Tu as 2 jours pour répondre.", "combat", "bataille"],
    // le reste (bleu)
    ["+2 réputation de faction : tu étais là pour défendre les tiens.", "gain", "gain"],
    ["🏆 Arène, classement « victoires » de novembre : 1ʳᵉ place. +500 ₡.", "gain", "gain"],
    ["Le Fléau, classement de novembre : 2ᵉ place. +300 ₡.", "gain", "gain"],
    ["La bouture a fleuri. Elle a donné une Mousse-amie à chacun de ceux qui l'ont soignée.", "quete", "gain"],
    ["La bouture a bu. Elle tiendra jusqu'à demain.", "quete", "gain"],
    ["Le pli disait vrai. Un marché, ses vitrines, et toute une nuit devant vous.", "quete", "gain"],
    ["Vortex a quitté le groupe : c'est toi qui le mènes désormais (mission « secrète »).", "quete", "gain"],
    ["Le Stratège a posté un guetteur : les horaires de patrouille sont relevés (Bureau).", "faction", "gain"],
    ["Ton envoi de 1× casque à Kyraa revient : il n'a pas été récupéré.", "poste", "gain"],
    ["Tu as été libéré de prison.", "social", "gain"],
    ["Le staff a renommé ton compagnon : il s'appelle désormais Pif.", "social", "gain"],
    ["Kyraa a dit oui ! Il te reste à emménager : bouton « Emménager », aux Unions (Centre).", "gain", "gain"],
    ["Kyraa a appelé le bébé Lio.", "gain", "gain"],
    ["Un membre du staff t'a remis 2× fab_casque_leger (essai).", "gain", "gain"],
    ["🏪 Vendu au marché : 1× fab_panneau_de_sylve pour 23 ₡.", "economie", "gain"]
  ];
  await _evenementsAppliquer(cas.map(c => ({ texte:c[0], cat:c[1] })));
  r.nb = lignes.length === cas.length;
  r.ecarts = cas.map((c, i) => (lignes[i] && lignes[i].type === c[2]) ? null : `${c[2]} attendu, ${lignes[i] && lignes[i].type} : ${c[0].slice(0, 50)}`).filter(Boolean);
  r.libellesRendus = !lignes.some(l => /\{(fac|obj):/.test(l.t));
  r.plusDeJauneServeur = !lignes.some(l => l.type === "poste");
  // Le rendu : les deux classes existent.
  journal = vraiJournal;
  journal("{essai} message", "message", "social"); journal("{essai} annonce", "annonce", "voyage");
  r.classeMessage = !!document.querySelector("#journal .msg.message");
  r.classeAnnonce = !!document.querySelector("#journal .msg.annonce");
  r.version = document.querySelector('link[href*="base.css"]').getAttribute("href");
  return r;
})()
