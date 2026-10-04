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
    '@media print{.sr h2,.sr .tac,.sr .des,.sr .ib{break-inside:avoid}}';
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
  window.SpearReport = { render: render, metaText: metaText, css: css };
})();
