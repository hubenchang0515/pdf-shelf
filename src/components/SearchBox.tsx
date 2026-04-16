import { createEffect, createSignal, For } from "solid-js";
import type { Summary, Document } from "../types/summary";

export interface SearchBoxProps {
    summary: Summary;
}

export default function SearchBox(props:SearchBoxProps) {  
    const [text, setText] = createSignal("");  
    const [items, setItems] = createSignal<Document[]>([]);

    createEffect(() => {
        const s = text().trim().toLocaleLowerCase();
        if (s) {
            const result = props.summary.flatMap(category => category.docs).filter(doc => doc.name.toLocaleLowerCase().includes(s));
            setItems(result);
        } else {
            setItems([]);
        }
    });

    return (
        <div class="relative">
            <input class="w-full outline-none border-1 border-slate-300 bg-white dark:bg-slate-700 p-2" placeholder="搜索..." value={text()} onInput={(ev)=>setText(ev.target.value)}/>
            <div class="absolute top-12 border-slate-300 w-full bg-white dark:bg-slate-700 max-h-40 overflow-auto">
                <For each={items()}>
                    {
                        (item) => {
                            return  (
                                <a href={item.id} class="block p-2 hover:bg-slate-300">{item.name}</a>
                            )
                        }
                    }
                </For>
            </div>
        </div>
    )
}