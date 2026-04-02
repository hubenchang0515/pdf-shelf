import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface File {
    id: string;
    name: string;
    path: string;
}

interface Dir {
    id: string;
    name: string;
    path: string;
    files: File[];
}

// 计算字符串的 SHA256 哈希值
function sha256String(data: string): string {
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex');
}

async function scanRoot(dirpath:string='') {
    const fulldirpath = path.posix.join('public', dirpath)
    const items:Dir[] = [];
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
            files: await scanDir(pathname),
        });
    }
    return items;
}

async function scanDir(dirpath:string='') {
    const fulldirpath = path.posix.join('public', dirpath)
    const items:File[] = [];
    const files = await fs.readdir(fulldirpath, { withFileTypes: true });
    for (const file of files) {
        // 不是 PDF，忽略
        if (!file.isFile() || !file.name.endsWith('.pdf')) {
            continue;
        }

        // Cloudflare：大于 25MB，忽略
        const pathname = path.posix.join(fulldirpath, file.name);
        const stat = await fs.stat(pathname);
        if (stat.size > 25 * 1024 * 1024) {
            continue;
        }

        // pdf 文件，添加
        const uri = path.posix.join(dirpath, file.name);
        items.push({
            id: sha256String(uri).slice(0, 6),
            name: file.name.slice(0, -4),
            path: uri,
        });
    }
    return items
}

async function main() {
    const items = await scanRoot('pdfs');
    const data = JSON.stringify(items);
    fs.writeFile('src/assets/summary.json', data);
}

main()