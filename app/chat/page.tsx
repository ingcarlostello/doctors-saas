"use client"

import { useState, useEffect } from "react"
import { ChatList } from "@/chat/components/chat-list"
import { ChatArea } from "@/chat/components/chat-area"
import { Message } from "@/chat/components/message-bubble"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

// Initial mock data
const initialChats = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "/negra.png",
    lastMessage: "That sounds great! Let me know when you're free",
    timestamp: "2m",
    unreadCount: 2,
    isOnline: true,
    messageStatus: "read" as const,
  },
  {
    id: "2",
    name: "Alex Chen",
    avatar: "/asiatico.png",
    lastMessage: "I'll send you the files tomorrow",
    timestamp: "15m",
    unreadCount: 0,
    isOnline: true,
    messageStatus: "delivered" as const,
  },
  {
    id: "3",
    name: "Design Team",
    avatar: "/empresa.png",
    lastMessage: "Meeting scheduled for 3 PM",
    timestamp: "1h",
    unreadCount: 5,
    isOnline: false,
    messageStatus: "sent" as const,
  },
  {
    id: "4",
    name: "Michael Brown",
    avatar: "/empresario.png",
    lastMessage: "Thanks for your help!",
    timestamp: "3h",
    unreadCount: 0,
    isOnline: false,
    messageStatus: "read" as const,
  },
  {
    id: "5",
    name: "Emma Wilson",
    avatar: "/rubia.png",
    lastMessage: "See you at the event!",
    timestamp: "1d",
    unreadCount: 0,
    isOnline: true,
    messageStatus: "read" as const,
  },
]

const initialMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      content: "Hey! How are you doing?",
      timestamp: "10:30 AM",
      isSent: false,
      status: "read",
      type: "text",
    },
    {
      id: "m2",
      content: "I'm doing great, thanks for asking! Just finished a big project.",
      timestamp: "10:32 AM",
      isSent: true,
      status: "read",
      type: "text",
    },
    {
      id: "m3",
      content: "That's awesome! We should celebrate. Want to grab coffee sometime this week?",
      timestamp: "10:33 AM",
      isSent: false,
      status: "read",
      type: "text",
    },
    {
      id: "m4",
      content: "",
      timestamp: "10:35 AM",
      isSent: false,
      status: "read",
      type: "image",
      images: ["/cozy-coffee-shop.png", "/latte-art-coffee.jpg"],
    },
    {
      id: "m5",
      content: "Here's a voice note about the location",
      timestamp: "10:36 AM",
      isSent: false,
      status: "read",
      type: "voice",
      voiceDuration: 15,
    },
    {
      id: "m6",
      content: "That looks perfect! I'd love to. How about Thursday afternoon?",
      timestamp: "10:40 AM",
      isSent: true,
      status: "read",
      type: "text",
    },
    {
      id: "m7",
      content: "That sounds great! Let me know when you're free",
      timestamp: "10:42 AM",
      isSent: false,
      status: "read",
      type: "text",
    },
  ],
  "2": [
    {
      id: "m1",
      content: "Did you get a chance to review the designs?",
      timestamp: "9:00 AM",
      isSent: true,
      status: "delivered",
      type: "text",
    },
    {
      id: "m2",
      content: "Yes! They look amazing. A few minor tweaks needed.",
      timestamp: "9:15 AM",
      isSent: false,
      status: "read",
      type: "text",
    },
    {
      id: "m3",
      content: "I'll send you the files tomorrow",
      timestamp: "9:20 AM",
      isSent: false,
      status: "read",
      type: "text",
    },
  ],
}

// Auto-reply messages
const autoReplies = [
  "That's interesting! Tell me more.",
  "I completely agree with you.",
  "Let me think about that for a moment...",
  "Great idea! I love it.",
  "Thanks for sharing that with me!",
  "I'll get back to you on that.",
  "Sounds like a plan!",
  "That makes a lot of sense.",
]

export default function ChatPage() {
  const [chats, setChats] = useState(initialChats)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages)
  const [searchQuery, setSearchQuery] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const selectedChat = chats.find((c) => c.id === selectedChatId)
  const currentMessages = selectedChatId ? messages[selectedChatId] || [] : []

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id)
    // Clear unread count
    setChats((prev) => prev.map((chat) => (chat.id === id ? { ...chat, unreadCount: 0 } : chat)))
  }

  const handleSendMessage = (content: string) => {
    if (!selectedChatId) return

    const newMessage: Message = {
      id: `m${Date.now()}`,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSent: true,
      status: "sent",
      type: "text",
    }

    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMessage],
    }))

    // Update chat preview
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? { ...chat, lastMessage: content, timestamp: "now", messageStatus: "sent" as const }
          : chat,
      ),
    )

    // Simulate message status updates
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: prev[selectedChatId].map((m) => (m.id === newMessage.id ? { ...m, status: "delivered" } : m)),
      }))
    }, 1000)

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: prev[selectedChatId].map((m) => (m.id === newMessage.id ? { ...m, status: "read" } : m)),
      }))
    }, 2000)

    // Simulate typing and auto-reply
    setTimeout(() => setIsTyping(true), 1500)
    setTimeout(() => {
      setIsTyping(false)
      const replyMessage: Message = {
        id: `m${Date.now()}`,
        content: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSent: false,
        status: "read",
        type: "text",
      }
      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] || []), replyMessage],
      }))
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId ? { ...chat, lastMessage: replyMessage.content, timestamp: "now" } : chat,
        ),
      )
    }, 3500)
  }

  const handleNewChat = () => {
    const newChat = {
      id: `${Date.now()}`,
      name: "New Contact",
      avatar: "/diverse-person-avatars.png",
      lastMessage: "Start a conversation",
      timestamp: "now",
      unreadCount: 0,
      isOnline: true,
      messageStatus: "read" as const,
    }
    setChats((prev) => [newChat, ...prev])
    setSelectedChatId(newChat.id)
    setMessages((prev) => ({ ...prev, [newChat.id]: [] }))
  }

  const handleBack = () => {
    setSelectedChatId(null)
  }

  return (
    <DashboardLayout>
      {/* Mobile view */}
      {isMobileView ? (
        selectedChatId ? (
          <div className="h-[calc(100vh-4rem)] flex flex-col dark">
            <ChatArea
              contact={selectedChat ? { ...selectedChat } : null}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              onBack={handleBack}
              showBackButton
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-4rem)] flex flex-col dark">
            <ChatList
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewChat={handleNewChat}
            />
          </div>
        )
      ) : (
        // Desktop/Tablet view
        <div className="h-[calc(100vh-4rem)] flex dark">
          <div className="w-[30%] min-w-[280px] max-w-[400px]">
            <ChatList
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewChat={handleNewChat}
            />
          </div>
          <ChatArea
            contact={selectedChat ? { ...selectedChat } : null}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
      )}
    </DashboardLayout>
  )
}
