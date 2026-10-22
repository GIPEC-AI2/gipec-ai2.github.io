/* SPEAR Voice — talk to SPEAR instead of clicking and typing.
   Built for an analyst with hand arthritis: tap the microphone once and say what to do. Every decision
   (confirm, report to platform, dismiss, send a correction, teach a term) is read back and needs a
   spoken "yes" before it happens, so the human stays in the loop. Uses the browser's own speech
   recognition (Chrome, Edge, Safari). Nothing is decided without the analyst's voice confirmation. */
(function () {
  if (window.__spearVoice) return; window.__spearVoice = true;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var PAGE = /report\.html/.test(location.pathname) ? 'report' : /brief\.html/.test(location.pathname) ? 'brief'
    : /brand\.html/.test(location.pathname) ? 'brand' : /ops\.html/.test(location.pathname) ? 'ops' : 'home';
  var css = '#svBtn{position:fixed;right:18px;bottom:18px;z-index:9999;width:78px;height:78px;border-radius:50%;border:4px solid #fff;' +
    'background:#1f4fb3;color:#fff;font:700 13px/1.1 system-ui,sans-serif;box-shadow:0 6px 22px rgba(15,42,92,.35);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}' +
    '#svBtn .i{font-size:30px;line-height:1}#svBtn.on{background:#d23c3c;animation:svp 1.1s ease-in-out infinite}@keyframes svp{50%{box-shadow:0 0 0 14px rgba(210,60,60,.18)}}' +
    '#svPanel{position:fixed;right:18px;bottom:106px;z-index:9999;width:min(420px,calc(100vw - 36px));background:#fff;border:3px solid #1f4fb3;border-radius:14px;' +
    'box-shadow:0 10px 30px rgba(15,42,92,.25);padding:14px 16px;font:16px/1.45 system-ui,sans-serif;color:#1b2533;display:none}' +
    '#svPanel.show{display:block}#svPanel .h{font-weight:800;font-size:17px;color:#0f2a5c;margin-bottom:6px}#svPanel .heard{font-size:18px;margin:6px 0;min-height:24px}' +
    '#svPanel .ask{background:#fff4e0;border-left:6px solid #c27a00;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:8px;font-weight:700}' +
    '#svPanel .ok{background:#e8f7ee;border-left:6px solid #1f9d55;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:8px}' +
    '#svPanel .bad{background:#fdecec;border-left:6px solid #d23c3c;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:8px}' +
    '#svPanel .yn{display:flex;gap:8px;margin-top:10px}#svPanel .yn button{flex:1;font:800 17px system-ui;border:0;border-radius:10px;padding:12px;cursor:pointer}' +
    '#svPanel .yes{background:#1f9d55;color:#fff}#svPanel .no{background:#eef1f6;color:#1b2533}#svPanel .x{float:right;border:0;background:none;font-size:20px;cursor:pointer;color:#5b6678}' +
    '#svPanel ul{margin:6px 0 0;padding-left:20px}#svPanel li{margin:3px 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var btn = document.createElement('button'); btn.id = 'svBtn'; btn.type = 'button'; btn.title = 'Talk to SPEAR'; btn.innerHTML = '<span class="i">🎤</span>Talk';
  var pan = document.createElement('div'); pan.id = 'svPanel'; pan.setAttribute('aria-live', 'polite');
  function mount() { if (!document.body) return setTimeout(mount, 50); document.body.appendChild(pan); document.body.appendChild(btn); }
  mount();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function show(html) { pan.innerHTML = '<button class="x" type="button" aria-label="Close">×</button>' + html; pan.classList.add('show'); pan.querySelector('.x').onclick = function () { pan.classList.remove('show'); pending = null; }; }
  function speak(t, done) { try { if (!window.speechSynthesis) { if (done) done(); return; } speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(t).slice(0, 900)); u.rate = 0.95; if (done) { u.onend = done; u.onerror = done; } speechSynthesis.speak(u); } catch (e) { if (done) done(); } }
  function say(kind, text, talk) { show('<div class="h">SPEAR</div><div class="' + kind + '">' + esc(text) + '</div>'); if (talk !== false) speak(text); }
  function log(entry) { try { var l = JSON.parse(localStorage.getItem('spear_voice_log') || '[]'); l.push(Object.assign({ at: new Date().toISOString(), page: PAGE }, entry)); localStorage.setItem('spear_voice_log', JSON.stringify(l.slice(-300))); } catch (e) {} }

  /* ---- every decision waits for a spoken (or tapped) yes ---- */
  var pending = null, pendT = null;
  function ask(question, run, label) {
    pending = { run: run, label: label || question }; clearTimeout(pendT);
    pendT = setTimeout(function () { if (pending) { pending = null; say('bad', 'Cancelled — I did not hear a yes.'); } }, 20000);
    show('<div class="h">Please confirm</div><div class="ask">' + esc(question) + '</div><div class="yn"><button class="yes" type="button">Yes</button><button class="no" type="button">No</button></div>' +
      '<div style="font-size:13px;color:#5b6678;margin-top:6px">Say “yes” or “no”.</div>');
    pan.querySelector('.yes').onclick = function () { yes(); }; pan.querySelector('.no').onclick = function () { no(); };
    /* listen for the answer only after SPEAR has finished speaking, so its own voice is never taken as the answer */
    speak(question, function () { setTimeout(function () { if (pending && !on) listen(true); }, 300); });
  }
  function yes() { var p = pending; pending = null; clearTimeout(pendT); if (!p) return; try { p.run(); log({ action: p.label, confirmed: true }); } catch (e) { say('bad', 'That did not work: ' + e.message); } }
  function no() { pending = null; clearTimeout(pendT); say('ok', 'Cancelled. Nothing was changed.'); }

  /* ---- helpers that use the page's own functions ---- */
  function has(fn) { return typeof window[fn] === 'function'; }
  function itemsList() { try { return (typeof items !== 'undefined' && Array.isArray(items)) ? items : []; } catch (e) { return []; } }
  function current() { try { var id = (typeof selId !== 'undefined') ? selId : null; return itemsList().find(function (i) { return String(i.id) === String(id); }) || null; } catch (e) { return null; } }
  function caseText(it) { if (!it) return 'No case is open.'; var t = 'Case ' + it.id + '. ' + String(it.category || '').replace(/_/g, ' ') + ', score ' + (it.score || 0) + ' of 10. ';
    t += (it.visionDesc || it.reasoning || '').replace(/\s+/g, ' ').slice(0, 500); return t; }
  function pendingCases() { return itemsList().filter(function (i) { return !i.archived && (!i.status || i.status === 'Pending'); }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); }); }
  function openCase(it) { if (!it) return say('bad', 'There are no cases waiting for review.'); try { window.select(it.id); } catch (e) {}
    var t = document.querySelector('.decide,#decide,#detail,[id*="detail"]'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    say('ok', caseText(it) + ' Say confirm, report to platform, dismiss, add a note, or open the dossier.'); }
  function decide(status, words) { var it = current(); if (!it) return say('bad', 'Open a case first. Say “next case”.');
    ask(words + ' case ' + it.id + ' (' + String(it.category || '').replace(/_/g, ' ') + ', ' + (it.score || 0) + '/10)?', function () {
      window.act(status); var now = current() || it;
      if (now.status !== status) return say('ok', 'Recorded your first confirmation. This is a critical case, so a second analyst must also confirm before it is reported.');
      try { now.decidedVia = 'voice'; if (has('itemsSave')) window.itemsSave(); } catch (e) {}
      say('ok', 'Done. Case ' + it.id + ' marked ' + (status === 'Escalated' ? 'report to platform' : status.toLowerCase()) + '. Say “next case” to keep going.'); }, status + ' case ' + it.id); }
  function api() { var b = ''; try { b = (typeof API_BASE !== 'undefined' && API_BASE) || (typeof BACKEND_DEFAULT !== 'undefined' && BACKEND_DEFAULT) || ''; } catch (e) {}
    return (b || localStorage.getItem('spear_api') || 'https://project-spear-backend.onrender.com').replace(/\/$/, ''); }
  function teach(term, why) {
    ask('Teach SPEAR that “' + term + '” means: ' + why + '?', function () {
      fetch(api() + '/api/teach', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Spear-Key': localStorage.getItem('spear_key') || '' },
        body: JSON.stringify({ kind: 'coded_term', term: term, variants: '', why: why, by: 'analyst (voice)', case_ids: [], report_id: '' }) })
        .then(function (r) { say(r.ok ? 'ok' : 'bad', r.ok ? 'Saved. SPEAR will use “' + term + '” from the next scan.' : 'Not saved (server ' + r.status + ').'); })
        .catch(function () { say('bad', 'Not saved — the server could not be reached.'); });
    }, 'teach ' + term);
  }
  var lastField = null; document.addEventListener('focusin', function (e) { var el = e.target; if (el && (/^(TEXTAREA|INPUT)$/.test(el.tagName) && !/^(button|checkbox|radio|file|submit)$/i.test(el.type || '') || el.isContentEditable)) lastField = el; });
  function insertText(t) { var el = (lastField && document.contains(lastField)) ? lastField : null; if (!el) return false; try { el.focus(); } catch (e) {}
    if (el.isContentEditable) { document.execCommand('insertText', false, t); } else { var s = el.selectionStart || el.value.length; el.value = el.value.slice(0, s) + (s && !/\s$/.test(el.value.slice(0, s)) ? ' ' : '') + t + el.value.slice(el.selectionEnd || s); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    say('ok', 'Typed: ' + t, false); return true; }

  var HELP = {
    home: ['“Next case” — opens the next case waiting for review and reads it to you', '“Confirm”, “Report to platform” or “Dismiss” — your decision (SPEAR asks you to say yes)',
      '“Note …” — adds your words to the case notes', '“Open the dossier”', '“Read it” — reads the open case aloud'],
    report: ['“Correction …” or “You missed …” — rewrites the dossier with your correction', '“Report for law enforcement”, “…for Meta”, “…for another platform”',
      '“Read the verdict”', '“Copy for Meta”', '“Download the PDF”'],
    brand: ['“Brands spotted”', '“Upload examples” (then tap the box to pick the video)'],
    all: ['“Teach … means …” — e.g. “teach blues means fentanyl pills”', '“Type …” — types into the box you tapped', '“Go to brand safety” / “Go to the review queue”', '“Stop” — stops reading', '“Help”']
  };
  function help() { var l = (HELP[PAGE] || []).concat(HELP.all);
    show('<div class="h">Things you can say</div><ul>' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    speak('Tap the microphone and say what you want. For example, next case, confirm, or correction followed by what SPEAR missed.'); }

  /* ---- what was said -> what to do ---- */
  function handle(raw) {
    var t = String(raw || '').trim(), s = t.toLowerCase().replace(/[.,!?]+$/g, '').replace(/\s+/g, ' ');
    if (!s) return;
    log({ heard: t });
    if (pending) { if (/^(yes|yeah|yep|yes please|confirm|confirmed|do it|go ahead|correct|ok|okay)$/.test(s)) return yes(); if (/^(no|nope|cancel|stop|wait|don't|do not|no thanks)\b/.test(s)) return no();
      return say('bad', 'Please say just \u201cyes\u201d or \u201cno\u201d, or tap a button.'); }
    if (/^(help|what can i say|commands)\b/.test(s)) return help();
    if (/^(stop|be quiet|quiet|stop reading)\b/.test(s)) { try { speechSynthesis.cancel(); } catch (e) {} return say('ok', 'Stopped.', false); }
    var m;
    if ((m = t.match(/^\s*teach(?: spear)?(?: that)?(?: the)?(?: code| term| emoji)?\s+(.+?)\s+(?:means|is|stands for)\s+(.+)$/i))) return teach(m[1].replace(/^["“]|["”]$/g, ''), m[2]);
    if ((m = t.match(/^\s*type\s+(.+)$/i))) { if (!insertText(m[1])) say('bad', 'Tap the box you want me to type into first, then say “type” and your words.'); return; }
    if (/^(go to|open) (the )?brand/.test(s)) return location.href = 'brand.html';
    if (/^(go to|open) (the )?(review queue|queue|home|cases|main page)/.test(s)) return location.href = 'index.html';
    if (/^(go to|open) (the )?operation/.test(s)) return location.href = 'ops.html';

    if (PAGE === 'home') {
      if (/^(next|open the next|open next|show me the next)( case)?\b/.test(s)) return openCase(pendingCases()[0]);
      if ((m = s.match(/^(open |show )?case (number )?(\d+)$/))) return openCase(itemsList().find(function (i) { return String(i.id) === m[3]; }));
      if (/^(confirm|approve|approved|it's bad|this is bad)\b/.test(s)) return decide('Confirmed', 'Confirm');
      if (/^(report( it)? to (the )?platform|report it|escalate|report to meta)\b/.test(s)) return decide('Escalated', 'Report to the platform');
      if (/^(dismiss|reject|false positive|not harmful|it's fine)\b/.test(s)) return decide('Dismissed', 'Dismiss as not harmful');
      if ((m = t.match(/^\s*(?:add a )?note[:,]?\s+(.+)$/i))) { var it = current(); if (!it) return say('bad', 'Open a case first.');
        return ask('Add this note to case ' + it.id + ': “' + m[1] + '”?', function () { window.setField('notes', ((it.notes ? it.notes + ' ' : '') + m[1]).trim()); say('ok', 'Note added.'); }, 'note case ' + it.id); }
      if (/^(open|show)( the)? (dossier|report|brief)/.test(s)) { var c = current(); if (!c) return say('bad', 'Open a case first.'); try { window.openBrief(c.id); } catch (e) {} return say('ok', 'Opening the dossier.', false); }
      if (/^(read|read it|read the case|what is it|tell me)/.test(s)) return say('ok', caseText(current()));
    }
    if (PAGE === 'report') {
      if ((m = t.match(/^\s*(?:correction|correct this|change|fix|you missed|update)[:,]?\s+(.+)$/i)) || (m = t.match(/^\s*(you (?:missed|got) .+)$/i))) {
        var q = document.getElementById('askQ'); if (!q || typeof window.askSpear !== 'function') return say('bad', 'The correction box is not ready yet.');
        var fix = m[1]; return ask('Rewrite the dossier with this correction: “' + fix + '”?', function () { q.value = fix; window.askSpear(); say('ok', 'Rewriting the dossier with your correction. This takes about a minute.'); }, 'correction');
      }
      if ((m = s.match(/^(report|write it|make it) for (law enforcement|police|the police|meta|facebook|instagram|another platform|other platform)/))) {
        var v = /law|police/.test(m[2]) ? 'le' : /another|other/.test(m[2]) ? 'other' : 'meta', sel = document.getElementById('bFor');
        if (!sel) return say('bad', 'That choice is not on this page.');
        return ask('Rewrite this dossier for ' + (v === 'le' ? 'law enforcement' : v === 'other' ? 'another platform' : 'Meta') + '?', function () { sel.value = v; sel.dispatchEvent(new Event('change')); say('ok', 'Rewriting. This takes about a minute.'); }, 'audience ' + v);
      }
      if (/^(read|read it|read the verdict|what's the verdict|read the summary)/.test(s)) { var RR = null; try { RR = (typeof R !== 'undefined') ? R : null; } catch (e) {}
        var vd = RR && RR.verdict || {}; return say('ok', (vd.answer || '') + ' ' + (vd.summary || '') || 'The dossier is still loading.'); }
      if (/^copy( it)? for meta|^copy the (answers|four answers)/.test(s)) { var b1 = document.getElementById('bCopy'); if (b1) b1.click(); return say('ok', 'Copied the answers for Meta.'); }
      if (/^(download|save)( the)? pdf/.test(s)) { var b2 = document.getElementById('bPdf'); if (b2) b2.click(); return say('ok', 'Making the PDF.'); }
    }
    if (PAGE === 'brand') {
      if (/brands? spotted/.test(s)) { var e1 = document.querySelector('[data-id="__spotted"]'); if (e1) e1.click(); return say('ok', 'Showing brands spotted.', false); }
      if (/upload|teach spear|examples/.test(s)) { var e2 = document.querySelector('[data-id="__teach"]'); if (e2) e2.click(); return say('ok', 'Tap the blue box to choose the video or picture.'); }
    }
    if (insertText(t)) return;
    say('bad', 'I heard “' + t + '” but I am not sure what to do. Say “help” to hear what you can say.');
  }

  /* ---- the microphone ---- */
  var rec = null, on = false;
  function listen(auto) {
    if (!SR) { show('<div class="h">Voice is not available in this browser</div><div class="bad">Use Chrome, Edge or Safari for voice control.</div>'); return; }
    if (on) { try { rec.stop(); } catch (e) {} return; }
    rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    var finalText = '';
    rec.onstart = function () { on = true; btn.classList.add('on'); btn.innerHTML = '<span class="i">🎤</span>Listening'; if (!pending) show('<div class="h">Listening…</div><div class="heard">Say what you want SPEAR to do.</div>'); };
    rec.onresult = function (e) { var t = ''; for (var i = e.resultIndex; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) finalText += e.results[i][0].transcript; }
      var h = pan.querySelector('.heard'); if (h) h.textContent = '“' + t + '”'; else if (!pending) show('<div class="h">I heard</div><div class="heard">“' + esc(t) + '”</div>'); };
    rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') say('bad', 'The microphone is blocked. Allow the microphone for this site in your browser, then tap Talk again.', false); };
    rec.onend = function () { on = false; btn.classList.remove('on'); btn.innerHTML = '<span class="i">🎤</span>Talk'; if (finalText) handle(finalText); };
    try { if (window.speechSynthesis) speechSynthesis.cancel(); rec.start(); } catch (e) { on = false; }
  }
  btn.onclick = function () { listen(false); };
  window.spearVoice = { handle: handle, listen: listen, help: help };
})();
