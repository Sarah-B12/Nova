// v1.36u — messages du serveur rangés par sujet (Agri., Vols, Couple…) ; Wanted : portrait visible
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const rpcOrig = sb.rpc.bind(sb);
  const evs = [
    { texte:"Ta Sylve a fané au bio-dôme : 2 jours sans arrosage ni récolte.", cat:"alerte", cree_le:new Date().toISOString() },
    { texte:"Usure : Drone de récolte a cessé de fonctionner.", cat:"alerte", cree_le:new Date().toISOString() },
    { texte:"Un chasseur de primes t'a retrouvé.", cat:"alerte", cree_le:new Date().toISOString() },
    { texte:"Attaque du Protocole REPOUSSÉE ! Notre défense a tenu.", cat:"combat", cree_le:new Date().toISOString() } ];
  sb.rpc = (n, a) => n === "consommer_evenements" ? Promise.resolve({ data: evs, error:null }) : rpcOrig(n, a);
  const vus = []; const jOrig = journal; journal = (t, ty, c) => { vus.push([t.slice(0, 22), c]); };
  await syncEffetsCombat();
  journal = jOrig;
  // Wanted : le portrait garde sa taille dans son lien
  const z = document.createElement("div"); document.body.appendChild(z);
  sb.rpc = () => Promise.resolve({ data:{ ok:true, chasseur:true, liste:[{ id:"c1", nom:"Nyx", avatar:null, total:800, plaintes:1, essais:0, moi:false }] }, error:null });
  await majWanted(z);
  const span = z.querySelector("span.tq-lien-profil"), por = z.querySelector(".tq-portrait");
  return { categories: vus, lienBloc: span && getComputedStyle(span).display, portraitBloc: por && getComputedStyle(por).display };
})();
