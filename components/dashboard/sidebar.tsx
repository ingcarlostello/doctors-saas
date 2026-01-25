"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Megaphone, X, MessagesSquare, Settings, FileCheck, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useNamespace } from "@/components/TranslationProvider"
import { getLocaleFromPath } from "@/lib/i18n"

interface SidebarProps {
  onClose?: () => void
}

function UnreadNotificationDot() {
  return (
    <span
      aria-hidden="true"
      className="h-2 w-2 shrink-0 rounded-full bg-destructive animate-heartbeat motion-reduce:animate-none"
    />
  )
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const locale = getLocaleFromPath(pathname)
  const conversations = useQuery(api.chat.listConversations, {})
  const hasUnreadMessages = (conversations ?? []).some((c) => (c.unreadCount ?? 0) > 0)

  const { t: commonT } = useNamespace("common")
  const { t: dashboardT } = useNamespace("dashboard")

  const navigation = [
    { name: commonT.navigation.dashboard, href: `/${locale}/dashboard`, icon: LayoutDashboard },
    { name: commonT.navigation.calendar, href: `/${locale}/calendar`, icon: Calendar },
    { name: commonT.navigation.patients, href: `/${locale}/patients`, icon: Users },
    { name: commonT.navigation.campaigns, href: `/${locale}/campaigns`, icon: Megaphone },
    { name: commonT.navigation.whatsappTemplates, href: `/${locale}/whatsapp-templates`, icon: FileCheck },
    { name: commonT.navigation.chat, href: `/${locale}/chat`, icon: MessagesSquare },
    { name: commonT.navigation.settings, href: `/${locale}/settings`, icon: Settings },
  ]

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
            <Image
              src="/Z-logo-TransparetICO.ico"
              alt="Zenticare"
              width={16}
              height={16}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Zenticare</span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">{dashboardT.sidebar.closeSidebar}</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const showUnreadDot = item.href.endsWith("/chat") && hasUnreadMessages && !isActive
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex items-center gap-2">
                <span>{item.name}</span>
                {showUnreadDot ? <UnreadNotificationDot /> : null}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">{commonT.footer.copyright}</p>
      </div>
    </div>
  )
}
