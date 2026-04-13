// 09-performance-metrics.js - パフォーマンス・リソース解析
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      score: 0,
      timing: {},
      resources: { summary: {}, byType: {} },
      domMetrics: {},
      blockingResources: [],
      issues: [],
      summary: {}
    };

    // Navigation Timing API
    const perf = performance.getEntriesByType('navigation')[0];
    if (perf) {
      result.timing = {
        dns: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
        tcp: Math.round(perf.connectEnd - perf.connectStart),
        ssl: perf.secureConnectionStart > 0 ? Math.round(perf.connectEnd - perf.secureConnectionStart) : 0,
        ttfb: Math.round(perf.responseStart - perf.requestStart),
        download: Math.round(perf.responseEnd - perf.responseStart),
        domInteractive: Math.round(perf.domInteractive - perf.navigationStart),
        domComplete: Math.round(perf.domComplete - perf.navigationStart),
        loadEvent: Math.round(perf.loadEventEnd - perf.navigationStart),
        domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.navigationStart),
        transferSize: perf.transferSize,
        encodedBodySize: perf.encodedBodySize,
        decodedBodySize: perf.decodedBodySize
      };
    }

    // Resource Timing
    const resources = performance.getEntriesByType('resource');
    const resourcesByType = {};
    let totalTransferSize = 0;

    resources.forEach(r => {
      const type = r.initiatorType || 'other';
      if (!resourcesByType[type]) {
        resourcesByType[type] = { count: 0, totalSize: 0, totalDuration: 0, items: [] };
      }
      resourcesByType[type].count++;
      resourcesByType[type].totalSize += r.transferSize || 0;
      resourcesByType[type].totalDuration += r.duration || 0;
      totalTransferSize += r.transferSize || 0;

      if (resourcesByType[type].items.length < 5) {
        resourcesByType[type].items.push({
          name: r.name.substring(0, 150),
          size: r.transferSize || 0,
          duration: Math.round(r.duration)
        });
      }
    });

    result.resources.byType = {};
    Object.entries(resourcesByType).forEach(([type, data]) => {
      result.resources.byType[type] = {
        count: data.count,
        totalSize: data.totalSize,
        totalSizeKB: Math.round(data.totalSize / 1024),
        avgDuration: Math.round(data.totalDuration / data.count),
        largest: data.items.sort((a, b) => b.size - a.size).slice(0, 3)
      };
    });

    result.resources.summary = {
      totalResources: resources.length,
      totalTransferSizeKB: Math.round(totalTransferSize / 1024),
      totalTransferSizeMB: Math.round(totalTransferSize / 1024 / 1024 * 100) / 100
    };

    // DOM Metrics
    const allElements = document.querySelectorAll('*');
    result.domMetrics = {
      totalElements: allElements.length,
      totalNodes: document.querySelectorAll('body *').length,
      maxDepth: (() => {
        let max = 0;
        allElements.forEach(el => {
          let depth = 0, node = el;
          while (node.parentElement) { depth++; node = node.parentElement; }
          if (depth > max) max = depth;
        });
        return max;
      })(),
      images: document.querySelectorAll('img').length,
      scripts: document.querySelectorAll('script').length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      iframes: document.querySelectorAll('iframe').length
    };

    // Blocking resources
    document.querySelectorAll('link[rel="stylesheet"]:not([media="print"]):not([disabled])').forEach(el => {
      result.blockingResources.push({
        type: 'css',
        href: el.href ? el.href.substring(0, 150) : 'inline'
      });
    });
    document.querySelectorAll('script:not([async]):not([defer]):not([type="module"])[src]').forEach(el => {
      result.blockingResources.push({
        type: 'js',
        src: el.src.substring(0, 150)
      });
    });

    // Lazy loading analysis
    const totalImages = document.querySelectorAll('img').length;
    const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src], img.lazy').length;

    // Issues detection
    if (result.domMetrics.totalElements > 1500) {
      result.issues.push({ severity: 'moderate', message: `Large DOM: ${result.domMetrics.totalElements} elements (recommended < 1500)` });
    }
    if (result.timing.ttfb > 600) {
      result.issues.push({ severity: 'serious', message: `Slow TTFB: ${result.timing.ttfb}ms (recommended < 600ms)` });
    }
    if (result.timing.domComplete > 3000) {
      result.issues.push({ severity: 'moderate', message: `Slow DOM Complete: ${result.timing.domComplete}ms (recommended < 3000ms)` });
    }
    if (result.blockingResources.length > 5) {
      result.issues.push({ severity: 'moderate', message: `${result.blockingResources.length} render-blocking resources` });
    }
    if (totalImages > 5 && lazyImages === 0) {
      result.issues.push({ severity: 'moderate', message: `${totalImages} images but no lazy loading detected` });
    }
    if (result.resources.summary.totalTransferSizeKB > 3000) {
      result.issues.push({ severity: 'serious', message: `Large page size: ${result.resources.summary.totalTransferSizeMB}MB (recommended < 3MB)` });
    }

    // Score calculation
    let score = 100;
    if (result.timing.ttfb > 200) score -= Math.min(25, Math.round((result.timing.ttfb - 200) / 40));
    if (result.timing.domComplete > 1000) score -= Math.min(25, Math.round((result.timing.domComplete - 1000) / 200));
    if (result.resources.summary.totalTransferSizeKB > 500) score -= Math.min(25, Math.round((result.resources.summary.totalTransferSizeKB - 500) / 200));
    if (result.domMetrics.totalElements > 800) score -= Math.min(25, Math.round((result.domMetrics.totalElements - 800) / 200));
    result.score = Math.max(0, Math.min(100, score));

    // Summary
    result.summary = {
      score: result.score,
      ttfb: result.timing.ttfb + 'ms',
      domComplete: result.timing.domComplete + 'ms',
      loadEvent: result.timing.loadEvent + 'ms',
      totalResources: result.resources.summary.totalResources,
      totalSizeMB: result.resources.summary.totalTransferSizeMB,
      domElements: result.domMetrics.totalElements,
      blockingResources: result.blockingResources.length,
      imagesTotal: totalImages,
      imagesLazy: lazyImages,
      issueCount: result.issues.length
    };

    return result;
  });
}
