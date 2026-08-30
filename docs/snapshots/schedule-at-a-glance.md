# "At a glance" schedule list — parked 2026-08-30

A compact list of upcoming Field Days that sat above the full cards on the
homepage: month heading, then one slim row per day (date · topic, with time and
place underneath) linking down to that day's card.

**Why it was removed.** With three or four days listed it duplicated the cards
directly beneath it without adding much. It earns its place once there are
enough days that scanning the cards is work — roughly **five or more**.

**How to bring it back.** Probably not as-is. The better shape is likely its own
**"This Month At a Glance"** section rather than a preamble to the cards, and it
should probably appear conditionally — `{% if sessions.length >= 5 %}`.

Live at commit `4e00478`; `git show 4e00478:src/index.njk` has it in place.

---

## Markup

Sat inside `#schedule`, between the `#noDays` paragraph and `.daycards`.
The nested-loop shape is a Nunjucks workaround for grouping by month without a
groupby filter — it opens a `.glance-wk` on each month change and closes the
previous one.

```njk
    <div class="glance">
      {%- set shown = "" %}
      {%- for s in sessions %}
      {%- if s.month != shown %}
        {%- if shown != "" %}
      </div>
        {%- endif %}
      <div class="glance-wk" data-month="{{ s.month }}">
        <span class="glance-month">{{ s.month }}</span>
        {%- set shown = s.month %}
      {%- endif %}
        <a class="glance-row" href="#day-{{ s.date }}">
          <span class="g-main"><span class="g-date">{{ s.day }}</span><span class="g-proj">{{ s.short }}</span></span>
          <span class="g-when">{{ s.time }} · {{ s.place }}</span>
        </a>
      {%- endfor %}
      </div>
    </div>
```

## CSS

```css
  .glance{max-width:680px;margin:4px auto 24px}
  .glance-wk{margin-bottom:18px}
  .glance-wk:last-child{margin-bottom:0}
  .glance-month{display:block;text-align:center;font-size:1.24rem;font-weight:800;color:var(--accent-d);margin:0 0 8px}
  @media(max-width:560px){.glance-month{font-size:1.12rem}}
  .glance-row{display:block;padding:9px 12px;margin-bottom:8px;border:1px solid #cdb684;border-radius:10px;background:var(--card);text-decoration:none;color:var(--ink);transition:.12s}
  .glance-row:last-child{margin-bottom:0}
  .glance-row:hover{border-color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,.07)}
  .glance-row .g-main{display:flex;gap:12px;align-items:baseline}
  .glance-row .g-date{font-weight:600;color:var(--muted);white-space:nowrap;font-size:.82rem;flex:0 0 106px}
  .glance-row .g-proj{font-size:.98rem;font-weight:800;color:var(--accent-d);min-width:0}
  .glance-row .g-when{display:block;font-size:.78rem;color:var(--muted);margin-top:2px;padding-left:118px}
  @media(max-width:520px){
    .glance-row .g-date{flex-basis:92px}
    .glance-row .g-when{padding-left:0}
  }
{% include "wfs-panel.css" %}
```

## The past-day filter

Lived alongside the `.daycard2` filter. It hid rows for days that had passed,
then hid a month heading once all of its rows were gone.

```js
    document.querySelectorAll('.glance-row').forEach(function(a){
      var m=/(\d{4}-\d{2}-\d{2})/.exec(a.getAttribute('href')||'');
      if(m && window.wfsIsPast(m[1])) a.style.display='none';
    });
    document.querySelectorAll('.glance-wk').forEach(function(w){
      if(!w.querySelector('.glance-row:not([style*="none"])')) w.style.display='none';
    });
```

**One trap if you restore it:** that regex reads the date out of the `href`.
The rows once linked to `/w/<slug>/<date>/` and were changed to `#day-<date>`;
a pattern expecting slashes stopped matching and a past day reappeared on the
live site. Whatever the href becomes, check this still matches it.
