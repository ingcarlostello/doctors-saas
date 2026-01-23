export interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  messageStatus: "sent" | "delivered" | "read"
}

export interface ChatListProps {
  chats: Chat[]
  selectedChatId: string | null
  onSelectChat: (id: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onNewChat: () => void
}