export type Bill = {
  id?: string;
  number?: string;
  congress?: 118 | 119;

  originChamberCode?: "H" | "S";
  chamber?: "House" | "Senate";

  title: string;

  summary?: string;
  summary_text?: string;
  summaryText?: string;
  bill_text_cleaned?: string;

  pdf_url?: string;
  bill_pdf_url?: string;
  pdfUrl?: string;

  similarity?: number;
};