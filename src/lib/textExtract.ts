/**
 * Text extraction from uploaded course material files.
 * Supports: PDF, DOCX, TXT, plain text paste.
 *
 * NOTE: This file is only ever imported in Node.js runtime route handlers
 * (not Edge Runtime). The `export const runtime = "nodejs"` in those routes
 * ensures these CJS-only packages are available at runtime.
 */

export type FileType = "pdf" | "docx" | "txt" | "text";

const MAX_CHARS = 60_000; // ~15k tokens — keeps context reasonable

export function detectFileType(
  filename: string,
  mimeType: string
): FileType | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (
    ext === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (ext === "txt" || ext === "md" || mimeType.startsWith("text/")) return "txt";
  return null;
}

export async function extractText(
  buffer: Buffer,
  fileType: FileType
): Promise<string> {
  let text = "";

  if (fileType === "pdf") {
    // Use require() for CJS compatibility with Turbopack
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (
      buf: Buffer
    ) => Promise<{ text: string; numpages: number }>;
    const result = await pdfParse(buffer);
    text = result.text ?? "";
  } else if (fileType === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value ?? "";
  } else {
    // txt, md, or plain text
    text = buffer.toString("utf-8");
  }

  return text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
}
