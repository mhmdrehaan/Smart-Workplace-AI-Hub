import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ← SDK lama

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const { supabase, genAI } = getClients();

    // Embedding — model sama dengan upload route
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(message);
    const embeddingVector = embeddingResult.embedding?.values;

    if (!embeddingVector || embeddingVector.length === 0) {
      throw new Error("Gagal generate embedding vector");
    }

    // Vector search di Supabase
    const { data: documents, error: matchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embeddingVector,
        match_threshold: 0.3,
        match_count: 5,
      }
    );

    if (matchError) {
      console.error("Supabase RPC Error:", matchError);
      return NextResponse.json(
        { error: `Gagal mencari dokumen: ${matchError.message}` },
        { status: 500 }
      );
    }

    const contextText =
      documents && documents.length > 0
        ? documents
            .map((doc: any) => `Title: ${doc.title}\nContent:\n${doc.content}`)
            .join("\n\n---\n\n")
        : "Tidak ada informasi relevan di database.";

    // Generate jawaban
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Anda adalah asisten AI cerdas untuk Workplace Hub. Jawab pertanyaan berdasarkan konteks berikut:\n\n${contextText}\n\nPertanyaan: ${message}\n\nJawaban:`;
    const chatResult = await chatModel.generateContent(prompt);
    const reply = chatResult.response.text();

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", {
      message: error.message,
      status: error.status,
    });

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}