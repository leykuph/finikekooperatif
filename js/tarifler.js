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
})();
