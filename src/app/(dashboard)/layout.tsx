import { cookies } from "next/headers"
import { cn } from "@/lib/utils"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { createClient } from "@/lib/supabase/server"

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies()
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false"

  // Fetch the authenticated user securely on the server
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const user = authUser
    ? {
        name:
          (authUser.user_metadata?.full_name as string | undefined) ||
          authUser.email?.split("@")[0] ||
          "User",
        email: authUser.email ?? "",
        avatar:
          (authUser.user_metadata?.avatar_url as string | undefined) ?? "",
      }
    : {
        name: "User",
        email: "",
        avatar: "",
      }

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SidebarProvider defaultOpen={!defaultClose}>
        <AppSidebar user={user} />
        <div
          id="content"
          className={cn(
            "flex h-full w-full flex-col",
            "has-[div[data-layout=fixed]]:h-svh",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh"
          )}
        >
          {children}
        </div>
      </SidebarProvider>
    </div>
  )
}
