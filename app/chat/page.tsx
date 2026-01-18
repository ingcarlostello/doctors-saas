"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChatList } from "@/chat/components/chat-list"
import { ChatArea } from "@/chat/components/chat-area"
import { Message } from "@/chat/components/message-bubble"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect"

type UiChat = {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  messageStatus: "sent" | "delivered" | "read"
}

function formatRelativeTime(epochMs: number | undefined): string {
  if (!epochMs) return ""
  const diffMs = Date.now() - epochMs
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))
  if (diffSeconds < 60) return `${diffSeconds}s`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

function mapMessageStatus(status: Doc<"messages">["status"]): Message["status"] {
  if (status === "delivered") return "delivered"
  if (status === "read") return "read"
  return "sent"
}

function messageToUiMessage(message: Doc<"messages">): Message {
  const ts = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const isSent = message.direction === "out"
  const attachments = message.attachments ?? []
  const hasImages = attachments.some((a) => a.kind === "image")
  const hasAudio = attachments.some((a) => a.kind === "audio")

  if (message.is_deleted) {
    return {
      id: message._id,
      content: "Message deleted",
      timestamp: ts,
      isSent,
      status: mapMessageStatus(message.status),
      type: "text",
    }
  }

  if (hasImages) {
    const images = attachments.filter((a) => a.kind === "image").map((a) => a.url ?? "/placeholder.svg")
    return {
      id: message._id,
      content: "",
      timestamp: ts,
      isSent,
      status: mapMessageStatus(message.status),
      type: "image",
      images,
    }
  }

  if (hasAudio) {
    const audio = attachments.find((a) => a.kind === "audio") ?? null
    return {
      id: message._id,
      content: message.content ?? "",
      timestamp: ts,
      isSent,
      status: mapMessageStatus(message.status),
      type: "voice",
      voiceDuration: audio?.durationSeconds,
    }
  }

  return {
    id: message._id,
    content: message.content ?? "",
    timestamp: ts,
    isSent,
    status: mapMessageStatus(message.status),
    type: "text",
  }
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const initialChatId = searchParams.get("id")

  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileView, setIsMobileView] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(
    initialChatId ? (initialChatId as Id<"conversations">) : null
  )
  const [isUserChatting, setIsUserChatting] = useState(false)
  const [isChatInterfaceActive, setIsChatInterfaceActive] = useState(true)

  useEffect(() => {
    if (initialChatId) {
      setSelectedConversationId(initialChatId as Id<"conversations">)
    }
  }, [initialChatId])

  const { isAuthenticated } = useStoreUserEffect()
  const conversations = useQuery(api.chat.listConversations, isAuthenticated ? {} : "skip")
  const messages = useQuery(
    api.chat.getMessages,
    selectedConversationId && isAuthenticated ? { conversationId: selectedConversationId } : "skip",
  )
  const markConversationRead = useMutation(api.chat.markConversationRead)
  const sendMessage = useMutation(api.chat.sendMessage)
  const sendWhatsAppMessage = useAction(api.chatActions.sendWhatsAppMessage)

  const notificationAudioRef = useRef<HTMLAudioElement | null>(null)
  const notificationAudioLoadedRef = useRef(false)
  const notificationAudioLoadErrorRef = useRef(false)
  const hasInitializedConversationSnapshotRef = useRef(false)
  const prevConversationSnapshotRef = useRef<Map<string, { unreadCount: number; lastMessageAt: number }>>(new Map())
  const lastAutoMarkReadRef = useRef<string | null>(null)
  const markReadInFlightRef = useRef<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const update = () => {
      setIsChatInterfaceActive(!document.hidden && document.hasFocus())
    }
    update()
    window.addEventListener("focus", update)
    window.addEventListener("blur", update)
    document.addEventListener("visibilitychange", update)
    return () => {
      window.removeEventListener("focus", update)
      window.removeEventListener("blur", update)
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    notificationAudioLoadedRef.current = false
    notificationAudioLoadErrorRef.current = false

    let audio: HTMLAudioElement | null = null

    try {
      audio = new Audio("/notificationChat.MP3")
      audio.preload = "auto"
      audio.addEventListener("canplaythrough", () => {
        notificationAudioLoadedRef.current = true
      })
      audio.addEventListener("error", () => {
        notificationAudioLoadErrorRef.current = true
      })
      audio.load()
      notificationAudioRef.current = audio
    } catch {
      notificationAudioLoadErrorRef.current = true
    }

    return () => {
      hasInitializedConversationSnapshotRef.current = false
      prevConversationSnapshotRef.current = new Map()
      const current = notificationAudioRef.current
      if (current) {
        current.pause()
        current.src = ""
      }
      notificationAudioRef.current = null
      notificationAudioLoadedRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    const unlock = async () => {
      const audio = notificationAudioRef.current
      if (!audio || notificationAudioLoadErrorRef.current) return
      try {
        audio.muted = true
        await audio.play()
        audio.pause()
        audio.currentTime = 0
        audio.muted = false
      } catch { }
    }

    document.addEventListener("pointerdown", unlock, { once: true })
    document.addEventListener("keydown", unlock, { once: true })
    return () => {
      document.removeEventListener("pointerdown", unlock)
      document.removeEventListener("keydown", unlock)
    }
  }, [])

  const playNotificationSound = async () => {
    const audio = notificationAudioRef.current
    if (!audio) return
    if (notificationAudioLoadErrorRef.current) return
    try {
      if (!notificationAudioLoadedRef.current) audio.load()
      audio.pause()
      audio.currentTime = 0
      await audio.play()
    } catch { }
  }

  const isChatActive = Boolean(selectedConversationId) && isChatInterfaceActive

  const uiChats: UiChat[] = useMemo(() => {
    const list = conversations ?? []
    return list.map((c) => {
      const name = c.externalContact.name?.trim() || c.externalContact.phoneNumber
      const lastMessage = c.lastMessagePreview ?? ""
      const timestamp = formatRelativeTime(c.lastMessageAt)
      const unreadCount = c.unreadCount ?? 0
      const isSelectedAndActive = isChatActive && selectedConversationId === c._id
      const effectiveUnreadCount = isSelectedAndActive ? 0 : unreadCount
      const effectiveStatus: UiChat["messageStatus"] = isSelectedAndActive
        ? "read"
        : unreadCount > 0
          ? "delivered"
          : "read"
      return {
        id: c._id,
        name,
        avatar: "/user-default.jpg",
        lastMessage,
        timestamp,
        unreadCount: effectiveUnreadCount,
        isOnline: false,
        messageStatus: effectiveStatus,
      }
    })
  }, [conversations, isChatActive, selectedConversationId])

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null
    return (conversations ?? []).find((c) => c._id === selectedConversationId) ?? null
  }, [conversations, selectedConversationId])

  const currentMessages = useMemo(() => {
    return (messages ?? []).map(messageToUiMessage)
  }, [messages])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!selectedConversationId) return
    if (!isChatActive) return
    const unreadCount = selectedConversation?.unreadCount ?? 0
    if (unreadCount <= 0) return
    if (markReadInFlightRef.current === selectedConversationId) return

    const key = `${selectedConversationId}:${unreadCount}`
    if (lastAutoMarkReadRef.current === key) return
    lastAutoMarkReadRef.current = key

    markReadInFlightRef.current = selectedConversationId
    void markConversationRead({ conversationId: selectedConversationId }).finally(() => {
      if (markReadInFlightRef.current === selectedConversationId) markReadInFlightRef.current = null
    })
  }, [
    isAuthenticated,
    isChatActive,
    markConversationRead,
    selectedConversation?.unreadCount,
    selectedConversationId,
  ])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!conversations) return

    const nextSnapshot = new Map<string, { unreadCount: number; lastMessageAt: number }>()
    for (const c of conversations) {
      nextSnapshot.set(c._id, {
        unreadCount: c.unreadCount ?? 0,
        lastMessageAt: c.lastMessageAt ?? 0,
      })
    }

    if (!hasInitializedConversationSnapshotRef.current) {
      hasInitializedConversationSnapshotRef.current = true
      prevConversationSnapshotRef.current = nextSnapshot
      return
    }

    if (isUserChatting) {
      prevConversationSnapshotRef.current = nextSnapshot
      return
    }

    let shouldPlay = false
    for (const c of conversations) {
      if (selectedConversationId === c._id) continue
      const prev = prevConversationSnapshotRef.current.get(c._id)
      if (!prev) continue

      const nextUnread = c.unreadCount ?? 0
      const nextLast = c.lastMessageAt ?? 0
      if (nextUnread > prev.unreadCount && nextLast > prev.lastMessageAt) {
        shouldPlay = true
        break
      }
    }

    prevConversationSnapshotRef.current = nextSnapshot

    if (shouldPlay) void playNotificationSound()
  }, [conversations, isAuthenticated, isUserChatting, selectedConversationId])

  const handleSelectChat = async (id: string) => {
    const conversationId = id as Id<"conversations">
    setSelectedConversationId(conversationId)
    setIsUserChatting(false)
    if (markReadInFlightRef.current === conversationId) return
    markReadInFlightRef.current = conversationId
    try {
      await markConversationRead({ conversationId })
    } finally {
      if (markReadInFlightRef.current === conversationId) markReadInFlightRef.current = null
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return
    if (selectedConversation?.channel === "whatsapp") {
      await sendWhatsAppMessage({ conversationId: selectedConversationId, content })
      return
    }
    await sendMessage({ conversationId: selectedConversationId, content })
  }

  const handleNewChat = () => {
    const first = (conversations ?? [])[0]?._id ?? null
    if (first) setSelectedConversationId(first)
  }

  const handleBack = () => {
    setSelectedConversationId(null)
    setIsUserChatting(false)
  }

  const selectedChat: UiChat | null = selectedConversation
    ? {
      id: selectedConversation._id,
      name: selectedConversation.externalContact.name?.trim() || selectedConversation.externalContact.phoneNumber,
      avatar: "/user-default.jpg",
      lastMessage: selectedConversation.lastMessagePreview ?? "",
      timestamp: formatRelativeTime(selectedConversation.lastMessageAt),
      unreadCount: isChatActive ? 0 : (selectedConversation.unreadCount ?? 0),
      isOnline: false,
      messageStatus: isChatActive ? "read" : (selectedConversation.unreadCount ?? 0) > 0 ? "delivered" : "read",
    }
    : null

  return (
    <DashboardLayout>
      {isMobileView ? (
        selectedConversationId ? (
          <div className="h-[calc(100vh-4rem)] flex flex-col dark">
            <ChatArea
              contact={selectedChat ? { ...selectedChat } : null}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isTyping={false}
              onUserChattingChange={setIsUserChatting}
              isChatActive={isChatActive}
              onBack={handleBack}
              showBackButton
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-4rem)] flex flex-col dark">
            <ChatList
              chats={uiChats}
              selectedChatId={selectedConversationId}
              onSelectChat={handleSelectChat}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewChat={handleNewChat}
            />
          </div>
        )
      ) : (
        <div className="h-[calc(100vh-4rem)] flex dark">
          <div className="w-[30%] min-w-[280px] max-w-[400px]">
            <ChatList
              chats={uiChats}
              selectedChatId={selectedConversationId}
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
            isTyping={false}
            onUserChattingChange={setIsUserChatting}
            isChatActive={isChatActive}
          />
        </div>
      )}
    </DashboardLayout>
  )
}
