/* The basket drawer: review, edit, and finish. Present on every /v3/ page. */
(function(){
  var ovl=document.getElementById('bkOvl'), bk=document.getElementById('bk');
  if(!bk) return;
  var body=document.getElementById('bkBody'), foot=document.getElementById('bkFoot');
  var totEl=document.getElementById('bkTot'), goBtn=document.getElementById('bkGo');
  var form=document.getElementById('bkForm'), formLead=document.getElementById('bkFormLead');
  var nameEl=document.getElementById('bkName'), emailEl=document.getElementById('bkEmail');
  var msg=document.getElementById('bkMsg'), note=document.getElementById('bkNote');
  var done=document.getElementById('bkDone'), doneH=document.getElementById('bkDoneH'), doneP=document.getElementById('bkDoneP');
  var cartBtn=document.getElementById('cartBtn'), cartNum=document.getElementById('cartNum');

  function open(){
    done.hidden=true; foot.hidden=false; body.hidden=false;
    bk.hidden=false; ovl.hidden=false;
    requestAnimationFrame(function(){ bk.classList.add('on'); ovl.classList.add('on'); });
    render();
  }
  function close(){
    bk.classList.remove('on'); ovl.classList.remove('on');
    setTimeout(function(){ bk.hidden=true; ovl.hidden=true; }, 240);
  }
  window.wfsOpenBasket=open;
  document.getElementById('bkClose').onclick=close;
  document.getElementById('bkDoneClose').onclick=close;
  ovl.onclick=close;
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !bk.hidden) close(); });
  if(cartBtn) cartBtn.onclick=open;

  function money(n){ return '$'+n; }

  function render(){
    var B=window.wfsBasket, ls=B.lines(), tot=B.total();

    if(cartBtn){ cartBtn.hidden = !(B.count()>0); }
    if(cartNum){ cartNum.textContent = B.count(); }

    if(!ls.length){
      body.innerHTML='<p class="bk-empty">Nothing here yet.<br>Open a Field Day to register.</p>';
      totEl.innerHTML=''; form.hidden=true; goBtn.disabled=true;
      goBtn.textContent='Check out'; note.textContent='';
      return;
    }

    // The drawer reviews and removes; quantities are only ever set on the day
    // page, so there is no way to add from here.
    body.innerHTML = ls.map(function(l){
      var title = l.href
        ? '<a href="'+esc(l.href)+'">'+esc(l.name)+'</a>'
        : esc(l.name);
      // quantity leads the title — on the sub-line it wrapped in the narrow drawer
      var q = l.qty>1 ? '<span class="bkl-q">'+l.qty+' &times;</span> ' : '';
      return '<div class="bkline" data-id="'+l.id+'">'+
        '<span class="bkl-x"><b>'+q+title+'</b><small>'+esc(l.sub||'')+'</small></span>'+
        '<span class="bkl-p'+(l.price?'':' free')+'">'+
          (l.price ? money(l.price*l.qty) : 'Free')+'</span>'+
        '<button type="button" class="bkl-rm" data-id="'+l.id+'" '+
          'aria-label="Remove '+esc(l.name)+'" title="Remove">&times;</button>'+
        '</div>';
    }).join('');

    var free = tot===0;
    totEl.innerHTML = free
      ? '<span>Nothing to pay</span><b>Free</b>'
      : '<span>Total</span><b>'+money(tot)+'</b>';

    form.hidden = !free;
    formLead.textContent = 'Nothing to pay — just tell us who’s coming.';
    goBtn.disabled=false;
    goBtn.textContent = free ? 'Register — free' : 'Continue to payment';
    note.textContent = free
      ? 'No card, no checkout. We’ll email you the address. To change numbers, open the day.'
      : 'You’ll be asked for card details on the next step. To change numbers, open the day.';

    if(free){
      var who=window.wfsWho();
      if(who.name && !nameEl.value)  nameEl.value=who.name;
      if(who.email && !emailEl.value) emailEl.value=who.email;
    }
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  body.addEventListener('click', function(e){
    var rm=e.target.closest('.bkl-rm'); if(!rm) return;
    window.wfsBasket.set(rm.dataset.id, 0);
  });

  function say(t, bad){ msg.textContent=t||''; msg.className='bk-msg'+(bad?' bad':''); }

  goBtn.onclick=async function(){
    var B=window.wfsBasket;
    if(!B.lines().length) return;

    if(B.total()>0){
      goBtn.disabled=true; goBtn.textContent='One moment…';
      // Hand off to Snipcart's own cart — close ours first, or the two panels
      // stack and Snipcart's opens underneath, obscured.
      close();
      var r=await window.wfsPay();
      goBtn.disabled=false; goBtn.textContent='Continue to payment';
      if(!r.ok){
        // failed before payment could start — bring our panel back to say so
        open();
        say(r.error, true);
      }
      return;
    }

    // free basket: two fields, straight into Supabase, no Snipcart at all
    var name=nameEl.value.trim(), email=emailEl.value.trim();
    if(!name){ say('Please add a name so we know who to expect.', true); nameEl.focus(); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
      say('That email doesn’t look right — we need it to send you the address.', true);
      emailEl.focus(); return;
    }
    goBtn.disabled=true; goBtn.textContent='Registering…'; say('');
    var upd=document.getElementById('bkUpdates');
    var res=await window.wfsCommit(name, email, null, upd && upd.checked);
    goBtn.disabled=false; goBtn.textContent='Register — free';

    if(res.error){ say('Sorry — '+res.error, true); return; }

    // A day can fill between loading the page and pressing the button, so this
    // has to cope with some days landing and others not.
    if(res.failed && res.failed.length && !res.placed.length){
      var why=res.failed[0].msg;
      var human={
        duplicate:    'Looks like that just went through — check your email before trying again.',
        rate_limited: 'That is a lot of registrations from one address. Email us and we will sort it out.',
        too_busy:     'Things are unusually busy — give it a minute and try again.',
        bad_details:  'Please check the name and email.',
        bad_party:    'That number of people does not look right.',
        past:         'That Field Day has already happened.'
      }[why];
      say(human || ('Sorry — ' + why), true);
      return;
    }
    if(!res.placed.length && res.full.length){
      say(res.full.length===1
        ? 'That day filled up just now — nothing was taken.'
        : 'Those days filled up just now — nothing was taken.', true);
      render(); return;
    }

    // drop only what actually landed; anything full stays in the basket
    res.placedDates.forEach(function(d){
      B.lines().forEach(function(l){ if(l.date===d) B.set(l.id, 0); });
    });

    var people=res.placed.reduce(function(n,p){ return n+p.party; },0);
    doneH.textContent = people>1 ? 'You’re registered — '+people+' people' : 'You’re registered';
    var msg='Confirmation going to '+email+'. We’ll send the exact address before the day.';
    if(res.full.length){
      msg += ' ' + (res.full.length===1 ? 'One day' : res.full.length+' days') +
             ' filled up before we got there and stayed in your basket.';
    }
    doneP.textContent=msg;
    body.hidden=true; foot.hidden=true; done.hidden=false;
  };

  document.addEventListener('wfs.basket', function(){ if(!bk.hidden) render(); else render(); });
  render();
})();
