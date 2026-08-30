/* The per-day panel on /v3/: same shape as /v2/, but it fills our basket
   rather than Snipcart's cart. */
(function(){
  var panel=document.getElementById('tix');
  if(!panel) return;
  var rows=[].slice.call(panel.querySelectorAll('.trow'));
  var sumEl=document.getElementById('tixSum'), goBtn=document.getElementById('tixGo');
  var TITLE=panel.dataset.title, DATE=panel.dataset.date;

  function qtyOf(r){ return parseInt(r.querySelector('.qnum').textContent,10)||0; }
  function setQty(r,n){
    n=Math.max(0,Math.min(30,n));
    r.querySelector('.qnum').textContent=n;
    r.classList.toggle('on', n>0);
    r.querySelector('.qbtn[data-step="-1"]').disabled=(n===0);
  }

  /* The teach option asks for something in place of money, so the box appears
     with the first place chosen and the answer is remembered per day. */
  var teachRow=panel.querySelector('.trow[data-pid$="-teach"]');
  var teachBox=document.getElementById('teachBox');
  var teachWhat=document.getElementById('teachWhat');
  var teachMsg=document.getElementById('teachMsg');

  function syncTeach(){
    if(!teachRow||!teachBox) return;
    var want=qtyOf(teachRow)>0;
    teachBox.hidden=!want;
    if(!want && teachMsg) teachMsg.hidden=true;
  }
  if(teachWhat){
    teachWhat.value = (window.wfsGetTeach && window.wfsGetTeach(DATE)) || '';
    teachWhat.addEventListener('input', function(){
      if(window.wfsSetTeach) window.wfsSetTeach(DATE, teachWhat.value);
      if(teachMsg && teachWhat.value.trim()) teachMsg.hidden=true;
    });
  }

  function summarise(){
    var regs=0, kits=0, money=0;
    rows.forEach(function(r){
      var n=qtyOf(r), unit=parseInt(r.dataset.unit,10)||0;
      money+=n*unit;
      if(r.dataset.kind==='kit') kits+=n; else regs+=n;
    });
    var bits=[];
    if(regs) bits.push(regs+(regs===1?' registration':' registrations'));
    if(kits) bits.push(kits+(kits===1?' kit':' kits'));
    sumEl.innerHTML = (regs||kits)
      ? '<b>'+bits.join(' · ')+' · '+(money>0?'$'+money:'Free')+'</b><small>Added to your registrations</small>'
      : '<b>Nothing selected</b><small>Choose a registration above</small>';
    goBtn.disabled = !regs && !kits;
    return {regs:regs, kits:kits, money:money};
  }

  /* ---- capacity ----
   * The number here is a hint from session_counts; register() re-checks it
   * atomically at the moment of writing, so a stale page can't overbook.
   */
  var capEl=document.getElementById('tixCap');
  function regRows(){ return rows.filter(function(r){ return r.dataset.kind!=='kit'; }); }
  function regTotal(){ return regRows().reduce(function(n,r){ return n+qtyOf(r); },0); }

  function showCapacity(){
    var left=window.wfsRemaining(DATE);
    if(!capEl) return left;
    if(left===null){ capEl.textContent=''; capEl.className='tixcap'; return null; }
    if(left<=0){
      capEl.textContent='This day is full.';
      capEl.className='tixcap full';
    } else if(left<=3){
      capEl.textContent='Only '+left+(left===1?' spot':' spots')+' available.';
      capEl.className='tixcap low';
    } else {
      capEl.textContent=left+(left===1?' spot':' spots')+' available.';
      capEl.className='tixcap';
    }
    rows.forEach(function(r){
      if(r.dataset.kind==='kit') return;
      r.classList.toggle('soldout', left<=0);
      r.querySelector('.qbtn[data-step="1"]').disabled = (left<=0);
    });
    return left;
  }
  document.addEventListener('wfs.counts', function(){ showCapacity(); summarise(); });

  panel.addEventListener('click', function(e){
    var b=e.target.closest('.qbtn'); if(!b) return;
    var r=b.closest('.trow');
    var step=parseInt(b.dataset.step,10);

    // don't let the page offer more spots than the day has left
    if(step>0 && r.dataset.kind!=='kit'){
      var left=window.wfsRemaining(DATE);
      if(left!==null && regTotal()+1>left){
        window.wfsToast && window.wfsToast(
          left<=0 ? 'This day is full.' : 'Only '+left+' left for this day.');
        return;
      }
    }
    setQty(r, qtyOf(r)+step);
    syncTeach();
    summarise();
  });

  goBtn.onclick=function(){
    // a teach place with nothing offered is just a free place by another name
    if(teachRow && qtyOf(teachRow)>0 && teachWhat && !teachWhat.value.trim()){
      if(teachMsg) teachMsg.hidden=false;
      teachWhat.focus();
      return;
    }
    rows.forEach(function(r){
      window.wfsBasket.set(r.dataset.pid, qtyOf(r), {
        kind:  r.dataset.kind,
        date:  DATE,
        price: parseInt(r.dataset.unit,10)||0,
        name:  r.dataset.line,
        sub:   r.dataset.sub,
        label: panel.dataset.label,
        href:  location.pathname
      });
    });
    window.wfsOpenBasket();
  };

  // reflect what the basket already holds for this day
  function reflect(){
    var b=window.wfsBasket.read();
    var any=rows.some(function(r){ return (b[r.dataset.pid]||{}).qty>0; });
    if(any) rows.forEach(function(r){ setQty(r, (b[r.dataset.pid]||{}).qty||0); });
    syncTeach();
    summarise();
  }
  document.addEventListener('wfs.basket', reflect);

  rows.forEach(function(r){ setQty(r,0); });
  syncTeach();
  showCapacity();
  reflect();
})();
