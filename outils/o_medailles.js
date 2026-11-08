// v2.48 (K171) — les médailles des classements du mois : lues par medailles_lire (v267), affichées sous
// les blasons des Cercles (fiche et page profil), dans l'ordre des classements puis des places, images
// images/medailles/<classement>_<place>.png, repli 🥇🥈🥉, bulle « 1ʳᵉ place — … (mois) », cache.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}; const vraiRpc = sb.rpc; let appels = 0, demande = null;
  const donnees = {
    moi: [ { src:"jeux", type:"gains", rang:2, mois:"2026-10" }, { src:"arene", type:"victoires", rang:1, mois:"2026-10" },
           { src:"fleau", type:null, rang:3, mois:"2026-10" }, { src:"arene", type:"inconnu", rang:1, mois:"2026-10" } ],
    autre: []
  };
  sb.rpc = async (n, a) => { if(n === "medailles_lire"){ appels++; demande = a; return { data: a.p_profil ? donnees.autre : donnees.moi, error:null }; } return { data:null, error:null }; };

  // Sa fiche : #medailles sous #reputations.
  const rep = document.querySelector("#reputations"), z = document.querySelector("#medailles");
  r.place = !!(rep && z && rep.nextElementSibling === z);
  await majMesMedailles(true);
  const imgs = [...z.querySelectorAll(".medaille img")].map(i => i.getAttribute("src"));
  r.images = imgs.join(" ");   // arene_victoires_1, jeux_gains_2, fleau_3 (ordre des classements ; l'inconnu écarté)
  r.bulles = [...z.querySelectorAll(".medaille .rep-bulle")].map(b => b.textContent);
  r.visible = !z.hidden; r.demandeMoi = demande && demande.p_profil === null;
  // Le repli : l'image manque → la médaille dessinée.
  const i0 = z.querySelector(".medaille img"); i0.dispatchEvent(new Event("error"));
  r.repli = (z.querySelector(".medaille .med-ic") || {}).textContent;   // 🥇
  // Le cache : un second appel dans les 10 minutes ne redemande pas.
  const a0 = appels; await majMesMedailles(false); r.cache = appels === a0;
  // Aucune médaille : la ligne disparaît.
  donnees.moi = []; await majMesMedailles(true); r.videCachee = z.hidden && z.innerHTML === "";
  // La page profil d'un autre joueur : sous ses blasons.
  donnees.autre = [ { src:"arene", type:"plus_fort", rang:3, mois:"2026-10" } ];
  r.html = medaillesHtml(donnees.autre).includes('images/medailles/arene_plus_fort_3.png');
  const L = await medaillesDe("22222222-2222-2222-2222-222222222222", true);
  r.autre = { demande: demande && demande.p_profil, n: L.length };
  r.pageProfil = /id="pp-medailles"/.test(ouvrirPageProfil.toString() + (typeof _rendrePageProfil === "function" ? _rendrePageProfil.toString() : "")) || /pp-medailles/.test(document.documentElement.innerHTML) || "à voir";
  r.taille = /\.med-img\{ width:46px; height:46px/.test((document.querySelector("#med-style") || {}).textContent || "");
  r.noms = Object.keys(MEDAILLES).flatMap(id => [1,2,3].map(p => `${id}_${p}.png`)).length;   // 18
  sb.rpc = vraiRpc;
  return r;
})();
