import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

export default async function RootPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            )
          } catch {
            // Dipanggil dari Server Component, abaikan jika gagal set cookie di sini
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Jika tidak ada user yang aktif, landing page dipaksa masuk ke halaman login
  if (!user) {
    redirect("/login")
  }

  // Jika user sudah terautentikasi, lempar langsung ke workspace-analytics dashboard
  redirect("/chat")
}