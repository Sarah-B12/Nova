// v2.65 — retours des testeuses sur les missions (K219 → K225)
// node o_banc.js .. missions265
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1500));
  // 1. Le rangement : pose centrée, aperçu, deux touchers au doigt.
  const R = { w:6, h:5, pieces:[ [[0,0],[1,0],[2,0],[1,1]], [[0,0]] ] };   // un T (centre : la case du haut au milieu) et un carré
  const m = { id:42, vue:{ rangement:R } };
  _missions = { missions:[m] };
  const zone = document.createElement("div"); zone.innerHTML = `<div id="mi-rangement" data-mi-mission="42">${_mRangementHtml(m)}</div>`;
  document.body.appendChild(zone); _mRangementBrancher(zone);
  const pe = (type, pt) => { const e = new Event(type, { bubbles:true }); Object.defineProperty(e, "pointerType", { value:pt }); return e; };   // jsdom n'a pas PointerEvent
  const c = i => zone.querySelector(`[data-rg-case="${i}"]`);
  const doigt = i => { c(i).dispatchEvent(pe("pointerdown", "touch")); c(i).click(); };
  doigt(8);                                            // case (2,1) : 1er toucher
  r.premierToucher = { pose: _rang.pose.length, apercu: [...zone.querySelectorAll(".mi-rg-ap")].map(e => +e.dataset.rgCase).sort((a,b)=>a-b) };
  doigt(8);                                            // 2e toucher : posé
  r.secondToucher = { pose: _rang.pose.length, ou: _rang.pose[0] };
  // Un T touché au bord gauche (case 6 = (0,1)) : ne tient pas → aperçu rouge, rien posé.
  _rang.sel = 0; _rang.pose = []; _mRangementMaj(zone);
  const d2 = i => { const e = zone.querySelector(`[data-rg-case="${i}"]`); e.dispatchEvent(pe("pointerdown", "touch")); e.click(); };
  d2(6); d2(6);
  r.bordGauche = { pose: _rang.pose.length, rouge: zone.querySelectorAll(".mi-rg-ko").length };
  // À la souris : un clic pose directement (centré).
  _rang.pose = []; _rang.sel = 0; _rang.doigt = false; _rang.ap = null; _mRangementMaj(zone);
  zone.querySelector('[data-rg-case="14"]').dispatchEvent(pe("pointerdown", "mouse"));
  zone.querySelector('[data-rg-case="14"]').click();
  r.souris = _rang.pose[0];
  r.consigne = /se pose centrée dessus/.test(zone.textContent) && /un second la pose/.test(zone.textContent);
  zone.remove();
  // 2. Le coffre : qui a déposé quoi.
  const mc = { id:7, coffre:{ vide:false, minimum:false, scelle:false, mes_depots:{ fab_fil:3 }, sortes:[] },
               coffre_qui:[{ nom:"Lunariss", objets:{ fab_biogel:4 } }, { nom:"Nanamy", objets:{ fab_cablage:3, fab_fil:3 } }] };
  const dc = document.createElement("div"); dc.innerHTML = _mCoffre(mc);
  r.coffreQui = [...dc.querySelectorAll(".mi-qui tr")].map(tr => tr.textContent.replace(/\s+/g, " ").trim());
  // 3. Les textes.
  const src = _mBalise.toString() + _mCrevasseHtml.toString();
  r.tempeteExpliquee = /plus la tempête tardera/.test(src);
  r.pasPasSecondes = /des pas, pas des secondes/.test(src);
  // 4. v2.66 — le refus « postes » dit les postes manquants de CETTE mission.
  const journ = []; const jOrig = journal; journal = (t) => journ.push(t);
  const rpcOrig = sb.rpc.bind(sb);
  sb.rpc = (nom, a) => nom === "satellite_signaler" ? Promise.resolve({ data:{ ok:false, err:"postes" }, error:null })
                     : nom === "missions_lire" ? Promise.resolve({ data:_missions, error:null }) : rpcOrig(nom, a);
  const sat = { id:31, type:"satellite", postes:{ artilleur:2, ingenieur:1, hacker:1 }, mon_groupe:9,
                groupes:[{ id:9, membres:[{ nom:"Nanamy", statut:"actif", poste:"artilleur" }, { nom:"Lunariss", statut:"actif", poste:"ingenieur" }] }] };
  _missions = { ok:true, missions:[sat] };
  await _missionAppel("satellite_signaler", { p_mission:31 });
  r.postesSatellite = journ.find(t => /poste/.test(t));
  sat.groupes[0].membres = [{ nom:"Nanamy", statut:"actif", poste:"artilleur" }];
  journ.length = 0; await _missionAppel("satellite_signaler", { p_mission:31 });
  r.deuxManquants = journ.find(t => /poste/.test(t));
  journ.length = 0; await _missionAppel("satellite_signaler", { p_mission:999 });
  r.missionInconnue = journ.find(t => /poste/.test(t));
  // 5. v2.67 (K226 → K228) — minimum et maximum des postes.
  const satF = { id:32, type:"satellite", difficulte:"rude", niveau_min:20, taille_min:4, taille_max:4, statut:"recrutement",
    postes:{ hacker:1, artilleur:2, ingenieur:1 }, postes_min:{ hacker:1, artilleur:2, ingenieur:1 }, mon_groupe:10, mon_statut:"actif", mon_poste:null,
    groupes:[{ id:10, statut:"lance", moi_fondateur:false, membres:[{ nom:"Kyraa", statut:"actif", poste:"ingenieur" }, { nom:"Lunariss", statut:"actif", poste:"hacker" },
      { nom:"Nanamy", statut:"actif", poste:"artilleur" }, { nom:"Test1", statut:"actif", poste:null, moi:true }] }] };
  r.fiche = _mPostesFiche(satF) + " | " + _mPostesFiche({ postes:{ porteur:4, artificier:1 }, postes_min:{ porteur:2, artificier:1 } });
  const dg = document.createElement("div"); dg.innerHTML = _mMonGroupe(satF, satF.groupes[0]);
  r.test1PeutPrendre = [...dg.querySelectorAll("#mi-poste option")].map(o => o.textContent);
  satF.groupes[0].statut = "formation"; satF.groupes[0].moi_fondateur = true;
  const df = document.createElement("div"); df.innerHTML = _mMonGroupe(satF, satF.groupes[0]);
  r.boutonPartir = { grise: df.querySelector("[data-mi-lancer]").disabled, pourquoi: (df.querySelector(".mi-btns .vide") || {}).textContent };
  _missions = { ok:true, missions:[satF] };
  sb.rpc = (nom, a) => nom === "mission_lancer" ? Promise.resolve({ data:{ ok:false, err:"postes_vides", postes:"artilleur", manques:{ artilleur:1 } }, error:null })
                     : nom === "missions_lire" ? Promise.resolve({ data:_missions, error:null }) : rpcOrig(nom, a);
  journal = (t) => journ.push(t); journ.length = 0;
  await _missionAppel("mission_lancer", { p_groupe:10 });
  r.refusDepart = journ[0];
  // 6. v2.68 — journal des missions, couleurs du sas, mention retirée.
  const jl = []; journal = (t, ton, cat) => jl.push([t, cat]);
  await _evenementsAppliquerFond([{ texte:"L'escorte est repoussée. Le sas de Bardane est devant vous : à l'ingénieur, puis au hacker.", cat:"quete" },
                                  { texte:"Les quatre vaisseaux sont là. Les sondes gardiennes d'AREPO se réveillent : artilleurs, à vos canons !", cat:"quete" },
                                  { texte:"Ton Ordinateur de hacking a été volé.", cat:"alerte" }]);
  r.categories = jl.map(x => x[1]);
  sb.rpc = (nom) => nom === "satellite_sas" ? Promise.resolve({ data:{ ok:true, ouvert:false, bien:1, mal:0 }, error:null })
                  : nom === "missions_lire" ? Promise.resolve({ data:_missions, error:null }) : rpcOrig(nom);
  jl.length = 0; await _missionAppel("satellite_sas", { p_mission:1 }, x => x.ouvert ? "Le sas s'ouvre." : null);
  r.sasJournal = jl.length;
  r.couleurs = SAS_COUL.join(" ");
  satF.groupes[0].statut = "lance"; satF.mon_poste = "ingenieur";
  const dp = document.createElement("div"); dp.innerHTML = _mMonGroupe(satF, satF.groupes[0]);
  r.fixeDepuisDepart = /fixé depuis le départ/.test(dp.textContent);
  sb.rpc = rpcOrig; journal = jOrig;
  return r;
})();
