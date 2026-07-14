import {
  IconApps,
  IconBarrierBlock,
  IconBug,
  IconChecklist,
  IconCode,
  IconCoin,
  IconError404,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconNotification,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUser,
  IconUserOff,
} from "@tabler/icons-react"
import { AudioWaveform, GalleryVerticalEnd, BarChart3, Zap, Users, FolderOpen, MessageSquareCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { type SidebarData } from "../types"

export const sidebarData: SidebarData = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/avatar-1.png",
  },
  teams: [
    {
      name: "Smart Workplace",
      logo: ({ className }: { className: string }) => (
        <Logo className={cn("invert dark:invert-0", className)} />
      ),
      plan: "AI Hub",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Workspace Analytics",
          url: "/", // Kita arahkan ke / karena dashboard utama ada di rute ini
          icon: BarChart3,
        },
        {
          title: "Agent Automations",
          url: "/tasks", // disesuaikan ke folder tasks
          icon: Zap,
        },
        // {
        //   title: "Team Members",
        //   url: "/users", // disesuaikan ke folder users
        //   icon: Users,
        // },
      ],
    },
    {
      title: "AI Workplace Hub",
      items: [
        {
          title: "Knowledge Base",
          url: "/documents", // disesuaikan karena berada di bawah grup rute (dashboard)
          icon: FolderOpen,
        },
        {
          title: "AI Workplace Chat",
          url: "/chat",
          icon: MessageSquareCode,
        },
      ],
    },
  //   {
  //     title: "Pages",
  //     items: [
  //       // {
  //       //   title: "Auth",
  //       //   icon: IconLockAccess,
  //       //   items: [
  //       //     {
  //       //       title: "Login",
  //       //       url: "/login",
  //       //     },
  //       //     {
  //       //       title: "Register",
  //       //       url: "/register",
  //       //     },
  //       //     {
  //       //       title: "Forgot Password",
  //       //       url: "/forgot-password",
  //       //     },
  //       //   ],
  //       // },
  //       {
  //         title: "Errors",
  //         icon: IconBug,
  //         items: [
  //           {
  //             title: "Unauthorized",
  //             url: "/401",
  //             icon: IconLock,
  //           },
  //           {
  //             title: "Forbidden",
  //             url: "/403",
  //             icon: IconUserOff,
  //           },
  //           {
  //             title: "Not Found",
  //             url: "/404",
  //             icon: IconError404,
  //           },
  //           {
  //             title: "Internal Server Error",
  //             url: "/error",
  //             icon: IconServerOff,
  //           },
  //           {
  //             title: "Maintenance Error",
  //             url: "/503",
  //             icon: IconBarrierBlock,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Other",
  //     items: [
  //       {
  //         title: "Settings",
  //         icon: IconSettings,
  //         items: [
  //           {
  //             title: "General",
  //             icon: IconTool,
  //             url: "/settings",
  //           },
  //           {
  //             title: "Profile",
  //             icon: IconUser,
  //             url: "/settings/profile",
  //           },
  //           {
  //             title: "Billing",
  //             icon: IconCoin,
  //             url: "/settings/billing",
  //           },
  //           {
  //             title: "Plans",
  //             icon: IconChecklist,
  //             url: "/settings/plans",
  //           },
  //           {
  //             title: "Connected Apps",
  //             icon: IconApps,
  //             url: "/settings/connected-apps",
  //           },
  //           {
  //             title: "Notifications",
  //             icon: IconNotification,
  //             url: "/settings/notifications",
  //           },
  //         ],
  //       },
  //       {
  //         title: "Developers",
  //         icon: IconCode,
  //         items: [
  //           {
  //             title: "Overview",
  //             url: "/developers/overview",
  //           },
  //           {
  //             title: "API Keys",
  //             url: "/developers/api-keys",
  //           },
  //           {
  //             title: "Webhooks",
  //             url: "/developers/webhooks",
  //           },
  //           {
  //             title: "Events/Logs",
  //             url: "/developers/events-&-logs",
  //           },
  //         ],
  //       },
  //     ],
  //   },
  ],
}
