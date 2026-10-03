// v1.36ab — Intelligence : carburant et coque face aux sondes
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {};
  for(const i of [10, 50, 100, 200, 400]){
    intelligenceEffective = () => i;
    r["int"+i] = { bonus: intelBonusVaisseau(), carb18: aptCarburant(18), carb40: aptCarburant(40) };
  }
  intelligenceEffective = () => 200; let moit = 0; const n = 4000; const jOrig = journal; journal = () => {};
  for(let k=0;k<n;k++) if(_degatsSonde(30) === 15) moit++;
  journal = jOrig; r.tauxMoitie200 = Math.round(1000 * moit / n) / 10;
  return r;
})();
