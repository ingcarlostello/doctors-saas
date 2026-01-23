import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type { Message } from "@/chat/components/message-bubble";

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

export interface ChatAreaProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  onUserChattingChange?: (isChatting: boolean) => void;
  isChatActive?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export interface UseChatAreaResult {
  chatActive: boolean;
  inputValue: string;
  inputError: string | null;
  isSubmitting: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messagesViewportRef: RefObject<HTMLDivElement | null>;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleSend: () => Promise<void>;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
}

export interface UseChatAreaParams {
  contactId?: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onUserChattingChange?: (isChatting: boolean) => void;
  isChatActive?: boolean;
}
