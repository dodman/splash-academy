export type Citation = {
  index: number;
  materialId: string;
  filename: string;
  page?: number | null;
  chunkIndex: number;
  excerpt: string;
};

export type RetrievedChunk = {
  id: string;
  materialId: string;
  filename: string;
  page: number | null;
  chunkIndex: number;
  content: string;
  score: number;
};

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
