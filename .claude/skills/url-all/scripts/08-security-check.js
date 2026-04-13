// 08-security-check.js - セキュリティヘッダー・HTTPS・CSP
// Usage: browser_run_code で実行 (ページコンテンツからの検出)
async (page) => {
  return await page.evaluate(() => {
    const result = {
      score: 0,
      https: {},
      headers: {},
      mixedContent: [],
      forms: [],
      externalScripts: [],
      sri: { total: 0, withIntegrity: 0, without: [] },
      cookies: [],
      issues: [],
      summary: {}
    };

    const addIssue = (severity, category, message) => {
      result.issues.push({ severity, category, message });
    };

    // HTTPS check
    result.https = {
      isSecure: location.protocol === 'https:',
      protocol: location.protocol
    };
    if (!result.https.isSecure) {
      addIssue('critical', 'https', 'Page is not served over HTTPS');
    }

    // Mixed content detection
    const checkMixed = (elements, attr) => {
      elements.forEach(el => {
        const url = el.getAttribute(attr);
        if (url && url.startsWith('http://') && location.protocol === 'https:') {
          result.mixedContent.push({
            tag: el.tagName.toLowerCase(),
            attribute: attr,
            url: url.substring(0, 150)
          });
        }
      });
    };
    checkMixed(document.querySelectorAll('script[src]'), 'src');
    checkMixed(document.querySelectorAll('link[href]'), 'href');
    checkMixed(document.querySelectorAll('img[src]'), 'src');
    checkMixed(document.querySelectorAll('iframe[src]'), 'src');
    checkMixed(document.querySelectorAll('video[src], audio[src]'), 'src');

    if (result.mixedContent.length > 0) {
      addIssue('serious', 'mixed-content', `${result.mixedContent.length} mixed content resources found`);
    }

    // CSP detection via meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    result.headers.cspMeta = cspMeta ? cspMeta.getAttribute('content') : null;
    if (!cspMeta) {
      addIssue('moderate', 'csp', 'No Content-Security-Policy meta tag (may be set via HTTP header)');
    }

    // X-Frame-Options via meta (rarely used but possible)
    const xfo = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    result.headers.xFrameOptionsMeta = xfo ? xfo.getAttribute('content') : null;

    // Form security
    document.querySelectorAll('form').forEach(form => {
      const formInfo = {
        action: form.action,
        method: form.method,
        hasPasswordField: !!form.querySelector('input[type="password"]'),
        sendsOverHttp: form.action && form.action.startsWith('http://'),
        hasAutocompleteOff: form.getAttribute('autocomplete') === 'off'
      };

      if (formInfo.hasPasswordField && formInfo.sendsOverHttp) {
        addIssue('critical', 'forms', 'Password form submits over HTTP');
      }
      if (formInfo.hasPasswordField && form.method.toLowerCase() === 'get') {
        addIssue('critical', 'forms', 'Password form uses GET method');
      }

      result.forms.push(formInfo);
    });

    // External scripts
    document.querySelectorAll('script[src]').forEach(s => {
      const src = s.src;
      try {
        const scriptUrl = new URL(src);
        if (scriptUrl.hostname !== location.hostname) {
          const scriptInfo = {
            src: src.substring(0, 200),
            hasIntegrity: s.hasAttribute('integrity'),
            integrity: s.getAttribute('integrity') || null,
            crossorigin: s.getAttribute('crossorigin') || null
          };
          result.externalScripts.push(scriptInfo);

          result.sri.total++;
          if (s.hasAttribute('integrity')) {
            result.sri.withIntegrity++;
          } else {
            result.sri.without.push(src.substring(0, 150));
          }
        }
      } catch (e) {}
    });

    if (result.sri.total > 0 && result.sri.withIntegrity < result.sri.total) {
      addIssue('moderate', 'sri', `${result.sri.total - result.sri.withIntegrity} external scripts without SRI`);
    }

    // Inline scripts (potential XSS vectors)
    const inlineScripts = document.querySelectorAll('script:not([src])');
    result.inlineScriptCount = inlineScripts.length;

    // Event handler attributes (potential XSS vectors)
    const eventHandlerAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange'];
    let eventHandlerCount = 0;
    eventHandlerAttrs.forEach(attr => {
      eventHandlerCount += document.querySelectorAll(`[${attr}]`).length;
    });
    result.inlineEventHandlers = eventHandlerCount;

    // Cookie analysis (accessible cookies only)
    result.cookies = document.cookie.split(';').filter(c => c.trim()).map(c => {
      const [name] = c.trim().split('=');
      return { name: name.trim(), httpOnly: false /* can't detect from JS if true */ };
    });

    // Target _blank without rel="noopener"
    const unsafeTargetBlank = document.querySelectorAll('a[target="_blank"]:not([rel*="noopener"])');
    if (unsafeTargetBlank.length > 0) {
      addIssue('minor', 'links', `${unsafeTargetBlank.length} links with target="_blank" without rel="noopener"`);
    }

    // Autocomplete on sensitive fields
    document.querySelectorAll('input[type="password"][autocomplete="on"], input[type="password"]:not([autocomplete])').forEach(() => {
      addIssue('minor', 'forms', 'Password field without autocomplete="new-password" or "current-password"');
    });

    // Calculate score
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    const seriousCount = result.issues.filter(i => i.severity === 'serious').length;
    const moderateCount = result.issues.filter(i => i.severity === 'moderate').length;
    const minorCount = result.issues.filter(i => i.severity === 'minor').length;

    let score = 100;
    if (result.https.isSecure) score += 0; else score -= 30;
    score -= criticalCount * 20;
    score -= seriousCount * 10;
    score -= moderateCount * 5;
    score -= minorCount * 2;
    result.score = Math.max(0, Math.min(100, score));

    // Summary
    result.summary = {
      score: result.score,
      isHttps: result.https.isSecure,
      hasCsp: !!result.headers.cspMeta,
      mixedContentCount: result.mixedContent.length,
      externalScriptCount: result.externalScripts.length,
      sriCoverage: result.sri.total > 0 ? Math.round(result.sri.withIntegrity / result.sri.total * 100) : 100,
      inlineScripts: result.inlineScriptCount,
      inlineEventHandlers: result.inlineEventHandlers,
      cookieCount: result.cookies.length,
      totalIssues: result.issues.length,
      critical: criticalCount,
      serious: seriousCount,
      moderate: moderateCount,
      minor: minorCount
    };

    return result;
  });
}
