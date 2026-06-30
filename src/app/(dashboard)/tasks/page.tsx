import { createClient } from "@supabase/supabase-js"
import { columns } from "./components/tasks-columns"
import TasksPrimaryActions from "./components/tasks-primary-actions"
import { TasksTable } from "./components/tasks-table"
import { taskListSchema } from "./data/schema"

// 1. Inisialisasi client Supabase (Gunakan anon key sesuai env lu)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Ubah fungsi komponen menjadi 'async' agar bisa fetch data di Server-side
export default async function TasksPage() {
  // 3. Ambil data real-time dari tabel 'tasks' di Supabase
  const { data: fetchedTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) // Urutkan dari yang paling baru dibuat

  if (error) {
    console.error("Gagal mengambil data dari Supabase:", error.message)
    // Fallback array kosong jika error agar halaman tidak langsung crash hard 500
    return (
      <div className="p-4 text-red-500">
        Gagal memuat data tugas. Silakan cek koneksi database Supabase kamu.
      </div>
    )
  }

  // 4. Validasi data yang didapat menggunakan skema Zod bawaan template lu
  // Jika struktur tabel Supabase lu ada yang beda dikit sama tipe di schema.ts,
  // lu bisa sesuaikan di file schema.ts atau langsung kirim 'fetchedTasks as any' ke table.
  const taskList = taskListSchema.parse(fetchedTasks || [])

  return (
    <>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your tasks for this month!
          </p>
        </div>
        <TasksPrimaryActions />
      </div>
      <div className="flex-1">
        <TasksTable data={taskList} columns={columns} />
      </div>
    </>
  )
}
