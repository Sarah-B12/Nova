// v2.76 (K241) — la traversée (démineur des quêtes) est rejouable tout de suite ; node o_banc.js .. traversee
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const msgs = []; const jOrig = journal; journal = (t) => msgs.push(String(t));
  const a = {}; const qaOrig = queteActive; queteActive = () => a;
  let echecs = 0; const eOrig = echouerDefi; echouerDefi = () => { echecs++; };
  const sOrig = _travCaseSureExiste; _travCaseSureExiste = () => true;   // chaque case brûlante compte comme une erreur évitable
  const d = { type:"traversee", colonnes:6, lignes:7, lave:13, plaques:2 };
  const z = document.createElement("div"); z.innerHTML = _htmlTraversee(d); document.body.appendChild(z);
  _wireTraversee(z, d);
  r.consigne = /si tu les perds toutes, tu repars du bord/.test(z.textContent) && !/8 h/.test(z.textContent);
  const grilleAvant = JSON.stringify(a._trav.lave);
  // marcher sur des cases brûlantes accessibles jusqu'à perdre les deux plaques
  for(let k=0; k<2; k++){
    const t = a._trav, C = 6, L = 7;
    const acc = [...Array(C*L).keys()].filter(i => !t.vus.includes(i) && _travVoisins(i,C,L).some(n => t.vus.includes(n) && !t.lave[n]));
    let cible = acc.find(i => t.lave[i]);
    if(cible == null){ // avancer d'une case sûre puis réessayer
      const s = acc.find(i => !t.lave[i]); z.querySelector(`[data-i="${s}"]`).click(); k--; continue; }
    z.querySelector(`[data-i="${cible}"]`).click();
  }
  r.apresLaDernierePlaque = { verrouOuEchec: echecs, plaques: a._trav.plaques, nouvelleGrille: JSON.stringify(a._trav.lave) !== grilleAvant,
                              auDepart: a._trav.vus.length === 1, journal: msgs[msgs.length - 1] };
  r.defisRatables = DEFIS_UNTRY.has("traversee");
  z.remove(); queteActive = qaOrig; echouerDefi = eOrig; _travCaseSureExiste = sOrig; journal = jOrig;
  return r;
})();
