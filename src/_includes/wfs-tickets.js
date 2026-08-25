(function(){
  var sb = window.supabase
    ? supabase.createClient('https://jhgcnqmzbphzpxgtojti.supabase.co',
                            'sb_publishable_VjYvl7U-fWJO0st6R6W7gg_ep7SNTn6')
    : null;

  // "tix-2026-08-20-standard" -> {date, tier}
  function parseTix(id){
    if(!id || id.indexOf('tix-')!==0) return null;
    var rest=id.slice(4), cut=rest.lastIndexOf('-');
    if(cut<0) return null;
    return { date:rest.slice(0,cut), tier:rest.slice(cut+1) };
  }
  window.wfsParseTix=parseTix;

  var SESSIONS={ {% for s in sessions %}"{{ s.date }}":{{ s.label | dump | safe }}{% if not loop.last %},{% endif %}{% endfor %} };

  var toastEl=document.getElementById('toast');
  window.wfsToast=function(t){
    if(!toastEl) return;
    toastEl.textContent=t; toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t=setTimeout(function(){ toastEl.classList.remove('show'); }, 2600);
  };

  function cartItems(){
    try{ return Snipcart.store.getState().cart.items.items || []; }catch(e){ return []; }
  }
  function findLine(pid){
    var h=cartItems().filter(function(i){ return i.id===pid; });
    return h.length ? h[0] : null;
  }
  function defItem(defId){
    var el=document.getElementById(defId);
    if(!el){ console.error('[wfs] no product definition', defId); return null; }
    var d=el.dataset;
    return { id:d.itemId, name:d.itemName, price:parseFloat(d.itemPrice),
             url:d.itemUrl, description:d.itemDescription||'', quantity:1 };
  }

  window.wfsOpenCart=function(){ if(window.wfsCartAsked) window.wfsCartAsked();
                                 if(window.Snipcart) Snipcart.api.theme.cart.open(); };
  window.wfsCheckout=window.wfsOpenCart;


  // Snipcart's cart chrome says "Back to store". This isn't a store, it's a set
  // of classes. Try Snipcart's language API first, then sweep the rendered text
  // as a fallback — the translation key for this string has moved between theme
  // versions, and a text sweep works regardless of which key is current.
  var WFS_RELABEL = {
    'Back to store': 'Back to classes',
    'Continue shopping': 'Back to classes'
  };
  function wfsRelabel(root){
    if(!root) return;
    var walk=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, hits=[];
    while((n=walk.nextNode())){
      var k=n.nodeValue && n.nodeValue.trim();
      if(k && WFS_RELABEL[k]) hits.push([n,k]);
    }
    hits.forEach(function(pair){
      pair[0].nodeValue = pair[0].nodeValue.replace(pair[1], WFS_RELABEL[pair[1]]);
    });
  }

  // The cart must never appear on its own — only when the visitor asks for it.
  //
  // data-config-add-product-behavior="none" on #snipcart is the supported way to
  // stop Snipcart sliding the cart open on every add, and this enforces the same
  // rule from our side in case a theme version ignores it: if the panel appears
  // without a wfsOpenCart() call behind it, close it again.
  (function(){
    var root=document.getElementById('snipcart');
    if(!root) return;
    var asked=false, up=false;

    window.wfsCartAsked=function(){ asked=true; };

    function visible(el){
      if(!el) return false;
      var cs=getComputedStyle(el);
      if(cs.display==='none' || cs.visibility==='hidden' || parseFloat(cs.opacity)===0) return false;
      var r=el.getBoundingClientRect();
      return r.width>100 && r.height>100 && r.right>0 && r.left<window.innerWidth;
    }
    function panelUp(){
      var c=root.querySelector('.snipcart-cart, .snipcart-modal, .snipcart__box');
      if(c) return visible(c);
      return root.children.length>0 && visible(root);
    }
    function check(){
      wfsRelabel(root);
      var now=panelUp();
      if(now===up) return;
      up=now;
      if(up && !asked){
        try{ Snipcart.api.theme.cart.close(); }catch(e){}
      } else if(!up){
        asked=false;                 // next appearance must be asked for again
      }
    }
    new MutationObserver(check).observe(root, {childList:true, subtree:true, attributes:true});
    setInterval(check, 250);
  })();


  // Set a product's cart quantity to exactly `qty` (0 removes). Uses the JS API,
  // not hidden-button clicks — those are fire-and-forget and race when several
  // registration types change at once.
  window.wfsSetQty=async function(defId, qty){
    var item=defItem(defId);
    if(!item) return false;
    if(!window.Snipcart || !Snipcart.api || !Snipcart.api.cart){
      window.wfsToast('Still loading — try again in a moment.');
      return false;
    }
    var line=findLine(item.id);
    try{
      if(qty<=0){ if(line) await Snipcart.api.cart.items.remove(line.uniqueId); }
      else if(line){ await Snipcart.api.cart.items.update({uniqueId:line.uniqueId, quantity:qty}); }
      else { item.quantity=qty; await Snipcart.api.cart.items.add(item); }
      return true;
    }catch(e){
      console.error('[wfs] cart write failed', defId, qty, item, e);
      window.wfsToast('Sorry — the cart rejected that. Check the console.');
      return false;
    }
  };

  document.addEventListener('snipcart.ready', function(){
    if(!window.Snipcart) return;
    try{
      Snipcart.api.session.setLanguage('en', {
        actions: { continue_shopping: 'Back to classes' },
        cart:    { continue_shopping: 'Back to classes' }
      });
    }catch(e){ /* falls back to the text sweep in the cart observer */ }

    var btn=document.getElementById('cartBtn'), num=document.getElementById('cartNum');

    function refresh(){
      var n=0, total=0;
      try{
        var c=Snipcart.store.getState().cart;
        n=c.items.count||0; total=c.total||0;
      }catch(e){ return; }
      if(btn) btn.hidden = !(n>0);
      if(num) num.textContent = n;
      var qty={};
      cartItems().forEach(function(i){ qty[i.id]=(qty[i.id]||0)+(i.quantity||0); });
      document.dispatchEvent(new CustomEvent('wfs.cart', {detail:{count:n, total:total, qty:qty}}));
    }
    refresh();
    Snipcart.store.subscribe(refresh);
    if(btn) btn.onclick=window.wfsOpenCart;

    // In this variant checkout IS registration. Direct inserts are revoked, so
    // the roster is written through register() — one call per day in the order,
    // which also re-checks capacity at the moment of writing.
    Snipcart.events.on('order.completed', async function(order){
      if(!sb) return;
      try{
        var email=(order && (order.email || (order.user && order.user.email))) || '';
        var name='';
        try{ name=(order.billingAddress && order.billingAddress.fullName) || order.cardHolderName || ''; }catch(e){}
        if(!email) return;

        var token=(order && (order.token || order.invoiceNumber)) || null;
        var items=(order && order.items) || [];
        var kitDates={}, byDate={}, amount={}, kitAmount={}, tier={};
        items.forEach(function(it){
          if(it.id && it.id.indexOf('kit-')===0){
            var d=it.id.slice(4);
            kitDates[d]=(kitDates[d]||0)+(it.quantity||1);
          }
        });
        items.forEach(function(it){
          var p=parseTix(it.id);
          if(!p) return;
          var q=it.quantity||1, unit=parseFloat(it.unitPrice||it.price||0)||0;
          byDate[p.date]=(byDate[p.date]||0)+q;
          amount[p.date]=(amount[p.date]||0)+q*unit;
          if(!tier[p.date] || unit>0) tier[p.date]=p.tier;
        });
        items.forEach(function(it){
          if(it.id && it.id.indexOf('kit-')===0){
            var d=it.id.slice(4), q=it.quantity||1;
            var unit=parseFloat(it.unitPrice||it.price||0)||0;
            kitAmount[d]=(kitAmount[d]||0)+q*unit;
          }
        });

        var dates=Object.keys(byDate);
        for(var i=0;i<dates.length;i++){
          var d=dates[i];
          var res=await sb.rpc('register', {
            p_date:d, p_name:name, p_email:email,
            p_party:byDate[d],
            p_kit:!!kitDates[d],
            p_kits:kitDates[d]||0,
            p_meta:{
              tier:        tier[d] || 'free',
              amount:      amount[d] || 0,
              kit_amount:  kitAmount[d] || 0,
              order_token: token
            }
          });
          if(res.error) console.error('[wfs] register failed', d, res.error);
          else if(!(res.data||{}).ok) console.error('[wfs] register refused', d, res.data);
        }
      }catch(e){ console.error('[wfs] post-order register threw', e); }
    });
  });
})();
