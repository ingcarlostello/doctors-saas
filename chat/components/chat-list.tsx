"use client";

import { Search, Plus, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chat, ChatListProps } from "../types/chatList";

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
  onNewChat,
}: ChatListProps) {
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusIcon = (status: Chat["messageStatus"]) => {
    if (status === "sent") return <Check className="w-3 h-3 text-muted-foreground" />;
    if (status === "delivered") return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    return <CheckCheck className="w-3 h-3 text-emerald-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Chats</h1>
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-500 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border-none outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
              selectedChatId === chat.id && "bg-muted",
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={chat.avatar || "/user-default.jpg"}
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {chat.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground truncate">
                  {chat.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {chat.timestamp}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  {getStatusIcon(chat.messageStatus)}
                  <span className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </span>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="shrink-0 ml-2 px-2 py-0.5 text-xs font-medium text-white bg-emerald-500 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
