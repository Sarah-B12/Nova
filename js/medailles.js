/* ===========================================================
   v2.48 (K171) — LES MÉDAILLES DES CLASSEMENTS DU MOIS
   Six classements, chacun avec un podium de trois places :
     Arène : victoires · combats · plus_fort   (arene_podiums, v200)
     Tables de jeu : gains · gagnees            (bar_podiums, v220)
     Le Fléau : le score du mois                (fleau_podiums, v231)
   Le serveur (`medailles_lire`, v267) renvoie les places du DERNIER MOIS PAYÉ : une médaille se garde
   jusqu'aux vainqueurs suivants. Affichées au milieu, sous les blasons des Cercles, un peu plus grandes,
   toutes sur la même ligne : sur sa fiche (#medailles) et sur la page profil d'un autre (#pp-medailles).
   Images : images/medailles/<classement>_<place>.png (18 fichiers, K171 option A), ex. arene_victoires_1.png ;
   repli 🥇 🥈 🥉 si l'image manque (comme les blasons).
   =========================================================== */
const MEDAILLES = {
  arene_victoires: "Arène, victoires",
  arene_combats:   "Arène, combattants",
  arene_plus_fort: "Arène, contre plus fort",
  jeux_gains:      "Tables de jeu, gains du mois",
  jeux_gagnees:    "Tables de jeu, parties gagnées",
  fleau:           "Le Fléau, score du mois"
};
const MEDAILLES_ORDRE = Object.keys(MEDAILLES);
const _medCache = {};                     // clé : id du profil (ou « moi ») → { t, liste }
const MED_CACHE_MS = 10 * 60 * 1000;
function medailleId(m){ return (m && m.src === "fleau") ? "fleau" : `${m && m.src}_${m && m.type}`; }
function _medMois(mois){
  const s = String(mois || "").slice(0, 7), [a, mo] = s.split("-").map(Number);
  if(!a || !mo) return "";
  return new Date(Date.UTC(a, mo - 1, 15)).toLocaleDateString("fr-FR", { month:"long", year:"numeric", timeZone:"UTC" });
}
async function medaillesDe(profilId, forcer){
  const cle = profilId || "moi", c = _medCache[cle];
  if(!forcer && c && Date.now() - c.t < MED_CACHE_MS) return c.liste;
  if(typeof SERVEUR_DISPO === "undefined" || !SERVEUR_DISPO) return [];
  let liste = [];
  try{
    const { data, error } = await sb.rpc("medailles_lire", { p_profil: profilId || null });
    if(!error && Array.isArray(data)) liste = data;
  }catch(e){ if(typeof _catchLog === "function") _catchLog(e, "medailles.js#lire"); }
  liste = liste.filter(m => MEDAILLES[medailleId(m)] && m.rang >= 1 && m.rang <= 3)
               .sort((a, b) => (MEDAILLES_ORDRE.indexOf(medailleId(a)) - MEDAILLES_ORDRE.indexOf(medailleId(b))) || (a.rang - b.rang));
  _medCache[cle] = { t: Date.now(), liste };
  return liste;
}
function medaillesHtml(liste){
  if(!liste || !liste.length) return "";
  return liste.map(m => {
    const id = medailleId(m), place = m.rang === 1 ? "1ʳᵉ place" : `${m.rang}ᵉ place`;
    const emo = ["🥇","🥈","🥉"][m.rang - 1] || "🏅", mois = _medMois(m.mois);
    const titre = `${place} — ${MEDAILLES[id]}${mois ? ` (${mois})` : ""}`;
    /* .rep-badge : la même bulle que les blasons (survol, ou toucher sur téléphone et tablette). */
    return `<div class="rep-badge medaille" tabindex="0" role="button" aria-label="${titre}">`
         + `<img class="med-img" src="images/medailles/${id}_${m.rang}.png" alt="" loading="lazy" onerror="this.outerHTML='<span class=\\'med-ic\\'>${emo}</span>'">`
         + `<span class="rep-bulle">${titre}</span></div>`;
  }).join("");
}
async function majMesMedailles(forcer){
  const z = document.querySelector("#medailles"); if(!z) return;
  const L = await medaillesDe(null, forcer);
  z.innerHTML = medaillesHtml(L); z.hidden = !L.length;
}
/* À la connexion (bootstrap.js), puis toutes les heures : les podiums changent au paiement du mois. */
setInterval(() => { if(typeof etat !== "undefined" && etat && etat.faction) majMesMedailles(true); }, 60 * 60 * 1000);
(function _medStyle(){
  if(typeof document === "undefined" || document.querySelector("#med-style")) return;
  const st = document.createElement("style"); st.id = "med-style";
  st.textContent = `
    .medailles{ display:flex; justify-content:center; align-items:center; gap:14px; flex-wrap:wrap; margin:6px 0 4px; }
    .medailles[hidden]{ display:none; }
    .med-img{ width:46px; height:46px; object-fit:contain; display:block; filter:drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
    .med-ic{ font-size:34px; line-height:1; display:block; }
  `;
  document.head.appendChild(st);
})();
