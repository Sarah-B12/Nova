// v1.93g — onglet Terrain → Maison : la bannière du logement, puis ses replis.
// v1.93i — le chantier par faction (bannière, onglet Maison, cases du terrain).
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {};
  let z = document.querySelector("#sous-maison"); if(!z){ z = document.createElement("div"); z.id = "sous-maison"; document.body.appendChild(z); }
  etat.faction = "ignis"; etat.maison = Object.assign({}, etat.maison || {}, { palier:3, plot:0, chantier:null });
  majMaison();
  let img = z.querySelector(".maison-vis img");
  r.banniere = { src:img && img.getAttribute("src"), classe:!!img && img.classList.contains("maison-ban"), cadre:!!z.querySelector(".maison-vis-ban") };
  _maisonBanRepli(img);
  r.repli1 = { src:img.getAttribute("src"), classe:img.classList.contains("maison-ban"), cadre:!!z.querySelector(".maison-vis-ban") };
  _maisonBanRepli(img); r.repli2 = img.getAttribute("src");
  _maisonBanRepli(img); r.repli3 = !z.querySelector(".maison-vis");
  // Rhizome (clé rhizome), Nomades, et la toute première construction.
  etat.faction = "cultivateurs"; majMaison(); r.rhizome = z.querySelector(".maison-vis img").getAttribute("src");
  etat.faction = "nomades"; etat.maison.palier = 1; majMaison(); r.nomades = z.querySelector(".maison-vis img").getAttribute("src");
  etat.maison.palier = 0; etat.maison.chantier = { cible:1, depose:{}, travail:0 }; majMaison();
  img = z.querySelector(".maison-vis img"); r.chantier = img && img.getAttribute("src");
  _maisonBanRepli(img); r.chantierRepli = img.getAttribute("src");
  _maisonBanRepli(img); r.chantierRepli2 = img.getAttribute("src");
  // Le chantier sur la case du terrain (faction Ignis), puis son repli commun.
  let g = document.querySelector("#terrain-grille"); if(!g){ g = document.createElement("div"); g.id = "terrain-grille"; document.body.appendChild(g); }
  etat.faction = "ignis"; etat.terrain = etat.terrain || {}; etat.terrain.parcelles = [{ type:"maison" }, null, null];
  try{ majRecolte(); const ti = g.querySelector(".plot img"); r.terrainChantier = ti && ti.getAttribute("src"); r.terrainRepli = ti && ti.dataset.repli; }
  catch(e){ r.terrainChantier = "erreur : " + e.message; }
  // Les cases du terrain gardent l'image carrée.
  r.terrainCarre = cheminMaison("ignis", 3);
  return r;
})();
