// v3.22 (K293, K294) — au mariage, le sens du déménagement imposé vers la faction la moins peuplée.
//   node outils/o_banc.js . v322
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const rpcOrig = sb.rpc.bind(sb); const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args || {})) }); if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; journal = (t) => { journ.push(t); };
  const confirms = []; confirmerJoli = async (titre, texte, ok, danger, seul, rouge) => { confirms.push({ titre, rouge: rouge || "" }); return true; };
  _chargerRelations = async () => ({ amis:[{ id:"ami-1", nom:"Élane" }, { id:"ami-2", nom:"Brun" }], envoyees:[], recues:[] });
  rep.unions_maries = () => ({ data:[], error:null });
  rep.union_derniers_textes = () => ({ data:{ ok:true, textes:[] }, error:null });
  const SENS = { "ami-1": { ok:true, impose:true, je_demenage:true, meme_faction:false },     // Élane : faction moins peuplée → je déménage
                 "ami-2": { ok:true, impose:false, je_demenage:null, meme_faction:false },   // Brun : égalité → au choix
                 "dem-9": { ok:true, impose:true, je_demenage:false, meme_faction:false } };  // Kyraa : c'est elle qui viendra
  rep.union_sens = (a) => ({ data: SENS[a.p_cible], error:null });
  rep.union_lire = () => ({ data:{ ok:true, union:null, envoyee:null, recues:[], delai:null, choix_faction:null, moi:{ faction:etat.faction, x:0, y:0, secteur:"silene" } }, error:null });
  await chargerUnion();
  const el = document.createElement("div"); document.body.appendChild(el);
  await majUnions(el); await dort(80);
  const vu = s => { const e = el.querySelector(s); return !!e && !e.hidden; };
  // 1. Élane (imposé) : plus de choix, message rouge
  r.impose = { choixCache: !vu("#u-ou-choix"), rouge: vu("#u-sens"), texte: (el.querySelector("#u-sens") || {}).textContent, classe: (el.querySelector("#u-sens") || {}).className };
  // envoi : la valeur imposée part (je viens chez toi), même si « Viens chez moi » est coché
  rep.union_demander = (a) => ({ data:{ ok:true, id:1, impose:true, je_demenage:true }, error:null });
  el.querySelector("[data-u='demander']").click(); await dort(80);
  r.envoiImpose = (appels.filter(a => a.nom === "union_demander").pop() || {}).args;
  // 2. Brun (égalité) : le choix revient
  await majUnions(el); await dort(50);
  const sel = el.querySelector("#u-cible"); sel.value = "ami-2"; sel.dispatchEvent(new Event("change")); await dort(80);
  r.egalite = { choixVisible: vu("#u-ou-choix"), rouge: vu("#u-sens") };
  el.querySelector('input[name="u-ou"][value="je"]').checked = false; el.querySelector('input[name="u-ou"][value="viens"]').checked = true;
  el.querySelector("[data-u='demander']").click(); await dort(80);
  r.envoiLibre = (appels.filter(a => a.nom === "union_demander").pop() || {}).args;
  // 3. Une demande reçue : le oui prévient en rouge
  rep.union_lire = () => ({ data:{ ok:true, union:null, envoyee:null, delai:null, choix_faction:null, moi:{ faction:etat.faction, x:0, y:0, secteur:"silene" },
                                   recues:[{ id:9, de:"dem-9", nom:"Kyraa", il_vient:false, cree_le:"2026-11-20T10:00:00Z" }] }, error:null });
  rep.union_repondre = () => ({ data:{ ok:true, accepte:true, emmenagement:true, je_demenage:false, impose:true, sens_change:true }, error:null });
  await chargerUnion(); await majUnions(el); await dort(50);
  r.recue = (el.querySelector(".u-demande p") || {}).textContent;
  el.querySelector("[data-u='accepter']").click(); await dort(120);
  r.oui = { confirmRouge: (confirms.pop() || {}).rouge, journal: journ[journ.length - 1] };
  r.ilOuElle = /il ou elle/i.test(el.textContent + journ.join(" "));
  return r;
})()
