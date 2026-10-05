/* Project SPEAR — analyst report renderer (shared by report.html and the dashboard's View Details).
   The four questions the analyst answers for Meta come first:
     Q1 Can you describe this image?   Q2 Is it a violation (e.g. antisemitic)?
     Q3 Why did Meta's AI miss it?     Q4 Could GIPECAI Project SPEAR have captured it?
   Then: designation check, operational takeaways, how to use this capture, evidence record. */
(function () {
  var CSS = '.sr{color:#1b2533;font:14.5px/1.6 Helvetica,Arial,sans-serif}' +
    '.sr .tag{display:inline-block;font:700 10.5px/1 Helvetica;letter-spacing:1.2px;color:#b42318;border:1.5px solid #b42318;padding:4px 7px;border-radius:3px}' +
    '.sr h1{font-size:26px;color:#0f2a5c;margin:10px 0 2px;letter-spacing:.5px}' +
    '.sr .sub{color:#5b6678;margin:0 0 14px}' +
    '.sr .meta{display:grid;grid-template-columns:110px 1fr 110px 1fr;gap:4px 12px;font-size:13px;border-top:2px solid #0f2a5c;border-bottom:1px solid #dfe5ee;padding:9px 0;margin-bottom:18px}' +
    '.sr .meta .k{color:#5b6678}' +
    '.sr h2{font-size:17px;color:#0f2a5c;border-bottom:2px solid #0f2a5c;padding-bottom:4px;margin:26px 0 10px}' +
    '.sr h2 .qn{display:inline-block;background:#0f2a5c;color:#fff;border-radius:4px;padding:1px 7px;margin-right:8px;font-size:14px}' +
    '.sr h3{font-size:15px;margin:16px 0 6px}' +
    '.sr .imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:6px 0 4px}' +
    '.sr .imgs figure{margin:0;border:1px solid #dfe5ee;border-radius:6px;padding:6px;background:#f5f7fb}' +
    '.sr .imgs img{width:100%;border-radius:4px;display:block}' +
    '.sr .imgs figcaption{font-size:10.5px;color:#5b6678;margin-top:4px;word-break:break-all}' +
    '.sr .ib{border-left:4px solid #1f5fd6;background:#f5f7fb;padding:10px 14px;margin:10px 0;border-radius:0 6px 6px 0}' +
    '.sr .ib .t{font-weight:700;color:#0f2a5c}.sr .ib ul{margin:6px 0 0;padding-left:18px}.sr .ib li{margin:3px 0}' +
    '.sr .combined{background:#fff4f2;border:1px solid #f3c9c3;padding:10px 14px;border-radius:6px;font-weight:700;margin:12px 0}' +
    '.sr ol.n{padding-left:20px}.sr ol.n li{margin:8px 0}' +
    '.sr .verdict{font-size:16px;font-weight:700;padding:10px 14px;border-radius:6px;margin:8px 0}' +
    '.sr .verdict.yes{background:#fdecea;color:#b42318}.sr .verdict.no{background:#e9f7ef;color:#1f7a4d}.sr .verdict.bl{background:#fff6e5;color:#a15c07}' +
    '.sr .verdict.cap{background:#eaf1ff;color:#1f4fb8}' +
    '.sr .tac,.sr .des{border:1px solid #dfe5ee;border-radius:6px;padding:10px 14px;margin:10px 0}' +
    '.sr .tac .t{font-weight:700;color:#0f2a5c;margin-bottom:4px}.sr .lab{font-weight:700}' +
    '.sr .conf{display:inline-block;font:700 10.5px Helvetica;padding:3px 7px;border-radius:10px;margin-left:6px;vertical-align:1px}' +
    '.sr .conf.documented{background:#e9f7ef;color:#1f7a4d}.sr .conf.reported{background:#fff6e5;color:#a15c07}.sr .conf.not{background:#eef1f6;color:#5b6678}' +
    '.sr .kv{display:grid;grid-template-columns:150px 1fr;gap:5px 12px;font-size:13px}.sr .kv>div:nth-child(odd){color:#5b6678}' +
    '.sr .note{color:#5b6678;font-size:12px}' +
    '.sr .foot{display:flex;justify-content:space-between;border-top:1px solid #dfe5ee;margin-top:26px;padding-top:8px;font-size:10.5px;color:#5b6678}' +
    '.sr [contenteditable]:hover{outline:1px dashed #b9c6dd}.sr [contenteditable]:focus{outline:2px solid #9db8ef;background:#fbfdff}' +
    '.sr .appx{display:none}.sr.with-appx .appx{display:block}' +
    '.sr.compact h1,.sr.compact .tag,.sr.compact .foot,.sr.compact .appx{display:none}.sr.compact{font-size:13.5px}.sr.compact h2{font-size:15px;margin:18px 0 8px}' +
    '.sr.compact .meta{grid-template-columns:90px 1fr}' +
    '@media (max-width:700px){.sr .meta{grid-template-columns:90px 1fr}.sr .kv{grid-template-columns:110px 1fr}}' +
    '.sr table.lt{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 4px}.sr table.lt th{text-align:left;font-size:11px;color:#5b6678;text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid #dfe5ee;padding:5px 6px}' +
    '.sr table.lt td{border-bottom:1px solid #eef1f6;padding:7px 6px;vertical-align:top}.sr table.lt td.tm{font-weight:700;white-space:nowrap}' +
    '.sr .lchip{display:inline-block;font:700 11px Helvetica;padding:3px 8px;border-radius:10px;white-space:nowrap}.sr .lchip.k{background:#e9f7ef;color:#1f7a4d}.sr .lchip.p{background:#fff6e5;color:#a15c07}.sr .lchip.r{background:#eef1f6;color:#5b6678}' +
    '.sr .lbtn{font:600 11.5px Helvetica;border:1px solid #c9d6f3;background:#fff;color:#1f5fd6;border-radius:6px;padding:3px 8px;cursor:pointer;margin:3px 3px 0 0}.sr .lbtn.ok{background:#1f7a4d;border-color:#1f7a4d;color:#fff}.sr .lbtn.lnk{border:0;padding:0;background:none;text-decoration:underline;color:#5b6678}' +
    '.sr .teach{border:2px solid #1f5fd6;border-radius:8px;padding:12px 14px;margin:18px 0;background:#f7faff}.sr .teach .t{font-weight:700;color:#0f2a5c}' +
    '.sr .teach .g{display:grid;grid-template-columns:170px 1fr;gap:8px 10px;margin-top:8px;align-items:center}.sr .teach input,.sr .teach select,.sr .teach textarea{font:13.5px Helvetica,Arial,sans-serif;border:1px solid #c9d6f3;border-radius:6px;padding:7px 9px;width:100%;box-sizing:border-box}' +
    '.sr .teach .go{margin-top:10px;font:700 13px Helvetica;border:0;border-radius:7px;padding:9px 14px;background:#1f5fd6;color:#fff;cursor:pointer}.sr .teach .msg{font-size:12.5px;margin-left:8px}' +
    '@media (max-width:700px){.sr .teach .g{grid-template-columns:1fr}.sr table.lt td.tm{white-space:normal}}' +
    '@media print{.sr .teach,.sr .lbtn{display:none!important}' +
    '}@media print{.sr h2,.sr .tac,.sr .des,.sr .ib{break-inside:avoid}}';
  function css() { if (!document.getElementById('sr-css')) { var s = document.createElement('style'); s.id = 'sr-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function items(a, f) { return (a || []).map(f).join(''); }
  function vcls(a) { a = String(a || '').toLowerCase(); return a.indexOf('yes') === 0 ? 'yes' : a.indexOf('no') === 0 ? 'no' : 'bl'; }
  function conf(c) { c = String(c || '').toLowerCase(); return c.indexOf('doc') === 0 ? 'documented' : c.indexOf('rep') === 0 ? 'reported' : 'not'; }

  /* opts: {edits, imgs:{case_id:dataUrl}, editable, compact, author} */
  function render(r, opts) {
    css(); opts = opts || {}; var ED = opts.edits || {}, IM = opts.imgs || {}, ce = opts.editable !== false;
    function E(k, html, tag, cls) { var v = ED[k]; tag = tag || 'div'; return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (ce ? ' contenteditable="true"' : '') + ' data-k="' + k + '">' + (v != null ? v : html) + '</' + tag + '>'; }
    var v = r.verdict || {}, m = r.missed || {}, ev = r.evidence || [];
    var date = new Date(r.written_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var figs = ev.map(function (e, i) { return IM[e.case_id] ? '<figure><img src="' + IM[e.case_id] + '" alt="Image ' + (i + 1) + '"><figcaption>Image ' + (i + 1) + (e.sha256 ? ' · SHA-256 ' + esc(e.sha256.slice(0, 16)) + '…' : '') + '</figcaption></figure>' : ''; }).join('');
    var nDes = (r.designations || []).length;
    var h = '';
    h += '<span class="tag">RESTRICTED // ANALYST REPORT</span><h1>PROJECT SPEAR</h1>';
    h += E('title', esc(r.title || 'Analyst Report'), 'p', 'sub');
    h += '<div class="meta"><div class="k">Account</div>' + E('account', esc(r.account || 'Not recorded')) +
      '<div class="k">Platform</div>' + E('platform', esc((r.platform || '') + (r.content_type ? ' · ' + r.content_type : ''))) +
      '<div class="k">Analyst</div>' + E('author', esc(r.author || opts.author || '')) +
      '<div class="k">Date</div>' + E('date', esc(date)) +
      '<div class="k">Risk</div><div>' + esc(r.risk_score) + '/10 · ' + esc(String(r.category || '').replace(/_/g, ' ')) + '</div>' +
      '<div class="k">Framework</div><div>GIPEC AI² / SPEAR</div></div>';
    if (figs) h += '<div class="imgs">' + figs + '</div>';

    h += '<section data-q="1"><h2><span class="qn">Q1</span>Can you describe this image?</h2>';
    h += items(r.images, function (im, i) {
      return '<div class="ib"><div class="t">' + esc(im.label || ('Image ' + (i + 1))) + (im.timestamp ? ' (Timestamp ' + esc(im.timestamp) + ')' : '') + '</div>' +
        E('img' + i, '<ul>' + (im.visual ? '<li><span class="lab">Visual content:</span> ' + esc(im.visual) + '</li>' : '') +
          (im.on_screen_text ? '<li><span class="lab">On-screen text overlay:</span> “' + esc(im.on_screen_text) + '”</li>' : '') +
          (im.account_engagement ? '<li><span class="lab">Post account &amp; engagement:</span> ' + esc(im.account_engagement) + '</li>' : '') +
          (im.pinned_comment ? '<li><span class="lab">Pinned / top comment:</span> ' + esc(im.pinned_comment) + '</li>' : '') +
          (im.notes ? '<li><span class="lab">Sequence / context:</span> ' + esc(im.notes) + '</li>' : '') + '</ul>') + '</div>';
    });
    if (r.combined_message) h += E('combined', 'Full message when the frames are read together: “' + esc(r.combined_message) + '”', 'div', 'combined');
    h += '<h3>Context &amp; subcultural analysis</h3>' + E('context', '<ol class="n">' + items(r.context, function (c) { return '<li><b>' + esc(c.title) + ':</b> ' + esc(c.text) + '</li>'; }) + '</ol>') + '</section>';

    h += '<section data-q="2"><h2><span class="qn">Q2</span>' + E('vq', esc(v.question || 'Is this a violation?'), 'span') + '</h2>';
    h += E('vans', esc(v.answer || ''), 'div', 'verdict ' + vcls(v.answer)) + E('vsum', esc(v.summary || ''), 'p');
    h += '<h3>Why</h3>' + E('vwhy', '<ol class="n">' + items(v.reasons, function (c) { return '<li><b>' + esc(c.title) + ':</b> ' + esc(c.text) + '</li>'; }) + '</ol>');
    h += '<h3>Platform moderation context</h3>' + E('vplat', esc(v.platform_context || ''), 'p') + '</section>';

    h += '<section data-q="3"><h2><span class="qn">Q3</span>Why did Meta’s AI miss it?</h2>' + E('mintro', esc(m.intro || ''), 'p');
    h += items(m.tactics, function (t, i) { return E('tac' + i, '<div class="t">' + (i + 1) + '. ' + esc(t.title) + '</div><div><span class="lab">The evasion tactic:</span> ' + esc(t.tactic) + '</div><div><span class="lab">Why platform AI misses it:</span> ' + esc(t.why_missed) + '</div>', 'div', 'tac'); });
    h += '<p class="note">The analyst’s assessment of likely reasons, not a statement of how the platform’s internal systems work.</p></section>';

    h += '<section data-q="4"><h2><span class="qn">Q4</span>Could GIPECAI Project SPEAR have captured it?</h2>';
    if (r.spear_answer) h += E('capans', esc(r.spear_answer), 'div', 'verdict cap');
    h += E('catch', '<ol class="n">' + items(r.spear_catch, function (c) { return '<li><b>' + esc(c.title) + ':</b> ' + esc(c.text) + '</li>'; }) + '</ol>') + '</section>';

    h += learnHtml(r, opts);
    if (nDes) h += '<h2>Designation check</h2>' + items(r.designations, function (d, i) {
      return E('des' + i, '<h3 style="margin-top:0">' + esc(d.question || ('Is ' + d.entity + ' designated?')) + '<span class="conf ' + conf(d.confidence) + '">' + esc(d.confidence || 'not confirmed') + '</span></h3><p>' + esc(d.answer) + '</p>' +
        (d.what_it_means ? '<p><span class="lab">What that means:</span> ' + esc(d.what_it_means) + '</p>' : '') + '<p class="note"><span class="lab">Basis:</span> ' + esc(d.basis || '—') + '</p>', 'div', 'des');
    });
    h += '<h2>Key operational takeaways</h2>' + E('take', '<ol class="n">' + items(r.takeaways, function (c) { return '<li><b>' + esc(c.title) + ':</b> ' + esc(c.text) + '</li>'; }) + '</ol>');
    h += '<h3>How to use this capture</h3>' + E('lev', '<ul>' + items(r.leverage, function (c) { return '<li><b>' + esc(c.title) + ':</b> ' + esc(c.text) + '</li>'; }) + '</ul>');
    h += '<h2>Evidence &amp; submission record</h2><div class="kv"><div>Policies</div>' + E('pol', esc((r.policies || []).join(', ') || '—')) +
      '<div>Recommended action</div>' + E('rec', esc(r.recommended_action || '—')) +
      '<div>Images</div><div>' + ev.length + ' archived original' + (ev.length === 1 ? '' : 's') + ev.map(function (e, i) { return e.sha256 ? '<br><span class="note">Image ' + (i + 1) + ' SHA-256: ' + esc(e.sha256) + '</span>' : ''; }).join('') + '</div>' +
      '<div>Report written</div><div>' + esc(new Date(r.written_at || Date.now()).toLocaleString()) + (r.model ? ' · ' + esc(r.model) : '') + '</div></div>';
    h += '<div class="appx"><h2>Appendix — About Project SPEAR</h2>' + E('appx', '<p>Project SPEAR (GIPEC AI²) is a human-in-the-loop threat-intelligence system for coordinated harmful content. Every image and video frame is read by a vision model, checked against an analyst-maintained codebook of coded terms, numbers, slogans and symbols, and scored with the senior analyst’s confirmed indicators. Screenshots of the same post are read together, so text split across frames is rebuilt. A human analyst confirms every case, and decisions feed back into the system.</p><p>Every original is archived permanently with a SHA-256 fingerprint, so the record survives even when a post is removed, and takedowns are tracked over time. Cases are packaged as analyst reports and evidence files that a platform’s trust-and-safety team, a regulator or a partner can act on — for example as notices under the EU Digital Services Act, where very large platforms must assess and mitigate systemic risks and act on notices without undue delay.</p>') + '</div>';
    h += '<div class="foot"><span>PROJECT SPEAR // ANALYST REPORT</span><span>© ' + new Date().getFullYear() + ' GIPEC AI². Patent Pending. Confidential.</span></div>';
    return h;
  }

  /* Teaching loop: what the AI found (the analyst confirms or rejects each new one) and what the
     analyst teaches it back. Confirmed items go into team memory and are used in every later scan. */
  function chip(t) {
    if (t.known) return '<span class="lchip k">✓ In team memory</span>';
    if (!t.lid) return '';
    return '<span class="lstate" data-lid="' + esc(t.lid) + '">' + stateHtml(t.state || 'pending') + '</span>';
  }
  function stateHtml(st) {
    if (st === 'confirmed') return '<span class="lchip k">✓ Confirmed — in memory</span> <button class="lbtn lnk noprint" data-act="undo">undo</button>';
    if (st === 'rejected') return '<span class="lchip r">✗ Not right</span> <button class="lbtn lnk noprint" data-act="undo">undo</button>';
    return '<span class="lchip p">New — your call</span><br><button class="lbtn ok noprint" data-act="confirm" title="Add to team memory: SPEAR looks for it in every scan from now on">✓ Confirm</button><button class="lbtn noprint" data-act="reject" title="Not right — SPEAR will not suggest it again">✗ Not right</button>';
  }
  function learnHtml(r, opts) {
    var terms = r.terms || [], leads = r.leads || [];
    if (!terms.length && !leads.length && !opts.teach) return '';
    var h = '<section class="lrn"><h2>Slurs &amp; coded language found</h2>';
    h += terms.length ? '<table class="lt"><tr><th>As it appears</th><th>Meaning</th><th>Where</th><th style="width:150px"></th></tr>' + items(terms, function (t) {
      return '<tr><td class="tm">' + esc(t.term) + (t.standard ? '<div class="note">= ' + esc(t.standard) + '</div>' : '') + (t.type ? '<div class="note">' + esc(t.type) + '</div>' : '') + '</td><td>' + esc(t.meaning) + '</td><td class="note">' + esc(t.where) + '</td><td>' + chip(t) + '</td></tr>';
    }) + '</table>' : '<p class="note">No slur or coded term was named in this post.</p>';
    if (leads.length) h += '<h3>Leads — related terms to look for next</h3><table class="lt"><tr><th>Term</th><th>Why it is linked</th><th>Basis</th><th style="width:150px"></th></tr>' + items(leads, function (t) {
      return '<tr><td class="tm">' + esc(t.term) + (t.relationship ? '<div class="note">' + esc(t.relationship) + '</div>' : '') + '</td><td>' + esc(t.why) + '</td><td class="note">' + esc(t.basis) + '</td><td>' + chip(t) + '</td></tr>';
    }) + '</table>';
    if (terms.length || leads.length) h += '<p class="note">SPEAR found these. New ones do nothing until the analyst confirms them; confirmed ones are used in every later scan and report.</p>';
    if (opts.teach) h += '<div class="teach noprint"><div class="t">Teach SPEAR — what did the AI miss or get wrong?</div>' +
      '<div class="note">In your words. Saved to team memory right away and used from the next scan; it is also kept as a lesson on what Meta’s AI misses.</div>' +
      '<div class="g"><label>What kind</label><select data-f="kind"><option value="coded_term">Slur / coded term / number / emoji</option><option value="pattern">Visual pattern or evasion tactic</option><option value="exception">Not harmful — a false alarm</option></select>' +
      '<label>Name it</label><input data-f="term" maxlength="120" placeholder="the term or symbol as it appears, or a short name for the pattern">' +
      '<label>Other spellings</label><input data-f="variants" maxlength="400" placeholder="optional, separated by commas">' +
      '<label>Why it’s bad</label><textarea data-f="why" rows="3" maxlength="1000" placeholder="what it means, who uses it, why it breaks the rules"></textarea></div>' +
      '<button type="button" class="go" data-act="teach">Teach SPEAR</button><span class="msg"></span></div>';
    return h + '</section>';
  }
  /* ctx: {base, key, by, reportId, caseIds} */
  function wireLearning(root, ctx) {
    if (!root || root._learn) return; root._learn = true;
    function call(path, body) {
      return fetch(ctx.base + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ 'X-Spear-Key': ctx.key }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.detail || ('error ' + r.status)); return j; }); });
    }
    var ids = [].map.call(root.querySelectorAll('.lstate[data-lid]'), function (x) { return x.dataset.lid; });
    if (ids.length) call('/api/learning?ids=' + ids.join(',')).then(function (j) {
      (j.items || []).forEach(function (it) { root.querySelectorAll('.lstate[data-lid="' + it.id + '"]').forEach(function (x) { x.innerHTML = stateHtml(it.status); }); });
    }).catch(function () {});
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      var act = b.dataset.act;
      if (act === 'teach') {
        var box = b.closest('.teach'), f = function (n) { return box.querySelector('[data-f="' + n + '"]'); }, msg = box.querySelector('.msg');
        var body = { kind: f('kind').value, term: f('term').value.trim(), variants: f('variants').value, why: f('why').value.trim(), by: ctx.by || 'analyst', case_ids: ctx.caseIds || [], report_id: ctx.reportId || '' };
        if (body.term.length < 2) { msg.textContent = 'Name the term, symbol or pattern.'; return; }
        if (body.why.length < 5) { msg.textContent = 'Say why it is bad, in your words.'; return; }
        b.disabled = true; msg.textContent = 'Saving…';
        call('/api/teach', body).then(function () { msg.textContent = '✓ Saved — SPEAR uses “' + body.term + '” from the next scan.'; f('term').value = ''; f('variants').value = ''; f('why').value = ''; })
          .catch(function (er) { msg.textContent = 'Not saved: ' + er.message; }).then(function () { b.disabled = false; });
        return;
      }
      var holder = b.closest('.lstate'); if (!holder) return;
      b.disabled = true;
      call('/api/learning/' + encodeURIComponent(holder.dataset.lid), { action: act, by: ctx.by || 'analyst' })
        .then(function (it) { root.querySelectorAll('.lstate[data-lid="' + holder.dataset.lid + '"]').forEach(function (x) { x.innerHTML = stateHtml(it.status); }); })
        .catch(function (er) { b.disabled = false; b.title = 'Not saved: ' + er.message; b.textContent = '⚠ Try again'; });
    });
  }

  /* The four answers as plain text, from what is on screen (so the analyst's edits are included). */
  function metaText(root) {
    var out = [];
    root.querySelectorAll('section[data-q]').forEach(function (s) {
      var c = s.cloneNode(true);
      c.querySelectorAll('.qn').forEach(function (x) { x.textContent = 'Q' + s.dataset.q + '. '; });
      c.querySelectorAll('li').forEach(function (li) { li.insertAdjacentText('afterbegin', '• '); li.insertAdjacentText('beforeend', '\n'); });
      c.querySelectorAll('h2,h3,p,div,ol,ul').forEach(function (b) { b.insertAdjacentText('beforeend', '\n'); });
      out.push(c.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim());
    });
    return out.join('\n\n');
  }
  window.SpearReport = { render: render, metaText: metaText, css: css, wireLearning: wireLearning };
})();
