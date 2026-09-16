import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

const MAX_CHARS = 8000;
const SUPPORTED_TYPES = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { base64, mimeType } = body;

    if (!base64 || !mimeType) {
      return NextResponse.json(
        { ok: false, motivo: "base64 e mimeType são obrigatórios" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { ok: false, motivo: `Tipo não suportado: ${mimeType}. Use .xlsx, .xls ou .docx` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64, "base64");

    // Excel
    if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimeType === "application/vnd.ms-excel") {
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const textos: string[] = [];

        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          const dados = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

          for (const row of dados) {
            const linha = (row as Array<string | number>)
              .filter((cell) => cell !== "" && cell !== null && cell !== undefined)
              .join(" ");
            if (linha.trim()) textos.push(linha);
          }
        }

        const texto = textos.join("\n").substring(0, MAX_CHARS);
        return NextResponse.json({ ok: true, texto });
      } catch (error) {
        return NextResponse.json(
          { ok: false, motivo: `Erro ao processar Excel: ${error instanceof Error ? error.message : "desconhecido"}` },
          { status: 400 }
        );
      }
    }

    // Word
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) });
        const texto = result.value.substring(0, MAX_CHARS);
        return NextResponse.json({ ok: true, texto });
      } catch (error) {
        return NextResponse.json(
          { ok: false, motivo: `Erro ao processar Word: ${error instanceof Error ? error.message : "desconhecido"}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { ok: false, motivo: "Tipo de arquivo não tratado" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, motivo: `Erro interno: ${error instanceof Error ? error.message : "desconhecido"}` },
      { status: 500 }
    );
  }
}
