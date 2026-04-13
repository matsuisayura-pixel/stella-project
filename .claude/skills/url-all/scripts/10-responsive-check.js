// 10-responsive-check.js - レスポンシブ・ビューポート解析
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      viewport: {},
      mediaQueries: [],
      breakpoints: [],
      touchTargets: [],
      horizontalScroll: false,
      fontScaling: {},
      issues: [],
      summary: {}
    };

    // Viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      const content = viewportMeta.getAttribute('content') || '';
      result.viewport = {
        exists: true,
        content: content,
        hasWidthDeviceWidth: content.includes('width=device-width'),
        hasInitialScale: content.includes('initial-scale'),
        hasMaximumScale: content.includes('maximum-scale'),
        hasUserScalableNo: content.includes('user-scalable=no') || content.includes('user-scalable=0')
      };
      if (result.viewport.hasUserScalableNo) {
        result.issues.push({ severity: 'serious', message: 'user-scalable=no prevents zoom accessibility' });
      }
      const maxScaleMatch = content.match(/maximum-scale=([.\d]+)/);
      if (maxScaleMatch && parseFloat(maxScaleMatch[1]) < 2) {
        result.issues.push({ severity: 'moderate', message: `maximum-scale=${maxScaleMatch[1]} restricts zoom` });
      }
    } else {
      result.viewport = { exists: false };
      result.issues.push({ severity: 'serious', message: 'No viewport meta tag' });
    }

    // Media queries from stylesheets
    const breakpointSet = new Set();
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSMediaRule) {
              const mq = rule.conditionText || rule.media.mediaText;
              if (!result.mediaQueries.includes(mq)) {
                result.mediaQueries.push(mq);
              }

              // Extract breakpoint values
              const widthMatches = mq.matchAll(/(?:min|max)-width:\s*(\d+)(?:px|em|rem)/g);
              for (const m of widthMatches) {
                breakpointSet.add(parseInt(m[1]));
              }
            }
          }
        } catch (e) { /* cross-origin */ }
      }
    } catch (e) {}

    result.breakpoints = Array.from(breakpointSet).sort((a, b) => a - b);

    // Common breakpoint detection
    const commonBreakpoints = {
      320: 'Mobile S',
      375: 'Mobile M',
      425: 'Mobile L',
      768: 'Tablet',
      1024: 'Laptop',
      1440: 'Laptop L',
      2560: '4K'
    };
    result.breakpointLabels = result.breakpoints.map(bp => ({
      value: bp,
      label: commonBreakpoints[bp] || (bp < 480 ? 'Mobile' : bp < 768 ? 'Phablet' : bp < 1024 ? 'Tablet' : bp < 1440 ? 'Desktop' : 'Large Desktop')
    }));

    // Touch target analysis (minimum 44x44px recommended)
    let smallTargets = 0;
    let checkedTargets = 0;
    document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]').forEach(el => {
      if (checkedTargets >= 100) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          smallTargets++;
          if (result.touchTargets.length < 10) {
            result.touchTargets.push({
              element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
              text: el.textContent.trim().substring(0, 50),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
        }
        checkedTargets++;
      }
    });

    if (smallTargets > checkedTargets * 0.3) {
      result.issues.push({
        severity: 'moderate',
        message: `${smallTargets}/${checkedTargets} touch targets are smaller than 44x44px`
      });
    }

    // Horizontal scroll detection
    result.horizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    if (result.horizontalScroll) {
      result.issues.push({
        severity: 'serious',
        message: `Page has horizontal scroll (content width: ${document.documentElement.scrollWidth}px > viewport: ${document.documentElement.clientWidth}px)`
      });
    }

    // Font scaling check
    const fontSizes = {};
    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, td, th').forEach(el => {
      const size = getComputedStyle(el).fontSize;
      fontSizes[size] = (fontSizes[size] || 0) + 1;
    });

    const smallFonts = Object.entries(fontSizes)
      .filter(([size]) => parseFloat(size) < 12)
      .reduce((sum, [, count]) => sum + count, 0);

    result.fontScaling = {
      sizes: fontSizes,
      smallFontElements: smallFonts,
      usesRemOrEm: (() => {
        let remEm = 0, px = 0;
        try {
          for (const sheet of document.styleSheets) {
            try {
              const text = Array.from(sheet.cssRules).map(r => r.cssText).join(' ');
              remEm += (text.match(/\d+rem|\d+em/g) || []).length;
              px += (text.match(/\d+px/g) || []).length;
            } catch (e) {}
          }
        } catch (e) {}
        return { rem_em: remEm, px: px };
      })()
    };

    if (smallFonts > 0) {
      result.issues.push({
        severity: 'moderate',
        message: `${smallFonts} elements have font-size < 12px`
      });
    }

    // Responsive images check
    const totalImages = document.querySelectorAll('img').length;
    const responsiveImages = document.querySelectorAll('img[srcset], picture img').length;
    const fixedWidthImages = document.querySelectorAll('img[width]:not([style*="max-width"])').length;

    result.responsiveImages = {
      total: totalImages,
      withSrcset: responsiveImages,
      fixedWidth: fixedWidthImages
    };

    // Summary
    result.summary = {
      hasViewport: result.viewport.exists,
      viewportCorrect: result.viewport.hasWidthDeviceWidth && result.viewport.hasInitialScale,
      breakpointCount: result.breakpoints.length,
      breakpoints: result.breakpoints,
      smallTouchTargets: smallTargets,
      hasHorizontalScroll: result.horizontalScroll,
      smallFontElements: smallFonts,
      responsiveImageRatio: totalImages > 0 ? Math.round(responsiveImages / totalImages * 100) : 100,
      mediaQueryCount: result.mediaQueries.length,
      issueCount: result.issues.length
    };

    return result;
  });
}
