type DocumentType = 'pdf' | 'dir' | 'txt';

export interface Document {
    id: string;
    type: DocumentType;
    name: string;
    path: string;
}

export interface Category {
    id: string;
    name: string;
    path: string;
    docs: Document[];
}

export type Summary = Category[];