/* Project SPEAR — approval rule for CRITICAL escalations ("Report to platform").
   Used by the dashboard (index.html), the Operational view (ops.html) and SPEAR Voice (through act()).

   TEST MODE (the yellow 🧪 switch in the side menu): the analyst is teaching the system, so one analyst
   may escalate a CRITICAL case on their own. The case is marked "escalated in test mode" so it can be
   told apart from real escalations later.

   OFFICIAL MODE (the red ✅ switch), or whenever the mode cannot be read: a CRITICAL case is escalated
   only when two DIFFERENT people have confirmed it AND at least one of them is an approver (Eric
   Feinberg or a manager listed in APPROVERS below). So an employee's escalation waits for Eric or a
   manager; Eric's own escalation waits for a second person.

   - The person is the name saved on this device (localStorage "spear_author"). If none is saved, the
     dashboard asks once; voice never asks (it tells the analyst to set a name on screen).
   - Placeholder names ("Strategic", "analyst", blank) never count, so cases half-confirmed under the
     old placeholder still need real names.
   - Names are compared without regard to case or spacing.
   - Confirm, Dismiss and escalation of non-critical cases are unchanged (one step).

   LIMITATION: this is a browser-side check. The name is chosen on the device and every device uses the
   same server key, so a determined person can change the name or write a case straight to /api/cases.
   Real enforcement needs per-analyst server credentials and a server approval step
   (docs/security/critical-escalation-two-person-rule.md in the private repo). */
(function () {
  if (window.SpearApproval) return;

  /* People who may approve a CRITICAL escalation in official mode. Add managers here (full names). */
  var APPROVERS = ['Eric Feinberg'];

  var PLACEHOLDER = { '': 1, 'strategic': 1, 'analyst': 1, 'analyst (voice)': 1, 'reviewer': 1, 'unknown': 1 };
  function clean(n) { return String(n == null ? '' : n).replace(/\s+/g, ' ').trim().slice(0, 80); }
  function norm(n) { return clean(n).toLowerCase(); }
  function isReal(n) { return !PLACEHOLDER[norm(n)]; }
  function isApprover(n) { return APPROVERS.some(function (a) { return norm(a) === norm(n); }); }
  function nameOf(r) { return typeof r === 'string' ? r : (r && r.name) || ''; }
  function analyst(ask) {
    var n = ''; try { n = clean(localStorage.getItem('spear_author')); } catch (e) {}
    if (!isReal(n) && ask) {
      var a = clean(window.prompt('Your name, for the approval record (for example: Eric Feinberg):', ''));
      if (isReal(a)) { try { localStorage.setItem('spear_author', a); } catch (e) {} n = a; }
    }
    return isReal(n) ? n : '';
  }

  /* The AI mode the server is in. The side-menu switch (#aimode) shows the server's setting; when it is
     not on the page, ask the server directly. Anything unknown is treated as official (strict). */
  var fetched = { mode: '', at: 0 };
  function refresh() {
    try {
      var key = localStorage.getItem('spear_key') || ''; if (!key) return;
      var api = (localStorage.getItem('spear_api') || 'https://project-spear-backend.onrender.com').replace(/\/$/, '');
      fetch(api + '/api/ai-mode', { headers: { 'X-Spear-Key': key }, cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && (j.mode === 'test' || j.mode === 'official')) fetched = { mode: j.mode, at: Date.now() }; })
        .catch(function () {});
    } catch (e) {}
  }
  function mode() {
    var el = document.getElementById('aimode');
    if (el && el.classList.contains('test')) return 'test';
    if (el && el.classList.contains('official')) return 'official';
    if (fetched.mode && Date.now() - fetched.at < 10 * 60 * 1000) return fetched.mode;
    return 'unknown';
  }
  refresh(); setInterval(refresh, 60 * 1000);

  function tier(it) { var t = String((it && it.tier) || '').toUpperCase(); if (t) return t;
    var s = Number(it && it.score) || 0; return s >= 9 ? 'CRITICAL' : s >= 7 ? 'HIGH' : s >= 5 ? 'MEDIUM' : s >= 3 ? 'LOW' : 'MINIMAL'; }
  function needsTwo(it, status) { return status === 'Escalated' && tier(it) === 'CRITICAL'; }
  function confirmed(it) { var seen = {}, out = [];
    ((it && it.reviewers) || []).forEach(function (r) { var n = nameOf(r); if (isReal(n) && !seen[norm(n)]) { seen[norm(n)] = 1; out.push(clean(n)); } });
    return out; }
  function note(it, who, via, m) {
    it.approvals = (Array.isArray(it.approvals) ? it.approvals : []).concat([{ name: who || 'unnamed', at: new Date().toISOString(), via: via || 'dashboard', mode: m }]);
  }

  /* Call BEFORE applying a status. Returns {ok:true} when the status may be applied now. Otherwise
     returns {ok:false, code, message}; codes "first" and "needs_approver" mean a confirmation was
     recorded on `it` (the caller must save it). */
  function check(it, status, opts) {
    opts = opts || {};
    if (!it || !needsTwo(it, status)) return { ok: true };
    var m = mode();

    if (m === 'test') {
      var t = analyst(false);
      note(it, t, opts.via, 'test');
      it.testModeEscalation = true;
      return { ok: true, mode: 'test', message: 'Escalated in test mode (teaching). In official mode this would need a second person.' };
    }

    var who = analyst(opts.ask !== false);
    if (!who) return { ok: false, code: 'no_name', message: 'Set your analyst name on this device before confirming a critical case. Nothing was recorded.' };
    var have = confirmed(it);
    var mine = have.some(function (n) { return norm(n) === norm(who); });
    if (!mine) {
      if (!Array.isArray(it.reviewers)) it.reviewers = [];
      it.reviewers.push(who); note(it, who, opts.via, 'official'); have = have.concat([who]);
    }
    var hasApprover = have.some(isApprover);
    if (have.length >= 2 && hasApprover) { delete it.testModeEscalation; return { ok: true, reviewers: have, mode: 'official' }; }
    if (mine) return { ok: false, code: 'same_analyst', message: 'You (' + who + ') already confirmed this critical case. ' +
      (hasApprover ? 'A second person must also confirm before it is reported.' : 'Eric or a manager must approve it before it is reported.') };
    if (!hasApprover) return { ok: false, code: 'needs_approver', message: 'Sent for approval (' + have.join(', ') + '). Eric or a manager must approve before this critical case is reported.' };
    return { ok: false, code: 'first', message: 'First confirmation recorded (' + who + '). A second person must also confirm before this critical case is reported.' };
  }
  window.SpearApproval = { check: check, confirmed: confirmed, needsTwo: needsTwo, analyst: analyst, tier: tier, mode: mode, approvers: APPROVERS.slice() };
})();
