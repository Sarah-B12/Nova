// v3.00 (v302, K272) — la coque des vaisseaux au serveur. Relève les chiffres du jeu recopiés dans v302
// (barèmes dupliqués, BACKEND_PLAN §6) : coque de chaque modèle (VAISSEAUX → _fleau_vaisseau), module d'AREPO
// (MODULE_COQUE), kits (KITS_PV), réparateur (REPARATEUR_PRIX_PV), remorquage (PV_REMORQUAGE, SECOURS_FRAIS), Gravier
// (GRAVIER_PV) et les plafonds de coque_abimer (SONDE_PV_DEFAITE, SONDE_PV_RIPOSTE, TIR_ASTEROIDES_PV, choc de Q6 8 %).
// Le banc SQL de v302 vérifie les mêmes valeurs côté serveur. Changer l'une d'elles, c'est changer v302.
//   node outils/o_banc.js . coquesrv
(async function(){
  await new Promise(x => setTimeout(x, 300));
  const pv = {}; for(const [id, v] of Object.entries(VAISSEAUX)) pv[id] = v.pv;
  return { pv, module: MODULE_COQUE, kits: KITS_PV, reparateur: REPARATEUR_PRIX_PV, remorquage: PV_REMORQUAGE,
           secours: SECOURS_FRAIS, gravier: GRAVIER_PV, sondeDefaite: SONDE_PV_DEFAITE, sondeRiposte: SONDE_PV_RIPOSTE,
           asteroides: TIR_ASTEROIDES_PV, seuilAvarie: PV_SEUIL_AVARIE };
})()
