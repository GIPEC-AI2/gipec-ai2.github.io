/* Project SPEAR — two-analyst rule for CRITICAL escalations ("Report to platform").
   Used by the dashboard (index.html), the Operational view (ops.html) and SPEAR Voice (through act()).

   A CRITICAL case is escalated only after two DIFFERENT named analysts have confirmed it.
   - The analyst is the name saved on this device (localStorage "spear_author"). If none is saved,
     the dashboard asks once; voice never asks (it tells the analyst to set a name on screen).
   - Placeholder names ("Strategic", "analyst", blank) never count as a reviewer, so cases that were
     half-confirmed under the old placeholder still need two real names.
   - Names are compared without regard to case or spacing ("Eric Feinberg" = " eric  feinberg ").
   - Confirm, Dismiss and escalation of non-critical cases are unchanged (one step).

   LIMITATION: this is a browser-side check. The analyst name is chosen on the device and every
   device uses the same server key, so a determined person can still change the name or write a
   case straight to /api/cases. Real enforcement needs per-analyst server credentials and a server
   approval endpoint (see docs/security/critical-escalation-two-person-rule.md in the private repo). */
(function () {
  if (window.SpearApproval) return;
  var PLACEHOLDER = { '': 1, 'strategic': 1, 'analyst': 1, 'analyst (voice)': 1, 'reviewer': 1, 'unknown': 1 };
  function clean(n) { return String(n == null ? '' : n).replace(/\s+/g, ' ').trim().slice(0, 80); }
  function norm(n) { return clean(n).toLowerCase(); }
  function isReal(n) { return !PLACEHOLDER[norm(n)]; }
  function nameOf(r) { return typeof r === 'string' ? r : (r && r.name) || ''; }
  function analyst(ask) {
    var n = ''; try { n = clean(localStorage.getItem('spear_author')); } catch (e) {}
    if (!isReal(n) && ask) {
      var a = clean(window.prompt('Your name, for the approval record (for example: Eric Feinberg):', ''));
      if (isReal(a)) { try { localStorage.setItem('spear_author', a); } catch (e) {} n = a; }
    }
    return isReal(n) ? n : '';
  }
  function tier(it) { var t = String((it && it.tier) || '').toUpperCase(); if (t) return t;
    var s = Number(it && it.score) || 0; return s >= 9 ? 'CRITICAL' : s >= 7 ? 'HIGH' : s >= 5 ? 'MEDIUM' : s >= 3 ? 'LOW' : 'MINIMAL'; }
  function needsTwo(it, status) { return status === 'Escalated' && tier(it) === 'CRITICAL'; }
  function confirmed(it) { var seen = {}, out = [];
    ((it && it.reviewers) || []).forEach(function (r) { var n = nameOf(r); if (isReal(n) && !seen[norm(n)]) { seen[norm(n)] = 1; out.push(clean(n)); } });
    return out; }
  /* Call BEFORE applying a status. Returns {ok:true} when the status may be applied now. Otherwise
     returns {ok:false, code, message}; code "first" means a first confirmation was recorded on `it`
     (the caller must save it). */
  function check(it, status, opts) {
    opts = opts || {};
    if (!it || !needsTwo(it, status)) return { ok: true };
    var who = analyst(opts.ask !== false);
    if (!who) return { ok: false, code: 'no_name', message: 'Set your analyst name on this device before confirming a critical case. Nothing was recorded.' };
    var have = confirmed(it);
    if (have.length >= 2) return { ok: true, reviewers: have };
    if (have.some(function (n) { return norm(n) === norm(who); }))
      return { ok: false, code: 'same_analyst', message: 'You (' + who + ') already gave the first confirmation. A different analyst must give the second one before this critical case is reported.' };
    if (!Array.isArray(it.reviewers)) it.reviewers = [];
    it.reviewers.push(who);
    it.approvals = (Array.isArray(it.approvals) ? it.approvals : []).concat([{ name: who, at: new Date().toISOString(), via: opts.via || 'dashboard' }]);
    if (have.length === 0) return { ok: false, code: 'first', message: 'First confirmation recorded (' + who + '). A second analyst must also confirm before this critical case is reported.' };
    return { ok: true, reviewers: have.concat([who]) };
  }
  window.SpearApproval = { check: check, confirmed: confirmed, needsTwo: needsTwo, analyst: analyst, tier: tier };
})();
