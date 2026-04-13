// 02-css-design-analysis.js - CSS完全解析（色・フォント・アニメ・変数）
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      colors: { backgrounds: {}, texts: {}, borders: {} },
      fonts: { families: {}, sizes: {} },
      cssVariables: {},
      layout: { flexbox: 0, grid: 0 },
      animations: [],
      mediaQueries: [],
      typographyScale: [],
      boxShadows: [],
      borderRadii: {}
    };

    const allElements = document.querySelectorAll('body *');
    const colorCount = (obj, color) => {
      if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        obj[color] = (obj[color] || 0) + 1;
      }
    };

    allElements.forEach(el => {
      const style = getComputedStyle(el);

      // Colors
      colorCount(result.colors.backgrounds, style.backgroundColor);
      colorCount(result.colors.texts, style.color);
      colorCount(result.colors.borders, style.borderColor);

      // Fonts
      const family = style.fontFamily;
      if (family) result.fonts.families[family] = (result.fonts.families[family] || 0) + 1;
      const size = style.fontSize;
      if (size) result.fonts.sizes[size] = (result.fonts.sizes[size] || 0) + 1;

      // Layout
      if (style.display === 'flex' || style.display === 'inline-flex') result.layout.flexbox++;
      if (style.display === 'grid' || style.display === 'inline-grid') result.layout.grid++;

      // Box shadows
      if (style.boxShadow && style.boxShadow !== 'none') {
        if (!result.boxShadows.includes(style.boxShadow)) {
          result.boxShadows.push(style.boxShadow);
        }
      }

      // Border radii
      const radius = style.borderRadius;
      if (radius && radius !== '0px') {
        result.borderRadii[radius] = (result.borderRadii[radius] || 0) + 1;
      }
    });

    // CSS Variables from :root
    const rootStyles = getComputedStyle(document.documentElement);
    const sheets = document.styleSheets;
    try {
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText === ':root' || rule.selectorText === 'html') {
              const text = rule.cssText;
              const varMatches = text.matchAll(/--([^:]+):\s*([^;]+)/g);
              for (const m of varMatches) {
                result.cssVariables[`--${m[1].trim()}`] = m[2].trim();
              }
            }
          }
        } catch (e) { /* cross-origin stylesheet */ }
      }
    } catch (e) { /* no access */ }

    // Animations & keyframes
    try {
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSKeyframesRule) {
              result.animations.push({
                name: rule.name,
                steps: rule.cssRules.length
              });
            }
          }
        } catch (e) { /* cross-origin */ }
      }
    } catch (e) { /* no access */ }

    // Media queries
    try {
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSMediaRule) {
              const mq = rule.conditionText || rule.media.mediaText;
              if (!result.mediaQueries.includes(mq)) {
                result.mediaQueries.push(mq);
              }
            }
          }
        } catch (e) { /* cross-origin */ }
      }
    } catch (e) { /* no access */ }

    // Typography scale (unique font sizes sorted)
    result.typographyScale = Object.entries(result.fonts.sizes)
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => parseFloat(b.size) - parseFloat(a.size))
      .slice(0, 20);

    // Sort and limit colors
    const sortByCount = obj => Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});

    result.colors.backgrounds = sortByCount(result.colors.backgrounds);
    result.colors.texts = sortByCount(result.colors.texts);
    result.colors.borders = sortByCount(result.colors.borders);
    result.fonts.families = sortByCount(result.fonts.families);

    return result;
  });
}
