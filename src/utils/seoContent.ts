/**
 * 站点 SEO 文案的唯一来源。
 * 这里只放纯函数，不能依赖 DOM，因为构建脚本（tools/seo.ts）也会复用它。
 */

export const SITE_URL = 'https://pdf-shelf.pages.dev';
export const SITE_NAME = 'PDF Shelf';
export const SITE_TAGLINE = '免费 PDF 电子书在线阅读与下载';
export const SITE_REPO = 'https://github.com/hubenchang0515/pdf-shelf';

export interface SeoDocument {
    id: string;
    type: 'pdf' | 'dir' | 'txt';
    name: string;
    path: string;
}

export interface SeoCategory {
    name: string;
    docs: SeoDocument[];
}

export interface PageSeo {
    title: string;
    description: string;
    keywords: string;
    /** 以 / 开头的站内路径 */
    path: string;
}

export function countDocs(summary: readonly SeoCategory[]): number {
    return summary.reduce((total, category) => total + category.docs.length, 0);
}

export function siteDescription(total: number): string {
    return `${SITE_NAME} 是一个免费 PDF 电子书分享站，目前收录 ${total} 部书籍，涵盖编程开发、计算机科学、数学、语言学习等领域，全部支持在线阅读与免费下载。`;
}

export function homeSeo(total: number): PageSeo {
    return {
        title: `${SITE_NAME} - 免费编程电子书 PDF 在线阅读与下载（共 ${total} 部）`,
        description: siteDescription(total),
        keywords: 'PDF,电子书,PDF下载,在线阅读,免费电子书,编程书籍,计算机书籍,PDF Shelf,电子书下载',
        path: '/',
    };
}

export function docSeo(category: SeoCategory, doc: SeoDocument, total: number): PageSeo {
    return {
        title: `《${doc.name}》PDF 在线阅读与下载 - ${category.name} - ${SITE_NAME}`,
        description: `《${doc.name}》PDF 在线阅读与下载，所属分类：${category.name}。${SITE_NAME} 收录 ${total} 部编程、计算机、数学、语言类 PDF 书籍，全部支持免费在线阅读与下载。`,
        keywords: `${doc.name},${doc.name} pdf,${doc.name}下载,${doc.name} 在线阅读,${category.name},PDF 电子书,免费电子书,${SITE_NAME}`,
        path: `/${doc.id}`,
    };
}
