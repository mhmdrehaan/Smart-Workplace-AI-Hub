import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText } from "unpdf";

function getClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables tidak lengkap");
  }
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY tidak dikonfigurasi");
  }

  return {
    supabase: createClient(supabaseUrl, supabaseKey),
    genAI: new GoogleGenerativeAI(geminiKey),
  };
}

function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
  }

  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, genAI } = getClients();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

   const buffer = Buffer.from(await file.arrayBuffer());
// eslint-disable-next-line @typescript-eslint/no-var-requires

const { text: textContent } = await extractText(new Uint8Array(buffer), { mergePages: true });

    if (!textContent || textContent.trim() === "") {
      return NextResponse.json(
        { error: "PDF kosong atau gagal diekstrak" },
        { status: 400 }
      );
    }

    const chunks = chunkText(textContent);
    

    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const dummyWorkspaceId = "00000000-0000-0000-0000-000000000000";

    for (const chunk of chunks) {
      const embeddingResult = await embeddingModel.embedContent(chunk);
      const embeddingVector = embeddingResult.embedding?.values;



      if (!embeddingVector || embeddingVector.length === 0) continue;

      const { error: dbError } = await supabase.from("documents").insert({
        title: file.name,
        content: chunk,
        embedding: embeddingVector,
        workspace_id: dummyWorkspaceId,
      });

      if (dbError) {
        console.error("Database Error:", dbError);
        return NextResponse.json(
          { error: `Supabase Error: ${dbError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dokumen berhasil dipelajari AI!",
    });
  } catch (error: any) {
    console.error("Upload Error:", {
      message: error.message,
      status: error.status,
    });
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}