import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

type DocumentType = 'pdf' | 'dir' | 'txt';

interface Document {
    id: string;
    type: DocumentType;
    name: string;
    path: string;
}

interface Category {
    id: string;
    name: string;
    path: string;
    docs: Document[];
}

// 计算字符串的 SHA256 哈希值
function sha256String(data: string): string {
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex');
}

async function scanRoot(dirpath:string='') {
    const fulldirpath = path.posix.join('public', dirpath)
    const items:Category[] = [];
    const files = await fs.readdir(fulldirpath, { withFileTypes: true });
    for (const file of files) {
        // 不是目录，忽略
        if (!file.isDirectory()) {
            continue;
        }

        // 扫描目录
        const pathname = path.posix.join('/', dirpath, file.name);
        items.push({
            id: sha256String(pathname),
            name: file.name,
            path: pathname,
            docs: await scanDir(pathname),
        });
    }
    return items;
}

async function scanDir(dirpath:string='') {
    const fulldirpath = path.posix.join('public', dirpath)
    const items:Document[] = [];
    const files = await fs.readdir(fulldirpath, { withFileTypes: true });
    for (const file of files) {
        const filepath = path.posix.join('public',dirpath, file.name);
        const uri = path.posix.join(dirpath, file.name);
        const id = sha256String(uri).slice(0, 10);

        // 目录，需要加载 manifest.json
        if (file.isDirectory()) {
            // 如果 manifest.json 不存在，则自动生成
            const json = path.posix.join('public', uri, 'manifest.json');
            fs.access(json).catch(async () => {
                const files = await fs.readdir(filepath, { withFileTypes: true });
                const manifest = {
                    name: file.name,
                    partitions: files.filter(f => f.isFile() && f.name.endsWith('.pdf')).map(f => f.name),
                };
                await fs.writeFile(json, JSON.stringify(manifest, null, 4), 'utf-8');
            });

            items.push({
                id: id,
                type: 'dir',
                name: file.name,
                path: uri,
            });
            continue;
        } 

        // pdf 文件，直接加载
        if (file.name.endsWith('.pdf')) {
            items.push({
                id: id,
                type: 'pdf',
                name: file.name.slice(0, -4),
                path: uri,
            });
            continue;
        }

        // txt 文件，导向外部资源
        if (file.name.endsWith('.txt')) {
            items.push({
                id: id,
                type: 'txt',
                name: file.name.slice(0, -4),
                path: uri,
            });
            continue;
        }
    }
    return items
}

async function main() {
    const items = await scanRoot('pdfs');
    const data = JSON.stringify(items);
    fs.writeFile('src/assets/summary.json', data);

    let summary = "";
    let count = 0
    for (const item of items) {
        summary += `- ${item.name}\n`;
        for (const doc of item.docs) {
            summary += `  - [${doc.name}](https://pdf-shelf.pages.dev/${doc.id})\n`;
            count += 1;
        }
    }

    const text = await fs.readFile('README.md', 'utf-8');
    const readme = text.replace(/## 文档目录[\s\S]*/, `## 文档目录\n\n> 共收录 ${count} 部 PDF 文档\n\n` + summary);
    fs.writeFile('README.md', readme, 'utf-8');
}

main()