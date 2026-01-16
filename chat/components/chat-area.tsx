"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Video, Phone, MoreVertical, Smile, Paperclip, Mic, Send, ArrowLeft } from "lucide-react"
import { MessageBubble, type Message } from "./message-bubble"
import { cn } from "@/lib/utils"

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
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatArea({ contact, messages, onSendMessage, isTyping, onBack, showBackButton }: ChatAreaProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentId = contact?.id
  const inputValue = currentId ? drafts[currentId] ?? "" : ""

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentId) return
    const value = e.target.value
    setDrafts((prev) => {
      if (value === "") {
        const { [currentId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [currentId]: value }
    })
  }

  const handleSend = () => {
    if (!currentId) return
    const content = inputValue.trim()
    if (content) {
      onSendMessage(content)
      setDrafts((prev) => {
        const { [currentId]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
              src={contact.avatar || "/placeholder.svg"}
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
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background to-muted/20">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
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
            className="flex-1 px-4 py-2 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border-none outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              inputValue.trim()
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
