"use client";
import { useState, useEffect } from "react";
import { Message } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { MessageContent } from "./MessageContent";
import { formatMessageTime } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";

interface MessageItemProps {
  message: Message;
  isGrouped?: boolean;
  showAvatar?: boolean;
}

export function MessageItem({
  message,
  isGrouped,
  showAvatar = true,
}: MessageItemProps) {
  const isAI = message.isAIResponse;
  const time = formatMessageTime(message.createdAt);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      try {
        if (typeof window !== "undefined" && window.speechSynthesis)
          window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  function handleToggleTTS() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = message.content || "";
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    try {
      u.lang = "en-US";
    } catch {}
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  return (
    <div
      className={`
        animate-fade-in-up group flex gap-2.5 cursor-default
        transition-colors duration-100 rounded-sm
        ${isGrouped ? "py-0.5 px-5" : "py-1.5 px-5"}
        ${
          isAI
            ? "bg-[color-mix(in_srgb,var(--ai,#5b9cf6)_4%,transparent)] border-l-2 border-[color-mix(in_srgb,var(--ai,#5b9cf6)_20%,transparent)] -ml-0.5 pl-4.5"
            : "hover:bg-[rgba(255,255,255,0.02)] border-l-2 border-transparent -ml-0.5 pl-4.5"
        }
      `}
    >
      <div className="w-8 shrink-0 mt-0.5">
        {!isGrouped &&
          showAvatar &&
          (isAI ? (
            <div
              className="
              w-8 h-8 rounded-full flex items-center justify-center shrink-0
              bg-[color-mix(in_srgb,var(--ai,#5b9cf6)_12%,transparent)]
              border border-[color-mix(in_srgb,var(--ai,#5b9cf6)_25%,transparent)]
            "
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.5L10.5 6.5H15L11.5 9.5L12.5 14L8 11.5L3.5 14L4.5 9.5L1 6.5H5.5L8 1.5Z"
                  fill="var(--ai, #5b9cf6)"
                  opacity="0.9"
                />
              </svg>
            </div>
          ) : (
            <Avatar
              name={message.senderName}
              photoURL={message.senderAvatar}
              size={32}
            />
          ))}
      </div>

      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            {isAI ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="
                  text-[13px] font-semibold text-(--ai,#5b9cf6)
                "
                >
                  Nexus
                </span>
                <span
                  className="
                  text-[9px] font-bold tracking-[0.06em] uppercase
                  text-(--ai,#5b9cf6)
                  bg-[color-mix(in_srgb,var(--ai,#5b9cf6)_12%,transparent)]
                  border border-[color-mix(in_srgb,var(--ai,#5b9cf6)_20%,transparent)]
                  px-1.25 py-px rounded-[3px]
                "
                >
                  AI
                </span>
              </div>
            ) : (
              <span
                className="
                text-[13px] font-semibold text-(--text)
              "
              >
                {message.senderName}
              </span>
            )}

            <span className="text-[10.5px] text-(--text3) font-(--ff-mono,monospace) flex items-center gap-1.5">
              {time}

              {isAI && message.content && !message.isStreaming && (
                <button
                  onClick={handleToggleTTS}
                  aria-label={speaking ? "Stop" : "Read aloud"}
                  className={`
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    flex items-center justify-center w-5 h-5 rounded
                    ${
                      speaking
                        ? "bg-(--surface2) text-(--ai,#5b9cf6)"
                        : "text-(--text3) hover:bg-(--surface) hover:text-(--text)"
                    }
                  `}
                >
                  {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
              )}

              {message.streamFailed && (
                <span className="text-(--danger,#ef4444) font-sans">
                  ⚠ Failed
                </span>
              )}
            </span>
          </div>
        )}

        <MessageContent
          content={message.content}
          isStreaming={message.isStreaming}
        />

        {message.audioUrl && (
          <div
            className="
            mt-2 flex items-center gap-2.5
            px-3 py-2 rounded-lg
            bg-(--surface) border border-(--border2)
          "
          >
            <span className="text-sm shrink-0">🎤</span>
            <audio
              src={message.audioUrl}
              controls
              className="h-7 flex-1 min-w-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
