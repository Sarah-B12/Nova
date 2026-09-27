// v1.24 — la chasse : Wanted, mini-jeu, outils de carte, Traquer (node banc.js .. traque)
(async function(){
  const r = {}; const dort = ms => new Promise(x => setTimeout(x, ms));
  const appels = []; let rep = {};
  const orig = sb.rpc.bind(sb);
  sb.rpc = (n, a) => { appels.push({ n, a }); return rep[n] ? Promise.resolve({ data: rep[n](a), error: null }) : orig(n, a); };
  const journ = []; const jOrig = journal; journal = (t) => { journ.push(t); };
  sauverMaintenant = async () => {};
  const piste = { secteur:"silene", x:700, y:800, le:new Date().toISOString() };
  let avecPiste = false;
  rep.wanted_liste = () => ({ ok:true, chasseur:true, liste:[
    { id:"v1", nom:"Kaël", faction:"ignis", avatar:{ genre:"h", visage:2 }, total:1900, plaintes:3, etat:null, moi:false, essais:2, piste: avecPiste ? piste : null, retraque:null },
    { id:"v2", nom:"Nyx", faction:"toundra", avatar:null, total:300, plaintes:1, etat:"prison", moi:false, essais:3, piste:null, retraque:null },
    { id:"moi", nom:"Moi", faction:"ignis", avatar:null, total:100, plaintes:1, etat:null, moi:true, essais:3, piste:null, retraque:null } ] });
  const el = document.createElement("div"); document.body.appendChild(el);
  _prisonOnglet = "wanted"; await majPrison(el); await dort(30);
  r.menu = [...el.querySelectorAll("[data-ponglet]")].map(b=>b.textContent+(b.classList.contains("actif")?"*":""));
  r.cartes = [...el.querySelectorAll(".tq-carte")].map(c=>c.textContent.replace(/\s+/g," ").trim());
  r.portraits = el.querySelectorAll(".tq-couche").length;
  r.boutonsPister = el.querySelectorAll("[data-pister]").length;

  // Mini-jeu accéléré : on gagne en touchant les signatures
  Object.assign(TQ_JEU, { echauffe:0, ecartCible:0, spawn0:40, spawn1:40, vitesse0:900, vitesse1:900, pCible:0.5 });
  rep.traque_essai_debut = () => ({ ok:true, id:11, essais:1, energie:70 });
  rep.traque_essai_fin = (a) => ({ ok:true, gagne:a.p_reussi, piste: a.p_reussi ? piste : null });
  const jouer = async (mode) => {
    const m = document.querySelector("#tq-modale"); m.querySelector("#tq-go").click();
    const sig = m.querySelector(".tq-sig").textContent;
    for(let i=0;i<300 && !m.hidden;i++){
      await dort(15);
      for(const l of m.querySelectorAll(".tq-ligne:not(.touche)")){
        const cible = l.textContent.includes("  "+sig+"  ");
        if(mode==="gagner" && cible) l.dispatchEvent(new window.Event("pointerdown",{bubbles:true}));
        if(mode==="faux" && !cible){ l.dispatchEvent(new window.Event("pointerdown",{bubbles:true})); break; }
      }
    }
    await dort(1100);
  };
  el.querySelector("[data-pister]").click(); await dort(30);
  r.jeuOuvert = !document.querySelector("#tq-modale").hidden;
  avecPiste = true;
  await jouer("gagner");
  r.gagne = { fin: (appels.filter(a=>a.n==="traque_essai_fin").pop()||{}).a, msg: journ.slice(-1)[0], energie: etat.energie };
  el.querySelector("[data-pister]").click(); await dort(30);
  await jouer("faux");
  r.perdu = { fin: (appels.filter(a=>a.n==="traque_essai_fin").pop()||{}).a, msg: journ.slice(-1)[0] };
  // leurres : jamais identiques à la signature, toujours à un caractère près
  let okL = true; for(let i=0;i<500;i++){ const s=_tqSignature(), l=_tqLeurre(s); const d=[...s].filter((c,k)=>c!==l[k]).length; if(l===s || d!==1) okL=false; }
  r.leurres = okL;

  // Carte de Silène : outils, Aller, Traquer
  const mod = document.querySelector("#modale-carte"); mod.classList.add("ouverte");
  etat.secteur = "silene"; etat.pos = { x:10, y:20 };
  let vise = null; _poserVisee = (x,y)=>{ vise = {x,y}; };
  _tqTick(); await dort(30); _tqTick();
  const bar = mod.querySelector(".tq-outils");
  r.outils = { present: !!bar, ici: bar.querySelector('[data-tq="ici"]').textContent, traquerCache: bar.querySelector('[data-tq="traquer"]').hidden };
  bar.querySelector('[data-tq="x"]').value = "700"; bar.querySelector('[data-tq="y"]').value = "800";
  bar.querySelector('[data-tq="aller"]').click();
  r.aller = vise;
  bar.querySelector('[data-tq="x"]').value = "9999"; bar.querySelector('[data-tq="aller"]').click();
  r.horsCarte = journ.slice(-1)[0];
  etat.pos = { x:700, y:800 }; _tqTick();
  const bt = bar.querySelector('[data-tq="traquer"]');
  r.traquerVisible = { visible: !bt.hidden, texte: bt.textContent };
  rep.traquer = () => ({ ok:true, reussi:true, chance:0.6, prime:1900, plaintes:3, heures:72, prison_faction:"toundra", nom:"Kaël", solde:4000, energie:50 });
  bt.click(); await dort(40);
  r.capture = { args: (appels.find(a=>a.n==="traquer")||{}).a, msg: journ.slice(-1)[0] };
  rep.traquer = () => ({ ok:false, err:"froide" });
  bt.disabled = false; bt.click(); await dort(40);
  r.froide = journ.slice(-1)[0];
  mod.classList.remove("ouverte");
  journal = jOrig;
  return r;
})()
