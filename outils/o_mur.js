// v1.53 — mur repliable (node o_banc.js .. mur)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  const z = document.createElement("div"); z.id = "mur-test"; document.body.appendChild(z);
  const msgs = Array.from({ length:8 }, (_, i) => ({ id:i+1, auteur_id:"a", texte:"Message " + (i+1), cree_le:new Date(Date.now()-i*60000).toISOString() }));
  const fromOrig = sb.from.bind(sb);
  sb.from = (t) => {
    const q = { select(){ return q; }, eq(){ return q; }, gte(){ return q; }, lt(){ return q; }, in(){ return q; }, order(){ return q; }, delete(){ return q; },
      limit(){ return Promise.resolve({ data:msgs, error:null }); }, then(f){ return Promise.resolve({ data:[{ id:"a", nom:"Lou" }], error:null }).then(f); } };
    return (t === "mur" || t === "profils_publics") ? q : fromOrig(t);
  };
  await _ppChargerMur("p-1", "#mur-test");
  r.visibles = z.querySelectorAll(":scope > .mur-msg").length;
  r.repli = (z.querySelector(".mur-plus summary") || {}).textContent;
  r.caches = z.querySelectorAll(".mur-plus .mur-msg").length;
  return r;
})();
