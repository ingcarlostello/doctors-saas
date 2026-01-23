import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import { useChatInput } from "@/hooks/chat/useChatInput";
import { UseChatAreaParams, UseChatAreaResult } from "../types/chatArea";

export function useChatArea({
  contactId,
  messages,
  onSendMessage,
  onUserChattingChange,
  isChatActive,
}: UseChatAreaParams): UseChatAreaResult {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const chatActive = Boolean(isChatActive);
  const {
    value: inputValue,
    error: inputError,
    handleChange,
    reset,
    submit,
    setValue,
    isSubmitting,
  } = useChatInput({
    required: true,
    maxLength: 500,
    onSubmit: async (content) => {
      if (!contactId) return;
      onSendMessage(content);
      setDrafts((prev) => {
        const { [contactId]: _, ...rest } = prev;
        return rest;
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current !== null)
        window.clearTimeout(idleTimerRef.current);
      onUserChattingChange?.(false);
    };
  }, [onUserChattingChange]);

  useEffect(() => {
    if (!contactId) onUserChattingChange?.(false);
  }, [contactId, onUserChattingChange]);

  useEffect(() => {
    if (!contactId) {
      setValue("");
      return;
    }
    setValue(drafts[contactId] ?? "");
  }, [contactId, drafts, setValue]);

  const handleInputFocus = useCallback(() => {
    onUserChattingChange?.(true);
    if (idleTimerRef.current !== null)
      window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      onUserChattingChange?.(false);
    }, 2500);
  }, [onUserChattingChange]);

  const handleInputBlur = useCallback(() => {
    if (idleTimerRef.current !== null)
      window.clearTimeout(idleTimerRef.current);
    onUserChattingChange?.(false);
  }, [onUserChattingChange]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!contactId) return;
      handleInputFocus();
      const value = event.target.value;
      handleChange(event);
      setDrafts((prev) => {
        if (value === "") {
          const { [contactId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [contactId]: value };
      });
    },
    [contactId, handleChange, handleInputFocus],
  );

  const handleSend = useCallback(async () => {
    if (!contactId) return;
    const success = await submit();
    if (success) {
      reset();
    }
  }, [contactId, reset, submit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      handleInputFocus();
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleInputFocus, handleSend],
  );

  return {
    chatActive,
    handleInputBlur,
    handleInputChange,
    handleInputFocus,
    handleKeyDown,
    handleSend,
    inputError,
    inputValue,
    isSubmitting,
    messagesEndRef,
    messagesViewportRef,
  };
}
