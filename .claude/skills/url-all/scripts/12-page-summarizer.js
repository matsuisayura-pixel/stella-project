// 12-page-summarizer.js - Tier 3 用超軽量コンテンツ抽出
// タイトル + 見出し(top5) + 要約テキスト(top3段落) + リンク数のみ
// 出力サイズ上限: 小さく保つ（depth 3 の大量ページ用）
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const contentRoot = document.querySelector('article')
      || document.querySelector('main')
      || document.querySelector('[role="main"]')
      || document.querySelector('.content, .post, .entry, #content, #main')
      || document.body;

    // 見出し抽出（最大5つ）
    const headings = [];
    contentRoot.querySelectorAll('h1, h2, h3').forEach(h => {
      if (headings.length >= 5) return;
      const text = h.textContent.trim();
      if (text) {
        headings.push({
          level: parseInt(h.tagName[1]),
          text: text.substring(0, 80)
        });
      }
    });

    // 段落抽出（最初の3つ、各200文字まで）
    const paragraphs = [];
    contentRoot.querySelectorAll('p').forEach(p => {
      if (paragraphs.length >= 3) return;
      const text = p.textContent.trim();
      if (text && text.length > 20) {
        paragraphs.push(text.substring(0, 200));
      }
    });

    // リスト項目のサマリー（最大5つ）
    const listItems = [];
    contentRoot.querySelectorAll('li').forEach(li => {
      if (listItems.length >= 5) return;
      const text = li.textContent.trim();
      if (text && text.length > 5 && text.length < 200) {
        listItems.push(text.substring(0, 100));
      }
    });

    // コードブロック有無
    const hasCode = contentRoot.querySelectorAll('pre, code').length > 0;

    // 画像数
    const imageCount = contentRoot.querySelectorAll('img').length;

    // リンク数
    const linkCount = contentRoot.querySelectorAll('a[href]').length;

    // メタディスクリプション
    const metaDesc = document.querySelector('meta[name="description"]');

    return {
      url: location.href,
      title: document.title,
      description: metaDesc ? metaDesc.getAttribute('content') : '',
      headings: headings,
      summary: paragraphs.join(' '),
      listHighlights: listItems,
      hasCode: hasCode,
      imageCount: imageCount,
      linkCount: linkCount,
      contentType: hasCode ? 'technical' : (imageCount > 3 ? 'visual' : 'text')
    };
  });
}
