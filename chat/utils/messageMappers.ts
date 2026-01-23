import type { Doc, Id } from "@/convex/_generated/dataModel"
import { mapMessageStatus } from "./messageStatus"
import { Message } from "../types/messageBubble"

export function messageToUiMessage(message: Doc<"messages">): Message {
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