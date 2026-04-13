// 04-media-inventory.js - 画像・動画・SVG・iframe完全棚卸し
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      images: [],
      videos: [],
      svgs: [],
      iframes: [],
      icons: [],
      backgroundImages: [],
      summary: {}
    };

    // Images
    document.querySelectorAll('img').forEach(img => {
      result.images.push({
        src: img.src || img.getAttribute('data-src') || '',
        alt: img.alt,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        loading: img.loading || 'auto',
        hasAlt: img.hasAttribute('alt'),
        altEmpty: img.alt === '',
        srcset: img.srcset ? img.srcset.substring(0, 200) : null,
        sizes: img.sizes || null,
        isLazy: img.loading === 'lazy' || img.hasAttribute('data-src') || img.classList.contains('lazy'),
        inPicture: !!img.closest('picture')
      });
    });

    // Picture elements with sources
    document.querySelectorAll('picture source').forEach(s => {
      // Already counted via img inside picture
    });

    // Videos
    document.querySelectorAll('video').forEach(v => {
      const sources = Array.from(v.querySelectorAll('source')).map(s => ({
        src: s.src,
        type: s.type
      }));
      result.videos.push({
        src: v.src || (sources.length > 0 ? sources[0].src : ''),
        sources: sources,
        poster: v.poster || null,
        autoplay: v.autoplay,
        muted: v.muted,
        loop: v.loop,
        controls: v.controls,
        width: v.width,
        height: v.height,
        duration: v.duration || null
      });
    });

    // Audio
    const audioElements = [];
    document.querySelectorAll('audio').forEach(a => {
      audioElements.push({
        src: a.src,
        controls: a.controls,
        autoplay: a.autoplay
      });
    });
    result.audio = audioElements;

    // SVGs
    document.querySelectorAll('svg').forEach(svg => {
      result.svgs.push({
        width: svg.getAttribute('width') || getComputedStyle(svg).width,
        height: svg.getAttribute('height') || getComputedStyle(svg).height,
        viewBox: svg.getAttribute('viewBox'),
        hasTitle: !!svg.querySelector('title'),
        role: svg.getAttribute('role'),
        ariaLabel: svg.getAttribute('aria-label'),
        childCount: svg.childElementCount
      });
    });

    // Iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      result.iframes.push({
        src: iframe.src,
        title: iframe.title || '',
        width: iframe.width,
        height: iframe.height,
        loading: iframe.loading || 'auto',
        sandbox: iframe.getAttribute('sandbox'),
        allow: iframe.getAttribute('allow')
      });
    });

    // Favicon & icons
    document.querySelectorAll('link[rel*="icon"]').forEach(link => {
      result.icons.push({
        rel: link.rel,
        href: link.href,
        sizes: link.getAttribute('sizes'),
        type: link.type
      });
    });

    // Background images (top 20)
    const allElements = document.querySelectorAll('body *');
    let bgCount = 0;
    allElements.forEach(el => {
      if (bgCount >= 20) return;
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const urlMatch = bg.match(/url\(["']?(.+?)["']?\)/);
        if (urlMatch) {
          result.backgroundImages.push({
            element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
            url: urlMatch[1]
          });
          bgCount++;
        }
      }
    });

    // Summary
    result.summary = {
      totalImages: result.images.length,
      imagesWithoutAlt: result.images.filter(i => !i.hasAlt).length,
      imagesWithEmptyAlt: result.images.filter(i => i.altEmpty).length,
      lazyLoadedImages: result.images.filter(i => i.isLazy).length,
      totalVideos: result.videos.length,
      totalSvgs: result.svgs.length,
      totalIframes: result.iframes.length,
      totalAudio: result.audio.length,
      totalBackgroundImages: result.backgroundImages.length,
      totalIcons: result.icons.length
    };

    return result;
  });
}
