// v1.93s — K70 : les gardiens (combats de barrage) de Q11, Q16, Q19, Q27, Q30.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = { erreurs:[] };
  const VISES = { q11:[77,15], q16:[94,20], q19:[102,23], q27:[117,28], q30:[122,30] };
  // Meilleure compétence d'un joueur « moyen » au niveau L : 10 + 2 points par niveau + la meilleure arme utilisable.
  const arme = L => L >= 20 ? 18 : (L >= 15 ? 16 : (L >= 5 ? 8 : 0));
  const moyen = L => 10 + 2*(L-1) + arme(L), maxi = L => 10 + 3*(L-1) + arme(L);
  const xpCum = n => Math.max(10*n*(n-1), n*n*(n-1)/2);
  const niveauQuetes = (avant) => { let t = 0; for(const q of QUETES){ if(q.id === avant) break; t += q.recompense.xp || 0; } let n = 1; while(xpCum(n+1) <= t) n++; return n; };
  r.gardiens = {};
  for(const [id, [p, vise]] of Object.entries(VISES)){
    const q = queteData(id), i = q.etapes.findIndex(e => e.defi.type === "combat" && e.image && e.image.src);
    if(i < 0){ r.erreurs.push(id + " : pas de gardien"); continue; }
    const d = q.etapes[i].defi, seuil = Math.ceil(d.puissance * 0.7), lq = niveauQuetes(id);
    r.gardiens[id] = { etape:i, puissance:d.puissance, seuil, niveauQuetesSeules:lq,
      moyenAuNiveauQuetes:moyen(lq) >= seuil, maxiAuNiveauQuetes:maxi(lq) >= seuil, moyenAuNiveauVise:moyen(vise) >= seuil,
      image:q.etapes[i].image.src, repli:q.etapes[i].image.repli,
      avantChoix:q.etapes[q.etapes.length-1].defi.type === "choix" && i < q.etapes.length-1,
      passeMoyen:(() => { let L = 1; while(moyen(L) < seuil) L++; return L; })(), passeMaxi:(() => { let L = 1; while(maxi(L) < seuil) L++; return L; })() };
    if(d.puissance !== p) r.erreurs.push(`${id} : puissance ${d.puissance} ≠ ${p}`);
  }
  // Repli d'image : la bannière voisine si gardien.png manque.
  const h = _imgQueteHTML(queteData("q16").etapes[2].image);
  r.repliHtml = /src="images\/quetes\/q16\/gardien\.png"/.test(h) && /data-repli="images\/quetes\/q16\/2\.png"/.test(h);
  // Migration : un joueur déjà au-delà du point d'insertion avance d'un rang, une fois.
  const cas = (id, et) => { etat.quetes = { done:[], active:{ id, etape:et } }; queteEtat(); const a = etat.quetes.active.etape; queteEtat(); return [a, etat.quetes.active.etape]; };
  r.migration = { q16avant:cas("q16", 1), q16apres:cas("q16", 4), q27auChoix:cas("q27", 3), q20nonConcernee:cas("q20", 3) };
  etat.quetes = { done:[], active:null, gardiens:true };
  return r;
})();
