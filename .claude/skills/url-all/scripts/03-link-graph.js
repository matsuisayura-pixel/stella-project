// 03-link-graph.js - 全リンク抽出・分類・グラフ構築
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const currentHost = location.hostname;
    const currentOrigin = location.origin;
    const result = {
      totalLinks: 0,
      internal: [],
      external: [],
      categories: {
        navigation: [],
        cta: [],
        footer: [],
        social: [],
        anchor: [],
        mailto: [],
        tel: [],
        download: [],
        javascript: [],
        other: []
      },
      summary: {}
    };

    const socialDomains = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'github.com', 'tiktok.com', 'pinterest.com', 'reddit.com', 'discord.gg', 'discord.com', 'threads.net', 'mastodon.social', 'bsky.app'];

    const ctaPatterns = /sign.?up|register|subscribe|get.?started|buy|purchase|download|try|start|join|login|log.?in|sign.?in|book|demo|contact|apply|enroll|cta/i;

    const isInElement = (el, selector) => {
      let node = el;
      while (node) {
        if (node.matches && node.matches(selector)) return true;
        node = node.parentElement;
      }
      return false;
    };

    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const fullHref = a.href;
      const text = a.textContent.trim().substring(0, 200);
      const rel = a.getAttribute('rel') || '';
      const target = a.getAttribute('target') || '';
      const ariaLabel = a.getAttribute('aria-label') || '';
      const classes = a.className || '';

      const linkInfo = {
        href: fullHref || href,
        text: text,
        rel: rel,
        target: target,
        ariaLabel: ariaLabel
      };

      result.totalLinks++;

      // Categorize by href type
      if (href.startsWith('mailto:')) {
        result.categories.mailto.push(linkInfo);
        return;
      }
      if (href.startsWith('tel:')) {
        result.categories.tel.push(linkInfo);
        return;
      }
      if (href.startsWith('#')) {
        result.categories.anchor.push(linkInfo);
        return;
      }
      if (href.startsWith('javascript:')) {
        result.categories.javascript.push(linkInfo);
        return;
      }
      if (a.hasAttribute('download')) {
        result.categories.download.push(linkInfo);
        return;
      }

      // Internal vs External
      try {
        const linkUrl = new URL(fullHref);
        if (linkUrl.hostname === currentHost || linkUrl.hostname.endsWith('.' + currentHost)) {
          result.internal.push(linkInfo);
        } else {
          result.external.push(linkInfo);

          // Social links
          if (socialDomains.some(d => linkUrl.hostname.includes(d))) {
            result.categories.social.push(linkInfo);
          }
        }
      } catch (e) {
        result.categories.other.push(linkInfo);
      }

      // Context-based categorization
      if (isInElement(a, 'nav, [role="navigation"]')) {
        result.categories.navigation.push(linkInfo);
      }
      if (isInElement(a, 'footer')) {
        result.categories.footer.push(linkInfo);
      }
      if (ctaPatterns.test(text) || ctaPatterns.test(classes) || ctaPatterns.test(ariaLabel)) {
        result.categories.cta.push(linkInfo);
      }
    });

    // Summary
    result.summary = {
      total: result.totalLinks,
      internal: result.internal.length,
      external: result.external.length,
      navigation: result.categories.navigation.length,
      cta: result.categories.cta.length,
      footer: result.categories.footer.length,
      social: result.categories.social.length,
      anchor: result.categories.anchor.length,
      mailto: result.categories.mailto.length,
      tel: result.categories.tel.length,
      download: result.categories.download.length,
      javascript: result.categories.javascript.length
    };

    // Unique external domains
    const externalDomains = {};
    result.external.forEach(l => {
      try {
        const d = new URL(l.href).hostname;
        externalDomains[d] = (externalDomains[d] || 0) + 1;
      } catch (e) {}
    });
    result.externalDomains = externalDomains;

    return result;
  });
}
