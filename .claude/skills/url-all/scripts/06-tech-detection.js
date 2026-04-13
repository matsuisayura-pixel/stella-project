// 06-tech-detection.js - 技術スタック・フレームワーク検出
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      spa: false,
      frameworks: [],
      libraries: [],
      cdn: [],
      analytics: [],
      tagManagers: [],
      buildTools: [],
      hosting: [],
      other: []
    };

    // SPA detection
    if (document.querySelector('#__next') || document.querySelector('[data-nextjs-page]')) {
      result.spa = true;
      result.frameworks.push({ name: 'Next.js', version: window.__NEXT_DATA__?.buildId || 'detected' });
    }
    if (document.querySelector('#__nuxt') || document.querySelector('[data-v-]')) {
      result.spa = true;
      result.frameworks.push({ name: 'Nuxt.js/Vue', version: window.__NUXT__?.config?.app?.buildId || 'detected' });
    }
    if (document.querySelector('#app[data-v-]') || document.querySelector('[data-v-]')) {
      result.frameworks.push({ name: 'Vue.js', version: window.Vue?.version || 'detected' });
    }
    if (window.__GATSBY) {
      result.spa = true;
      result.frameworks.push({ name: 'Gatsby', version: 'detected' });
    }
    if (document.querySelector('#___gatsby')) {
      result.spa = true;
      result.frameworks.push({ name: 'Gatsby', version: 'detected' });
    }
    if (window.__REMIX_CONTEXT) {
      result.spa = true;
      result.frameworks.push({ name: 'Remix', version: 'detected' });
    }
    if (document.querySelector('[data-reactroot]') || document.querySelector('#root') || document.querySelector('#__react-root')) {
      result.frameworks.push({ name: 'React', version: window.React?.version || 'detected' });
    }
    if (window.angular || document.querySelector('[ng-app]') || document.querySelector('[ng-version]')) {
      result.spa = true;
      const ngVer = document.querySelector('[ng-version]');
      result.frameworks.push({ name: 'Angular', version: ngVer?.getAttribute('ng-version') || 'detected' });
    }
    if (window.Svelte || document.querySelector('[class*="svelte-"]')) {
      result.frameworks.push({ name: 'Svelte', version: 'detected' });
    }
    if (document.querySelector('[data-astro-cid]') || document.querySelector('[data-astro-source-file]')) {
      result.frameworks.push({ name: 'Astro', version: 'detected' });
    }
    if (window.Webflow) {
      result.frameworks.push({ name: 'Webflow', version: 'detected' });
    }
    if (document.querySelector('meta[name="generator"]')) {
      const gen = document.querySelector('meta[name="generator"]').content;
      result.frameworks.push({ name: gen, version: 'via meta generator' });
    }

    // WordPress detection
    if (document.querySelector('meta[name="generator"][content*="WordPress"]') || document.querySelector('link[href*="wp-content"]')) {
      result.frameworks.push({ name: 'WordPress', version: document.querySelector('meta[name="generator"]')?.content || 'detected' });
    }

    // Libraries via script tags
    const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    scriptSrcs.forEach(src => {
      if (src.includes('jquery')) result.libraries.push({ name: 'jQuery', src: src.substring(0, 150) });
      if (src.includes('bootstrap')) result.libraries.push({ name: 'Bootstrap', src: src.substring(0, 150) });
      if (src.includes('tailwind')) result.libraries.push({ name: 'Tailwind CSS', src: src.substring(0, 150) });
      if (src.includes('lodash')) result.libraries.push({ name: 'Lodash', src: src.substring(0, 150) });
      if (src.includes('moment')) result.libraries.push({ name: 'Moment.js', src: src.substring(0, 150) });
      if (src.includes('gsap') || src.includes('greensock')) result.libraries.push({ name: 'GSAP', src: src.substring(0, 150) });
      if (src.includes('three.js') || src.includes('three.min')) result.libraries.push({ name: 'Three.js', src: src.substring(0, 150) });
      if (src.includes('d3.')) result.libraries.push({ name: 'D3.js', src: src.substring(0, 150) });
    });

    // Tailwind via class detection
    if (document.querySelector('[class*="flex "], [class*="grid "], [class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]')) {
      if (!result.libraries.some(l => l.name === 'Tailwind CSS')) {
        result.libraries.push({ name: 'Tailwind CSS', src: 'class-based detection' });
      }
    }

    // CDN detection
    const cdnPatterns = {
      'Cloudflare': 'cdnjs.cloudflare.com',
      'Google CDN': 'ajax.googleapis.com',
      'jsDelivr': 'cdn.jsdelivr.net',
      'unpkg': 'unpkg.com',
      'Vercel': 'vercel.app',
      'Netlify': 'netlify.app',
      'AWS CloudFront': 'cloudfront.net',
      'Fastly': 'fastly.net',
      'Akamai': 'akamaized.net'
    };
    scriptSrcs.forEach(src => {
      Object.entries(cdnPatterns).forEach(([name, pattern]) => {
        if (src.includes(pattern) && !result.cdn.includes(name)) {
          result.cdn.push(name);
        }
      });
    });

    // Analytics
    if (window.gtag || window.ga || document.querySelector('script[src*="google-analytics"]') || document.querySelector('script[src*="googletagmanager"]')) {
      result.analytics.push('Google Analytics');
    }
    if (window.fbq) result.analytics.push('Facebook Pixel');
    if (window.ttq) result.analytics.push('TikTok Pixel');
    if (window._paq) result.analytics.push('Matomo');
    if (window.amplitude) result.analytics.push('Amplitude');
    if (window.mixpanel) result.analytics.push('Mixpanel');
    if (window.heap) result.analytics.push('Heap');
    if (window.posthog || window.__POSTHOG__) result.analytics.push('PostHog');
    if (window.plausible) result.analytics.push('Plausible');
    if (window._hsq) result.analytics.push('HubSpot');
    if (document.querySelector('script[src*="hotjar"]')) result.analytics.push('Hotjar');
    if (document.querySelector('script[src*="clarity"]')) result.analytics.push('Microsoft Clarity');

    // Tag managers
    if (window.dataLayer) result.tagManagers.push('Google Tag Manager');
    if (document.querySelector('script[src*="segment"]')) result.tagManagers.push('Segment');

    // Hosting hints
    const linkTags = Array.from(document.querySelectorAll('link[href]')).map(l => l.href);
    [...scriptSrcs, ...linkTags].forEach(url => {
      if (url.includes('vercel') && !result.hosting.includes('Vercel')) result.hosting.push('Vercel');
      if (url.includes('netlify') && !result.hosting.includes('Netlify')) result.hosting.push('Netlify');
      if (url.includes('amazonaws') && !result.hosting.includes('AWS')) result.hosting.push('AWS');
      if (url.includes('cloudflare') && !result.hosting.includes('Cloudflare')) result.hosting.push('Cloudflare');
    });

    return result;
  });
}
