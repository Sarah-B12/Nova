// v1.62 — La Chronique du gouvernement (node outils/o_banc.js . chronique)
// Faux serveur : rôles + chronique_lire. Vérifie l'onglet (après Concertation),
// le rendu des marqueurs, des objets, l'échappement des noms, et le refus.
(async function(){
  const r = {};
  await new Promise(x => setTimeout(x, 1500));
  let LIRE = { ok:true, lignes:[
    { quand:"2026-10-11T16:30:00Z", auteur:"Bob<i>", role:"chef_guerre", texte:"Expédition lancée : {obj:raid} contre {fac:cultivateurs}, prévue le 14/10 à 20h30." },
    { quand:"2026-10-11T15:00:00Z", auteur:"Cyd", role:"architecte", texte:"Détruit : fab_panneau_de_sylve (réserve de la faction)." },
    { quand:"2026-10-11T14:00:00Z", auteur:null, role:null, texte:"Plainte déposée par Eve contre Gus classée sans suite : aucune prime dans les 24 h." } ] };
  _chargerMesRolesGouv = async () => ["regent"];
  const orig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => nom === "chronique_lire" ? Promise.resolve({ data: LIRE, error:null }) : orig(nom, a);
  const el = document.createElement("div"); document.body.appendChild(el);
  _bureauVue = null;
  await majBureau(el);
  r.onglets = [...el.querySelectorAll("[data-bur]")].map(b => b.textContent);
  _bureauVue = "chronique"; await majBureau(el);
  const t = el.textContent.replace(/\s+/g, " ");
  r.titre = t.includes("Chronique —");
  r.pasDeCaisse = !el.querySelector("#bureau-caisse");
  r.marqueurs = t.includes("Raid éclair") && !t.includes("{obj:") && !t.includes("{fac:");
  r.objet = t.includes("Panneau") && !t.includes("fab_panneau_de_sylve");
  r.echappe = !el.querySelector(".chro-ligne i") && t.includes("Bob<i>");
  r.charge = t.includes("(Stratège)") && t.includes("(Architecte)");
  r.nonSigne = [...el.querySelectorAll(".chro-ligne")][2].querySelector("b") === null;
  LIRE = { ok:false, err:"pas_gouvernement" }; await majBureau(el);
  r.refus = el.textContent.includes("réservée aux charges");
  LIRE = { ok:true, lignes:[] }; await majBureau(el);
  r.vide = el.textContent.includes("Rien n'a encore été consigné.");
  return r;
})();
