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

  /* Every session by its KEY — the session file's name, "2026-11-06-farmtryout".
   * Two events can share a date, so anything that counts, registers or stores
   * per session is keyed by this; only "has it happened yet" goes by the date. */
  var SESSIONS={ {% for s in sessions %}{{ s.key | dump | safe }}:{date:"{{ s.date }}",label:{{ s.label | dump | safe }}}{% if not loop.last %},{% endif %}{% endfor %} };
  window.wfsSessions=function(){ return SESSIONS; };
  // the one session on a date, or null when there are none or several
  function soleKeyOn(date){
    var ks=Object.keys(SESSIONS).filter(function(k){ return SESSIONS[k].date===date; });
    return ks.length===1 ? ks[0] : null;
  }
  /* Which session a basket line belongs to. Lines written by this version
   * carry it; older ones are worked out from the id ("tix-KEY-TIER",
   * "kit-KEY"), or failing that from the date if only one event is on it. */
  function keyOf(l){
    if(!l) return null;
    if(l.key) return l.key;
    var m=/^(?:tix|kit)-(\d{4}-\d{2}-\d{2}-[a-z0-9-]+?)(?:-[^-]+)?$/.exec(l.id||'');
    if(m){
      // tix ids end in a tier, kit ids don't; try the longest reading first
      var whole=(l.id||'').slice(4);
      if(SESSIONS[whole]) return whole;
      if(SESSIONS[m[1]]) return m[1];
    }
    return soleKeyOn(l.date);
  }
  window.wfsKeyOf=keyOf;
  var KEY='wfs.basket.v1', WHO='wfs.who.v1', UPD='wfs.updates.v1', TEACH='wfs.teach.v1', LEARN='wfs.learn.v1';

  /* The updates checkbox lives in our drawer, but on the paid path the
   * registration is written later, at cart.confirmed — by which point Snipcart
   * may have re-rendered or reloaded the page and taken the DOM with it. So the
   * choice is persisted when it is made and read back at commit time. */
  window.wfsSetUpdates=function(on){
    try{ localStorage.setItem(UPD, on ? '1' : '0'); }catch(e){}
  };
  function storedUpdates(){
    try{ return localStorage.getItem(UPD)==='1'; }catch(e){ return false; }
  }

  /* What someone offered to teach, keyed by the session they registered for. Kept
   * out of the basket line so it survives the basket being re-rendered, and so
   * the paid path can still read it after Snipcart has been through the page. */
  function teachAll(){
    try{ return JSON.parse(localStorage.getItem(TEACH)||'{}'); }catch(e){ return {}; }
  }
  window.wfsSetTeach=function(key, text){
    var all=teachAll();
    if(text && text.trim()) all[key]=text.trim(); else delete all[key];
    try{ localStorage.setItem(TEACH, JSON.stringify(all)); }catch(e){}
  };
  // an offer saved by the previous version is under the bare date
  window.wfsGetTeach=function(key){
    var all=teachAll();
    return all[key] || (SESSIONS[key] && soleKeyOn(SESSIONS[key].date)===key
                        ? all[SESSIONS[key].date] : '') || '';
  };

  /* "What would you like to learn next?" — one answer per order, not per day.
   * Persisted for the same reason as the teach offers: on the paid path the
   * registration is written after Snipcart has been through the page. */
  window.wfsSetLearn=function(text){
    try{
      if(text && text.trim()) localStorage.setItem(LEARN, text.trim());
      else localStorage.removeItem(LEARN);
    }catch(e){}
  };
  window.wfsGetLearn=function(){
    try{ return localStorage.getItem(LEARN) || ''; }catch(e){ return ''; }
  };

  /* ---------------- past days ----------------
   * A static build bakes in the date it was built, so it cannot be trusted to
   * know what "today" is. Decide in the browser instead, against the visitor's
   * actual clock — and register() refuses past dates as well, because a clock
   * in a browser is not a control.
   */
  window.wfsIsPast=function(date){
    if(!date) return false;
    var now=new Date();
    var today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+
              '-'+String(now.getDate()).padStart(2,'0');
    return date < today;
  };

  /* ---------------- capacity ----------------
   * session_counts is a public view — capacity, how many are taken, how many
   * remain. Read for display only; the real enforcement is inside register(),
   * which counts and inserts atomically under a row lock. A number on a page
   * can always be stale, so the UI treats this as a hint, not a gate.
   */
  var COUNTS={};                         // by session key
  window.wfsCounts=function(){ return COUNTS; };
  window.wfsRemaining=function(key){
    var c=COUNTS[key];
    return c ? c.remaining : null;      // null = unknown, don't block on it
  };
  window.wfsRefreshCounts=async function(){
    if(!sb) return COUNTS;
    try{
      var r=await sb.from('session_counts').select('key,date,capacity,taken,remaining,min_to_run');
      if(r.error){ console.error('[wfs] counts', r.error); return COUNTS; }
      COUNTS={};
      // a row with no key predates keys and matches no session on the page
      (r.data||[]).forEach(function(row){ if(row.key) COUNTS[row.key]=row; });
      document.dispatchEvent(new CustomEvent('wfs.counts', {detail:COUNTS}));
    }catch(e){ console.error('[wfs] counts threw', e); }
    return COUNTS;
  };

  /* ---------------- store ---------------- */

  function read(){
    try{ var b=JSON.parse(localStorage.getItem(KEY)||'{}'); return (b && typeof b==='object') ? b : {}; }
    catch(e){ return {}; }
  }
  /* A basket saved before session keys: give each line its key, and rename the
   * old "kit-DATE" ids to "kit-KEY" so they still find their Snipcart product.
   * A line whose session can't be told (a kit on a two-event date) is dropped
   * rather than guessed — it would otherwise land on the wrong event. */
  (function upgrade(){
    var b=read(), out={}, changed=false;
    Object.keys(b).forEach(function(id){
      var l=b[id]; if(!l || typeof l!=='object'){ changed=true; return; }
      if(l.key){ out[id]=l; return; }
      l.id=id;
      var k=keyOf(l); changed=true;
      if(!k) return;
      var nid=/^kit-\d{4}-\d{2}-\d{2}$/.test(id) ? 'kit-'+k : id;
      delete l.id;
      out[nid]=Object.assign({}, l, {key:k});
    });
    if(changed){ try{ localStorage.setItem(KEY, JSON.stringify(out)); }catch(e){} }
  })();
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

  // basket is {lineId: {qty, kind, key, date, label, price, name}}
  function lines(b){
    b=b||read();
    return Object.keys(b).map(function(k){ var l=b[k]; l.id=k; return l; })
      .sort(function(x,y){
        return ((keyOf(x)||x.date)+x.kind).localeCompare((keyOf(y)||y.date)+y.kind);
      });
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
  // people can't both take the last spot. One call per SESSION in the basket —
  // two events on one day are two calls, each against its own capacity.
  // "tix-2026-11-06-farmtryout-standard" (or the older "tix-2026-08-19-standard") -> "standard"
  function tierOf(id){
    var m=/^tix-\d{4}-\d{2}-\d{2}-(?:[a-z0-9-]+-)?([^-]+)$/.exec(id||'');
    return m ? m[1] : null;
  }

  window.wfsCommit=async function(name, email, orderToken, wantsUpdates){
    // the paid path calls this from the order handler with no flag
    if(wantsUpdates===undefined || wantsUpdates===null) wantsUpdates=storedUpdates();
    if(!sb) return {ok:false, error:'Supabase did not load.'};

    // how many kits per session, not merely whether any
    var kitCounts={}, kitAmount={};
    lines().forEach(function(l){
      var k=keyOf(l);
      if(l.kind==='kit' && l.qty>0 && k){
        kitCounts[k]=(kitCounts[k]||0)+l.qty;
        kitAmount[k]=(kitAmount[k]||0)+l.qty*(l.price||0);
      }
    });

    // per session: headcount, what the registrations cost, which tier was picked
    var byKey={}, amount={}, tier={}, dateOf={};
    lines().filter(function(l){ return l.kind==='reg'; })
           .forEach(function(l){
             var k=keyOf(l);
             if(!k){ console.warn('[wfs] basket line with no session', l); return; }
             dateOf[k]=(SESSIONS[k] && SESSIONS[k].date) || l.date;
             byKey[k]=(byKey[k]||0)+l.qty;
             amount[k]=(amount[k]||0)+l.qty*(l.price||0);
             // if several tiers are mixed for one session, record the paid one
             var tr=tierOf(l.id);
             if(tr && (!tier[k] || l.price>0)) tier[k]=tr;
           });

    var keys=Object.keys(byKey).sort();
    if(!keys.length) return {ok:true, placed:[], full:[], failed:[], placedKeys:[], placedDates:[]};

    var placed=[], full=[], failed=[];
    for(var i=0;i<keys.length;i++){
      var k=keys[i], d=dateOf[k];
      var res;
      try{
        res=await sb.rpc('register', {
          p_key:k, p_date:d, p_name:name, p_email:email,
          p_party:byKey[k],
          p_kit:!!kitCounts[k],
          p_kits:kitCounts[k]||0,
          // mirrored so Supabase alone can answer "what is this person owed?"
          p_meta:{
            tier:        tier[k] || 'free',
            amount:      amount[k] || 0,
            kit_amount:  kitAmount[k] || 0,
            order_token: orderToken || null,
            updates:     !!wantsUpdates,
            teach:       window.wfsGetTeach(k) || null,
            learn_next:  window.wfsGetLearn() || null
          }
        });
      }catch(e){ failed.push({key:k, date:d, msg:String(e)}); continue; }

      if(res.error){ failed.push({key:k, date:d, msg:res.error.message}); continue; }
      var out=res.data||{};
      if(out.ok) placed.push({key:k, date:d, party:byKey[k]});
      else if(out.reason==='full') full.push({key:k, date:d, remaining:out.remaining});
      else failed.push({key:k, date:d, msg:out.reason||'unknown'});
    }

    if(placed.length) rememberWho(name, email);

    /* One list. The rsvps.wants_updates flag records what this person chose at
     * this registration; `subscribers` is what actually gets mailed, so the
     * opt-in has to land there too or ticking the box does nothing useful.
     * Best-effort: a failure here must never fail the registration. */
    if(placed.length && wantsUpdates){
      try{
        await sb.rpc('subscribe', {
          p_email: email, p_name: name, p_meta:{ source:'registration' }
        });
      }catch(e){ console.warn('[wfs] newsletter opt-in did not save', e); }
      try{ localStorage.removeItem(UPD); }catch(e){}
    }
    if(placed.length){ try{ localStorage.removeItem(LEARN); }catch(e){} }
    if(placed.length){
      var left=teachAll();
      placed.forEach(function(p){ delete left[p.key]; delete left[p.date]; });
      try{ localStorage.setItem(TEACH, JSON.stringify(left)); }catch(e){}
    }

    await window.wfsRefreshCounts();

    return {
      ok: placed.length>0 && !full.length && !failed.length,
      placed: placed, full: full, failed: failed,
      // lines to drop from the basket: the sessions that actually landed
      placedKeys: placed.map(function(p){ return p.key; }),
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
    var wanted={}; paid.forEach(function(l){
      var d=defItem('def-'+l.id);
      if(d) wanted[d.id]=(wanted[d.id]||0)+l.qty;
    });
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
    // I have now guessed the event name twice. Bind every plausible candidate —
    // the idempotency guard makes duplicates harmless — and log whatever fires,
    // so the next diagnosis comes from evidence rather than from me reasoning
    // about what the API probably does.
    ['cart.confirmed','order.completed','order.placed','payment.succeeded',
     'cart.checkout.completed','order.status.changed'].forEach(function(ev){
      try{
        Snipcart.events.on(ev, function(payload){
          console.log('[wfs] snipcart event fired:', ev, payload);
          try{ localStorage.setItem('wfs.lastEvent', ev + ' @ ' + new Date().toISOString()); }catch(e){}
          return onOrder(payload);
        });
      }catch(e){ console.warn('[wfs] could not bind', ev, e); }
    });

    // Belt to the events: watch the store directly. Whatever Snipcart calls the
    // moment of confirmation, the cart ends up carrying an order token — when we
    // see one we haven't recorded, register from it.
    try{
      Snipcart.store.subscribe(function(){
        var s; try{ s=Snipcart.store.getState(); }catch(e){ return; }
        var c=s && s.cart;
        var tok=c && (c.token || c.invoiceNumber);
        var done=c && (c.status==='Processed' || c.confirmed || s.order);
        if(tok && done) onOrder(c);
      });
    }catch(e){ console.warn('[wfs] could not subscribe to the store', e); }

    // And say plainly in the console what this page is watching for.
    console.log('[wfs] order handler armed. After a checkout, run:  ' +
                'localStorage.getItem("wfs.lastEvent")');
  });

  announce();
  if(sb) window.wfsRefreshCounts();
})();
