// v1.50 — transmissions épinglées (node o_banc.js .. v150)
(async function(){
  const r = {}; await new Promise(x => setTimeout(x, 1200));
  let liste = [{ id:1, texte:"Bienvenue ! Passez au Centre.", cree_le:"2026-10-06T10:00:00Z" }];
  const appels = []; const rpcOrig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a });
    if(n === "annonces_epinglees") return Promise.resolve({ data:{ ok:true, regent:true, liste }, error:null });
    if(n === "annonce_epingler"){ liste = liste.concat([{ id:2, texte:a.p_texte, cree_le:"2026-10-06T11:00:00Z" }]); return Promise.resolve({ data:{ ok:true }, error:null }); }
    if(n === "annonce_desepingler"){ liste = liste.filter(x => x.id !== a.p_id); return Promise.resolve({ data:{ ok:true }, error:null }); }
    return rpcOrig(n, a); };
  confirmerJoli = async () => true;
  const z = document.createElement("div"); document.body.appendChild(z);
  await _rendreEpingles(z);
  r.avant = { titre: z.querySelector(".gsec").textContent, champ: !!z.querySelector("#reg-epingle-txt") };
  z.querySelector("#reg-epingle-txt").value = "Deuxième conseil"; z.querySelector("#reg-epingle-btn").click();
  await new Promise(x => setTimeout(x, 80));
  r.apres = { titre: z.querySelector(".gsec").textContent, champ: !!z.querySelector("#reg-epingle-txt"), cartes: z.querySelectorAll(".ann-epinglee").length };
  z.querySelector("[data-desepingler]").click(); await new Promise(x => setTimeout(x, 80));
  r.retrait = z.querySelector(".gsec").textContent;
  // la vue Transmission des membres
  const el = document.createElement("div"); document.body.appendChild(el);
  etat.faction = etat.faction || "ignis";
  await majAnnonceFaction(el);
  r.transmission = [...el.querySelectorAll(".gsec")].map(x => x.textContent).concat([...el.querySelectorAll(".ann-epinglee")].map(x => x.textContent.trim()));
  return r;
})();
