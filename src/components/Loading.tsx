export interface LoadingProps {
    title?: string;
}

export default function Loading(props:LoadingProps) {
    return (
        <div class='w-full h-screen bg-gray-300 dark:bg-gray-700 animate-pulse flex flex-col items-center justify-center rounded-lg'>
            <h2 class="text-2xl font-bold text-red-500 text-center">《{props.title}》</h2>
            <p class="font-bold text-orange-500 text-center">
                正在加载中，通常需要大约 30 秒，请耐心等待。
            </p>
            <p class="font-bold text-orange-500 text-center">
                墙内用户若访问不畅请尝试
                <a href='https://linkcube.org/aff.php?aff=2998' target='_blank' rel='noopener noreferrer' class='text-blue-500 hover:underline'>
                    科学上网
                </a>
                。
            </p>
        </div>
    )
}