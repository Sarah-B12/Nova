// v2.05 — SOURCE de la table serveur `duree_vie` (v228, BACKEND_PLAN §125). Le serveur ne savait
// pas quand un objet est périmé : c'est le client du PROPRIÉTAIRE qui le fait disparaître, à sa
// connexion. Un absent garde donc au serveur des lots morts, et un voleur pouvait les prendre
// (retour de Vortex, 29/10). Sortie : [item_id, jours, equipable] pour chaque objet connu, et le
// bloc SQL. ⚠ Changer une durée dans js/usure.js, c'est changer la table : recoller le bloc.
//   node outils/o_banc.js . dureevie
(function(){
  const lignes = TOUS_ITEMS.map(it => {
    const id = it.id;
    const equip = (typeof slotEquip === "function" && !!slotEquip(id)) || (typeof estVaisseau === "function" && estVaisseau(id));
    return [id, dureeVie(id), equip && id !== "navette_reserve"];
  });
  const q = s => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = lignes.map(([id, j, e]) => `  (${q(id)}, ${j}, ${e})`).join(",\n");
  return { nb: lignes.length, equipables: lignes.filter(l => l[2]).length, sql };
})();
