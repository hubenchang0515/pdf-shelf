/**
 * 构建后 SEO 处理：
 *   1. 为每个文档生成独立的静态 HTML（/dist/<id>.html，Cloudflare Pages 会以 /<id> 提供）
 *   2. 重写首页 /dist/index.html，注入简介与完整目录
 *   3. 生成 /dist/404.html、/dist/robots.txt、/dist/sitemap.xml
 *
 * 用法：vite build 之后执行 `tsx tools/seo.ts`（已接入 npm run build）。
 * 注意：本脚本会改写 dist/index.html，重复执行请先重新 `vite build`。
 */
import fs from 'fs/promises';
import path from 'path';
import {
    SITE_NAME,
    SITE_REPO,
    SITE_TAGLINE,
    SITE_URL,
    countDocs,
    docSeo,
    homeSeo,
    siteDescription,
} from '../src/utils/seoContent.ts';
import type { PageSeo, SeoCategory, SeoDocument } from '../src/utils/seoContent.ts';
import { encodePath } from '../src/utils/url.ts';

const DIST = 'dist';
const GENERATOR = 'pdf-shelf-seo';
const ROOT_PATTERN = /<div id="root">[\s\S]*?<\/div>/;

const SEO_STYLE = `<style>
      .pseo{max-width:80rem;margin:0 auto;padding:16px;color:#0f172a;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.7}
      .pseo header{border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px}
      .pseo h1{font-size:1.5rem;margin:16px 0 12px}
      .pseo h2{font-size:1.05rem;margin:20px 0 8px;color:#047857}
      .pseo a{color:#0284c7;text-decoration:none}
      .pseo a:hover{text-decoration:underline}
      .pseo ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
      .pseo li{background:#f1f5f9;border-radius:6px;padding:4px 10px}
      .pseo nav[aria-label="书籍分类"] section{margin-bottom:8px}
      @media (prefers-color-scheme:dark){.pseo{color:#e2e8f0}.pseo li{background:#1e293b}}
    </style>`;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

interface BuildOptions {
    seo: PageSeo;
    ogType: string;
    robots?: string;
    jsonLd: unknown[];
    body: string;
}

function buildPage(base: string, options: BuildOptions): string {
    let html = base;

    // 移除模板中由本脚本接管的 head 标签，避免重复
    html = html.replace(/[^\S\n]*<!--[\s\S]*?-->\s*/g, '');
    html = html.replace(/[^\S\n]*<title>[\s\S]*?<\/title>\s*/i, '');
    html = html.replace(/[^\S\n]*<meta name="(?:description|keywords|author|robots)"[^>]*>\s*/gi, '');
    html = html.replace(/[^\S\n]*<link rel="canonical"[^>]*>\s*/gi, '');
    html = html.replace(/[^\S\n]*<meta property="og:[^"]*"[^>]*>\s*/gi, '');
    html = html.replace(/[^\S\n]*<meta name="twitter:[^"]*"[^>]*>\s*/gi, '');
    html = html.replace(/[^\S\n]*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '');

    const tags = [
        `<title>${escapeHtml(options.seo.title)}</title>`,
        `<meta name="description" content="${escapeHtml(options.seo.description)}" />`,
        options.seo.keywords ? `<meta name="keywords" content="${escapeHtml(options.seo.keywords)}" />` : '',
        `<meta name="robots" content="${options.robots ?? 'index, follow, max-image-preview:large, max-snippet:-1'}" />`,
        `<meta name="applicable-device" content="pc,mobile" />`,
        `<meta name="generator" content="${GENERATOR}" />`,
        `<link rel="canonical" href="${SITE_URL}${options.seo.path}" />`,
        `<meta property="og:site_name" content="${SITE_NAME}" />`,
        `<meta property="og:type" content="${options.ogType}" />`,
        `<meta property="og:locale" content="zh_CN" />`,
        `<meta property="og:title" content="${escapeHtml(options.seo.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(options.seo.description)}" />`,
        `<meta property="og:url" content="${SITE_URL}${options.seo.path}" />`,
        `<meta property="og:image" content="${SITE_URL}/pdf.png" />`,
        `<meta name="twitter:card" content="summary" />`,
        `<meta name="twitter:title" content="${escapeHtml(options.seo.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(options.seo.description)}" />`,
        `<meta name="twitter:image" content="${SITE_URL}/pdf.png" />`,
        ...options.jsonLd.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`),
    ].filter(Boolean).join('\n    ');

    html = html.replace('</head>', () => `  ${SEO_STYLE}\n    ${tags}\n  </head>`);
    html = html.replace(ROOT_PATTERN, () => `<div id="root">${options.body}</div>`);
    return html;
}

function header(): string {
    return `<header><a href="/">${SITE_NAME}</a> · ${SITE_TAGLINE}</header>`;
}

function renderCatalog(summary: SeoCategory[]): string {
    return summary.map((category) => {
        const links = category.docs
            .map((doc) => `<li><a href="/${doc.id}">${escapeHtml(doc.name)}</a></li>`)
            .join('');
        return `<section><h2>${escapeHtml(category.name)}</h2><ul>${links}</ul></section>`;
    }).join('\n        ');
}

function renderHomeBody(summary: SeoCategory[], total: number): string {
    return `<div class="pseo">${header()}
      <main>
        <h1>${SITE_NAME} - 编程电子书 PDF 在线阅读与下载</h1>
        <p>${escapeHtml(siteDescription(total))}</p>
        <nav aria-label="书籍分类">
        ${renderCatalog(summary)}
        </nav>
      </main>
    </div>`;
}

async function renderDownloads(doc: SeoDocument): Promise<string> {
    if (doc.type === 'pdf') {
        return `<p><a href="${encodePath(doc.path)}" download>下载《${escapeHtml(doc.name)}》PDF 文件</a></p>`;
    }
    if (doc.type === 'txt') {
        return `<p><a href="${encodePath(doc.path)}">查看《${escapeHtml(doc.name)}》原文</a></p>`;
    }

    const manifest = path.posix.join('public', doc.path, 'manifest.json');
    try {
        const data = JSON.parse(await fs.readFile(manifest, 'utf-8')) as { partitions?: string[] };
        const partitions = data.partitions ?? [];
        if (partitions.length === 0) {
            return '';
        }
        const links = partitions
            .map((file) => `<li><a href="${encodePath(path.posix.join(doc.path, file))}" download>${escapeHtml(file)}</a></li>`)
            .join('');
        return `<section><h2>分卷下载</h2><ul>${links}</ul></section>`;
    } catch {
        return '';
    }
}

async function renderDocBody(category: SeoCategory, doc: SeoDocument, seo: PageSeo): Promise<string> {
    const siblings = category.docs
        .filter((item) => item.id !== doc.id)
        .map((item) => `<li><a href="/${item.id}">${escapeHtml(item.name)}</a></li>`)
        .join('');
    const downloads = await renderDownloads(doc);
    const related = siblings
        ? `<section><h2>「${escapeHtml(category.name)}」分类下的其他书籍</h2><ul>${siblings}</ul></section>`
        : '';

    return `<div class="pseo">${header()}
      <main>
        <nav aria-label="面包屑"><a href="/">首页</a> › <span>${escapeHtml(category.name)}</span> › <span>${escapeHtml(doc.name)}</span></nav>
        <h1>《${escapeHtml(doc.name)}》PDF 在线阅读与下载</h1>
        <p>${escapeHtml(seo.description)}</p>
        <p><a href="/${doc.id}">在 ${SITE_NAME} 中在线阅读《${escapeHtml(doc.name)}》</a></p>
        ${downloads}
        ${related}
      </main>
    </div>`;
}

function websiteJsonLd(total: number): unknown {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: `${SITE_NAME} 电子书库`,
        url: `${SITE_URL}/`,
        description: siteDescription(total),
        inLanguage: 'zh-CN',
        sameAs: [SITE_REPO],
    };
}

function documentJsonLd(category: SeoCategory, doc: SeoDocument): unknown[] {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'Book',
            name: doc.name,
            url: `${SITE_URL}/${doc.id}`,
            inLanguage: 'zh-CN',
            bookFormat: 'https://schema.org/EBook',
            genre: category.name,
            isPartOf: { '@type': 'CollectionPage', name: SITE_NAME, url: `${SITE_URL}/` },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: '首页', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 3, name: doc.name, item: `${SITE_URL}/${doc.id}` },
            ],
        },
    ];
}

function renderSitemap(summary: SeoCategory[]): string {
    const urls = [
        `  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ];
    for (const category of summary) {
        for (const doc of category.docs) {
            urls.push(`  <url>\n    <loc>${SITE_URL}/${doc.id}</loc>\n    <priority>0.8</priority>\n  </url>`);
        }
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function renderRobots(): string {
    return [
        'User-agent: *',
        'Allow: /',
        'Disallow: /pdfs/*/manifest.json',
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        '',
    ].join('\n');
}

async function main(): Promise<void> {
    const summary = JSON.parse(await fs.readFile('src/assets/summary.json', 'utf-8')) as SeoCategory[];
    const base = await fs.readFile(path.posix.join(DIST, 'index.html'), 'utf-8');

    if (base.includes(`name="generator" content="${GENERATOR}"`)) {
        throw new Error('dist/index.html 已被 tools/seo.ts 处理过，请先重新执行 `vite build` 生成干净的 dist。');
    }

    const total = countDocs(summary);

    // 首页
    await fs.writeFile(path.posix.join(DIST, 'index.html'), buildPage(base, {
        seo: homeSeo(total),
        ogType: 'website',
        jsonLd: [websiteJsonLd(total)],
        body: renderHomeBody(summary, total),
    }), 'utf-8');

    // 每个文档一个静态页
    for (const category of summary) {
        for (const doc of category.docs) {
            const seo = docSeo(category, doc, total);
            await fs.writeFile(path.posix.join(DIST, `${doc.id}.html`), buildPage(base, {
                seo,
                ogType: 'book',
                jsonLd: documentJsonLd(category, doc),
                body: await renderDocBody(category, doc, seo),
            }), 'utf-8');
        }
    }

    // 404：真正的 404 页面会让 Cloudflare Pages 关闭 SPA 兜底，避免软 404 被索引
    await fs.writeFile(path.posix.join(DIST, '404.html'), buildPage(base, {
        seo: {
            title: `页面不存在 - ${SITE_NAME}`,
            description: `抱歉，您访问的页面不存在。返回 ${SITE_NAME} 首页浏览全部 PDF 电子书。`,
            keywords: '',
            path: '/',
        },
        ogType: 'website',
        robots: 'noindex, follow',
        jsonLd: [],
        body: renderHomeBody(summary, total),
    }), 'utf-8');

    await fs.writeFile(path.posix.join(DIST, 'sitemap.xml'), renderSitemap(summary), 'utf-8');
    await fs.writeFile(path.posix.join(DIST, 'robots.txt'), renderRobots(), 'utf-8');

    console.log(`[seo] 已生成首页、${total} 个文档页、404.html、sitemap.xml、robots.txt`);
}

main().catch((error) => {
    console.error('[seo] 生成失败：', error);
    process.exitCode = 1;
});
