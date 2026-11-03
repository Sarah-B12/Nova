/* ===========================================================
   v2.20 — LE MODE CONTRÔLE (K136, K137).
   Un admin ou une dev prend la main sur un personnage HORS LIGNE : la console (fiche du
   personnage recherché → « Prendre la main ») appelle la fonction serveur `controle`
   (supabase/functions/controle), qui vérifie le rôle et la cible et rend un jeton de
   connexion à usage unique. La console le pose un instant dans localStorage et ouvre
   `index.html?controle=1` dans un NOUVEL ONGLET, qui :
     1. reprend le jeton (et l'efface aussitôt), se connecte AU NOM du joueur, dans une
        connexion propre à l'onglet (serveur.js, NOVA_CONTROLE) ;
     2. lie sa session à la ligne `controle_sessions` (controle_enregistrer, v241) : le
        serveur sait ainsi que c'est un contrôle (pas « en ligne », pas d'adresse IP) ;
     3. affiche le bandeau rouge, et « Rendre la main » (controle_fin, journal de la
        console dev ; on ne ferme QUE cette session).
   ⚠ La seule trace est le journal de la console dev (K137) : le joueur n'en voit rien.
   ⚠ Ce fichier ne fait rien dans un onglet ordinaire, sauf le bouton de la console.
   =========================================================== */
const CONTROLE_JETON = "nova-controle-jeton";          // localStorage, quelques secondes
const CONTROLE_ONGLET = "nova-controle";               // sessionStorage de l'onglet : { cid, nom }
const CONTROLE_ERREURS = {
  non_connecte:"Ta session a expiré : reconnecte-toi.", non_autorise:"Réservé aux admins et aux devs.",
  soi:"C'est ton propre personnage.", introuvable:"Personnage introuvable.",
  staff:"Seule une dev peut prendre la main sur un membre du staff.",
  en_ligne:"Ce joueur est en ligne : on ne prend pas la main sur un personnage connecté.",
  deja_controle:"Un autre membre du staff a déjà la main sur ce personnage.",
  compte:"Le compte de ce joueur est introuvable.", lien:"La session n'a pas pu s'ouvrir.", session:"La prise de main n'a pas pu s'inscrire.",
  lecture:"Le serveur n'a pas pu lire les profils",
  // v2.22 — bannir, supprimer
  jours:"Entre 1 et 90 jours.", motif:"Un motif est obligatoire (3 à 300 caractères) : le joueur le lira.",
  suspension:"Supabase n'a pas pu suspendre le compte", action:"Action inconnue."
};

/* ---------- Côté console : « Prendre la main » ---------- */
async function controlePrendre(p, forcer){
  if(!p || !p.id) return;
  if(!forcer && !confirm(`Prendre la main sur ${p.nom} ?\n\nUn nouvel onglet s'ouvre à son nom : tu y vois tout et tu agis pour lui. Ton compte reste connecté ici.`)) return;   // v2.20b : rien sur le journal (l'autrice)
  const onglet = (forcer && forcer.onglet) || window.open("", "_blank");      // ouvert TOUT DE SUITE, au clic : sinon le navigateur le bloque
  try{
    const s = await sessionActuelle(); if(!s){ if(onglet) onglet.close(); alert(CONTROLE_ERREURS.non_connecte); return; }
    const r = await fetch(SB_URL + "/functions/v1/controle", { method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + s.access_token, "apikey":SB_KEY },
      body:JSON.stringify({ cible:p.id, forcer:!!forcer }) });
    const d = await r.json().catch(() => null);
    /* v2.25 — en ligne : on demande (un bot qui reste connecté rendait la prise de main impossible). */
    if(d && !d.ok && d.err === "en_ligne" && !forcer){
      const s2 = d.actif_s != null ? ` (actif il y a ${d.actif_s < 60 ? d.actif_s + " s" : Math.round(d.actif_s / 60) + " min"})` : "";
      if(confirm(`${p.nom} est en ligne${s2}.\n\nSi tu prends la main, vous jouerez à deux : la page qui sauvegarde en second se fige avec « ta partie a avancé ailleurs, recharge-la ». Rien n'est perdu ni écrasé.\n\nPrendre la main quand même ?`))
        return controlePrendre(p, { onglet });
      if(onglet) onglet.close(); return;
    }
    if(!d || !d.ok){ if(onglet) onglet.close();
      const msg = CONTROLE_ERREURS[d && d.err] || ((d && d.err) || ("erreur " + r.status));
      alert("Prise de main refusée : " + msg + (d && d.detail ? ` (${d.detail})` : "")); return; }   // v2.20b : le vrai message du serveur
    localStorage.setItem(CONTROLE_JETON, JSON.stringify({ jeton:d.jeton, cid:d.cid, nom:d.nom, t:Date.now() }));
    if(onglet) onglet.location.href = location.pathname + "?controle=1";
    else alert("Le navigateur a bloqué le nouvel onglet : autorise les fenêtres de ce site, puis recommence.");
    journal(`[STAFF] Tu prends la main sur ${d.nom} (nouvel onglet).`, "alerte");
  }catch(e){ if(onglet) onglet.close(); if(typeof _catchLog === "function") _catchLog(e, "controle.js#prendre"); alert("La fonction serveur « controle » ne répond pas. Est-elle déployée ?"); }
}

/* ---------- Côté onglet de contrôle ---------- */
function _controleEchec(msg){
  document.body.innerHTML = `<div style="max-width:520px;margin:60px auto;padding:20px;font-family:sans-serif;color:#e8eef7;background:#1b2433;border:1px solid #ff5257;border-radius:10px">
    <h2 style="margin:0 0 10px;color:#ff8a8d">Mode contrôle</h2><p>${msg}</p><p style="opacity:.7">Tu peux fermer cet onglet.</p></div>`;
}
async function controleOuvrir(){
  let j = null;
  try{ j = JSON.parse(localStorage.getItem(CONTROLE_JETON) || "null"); localStorage.removeItem(CONTROLE_JETON); }catch(e){}
  if(j && j.jeton && Date.now() - (j.t || 0) < 120000){
    let r = await sb.auth.verifyOtp({ token_hash:j.jeton, type:"email" });
    if(r.error) r = await sb.auth.verifyOtp({ token_hash:j.jeton, type:"magiclink" });
    if(r.error){ _controleEchec("La prise de main a échoué : " + echapper(r.error.message || "?")); return false; }
    const { data } = await sb.rpc("controle_enregistrer", { p_cid:j.cid });
    if(!data || !data.ok){ try{ await sb.auth.signOut({ scope:"local" }); }catch(e){} _controleEchec("La session de contrôle n'a pas pu se lier : reprends la main depuis la console."); return false; }
    sessionStorage.setItem(CONTROLE_ONGLET, JSON.stringify({ cid:j.cid, nom:j.nom }));
  }
  let c = null; try{ c = JSON.parse(sessionStorage.getItem(CONTROLE_ONGLET) || "null"); }catch(e){}
  const s = await sessionActuelle();
  if(!c || !s){ _controleEchec("Cet onglet n'a plus de session de contrôle. Reprends la main depuis la console."); return false; }
  _controleBandeau(c);
  return true;
}
function _controleBandeau(c){
  const b = document.createElement("div"); b.id = "controle-bandeau";
  b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;"
    + "padding:calc(6px + env(safe-area-inset-top, 0px)) 12px 6px;background:#8c1d22;color:#fff;font:600 14px/1.3 sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.4)";
  b.innerHTML = `<span>🔴 Tu contrôles <b>${echapper(c.nom || "?")}</b> : tout ce que tu fais, tu le fais en son nom.</span>
    <button id="controle-rendre" style="background:#fff;color:#8c1d22;border:0;border-radius:6px;padding:4px 10px;font-weight:700;cursor:pointer">Rendre la main</button>`;
  document.body.appendChild(b);
  document.body.style.paddingTop = (b.offsetHeight || 36) + "px";
  document.title = "🔴 " + (c.nom || "") + " — contrôle";
  b.querySelector("#controle-rendre").addEventListener("click", controleRendre);
}
async function controleRendre(){
  let c = null; try{ c = JSON.parse(sessionStorage.getItem(CONTROLE_ONGLET) || "null"); }catch(e){}
  try{ if(typeof sauverMaintenant === "function") await sauverMaintenant(); }catch(e){}
  try{ if(c) await sb.rpc("controle_fin", { p_cid:c.cid }); }catch(e){}
  try{ localStorage.removeItem(CLE); }catch(e){}
  sessionStorage.removeItem(CONTROLE_ONGLET);
  if(typeof _deconnexionVolontaire !== "undefined") _deconnexionVolontaire = true;
  try{ await sb.auth.signOut({ scope:"local" }); }catch(e){}
  _controleEchec(`Tu as rendu la main${c && c.nom ? " sur " + echapper(c.nom) : ""}.`);
  try{ window.close(); }catch(e){}
}

/* ===========================================================
   v2.22 — BANNIR, SUPPRIMER (K139, K140) : les gestes du staff passent par la même fonction
   serveur `controle` (action « bannir », « lever », « supprimer », « annuler »).
   =========================================================== */
async function staffAction(action, cible, extra){
  const s = await sessionActuelle(); if(!s) return { ok:false, err:"non_connecte" };
  try{
    const r = await fetch(SB_URL + "/functions/v1/controle", { method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + s.access_token, "apikey":SB_KEY },
      body:JSON.stringify(Object.assign({ action, cible }, extra || {})) });
    return (await r.json().catch(() => null)) || { ok:false, err:"erreur " + r.status };
  }catch(e){ return { ok:false, err:"injoignable" }; }
}
function staffErreur(d){
  const m = CONTROLE_ERREURS[d && d.err] || (d && d.err === "injoignable" ? "La fonction serveur « controle » ne répond pas." : ((d && d.err) || "?"));
  return m + (d && d.detail ? ` (${d.detail})` : "");
}
const _staffDate = iso => { const d = new Date(iso); return isNaN(d) ? "?" : d.toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }); };

/* La veille dit au joueur qu'il est suspendu (K139 A) : il le lit, puis il est déconnecté. Le message
   reste aussi dans son journal (le serveur l'y a déposé). Une suppression en cours : « suspendu », sans plus. */
let _suspenduVu = false;
async function compteSuspendu(b){
  if(_suspenduVu || !b) return; _suspenduVu = true;
  const msg = b.suppression ? "Ton compte est suspendu."
            : `Ton compte est suspendu jusqu'au ${_staffDate(b.jusqua)}.${b.motif ? " Motif : " + b.motif : ""}`;
  try{ if(typeof alerterJoli === "function") await alerterJoli("Compte suspendu", msg, "OK"); else alert(msg); }catch(e){}
  try{ if(typeof sauverMaintenant === "function") await sauverMaintenant(); }catch(e){}
  try{ if(typeof seDeconnecter === "function") await seDeconnecter(); }catch(e){}
  location.reload();
}
