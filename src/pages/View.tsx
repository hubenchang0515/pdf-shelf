
import type { Summary } from '../types/summary';
import { createSignal, For, onMount, Show } from "solid-js";
import * as pdfjsLib from "pdfjs-dist";
import 'pdfjs-dist/web/pdf_viewer.css';

import workerSrc from "pdfjs-dist/build/pdf.worker?url";
import PdfPage from '../components/PdfPage';
import ToolBar from '../components/ToolBar';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ViewProps {
    summary: Summary;
    id: string;
}

export default function View(props:ViewProps) {
    const file = props.summary.flatMap(dir => dir.files).find(file => file.id === props.id);
    const [pdf, setPdf] = createSignal<any>();
    const [size, setSize] = createSignal<[number, number]>([0,0]);
    const [page, setPage] = createSignal(1);
    
    let view!: HTMLDivElement;

    // 初始化
    onMount(async () => {
        const doc = await pdfjsLib.getDocument({
            url:file!.path,
            cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/cmaps/",  // 字体
            cMapPacked: true,
            standardFontDataUrl: "/standard_fonts/",
        }).promise;
        setPdf(doc);

        // 设置尺寸
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 2});
        const divScale = view.clientWidth / viewport.width;
        setSize([viewport.width * divScale, viewport.height * divScale]);
    });

    // 页面跳转
    const onJump = (page:number) => {
        setPage(page);
        const div = document.getElementById(`pdf-page-${page}`);
        div?.scrollIntoView();
    }

    return (
        <main class='relative w-full h-full shrink-1 p-2'>
            <div ref={view} class='max-w-3xl m-auto flex flex-col gap-1'>
                <Show when={size()[1] > 0} fallback={<div class='w-full h-screen bg-gray-300 dark:bg-gray-700 animate-pulse'/>}>
                    <For each={new Array(pdf().numPages)}>
                    {
                        (_, i) => <PdfPage title={file!.name} pdf={pdf()} page={1 + i()} defaultWidth={size()[0]} defaultHeight={size()[1]}/>
                    }
                    </For>
                    <ToolBar pdf={pdf()} page={page()} onJump={onJump}/>
                </Show>
            </div>
        </main>
    )
}