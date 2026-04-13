// 11-recursive-crawler.js - BFS再帰クロール用リンク収集+フィルタ
// ページの全リンクを収集し、同一ドメイン内部リンクをフィルタリングして返す
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const currentUrl = new URL(location.href);
    const currentDomain = currentUrl.hostname;

    // URL正規化関数
    const normalizeUrl = (urlStr) => {
      try {
        const u = new URL(urlStr, location.href);
        // fragment除去
        u.hash = '';
        // UTMパラメータ除去
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        utmKeys.forEach(k => u.searchParams.delete(k));
        // trailing slash統一（パスが / で終わる場合はそのまま、ファイル名がある場合はそのまま）
        let path = u.pathname;
        if (path.length > 1 && path.endsWith('/')) {
          path = path.slice(0, -1);
        }
        u.pathname = path;
        return u.href;
      } catch {
        return null;
      }
    };

    // 除外パターン
    const excludePatterns = [
      /\/login/i, /\/signin/i, /\/signup/i, /\/register/i,
      /\/admin/i, /\/dashboard/i,
      /\/api\//i, /\/graphql/i,
      /\/search/i, /\/cart/i, /\/checkout/i,
      /\.(pdf|zip|tar|gz|rar|exe|dmg|pkg|deb|rpm)$/i,
      /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp)$/i,
      /\.(mp3|mp4|avi|mov|wmv|flv|webm)$/i,
      /\.(css|js|woff|woff2|ttf|eot)$/i,
      /mailto:/i, /tel:/i, /javascript:/i,
      /#$/
    ];

    const shouldExclude = (url) => {
      return excludePatterns.some(pattern => pattern.test(url));
    };

    // サブドメイン含む同一サイト判定
    const isSameSite = (hostname) => {
      // 完全一致
      if (hostname === currentDomain) return true;
      // サブドメイン（例: docs.ollama.com と ollama.com）
      const baseDomain = currentDomain.replace(/^www\./, '');
      const targetBase = hostname.replace(/^www\./, '');
      return targetBase === baseDomain || targetBase.endsWith('.' + baseDomain);
    };

    const internalLinks = new Map(); // URL -> { text, rel, section }
    const externalLinks = new Map(); // URL -> { text, domain }
    const seen = new Set();

    // 全リンクを収集
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;

      const normalized = normalizeUrl(href);
      if (!normalized) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);

      const text = a.textContent.trim().substring(0, 100);
      const rel = a.getAttribute('rel') || '';
      const isNofollow = rel.includes('nofollow');

      // 除外パターンチェック
      if (shouldExclude(normalized)) return;

      try {
        const linkUrl = new URL(normalized);

        if (isSameSite(linkUrl.hostname)) {
          // 内部リンク
          if (!isNofollow) {
            // リンクの位置を判定
            let section = 'content';
            const parent = a.closest('nav, header, footer, aside, [role="navigation"]');
            if (parent) {
              const parentTag = parent.tagName.toLowerCase();
              if (parentTag === 'nav' || parent.getAttribute('role') === 'navigation') section = 'navigation';
              else if (parentTag === 'header') section = 'header';
              else if (parentTag === 'footer') section = 'footer';
              else if (parentTag === 'aside') section = 'sidebar';
            }

            internalLinks.set(normalized, {
              url: normalized,
              text: text,
              section: section,
              subdomain: linkUrl.hostname !== currentDomain ? linkUrl.hostname : null
            });
          }
        } else {
          // 外部リンク
          externalLinks.set(normalized, {
            url: normalized,
            text: text,
            domain: linkUrl.hostname
          });
        }
      } catch {
        // invalid URL, skip
      }
    });

    // 内部リンクをセクション別にソート（content優先）
    const sectionOrder = { content: 0, sidebar: 1, navigation: 2, header: 3, footer: 4 };
    const sortedInternal = Array.from(internalLinks.values())
      .sort((a, b) => (sectionOrder[a.section] || 5) - (sectionOrder[b.section] || 5));

    // 外部ドメイン集約
    const externalDomains = {};
    Array.from(externalLinks.values()).forEach(link => {
      if (!externalDomains[link.domain]) {
        externalDomains[link.domain] = [];
      }
      externalDomains[link.domain].push({ url: link.url, text: link.text });
    });

    return {
      currentUrl: location.href,
      currentDomain: currentDomain,
      internalLinks: sortedInternal,
      externalLinks: Array.from(externalLinks.values()),
      externalDomains: externalDomains,
      stats: {
        totalLinksFound: seen.size,
        internalCount: internalLinks.size,
        externalCount: externalLinks.size,
        externalDomainCount: Object.keys(externalDomains).length,
        bySection: {
          content: sortedInternal.filter(l => l.section === 'content').length,
          navigation: sortedInternal.filter(l => l.section === 'navigation').length,
          sidebar: sortedInternal.filter(l => l.section === 'sidebar').length,
          header: sortedInternal.filter(l => l.section === 'header').length,
          footer: sortedInternal.filter(l => l.section === 'footer').length
        }
      }
    };
  });
}
