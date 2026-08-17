/* ===========================================================
   INVENTAIRE — Sac à dos : capacité, ajout/retrait, réordonnancement par glisser-déposer.
   =========================================================== */
const SAC_MAX = 50;                                             // places dans le sac
function placesUtilisees(){ return Object.values(etat.sac).reduce((a,b)=>a+b,0); }
function placesLibres(){ return capaciteSac() - placesUtilisees(); }
// Ajoute n unités au sac dans la limite de la capacité. Renvoie le nombre réellement ajouté.
function ajouterAuSac(id, n){
  const place = Math.max(0, Math.min(n, placesLibres()));
  if (place > 0) {
    if(!(etat.sac[id]>0)){ if(!etat.sacDate) etat.sacDate={}; etat.sacDate[id]=Date.now(); }  // nouvelle pile : date d'acquisition
    etat.sac[id] = (etat.sac[id]||0) + place; if(!etat.sacOrdre.includes(id)) etat.sacOrdre.push(id);
  }
  return place;
}
// Retire une unité et nettoie l'ordre si la pile est vide.
function retirerDuSac(id, n=1){
  if(!etat.sac[id]) return;
  etat.sac[id]-=n;
  if(etat.sac[id]<=0){ delete etat.sac[id]; etat.sacOrdre=etat.sacOrdre.filter(x=>x!==id); if(etat.sacDate) delete etat.sacDate[id]; }
}
// Réordonne le sac (glisser-déposer) : place dragId à l'emplacement de cibleId.
let dragId=null;
function reordonnerSac(dId, cibleId){
  let ordre = etat.sacOrdre.filter(id => (etat.sac[id]||0)>0);
  const from = ordre.indexOf(dId); if(from<0) return;
  ordre.splice(from,1);
  let to = cibleId ? ordre.indexOf(cibleId) : ordre.length;
  if(to<0) to = ordre.length;
  ordre.splice(to,0,dId);
  etat.sacOrdre = ordre; sauvegarder(); majSac();
}

