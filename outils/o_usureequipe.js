// v1.93o — tout ce qui s'équipe s'use (30 j, date du lot) ; alerte la veille ; affichage rallumé.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, J = 86400000, now = Date.now(), msgs = [];
  journal = (m) => msgs.push(m); sauvegarder = () => {};
  const appels = [];
  sb.rpc = async (nom, a) => { appels.push(nom + ":" + JSON.stringify(a && a.p_lots && a.p_lots.map(l => l.item)));
    if(nom === "perimer"){
      const pris = new Set(a.p_lots.map(l => l.item + "@" + l.acquis));
      const lots = etat.lots.filter(l => !pris.has(l.item + "@" + l.acquis));
      return { data:{ ok:true, lots:a.p_lots.length, etat:{ sac:{}, lots, equipe:Object.fromEntries(lots.filter(l => l.lieu === "equipe").map(l => [l.item, l.qte])) } }, error:null };
    }
    return { data:null, error:null }; };
  etat._lotsSynchro = true; etat.enPause = false; etat.sac = {}; etat.coffre = {}; etat.soute = {};
  etat.equipement = { arme:"fab_pistolet_a_plasma", tete:"fab_casque_leger", torse:"fab_plastron_leger", jambes:"fab_jambieres_legeres",
                      implant:"fab_implant_de_force", drone:"fab_drone_de_combat" };
  const lot = (item, jours) => ({ item, lieu:"equipe", qte:1, acquis:now - jours*J });
  etat.lots = [ lot("fab_pistolet_a_plasma", 31), lot("fab_casque_leger", 29.5), lot("fab_plastron_leger", 31),
                lot("fab_jambieres_legeres", 5), lot("fab_implant_de_force", 30.2), lot("fab_drone_de_combat", 30.5) ];
  r.durees = Object.values(etat.equipement).map(id => `${id}:${dureeVie(id)}`).join(" ");
  r.texteAvant = { tete:texteUsureEquipe("tete"), jambes:texteUsureEquipe("jambes"), classeTete:_classeUsure("tete") };
  await majUsure();
  r.apres = Object.fromEntries(Object.entries(etat.equipement).map(([k, v]) => [k, v || "—"]));
  r.alerte = msgs.filter(m => /lâchera dans/.test(m));
  r.casse = msgs.filter(m => /a lâché/.test(m)).length;
  await majUsure(); r.alerteUneSeuleFois = msgs.filter(m => /lâchera dans/.test(m)).length === 1;
  r.appels = appels.filter(a => a.startsWith("perimer")).length;
  return r;
})();
