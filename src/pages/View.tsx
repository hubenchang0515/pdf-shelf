
import type { Summary } from '../types/summary';
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import * as pdfjsLib from "pdfjs-dist";
import 'pdfjs-dist/web/pdf_viewer.css';

import workerSrc from "pdfjs-dist/build/pdf.worker?url";
import PdfPage from '../components/PdfPage';
import ToolBar from '../components/ToolBar';
import Loading from '../components/Loading';
import { mergePdf } from '../utils/pdf';
import { getHistory, setHistory } from '../utils/history';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ViewProps {
    summary: Summary;
    id: string;
}

async function merge(partitions:string[]) {
    const files = await Promise.all(partitions.map(async (file:string) => {
        const res = await fetch(file);
        const data = await res.arrayBuffer();
        return new File([data], file, { type:'application/octet-stream' });
    }));
    return await mergePdf(files);
}

async function loadPdf(filepath:string) {
    return await merge(['/cover.pdf', filepath]);
}

async function loadTxt(filepath:string) {
    const res = await fetch(filepath);
    const text = await res.text();
    return await merge(['/cover.pdf', text]);
}

async function loadDir(dirpath:string) {
    const res = await fetch(dirpath + '/manifest.json');
    const manifest = await res.json();
    const partitions = await Promise.all(manifest.partitions.map(async (file:string) => {
        return dirpath + '/' + file;
    }));
    return await merge(['/cover.pdf', ...partitions]);
}

export default function View(props:ViewProps) {
    let view!: HTMLDivElement;
    const file = props.summary.flatMap(dir => dir.docs).find(file => file.id === props.id);
    const [path, setPath] = createSignal<string>(file!.name);
    const [pdf, setPdf] = createSignal<any>();
    const [size, setSize] = createSignal<[number, number]>([0,0]);
    const [page, setPage] = createSignal(1);

    // 记录历史
    createEffect(() => {
        if (page() > 1) {
            setHistory(props.id, page());
        }
    });

    // 页面跳转
    const onJump = (page:number) => {
        setPage(page);
        const div = document.getElementById(`pdf-page-${page}`);
        div?.scrollIntoView();
    }

    // 滚动时更新页码
    const handleScroll = () => {
        const pageElements = view.children;
        // 找到第一个完全或部分可见的页
        for (let i = 0; i < pageElements.length; i++) {
            const rect = pageElements[i].getBoundingClientRect();
            if (rect.top + rect.height / 2 > 0) {
                setPage(i + 1);
                break;
            }
        }
    };

    // 注册事件
    onMount(() => {
        window.addEventListener("scroll", handleScroll);
        onCleanup(() => window.removeEventListener("scroll", handleScroll));
    });
    

    // 初始化
    onMount(async () => {
        let path = file!.path;
        switch (file!.type) {
            case 'dir':
                path = await loadDir(path);
                setPath(path);
                break;
            case 'pdf':
                path = await loadPdf(path);
                setPath(path);
                break;
            case 'txt':
                path = await loadTxt(path);
                setPath(path);
                break;
        }

        const doc = await pdfjsLib.getDocument({
            url:path,
            cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/cmaps/",  // 字体
            cMapPacked: true,
            standardFontDataUrl: "/standard_fonts/",
            disableAutoFetch: true,
        }).promise;
        setPdf(doc);

        // 设置尺寸
        const page = await doc.getPage(2); // 第一页是 cover.pdg，第二页才是实际页
        const viewport = page.getViewport({ scale: 2});
        const divScale = view.clientWidth / viewport.width;
        setSize([viewport.width * divScale, viewport.height * divScale]);

        onJump(getHistory(props.id));
    });

    

    return (
        <main class='relative w-full h-full shrink-1 p-2'>
            <div ref={view} class='max-w-3xl m-auto flex flex-col gap-1'>
                <Show when={size()[1] > 0} fallback={<Loading title={file!.name}/>}>
                    <For each={new Array(pdf().numPages)}>
                    {
                        (_, i) => <PdfPage title={file!.name} pdf={pdf()} page={1 + i()} defaultWidth={size()[0]} defaultHeight={size()[1]}/>
                    }
                    </For>
                    <ToolBar name={file!.name} filepath={path()} pdf={pdf()} page={page()} onJump={onJump}/>
                </Show>
            </div>
        </main>
    )
}