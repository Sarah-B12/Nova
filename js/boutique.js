/* ===========================================================
   BOUTIQUE — officielle, identique dans toutes les factions, stock ILLIMITÉ.
   Vend les graines (prérequis pour planter), les bébés animaux (prérequis pour
   élever), et des consommables Biotech (Recharge d'oxygène, Kit de soin,
   Biocarburant) à prix > max marché, pour pousser vers les Biotech / le marché.
   =========================================================== */
let boutiqueTab = "graines";

// Message visible DANS la boutique : le journal est hors champ quand la modale est ouverte.
let _boutiqueMsgTimer = null;
/* Style du sélecteur de quantité, injecté avec le reste de la boutique. */
(function(){
  if(typeof document==="undefined" || document.querySelector("#bq-style")) return;
  const st=document.createElement("style"); st.id="bq-style";
  st.textContent = `
    .bq-qte{ display:inline-flex; align-items:center; gap:4px; margin-right:8px; }
    .bq-champ{ width:52px; text-align:center; background:#0f1830; border:1px solid var(--line);
      border-radius:7px; color:var(--texte); padding:5px 4px; font-family:inherit; font-size:13px; }
    .bq-champ::-webkit-outer-spin-button,.bq-champ::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
    .bq-champ[type=number]{ -moz-appearance:textfield; appearance:textfield; }
    @media (max-width:560px){ .bq-qte{ margin-right:5px; } .bq-champ{ width:44px; } }
  `;
  document.head.appendChild(st);
})();

function _boutiqueMsg(txt){
  const z = document.querySelector("#boutique-msg"); if(!z) return;
  z.textContent = txt;
  z.style.display = "";
  z.style.color = "var(--orange, #ff8a3d)";
  clearTimeout(_boutiqueMsgTimer);
  _boutiqueMsgTimer = setTimeout(()=>{ if(z) z.style.display = "none"; }, 4000);
}
function renderBoutique(){
  const z = document.querySelector("#boutique-vue"); if(!z) return;
  let html = `<p class="vide" id="boutique-msg" style="margin:0 0 8px; display:none"></p>`;
  html += `<p class="vide" style="margin:0 0 10px">Boutique officielle — mêmes prix partout, stock illimité. Les <b>graines</b> et <b>bébés</b> sont indispensables pour cultiver et élever.</p>`;
  html += `<div class="marche-tabs">` + CAT_BOUTIQUE.map(c=>`<button class="marche-tab${c.id===boutiqueTab?" actif":""}" data-bcat="${c.id}">${c.nom}</button>`).join("") + `</div>`;
  html += `<div class="marche-liste">`;
  const arts = BOUTIQUE.filter(a=>a.cat===boutiqueTab);
  if(!arts.length) html += `<p class="vide">Rien ici.</p>`;
  for(const a of arts){
    let sous = "";
    if(a.cat==="graines"){ const g=GRAINES.find(x=>x.id===a.id); sous = g ? `donne de la ${plante(g.plante).nom}` : ""; }
    else if(a.cat==="bebes"){ const b=BEBES.find(x=>x.id===a.id); sous = b ? `produit du ${item(animal(b.animal).produit).nom}` : ""; }
    else {
      /* ⚠ effetConso() renvoie une carte jauge→valeur ({o2:25}, {sante:20,moral:20}),
         pas {soin, jauge} : l'ancienne forme à jauge unique. On lisait e.soin et
         e.jauge, d'où le « +undefined undefined » affiché en boutique. */
      const e=effetConso(a.id);
      const parts = e ? Object.entries(e).filter(([,v])=>v).map(([g,v])=>`+${v} ${labelJauge(g)}`) : [];
      sous = parts.length ? `${parts.join(", ")} à l'usage` : "carburant de vaisseau";
    }
    html += `<div class="marche-ligne" data-item="${a.id}"><span class="marche-ic">${iconeItem(a.id)}</span>`
      + `<span class="marche-nom">${a.nom}<span class="qte">${sous}</span></span>`
      + `<span class="marche-prix">${a.prix} ₡</span>`
      + `<span class="bq-qte"><button class="mini" data-bq="-1" data-id="${a.id}">−</button>`
      + `<input type="number" class="bq-champ" id="bq-${a.id}" min="1" value="1" inputmode="numeric">`
      + `<button class="mini" data-bq="1" data-id="${a.id}">+</button></span>`
      + `<button class="mini" data-boutique="${a.id}">Acheter</button></div>`;
  }
  html += `</div>`;
  z.innerHTML = html;
  z.querySelectorAll("[data-bcat]").forEach(b=>b.addEventListener("click",()=>{ boutiqueTab=b.dataset.bcat; renderBoutique(); }));
  z.querySelectorAll("[data-boutique]").forEach(b=>b.addEventListener("click",()=>acheterBoutique(b.dataset.boutique)));
  z.querySelectorAll("[data-bq]").forEach(b=>b.addEventListener("click",()=>{
    const c=z.querySelector(`#bq-${b.dataset.id}`); if(!c) return;
    c.value = Math.max(1, (parseInt(c.value,10)||1) + parseInt(b.dataset.bq,10));
  }));
  if(typeof brancherTips==="function") brancherTips(z);
}

/* Achat par lots. ⚠ La quantité est bornée par ce qu'on peut PAYER et par la
   place restante dans le sac : mieux vaut acheter moins que refuser tout, et
   le journal annonce ensuite ce qui est réellement entré. */
async function acheterBoutique(id){
  const a = BOUTIQUE.find(x=>x.id===id); if(!a) return;
  const champ = document.querySelector(`#bq-${id}`);
  let n = Math.max(1, parseInt(champ ? champ.value : 1, 10) || 1);

  const parCredits = Math.floor((etat.credits||0) / a.prix);
  if(parCredits < 1){ journal("Crédits insuffisants.","alerte"); _boutiqueMsg("Crédits insuffisants."); return; }
  const parPlace = placesLibres();
  if(parPlace < 1){ journal("Sac plein.","alerte"); _boutiqueMsg("Sac plein — fais de la place avant d'acheter."); return; }

  const nn = Math.min(n, parCredits, parPlace);
  if(nn < n) _boutiqueMsg(`Réduit à ${nn} : ${parCredits < n ? "crédits" : "place"} insuffisant${parCredits < n ? "s" : "e"}.`);

  // Les objets arrivent côté serveur AVANT le débit : pas de crédits perdus sans objet.
  const r = await agirServeur({ ajouter:{ [id]:nn }, motif:"boutique" });
  if(!r) return;
  const recu = (r.ajoutes||{})[id] || 0;
  if(!recu){ journal("Sac plein.","alerte"); _boutiqueMsg("Sac plein — fais de la place avant d'acheter."); return; }
  etat.credits -= a.prix * recu;
  journal(`Boutique : ${a.nom}${recu>1?` ×${recu}`:""} acheté — ${a.prix * recu} ₡.`,"gain");
  apresAction(); renderBoutique();
}
