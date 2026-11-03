// v2.29 — Les jeux sur tablette : ni sélection ni menu d'appui long ; le doigt « tenu » (node outils/o_banc.js .. tactile).
(async function(){
  const r = {}, att = ms => new Promise(x => setTimeout(x, ms));
  await att(1500);
  const regles = [...document.styleSheets].flatMap(s => { try{ return [...s.cssRules]; }catch(e){ return []; } }).map(x => x.cssText || "").join("\n");
  r.styles = { quetes: /\[data-qj-zone\][^{]*\{[^}]*user-select:\s*none/.test(regles), missions: /#mi-goupilles[^{]*\{[^}]*user-select:\s*none/.test(regles),
               champsLibres: /\[data-qj-zone\] input[^{]*\{[^}]*user-select:\s*text/.test(regles) };
  // La Grille laser
  _hackStyle();   // (comme à l'ouverture réelle d'un jeu de piratage)
  const m = _hackModal(); _hackFin = () => {}; _hackChrono = () => {};
  _miniLaser(m); await att(50);
  const area = m.querySelector("#ls-area"), dot = m.querySelector("#ls-dot");
  const ev = new MouseEvent("contextmenu", { bubbles:true, cancelable:true }); area.dispatchEvent(ev);
  r.laser = { menuEmpeche: ev.defaultPrevented };
  const sel = new Event("selectstart", { bubbles:true, cancelable:true }); area.dispatchEvent(sel);
  r.laser.selectionEmpechee = sel.defaultPrevented;
  // un simple appui (sans glisser) : la bille part vers le doigt
  area.getBoundingClientRect = () => ({ left:0, top:0, width:320, height:280 });
  const x0 = parseFloat(dot.style.left);
  const pd = new MouseEvent("pointerdown", { bubbles:true, cancelable:true, clientX:40, clientY:60 }); area.dispatchEvent(pd);
  await att(250);
  r.laser.appuiDeplace = { avant: x0, apres: parseFloat(dot.style.left) };
  r.laser.appuiSansDefilement = pd.defaultPrevented;
  if(typeof _hackCleanup === "function") _hackCleanup();
  // les styles des jeux de piratage sont posés à l'ouverture d'un jeu : on les relit maintenant
  const regles2 = [...document.styleSheets].flatMap(s => { try{ return [...s.cssRules]; }catch(e){ return []; } }).map(x => x.cssText || "").join("\n");
  // (jsdom ignore les propriétés qu'il ne connaît pas, comme user-select : on lit le texte des balises <style>)
  const texte = [...document.querySelectorAll("style")].map(x => x.textContent).join("\n");
  r.styles.piratageApresOuverture = /#hack-modale\{\s*-webkit-user-select:none; user-select:none; -webkit-touch-callout:none/.test(texte);
  return r;
})();
