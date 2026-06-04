export type Bill = {
  id: string;
  title: string;
  summary: string;
  congress: number;
  chamber: "House" | "Senate";
  status?: string;
  sponsors?: string[];
  cosineSimilarity?: number;
  pdfUrl?: string;
};