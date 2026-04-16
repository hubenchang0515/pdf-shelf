export interface CardLinkProps {
    text: string;
    path: string;
}

export default function CardLink(props:CardLinkProps) {
    return (
        <a
            href={props.path} 
            title={props.text}
            style={{"background":'url(/pdf.png)', "background-size": 'cover'}}
            class="w-full h-full outline-none select-none flex rounded-lg hover:scale-105 text-indigo-950 dark:text-sky-600 hover:text-emerald-500 break-all">
            <span class="w-full flex justify-center font-bold pt-12">
                <span class="text-shadow-lg">《{props.text}》</span>
            </span>
        </a>
    )
}