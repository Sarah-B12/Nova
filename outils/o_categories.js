// v2.16 — Le tri automatique du journal (node outils/o_banc.js .. categories).
// Chaque ligne : [texte reçu du serveur, onglet attendu]. Ajouter ici tout piège trouvé.
(async function(){
  await new Promise(x => setTimeout(x, 1200));
  const cas = [
    ["🎲 Tables de jeu, classement « Gains du mois » de 10/2026 : 2ᵉ place. +300 ₡.", "eco"],      // v2.16 : « clas-SEME-nt » → Agri.
    ["🎲 Tables de jeu, classement « Parties gagnées » de 10/2026 : 1ʳᵉ place. +500 ₡.", "eco"],
    ["🏆 Arène, classement « Victoires » de 10/2026 : 1ʳᵉ place. +500 ₡.", "combat"],
    ["🏆 Arène, classement « Contre plus fort » de 10/2026 : 1ʳᵉ place. +500 ₡.", "combat"],
    ["🏆 Arène, classement « Combattants » de 10/2026 : 2ᵉ place. +300 ₡.", "combat"],
    ["🏆 Le Fléau, classement de 10/2026 : 1ʳᵉ place. Tu rapportes une pique du Fléau, plantée devant chez toi : pendant 8 jours, aucun voleur ne réussit contre toi.", "combat"],
    ["Ta pique du Fléau s'est effritée.", "combat"], ["Ton éclat de lentille s'est terni.", "combat"], ["La pupille du Fléau s'est éteinte.", "combat"],
    ["Quelqu'un a voulu te faire les poches : il s'est pris dans ta pique noire et il est reparti les mains vides.", "vol"],
    ["Ta Sylve a fané au bio-dôme : 2 jours sans arrosage ni récolte.", "agri"], ["Tu as semé 3 graines de Sylve.", "agri"],
    ["Graine plantée dans la serre.", "agri"], ["La traite de ton Cuprin a donné 2 laits.", "agri"],
    ["Jeune Toisard placé dans l'enclos.", "agri"], ["Usure : Drone de récolte a cessé de fonctionner.", "agri"],
    ["Un chasseur de primes t'a retrouvé.", "vol"], ["Attaque du Protocole REPOUSSÉE ! Notre défense a tenu.", "combat"]
  ];
  const ecarts = cas.map(([t, att]) => [t.slice(0, 50), att, _categoriser(t)]).filter(x => x[1] !== x[2]);
  return { cas: cas.length, ecarts };
})();
