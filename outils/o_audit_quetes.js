// v2.46 — Audit de toutes les quêtes (types, répétitions, écriture, glyphes, drapeaux, réglages). Usage : node outils/o_audit_quetes.js (depuis la racine du jeu).
const fs=require("fs");
eval(fs.readFileSync("js/quetes-data.js","utf8").replace(/^const QUETES/m,"global.QUETES"));
const g=fs.readFileSync("js/glyphes.js","utf8").split("(function(){")[0];eval(g.replace(/^const /gm,"var "));
const R={};
// 1. types par quête, répétitions consécutives, ratables
const UNTRY=new Set(["piratage","glyphes","ordre","cadenas","sequence","memoire","combat","triangulation",   /* v2.76 : traversee rejouable */"calques","loup","ronde","crevasse","tir","goupilles","reaction","brouillage","message"]);
const typ=q=>q.etapes.map(e=>e.defi&&e.defi.type);
R.consecutifs=[];R.sansRatable=[];
QUETES.forEach((q,i)=>{const T=new Set(typ(q).filter(t=>!["choix","attente","scene","combat"].includes(t)));
 if(i>0){const P=new Set(typ(QUETES[i-1]).filter(t=>!["choix","attente","scene","combat"].includes(t)));const c=[...T].filter(t=>P.has(t));if(c.length)R.consecutifs.push(q.id+":"+c.join(","));}
 if(!typ(q).some(t=>UNTRY.has(t)))R.sansRatable.push(q.id);});
// fréquence des types dans l'arc de Cérès et dans tout le jeu
const freq=(qs)=>{const f={};qs.forEach(q=>typ(q).forEach(t=>f[t]=(f[t]||0)+1));return Object.entries(f).sort((a,b)=>b[1]-a[1]).map(x=>x.join(":")).join(" ")};
R.typesCeres=freq(QUETES.filter(q=>+q.id.slice(1)>=31));
R.typesTout=freq(QUETES);
// 2. titres, images, récompenses
const noms=QUETES.map(q=>q.nom);R.titresDouble=noms.filter((n,i)=>noms.indexOf(n)!==i);
R.recompenses=QUETES.filter(q=>+q.id.slice(1)>=28).map(q=>`${q.id}:${q.recompense.credits}/${q.recompense.xp}${q.recompense.pa?"+"+q.recompense.pa+"PA":""}`).join(" ");
R.paTotal=QUETES.reduce((s,q)=>s+(q.recompense.pa||0),0);
// 3. écriture : Un temps, joueur cité, quarantaine/levée trop tôt
const txt=q=>{const t=[];const tr=o=>{if(typeof o==="string")t.push(o);else if(Array.isArray(o))o.forEach(tr);else if(o&&typeof o==="object")Object.entries(o).forEach(([k,v])=>{if(!["image","donneurImg","donneurRepli","id","type","cible","sons","mots","glyphes","picto","motsCles","reponses","propositions","noms","paires"].includes(k))tr(v)})};tr(q);return t.join(" \n ")};
R.unTemps=QUETES.filter(q=>/Un temps/.test(txt(q))).map(q=>q.id);
R.joueurCite=QUETES.filter(q=>/(\btu (lui |leur )?(dis|réponds|demandes|expliques|répètes|cries|murmures)\b[^.«]*«)/i.test(txt(q))).map(q=>q.id);
R.motTot=QUETES.filter(q=>+q.id.slice(1)>=31&&+q.id.slice(1)<45&&/quarantaine|\blevée\b/i.test(txt(q))).map(q=>q.id);
R.bestioleOeil=QUETES.filter(q=>+q.id.slice(1)>=31&&/bestiole|\bœil\b|paupière/i.test(txt(q))).map(q=>q.id);
// 4. glyphes : chaque mot, dans l'ordre du jeu, au plus un son inconnu ; sons existants
const connus=new Set();R.glyphes=[];
QUETES.forEach(q=>q.etapes.forEach(e=>{const d=e.defi||{};const mots=[];
 (d.paires||[]).forEach(p=>p.sons&&mots.push(p.sons));(d.mots||[]).forEach(m=>mots.push(m.map(s=>s&&s.inconnu?s.inconnu:s)));
 (d.elements||[]).forEach(el=>el&&el.sons&&mots.push(el.sons));(d.glyphes||[]).forEach(m=>mots.push(m));
 const nouv=new Set();mots.forEach(m=>{m.forEach(s=>{if(!GLYPHES_ANCIEN[s])R.glyphes.push(q.id+": son inexistant "+s)});const inc=m.filter(s=>!connus.has(s));if(inc.length>1&&+q.id.slice(1)>4)R.glyphes.push(q.id+": "+m.join("·")+" a "+inc.length+" sons inconnus ("+inc.join(",")+")");inc.forEach(s=>nouv.add(s));});
 nouv.forEach(s=>connus.add(s));}));
R.sonsJamaisVus=Object.keys(GLYPHES_ANCIEN).filter(s=>!connus.has(s));
// 5. drapeaux posés / lus
const src=fs.readdirSync("js").filter(f=>f.endsWith(".js")&&f!=="quetes-data.js").map(f=>fs.readFileSync("js/"+f,"utf8")).join("\n")+fs.readFileSync("js/quetes-data.js","utf8").replace(/flags:\{[^}]*\}/g,"");
const poses=[];QUETES.forEach(q=>Object.keys(q.recompense.flags||{}).forEach(f=>poses.push([q.id,f])));
R.drapeauxJamaisLus=poses.filter(([q,f])=>!new RegExp("\\b"+f+"\\b").test(src)).map(x=>x.join(":"));
// 6. paramètres de difficulté des épreuves de timing / grille dans l'arc
R.reglages=QUETES.filter(q=>+q.id.slice(1)>=29).flatMap(q=>q.etapes.map(e=>e.defi).filter(d=>["piratage","sequence","ronde","brouillage","goupilles","reaction","traversee","crevasse","labyrinthe","tuyauterie","calques","cadenas","attente","noeud"].includes(d.type)).map(d=>q.id+" "+d.type+" "+JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k])=>["manches","vitesse","longueur","nb","observe","avance","tenir","duree","colonnes","lignes","n","rayon","marge","impulsions","bornes","essais","felures","plaques","lave","symboles"].includes(k))))));
console.log(JSON.stringify(R,null,1));
