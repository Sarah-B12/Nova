/* ===========================================================
   COULOIR DE LA MORT — écran plein écran bloquant.

   À 0 de santé ou d'O₂, le serveur pose profils.mort_le et refuse toute
   action (agir() renvoie err "mort"). Le joueur ne peut que ressusciter.
   Passé le délai (config.couloir_j, 30 j), le personnage est DÉTRUIT.

   Bannière : images/mort.png — emplacement réservé, l'image peut venir plus
   tard (onerror la retire).
   =========================================================== */

const MORT_BANNIERE = "images/mort.png";

function _mortStyle(){
  if(document.querySelector("#mort-style")) return;
  const st = document.createElement("style"); st.id = "mort-style";
  st.textContent = `
    #ecran-mort{ position:fixed; inset:0; z-index:940; display:grid; place-items:center;
      background:radial-gradient(circle at 50% 30%, #2a0e12, #0a0507 70%); padding:20px; }
    #ecran-mort[hidden]{ display:none !important; }
    #ecran-mort .mort-carte{ width:min(560px,94vw); background:#150c11;
      border:1px solid #4a2028; border-radius:16px; overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,.7); }
    #ecran-mort .mort-banniere{ width:100%; aspect-ratio:16/6; background:#0f0709;
      display:block; object-fit:cover; }
    #ecran-mort .mort-corps{ padding:20px 22px 22px; text-align:center; }
    #ecran-mort h2{ margin:0 0 6px; color:#ff6b6b; font-size:21px; letter-spacing:1px; }
    #ecran-mort .mort-sous{ color:#c9a9ad; font-size:13px; line-height:1.6; margin:0 0 16px; }
    #ecran-mort .mort-bloc{ background:rgba(255,255,255,.04); border:1px solid #4a2028;
      border-radius:10px; padding:12px; margin:0 0 16px; }
    #ecran-mort .mort-bloc .lab{ display:block; font-size:11px; color:#c9a9ad;
      text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
    #ecran-mort .mort-bloc .val{ font-size:20px; font-weight:700; color:#ffd9d9; }
    #ecran-mort .mort-bloc.urgent .val{ color:#ff5257; }
    #ecran-mort .mort-prix{ font-size:12px; color:#c9a9ad; margin:12px 0 0; }
  `;
  document.head.appendChild(st);
}

function _mortFmt(ms){
  if(ms == null) return "—";
  if(ms <= 0) return "expiré";
  const j = (typeof _jourReel === "function") ? _jourReel() : 86400000;
  const jours = ms / j;
  if(jours >= 1) return `${Math.ceil(jours)} jour${Math.ceil(jours)>1?"s":""}`;
  const min = Math.ceil(ms / 60000);
  return min >= 60 ? `${Math.floor(min/60)} h ${min%60} min` : `${min} min`;
}

let _mortTimer = null;
let _mortInfo  = null;

async function syncMort(){
  if(typeof sb === "undefined") return null;
  try{
    const { data } = await sb.rpc("mort_etat");
    if(data && data.ok){
      if(data.jour_reel_ms) etat._jourReelMs = data.jour_reel_ms;
      _mortInfo = data; majEcranMort();
    }
    return data;
  }catch(e){ return null; }
}

function ecranMort(){
  let z = document.querySelector("#ecran-mort");
  if(!z){
    _mortStyle();
    z = document.createElement("div"); z.id = "ecran-mort"; z.hidden = true;
    z.innerHTML = `<div class="mort-carte">
      <img class="mort-banniere" src="${MORT_BANNIERE}" alt="" onerror="this.remove()">
      <div class="mort-corps">
        <h2>Ton personnage a succombé</h2>
        <p class="mort-sous">Les secours de ta faction peuvent encore te ramener — mais pas indéfiniment.
          Passé le délai, ton personnage sera <b>définitivement perdu</b> : nom, crédits, inventaire, tout disparaît.</p>
        <div class="mort-bloc" id="mort-reste">
          <span class="lab">Temps restant pour ressusciter</span><span class="val">—</span>
        </div>
        <button class="mini" id="mort-ressusciter">Ressusciter</button>
        <p class="mort-prix" id="mort-prix"></p>
      </div></div>`;
    document.body.appendChild(z);
    z.querySelector("#mort-ressusciter").addEventListener("click", async ()=>{
      const b = z.querySelector("#mort-ressusciter"); b.disabled = true;
      try{
        const { data } = await sb.rpc("ressusciter");
        if(!data || !data.ok){ journal("Résurrection impossible.","alerte"); b.disabled = false; return; }
        // On se réaligne entièrement sur le serveur : position, jauges, crédits.
        if(data.pos && typeof data.pos.x === "number") etat.pos = { x:data.pos.x, y:data.pos.y };
        if(typeof rechargerCredits === "function") await rechargerCredits();
        if(typeof chargerJaugesServeur === "function") await chargerJaugesServeur();
        if(typeof chargerStocksServeur === "function") await chargerStocksServeur();
        _mortInfo = { ok:true, mort:false };
        majEcranMort();
        journal(`Évacuation d'urgence : tu reprends conscience chez toi. −${data.perte} ₡ de frais médicaux.`,"alerte");
        if(typeof sauvegarder === "function") sauvegarder();
        if(typeof afficher === "function") afficher();
      }catch(e){ journal("Résurrection impossible — réessaie.","alerte"); b.disabled = false; }
    });
  }
  return z;
}

function majEcranMort(){
  const z = ecranMort();
  const mort = !!(_mortInfo && _mortInfo.mort);
  z.hidden = !mort;
  if(mort) document.body.style.overflow = "hidden";
  else if(!etat.enPause) document.body.style.overflow = "";
  if(!mort){ if(_mortTimer){ clearInterval(_mortTimer); _mortTimer = null; } return; }

  const reste = _mortInfo.reste_ms || 0;
  const bloc = z.querySelector("#mort-reste");
  bloc.querySelector(".val").textContent = _mortFmt(reste);
  const j = (typeof _jourReel === "function") ? _jourReel() : 86400000;
  bloc.classList.toggle("urgent", reste < 3*j);
  z.querySelector("#mort-ressusciter").disabled = false;
  z.querySelector("#mort-prix").textContent =
    `Ressusciter coûte 30 % de tes crédits (${_mortInfo.cout_credits || 0} ₡) et te ramène chez toi, affaibli.`;

  if(!_mortTimer){
    _mortTimer = setInterval(()=>{
      if(!_mortInfo || !_mortInfo.mort){ majEcranMort(); return; }
      _mortInfo.reste_ms = Math.max(0, (_mortInfo.reste_ms||0) - 1000);
      majEcranMort();
    }, 1000);
  }
}

// Appelé par inventaire.js quand agir() signale la mort.
function ouvrirCouloirMort(){ syncMort(); }
