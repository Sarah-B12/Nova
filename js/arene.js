/* ===========================================================
   L'ARÈNE DU PERCHOIR — écran (brique 5/6)

   Le serveur décide de TOUT : qui est défiable, qui gagne, combien d'XP.
   Ce fichier ne calcule rien, il affiche et il transmet. Trois RPC :
     arene_adversaires()  → la liste et les bandes de force
     arene_defier(uuid)   → lance un défi (−3 % d'énergie)
     arene_repondre(id,b) → accepte (et résout) ou refuse

   ⚠ AUCUN CHIFFRE DE FORCE N'ARRIVE ICI, et c'est voulu : le serveur ne
     renvoie qu'une bande sur trois. Afficher la force exacte supprimerait le
     risque — on ne défierait que ce qu'on est sûr de battre, et les 30 duels
     quotidiens deviendraient une rente. Ne JAMAIS ajouter le chiffre ici,
     même s'il devenait disponible.
   ⚠ Le bouton n'existe qu'au Perchoir (majHub), mais le serveur ne vérifie
     PAS la position : elle vit dans `donnees`, que le client écrit lui-même,
     un contrôle serveur n'y serait qu'un décor. Défier d'ailleurs ne procure
     aucun avantage — tout ce qui pèse sur l'équité est vérifié en base.
   =========================================================== */

const ARENE_BANDES = {
  plus_faible: { txt:"plus faible que toi", couleur:"#8bd450" },
  comparable:  { txt:"à ta portée",         couleur:"#ffb060" },
  plus_fort:   { txt:"plus fort que toi",   couleur:"#ff5257" }
};

let _areneOccupe = false;   // une seule requête à la fois : le double-clic est la règle sur mobile

function _areneFmt(ts){
  if(!ts) return "—";
  try{ return new Date(ts).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"}); }
  catch(e){ return "—"; }
}

async function majArene(){
  const z = document.querySelector("#arene-vue"); if(!z) return;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){
    z.innerHTML = `<p class="vide">L'arène a besoin du serveur.</p>`; return;
  }
  z.innerHTML = `<p class="vide">Chargement…</p>`;

  let adv = null, mes = null;
  try{
    const [a, m] = await Promise.all([ sb.rpc("arene_adversaires"), sb.rpc("arene_mes_defis") ]);
    if(a && a.error) throw new Error(a.error.message);
    adv = a && a.data; mes = m && m.data;
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "arene.js#1");
    z.innerHTML = `<p class="vide">L'arène ne répond pas. Réessaie dans un instant.</p>`;
    return;
  }

  /* ⚠ « pas_acces » n'est pas une erreur : c'est un joueur qui n'a pas fini Q5.
     On le dit clairement au lieu d'afficher une liste vide inexplicable. */
  if(!adv || !adv.ok){
    const m = (adv && adv.err==="pas_acces")
      ? "L'arène n'accepte que ceux qui ont mérité leur vaisseau. Termine l'arc des cinq premières quêtes."
      : "L'arène ne répond pas.";
    z.innerHTML = `<p class="vide">${m}</p>`; return;
  }

  let html = `<p class="vide" style="margin:0 0 12px">Un hologramme, deux combattants, aucune blessure. Défier coûte <b>3 %</b> d'énergie ; répondre ne coûte rien. Un refus n'a aucune conséquence.</p>`;

  /* ---------- Ce qu'on me doit ---------- */
  const recus = (mes && mes.recus) || [];
  if(recus.length){
    html += `<h4 style="margin:14px 0 6px">Défis reçus</h4>`;
    html += recus.map(d => `
      <div class="dist-ligne" style="align-items:center">
        <span><b>${d.de}</b> <span class="itip-gris">· niveau ${d.niveau} · ${_areneFacNom(d.faction)}</span></span>
        <span>
          <button class="mini" data-arene-oui="${d.id}">Accepter</button>
          <button class="mini" data-arene-non="${d.id}">Refuser</button>
        </span>
      </div>`).join("");
  }

  /* ---------- Qui je peux défier ---------- */
  const liste = adv.adversaires || [];
  html += `<h4 style="margin:16px 0 6px">Adversaires${typeof adv.restants==="number" ? ` <span class="itip-gris">— ${adv.restants} défis restants aujourd'hui</span>` : ""}</h4>`;
  if(!liste.length){
    html += `<p class="vide">Personne d'autre n'a encore atteint le Perchoir. Reviens quand l'Écart se sera peuplé.</p>`;
  } else {
    html += liste.map(a => {
      const b = ARENE_BANDES[a.bande] || ARENE_BANDES.comparable;
      const bloque = a.en_attente;
      return `
      <div class="dist-ligne" style="align-items:center">
        <span><b>${a.nom}</b> <span class="itip-gris">· niveau ${a.niveau} · ${_areneFacNom(a.faction)}</span><br>
          <span style="color:${b.couleur};font-size:12px">${b.txt}</span></span>
        <button class="mini" data-arene-defi="${a.id}" ${bloque?"disabled":""}>${bloque?"Défi en attente":"Défier"}</button>
      </div>`;
    }).join("");
  }

  /* ---------- Ce qui s'est passé ---------- */
  const hist = (mes && mes.historique) || [];
  if(hist.length){
    html += `<h4 style="margin:16px 0 6px">Derniers duels</h4>`;
    html += hist.map(h => {
      if(h.statut !== "accepte"){
        const mot = h.statut==="refuse" ? "refusé" : "expiré";
        return `<p class="itip-gris" style="margin:2px 0;font-size:12px">${_areneFmt(h.quand)} — défi ${mot} · ${h.adversaire}</p>`;
      }
      const r = h.rapport || {};
      const jeSuisCh = (h.jetais === "challenger");
      /* `rapport.vainqueur` est un identifiant : on ne sait pas si c'est le
         nôtre. On le déduit du camp qu'on occupait et des XP, qui valent 12×
         en victoire contre 4× en défaite. */
      const monXp = jeSuisCh ? r.xp_challenger : r.xp_defie;
      /* Le rapport donne l'identifiant du vainqueur, pas le mien : on compare
         les XP, qui valent 12× en victoire contre 4× en défaite. */
      const sonXp = jeSuisCh ? r.xp_defie : r.xp_challenger;
      const issue = (monXp > sonXp) ? "gagné" : (monXp < sonXp ? "perdu" : "—");
      return `<p class="itip-gris" style="margin:2px 0;font-size:12px">${_areneFmt(h.quand)} — ${h.adversaire} · <b>${issue}</b> · +${monXp||0} XP</p>`;
    }).join("");
  }

  z.innerHTML = html;

  z.querySelectorAll("[data-arene-defi]").forEach(b =>
    b.addEventListener("click", () => _areneDefier(b.dataset.areneDefi, b)));
  z.querySelectorAll("[data-arene-oui]").forEach(b =>
    b.addEventListener("click", () => _areneRepondre(b.dataset.areneOui, true, b)));
  z.querySelectorAll("[data-arene-non]").forEach(b =>
    b.addEventListener("click", () => _areneRepondre(b.dataset.areneNon, false, b)));
}

/* ===========================================================
   LA VUE « DUELS » DU RÉSEAU (brique 6/6)

   ⚠ POURQUOI UNE SECONDE VUE. Le GDD est explicite : « le défié peut accepter
     depuis n'importe où ». L'arène du Perchoir sert à CHERCHER un adversaire —
     ça, il faut y être. Répondre à un défi, non : un joueur au fond de la
     Toundra doit pouvoir le faire. D'où ce doublon d'affichage, qui partage
     tout le reste (`_areneRepondre`, les libellés d'erreur).
   ⚠ On n'y met PAS la liste des adversaires : défier exige d'être au Perchoir,
     et montrer ici un bouton « Défier » qui échouerait serait cruel.
   =========================================================== */
async function rendreDuelsComm(z){
  if(!z) return;
  if(typeof SERVEUR_DISPO==="undefined" || !SERVEUR_DISPO){
    z.innerHTML = `<p class="vide">Les duels ont besoin du serveur.</p>`; return;
  }
  z.innerHTML = `<p class="vide">Chargement…</p>`;
  let mes = null;
  try{
    const { data, error } = await sb.rpc("arene_mes_defis");
    if(error) throw new Error(error.message);
    mes = data;
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "arene.js#4");
    z.innerHTML = `<p class="vide">Impossible de charger tes duels.</p>`; return;
  }
  if(!mes || !mes.ok){ z.innerHTML = `<p class="vide">Impossible de charger tes duels.</p>`; return; }

  const recus = mes.recus || [], envoyes = mes.envoyes || [], hist = mes.historique || [];
  let html = `<p class="vide" style="margin:0 0 12px">Tu peux répondre à un défi où que tu sois. Pour en <b>lancer</b> un, il faut te rendre à l'arène du Perchoir.</p>`;

  html += `<h4 style="margin:12px 0 6px">Défis reçus</h4>`;
  html += recus.length ? recus.map(d => `
      <div class="dist-ligne" style="align-items:center">
        <span><b>${d.de}</b> <span class="itip-gris">· niveau ${d.niveau} · ${_areneFacNom(d.faction)}</span></span>
        <span>
          <button class="mini" data-arene-oui="${d.id}">Accepter</button>
          <button class="mini" data-arene-non="${d.id}">Refuser</button>
        </span>
      </div>`).join("")
    : `<p class="vide">Personne ne t'a défié.</p>`;

  if(envoyes.length){
    html += `<h4 style="margin:16px 0 6px">En attente de réponse</h4>`;
    html += envoyes.map(d => `<p class="itip-gris" style="margin:2px 0;font-size:12px">${_areneFmt(d.cree_le)} — ${d.a}</p>`).join("");
  }
  if(hist.length){
    html += `<h4 style="margin:16px 0 6px">Derniers duels</h4>`;
    html += hist.map(h => {
      if(h.statut !== "accepte"){
        return `<p class="itip-gris" style="margin:2px 0;font-size:12px">${_areneFmt(h.quand)} — défi ${h.statut==="refuse"?"refusé":"expiré"} · ${h.adversaire}</p>`;
      }
      const r = h.rapport || {}; const ch = (h.jetais === "challenger");
      const monXp = ch ? r.xp_challenger : r.xp_defie;
      const sonXp = ch ? r.xp_defie : r.xp_challenger;
      const issue = (monXp > sonXp) ? "gagné" : (monXp < sonXp ? "perdu" : "—");
      return `<p class="itip-gris" style="margin:2px 0;font-size:12px">${_areneFmt(h.quand)} — ${h.adversaire} · <b>${issue}</b> · +${monXp||0} XP</p>`;
    }).join("");
  }

  z.innerHTML = html;
  z.querySelectorAll("[data-arene-oui]").forEach(b =>
    b.addEventListener("click", () => _areneRepondre(b.dataset.areneOui, true, b)));
  z.querySelectorAll("[data-arene-non]").forEach(b =>
    b.addEventListener("click", () => _areneRepondre(b.dataset.areneNon, false, b)));
}

/* ⚠ Après une réponse, on ne sait pas D'OÙ le joueur a cliqué : l'arène du
   Perchoir ou le Réseau. On rafraîchit les deux — chacune sort d'elle-même si
   son conteneur n'est pas à l'écran — et le compteur de non-lus avec. */
function _areneRafraichir(){
  if(typeof majArene==="function") majArene();
  if(typeof commVue!=="undefined" && commVue==="duels" && typeof majComm==="function") majComm();
  if(typeof compterNotifs==="function") compterNotifs();
}

function _areneFacNom(id){
  if(typeof FACTIONS==="undefined" || !id) return id||"—";
  const f = FACTIONS.find(x => x.id === id);
  return f ? f.nom : id;
}

/* ⚠ Les messages d'erreur sont nommés un par un. « Échec » tout court est la
   pire réponse possible : le joueur vient de cliquer, il veut savoir POURQUOI
   et surtout si son énergie a été prise. */
const ARENE_ERREURS = {
  pas_acces:            "Tu n'as pas encore accès au Perchoir.",
  indisponible:         "Tu n'es pas en état de combattre.",
  prison:               "On ne défie personne depuis une cellule.",
  cible_introuvable:    "Cet adversaire n'est plus éligible.",
  cible_indisponible:   "Cet adversaire n'est pas en état de combattre.",
  cible_prison:         "Cet adversaire est en prison.",
  deja_en_attente:      "Tu l'as déjà défié : attends sa réponse.",
  plafond:              "Tu as atteint ta limite de défis pour aujourd'hui.",
  energie:              "Pas assez d'énergie (il en faut 3 %).",
  pas_pour_toi:         "Ce défi ne t'est pas adressé.",
  deja_repondu:         "Ce défi a déjà été réglé.",
  introuvable:          "Ce défi n'existe plus.",
  challenger_indisponible: "Celui qui t'a défié n'est plus en état de combattre — le défi est annulé."
};

async function _areneDefier(cible, bouton){
  if(_areneOccupe) return; _areneOccupe = true; if(bouton) bouton.disabled = true;
  try{
    const { data, error } = await sb.rpc("arene_defier", { p_cible: cible });
    if(error) throw new Error(error.message);
    if(!data || !data.ok){
      journal(ARENE_ERREURS[data && data.err] || "Le défi n'a pas pu être lancé.", "alerte");
    } else {
      journal(`Défi envoyé à ${data.nom}. Il a deux jours pour répondre. (−3 % d'énergie)`, "gain");
      /* L'énergie vient d'être prise côté serveur : on relit plutôt que de
         soustraire 3 dans notre coin — deux barèmes valent toujours mieux un. */
      /* ⚠ Pas de `syncEnergie()` : cette fonction n'existe pas dans le projet.
         `apresAction()` relit l'énergie du serveur, c'est le chemin habituel. */
      if(typeof apresAction==="function") apresAction();
    }
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "arene.js#2");
    journal("L'arène ne répond pas — ton défi n'a pas été envoyé.", "alerte");
  }
  _areneOccupe = false;
  _areneRafraichir();
}

async function _areneRepondre(id, accepte, bouton){
  if(_areneOccupe) return; _areneOccupe = true;
  /* ⚠ On grise les DEUX boutons de la ligne : accepter puis refuser en deux
     clics rapides partirait deux fois vers le serveur. Le `for update` de
     `arene_repondre` rattrape le coup en base, mais autant ne pas l'envoyer. */
  if(bouton && bouton.parentElement) bouton.parentElement.querySelectorAll("button").forEach(b => b.disabled = true);
  try{
    const { data, error } = await sb.rpc("arene_repondre", { p_defi: Number(id), p_accepte: !!accepte });
    if(error) throw new Error(error.message);
    if(!data || !data.ok){
      journal(ARENE_ERREURS[data && data.err] || "La réponse n'a pas pu être enregistrée.", "alerte");
    } else if(data.statut === "refuse"){
      journal("Défi décliné.", "");
    } else {
      const issue = data.gagne ? "Victoire" : "Défaite";
      const rep   = data.rep > 0 ? " +1 réputation." : "";
      const bis   = data.duel_du_jour > 1 ? ` (${data.duel_du_jour}ᵉ duel du jour contre lui : gain réduit)` : "";
      /* ⚠ PAS D'XP DANS CE MESSAGE. `syncEffetsCombat()`, appelée juste après,
         l'annonce déjà (« Expérience de campagne : +N XP »). L'écrire ici
         aussi la ferait lire deux fois — c'est le doublon supprimé en v0.89
         pour les expéditions, je ne le réintroduis pas pour les duels. */
      journal(`⚔️ ${issue} contre ${data.adversaire} — ${data.ma_force} contre ${data.sa_force}.${rep}${bis}`,
              data.gagne ? "gain" : "alerte");
      /* L'XP est déposée dans `effets_combat` : c'est la synchro habituelle qui
         la ramène et qui gère la montée de niveau. On ne l'ajoute pas ici. */
      if(typeof syncEffetsCombat==="function") await syncEffetsCombat();
      else if(typeof apresAction==="function") apresAction();
    }
  }catch(e){
    if(typeof _catchLog==="function") _catchLog(e, "arene.js#3");
    journal("L'arène ne répond pas — réessaie.", "alerte");
  }
  _areneOccupe = false;
  _areneRafraichir();
}
