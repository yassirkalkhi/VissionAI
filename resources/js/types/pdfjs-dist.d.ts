declare module 'pdfjs-dist/build/pdf' {
    export const GlobalWorkerOptions: {
        workerSrc: string;
    };
}

declare module 'pdfjs-dist' {
    export interface PDFPage {
        getTextContent(): Promise<{
            items: Array<{
                str: string;
            }>;
        }>;
    }
} 