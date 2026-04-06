"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Message, TypingUser } from "@/lib/types";
import { MessageItem } from "./MessageItem";
import { formatDateDivider, isSameDay } from "@/lib/utils";
import { loadMoreMessages } from "@/lib/firestore";

interface MessageListProps {
  messages: Message[];
  typingUsers: TypingUser[];
  roomId: string;
  currentUserId: string;
  jumpToMessageId?: string | null;
  onJumpHandled?: () => void;
}

export function MessageList({
  messages,
  typingUsers,
  roomId,
  jumpToMessageId,
  onJumpHandled,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const isNearBottom = useRef(true);

  const allMessages = [...olderMessages, ...messages];

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!jumpToMessageId) return;

    const el = document.getElementById(`msg-${jumpToMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(jumpToMessageId);

      const t = setTimeout(() => {
        setHighlightedId(null);
        onJumpHandled?.();
      }, 2200);
      return () => clearTimeout(t);
    }
    onJumpHandled?.();
  }, [jumpToMessageId]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = fromBottom < 100;
    if (el.scrollTop < 80 && !loadingMore && hasMore) loadMore();
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || allMessages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = allMessages[0];
      const older = await loadMoreMessages(roomId, oldest.createdAt);
      if (older.length === 0) setHasMore(false);
      else setOlderMessages((prev) => [...older, ...prev]);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, allMessages, roomId]);

  function isGrouped(msg: Message, prev: Message | undefined): boolean {
    if (!prev) return false;
    if (msg.senderId !== prev.senderId) return false;
    if (msg.isAIResponse !== prev.isAIResponse) return false;
    return msg.createdAt.getTime() - prev.createdAt.getTime() < 5 * 60 * 1000;
  }

  return (
    <>
      <style>{`
        @keyframes nx-msg-highlight {
          0%   { background: color-mix(in srgb, var(--accent) 18%, transparent); }
          60%  { background: color-mix(in srgb, var(--accent) 10%, transparent); }
          100% { background: transparent; }
        }
        .nx-msg-highlighted {
          animation: nx-msg-highlight 2.2s ease forwards;
          border-radius: 6px;
        }
      `}</style>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="
          flex-1 overflow-y-auto flex flex-col pt-4 pb-4
          [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
          [&::-webkit-scrollbar]:w-0.75
          [&::-webkit-scrollbar-thumb]:bg-(--border)
          [&::-webkit-scrollbar-thumb]:rounded-full
        "
      >
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="spinner" />
          </div>
        )}

        {!hasMore && allMessages.length > 0 && (
          <div className="flex flex-col items-center gap-1 px-6 py-8">
            <div className="w-9 h-9 rounded-full bg-(--surface2) flex items-center justify-center text-base mb-1">
              💬
            </div>
            <p className="text-[11.5px] font-semibold text-(--text3)">
              Beginning of conversation
            </p>
          </div>
        )}

        {allMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center text-2xl bg-(--surface) border border-(--border)">
              💬
            </div>
            <p className="text-[13.5px] font-semibold text-(--text2) mb-1">
              No messages yet
            </p>
            <p className="text-[12px] text-(--text3) leading-relaxed max-w-55">
              Be the first to say something! Use{" "}
              <code className="ai-mention text-[11px]">@ai</code> to invoke the
              assistant.
            </p>
          </div>
        )}

        {allMessages.map((msg, i) => {
          const prev = allMessages[i - 1];
          const showDateDivider =
            !prev || !isSameDay(msg.createdAt, prev.createdAt);
          const grouped = isGrouped(msg, prev);
          const isHighlighted = highlightedId === msg.id;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={isHighlighted ? "nx-msg-highlighted" : ""}
            >
              {showDateDivider && (
                <div className="flex items-center gap-3 px-6 py-4 my-2">
                  <div className="flex-1 h-px bg-(--border)" />
                  <span className="text-[10.5px] font-medium text-(--text3) whitespace-nowrap px-2 py-0.5 rounded-full border border-(--border) bg-(--surface)">
                    {formatDateDivider(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-(--border)" />
                </div>
              )}
              <MessageItem message={msg} isGrouped={grouped} />
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2.5 px-6 py-4 animate-fade-in bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] border-l-2 border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
            <div className="w-8 flex justify-center flex-shrink-0">
              <div className="flex gap-0.75 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
            <span className="text-[11.5px]">
              <span className="font-medium text-(--text)">
                {typingUsers.map((u) => u.displayName).join(", ")}
              </span>
              <span className="text-(--text3)">
                {typingUsers.length === 1 ? " is typing…" : " are typing…"}
              </span>
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
}
