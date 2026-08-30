/* Newsletter signup.
 *
 * Writes through the subscribe() function rather than inserting into
 * `subscribers` directly — the table is closed to the publishable key, exactly
 * like rsvps. The function validates the address, de-duplicates
 * case-insensitively, and clears a previous unsubscribe if the same person
 * comes back.
 *
 * Degrades to the mailto link in the markup if JavaScript or the Supabase
 * client is unavailable, so the form is never a dead end.
 */
(function () {
  var form = document.getElementById('subForm');
  if (!form) return;

  var sb = window.supabase
    ? supabase.createClient('https://jhgcnqmzbphzpxgtojti.supabase.co',
                            'sb_publishable_VjYvl7U-fWJO0st6R6W7gg_ep7SNTn6')
    : null;

  var email = document.getElementById('subEmail');
  var name  = document.getElementById('subName');
  var btn   = document.getElementById('subBtn');
  var msg   = document.getElementById('subMsg');

  function say(text, kind) {
    msg.textContent = text;
    msg.className = 'submsg' + (kind ? ' ' + kind : '');
    msg.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var addr = (email.value || '').trim();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      say('That address doesn’t look right — mind checking it?', 'bad');
      email.focus();
      return;
    }
    if (!sb) {
      say('Couldn’t reach the server. Email us instead and we’ll add you.', 'bad');
      return;
    }

    btn.disabled = true;
    var was = btn.textContent;
    btn.textContent = 'Signing up…';

    sb.rpc('subscribe', {
      p_email: addr,
      p_name: (name.value || '').trim() || null,
      p_meta: { source: 'homepage' }
    }).then(function (res) {
      btn.disabled = false;
      btn.textContent = was;

      if (res.error) {
        say('Something went wrong at our end. Email us and we’ll add you by hand.', 'bad');
        return;
      }
      var d = res.data || {};
      if (d.ok) {
        form.reset();
        say('You’re on the list — we’ll write when new Field Days go up.', 'good');
        return;
      }
      say(d.reason === 'bad_email'
            ? 'That address doesn’t look right — mind checking it?'
            : 'Too many signups at once. Try again in a minute?', 'bad');
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = was;
      say('Couldn’t reach the server. Email us instead and we’ll add you.', 'bad');
    });
  });
})();
