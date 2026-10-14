
import CardLink from '../components/CardLink'
import SearchBox from '../components/SearchBox';
import { onMount } from 'solid-js';
import type { Summary } from '../types/summary';
import { homeSeo, setPageSeo } from '../utils/seo';
import { countDocs } from '../utils/seoContent';

export interface HomeProps {
    summary: Summary;
}

export default function Home(props:HomeProps) {
    onMount(() => {
        setPageSeo(homeSeo(countDocs(props.summary)));
    });

    return (
        <div class='flex-1 px-1 overflow-auto'>
            <main class='max-w-7xl w-full m-auto'>
                <h1 class='sr-only'>PDF Shelf - 免费编程电子书 PDF 在线阅读与下载</h1>
                <div class='my-4'>
                    <SearchBox summary={props.summary}/>
                </div>
                {
                    props.summary.map((dir) => {
                        return (
                            <section class='my-4'>
                                <h2 class='text-lg font-bold text-emerald-500 border-emerald-500 border-s-4 border-b-1 px-1 mb-4'>{dir.name}</h2>
                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                                    {
                                        dir.docs.map((file) => {
                                            return (
                                                <div class="aspect-square flex items-center justify-center">
                                                    <CardLink text={file.name} path={file.id}/>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </section>
                        )
                        
                    })
                }
            </main>
        </div>
    )
}
