/**
 * Text-based retrieval for Academy course materials.
 * Returns the full extracted text split into chunks as "retrieved" results.
 * This mirrors Splash AI's retrievalService interface so tutorService works
 * identically — swap this for vector search once pgvector is enabled.
 */
import { db } from "@/lib/db";
import type { RetrievedChunk } from "@/types";

const CHUNK_SIZE = 1500; // characters per chunk
const MAX_CHUNKS = 8;

function chunkText(text: string, materialId: string, filename: string): RetrievedChunk[] {
  const chunks: RetrievedChunk[] = [];
  for (let i = 0; i * CHUNK_SIZE < text.length && i < MAX_CHUNKS; i++) {
    chunks.push({
      id: `${materialId}-${i}`,
      materialId,
      filename,
      page: null,
      chunkIndex: i,
      content: text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      score: 1.0,
    });
  }
  return chunks;
}

export async function similaritySearch(params: {
  courseId: string;
  query: string;
  k?: number;
}): Promise<RetrievedChunk[]> {
  const k = params.k ?? 8;

  const materials = await db.courseMaterial.findMany({
    where: { courseId: params.courseId },
    select: { id: true, filename: true, title: true, extractedText: true },
    take: 5,
  });

  if (materials.length === 0) return [];

  // Simple keyword relevance: score each chunk by query term presence
  const queryTerms = params.query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  const allChunks: (RetrievedChunk & { relevance: number })[] = [];

  for (const mat of materials) {
    const chunks = chunkText(mat.extractedText, mat.id, mat.title || mat.filename);
    for (const chunk of chunks) {
      const lower = chunk.content.toLowerCase();
      const relevance = queryTerms.reduce(
        (sum, term) => sum + (lower.includes(term) ? 1 : 0),
        0
      );
      allChunks.push({ ...chunk, relevance });
    }
  }

  // Sort by relevance, take top k
  return allChunks
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, k)
    .map(({ relevance: _, ...c }) => c);
}

export function formatSourcesForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "(No course materials have been uploaded yet for this topic.)";
  }
  return chunks
    .map((c, i) => `[SOURCE ${i + 1} — ${c.filename}]\n${c.content}`)
    .join("\n\n---\n\n");
}
