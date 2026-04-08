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
        const uri = path.posix.join(dirpath, file.name);
        const id = sha256String(uri).slice(0, 10);

        // 目录，需要加载 manifest.json
        if (file.isDirectory()) {
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
}

main()