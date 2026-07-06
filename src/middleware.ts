import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // 1. Bypass webhook SEBELUM logic Supabase apa pun dijalankan
  if (request.nextUrl.pathname.startsWith("/api/webhook")) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentPath = request.nextUrl.pathname

  // Cek apakah halaman yang diakses adalah halaman login/register/forgot
  const isAuthPage =
    currentPath.startsWith("/login") ||
    currentPath.startsWith("/register") ||
    currentPath.startsWith("/forgot-password")

  // JIKA USER BELUM LOGIN & mencoba buka halaman apa pun yang bukan auth page, tendang ke /login
  // Ini juga mencakup root path "/" — tidak ada pengecualian lagi karena page.tsx sudah dihapus
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // JIKA USER SUDAH LOGIN & mencoba buka halaman /login atau /register, lempar langsung ke analytics dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/" // Mengarah ke rute dashboard utama lu
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}