import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfViewerProps = {
  url: string;
};

export default function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  return (
    <div className="pdf-viewer">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p>Loading PDF...</p>}
        error={
          <div>
            <p>Could not load PDF preview.</p>
            <a href={url} target="_blank" rel="noreferrer">
              Open PDF in new tab
            </a>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, index) => (
          <Page key={index} pageNumber={index + 1} width={520} />
        ))}
      </Document>
    </div>
  );
}