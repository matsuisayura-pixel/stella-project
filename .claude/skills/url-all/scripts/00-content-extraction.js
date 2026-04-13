// 00-content-extraction.js - コンテンツ完全抽出（最重要スクリプト）
// ページに「何が書いてあるか」を全て取得する
// Usage: browser_run_code で実行
// compact モード: depth 2+ 用。fullText 2000文字, mainContent 30件, links 20件に制限
// 通常モード: 起点URL用。制限なし
// compact モードで使用する場合は、スクリプト実行前に window.__URL_ALL_COMPACT = true を設定
async (page) => {
  return await page.evaluate(() => {
    const COMPACT = window.__URL_ALL_COMPACT === true;
    const COMPACT_TEXT_LIMIT = 2000;
    const COMPACT_CONTENT_LIMIT = 30;
    const COMPACT_LINK_LIMIT = 20;
    const result = {
      title: document.title,
      url: location.href,
      mainContent: [],
      fullText: '',
      codeBlocks: [],
      lists: [],
      tables: [],
      images: [],
      videos: [],
      blockquotes: [],
      links: [],
      summary: {}
    };

    // コンテンツ領域を特定（article > main > body の優先順）
    const contentRoot = document.querySelector('article')
      || document.querySelector('main')
      || document.querySelector('[role="main"]')
      || document.querySelector('.content, .post, .entry, #content, #main')
      || document.body;

    // ブロック要素を順序通りに走査し、構造化データとして抽出
    const walk = (node) => {
      if (!node) return;

      for (const child of node.children) {
        const tag = child.tagName.toLowerCase();

        // ナビゲーション・ヘッダー・フッターはスキップ
        if (['nav', 'header', 'footer', 'script', 'style', 'noscript'].includes(tag)) continue;
        if (child.getAttribute('role') === 'navigation') continue;
        // 非表示要素をスキップ
        if (child.offsetParent === null && tag !== 'body' && tag !== 'html') continue;

        // 見出し
        if (/^h[1-6]$/.test(tag)) {
          result.mainContent.push({
            type: 'heading',
            level: parseInt(tag[1]),
            text: child.textContent.trim(),
            id: child.id || null
          });
          continue;
        }

        // 段落
        if (tag === 'p') {
          const text = child.textContent.trim();
          if (!text) continue;

          // 段落内の画像
          const imgs = child.querySelectorAll('img');
          if (imgs.length > 0) {
            imgs.forEach(img => {
              result.mainContent.push({
                type: 'image',
                src: img.src || img.getAttribute('data-src') || '',
                alt: img.alt || '',
                title: img.title || ''
              });
              result.images.push({
                src: img.src || img.getAttribute('data-src') || '',
                alt: img.alt || '',
                context: text.substring(0, 100)
              });
            });
            // 画像以外のテキストがあれば段落としても記録
            const textOnly = text.replace(/\s+/g, ' ').trim();
            if (textOnly && textOnly !== img?.alt) {
              result.mainContent.push({ type: 'paragraph', text: textOnly });
            }
          } else {
            // 段落内のリンク情報も保持
            const linksInP = [];
            child.querySelectorAll('a').forEach(a => {
              linksInP.push({ text: a.textContent.trim(), href: a.href });
            });
            result.mainContent.push({
              type: 'paragraph',
              text: text,
              links: linksInP.length > 0 ? linksInP : undefined
            });
          }
          continue;
        }

        // コードブロック（pre > code, pre, code）
        if (tag === 'pre' || (tag === 'code' && child.parentElement.tagName !== 'P' && child.parentElement.tagName !== 'SPAN')) {
          const codeEl = child.querySelector('code') || child;
          const code = codeEl.textContent.trim();
          const lang = codeEl.className.match(/language-(\w+)/)?.[1]
            || codeEl.getAttribute('data-language')
            || '';
          result.mainContent.push({
            type: 'code',
            language: lang,
            content: code
          });
          result.codeBlocks.push({ language: lang, content: code });
          continue;
        }

        // リスト（ul, ol）
        if (tag === 'ul' || tag === 'ol') {
          const items = [];
          child.querySelectorAll(':scope > li').forEach(li => {
            const liText = li.textContent.trim();
            // リスト項目内のリンク
            const liLinks = [];
            li.querySelectorAll('a').forEach(a => {
              liLinks.push({ text: a.textContent.trim(), href: a.href });
            });
            // strong/em のハイライト
            const strong = li.querySelector('strong, b');
            items.push({
              text: liText,
              highlight: strong ? strong.textContent.trim() : undefined,
              links: liLinks.length > 0 ? liLinks : undefined
            });
          });
          result.mainContent.push({
            type: 'list',
            ordered: tag === 'ol',
            items: items
          });
          result.lists.push({ ordered: tag === 'ol', items: items });
          continue;
        }

        // テーブル
        if (tag === 'table') {
          const headers = [];
          const rows = [];
          child.querySelectorAll('thead th, thead td').forEach(th => {
            headers.push(th.textContent.trim());
          });
          child.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td, th').forEach(td => {
              row.push(td.textContent.trim());
            });
            rows.push(row);
          });
          result.mainContent.push({ type: 'table', headers, rows });
          result.tables.push({ headers, rows });
          continue;
        }

        // 引用
        if (tag === 'blockquote') {
          const text = child.textContent.trim();
          result.mainContent.push({ type: 'blockquote', text });
          result.blockquotes.push(text);
          continue;
        }

        // figure（画像+キャプション）
        if (tag === 'figure') {
          const img = child.querySelector('img');
          const caption = child.querySelector('figcaption');
          if (img) {
            result.mainContent.push({
              type: 'figure',
              src: img.src || '',
              alt: img.alt || '',
              caption: caption ? caption.textContent.trim() : ''
            });
            result.images.push({
              src: img.src || '',
              alt: img.alt || '',
              caption: caption ? caption.textContent.trim() : ''
            });
          }
          continue;
        }

        // 動画
        if (tag === 'video') {
          const sources = Array.from(child.querySelectorAll('source')).map(s => s.src);
          result.mainContent.push({
            type: 'video',
            src: child.src || (sources[0] || ''),
            poster: child.poster || ''
          });
          result.videos.push({
            src: child.src || (sources[0] || ''),
            poster: child.poster || ''
          });
          continue;
        }

        // iframe（YouTube等の埋め込み）
        if (tag === 'iframe') {
          result.mainContent.push({
            type: 'embed',
            src: child.src,
            title: child.title || ''
          });
          continue;
        }

        // details/summary（折りたたみ）
        if (tag === 'details') {
          const summary = child.querySelector('summary');
          result.mainContent.push({
            type: 'details',
            summary: summary ? summary.textContent.trim() : '',
            content: child.textContent.trim()
          });
          continue;
        }

        // div, section, article 等のコンテナは再帰的に走査
        if (['div', 'section', 'article', 'aside', 'span'].includes(tag)) {
          walk(child);
          continue;
        }

        // その他のテキストコンテンツ
        const text = child.textContent.trim();
        if (text && text.length > 5) {
          result.mainContent.push({ type: 'text', tag: tag, text: text });
        }
      }
    };

    walk(contentRoot);

    // compact モード: mainContent を制限
    if (COMPACT && result.mainContent.length > COMPACT_CONTENT_LIMIT) {
      result.mainContent = result.mainContent.slice(0, COMPACT_CONTENT_LIMIT);
    }

    // 全文テキスト（プレーンテキスト版）
    result.fullText = result.mainContent
      .filter(item => ['heading', 'paragraph', 'text', 'blockquote'].includes(item.type)
        || item.type === 'list'
        || item.type === 'code')
      .map(item => {
        if (item.type === 'heading') return '\n' + '#'.repeat(item.level) + ' ' + item.text + '\n';
        if (item.type === 'paragraph' || item.type === 'text' || item.type === 'blockquote') return item.text;
        if (item.type === 'list') return item.items.map(i => '- ' + i.text).join('\n');
        if (item.type === 'code') return '```\n' + item.content + '\n```';
        return '';
      })
      .join('\n\n');

    // compact モード: fullText を制限
    if (COMPACT && result.fullText.length > COMPACT_TEXT_LIMIT) {
      result.fullText = result.fullText.substring(0, COMPACT_TEXT_LIMIT) + '\n...(truncated)';
    }

    // コンテンツ内リンク（ナビゲーション除外済み）
    contentRoot.querySelectorAll('a').forEach(a => {
      const text = a.textContent.trim();
      if (text) {
        result.links.push({ text, href: a.href, title: a.title || '' });
      }
    });

    // compact モード: links を制限
    if (COMPACT && result.links.length > COMPACT_LINK_LIMIT) {
      result.links = result.links.slice(0, COMPACT_LINK_LIMIT);
    }

    // サマリー
    result.summary = {
      contentBlocks: result.mainContent.length,
      headings: result.mainContent.filter(i => i.type === 'heading').length,
      paragraphs: result.mainContent.filter(i => i.type === 'paragraph').length,
      codeBlocks: result.codeBlocks.length,
      lists: result.lists.length,
      listItems: result.lists.reduce((sum, l) => sum + l.items.length, 0),
      tables: result.tables.length,
      images: result.images.length,
      videos: result.videos.length,
      blockquotes: result.blockquotes.length,
      contentLinks: result.links.length,
      fullTextLength: result.fullText.length,
      estimatedReadingTime: Math.ceil(result.fullText.split(/\s+/).length / 200) + '分',
      compactMode: COMPACT
    };

    return result;
  });
}
