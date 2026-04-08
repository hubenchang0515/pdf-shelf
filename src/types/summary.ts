type DocumentType = 'pdf' | 'dir' | 'txt';

interface Document {
    id: string;
    type: DocumentType;
    name: string;
    path: string;
}

interface Category {
    id: string;
    name: string;
    path: string;
    docs: Document[];
}

export type Summary = Category[];