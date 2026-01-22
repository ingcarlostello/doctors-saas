"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Video, Phone, MoreVertical, Smile, Paperclip, Mic, Send, ArrowLeft } from "lucide-react"
import { MessageBubble, type Message } from "./message-bubble"
import { cn } from "@/lib/utils"
import { useChatInput } from "@/hooks/chat/useChatInput"

interface Contact {
  id: string
  name: string
  avatar: string
  isOnline: boolean
}

interface ChatAreaProps {
  contact: Contact | null
  messages: Message[]
  onSendMessage: (content: string) => void
  isTyping: boolean
  onUserChattingChange?: (isChatting: boolean) => void
  isChatActive?: boolean
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatArea({
  contact,
  messages,
  onSendMessage,
  isTyping,
  onUserChattingChange,
  isChatActive,
  onBack,
  showBackButton,
}: ChatAreaProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesViewportRef = useRef<HTMLDivElement>(null)
  const idleTimerRef = useRef<number | null>(null)
  const currentId = contact?.id
  const chatActive = Boolean(isChatActive)
  const {
    value: inputValue,
    error: inputError,
    handleChange,
    reset,
    submit,
    setValue,
    isSubmitting,
  } = useChatInput({
    required: true,
    maxLength: 500,
    onSubmit: async (content) => {
      if (!currentId) return
      onSendMessage(content)
      setDrafts((prev) => {
        const { [currentId]: _, ...rest } = prev
        return rest
      })
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }

  const bumpUserChatting = () => {
    onUserChattingChange?.(true)
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      onUserChattingChange?.(false)
    }, 2500)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
      onUserChattingChange?.(false)
    }
  }, [onUserChattingChange])

  useEffect(() => {
    if (!currentId) onUserChattingChange?.(false)
  }, [currentId, onUserChattingChange])

  useEffect(() => {
    if (!currentId) {
      setValue("")
      return
    }
    setValue(drafts[currentId] ?? "")
  }, [currentId, drafts, setValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentId) return
    bumpUserChatting()
    const value = e.target.value
    handleChange(e)
    setDrafts((prev) => {
      if (value === "") {
        const { [currentId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [currentId]: value }
    })
  }

  const handleSend = async () => {
    if (!currentId) return
    const success = await submit()
    if (success) {
      reset()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    bumpUserChatting()
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Send className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium">Select a chat to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="relative">
            <img
              src={contact.avatar || "/user-default.jpg"}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {contact.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{contact.name}</h2>
            <span className="text-xs text-emerald-500">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Video className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesViewportRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background to-muted/20"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} isChatActive={chatActive} viewportRef={messagesViewportRef} />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-3 animate-in fade-in duration-300">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Smile className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={bumpUserChatting}
            onBlur={() => {
              if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
              onUserChattingChange?.(false)
            }}
            className="flex-1 px-4 py-2 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border-none outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!inputValue.trim() || Boolean(inputError) || isSubmitting}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              inputValue.trim() && !inputError && !isSubmitting
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            Send
          </button>
        </div>
        {inputError && (
          <div className="mt-2 text-xs text-destructive">{inputError}</div>
        )}
      </div>
    </div>
  )
}
