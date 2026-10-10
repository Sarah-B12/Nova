// v1.55 — bannière de Famille selon le stade (node o_banc.js .. v155)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  const essai = (stade, adopte, adopt) => {
    const c = document.createElement("div");
    c.innerHTML = `<div id="fa-ban" hidden><img id="fa-ban-img"></div>`;
    _faBanniere(c, { stade, adopte }, adopt);
    return c.querySelector("#fa-ban-img").getAttribute("src");
  };
  r.naissance = essai("attendu", false, false);
  r.adoption  = essai("attendu", true, true);
  r.petit     = essai("petit", false, false);
  r.petitAdopte = essai("petit", true, true);
  r.ado       = essai("ado", false, false);
  return r;
})();
