(function(){
  var chips=document.querySelectorAll(".chip"), cards=document.querySelectorAll("#recipes .recipe");
  var count=document.getElementById("count"), empty=document.getElementById("empty");
  function apply(f){
    var n=0;
    cards.forEach(function(c){var show=f==="hepsi"||c.dataset.cat.split(" ").indexOf(f)>-1;c.hidden=!show;if(show)n++;});
    count.textContent=n+" tarif"; empty.hidden=n>0;
  }
  chips.forEach(function(ch){ch.addEventListener("click",function(){
    chips.forEach(function(x){x.setAttribute("aria-pressed","false");});
    ch.setAttribute("aria-pressed","true"); apply(ch.dataset.filter);
  });});
  apply("hepsi");

  /* Karta tıklanınca tarif, kartın yerinden büyüyerek ortada açılır. */
  var dlg=document.createElement("dialog"), from=null;
  dlg.className="recipe-dialog";
  document.body.appendChild(dlg);
  var still=matchMedia("(prefers-reduced-motion: reduce)");
  function flip(card,reverse){
    var a=card.getBoundingClientRect(), b=dlg.getBoundingClientRect();
    var t="translate("+(a.left-b.left)+"px,"+(a.top-b.top)+"px) scale("+(a.width/b.width)+","+(a.height/b.height)+")";
    var k=[{transform:t,opacity:.4},{transform:"none",opacity:1}];
    return dlg.animate(reverse?k.reverse():k,{duration:reverse?220:320,easing:"cubic-bezier(.2,.8,.2,1)",transformOrigin:"top left"});
  }
  function open(card){
    from=card;
    dlg.innerHTML='<button class="dialog-close" type="button" aria-label="Tarifi kapat">✕</button>';
    dlg.appendChild(card.querySelector(".ph").cloneNode(true));
    dlg.appendChild(card.querySelector(".recipe-body").cloneNode(true));
    dlg.setAttribute("aria-label",card.querySelector("h3").textContent);
    dlg.showModal(); dlg.scrollTop=0;
    dlg.style.transformOrigin="top left";
    if(!still.matches)flip(card);
  }
  function close(){
    if(!dlg.open)return;
    if(still.matches||!from){dlg.close();return;}
    flip(from,true).onfinish=function(){dlg.close();};
  }
  document.getElementById("recipes").addEventListener("click",function(e){
    var card=e.target.closest(".recipe"); if(card)open(card);
  });
  dlg.addEventListener("click",function(e){
    if(e.target===dlg||e.target.closest(".dialog-close"))close();
  });
  dlg.addEventListener("cancel",function(e){e.preventDefault();close();});
})();
