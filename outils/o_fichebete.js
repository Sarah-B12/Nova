// v1.36v — la bête sur la fiche du Profil
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const z = document.querySelector("#fiche-bete");
  const avant = z.hidden;
  etat.bete = { espece: BETES[0].id, nom: "Murky" }; afficher();
  const r = { avantCache: avant, apres: { cache: z.hidden, texte: z.textContent.replace(/\s+/g," ").trim(), img: !!z.querySelector("img"),
             dansVitaux: !!z.closest(".vitaux") } };
  etat.bete = null; afficher(); r.retire = z.hidden;
  return r;
})();
