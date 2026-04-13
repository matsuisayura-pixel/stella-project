// 07-accessibility-audit.js - WCAG準拠チェック・ARIA・コントラスト
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      score: 0,
      issues: [],
      ariaUsage: {},
      landmarks: [],
      focusManagement: {},
      contrastIssues: [],
      summary: {}
    };

    const addIssue = (severity, category, message, element) => {
      result.issues.push({
        severity, // critical, serious, moderate, minor
        category,
        message,
        element: element ? element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') : null
      });
    };

    // 1. Images without alt
    const imagesNoAlt = document.querySelectorAll('img:not([alt])');
    imagesNoAlt.forEach(img => {
      addIssue('critical', 'images', `Image missing alt attribute: ${img.src.substring(0, 80)}`, img);
    });

    // 2. Empty alt on non-decorative images
    document.querySelectorAll('img[alt=""]').forEach(img => {
      if (img.width > 50 && img.height > 50) {
        addIssue('moderate', 'images', `Potentially meaningful image with empty alt: ${img.src.substring(0, 80)}`, img);
      }
    });

    // 3. Document language
    const htmlLang = document.documentElement.getAttribute('lang');
    if (!htmlLang) {
      addIssue('serious', 'language', 'Missing lang attribute on <html> element');
    }

    // 4. Page title
    if (!document.title || document.title.trim() === '') {
      addIssue('serious', 'structure', 'Page has no title or empty title');
    }

    // 5. Heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) addIssue('serious', 'headings', 'No H1 heading found');
    if (h1Count > 1) addIssue('moderate', 'headings', `Multiple H1 headings found: ${h1Count}`);

    let prevLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (level > prevLevel + 1 && prevLevel !== 0) {
        addIssue('moderate', 'headings', `Heading level skipped: H${prevLevel} to H${level}`, h);
      }
      prevLevel = level;
    });

    // 6. Form labels
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').forEach(el => {
      const hasLabel = el.id && document.querySelector(`label[for="${el.id}"]`);
      const hasAriaLabel = el.getAttribute('aria-label');
      const hasAriaLabelledBy = el.getAttribute('aria-labelledby');
      const hasTitle = el.getAttribute('title');
      const hasPlaceholder = el.getAttribute('placeholder');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
        addIssue('serious', 'forms', `Form input without label: ${el.type || el.tagName}`, el);
      } else if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && hasPlaceholder) {
        addIssue('moderate', 'forms', `Input relies only on placeholder for label`, el);
      }
    });

    // 7. ARIA roles and attributes
    document.querySelectorAll('[role]').forEach(el => {
      const role = el.getAttribute('role');
      result.ariaUsage[role] = (result.ariaUsage[role] || 0) + 1;
    });

    // ARIA landmarks
    const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'search', 'form', 'region'];
    landmarkRoles.forEach(role => {
      const elements = document.querySelectorAll(`[role="${role}"]`);
      const semanticMap = { banner: 'header', navigation: 'nav', main: 'main', contentinfo: 'footer', complementary: 'aside' };
      const semanticEls = semanticMap[role] ? document.querySelectorAll(semanticMap[role]) : [];

      if (elements.length > 0 || semanticEls.length > 0) {
        result.landmarks.push({
          role,
          explicitCount: elements.length,
          implicitCount: semanticEls.length
        });
      }
    });

    if (!document.querySelector('main, [role="main"]')) {
      addIssue('serious', 'landmarks', 'No main landmark found');
    }

    // 8. Links
    document.querySelectorAll('a').forEach(a => {
      const text = a.textContent.trim();
      if (!text && !a.getAttribute('aria-label') && !a.querySelector('img[alt]')) {
        addIssue('serious', 'links', 'Link with no accessible text', a);
      }
      const genericTexts = ['click here', 'here', 'read more', 'learn more', 'more', 'link'];
      if (genericTexts.includes(text.toLowerCase())) {
        addIssue('minor', 'links', `Generic link text: "${text}"`, a);
      }
    });

    // 9. Focus indicators (check for outline:none)
    let outlineNoneCount = 0;
    document.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => {
      const style = getComputedStyle(el);
      if (style.outlineStyle === 'none' && style.outlineWidth === '0px') {
        outlineNoneCount++;
      }
    });
    result.focusManagement = {
      outlineNoneElements: outlineNoneCount,
      tabindexElements: document.querySelectorAll('[tabindex]').length,
      negativeTabindex: document.querySelectorAll('[tabindex="-1"]').length,
      skipLink: !!document.querySelector('a[href="#main"], a[href="#content"], .skip-link, .skip-to-main')
    };

    if (!result.focusManagement.skipLink) {
      addIssue('moderate', 'navigation', 'No skip link found');
    }

    // 10. Buttons without accessible names
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent.trim();
      if (!text && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
        addIssue('serious', 'buttons', 'Button without accessible name', btn);
      }
    });

    // 11. Color contrast (simplified check for text on common backgrounds)
    const getLuminance = (color) => {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      const [r, g, b] = [match[1], match[2], match[3]].map(c => {
        c = parseInt(c) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const getContrastRatio = (l1, l2) => {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    let contrastChecked = 0;
    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, span, li, td, th, label').forEach(el => {
      if (contrastChecked >= 50) return;
      const style = getComputedStyle(el);
      const textLum = getLuminance(style.color);
      const bgLum = getLuminance(style.backgroundColor);
      if (textLum !== null && bgLum !== null) {
        const ratio = getContrastRatio(textLum, bgLum);
        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight) >= 700;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
        const minRatio = isLargeText ? 3 : 4.5;

        if (ratio < minRatio) {
          result.contrastIssues.push({
            element: el.tagName.toLowerCase(),
            text: el.textContent.trim().substring(0, 50),
            ratio: Math.round(ratio * 100) / 100,
            required: minRatio,
            color: style.color,
            background: style.backgroundColor
          });
        }
        contrastChecked++;
      }
    });

    // Calculate score
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    const seriousCount = result.issues.filter(i => i.severity === 'serious').length;
    const moderateCount = result.issues.filter(i => i.severity === 'moderate').length;
    const minorCount = result.issues.filter(i => i.severity === 'minor').length;

    result.score = Math.max(0, Math.min(100,
      100 - (criticalCount * 15) - (seriousCount * 8) - (moderateCount * 3) - (minorCount * 1)
    ));

    // Summary
    result.summary = {
      score: result.score,
      totalIssues: result.issues.length,
      critical: criticalCount,
      serious: seriousCount,
      moderate: moderateCount,
      minor: minorCount,
      landmarksFound: result.landmarks.length,
      ariaRolesUsed: Object.keys(result.ariaUsage).length,
      contrastIssues: result.contrastIssues.length,
      hasSkipLink: result.focusManagement.skipLink,
      hasLangAttribute: !!htmlLang,
      headingCount: headings.length,
      h1Count: h1Count
    };

    return result;
  });
}
