import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Sesuaikan jika kamu pakai sdk gemini lama kamu

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { message, senderNumber } = await request.json()

    // 1. Minta Gemini mendeteksi intensi dari pesan teks (Structured Output)
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" })
    const prompt = `
  Kamu adalah AI Scrum Master otonom di platform AI Workplace Hub.
  Tugasmu menganalisis pesan dari user dan mendeteksi tindakan (action) manajemen proyek yang dimaksud.
  
  Pesan: "${message}"

  Kembalikan response HANYA dalam format JSON mentah tanpa markdown:
  {
    "action": "CREATE_TASK" | "UPDATE_STATUS" | "NONE",
    "task_title": "Judul ringkas tugas (diisi jika CREATE_TASK atau UPDATE_STATUS)",
    "label": "Bug" | "Feature" | "Documentation" | null,
    "priority": "Low" | "Medium" | "High" | null,
    "status": "Todo" | "Backlog" | "In Progress" | "Done" | null
  }
`

    const aiResult = await model.generateContent(prompt)
    const aiResponseText = aiResult.response
      .text()
      .replace(/```json|```/g, "")
      .trim()
    const parsedData = JSON.parse(aiResponseText)

    // ========================================================
    // 2. PERCABANGAN AKSI OTONOM (CREATE ATAU UPDATE)
    // ========================================================

    // SKENARIO A: Membuat Task Baru
    if (parsedData.action === "CREATE_TASK") {
      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: parsedData.task_title,
            description:
              parsedData.task_description ||
              "Dibuat otomatis oleh AI Agent via Chat",
            status: parsedData.status || "Todo", // Menyesuaikan kapitalisasi UI datatable lu
            priority: parsedData.priority || "Medium",
            // label: parsedData.label (uncomment jika kolom label sudah ada di DB)
          },
        ])
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        action_executed: "create_task",
        message: `Task '${parsedData.task_title}' berhasil dibuat otomatis oleh AI Agent!`,
      })
    }

    // SKENARIO B: Memperbarui Status Task yang Sudah Ada
    if (parsedData.action === "UPDATE_STATUS") {
      const { data: updatedTask, error } = await supabase
        .from("tasks")
        .update({ status: parsedData.status })
        .ilike("title", `%${parsedData.task_title}%`) // Mencari record task berdasarkan kemiripan judul
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        action_executed: "update_status",
        message: `Status untuk task '${parsedData.task_title}' berhasil diubah menjadi ${parsedData.status}!`,
      })
    }

    // 3. Jika bukan manajemen task, lempar ke logika RAG / Chat normal
    return NextResponse.json({
      success: true,
      action_executed: "none",
      note: "Normal chat fallback",
    })
  } catch (error: any) {
    console.error("Webhook Agent Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
