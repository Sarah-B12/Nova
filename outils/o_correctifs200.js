// v2.00 — correctifs du 29/10 (2) : barreaux sur un profil visité, copie du journal,
// mini-jeux indépendants de l'écran, fin de peine dans le journal, colis en prison,
// récompense de Q5 avec un sac plein. Tout ce qui est noté « vrai » doit l'être.
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const r = {}, msgs = []; journal = (m) => msgs.push(String(m)); sauvegarder = () => {}; sauverMaintenant = async () => {};
  // 1. pasImage : une seconde à 144 images/s vaut une seconde à 60.
  let o = {}, t = 0, s144 = 0; pasImage(0, o); for(let i = 0; i < 144; i++){ t += 1000/144; s144 += pasImage(t, o); }
  o = {}; t = 0; let s60 = 0; pasImage(0, o); for(let i = 0; i < 60; i++){ t += 1000/60; s60 += pasImage(t, o); }
  r.pasImage = { a144: Math.round(s144), a60: Math.round(s60), borne: pasImage(10000, { der:1 }) };     // 60, 60, 3
  // 2. Copie du journal : la ligne seulement « touchée » (bord, 0 caractère) ne part pas.
  etat.journal = [ { t:"Ligne du bas", d:Date.now(), cat:"systeme" }, { t:"Ligne B", d:Date.now()-1000, cat:"vol" }, { t:"Ligne A", d:Date.now()-2000, cat:"vol" } ];
  const z = document.querySelector("#journal"); z.dataset.jsig = ""; majJournal();
  const L = [...z.querySelectorAll(".msg")];   // v2.00 : ordre de l'écran (A, B, bas)
  r.ordreEcran = L.map(m => m.textContent.replace(/^.*?(Ligne)/, "$1")).join("|");                    // Ligne A|Ligne B|Ligne du bas
  const sel = window.getSelection(); sel.removeAllRanges(); const rg = document.createRange();
  rg.setStart(L[0], 0); rg.setEnd(L[2], 0); sel.addRange(rg);       // A et B, puis le tout début de « bas »
  let copie = null; const ev = new window.Event("copy", { bubbles:true, cancelable:true });
  ev.clipboardData = { setData:(k, v) => { copie = v; } }; z.dispatchEvent(ev);
  r.copie = { texte: copie, sansLaLigneDuBas: !!copie && !/Ligne du bas/.test(copie) && /Ligne A/.test(copie) && /Ligne B/.test(copie) };
  // 3. Fin de peine : une ligne, une fois, même pendant l'absence ; rien après une évasion.
  _prisonSyncFaite = true; msgs.length = 0;
  etat.prisonJusqua = Date.now() + 3600e3; _prisonFinVerifier(); r.finConnue = etat.prisonFinConnue === etat.prisonJusqua;
  etat.prisonJusqua = 0; etat.prisonFinConnue = Date.now() - 3*3600e3; _prisonFinVerifier(); _prisonFinVerifier();
  r.finAbsence = msgs.length === 1 && /pendant ton absence/.test(msgs[0]);
  msgs.length = 0; etat.prisonFinConnue = Date.now() - 1000; _prisonFinVerifier(); r.finPresent = /peine est purgée/.test(msgs[0] || "");
  msgs.length = 0; etat.prisonFinConnue = Date.now() + 5*3600e3; _prisonFinVerifier(); r.sortieAnticipeeMuette = msgs.length === 0 && !etat.prisonFinConnue;
  // 4. En prison, pas de colis.
  etat.prisonJusqua = Date.now() + 3600e3; msgs.length = 0; let appel = false; const vr = sb.rpc; sb.rpc = (n, a) => { if(n === "poste_recuperer") appel = true; return vr.call(sb, n, a); };
  await posteRecuperer(1); r.colisRefuse = !appel && msgs.some(m => /prison/i.test(m)); sb.rpc = vr; etat.prisonJusqua = 0; etat.prisonFinConnue = 0;
  // 5. Q5 : sac plein → la quête ne se termine pas, la navette n'est pas perdue.
  const vraiQA = queteActive; const a = { id:"q5", etape: queteData("q5").etapes.length - 1 }; queteActive = () => a;
  const vA = agirServeur; agirServeur = async (o) => false; const done0 = (queteEtat().done || []).length; msgs.length = 0;
  const res = await terminerQuete();
  r.q5SacPlein = { refuse: res === false, pasTerminee: (queteEtat().done || []).length === done0, texte: msgs.some(m => /Navette de réserve|Fais de la place/.test(m)) };
  agirServeur = vA; queteActive = vraiQA;
  // 6. Profil visité en prison : barreaux et mention.
  _chargerProfilComplet = async (nom) => ({ id:"00000000-0000-0000-0000-0000000000b1", nom, faction:"ignis", niveau:10, avatar:null, derniere_activite:new Date().toISOString() });
  const vr2 = sb.rpc; sb.rpc = (n, a) => n === "profil_en_prison" ? Promise.resolve({ data:true, error:null }) : vr2.call(sb, n, a);
  await ouvrirPageProfil("Vortex"); await new Promise(x=>setTimeout(x,100));
  const pp = document.querySelector("#page-profil");
  r.profilBarreaux = !!pp.querySelector(".pp-portrait.enprison") && /En prison/.test(pp.innerHTML);
  sb.rpc = vr2; fermerPageProfil();
  r.erreursJs = msgs.filter(m => /TypeError|ReferenceError/.test(m));
  return r;
})();
