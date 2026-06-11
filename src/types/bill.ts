export type Bill = {
  id: string;
  title: string;
  summary: string;
  congress: number;
  originChamberCode: "H" | "S";
  status?: string;
  sponsors?: string[];
  cosineSimilarity?: number;
  pdfUrl?: string;
};