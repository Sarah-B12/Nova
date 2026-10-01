// v1.36o — pas de loup : flèches seules, plus de cases orangées ni d'avertissement
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const d = queteData("q15").etapes[4].defi;
  const a = { id:"q15", etape:4 }; queteActive = () => a; sauvegarder = () => {};
  let confirme = 0; confirmerJoli = async () => { confirme++; return true; };
  let echec = null; echouerDefi = (t) => { echec = t; }; rafraichirQuetes = () => {};
  const z = document.createElement("div"); document.body.appendChild(z);
  z.innerHTML = _htmlLoup(d); _wireLoup(z, d);
  const r = { vus: z.querySelectorAll(".ql-vu").length, fleches: [...z.querySelectorAll(".ql-bete small")].map(e => e.textContent).join("") };
  // Avancer dans une case vue à la prochaine vague → échec, sans confirmation.
  let vus = _loupVus(d.niveau, a._loup.t + 1);
  // Se placer à côté d'une case vue (case libre voisine), pour tester l'échec.
  const nv = d.niveau;
  outer: for(const k of vus){ const [vx,vy]=k.split(",").map(Number);
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const x=vx+dx, y=vy+dy;
      if(!_loupBloque(nv,x,y) && !vus.has(x+","+y)){ a._loup.x=x; a._loup.y=y; break outer; } } }
  z.innerHTML = _htmlLoup(d); _wireLoup(z, d);
  vus = _loupVus(d.niveau, a._loup.t + 1);
  const pas = [...z.querySelectorAll(".ql-pas")].find(b => vus.has(b.dataset.ql));
  if(pas){ pas.click(); await new Promise(x=>setTimeout(x,30)); }
  r.caseVueTestee = !!pas; r.confirmations = confirme; r.echec = !!echec;
  return r;
})();
