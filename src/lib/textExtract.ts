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
    // Use unpdf (serverless-friendly). pdf-parse + pdfjs-dist crashes with
    // "DOMMatrix is not defined" on Vercel's Node.js runtime because pdfjs
    // expects browser-only DOM APIs.
    //
    // unpdf's bundled pdfjs uses Promise.try which only landed in Node 22.5+;
    // Node 22.20 (and Vercel's 22.x) lacks it. Polyfill before importing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const P = Promise as any;
    if (typeof P.try !== "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      P.try = (fn: (...args: any[]) => any, ...args: any[]) =>
        new Promise((resolve) => resolve(fn(...args)));
    }

    const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractPdfText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text ?? "";
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
