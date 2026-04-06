import { onCleanup, onMount } from "solid-js";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs'

export interface PdfPageProps {
    pdf: pdfjsLib.PDFDocumentProxy;
    title: string;
    page: number;
    defaultWidth: number;
    defaultHeight: number;
}

export default function PdfPage(props:PdfPageProps) {

    let root!: HTMLDivElement;
    let container!: HTMLDivElement;
    let textLayerDiv!: HTMLDivElement;
    let annotationLayerDiv!: HTMLDivElement;
    let canvas!: HTMLCanvasElement;

    // 渲染
    const render = async () => {
        const page = await props.pdf.getPage(props.page);

        // 设置尺寸
        const viewport = page.getViewport({ scale: 2 });
        const context = canvas.getContext("2d")!;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const divScale = root.clientWidth / viewport.width;
        canvas.style.width = Math.floor(viewport.width * divScale) + "px";
        canvas.style.height =  Math.floor(viewport.height * divScale) + "px";
        container.style.width = Math.floor(viewport.width * divScale) + "px";
        container.style.height = Math.floor(viewport.height * divScale) + "px";

        // 渲染页面
        await page.render({
            canvasContext: context,
            viewport,
            canvas,
        }).promise;

        // 文本选取层
        textLayerDiv.innerHTML = '';
        const textLayer = new pdfjsLib.TextLayer({
            textContentSource: await page.getTextContent(),
            container: textLayerDiv,
            viewport: viewport,
        });
        await textLayer.render();

        // 链接层
        annotationLayerDiv.innerHTML = ''
        let pdfLinkService = new pdfjsViewer.PDFLinkService();
        const annotations = await page.getAnnotations();
        const annotationLayer = new pdfjsLib.AnnotationLayer({
            viewport: viewport.clone({ dontFlip: true }), // 坐标翻转
            div: annotationLayerDiv,
            page: page,
            linkService: pdfLinkService,
            accessibilityManager: null, 
            annotationCanvasMap: null,
            annotationEditorUIManager: null,
            structTreeLayer: null,
            commentManager: null,
            annotationStorage: null,
        });
        await annotationLayer.render({
            viewport: viewport.clone({ dontFlip: true }),
            div: annotationLayerDiv,
            annotations: annotations,
            page: page,
            linkService: pdfLinkService,
            enableScripting: true,
            renderForms: true,
        });

        annotationLayerDiv.style.left = canvas.offsetLeft + 'px';
        annotationLayerDiv.style.top = canvas.offsetTop + 'px';
        annotationLayerDiv.style.width = canvas.style.width;
        annotationLayerDiv.style.height = canvas.style.height;
    }

    // 清空
    const clear = () => {
        canvas.width = 0;
        canvas.height = 0;
        textLayerDiv.innerHTML = '';
        annotationLayerDiv.innerHTML = ''
    }

    onMount(() => {
        let rendering = false;
        let rendered = false;
        const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting && !rendered) {
                    rendering = true;
                    setTimeout(() => {
                        if (rendering) {
                            render();
                        }
                    }, 500);
                    rendered = true;
                } else if (!entry.isIntersecting && rendered) {
                    rendering = false;  // 取消渲染
                    clear()
                    rendered = false;
                }
            }, {
                rootMargin: props.defaultHeight + 'px',
            }
        );

        if (root) observer.observe(root);

        // 组件销毁时停止监听
        onCleanup(() => observer.disconnect());
    });

    return (
        <div ref={root} id={`pdf-page-${props.page}`} class='w-auto flex justify-center'>
            <div class="flex flex-col bg-white relative">
                <a class="text-center text-sm text-gray-400" href={`#pdf-page-${props.page}`}>{props.title}</a>
                <div ref={container} class='relative leading-none max-w-full' style={{width:props.defaultWidth+'px', height:props.defaultHeight+'px'}}>
                    <canvas ref={canvas}  class='bg-gray-50 h-full max-w-full'/>
                    <div ref={textLayerDiv} class='textLayer'/>
                    <div ref={annotationLayerDiv} class='annotationLayer'/>
                </div>
                <a class="text-center text-sm text-gray-400" href={`#pdf-page-${props.page}`}>{props.page}</a>
                <div class="hidden dark:block absolute top-0 bottom-0 left-0 right-0 bg-black/50 pointer-events-none"/>
            </div>
        </div>
    )
}