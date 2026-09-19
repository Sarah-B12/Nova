// Balayage AST des familles de pièges (a) duplication, (b) reconstruction champ par champ, (c) état contextuel.
// Usage : cd outils && npm i acorn acorn-walk && node pieges.js .. [section...]
const fs = require("fs"), path = require("path");
const acorn = require("acorn"), walk = require("acorn-walk");
const RAC = process.argv[2];
const SECTIONS = new Set(process.argv.slice(3));
const on = s => !SECTIONS.size || SECTIONS.has(s);
const DJ = path.join(RAC, "js");
const fichiers = fs.readdirSync(DJ).filter(f => f.endsWith(".js") && f !== "controle.js").sort();
const src = {}, ast = {};
for (const f of fichiers) {
  src[f] = fs.readFileSync(path.join(DJ, f), "utf8");
  ast[f] = acorn.parse(src[f], { ecmaVersion: "latest", sourceType: "script", locations: true, allowHashBang: true });
}
const html = fs.readFileSync(path.join(RAC, "index.html"), "utf8");
const txt = (f, n) => src[f].slice(n.start, n.end);
const L = (f, n) => f + ":" + n.loc.start.line;
const titre = t => console.log("\n=== " + t + " ===");

// ---------- globals ----------
const glob = {}; // nom -> [{f,line,kind}]
for (const f of fichiers) for (const st of ast[f].body) {
  const add = (n, k, node) => (glob[n] ||= []).push({ f, line: node.loc.start.line, kind: k, node });
  if (st.type === "FunctionDeclaration") add(st.id.name, "function", st);
  else if (st.type === "ClassDeclaration") add(st.id.name, "class", st);
  else if (st.type === "VariableDeclaration") for (const d of st.declarations) if (d.id.type === "Identifier") add(d.id.name, st.kind, d);
}
// références (Identifier hors clé de propriété / membre non calculé)
const refs = {};
for (const f of fichiers) walk.fullAncestor(ast[f], (n, st, anc) => {
  if (n.type !== "Identifier") return;
  const p = anc[anc.length - 2];
  if (p && p.type === "MemberExpression" && p.property === n && !p.computed) return;
  if (p && p.type === "Property" && p.key === n && !p.computed && !p.shorthand) return;
  (refs[n.name] ||= []).push({ f, line: n.loc.start.line });
});
if (on("orphelins")) {
  titre("GLOBALES DÉCLARÉES ET JAMAIS LUES (hors déclaration, hors index.html)");
  for (const [n, ds] of Object.entries(glob)) {
    const r = (refs[n] || []).filter(x => !ds.some(d => d.f === x.f && d.line === x.line));
    const dansHtml = new RegExp("\\b" + n + "\\b").test(html);
    // référence via chaîne (typeof x === "function" ne compte pas ; window[..] rare)
    const parChaine = fichiers.some(f => src[f].includes('"' + n + '"') || src[f].includes("'" + n + "'"));
    if (r.length === 0 && !dansHtml) console.log(`  ${n.padEnd(28)} ${ds[0].kind.padEnd(8)} ${ds[0].f}:${ds[0].line}${parChaine ? "  (cité en chaîne)" : ""}`);
  }
  titre("GLOBALES LUES SEULEMENT VIA typeof (garde sans usage réel ?)");
}

// ---------- (b) reconstruction champ par champ ----------
function baseDe(v) {
  // renvoie [texteBase, cle] si v est X.cle (éventuellement enveloppé par ||, ??, ?:, (..), Array.isArray etc.)
  let found = null;
  walk.simple(v, { MemberExpression(m) { if (!m.computed && m.property.type === "Identifier" && !found) found = m; } });
  return found;
}
if (on("reconstruction")) {
  titre("(b) OBJETS RECONSTRUITS CHAMP PAR CHAMP (≥3 clés k: X.k, sans ...X)");
  for (const f of fichiers) walk.simple(ast[f], {
    ObjectExpression(o) {
      const groupes = {};
      const spreads = o.properties.filter(p => p.type === "SpreadElement").map(p => txt(f, p.argument));
      for (const p of o.properties) {
        if (p.type !== "Property" || p.computed) continue;
        const k = p.key.name || p.key.value;
        let m = null;
        walk.simple(p.value, { MemberExpression(x) { if (!x.computed && x.property.name === k && !m) m = x; } });
        if (m) (groupes[txt(f, m.object)] ||= []).push(k);
      }
      for (const [b, ks] of Object.entries(groupes)) if (ks.length >= 3) {
        const couvert = spreads.some(s => s === b || s.startsWith(b + " ") || s.includes(b));
        console.log(`  ${L(f, o).padEnd(26)} base=${b.slice(0, 40).padEnd(40)} ${couvert ? "SPREAD ok " : "⚠ SANS spread"} [${ks.join(",")}]`);
      }
    }
  });
}

// ---------- barèmes ----------
if (on("baremes")) {
  titre("CONSTANTES QUI RESSEMBLENT À UN BARÈME (globales MAJUSCULES à littéral)");
  for (const [n, ds] of Object.entries(glob)) {
    if (!/^[A-Z][A-Z0-9_]+$/.test(n)) continue;
    const d = ds[0].node; if (!d.init) continue;
    const t = d.init.type;
    if (!["Literal", "ObjectExpression", "ArrayExpression", "BinaryExpression", "UnaryExpression"].includes(t)) continue;
    let nums = 0; walk.simple(d.init, { Literal(l) { if (typeof l.value === "number") nums++; } });
    if (t === "Literal" && typeof d.init.value !== "number") continue;
    const s = txt(ds[0].f, d.init).replace(/\s+/g, " ");
    console.log(`  ${n.padEnd(26)} ${ds[0].f}:${ds[0].line}  nums=${nums}  ${s.slice(0, 90)}`);
  }
}

// ---------- RPC : arguments porteurs de montants (confiance) ----------
if (on("rpc")) {
  titre("APPELS RPC : paramètres envoyés par le client");
  const par = {};
  for (const f of fichiers) walk.simple(ast[f], {
    CallExpression(c) {
      if (c.callee.type === "MemberExpression" && c.callee.property.name === "rpc" && c.arguments[0] && c.arguments[0].type === "Literal") {
        const nom = c.arguments[0].value, a = c.arguments[1];
        const ks = a && a.type === "ObjectExpression" ? a.properties.map(p => p.key ? (p.key.name || p.key.value) : "...") : a ? ["<" + a.type + ">"] : [];
        (par[nom] ||= new Set()).add(ks.join(",") + "  @" + L(f, c));
      }
    }
  });
  for (const [n, s] of Object.entries(par).sort()) for (const v of s) console.log(`  ${n.padEnd(26)} ${v}`);
}

// ---------- thenables : .catch / .finally sur sb ----------
if (on("thenable")) {
  titre("PIÈGE 26 : .catch/.finally sur une chaîne Supabase (ou fonction qui la renvoie)");
  for (const f of fichiers) walk.simple(ast[f], {
    CallExpression(c) {
      if (c.callee.type === "MemberExpression" && ["catch", "finally"].includes(c.callee.property.name)) {
        const t = txt(f, c.callee.object);
        if (/\bsb\b|\.rpc\(|\.from\(|supabase|auth\./.test(t) && !/Promise\.resolve\(/.test(t)) console.log("  " + L(f, c) + "  " + t.replace(/\s+/g, " ").slice(0, 110));
        else if (/^\w+\(/.test(t)) console.log("  ? " + L(f, c) + "  " + t.replace(/\s+/g, " ").slice(0, 110));
      }
    }
  });
}

// ---------- tables accédées en direct ----------
if (on("tables")) {
  titre("ACCÈS DIRECTS AUX TABLES (sb.from)");
  for (const f of fichiers) walk.simple(ast[f], {
    CallExpression(c) {
      if (c.callee.type === "MemberExpression" && c.callee.property.name === "from" && c.arguments[0] && c.arguments[0].type === "Literal" && typeof c.arguments[0].value === "string") {
        const ctx = src[f].slice(c.end, c.end + 140).replace(/\s+/g, " ");
        const op = (ctx.match(/\.(select|insert|update|upsert|delete)\(/) || [])[1] || "?";
        console.log(`  ${c.arguments[0].value.padEnd(22)} ${op.padEnd(7)} ${L(f, c)}`);
      }
    }
  });
}

// ---------- stockage navigateur ----------
if (on("stockage")) {
  titre("CLÉS localStorage / sessionStorage");
  for (const f of fichiers) {
    const re = /(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*([^,)]+)/g; let m;
    while ((m = re.exec(src[f]))) console.log(`  ${m[1].padEnd(14)} ${m[2].padEnd(10)} ${m[3].trim().slice(0, 50).padEnd(50)} ${f}:${src[f].slice(0, m.index).split("\n").length}`);
  }
}

// ---------- clés etat ----------
if (on("etat")) {
  titre("CLÉS DE etat.* : écrites mais absentes de nouvelEtat()");
  const defs = new Set();
  walk.simple(ast["etat.js"], { FunctionDeclaration(fn) { if (fn.id.name === "nouvelEtat") walk.simple(fn, { ReturnStatement(r) { for (const p of r.argument.properties) defs.add(p.key.name); } }); } });
  const ecr = {}, lec = {};
  const sous = {}; // etat.X.Y écrits
  for (const f of fichiers) walk.fullAncestor(ast[f], (n, st, anc) => {
    if (n.type !== "MemberExpression" || n.computed || n.object.type !== "Identifier" || n.object.name !== "etat") return;
    const k = n.property.name, p = anc[anc.length - 2];
    const ecrit = p && ((p.type === "AssignmentExpression" && p.left === n) || (p.type === "UpdateExpression"));
    (ecrit ? ecr : lec)[k] ||= []; (ecrit ? ecr : lec)[k].push(L(f, n));
    // sous-champ
    if (p && p.type === "MemberExpression" && p.object === n && !p.computed) {
      const g = anc[anc.length - 3];
      const e2 = g && ((g.type === "AssignmentExpression" && g.left === p) || g.type === "UpdateExpression");
      if (e2) ((sous[k] ||= {})[p.property.name] ||= []).push(L(f, p));
    }
  });
  for (const k of Object.keys(ecr).sort()) if (!defs.has(k)) console.log(`  etat.${k.padEnd(22)} écrit ${ecr[k].length}× ex. ${ecr[k].slice(0, 3).join(" ")}`);
  titre("SOUS-CHAMPS ÉCRITS de quetes / terrain / maison / aptitudes / competences / jauges");
  for (const k of ["quetes", "terrain", "maison", "aptitudes", "competences", "jauges", "equipement", "formation", "gravier", "pas"]) if (sous[k])
    for (const [s, l] of Object.entries(sous[k])) console.log(`  etat.${k}.${s.padEnd(18)} ${l.length}×  ${l.slice(0, 3).join(" ")}`);
  fs.writeFileSync("/tmp/etat_cles.json", JSON.stringify({ defs: [...defs], ecr: Object.keys(ecr), lec: Object.keys(lec) }));
}

// ---------- (c) mémoïsation ----------
if (on("memo")) {
  titre("(c) GLOBALES MUTABLES MÉMOÏSÉES / CACHES (let/var de module réassignées dans des fonctions)");
  for (const [n, ds] of Object.entries(glob)) {
    if (!["let", "var"].includes(ds[0].kind)) continue;
    let aff = [];
    for (const f of fichiers) walk.simple(ast[f], { AssignmentExpression(a) { if (a.left.type === "Identifier" && a.left.name === n) aff.push(L(f, a)); } });
    if (/cache|_memo|dernier|courant|actuel|^_[a-z]/i.test(n) && aff.length) console.log(`  ${n.padEnd(26)} ${ds[0].f}:${ds[0].line}  affectée ${aff.length}×  ${aff.slice(0, 4).join(" ")}`);
  }
}

// ---------- nombres magiques répétés entre fichiers ----------
if (on("nombres")) {
  titre("LITTÉRAUX NUMÉRIQUES NON TRIVIAUX présents dans ≥2 fichiers (hors déclarations de constantes)");
  const triv = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20, 24, 25, 30, 40, 50, 60, 100, 1000, 0.5, 0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 255, 360, 180, 1e3, 3600, 36e5, 864e5, 60000, 200, 300, 500, -1]);
  const occ = {};
  for (const f of fichiers) walk.fullAncestor(ast[f], (n, st, anc) => {
    if (n.type !== "Literal" || typeof n.value !== "number" || triv.has(n.value)) return;
    if (anc.some(a => a.type === "VariableDeclarator" && a.id.name && /^[A-Z][A-Z0-9_]+$/.test(a.id.name))) return;
    (occ[n.value] ||= {})[f] ||= []; occ[n.value][f].push(n.loc.start.line);
  });
  for (const [v, pf] of Object.entries(occ).sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)) {
    const nf = Object.keys(pf).length; if (nf < 2) continue;
    console.log(`  ${String(v).padEnd(10)} ${nf} fichiers : ${Object.entries(pf).map(([f, l]) => f + ":" + l.slice(0, 3).join("/")).join("  ")}`);
  }
}
