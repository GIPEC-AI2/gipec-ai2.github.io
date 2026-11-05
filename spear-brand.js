/* GIPEC AI2 branding for every report Project SPEAR produces (Nov 2026).
   - letterhead(kind): the logo block at the top of a report (on screen, PDF, HTML and print).
   - stamp(pdf, title): on every page of a downloaded PDF, a running footer with the page number
     ("Page 3 of 10"), and from page 2 on a small GIPEC AI2 logo in the top margin.
   - Printing (or "Save as PDF" from the print box) gets the same footer and page numbers.
   The logo is served from this site, so the PDF maker can draw it. */
(function () {
  if (window.SpearBrand) return;
  var LOGO = 'https://gipec-ai2.github.io/gipec-logo.png';
  var FOOT = 'GIPEC AI² · Project SPEAR · Patent Pending · Confidential';
  var logoData = '';
  try {
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      try { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
        logoData = c.toDataURL('image/jpeg', 0.92); } catch (e) {}
    };
    im.src = LOGO;
  } catch (e) {}

  function letterhead(kind) {
    return '<div class="gipec-lh" style="display:flex;align-items:center;gap:16px;border-bottom:3px solid #0f2a5c;padding:0 0 12px;margin:0 0 16px">' +
      '<img src="' + LOGO + '" alt="GIPEC AI²" crossorigin="anonymous" style="height:54px;width:auto;display:block">' +
      '<div style="margin-left:auto;text-align:right;font:12px/1.45 Helvetica,Arial,sans-serif;color:#5b6678">' +
      '<b style="display:block;font-size:14px;color:#0f2a5c;letter-spacing:.3px">GIPEC AI² · Project SPEAR</b>' +
      (kind ? kind + ' · ' : '') + 'Patent Pending<br>gipecai.com · admin@gipecai.com</div></div>';
  }

  /* jsPDF document from html2pdf: .toPdf().get('pdf').then(function (pdf) { SpearBrand.stamp(pdf, 'TITLE'); }) */
  function stamp(pdf, title) {
    try {
      var n = pdf.internal.getNumberOfPages(), ps = pdf.internal.pageSize;
      var W = ps.getWidth ? ps.getWidth() : ps.width, H = ps.getHeight ? ps.getHeight() : ps.height;
      for (var i = 1; i <= n; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(200, 207, 216); pdf.setLineWidth(0.2); pdf.line(14, H - 10.5, W - 14, H - 10.5);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(91, 102, 120);
        pdf.text(FOOT, 14, H - 6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Page ' + i + ' of ' + n, W - 14, H - 6.5, { align: 'right' });
        if (i > 1) {
          if (logoData) { try { pdf.addImage(logoData, 'JPEG', 14, 3.2, 21, 7.2); } catch (e) {} }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(15, 42, 92);
          pdf.text(String(title || 'PROJECT SPEAR').toUpperCase(), W - 14, 8.2, { align: 'right' });
        }
      }
      pdf.setProperties({ subject: 'GIPEC AI2 Project SPEAR', creator: 'GIPEC AI2 Project SPEAR', author: 'GIPEC AI2 LLC' });
    } catch (e) {}
    return pdf;
  }

  /* Print / "Save as PDF" from the browser: running footer with page numbers on every page. */
  try {
    var st = document.createElement('style');
    st.textContent = '@page{margin:14mm 12mm 18mm 12mm;' +
      '@bottom-left{content:"' + FOOT + '";font:8px Helvetica,Arial,sans-serif;color:#5b6678}' +
      '@bottom-right{content:"Page " counter(page) " of " counter(pages);font:bold 8px Helvetica,Arial,sans-serif;color:#5b6678}}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  window.SpearBrand = { letterhead: letterhead, stamp: stamp, LOGO: LOGO, FOOT: FOOT, logoReady: function () { return !!logoData; } };
})();
