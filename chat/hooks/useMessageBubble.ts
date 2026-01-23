import { useState, useEffect, useRef, createElement } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseMessageBubbleProps } from "../types/messageBubble";

export function useMessageBubble({
  message,
  isChatActive,
  viewportRef,
}: UseMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isChatActive) return;
    if (!message.isSent) return;
    if (message.status !== "delivered") return;
    if (hasBeenVisible) return;

    const el = bubbleRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      {
        root: viewportRef?.current ?? null,
        threshold: 0.6,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [
    hasBeenVisible,
    isChatActive,
    message.isSent,
    message.status,
    viewportRef,
  ]);

  const getStatusIcon = () => {
    if (message.status === "sent")
      return createElement(Check, { className: "w-3 h-3" });
    if (message.status === "delivered")
      return createElement(CheckCheck, {
        className: cn(
          "w-3 h-3",
          isChatActive &&
            (hasBeenVisible || typeof IntersectionObserver === "undefined") &&
            "text-emerald-400",
        ),
      });
    return createElement(CheckCheck, { className: "w-3 h-3 text-emerald-400" });
  };

  const handlePlayVoice = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
  };

  return {
    isPlaying,
    progress,
    bubbleRef,
    getStatusIcon,
    handlePlayVoice,
  };
}
