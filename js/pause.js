/* ===========================================================
   PAUSE — écran plein écran bloquant + confirmation maison.

   La pause est détenue par le SERVEUR (profils.pause_depuis, RPC pause_etat /
   pause_entrer / pause_sortir). Ce fichier ne fait qu'afficher.

   Écran de pause : recouvre TOUT (le joueur ne voit ni ne fait rien d'autre).
   Bannière : images/pause.png — l'emplacement est réservé, l'image peut
   arriver plus tard (onerror la retire proprement).
   =========================================================== */

const PAUSE_BANNIERE = "images/pause.png";

function _pauseStyle(){
  if(document.querySelector("#pause-style")) return;
  const st = document.createElement("style"); st.id = "pause-style";
  st.textContent = `
    #ecran-pause{ position:fixed; inset:0; z-index:900; display:grid; place-items:center;
      background:radial-gradient(circle at 50% 30%, #0e1c30, #060b14 70%); padding:20px; }
    #ecran-pause[hidden]{ display:none !important; }
    #ecran-pause .pause-carte{ width:min(560px,94vw); background:var(--surface-2,#101d31);
      border:1px solid var(--edge,#24344d); border-radius:16px; overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,.6); }
    #ecran-pause .pause-banniere{ width:100%; aspect-ratio:16/6; background:#0a1424;
      display:block; object-fit:cover; }
    #ecran-pause .pause-corps{ padding:20px 22px 22px; text-align:center; }
    #ecran-pause h2{ margin:0 0 6px; color:var(--orange-hi,#ffb06a); font-size:20px; letter-spacing:.5px; }
    #ecran-pause .pause-sous{ color:var(--texte-2,#9fb3c8); font-size:13px; line-height:1.6; margin:0 0 16px; }
    #ecran-pause .pause-compteurs{ display:grid; gap:10px; margin:0 0 18px; }
    #ecran-pause .pause-bloc{ background:rgba(255,255,255,.04); border:1px solid var(--edge,#24344d);
      border-radius:10px; padding:10px 12px; }
    #ecran-pause .pause-bloc .lab{ display:block; font-size:11px; color:var(--texte-2,#9fb3c8);
      text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
    #ecran-pause .pause-bloc .val{ font-size:17px; font-weight:700; color:var(--texte,#e6eef8); }
    #ecran-pause .pause-bloc.pret .val{ color:var(--vert,#8bd450); }
    #ecran-pause .pause-note{ font-size:12px; color:var(--texte-2,#9fb3c8); margin:14px 0 0; }
    #ecran-pause button[disabled]{ opacity:.45; cursor:not-allowed; }
  `;
  document.head.appendChild(st);
}

/* Confirmation maison, à la place du confirm() du navigateur. */
function _pauseConfirm(titre, lignes, libelleOk){
  return new Promise(resolve=>{
    _pauseStyle();
    const fond = document.createElement("div");
    fond.style.cssText = "position:fixed;inset:0;z-index:950;display:grid;place-items:center;background:rgba(4,8,16,.72);padding:20px";
    fond.innerHTML = `<div class="pause-carte" style="width:min(460px,94vw)">
      <div class="pause-corps">
        <h2>${titre}</h2>
        <p class="pause-sous">${lignes.map(l=>`• ${l}`).join("<br>")}</p>
        <div style="display:flex; gap:10px; justify-content:center">
          <button class="mini" data-non="1">Annuler</button>
          <button class="mini" data-oui="1">${libelleOk}</button>
        </div>
      </div></div>`;
    const fin = v => { fond.remove(); resolve(v); };
    fond.querySelector("[data-non]").addEventListener("click", ()=>fin(false));
    fond.querySelector("[data-oui]").addEventListener("click", ()=>fin(true));
    fond.addEventListener("click", e=>{ if(e.target===fond) fin(false); });
    document.body.appendChild(fond);
  });
}

// ⚠ Durées en TEMPS RÉEL (absence du joueur), pas en JOUR_MS de jeu.
// Le serveur renvoie jour_reel_ms dans pause_etat / mort_etat.
function _jourReel(){ return etat._jourReelMs || 86400000; }
function _pauseFmt(ms){
  if(ms == null) return "—";
  if(ms <= 0) return "terminé";
  const j = _jourReel();
  const jours = ms / j;
  if(jours >= 1) return `${Math.ceil(jours)} jour${Math.ceil(jours)>1?"s":""}`;
  const min = Math.ceil(ms / 60000);
  return min >= 60 ? `${Math.floor(min/60)} h ${min%60} min` : `${min} min`;
}

let _pauseTimer = null;

function ecranPause(){
  let z = document.querySelector("#ecran-pause");
  if(!z){
    _pauseStyle();
    z = document.createElement("div"); z.id = "ecran-pause"; z.hidden = true;
    z.innerHTML = `<div class="pause-carte">
      <img class="pause-banniere" src="${PAUSE_BANNIERE}" alt="" onerror="this.remove()">
      <div class="pause-corps">
        <h2>Personnage en pause</h2>
        <p class="pause-sous">Ton personnage est en sommeil. Il ne décline pas, ne peut être ni volé ni attaqué — et tu ne peux rien faire tant que la pause dure.</p>
        <div class="pause-compteurs">
          <div class="pause-bloc" id="pause-min"><span class="lab">Reprise possible dans</span><span class="val">—</span></div>
          <div class="pause-bloc" id="pause-max"><span class="lab">Sortie automatique dans</span><span class="val">—</span></div>
        </div>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
          <button class="mini" id="pause-reprendre">Reprendre le jeu</button>
          <button class="mini" id="pause-deconnexion">Se déconnecter</button>
        </div>
        <p class="pause-note">Passé le maximum, ton personnage sort de pause tout seul et recommence à décliner.</p>
      </div></div>`;
    document.body.appendChild(z);
    z.querySelector("#pause-reprendre").addEventListener("click", async ()=>{
      if(typeof basculerPause === "function") await basculerPause();
      majEcranPause();
    });
    z.querySelector("#pause-deconnexion").addEventListener("click", async ()=>{
      // On laisse l'écran en place : la déconnexion recharge la page.
      if(typeof deconnexion === "function") await deconnexion();
    });
  }
  return z;
}

function majEcranPause(){
  const z = ecranPause();
  const actif = !!etat.enPause;
  z.hidden = !actif;
  document.body.style.overflow = actif ? "hidden" : "";
  if(!actif){ if(_pauseTimer){ clearInterval(_pauseTimer); _pauseTimer = null; } return; }

  const rMin = etat._pauseResteMin || 0, rMax = etat._pauseResteMax || 0;
  const bMin = z.querySelector("#pause-min"), bMax = z.querySelector("#pause-max");
  bMin.querySelector(".val").textContent = rMin > 0 ? _pauseFmt(rMin) : "maintenant";
  bMin.classList.toggle("pret", rMin <= 0);
  bMax.querySelector(".val").textContent = _pauseFmt(rMax);
  z.querySelector("#pause-reprendre").disabled = (rMin > 0);

  // Décompte local entre deux synchros serveur.
  if(!_pauseTimer){
    _pauseTimer = setInterval(()=>{
      if(!etat.enPause){ majEcranPause(); return; }
      etat._pauseResteMin = Math.max(0, (etat._pauseResteMin||0) - 1000);
      etat._pauseResteMax = Math.max(0, (etat._pauseResteMax||0) - 1000);
      majEcranPause();
    }, 1000);
  }
}
