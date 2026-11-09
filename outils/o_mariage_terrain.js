// v2.60 — le terrain au mariage, client (K194 → K200, serveur v274)
// node o_banc.js .. mariage_terrain
// Le serveur est essayé à part (PostgreSQL 16) : voir le LISEZMOI de la v2.60.
(async function(){
  const r = {};
  const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const rpcOrig = sb.rpc.bind(sb);
  const appels = []; let rep = {};
  sb.rpc = (nom, args) => { appels.push({ nom, args: JSON.parse(JSON.stringify(args || {})) });
    if(rep[nom]) return Promise.resolve(rep[nom](args)); return rpcOrig(nom, args); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  const confirmations = [];
  confirmerJoli = async (titre, msg) => { confirmations.push(msg); return true; };
  _chargerRelations = async () => ({ amis:[{ id:"ami-1", nom:"Élane" }], envoyees:[], recues:[] });
  rep.unions_maries = () => ({ data:[], error:null });
  rep.union_derniers_textes = () => ({ data:{ ok:true, textes:[] }, error:null });
  const libre = { ok:true, union:null, envoyee:null, recues:[], delai:null, choix_faction:null, emmenagement:null,
                  moi:{ faction:etat.faction, x:etat.pos.x, y:etat.pos.y, secteur:"silene" } };
  const lire = (x) => { rep.union_lire = () => ({ data:Object.assign({}, libre, x), error:null }); };
  const el = document.querySelector("#centre-corps");
  const ouvrir = async () => { await chargerUnion(); changerCentre("unions"); await dort(100); };

  // 1. Célibataire : le texte sous la demande ne parle plus de veille.
  lire({}); await ouvrir();
  r.demande = { garde: el.textContent.includes("garde son terrain"), veille: /veille|terrain neuf/.test(el.textContent) };

  // 2. Celui qui déménage, parcelle libre : un bouton, aucune destruction annoncée.
  const attente = { id:7, avec:"x", nom:"Élane", hote:"x", je_demenage:true, depuis:"2026-11-08T10:00:00Z", occupee:null };
  lire({ emmenagement:attente }); await ouvrir();
  r.libre = { couple: document.querySelector('.onglet[data-onglet="couple"]').style.display,
              emmenager: !!el.querySelector('[data-u="emmenager"]'), annuler: !!el.querySelector('[data-u="annuler-emm"]'),
              alerte: el.textContent.includes("occupe la place") };

  // 3. Parcelle occupée par un bio-dôme (3 plantes) : prévenu, puis accord → p_detruire.
  lire({ emmenagement:Object.assign({}, attente, { occupee:{ type:"biodome", plot:5, contenu:3, drones:false } }) }); await ouvrir();
  r.biodome = { texte: (el.textContent.match(/Le bio-dôme occupe[^.]*\./) || [""])[0] };
  rep.union_emmenager = () => ({ data:{ ok:true, demenagement:null, detruit:"biodome", rembourse:150, solde:4471, terrain:null }, error:null });
  appels.length = 0; journ.length = 0; confirmations.length = 0;
  lire({ union:{ id:7, conjoint:"x", nom:"Élane", hote:"x", je_suis_hote:false, marie_le:"2026-11-08T11:00:00Z", complicite:50,
         en_pause:false, jour:{ mes_actions:[3,12,17,5], mon_choix:null, mon_detail:{}, son_choix:null, son_detail:{}, toujours:[21] },
         reserve:{ place:10, utilise:0, objets:[] }, ceremonie:{ texte:"", fige:false, fige_le:"2026-11-22T11:00:00Z" }, divorce:null } });
  el.querySelector('[data-u="emmenager"]').click(); await dort(200);
  r.biodome.confirmation = confirmations[0];
  r.biodome.appel = (appels.find(a => a.nom === "union_emmenager") || {}).args;
  r.biodome.journal = journ.slice(0, 3);
  r.biodome.credits = etat.credits;
  r.biodome.marie = el.textContent.includes("Tu vis avec");
  r.biodome.divorce = el.textContent.includes("une Cabane");

  // 4. Une Mousse-amie (féminin) ; une mine.
  lire({ emmenagement:Object.assign({}, attente, { occupee:{ type:"mousse", plot:5, contenu:0, drones:false } }) }); await ouvrir();
  confirmations.length = 0; rep.union_emmenager = () => ({ data:{ ok:false, err:"occupee" }, error:null });
  journ.length = 0;
  el.querySelector('[data-u="emmenager"]').click(); await dort(150);
  r.mousse = { confirmation: confirmations[0], refus: journ[0] };

  // 5. Un hangar avec des drones : bouton grisé, rien n'est envoyé.
  lire({ emmenagement:Object.assign({}, attente, { occupee:{ type:"hangar", plot:5, contenu:0, drones:true } }) }); await ouvrir();
  appels.length = 0;
  const bt = el.querySelector('[data-u="emmenager"]');
  r.hangar = { grise: bt.disabled, texte: el.textContent.includes("retire-les d'abord"), envoye: appels.some(a => a.nom === "union_emmenager") };

  // 6. L'hôte : il attend, il peut annuler.
  lire({ emmenagement:Object.assign({}, attente, { je_demenage:false, occupee:null }) }); await ouvrir();
  rep.union_annuler = () => ({ data:{ ok:true, emmenagement_annule:true }, error:null });
  r.hote = { texte: el.textContent.includes("doit maintenant emménager chez toi"), emmenager: !!el.querySelector('[data-u="emmenager"]') };
  appels.length = 0; journ.length = 0; lire({});
  el.querySelector('[data-u="annuler-emm"]').click(); await dort(150);
  r.hote.annule = appels.some(a => a.nom === "union_annuler"); r.hote.journal = journ[0];
  r.hote.retourFormulaire = !!el.querySelector("#u-cible");

  // 7. Le oui : il ne marie plus, rien ne déménage.
  lire({ recues:[{ id:9, de:"x", nom:"Élane", il_vient:false }] }); await ouvrir();
  rep.union_repondre = () => ({ data:{ ok:true, accepte:true, emmenagement:true, je_demenage:true }, error:null });
  const fac = etat.faction; appels.length = 0; journ.length = 0; confirmations.length = 0;
  lire({ emmenagement:attente });
  el.querySelector('[data-u="accepter"]').click(); await dort(150);
  r.oui = { confirmation: confirmations[0], journal: journ[0], faction: etat.faction === fac,
            terrainRelu: appels.some(a => a.nom === "terrain_lire"), bouton: !!el.querySelector('[data-u="emmenager"]') };

  // 8. Les refus du serveur ont leur phrase.
  r.refus = { union: ["emmenagement","pas_a_toi","occupee","drones"].every(k => !!UNION_REFUS[k]),
              terrain: TERRAIN_REFUS.emmenagement };

  journal = jOrig;
  return r;
})();
