/**
 * 浏览器端 SEO：在 SPA 内切换路由时同步 <title> / meta / canonical。
 * 首屏 HTML 由构建脚本 tools/seo.ts 预渲染，这里只是保证客户端路由与之一致。
 */
import type { PageSeo } from './seoContent';
import { SITE_URL } from './seoContent';

export { SITE_NAME, SITE_URL, SITE_TAGLINE, SITE_REPO } from './seoContent';
export { countDocs, docSeo, homeSeo, siteDescription } from './seoContent';
export type { PageSeo, SeoCategory, SeoDocument } from './seoContent';

export function setMeta(attr: 'name' | 'property', key: string, content: string): void {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

export function setCanonical(url: string): void {
    let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
    }
    element.setAttribute('href', url);
}

export function setPageSeo(seo: PageSeo): void {
    const url = SITE_URL + seo.path;
    document.title = seo.title;
    setMeta('name', 'description', seo.description);
    if (seo.keywords) {
        setMeta('name', 'keywords', seo.keywords);
    }
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', seo.title);
    setMeta('name', 'twitter:description', seo.description);
    setCanonical(url);
}
