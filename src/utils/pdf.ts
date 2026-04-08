import { PDFDocument, PDFName, PDFObject, PDFNumber, PDFArray, PDFHexString } from 'pdf-lib';
import * as pdfjsLib from "pdfjs-dist";

async function fetchOutlineData(data:any) {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
    const outline = await doc.getOutline();
    if (!outline) return [];
    async function traverse(items:any[]):Promise<any[]> {
        const res = [];
        for (const item of items) {
            let pIdx = -1;
            try {
                if (item.dest) {
                    const d = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest;
                    pIdx = await doc.getPageIndex(d[0]);
                }
            } catch(e){}
            res.push({ title: item.title, pageIdx: pIdx, children: item.items ? await traverse(item.items) : [] });
        }
        return res;
    }
    return traverse(outline);
}

function shiftOutlinePages(items:any[], offset:number):any[] {
    return items.map(i => ({
        ...i,
        pageIdx: i.pageIdx !== -1 ? i.pageIdx + offset : -1,
        children: shiftOutlinePages(i.children, offset)
    }));
}

function countTotalNodes(items:any[]):number {
    let c = items.length;
    items.forEach(i => c += countTotalNodes(i.children));
    return c;
}

function injectOutlines(pdfDoc:PDFDocument, outlineData:any[], pageRefs:any[], pages:any[]) {
    const context = pdfDoc.context;
    const rootDict = context.obj({ Type: PDFName.of('Outlines'), Count: PDFNumber.of(countTotalNodes(outlineData)) });
    const rootRef = context.register(rootDict);

    function createTree(items:any[], parentRef:any) {
        let first, last, prev;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const dict = context.obj({ Title: PDFHexString.fromText(item.title), Parent: parentRef });
            if (item.pageIdx >= 0 && item.pageIdx < pageRefs.length) {
                const h = pages[item.pageIdx].getSize().height;
                const dest = PDFArray.withContext(context);
                dest.push(pageRefs[item.pageIdx]);
                dest.push(PDFName.of('XYZ'));
                dest.push(PDFNumber.of(0)); 
                dest.push(PDFNumber.of(h)); // 顶部对齐
                dest.push(PDFNumber.of(0));
                dict.set(PDFName.of('Dest'), dest);
            }
            const ref = context.register(dict);
            if (i === 0) first = ref;
            last = ref;
            if (prev) {
                (context.lookup(prev) as any).set(PDFName.of('Next'), ref);
                dict.set(PDFName.of('Prev'), prev);
            }
            if (item.children.length > 0) {
                const child = createTree(item.children, ref);
                dict.set(PDFName.of('First'), child.first as PDFObject);
                dict.set(PDFName.of('Last'), child.last as PDFObject);
                dict.set(PDFName.of('Count'), PDFNumber.of(countTotalNodes(item.children)));
            }
            prev = ref;
        }
        return { first, last };
    }

    const res = createTree(outlineData, rootRef);
    rootDict.set(PDFName.of('First'), res.first as PDFObject);
    rootDict.set(PDFName.of('Last'), res.last as PDFObject);
    pdfDoc.catalog.set(PDFName.of('Outlines'), rootRef);
}

// --- 核心合并与书签重构逻辑 (维持之前所有优化) ---
export async function mergePdf(files:any[]) {
    const mergedDoc = await PDFDocument.create();
    let totalPageOffset = 0;
    const combinedOutlines = [];

    for (const file of files) {
        
        // 1. 获取书签并根据当前偏移量平移
        const rawOutline = await fetchOutlineData(await file.arrayBuffer());
        combinedOutlines.push(...shiftOutlinePages(rawOutline, totalPageOffset));

        // 2. 复制页面并插入
        const srcDoc = await PDFDocument.load(await file.arrayBuffer());
        const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(p => mergedDoc.addPage(p));

        totalPageOffset += srcDoc.getPageCount();
    }

    // 3. 构建书签字典
    if (combinedOutlines.length > 0) {
        const pageRefs = mergedDoc.getPages().map(p => p.ref);
        const pages = mergedDoc.getPages();
        injectOutlines(mergedDoc, combinedOutlines, pageRefs, pages);
    }

    const bytes = await mergedDoc.save();
    const blob = new Blob([bytes as any], { type: "application/pdf" });
    return URL.createObjectURL(blob);
}