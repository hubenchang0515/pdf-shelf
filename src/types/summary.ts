interface File {
    id: string;
    name: string;
    path: string;
}

interface Dir {
    id: string;
    name: string;
    path: string;
    files: File[];
}

export type Summary = Dir[];