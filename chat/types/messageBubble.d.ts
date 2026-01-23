export interface UseMessageBubbleProps {
  message: Message;
  isChatActive?: boolean;
  viewportRef?: RefObject<HTMLElement | null>;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSent: boolean;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "voice";
  images?: string[];
  voiceDuration?: number;
}

interface MessageBubbleProps {
  message: Message;
  isChatActive?: boolean;
  viewportRef?: RefObject<HTMLElement | null>;
}
