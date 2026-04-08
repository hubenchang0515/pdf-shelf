
import type { Summary } from '../types/summary';
import { createSignal, For, onMount, Show } from "solid-js";
import * as pdfjsLib from "pdfjs-dist";
import 'pdfjs-dist/web/pdf_viewer.css';

import workerSrc from "pdfjs-dist/build/pdf.worker?url";
import PdfPage from '../components/PdfPage';
import ToolBar from '../components/ToolBar';
import Loading from '../components/Loading';
import { mergePdf } from '../utils/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ViewProps {
    summary: Summary;
    id: string;
}

async function merge(path:string) {
    const res = await fetch(path + '/manifest.json');
    const manifest = await res.json();
    const files = await Promise.all(manifest.partitions.map(async (file:string) => {
        const res = await fetch(path + '/' + file);
        const data = await res.arrayBuffer();
        return new File([data], file, { type:'application/octet-stream' });
    }));
    return await mergePdf(files);
}

export default function View(props:ViewProps) {
    const file = props.summary.flatMap(dir => dir.docs).find(file => file.id === props.id);
    const [path, setPath] = createSignal<string>(file!.name);
    const [pdf, setPdf] = createSignal<any>();
    const [size, setSize] = createSignal<[number, number]>([0,0]);
    const [page, setPage] = createSignal(1);
    
    let view!: HTMLDivElement;

    // 初始化
    onMount(async () => {
        let path = file!.path;
        if (file!.type === 'dir') {
            path = await merge(path);
            setPath(path);
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
                <Show when={size()[1] > 0} fallback={<Loading/>}>
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