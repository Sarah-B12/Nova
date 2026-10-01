// v1.36p — page profil : bête à droite, conjoint affiché avec lien
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const rpcOrig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => n === "profil_conjoint" ? Promise.resolve({ data:{ conjoint:"x", nom:"Élane", hote:true }, error:null }) : rpcOrig(n, a);
  etat.bete = { espece:"braisillon", nom:"Murky" };
  await ouvrirPageProfil(etat.nom); await new Promise(x=>setTimeout(x,300));
  const m = document.querySelector("#page-profil");
  const haut = m.querySelector(".pp-haut");
  const ordre = haut ? [...haut.children].map(c => c.className.split(" ")[0]) : null;
  let ouvert = null; const o = ouvrirPageProfil; ouvrirPageProfil = (n) => { ouvert = n; };
  const lien = m.querySelector("[data-pp-conjoint]"); if(lien) lien.click();
  ouvrirPageProfil = o;
  return { ordre, conjoint: m.querySelector(".pp-conjoint") && m.querySelector(".pp-conjoint").textContent.trim(), lienOuvre: ouvert };
})();
