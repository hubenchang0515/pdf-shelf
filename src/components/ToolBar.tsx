import { createEffect, createSignal, Show } from "solid-js";
import * as pdfjsLib from "pdfjs-dist";
import ListIcon from "../assets/icons/ListIcon";
import LeftIcon from "../assets/icons/LeftIcon";
import RightIcon from "../assets/icons/RightIcon";
import Outline from "./Outline";
import DownloadIcon from "../assets/icons/DownloadIcon";

export interface ToolBarProps {
    name: string;
    filepath: string;
    pdf: pdfjsLib.PDFDocumentProxy;
    page: number;
    onJump: (page:number)=>void;
}

export default function ToolBar(props:ToolBarProps) {
    const [showOutline, setShowOutline] = createSignal(false);
    const [outline, setOutline] = createSignal<any[]>([])
    createEffect(async () => {
        setOutline(await props.pdf.getOutline());
        if (window.innerWidth >= 1550) {
            setShowOutline(true);
        }
    });

    return (
        <div>
            <div class="fixed bottom-0 left-0 right-0 z-50 h-10 px-2 flex gap-2 justify-between items-center bg-gray-300 dark:bg-gray-700 touch-none">
                <button class="cursor-pointer hover:scale-110 active:scale-100 bg-gray-200 dark:bg-gray-600 p-1" onClick={()=>setShowOutline(!showOutline())}><ListIcon/></button>
                <a class="cursor-pointer hover:scale-110 active:scale-100 bg-gray-200 dark:bg-gray-600 p-1" href={props.filepath} download={props.name + '.pdf'}><DownloadIcon/></a>
                <div class="flex-1"/>
                <span class="flex gap-2 items-center">
                    <button class="cursor-pointer hover:scale-110 active:scale-100 bg-gray-200 dark:bg-gray-600 p-1" onClick={()=>props.onJump(props.page <= 1 ? 1 : props.page - 1)}><LeftIcon/></button>
                    <input type="number" class="appearance-none w-12 hover:bg-white focus:bg-white" min={1} max={props.pdf.numPages} value={props.page} onChange={(ev)=>props.onJump(Number(ev.target.value))}></input>
                    <span>/</span>
                    <span>{props.pdf.numPages}</span>
                    <button class="cursor-pointer hover:scale-110 active:scale-100 bg-gray-200 dark:bg-gray-600 p-1" onClick={()=>props.onJump(props.page >= props.pdf.numPages ? props.pdf.numPages : props.page + 1)}><RightIcon/></button>
                </span>
                <Show when={showOutline()}>
                    <div class="fixed top-12 bottom-10 left-0 right-0 2xl:w-85 overflow-hidden">
                        <div class="w-full 2xl:max-w-85 bg-gray-200 dark:bg-gray-600 h-full overflow-auto">
                            <Outline items={outline()} onJump={async (dest)=>{
                                const pageIndex = await props.pdf.getPageIndex(dest[0]);
                                props.onJump(pageIndex + 1);

                                if (window.innerWidth < 1550) {
                                    setShowOutline(false);
                                }
                            }}/>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    )
}