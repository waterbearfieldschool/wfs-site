(function(){
  var SUPABASE_URL='https://jhgcnqmzbphzpxgtojti.supabase.co';
  var SUPABASE_KEY='sb_publishable_VjYvl7U-fWJO0st6R6W7gg_ep7SNTn6';
  var sb = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  var toastEl=document.getElementById('toast');
  window.wfsToast=function(t){
    if(!toastEl) return;
    toastEl.textContent=t; toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t=setTimeout(function(){ toastEl.classList.remove('show'); }, 2800);
  };

  /* ---------------- registration (free, Supabase) ---------------- */

  // Remembering who registered for what, so a return visit shows the confirmed
  // state instead of an empty form. Local to this browser; Supabase is the record.
  var LSK='wfs.registered.v1';
  function readReg(){
    try{ return JSON.parse(localStorage.getItem(LSK)||'{}'); }catch(e){ return {}; }
  }
  function writeReg(o){
    try{ localStorage.setItem(LSK, JSON.stringify(o)); }catch(e){}
  }
  window.wfsRegistrationFor=function(date){ return readReg()[date]||null; };
  window.wfsAllRegistrations=readReg;
  window.wfsForgetRegistration=function(date){
    var o=readReg(); delete o[date]; writeReg(o);
  };

  // Last email/name used, so the second and third day you register are quicker.
  var WHO='wfs.who.v1';
  window.wfsWho=function(){
    try{ return JSON.parse(localStorage.getItem(WHO)||'{}'); }catch(e){ return {}; }
  };
  function rememberWho(name,email){
    try{ localStorage.setItem(WHO, JSON.stringify({name:name,email:email})); }catch(e){}
  }

  // Direct inserts into rsvps are revoked — register() is the only way in. It
  // re-checks capacity and writes in one locked transaction.
  window.wfsRegister=async function(opts){
    if(!sb) return {ok:false, error:'Registration is unavailable — Supabase did not load.'};

    var res;
    try{
      res=await sb.rpc('register', {
        p_date:  opts.date,
        p_name:  opts.name,
        p_email: opts.email,
        p_party: opts.people,
        // in this variant the kit is chosen in step 2, after registering, so we
        // can't know it yet; the paid order is what records it there
        p_kit:   false
      });
    }catch(e){ return {ok:false, error:String(e)}; }

    if(res.error){
      console.error('[wfs] register failed', res.error);
      return {ok:false, error:res.error.message||'Something went wrong.'};
    }
    var out=res.data||{};
    if(!out.ok){
      if(out.reason==='full'){
        return {ok:false, error: out.remaining>0
          ? 'Only '+out.remaining+' spot'+(out.remaining===1?'':'s')+' left for that day.'
          : 'Sorry — that day is full.'};
      }
      if(out.reason==='bad_details') return {ok:false, error:'Please check the name and email.'};
      if(out.reason==='duplicate') return {ok:false, error:'Looks like that just went through — check your email before trying again.'};
      if(out.reason==='rate_limited') return {ok:false, error:'That is a lot of registrations from one address. Email us and we will sort it out.'};
      if(out.reason==='too_busy') return {ok:false, error:'Things are unusually busy — give it a minute and try again.'};
      return {ok:false, error:'Could not register ('+(out.reason||'unknown')+').'};
    }

    rememberWho(opts.name, opts.email);
    var o=readReg();
    o[opts.date]={ people:opts.people, name:opts.name, email:opts.email,
                   label:opts.label, at:new Date().toISOString() };
    writeReg(o);

    try{ if(window.Snipcart) await Snipcart.api.cart.update({email:opts.email}); }catch(e){}
    document.dispatchEvent(new CustomEvent('wfs.registered', {detail:{date:opts.date}}));
    return {ok:true, remaining:out.remaining};
  };

  /* ---------------- money (Snipcart) ---------------- */

  function cartItems(){
    try{ return Snipcart.store.getState().cart.items.items || []; }catch(e){ return []; }
  }
  function findLine(productId){
    var hit=cartItems().filter(function(i){ return i.id===productId; });
    return hit.length ? hit[0] : null;
  }
  function defItem(defId){
    var el=document.getElementById(defId);
    if(!el){ console.error('[wfs] no product definition', defId); return null; }
    var d=el.dataset;
    // Everything on the button matters here, not just the obvious fields: we add
    // through the JS API rather than clicking the button, so anything left out
    // of this object simply isn't part of the item. data-item-shippable was
    // being ignored for exactly that reason, and Snipcart kept asking for a
    // shipping method.
    return { id:d.itemId, name:d.itemName, price:parseFloat(d.itemPrice),
             url:d.itemUrl, description:d.itemDescription||'',
             shippable: d.itemShippable !== 'false',
             quantity:1 };
  }

  window.wfsOpenCart=function(){ if(window.wfsCartAsked) window.wfsCartAsked();
                                 if(window.Snipcart) Snipcart.api.theme.cart.open(); };


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


  // Set a product's quantity in the cart to exactly `qty` (0 removes it).
  //
  // Via the JS API rather than clicking the hidden .snipcart-add-item button:
  // those clicks are fire-and-forget, and two in quick succession (kit +
  // contribution) race — the second lands mid-mutation and gets dropped.
  // add/update/remove return real promises, so awaiting them serialises.
  window.wfsSetQty=async function(defId, qty){
    var item=defItem(defId);
    if(!item) return false;
    if(!window.Snipcart || !Snipcart.api || !Snipcart.api.cart){
      window.wfsToast('Cart is still loading — try again in a moment.');
      return false;
    }
    var line=findLine(item.id);
    try{
      if(qty<=0){ if(line) await Snipcart.api.cart.items.remove(line.uniqueId); }
      else if(line){ await Snipcart.api.cart.items.update({uniqueId:line.uniqueId, quantity:qty}); }
      else { item.quantity=qty; await Snipcart.api.cart.items.add(item); }
      return true;
    }catch(e){
      console.error('[wfs] cart write failed', defId, 'qty', qty, item, e);
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
      var n=0;
      try{ n=Snipcart.store.getState().cart.items.count||0; }catch(e){ return; }
      if(btn) btn.hidden = !(n>0);
      if(num) num.textContent = n;
      var qty={};
      cartItems().forEach(function(i){ qty[i.id]=(qty[i.id]||0)+(i.quantity||0); });
      document.dispatchEvent(new CustomEvent('wfs.cart', {detail:{count:n, qty:qty}}));
    }
    refresh();
    Snipcart.store.subscribe(refresh);
    if(btn) btn.onclick=window.wfsOpenCart;

    // The kit flag used to be an UPDATE on rsvps, which is revoked now. Recording
    // "who bought a kit" from this variant needs its own function; until then the
    // Snipcart order is the record of kit purchases.
  });
})();
