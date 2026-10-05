// v1.44 — coiffures en deux morceaux (node o_banc.js .. avatar)
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1200));
  r.ordreDeux = _avCouches({ genre:"h", visage:2, cheveux:8 });
  r.ordreUn   = _avCouches({ genre:"h", visage:2, cheveux:3 });
  r.femme     = _avCouches({ genre:"f", visage:1, cheveux:8 });
  _avBrouillon = { genre:"h", visage:1, cheveux:0, pilosite:0, accessoire:0 };
  const html = _avRangee("Cheveux", "cheveux", AV_CHEVEUX.h, true, "h");
  const d = document.createElement("div"); d.innerHTML = html;
  const v8 = d.querySelector('[data-choix="cheveux:8"]'), v3 = d.querySelector('[data-choix="cheveux:3"]');
  r.vignette8 = [...v8.querySelectorAll("img")].map(i => i.getAttribute("src"));
  r.vignette3 = [...v3.querySelectorAll("img")].map(i => i.getAttribute("src"));
  r.nbVignettes = d.querySelectorAll("[data-choix]").length;
  return r;
})();
