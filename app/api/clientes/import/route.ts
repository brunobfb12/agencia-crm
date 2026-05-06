import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function splitCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { values.push(current); current = ""; }
    else { current += ch; }
  }
  values.push(current);
  return values;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map((h) =>
    h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_")
  );
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim().replace(/^"|"$/g, ""); });
    return row;
  }).filter((r) => Object.values(r).some((v) => v));
}

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) if (row[c] !== undefined) return row[c] ?? "";
  return "";
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("arquivo") as File | null;
  const empresaId = formData.get("empresaId") as string;
  const vendedorId = (formData.get("vendedorId") as string | null) || null;

  if (!file || !empresaId) {
    return NextResponse.json({ ok: false, erro: "arquivo e empresaId obrigatorios" }, { status: 400 });
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) return NextResponse.json({ ok: false, erro: "empresa nao encontrada" }, { status: 404 });

  const text = await file.text();
  const rows = parseCSV(text);

  let importados = 0;
  let ignorados = 0;
  const erros: string[] = [];

  for (const row of rows) {
    const telefone = findCol(row, ["telefone", "fone", "celular", "whatsapp", "phone"]).replace(/\D/g, "");
    if (!telefone || telefone.length < 8) { ignorados++; continue; }

    const nome = findCol(row, ["nome", "name", "cliente", "razao_social", "razao social"]) || null;
    const email = findCol(row, ["email", "e-mail", "mail"]) || null;
    const nascStr = findCol(row, ["data_nascimento", "nascimento", "birthday", "data_de_nascimento", "dt_nascimento"]);
    let dataNascimento: Date | null = null;
    if (nascStr) {
      const d = new Date(nascStr.includes("/") ? nascStr.split("/").reverse().join("-") : nascStr);
      if (!isNaN(d.getTime())) dataNascimento = d;
    }

    const obs = [
      findCol(row, ["ultima_compra", "ultima compra", "last_purchase"]),
      findCol(row, ["valor", "valor_compra", "total", "total_compras"]),
      findCol(row, ["observacoes", "observacao", "obs", "notes"]),
    ].filter(Boolean).join(" | ") || null;

    try {
      const clienteData = {
        telefone,
        empresaId,
        ...(nome !== null && { nome }),
        ...(email !== null && { email }),
        ...(dataNascimento !== null && { dataNascimento }),
      };
      const cliente = await prisma.cliente.upsert({
        where: { telefone_empresaId: { telefone, empresaId } },
        create: clienteData,
        update: clienteData,
      });

      const leadExiste = await prisma.lead.findFirst({
        where: { clienteId: cliente.id, empresaId, status: { not: "PERDIDO" } },
      });

      if (!leadExiste) {
        await prisma.lead.create({
          data: {
            clienteId: cliente.id,
            empresaId,
            ...(vendedorId && { vendedorId }),
            ...(obs && { observacoes: obs }),
          },
        });
      } else {
        const updateData: Record<string, unknown> = {};
        if (vendedorId && !leadExiste.vendedorId) updateData.vendedorId = vendedorId;
        if (obs && !leadExiste.observacoes) updateData.observacoes = obs;
        if (Object.keys(updateData).length > 0) {
          await prisma.lead.update({ where: { id: leadExiste.id }, data: updateData });
        }
      }

      importados++;
    } catch (e: any) {
      erros.push(`${telefone}: ${e.message?.slice(0, 60)}`);
      ignorados++;
    }
  }

  return NextResponse.json({ ok: true, importados, ignorados, erros: erros.slice(0, 10) });
}
