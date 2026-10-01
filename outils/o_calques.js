// v1.36n — Q15 ét. 4 : repères verticaux des calques
(async function(){
  await new Promise(x=>setTimeout(x,1200));
  const z=document.createElement("div"); document.body.appendChild(z);
  queteActive = () => ({ id:"q15", etape:3 });                  // _calqEtat lit queteActive()
  const a={ id:"q15", etape:3 }; queteActive = () => a; sauvegarder = () => {};
  z.innerHTML=_htmlCalques({ texte:["T"] }); _wireCalques(z, {});
  const A=z.querySelector('[data-qc-ligne="A"]');
  A.getBoundingClientRect = () => ({ left:0, width:400, top:0, height:46 });
  A.dispatchEvent(new MouseEvent("click", { bubbles:true, clientX:125 }));     // colonne 12
  const rep = () => [...z.querySelectorAll(".qc-ligne, .qc-regle")].map(l => [...l.children].findIndex(c => c.classList.contains("qc-repere")));
  const r1 = rep();
  z.querySelector('[data-qc="B"][data-d="1"]').click();                          // décaler B : le repère reste
  const r2 = rep();
  A.dispatchEvent(new MouseEvent("click", { bubbles:true, clientX:125 }));     // retirer
  return { regle: z.querySelector(".qc-regle").textContent.trim(), apresClic:r1, apresDecalage:r2, retire:rep() };
})();
