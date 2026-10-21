// v1.36v — la bête sur la fiche du Profil. v1.91 : au pied du portrait, nom dans l'en-tête ;
// le cadre d'avatar (K58) n'apparaît que pour un dev tant que CADRES_VISIBLES est faux.
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const img = document.querySelector("#fiche-compagnon"), ligne = document.querySelector("#stat-compagnon");
  const avant = img.hidden && ligne.hidden;
  etat.bete = { espece: BETES[0].id, nom: "Murky" }; afficher();
  const r = { avantCache: avant, apres: { image: !img.hidden && !!img.getAttribute("src"), auPortrait: !!img.closest("#portrait-cadre"),
             ligne: ligne.hidden ? "" : ligne.textContent.replace(/\s+/g," ").trim(), plusDeVieuxBloc: !document.querySelector("#fiche-bete") } };
  etat.bete = null; afficher(); r.retire = img.hidden && ligne.hidden;
  // Le cadre : caché pour un joueur, visible pour un dev (aperçu), jamais sans `avatar.cadre`.
  const slot = document.querySelector("#fiche-cadre-slot"), avA = etat.avatar, roleA = etat.roleAdmin;
  etat.avatar = Object.assign({}, avA || { genre:"h", visage:1 }, { cadre:"testeurs" });
  etat.roleAdmin = null; majFicheBete(); r.cadreJoueur = !!slot.querySelector(".av-cadre");
  etat.roleAdmin = "dev"; majFicheBete(); r.cadreDev = !!slot.querySelector(".av-cadre") && /cadre_testeurs\.png/.test(slot.innerHTML);
  etat.avatar = Object.assign({}, etat.avatar, { cadre:"pirate" }); majFicheBete(); r.cadreInconnu = !slot.querySelector(".av-cadre");
  etat.avatar = avA; etat.roleAdmin = roleA; majFicheBete();
  return r;
})();
