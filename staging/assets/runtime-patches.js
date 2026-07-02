// Runtime patches carried over from the packed bundler wrapper so the
// un-bundled build behaves identically to production. DOM tweaks applied after
// the app mounts. (Long term: fold each into the app source and delete this.)
// Kept in sync with the wrapper in the production index.html.
document.addEventListener('DOMContentLoaded', function () {
    // Desktop welcome layout: right-aligned logo & copy + button
    var __wlcLayout = document.createElement('style');
    __wlcLayout.textContent =
      '@media (min-width:900px){' +
      '.wlc-root.wlc-root{align-items:flex-end !important;justify-content:center !important;gap:0 !important;padding-top:0 !important;max-width:none !important;}' +
      '.wlc-root.wlc-root > div[style*="flex: 1"]{display:none !important;}' +
      '.wlc-logo.wlc-logo{order:1 !important;width:auto !important;align-self:flex-end !important;margin:6vh clamp(24px,7vw,120px) 18px 0 !important;}' +
      '.wlc-cta.wlc-cta{order:2 !important;align-self:flex-end !important;text-align:right !important;max-width:560px !important;margin-right:clamp(24px,7vw,120px) !important;}' +
      '.wlc-cta.wlc-cta > *{margin-left:auto !important;margin-right:0 !important;}' +
      '.wlc-cta-label.wlc-cta-label{justify-content:flex-end !important;}' +
      '}';
    document.head.appendChild(__wlcLayout);

    // Fix EMPLOYEE NIK → EMPLOYEE ID with placeholder 730xxxxxx in Sign Up form.
    // IMPORTANT: only rewrite leaf TEXT NODES. Setting .textContent on a matching
    // container (e.g. #root, whose text includes "EMPLOYEE NIK") deletes its whole
    // child tree and replaces it with a single text node — which wipes React's
    // rendered DOM and destroys the mount. A TreeWalker edits just the text,
    // leaving the element structure (and React) intact.
    var fixEmployeeId = function() {
      var found = false;
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.indexOf('EMPLOYEE NIK') !== -1) {
          node.nodeValue = node.nodeValue.split('EMPLOYEE NIK').join('EMPLOYEE ID');
          found = true;
        }
      }
      document.querySelectorAll('input').forEach(function(input) {
        if (input.placeholder && input.placeholder.toLowerCase().includes('nik')) {
          input.placeholder = '730xxxxxx';
          found = true;
        }
      });
    };
    fixEmployeeId();
    setTimeout(fixEmployeeId, 500);
    setTimeout(fixEmployeeId, 1500);
    var observer = new MutationObserver(fixEmployeeId);
    observer.observe(document.body, { subtree: true, childList: true });

    // Fix Sign Up background to cover full viewport
    var __signupBgFix = document.createElement('style');
    __signupBgFix.textContent =
      'body { background: linear-gradient(135deg, #F4F6FA 0%, #E8ECFA 50%, #DFE5F5 100%) !important; min-height: 100vh !important; }' +
      '[class*="auth"] { background: transparent !important; }' +
      '[class*="signup"] { background: transparent !important; }' +
      '[class*="register"] { background: transparent !important; }' +
      '[role="main"] { background: transparent !important; min-height: 100vh !important; }' +
      'html { height: 100% !important; }';
    document.head.appendChild(__signupBgFix);
    // Hide duplicate NIK/Gender fields in profile completion form
    var __profileFormFix = document.createElement('style');
    __profileFormFix.textContent =
      'form[class*="profile"] label:has(+ input[placeholder*="NIK"]),' +
      'form[class*="profile"] input[placeholder*="NIK"],' +
      'form[class*="profile"] label:contains("EMPLOYEE ID"),' +
      'form label:contains("GENDER"),' +
      'form button:contains("Male"),' +
      'form button:contains("Female"),' +
      '[class*="profile"] [class*="gender"],' +
      '[class*="profile"] [class*="nik"],' +
      '[class*="ProfileForm"] [class*="gender"],' +
      '[class*="ProfileForm"] [class*="nik"] { display: none !important; }';
    document.head.appendChild(__profileFormFix);

    // Also observe for dynamically added forms and hide NIK/Gender fields
    setTimeout(function() {
      var inputs = document.querySelectorAll('input[placeholder*="NIK"], input[placeholder*="Gender"]');
      inputs.forEach(function(input) {
        var parent = input.parentElement;
        if (parent) parent.style.display = 'none';
        var label = input.previousElementSibling;
        if (label) label.style.display = 'none';
      });
      var genderButtons = document.querySelectorAll('button');
      genderButtons.forEach(function(btn) {
        if (btn.textContent === 'Male' || btn.textContent === 'Female') {
          var form = btn.closest('form');
          if (form && form.textContent.includes('Complete your profile')) {
            btn.style.display = 'none';
          }
        }
      });
    }, 500);

    // Fallback mechanism for log run data loading failure
    var __logRunFallback = document.createElement('style');
    __logRunFallback.textContent =
      '[class*="fallback-banner"] { ' +
      'background: #fff3cd !important; border: 2px solid #ffc107 !important; ' +
      'padding: 16px !important; border-radius: 8px !important; margin: 16px 0 !important; ' +
      'text-align: center !important; display: none !important; z-index: 1000 !important; }' +
      '[class*="fallback-banner"].show { display: block !important; }' +
      '[class*="fallback-banner"] a { ' +
      'color: #d39e00 !important; text-decoration: underline !important; font-weight: bold !important; }';
    document.head.appendChild(__logRunFallback);

    // Monitor log run data loading and show fallback if needed
    setTimeout(function() {
      var checkLogRunData = setInterval(function() {
        var errorIndicator = document.querySelector('[class*="error"], [class*="failed"]');

        if (errorIndicator && errorIndicator.textContent.includes('error')) {
          clearInterval(checkLogRunData);

          var banner = document.createElement('div');
          banner.className = 'fallback-banner show';
          banner.innerHTML = '<strong>⚠️ Sistem sedang maintenance</strong><br>' +
            'Jika Anda tidak bisa mencatat aktivitas, silakan gunakan form ini sementara: ' +
            '<a href="https://docs.google.com/forms/d/e/1FAIpQLSclUS6HH4gFvc2k0riC932LFKBk79U4kh21b45mZ64e6gJesw/viewform?usp=dialog" target="_blank">' +
            'Klik di sini untuk form backup</a>';

          var mainContent = document.querySelector('[class*="main"], [class*="content"], body');
          if (mainContent) mainContent.insertBefore(banner, mainContent.firstChild);
        }
      }, 1000);

      setTimeout(function() { clearInterval(checkLogRunData); }, 30000);
    }, 2000);

    // Also catch and log any errors from log run feature
    window.addEventListener('error', function(e) {
      if (e.message && (e.message.includes('log') || e.message.includes('run') || e.message.includes('activity'))) {
        var banner = document.querySelector('.fallback-banner');
        if (banner) banner.classList.add('show');
      }
    });
});
