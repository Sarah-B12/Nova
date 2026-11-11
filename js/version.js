/* ===========================================================
   v2.71 (K235) — PRÉVENIR QU'UNE NOUVELLE VERSION EST EN LIGNE.

   Le 10/11, Asulf a perdu 22 072 ₡ : un onglet resté ouvert depuis avant la
   v2.62 a appliqué l'ANCIENNE règle du secours « à sec » (tout prendre), en
   arrière-plan, au retour sur l'onglet. Rien ne prévenait qu'une mise à jour
   était en ligne.

   Le jeu lit `version.txt` (à la racine, à côté d'index.html) toutes les
   5 minutes et à chaque retour sur l'onglet, et le compare à SON numéro, celui
   des `?v=` d'index.html. Plus récent en ligne → un écran BLOQUANT « Recharger »
   (choix B de l'autrice) : l'ancienne version ne peut plus rien faire, et toutes
   les synchronisations s'arrêtent (`_pretASynchro`).

   ⚠ À CHAQUE LIVRAISON : `version.txt` = le nouveau `?v` (o_controle le vérifie).
   =========================================================== */
let _versionPerimee = false;
function versionLocale(){
  const s = document.querySelector('script[src*="bootstrap.js?v="]');
  const m = s && (s.getAttribute("src") || "").match(/\?v=(\d+)/);
  return m ? +m[1] : null;
}
async function versionVerifier(){
  if(_versionPerimee) return true;
  const ici = versionLocale(); if(!ici) return false;
  try{
    const r = await fetch(`version.txt?t=${Date.now()}`, { cache:"no-store" });
    if(!r || !r.ok) return false;
    const enLigne = parseInt(String(await r.text()).trim(), 10);
    if(!isFinite(enLigne) || enLigne <= ici) return false;   // à jour (ou fichier illisible : on ne bloque pas)
    /* v2.72 — DOUBLE VÉRIFICATION, pour ne jamais bloquer pour rien : la page en ligne doit DÉJÀ porter
       le nouveau numéro. Si version.txt est arrivé avant index.html (ordre de mise en ligne raté), on ne
       bloque pas : recharger ne servirait à rien. */
    const p = await fetch(`${location.pathname}?t=${Date.now()}`, { cache:"no-store" });
    if(!p || !p.ok) return false;
    const mp = String(await p.text()).match(/bootstrap\.js\?v=(\d+)/);
    if(!mp || +mp[1] <= ici) return false;
    _versionPerimee = true;
    _versionEcran();
    return true;
  }catch(e){ return false; }   // hors ligne : on ne bloque pas
}
function _versionEcran(){
  if(document.querySelector("#ecran-version")) return;
  const st = document.createElement("style");
  st.textContent = `
    #ecran-version{ position:fixed; inset:0; z-index:10000; display:grid; place-items:center; padding:20px;
      background:rgba(6,10,20,.94); color:var(--texte,#e5e7eb); }
    #ecran-version .ev-cadre{ max-width:420px; text-align:center; border:1px solid var(--line,#2a3446); border-radius:12px;
      padding:22px 20px; background:rgba(20,28,44,.95); }
    #ecran-version h2{ margin:0 0 10px; font-size:20px; }
    #ecran-version p{ margin:0 0 16px; line-height:1.5; }
    #ecran-version button{ font-size:16px; padding:10px 22px; cursor:pointer; }`;
  document.head.appendChild(st);
  const d = document.createElement("div");
  d.id = "ecran-version";
  d.innerHTML = `<div class="ev-cadre"><h2>Une nouvelle version est en ligne</h2>
    <p>Recharge pour continuer à jouer. Rien n'est perdu : tout est enregistré sur le serveur.</p>
    <button class="mini" id="ev-recharger">Recharger</button></div>`;
  document.body.appendChild(d);
  /* v2.72 — une adresse neuve (?maj=…) : aucun cache ne peut resservir l'ancienne page. Les autres paramètres
     (?controle…) sont gardés. */
  d.querySelector("#ev-recharger").addEventListener("click", () => {
    try{ const q = new URLSearchParams(location.search); q.set("maj", String(Date.now()));
         location.replace(`${location.pathname}?${q.toString()}${location.hash || ""}`); }
    catch(e){ location.reload(); }
  });
}
