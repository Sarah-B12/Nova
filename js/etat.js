/* ===========================================================
   ETAT — État du joueur : création, helpers purs, sauvegarde et chargement (localStorage).
   =========================================================== */
function nouvelEtat(){
  return {
    inscrit:false, nom:"", faction:null, pos:null, metier:null, creeLe:Date.now(), enPause:false,
    energie:100, energieMaj:Date.now(), reposLe:0, regenMaj:0,
    credits:1000, niveau:1, xp:0, pointsCompetence:0, retours:0,
    competences:{ force:10, agilite:5, intelligence:5 },
    jauges:{ o2:90, sante:100, moral:80 },
    sac:{}, sacOrdre:[], coffre:{}, maison:{ palier:0, plot:null, chantier:null }, terrain:{ parcelles: Array(N_PLOTS).fill(null) },
    description:"", mur:[], murOuvertA:"amis",
    formation:null,
    aptitudes:{ pa:0, pris:[] }
  };
}

/* ---------- Utilitaires ---------- */
function borne(v){ return Math.max(0, Math.min(MAX, v)); }
function alea(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function reductionO2(){ return Math.floor(etat.competences.agilite/5); }
function bonusCredits(){ return Math.floor(etat.competences.intelligence/5); }
function coutO2(base){ return Math.max(1, base - reductionO2() - aptO2Bonus()); }
function echapper(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function ageJours(){ return Math.floor((Date.now() - etat.creeLe) / MS_JOUR); }
/* ---------- Sauvegarde ---------- */
function sauvegarder(){ try{ localStorage.setItem(CLE, JSON.stringify(etat)); }catch(e){} }
function charger(){
  try{
    const brut=localStorage.getItem(CLE);
    if(brut){ const base=nouvelEtat(); const s=JSON.parse(brut);
      const sac = {...(s.sac||{})};
      if(s.materiaux){ for(const k in s.materiaux){ if(s.materiaux[k]>0) sac[k]=(sac[k]||0)+s.materiaux[k]; } }
      let ordre = (s.sacOrdre||[]).filter(id => (sac[id]||0)>0);
      for(const id in sac){ if(sac[id]>0 && !ordre.includes(id)) ordre.push(id); }
      return { ...base, ...s,
        competences:{...base.competences,...(s.competences||{})},
        jauges:{...base.jauges,...(s.jauges||{})},
        sac, sacOrdre:ordre, coffre:{...(s.coffre||{})},
        maison:{ palier:0, plot:null, chantier:null, ...(s.maison&&typeof s.maison.palier==="number" ? s.maison : {}) }, mur:(s.mur||[]),
        aptitudes:{...base.aptitudes, ...(s.aptitudes||{})},
        terrain:{ parcelles: normaliserParcelles(s.terrain) },
        creeLe: s.creeLe || Date.now(),
        energie: (typeof s.energie==="number" ? s.energie : 100),
        energieMaj: s.energieMaj || Date.now() };
    }
  }catch(e){}
  return nouvelEtat();
}
function reinitialiser(){ if(!confirm("Effacer la partie et recommencer ?"))return; try{localStorage.removeItem(CLE);}catch(e){} etat=nouvelEtat(); document.querySelector("#journal").innerHTML=""; afficher(); ouvrirInscription(); }

