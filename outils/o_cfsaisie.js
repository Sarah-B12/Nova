// v1.36z — Confidences : le texte en cours ne s'efface plus (relecture périodique, changement d'onglet)
(async function(){
  await new Promise(x=>setTimeout(x,1500));
  const marie = { id:1, conjoint:"x", nom:"Élane", hote:"x", je_suis_hote:false, marie_le:"2026-09-30T08:00:00Z", complicite:50, en_pause:false,
    jour:{ mes_actions:[3,12,17,5], mon_choix:null, mon_detail:{}, son_choix:null, son_detail:{}, toujours:[9,10,20,21] },
    reserve:{ place:10, utilise:0, objets:[] }, ceremonie:{ texte:"", fige:false, fige_le:"2026-10-14T08:00:00Z" }, divorce:null };
  const rpcOrig = sb.rpc.bind(sb); let lectures = 0;
  sb.rpc = (n, a) => n === "union_lire" ? (lectures++, Promise.resolve({ data:{ ok:true, union:marie, recues:[], moi:{ faction:etat.faction } }, error:null }))
                   : n === "union_chat_lire" ? Promise.resolve({ data:{ ok:true, liste:[] }, error:null }) : rpcOrig(n, a);
  await chargerUnion();
  document.querySelector('.onglet[data-onglet="couple"]').click(); await new Promise(x=>setTimeout(x,50));
  _coupleOnglet = "confidences"; await majCouple(); await new Promise(x=>setTimeout(x,50));
  const ta = document.querySelector("#cf-txt"); ta.value = "Je pense à"; ta.dispatchEvent(new Event("input"));
  // Ce que faisait la relecture périodique (45 s) : elle doit maintenant s'abstenir.
  const avant = lectures;
  const p = document.querySelector('.panneau[data-panneau="couple"]');
  const sauter = _coupleOnglet === "confidences";
  // Changer d'onglet et revenir : le brouillon revient.
  _coupleOnglet = "actions"; await majCouple(); _coupleOnglet = "confidences"; await majCouple(); await new Promise(x=>setTimeout(x,30));
  return { sautRelecture: sauter, texteApresAllerRetour: document.querySelector("#cf-txt").value, compte: document.querySelector("#cf-compte").textContent };
})();
