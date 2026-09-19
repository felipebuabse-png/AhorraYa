const DB={
  leche:{name:"Leche",icon:"🥛",unit:"1 L",prices:{Carrefour:1800,Coto:1650,Dia:1900},deal:"10% con promo"},
  yerba:{name:"Yerba",icon:"🧉",unit:"500 g",prices:{Carrefour:4800,Coto:4300,Dia:5100},deal:"2ª unidad -20%"},
  fideos:{name:"Fideos",icon:"🍝",unit:"500 g",prices:{Carrefour:1300,Coto:1150,Dia:1250},deal:"15% descuento"},
  arroz:{name:"Arroz",icon:"🍚",unit:"1 kg",prices:{Carrefour:1700,Coto:1550,Dia:1800},deal:"Oferta"},
  aceite:{name:"Aceite",icon:"🫒",unit:"900 ml",prices:{Carrefour:3200,Coto:2900,Dia:3500},deal:"20% con promo"},
  shampoo:{name:"Shampoo",icon:"🧴",unit:"400 ml",prices:{Carrefour:5200,Coto:4800,Dia:5500},deal:"Oferta"},
  galletitas:{name:"Galletitas",icon:"🍪",unit:"300 g",prices:{Carrefour:1900,Coto:1750,Dia:2100},deal:"2x1"},
  coca:{name:"Coca-Cola",icon:"🥤",unit:"1.5 L",prices:{Carrefour:2500,Coto:2200,Dia:2700},deal:"Promo"},
  huevos:{name:"Huevos",icon:"🥚",unit:"12 unidades",prices:{Carrefour:3900,Coto:3600,Dia:4100},deal:"Oferta"},
  queso:{name:"Queso",icon:"🧀",unit:"300 g",prices:{Carrefour:4300,Coto:3990,Dia:4500},deal:"10% descuento"}
};

let cart=JSON.parse(localStorage.getItem("ahorraya_cart")||"{}");

const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);

function save(){localStorage.setItem("ahorraya_cart",JSON.stringify(cart));}
function add(key){cart[key]=(cart[key]||0)+1;save();render();}
function change(key,n){cart[key]=(cart[key]||0)+n;if(cart[key]<=0)delete cart[key];save();render();}
function clearCart(){cart={};save();render();}

function cheapest(key){
  const prices=Object.entries(DB[key].prices);
  return prices.reduce((a,b)=>b[1]<a[1]?b:a);
}

function renderQuick(){
  $("quickProducts").innerHTML=Object.entries(DB).slice(0,10).map(([key,p])=>`
    <button class="quick" onclick="add('${key}')"><div class="icon">${p.icon}</div><div class="name">${p.name}</div></button>
  `).join("");
}

function renderCart(){
  const keys=Object.keys(cart);
  if(!keys.length){
    $("cart").innerHTML=`<div class="empty"><div class="big">🛒</div><strong>Tu carrito está vacío</strong><p>Agregá productos para empezar a comparar.</p></div>`;
    return;
  }
  $("cart").innerHTML=keys.map(key=>{
    const p=DB[key], q=cart[key], [market,price]=cheapest(key);
    return `<article class="cart-item">
      <div class="cart-top">
        <div class="product-title"><span class="icon">${p.icon}</span><div><strong>${p.name}</strong><small>${p.unit} · ${p.deal}</small></div></div>
        <div class="qty"><button onclick="change('${key}',-1)">−</button><b>${q}</b><button onclick="change('${key}',1)">+</button></div>
      </div>
      <div class="item-best"><small>🏆 ${market} · mejor precio</small><strong>${money(price*q)}</strong></div>
    </article>`;
  }).join("");
}

function totals(){
  const markets=Object.keys(DB.leche.prices);
  const totals={};
  markets.forEach(m=>totals[m]=0);
  let mixed=0;
  Object.entries(cart).forEach(([key,q])=>{
    const prices=DB[key].prices;
    markets.forEach(m=>totals[m]+=prices[m]*q);
    mixed+=Math.min(...Object.values(prices))*q;
  });
  return {totals,mixed};
}

function renderComparison(){
  const keys=Object.keys(cart);
  if(!keys.length){
    $("comparisonSection").classList.add("hidden");
    $("recommendation").classList.add("hidden");
    return;
  }
  $("comparisonSection").classList.remove("hidden");
  const {totals,mixed}=totals();
  const entries=Object.entries(totals);
  const best=entries.reduce((a,b)=>b[1]<a[1]?b:a);
  const max=Math.max(...entries.map(x=>x[1]));
  const savings=mixed-best[1];

  $("comparison").innerHTML=entries.map(([market,total])=>{
    const isBest=market===best[0];
    const width=Math.max(8,Math.round((total/max)*100));
    const diff=total-mixed;
    return `<div class="market-card ${isBest?"best-market":""}">
      <div class="market-head"><strong>${market} ${isBest?'<span class="pill">MÁS BARATO EN UN SOLO LUGAR</span>':""}</strong><span class="market-total">${money(total)}</span></div>
      <div class="bar"><span style="width:${width}%"></span></div>
      <div class="market-meta"><span>${diff===0?"Coincide con el mejor total":`Hasta ${money(diff)} más que comprando por separado`}</span><span>${DB[keys[0]].prices[market]?keys.length+" productos":""}</span></div>
    </div>`;
  }).join("");

  const extra=best[1]-mixed;
  $("recommendation").classList.remove("hidden");
  $("recommendation").innerHTML=`<strong>💡 Estrategia de compra</strong>
    <p>Comprando cada producto donde está más barato, el carrito cuesta <b>${money(mixed)}</b>. Si querés hacer una sola parada, ${best[0]} suma <b>${money(extra)}</b> más y queda en <b>${money(best[1])}</b>.</p>`;
}

function renderSummary(){
  const keys=Object.keys(cart);
  if(!keys.length){$("saving").textContent="$0";$("summaryText").textContent="Agregá productos para comparar.";return;}
  const {totals,mixed}=totals();
  const max=Math.max(...Object.values(totals));
  const saving=Math.max(0,max-mixed);
  $("saving").textContent=money(saving);
  $("summaryText").textContent=`Comparando ${keys.length} producto${keys.length===1?"":"s"} entre ${Object.keys(totals).length} supermercados.`;
}

function render(){renderCart();renderComparison();renderSummary();}

function search(){
  const value=$("searchInput").value.toLowerCase().trim();
  const box=$("suggestions");
  if(!value){box.classList.add("hidden");return;}
  const matches=Object.entries(DB).filter(([k,p])=>p.name.toLowerCase().includes(value)).slice(0,5);
  if(!matches.length){box.innerHTML=`<div class="suggestion">No encontramos ese producto en la demo.</div>`;box.classList.remove("hidden");return;}
  box.innerHTML=matches.map(([k,p])=>`<button class="suggestion" onclick="add('${k}');hideSuggestions()"><span>${p.icon} ${p.name}</span><small>desde ${money(Math.min(...Object.values(p.prices)))}</small></button>`).join("");
  box.classList.remove("hidden");
}
function hideSuggestions(){$("suggestions").classList.add("hidden");$("searchInput").value="";}
$("searchInput").addEventListener("input",search);
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter"){const first=Object.entries(DB).find(([k,p])=>p.name.toLowerCase().includes($("searchInput").value.toLowerCase().trim()));if(first){add(first[0]);hideSuggestions();}}});
$("clearBtn").addEventListener("click",clearCart);
document.addEventListener("click",e=>{if(!e.target.closest(".search-card"))$("suggestions").classList.add("hidden");});
renderQuick();render();
