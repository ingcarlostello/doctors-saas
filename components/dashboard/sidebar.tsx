"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Megaphone, X, MessagesSquare, Settings, FileCheck, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Recall Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "WhatsApp Templates", href: "/whatsapp-templates", icon: FileCheck },
  { name: "Chat", href: "/chat", icon: MessagesSquare },
  { name: "Settings", href: "/settings", icon: Settings },
]

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
  const conversations = useQuery(api.chat.listConversations, {})
  const hasUnreadMessages = (conversations ?? []).some((c) => (c.unreadCount ?? 0) > 0)

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
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
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const showUnreadDot = item.href === "/chat" && hasUnreadMessages && !isActive
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
        <p className="text-xs text-muted-foreground">© 2026 Zenticare Medical</p>
      </div>
    </div>
  )
}
