(function(){
  var form=document.getElementById("order-form"), q=1;
  var out=document.getElementById("qty"), total=document.getElementById("total"), msg=document.getElementById("order-msg");
  var fmt=new Intl.NumberFormat("tr-TR");
  function val(name,attr){var el=form.querySelector('input[name="'+name+'"]:checked');return Number(el.dataset[attr]||0);}
  function update(){
    var unit=val("kg","price")+val("kalibre","add")+val("teslimat","add");
    out.textContent=q; total.textContent="₺"+fmt.format(unit*q);
    document.getElementById("qty-minus").disabled=q<=1;
  }
  form.addEventListener("change",update);
  document.getElementById("qty-minus").onclick=function(){if(q>1){q--;update();}};
  document.getElementById("qty-plus").onclick=function(){if(q<20){q++;update();}};
  form.addEventListener("submit",function(e){
    e.preventDefault();
    var kg=form.querySelector('input[name="kg"]:checked').value;
    msg.hidden=false; msg.className="notice ok";
    msg.textContent=q+" × "+kg+" kg koli sepete eklendi. Toplam "+total.textContent+".";
  });
  update();
})();
