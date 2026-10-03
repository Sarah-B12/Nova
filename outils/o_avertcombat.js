// v1.36aa — avertissement « combat » sur l'écran de proposition (Q4, Q10)
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const q4 = queteData("q4"), q10 = queteData("q10"), q1 = queteData("q1");
  const r = {};
  for(const [nom, f] of [["faible", 12], ["moyen", 18], ["fort", 30]]){
    forceEffective = () => f; agiliteEffective = () => 5; intelligenceEffective = () => 5;
    const z = document.createElement("div"); z.innerHTML = _avertCombatQuete(q4);
    r[nom] = { dur: !!z.querySelector(".quete-avert.dur"), doux: !!z.querySelector(".quete-avert:not(.dur)"), txt: z.textContent.replace(/\s+/g," ").trim().slice(0, 95) };
  }
  r.q10 = !!_avertCombatQuete(q10); r.q1 = _avertCombatQuete(q1);
  return r;
})();
