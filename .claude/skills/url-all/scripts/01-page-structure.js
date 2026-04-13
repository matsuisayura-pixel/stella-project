// 01-page-structure.js - DOM構造・見出し・セマンティック解析
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      title: document.title,
      url: location.href,
      charset: document.characterSet,
      doctype: document.doctype ? document.doctype.name : null,
      lang: document.documentElement.lang || null,

      meta: {},
      headings: [],
      semanticElements: {},
      jsonLd: [],
      openGraph: {},
      twitterCard: {},
      domStats: {}
    };

    // Meta tags
    document.querySelectorAll('meta').forEach(m => {
      const name = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv');
      const content = m.getAttribute('content');
      if (name && content) {
        if (name.startsWith('og:')) {
          result.openGraph[name] = content;
        } else if (name.startsWith('twitter:')) {
          result.twitterCard[name] = content;
        } else {
          result.meta[name] = content;
        }
      }
    });

    // Canonical & alternate
    const canonical = document.querySelector('link[rel="canonical"]');
    result.canonical = canonical ? canonical.href : null;
    result.alternates = Array.from(document.querySelectorAll('link[rel="alternate"]')).map(l => ({
      hreflang: l.getAttribute('hreflang'),
      href: l.href,
      type: l.getAttribute('type')
    }));

    // Heading tree
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      result.headings.push({
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim().substring(0, 200),
        id: h.id || null
      });
    });

    // Semantic elements count
    const semanticTags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer', 'figure', 'figcaption', 'details', 'summary', 'dialog', 'time'];
    semanticTags.forEach(tag => {
      const count = document.querySelectorAll(tag).length;
      if (count > 0) result.semanticElements[tag] = count;
    });

    // JSON-LD
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        result.jsonLd.push(JSON.parse(s.textContent));
      } catch (e) {
        result.jsonLd.push({ error: 'parse_failed', raw: s.textContent.substring(0, 500) });
      }
    });

    // DOM statistics
    const allElements = document.querySelectorAll('*');
    result.domStats = {
      totalElements: allElements.length,
      totalTextNodes: document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT).nextNode() ? (() => {
        let count = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) count++;
        return count;
      })() : 0,
      maxDepth: (() => {
        let max = 0;
        allElements.forEach(el => {
          let depth = 0, node = el;
          while (node.parentElement) { depth++; node = node.parentElement; }
          if (depth > max) max = depth;
        });
        return max;
      })(),
      scripts: document.querySelectorAll('script').length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      inlineStyles: document.querySelectorAll('[style]').length
    };

    return result;
  });
}
