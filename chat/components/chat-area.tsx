"use client";

import {
  Video,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  ArrowLeft,
} from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";
import { useChatArea } from "@/chat/hooks/useChatArea";
import { ChatAreaProps } from "../types/chatArea";

import { TemplateSelector } from "./template-selector";
import { useAction } from "convex/react";
//import { api } from "@/convex/_generated/api";
const api = require("@/convex/_generated/api").api;

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
  const {
    chatActive,
    inputValue,
    inputError,
    isSubmitting,
    messagesEndRef,
    messagesViewportRef,
    handleInputChange,
    handleKeyDown,
    handleSend,
    handleInputFocus,
    handleInputBlur,
  } = useChatArea({
    contactId: contact?.id,
    messages,
    onSendMessage,
    onUserChattingChange,
    isChatActive,
  });

  const sendWhatsAppMessage = useAction(api.chatActions.sendWhatsAppMessage);

  const handleSendTemplate = async (
    templateSid: string,
    variables: Record<string, string>,
    preview: string,
  ) => {
    if (!contact?.id) return;

    // Currently contact.id is the conversation ID in this context based on how useChatArea works
    // but let's double check types. ChatAreaProps says contact: ChatContact. 
    // ChatContact usually has an id which is the conversationId.

    try {
      await sendWhatsAppMessage({
        conversationId: contact.id as any, // ID mismatch potential, but consistent with hook usage
        content: preview,
        contentSid: templateSid,
        contentVariables: JSON.stringify(variables),
      });
    } catch (error) {
      console.error("Failed to send template", error);
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Send className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
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
          <MessageBubble
            key={message.id}
            message={message}
            isChatActive={chatActive}
            viewportRef={messagesViewportRef}
          />
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
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="flex-1 px-4 py-2 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border-none outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />

          <TemplateSelector
            conversationId={contact.id as any}
            onSelect={handleSendTemplate}
            disabled={isSubmitting}
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
  );
}
