/* /v3/ — the basket is ours, Snipcart is only a payment step.
 *
 * Every line the visitor picks lives in localStorage. At checkout we look at the
 * total: a basket with no money in it is written straight to Supabase behind a
 * two-field form, and Snipcart is never loaded into the flow. A basket with any
 * money in it is mirrored into Snipcart, and the Supabase rows are written from
 * our basket when the order completes — so free lines riding along in a paid
 * basket are recorded too.
 */
(function(){
  var sb = window.supabase
    ? supabase.createClient('https://jhgcnqmzbphzpxgtojti.supabase.co',
                            'sb_publishable_VjYvl7U-fWJO0st6R6W7gg_ep7SNTn6')
    : null;

  var SESSIONS={ {% for s in sessions %}"{{ s.date }}":{{ s.label | dump | safe }}{% if not loop.last %},{% endif %}{% endfor %} };
  var KEY='wfs.basket.v1', WHO='wfs.who.v1';

  /* ---------------- capacity ----------------
   * session_counts is a public view — capacity, how many are taken, how many
   * remain. Read for display only; the real enforcement is inside register(),
   * which counts and inserts atomically under a row lock. A number on a page
   * can always be stale, so the UI treats this as a hint, not a gate.
   */
  var COUNTS={};
  window.wfsCounts=function(){ return COUNTS; };
  window.wfsRemaining=function(date){
    var c=COUNTS[date];
    return c ? c.remaining : null;      // null = unknown, don't block on it
  };
  window.wfsRefreshCounts=async function(){
    if(!sb) return COUNTS;
    try{
      var r=await sb.from('session_counts').select('date,capacity,taken,remaining,min_to_run');
      if(r.error){ console.error('[wfs] counts', r.error); return COUNTS; }
      COUNTS={};
      (r.data||[]).forEach(function(row){ COUNTS[row.date]=row; });
      document.dispatchEvent(new CustomEvent('wfs.counts', {detail:COUNTS}));
    }catch(e){ console.error('[wfs] counts threw', e); }
    return COUNTS;
  };

  /* ---------------- store ---------------- */

  function read(){
    try{ var b=JSON.parse(localStorage.getItem(KEY)||'{}'); return (b && typeof b==='object') ? b : {}; }
    catch(e){ return {}; }
  }
  function write(b){
    try{ localStorage.setItem(KEY, JSON.stringify(b)); }catch(e){}
    announce();
  }
  function announce(){
    var b=read();
    document.dispatchEvent(new CustomEvent('wfs.basket', {detail:{
      lines: lines(b), count: count(b), total: total(b), qty: b
    }}));
  }

  // basket is {lineId: {qty, kind, date, label, price, name}}
  function lines(b){
    b=b||read();
    return Object.keys(b).map(function(k){ var l=b[k]; l.id=k; return l; })
      .sort(function(x,y){ return (x.date+x.kind).localeCompare(y.date+y.kind); });
  }
  function count(b){ return lines(b).reduce(function(n,l){ return n+l.qty; },0); }
  function total(b){ return lines(b).reduce(function(n,l){ return n+l.qty*l.price; },0); }

  window.wfsBasket={
    read:read, lines:lines, count:count, total:total,
    qtyOf:function(id){ var l=read()[id]; return l?l.qty:0; },
    set:function(id, qty, meta){
      var b=read();
      if(qty<=0) delete b[id];
      else b[id]=Object.assign({}, meta||b[id]||{}, {qty:qty});
      write(b);
    },
    clear:function(){ try{ localStorage.removeItem(KEY); }catch(e){} announce(); },
    announce:announce
  };

  window.wfsWho=function(){
    try{ return JSON.parse(localStorage.getItem(WHO)||'{}'); }catch(e){ return {}; }
  };
  function rememberWho(n,e){
    try{ localStorage.setItem(WHO, JSON.stringify({name:n,email:e})); }catch(e){}
  }

  /* ---------------- writing the roster ---------------- */

  // Registration goes through the register() function rather than a direct
  // insert: it re-checks capacity and writes in one locked transaction, so two
  // people can't both take the last spot. One call per day in the basket.
  // "tix-2026-08-19-standard" -> "standard"
  function tierOf(id){
    var m=/^tix-\d{4}-\d{2}-\d{2}-(.+)$/.exec(id||'');
    return m ? m[1] : null;
  }

  window.wfsCommit=async function(name, email, orderToken){
    if(!sb) return {ok:false, error:'Supabase did not load.'};

    // how many kits per day, not merely whether any
    var kitCounts={};
    lines().forEach(function(l){
      if(l.kind==='kit' && l.qty>0) kitCounts[l.date]=(kitCounts[l.date]||0)+l.qty;
    });

    // per day: headcount, what the registrations cost, and which tier was picked
    var byDate={}, amount={}, tier={};
    lines().filter(function(l){ return l.kind==='reg'; })
           .forEach(function(l){
             byDate[l.date]=(byDate[l.date]||0)+l.qty;
             amount[l.date]=(amount[l.date]||0)+l.qty*(l.price||0);
             // if several tiers are mixed for one day, record the paid one
             var tr=tierOf(l.id);
             if(tr && (!tier[l.date] || l.price>0)) tier[l.date]=tr;
           });
    var kitAmount={};
    lines().forEach(function(l){
      if(l.kind==='kit' && l.qty>0)
        kitAmount[l.date]=(kitAmount[l.date]||0)+l.qty*(l.price||0);
    });

    var dates=Object.keys(byDate).sort();
    if(!dates.length) return {ok:true, placed:[], full:[], failed:[]};

    var placed=[], full=[], failed=[];
    for(var i=0;i<dates.length;i++){
      var d=dates[i];
      var res;
      try{
        res=await sb.rpc('register', {
          p_date:d, p_name:name, p_email:email,
          p_party:byDate[d],
          p_kit:!!kitCounts[d],
          p_kits:kitCounts[d]||0,
          // mirrored so Supabase alone can answer "what is this person owed?"
          p_meta:{
            tier:        tier[d] || 'free',
            amount:      amount[d] || 0,
            kit_amount:  kitAmount[d] || 0,
            order_token: orderToken || null
          }
        });
      }catch(e){ failed.push({date:d, msg:String(e)}); continue; }

      if(res.error){ failed.push({date:d, msg:res.error.message}); continue; }
      var out=res.data||{};
      if(out.ok) placed.push({date:d, party:byDate[d]});
      else if(out.reason==='full') full.push({date:d, remaining:out.remaining});
      else failed.push({date:d, msg:out.reason||'unknown'});
    }

    if(placed.length) rememberWho(name, email);
    await window.wfsRefreshCounts();

    return {
      ok: placed.length>0 && !full.length && !failed.length,
      placed: placed, full: full, failed: failed,
      // lines to drop from the basket: the days that actually landed
      placedDates: placed.map(function(p){ return p.date; })
    };
  };

  /* ---------------- Snipcart, for paid baskets only ---------------- */

  function snipItems(){
    try{ return Snipcart.store.getState().cart.items.items || []; }catch(e){ return []; }
  }
  function defItem(defId){
    var el=document.getElementById(defId);
    if(!el) { console.error('[wfs] no product definition', defId); return null; }
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
  async function setSnipQty(defId, qty){
    var item=defItem(defId); if(!item) return false;
    var hit=snipItems().filter(function(i){ return i.id===item.id; })[0];
    try{
      if(qty<=0){ if(hit) await Snipcart.api.cart.items.remove(hit.uniqueId); }
      else if(hit){ await Snipcart.api.cart.items.update({uniqueId:hit.uniqueId, quantity:qty}); }
      else { item.quantity=qty; await Snipcart.api.cart.items.add(item); }
      return true;
    }catch(e){ console.error('[wfs] snipcart write failed', defId, qty, e); return false; }
  }

  // Push the paid half of the basket into Snipcart and open its checkout.
  window.wfsPay=async function(){
    if(!window.Snipcart || !Snipcart.api){ return {ok:false, error:'Payment is still loading — try again in a moment.'}; }
    var paid=lines().filter(function(l){ return l.price>0; });
    // clear anything stale first, then mirror exactly what's in our basket
    var wanted={}; paid.forEach(function(l){ wanted[l.id]=l.qty; });
    var existing=snipItems();
    for(var i=0;i<existing.length;i++){
      if(!wanted[existing[i].id]){
        try{ await Snipcart.api.cart.items.remove(existing[i].uniqueId); }catch(e){}
      }
    }
    for(var j=0;j<paid.length;j++){
      if(!(await setSnipQty('def-'+paid[j].id, paid[j].qty))){
        return {ok:false, error:'Could not hand that to the payment step.'};
      }
    }
    try{ Snipcart.api.theme.cart.open(); }catch(e){}
    return {ok:true};
  };

  document.addEventListener('snipcart.ready', function(){
    if(!window.Snipcart) return;

    // Snipcart v3 fires cart.confirmed; order.completed is the v2 name and never
    // fires here — which is why a completed order wrote nothing. Listen for both,
    // and make the handler idempotent so a double-fire can't double-register.
    function orderSeen(token){
      if(!token) return false;
      try{
        var done=JSON.parse(localStorage.getItem('wfs.orders.done')||'[]');
        if(done.indexOf(token)>=0) return true;
        done.push(token);
        localStorage.setItem('wfs.orders.done', JSON.stringify(done.slice(-50)));
      }catch(e){}
      return false;
    }

    // A paid order also carries whatever free lines were in the basket.
    async function onOrder(order){
      try{
        var email=(order && (order.email || (order.user && order.user.email))) || '';
        var name='';
        try{ name=(order.billingAddress && order.billingAddress.fullName) || order.cardHolderName || ''; }catch(e){}
        if(!email) return;
        var token=(order && (order.token || order.invoiceNumber)) || null;
        if(orderSeen(token)) return;
        var res=await window.wfsCommit(name, email, token);
        if(res.placed && res.placed.length) window.wfsBasket.clear();
        if(res.full && res.full.length){
          console.warn('[wfs] paid order completed but these days were full:', res.full);
        }
      }catch(e){ console.error('[wfs] post-order commit threw', e); }
    }
    ['cart.confirmed','order.completed'].forEach(function(ev){
      try{ Snipcart.events.on(ev, onOrder); }catch(e){}
    });
  });

  announce();
  if(sb) window.wfsRefreshCounts();
})();
