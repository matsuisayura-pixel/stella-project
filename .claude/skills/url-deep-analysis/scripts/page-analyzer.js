/**
 * Page Analyzer Scripts for Playwright MCP browser_evaluate
 *
 * These scripts are designed to be copy-pasted into Playwright MCP's
 * browser_evaluate tool for deep page analysis.
 *
 * Usage: browser_evaluate({ function: "<script content here>" })
 */

// ============================================================
// Script 1: Full Page Structure Analysis
// ============================================================
const analyzePageStructure = `
async (page) => {
  return await page.evaluate(() => {
    // Headings
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(el => ({
      tag: el.tagName,
      text: el.textContent.trim().substring(0, 120),
      id: el.id || null
    }));

    // Semantic elements
    const semanticTags = ['header','nav','main','article','section','aside','footer','form'];
    const semantics = semanticTags.map(tag => ({
      tag,
      count: document.querySelectorAll(tag).length
    })).filter(s => s.count > 0);

    // Meta tags
    const metas = [...document.querySelectorAll('meta')].map(el => ({
      name: el.getAttribute('name') || el.getAttribute('property') || el.getAttribute('http-equiv'),
      content: (el.getAttribute('content') || '').substring(0, 300)
    })).filter(m => m.name);

    // Page stats
    const stats = {
      title: document.title,
      totalElements: document.querySelectorAll('*').length,
      totalImages: document.images.length,
      totalLinks: document.links.length,
      totalForms: document.forms.length,
      totalScripts: document.scripts.length,
      totalStyleSheets: document.styleSheets.length,
      doctype: document.doctype ? document.doctype.name : null,
      lang: document.documentElement.lang || null,
      charset: document.characterSet
    };

    // JSON-LD structured data
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => {
      try { return JSON.parse(el.textContent); } catch { return null; }
    }).filter(Boolean);

    return { headings, semantics, metas, stats, jsonLd };
  });
}
`;

// ============================================================
// Script 2: CSS & Design Analysis
// ============================================================
const analyzeCssDesign = `
async (page) => {
  return await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');

    // Color palette extraction
    const colorMap = {};
    const bgColorMap = {};
    for (const el of allElements) {
      const style = getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      if (color && color !== 'rgba(0, 0, 0, 0)') {
        colorMap[color] = (colorMap[color] || 0) + 1;
      }
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        bgColorMap[bgColor] = (bgColorMap[bgColor] || 0) + 1;
      }
    }

    // Top colors
    const topColors = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([color, count]) => ({ color, count, usage: 'text' }));

    const topBgColors = Object.entries(bgColorMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([color, count]) => ({ color, count, usage: 'background' }));

    // Font families
    const fontMap = {};
    for (const el of allElements) {
      const font = getComputedStyle(el).fontFamily;
      if (font) {
        const primary = font.split(',')[0].trim().replace(/['"]/g, '');
        fontMap[primary] = (fontMap[primary] || 0) + 1;
      }
    }
    const topFonts = Object.entries(fontMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([font, count]) => ({ font, count }));

    // Layout detection
    let flexCount = 0;
    let gridCount = 0;
    for (const el of allElements) {
      const display = getComputedStyle(el).display;
      if (display === 'flex' || display === 'inline-flex') flexCount++;
      if (display === 'grid' || display === 'inline-grid') gridCount++;
    }

    // External CSS files
    const cssFiles = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(el => el.href).filter(Boolean);

    // Responsive meta
    const viewport = document.querySelector('meta[name="viewport"]');

    return {
      colors: { text: topColors, background: topBgColors },
      fonts: topFonts,
      layout: { flexCount, gridCount, hasFlexbox: flexCount > 0, hasGrid: gridCount > 0 },
      cssFiles,
      viewport: viewport ? viewport.getAttribute('content') : null
    };
  });
}
`;

// ============================================================
// Script 3: Link Analysis & CTA Detection
// ============================================================
const analyzeLinks = `
async (page) => {
  return await page.evaluate(() => {
    const currentUrl = new URL(window.location.href);
    const links = [...document.querySelectorAll('a[href]')].map(el => {
      let href = el.href;
      let isInternal = false;
      try {
        const linkUrl = new URL(href);
        isInternal = linkUrl.hostname === currentUrl.hostname;
      } catch { /* skip invalid */ }

      const text = el.textContent.trim().substring(0, 100);
      const isButton = el.closest('button') !== null
        || el.classList.toString().match(/btn|button|cta/i) !== null
        || getComputedStyle(el).display === 'inline-block';
      const isCta = isButton || /購入|申込|登録|ダウンロード|今すぐ|無料|buy|sign.?up|register|download|get.?started|try|subscribe/i.test(text);

      return {
        href,
        text: text || '[no text]',
        isInternal,
        isCta,
        rel: el.getAttribute('rel'),
        target: el.getAttribute('target'),
        ariaLabel: el.getAttribute('aria-label')
      };
    });

    const internal = links.filter(l => l.isInternal);
    const external = links.filter(l => !l.isInternal);
    const ctas = links.filter(l => l.isCta);

    // Navigation links (in nav elements)
    const navLinks = [...document.querySelectorAll('nav a[href]')].map(el => ({
      href: el.href,
      text: el.textContent.trim().substring(0, 60)
    }));

    return {
      total: links.length,
      internal: { count: internal.length, sample: internal.slice(0, 30) },
      external: { count: external.length, sample: external.slice(0, 20) },
      ctas: { count: ctas.length, items: ctas },
      navigation: navLinks
    };
  });
}
`;

// ============================================================
// Script 4: Media & Assets Analysis
// ============================================================
const analyzeMedia = `
async (page) => {
  return await page.evaluate(() => {
    // Images
    const images = [...document.querySelectorAll('img')].map(el => ({
      src: el.src.substring(0, 200),
      alt: el.alt || '[no alt]',
      width: el.naturalWidth || el.width,
      height: el.naturalHeight || el.height,
      loading: el.loading,
      hasAlt: !!el.alt
    }));

    // Videos
    const videos = [...document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]')]
      .map(el => ({
        tag: el.tagName,
        src: el.src || el.querySelector('source')?.src || '',
        type: el.tagName === 'IFRAME' ? 'embed' : 'native'
      }));

    // SVGs
    const svgCount = document.querySelectorAll('svg').length;

    // External scripts
    const scripts = [...document.querySelectorAll('script[src]')]
      .map(el => el.src).filter(Boolean);

    // Icons (font icons, SVG icons)
    const iconElements = document.querySelectorAll('[class*="icon"], [class*="fa-"], [class*="material-icon"]');

    // Alt text audit
    const imagesWithoutAlt = images.filter(i => !i.hasAlt).length;

    return {
      images: { count: images.length, withoutAlt: imagesWithoutAlt, items: images.slice(0, 30) },
      videos: { count: videos.length, items: videos },
      svgCount,
      scripts: { count: scripts.length, items: scripts.slice(0, 20) },
      iconCount: iconElements.length
    };
  });
}
`;

// ============================================================
// Script 5: SPA Detection
// ============================================================
const detectSpa = `
async (page) => {
  return await page.evaluate(() => {
    const markers = {
      react: !!document.querySelector('#root, #__next, [data-reactroot]'),
      vue: !!document.querySelector('#app, [data-v-]') || !!window.__VUE__,
      angular: !!document.querySelector('[ng-app], [data-ng-app], app-root'),
      svelte: !!document.querySelector('[class*="svelte-"]'),
      nextjs: !!document.querySelector('#__next') || !!window.__NEXT_DATA__,
      nuxt: !!document.querySelector('#__nuxt') || !!window.__NUXT__,
      gatsby: !!document.querySelector('#___gatsby'),
      astro: !!document.querySelector('[data-astro-cid]')
    };

    const detectedFrameworks = Object.entries(markers)
      .filter(([, detected]) => detected)
      .map(([name]) => name);

    const isSpa = detectedFrameworks.length > 0;

    // Check for hydration markers
    const hasHydration = !!document.querySelector('[data-reactroot], [data-server-rendered], [data-astro-cid]');

    return {
      isSpa,
      detectedFrameworks,
      hasHydration,
      hasServiceWorker: 'serviceWorker' in navigator
    };
  });
}
`;

// ============================================================
// Script 6: Performance Metrics
// ============================================================
const analyzePerformance = `
async (page) => {
  return await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');

    const resourcesByType = {};
    for (const r of resources) {
      const type = r.initiatorType || 'other';
      if (!resourcesByType[type]) {
        resourcesByType[type] = { count: 0, totalSize: 0 };
      }
      resourcesByType[type].count++;
      resourcesByType[type].totalSize += r.transferSize || 0;
    }

    return {
      timing: perf ? {
        domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
        domComplete: Math.round(perf.domComplete - perf.startTime),
        loadEvent: Math.round(perf.loadEventEnd - perf.startTime),
        ttfb: Math.round(perf.responseStart - perf.startTime)
      } : null,
      resources: {
        total: resources.length,
        byType: resourcesByType
      },
      domSize: document.querySelectorAll('*').length
    };
  });
}
`;

// Export for reference
module.exports = {
  analyzePageStructure,
  analyzeCssDesign,
  analyzeLinks,
  analyzeMedia,
  detectSpa,
  analyzePerformance,
};
