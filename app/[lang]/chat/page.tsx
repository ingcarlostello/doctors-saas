"use client";

import { ChatList } from "@/chat/components/chat-list";
import { ChatArea } from "@/chat/components/chat-area";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useChat } from "@/hooks/chat/useChat";

export default function ChatPage() {
    const {
        currentMessages,
        handleBack,
        handleNewChat,
        handleSelectChat,
        handleSendMessage,
        connectionStatus,
        isChatActive,
        isConnectionOnline,
        isMobileView,
        searchQuery,
        selectedChat,
        selectedConversationId,
        setIsUserChatting,
        setSearchQuery,
        uiChats,
    } = useChat();

    return (
        <DashboardLayout>
            {isMobileView ? (
                selectedConversationId ? (
                    <div className="h-[calc(100vh-4rem)] flex flex-col dark">
                        <ChatArea
                            contact={selectedChat ? { ...selectedChat } : null}
                            messages={currentMessages}
                            onSendMessage={handleSendMessage}
                            isTyping={connectionStatus === "connecting" && isConnectionOnline}
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
                        isTyping={connectionStatus === "connecting" && isConnectionOnline}
                        onUserChattingChange={setIsUserChatting}
                        isChatActive={isChatActive}
                    />
                </div>
            )}
        </DashboardLayout>
    );
}
