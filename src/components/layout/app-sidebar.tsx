"use client"

import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavGroup } from "@/components/layout/nav-group"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import { sidebarData } from "./data/sidebar-data"
import { createClient } from "@/lib/supabase"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState(sidebarData.user)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url || "/avatars/avatar-1.png",
        })
      }
    })
  }, [])

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={sidebarData.teams} />
        </SidebarHeader>
        <SidebarContent>
          {sidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
