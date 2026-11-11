// v2.71 (K235), v2.72 — l'écran « nouvelle version » ; node o_banc.js .. version
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  const fOrig = window.fetch;
  r.locale = versionLocale();
  // txt : ce que dit version.txt ; page : le ?v de la page en ligne (null = la page ne répond pas).
  const essai = async (txt, page) => {
    window.fetch = async (url) => {
      if(txt === "panne") throw new Error("hors ligne");
      if(/version\.txt/.test(url)) return { ok:true, text: async () => txt };
      if(page === null) return { ok:false, text: async () => "" };
      return { ok:true, text: async () => `<script src="js/bootstrap.js?v=${page}"></script>` };
    };
    const out = await versionVerifier();
    return { bloque: out, ecran: !!document.querySelector("#ecran-version"), synchro: _pretASynchro() };
  };
  const v = r.locale;
  r.memeVersion        = await essai(String(v), v);
  r.horsLigne          = await essai("panne", v);
  r.illisible          = await essai("<html>404</html>", v);
  r.ancienne           = await essai(String(v - 1), v);
  r.txtAvantLaPage     = await essai(String(v + 1), v);      // v2.72 : version.txt en ligne avant index.html → on ne bloque pas
  r.pageMuette         = await essai(String(v + 1), null);   // la page ne répond pas → on ne bloque pas
  r.nouvelle           = await essai(String(v + 1), v + 1);  // les deux à jour → écran
  r.texte = (document.querySelector("#ecran-version") || {}).textContent;
  r.bouton = !!document.querySelector("#ev-recharger");
  window.fetch = fOrig;
  return r;
})();
