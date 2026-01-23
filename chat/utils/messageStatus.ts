import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Message } from "../types/messageBubble"

export function mapMessageStatus(status: Doc<"messages">["status"]): Message["status"] {
  if (status === "delivered") return "delivered"
  if (status === "read") return "read"
  return "sent"
}