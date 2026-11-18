// v3.13 (K285, autrice, 18/11) — le texte de la page d'accueil (avant la connexion) suit le LORE ; le message de
// bienvenue après l'inscription n'est pas touché.
//   node outils/o_banc.js . v313
(async function(){
  await new Promise(x => setTimeout(x, 400));
  ouvrirEntree();
  const e = document.querySelector("#page-entree");
  const r = { sousTitre: (e.querySelector(".ent-sous") || {}).textContent, accueil: (e.querySelector(".ent-pitch") || {}).textContent };
  r.parleDeCratere = /cratère/.test(r.accueil); r.parleDeMaar = /Maar/.test(r.accueil);
  r.bienvenueTitre = (document.querySelector("#modale-bienvenue h2") || {}).textContent;
  e.hidden = true;
  return r;
})()
