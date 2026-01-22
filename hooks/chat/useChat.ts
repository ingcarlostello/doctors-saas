import { Id } from "@/convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStoreUserEffect } from "../useStoreUserEffect";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatRelativeTime } from "@/chat/utils/time";
import { UiChat } from "@/chat/types/chat";
import { messageToUiMessage } from "@/chat/utils/messageMappers";
import { useChatNotifications } from "./useChatNotifications";
import { useChatMessages } from "./useChatMessages";
import { useChatParticipants } from "./useChatParticipants";
import { useChatConnection } from "./useChatConnection";

type ChatParticipant = {
  id: string;
  name: string;
  phoneNumber: string;
};

export function useChat() {
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get("id");

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(
      initialChatId ? (initialChatId as Id<"conversations">) : null,
    );
  const [isUserChatting, setIsUserChatting] = useState(false);
  const [isChatInterfaceActive, setIsChatInterfaceActive] = useState(true);

  useEffect(() => {
    if (initialChatId)
      setSelectedConversationId(initialChatId as Id<"conversations">);
  }, [initialChatId]);

  const { isAuthenticated } = useStoreUserEffect();
  const conversations = useQuery(
    api.chat.listConversations,
    isAuthenticated ? {} : "skip",
  );
  const messages = useQuery(
    api.chat.getMessages,
    selectedConversationId && isAuthenticated
      ? { conversationId: selectedConversationId }
      : "skip",
  );

  const markConversationRead = useMutation(api.chat.markConversationRead);
  const sendMessage = useMutation(api.chat.sendMessage);
  const sendWhatsAppMessage = useAction(api.chatActions.sendWhatsAppMessage);

  const { status: connectionStatus, isOnline: isConnectionOnline } =
    useChatConnection();

  const lastAutoMarkReadRef = useRef<string | null>(null);
  const markReadInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const update = () => {
      setIsChatInterfaceActive(!document.hidden && document.hasFocus());
    };
    update();
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const isChatActive = Boolean(selectedConversationId) && isChatInterfaceActive;

  const notificationItems = useMemo(
    () =>
      (conversations ?? []).map((conversation) => ({
        id: conversation._id,
        unreadCount: conversation.unreadCount,
        lastMessageAt: conversation.lastMessageAt,
      })),
    [conversations],
  );

  useChatNotifications({
    items: notificationItems,
    activeItemId: selectedConversationId,
    isEnabled: isAuthenticated && isConnectionOnline,
    isUserChatting,
  });

  const uiChats: UiChat[] = useMemo(() => {
    const list = conversations ?? [];
    return list.map((c) => {
      const name =
        c.externalContact.name?.trim() || c.externalContact.phoneNumber;
      const lastMessage = c.lastMessagePreview ?? "";
      const timestamp = formatRelativeTime(c.lastMessageAt);
      const unreadCount = c.unreadCount ?? 0;
      const isSelectedAndActive =
        isChatActive && selectedConversationId === c._id;
      const effectiveUnreadCount = isSelectedAndActive ? 0 : unreadCount;
      const effectiveStatus: UiChat["messageStatus"] = isSelectedAndActive
        ? "read"
        : unreadCount > 0
          ? "delivered"
          : "read";
      return {
        id: c._id,
        name,
        avatar: "/user-default.jpg",
        lastMessage,
        timestamp,
        unreadCount: effectiveUnreadCount,
        isOnline: false,
        messageStatus: effectiveStatus,
      };
    });
  }, [conversations, isChatActive, selectedConversationId]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return (
      (conversations ?? []).find((c) => c._id === selectedConversationId) ??
      null
    );
  }, [conversations, selectedConversationId]);

  const mappedMessages = useMemo(
    () => (messages ?? []).map(messageToUiMessage),
    [messages],
  );
  const {
    messages: currentMessages,
    setMessages: setCurrentMessages,
  } = useChatMessages({ initialMessages: mappedMessages });

  useEffect(() => {
    setCurrentMessages(mappedMessages);
  }, [mappedMessages, setCurrentMessages]);

  const { participants, setParticipants } = useChatParticipants<
    ChatParticipant
  >();
  const selectedParticipants = useMemo(() => {
    if (!selectedConversation) return [];
    const name =
      selectedConversation.externalContact.name?.trim() ||
      selectedConversation.externalContact.phoneNumber;
    return [
      {
        id: selectedConversation.externalContact.phoneNumber,
        name,
        phoneNumber: selectedConversation.externalContact.phoneNumber,
      },
    ];
  }, [selectedConversation]);

  useEffect(() => {
    setParticipants(selectedParticipants);
  }, [selectedParticipants, setParticipants]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!selectedConversationId) return;
    if (!isChatActive) return;
    const unreadCount = selectedConversation?.unreadCount ?? 0;
    if (unreadCount <= 0) return;
    if (markReadInFlightRef.current === selectedConversationId) return;

    const key = `${selectedConversationId}:${unreadCount}`;
    if (lastAutoMarkReadRef.current === key) return;
    lastAutoMarkReadRef.current = key;

    markReadInFlightRef.current = selectedConversationId;
    void markConversationRead({
      conversationId: selectedConversationId,
    }).finally(() => {
      if (markReadInFlightRef.current === selectedConversationId)
        markReadInFlightRef.current = null;
    });
  }, [
    isAuthenticated,
    isChatActive,
    markConversationRead,
    selectedConversation?.unreadCount,
    selectedConversationId,
  ]);

  const handleSelectChat = async (id: string) => {
    const conversationId = id as Id<"conversations">;
    setSelectedConversationId(conversationId);
    setIsUserChatting(false);
    if (markReadInFlightRef.current === conversationId) return;
    markReadInFlightRef.current = conversationId;
    try {
      await markConversationRead({ conversationId });
    } finally {
      if (markReadInFlightRef.current === conversationId)
        markReadInFlightRef.current = null;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    if (selectedConversation?.channel === "whatsapp") {
      await sendWhatsAppMessage({
        conversationId: selectedConversationId,
        content,
      });
      return;
    }
    await sendMessage({ conversationId: selectedConversationId, content });
  };

  const handleNewChat = () => {
    const first = (conversations ?? [])[0]?._id ?? null;
    if (first) setSelectedConversationId(first);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    setIsUserChatting(false);
  };

  const selectedChat: UiChat | null = selectedConversation
    ? {
        id: selectedConversation._id,
        name:
          selectedConversation.externalContact.name?.trim() ||
          selectedConversation.externalContact.phoneNumber,
        avatar: "/user-default.jpg",
        lastMessage: selectedConversation.lastMessagePreview ?? "",
        timestamp: formatRelativeTime(selectedConversation.lastMessageAt),
        unreadCount: isChatActive ? 0 : (selectedConversation.unreadCount ?? 0),
        isOnline: false,
        messageStatus: isChatActive
          ? "read"
          : (selectedConversation.unreadCount ?? 0) > 0
            ? "delivered"
            : "read",
      }
    : null;

  return {
    currentMessages,
    handleBack,
    handleNewChat,
    handleSelectChat,
    handleSendMessage,
    connectionStatus,
    isChatActive,
    isConnectionOnline,
    isMobileView,
    participants,
    searchQuery,
    selectedChat,
    selectedConversationId,
    setIsUserChatting,
    setSearchQuery,
    uiChats,
  };
}
