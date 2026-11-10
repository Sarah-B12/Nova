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
  sb.rpc = rpcOrig; journal = jOrig;
  return r;
})();
