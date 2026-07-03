import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    // Menyesuaikan payload dari WhatsApp Gateway (Fonnte/Whacenter)
    const messageText = body?.message || "";
    const senderNumber = body?.sender || "";

    if (!messageText || typeof messageText !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(`[WA AGENT] Pesan masuk dari ${senderNumber}: "${messageText}"`);

    const { supabase, genAI } = getClients();

    // 1. Embedding — Mengikuti model andalan lu yang sudah terbukti works
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(messageText);
    const embeddingVector = embeddingResult.embedding?.values;

    if (!embeddingVector || embeddingVector.length === 0) {
      throw new Error("Gagal generate embedding vector");
    }

    // 2. Vector search di Supabase
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

    // 3. Generate jawaban dengan kombinasi Instruksi Khusus (Otonom Task)
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Anda adalah asisten AI cerdas untuk Workplace Hub yang membalas chat otomatis via WhatsApp. 
      Jawab pertanyaan berdasarkan konteks berikut:

      ${contextText}

      [INSTRUKSI KHUSUS]:
      Jika user meminta Anda untuk membuat, menjadwalkan, atau menambahkan TUGAS/TASK baru (misal: "tolong bikinin tugas...", "jadwalkan rapat...", "bikin jadwal..."), berikan respons teks biasa seperti biasa, TETAPI di baris paling bawah jawaban Anda, wajib tambahkan teks format JSON kaku seperti ini:
      |||{"create_task": true, "task_title": "Judul Tugas Singkat", "task_desc": "Deskripsi detail tugas"}|||

      Pertanyaan: ${messageText}
      Jawaban:
    `;
    
    const chatResult = await chatModel.generateContent(prompt);
    let aiReply = chatResult.response.text();
    console.log(`[WA AGENT] Raw Respons AI: ${aiReply}`);

    // 4. DETEKSI & PARSING TRIGGER UTK AUTO-INSERT KE TABEL TASKS
    if (aiReply.includes("|||")) {
      const parts = aiReply.split("|||");
      aiReply = parts[0].trim(); // Bersihkan teks chat agar rapi saat dibaca di WhatsApp
      
      try {
        const jsonMetadata = JSON.parse(parts[1].trim());
        if (jsonMetadata.create_task) {
          console.log(`[WA AGENT] Menjalankan Aksi Pembuatan Task Otonom: ${jsonMetadata.task_title}`);
          
          // Insert langsung ke tabel tasks Supabase milik lu
          const { error: insertError } = await supabase
            .from("tasks")
            .insert([
              {
                title: jsonMetadata.task_title,
                description: `${jsonMetadata.task_desc} (Dibuat otomatis oleh AI Agent via WhatsApp)`
              }
            ]);
          
          if (!insertError) {
            aiReply += `\n\n✅ *Sistem Update:* Tugas "${jsonMetadata.task_title}" telah berhasil otomatis dibuat di dashboard Smart Workplace Anda!`;
          } else {
            console.error("[SUPABASE INSERT ERROR]:", insertError);
          }
        }
      } catch (parseError) {
        console.error("Gagal melakukan parsing task metadata:", parseError);
      }
    }

    console.log(`[WA AGENT] Final Reply Terkirim: ${aiReply}`);

    // Return format JSON untuk pengetesan di Postman
    return NextResponse.json({ reply: aiReply }, { status: 200 });

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