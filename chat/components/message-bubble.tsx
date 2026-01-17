"use client"

import { Check, CheckCheck, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RefObject } from "react"
import { useEffect, useRef, useState } from "react"

export interface Message {
  id: string
  content: string
  timestamp: string
  isSent: boolean
  status: "sent" | "delivered" | "read"
  type: "text" | "image" | "voice"
  images?: string[]
  voiceDuration?: number
}

interface MessageBubbleProps {
  message: Message
  isChatActive?: boolean
  viewportRef?: RefObject<HTMLElement | null>
}

export function MessageBubble({ message, isChatActive, viewportRef }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const bubbleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isChatActive) return
    if (!message.isSent) return
    if (message.status !== "delivered") return
    if (hasBeenVisible) return

    const el = bubbleRef.current
    if (!el) return

    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting) {
          setHasBeenVisible(true)
          observer.disconnect()
        }
      },
      {
        root: viewportRef?.current ?? null,
        threshold: 0.6,
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasBeenVisible, isChatActive, message.isSent, message.status, viewportRef])

  const getStatusIcon = () => {
    if (message.status === "sent") return <Check className="w-3 h-3" />
    if (message.status === "delivered")
      return (
        <CheckCheck
          className={cn(
            "w-3 h-3",
            isChatActive && (hasBeenVisible || typeof IntersectionObserver === "undefined") && "text-emerald-400",
          )}
        />
      )
    return <CheckCheck className="w-3 h-3 text-emerald-400" />
  }

  const handlePlayVoice = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsPlaying(false)
            return 0
          }
          return prev + 2
        })
      }, 100)
    }
  }

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "flex mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        message.isSent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          message.isSent ? "bg-emerald-600 text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {/* Text Message */}
        {message.type === "text" && <p className="text-sm leading-relaxed">{message.content}</p>}

        {/* Image Message */}
        {message.type === "image" && message.images && (
          <div className="grid grid-cols-2 gap-1 mb-1">
            {message.images.map((img, idx) => (
              <img
                key={idx}
                src={img || "/placeholder.svg"}
                alt={`Image ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Voice Message */}
        {message.type === "voice" && (
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={handlePlayVoice}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.isSent ? "bg-white/20" : "bg-emerald-500/20",
              )}
            >
              {isPlaying ? (
                <Pause className={cn("w-4 h-4", message.isSent ? "text-white" : "text-emerald-500")} />
              ) : (
                <Play className={cn("w-4 h-4", message.isSent ? "text-white" : "text-emerald-500")} />
              )}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-100", message.isSent ? "bg-white" : "bg-emerald-500")}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={cn("text-xs mt-1 block", message.isSent ? "text-white/70" : "text-muted-foreground")}>
                {message.voiceDuration ? `0:${message.voiceDuration.toString().padStart(2, "0")}` : "0:00"}
              </span>
            </div>
          </div>
        )}

        {/* Timestamp and Status */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            message.isSent ? "text-white/70" : "text-muted-foreground",
          )}
        >
          <span className="text-[10px]">{message.timestamp}</span>
          {message.isSent && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}
