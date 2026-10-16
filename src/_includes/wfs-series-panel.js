/* The series sign-up page: the same job as wfs-day-panel.js, but for several
   dates at once. Each .tix[data-date] is one date's panel with its own
   capacity; one tixbar adds everything chosen to the basket in one go. */
(function(){
  var panels=[].slice.call(document.querySelectorAll('.tix[data-date]'));
  var UNIT=window.WFS_SERIES_UNIT||'day';   // e.g. "Friday", set by series.njk
  if(!panels.length) return;
  var sumEl=document.getElementById('tixSum'), goBtn=document.getElementById('tixGo');
  var teachBox=document.getElementById('teachBox');
  var teachWhat=document.getElementById('teachWhat');
  var teachMsg=document.getElementById('teachMsg');

  function rowsOf(p){ return [].slice.call(p.querySelectorAll('.trow')); }
  function qtyOf(r){ return parseInt(r.querySelector('.qnum').textContent,10)||0; }
  function setQty(r,n){
    n=Math.max(0,Math.min(30,n));
    r.querySelector('.qnum').textContent=n;
    r.classList.toggle('on', n>0);
    r.querySelector('.qbtn[data-step="-1"]').disabled=(n===0);
  }
  function regTotal(p){ return rowsOf(p).reduce(function(n,r){ return n+qtyOf(r); },0); }
  function teachRows(){ return [].slice.call(document.querySelectorAll('.tix .trow[data-pid$="-teach"]')); }

  // A date that has passed keeps its heading but can't be chosen.
  panels.forEach(function(p){
    if(window.wfsIsPast && window.wfsIsPast(p.dataset.date)){
      p.classList.add('past');
      rowsOf(p).forEach(function(r){ r.remove(); });
      p.querySelector('.tixcap').textContent='This '+UNIT+' has passed.';
    }
  });
  panels=panels.filter(function(p){ return !p.classList.contains('past'); });

  function syncTeach(){
    if(!teachBox) return;
    var want=teachRows().some(function(r){ return qtyOf(r)>0; });
    teachBox.hidden=!want;
    if(!want && teachMsg) teachMsg.hidden=true;
  }
  if(teachWhat){
    // pre-fill from whatever was offered for any of these dates before
    panels.some(function(p){
      var t=window.wfsGetTeach && window.wfsGetTeach(p.dataset.date);
      if(t){ teachWhat.value=t; return true; }
    });
    teachWhat.addEventListener('input', function(){
      if(teachMsg && teachWhat.value.trim()) teachMsg.hidden=true;
    });
  }

  function summarise(){
    var regs=0, days=0, money=0;
    panels.forEach(function(p){
      var n=0;
      rowsOf(p).forEach(function(r){
        var q=qtyOf(r); n+=q; money+=q*(parseInt(r.dataset.unit,10)||0);
      });
      regs+=n; if(n) days++;
    });
    sumEl.innerHTML = regs
      ? '<b>'+regs+(regs===1?' registration':' registrations')+' · '+days+(days===1?' '+UNIT:' '+UNIT+'s')+' · '+(money>0?'$'+money:'Free')+'</b><small>Added to your registrations</small>'
      : '<b>Nothing selected</b><small>Choose a registration above</small>';
    goBtn.disabled=!regs;
  }

  // capacity is per date; register() re-checks it atomically, this is a hint
  function showCapacity(){
    panels.forEach(function(p){
      var left=window.wfsRemaining(p.dataset.date), cap=p.querySelector('.tixcap');
      if(left===null){ cap.textContent=''; cap.className='tixcap'; return; }
      if(left<=0){ cap.textContent='This '+UNIT+' is full.'; cap.className='tixcap full'; }
      else if(left<=3){ cap.textContent='Only '+left+(left===1?' spot':' spots')+' available.'; cap.className='tixcap low'; }
      else { cap.textContent=left+(left===1?' spot':' spots')+' available.'; cap.className='tixcap'; }
      rowsOf(p).forEach(function(r){
        r.classList.toggle('soldout', left<=0);
        r.querySelector('.qbtn[data-step="1"]').disabled=(left<=0);
      });
    });
  }
  document.addEventListener('wfs.counts', function(){ showCapacity(); summarise(); });

  panels.forEach(function(p){
    p.addEventListener('click', function(e){
      var b=e.target.closest('.qbtn'); if(!b) return;
      var r=b.closest('.trow'), step=parseInt(b.dataset.step,10);
      if(step>0){
        var left=window.wfsRemaining(p.dataset.date);
        if(left!==null && regTotal(p)+1>left){
          window.wfsToast && window.wfsToast(left<=0 ? 'This '+UNIT+' is full.' : 'Only '+left+' left for this '+UNIT+'.');
          return;
        }
      }
      setQty(r, qtyOf(r)+step);
      syncTeach();
      summarise();
    });
  });

  goBtn.onclick=function(){
    var teaching=teachRows().filter(function(r){ return qtyOf(r)>0; });
    if(teaching.length && teachWhat && !teachWhat.value.trim()){
      if(teachMsg) teachMsg.hidden=false;
      teachWhat.focus();
      return;
    }
    // Read every quantity before writing any: each set() announces the basket,
    // and reflect() then redraws the rows from it — so rows not yet written
    // would be zeroed before their turn.
    var plan=panels.map(function(p){ return rowsOf(p).map(qtyOf); });
    panels.forEach(function(p, pi){
      var date=p.dataset.date;
      rowsOf(p).forEach(function(r, ri){
        if(/-teach$/.test(r.dataset.pid) && plan[pi][ri]>0 && teachWhat && window.wfsSetTeach){
          window.wfsSetTeach(date, teachWhat.value);
        }
        window.wfsBasket.set(r.dataset.pid, plan[pi][ri], {
          kind:  r.dataset.kind,
          date:  date,
          price: parseInt(r.dataset.unit,10)||0,
          name:  r.dataset.line,
          sub:   r.dataset.sub,
          label: p.dataset.label,
          href:  location.pathname
        });
      });
    });
    window.wfsOpenBasket();
  };

  // reflect what the basket already holds for these dates
  function reflect(){
    var b=window.wfsBasket.read();
    panels.forEach(function(p){
      rowsOf(p).forEach(function(r){ setQty(r, (b[r.dataset.pid]||{}).qty||0); });
    });
    syncTeach();
    summarise();
  }
  document.addEventListener('wfs.basket', reflect);

  panels.forEach(function(p){ rowsOf(p).forEach(function(r){ setQty(r,0); }); });
  showCapacity();
  reflect();
})();
