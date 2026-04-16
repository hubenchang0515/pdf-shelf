
import CardLink from '../components/CardLink'
import SearchBox from '../components/SearchBox';
import type { Summary } from '../types/summary';

export interface HomeProps {
    summary: Summary;
}

export default function Home(props:HomeProps) {
    return (
        <div class='flex-1 px-1 overflow-auto'>
            <main class='max-w-7xl w-full m-auto'>
                <div class='my-4'>
                    <SearchBox summary={props.summary}/>
                </div>
                {
                    props.summary.map((dir) => {
                        return (
                            <div class='my-4'>
                                <p class='text-lg font-bold text-emerald-500 border-emerald-500 border-s-4 border-b-1 px-1 mb-4'>{dir.name}</p>
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
                            </div>
                        )
                        
                    })
                }
            </main>
        </div>
    )
}