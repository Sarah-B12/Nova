#!/usr/bin/env node
/* ===========================================================
   NOVA EPIC — CONTRÔLE AVANT DÉPLOIEMENT                (v0.95)

   À lancer à la racine du projet (là où se trouve index.html) :
       node outils/controle.js

   Aucune dépendance, aucun réseau. Il ne modifie rien, il regarde.

   ⚠ POURQUOI CE FICHIER EXISTE. `node --check` valide la SYNTAXE, pas le SENS.
   Trois blocs de `sonde.js` ont été supprimés par erreur : le fichier restait
   parfaitement valide, et trois boutons sur quatre lançaient un ReferenceError
   avalé par une fonction `async`. Aucun outil du projet ne voyait rien.
   Le contrôle utile, c'est le n°4 ci-dessous : « toute fonction appelée
   existe-t-elle ? ». C'est lui qui a retrouvé les trois blocs perdus.
   =========================================================== */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RACINE = process.cwd();
const DIR_JS = path.join(RACINE, "js");
let alertes = 0;

function titre(t){ console.log("\n" + t + "\n" + "─".repeat(t.length)); }
function ko(msg){ alertes++; console.log("  ✗ " + msg); }
function ok(msg){ console.log("  ✓ " + msg); }

if(!fs.existsSync(DIR_JS) || !fs.existsSync(path.join(RACINE, "index.html"))){
  console.error("À lancer depuis la RACINE du projet (index.html + js/ attendus).");
  process.exit(2);
}

const fichiers = fs.readdirSync(DIR_JS).filter(f => f.endsWith(".js")).sort();
const sources  = {};
for(const f of fichiers) sources[f] = fs.readFileSync(path.join(DIR_JS, f), "utf8");
const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");

/* ---------- 1. Syntaxe ---------- */
titre("1. Syntaxe (node --check)");
for(const f of fichiers){
  try{ execFileSync(process.execPath, ["--check", path.join(DIR_JS, f)], { stdio:"pipe" }); }
  catch(e){ ko(f + " — " + String(e.stderr||"").split("\n").slice(0,3).join(" ")); }
}
if(!alertes) ok(fichiers.length + " fichiers valides");

/* ---------- 2. Fichiers non chargés par index.html ---------- */
titre("2. Fichiers présents mais jamais chargés");
let orphelins = 0;
for(const f of fichiers){
  if(f === "vendor") continue;
  if(!html.includes("js/" + f)){ ko(f + " n'est chargé nulle part dans index.html"); orphelins++; }
}
if(!orphelins) ok("tous les fichiers de js/ sont chargés");

/* ---------- 3. Collisions de noms globaux ----------
   Colonne 0 uniquement : une déclaration indentée est locale à un bloc. */
titre("3. Collisions de noms globaux entre fichiers");
const proprio = {};
let collisions = 0;
for(const f of fichiers){
  const re = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^(?:const|let|var)\s+([A-Za-z0-9_$]+)/gm;
  let m;
  while((m = re.exec(sources[f]))){
    const nom = m[1] || m[2];
    if(proprio[nom] && proprio[nom] !== f){ ko(nom + " déclaré dans " + proprio[nom] + " ET " + f); collisions++; }
    else proprio[nom] = f;
  }
}
if(!collisions) ok("aucun nom global déclaré deux fois");

/* ---------- 4. Fonctions appelées mais jamais déclarées ----------
   LE contrôle qui rattrape un bloc supprimé par erreur.

   ⚠ Première version : 409 fausses alertes. Elle lisait les commentaires
   français (« la corporation (AREPO) ») et le CSS des gabarits (`rgba(`,
   `var(`, `calc(`) comme des appels de fonction. Un contrôle qui se trompe
   autant n'est jamais relu. D'où `_nettoyer()` ci-dessous : on efface d'abord
   TOUT ce qui n'est pas du code — commentaires, chaînes, gabarits, littéraux
   d'expression régulière — avant de chercher quoi que ce soit. */
titre("4. Appels vers une fonction qui n'existe pas  ⚠ LE CONTRÔLE IMPORTANT");

/* Remplace par des espaces le contenu des commentaires, chaînes, gabarits et
   expressions régulières, en conservant longueur et numéros de ligne.
   ⚠ PILE, et pas un balayage à plat : les gabarits sont IMBRIQUÉS dans ce
   projet (`${ x ? `<b>${n}</b>` : "" }`). À plat, le backtick intérieur était
   pris pour la fermeture de l'extérieur et tout le reste du fichier était lu
   de travers — d'où dix fausses alertes tenaces (`var()`, `Ami()`…).
   Le TEXTE d'un gabarit est effacé, le code des `${…}` est conservé : il
   contient de vrais appels. */
function _nettoyer(src){
  const out = src.split("");
  const espace = (a, b) => { for(let k = a; k < b && k < out.length; k++) if(out[k] !== "\n") out[k] = " "; };
  const avantRegex = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "\n", "+", "-", "*", "%", "<", ">", "~", "^"]);
  const pile = [];          // un cadre par gabarit ouvert ; `accolades` = profondeur dans ${…}
  let i = 0, texteDebut = -1;

  while(i < src.length){
    const cadre = pile.length ? pile[pile.length - 1] : null;

    // --- Dans le TEXTE d'un gabarit ---
    if(cadre && cadre.accolades === 0){
      if(src[i] === "\\"){ i += 2; continue; }
      if(src[i] === "$" && src[i + 1] === "{"){ espace(texteDebut, i); cadre.accolades = 1; i += 2; continue; }
      if(src[i] === "`"){
        espace(texteDebut, i); pile.pop(); i++;
        const p = pile.length ? pile[pile.length - 1] : null;
        if(p && p.accolades === 0) texteDebut = i;
        continue;
      }
      i++; continue;
    }

    // --- Contexte CODE (hors gabarit, ou à l'intérieur d'un ${…}) ---
    const c = src[i], d = src[i + 1];
    if(c === "/" && d === "/"){ let j = src.indexOf("\n", i); if(j < 0) j = src.length; espace(i, j); i = j; continue; }
    if(c === "/" && d === "*"){ let j = src.indexOf("*/", i + 2); j = (j < 0) ? src.length : j + 2; espace(i, j); i = j; continue; }
    if(c === '"' || c === "'"){
      let j = i + 1;
      while(j < src.length && src[j] !== c){ if(src[j] === "\\") j++; j++; }
      espace(i + 1, j); i = j + 1; continue;
    }
    if(c === "`"){ pile.push({ accolades: 0 }); texteDebut = i + 1; i++; continue; }
    if(c === "/"){
      let k = i - 1;
      while(k >= 0 && /\s/.test(src[k])) k--;
      if(k < 0 || avantRegex.has(src[k])){
        let j = i + 1, crochet = false;
        while(j < src.length){
          const e = src[j];
          if(e === "\\"){ j += 2; continue; }
          if(e === "[") crochet = true;
          else if(e === "]") crochet = false;
          else if(e === "/" && !crochet) break;
          else if(e === "\n") break;
          j++;
        }
        if(src[j] === "/"){ espace(i + 1, j); i = j + 1; continue; }
      }
    }
    if(cadre){
      if(c === "{") cadre.accolades++;
      else if(c === "}"){ cadre.accolades--; if(cadre.accolades === 0) texteDebut = i + 1; }
    }
    i++;
  }
  return out.join("");
}

const propre = {};
for(const f of fichiers) propre[f] = _nettoyer(sources[f]);

const CONNUS = new Set([
  "if","for","while","switch","catch","return","typeof","function","await","new","do","else","in",
  "of","delete","void","instanceof","yield","throw","case","super","this",
  "parseInt","parseFloat","isNaN","isFinite","String","Number","Boolean","Array","Object","Date",
  "JSON","Math","Promise","Map","Set","WeakMap","RegExp","Error","Symbol","BigInt","require",
  "alert","confirm","prompt","fetch","setTimeout","setInterval","clearTimeout","clearInterval",
  "requestAnimationFrame","cancelAnimationFrame","encodeURIComponent","decodeURIComponent",
  "encodeURI","decodeURI","btoa","atob","structuredClone","queueMicrotask","getComputedStyle",
  "matchMedia","CustomEvent","Event","MouseEvent","KeyboardEvent","Image","Audio","Blob","URL",
  "FileReader","AbortController","TextEncoder","TextDecoder","Intl","Function","Proxy","Reflect"
]);

const declares = new Set(CONNUS);
for(const f of fichiers){
  const s = propre[f];
  let m;
  const reFn = /(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/g;
  while((m = reFn.exec(s))) declares.add(m[1]);
  // `const a = 1, b = 2;` — on lit TOUTE la liste, pas seulement le premier nom.
  const reDecl = /\b(?:const|let|var)\s+([^;\n]+)/g;
  while((m = reDecl.exec(s))){
    (m[1].match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []).forEach(n => declares.add(n));
  }
  // `nom = function`, `nom = async (…) =>`, `nom: function`, méthodes d'objet
  const reAff = /([A-Za-z0-9_$]+)\s*[:=]\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>|[A-Za-z0-9_$]+\s*=>)/g;
  while((m = reAff.exec(s))) declares.add(m[1]);
  // paramètres (fonctions classiques et flèches)
  const rePar = /(?:function[^(]*|=>\s*|\b)\(([^()]*)\)\s*(?:=>|\{)/g;
  while((m = rePar.exec(s))){
    (m[1].match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []).forEach(n => declares.add(n));
  }
  // paramètres de catch
  const reCatch = /catch\s*\(\s*([A-Za-z0-9_$]+)/g;
  while((m = reCatch.exec(s))) declares.add(m[1]);
}

const appels = {};
for(const f of fichiers){
  propre[f].split("\n").forEach((ligne, i) => {
    const re = /(^|[^.\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
    let m;
    while((m = re.exec(ligne))){
      const nom = m[2];
      if(declares.has(nom)) continue;
      (appels[nom] = appels[nom] || []).push(f + ":" + (i + 1));
    }
  });
}
const manquants = Object.keys(appels).sort();
if(!manquants.length) ok("toute fonction appelée est déclarée quelque part");
else manquants.forEach(n => ko(n + "()  appelée en " + appels[n].slice(0, 5).join(", ")
                               + (appels[n].length > 5 ? " …" : "")));

/* ---------- 5. RPC appelées par le client ----------
   À croiser avec la requête (b') du BACKEND_PLAN §0.
   ⚠ Les appels DYNAMIQUES (nom dans une variable) échappent à ce relevé :
     gouvernement.js (placer_defense / retirer_defense / detruire_reserve)
     et dev-console.js (pause_entrer / pause_sortir). */
titre("5. RPC appelées par le client (à croiser avec pg_proc)");
const rpcs = new Set();
for(const f of fichiers){
  const re = /rpc\(\s*["'`]([a-z0-9_]+)["'`]/g;
  let m;
  while((m = re.exec(sources[f]))) rpcs.add(m[1]);
}
console.log("  " + [...rpcs].sort().join(" "));
console.log("  (" + rpcs.size + " noms littéraux + 5 dynamiques)");

/* ---------- 6. Chemins absolus (Cloudflare est sensible à la casse) ---------- */
titre("6. Chemins absolus dans les sources");
let abs = 0;
for(const [nom, s] of Object.entries({ "index.html": html, ...sources })){
  const re = /(?:src|href)=["']\/[^/]/g;
  if(re.test(s)){ ko(nom + " contient un chemin absolu"); abs++; }
}
if(!abs) ok("aucun chemin absolu");

/* ---------- Outil : clés de premier niveau d'un objet littéral global ----------
   Lit `const NOM = { a:…, b:…, "c":… }` sur la source NETTOYÉE (chaînes
   effacées) : les clés sont donc des identifiants nus. Suffit pour les tables
   de ce projet, qui n'utilisent pas de clés calculées. */
function clesObjet(nom){
  for(const f of fichiers){
    const s = propre[f];
    const m = new RegExp("^const\\s+" + nom + "\\s*=\\s*\\{", "m").exec(s);
    if(!m) continue;
    const cles = []; let i = m.index + m[0].length, prof = 1, debut = i;
    for(; i < s.length && prof > 0; i++){
      const c = s[i];
      if(c === "{" || c === "[" || c === "(") prof++;
      else if(c === "}" || c === "]" || c === ")") prof--;
      else if(prof === 1 && c === ":"){
        const k = /([A-Za-z_$][A-Za-z0-9_$]*)\s*$/.exec(s.slice(debut, i));
        if(k) cles.push(k[1]);
      }
      if(prof === 1 && c === ",") debut = i + 1;
    }
    return { f, cles };
  }
  return null;
}

/* ---------- 7. Globales déclarées et jamais lues (v0.95) ----------
   Piège n°14 : une constante orpheline est la TRACE d'un bloc disparu —
   c'est `SONDE_PV_RIPOSTE` qui a trahi les trois options mortes de la sonde.
   Avant de supprimer un orphelin, chercher ce qui l'utilisait. */
titre("7. Globales déclarées et jamais lues");
const ORPHELINS_ASSUMES = {
  _saisieEnCours:   "garde-fou anti-redessin, prêt à brancher (pièges n°20 et 22)",
  prochainResetJeu: "minuit parisien exact, changement d'heure compris — pour les futurs « reviens demain »"
};
const toutPropre = Object.values(propre).join("\n") + "\n" + html;
let orph = 0;
for(const f of fichiers){
  const re = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^(?:const|let|var)\s+([A-Za-z0-9_$]+)/gm;
  let m;
  while((m = re.exec(sources[f]))){
    const nom = m[1] || m[2];
    if(ORPHELINS_ASSUMES[nom]) continue;
    const n = (toutPropre.match(new RegExp("(^|[^\\w$.]|\\.\\.\\.)" + nom.replace(/\$/g, "\\$") + "(?![\\w$])", "g")) || []).length;
    if(n <= 1){ ko(nom + " (" + f + ") n'est lu nulle part"); orph++; }
  }
}
if(!orph) ok("aucune globale orpheline (hors " + Object.keys(ORPHELINS_ASSUMES).length + " assumées)");

/* ---------- 8. Registre des structures (v0.95) ----------
   Une structure existe à CINQ endroits : STRUCTURES, IMG, REPARATION,
   normaliserParcelles (qui lit désormais STRUCTURES) et le `case` de
   reparer_structure côté SERVEUR — celui-là, aucun script client ne le voit. */
titre("8. Registre des structures (STRUCTURES ↔ IMG ↔ REPARATION)");
{
  const S = clesObjet("STRUCTURES"), I = clesObjet("IMG"), R = clesObjet("REPARATION");
  if(!S || !I || !R) ko("table introuvable : " + [!S&&"STRUCTURES", !I&&"IMG", !R&&"REPARATION"].filter(Boolean).join(", "));
  else {
    let e = 0;
    for(const t of S.cles){
      if(!I.cles.includes(t)){ ko("structure « " + t + " » sans image dans IMG (" + I.f + ")"); e++; }
      if(!R.cles.includes(t)){ ko("structure « " + t + " » sans matières dans REPARATION (" + R.f + ")"); e++; }
    }
    for(const t of R.cles) if(t !== "maison" && !S.cles.includes(t)){ ko("REPARATION connaît « " + t + " », absent de STRUCTURES"); e++; }
    if(!e) ok(S.cles.length + " structures + logement couverts. ⚠ Penser au `case` de reparer_structure (serveur).");
  }
}

/* ---------- 9. MOTIFS_ACTION ↔ motifs réellement envoyés (v0.95) ----------
   La remise d'énergie des aptitudes ne s'applique qu'aux motifs de cette
   liste. Un motif renommé d'un côté seulement perd la remise, sans erreur. */
titre("9. MOTIFS_ACTION ↔ motifs envoyés à agir()");
{
  const src = Object.values(sources).join("\n");
  const m = /const\s+MOTIFS_ACTION\s*=\s*new\s+Set\(\s*\[([^\]]*)\]/.exec(src);
  if(!m) ko("MOTIFS_ACTION introuvable");
  else {
    const liste = (m[1].match(/"([a-z_]+)"/g) || []).map(x => x.slice(1, -1));
    const envoyes = new Set((src.match(/motif\s*:\s*"([a-z_]+)"/g) || []).map(x => x.split('"')[1]));
    const morts = liste.filter(x => !envoyes.has(x));
    if(morts.length) morts.forEach(x => ko("MOTIFS_ACTION contient « " + x + " », qu'aucun appel n'envoie"));
    else ok(liste.length + " motifs, tous envoyés quelque part");
  }
}

/* ---------- 10. `.catch` / `.finally` sur un appel Supabase (v0.95) ----------
   Piège n°26 : `sb.rpc()` est un thenable PARESSEUX, sans catch ni finally.
   `sb.rpc(…).catch(…)` lève un TypeError synchrone et la requête ne part
   jamais. Seuls `await` et `Promise.resolve(sb.rpc(…))` sont sûrs. */
titre("10. .catch / .finally sur un appel Supabase");
{
  let e = 0;
  for(const f of fichiers){
    const s = propre[f];
    const re = /\bsb\s*\.\s*(?:rpc|from|auth)\b[^;]*?\)\s*\.\s*(catch|finally)\s*\(/g;
    let m;
    while((m = re.exec(s))){
      const avant = s.slice(Math.max(0, m.index - 20), m.index);
      if(/Promise\.resolve\(\s*$/.test(avant)) continue;
      ko(f + ":" + (s.slice(0, m.index).split("\n").length) + " — ." + m[1] + "() sur un appel Supabase"); e++;
    }
  }
  if(!e) ok("aucun");
}

/* ---------- Verdict ---------- */
console.log("\n" + "═".repeat(60));
console.log(alertes === 0 ? "AUCUNE ALERTE — bon pour le déploiement."
                          : alertes + " ALERTE(S) — à regarder avant de pousser.");
console.log("═".repeat(60));
process.exit(alertes === 0 ? 0 : 1);
