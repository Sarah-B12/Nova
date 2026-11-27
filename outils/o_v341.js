// v3.41 — se désinscrire d'une expédition ne rend plus l'énergie (node outils/o_banc.js . v341) : K338 (A), migration v331.
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  await dort(1500);
  const lignes = []; journal = (t, type) => lignes.push({ t:String(t), type });
  sauvegarder = () => {}; afficher = () => {}; majCentre = () => {};
  const MOI = "00000000-0000-0000-0000-0000000000a1";
  sessionActuelle = async () => ({ user:{ id:MOI } });
  let enrole = true;
  const table = t => t === "expeditions" ? [{ id:7, faction:etat.faction, cible:"rouage", objectif:"pillage", resolue:false, date_prevue:new Date(Date.now() + 86400000).toISOString() }]
                    : t === "expedition_enroles" ? (enrole ? [{ profil_id:MOI }] : [])
                    : t === "profils_publics" ? [{ id:MOI, nom:"Moi" }] : [];
  sb.from = t => { const q = { select(){ return q; }, eq(){ return q; }, in(){ return Promise.resolve({ data:table(t), error:null }); },
                               order(){ return q; }, limit(){ return Promise.resolve({ data:table(t), error:null }); },
                               then(ok, ko){ return Promise.resolve({ data:table(t), error:null }).then(ok, ko); } }; return q; };
  const appels = [];
  sb.rpc = async (n, a) => { appels.push(n + ":" + JSON.stringify(a)); if(n === "enroler") { enrole = !!a.p_enrole; return { data: a.p_enrole ? { ok:true, cout:15, energie:70 } : { ok:true, desinscrit:true, energie:70 }, error:null }; } return { data:null, error:null }; };
  const el = document.createElement("div"); document.body.appendChild(el);
  etat.energie = 70;
  await majExpeditions(el); await dort(30);
  const b = el.querySelector("#exp-enrole");
  r.boutonDesinscrire = !!b && b.textContent.trim() === "Me désinscrire";
  r.aucuneMentionRendu = !/rendu/i.test(el.textContent);
  r.aideSansRendu = /payés tout de suite\. Le jour venu/.test(el.textContent);
  b.click(); await dort(60);
  r.appel = appels.includes('enroler:{"p_enrole":false}');
  r.message = lignes.length && lignes[lignes.length - 1].t === "Tu t'es désinscrit.";
  r.energieInchangee = etat.energie === 70;
  // Et le bouton redevient « M'enrôler » une fois désinscrit
  await majExpeditions(el); await dort(30);
  const b2 = el.querySelector("#exp-enrole");
  r.boutonEnroler = !!b2 && /^M'enrôler \(−1[25] % d'énergie\)$/.test(b2.textContent.trim());
  el.remove();
  return r;
})()
