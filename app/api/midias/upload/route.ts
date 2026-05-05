import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const form = await req.formData();
  const arquivo = form.get("arquivo") as File | null;
  const etiqueta = (form.get("etiqueta") as string)?.trim();
  const descricaoUso = (form.get("descricaoUso") as string)?.trim();
  const tipo = (form.get("tipo") as string) || "imagem";
  const empresaIdForm = form.get("empresaId") as string | null;

  const targetEmpresaId = me.perfil === "CENTRAL" ? empresaIdForm : me.empresaId;
  if (!targetEmpresaId) return NextResponse.json({ error: "empresaId obrigatório" }, { status: 400 });
  if (!arquivo) return NextResponse.json({ error: "arquivo obrigatório" }, { status: 400 });
  if (!etiqueta || !descricaoUso) return NextResponse.json({ error: "etiqueta e descricaoUso são obrigatórios" }, { status: 400 });

  const bytes = await arquivo.arrayBuffer();
  let base64 = Buffer.from(bytes).toString("base64");
  let mimeType = arquivo.type || "application/octet-stream";

  if (mimeType.startsWith("video/")) {
    const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmpIn = `/tmp/vid_in_${tmpId}`;
    const tmpOut = `/tmp/vid_out_${tmpId}.mp4`;
    try {
      fs.writeFileSync(tmpIn, Buffer.from(bytes));
      await execAsync(
        `ffmpeg -i "${tmpIn}" -c:v libx264 -preset fast -crf 28 -c:a aac -movflags +faststart -y "${tmpOut}"`,
        { timeout: 120000 }
      );
      const converted = fs.readFileSync(tmpOut);
      base64 = converted.toString("base64");
      mimeType = "video/mp4";
    } finally {
      if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
      if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
    }
  }

  const midia = await prisma.midia.create({
    data: { empresaId: targetEmpresaId, etiqueta, descricaoUso, tipo, base64, mimeType },
    select: { id: true, empresaId: true, etiqueta: true, url: true, mimeType: true, descricaoUso: true, tipo: true, ativo: true, criadoEm: true },
  });

  return NextResponse.json(midia, { status: 201 });
}
